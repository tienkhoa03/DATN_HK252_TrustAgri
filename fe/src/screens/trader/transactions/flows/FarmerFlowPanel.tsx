/**
 * FarmerFlowPanel — "Với Nông dân" flow
 * Tabs: Mới (pending connections) | Đàm phán (accepted connections + pending_change contracts) | Đã ký (active)
 * Requirements: FR-T08, FR-F03, US-T03
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { StatusTabbedList } from '../components/StatusTabbedList';
import { RequestCard } from '../components/RequestCard';
import { ContractDetailModal } from '../components/ContractDetailModal';
import { EmptyState } from '@/design-system/components/EmptyState/EmptyState';
import {
  listConnections,
  acceptConnection,
  rejectConnection,
  toConnectionViMessage,
  type ConnectionDto,
} from '@/services/connectionService';
import {
  listContracts,
  contractStatusLabelVi,
  contractTypeLabelVi,
  partyFarmerLabel,
  toContractViMessage,
  type ContractDto,
} from '@/services/contractService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

const TABS = [
  { id: 'new', label: 'Mới' },
  { id: 'negotiating', label: 'Đàm phán' },
  { id: 'signed', label: 'Đã ký' },
];

function initialTab(initialStatus?: string): string {
  if (initialStatus === 'pending') return 'new';
  if (initialStatus === 'negotiating') return 'negotiating';
  if (initialStatus === 'signed') return 'signed';
  return 'new';
}

function relativeDate(iso: string): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return '1 ngày trước';
  return `${diff} ngày trước`;
}

interface Props {
  initialStatus?: string;
}

export const FarmerFlowPanel: React.FC<Props> = ({ initialStatus }) => {
  const openSnackbar = useStableOpenSnackbar();
  const [activeTab, setActiveTab] = useState(() => initialTab(initialStatus));

  // --- "Mới" tab state ---
  const [connections, setConnections] = useState<ConnectionDto[]>([]);
  const [connLoading, setConnLoading] = useState(false);
  const [connLoaded, setConnLoaded] = useState(false);
  const [connPending, setConnPending] = useState<Record<string, boolean>>({});

  // --- "Đàm phán" + "Đã ký" tab state ---
  const [acceptedConnections, setAcceptedConnections] = useState<ConnectionDto[]>([]);
  const [negotiatingContracts, setNegotiatingContracts] = useState<ContractDto[]>([]);
  const [signedContracts, setSignedContracts] = useState<ContractDto[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsLoaded, setContractsLoaded] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractDto | null>(null);

  const loadConnections = useCallback(async () => {
    if (connLoaded) return;
    setConnLoading(true);
    try {
      const res = await listConnections({ role: 'incoming', status: 'pending' });
      setConnections(res.items);
      setConnLoaded(true);
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'list'), duration: 3500, icon: true });
    } finally {
      setConnLoading(false);
    }
  }, [connLoaded, openSnackbar]);

  const loadContracts = useCallback(async () => {
    if (contractsLoaded) return;
    setContractsLoading(true);
    try {
      const [negRes, signedRes, acceptedRes] = await Promise.all([
        listContracts({ role: 'trader', status: 'pending_change', limit: 50 }),
        listContracts({ role: 'trader', status: 'active', limit: 50 }),
        // Load kết nối đã accepted (cả hai chiều) chưa có contract → hiện ở "Đàm phán"
        listConnections({ status: 'accepted', limit: 50 }),
      ]);
      setNegotiatingContracts(negRes.items.filter((c) => !!c.partyFarmerId));
      setSignedContracts(signedRes.items.filter((c) => !!c.partyFarmerId));
      // Lọc chỉ kết nối trader ↔ farmer (bỏ qua trader ↔ buyer)
      setAcceptedConnections(
        acceptedRes.items.filter(
          (conn) =>
            (conn.fromRole === 'farmer' && conn.toRole === 'trader') ||
            (conn.fromRole === 'trader' && conn.toRole === 'farmer'),
        ),
      );
      setContractsLoaded(true);
    } catch (err) {
      openSnackbar({ type: 'error', text: toContractViMessage(err, 'list'), duration: 3500, icon: true });
    } finally {
      setContractsLoading(false);
    }
  }, [contractsLoaded, openSnackbar]);

  useEffect(() => {
    if (activeTab === 'new') void loadConnections();
    if (activeTab === 'negotiating' || activeTab === 'signed') void loadContracts();
  }, [activeTab, loadConnections, loadContracts]);

  const handleAccept = async (conn: ConnectionDto) => {
    setConnPending((p) => ({ ...p, [conn.id]: true }));
    try {
      await acceptConnection(conn.id);
      setConnections((prev) => prev.filter((c) => c.id !== conn.id));
      openSnackbar({ type: 'success', text: 'Đã chấp nhận yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setConnPending((p) => { const n = { ...p }; delete n[conn.id]; return n; });
    }
  };

  const handleReject = async (conn: ConnectionDto) => {
    setConnPending((p) => ({ ...p, [conn.id]: true }));
    try {
      await rejectConnection(conn.id);
      setConnections((prev) => prev.filter((c) => c.id !== conn.id));
      openSnackbar({ type: 'success', text: 'Đã từ chối yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setConnPending((p) => { const n = { ...p }; delete n[conn.id]; return n; });
    }
  };

  const renderNewTab = () => {
    if (connLoading) return <SkeletonList />;
    if (connections.length === 0) {
      return <EmptyState icon="🤝" title="Không có yêu cầu mới" description="Các yêu cầu kết nối từ nông dân sẽ hiện ở đây" />;
    }
    return (
      <div>
        {connections.map((conn) => (
          <RequestCard
            key={conn.id}
            title={`Nông dân (...${conn.fromUserId.slice(-4)})`}
            subtitle={conn.message}
            meta={relativeDate(conn.createdAt)}
            isLoading={!!connPending[conn.id]}
            onAccept={() => void handleAccept(conn)}
            onReject={() => void handleReject(conn)}
          />
        ))}
      </div>
    );
  };

  const renderNegotiatingTab = () => {
    if (contractsLoading) return <SkeletonList />;
    const hasContent = acceptedConnections.length > 0 || negotiatingContracts.length > 0;
    if (!hasContent) {
      return <EmptyState icon="🤝" title="Chưa có kết nối đang đàm phán" description="Kết nối đã được chấp nhận và hợp đồng đang thương lượng sẽ hiện ở đây" />;
    }
    return (
      <div>
        {acceptedConnections.map((conn) => (
          <ConnectionAcceptedCard key={conn.id} connection={conn} />
        ))}
        {negotiatingContracts.map((c) => (
          <ContractInfoCard key={c.id} contract={c} onTap={() => setSelectedContract(c)} />
        ))}
      </div>
    );
  };

  const renderSignedTab = () => {
    if (contractsLoading) return <SkeletonList />;
    if (signedContracts.length === 0) {
      return <EmptyState icon="📄" title="Chưa có hợp đồng đã ký" description="Hợp đồng bao tiêu đã ký với nông dân sẽ hiển thị tại đây" />;
    }
    return (
      <div>
        {signedContracts.map((c) => (
          <ContractInfoCard key={c.id} contract={c} onTap={() => setSelectedContract(c)} />
        ))}
      </div>
    );
  };

  return (
    <>
      <StatusTabbedList tabs={TABS} activeId={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'new' && renderNewTab()}
        {activeTab === 'negotiating' && renderNegotiatingTab()}
        {activeTab === 'signed' && renderSignedTab()}
      </StatusTabbedList>

      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          visible
          onClose={() => setSelectedContract(null)}
        />
      )}
    </>
  );
};

// ── Shared sub-components ──────────────────────────────────────────────────────

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

const ConnectionAcceptedCard: React.FC<{ connection: ConnectionDto }> = ({ connection }) => {
  const farmerUserId =
    connection.fromRole === 'farmer' ? connection.fromUserId : connection.toUserId;

  return (
    <div
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: spacing.md,
        padding: spacing.md,
        minHeight: '44px',
        borderLeft: `3px solid ${colors.primary.agriGreen}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Text size="xSmall" style={{ color: colors.text.secondary, display: 'block', fontSize: fontSize.caption }}>
            Kết nối nông dân
          </Text>
          <Text.Title size="small" style={{ margin: `${spacing.xs} 0` }}>
            Nông dân (...{farmerUserId.slice(-4)})
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
            Kết nối từ {relativeDate(connection.createdAt)}
          </Text>
        </div>
        <span
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: `${colors.primary.agriGreen}18`,
            color: colors.primary.agriGreen,
            borderRadius: '6px',
            fontSize: fontSize.caption,
            fontWeight: fontWeight.semibold,
            whiteSpace: 'nowrap',
            marginLeft: spacing.sm,
          }}
        >
          Đã kết nối
        </span>
      </div>
    </div>
  );
};

const ContractInfoCard: React.FC<{ contract: ContractDto; onTap: () => void }> = ({
  contract,
  onTap,
}) => {
  const statusColor =
    contract.status === 'active'
      ? colors.primary.agriGreen
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
            {contract.partyFarmerId ? partyFarmerLabel(contract.partyFarmerId) : '—'}
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
            {new Date(contract.startDate).toLocaleDateString('vi-VN')} —{' '}
            {new Date(contract.endDate).toLocaleDateString('vi-VN')}
          </Text>
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
