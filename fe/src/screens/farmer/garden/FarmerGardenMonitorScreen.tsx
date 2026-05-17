/**
 * FarmerGardenMonitorScreen — giám sát vùng trồng một vườn (FR-F07, FR-F08, FR-F09)
 */
import React, { useEffect, useState } from 'react';
import { Page, Text, useNavigate, useParams } from 'zmp-ui';
import { getFarm } from '@/services/farmService';
import { ConnectionStatusBanner } from '@/components/ConnectionStatusBanner';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize } from '@/design-system/tokens/typography';
import { ApiError } from '@/api/errors';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { IotDashboardSection } from './IotDashboardSection';
import { TimelineSection } from './TimelineSection';

export const FarmerGardenMonitorScreen: React.FC = () => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const { farmId } = useParams<{ farmId: string }>();

  const [farmName, setFarmName] = useState('');
  const [standardId, setStandardId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialStep = params.get('step') ?? undefined;

  useEffect(() => {
    if (!farmId) {
      navigate('/farmer/garden', { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const farm = await getFarm(farmId);
        if (cancelled) return;
        setFarmName(farm.name);
        setStandardId(farm.standardId ?? undefined);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError && err.code === 'NETWORK_ERROR'
            ? 'Không có phản hồi từ máy chủ.'
            : 'Không thể tải thông tin vườn.';
        openSnackbar({ type: 'error', text: msg, duration: 3500, icon: true });
        navigate('/farmer/garden', { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [farmId, navigate, openSnackbar]);

  if (!farmId) return null;

  return (
    <Page className="farmer-garden-monitor-screen">
      <style>{`@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.45}}.skeleton-pulse{animation:skeleton-pulse 1.4s ease-in-out infinite}`}</style>
      <ConnectionStatusBanner />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.md,
          borderBottom: `1px solid ${colors.background.tertiary}`,
          backgroundColor: colors.background.primary,
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/farmer/garden')}
          aria-label="Quay lại danh sách vườn"
          style={{
            minWidth: 44,
            minHeight: 44,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: colors.text.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text.Title size="small" style={{ margin: 0 }}>
            {loading ? 'Đang tải…' : farmName || 'Giám sát vườn'}
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0, fontSize: fontSize.caption }}>
            Cảm biến & quy trình chăm sóc
          </Text>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: spacing.md }}>
          <div
            style={{ height: 200, backgroundColor: colors.background.secondary, borderRadius: 8 }}
            className="skeleton-pulse"
          />
        </div>
      ) : (
        <div style={{ paddingBottom: 80 }}>
          <IotDashboardSection farmId={farmId} />
          <div style={{ height: 1, backgroundColor: colors.background.secondary, margin: `${spacing.md} 0 0` }} />
          <TimelineSection farmId={farmId} standardId={standardId} initialStep={initialStep} />
        </div>
      )}
    </Page>
  );
};

export default FarmerGardenMonitorScreen;
