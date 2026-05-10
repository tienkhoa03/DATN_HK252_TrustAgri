/**
 * Sparkline — inline SVG mini trend line (no axes, no labels)
 *
 * Requirements: NFR-A01, FR-T02
 */

import React from 'react';
import { colors } from '../../tokens/colors';

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 32,
  color = colors.primary.agriGreen,
  strokeWidth = 1.5,
}) => {
  const pad = 2;

  if (!data || data.length < 2) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * innerW;
      const y = pad + innerH - ((v - minVal) / range) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;
