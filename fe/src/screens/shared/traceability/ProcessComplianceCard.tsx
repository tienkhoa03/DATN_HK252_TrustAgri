import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import type { TraceabilityProcessComplianceSummaryDto } from '@/services/traceabilityService';

interface Props {
  process: TraceabilityProcessComplianceSummaryDto;
}

export const ProcessComplianceCard: React.FC<Props> = ({ process }) => {
  const coveragePct = Math.round(process.coverageRatio * 100);

  return (
    <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderTop: `1px solid ${colors.background.secondary}` }}>
      <div style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.md }}>
        Đối chiếu quy trình chuẩn
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: spacing.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
          <Text size="small" style={{ color: colors.text.secondary }}>
            Hoàn thành bước
          </Text>
          <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.text.primary }}>
            {process.completedSteps}/{process.totalSteps} ({coveragePct}%)
          </Text>
        </div>
        <div style={{ height: '8px', backgroundColor: colors.background.tertiary, borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${coveragePct}%`,
              backgroundColor: coveragePct >= 80 ? colors.primary.agriGreen : coveragePct >= 50 ? '#F59E0B' : '#EF4444',
              borderRadius: '4px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.md }}>
        {process.deviationCount > 0 && (
          <span style={badgeStyle('#EF4444')}>
            Lệch quy trình: {process.deviationCount}
          </span>
        )}
        {process.lateCount > 0 && (
          <span style={badgeStyle('#F97316')}>
            Trễ tiến độ: {process.lateCount}
          </span>
        )}
        {process.deviationCount === 0 && process.lateCount === 0 && (
          <span style={badgeStyle(colors.primary.agriGreen)}>
            Đúng quy trình
          </span>
        )}
      </div>

      {/* Steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        {process.steps.map((step) => (
          <div
            key={step.order}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: step.completed ? `${colors.primary.agriGreen}10` : colors.background.secondary,
              borderRadius: '6px',
              borderLeft: `3px solid ${step.completed ? colors.primary.agriGreen : colors.background.tertiary}`,
            }}
          >
            <span style={{ fontSize: '14px' }}>{step.completed ? '✅' : '⬜'}</span>
            <div style={{ flex: 1 }}>
              <Text size="small" style={{ color: colors.text.primary, fontWeight: step.completed ? fontWeight.semibold : fontWeight.regular }}>
                {step.order}. {step.title}
              </Text>
              {step.expectedDurationDays != null && (
                <Text size="xSmall" style={{ color: colors.text.secondary }}>
                  Dự kiến {step.expectedDurationDays} ngày
                </Text>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function badgeStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: `${color}18`,
    border: `1.5px solid ${color}`,
    borderRadius: '20px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color,
    minHeight: '28px',
  };
}

export default ProcessComplianceCard;
