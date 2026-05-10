/**
 * DiffRow — two-column diff display for contract change fields (FR-T10)
 */

import React from 'react';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize, fontWeight } from '../../tokens/typography';

export interface DiffRowProps {
  label: string;
  oldValue: string | number;
  newValue: string | number;
  changed: boolean;
  formatValue?: (v: string | number) => string;
}

export const DiffRow: React.FC<DiffRowProps> = ({ label, oldValue, newValue, changed, formatValue }) => {
  const fmt = formatValue ?? String;

  return (
    <div style={{
      padding: `${spacing.sm} 0`,
      borderBottom: `1px solid ${colors.background.secondary}`,
    }}>
      <div style={{ fontSize: fontSize.small, color: colors.text.secondary, marginBottom: spacing.xs }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        {/* Old value */}
        <span style={{
          flex: 1,
          fontSize: fontSize.caption,
          color: changed ? colors.functional.alertRed : colors.text.secondary,
          textDecoration: changed ? 'line-through' : 'none',
          fontWeight: changed ? fontWeight.medium : fontWeight.regular,
        }}>
          {fmt(oldValue)}
        </span>

        {changed && (
          <>
            {/* Arrow */}
            <span
              data-testid="diff-arrow"
              style={{
                fontSize: fontSize.caption,
                color: colors.text.secondary,
                flexShrink: 0,
              }}
            >
              →
            </span>
            {/* New value */}
            <span
              data-changed="true"
              style={{
                flex: 1,
                fontSize: fontSize.caption,
                color: colors.functional.alertRed,
                fontWeight: fontWeight.bold,
              }}
            >
              {fmt(newValue)}
            </span>
          </>
        )}

        {!changed && (
          <span style={{
            flex: 1,
            fontSize: fontSize.caption,
            color: colors.text.secondary,
            fontWeight: fontWeight.regular,
          }}>
            {fmt(newValue)}
          </span>
        )}
      </div>
    </div>
  );
};

export default DiffRow;
