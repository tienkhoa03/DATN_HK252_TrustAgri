/**
 * Trader Dashboard Screen Demo
 * Interactive demo for the Trader Dashboard Screen
 */

import React from 'react';
import { Page } from 'zmp-ui';
import { TraderDashboardScreen } from './TraderDashboardScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface TraderDashboardScreenDemoProps {
  onBack?: () => void;
}

export const TraderDashboardScreenDemo: React.FC<TraderDashboardScreenDemoProps> = ({ onBack }) => {
  // Tên cứng theo yêu cầu
  const traderName = 'Tiến Khoa';
  const companyName = 'Công ty TNHH Nông sản Sầu riêng Monthong';

  const backBarStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '48px',
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.tertiary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `0 ${spacing.md}`,
    zIndex: 1001,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  const backButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: 'transparent',
    color: colors.text.primary,
    border: `1px solid ${colors.background.tertiary}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const contentWrapperStyles: React.CSSProperties = {
    marginTop: '48px',
  };

  return (
    <Page className="trader-dashboard-demo">
      {/* Back Bar */}
      {onBack && (
        <div style={backBarStyles}>
          <button
            style={backButtonStyles}
            onClick={onBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Quay về màn hình chính"
          >
            ← Quay về
          </button>
        </div>
      )}

      {/* Trader Dashboard Screen */}
      <div style={contentWrapperStyles}>
        <TraderDashboardScreen
          traderName={traderName}
          companyName={companyName}
        />
      </div>
    </Page>
  );
};

export default TraderDashboardScreenDemo;
