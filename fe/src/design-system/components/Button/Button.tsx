/**
 * Button Component
 * Core button component với variants, sizes, và states
 * 
 * Requirements: 2.1, 8.1, 9.4
 */

import React from 'react';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize, fontWeight } from '../../tokens/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  'aria-disabled'?: boolean;
  'aria-busy'?: boolean;
}

/**
 * Button Component
 * Tuân thủ design system với minimum touch target 44x44px
 * Requirements: 2.1 (Zalo Blue for primary), 8.1 (consistency), 9.4 (native components)
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  children,
  onClick,
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
  'aria-disabled': ariaDisabled,
  'aria-busy': ariaBusy,
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard navigation support - Enter and Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    border: 'none',
    borderRadius: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily: '-apple-system, Roboto, sans-serif',
    fontWeight: fontWeight.medium,
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    position: 'relative',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  // Size styles - Ensure minimum touch target 44x44px
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    small: {
      minHeight: '44px', // Minimum touch target
      minWidth: '44px',
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: fontSize.caption, // 14px
    },
    medium: {
      minHeight: '44px', // Minimum touch target
      minWidth: '44px',
      padding: `${spacing.md} ${spacing.lg}`,
      fontSize: fontSize.body, // 16px
    },
    large: {
      minHeight: '48px',
      minWidth: '48px',
      padding: `${spacing.md} ${spacing.xl}`,
      fontSize: fontSize.h2, // 18px
    },
  };

  // Variant styles
  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    // Primary: Zalo Blue background, white text - Requirement 2.1
    primary: {
      backgroundColor: colors.primary.zaloBlue,
      color: colors.text.inverse,
      border: 'none',
    },
    // Secondary: Agri Green background, white text
    secondary: {
      backgroundColor: colors.primary.agriGreen,
      color: colors.text.inverse,
      border: 'none',
    },
    // Outline: Border only, transparent background
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary.zaloBlue,
      border: `2px solid ${colors.primary.zaloBlue}`,
    },
    // Text: No border, no background
    text: {
      backgroundColor: 'transparent',
      color: colors.primary.zaloBlue,
      border: 'none',
    },
  };

  // State styles
  const getStateStyles = (): React.CSSProperties => {
    if (disabled) {
      return {
        opacity: 0.5,
        cursor: 'not-allowed',
      };
    }

    if (loading) {
      return {
        opacity: 0.7,
        cursor: 'not-allowed',
      };
    }

    return {};
  };

  // Hover styles (applied via CSS-in-JS)
  const getHoverStyles = (): React.CSSProperties => {
    if (disabled || loading) return {};

    switch (variant) {
      case 'primary':
        return {
          filter: 'brightness(0.9)',
        };
      case 'secondary':
        return {
          filter: 'brightness(0.9)',
        };
      case 'outline':
        return {
          backgroundColor: `${colors.primary.zaloBlue}10`,
        };
      case 'text':
        return {
          backgroundColor: `${colors.primary.zaloBlue}10`,
        };
      default:
        return {};
    }
  };

  // Active styles
  const getActiveStyles = (): React.CSSProperties => {
    if (disabled || loading) return {};

    switch (variant) {
      case 'primary':
        return {
          filter: 'brightness(0.8)',
        };
      case 'secondary':
        return {
          filter: 'brightness(0.8)',
        };
      case 'outline':
        return {
          backgroundColor: `${colors.primary.zaloBlue}20`,
        };
      case 'text':
        return {
          backgroundColor: `${colors.primary.zaloBlue}20`,
        };
      default:
        return {};
    }
  };

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...getStateStyles(),
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      className={`button button-${variant} button-${size} ${className}`}
      style={combinedStyles}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-disabled={ariaDisabled || disabled}
      aria-busy={ariaBusy || loading}
      role="button"
      tabIndex={disabled ? -1 : 0}
      data-variant={variant}
      data-size={size}
      data-disabled={disabled}
      data-loading={loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getHoverStyles());
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, variantStyles[variant]);
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getActiveStyles());
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, getHoverStyles());
        }
      }}
    >
      {loading && (
        <span
          style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
          aria-hidden="true"
        />
      )}
      {!loading && icon && <span className="button-icon">{icon}</span>}
      <span className="button-content">{children}</span>
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
};

export default Button;
