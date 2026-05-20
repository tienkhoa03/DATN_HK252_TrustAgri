/**
 * Buyer Post Buying Request Screen Demo
 * Wraps the real screen with a back bar for the dev gallery.
 * The screen itself now reads buyer identity from JWT; no extra props are needed.
 */

import React from 'react';
import { Page } from 'zmp-ui';
import { BuyerPostBuyingRequestScreen } from './BuyerPostBuyingRequestScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface BuyerPostBuyingRequestScreenDemoProps {
  onBack?: () => void;
}

export const BuyerPostBuyingRequestScreenDemo: React.FC<BuyerPostBuyingRequestScreenDemoProps> = ({ onBack }) => {
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
    <Page className="buyer-post-buying-request-demo">
      {onBack && (
        <div style={backBarStyles}>
          <button
            style={backButtonStyles}
            onClick={onBack}
            aria-label="Quay về màn hình chính"
          >
            ← Quay về
          </button>
        </div>
      )}
      <div style={contentWrapperStyles}>
        <BuyerPostBuyingRequestScreen />
      </div>
    </Page>
  );
};

export default BuyerPostBuyingRequestScreenDemo;
