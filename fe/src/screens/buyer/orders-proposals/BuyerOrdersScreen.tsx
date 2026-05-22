/**
 * BuyerOrdersScreen — Phase 3 Refactor (FR-U04, FR-U06)
 * Route: /buyer/orders?status=negotiating|deposited|history
 *
 * 3 status tabs (mirroring the trader transactions UI):
 *   negotiating → pending proposals + pending/accepted orders + pending_signature contracts
 *   deposited   → active / pending_change contracts (tap → ContractDetailModal:
 *                 yêu cầu hoàn thành/hủy/điều chỉnh + chấp nhận/từ chối yêu cầu của thương lái)
 *   history     → completed / cancelled contracts + completed / cancelled orders
 *
 * Hợp đồng trader_buyer dùng chung ContractDetailModal với role trader/farmer —
 * modal tự xử lý ký, yêu cầu thay đổi (cancel/complete/modify) và accept/reject.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Page, Text } from 'zmp-ui';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { BuyerHeader } from '../components/BuyerHeader';
import { OrderStatusTabs, type OrderStatusTab } from './components/OrderStatusTabs';
import { ContractDetailModal } from '@/screens/trader/transactions/components/ContractDetailModal';
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
  contractFarmDisplay,
} from '@/utils/displayLabels';
import {
  listContracts,
  contractStatusLabelVi,
  contractTypeLabelVi,
  toContractViMessage,
  type ContractDto,
} from '@/services/contractService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitialTab(): OrderStatusTab {
  try {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const params = new URLSearchParams(search);
    const s = params.get('status');
    if (s === 'negotiating' || s === 'deposited') return s;
    // Các deep link cũ (completed/cancelled) gộp vào tab Lịch sử
    if (s === 'history' || s === 'completed' || s === 'cancelled') return 'history';
  } catch {
    // ignore
  }
  return 'negotiating';
}

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

// ── Contract info card (tappable → ContractDetailModal) ─────────────────────────

const ContractInfoCard: React.FC<{ contract: ContractDto; onTap: () => void }> = ({ contract, onTap }) => {
  const statusColor =
    contract.status === 'active'
      ? colors.primary.agriGreen
      : contract.status === 'pending_signature'
      ? colors.primary.zaloBlue
      : contract.status === 'pending_change'
      ? colors.functional.warningYellow
      : contract.status === 'completed'
      ? colors.primary.zaloBlue
      : colors.text.secondary;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => e.key === 'Enter' && onTap()}
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: spacing.md,
        padding: spacing.md,
        cursor: 'pointer',
        minHeight: '44px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <div style={{ flex: 1 }}>
          <Text size="xSmall" style={{ color: colors.text.secondary, display: 'block', fontSize: fontSize.caption }}>
            {contractTypeLabelVi(contract.contractType)}
          </Text>
          <Text.Title size="small" style={{ margin: `${spacing.xs} 0` }}>
            {contract.productId ? productDisplayName(contract.productId) : 'Hợp đồng'}
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, fontSize: fontSize.caption }}>
            Thương lái: {partyTraderDisplay(contract)}
          </Text>
          {contractFarmDisplay(contract) && (
            <Text size="xSmall" style={{ color: colors.text.primary, fontSize: fontSize.caption, marginTop: 2 }}>
              Vườn: {contractFarmDisplay(contract)}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size="small" style={{ color: colors.text.secondary }}>{contract.quantity} {contract.unit}</Text>
        <Text size="small" style={{ fontWeight: fontWeight.bold, color: colors.primary.zaloBlue }}>
          {formatCurrency(contract.totalPrice)}
        </Text>
      </div>
      <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
        {new Date(contract.startDate).toLocaleDateString('vi-VN')} — {new Date(contract.endDate).toLocaleDateString('vi-VN')}
      </Text>
    </div>
  );
};

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

  // Selected contract → ContractDetailModal
  const [selectedContract, setSelectedContract] = useState<ContractDto | null>(null);

  // In-flight action tracking (proposals / orders)
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

  useEffect(() => {
    if (activeTab === 'negotiating' && !propLoaded) loadProposals();
    if ((activeTab === 'negotiating' || activeTab === 'history') && !ordersLoaded) loadOrders();
    if (!contractLoaded) loadContracts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleAcceptProposal = async (id: string) => {
    setActionId(id);
    try {
      const updated = await acceptProposal(id);
      setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      openSnackbar({ type: 'success', text: 'Đã chấp nhận đề xuất! Hợp đồng chờ ký đã được tạo.', duration: 4000, icon: true });
      // Hợp đồng pending_signature vừa tạo → tải lại để hiển thị ở tab Chờ thương lượng
      loadContracts();
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

  // After signing in the modal: keep selection in sync + refresh list
  const handleContractSigned = (updated: ContractDto) => {
    setSelectedContract(updated);
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleContractRejected = (updated: ContractDto) => {
    setSelectedContract(null);
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const negotiatingOrders = orders.filter((o) => ['pending', 'accepted'].includes(o.status));
  // Chỉ hiển thị 1 đề xuất đang chờ cho mỗi cặp (thương lái, nhu cầu) — phòng dữ liệu trùng cũ
  const pendingProposals = (() => {
    const seen = new Set<string>();
    const out: ProposalDto[] = [];
    for (const p of proposals) {
      if (p.status !== 'pending') continue;
      const key = `${p.traderId}::${p.buyingRequestId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
    return out;
  })();
  const pendingSignatureContracts = contracts.filter((c) => c.status === 'pending_signature');
  const depositedContracts = contracts.filter(
    (c) => c.status === 'active' || c.status === 'pending_change' || c.status === 'in_settlement',
  );
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const cancelledOrders = orders.filter((o) => ['cancelled', 'rejected'].includes(o.status));
  const historyContracts = contracts.filter((c) => c.status === 'completed' || c.status === 'cancelled');

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

  const btnStyle = (variant: 'primary' | 'danger'): React.CSSProperties => ({
    flex: 1,
    minHeight: '44px',
    padding: spacing.sm,
    borderRadius: '8px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    backgroundColor:
      variant === 'primary' ? colors.primary.agriGreen : `${colors.functional.alertRed}15`,
    color: variant === 'primary' ? colors.text.inverse : colors.functional.alertRed,
    border: variant === 'danger' ? `1px solid ${colors.functional.alertRed}40` : 'none',
  });

  // ── Tab renderers ─────────────────────────────────────────────────────────

  const renderNegotiatingTab = () => {
    const loading = propLoading || ordersLoading || (contractLoading && !contractLoaded);
    const error = propError || ordersError;

    if (loading) return <>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</>;

    const isEmpty =
      pendingProposals.length === 0 && negotiatingOrders.length === 0 && pendingSignatureContracts.length === 0;

    if (error && isEmpty) {
      return (
        <EmptyState
          icon="⚠️"
          title="Không tải được dữ liệu"
          description={error}
          cta={{ label: 'Thử lại', onClick: () => { loadProposals(); loadOrders(); loadContracts(); } }}
        />
      );
    }

    if (isEmpty) {
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
        {/* Hợp đồng chờ ký — tạo từ đề xuất / đơn hàng đã chấp nhận */}
        {pendingSignatureContracts.length > 0 && (
          <>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm, display: 'block', fontWeight: fontWeight.semibold }}>
              Hợp đồng chờ ký ({pendingSignatureContracts.length})
            </Text>
            {pendingSignatureContracts.map((c) => (
              <ContractInfoCard key={c.id} contract={c} onTap={() => setSelectedContract(c)} />
            ))}
          </>
        )}

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
        {depositedContracts.map((c) => (
          <ContractInfoCard key={c.id} contract={c} onTap={() => setSelectedContract(c)} />
        ))}
      </>
    );
  };

  const renderHistoryTab = () => {
    const loading = ordersLoading || contractLoading;
    if (loading && !ordersLoaded && !contractLoaded) {
      return <>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</>;
    }

    if (
      completedOrders.length === 0 &&
      cancelledOrders.length === 0 &&
      historyContracts.length === 0
    ) {
      return <EmptyState icon="🗂️" title="Chưa có lịch sử giao dịch" description="Đơn hàng và hợp đồng đã hoàn tất hoặc đã hủy sẽ hiển thị tại đây" />;
    }

    return (
      <>
        {historyContracts.length > 0 && (
          <>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm, display: 'block', fontWeight: fontWeight.semibold }}>
              Hợp đồng ({historyContracts.length})
            </Text>
            {historyContracts.map((c) => (
              <ContractInfoCard key={c.id} contract={c} onTap={() => setSelectedContract(c)} />
            ))}
          </>
        )}

        {completedOrders.length > 0 && (
          <>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm, marginTop: spacing.md, display: 'block', fontWeight: fontWeight.semibold }}>
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

        {cancelledOrders.length > 0 && (
          <>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm, marginTop: spacing.md, display: 'block', fontWeight: fontWeight.semibold }}>
              Đơn hàng đã hủy ({cancelledOrders.length})
            </Text>
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
          </>
        )}
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
        {activeTab === 'history' && renderHistoryTab()}
      </div>

      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          visible
          onClose={() => {
            setSelectedContract(null);
            // Tải lại để phản ánh thay đổi trạng thái sau khi ký / accept / reject change-request
            loadContracts();
          }}
          onSigned={handleContractSigned}
          onRejected={handleContractRejected}
        />
      )}
    </Page>
  );
};

export default BuyerOrdersScreen;
