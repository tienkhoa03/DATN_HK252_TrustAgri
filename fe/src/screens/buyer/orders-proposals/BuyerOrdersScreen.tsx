/**
 * BuyerOrdersScreen — Phase 3 Refactor (FR-U04, FR-U06)
 * Route: /buyer/orders?status=negotiating|deposited|completed|cancelled
 *
 * 4 status tabs:
 *   negotiating → proposals pending + orders pending/accepted
 *   deposited   → contracts active/deposited + RenegotiationCard if pending change-request
 *   completed   → completed orders + completed contracts (replaces TransactionHistory)
 *   cancelled   → cancelled orders + cancelled contracts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Page, Text } from 'zmp-ui';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { BuyerHeader } from '../components/BuyerHeader';
import { OrderStatusTabs, type OrderStatusTab } from './components/OrderStatusTabs';
import { RenegotiationCard, type ContractChangeRequest } from './components/RenegotiationCard';
import {
  listProposals,
  acceptProposal,
  rejectProposal,
  toProposalViMessage,
  standardLabelProp,
  type ProposalDto,
} from '@/services/proposalService';
import {
  listOrders,
  cancelOrder,
  toOrderViMessage,
  orderStatusLabel,
  productDisplayName,
  type OrderDto,
} from '@/services/orderService';
import {
  orderTraderDisplay,
  partyTraderDisplay,
  proposalTraderDisplay,
  contractPartyDisplay,
} from '@/utils/displayLabels';
import {
  listContracts,
  contractStatusLabelVi,
  contractTypeLabelVi,
  toContractViMessage,
  type ContractDto,
} from '@/services/contractService';
import {
  listContractChangeRequests,
  type ContractChangeRequestDto,
} from '@/services/contractChangeRequestService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitialTab(): OrderStatusTab {
  try {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(search);
    const s = params.get('status');
    if (s === 'negotiating' || s === 'deposited' || s === 'completed' || s === 'cancelled') {
      return s;
    }
  } catch {
    // ignore
  }
  return 'negotiating';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div
    style={{
      backgroundColor: colors.background.primary,
      borderRadius: '12px',
      padding: spacing.md,
      marginBottom: spacing.md,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}
  >
    {[70, 50, 60, 40].map((w, i) => (
      <div
        key={i}
        style={{
          height: '12px',
          width: `${w}%`,
          backgroundColor: colors.background.secondary,
          borderRadius: '6px',
          marginBottom: spacing.sm,
        }}
      />
    ))}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const BuyerOrdersScreen: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();
  const [activeTab, setActiveTab] = useState<OrderStatusTab>(getInitialTab);

  // Proposals
  const [proposals, setProposals] = useState<ProposalDto[]>([]);
  const [propLoading, setPropLoading] = useState(false);
  const [propError, setPropError] = useState<string | null>(null);
  const [propLoaded, setPropLoaded] = useState(false);

  // Orders
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // Contracts
  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractLoaded, setContractLoaded] = useState(false);

  // Change requests for deposited tab (contractId → requests)
  const [changeRequests, setChangeRequests] = useState<Record<string, ContractChangeRequestDto[]>>({});

  // In-flight action tracking
  const [actionId, setActionId] = useState<string | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const loadProposals = useCallback(async () => {
    setPropLoading(true);
    setPropError(null);
    try {
      const res = await listProposals({ status: 'pending' });
      setProposals(res.items);
      setPropLoaded(true);
    } catch (err) {
      const msg = toProposalViMessage(err, 'list');
      setPropError(msg);
      openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
    } finally {
      setPropLoading(false);
    }
  }, [openSnackbar]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await listOrders();
      setOrders(res.items);
      setOrdersLoaded(true);
    } catch (err) {
      const msg = toOrderViMessage(err, 'list');
      setOrdersError(msg);
      openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
    } finally {
      setOrdersLoading(false);
    }
  }, [openSnackbar]);

  const loadContracts = useCallback(async () => {
    setContractLoading(true);
    setContractError(null);
    try {
      const res = await listContracts({ role: 'buyer', page: 1, limit: 50 });
      setContracts(res.items);
      setContractLoaded(true);
    } catch (err) {
      const msg = toContractViMessage(err, 'list');
      setContractError(msg);
      openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
    } finally {
      setContractLoading(false);
    }
  }, [openSnackbar]);

  // Load change-requests for active contracts when deposited tab is shown
  const loadChangeRequestsForContracts = useCallback(async (activeContracts: ContractDto[]) => {
    const results: Record<string, ContractChangeRequestDto[]> = {};
    await Promise.all(
      activeContracts.map(async (c) => {
        try {
          const reqs = await listContractChangeRequests(c.id);
          results[c.id] = reqs.filter((r) => r.status === 'pending');
        } catch {
          results[c.id] = [];
        }
      }),
    );
    setChangeRequests((prev) => ({ ...prev, ...results }));
  }, []);

  useEffect(() => {
    if ((activeTab === 'negotiating') && !propLoaded) loadProposals();
    if ((activeTab === 'negotiating' || activeTab === 'completed' || activeTab === 'cancelled') && !ordersLoaded) loadOrders();
    if ((activeTab === 'deposited' || activeTab === 'completed' || activeTab === 'cancelled') && !contractLoaded) loadContracts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'deposited' && contractLoaded) {
      const activeContracts = contracts.filter((c) => c.status === 'active' || (c.status as string) === 'deposited');
      if (activeContracts.length > 0) {
        loadChangeRequestsForContracts(activeContracts);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, contractLoaded]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleAcceptProposal = async (id: string) => {
    setActionId(id);
    try {
      const updated = await acceptProposal(id);
      setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      openSnackbar({ type: 'success', text: 'Đã chấp nhận đề xuất!', duration: 4000, icon: true });
      setOrdersLoaded(false);
    } catch (err) {
      openSnackbar({ type: 'error', text: toProposalViMessage(err, 'accept'), duration: 4000, icon: true });
    } finally {
      setActionId(null);
    }
  };

  const handleRejectProposal = async (id: string) => {
    setActionId(id);
    try {
      const updated = await rejectProposal(id);
      setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      openSnackbar({ type: 'success', text: 'Đã từ chối đề xuất.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toProposalViMessage(err, 'reject'), duration: 4000, icon: true });
    } finally {
      setActionId(null);
    }
  };

  const handleCancelOrder = async (id: string) => {
    setActionId(id);
    try {
      const updated = await cancelOrder(id);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      openSnackbar({ type: 'success', text: 'Đã hủy đơn hàng.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toOrderViMessage(err, 'cancel'), duration: 4000, icon: true });
    } finally {
      setActionId(null);
    }
  };

  const handleChangeRequestApproved = (contractId: string, changeId: string) => {
    setChangeRequests((prev) => ({
      ...prev,
      [contractId]: (prev[contractId] ?? []).filter((r) => r.id !== changeId),
    }));
  };

  const handleChangeRequestRejected = (contractId: string, changeId: string) => {
    setChangeRequests((prev) => ({
      ...prev,
      [contractId]: (prev[contractId] ?? []).filter((r) => r.id !== changeId),
    }));
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const negotiatingOrders = orders.filter((o) => ['pending', 'accepted'].includes(o.status));
  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const depositedContracts = contracts.filter((c) => c.status === 'active' || (c.status as string) === 'deposited');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const completedContracts = contracts.filter((c) => c.status === 'completed');
  const cancelledOrders = orders.filter((o) => ['cancelled', 'rejected'].includes(o.status));
  const cancelledContracts = contracts.filter((c) => c.status === 'cancelled');

  // ── Styles ────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    padding: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const statusBadgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: `${color}18`,
    color,
    borderRadius: '6px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
  });

  const btnStyle = (variant: 'primary' | 'danger' | 'ghost'): React.CSSProperties => ({
    flex: 1,
    minHeight: '44px',
    padding: spacing.sm,
    borderRadius: '8px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    backgroundColor:
      variant === 'primary' ? colors.primary.agriGreen :
      variant === 'danger' ? `${colors.functional.alertRed}15` :
      'transparent',
    color:
      variant === 'primary' ? colors.text.inverse :
      variant === 'danger' ? colors.functional.alertRed :
      colors.text.secondary,
    border:
      variant === 'ghost' ? `1px solid ${colors.background.tertiary}` :
      variant === 'danger' ? `1px solid ${colors.functional.alertRed}40` :
      'none',
  });

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

  const ageLabel = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const h = Math.floor(ms / 3600000);
    const d = Math.floor(ms / 86400000);
    if (d >= 1) return `${d} ngày trước`;
    if (h >= 1) return `${h} giờ trước`;
    return 'Vừa xong';
  };

  // ── Tab renderers ─────────────────────────────────────────────────────────

  const renderNegotiatingTab = () => {
    const loading = propLoading || ordersLoading;
    const error = propError || ordersError;

    if (loading) return <>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</>;

    if (error && pendingProposals.length === 0 && negotiatingOrders.length === 0) {
      return (
        <EmptyState
          icon="⚠️"
          title="Không tải được dữ liệu"
          description={error}
          cta={{ label: 'Thử lại', onClick: () => { loadProposals(); loadOrders(); } }}
        />
      );
    }

    if (pendingProposals.length === 0 && negotiatingOrders.length === 0) {
      return (
        <EmptyState
          icon="💬"
          title="Chưa có giao dịch chờ thương lượng"
          description="Đề xuất từ thương lái và đơn hàng đang chờ sẽ hiển thị tại đây"
        />
      );
    }

    return (
      <>
        {/* Pending proposals */}
        {pendingProposals.length > 0 && (
          <>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm, display: 'block', fontWeight: fontWeight.semibold }}>
              Đề xuất từ thương lái ({pendingProposals.length})
            </Text>
            {pendingProposals.map((proposal) => {
              const isActing = actionId === proposal.id;
              return (
                <div key={proposal.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                    <div>
                      <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                        {proposalTraderDisplay(proposal)}
                      </Text>
                      <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>{ageLabel(proposal.createdAt)}</Text>
                    </div>
                    <span style={statusBadgeStyle(colors.functional.warningYellow)}>⏳ Chờ phản hồi</span>
                  </div>

                  {standardLabelProp(proposal.standardCode) && (
                    <Text size="xSmall" style={{ color: colors.primary.agriGreen, marginBottom: spacing.sm }}>
                      {standardLabelProp(proposal.standardCode)}
                    </Text>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${spacing.xs} ${spacing.md}`, padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: '8px', marginBottom: spacing.sm }}>
                    <div>
                      <Text size="xSmall" style={{ color: colors.text.secondary }}>Số lượng</Text>
                      <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{proposal.quantity} kg</Text>
                    </div>
                    <div>
                      <Text size="xSmall" style={{ color: colors.text.secondary }}>Đơn giá</Text>
                      <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.zaloBlue }}>
                        {proposal.price.toLocaleString('vi-VN')} ₫/kg
                      </Text>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Text size="xSmall" style={{ color: colors.text.secondary }}>Tổng giá trị</Text>
                      <Text size="small" style={{ fontWeight: fontWeight.bold, color: colors.primary.zaloBlue }}>
                        {(proposal.price * proposal.quantity).toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <button
                      style={{ ...btnStyle('primary'), opacity: isActing ? 0.6 : 1 }}
                      disabled={isActing}
                      onClick={() => handleAcceptProposal(proposal.id)}
                    >
                      {isActing ? '...' : '✓ Chấp nhận'}
                    </button>
                    <button
                      style={{ ...btnStyle('danger'), opacity: isActing ? 0.6 : 1 }}
                      disabled={isActing}
                      onClick={() => handleRejectProposal(proposal.id)}
                    >
                      {isActing ? '...' : '✕ Từ chối'}
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Pending orders */}
        {negotiatingOrders.length > 0 && (
          <>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm, display: 'block', fontWeight: fontWeight.semibold }}>
              Đơn hàng đang xử lý ({negotiatingOrders.length})
            </Text>
            {negotiatingOrders.map((order) => {
              const isActing = actionId === order.id;
              const statusColor = order.status === 'accepted' ? colors.primary.agriGreen : colors.functional.warningYellow;
              return (
                <div key={order.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                    <div>
                      <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                        {orderTraderDisplay(order)}
                      </Text>
                      <Text size="xSmall" style={{ color: colors.text.secondary }}>{ageLabel(order.createdAt)}</Text>
                    </div>
                    <span style={statusBadgeStyle(statusColor)}>{orderStatusLabel(order.status)}</span>
                  </div>
                  <Text size="small" style={{ fontWeight: fontWeight.medium, marginBottom: spacing.xs }}>
                    {productDisplayName(order.productId)}
                  </Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.md }}>
                    <Text size="small" style={{ color: colors.text.secondary }}>{order.quantity} {order.unit}</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{formatCurrency(order.totalPrice)}</Text>
                  </div>
                  {order.status === 'pending' && (
                    <button
                      style={{ ...btnStyle('danger'), opacity: isActing ? 0.6 : 1 }}
                      disabled={isActing}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      {isActing ? '...' : 'Hủy đơn'}
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}
      </>
    );
  };

  const renderDepositedTab = () => {
    if (contractLoading && !contractLoaded) {
      return <>{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</>;
    }
    if (contractError && depositedContracts.length === 0) {
      return <EmptyState icon="⚠️" title="Không tải được hợp đồng" description={contractError} cta={{ label: 'Thử lại', onClick: loadContracts }} />;
    }
    if (depositedContracts.length === 0) {
      return <EmptyState icon="🤝" title="Chưa có hợp đồng đang thực hiện" description="Các hợp đồng đang đặt cọc sẽ hiển thị tại đây" />;
    }

    return (
      <>
        {depositedContracts.map((c) => {
          const pendingReqs = changeRequests[c.id] ?? [];
          return (
            <div key={c.id}>
              {/* Change request banners */}
              {pendingReqs.map((req) => {
                const changeReq: ContractChangeRequest = {
                  id: req.id,
                  contractId: c.id,
                  status: req.status === 'accepted' ? 'approved' : req.status,
                  before: {
                    quantity: req.changes['quantity']?.oldValue as number | undefined,
                    pricePerUnit: req.changes['totalPrice']?.oldValue as number | undefined,
                    depositAmount: req.changes['deposit']?.oldValue as number | undefined,
                    deliveryDate: req.changes['endDate']?.oldValue as string | undefined,
                    notes: req.changes['terms']?.oldValue as string | undefined,
                  },
                  after: {
                    quantity: req.changes['quantity']?.newValue as number | undefined,
                    pricePerUnit: req.changes['totalPrice']?.newValue as number | undefined,
                    depositAmount: req.changes['deposit']?.newValue as number | undefined,
                    deliveryDate: req.changes['endDate']?.newValue as string | undefined,
                    notes: req.changes['terms']?.newValue as string | undefined,
                  },
                  requestedAt: req.createdAt,
                  requestedBy: req.requestedBy
                    ? contractPartyDisplay(req.requestedBy, c)
                    : undefined,
                };
                return (
                  <RenegotiationCard
                    key={req.id}
                    changeRequest={changeReq}
                    onApprove={(id) => handleChangeRequestApproved(c.id, id)}
                    onReject={(id) => handleChangeRequestRejected(c.id, id)}
                  />
                );
              })}

              {/* Contract card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                  <div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      {contractTypeLabelVi(c.contractType)}
                    </Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                      {c.productId ? productDisplayName(c.productId) : 'Hợp đồng'}
                    </Text>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>
                      Thương lái: {partyTraderDisplay(c)}
                    </Text>
                  </div>
                  <span style={statusBadgeStyle(colors.primary.agriGreen)}>
                    {contractStatusLabelVi(c.status)}
                  </span>
                </div>
                <div style={{ padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Khối lượng</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{c.quantity} {c.unit}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.xs }}>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Tổng giá trị</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{formatCurrency(c.totalPrice)}</Text>
                  </div>
                  <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
                    {new Date(c.startDate).toLocaleDateString('vi-VN')} — {new Date(c.endDate).toLocaleDateString('vi-VN')}
                  </Text>
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const renderCompletedTab = () => {
    const loading = ordersLoading || contractLoading;
    if (loading && !ordersLoaded && !contractLoaded) {
      return <>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</>;
    }

    if (completedOrders.length === 0 && completedContracts.length === 0) {
      return <EmptyState icon="✅" title="Chưa có giao dịch hoàn tất" description="Đơn hàng và hợp đồng hoàn tất sẽ hiển thị tại đây" />;
    }

    return (
      <>
        {completedOrders.length > 0 && (
          <>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm, display: 'block', fontWeight: fontWeight.semibold }}>
              Đơn hàng hoàn tất ({completedOrders.length})
            </Text>
            {completedOrders.map((order) => (
              <div key={order.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                  <div>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                      {orderTraderDisplay(order)}
                    </Text>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      Hoàn tất {new Date(order.updatedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </div>
                  <span style={statusBadgeStyle(colors.primary.agriGreen)}>✓ Hoàn tất</span>
                </div>
                <Text size="small" style={{ fontWeight: fontWeight.medium, marginBottom: spacing.xs }}>
                  {productDisplayName(order.productId)}
                </Text>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text size="small" style={{ color: colors.text.secondary }}>{order.quantity} {order.unit}</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.bold }}>{formatCurrency(order.totalPrice)}</Text>
                </div>
              </div>
            ))}
          </>
        )}

        {completedContracts.length > 0 && (
          <>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm, marginTop: spacing.md, display: 'block', fontWeight: fontWeight.semibold }}>
              Hợp đồng hoàn tất ({completedContracts.length})
            </Text>
            {completedContracts.map((c) => (
              <div key={c.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                  <div>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                      {c.productId ? productDisplayName(c.productId) : 'Hợp đồng'}
                    </Text>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      {partyTraderDisplay(c)}
                    </Text>
                  </div>
                  <span style={statusBadgeStyle(colors.primary.zaloBlue)}>Hoàn thành</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text size="small" style={{ color: colors.text.secondary }}>{c.quantity} {c.unit}</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.bold }}>{formatCurrency(c.totalPrice)}</Text>
                </div>
                <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
                  {new Date(c.endDate).toLocaleDateString('vi-VN')}
                </Text>
              </div>
            ))}
          </>
        )}
      </>
    );
  };

  const renderCancelledTab = () => {
    const loading = ordersLoading || contractLoading;
    if (loading && !ordersLoaded && !contractLoaded) {
      return <>{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</>;
    }

    if (cancelledOrders.length === 0 && cancelledContracts.length === 0) {
      return <EmptyState icon="📭" title="Không có giao dịch đã hủy" description="Đơn hàng và hợp đồng bị hủy sẽ hiển thị tại đây" />;
    }

    return (
      <>
        {cancelledOrders.map((order) => (
          <div key={order.id} style={{ ...cardStyle, opacity: 0.75 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              <div>
                <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                  {orderTraderDisplay(order)}
                </Text>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  {new Date(order.updatedAt).toLocaleDateString('vi-VN')}
                </Text>
              </div>
              <span style={statusBadgeStyle(colors.functional.alertRed)}>
                ✕ {orderStatusLabel(order.status)}
              </span>
            </div>
            <Text size="small" style={{ fontWeight: fontWeight.medium, marginBottom: spacing.xs }}>
              {productDisplayName(order.productId)}
            </Text>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" style={{ color: colors.text.secondary }}>{order.quantity} {order.unit}</Text>
              <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{formatCurrency(order.totalPrice)}</Text>
            </div>
          </div>
        ))}
        {cancelledContracts.map((c) => (
          <div key={c.id} style={{ ...cardStyle, opacity: 0.75 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              <div>
                <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                  {c.productId ? productDisplayName(c.productId) : 'Hợp đồng'}
                </Text>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  {partyTraderDisplay(c)}
                </Text>
              </div>
              <span style={statusBadgeStyle(colors.text.secondary)}>Đã hủy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="small" style={{ color: colors.text.secondary }}>{c.quantity} {c.unit}</Text>
              <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{formatCurrency(c.totalPrice)}</Text>
            </div>
          </div>
        ))}
      </>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Page className="buyer-orders-screen">
      <BuyerHeader title="Đơn hàng" />
      <OrderStatusTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={{ padding: spacing.md, paddingBottom: spacing.xl }}>
        {activeTab === 'negotiating' && renderNegotiatingTab()}
        {activeTab === 'deposited' && renderDepositedTab()}
        {activeTab === 'completed' && renderCompletedTab()}
        {activeTab === 'cancelled' && renderCancelledTab()}
      </div>
    </Page>
  );
};

export default BuyerOrdersScreen;
