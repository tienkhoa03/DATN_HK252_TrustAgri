/**
 * Farmer Market & Connect Screen — Phase 8.2 Integration (FR-F02, FR-F03, US-F04)
 *
 * Tabs:
 *  1. "Kết nối" — Lời mời đến (incoming pending), tìm thương lái, gửi yêu cầu
 *  2. "Thị trường" — Biểu đồ giá 7 ngày + dự báo xu hướng
 *
 * Data: connectionService → Axios thật (GET /api/v1/traders/search, /connections*, POST /connections*)
 * Token: gắn tự động bởi request interceptor (interceptors.ts).
 * Lỗi: ApiError → Snackbar tiếng Việt qua toConnectionViMessage.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, Input } from 'zmp-ui';
import { RoleAppShell } from '@/navigation/RoleAppShell';
import { useNavigate } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { Chart } from '../../../design-system/components/Chart';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  searchTraders,
  listConnections,
  createConnection,
  acceptConnection,
  rejectConnection,
  toConnectionViMessage,
} from '@/services/connectionService';
import type {
  TraderSearchResultDto,
  ConnectionDto,
} from '@/services/connectionService';

// ── Helpers ───────────────────────────────────────────────────────────────────

const REGION_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'TP. Hồ Chí Minh', label: 'TP.HCM' },
  { value: 'Tiền Giang', label: 'Tiền Giang' },
  { value: 'Bến Tre', label: 'Bến Tre' },
  { value: 'Đồng Tháp', label: 'Đồng Tháp' },
  { value: 'Long An', label: 'Long An' },
  { value: 'Vĩnh Long', label: 'Vĩnh Long' },
];

function trustColor(score: number) {
  if (score >= 90) return colors.primary.agriGreen;
  if (score >= 80) return colors.primary.zaloBlue;
  return colors.functional.warningYellow;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hôm nay';
  if (days === 1) return '1 ngày trước';
  return `${days} ngày trước`;
}

/** Tên hiển thị cho bên đối tác trong ConnectionDto (thực tế backend không trả tên) */
function counterpartDisplay(conn: ConnectionDto): string {
  // Backend v1 chưa embed tên — hiển thị placeholder đến khi Phase 15 cung cấp
  return `Thương lái (ID: ...${conn.fromUserId.slice(-4)})`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ width?: string; height?: string; br?: string }> = ({
  width = '100%', height = '14px', br = '4px',
}) => (
  <div
    className="skeleton-pulse"
    style={{ width, height, borderRadius: br, backgroundColor: colors.background.secondary }}
  />
);

const TraderCardSkeleton: React.FC = () => (
  <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: spacing.md }}>
    <div style={{ display: 'flex', gap: spacing.md }}>
      <SkeletonBlock width="48px" height="48px" br="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        <SkeletonBlock width="60%" height="16px" />
        <SkeletonBlock width="40%" height="12px" />
        <SkeletonBlock width="80%" height="12px" />
        <SkeletonBlock width="100%" height="34px" br="8px" />
      </div>
    </div>
  </div>
);

const InviteCardSkeleton: React.FC = () => (
  <div style={{ padding: spacing.md, backgroundColor: '#FFF9E6', borderRadius: 12, border: `1px solid ${colors.functional.warningYellow}30`, marginBottom: spacing.md }}>
    <div style={{ display: 'flex', gap: spacing.md }}>
      <SkeletonBlock width="48px" height="48px" br="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        <SkeletonBlock width="55%" height="16px" />
        <SkeletonBlock width="70%" height="12px" />
        <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.xs }}>
          <SkeletonBlock width="45%" height="34px" br="8px" />
          <SkeletonBlock width="45%" height="34px" br="8px" />
        </div>
      </div>
    </div>
  </div>
);

// ── Price chart data generation (static — Phase 16 sẽ lấy từ /forecasts) ─────

function genPriceHistory() {
  const base = 120000;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { date: d, price: base + (Math.random() * 20000 - 10000) };
  });
}

function genPriceForecast(history: { date: Date; price: number }[]) {
  const last = history[history.length - 1].price;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { date: d, price: last + 5000 * (i + 1) + (Math.random() * 15000 - 7500) };
  });
}

const priceHistory = genPriceHistory();
const priceForecast = genPriceForecast(priceHistory);
const chartData = [
  ...priceHistory.map((d) => ({
    label: d.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    value: d.price / 1000,
  })),
  ...priceForecast.map((d) => ({
    label: d.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    value: d.price / 1000,
  })),
];

// ── Screen component ──────────────────────────────────────────────────────────

export const FarmerMarketConnectScreen: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'connect' | 'market'>('connect');
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('all');

  // ── Incoming connections (lời mời đến — GET /api/v1/connections?role=incoming&status=pending) ──
  const [incomingConns, setIncomingConns] = useState<ConnectionDto[]>([]);
  const [isIncomingLoading, setIsIncomingLoading] = useState(true);
  const incomingLoadedRef = useRef(false);

  const loadIncoming = useCallback(async () => {
    if (incomingLoadedRef.current) return;
    setIsIncomingLoading(true);
    try {
      const res = await listConnections({ role: 'incoming', status: 'pending' });
      setIncomingConns(res.items);
      incomingLoadedRef.current = true;
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'list'), duration: 3500, icon: true });
    } finally {
      setIsIncomingLoading(false);
    }
  }, [openSnackbar]);

  useEffect(() => { loadIncoming(); }, [loadIncoming]);

  // ── Trader search (GET /api/v1/traders/search) ─────────────────────────────
  const [traders, setTraders] = useState<TraderSearchResultDto[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(true);
  const searchKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const loadTraders = useCallback(async (kw: string, reg: string) => {
    const key = `${kw}|${reg}`;
    if (searchKeyRef.current === key || inFlightRef.current) return;
    inFlightRef.current = true;
    setIsSearchLoading(true);
    try {
      const res = await searchTraders({ keyword: kw || undefined, region: reg });
      setTraders(res.items);
      searchKeyRef.current = key;
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'search'), duration: 3500, icon: true });
    } finally {
      setIsSearchLoading(false);
      inFlightRef.current = false;
    }
  }, [openSnackbar]);

  useEffect(() => { loadTraders('', 'all'); }, [loadTraders]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});

  const handleAccept = async (conn: ConnectionDto) => {
    setPendingActions((p) => ({ ...p, [conn.id]: true }));
    try {
      await acceptConnection(conn.id);
      setIncomingConns((prev) => prev.filter((c) => c.id !== conn.id));
      openSnackbar({ type: 'success', text: 'Đã chấp nhận yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setPendingActions((p) => { const n = { ...p }; delete n[conn.id]; return n; });
    }
  };

  const handleReject = async (conn: ConnectionDto) => {
    setPendingActions((p) => ({ ...p, [conn.id]: true }));
    try {
      await rejectConnection(conn.id);
      setIncomingConns((prev) => prev.filter((c) => c.id !== conn.id));
      openSnackbar({ type: 'success', text: 'Đã từ chối yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setPendingActions((p) => { const n = { ...p }; delete n[conn.id]; return n; });
    }
  };

  const handleSendRequest = async (trader: TraderSearchResultDto) => {
    if (trader.connectionStatus !== 'none') return;
    setPendingActions((p) => ({ ...p, [trader.userId]: true }));
    try {
      await createConnection({
        toUserId: trader.userId,
        message: 'Tôi muốn kết nối để hợp tác cung cấp nông sản.',
      });
      setTraders((prev) =>
        prev.map((t) =>
          t.userId === trader.userId ? { ...t, connectionStatus: 'pending_sent' } : t,
        ),
      );
      openSnackbar({ type: 'success', text: `Đã gửi yêu cầu kết nối tới ${trader.displayName}.`, duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'create'), duration: 3000, icon: true });
    } finally {
      setPendingActions((p) => { const n = { ...p }; delete n[trader.userId]; return n; });
    }
  };

  const handleSearch = () => {
    searchKeyRef.current = null;
    loadTraders(keyword, region);
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${active ? colors.primary.agriGreen : 'transparent'}`,
    color: active ? colors.primary.agriGreen : colors.text.secondary,
    fontSize: fontSize.body,
    fontWeight: active ? fontWeight.semibold : fontWeight.regular,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const statusBadge = (status: TraderSearchResultDto['connectionStatus']): React.CSSProperties => ({
    display: 'inline-block',
    padding: `2px ${spacing.sm}`,
    borderRadius: 99,
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    backgroundColor:
      status === 'accepted' ? `${colors.primary.agriGreen}18` :
      status === 'pending_sent' || status === 'pending_received' ? `${colors.functional.warningYellow}18` :
      colors.background.secondary,
    color:
      status === 'accepted' ? colors.primary.agriGreen :
      status === 'pending_sent' || status === 'pending_received' ? colors.functional.warningYellow :
      colors.text.secondary,
  });

  const connectionStatusLabel: Record<TraderSearchResultDto['connectionStatus'], string> = {
    none: '',
    pending_sent: 'Đã gửi yêu cầu',
    pending_received: 'Đang chờ bạn duyệt',
    accepted: 'Đã kết nối',
  };

  return (
    <RoleAppShell role="farmer" className="farmer-market-connect-screen">
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        .skeleton-pulse { animation: skeleton-pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderBottom: `1px solid ${colors.background.secondary}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text.Title size="small" style={{ margin: 0 }}>Thị trường &amp; Kết nối</Text.Title>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Tìm thương lái, quản lý kết nối</Text>
          </div>
          <button
            onClick={() => navigate('/farmer/connections')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: spacing.xs }}
            aria-label="Danh sách kết nối"
          >
            <Icon name="users" size="md" color={colors.primary.zaloBlue} />
            <Text size="xSmall" style={{ color: colors.primary.zaloBlue, margin: 0 }}>Kết nối</Text>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${colors.background.secondary}`, backgroundColor: colors.background.primary }}>
        <button style={tabBtn(activeTab === 'connect')} onClick={() => setActiveTab('connect')}>
          🤝 Đối tác
        </button>
        <button style={tabBtn(activeTab === 'market')} onClick={() => setActiveTab('market')}>
          📈 Thị trường
        </button>
      </div>

      <div style={{ padding: spacing.md, paddingBottom: 80, overflowY: 'auto' }}>

        {/* ── Connect tab ── */}
        {activeTab === 'connect' && (
          <>
            {/* Incoming invitations */}
            <div style={{ marginBottom: spacing.lg }}>
              <Text.Title size="small" style={{ marginBottom: spacing.sm, margin: 0 }}>
                Lời mời kết nối {!isIncomingLoading && incomingConns.length > 0 && `(${incomingConns.length})`}
              </Text.Title>
              <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
                Thương lái gửi yêu cầu hợp tác thu mua nông sản của bạn
              </Text>

              {isIncomingLoading ? (
                <><InviteCardSkeleton /><InviteCardSkeleton /></>
              ) : incomingConns.length === 0 ? (
                <div style={{ padding: spacing.md, backgroundColor: colors.background.secondary, borderRadius: 12, textAlign: 'center' }}>
                  <Text size="small" style={{ color: colors.text.secondary }}>Không có lời mời kết nối nào</Text>
                </div>
              ) : (
                incomingConns.map((conn) => {
                  const name = counterpartDisplay(conn);
                  return (
                    <div
                      key={conn.id}
                      style={{ padding: spacing.md, backgroundColor: '#FFF9E6', borderRadius: 12, border: `1px solid ${colors.functional.warningYellow}30`, marginBottom: spacing.md, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}
                    >
                      <div style={{ display: 'flex', gap: spacing.md }}>
                        <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: '50%', backgroundColor: colors.primary.agriGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.h2 }}>
                          {name.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                            {name}
                          </Text>
                          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                            {relativeDate(conn.createdAt)}
                          </Text>
                          {conn.message && (
                            <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.xs, fontStyle: 'italic' }}>
                              "{conn.message}"
                            </Text>
                          )}
                          <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => handleAccept(conn)}
                              disabled={!!pendingActions[conn.id]}
                              style={{ flex: 1 }}
                            >
                              ✓ Chấp nhận
                            </Button>
                            <Button
                              variant="outline"
                              size="small"
                              onClick={() => handleReject(conn)}
                              disabled={!!pendingActions[conn.id]}
                              style={{ flex: 1 }}
                            >
                              ✕ Từ chối
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Search traders */}
            <div>
              <Text.Title size="small" style={{ marginBottom: spacing.xs, margin: 0 }}>
                Tìm kiếm thương lái uy tín
              </Text.Title>
              <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
                Chủ động kết nối với thương lái phù hợp cho nông sản của bạn
              </Text>

              {/* Search bar */}
              <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.sm }}>
                <Input
                  type="text"
                  placeholder="Tên, công ty, khu vực..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleSearch}
                  style={{ padding: `0 ${spacing.md}`, borderRadius: 8, border: `1px solid ${colors.primary.zaloBlue}`, backgroundColor: colors.primary.zaloBlue, color: '#fff', cursor: 'pointer', fontWeight: fontWeight.semibold }}
                >
                  Tìm
                </button>
              </div>

              {/* Region filter chips */}
              <div style={{ display: 'flex', gap: spacing.xs, overflowX: 'auto', paddingBottom: spacing.xs, marginBottom: spacing.md }}>
                {REGION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setRegion(opt.value); searchKeyRef.current = null; loadTraders(keyword, opt.value); }}
                    style={{
                      padding: `4px ${spacing.sm}`, borderRadius: 99, whiteSpace: 'nowrap', cursor: 'pointer',
                      border: `1px solid ${region === opt.value ? colors.primary.zaloBlue : colors.background.secondary}`,
                      backgroundColor: region === opt.value ? `${colors.primary.zaloBlue}15` : colors.background.primary,
                      color: region === opt.value ? colors.primary.zaloBlue : colors.text.secondary,
                      fontSize: fontSize.small, fontWeight: region === opt.value ? fontWeight.semibold : fontWeight.regular,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Trader list */}
              {isSearchLoading ? (
                <><TraderCardSkeleton /><TraderCardSkeleton /><TraderCardSkeleton /></>
              ) : traders.length === 0 ? (
                <div style={{ padding: spacing.xl, textAlign: 'center' }}>
                  <Icon name="search" size="lg" color={colors.text.secondary} />
                  <Text style={{ marginTop: spacing.md, color: colors.text.secondary }}>
                    Không tìm thấy thương lái phù hợp
                  </Text>
                </div>
              ) : (
                traders.map((trader) => {
                  const isPending = !!pendingActions[trader.userId];
                  return (
                    <div
                      key={trader.userId}
                      style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: spacing.md }}
                    >
                      <div style={{ display: 'flex', gap: spacing.md }}>
                        <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: '50%', backgroundColor: colors.primary.zaloBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.h2 }}>
                          {trader.displayName.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                            {trader.displayName}
                          </Text>
                          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                            📍 {trader.traderProfile.region} · {trader.traderProfile.capacity}
                          </Text>
                          <div style={{ marginTop: spacing.xs }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: `2px ${spacing.sm}`, borderRadius: 4, fontSize: fontSize.small, fontWeight: fontWeight.semibold, backgroundColor: `${trustColor(trader.traderProfile.trustScore)}15`, color: trustColor(trader.traderProfile.trustScore) }}>
                              ⭐ {trader.traderProfile.trustScore}/100
                            </span>
                          </div>
                          {trader.connectionStatus !== 'none' ? (
                            <div style={{ marginTop: spacing.sm }}>
                              <span style={statusBadge(trader.connectionStatus)}>
                                {connectionStatusLabel[trader.connectionStatus]}
                              </span>
                            </div>
                          ) : (
                            <div style={{ marginTop: spacing.sm }}>
                              <Button
                                variant="primary"
                                size="small"
                                onClick={() => handleSendRequest(trader)}
                                disabled={isPending}
                                style={{ width: '100%' }}
                              >
                                {isPending ? 'Đang gửi...' : '📤 Gửi yêu cầu kết nối'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ── Market tab (Phase 16 sẽ lấy từ /news và /forecasts) ── */}
        {activeTab === 'market' && (
          <>
            <div style={{ marginBottom: spacing.lg }}>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                Biểu đồ giá Sầu riêng
              </Text.Title>
              <Card>
                <div style={{ marginBottom: spacing.md }}>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>Giá hiện tại</Text>
                  <Text.Title size="large" style={{ color: colors.primary.agriGreen, margin: 0 }}>
                    {(priceHistory[priceHistory.length - 1].price / 1000).toFixed(0)}k VND/kg
                  </Text.Title>
                </div>
                <Chart
                  type="line"
                  data={chartData}
                  xAxis={{ label: 'Ngày' }}
                  yAxis={{ label: 'Giá (nghìn VND)' }}
                  colors={[colors.primary.agriGreen]}
                  showGrid
                  showLegend={false}
                  width={320}
                  height={200}
                />
                <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.sm }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 3, backgroundColor: colors.primary.agriGreen, borderRadius: 2 }} />
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>7 ngày qua</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 3, backgroundColor: colors.primary.agriGreen, borderRadius: 2, opacity: 0.4 }} />
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Dự báo 7 ngày tới</Text>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>Phân tích xu hướng</Text.Title>
              <Card status="success">
                <div style={{ display: 'flex', gap: spacing.md }}>
                  <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: '50%', backgroundColor: `${colors.primary.agriGreen}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="trending-up" size="lg" color={colors.primary.agriGreen} />
                  </div>
                  <div>
                    <Text size="normal" style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen, margin: 0 }}>
                      Xu hướng tăng giá
                    </Text>
                    <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
                      Dự báo giá Sầu riêng tăng 5–8% tuần tới do nhu cầu xuất khẩu tăng cao.
                    </Text>
                    <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
                      💡 Đây là thời điểm tốt để thu hoạch và đàm phán giá bán.
                    </Text>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>Tin tức thị trường</Text.Title>
              <Card>
                <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                  📰 Nhu cầu xuất khẩu Sầu riêng tăng mạnh
                </Text>
                <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>2 giờ trước</Text>
                <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
                  Thị trường Trung Quốc và Nhật Bản tăng cường nhập khẩu sầu riêng chất lượng cao...
                </Text>
              </Card>
              <div style={{ marginTop: spacing.md }}>
                <Card>
                  <Text size="normal" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                    🌦️ Dự báo thời tiết thuận lợi cho thu hoạch
                  </Text>
                  <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>5 giờ trước</Text>
                  <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
                    Thời tiết khô ráo trong 7 ngày tới, thuận lợi cho việc thu hoạch và vận chuyển...
                  </Text>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </RoleAppShell>
  );
};

export default FarmerMarketConnectScreen;
