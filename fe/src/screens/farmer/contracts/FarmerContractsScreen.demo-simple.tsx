/**
 * Simple Farmer Contracts Screen Demo
 * Minimal demo without complex styling
 */

import React from 'react';
import { FarmerContractsScreen } from './FarmerContractsScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface FarmerContractsScreenDemoSimpleProps {
  onBack?: () => void;
}

export const FarmerContractsScreenDemoSimple: React.FC<FarmerContractsScreenDemoSimpleProps> = ({ onBack }) => {
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
    <div style={{ position: 'relative' }}>
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

      {/* Content */}
      <div style={contentWrapperStyles}>
        <FarmerContractsScreen
          farmerName="Tiến Khoa"
          farmName="Sầu riêng Monthong"
          onAcceptChange={(id) => {
            console.log('Accepted change for contract:', id);
            alert(`Đã chấp nhận thay đổi cho hợp đồng ${id}`);
          }}
          onRejectChange={(id) => {
            console.log('Rejected change for contract:', id);
            alert(`Đã từ chối thay đổi cho hợp đồng ${id}`);
          }}
          onViewDetails={(id) => {
            console.log('Viewing details for contract:', id);
          }}
        />
      </div>
    </div>
  );
};

export default FarmerContractsScreenDemoSimple;
