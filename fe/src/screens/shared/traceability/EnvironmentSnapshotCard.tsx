import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import type { TraceabilityEnvironmentReadingDto } from '@/services/traceabilityService';

interface Props {
  readings: TraceabilityEnvironmentReadingDto[];
}

const SENSOR_LABEL: Record<string, string> = {
  temperature: 'Nhiệt độ',
  humidity: 'Độ ẩm không khí',
  light: 'Ánh sáng',
  soil_moisture: 'Độ ẩm đất',
};

const SENSOR_UNIT: Record<string, string> = {
  temperature: '°C',
  humidity: '%',
  light: 'lux',
  soil_moisture: '%',
};

const SENSOR_EMOJI: Record<string, string> = {
  temperature: '🌡️',
  humidity: '💧',
  light: '☀️',
  soil_moisture: '🌱',
};

function formatRecordedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export const EnvironmentSnapshotCard: React.FC<Props> = ({ readings }) => {
  if (readings.length === 0) return null;

  return (
    <div style={{ padding: spacing.md, backgroundColor: colors.background.secondary, borderTop: `1px solid ${colors.background.tertiary}` }}>
      <div style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.md }}>
        Môi trường hiện tại
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: spacing.sm }}>
        {readings.map((r) => (
          <div
            key={r.sensorType}
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: '10px',
              padding: spacing.md,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.xs,
              minHeight: '80px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <span style={{ fontSize: '18px' }}>{SENSOR_EMOJI[r.sensorType] ?? '📡'}</span>
              <Text size="xSmall" style={{ color: colors.text.secondary }}>
                {SENSOR_LABEL[r.sensorType] ?? r.sensorType}
              </Text>
              {r.isImputed && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: colors.text.secondary,
                    display: 'inline-block',
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}
                  title="Giá trị nội suy"
                />
              )}
            </div>
            <div style={{ fontSize: '20px', fontWeight: fontWeight.bold, color: colors.text.primary }}>
              {r.value.toFixed(1)}
              <span style={{ fontSize: fontSize.caption, fontWeight: fontWeight.regular, color: colors.text.secondary, marginLeft: '2px' }}>
                {SENSOR_UNIT[r.sensorType] ?? ''}
              </span>
            </div>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              {formatRecordedAt(r.recordedAt)}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentSnapshotCard;
