/**
 * OrderStatusTabs — Phase 3 (FR-U04, FR-U06)
 * 4 horizontal scrollable status tabs for BuyerOrdersScreen.
 */

import React from 'react';
import { colors } from '@/design-system/tokens/colors';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';

export type OrderStatusTab = 'negotiating' | 'deposited' | 'completed' | 'cancelled';

export interface OrderStatusTabsProps {
  activeTab: OrderStatusTab;
  onTabChange: (tab: OrderStatusTab) => void;
}

const TAB_CONFIG: { id: OrderStatusTab; label: string }[] = [
  { id: 'negotiating', label: 'Chờ thương lượng' },
  { id: 'deposited',   label: 'Đang đặt cọc' },
  { id: 'completed',  label: 'Hoàn tất' },
  { id: 'cancelled',  label: 'Đã hủy' },
];

export const OrderStatusTabs: React.FC<OrderStatusTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        overflowX: 'auto',
        backgroundColor: colors.background.primary,
        borderBottom: `1px solid ${colors.background.secondary}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
      }}
    >
      {TAB_CONFIG.map(({ id, label }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={{
              flexShrink: 0,
              minHeight: '44px',
              padding: `${spacing.sm} ${spacing.md}`,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? `2px solid ${colors.primary.agriGreen}`
                : '2px solid transparent',
              color: isActive ? colors.primary.agriGreen : colors.text.secondary,
              fontSize: fontSize.caption,
              fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
