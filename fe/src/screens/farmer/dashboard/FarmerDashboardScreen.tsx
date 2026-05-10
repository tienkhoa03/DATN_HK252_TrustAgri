/**
 * Farmer Dashboard Screen — refactored (FR-F07, FR-F08, NFR-U01)
 *
 * 3 blocks: HomeBanner + TodoList + KPI chips.
 * QuickLogFab for quick care log entry.
 * Internal bottom nav removed — RoleAppShell handles real nav.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Text, useNavigate } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { listFarms } from '@/services/farmService';
import { Icon } from '@/design-system/components/Icon';
import { colors } from '@/design-system/tokens/colors';
import { ConnectionStatusBanner } from '@/components/ConnectionStatusBanner';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { ApiError } from '@/api/errors';
import { useMonitoring } from '@/hooks/useMonitoring';
import { useCarePlan } from '@/hooks/useCarePlan';
import {
  fetchFarmerDashboard,
  toDashboardViMessage,
  type DashboardFarmerDto,
} from '@/services/dashboardService';
import { HomeBanner, type BannerKind } from './HomeBanner';
import { TodoList, type TodoTask } from './TodoList';
import { QuickLogFab } from './QuickLogFab';
import type { DailyTaskDto } from '@/services/carePlanService';
// DailyTaskDto is used in mapTaskToTodo

export interface FarmerDashboardScreenProps {
  farmId?: string;
  farmerName?: string;
  farmName?: string;
  avatarUrl?: string;
  /** @deprecated kept for backwards-compat with example/demo files */
  notificationCount?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapTaskToTodo(t: DailyTaskDto): TodoTask {
  return {
    id: t.standardStepId,
    title: t.title,
    dueTime: t.dueDate ?? undefined,
    completed: t.completed,
  };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ width?: string; height?: string; borderRadius?: string }> = ({
  width = '100%', height = '14px', borderRadius = '4px',
}) => (
  <div
    className="skeleton-pulse"
    style={{ width, height, borderRadius, backgroundColor: colors.background.secondary }}
  />
);

// ── Component ─────────────────────────────────────────────────────────────────

export const FarmerDashboardScreen: React.FC<FarmerDashboardScreenProps> = ({
  farmId,
  farmerName = 'Nông dân',
  farmName,
  avatarUrl,
}) => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const session = useAtomValue(authSessionAtom);
  const resolvedOwnerRef = useRef<string | null>(null);
  const resolvingOwnerRef = useRef(false);

  const [resolvedFarmId, setResolvedFarmId] = useState<string | null>(farmId ?? null);
  const [resolvedFarmName, setResolvedFarmName] = useState<string>(farmName ?? '');
  const [farmSummary, setFarmSummary] = useState<DashboardFarmerDto | null>(null);
  const [farmSummaryLoading, setFarmSummaryLoading] = useState(true);

  const { alerts } = useMonitoring(resolvedFarmId);
  const { tasks, isLoading: planLoading, error: planError, clearError: clearPlanError } = useCarePlan(resolvedFarmId);

  // ── Fetch dashboard KPI ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setFarmSummaryLoading(true);
    fetchFarmerDashboard()
      .then((dto) => {
        if (!cancelled) { setFarmSummary(dto); setFarmSummaryLoading(false); }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFarmSummary(null);
          setFarmSummaryLoading(false);
          openSnackbar({ type: 'error', text: toDashboardViMessage(err), duration: 4500, icon: true });
        }
      });
    return () => { cancelled = true; };
  }, [openSnackbar]);

  // ── Resolve farmId from session ─────────────────────────────────────────────
  useEffect(() => {
    if (farmId) {
      resolvedOwnerRef.current = session?.userId ?? null;
      resolvingOwnerRef.current = false;
      setResolvedFarmId(farmId);
      return;
    }
    if (!session?.userId) {
      resolvedOwnerRef.current = null;
      resolvingOwnerRef.current = false;
      setResolvedFarmId(null);
      return;
    }
    if (resolvedOwnerRef.current === session.userId || resolvingOwnerRef.current) return;

    let cancelled = false;
    resolvingOwnerRef.current = true;

    (async () => {
      try {
        const res = await listFarms({ ownerId: session.userId, page: 1, limit: 1 });
        if (cancelled) return;
        const firstFarm = res.items[0];
        if (!firstFarm) {
          resolvedOwnerRef.current = session.userId;
          setResolvedFarmId(null);
          openSnackbar({ type: 'error', text: 'Bạn chưa có vườn nào. Vui lòng tạo hồ sơ vườn trước khi xem dashboard.', duration: 4500, icon: true });
          return;
        }
        resolvedOwnerRef.current = session.userId;
        setResolvedFarmId(firstFarm.id);
        setResolvedFarmName(firstFarm.name);
      } catch (err: unknown) {
        if (cancelled) return;
        resolvedOwnerRef.current = null;
        setResolvedFarmId(null);
        const msg =
          err instanceof ApiError && err.code === 'NETWORK_ERROR'
            ? 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.'
            : err instanceof ApiError ? (err.message || 'Không thể tải danh sách vườn.')
              : 'Không thể tải danh sách vườn. Vui lòng thử lại.';
        openSnackbar({ type: 'error', text: msg, duration: 4500, icon: true });
      } finally {
        if (!cancelled) resolvingOwnerRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      resolvingOwnerRef.current = false;
    };
  }, [farmId, session?.userId, openSnackbar]);

  // ── Care plan error ────────────────────────────────────────────────────────
  useEffect(() => {
    if (planError) {
      openSnackbar({ type: 'error', text: planError, duration: 3500, icon: true });
      clearPlanError();
    }
  }, [planError, openSnackbar, clearPlanError]);

  // ── Derived: banner kind ────────────────────────────────────────────────────
  const unackedAlerts = alerts.filter((a) => !a.acknowledged);
  const alertBadgeCount = unackedAlerts.length;

  const bannerKind: BannerKind = (() => {
    if (alertBadgeCount > 0) return 'iot-alert';
    if (farmSummary && farmSummary.activeContracts > 0) return 'contract-pending';
    return 'all-good';
  })();

  const handleBannerCta = useCallback(() => {
    if (bannerKind === 'iot-alert') navigate('/farmer/alerts');
    else if (bannerKind === 'contract-pending') navigate('/farmer/trade?tab=search');
    else navigate('/farmer/garden');
  }, [bannerKind, navigate]);

  const todoTasks: TodoTask[] = tasks.map(mapTaskToTodo);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Page className="farmer-dashboard-screen">
      <style>{`
        @keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .skeleton-pulse { animation: skeleton-pulse 1.4s ease-in-out infinite; }
      `}</style>
      <ConnectionStatusBanner />

      <div style={{ paddingBottom: '80px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: spacing.md, backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              backgroundColor: colors.primary.agriGreen,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: colors.text.inverse, fontSize: fontSize.h2, fontWeight: fontWeight.semibold,
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={farmerName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                : <span>{farmerName.charAt(0).toUpperCase()}</span>}
            </div>
            <div>
              <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>Xin chào,</Text>
              <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>{farmerName}</Text.Title>
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>{resolvedFarmName}</Text>
            </div>
          </div>
          <button
            style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => navigate('/farmer/alerts')}
            aria-label={`Cảnh báo${alertBadgeCount > 0 ? ` (${alertBadgeCount} chưa xử lý)` : ''}`}
          >
            <Icon name="notification" size="md" color={colors.text.primary} />
            {alertBadgeCount > 0 && (
              <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', backgroundColor: colors.functional.alertRed, color: colors.text.inverse, fontSize: fontSize.small, fontWeight: fontWeight.bold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {alertBadgeCount > 9 ? '9+' : alertBadgeCount}
              </div>
            )}
          </button>
        </div>

        {/* Block 1: Priority Banner */}
        <HomeBanner
          kind={bannerKind}
          alertCount={alertBadgeCount}
          pendingCount={farmSummary?.activeContracts ?? 0}
          complianceScore={farmSummary?.complianceScore ?? 0}
          onCta={handleBannerCta}
        />

        {/* Block 2: Today's tasks */}
        <TodoList
          tasks={todoTasks}
          loading={planLoading}
          onUpdateTask={(taskId) => {
            // Navigate to garden with the task pre-selected
            navigate(`/farmer/garden?section=timeline&step=${taskId}`);
          }}
          onViewAll={() => navigate('/farmer/garden?section=timeline')}
        />

        {/* Block 3: KPI chips */}
        <div style={{ padding: `${spacing.sm} ${spacing.md} 0` }}>
          <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}` }}>
            Tóm tắt vườn
          </Text.Title>
          {farmSummaryLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: 8, border: `1px solid ${colors.background.secondary}`, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  <SkeletonBlock width="60%" height="12px" />
                  <SkeletonBlock width="80%" height="28px" />
                  <SkeletonBlock width="50%" height="10px" />
                </div>
              ))}
            </div>
          )}
          {!farmSummaryLoading && farmSummary && (
            <>
              {/* Compliance bar */}
              <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: 8, border: `1px solid ${colors.background.secondary}`, marginBottom: spacing.sm }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>Điểm tuân thủ quy trình</Text>
                  <Text.Title size="small" style={{ margin: 0, color: colors.primary.agriGreen }}>{farmSummary.complianceScore}%</Text.Title>
                </div>
                <div style={{ height: 8, borderRadius: 99, backgroundColor: colors.background.secondary, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(0, farmSummary.complianceScore))}%`, height: '100%', borderRadius: 99, backgroundColor: colors.primary.agriGreen, transition: 'width 0.4s ease' }} />
                </div>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: `${spacing.xs} 0 0` }}>
                  Kỳ: {new Date(farmSummary.periodFrom).toLocaleDateString('vi-VN')} — {new Date(farmSummary.periodTo).toLocaleDateString('vi-VN')}
                </Text>
              </div>
              {/* Metric chips */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
                {[
                  { icon: 'alert-triangle' as const, color: farmSummary.recentAlerts > 0 ? colors.functional.warningYellow : colors.primary.agriGreen, value: farmSummary.recentAlerts, label: 'Cảnh báo gần đây' },
                  { icon: 'book' as const, color: colors.primary.zaloBlue, value: farmSummary.activeContracts, label: 'Hợp đồng hoạt động' },
                  { icon: 'list' as const, color: colors.primary.agriGreen, value: farmSummary.careLogCount, label: 'Nhật ký chăm sóc (kỳ)' },
                ].map((cell) => (
                  <div key={cell.label} style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: 8, border: `1px solid ${colors.background.secondary}`, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <Icon name={cell.icon} size="md" color={cell.color} />
                      <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.bold }}>{cell.value}</Text.Title>
                    </div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>{cell.label}</Text>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Quick log FAB */}
      <QuickLogFab farmId={resolvedFarmId} />
    </Page>
  );
};

export default FarmerDashboardScreen;
