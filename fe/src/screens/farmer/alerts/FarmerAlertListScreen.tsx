/**
 * Farmer Alert List Screen — Phase 7.2 Integration (FR-F08)
 *
 * Gọi API thực tế:
 *   GET  /api/v1/monitoring/farms/:farmId/alerts   → ListResponse<AlertDto>
 *   POST /api/v1/monitoring/alerts/:id/acknowledge → { success: true }
 *
 * Realtime:
 *   WebSocket alert_created → alert mới xuất hiện ngay trong danh sách
 *   (nếu khớp filter hiện tại).
 *
 * farmId được resolve tự động từ session (listFarms ownerId = userId).
 * Xử lý lỗi chuẩn ApiError → Snackbar tiếng Việt.
 * Tuân thủ quy tắc 3 lần chạm: alert → acknowledge ≤ 2 bước.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Text, useNavigate } from 'zmp-ui';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { useAtomValue, useSetAtom } from 'jotai';
import { Icon } from '@/design-system/components/Icon';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import * as monitoringService from '@/services/monitoringService';
import type { AlertDto } from '@/services/monitoringService';
import { listFarms } from '@/services/farmService';
import { subscribeToFarmAlerts } from '@/api/monitoringSocket';
import { ApiError } from '@/api/errors';
import { authSessionAtom } from '@/state/authAtoms';
import { decrementFarmAlertBadgeAtom } from '@/state/monitoringAtoms';

// ── Props ──────────────────────────────────────────────────────────────────────

export interface FarmerAlertListScreenProps {
  /** Nếu không truyền, tự resolve từ session (first farm của user). */
  farmId?: string;
}

// ── Types ──────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'unacknowledged' | 'acknowledged';
type SeverityFilter = 'all' | 'warning' | 'danger';

// ── Helpers ────────────────────────────────────────────────────────────────────

const SENSOR_LABELS: Record<string, string> = {
  temperature: 'Nhiệt độ',
  humidity: 'Độ ẩm KK',
  light: 'Ánh sáng',
  soil_moisture: 'Độ ẩm đất',
};

const SENSOR_UNITS: Record<string, string> = {
  temperature: '°C',
  humidity: '%',
  light: 'lux',
  soil_moisture: '%',
};

function toViErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'FORBIDDEN':
        return 'Bạn không có quyền xem cảnh báo của vườn này.';
      case 'NOT_FOUND':
        return 'Không tìm thấy vườn hoặc dữ liệu cảnh báo.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ giám sát tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      default:
        return err.message || 'Không thể tải dữ liệu cảnh báo. Vui lòng thử lại.';
    }
  }
  return 'Không thể tải dữ liệu cảnh báo. Vui lòng thử lại.';
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  return `${days} ngày trước`;
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ width?: string; height?: string; borderRadius?: string }> = ({
  width = '100%', height = '14px', borderRadius = '6px',
}) => (
  <div
    className="skeleton-pulse"
    style={{ width, height, borderRadius, backgroundColor: colors.background.secondary }}
  />
);

const AlertCardSkeleton: React.FC = () => (
  <div style={{
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeft: `4px solid ${colors.background.secondary}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <SkeletonBlock width="40%" height="16px" />
      <SkeletonBlock width="20%" height="22px" borderRadius="99px" />
    </div>
    <SkeletonBlock width="90%" height="13px" />
    <SkeletonBlock width="75%" height="13px" />
    <SkeletonBlock width="50%" height="13px" />
  </div>
);

// ── Alert Card ─────────────────────────────────────────────────────────────────

interface AlertCardProps {
  alert: AlertDto;
  onAcknowledge: (id: string) => void;
  isAcknowledging: boolean;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge, isAcknowledging }) => {
  const borderColor =
    alert.severity === 'danger'
      ? colors.functional.alertRed
      : colors.functional.warningYellow;

  const bgColor =
    alert.severity === 'danger'
      ? `${colors.functional.alertRed}10`
      : `${colors.functional.warningYellow}12`;

  const severityLabel = alert.severity === 'danger' ? 'Nguy hiểm' : 'Cảnh báo';
  const sensorLabel = SENSOR_LABELS[alert.sensorType] ?? alert.sensorType;
  const unit = SENSOR_UNITS[alert.sensorType] ?? '';

  return (
    <div style={{
      backgroundColor: alert.acknowledged ? colors.background.primary : bgColor,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeft: `4px solid ${alert.acknowledged ? colors.background.secondary : borderColor}`,
      opacity: alert.acknowledged ? 0.72 : 1,
      transition: 'opacity 0.25s',
    }}>
      {/* Header: sensor label + severity badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <Icon
            name={alert.sensorType === 'temperature' ? 'temperature' : alert.sensorType === 'light' ? 'sun' : 'droplet'}
            size="sm"
            color={alert.acknowledged ? colors.text.secondary : borderColor}
          />
          <Text style={{
            fontSize: fontSize.body,
            fontWeight: fontWeight.semibold,
            color: alert.acknowledged ? colors.text.secondary : colors.text.primary,
            margin: 0,
          }}>
            {sensorLabel}
          </Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <span style={{
            padding: `2px ${spacing.sm}`,
            borderRadius: 99,
            fontSize: fontSize.small,
            fontWeight: fontWeight.medium,
            backgroundColor: alert.acknowledged ? colors.background.secondary : `${borderColor}22`,
            color: alert.acknowledged ? colors.text.secondary : borderColor,
          }}>
            {severityLabel}
          </span>
          {alert.acknowledged && (
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              backgroundColor: `${colors.primary.agriGreen}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check" size="sm" color={colors.primary.agriGreen} />
            </span>
          )}
        </div>
      </div>

      {/* Value vs threshold */}
      <div style={{ marginBottom: spacing.xs }}>
        <Text style={{ fontSize: fontSize.small, color: colors.text.secondary, margin: 0 }}>
          Giá trị đo:{' '}
          <span style={{ fontWeight: fontWeight.semibold, color: alert.acknowledged ? colors.text.secondary : borderColor }}>
            {alert.value}{unit}
          </span>
          {' '}/ Ngưỡng:{' '}
          <span style={{ fontWeight: fontWeight.medium }}>{alert.threshold}{unit}</span>
        </Text>
      </div>

      {/* Suggested action */}
      {alert.suggestedAction && (
        <Text style={{
          fontSize: fontSize.small,
          color: colors.text.secondary,
          margin: `0 0 ${spacing.sm} 0`,
          lineHeight: 1.5,
        }}>
          {alert.suggestedAction}
        </Text>
      )}

      {/* Footer: time + acknowledge button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
        <Text style={{ fontSize: fontSize.xSmall, color: colors.text.disabled, margin: 0 }}>
          {alert.acknowledged && alert.acknowledgedAt
            ? `Đã xử lý • ${formatRelativeTime(alert.acknowledgedAt)}`
            : formatRelativeTime(alert.createdAt)}
        </Text>

        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            disabled={isAcknowledging}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: borderColor,
              color: alert.severity === 'danger' ? colors.text.inverse : colors.text.primary,
              border: 'none',
              borderRadius: 6,
              fontSize: fontSize.small,
              fontWeight: fontWeight.medium,
              cursor: isAcknowledging ? 'not-allowed' : 'pointer',
              opacity: isAcknowledging ? 0.6 : 1,
              transition: 'opacity 0.2s',
              minHeight: 32,
            }}
          >
            {isAcknowledging ? 'Đang xử lý…' : 'Xác nhận'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export const FarmerAlertListScreen: React.FC<FarmerAlertListScreenProps> = ({
  farmId: farmIdProp,
}) => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const session = useAtomValue(authSessionAtom);
  const decrementAlertBadge = useSetAtom(decrementFarmAlertBadgeAtom);

  // ── Resolve farmId from session when not provided as prop ──────────────────
  const [resolvedFarmId, setResolvedFarmId] = useState<string | null>(farmIdProp ?? null);
  const resolvingRef = useRef(false);
  const resolvedOwnerRef = useRef<string | null>(null);

  useEffect(() => {
    if (farmIdProp) {
      setResolvedFarmId(farmIdProp);
      return;
    }
    if (!session?.userId) return;
    if (resolvedOwnerRef.current === session.userId || resolvingRef.current) return;

    let cancelled = false;
    resolvingRef.current = true;

    (async () => {
      try {
        const res = await listFarms({ ownerId: session.userId, page: 1, limit: 1 });
        if (cancelled) return;
        const first = res.items[0];
        if (first) {
          resolvedOwnerRef.current = session.userId;
          setResolvedFarmId(first.id);
        } else {
          openSnackbar({
            type: 'error',
            text: 'Bạn chưa có vườn nào để xem cảnh báo.',
            duration: 4000,
            icon: true,
          });
        }
      } catch {
        if (!cancelled) {
          openSnackbar({
            type: 'error',
            text: 'Không thể xác định vườn. Vui lòng thử lại.',
            duration: 3500,
            icon: true,
          });
        }
      } finally {
        if (!cancelled) resolvingRef.current = false;
      }
    })();

    return () => { cancelled = true; };
  }, [farmIdProp, session?.userId, openSnackbar]);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  // ── Data state ────────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // ── Load from API ─────────────────────────────────────────────────────────
  const loadAlerts = useCallback(async () => {
    if (!resolvedFarmId) return;
    setIsLoading(true);
    try {
      const res = await monitoringService.listAlerts(resolvedFarmId, {
        status: statusFilter,
        severity: severityFilter === 'all' ? undefined : severityFilter,
        page: 1,
        limit: 50,
      });
      setAlerts(res.items);
      setTotal(res.total);
    } catch (err) {
      openSnackbar({
        type: 'error',
        text: toViErrorMessage(err),
        duration: 3500,
        icon: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [resolvedFarmId, statusFilter, severityFilter, openSnackbar]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // ── WebSocket: alert_created → thêm vào danh sách nếu khớp filter ─────────
  useEffect(() => {
    if (!resolvedFarmId) return;

    const cleanup = subscribeToFarmAlerts(resolvedFarmId, (newAlert) => {
      if (newAlert.acknowledged) return;

      // Kiểm tra filter severity
      if (severityFilter !== 'all' && newAlert.severity !== severityFilter) return;
      // Kiểm tra filter status: 'acknowledged' thì không thêm alert mới
      if (statusFilter === 'acknowledged') return;

      setAlerts((prev) => {
        if (prev.some((a) => a.id === newAlert.id)) return prev;
        return [newAlert, ...prev];
      });
      setTotal((prev) => prev + 1);
    });

    return cleanup;
  }, [resolvedFarmId, statusFilter, severityFilter]);

  // ── Acknowledge ───────────────────────────────────────────────────────────
  const handleAcknowledge = useCallback(
    async (alertId: string) => {
      setAcknowledgingId(alertId);
      try {
        await monitoringService.acknowledgeAlert(alertId);
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId
              ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() }
              : a,
          ),
        );
        // Cập nhật badge atom cross-screen
        if (resolvedFarmId) decrementAlertBadge(resolvedFarmId);
        openSnackbar({ type: 'success', text: 'Đã xác nhận cảnh báo.', duration: 2500, icon: true });
      } catch (err) {
        openSnackbar({
          type: 'error',
          text: toViErrorMessage(err),
          duration: 3000,
          icon: true,
        });
      } finally {
        setAcknowledgingId(null);
      }
    },
    [resolvedFarmId, decrementAlertBadge, openSnackbar],
  );

  // ── Acknowledge all ───────────────────────────────────────────────────────
  const handleAcknowledgeAll = useCallback(async () => {
    const unacked = alerts.filter((a) => !a.acknowledged);
    if (!unacked.length) return;

    for (const a of unacked) {
      try {
        await monitoringService.acknowledgeAlert(a.id);
        if (resolvedFarmId) decrementAlertBadge(resolvedFarmId);
      } catch {
        // Continue best-effort; individual errors handled silently
      }
    }
    setAlerts((prev) =>
      prev.map((a) =>
        !a.acknowledged ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a,
      ),
    );
    openSnackbar({
      type: 'success',
      text: `Đã xác nhận ${unacked.length} cảnh báo.`,
      duration: 2500,
      icon: true,
    });
  }, [alerts, resolvedFarmId, decrementAlertBadge, openSnackbar]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;
  const hasUnacked = alerts.some((a) => !a.acknowledged);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Page className="farmer-alert-list-screen">
      <style>{`
        @keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .skeleton-pulse { animation: skeleton-pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        padding: `${spacing.sm} ${spacing.md}`,
        backgroundColor: colors.background.primary,
        borderBottom: `1px solid ${colors.background.secondary}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 40, height: 40, borderRadius: '50%', backgroundColor: 'transparent',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
          aria-label="Quay lại"
        >
          <Icon name="chevron-left" size="md" color={colors.text.primary} />
        </button>

        <div style={{ flex: 1 }}>
          <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
            Cảnh báo cảm biến
          </Text.Title>
          {unacknowledgedCount > 0 && !isLoading && (
            <Text size="xSmall" style={{ margin: 0, color: colors.functional.alertRed }}>
              {unacknowledgedCount} chưa xử lý
            </Text>
          )}
        </div>

        {/* Nút tải lại */}
        <button
          onClick={loadAlerts}
          disabled={isLoading}
          style={{
            width: 40, height: 40, borderRadius: '50%', backgroundColor: 'transparent',
            border: 'none', cursor: isLoading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            opacity: isLoading ? 0.4 : 1,
          }}
          aria-label="Tải lại danh sách cảnh báo"
        >
          <Icon name="filter" size="md" color={colors.text.secondary} />
        </button>
      </div>

      <div style={{ paddingBottom: 24 }}>
        {/* ── Status filter tabs ─────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.background.secondary}`,
          backgroundColor: colors.background.primary,
        }}>
          {([
            { key: 'all', label: 'Tất cả' },
            { key: 'unacknowledged', label: 'Chưa xử lý' },
            { key: 'acknowledged', label: 'Đã xử lý' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                flex: 1,
                padding: `${spacing.sm} ${spacing.xs}`,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: statusFilter === key
                  ? `2px solid ${colors.primary.zaloBlue}`
                  : '2px solid transparent',
                color: statusFilter === key ? colors.primary.zaloBlue : colors.text.secondary,
                fontSize: fontSize.small,
                fontWeight: statusFilter === key ? fontWeight.semibold : fontWeight.regular,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Severity chips ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          gap: spacing.xs,
          padding: `${spacing.sm} ${spacing.md}`,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
          alignItems: 'center',
        }}>
          {([
            { key: 'all', label: 'Tất cả', color: undefined },
            { key: 'danger', label: 'Nguy hiểm', color: colors.functional.alertRed },
            { key: 'warning', label: 'Cảnh báo', color: colors.functional.warningYellow },
          ] as const).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setSeverityFilter(key)}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                borderRadius: 99,
                border: `1px solid ${severityFilter === key ? (color ?? colors.primary.zaloBlue) : colors.background.secondary}`,
                backgroundColor: severityFilter === key
                  ? `${(color ?? colors.primary.zaloBlue)}18`
                  : colors.background.primary,
                color: severityFilter === key
                  ? (color ?? colors.primary.zaloBlue)
                  : colors.text.secondary,
                fontSize: fontSize.small,
                fontWeight: severityFilter === key ? fontWeight.semibold : fontWeight.regular,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s',
              }}
            >
              {label}
            </button>
          ))}
          {!isLoading && (
            <span style={{
              marginLeft: 'auto',
              fontSize: fontSize.xSmall,
              color: colors.text.secondary,
            }}>
              {total} kết quả
            </span>
          )}
        </div>

        {/* ── Alert list ────────────────────────────────────────────────── */}
        <div style={{ padding: `${spacing.sm} ${spacing.md} 0` }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <AlertCardSkeleton key={i} />)
          ) : alerts.length === 0 ? (
            <EmptyState
              icon="🌱"
              title={
                statusFilter === 'unacknowledged'
                  ? 'Không có cảnh báo nào cần xử lý'
                  : statusFilter === 'acknowledged'
                  ? 'Chưa có cảnh báo nào được xử lý'
                  : 'Chưa có cảnh báo nào'
              }
              description={
                statusFilter === 'unacknowledged'
                  ? 'Tất cả cảnh báo đều đã được xử lý. Vườn đang trong trạng thái tốt!'
                  : 'Hệ thống sẽ thông báo khi có giá trị vượt ngưỡng an toàn.'
              }
            />
          ) : (
            alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                isAcknowledging={acknowledgingId === alert.id}
              />
            ))
          )}
        </div>

        {/* ── Acknowledge all button ────────────────────────────────────── */}
        {!isLoading && hasUnacked && (
          <div style={{ padding: `${spacing.sm} ${spacing.md}` }}>
            <button
              onClick={handleAcknowledgeAll}
              style={{
                width: '100%',
                padding: spacing.md,
                backgroundColor: colors.background.secondary,
                border: `1px solid ${colors.background.tertiary}`,
                borderRadius: 10,
                color: colors.text.secondary,
                fontSize: fontSize.body,
                fontWeight: fontWeight.medium,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              Xác nhận tất cả cảnh báo chưa xử lý
            </button>
          </div>
        )}
      </div>
    </Page>
  );
};

export default FarmerAlertListScreen;
