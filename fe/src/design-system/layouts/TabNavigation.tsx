/**
 * TabNavigation Component
 * Horizontal tab navigation for secondary navigation (Trader role)
 * 
 * Requirements: 1.1, 8.1
 */

import React, { useRef, useEffect, useState } from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

export interface TabItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon element (optional) */
  icon?: React.ReactNode;
  /** Badge count (optional) */
  badge?: number;
  /** Click handler */
  onClick: () => void;
  /** Accessibility label */
  ariaLabel?: string;
  /** Disabled state */
  disabled?: boolean;
}

export interface TabNavigationProps {
  /** Tab items */
  items: TabItem[];
  /** Currently active tab id */
  activeId: string;
  /** Background color */
  backgroundColor?: string;
  /** Active tab color */
  activeColor?: string;
  /** Inactive tab color */
  inactiveColor?: string;
  /** Additional CSS class */
  className?: string;
  /** Scrollable tabs (for many items) */
  scrollable?: boolean;
  /** Show indicator line under active tab */
  showIndicator?: boolean;
}

/**
 * TabNavigation Component
 * Horizontal tab navigation typically used below header
 * 
 * Typical usage for Trader role:
 * - Dashboard
 * - Products (Sản phẩm)
 * - Farms (Vườn trồng)
 * - Orders (Đơn hàng)
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({
  items,
  activeId,
  backgroundColor = colors.background.primary,
  activeColor = colors.primary.zaloBlue,
  inactiveColor = colors.text.secondary,
  className = '',
  scrollable = false,
  showIndicator = true,
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    // Update indicator position when active tab changes
    const activeTab = tabRefs.current[activeId];
    if (activeTab && showIndicator) {
      const { offsetLeft, offsetWidth } = activeTab;
      setIndicatorStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  }, [activeId, showIndicator]);

  const navStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '48px',
    minHeight: '48px',
    backgroundColor,
    borderBottom: `1px solid ${colors.functional.neutralGray}`,
    position: 'relative',
    ...(scrollable && {
      overflowX: 'auto',
      overflowY: 'hidden',
      WebkitOverflowScrolling: 'touch',
      scrollbarWidth: 'none', // Firefox
      msOverflowStyle: 'none', // IE/Edge
    }),
  };

  const tabsContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    ...(scrollable ? {
      minWidth: 'max-content',
    } : {
      width: '100%',
      justifyContent: 'space-around',
    }),
  };

  const tabStyles = (isActive: boolean, disabled: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: '44px', // Minimum touch target
    padding: `${spacing.sm} ${spacing.md}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? colors.text.disabled : (isActive ? activeColor : inactiveColor),
    fontSize: fontSize.body, // 16px
    fontWeight: isActive ? fontWeight.semibold : fontWeight.medium,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    transition: 'color 0.2s ease-in-out',
    position: 'relative',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.5 : 1,
  });

  const iconStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
  };

  const badgeStyles: React.CSSProperties = {
    minWidth: '16px',
    height: '16px',
    padding: '0 4px',
    backgroundColor: colors.functional.alertRed,
    color: colors.text.inverse,
    fontSize: '10px',
    fontWeight: fontWeight.bold,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    marginLeft: spacing.xs,
  };

  const indicatorStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    height: '2px',
    backgroundColor: activeColor,
    transition: 'left 0.3s ease-in-out, width 0.3s ease-in-out',
    ...indicatorStyle,
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: TabItem) => {
    if (item.disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      item.onClick();
    }
  };

  return (
    <nav
      className={`tab-navigation ${className}`}
      style={navStyles}
      data-testid="tab-navigation"
      role="tablist"
      aria-label="Tab navigation"
    >
      <div style={tabsContainerStyles}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          const disabled = item.disabled || false;

          return (
            <button
              key={item.id}
              ref={(el) => (tabRefs.current[item.id] = el)}
              className={`tab-navigation-item ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
              style={tabStyles(isActive, disabled)}
              onClick={() => !disabled && item.onClick()}
              onKeyDown={(e) => handleKeyDown(e, item)}
              aria-label={item.ariaLabel || item.label}
              aria-selected={isActive}
              aria-disabled={disabled}
              role="tab"
              tabIndex={disabled ? -1 : 0}
              disabled={disabled}
              data-testid={`tab-item-${item.id}`}
              data-active={isActive}
            >
              {item.icon && (
                <span
                  className="tab-navigation-icon"
                  style={iconStyles}
                >
                  {item.icon}
                </span>
              )}
              <span className="tab-navigation-label">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="tab-navigation-badge"
                  style={badgeStyles}
                  aria-label={`${item.badge} notifications`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {showIndicator && (
        <div
          className="tab-navigation-indicator"
          style={indicatorStyles}
          data-testid="tab-indicator"
        />
      )}

      <style>{`
        .tab-navigation::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </nav>
  );
};

export default TabNavigation;
