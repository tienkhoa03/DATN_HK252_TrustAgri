/**
 * IotDashboardSection — 4 Gauge sensors with tap-to-history (FR-F07, NFR-A01)
 */

import React, { useState, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { Gauge } from '@/design-system/components/Gauge';
import { SensorLineChart } from '@/design-system/components/SensorLineChart';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useMonitoring } from '@/hooks/useMonitoring';
import type { SensorType } from '@/services/monitoringService';

const SENSOR_LABELS: Record<SensorType, string> = {
  temperature: 'Nhiệt độ',
  humidity: 'Độ ẩm KK',
  light: 'Ánh sáng',
  soil_moisture: 'Độ ẩm đất',
};

const SENSOR_UNITS: Record<SensorType, string> = {
  temperature: '°C',
  humidity: '%',
  light: 'lux',
  soil_moisture: '%',
};

// Gauge thresholds (same as original dashboard)
const SENSOR_THRESHOLDS: Record<SensorType, { warn: number; danger: number }> = {
  temperature: { warn: 34, danger: 38 },
  humidity: { warn: 40, danger: 25 },
  light: { warn: 200, danger: 100 },
  soil_moisture: { warn: 35, danger: 20 },
};

// For Gauge (dangerLow/dangerHigh/warningLow/warningHigh) based on sensor type
function gaugeThresholds(st: SensorType) {
  const t = SENSOR_THRESHOLDS[st];
  if (st === 'humidity' || st === 'soil_moisture') {
    // Low values are dangerous
    return { dangerLow: t.danger, warningLow: t.warn };
  }
  return { dangerHigh: t.danger, warningHigh: t.warn };
}

// Gauge max values for normalization
const SENSOR_MAX: Record<SensorType, number> = {
  temperature: 50,
  humidity: 100,
  light: 1000,
  soil_moisture: 100,
};

const SENSOR_TYPE_ORDER: SensorType[] = ['temperature', 'humidity', 'light', 'soil_moisture'];

const CHART_COLORS: Record<SensorType, string> = {
  temperature: colors.functional.alertRed,
  humidity: colors.primary.zaloBlue,
  light: colors.functional.warningYellow,
  soil_moisture: colors.primary.agriGreen,
};

export interface IotDashboardSectionProps {
  farmId: string | null;
}

export const IotDashboardSection: React.FC<IotDashboardSectionProps> = ({ farmId }) => {
  const { latestReadings, isLatestLoading, historyData, isHistoryLoading, loadHistory, error, clearError } = useMonitoring(farmId);
  const [modalSensor, setModalSensor] = useState<SensorType | null>(null);

  const latestMap: Partial<Record<SensorType, typeof latestReadings[0]>> = {};
  for (const r of latestReadings) latestMap[r.sensorType] = r;

  const handleGaugeTap = useCallback((st: SensorType) => {
    setModalSensor(st);
    loadHistory(st);
  }, [loadHistory]);

  return (
    <div style={{ padding: `${spacing.sm} ${spacing.md} 0` }}>
      <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}` }}>
        Cảm biến thời gian thực
      </Text.Title>

      {error && (
        <div style={{ padding: spacing.sm, backgroundColor: `${colors.functional.alertRed}12`, borderRadius: 8, marginBottom: spacing.sm }}>
          <span style={{ fontSize: fontSize.small, color: colors.functional.alertRed }}>{error}</span>
          <button type="button" onClick={clearError} style={{ marginLeft: spacing.sm, background: 'none', border: 'none', cursor: 'pointer', color: colors.functional.alertRed, fontSize: fontSize.small, minHeight: 44 }}>
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
        {SENSOR_TYPE_ORDER.map((st) => {
          const reading = latestMap[st];
          const thresholds = gaugeThresholds(st);
          const value = reading ? reading.value : NaN;
          const isImputed = reading?.isImputed ?? false;

          return (
            <button
              key={st}
              type="button"
              onClick={() => handleGaugeTap(st)}
              aria-label={`${SENSOR_LABELS[st]}: ${value}${SENSOR_UNITS[st]} — Xem lịch sử`}
              style={{
                position: 'relative',
                padding: spacing.sm,
                backgroundColor: colors.background.primary,
                border: `1px solid ${colors.background.secondary}`,
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 44,
              }}
            >
              {isLatestLoading ? (
                <div style={{ width: 80, height: 60, backgroundColor: colors.background.secondary, borderRadius: 8 }} className="skeleton-pulse" />
              ) : (
                <Gauge
                  value={value}
                  min={0}
                  max={SENSOR_MAX[st]}
                  unit={SENSOR_UNITS[st]}
                  label={SENSOR_LABELS[st]}
                  size={80}
                  {...thresholds}
                />
              )}
              {/* Imputed marker (NFR-A01) */}
              {isImputed && !isLatestLoading && (
                <div
                  aria-label="Giá trị ước tính"
                  title="Giá trị ước tính"
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: colors.text.secondary,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Sensor history modal */}
      {modalSensor && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalSensor(null); }}
        >
          <div style={{ backgroundColor: colors.background.primary, borderRadius: '16px 16px 0 0', padding: spacing.md, maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
              <span style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold, color: colors.text.primary }}>
                {SENSOR_LABELS[modalSensor]} — Lịch sử 24h
              </span>
              <button type="button" onClick={() => setModalSensor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: colors.text.secondary, minHeight: 44, minWidth: 44 }}>
                ✕
              </button>
            </div>
            {isHistoryLoading ? (
              <div style={{ height: 160, backgroundColor: colors.background.secondary, borderRadius: 8 }} className="skeleton-pulse" />
            ) : (
              <SensorLineChart
                data={historyData}
                title={SENSOR_LABELS[modalSensor]}
                unit={historyData[0]?.unit}
                lineColor={CHART_COLORS[modalSensor]}
                width={328}
                height={160}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IotDashboardSection;
