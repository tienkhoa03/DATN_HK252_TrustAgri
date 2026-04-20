/**
 * Header Component
 * Navigation header with title and actions
 * 
 * Requirements: 1.1, 8.1
 */

import React from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

export interface HeaderProps {
  /** Header title */
  title?: string;
  /** Left action (typically back button or menu) */
  leftAction?: React.ReactNode;
  /** Right actions (typically icons or buttons) */
  rightActions?: React.ReactNode;
  /** Background color */
  backgroundColor?: string;
  /** Show bottom border */
  showBorder?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Center align title */
  centerTitle?: boolean;
}

/**
 * Header Component
 * Standard header with 56px height
 * Tuân thủ Native Zalo design language
 */
export const Header: React.FC<HeaderProps> = ({
  title,
  leftAction,
  rightActions,
  backgroundColor = colors.background.primary,
  showBorder = true,
  className = '',
  centerTitle = false,
}) => {
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    minHeight: '56px',
    padding: `0 ${spacing.md}`,
    backgroundColor,
    borderBottom: showBorder ? `1px solid ${colors.functional.neutralGray}` : 'none',
    position: 'relative',
  };

  const leftSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: '44px', // Minimum touch target
    flex: centerTitle ? 1 : 'none',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: fontSize.h2, // 18px
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: centerTitle ? 'none' : 1,
    textAlign: centerTitle ? 'center' : 'left',
    ...(centerTitle && {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: '60%',
    }),
  };

  const rightSectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: '44px', // Minimum touch target
    flex: centerTitle ? 1 : 'none',
    justifyContent: 'flex-end',
  };

  return (
    <header
      className={`header ${className}`}
      style={headerStyles}
      data-testid="header"
      role="banner"
    >
      <div
        className="header-left"
        style={leftSectionStyles}
        data-testid="header-left"
      >
        {leftAction}
      </div>

      {title && (
        <h1
          className="header-title"
          style={titleStyles}
          data-testid="header-title"
        >
          {title}
        </h1>
      )}

      <div
        className="header-right"
        style={rightSectionStyles}
        data-testid="header-right"
      >
        {rightActions}
      </div>
    </header>
  );
};

export default Header;
