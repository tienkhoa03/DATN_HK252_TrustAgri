import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  cta?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, cta }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      padding: spacing.lg,
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: '48px', marginBottom: spacing.md, lineHeight: 1 }}>{icon}</div>
    <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}`, color: colors.text.primary }}>
      {title}
    </Text.Title>
    {description && (
      <Text size="small" style={{ color: colors.text.secondary, margin: `0 0 ${spacing.md}` }}>
        {description}
      </Text>
    )}
    {cta && (
      <button
        type="button"
        onClick={cta.onClick}
        style={{
          padding: `${spacing.sm} ${spacing.lg}`,
          backgroundColor: colors.primary.zaloBlue,
          color: colors.text.inverse,
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          minHeight: '44px',
        }}
      >
        {cta.label}
      </button>
    )}
  </div>
);

export default EmptyState;
