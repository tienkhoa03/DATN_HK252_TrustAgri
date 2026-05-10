/**
 * StatusTabbedList — reusable tab bar + content host
 * Used by FarmerFlowPanel and BuyerFlowPanel (FR-T08, FR-T03)
 */
import React from 'react';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export interface TabDef {
  id: string;
  label: string;
}

interface StatusTabbedListProps {
  tabs: TabDef[];
  activeId: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

export const StatusTabbedList: React.FC<StatusTabbedListProps> = ({
  tabs,
  activeId,
  onTabChange,
  children,
}) => (
  <div>
    {/* Tab bar */}
    <div
      style={{
        display: 'flex',
        backgroundColor: colors.background.primary,
        borderBottom: `1px solid ${colors.background.tertiary}`,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: `${spacing.sm} ${spacing.xs}`,
              background: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? `2px solid ${colors.primary.zaloBlue}`
                : '2px solid transparent',
              color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
              fontSize: fontSize.caption,
              fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>

    {/* Content */}
    <div style={{ padding: spacing.md, paddingBottom: spacing.xl }}>
      {children}
    </div>
  </div>
);
