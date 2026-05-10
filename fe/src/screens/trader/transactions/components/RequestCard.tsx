/**
 * RequestCard — connection / order request card with Accept/Reject actions
 * (FR-T08, FR-F03, US-T03)
 */
import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export interface RequestCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  isLoading?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onTap?: () => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  title,
  subtitle,
  meta,
  isLoading = false,
  onAccept,
  onReject,
  onTap,
}) => (
  <div
    role={onTap ? 'button' : undefined}
    tabIndex={onTap ? 0 : undefined}
    onClick={onTap}
    onKeyDown={onTap ? (e) => e.key === 'Enter' && onTap() : undefined}
    style={{
      backgroundColor: colors.background.primary,
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: spacing.md,
      borderLeft: `3px solid ${colors.functional.warningYellow}`,
      cursor: onTap ? 'pointer' : 'default',
      overflow: 'hidden',
    }}
  >
    {/* Body */}
    <div style={{ padding: spacing.md }}>
      <Text.Title size="small" style={{ margin: 0 }}>
        {title}
      </Text.Title>
      {subtitle && (
        <Text
          size="small"
          style={{ color: colors.text.secondary, marginTop: spacing.xs, display: 'block' }}
        >
          {subtitle}
        </Text>
      )}
      {meta && (
        <Text
          size="xSmall"
          style={{ color: colors.text.disabled, marginTop: spacing.xs, display: 'block', fontSize: fontSize.caption }}
        >
          {meta}
        </Text>
      )}
    </div>

    {/* Action buttons */}
    {(onAccept || onReject) && (
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          padding: `0 ${spacing.md} ${spacing.md}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {onReject && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onReject}
            style={{
              flex: 1,
              minHeight: '44px',
              backgroundColor: colors.background.secondary,
              color: colors.functional.alertRed,
              border: 'none',
              borderRadius: '6px',
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? '...' : '✕ Từ chối'}
          </button>
        )}
        {onAccept && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onAccept}
            style={{
              flex: 1,
              minHeight: '44px',
              backgroundColor: isLoading ? colors.background.tertiary : colors.primary.agriGreen,
              color: colors.text.inverse,
              border: 'none',
              borderRadius: '6px',
              fontSize: fontSize.caption,
              fontWeight: fontWeight.semibold,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? '...' : '✓ Chấp nhận'}
          </button>
        )}
      </div>
    )}
  </div>
);
