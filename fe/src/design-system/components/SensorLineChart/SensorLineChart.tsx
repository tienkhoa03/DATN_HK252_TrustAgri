/**
 * SensorLineChart — Biểu đồ chuỗi thời gian cảm biến (area + line)
 *
 * Phân biệt rõ ràng:
 *   • Thực đo  (isImputed = false) — đường liền, chấm đặc
 *   • Ước tính (isImputed = true)  — đường nét đứt, chấm rỗng + màu vàng
 *
 * Dùng SVG thuần, không phụ thuộc thư viện chart bên ngoài.
 *
 * Requirements: Phase 6.1 — FR-F07, FR-T11, FR-U05
 */

import React, { useMemo } from 'react';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize, fontWeight } from '../../tokens/typography';
import type { SensorReadingDto, SensorType } from '@/services/monitoringService';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SensorLineChartProps {
  /** Dữ liệu chuỗi thời gian — mảng SensorReadingDto đã sắp xếp theo thời gian tăng dần */
  data: SensorReadingDto[];
  /** Tiêu đề hiển thị phía trên biểu đồ */
  title?: string;
  /** Nhãn đơn vị trên trục Y */
  unit?: string;
  /** Chiều rộng SVG (px), mặc định 320 */
  width?: number;
  /** Chiều cao SVG (px), mặc định 160 */
  height?: number;
  /** Màu chính cho dữ liệu thực đo */
  lineColor?: string;
  /** Màu cho dữ liệu ước tính (imputed) */
  imputedColor?: string;
  className?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SENSOR_LABELS: Record<SensorType, string> = {
  temperature: 'Nhiệt độ',
  humidity: 'Độ ẩm',
  light: 'Ánh sáng',
  soil_moisture: 'Độ ẩm đất',
};

/** Rút gọn ISO time → HH:mm */
function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SensorLineChart: React.FC<SensorLineChartProps> = ({
  data,
  title,
  unit,
  width = 320,
  height = 160,
  lineColor = colors.primary.agriGreen,
  imputedColor = '#FFCC00',
  className = '',
}) => {
  const pad = { top: 16, right: 16, bottom: 36, left: 44 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const { minVal, maxVal, range, points } = useMemo(() => {
    if (data.length === 0) return { minVal: 0, maxVal: 1, range: 1, points: [] };

    const vals = data.map((d) => d.value);
    const raw_min = Math.min(...vals);
    const raw_max = Math.max(...vals);
    const padding = (raw_max - raw_min) * 0.15 || 1;
    const mn = raw_min - padding;
    const mx = raw_max + padding;
    const rng = mx - mn || 1;

    const pts = data.map((d, i) => ({
      x: (i / (data.length - 1 || 1)) * cw,
      y: ch - ((d.value - mn) / rng) * ch,
      isImputed: d.isImputed,
      value: d.value,
      recordedAt: d.recordedAt,
    }));

    return { minVal: mn, maxVal: mx, range: rng, points: pts };
  }, [data, cw, ch]);

  // Tạo các đoạn liên tục — tách khi chuyển giữa imputed / real
  const segments = useMemo(() => {
    if (points.length < 2) return [];
    const segs: Array<{ pts: typeof points; isImputed: boolean }> = [];
    let cur: typeof points = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      // Khi trạng thái thay đổi, đóng đoạn cũ và bắt đầu đoạn mới
      if (curr.isImputed !== prev.isImputed) {
        cur.push(curr); // nối điểm chuyển tiếp để không có khoảng trắng
        segs.push({ pts: cur, isImputed: prev.isImputed });
        cur = [curr];
      } else {
        cur.push(curr);
      }
    }
    segs.push({ pts: cur, isImputed: cur[0].isImputed });
    return segs;
  }, [points]);

  // Y-axis ticks (5 mức)
  const yTicks = useMemo(() => {
    const count = 4;
    return Array.from({ length: count + 1 }, (_, i) => {
      const val = minVal + (range * i) / count;
      const y = ch - (i / count) * ch;
      return { val, y };
    });
  }, [minVal, range, ch]);

  // X-axis labels — hiển thị mỗi N điểm để tránh chen chúc
  const xLabels = useMemo(() => {
    if (points.length === 0) return [];
    const step = Math.max(1, Math.floor(points.length / 6));
    return points
      .map((p, i) => ({ x: p.x, label: formatTime(data[i]?.recordedAt ?? ''), i }))
      .filter(({ i }) => i % step === 0 || i === points.length - 1);
  }, [points, data]);

  const sensorLabel = data[0] ? (SENSOR_LABELS[data[0].sensorType] ?? data[0].sensorType) : '';

  // Area path cho toàn bộ dữ liệu (hiển thị nền nhạt)
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return `${line} L${points[points.length - 1].x},${ch} L${points[0].x},${ch} Z`;
  }, [points, ch]);

  if (data.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background.primary,
          borderRadius: 8,
          color: colors.text.secondary,
          fontSize: fontSize.small,
        }}
      >
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div
      className={`sensor-line-chart ${className}`}
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: 8,
        padding: spacing.sm,
        overflow: 'hidden',
      }}
    >
      {/* Title */}
      {title && (
        <p
          style={{
            margin: `0 0 ${spacing.xs}`,
            fontSize: fontSize.body,
            fontWeight: fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          {title}
        </p>
      )}

      {/* SVG Chart */}
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Biểu đồ ${sensorLabel}`}
      >
        <defs>
          <linearGradient id={`area-grad-${sensorLabel}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Grid */}
          {yTicks.map((t, i) => (
            <line
              key={i}
              x1={0}
              y1={t.y}
              x2={cw}
              y2={t.y}
              stroke={colors.functional.neutralGray}
              strokeWidth={0.8}
              strokeDasharray="3 3"
            />
          ))}

          {/* Area fill */}
          <path
            d={areaPath}
            fill={`url(#area-grad-${sensorLabel})`}
            stroke="none"
          />

          {/* Line segments */}
          {segments.map((seg, si) => {
            if (seg.pts.length < 2) return null;
            const d = seg.pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            return (
              <path
                key={si}
                d={d}
                fill="none"
                stroke={seg.isImputed ? imputedColor : lineColor}
                strokeWidth={seg.isImputed ? 1.5 : 2}
                strokeDasharray={seg.isImputed ? '5 3' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Data points */}
          {points.map((p, i) => (
            p.isImputed ? (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={colors.background.primary}
                stroke={imputedColor}
                strokeWidth={1.5}
              />
            ) : (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={2.5}
                fill={lineColor}
                stroke={colors.background.primary}
                strokeWidth={1}
              />
            )
          ))}

          {/* Y-axis */}
          <line x1={0} y1={0} x2={0} y2={ch} stroke={colors.text.secondary} strokeWidth={1} />
          {yTicks.map((t, i) => (
            <text
              key={i}
              x={-6}
              y={t.y}
              textAnchor="end"
              dominantBaseline="middle"
              style={{ fontSize: '9px', fill: colors.text.secondary }}
            >
              {t.val.toFixed(0)}{unit ? unit : ''}
            </text>
          ))}

          {/* X-axis */}
          <line x1={0} y1={ch} x2={cw} y2={ch} stroke={colors.text.secondary} strokeWidth={1} />
          {xLabels.map((l, i) => (
            <text
              key={i}
              x={l.x}
              y={ch + 14}
              textAnchor="middle"
              style={{ fontSize: '9px', fill: colors.text.secondary }}
            >
              {l.label}
            </text>
          ))}
        </g>
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          marginTop: spacing.xs,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <div
            style={{
              width: 20,
              height: 3,
              backgroundColor: lineColor,
              borderRadius: 2,
            }}
          />
          <span style={{ fontSize: fontSize.small, color: colors.text.secondary }}>
            Thực đo
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <svg width={20} height={8}>
            <line
              x1={0}
              y1={4}
              x2={20}
              y2={4}
              stroke={imputedColor}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
          </svg>
          <span style={{ fontSize: fontSize.small, color: colors.text.secondary }}>
            Ước tính
          </span>
        </div>
      </div>
    </div>
  );
};

export default SensorLineChart;
