/**
 * ScreenLayout Component
 * Main layout structure with header, content, and footer
 * 
 * Requirements: 1.1, 8.1
 */

import React from 'react';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';

export interface ScreenLayoutProps {
  /** Header content (typically Header component) */
  header?: React.ReactNode;
  /** Main content area (scrollable) */
  children: React.ReactNode;
  /** Footer content (typically BottomNavigation) */
  footer?: React.ReactNode;
  /** Background color */
  backgroundColor?: string;
  /** Additional CSS class */
  className?: string;
  /** Enable safe area padding for iOS notch */
  useSafeArea?: boolean;
}

/**
 * ScreenLayout Component
 * Provides consistent layout structure across all screens
 * 
 * Layout Structure:
 * ┌─────────────────────────────────┐
 * │         Header (56px)           │
 * ├─────────────────────────────────┤
 * │                                 │
 * │      Content (Scrollable)       │
 * │                                 │
 * ├─────────────────────────────────┤
 * │      Footer (64px, optional)    │
 * └─────────────────────────────────┘
 */
export const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  header,
  children,
  footer,
  backgroundColor = colors.background.primary,
  className = '',
  useSafeArea = true,
}) => {
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    backgroundColor,
    position: 'relative',
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    flexShrink: 0,
    width: '100%',
    zIndex: 100,
    ...(useSafeArea && {
      paddingTop: 'env(safe-area-inset-top)',
    }),
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    width: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
    position: 'relative',
  };

  const footerStyles: React.CSSProperties = {
    flexShrink: 0,
    width: '100%',
    zIndex: 100,
    ...(useSafeArea && {
      paddingBottom: 'env(safe-area-inset-bottom)',
    }),
  };

  return (
    <div
      className={`screen-layout ${className}`}
      style={containerStyles}
      data-testid="screen-layout"
    >
      {header && (
        <div
          className="screen-layout-header"
          style={headerStyles}
          data-testid="screen-layout-header"
        >
          {header}
        </div>
      )}
      
      <main
        className="screen-layout-content"
        style={contentStyles}
        data-testid="screen-layout-content"
      >
        {children}
      </main>
      
      {footer && (
        <div
          className="screen-layout-footer"
          style={footerStyles}
          data-testid="screen-layout-footer"
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default ScreenLayout;
