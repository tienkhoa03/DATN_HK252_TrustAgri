/**
 * BuyerTransactionHistoryScreen — Phase 19.2 (FR-U06)
 * Route: /buyer/history
 *
 * GET /api/v1/orders?buyerId=me&…&includeSummary=true
 * GET /api/v1/contracts?role=buyer&buyerId=me&…&includeSummary=true
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Page, Text, Spinner, useNavigate } from 'zmp-ui';
import { Icon } from '@/design-system/components/Icon';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listOrders,
  orderStatusLabel,
  productDisplayName,
  toOrderViMessage,
  traderDisplayName,
  type ListOrdersResponse,
  type OrderDto,
} from '@/services/orderService';
import {
  listContracts,
  contractStatusLabelVi,
  contractTypeLabelVi,
  toContractViMessage,
  type ContractDto,
  type ListResponse,
} from '@/services/contractService';
import { BuyerNotificationBell } from '@/screens/buyer/components/BuyerNotificationBell';
import { TraderReviewModal } from '@/components/buyer/TraderReviewModal';

/** Chuỗi ngày từ input type=date → ISO đầu/cuối ngày (VN) cho query backend */
function toApiDateRange(
  fromYmd: string | undefined,
  toYmd: string | undefined,
): { from?: string; to?: string } {
  if (!fromYmd?.trim() && !toYmd?.trim()) return {};
  return {
    ...(fromYmd?.trim() ? { from: `${fromYmd.trim()}T00:00:00.000+07:00` } : {}),
    ...(toYmd?.trim() ? { to: `${toYmd.trim()}T23:59:59.999+07:00` } : {}),
  };
}

type TabId = 'orders' | 'contracts';

const PAGE_SIZE = 5;

function formatVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

const SkeletonCard: React.FC = () => (
  <div
    style={{
      backgroundColor: colors.background.primary,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}
  >
    {[70, 55, 40].map((w, i) => (
      <div
        key={i}
        style={{
          height: 12,
          width: `${w}%`,
          backgroundColor: colors.background.secondary,
          borderRadius: 6,
          marginBottom: spacing.sm,
        }}
      />
    ))}
  </div>
);

const ORDER_STATUS_OPTIONS: Array<{ value: OrderDto['status'] | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'pending', label: orderStatusLabel('pending') },
  { value: 'accepted', label: orderStatusLabel('accepted') },
  { value: 'rejected', label: orderStatusLabel('rejected') },
  { value: 'cancelled', label: orderStatusLabel('cancelled') },
  { value: 'contracted', label: orderStatusLabel('contracted') },
  { value: 'completed', label: orderStatusLabel('completed') },
];

const CONTRACT_STATUS_OPTIONS: Array<{ value: ContractDto['status'] | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: contractStatusLabelVi('active') },
  { value: 'pending_change', label: contractStatusLabelVi('pending_change') },
  { value: 'completed', label: contractStatusLabelVi('completed') },
  { value: 'cancelled', label: contractStatusLabelVi('cancelled') },
];

export const BuyerTransactionHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();

  const [tab, setTab] = useState<TabId>('orders');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderDto['status'] | 'all'>('all');
  const [contractStatus, setContractStatus] = useState<ContractDto['status'] | 'all'>('all');
  const [orderPage, setOrderPage] = useState(1);
  const [contractPage, setContractPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<ListOrdersResponse | null>(null);
  const [contractData, setContractData] = useState<ListResponse<ContractDto> | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [contractError, setContractError] = useState<string | null>(null);

  const [reviewModal, setReviewModal] = useState<{ traderId: string; orderId: string } | null>(null);

  const appliedFilters = useMemo(
    () => toApiDateRange(draftFrom, draftTo),
    [draftFrom, draftTo],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setOrderError(null);
    setContractError(null);

    const range = appliedFilters;
    // eslint-disable-next-line @typescript-eslint/comma-dangle
    const settle = <T,>(p: Promise<T>) =>
      p.then((v) => ({ ok: true as const, value: v })).catch((e) => ({ ok: false as const, reason: e }));

    const [oRes, cRes] = await Promise.all([
      settle(listOrders({
        buyerId: 'me',
        status: orderStatus,
        from: range.from,
        to: range.to,
        page: orderPage,
        limit: PAGE_SIZE,
        includeSummary: true,
      })),
      settle(listContracts({
        role: 'buyer',
        buyerId: 'me',
        status: contractStatus,
        from: range.from,
        to: range.to,
        page: contractPage,
        limit: PAGE_SIZE,
        includeSummary: true,
      })),
    ]);

    const snackTexts: string[] = [];

    if (oRes.ok) {
      setOrderData(oRes.value);
    } else {
      setOrderData(null);
      const msg = toOrderViMessage(oRes.reason, 'list');
      setOrderError(msg);
      snackTexts.push(msg);
    }

    if (cRes.ok) {
      setContractData(cRes.value);
    } else {
      setContractData(null);
      const msg = toContractViMessage(cRes.reason, 'list');
      setContractError(msg);
      snackTexts.push(msg);
    }

    if (snackTexts.length > 0) {
      openSnackbar({
        type: 'error',
        text: snackTexts.join(' '),
        duration: Math.min(8000, 3200 + snackTexts.length * 800),
        icon: true,
      });
    }

    setLoading(false);
  }, [
    appliedFilters,
    contractPage,
    contractStatus,
    openSnackbar,
    orderPage,
    orderStatus,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setDraftFrom(from);
    setDraftTo(to);
    setOrderPage(1);
    setContractPage(1);
  };

  const orderTotalPages = orderData ? Math.max(1, Math.ceil(orderData.total / PAGE_SIZE)) : 1;
  const contractTotalPages = contractData ? Math.max(1, Math.ceil(contractData.total / PAGE_SIZE)) : 1;

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  const kpiBox: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    padding: spacing.sm,
  };

  return (
    <Page className="buyer-transaction-history-screen">
      <div
        style={{
          padding: spacing.md,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <button
          type="button"
          aria-label="Quay lại"
          onClick={() => navigate(-1)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: spacing.xs,
            cursor: 'pointer',
            lineHeight: 0,
          }}
        >
          <Icon name="chevron-left" size="md" color={colors.text.primary} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
            Người mua
          </Text>
          <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
            Lịch sử giao dịch
          </Text.Title>
        </div>
        <BuyerNotificationBell />
      </div>

      <div style={{ padding: spacing.md }}>
        <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.sm, display: 'block' }}>
          Lọc theo khoảng thời gian (ngày tạo đơn / hợp đồng), trạng thái và phân trang. Dữ liệu từ API (JWT qua
          interceptor).
        </Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.md }}>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <label style={{ flex: 1, fontSize: fontSize.caption, color: colors.text.secondary }}>
              Từ ngày
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: spacing.sm,
                  borderRadius: 8,
                  border: `1px solid ${colors.background.tertiary}`,
                  fontSize: fontSize.small,
                }}
              />
            </label>
            <label style={{ flex: 1, fontSize: fontSize.caption, color: colors.text.secondary }}>
              Đến ngày
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: spacing.sm,
                  borderRadius: 8,
                  border: `1px solid ${colors.background.tertiary}`,
                  fontSize: fontSize.small,
                }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={applyFilters}
            style={{
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: 8,
              border: 'none',
              backgroundColor: colors.primary.zaloBlue,
              color: colors.text.inverse,
              fontWeight: fontWeight.semibold,
              fontSize: fontSize.small,
              cursor: 'pointer',
            }}
          >
            Áp dụng bộ lọc
          </button>
        </div>

        {/* KPI — includeSummary từ API */}
        {!loading && (orderData?.summary || contractData?.summary) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.md }}>
            <Text size="small" style={{ color: colors.text.secondary, margin: 0, fontWeight: fontWeight.semibold }}>
              Tóm tắt (includeSummary=true)
            </Text>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              {orderData?.summary && (
                <div style={kpiBox}>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>Đơn hàng hoàn tất</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.bold, margin: '4px 0 0' }}>
                    {orderData.summary.completedCount} đơn
                  </Text>
                  <Text size="small" style={{ color: colors.primary.agriGreen, margin: '4px 0 0' }}>
                    {formatVnd(orderData.summary.totalSpent)}
                  </Text>
                </div>
              )}
              {contractData?.summary && (
                <div style={kpiBox}>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>Hợp đồng hoàn tất</Text>
                  <Text size="small" style={{ fontWeight: fontWeight.bold, margin: '4px 0 0' }}>
                    {contractData.summary.completedCount} hợp đồng
                  </Text>
                  <Text size="small" style={{ color: colors.primary.zaloBlue, margin: '4px 0 0' }}>
                    {formatVnd(contractData.summary.totalSpent)}
                  </Text>
                </div>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            marginBottom: spacing.md,
            borderBottom: `1px solid ${colors.background.secondary}`,
          }}
        >
          {(
            [
              { id: 'orders' as const, label: 'Đơn hàng' },
              { id: 'contracts' as const, label: 'Hợp đồng' },
            ] as const
          ).map(({ id, label }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  border: 'none',
                  borderBottom: active ? `2px solid ${colors.primary.zaloBlue}` : '2px solid transparent',
                  background: 'transparent',
                  color: active ? colors.primary.zaloBlue : colors.text.secondary,
                  fontWeight: active ? fontWeight.semibold : fontWeight.regular,
                  fontSize: fontSize.caption,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === 'orders' && (
          <div style={{ marginBottom: spacing.md }}>
            <Text size="small" style={{ color: colors.text.secondary, marginBottom: 6, display: 'block' }}>
              Trạng thái đơn
            </Text>
            <select
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value as OrderDto['status'] | 'all');
                setOrderPage(1);
              }}
              style={{
                width: '100%',
                padding: spacing.sm,
                borderRadius: 8,
                border: `1px solid ${colors.background.tertiary}`,
                fontSize: fontSize.small,
              }}
            >
              {ORDER_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {tab === 'contracts' && (
          <div style={{ marginBottom: spacing.md }}>
            <Text size="small" style={{ color: colors.text.secondary, marginBottom: 6, display: 'block' }}>
              Trạng thái hợp đồng
            </Text>
            <select
              value={contractStatus}
              onChange={(e) => {
                setContractStatus(e.target.value as ContractDto['status'] | 'all');
                setContractPage(1);
              }}
              style={{
                width: '100%',
                padding: spacing.sm,
                borderRadius: 8,
                border: `1px solid ${colors.background.tertiary}`,
                fontSize: fontSize.small,
              }}
            >
              {CONTRACT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: spacing.xl }}>
            <Spinner />
            <Text size="small" style={{ color: colors.text.secondary }}>
              Đang tải…
            </Text>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && tab === 'orders' && orderError && !orderData && (
          <EmptyState icon="⚠️" title="Không tải được đơn hàng" description={orderError} cta={{ label: 'Thử lại', onClick: () => load() }} />
        )}

        {!loading && tab === 'orders' && orderData && (
          <>
            {orderData.items.length === 0 ? (
              <EmptyState icon="📦" title="Không có đơn hàng phù hợp" description="Thử thay đổi bộ lọc để xem kết quả." />
            ) : (
              orderData.items.map((order) => (
                <div key={order.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                        {traderDisplayName(order.traderId)}
                      </Text>
                      <Text size="small" style={{ color: colors.text.secondary, margin: '4px 0 0' }}>
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </Text>
                    </div>
                    <span
                      style={{
                        fontSize: fontSize.small,
                        fontWeight: fontWeight.semibold,
                        color: colors.primary.zaloBlue,
                        backgroundColor: `${colors.primary.zaloBlue}18`,
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {orderStatusLabel(order.status)}
                    </span>
                  </div>
                  <Text size="small" style={{ marginTop: spacing.sm, fontWeight: fontWeight.medium }}>
                    {productDisplayName(order.productId)}
                  </Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.sm }}>
                    <Text size="small" style={{ color: colors.text.secondary }}>
                      {order.quantity} {order.unit}
                    </Text>
                    <Text size="small" style={{ fontWeight: fontWeight.bold }}>
                      {formatVnd(order.totalPrice)}
                    </Text>
                  </div>
                  {order.status === 'completed' && (
                    <div style={{ marginTop: spacing.sm }}>
                      <button
                        type="button"
                        onClick={() => setReviewModal({ traderId: order.traderId, orderId: order.id })}
                        style={{
                          background: 'transparent',
                          border: `1px solid ${colors.primary.zaloBlue}`,
                          color: colors.primary.zaloBlue,
                          borderRadius: 8,
                          minHeight: 36,
                          padding: `0 ${spacing.md}`,
                          fontSize: 13,
                          fontWeight: fontWeight.semibold,
                          cursor: 'pointer',
                        }}
                      >
                        Đánh giá thương lái
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }}>
              <button
                type="button"
                disabled={orderPage <= 1}
                onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: 8,
                  border: `1px solid ${colors.background.tertiary}`,
                  background: orderPage <= 1 ? colors.background.secondary : colors.background.primary,
                  cursor: orderPage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Trước
              </button>
              <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                Trang {orderPage} / {orderTotalPages} · {orderData.total} bản ghi
              </Text>
              <button
                type="button"
                disabled={orderPage >= orderTotalPages}
                onClick={() => setOrderPage((p) => p + 1)}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: 8,
                  border: `1px solid ${colors.background.tertiary}`,
                  background: orderPage >= orderTotalPages ? colors.background.secondary : colors.background.primary,
                  cursor: orderPage >= orderTotalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Sau
              </button>
            </div>
          </>
        )}

        {!loading && tab === 'contracts' && contractError && !contractData && (
          <EmptyState icon="⚠️" title="Không tải được hợp đồng" description={contractError} cta={{ label: 'Thử lại', onClick: () => load() }} />
        )}

        {!loading && tab === 'contracts' && contractData && (
          <>
            {contractData.items.length === 0 ? (
              <EmptyState icon="📄" title="Không có hợp đồng phù hợp" description="Thử thay đổi bộ lọc để xem kết quả." />
            ) : (
              contractData.items.map((c) => (
                <div key={c.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                        {contractTypeLabelVi(c.contractType)}
                      </Text>
                      <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: '4px 0 0' }}>
                        {c.productId ? `Sản phẩm #${c.productId.slice(-6)}` : 'Hợp đồng'}
                      </Text>
                      <Text size="small" style={{ color: colors.text.secondary, margin: '4px 0 0' }}>
                        {new Date(c.createdAt).toLocaleString('vi-VN')}
                      </Text>
                    </div>
                    <span
                      style={{
                        fontSize: fontSize.small,
                        fontWeight: fontWeight.semibold,
                        color: colors.primary.agriGreen,
                        backgroundColor: `${colors.primary.agriGreen}20`,
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {contractStatusLabelVi(c.status)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.sm }}>
                    <Text size="small" style={{ color: colors.text.secondary }}>
                      {c.quantity} {c.unit}
                    </Text>
                    <Text size="small" style={{ fontWeight: fontWeight.bold }}>
                      {formatVnd(c.totalPrice)}
                    </Text>
                  </div>
                  <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
                    {c.startDate} → {c.endDate}
                  </Text>
                </div>
              ))
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }}>
              <button
                type="button"
                disabled={contractPage <= 1}
                onClick={() => setContractPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: 8,
                  border: `1px solid ${colors.background.tertiary}`,
                  background: contractPage <= 1 ? colors.background.secondary : colors.background.primary,
                  cursor: contractPage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                Trước
              </button>
              <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                Trang {contractPage} / {contractTotalPages} · {contractData.total} bản ghi
              </Text>
              <button
                type="button"
                disabled={contractPage >= contractTotalPages}
                onClick={() => setContractPage((p) => p + 1)}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: 8,
                  border: `1px solid ${colors.background.tertiary}`,
                  background: contractPage >= contractTotalPages ? colors.background.secondary : colors.background.primary,
                  cursor: contractPage >= contractTotalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Sau
              </button>
            </div>
          </>
        )}
      </div>

      {reviewModal && (
        <TraderReviewModal
          traderId={reviewModal.traderId}
          orderId={reviewModal.orderId}
          open={true}
          onClose={() => setReviewModal(null)}
          onSuccess={() => {
            openSnackbar({ text: 'Đã gửi đánh giá thành công!', type: 'success' });
          }}
        />
      )}
    </Page>
  );
};

export default BuyerTransactionHistoryScreen;
