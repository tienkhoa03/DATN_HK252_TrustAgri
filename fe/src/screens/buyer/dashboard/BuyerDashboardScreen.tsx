/**
 * BuyerDashboardScreen — Phase 17.2
 *
 * Widget tóm tắt trên trang chủ người mua — GET /api/v1/dashboard/buyer.
 */

import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { Text } from 'zmp-ui';
import type { ChartDataPoint } from '../../../design-system/components/Chart';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  fetchBuyerDashboard,
  toDashboardViMessage,
  type DashboardBuyerDto,
} from '@/services/dashboardService';

const LazyChart = lazy(() =>
  import('../../../design-system/components/Chart').then((m) => ({ default: m.Chart })),
);

const ChartFallback: React.FC = () => (
  <div
    style={{
      height: 200,
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

export const BuyerDashboardScreen: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();
  const [data, setData] = useState<DashboardBuyerDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchBuyerDashboard()
      .then((dto) => {
        if (!cancelled) {
          setData(dto);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = toDashboardViMessage(err);
          setData(null);
          setLoadError(msg);
          setLoading(false);
          openSnackbar({ type: 'error', text: msg, duration: 4500, icon: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [openSnackbar]);

  const barData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Nhu cầu mở', value: data.openBuyingRequests },
      { label: 'Đề xuất chờ', value: data.pendingProposals },
      { label: 'Hợp đồng', value: data.activeContracts },
      { label: 'Đơn hoàn tất', value: data.completedOrders },
    ];
  }, [data]);

  if (loading) {
    return (
      <div style={{ padding: `0 ${spacing.md} ${spacing.md}` }}>
        <div
          style={{
            height: 160,
            borderRadius: 12,
            backgroundColor: colors.background.secondary,
            animation: 'buyer-dash-pulse 1.4s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes buyer-dash-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        `}</style>
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div style={{ padding: `0 ${spacing.md} ${spacing.md}` }}>
        <Text size="small" style={{ color: colors.functional.alertRed, margin: 0 }}>
          {loadError ?? 'Không tải được tóm tắt dashboard.'}
        </Text>
      </div>
    );
  }

  return (
    <div style={{ padding: `0 ${spacing.md} ${spacing.md}` }}>
      <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}` }}>
        Tóm tắt của bạn
      </Text.Title>
      <Text size="xSmall" style={{ color: colors.text.secondary, margin: `0 0 ${spacing.sm}` }}>
        {new Date(data.periodFrom).toLocaleDateString('vi-VN')} —{' '}
        {new Date(data.periodTo).toLocaleDateString('vi-VN')}
      </Text>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        {[
          {
            icon: 'list' as const,
            c: colors.primary.zaloBlue,
            v: data.openBuyingRequests,
            l: 'Nhu cầu đang mở',
          },
          {
            icon: 'message-circle' as const,
            c: colors.functional.warningYellow,
            v: data.pendingProposals,
            l: 'Đề xuất chờ phản hồi',
          },
          {
            icon: 'book' as const,
            c: colors.primary.agriGreen,
            v: data.activeContracts,
            l: 'Hợp đồng hiệu lực',
          },
          {
            icon: 'check' as const,
            c: colors.primary.agriGreen,
            v: data.completedOrders,
            l: 'Đơn đã hoàn tất',
          },
        ].map((x) => (
          <div
            key={x.l}
            style={{
              padding: spacing.sm,
              backgroundColor: colors.background.primary,
              borderRadius: 10,
              border: `1px solid ${colors.background.secondary}`,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
            }}
          >
            <Icon name={x.icon} size="md" color={x.c} />
            <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.bold }}>
              {x.v}
            </Text.Title>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
              {x.l}
            </Text>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: colors.background.primary,
          borderRadius: 12,
          padding: spacing.sm,
          border: `1px solid ${colors.background.secondary}`,
        }}
      >
        <Text
          size="small"
          style={{
            color: colors.text.secondary,
            margin: `0 0 ${spacing.xs}`,
            fontWeight: fontWeight.medium,
          }}
        >
          So sánh nhanh (khối số)
        </Text>
        <Suspense fallback={<ChartFallback />}>
          <LazyChart
            type="bar"
            data={barData}
            xAxis={{ label: 'Chỉ số' }}
            yAxis={{ label: 'Số lượng' }}
            colors={[colors.primary.zaloBlue, '#FFCC00', colors.primary.agriGreen, '#5C6BC0']}
            showGrid
            showLegend={false}
            width={328}
            height={200}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default BuyerDashboardScreen;
