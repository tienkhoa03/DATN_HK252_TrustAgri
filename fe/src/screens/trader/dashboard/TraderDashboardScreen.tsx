/**
 * Trader Dashboard Screen — Phase 17.2 (FR-T02)
 *
 * GET /api/v1/dashboard/trader qua dashboardService; biểu đồ lazy load.
 */

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Page, Box, Text, useNavigate } from 'zmp-ui';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { Icon } from '../../../design-system/components/Icon';
import type { ChartDataPoint } from '../../../design-system/components/Chart';
import { colors, chartPalette } from '../../../design-system/tokens/colors';
import { ConnectionStatusBanner } from '@/components/ConnectionStatusBanner';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import {
  fetchTraderDashboard,
  toDashboardViMessage,
  type DashboardTraderDto,
} from '@/services/dashboardService';
import { getMe } from '@/services/authService';
import { subscribeConnectionStatus } from '@/api/monitoringSocket';
import { orderStatusLabel, type OrderDto } from '@/services/orderService';

const LazyChart = lazy(() =>
  import('../../../design-system/components/Chart').then((m) => ({ default: m.Chart })),
);

const LazySparkline = lazy(() =>
  import('../../../design-system/components/Sparkline').then((m) => ({ default: m.Sparkline })),
);

export interface TraderDashboardScreenProps {
  traderName?: string;
  companyName?: string;
}

const ORDER_CARD_KEYS: OrderDto['status'][] = ['pending', 'accepted', 'contracted', 'completed'];

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return iso;
  }
}

function formatPeriod(fromIso: string, toIso: string): string {
  try {
    const o: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return `${new Date(fromIso).toLocaleDateString('vi-VN', o)} — ${new Date(toIso).toLocaleDateString('vi-VN', o)}`;
  } catch {
    return `${fromIso} — ${toIso}`;
  }
}

const SkeletonPulse: React.FC<{ h?: string }> = ({ h = '120px' }) => (
  <Box
    className="trader-dash-skel"
    style={{
      height: h,
      borderRadius: 8,
      backgroundColor: colors.background.secondary,
      animation: 'trader-dash-pulse 1.4s ease-in-out infinite',
    }}
  />
);

const ChartFallback: React.FC = () => (
  <div
    style={{
      height: 220,
      borderRadius: 8,
      backgroundColor: colors.background.secondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
      Đang tải biểu đồ…
    </Text>
  </div>
);

const RECONNECT_REFETCH_DEBOUNCE_MS = 60_000;

export const TraderDashboardScreen: React.FC<TraderDashboardScreenProps> = ({
  traderName: traderNameProp,
  companyName: companyNameProp,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7days' | '30days'>('7days');
  const [data, setData] = useState<DashboardTraderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [traderName, setTraderName] = useState(traderNameProp ?? '');
  const [companyName, setCompanyName] = useState(companyNameProp ?? '');
  const lastRefetchRef = useRef<number>(0);

  const doFetch = useMemo(
    () => () => {
      let cancelled = false;
      setLoading(true);
      setError(null);
      fetchTraderDashboard()
        .then((dto) => {
          if (!cancelled) {
            setData(dto);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            const msg = toDashboardViMessage(err);
            setError(msg);
            setLoading(false);
            openSnackbar({ type: 'error', text: msg, duration: 4500, icon: true });
          }
        });
      return () => { cancelled = true; };
    },
    [openSnackbar],
  );

  // Load profile (getMe) for real name + company
  useEffect(() => {
    if (traderNameProp && companyNameProp) return;
    let cancelled = false;
    getMe()
      .then((profile) => {
        if (cancelled) return;
        setTraderName(profile.displayName || '-');
        setCompanyName(profile.traderProfile?.companyName ?? '-');
      })
      .catch(() => {
        if (!cancelled) {
          setTraderName(traderNameProp ?? 'Thương lái');
          setCompanyName(companyNameProp ?? '-');
        }
      });
    return () => { cancelled = true; };
  }, [traderNameProp, companyNameProp]);

  // Initial dashboard fetch
  useEffect(() => {
    lastRefetchRef.current = Date.now();
    return doFetch();
  }, [doFetch]);

  // Auto-refetch on WS reconnect after downtime > 30s (debounce 60s)
  useEffect(() => {
    return subscribeConnectionStatus((status, info) => {
      if (status !== 'connected') return;
      if (!info || info.downtimeMs <= 30_000) return;
      const now = Date.now();
      if (now - lastRefetchRef.current < RECONNECT_REFETCH_DEBOUNCE_MS) return;
      lastRefetchRef.current = now;
      doFetch();
      openSnackbar({ type: 'success', text: 'Đã đồng bộ lại dữ liệu dashboard', duration: 3000, icon: true });
    });
  }, [doFetch, openSnackbar]);

  const demandChartData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];
    const sliceLen = selectedPeriod === 'today' ? 1 : selectedPeriod === '7days' ? 7 : data.demandTrend.length;
    const slice = data.demandTrend.slice(-sliceLen);
    return slice.map((d) => ({
      label: formatShortDate(d.date),
      value: d.requestCount,
    }));
  }, [data, selectedPeriod]);

  const topCropChartData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];
    return data.topCrops.map((c) => ({ label: c.cropType, value: c.volume }));
  }, [data]);

  // Last 7 data points of demandTrend for sparkline
  const sparkline7 = useMemo(() => {
    if (!data) return [];
    return data.demandTrend.slice(-7).map((d) => d.requestCount);
  }, [data]);

  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const metricCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: spacing.md,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: '44px',
  };

  const chartSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    margin: `0 ${spacing.md} ${spacing.md}`,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const periodSelectorStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.md,
  };

  const periodButtonStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: isActive ? colors.primary.zaloBlue : colors.background.secondary,
    color: isActive ? colors.text.inverse : colors.text.primary,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    transition: 'all 0.2s',
  });

  const contentStyles: React.CSSProperties = {
    paddingBottom: spacing.xl,
  };

  return (
    <Page className="trader-dashboard-screen">
      <style>{`
        @keyframes trader-dash-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
      <ConnectionStatusBanner />
      <div style={contentStyles}>
        <div style={headerStyles}>
          <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
            Xin chào,
          </Text>
          <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
            {traderName}
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {companyName}
          </Text>
          {data && (
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: `${spacing.xs} 0 0` }}>
              Kỳ thống kê: {formatPeriod(data.periodFrom, data.periodTo)}
            </Text>
          )}
        </div>

        {error && (
          <div style={{ padding: spacing.md }}>
            <Text size="small" style={{ color: colors.functional.alertRed }}>
              {error}
            </Text>
          </div>
        )}

        {loading && (
          <div style={{ padding: spacing.md, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <SkeletonPulse h="88px" />
            <SkeletonPulse h="88px" />
            <SkeletonPulse h="200px" />
          </div>
        )}

        {!loading && data && (
          <>
            {/* 3 tap-through metric cards — FR-T02 */}
            <div style={{ padding: spacing.md }}>
              {/* Card 1: Đơn hàng chờ duyệt */}
              <div
                role="button"
                tabIndex={0}
                style={metricCardStyles}
                onClick={() => navigate('/trader/transactions?flow=buyers&status=pending', { replace: false })}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/trader/transactions?flow=buyers&status=pending', { replace: false })}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.primary.zaloBlue}18`,
                    flexShrink: 0,
                  }}
                >
                  <Icon name="shopping-cart" size="lg" color={colors.primary.zaloBlue} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
                    {data.orderCountByStatus.pending ?? 0}
                  </Text.Title>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    Đơn từ người mua — chờ xác nhận
                  </Text>
                </div>
                <Suspense fallback={<div style={{ width: 80, height: 32 }} />}>
                  <LazySparkline
                    data={sparkline7}
                    width={80}
                    height={32}
                    color={colors.primary.zaloBlue}
                  />
                </Suspense>
              </div>

              {/* Card 2: Yêu cầu kết nối mới */}
              <div
                role="button"
                tabIndex={0}
                style={metricCardStyles}
                onClick={() => navigate('/trader/transactions?flow=farmers&status=pending', { replace: false })}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/trader/transactions?flow=farmers&status=pending', { replace: false })}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.primary.agriGreen}18`,
                    flexShrink: 0,
                  }}
                >
                  <Icon name="users" size="lg" color={colors.primary.agriGreen} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
                    {data.pendingConnections}
                  </Text.Title>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    Nông dân đang chờ phản hồi
                  </Text>
                </div>
                <Suspense fallback={<div style={{ width: 80, height: 32 }} />}>
                  <LazySparkline
                    data={sparkline7}
                    width={80}
                    height={32}
                    color={colors.primary.agriGreen}
                  />
                </Suspense>
              </div>

              {/* Card 3: Hợp đồng đang chạy */}
              <div
                role="button"
                tabIndex={0}
                style={{ ...metricCardStyles, marginBottom: 0 }}
                onClick={() => navigate('/trader/monitor', { replace: false })}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/trader/monitor', { replace: false })}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.functional.warningYellow}18`,
                    flexShrink: 0,
                  }}
                >
                  <Icon name="book" size="lg" color={colors.functional.warningYellow} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
                    {data.activeContracts}
                  </Text.Title>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    Vùng trồng đang theo dõi
                  </Text>
                </div>
                <Suspense fallback={<div style={{ width: 80, height: 32 }} />}>
                  <LazySparkline data={[]} width={80} height={32} />
                </Suspense>
              </div>
            </div>

            {/* Tin tức & dự báo giá từ thương lái khác */}
            <div style={{ padding: `0 ${spacing.md} ${spacing.md}` }}>
              <button
                type="button"
                onClick={() => navigate('/trader/news-feed')}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.background.primary,
                  border: `1px solid ${colors.background.secondary}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  minHeight: 56,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <span style={{ fontSize: '24px' }}>📰</span>
                  <div style={{ textAlign: 'left' }}>
                    <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                      Tin tức & Dự báo từ thương lái
                    </Text>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      Tham khảo thông tin thị trường công khai
                    </Text>
                  </div>
                </div>
                <span style={{ fontSize: '18px', color: colors.text.secondary }}>›</span>
              </button>
            </div>

            <div style={{ padding: `0 ${spacing.md} ${spacing.md}` }}>
              <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}` }}>
                Đơn hàng theo trạng thái
              </Text.Title>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: spacing.sm,
                }}
              >
                {ORDER_CARD_KEYS.map((key) => {
                  const n = data.orderCountByStatus[key] ?? 0;
                  return (
                    <div
                      key={key}
                      style={{
                        padding: spacing.sm,
                        backgroundColor: colors.background.secondary,
                        borderRadius: 8,
                        minWidth: '80px',
                      }}
                    >
                      <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                        {orderStatusLabel(key)}
                      </Text>
                      <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.bold }}>
                        {n}
                      </Text.Title>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ ...chartSectionStyles, marginTop: spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text.Title size="small" style={{ margin: 0 }}>
                  Xu hướng nhu cầu mua
                </Text.Title>
                <Icon name="trending-up" size="md" color={colors.primary.agriGreen} />
              </div>

              <div style={periodSelectorStyles}>
                <button
                  type="button"
                  style={periodButtonStyles(selectedPeriod === 'today')}
                  onClick={() => setSelectedPeriod('today')}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  style={periodButtonStyles(selectedPeriod === '7days')}
                  onClick={() => setSelectedPeriod('7days')}
                >
                  7 ngày
                </button>
                <button
                  type="button"
                  style={periodButtonStyles(selectedPeriod === '30days')}
                  onClick={() => setSelectedPeriod('30days')}
                >
                  30 ngày
                </button>
              </div>

              <div style={{ marginTop: spacing.md }}>
                {demandChartData.length === 0 ? (
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    Chưa có dữ liệu xu hướng nhu cầu trong kỳ này.
                  </Text>
                ) : (
                  <Suspense fallback={<ChartFallback />}>
                    <LazyChart
                      type="area"
                      data={demandChartData}
                      xAxis={{ label: 'Ngày' }}
                      yAxis={{ label: 'Số nhu cầu' }}
                      colors={[colors.primary.agriGreen]}
                      showGrid
                      showLegend={false}
                      width={340}
                      height={220}
                    />
                  </Suspense>
                )}
              </div>
            </div>

            <div style={chartSectionStyles}>
              <Text.Title size="small" style={{ margin: 0 }}>
                Cây trồng nguồn cung nổi bật (khối lượng)
              </Text.Title>
              <div style={{ marginTop: spacing.md }}>
                {topCropChartData.length === 0 ? (
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    Chưa có dữ liệu cây trồng theo đơn hàng trong kỳ này.
                  </Text>
                ) : (
                  <Suspense fallback={<ChartFallback />}>
                    <LazyChart
                      type="bar"
                      data={topCropChartData}
                      xAxis={{ label: 'Loại cây' }}
                      yAxis={{ label: 'Tấn' }}
                      colors={[colors.primary.zaloBlue, colors.primary.agriGreen, colors.functional.warningYellow, chartPalette[3]]}
                      showGrid
                      showLegend={false}
                      width={340}
                      height={220}
                    />
                  </Suspense>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </Page>
  );
};

export default TraderDashboardScreen;
