/**
 * Farmer Contracts Screen Demo
 * Interactive demo for the Farmer Contracts Screen
 */

import React from 'react';
import { Page } from 'zmp-ui';
import { FarmerContractsScreen } from './FarmerContractsScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface FarmerContractsScreenDemoProps {
  onBack?: () => void;
}

export const FarmerContractsScreenDemo: React.FC<FarmerContractsScreenDemoProps> = ({ onBack }) => {
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
    <>
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
            ← Quay về màn hình chính
          </button>
        </div>
      )}

      {/* Farmer Contracts Screen */}
      <div style={contentWrapperStyles}>
        <FarmerContractsScreen
          farmerName={farmerName}
          farmName={farmName}
          onAcceptChange={(id) => console.log('Accepted change for contract:', id)}
          onRejectChange={(id) => console.log('Rejected change for contract:', id)}
          onViewDetails={(id) => console.log('Viewing details for contract:', id)}
        />
      </div>
    </>
  );
};

export default FarmerContractsScreenDemo;
