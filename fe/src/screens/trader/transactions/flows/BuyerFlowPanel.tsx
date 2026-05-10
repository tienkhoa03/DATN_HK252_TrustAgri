/**
 * BuyerFlowPanel — "Với Người mua" flow
 * Tabs: Mới (pending orders) | Đàm phán (pending_change contracts) | Đã ký (active)
 * Requirements: FR-T03, FR-T04, FR-T05, US-T03
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { StatusTabbedList } from '../components/StatusTabbedList';
import { RequestCard } from '../components/RequestCard';
import { ContractDetailModal } from '../components/ContractDetailModal';
import { EmptyState } from '@/design-system/components/EmptyState/EmptyState';
import {
  listOrders,
  acceptOrder,
  rejectOrder,
  toOrderViMessage,
  orderStatusLabel,
  buyerDisplayName as orderBuyerDisplayName,
  productDisplayName,
  type OrderDto,
} from '@/services/orderService';
import {
  listContracts,
  contractStatusLabelVi,
  contractTypeLabelVi,
  partyBuyerLabel,
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

interface Props {
  initialStatus?: string;
}

export const BuyerFlowPanel: React.FC<Props> = ({ initialStatus }) => {
  const openSnackbar = useStableOpenSnackbar();
  const [activeTab, setActiveTab] = useState(() => initialTab(initialStatus));

  // --- "Mới" tab: pending orders ---
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [orderPending, setOrderPending] = useState<Record<string, boolean>>({});

  // --- Contract tabs ---
  const [negotiatingContracts, setNegotiatingContracts] = useState<ContractDto[]>([]);
  const [signedContracts, setSignedContracts] = useState<ContractDto[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsLoaded, setContractsLoaded] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractDto | null>(null);

  const loadOrders = useCallback(async () => {
    if (ordersLoaded) return;
    setOrdersLoading(true);
    try {
      const res = await listOrders({ status: 'pending' });
      setOrders(res.items);
      setOrdersLoaded(true);
    } catch (err) {
      openSnackbar({ type: 'error', text: toOrderViMessage(err, 'list'), duration: 3500, icon: true });
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersLoaded, openSnackbar]);

  const loadContracts = useCallback(async () => {
    if (contractsLoaded) return;
    setContractsLoading(true);
    try {
      const [negRes, signedRes] = await Promise.all([
        listContracts({ role: 'trader', status: 'pending_change', limit: 50 }),
        listContracts({ role: 'trader', status: 'active', limit: 50 }),
      ]);
      // Filter to buyer contracts only (have partyBuyerId)
      setNegotiatingContracts(negRes.items.filter((c) => !!c.partyBuyerId));
      setSignedContracts(signedRes.items.filter((c) => !!c.partyBuyerId));
      setContractsLoaded(true);
    } catch (err) {
      openSnackbar({ type: 'error', text: toContractViMessage(err, 'list'), duration: 3500, icon: true });
    } finally {
      setContractsLoading(false);
    }
  }, [contractsLoaded, openSnackbar]);

  useEffect(() => {
    if (activeTab === 'new') void loadOrders();
    if (activeTab === 'negotiating' || activeTab === 'signed') void loadContracts();
  }, [activeTab, loadOrders, loadContracts]);

  const handleAcceptOrder = async (order: OrderDto) => {
    setOrderPending((p) => ({ ...p, [order.id]: true }));
    try {
      await acceptOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      openSnackbar({ type: 'success', text: 'Đã xác nhận đơn hàng.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toOrderViMessage(err, 'accept'), duration: 3000, icon: true });
    } finally {
      setOrderPending((p) => { const n = { ...p }; delete n[order.id]; return n; });
    }
  };

  const handleRejectOrder = async (order: OrderDto) => {
    setOrderPending((p) => ({ ...p, [order.id]: true }));
    try {
      await rejectOrder(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      openSnackbar({ type: 'success', text: 'Đã từ chối đơn hàng.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toOrderViMessage(err, 'reject'), duration: 3000, icon: true });
    } finally {
      setOrderPending((p) => { const n = { ...p }; delete n[order.id]; return n; });
    }
  };

  const renderNewTab = () => {
    if (ordersLoading) return <SkeletonList />;
    if (orders.length === 0) {
      return <EmptyState icon="🛒" title="Không có đơn hàng mới" description="Đơn hàng chờ xác nhận từ người mua sẽ hiện ở đây" />;
    }
    return (
      <div>
        {orders.map((order) => (
          <RequestCard
            key={order.id}
            title={orderBuyerDisplayName(order.buyerId)}
            subtitle={productDisplayName(order.productId)}
            meta={orderStatusLabel(order.status)}
            isLoading={!!orderPending[order.id]}
            onAccept={() => void handleAcceptOrder(order)}
            onReject={() => void handleRejectOrder(order)}
          />
        ))}
      </div>
    );
  };

  const renderContractList = (contracts: ContractDto[]) => {
    if (contractsLoading) return <SkeletonList />;
    if (contracts.length === 0) {
      return <EmptyState icon="📄" title="Chưa có hợp đồng" description="Hợp đồng với người mua sẽ hiển thị tại đây" />;
    }
    return (
      <div>
        {contracts.map((c) => (
          <BuyerContractInfoCard
            key={c.id}
            contract={c}
            onTap={() => setSelectedContract(c)}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <StatusTabbedList tabs={TABS} activeId={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'new' && renderNewTab()}
        {activeTab === 'negotiating' && renderContractList(negotiatingContracts)}
        {activeTab === 'signed' && renderContractList(signedContracts)}
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

const BuyerContractInfoCard: React.FC<{ contract: ContractDto; onTap: () => void }> = ({
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
            {contract.partyBuyerId ? partyBuyerLabel(contract.partyBuyerId) : '—'}
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
