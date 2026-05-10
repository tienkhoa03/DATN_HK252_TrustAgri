/**
 * Fab — Floating Action Button component for trader screens.
 * Requirements: NFR-U03 (touch target ≥ 44×44px)
 */

import React from 'react';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export interface FabProps {
  onClick: () => void;
  /** Optional text label shown next to "+" */
  label?: string;
  /** Button background color. Defaults to colors.primary.zaloBlue */
  color?: string;
}

export const Fab: React.FC<FabProps> = ({
  onClick,
  label,
  color = colors.primary.zaloBlue,
}) => {
  return (
    <button
      type="button"
      aria-label={label ?? 'Tạo mới'}
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 80,
        right: spacing.md,
        minWidth: 56,
        minHeight: 56,
        borderRadius: label ? '28px' : '50%',
        backgroundColor: color,
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: label ? spacing.xs : 0,
        padding: label ? `0 ${spacing.md}` : 0,
        zIndex: 100,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.32)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
      }}
    >
      <span
        style={{
          color: '#ffffff',
          fontSize: 24,
          lineHeight: 1,
          fontWeight: fontWeight.regular,
        }}
      >
        +
      </span>
      {label && (
        <span
          style={{
            color: '#ffffff',
            fontSize: fontSize.body,
            fontWeight: fontWeight.semibold,
            marginLeft: 2,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
};
