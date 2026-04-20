/**
 * BottomNavigation Component
 * Bottom navigation bar for primary navigation (Farmer role)
 * 
 * Requirements: 1.1, 8.1
 */

import React from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

export interface NavigationItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon element */
  icon: React.ReactNode;
  /** Active icon element (optional, defaults to icon) */
  activeIcon?: React.ReactNode;
  /** Badge count (optional) */
  badge?: number;
  /** Click handler */
  onClick: () => void;
  /** Accessibility label */
  ariaLabel?: string;
}

export interface BottomNavigationProps {
  /** Navigation items */
  items: NavigationItem[];
  /** Currently active item id */
  activeId: string;
  /** Background color */
  backgroundColor?: string;
  /** Active item color */
  activeColor?: string;
  /** Inactive item color */
  inactiveColor?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * BottomNavigation Component
 * Standard bottom navigation with 64px height
 * Minimum touch target 44x44px per item
 * 
 * Typical usage for Farmer role:
 * - Home (Trang chủ)
 * - Monitor (Giám sát)
 * - Alerts (Cảnh báo)
 * - Profile (Hồ sơ)
 */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeId,
  backgroundColor = colors.background.primary,
  activeColor = colors.primary.zaloBlue,
  inactiveColor = colors.text.secondary,
  className = '',
}) => {
  const navStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '64px',
    minHeight: '64px',
    backgroundColor,
    borderTop: `1px solid ${colors.functional.neutralGray}`,
    padding: `${spacing.sm} 0`,
    position: 'relative',
  };

  const itemStyles = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    minWidth: '44px', // Minimum touch target
    minHeight: '44px', // Minimum touch target
    padding: `${spacing.xs} ${spacing.sm}`,
    cursor: 'pointer',
    color: isActive ? activeColor : inactiveColor,
    transition: 'color 0.2s ease-in-out',
    position: 'relative',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  });

  const iconContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    position: 'relative',
  };

  const labelStyles: React.CSSProperties = {
    fontSize: '12px', // Small text for labels
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '80px',
  };

  const badgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-8px',
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
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: NavigationItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      item.onClick();
    }
  };

  return (
    <nav
      className={`bottom-navigation ${className}`}
      style={navStyles}
      data-testid="bottom-navigation"
      role="navigation"
      aria-label="Primary navigation"
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const displayIcon = isActive && item.activeIcon ? item.activeIcon : item.icon;

        return (
          <button
            key={item.id}
            className={`bottom-navigation-item ${isActive ? 'active' : ''}`}
            style={itemStyles(isActive)}
            onClick={item.onClick}
            onKeyDown={(e) => handleKeyDown(e, item)}
            aria-label={item.ariaLabel || item.label}
            aria-current={isActive ? 'page' : undefined}
            role="tab"
            tabIndex={0}
            data-testid={`nav-item-${item.id}`}
            data-active={isActive}
          >
            <div
              className="bottom-navigation-icon"
              style={iconContainerStyles}
            >
              {displayIcon}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="bottom-navigation-badge"
                  style={badgeStyles}
                  aria-label={`${item.badge} notifications`}
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span
              className="bottom-navigation-label"
              style={labelStyles}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavigation;
