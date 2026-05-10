/**
 * SemanticSensorCard — Phase 4 (FR-U05, NFR-A01)
 * Displays a single sensor reading with semantic status label + color bar.
 * If isImputed=true, renders with small gray dot marker (NFR-A01).
 */

import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';

export type SensorStatus = 'optimal' | 'attention' | 'warning';

export interface SemanticSensorCardProps {
  label: string;
  value: number | null;
  unit: string;
  status: SensorStatus;
  isImputed?: boolean;
}

// ── Threshold helpers (exported for use in detail screen) ─────────────────────

export function computeTemperatureStatus(value: number): SensorStatus {
  if (value >= 22 && value <= 30) return 'optimal';
  if ((value >= 18 && value < 22) || (value > 30 && value <= 34)) return 'attention';
  return 'warning';
}

export function computeSoilMoistureStatus(value: number): SensorStatus {
  if (value >= 35 && value <= 65) return 'optimal';
  if ((value >= 25 && value < 35) || (value > 65 && value <= 80)) return 'attention';
  return 'warning';
}

export function computeLightStatus(value: number): SensorStatus {
  if (value >= 2000 && value <= 10000) return 'optimal';
  if ((value >= 500 && value < 2000) || (value > 10000 && value <= 15000)) return 'attention';
  return 'warning';
}

// ── Status helpers ────────────────────────────────────────────────────────────

function statusColor(status: SensorStatus): string {
  switch (status) {
    case 'optimal':
      return colors.semantic.success;
    case 'attention':
      return colors.semantic.warning;
    case 'warning':
      return colors.semantic.error;
  }
}

function statusLabel(status: SensorStatus): string {
  switch (status) {
    case 'optimal':
      return 'Tối ưu';
    case 'attention':
      return 'Chú ý';
    case 'warning':
      return 'Cảnh báo';
  }
}

/**
 * Compute bar fill percentage (0–100) from value relative to sensor type ranges.
 * Falls back to 50% when value is null/unknown.
 */
function barPercent(value: number | null, status: SensorStatus): number {
  if (value === null) return 50;
  // Clamp to 0–100 for display. Status color conveys meaning.
  return Math.min(100, Math.max(0, Math.round((value / 100) * 100)));
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SemanticSensorCard: React.FC<SemanticSensorCardProps> = ({
  label,
  value,
  unit,
  status,
  isImputed = false,
}) => {
  const color = statusColor(status);
  const pct = barPercent(value, status);

  return (
    <div
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: '12px',
        padding: spacing.md,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        position: 'relative',
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Imputed marker — NFR-A01 */}
      {isImputed && (
        <div
          title="Giá trị ước tính"
          style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: colors.text.disabled,
          }}
        />
      )}

      {/* Label */}
      <Text
        size="xSmall"
        style={{
          color: colors.text.secondary,
          margin: `0 0 ${spacing.xs} 0`,
          display: 'block',
          fontSize: '12px',
        }}
      >
        {label}
      </Text>

      {/* Semantic status + value */}
      <div style={{ marginBottom: spacing.sm }}>
        <Text
          size="small"
          style={{
            fontSize: '20px',
            fontWeight: fontWeight.bold,
            color,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {statusLabel(status)}
        </Text>
        <Text
          size="xSmall"
          style={{
            color: colors.text.secondary,
            margin: `${spacing.xs} 0 0 0`,
            fontSize: '12px',
          }}
        >
          {value !== null ? `${value}${unit}` : '—'}
        </Text>
      </div>

      {/* Color bar */}
      <div
        style={{
          height: '6px',
          backgroundColor: colors.background.secondary,
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: '3px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
};
