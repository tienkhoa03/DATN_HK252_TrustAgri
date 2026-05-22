/**
 * FarmMonitoringDetail — detail panel: sensor gauges + care-log vs standard table
 * FR-T11, FR-T08, NFR-A01, NFR-U03
 */

import React, { useEffect, useState } from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { Gauge } from '@/design-system/components/Gauge';
import { Icon } from '@/design-system/components/Icon';
import { useMonitoring } from '@/hooks/useMonitoring';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { listCareLogs, type CareLogDto } from '@/services/careLogService';
import { listStandards, type StandardDto, type StandardStepDto } from '@/services/standardService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FarmMonitoringDetailProps {
  farmId: string;
  farmName: string;
  cropType: string;
  onClose: () => void;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ w?: string; h?: string }> = ({
  w = '100%',
  h = '14px',
}) => (
  <div
    className="skeleton-pulse"
    style={{ width: w, height: h, borderRadius: '4px', backgroundColor: colors.background.secondary }}
  />
);

// ── Sensor gauge row ──────────────────────────────────────────────────────────

interface SensorGaugeConfig {
  sensorType: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  dangerLow: number;
  dangerHigh: number;
  warningLow: number;
  warningHigh: number;
}

const GAUGE_CONFIGS: SensorGaugeConfig[] = [
  {
    sensorType: 'temperature',
    label: 'Nhiệt độ',
    unit: '°C',
    min: 0,
    max: 50,
    dangerLow: 10,
    dangerHigh: 40,
    warningLow: 15,
    warningHigh: 35,
  },
  {
    sensorType: 'humidity',
    label: 'Độ ẩm KK',
    unit: '%',
    min: 0,
    max: 100,
    dangerLow: 30,
    dangerHigh: 90,
    warningLow: 40,
    warningHigh: 80,
  },
  {
    sensorType: 'light',
    label: 'Ánh sáng',
    unit: 'lux',
    min: 0,
    max: 100000,
    dangerLow: 1000,
    dangerHigh: 80000,
    warningLow: 3000,
    warningHigh: 60000,
  },
];

// ── Table row component ────────────────────────────────────────────────────────

const TableRow: React.FC<{
  log: CareLogDto;
  step: StandardStepDto | undefined;
  isLast: boolean;
}> = ({ log, step, isLast }) => {
  const borderBottom = isLast ? 'none' : `1px solid ${colors.background.tertiary}`;
  const cellBase: React.CSSProperties = {
    padding: spacing.sm,
    verticalAlign: 'top',
    fontSize: fontSize.small,
    borderBottom,
  };

  return (
    <tr>
      <td style={{ ...cellBase, borderRight: `1px solid ${colors.background.tertiary}`, width: '50%' }}>
        <div style={{ fontWeight: fontWeight.medium, marginBottom: 2 }}>
          {log.standardStepTitle ?? log.action}
        </div>
        {log.notes && (
          <div style={{ color: colors.text.secondary, fontSize: fontSize.small }}>
            {log.notes}
          </div>
        )}
        <div style={{ color: colors.text.secondary, fontSize: fontSize.small, marginTop: 2 }}>
          {new Date(log.performedAt).toLocaleDateString('vi-VN')}
        </div>
      </td>
      <td style={{ ...cellBase, width: '50%' }}>
        {step ? (
          <>
            <div style={{ fontWeight: fontWeight.medium, marginBottom: 2 }}>{step.title}</div>
            <div style={{ color: colors.text.secondary, fontSize: fontSize.small }}>
              {step.description.length > 80
                ? step.description.slice(0, 80) + '…'
                : step.description}
            </div>
          </>
        ) : (
          <span style={{ color: colors.text.disabled }}>—</span>
        )}
      </td>
    </tr>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const FarmMonitoringDetail: React.FC<FarmMonitoringDetailProps> = ({
  farmId,
  farmName,
  cropType,
  onClose,
}) => {
  const openSnackbar = useStableOpenSnackbar();

  // Sensor data from useMonitoring (hook must be at component top-level)
  const { latestReadings, isLatestLoading, error: sensorError, clearError } = useMonitoring(farmId);

  // Care logs + standards
  const [careLogs, setCareLogs] = useState<CareLogDto[]>([]);
  const [standard, setStandard] = useState<StandardDto | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Propagate sensor error to snackbar
  useEffect(() => {
    if (sensorError) {
      openSnackbar({ type: 'error', text: sensorError, duration: 4000, icon: true });
      clearError();
    }
  }, [sensorError, openSnackbar, clearError]);

  // Load care logs + standards on mount
  useEffect(() => {
    let cancelled = false;
    setTableLoading(true);
    Promise.all([
      listCareLogs(farmId, { page: 1, limit: 20 }),
      listStandards({ page: 1, limit: 50 }),
    ])
      .then(([logRes, stdRes]) => {
        if (cancelled) return;
        setCareLogs(logRes.items);
        // Match standard by cropType first; fallback to first
        const matched =
          stdRes.items.find((s) => (s as StandardDto & { cropType?: string }).cropType === cropType) ??
          stdRes.items[0] ??
          null;
        setStandard(matched);
        setTableLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : 'Không thể tải dữ liệu. Vui lòng thử lại.';
        openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
        setTableLoading(false);
      });
    return () => { cancelled = true; };
  }, [farmId, cropType, openSnackbar]);

  // Build step map from standard
  const stepById = React.useMemo(() => {
    const m = new Map<string, StandardStepDto>();
    (standard?.steps ?? []).forEach((s) => m.set(s.id, s));
    return m;
  }, [standard]);

  const displayedLogs = showAll ? careLogs : careLogs.slice(0, 10);
  const hasMore = careLogs.length > 10;

  return (
    <div
      style={{
        padding: spacing.md,
        backgroundColor: colors.background.primary,
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        marginTop: spacing.md,
        border: `1px solid ${colors.background.tertiary}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Text.Title size="small" style={{ margin: 0, flex: 1 }}>
          {farmName}
        </Text.Title>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chi tiết"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: spacing.xs,
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size="md" color={colors.text.secondary} />
        </button>
      </div>

      {/* Section 1: Sensor gauges */}
      <Text
        size="small"
        style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.sm }}
      >
        Cảm biến hiện tại
      </Text>

      {isLatestLoading ? (
        <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
          {[1, 2, 3].map((k) => (
            <div key={k} style={{ flex: 1 }}>
              <SkeletonBlock h="80px" />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: spacing.md,
            flexWrap: 'wrap',
            gap: spacing.sm,
          }}
        >
          {GAUGE_CONFIGS.map((cfg) => {
            const reading = latestReadings.find((r) => r.sensorType === cfg.sensorType);
            const value = reading ? reading.value : NaN;
            const isImputed = reading?.isImputed ?? false;

            return (
              <div
                key={cfg.sensorType}
                style={{ textAlign: 'center', position: 'relative' }}
                title={isImputed ? 'Ước tính (dữ liệu bổ khuyết)' : undefined}
              >
                <Gauge
                  value={value}
                  min={cfg.min}
                  max={cfg.max}
                  unit={cfg.unit}
                  label={cfg.label}
                  dangerLow={cfg.dangerLow}
                  dangerHigh={cfg.dangerHigh}
                  warningLow={cfg.warningLow}
                  warningHigh={cfg.warningHigh}
                  size={90}
                />
                {isImputed && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      fontSize: '10px',
                      color: colors.text.secondary,
                      backgroundColor: colors.background.secondary,
                      borderRadius: '3px',
                      padding: '1px 3px',
                    }}
                    aria-label="Dữ liệu ước tính"
                  >
                    ~
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: colors.background.secondary,
          marginBottom: spacing.md,
        }}
      />

      {/* Section 2: Care log vs standard table */}
      <Text
        size="small"
        style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.sm }}
      >
        Nhật ký chăm sóc vs Tiêu chuẩn
      </Text>

      {tableLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {[1, 2, 3].map((k) => (
            <SkeletonBlock key={k} h="48px" />
          ))}
        </div>
      ) : careLogs.length === 0 ? (
        <div
          style={{
            padding: spacing.md,
            textAlign: 'center',
            color: colors.text.secondary,
            fontSize: fontSize.small,
            backgroundColor: colors.background.secondary,
            borderRadius: '8px',
          }}
        >
          Chưa có nhật ký chăm sóc nào
        </div>
      ) : (
        <>
          <div
            style={{
              overflowX: 'auto',
              border: `1px solid ${colors.background.tertiary}`,
              borderRadius: '8px',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: fontSize.small,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: spacing.sm,
                      backgroundColor: colors.background.secondary,
                      color: colors.text.secondary,
                      fontWeight: fontWeight.semibold,
                      fontSize: fontSize.small,
                      textAlign: 'left',
                      borderBottom: `1px solid ${colors.background.tertiary}`,
                      width: '50%',
                    }}
                  >
                    Nhật ký chăm sóc
                  </th>
                  <th
                    style={{
                      padding: spacing.sm,
                      backgroundColor: colors.background.secondary,
                      color: colors.text.secondary,
                      fontWeight: fontWeight.semibold,
                      fontSize: fontSize.small,
                      textAlign: 'left',
                      borderBottom: `1px solid ${colors.background.tertiary}`,
                      width: '50%',
                    }}
                  >
                    Tiêu chuẩn mẫu
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedLogs.map((log, idx) => (
                  <TableRow
                    key={log.id}
                    log={log}
                    step={log.standardStepId ? stepById.get(log.standardStepId) : undefined}
                    isLast={idx === displayedLogs.length - 1}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                marginTop: spacing.sm,
                background: 'none',
                border: `1px solid ${colors.background.tertiary}`,
                borderRadius: '6px',
                padding: `${spacing.xs} ${spacing.md}`,
                cursor: 'pointer',
                fontSize: fontSize.small,
                color: colors.primary.zaloBlue,
                width: '100%',
                minHeight: '44px',
              }}
            >
              Xem thêm ({careLogs.length - 10} mục)
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default FarmMonitoringDetail;
