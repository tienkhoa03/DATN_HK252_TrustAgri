/**
 * Trader Trading & Orders Screen Demo
 * Interactive demo for Sàn giao dịch và Đơn hàng
 */

import React from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { TraderTradingOrdersScreen } from './TraderTradingOrdersScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface TraderTradingOrdersScreenDemoProps {
  onBack?: () => void;
}

/**
 * Demo component with back button
 */
export const TraderTradingOrdersScreenDemo: React.FC<TraderTradingOrdersScreenDemoProps> = ({
  onBack,
}) => {
  const backBarStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const backButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.text.inverse,
    color: colors.primary.zaloBlue,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    transition: 'all 0.2s',
  };

  return (
    <Page className="trader-trading-orders-screen-demo">
      {/* Back Button Bar */}
      {onBack && (
        <div style={backBarStyles}>
          <button
            style={backButtonStyles}
            onClick={onBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.text.inverse;
            }}
          >
            ← Quay về màn hình chính
          </button>
          <Text style={{ color: colors.text.inverse, fontSize: fontSize.body, fontWeight: fontWeight.medium }}>
            Demo: Sàn giao dịch và Đơn hàng
          </Text>
        </div>
      )}

      {/* Main Screen */}
      <TraderTradingOrdersScreen traderName="Thương lái Demo" />
    </Page>
  );
};

export default TraderTradingOrdersScreenDemo;
