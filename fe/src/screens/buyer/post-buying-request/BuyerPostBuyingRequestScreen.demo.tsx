/**
 * Buyer Post Buying Request Screen Demo
 * Interactive demo for the Buyer Post Buying Request Screen
 */

import React from 'react';
import { Page } from 'zmp-ui';
import { BuyerPostBuyingRequestScreen, BuyingRequest } from './BuyerPostBuyingRequestScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface BuyerPostBuyingRequestScreenDemoProps {
  onBack?: () => void;
}

export const BuyerPostBuyingRequestScreenDemo: React.FC<BuyerPostBuyingRequestScreenDemoProps> = ({ onBack }) => {
  // Tên cứng theo yêu cầu
  const buyerName = 'Tiến Khoa';

  const handleSubmit = (request: BuyingRequest) => {
    console.log('Buying request submitted:', request);
    alert(`Đã đăng nhu cầu mua:\n\n` +
      `Nông sản: ${request.productType}\n` +
      `Số lượng: ${request.quantity} ${request.unit}\n` +
      `Giá: ${request.priceMin.toLocaleString()} - ${request.priceMax.toLocaleString()} VNĐ/${request.unit}\n` +
      `Tiêu chuẩn: ${request.standards.join(', ')}\n` +
      `Mô tả: ${request.description}`
    );
  };

  const handleCancel = () => {
    console.log('Cancelled');
    if (onBack) {
      onBack();
    }
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
    <Page className="buyer-post-buying-request-demo">
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

      {/* Buyer Post Buying Request Screen */}
      <div style={contentWrapperStyles}>
        <BuyerPostBuyingRequestScreen
          buyerName={buyerName}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </Page>
  );
};

export default BuyerPostBuyingRequestScreenDemo;
