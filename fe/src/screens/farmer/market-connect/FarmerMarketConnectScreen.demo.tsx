/**
 * Farmer Market & Connect Screen Demo
 * Interactive demo for the Farmer Market & Connect Screen
 */

import React from 'react';
import { Page } from 'zmp-ui';
import { FarmerMarketConnectScreen } from './FarmerMarketConnectScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface FarmerMarketConnectScreenDemoProps {
  onBack?: () => void;
}

export const FarmerMarketConnectScreenDemo: React.FC<FarmerMarketConnectScreenDemoProps> = ({ onBack }) => {
  // Tên cứng theo yêu cầu
  const farmerName = 'Tiến Khoa';
  const farmName = 'Sầu riêng Monthong';

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
    <Page className="farmer-market-connect-demo">
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

      {/* Farmer Market & Connect Screen */}
      <div style={contentWrapperStyles}>
        <FarmerMarketConnectScreen
          farmerName={farmerName}
          farmName={farmName}
          onAcceptInvitation={(id) => console.log('Accepted invitation:', id)}
          onRejectInvitation={(id) => console.log('Rejected invitation:', id)}
          onSendConnectionRequest={(id) => console.log('Sent connection request to:', id)}
        />
      </div>
    </Page>
  );
};

export default FarmerMarketConnectScreenDemo;
