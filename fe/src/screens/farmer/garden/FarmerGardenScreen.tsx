/**
 * FarmerGardenScreen — Vườn trồng tab (FR-F07, FR-F08, FR-F09, NFR-U01)
 *
 * Sections:
 * 1. IotDashboardSection — 4 Gauge sensors with tap-to-history
 * 2. TimelineSection — care-plan + standard steps + alert injection
 */

import React, { useState, useEffect, useRef } from 'react';
import { Page, useNavigate } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import { listFarms } from '@/services/farmService';
import { EmptyState } from '@/design-system/components/EmptyState';
import { ConnectionStatusBanner } from '@/components/ConnectionStatusBanner';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { ApiError } from '@/api/errors';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { IotDashboardSection } from './IotDashboardSection';
import { TimelineSection } from './TimelineSection';

export const FarmerGardenScreen: React.FC = () => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const session = useAtomValue(authSessionAtom);

  const [farmId, setFarmId] = useState<string | null>(null);
  const [standardId, setStandardId] = useState<string | undefined>(undefined);
  const [noFarm, setNoFarm] = useState(false);
  const [loading, setLoading] = useState(true);

  const resolvedRef = useRef(false);

  // Parse search params for section/step
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialStep = params.get('step') ?? undefined;

  useEffect(() => {
    if (!session?.userId || resolvedRef.current) return;
    resolvedRef.current = true;

    (async () => {
      try {
        const res = await listFarms({ ownerId: session.userId, page: 1, limit: 1 });
        const first = res.items[0];
        if (!first) {
          setNoFarm(true);
        } else {
          setFarmId(first.id);
          setStandardId(first.standardId ?? undefined);
        }
      } catch (err) {
        const msg =
          err instanceof ApiError && err.code === 'NETWORK_ERROR'
            ? 'Không có phản hồi từ máy chủ.'
            : 'Không thể tải thông tin vườn.';
        openSnackbar({ type: 'error', text: msg, duration: 3500, icon: true });
        setNoFarm(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.userId, openSnackbar]);

  if (loading) {
    return (
      <Page>
        <ConnectionStatusBanner />
        <div style={{ padding: spacing.md }}>
          <div style={{ height: 200, backgroundColor: colors.background.secondary, borderRadius: 8 }} className="skeleton-pulse" />
          <style>{`@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.45}}.skeleton-pulse{animation:skeleton-pulse 1.4s ease-in-out infinite}`}</style>
        </div>
      </Page>
    );
  }

  if (noFarm) {
    return (
      <Page>
        <ConnectionStatusBanner />
        <EmptyState
          icon="🌱"
          title="Chưa có vườn nào"
          description="Tạo hồ sơ vườn để theo dõi quy trình và cảm biến."
          cta={{ label: 'Tạo vườn ngay', onClick: () => navigate('/farmer/me?section=farm-lab') }}
        />
      </Page>
    );
  }

  return (
    <Page className="farmer-garden-screen">
      <style>{`@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:.45}}.skeleton-pulse{animation:skeleton-pulse 1.4s ease-in-out infinite}`}</style>
      <ConnectionStatusBanner />
      <div style={{ paddingBottom: '80px' }}>
        {/* Section 1: IoT Gauges */}
        <IotDashboardSection farmId={farmId} />

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: colors.background.secondary, margin: `${spacing.md} 0 0` }} />

        {/* Section 2: Care plan timeline */}
        <TimelineSection farmId={farmId} standardId={standardId} initialStep={initialStep} />
      </div>
    </Page>
  );
};

export default FarmerGardenScreen;
