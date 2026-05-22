/**
 * OrderStatusTabs — Phase 3 (FR-U04, FR-U06)
 * 3 full-width status tabs for BuyerOrdersScreen, styled to match the trader
 * StatusTabbedList (zaloBlue underline, equal width).
 */

import React from 'react';
import { colors } from '@/design-system/tokens/colors';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';

export type OrderStatusTab = 'negotiating' | 'deposited' | 'history';

export interface OrderStatusTabsProps {
  activeTab: OrderStatusTab;
  onTabChange: (tab: OrderStatusTab) => void;
}

const TAB_CONFIG: { id: OrderStatusTab; label: string }[] = [
  { id: 'negotiating', label: 'Chờ thương lượng' },
  { id: 'deposited',   label: 'Đang đặt cọc' },
  { id: 'history',     label: 'Lịch sử' },
];

export const OrderStatusTabs: React.FC<OrderStatusTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: colors.background.primary,
        borderBottom: `1px solid ${colors.background.tertiary}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {TAB_CONFIG.map(({ id, label }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: `${spacing.sm} ${spacing.xs}`,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? `2px solid ${colors.primary.zaloBlue}`
                : '2px solid transparent',
              color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
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
