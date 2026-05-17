/**
 * ContractsTab — contracts list for farmer role (FR-F04, FR-T09)
 * Revamped to use StatusTabbedList pattern mirroring FarmerFlowPanel.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { StatusTabbedList } from '@/screens/trader/transactions/components/StatusTabbedList';
import { ContractDetailModal } from '@/screens/trader/transactions/components/ContractDetailModal';
import { EmptyState } from '@/design-system/components/EmptyState/EmptyState';
import {
  listContracts,
  contractStatusLabelVi,
  contractTypeLabelVi,
  toContractViMessage,
  type ContractDto,
} from '@/services/contractService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { partyTraderDisplay } from '@/utils/displayLabels';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { ContractDiffModal } from './ContractDiffModal';

// ── Constants ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'waiting', label: 'Chờ ký' },
  { id: 'signed', label: 'Đã ký' },
  { id: 'history', label: 'Lịch sử' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

const SkeletonList: React.FC = () => (
  <div>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          height: 80,
          backgroundColor: colors.background.secondary,
          borderRadius: 8,
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
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: spacing.md,
        padding: spacing.md,
        cursor: 'pointer',
        minHeight: 44,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: 1 }}>
          <Text
            size="xSmall"
            style={{
              color: colors.text.secondary,
              display: 'block',
              fontSize: fontSize.caption,
            }}
          >
            {contractTypeLabelVi(contract.contractType)}
          </Text>
          <Text.Title size="small" style={{ margin: `${spacing.xs} 0` }}>
            {contract.partyTraderId ? partyTraderDisplay(contract) : '—'}
          </Text.Title>
          <Text
            size="xSmall"
            style={{ color: colors.text.secondary, fontSize: fontSize.caption }}
          >
            {new Date(contract.startDate).toLocaleDateString('vi-VN')} —{' '}
            {new Date(contract.endDate).toLocaleDateString('vi-VN')}
          </Text>
        </div>
        <span
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: `${statusColor}18`,
            color: statusColor,
            borderRadius: 6,
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

// ── Main Component ─────────────────────────────────────────────────────────────

export const ContractsTab: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();

  const [activeTab, setActiveTab] = useState('waiting');

  const [waitingContracts, setWaitingContracts] = useState<ContractDto[]>([]);
  const [signedContracts, setSignedContracts] = useState<ContractDto[]>([]);
  const [historyContracts, setHistoryContracts] = useState<ContractDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [selectedContract, setSelectedContract] = useState<ContractDto | null>(null);
  const [diffModal, setDiffModal] = useState<{
    open: boolean;
    contract?: ContractDto;
  }>({ open: false });

  const loadContracts = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const [waitRes, pendChangeRes, activeRes, completedRes, cancelledRes] =
        await Promise.all([
          listContracts({ role: 'farmer', status: 'pending_signature', limit: 50 }),
          listContracts({ role: 'farmer', status: 'pending_change', limit: 50 }),
          listContracts({ role: 'farmer', status: 'active', limit: 50 }),
          listContracts({ role: 'farmer', status: 'completed', limit: 30 }),
          listContracts({ role: 'farmer', status: 'cancelled', limit: 30 }),
        ]);
      setWaitingContracts([...waitRes.items, ...pendChangeRes.items]);
      setSignedContracts(activeRes.items);
      setHistoryContracts([...completedRes.items, ...cancelledRes.items]);
      setLoaded(true);
    } catch (err) {
      openSnackbar({
        type: 'error',
        text: toContractViMessage(err, 'list'),
        duration: 3500,
        icon: true,
      });
    } finally {
      setLoading(false);
    }
  }, [loaded, openSnackbar]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  // After signing: move from waiting → signed if active, else update in place
  const handleSigned = (updated: ContractDto) => {
    setSelectedContract(updated);
    if (updated.status === 'active') {
      setWaitingContracts((prev) => prev.filter((c) => c.id !== updated.id));
      setSignedContracts((prev) => [updated, ...prev.filter((c) => c.id !== updated.id)]);
    } else {
      setWaitingContracts((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      );
    }
  };

  // After rejecting: remove from waiting, add to history
  const handleRejected = (updated: ContractDto) => {
    setSelectedContract(null);
    setWaitingContracts((prev) => prev.filter((c) => c.id !== updated.id));
    setHistoryContracts((prev) => [updated, ...prev.filter((c) => c.id !== updated.id)]);
  };

  const handleCardTap = (contract: ContractDto) => {
    if (contract.status === 'pending_change') {
      setDiffModal({ open: true, contract });
    } else {
      setSelectedContract(contract);
    }
  };

  const renderContractList = (
    contracts: ContractDto[],
    emptyTitle: string,
    emptyDesc: string,
  ) => {
    if (loading) return <SkeletonList />;
    if (contracts.length === 0) {
      return <EmptyState icon="📄" title={emptyTitle} description={emptyDesc} />;
    }
    return (
      <div>
        {contracts.map((c) => (
          <ContractInfoCard key={c.id} contract={c} onTap={() => handleCardTap(c)} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Header — no "Thêm hợp đồng" button (farmer cannot create contracts) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: `${spacing.sm} ${spacing.md}`,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
        }}
      >
        <Text
          size="xSmall"
          style={{ color: colors.text.secondary, fontSize: fontSize.caption }}
        >
          Hợp đồng với thương lái
        </Text>
      </div>

      <StatusTabbedList tabs={TABS} activeId={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'waiting' &&
          renderContractList(
            waitingContracts,
            'Chưa có hợp đồng chờ ký',
            'Hợp đồng cần ký với thương lái sẽ hiển thị tại đây',
          )}
        {activeTab === 'signed' &&
          renderContractList(
            signedContracts,
            'Chưa có hợp đồng đã ký',
            'Hợp đồng bao tiêu đã ký với thương lái sẽ hiển thị tại đây',
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
          onSigned={handleSigned}
          onRejected={handleRejected}
        />
      )}

      {/* Diff modal for pending_change */}
      {diffModal.open && diffModal.contract && (
        <ContractDiffModal
          open={diffModal.open}
          onClose={() => setDiffModal({ open: false })}
          contract={diffModal.contract}
        />
      )}
    </>
  );
};

export default ContractsTab;
