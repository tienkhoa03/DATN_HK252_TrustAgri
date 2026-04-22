/**
 * Buyer Orders & Proposals Screen — Phase 11.1
 * Quản lý Đơn hàng và Đề xuất
 *
 * Requirements: FR-U01, FR-U03, FR-U04, FR-U06
 *
 * Features:
 * - Tab «Đề xuất» — Proposals từ thương lái đang chờ buyer xác nhận (accept / reject)
 * - Tab «Đang thực hiện» — Đơn hàng accepted / contracted
 * - Tab «Lịch sử» — Đơn hàng completed / rejected / cancelled + cancel action
 *
 * Data sources: proposalService + orderService (Phase 11.2 — Axios + JWT)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { RoleAppShell } from '@/navigation/RoleAppShell';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import {
  listProposals,
  acceptProposal,
  rejectProposal,
  toProposalViMessage,
  standardLabelProp,
  traderDisplayName,
  type ProposalDto,
} from '../../../services/proposalService';
import {
  listOrders,
  cancelOrder,
  toOrderViMessage,
  orderStatusLabel,
  productDisplayName,
  type OrderDto,
} from '../../../services/orderService';
import {
  listBuyingRequests,
  cropLabelBR,
  type BuyingRequestDto,
} from '../../../services/buyingRequestService';
import {
  listContracts,
  contractStatusLabelVi,
  contractTypeLabelVi,
  toContractViMessage,
  type ContractDto,
} from '../../../services/contractService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { ContractChangeRequestsPanel } from '@/screens/shared/contract-change-requests';
import { BuyerNotificationBell } from '@/screens/buyer/components/BuyerNotificationBell';

export interface BuyerOrdersProposalsScreenProps {
  buyerId?: string;
  buyerName?: string;
}

type TabType = 'proposals' | 'active' | 'history' | 'contracts';

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
    <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: '36px',
            backgroundColor: colors.background.secondary,
            borderRadius: '6px',
          }}
        />
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const BuyerOrdersProposalsScreen: React.FC<BuyerOrdersProposalsScreenProps> = ({
  buyerId = 'me',
  buyerName = 'Người mua',
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [activeTab, setActiveTab] = useState<TabType>('proposals');

  // Proposals state
  const [proposals, setProposals] = useState<ProposalDto[]>([]);
  const [propLoading, setPropLoading] = useState(false);
  const [propError, setPropError] = useState<string | null>(null);
  const [propLoaded, setPropLoaded] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // BuyingRequests lookup (for proposal display)
  const [brMap, setBrMap] = useState<Record<string, BuyingRequestDto>>({});

  // In-flight action tracking
  const [actionId, setActionId] = useState<string | null>(null);

  // Contracts (Phase 12.2 — contractService + JWT)
  const [contractItems, setContractItems] = useState<ContractDto[]>([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractLoaded, setContractLoaded] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const loadProposals = useCallback(async () => {
    setPropLoading(true);
    setPropError(null);
    try {
      const [propRes, brRes] = await Promise.all([
        listProposals({ status: 'pending' }),
        listBuyingRequests({ buyerId, status: 'all' }),
      ]);
      setProposals(propRes.items);
      const map: Record<string, BuyingRequestDto> = {};
      brRes.items.forEach((br) => { map[br.id] = br; });
      setBrMap(map);
      setPropLoaded(true);
    } catch (err) {
      const msg = toProposalViMessage(err, 'list');
      setPropError(msg);
      openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
    } finally {
      setPropLoading(false);
    }
  }, [buyerId, openSnackbar]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      /** Server lọc đơn theo buyer từ JWT. */
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
      const res = await listContracts({
        role: 'buyer',
        page: 1,
        limit: 50,
      });
      setContractItems(res.items);
      setContractLoaded(true);
    } catch (err: unknown) {
      const msg = toContractViMessage(err, 'list');
      setContractError(msg);
      openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
    } finally {
      setContractLoading(false);
    }
  }, [openSnackbar]);

  useEffect(() => {
    if (activeTab === 'proposals' && !propLoaded) loadProposals();
    if ((activeTab === 'active' || activeTab === 'history') && !ordersLoaded) loadOrders();
    if (activeTab === 'contracts' && !contractLoaded && !contractLoading) loadContracts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAcceptProposal = async (id: string) => {
    setActionId(id);
    try {
      const updated = await acceptProposal(id);
      setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      openSnackbar({ type: 'success', text: '✓ Đã chấp nhận đề xuất! Hợp đồng đang được tạo.', duration: 4000, icon: true });
      // Reload orders since a new contracted order might appear
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

  // ── Derived data ──────────────────────────────────────────────────────────

  const pendingProposals = proposals.filter((p) => p.status === 'pending');
  const activeOrders = orders.filter((o) =>
    ['pending', 'accepted', 'contracted'].includes(o.status),
  );
  const historyOrders = orders.filter((o) =>
    ['completed', 'rejected', 'cancelled'].includes(o.status),
  );

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

  const btnStyle = (variant: 'primary' | 'secondary' | 'danger' | 'ghost'): React.CSSProperties => ({
    flex: 1,
    padding: spacing.sm,
    borderRadius: '8px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    backgroundColor:
      variant === 'primary' ? colors.primary.agriGreen :
      variant === 'secondary' ? colors.primary.zaloBlue :
      variant === 'danger' ? `${colors.functional.alertRed}15` :
      'transparent',
    color:
      variant === 'primary' || variant === 'secondary' ? colors.text.inverse :
      variant === 'danger' ? colors.functional.alertRed :
      colors.text.secondary,
    border:
      variant === 'ghost' ? `1px solid ${colors.background.tertiary}` :
      variant === 'danger' ? `1px solid ${colors.functional.alertRed}40` :
      'none',
  });

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: `${spacing.xl} ${spacing.md}`,
  };

  // ── Tab renderers ─────────────────────────────────────────────────────────

  const renderProposalsTab = () => {
    if (propLoading) {
      return <>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</>;
    }

    if (propError) {
      return (
        <div style={emptyStyle}>
          <div style={{ fontSize: '40px', marginBottom: spacing.md }}>⚠️</div>
          <Text size="small" style={{ color: colors.functional.alertRed }}>{propError}</Text>
          <button
            style={{ ...btnStyle('secondary'), flex: 'none', marginTop: spacing.md, padding: `${spacing.sm} ${spacing.lg}` }}
            onClick={loadProposals}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (pendingProposals.length === 0) {
      return (
        <div style={emptyStyle}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📋</div>
          <Text.Title size="small" style={{ marginBottom: spacing.sm }}>Chưa có đề xuất nào</Text.Title>
          <Text size="small" style={{ color: colors.text.secondary }}>
            Thương lái sẽ phản hồi yêu cầu mua của bạn tại đây
          </Text>
        </div>
      );
    }

    return (
      <>
        {proposals.map((proposal) => {
          const br = brMap[proposal.buyingRequestId];
          const cropName = br ? cropLabelBR(br.cropType) : '—';
          const stdLabel = standardLabelProp(proposal.standardCode);
          const isActing = actionId === proposal.id;
          const isPending = proposal.status === 'pending';
          const statusColor =
            proposal.status === 'accepted' ? colors.primary.agriGreen :
            proposal.status === 'rejected' ? colors.functional.alertRed :
            colors.functional.warningYellow;
          const ageLabel = (() => {
            const ms = Date.now() - new Date(proposal.createdAt).getTime();
            const h = Math.floor(ms / 3600000);
            const d = Math.floor(ms / 86400000);
            if (d >= 1) return `${d} ngày trước`;
            if (h >= 1) return `${h} giờ trước`;
            return 'Vừa xong';
          })();

          return (
            <div key={proposal.id} style={cardStyle}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                <div>
                  <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                    {traderDisplayName(proposal.traderId)}
                  </Text>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>{ageLabel}</Text>
                </div>
                <span style={statusBadgeStyle(statusColor)}>
                  {proposal.status === 'pending' ? '⏳' : proposal.status === 'accepted' ? '✓' : '✕'}
                  {' '}
                  {proposal.status === 'pending' ? 'Chờ phản hồi' : proposal.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
                </span>
              </div>

              {/* Crop + Standard */}
              <div style={{ marginBottom: spacing.sm }}>
                <Text size="small" style={{ fontWeight: fontWeight.medium, margin: 0 }}>
                  {cropName}
                </Text>
                {stdLabel && (
                  <Text size="xSmall" style={{ color: colors.primary.agriGreen, margin: 0 }}>
                    🌿 {stdLabel}
                  </Text>
                )}
              </div>

              {/* Info grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: `${spacing.xs} ${spacing.md}`,
                  padding: spacing.sm,
                  backgroundColor: colors.background.secondary,
                  borderRadius: '8px',
                  marginBottom: spacing.sm,
                }}
              >
                <div>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Số lượng</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.semibold }}>
                    {proposal.quantity} kg
                  </Text>
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

              {/* Note */}
              {proposal.note && (
                <div
                  style={{
                    padding: spacing.sm,
                    backgroundColor: `${colors.primary.zaloBlue}08`,
                    borderRadius: '6px',
                    borderLeft: `3px solid ${colors.primary.zaloBlue}`,
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Ghi chú từ thương lái</Text>
                  <Text size="small" style={{ color: colors.text.primary, margin: 0 }}>
                    {proposal.note}
                  </Text>
                </div>
              )}

              {/* Actions — chỉ hiển thị khi pending */}
              {isPending && (
                <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.sm }}>
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
              )}
            </div>
          );
        })}
      </>
    );
  };

  const renderActiveOrdersTab = () => {
    if (ordersLoading) {
      return <>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</>;
    }

    if (ordersError) {
      return (
        <div style={emptyStyle}>
          <div style={{ fontSize: '40px', marginBottom: spacing.md }}>⚠️</div>
          <Text size="small" style={{ color: colors.functional.alertRed }}>{ordersError}</Text>
          <button
            style={{ ...btnStyle('secondary'), flex: 'none', marginTop: spacing.md, padding: `${spacing.sm} ${spacing.lg}` }}
            onClick={loadOrders}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (activeOrders.length === 0) {
      return (
        <div style={emptyStyle}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📦</div>
          <Text.Title size="small" style={{ marginBottom: spacing.sm }}>Chưa có đơn hàng đang thực hiện</Text.Title>
          <Text size="small" style={{ color: colors.text.secondary }}>
            Chấp nhận đề xuất từ thương lái để bắt đầu đơn hàng
          </Text>
        </div>
      );
    }

    return (
      <>
        {activeOrders.map((order) => {
          const isActing = actionId === order.id;
          const statusColor =
            order.status === 'contracted' ? colors.primary.agriGreen :
            order.status === 'accepted' ? colors.primary.zaloBlue :
            colors.functional.warningYellow;
          const canCancel = ['pending', 'accepted'].includes(order.status);
          const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          });

          return (
            <div key={order.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                <div>
                  <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                    {traderDisplayName(order.traderId)}
                  </Text>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    Đặt ngày {orderDate}
                  </Text>
                </div>
                <span style={statusBadgeStyle(statusColor)}>
                  {orderStatusLabel(order.status)}
                </span>
              </div>

              <Text size="small" style={{ fontWeight: fontWeight.medium, marginBottom: spacing.xs }}>
                {productDisplayName(order.productId)}
              </Text>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: `${spacing.xs} ${spacing.md}`,
                  padding: spacing.sm,
                  backgroundColor: colors.background.secondary,
                  borderRadius: '8px',
                  marginBottom: spacing.sm,
                }}
              >
                <div>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Số lượng</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.semibold }}>
                    {order.quantity} {order.unit}
                  </Text>
                </div>
                <div>
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>Tổng giá trị</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.zaloBlue }}>
                    {order.totalPrice.toLocaleString('vi-VN')} ₫
                  </Text>
                </div>
                {order.deposit != null && order.deposit > 0 && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Đã đặt cọc</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen }}>
                      {order.deposit.toLocaleString('vi-VN')} ₫
                    </Text>
                  </div>
                )}
              </div>

              {order.status === 'contracted' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: `${colors.primary.agriGreen}12`,
                    borderRadius: '6px',
                    marginBottom: spacing.sm,
                  }}
                >
                  <Icon name="check" size="sm" color={colors.primary.agriGreen} />
                  <Text size="xSmall" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.medium }}>
                    Hợp đồng đã được ký — xem trong Hợp đồng
                  </Text>
                </div>
              )}

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button style={btnStyle('ghost')}>👁 Xem chi tiết</button>
                {canCancel && (
                  <button
                    style={{ ...btnStyle('danger'), opacity: isActing ? 0.6 : 1 }}
                    disabled={isActing}
                    onClick={() => handleCancelOrder(order.id)}
                  >
                    {isActing ? '...' : 'Hủy'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  const renderHistoryTab = () => {
    if (ordersLoading) {
      return <>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</>;
    }

    if (ordersError) {
      return (
        <div style={emptyStyle}>
          <div style={{ fontSize: '40px', marginBottom: spacing.md }}>⚠️</div>
          <Text size="small" style={{ color: colors.functional.alertRed }}>{ordersError}</Text>
          <button
            style={{ ...btnStyle('secondary'), flex: 'none', marginTop: spacing.md, padding: `${spacing.sm} ${spacing.lg}` }}
            onClick={loadOrders}
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (historyOrders.length === 0) {
      return (
        <div style={emptyStyle}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📜</div>
          <Text.Title size="small" style={{ marginBottom: spacing.sm }}>Chưa có lịch sử đơn hàng</Text.Title>
          <Text size="small" style={{ color: colors.text.secondary }}>
            Các đơn hàng hoàn tất hoặc đã hủy sẽ hiển thị tại đây
          </Text>
        </div>
      );
    }

    return (
      <>
        {historyOrders.map((order) => {
          const statusColor =
            order.status === 'completed' ? colors.primary.agriGreen :
            order.status === 'rejected' ? colors.functional.alertRed :
            colors.text.secondary;
          const doneDate = new Date(order.updatedAt).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          });

          return (
            <div key={order.id} style={{ ...cardStyle, opacity: order.status === 'cancelled' ? 0.75 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                <div>
                  <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                    {traderDisplayName(order.traderId)}
                  </Text>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    {order.status === 'completed' ? `Hoàn tất ${doneDate}` :
                     order.status === 'cancelled' ? `Đã hủy ${doneDate}` :
                     `Từ chối ${doneDate}`}
                  </Text>
                </div>
                <span style={statusBadgeStyle(statusColor)}>
                  {order.status === 'completed' ? '✓' : '✕'} {orderStatusLabel(order.status)}
                </span>
              </div>

              <Text size="small" style={{ fontWeight: fontWeight.medium, marginBottom: spacing.xs }}>
                {productDisplayName(order.productId)}
              </Text>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.md }}>
                <Text size="small" style={{ color: colors.text.secondary }}>
                  {order.quantity} {order.unit}
                </Text>
                <Text size="small" style={{ fontWeight: fontWeight.semibold }}>
                  {order.totalPrice.toLocaleString('vi-VN')} ₫
                </Text>
              </div>

              {order.status === 'completed' && (
                <button style={btnStyle('primary')}>🔄 Mua lại</button>
              )}
            </div>
          );
        })}
      </>
    );
  };

  const renderContractsTab = () => {
    if (contractLoading && !contractLoaded) {
      return <>{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</>;
    }
    if (contractError && contractItems.length === 0) {
      return (
        <div style={emptyStyle}>
          <Text size="small" style={{ color: colors.functional.alertRed }}>{contractError}</Text>
          <button
            type="button"
            style={{ ...btnStyle('secondary'), flex: 'none', marginTop: spacing.md, padding: `${spacing.sm} ${spacing.lg}` }}
            onClick={loadContracts}
          >
            Thử lại
          </button>
        </div>
      );
    }

    const contractStatusColor = (s: ContractDto['status']) =>
      s === 'active'
        ? colors.primary.agriGreen
        : s === 'pending_change'
          ? colors.functional.warningYellow
          : s === 'completed'
            ? colors.primary.zaloBlue
            : colors.text.secondary;

    const formatCurrency = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

    return (
      <>
        <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.md, display: 'block' }}>
          Hợp đồng với thương lái (theo JWT người mua).
        </Text>
        {contractItems.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📄</div>
            <Text.Title size="small" style={{ marginBottom: spacing.sm }}>Chưa có hợp đồng</Text.Title>
            <Text size="small" style={{ color: colors.text.secondary }}>
              Sau khi chấp nhận đề xuất, hợp đồng sẽ hiển thị tại đây
            </Text>
          </div>
        ) : (
          contractItems.map((c) => {
            const cColor = contractStatusColor(c.status);
            const traderLine = `Thương lái: ${traderDisplayName(c.partyTraderId)}`;
            const start = new Date(c.startDate).toLocaleDateString('vi-VN');
            const end = new Date(c.endDate).toLocaleDateString('vi-VN');

            return (
              <div key={c.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                  <div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      {contractTypeLabelVi(c.contractType)}
                    </Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                      {c.productId ? productDisplayName(c.productId) : 'Sản phẩm'}
                    </Text>
                    <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
                      {traderLine}
                    </Text>
                  </div>
                  <span style={statusBadgeStyle(cColor)}>{contractStatusLabelVi(c.status)}</span>
                </div>
                <div
                  style={{
                    padding: spacing.sm,
                    backgroundColor: colors.background.secondary,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Khối lượng</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold }}>
                      {c.quantity} {c.unit}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.xs }}>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>Tổng giá trị</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold }}>{formatCurrency(c.totalPrice)}</Text>
                  </div>
                  <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
                    Hiệu lực: {start} — {end}
                  </Text>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedContractId((x) => (x === c.id ? null : c.id))}
                  style={{
                    marginTop: spacing.md,
                    width: '100%',
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderRadius: '8px',
                    border: `1px solid ${colors.primary.zaloBlue}`,
                    backgroundColor: expandedContractId === c.id ? `${colors.primary.zaloBlue}12` : 'transparent',
                    color: colors.primary.zaloBlue,
                    fontSize: fontSize.small,
                    fontWeight: fontWeight.semibold,
                    cursor: 'pointer',
                  }}
                >
                  {expandedContractId === c.id ? 'Ẩn yêu cầu thay đổi' : 'Yêu cầu thay đổi hợp đồng'}
                </button>
                {expandedContractId === c.id && (
                  <ContractChangeRequestsPanel
                    contractId={c.id}
                    contract={c}
                    viewerRole="buyer"
                    onMutationSuccess={loadContracts}
                  />
                )}
              </div>
            );
          })
        )}
      </>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const tabConfig: { id: TabType; label: string; badge?: number }[] = [
    {
      id: 'proposals',
      label: 'Đề xuất',
      badge: pendingProposals.length > 0 ? pendingProposals.length : undefined,
    },
    { id: 'active', label: 'Đang thực hiện' },
    { id: 'history', label: 'Lịch sử' },
    {
      id: 'contracts',
      label:
        contractLoaded && contractItems.length > 0
          ? `Hợp đồng (${contractItems.length})`
          : 'Hợp đồng',
    },
  ];

  return (
    <RoleAppShell role="buyer" className="buyer-orders-proposals-screen">
      {/* Header */}
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
            Quản lý đơn hàng
          </Text>
          <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
            {buyerName}
          </Text.Title>
        </div>
        <BuyerNotificationBell />
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {tabConfig.map(({ id, label, badge }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              style={{
                flex: 1,
                padding: spacing.md,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive
                  ? `2px solid ${colors.primary.zaloBlue}`
                  : '2px solid transparent',
                color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
                fontSize: fontSize.caption,
                fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
              }}
              onClick={() => setActiveTab(id)}
            >
              {label}
              {badge != null && (
                <span
                  style={{
                    padding: '1px 6px',
                    backgroundColor: colors.functional.alertRed,
                    color: colors.text.inverse,
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: fontWeight.bold,
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: spacing.md, paddingBottom: spacing.xl }}>
        {activeTab === 'proposals'  && renderProposalsTab()}
        {activeTab === 'active'     && renderActiveOrdersTab()}
        {activeTab === 'history'    && renderHistoryTab()}
        {activeTab === 'contracts' && renderContractsTab()}
      </div>
    </RoleAppShell>
  );
};

export default BuyerOrdersProposalsScreen;
