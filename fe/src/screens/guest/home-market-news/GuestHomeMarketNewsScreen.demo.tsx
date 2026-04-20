/**
 * Guest Home & Market News Screen Demo
 * Interactive demo for the Guest Home & Market News Screen
 */

import React from 'react';
import { Page } from 'zmp-ui';
import { GuestHomeMarketNewsScreen } from './GuestHomeMarketNewsScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface GuestHomeMarketNewsScreenDemoProps {
  onBack?: () => void;
}

export const GuestHomeMarketNewsScreenDemo: React.FC<GuestHomeMarketNewsScreenDemoProps> = ({
  onBack,
}) => {
  const handleLogin = () => {
    console.log('Login clicked - would redirect to Zalo login');
    alert('Chức năng đăng nhập sẽ tích hợp với Zalo ID');
  };

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
    <Page className="guest-home-market-news-demo">
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

      {/* Guest Home & Market News Screen */}
      <div style={contentWrapperStyles}>
        <GuestHomeMarketNewsScreen onLogin={handleLogin} />
      </div>
    </Page>
  );
};

export default GuestHomeMarketNewsScreenDemo;
