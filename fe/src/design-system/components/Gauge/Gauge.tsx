/**
 * Gauge — SVG half-arc gauge for sensor readings (NFR-A01, NFR-U03)
 *
 * Renders a 180° semicircle arc from left to right.
 * Color zones: green (normal), yellow (warning), red (danger).
 * If value is NaN/undefined → grey "—".
 */

import React from 'react';
import { colors } from '../../tokens/colors';
import { fontSize, fontWeight } from '../../tokens/typography';

export interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  dangerLow?: number;
  dangerHigh?: number;
  warningLow?: number;
  warningHigh?: number;
  size?: number;
}

function getArcColor(
  value: number,
  dangerLow?: number,
  dangerHigh?: number,
  warningLow?: number,
  warningHigh?: number,
): string {
  if (dangerLow !== undefined && value < dangerLow) return colors.functional.alertRed;
  if (dangerHigh !== undefined && value > dangerHigh) return colors.functional.alertRed;
  if (warningLow !== undefined && value < warningLow) return colors.functional.warningYellow;
  if (warningHigh !== undefined && value > warningHigh) return colors.functional.warningYellow;
  return colors.primary.agriGreen;
}

/**
 * Polar → cartesian for SVG arc. cx/cy is arc center.
 * angleDeg=0 is left tip, 180 is right tip (standard semicircle orientation).
 */
function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  min = 0,
  max = 100,
  unit,
  label,
  dangerLow,
  dangerHigh,
  warningLow,
  warningHigh,
  size = 100,
}) => {
  const isValid = typeof value === 'number' && !isNaN(value);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeW = size * 0.1;

  // Clamp and map value to 0–180 degrees
  const pct = isValid ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
  const fillAngle = pct * 180; // 0 = leftmost, 180 = rightmost

  const trackColor = colors.background.secondary;
  const arcColor = isValid
    ? getArcColor(value, dangerLow, dangerHigh, warningLow, warningHigh)
    : '#CCCCCC';

  // Track: full 180 arc (0 → 180)
  const trackPath = describeArc(cx, cy, r, 0, 179.99);
  // Fill arc: 0 → fillAngle (guard against 0 length)
  const fillPath = isValid && fillAngle > 0.5
    ? describeArc(cx, cy, r, 0, fillAngle)
    : null;

  const valueText = isValid ? value.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) : '—';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: size,
        minHeight: 44,
      }}
      aria-label={label ? `${label}: ${valueText}${unit ?? ''}` : `${valueText}${unit ?? ''}`}
    >
      <svg
        width={size}
        height={size * 0.6}
        viewBox={`0 0 ${size} ${size * 0.6}`}
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        {/* Track arc */}
        <path
          d={trackPath}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Fill arc */}
        {fillPath && (
          <path
            d={fillPath}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        )}
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={strokeW * 0.3} fill={isValid ? arcColor : '#CCCCCC'} />
      </svg>

      {/* Value */}
      <span
        style={{
          fontSize: size > 80 ? fontSize.caption : fontSize.small,
          fontWeight: fontWeight.bold,
          color: isValid ? arcColor : colors.text.disabled,
          lineHeight: 1,
          marginTop: 2,
        }}
      >
        {valueText}
      </span>

      {/* Unit */}
      {unit && (
        <span
          style={{
            fontSize: fontSize.small,
            color: colors.text.secondary,
            lineHeight: 1,
          }}
        >
          {unit}
        </span>
      )}

      {/* Label */}
      {label && (
        <span
          style={{
            fontSize: fontSize.small,
            color: colors.text.secondary,
            lineHeight: 1.2,
            textAlign: 'center',
            marginTop: 2,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default Gauge;
