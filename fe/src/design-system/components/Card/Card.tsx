/**
 * Card Component
 * Card component với title, subtitle, image, status
 * 
 * Requirements: 8.1
 */

import React from 'react';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize, fontWeight } from '../../tokens/typography';

export type CardStatus = 'success' | 'warning' | 'error' | 'info' | 'none';

export interface CardProps {
  title?: string;
  subtitle?: string;
  image?: string;
  status?: CardStatus;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Card Component
 * Tuân thủ design system với shadow và border radius
 * Requirements: 8.1 (Component Library Consistency)
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  image,
  status = 'none',
  children,
  onClick,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const isClickable = !!onClick;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard navigation support - Enter and Space
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  // Status color mapping
  const statusColors: Record<CardStatus, string> = {
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    error: colors.semantic.error,
    info: colors.semantic.info,
    none: 'transparent',
  };

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'all 0.2s ease-in-out',
    cursor: isClickable ? 'pointer' : 'default',
    position: 'relative',
    outline: 'none',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    display: 'block',
  };

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    lineHeight: 1.2,
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    margin: 0,
    lineHeight: 1.5,
  };

  const statusIndicatorStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: statusColors[status],
    border: `2px solid ${colors.background.primary}`,
    display: status === 'none' ? 'none' : 'block',
  };

  const hoverStyles: React.CSSProperties = isClickable
    ? {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }
    : {};

  const activeStyles: React.CSSProperties = isClickable
    ? {
        transform: 'translateY(0)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
      }
    : {};

  const cardElement = (
    <div
      className={`card ${isClickable ? 'card-clickable' : ''} ${className}`}
      style={baseStyles}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={ariaLabel || title}
      data-status={status}
      data-clickable={isClickable}
      onMouseEnter={(e) => {
        if (isClickable) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: baseStyles.boxShadow });
        }
      }}
      onMouseDown={(e) => {
        if (isClickable) {
          Object.assign(e.currentTarget.style, activeStyles);
        }
      }}
      onMouseUp={(e) => {
        if (isClickable) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
    >
      {/* Status Indicator */}
      {status !== 'none' && <div style={statusIndicatorStyles} aria-hidden="true" />}

      {/* Image */}
      {image && (
        <div className="card-image">
          <img src={image} alt={title || 'Card image'} style={imageStyles} />
        </div>
      )}

      {/* Content */}
      <div className="card-content" style={contentStyles}>
        {title && (
          <h3 className="card-title" style={titleStyles}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="card-subtitle" style={subtitleStyles}>
            {subtitle}
          </p>
        )}
        {children && <div className="card-body">{children}</div>}
      </div>
    </div>
  );

  return cardElement;
};

export default Card;
