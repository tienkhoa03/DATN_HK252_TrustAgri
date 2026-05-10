/**
 * Timeline — vertical timeline with injectable alert nodes (NFR-U01, FR-F09)
 */

import React from 'react';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize, fontWeight } from '../../tokens/typography';

export interface TimelineNode {
  id: string;
  number?: number;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'missed' | 'alert-suggested';
  isAlert?: boolean;
  dueDate?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export interface TimelineProps {
  nodes: TimelineNode[];
  className?: string;
}

const STATUS_COLORS: Record<TimelineNode['status'], string> = {
  pending: colors.text.disabled,
  'in-progress': colors.primary.zaloBlue,
  completed: colors.primary.agriGreen,
  missed: colors.functional.alertRed,
  'alert-suggested': colors.functional.warningYellow,
};

const STATUS_BG: Record<TimelineNode['status'], string> = {
  pending: colors.background.secondary,
  'in-progress': `${colors.primary.zaloBlue}18`,
  completed: `${colors.primary.agriGreen}18`,
  missed: `${colors.functional.alertRed}18`,
  'alert-suggested': `${colors.functional.warningYellow}22`,
};

export const Timeline: React.FC<TimelineProps> = ({ nodes, className }) => {
  return (
    <div className={className} style={{ padding: `0 ${spacing.md}` }}>
      {nodes.map((node, idx) => {
        const isLast = idx === nodes.length - 1;
        const dotColor = STATUS_COLORS[node.status];
        const bgColor = STATUS_BG[node.status];

        if (node.isAlert) {
          // Injected alert node — orange chip with red badge
          return (
            <div key={node.id} style={{ display: 'flex', marginBottom: spacing.sm, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: spacing.md }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: colors.functional.warningYellow,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${colors.functional.alertRed}`,
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>⚠</span>
                </div>
                {!isLast && (
                  <div style={{ width: 2, flex: 1, minHeight: spacing.md, backgroundColor: colors.background.secondary, marginTop: 2 }} />
                )}
              </div>
              <div style={{
                flex: 1,
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: `${colors.functional.warningYellow}22`,
                borderRadius: 8,
                border: `1px solid ${colors.functional.warningYellow}`,
                marginBottom: spacing.xs,
              }}>
                <div style={{ fontSize: fontSize.caption, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: 2 }}>
                  {node.title}
                </div>
                {node.description && (
                  <div style={{ fontSize: fontSize.small, color: colors.text.secondary }}>{node.description}</div>
                )}
                {node.onAction && node.actionLabel && (
                  <button
                    type="button"
                    onClick={node.onAction}
                    style={{
                      marginTop: spacing.xs,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: colors.functional.warningYellow,
                      border: 'none',
                      borderRadius: 4,
                      fontSize: fontSize.caption,
                      fontWeight: fontWeight.medium,
                      cursor: 'pointer',
                      minHeight: 32,
                      color: colors.text.primary,
                    }}
                  >
                    {node.actionLabel}
                  </button>
                )}
              </div>
            </div>
          );
        }

        return (
          <div key={node.id} style={{ display: 'flex', marginBottom: spacing.xs, alignItems: 'flex-start' }}>
            {/* Left: bubble + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: spacing.md }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: dotColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                minHeight: 44,
                minWidth: 28,
              }}>
                {node.number != null ? (
                  <span style={{ fontSize: fontSize.small, fontWeight: fontWeight.bold, color: colors.text.inverse, lineHeight: 1 }}>
                    {node.number}
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: colors.text.inverse, lineHeight: 1 }}>
                    {node.status === 'completed' ? '✓' : node.status === 'missed' ? '✗' : '·'}
                  </span>
                )}
              </div>
              {!isLast && (
                <div style={{ width: 2, flex: 1, minHeight: spacing.md, backgroundColor: colors.background.secondary, marginTop: 2 }} />
              )}
            </div>

            {/* Right: content */}
            <div style={{
              flex: 1,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: bgColor,
              borderRadius: 8,
              border: `1px solid ${dotColor}30`,
              marginBottom: spacing.sm,
            }}>
              <div style={{ fontSize: fontSize.caption, fontWeight: fontWeight.semibold, color: colors.text.primary }}>
                {node.title}
              </div>
              {node.description && (
                <div style={{ fontSize: fontSize.small, color: colors.text.secondary, marginTop: 2 }}>{node.description}</div>
              )}
              {node.dueDate && (
                <div style={{ fontSize: fontSize.small, color: colors.text.secondary, marginTop: spacing.xs }}>
                  Hạn: {node.dueDate}
                </div>
              )}
              {node.onAction && node.actionLabel && (
                <button
                  type="button"
                  onClick={node.onAction}
                  style={{
                    marginTop: spacing.xs,
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: dotColor,
                    border: 'none',
                    borderRadius: 4,
                    fontSize: fontSize.small,
                    fontWeight: fontWeight.medium,
                    cursor: 'pointer',
                    minHeight: 32,
                    color: colors.text.inverse,
                  }}
                >
                  {node.actionLabel}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
