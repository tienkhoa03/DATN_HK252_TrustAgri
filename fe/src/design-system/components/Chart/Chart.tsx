/**
 * Chart Component
 * Chart component với types (line, bar, area)
 * 
 * Requirements: 6.1, 7.2, 17.1, 17.2
 */

import React, { useMemo } from 'react';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize, fontWeight } from '../../tokens/typography';

export type ChartType = 'line' | 'bar' | 'area';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface AxisConfig {
  label?: string;
  min?: number;
  max?: number;
  showTicks?: boolean;
  tickCount?: number;
}

export interface ChartProps {
  type: ChartType;
  data: ChartDataPoint[];
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  width?: number;
  height?: number;
  className?: string;
  'aria-label'?: string;
}

/**
 * Chart Component
 * Hiển thị dữ liệu dưới dạng biểu đồ với màu sắc phù hợp
 * Requirements: 6.1 (Data Visualization), 7.2 (Market Trends), 17.1, 17.2 (Dashboard Charts)
 */
export const Chart: React.FC<ChartProps> = ({
  type,
  data,
  xAxis = {},
  yAxis = {},
  colors: customColors,
  showGrid = true,
  showLegend = false,
  width = 360,
  height = 240,
  className = '',
  'aria-label': ariaLabel,
}) => {
  // Calculate chart dimensions with padding for axes
  const padding = {
    top: 20,
    right: 20,
    bottom: xAxis.label ? 50 : 40,
    left: yAxis.label ? 60 : 50,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate data ranges
  const { minValue, maxValue, valueRange } = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = yAxis.min !== undefined ? yAxis.min : Math.min(...values, 0);
    const max = yAxis.max !== undefined ? yAxis.max : Math.max(...values);
    const range = max - min;
    // Handle case where all values are the same (range = 0)
    const safeRange = range === 0 ? 1 : range;
    return { minValue: min, maxValue: max, valueRange: safeRange };
  }, [data, yAxis.min, yAxis.max]);

  // Scale functions
  const scaleX = (index: number): number => {
    return (index / (data.length - 1 || 1)) * chartWidth;
  };

  const scaleY = (value: number): number => {
    return chartHeight - ((value - minValue) / valueRange) * chartHeight;
  };

  // Default colors: Agri Green for positive, Alert Red for negative - Requirement 7.2
  const getDefaultColor = (value: number): string => {
    return value >= 0 ? colors.primary.agriGreen : colors.functional.alertRed;
  };

  const chartColors = customColors || [colors.primary.agriGreen];

  // Generate grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    const tickCount = yAxis.tickCount || 5;
    const lines: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const y = (i / tickCount) * chartHeight;
      lines.push(y);
    }
    return lines;
  }, [showGrid, chartHeight, yAxis.tickCount]);

  // Generate Y-axis ticks
  const yTicks = useMemo(() => {
    const tickCount = yAxis.tickCount || 5;
    const ticks: Array<{ value: number; y: number }> = [];
    for (let i = 0; i <= tickCount; i++) {
      const value = minValue + (valueRange * i) / tickCount;
      const y = chartHeight - (i / tickCount) * chartHeight;
      ticks.push({ value, y });
    }
    return ticks;
  }, [minValue, valueRange, chartHeight, yAxis.tickCount]);

  // Render line chart
  const renderLineChart = () => {
    const points = data
      .map((d, i) => `${scaleX(i)},${scaleY(d.value)}`)
      .join(' ');

    return (
      <g className="chart-line">
        <polyline
          points={points}
          fill="none"
          stroke={chartColors[0]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={scaleX(i)}
            cy={scaleY(d.value)}
            r="4"
            fill={chartColors[0]}
            stroke={colors.background.primary}
            strokeWidth="2"
          />
        ))}
      </g>
    );
  };

  // Render bar chart
  const renderBarChart = () => {
    const barWidth = chartWidth / data.length * 0.7;
    const barSpacing = chartWidth / data.length * 0.3;

    return (
      <g className="chart-bars">
        {data.map((d, i) => {
          const x = scaleX(i) - barWidth / 2;
          const y = scaleY(d.value);
          const barHeight = chartHeight - y;
          const barColor = customColors ? chartColors[i % chartColors.length] : getDefaultColor(d.value);

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={Math.abs(barHeight)}
              fill={barColor}
              rx="4"
              ry="4"
            />
          );
        })}
      </g>
    );
  };

  // Render area chart
  const renderAreaChart = () => {
    const points = data
      .map((d, i) => `${scaleX(i)},${scaleY(d.value)}`)
      .join(' ');

    const areaPoints = `${points} ${chartWidth},${chartHeight} 0,${chartHeight}`;

    return (
      <g className="chart-area">
        {/* Filled area */}
        <polygon
          points={areaPoints}
          fill={`${chartColors[0]}30`}
          stroke="none"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={chartColors[0]}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={scaleX(i)}
            cy={scaleY(d.value)}
            r="4"
            fill={chartColors[0]}
            stroke={colors.background.primary}
            strokeWidth="2"
          />
        ))}
      </g>
    );
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: '-apple-system, Roboto, sans-serif',
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: '8px',
  };

  const svgStyles: React.CSSProperties = {
    overflow: 'visible',
  };

  const axisLabelStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    fill: colors.text.secondary,
  };

  const tickLabelStyles: React.CSSProperties = {
    fontSize: fontSize.small,
    fontWeight: fontWeight.regular,
    fill: colors.text.secondary,
  };

  return (
    <div
      className={`chart chart-${type} ${className}`}
      style={containerStyles}
      role="img"
      aria-label={ariaLabel || `${type} chart with ${data.length} data points`}
    >
      <svg
        width={width}
        height={height}
        style={svgStyles}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {showGrid && (
            <g className="chart-grid">
              {gridLines.map((y, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke={colors.functional.neutralGray}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}
            </g>
          )}

          {/* Chart content */}
          {type === 'line' && renderLineChart()}
          {type === 'bar' && renderBarChart()}
          {type === 'area' && renderAreaChart()}

          {/* X-axis */}
          <g className="chart-x-axis">
            <line
              x1="0"
              y1={chartHeight}
              x2={chartWidth}
              y2={chartHeight}
              stroke={colors.text.secondary}
              strokeWidth="1"
            />
            {/* X-axis labels */}
            {data.map((d, i) => (
              <text
                key={i}
                x={scaleX(i)}
                y={chartHeight + 20}
                textAnchor="middle"
                style={tickLabelStyles}
              >
                {d.label}
              </text>
            ))}
            {/* X-axis label */}
            {xAxis.label && (
              <text
                x={chartWidth / 2}
                y={chartHeight + 40}
                textAnchor="middle"
                style={axisLabelStyles}
              >
                {xAxis.label}
              </text>
            )}
          </g>

          {/* Y-axis */}
          <g className="chart-y-axis">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={chartHeight}
              stroke={colors.text.secondary}
              strokeWidth="1"
            />
            {/* Y-axis ticks and labels */}
            {yAxis.showTicks !== false &&
              yTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1="-5"
                    y1={tick.y}
                    x2="0"
                    y2={tick.y}
                    stroke={colors.text.secondary}
                    strokeWidth="1"
                  />
                  <text
                    x="-10"
                    y={tick.y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    style={tickLabelStyles}
                  >
                    {tick.value.toFixed(0)}
                  </text>
                </g>
              ))}
            {/* Y-axis label */}
            {yAxis.label && (
              <text
                x={-chartHeight / 2}
                y="-40"
                textAnchor="middle"
                transform={`rotate(-90, -${chartHeight / 2}, -40)`}
                style={axisLabelStyles}
              >
                {yAxis.label}
              </text>
            )}
          </g>
        </g>
      </svg>

      {/* Legend */}
      {showLegend && (
        <div
          style={{
            display: 'flex',
            gap: spacing.md,
            marginTop: spacing.md,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {data.map((d, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: customColors
                    ? chartColors[i % chartColors.length]
                    : getDefaultColor(d.value),
                  borderRadius: '2px',
                }}
              />
              <span
                style={{
                  fontSize: fontSize.caption,
                  color: colors.text.secondary,
                }}
              >
                {d.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Chart;
