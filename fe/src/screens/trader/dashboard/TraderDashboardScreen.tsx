/**
 * Trader Dashboard Screen — Phase 17.2 (FR-T02)
 *
 * GET /api/v1/dashboard/trader qua dashboardService; biểu đồ lazy load.
 */

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { Icon } from '../../../design-system/components/Icon';
import type { ChartDataPoint } from '../../../design-system/components/Chart';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import {
  fetchTraderDashboard,
  toDashboardViMessage,
  type DashboardTraderDto,
} from '@/services/dashboardService';
import { orderStatusLabel, type OrderDto } from '@/services/orderService';

const LazyChart = lazy(() =>
  import('../../../design-system/components/Chart').then((m) => ({ default: m.Chart })),
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

export const TraderDashboardScreen: React.FC<TraderDashboardScreenProps> = ({
  traderName = 'Thương lái',
  companyName = 'Công ty TNHH Nông sản',
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days'>('7days');
  const [data, setData] = useState<DashboardTraderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    return () => {
      cancelled = true;
    };
  }, [openSnackbar]);

  const demandChartData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];
    const sliceLen = selectedPeriod === '7days' ? 7 : data.demandTrend.length;
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

  const totalOrders = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.orderCountByStatus).reduce((a, b) => a + b, 0);
  }, [data]);

  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const overviewGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
    padding: spacing.md,
  };

  const overviewCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
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

  const actionCenterStyles: React.CSSProperties = {
    padding: spacing.md,
  };

  const actionCardStyles = (bgColor: string): React.CSSProperties => ({
    padding: spacing.md,
    backgroundColor: `${bgColor}15`,
    borderRadius: '8px',
    border: `2px solid ${bgColor}`,
    marginBottom: spacing.md,
    cursor: 'pointer',
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
            <div style={overviewGridStyles}>
              <div style={overviewCardStyles}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.primary.zaloBlue}15`,
                  }}
                >
                  <Icon name="shopping-cart" size="lg" color={colors.primary.zaloBlue} />
                </div>
                <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
                  {totalOrders}
                </Text.Title>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  Tổng đơn hàng (mọi trạng thái)
                </Text>
              </div>

              <div style={overviewCardStyles}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.primary.agriGreen}15`,
                  }}
                >
                  <Icon name="book" size="lg" color={colors.primary.agriGreen} />
                </div>
                <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
                  {data.activeContracts}
                </Text.Title>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  Hợp đồng đang hoạt động
                </Text>
              </div>

              <div style={overviewCardStyles}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.functional.warningYellow}22`,
                  }}
                >
                  <Icon name="users" size="lg" color={colors.primary.zaloBlue} />
                </div>
                <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
                  {data.pendingConnections}
                </Text.Title>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  Kết nối chờ phản hồi
                </Text>
              </div>

              <div style={overviewCardStyles}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.primary.agriGreen}15`,
                  }}
                >
                  <Icon name="trending-up" size="lg" color={colors.primary.agriGreen} />
                </div>
                <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
                  {data.demandTrend[data.demandTrend.length - 1]?.requestCount ?? 0}
                </Text.Title>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  Nhu cầu mua (ngày gần nhất)
                </Text>
              </div>
            </div>

            <div style={{ padding: `0 ${spacing.md}` }}>
              <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}` }}>
                Đơn hàng theo trạng thái
              </Text.Title>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
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
                      colors={[colors.primary.zaloBlue, colors.primary.agriGreen, '#FFCC00', '#9B59B6']}
                      showGrid
                      showLegend={false}
                      width={340}
                      height={220}
                    />
                  </Suspense>
                )}
              </div>
            </div>

            <div style={actionCenterStyles}>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                Trung tâm tác vụ
              </Text.Title>

              <div style={actionCardStyles(colors.primary.zaloBlue)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary.zaloBlue,
                    }}
                  >
                    <Icon name="users" size="lg" color={colors.text.inverse} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <Text.Title size="small" style={{ margin: 0 }}>
                        Kết nối chờ xử lý
                      </Text.Title>
                      <div
                        style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: colors.primary.zaloBlue,
                          color: colors.text.inverse,
                          borderRadius: '12px',
                          fontSize: fontSize.small,
                          fontWeight: fontWeight.bold,
                        }}
                      >
                        {data.pendingConnections}
                      </div>
                    </div>
                    <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                      Nông dân / đối tác đang chờ bạn phản hồi
                    </Text>
                  </div>
                </div>
              </div>

              <div style={actionCardStyles(colors.primary.agriGreen)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary.agriGreen,
                    }}
                  >
                    <Icon name="shopping-cart" size="lg" color={colors.text.inverse} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <Text.Title size="small" style={{ margin: 0 }}>
                        Đơn chờ xác nhận
                      </Text.Title>
                      <div
                        style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: colors.primary.agriGreen,
                          color: colors.text.inverse,
                          borderRadius: '12px',
                          fontSize: fontSize.small,
                          fontWeight: fontWeight.bold,
                        }}
                      >
                        {data.orderCountByStatus.pending ?? 0}
                      </div>
                    </div>
                    <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                      Theo trạng thái «Chờ xác nhận»
                    </Text>
                  </div>
                </div>
              </div>

              <div style={actionCardStyles(colors.functional.warningYellow)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: colors.functional.warningYellow,
                    }}
                  >
                    <Icon name="book" size="lg" color={colors.text.primary} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <Text.Title size="small" style={{ margin: 0 }}>
                        Hợp đồng đang chạy
                      </Text.Title>
                      <div
                        style={{
                          padding: `${spacing.xs} ${spacing.sm}`,
                          backgroundColor: colors.functional.warningYellow,
                          color: colors.text.primary,
                          borderRadius: '12px',
                          fontSize: fontSize.small,
                          fontWeight: fontWeight.bold,
                        }}
                      >
                        {data.activeContracts}
                      </div>
                    </div>
                    <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                      Theo tổng hợp dashboard
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Page>
  );
};

export default TraderDashboardScreen;
