/**
 * FarmerFlowPanel — "Với Nông dân" flow (contract-centric)
 * Tabs: Chờ ký (pending_signature) | Đã ký (active / pending_change) | Lịch sử (completed / cancelled)
 * Requirements: FR-T08, FR-T09, US-T03
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { StatusTabbedList } from '../components/StatusTabbedList';
import { ContractDetailModal } from '../components/ContractDetailModal';
import { CreateFarmerContractModal } from '../components/CreateFarmerContractModal';
import { SelectConnectionModal, type SelectedConnectionInfo } from '../components/SelectConnectionModal';
import { EmptyState } from '@/design-system/components/EmptyState/EmptyState';
import {
  listContracts,
  contractStatusLabelVi,
  contractTypeLabelVi,
  toContractViMessage,
  type ContractDto,
} from '@/services/contractService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { partyFarmerDisplay } from '@/utils/displayLabels';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

const TABS = [
  { id: 'waiting', label: 'Chờ ký' },
  { id: 'signed', label: 'Đã ký' },
  { id: 'history', label: 'Lịch sử' },
];

function initialTab(initialStatus?: string): string {
  if (initialStatus === 'waiting') return 'waiting';
  if (initialStatus === 'signed') return 'signed';
  if (initialStatus === 'history') return 'history';
  return 'waiting';
}

interface Props {
  initialStatus?: string;
}

export const FarmerFlowPanel: React.FC<Props> = ({ initialStatus }) => {
  const openSnackbar = useStableOpenSnackbar();
  const [activeTab, setActiveTab] = useState(() => initialTab(initialStatus));

  const [waitingContracts, setWaitingContracts] = useState<ContractDto[]>([]);
  const [signedContracts, setSignedContracts] = useState<ContractDto[]>([]);
  const [historyContracts, setHistoryContracts] = useState<ContractDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractDto | null>(null);

  // Flow: Select connection → Create contract
  const [showSelectConnection, setShowSelectConnection] = useState(false);
  const [contractTarget, setContractTarget] = useState<SelectedConnectionInfo | null>(null);

  const loadContracts = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const [waitRes, activeRes, pendChangeRes, completedRes, cancelledRes] = await Promise.all([
        listContracts({ role: 'trader', status: 'pending_signature', limit: 50 }),
        listContracts({ role: 'trader', status: 'active', limit: 50 }),
        listContracts({ role: 'trader', status: 'pending_change', limit: 50 }),
        listContracts({ role: 'trader', status: 'completed', limit: 30 }),
        listContracts({ role: 'trader', status: 'cancelled', limit: 30 }),
      ]);
      const isFarmer = (c: ContractDto) => !!c.partyFarmerId;
      setWaitingContracts(waitRes.items.filter(isFarmer));
      setSignedContracts([
        ...activeRes.items.filter(isFarmer),
        ...pendChangeRes.items.filter(isFarmer),
      ]);
      setHistoryContracts([
        ...completedRes.items.filter(isFarmer),
        ...cancelledRes.items.filter(isFarmer),
      ]);
      setLoaded(true);
    } catch (err) {
      openSnackbar({ type: 'error', text: toContractViMessage(err, 'list'), duration: 3500, icon: true });
    } finally {
      setLoading(false);
    }
  }, [loaded, openSnackbar]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  const handleConnectionSelected = (info: SelectedConnectionInfo) => {
    setShowSelectConnection(false);
    setContractTarget(info);
  };

  const handleContractCreated = (contract: ContractDto) => {
    setContractTarget(null);
    setWaitingContracts((prev) => [contract, ...prev]);
    setActiveTab('waiting');
    openSnackbar({ type: 'success', text: 'Hợp đồng đã tạo — đang ở tab Chờ ký.', duration: 3000, icon: true });
  };

  const renderContractList = (contracts: ContractDto[], emptyTitle: string, emptyDesc: string) => {
    if (loading) return <SkeletonList />;
    if (contracts.length === 0) {
      return <EmptyState icon="📄" title={emptyTitle} description={emptyDesc} />;
    }
    return (
      <div>
        {contracts.map((c) => (
          <ContractInfoCard key={c.id} contract={c} onTap={() => setSelectedContract(c)} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Header row with add button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing.sm} ${spacing.md}`,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
        }}
      >
        <Text
          size="xSmall"
          style={{ color: colors.text.secondary, fontSize: fontSize.caption }}
        >
          Hợp đồng với nông dân
        </Text>
        <button
          type="button"
          onClick={() => setShowSelectConnection(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: `${spacing.xs} ${spacing.md}`,
            backgroundColor: colors.primary.agriGreen,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            cursor: 'pointer',
            minHeight: 36,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          Thêm hợp đồng
        </button>
      </div>

      <StatusTabbedList tabs={TABS} activeId={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'waiting' &&
          renderContractList(
            waitingContracts,
            'Chưa có hợp đồng chờ ký',
            'Hợp đồng cần ký với nông dân sẽ hiển thị tại đây',
          )}
        {activeTab === 'signed' &&
          renderContractList(
            signedContracts,
            'Chưa có hợp đồng đã ký',
            'Hợp đồng bao tiêu đã ký với nông dân sẽ hiển thị tại đây',
          )}
        {activeTab === 'history' &&
          renderContractList(
            historyContracts,
            'Chưa có lịch sử',
            'Hợp đồng đã hoàn thành hoặc đã hủy sẽ hiển thị tại đây',
          )}
      </StatusTabbedList>

      {/* Contract detail modal */}
      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          visible
          onClose={() => setSelectedContract(null)}
          onSigned={(updated) => {
            setSelectedContract(updated);
            if (updated.status === 'active') {
              setWaitingContracts((prev) => prev.filter((c) => c.id !== updated.id));
              setSignedContracts((prev) => [updated, ...prev.filter((c) => c.id !== updated.id)]);
            } else {
              setWaitingContracts((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c)),
              );
            }
          }}
          onRejected={(updated) => {
            setSelectedContract(null);
            setWaitingContracts((prev) => prev.filter((c) => c.id !== updated.id));
            setHistoryContracts((prev) => [updated, ...prev.filter((c) => c.id !== updated.id)]);
          }}
        />
      )}

      {/* Step 1: Select connected farmer */}
      <SelectConnectionModal
        visible={showSelectConnection}
        onClose={() => setShowSelectConnection(false)}
        onSelected={handleConnectionSelected}
      />

      {/* Step 2: Create contract form */}
      {contractTarget && (
        <CreateFarmerContractModal
          visible
          farmerUserId={contractTarget.farmerUserId}
          farmerDisplayName={contractTarget.farmerDisplayName}
          farmerPhone={contractTarget.farmerPhone}
          farmId={contractTarget.farmId}
          farmName={contractTarget.farmName}
          onClose={() => setContractTarget(null)}
          onCreated={handleContractCreated}
        />
      )}
    </>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SkeletonList: React.FC = () => (
  <div>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          height: '80px',
          backgroundColor: colors.background.secondary,
          borderRadius: '8px',
          marginBottom: spacing.md,
        }}
      />
    ))}
  </div>
);

const ContractInfoCard: React.FC<{ contract: ContractDto; onTap: () => void }> = ({
  contract,
  onTap,
}) => {
  const statusColor =
    contract.status === 'active'
      ? colors.primary.agriGreen
      : contract.status === 'pending_signature'
      ? colors.primary.zaloBlue
      : contract.status === 'pending_change'
      ? colors.functional.warningYellow
      : colors.text.secondary;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => e.key === 'Enter' && onTap()}
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: spacing.md,
        padding: spacing.md,
        cursor: 'pointer',
        minHeight: '44px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Text size="xSmall" style={{ color: colors.text.secondary, display: 'block', fontSize: fontSize.caption }}>
            {contractTypeLabelVi(contract.contractType)}
          </Text>
          <Text.Title size="small" style={{ margin: `${spacing.xs} 0` }}>
            {contract.partyFarmerId ? partyFarmerDisplay(contract) : '—'}
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
            {new Date(contract.startDate).toLocaleDateString('vi-VN')} —{' '}
            {new Date(contract.endDate).toLocaleDateString('vi-VN')}
          </Text>
          {contract.standardName && (
            <Text size="xSmall" style={{ color: colors.primary.agriGreen, fontSize: fontSize.caption, marginTop: 2 }}>
              📋 {contract.standardName}
            </Text>
          )}
        </div>
        <span
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: `${statusColor}18`,
            color: statusColor,
            borderRadius: '6px',
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            whiteSpace: 'nowrap',
            marginLeft: spacing.sm,
          }}
        >
          {contractStatusLabelVi(contract.status)}
        </span>
      </div>
    </div>
  );
};
