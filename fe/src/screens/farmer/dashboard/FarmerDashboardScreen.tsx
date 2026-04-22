/**
 * Farmer Dashboard Screen — Phase 6.2 Integration (FR-F07, FR-F08)
 *
 * Tích hợp monitoringService (REST thật) + WebSocket realtime:
 * - REST cold start: GET /api/v1/monitoring/farms/:farmId/latest  +  /alerts
 * - WebSocket subscribe_farm → sensor_update → merge vào Jotai atom
 * - GET /api/v1/monitoring/farms/:farmId/history khi chọn cảm biến
 *
 * Tuân thủ quy tắc 3 lần chạm (FR-F07, FR-F08):
 *   alert → acknowledge ≤ 2 bước từ màn này.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, useNavigate } from 'zmp-ui';
import { RoleAppShell } from '@/navigation/RoleAppShell';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { listFarms } from '@/services/farmService';
import { Icon } from '../../../design-system/components/Icon';
import { SensorDisplay } from '../../../design-system/components/SensorDisplay';
import { Alert } from '../../../design-system/components/Alert';
import { Card } from '../../../design-system/components/Card';
import { SensorLineChart } from '../../../design-system/components/SensorLineChart';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { ApiError } from '@/api/errors';
import { useMonitoring } from '@/hooks/useMonitoring';
import type { SensorType } from '@/services/monitoringService';
import {
  fetchFarmerDashboard,
  toDashboardViMessage,
  type DashboardFarmerDto,
} from '@/services/dashboardService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FarmerDashboardScreenProps {
  farmId?: string;
  farmerName?: string;
  farmName?: string;
  avatarUrl?: string;
  /** @deprecated Bị thay thế bởi số lượng cảnh báo thực tế từ useMonitoring */
  notificationCount?: number;
}

type SensorStatus = 'normal' | 'warning' | 'danger';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SENSOR_TYPE_ORDER: SensorType[] = ['temperature', 'humidity', 'light', 'soil_moisture'];

const SENSOR_LABELS: Record<SensorType, string> = {
  temperature: 'Nhiệt độ',
  humidity: 'Độ ẩm KK',
  light: 'Ánh sáng',
  soil_moisture: 'Độ ẩm đất',
};

const SENSOR_THRESHOLDS: Record<SensorType, { warn: number; danger: number }> = {
  temperature: { warn: 34, danger: 38 },
  humidity: { warn: 40, danger: 25 },
  light: { warn: 200, danger: 100 },
  soil_moisture: { warn: 35, danger: 20 },
};

function sensorStatus(sensorType: SensorType, value: number): SensorStatus {
  const t = SENSOR_THRESHOLDS[sensorType];
  if (sensorType === 'humidity' || sensorType === 'soil_moisture') {
    if (value <= t.danger) return 'danger';
    if (value <= t.warn) return 'warning';
  } else {
    if (value >= t.danger) return 'danger';
    if (value >= t.warn) return 'warning';
  }
  return 'normal';
}

const HISTORY_SENSOR_OPTIONS: { value: SensorType; label: string }[] = [
  { value: 'temperature', label: 'Nhiệt độ' },
  { value: 'humidity', label: 'Độ ẩm KK' },
  { value: 'light', label: 'Ánh sáng' },
  { value: 'soil_moisture', label: 'Độ ẩm đất' },
];

const CHART_COLORS: Record<SensorType, string> = {
  temperature: colors.functional.alertRed,
  humidity: colors.primary.zaloBlue,
  light: '#FFCC00',
  soil_moisture: colors.primary.agriGreen,
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ width?: string; height?: string; borderRadius?: string }> = ({
  width = '100%', height = '14px', borderRadius = '4px',
}) => (
  <div
    className="skeleton-pulse"
    style={{ width, height, borderRadius, backgroundColor: colors.background.secondary }}
  />
);

const SensorCardSkeleton: React.FC = () => (
  <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: 8, border: `1px solid ${colors.background.secondary}`, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
    <SkeletonBlock width="60%" height="12px" />
    <SkeletonBlock width="80%" height="28px" />
    <SkeletonBlock width="50%" height="10px" />
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

export const FarmerDashboardScreen: React.FC<FarmerDashboardScreenProps> = ({
  farmId,
  farmerName = 'Nông dân',
  farmName = 'Farm Lab A',
  avatarUrl,
  notificationCount = 0,
}) => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const session = useAtomValue(authSessionAtom);
  const resolvedOwnerRef = useRef<string | null>(null);
  const resolvingOwnerRef = useRef(false);

  const [resolvedFarmId, setResolvedFarmId] = useState<string | null>(farmId ?? null);
  const [resolvedFarmName, setResolvedFarmName] = useState<string>(farmName);

  const [pumpActive, setPumpActive] = useState(false);
  const [lightActive, setLightActive] = useState(false);
  const [fanActive, setFanActive] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorType>('temperature');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [farmSummary, setFarmSummary] = useState<DashboardFarmerDto | null>(null);
  const [farmSummaryLoading, setFarmSummaryLoading] = useState(true);

  const {
    latestReadings,
    isLatestLoading,
    historyData,
    isHistoryLoading,
    alerts,
    error,
    loadHistory,
    acknowledgeAlert,
    clearError,
  } = useMonitoring(resolvedFarmId);

  useEffect(() => {
    let cancelled = false;
    setFarmSummaryLoading(true);
    fetchFarmerDashboard()
      .then((dto) => {
        if (!cancelled) {
          setFarmSummary(dto);
          setFarmSummaryLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFarmSummary(null);
          setFarmSummaryLoading(false);
          openSnackbar({
            type: 'error',
            text: toDashboardViMessage(err),
            duration: 4500,
            icon: true,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [openSnackbar]);

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

    if (resolvedOwnerRef.current === session.userId || resolvingOwnerRef.current) {
      return;
    }

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
          openSnackbar({
            type: 'error',
            text: 'Bạn chưa có vườn nào. Vui lòng tạo hồ sơ vườn trước khi xem dashboard.',
            duration: 4500,
            icon: true,
          });
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
            : err instanceof ApiError
              ? err.message || 'Không thể tải danh sách vườn.'
              : 'Không thể tải danh sách vườn. Vui lòng thử lại.';
        openSnackbar({ type: 'error', text: msg, duration: 4500, icon: true });
      } finally {
        if (!cancelled) {
          resolvingOwnerRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
      resolvingOwnerRef.current = false;
    };
  }, [farmId, session?.userId]);

  // Show Snackbar khi có lỗi
  useEffect(() => {
    if (error) {
      openSnackbar({ type: 'error', text: error, duration: 4500, icon: true });
      clearError();
    }
  }, [error, openSnackbar, clearError]);

  // Load history khi chọn cảm biến
  useEffect(() => {
    if (!resolvedFarmId) return;
    loadHistory(selectedSensor);
  }, [selectedSensor, loadHistory, resolvedFarmId]);

  const handleAcknowledge = useCallback(
    async (alertId: string) => {
      await acknowledgeAlert(alertId);
    },
    [acknowledgeAlert],
  );

  const handleDismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));
  const hasActiveAlerts = visibleAlerts.length > 0;
  // Badge count = số cảnh báo chưa acknowledge (kể cả đã dismiss trên UI)
  const alertBadgeCount = alerts.filter((a) => !a.acknowledged).length;

  const latestMap: Partial<Record<SensorType, typeof latestReadings[0]>> = {};
  for (const r of latestReadings) latestMap[r.sensorType] = r;

  // ── Styles ─────────────────────────────────────────────────────────────────
  const headerStyles: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const actionIconContainerStyles = (isActive: boolean): React.CSSProperties => ({
    width: '44px', height: '44px', borderRadius: '50%',
    backgroundColor: isActive ? colors.primary.zaloBlue : colors.functional.neutralGray,
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
  });

  return (
    <RoleAppShell role="farmer" className="farmer-dashboard-screen">
      <style>{`
        @keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .skeleton-pulse { animation: skeleton-pulse 1.4s ease-in-out infinite; }
      `}</style>

      <div>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={headerStyles}>
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

        {/* ── KPI tóm tắt vườn (dashboard farmer — Phase 17.1) ───────────── */}
        <div style={{ padding: `${spacing.sm} ${spacing.md} 0` }}>
          <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}` }}>
            Tóm tắt vườn
          </Text.Title>
          {farmSummaryLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <SensorCardSkeleton key={i} />
              ))}
            </div>
          )}
          {!farmSummaryLoading && farmSummary && (
            <>
              <div
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.background.primary,
                  borderRadius: 8,
                  border: `1px solid ${colors.background.secondary}`,
                  marginBottom: spacing.sm,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                    Điểm tuân thủ quy trình
                  </Text>
                  <Text.Title size="small" style={{ margin: 0, color: colors.primary.agriGreen }}>
                    {farmSummary.complianceScore}%
                  </Text.Title>
                </div>
                <div style={{ height: 8, borderRadius: 99, backgroundColor: colors.background.secondary, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, farmSummary.complianceScore))}%`,
                      height: '100%',
                      borderRadius: 99,
                      backgroundColor: colors.primary.agriGreen,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: `${spacing.xs} 0 0` }}>
                  Kỳ: {new Date(farmSummary.periodFrom).toLocaleDateString('vi-VN')} —{' '}
                  {new Date(farmSummary.periodTo).toLocaleDateString('vi-VN')}
                </Text>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
                {[
                  {
                    icon: 'alert-triangle' as const,
                    color: farmSummary.recentAlerts > 0 ? colors.functional.warningYellow : colors.primary.agriGreen,
                    value: farmSummary.recentAlerts,
                    label: 'Cảnh báo gần đây',
                  },
                  {
                    icon: 'book' as const,
                    color: colors.primary.zaloBlue,
                    value: farmSummary.activeContracts,
                    label: 'Hợp đồng hoạt động',
                  },
                  {
                    icon: 'list' as const,
                    color: colors.primary.agriGreen,
                    value: farmSummary.careLogCount,
                    label: 'Nhật ký chăm sóc (kỳ)',
                  },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.background.primary,
                      borderRadius: 8,
                      border: `1px solid ${colors.background.secondary}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.xs,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <Icon name={cell.icon} size="md" color={cell.color} />
                      <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.bold }}>
                        {cell.value}
                      </Text.Title>
                    </div>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      {cell.label}
                    </Text>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Alert Zone (ưu tiên trên fold) ──────────────────────────────── */}
        {hasActiveAlerts && (
          <div style={{ padding: `${spacing.sm} ${spacing.md} 0` }}>
            {visibleAlerts.map((alert) => (
              <div key={alert.id} style={{ marginBottom: spacing.sm }}>
                <Alert
                  severity={alert.severity === 'danger' ? 'error' : 'warning'}
                  title={`Cảnh báo ${alert.sensorType === 'temperature' ? 'nhiệt độ' : alert.sensorType === 'soil_moisture' ? 'độ ẩm đất' : alert.sensorType}`}
                  message={alert.suggestedAction ?? `Giá trị ${alert.value} vượt ngưỡng ${alert.threshold}.`}
                  action={{ label: 'Xác nhận', onClick: () => handleAcknowledge(alert.id) }}
                  dismissible
                  onDismiss={() => handleDismissAlert(alert.id)}
                />
              </div>
            ))}
            <button
              onClick={() => navigate('/farmer/alerts')}
              style={{
                width: '100%',
                padding: `${spacing.xs} 0`,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: colors.primary.zaloBlue,
                fontSize: fontSize.small,
                fontWeight: fontWeight.medium,
                textAlign: 'center',
                marginBottom: spacing.xs,
              }}
            >
              Xem tất cả cảnh báo →
            </button>
          </div>
        )}

        {!hasActiveAlerts && !isLatestLoading && (
          <div style={{ padding: `${spacing.sm} ${spacing.md} 0` }}>
            <Card status="success">
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                <Icon name="plant" size="lg" color={colors.primary.agriGreen} />
                <div>
                  <Text.Title size="small" style={{ margin: 0, color: colors.primary.agriGreen }}>Tất cả chỉ số ổn định</Text.Title>
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>Cây trồng đang phát triển tốt</Text>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── Sensor Grid 2×2 ─────────────────────────────────────────────── */}
        <div style={{ padding: `${spacing.sm} ${spacing.md} 0` }}>
          <Text.Title size="small" style={{ marginBottom: spacing.sm }}>Cảm biến thời gian thực</Text.Title>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
            {isLatestLoading
              ? SENSOR_TYPE_ORDER.map((s) => <SensorCardSkeleton key={s} />)
              : SENSOR_TYPE_ORDER.map((s) => {
                  const r = latestMap[s];
                  if (!r) return <SensorCardSkeleton key={s} />;
                  const status = sensorStatus(s, r.value);
                  return (
                    <div key={s}>
                      <SensorDisplay
                        type={s === 'soil_moisture' ? 'humidity' : (s as 'temperature' | 'humidity' | 'light')}
                        value={r.value}
                        unit={r.unit}
                        status={status}
                        timestamp={new Date(r.recordedAt)}
                      />
                      {r.isImputed && (
                        <div style={{ textAlign: 'center', fontSize: fontSize.small, color: '#FFCC00', marginTop: 2 }}>
                          ~ Ước tính
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: spacing.md, backgroundColor: colors.background.primary, borderTop: `1px solid ${colors.background.secondary}`, borderBottom: `1px solid ${colors.background.secondary}`, marginTop: spacing.md }}>
          {[
            { key: 'pump', label: 'Máy bơm', icon: 'droplet', active: pumpActive, toggle: () => setPumpActive(!pumpActive) },
            { key: 'light', label: 'Đèn', icon: 'sun', active: lightActive, toggle: () => setLightActive(!lightActive) },
            { key: 'fan', label: 'Quạt', icon: 'wind', active: fanActive, toggle: () => setFanActive(!fanActive) },
          ].map(({ key, label, icon, active, toggle }) => (
            <button key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing.sm, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }} onClick={toggle} aria-label={`${label} ${active ? 'đang bật' : 'đang tắt'}`}>
              <div style={actionIconContainerStyles(active)}>
                <Icon name={icon as any} size="md" color={active ? colors.text.inverse : colors.text.secondary} />
              </div>
              <Text size="xSmall" style={{ color: active ? colors.primary.zaloBlue : colors.text.secondary, margin: 0 }}>{label}</Text>
            </button>
          ))}
        </div>

        {/* ── History Chart ────────────────────────────────────────────────── */}
        <div style={{ padding: `${spacing.md} ${spacing.md} 0` }}>
          <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}` }}>Lịch sử 24 giờ</Text.Title>

          <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.sm, overflowX: 'auto' }}>
            {HISTORY_SENSOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedSensor(opt.value)}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`, borderRadius: 99,
                  border: `1px solid ${selectedSensor === opt.value ? CHART_COLORS[opt.value] : colors.background.secondary}`,
                  backgroundColor: selectedSensor === opt.value ? `${CHART_COLORS[opt.value]}18` : colors.background.primary,
                  color: selectedSensor === opt.value ? CHART_COLORS[opt.value] : colors.text.secondary,
                  fontSize: fontSize.small, fontWeight: selectedSensor === opt.value ? fontWeight.semibold : fontWeight.regular,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {isHistoryLoading ? (
            <div style={{ height: 160, borderRadius: 8, backgroundColor: colors.background.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="skeleton-pulse">
              <Text size="small" style={{ color: colors.text.secondary }}>Đang tải biểu đồ…</Text>
            </div>
          ) : (
            <SensorLineChart
              data={historyData}
              title={SENSOR_LABELS[selectedSensor]}
              unit={historyData[0]?.unit}
              lineColor={CHART_COLORS[selectedSensor]}
              width={328}
              height={160}
            />
          )}
        </div>

        {/* ── Farm Info ────────────────────────────────────────────────────── */}
        <div style={{ padding: spacing.md }}>
          <Card title="Giai đoạn sinh trưởng" subtitle="Đang trong giai đoạn ra hoa" status="success">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.sm }}>
              <Text size="small" style={{ color: colors.text.secondary }}>Ngày trồng: 01/01/2024</Text>
              <Text size="small" style={{ color: colors.text.secondary }}>Ngày 45/90</Text>
            </div>
          </Card>
        </div>
      </div>
    </RoleAppShell>
  );
};

export default FarmerDashboardScreen;
