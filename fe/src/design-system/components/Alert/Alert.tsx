/**
 * Alert Component
 * Alert component với severity levels (info, warning, error, success)
 * 
 * Requirements: 2.3, 2.4, 13.1-13.4
 */

import React, { useState } from 'react';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize, fontWeight } from '../../tokens/typography';
import { Icon } from '../Icon';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

export interface AlertAction {
  label: string;
  onClick: () => void;
}

export interface AlertProps {
  severity: AlertSeverity;
  title: string;
  message: string;
  action?: AlertAction;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Alert Component
 * Hiển thị cảnh báo với màu sắc và icon phù hợp theo severity
 * Requirements: 2.3 (Alert Red), 2.4 (Warning Yellow), 13.1-13.4 (Alert functionality)
 */
export const Alert: React.FC<AlertProps> = ({
  severity,
  title,
  message,
  action,
  dismissible = false,
  onDismiss,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) {
    return null;
  }

  // Severity color mapping - Requirements 2.3, 2.4
  const severityColors: Record<AlertSeverity, string> = {
    info: colors.semantic.info,        // Zalo Blue #0068FF
    warning: colors.semantic.warning,  // Warning Yellow #FFCC00 - Requirement 2.4
    error: colors.semantic.error,      // Alert Red #F50000 - Requirement 2.3
    success: colors.semantic.success,  // Agri Green #3EBB6C
  };

  // Icon mapping per severity type - Requirement 13.1
  const severityIcons: Record<AlertSeverity, React.ReactNode> = {
    info: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-style="outline"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    warning: <Icon name="alert" size="md" />,
    error: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-style="outline"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    success: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        data-style="outline"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  };

  const severityColor = severityColors[severity];
  const severityIcon = severityIcons[severity];

  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: '8px',
    backgroundColor: `${severityColor}15`, // 15% opacity
    borderLeft: `4px solid ${severityColor}`,
    position: 'relative',
    fontFamily: '-apple-system, Roboto, sans-serif',
  };

  const iconContainerStyles: React.CSSProperties = {
    flexShrink: 0,
    color: severityColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '2px',
  };

  const contentStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    lineHeight: 1.5,
  };

  const messageStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    margin: 0,
    lineHeight: 1.5,
  };

  const actionsContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  };

  const actionButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: severityColor,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '6px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    minHeight: '36px',
    minWidth: '36px',
  };

  const dismissButtonStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: colors.text.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s ease-in-out',
    minHeight: '32px',
    minWidth: '32px',
  };

  return (
    <div
      className={`alert alert-${severity} ${className}`}
      style={baseStyles}
      role="alert"
      aria-live={severity === 'error' ? 'assertive' : 'polite'}
      aria-label={ariaLabel || `${severity} alert: ${title}`}
      data-severity={severity}
      data-dismissible={dismissible}
    >
      {/* Icon */}
      <div className="alert-icon" style={iconContainerStyles} aria-hidden="true">
        {severityIcon}
      </div>

      {/* Content */}
      <div className="alert-content" style={contentStyles}>
        <h4 className="alert-title" style={titleStyles}>
          {title}
        </h4>
        <p className="alert-message" style={messageStyles}>
          {message}
        </p>

        {/* Action Button - Requirement 13.2 */}
        {action && (
          <div className="alert-actions" style={actionsContainerStyles}>
            <button
              className="alert-action-button"
              style={actionButtonStyles}
              onClick={action.onClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.filter = 'brightness(0.8)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.filter = 'brightness(0.9)';
              }}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss Button - Requirement 13.4 */}
      {dismissible && (
        <button
          className="alert-dismiss"
          style={dismissButtonStyles}
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${colors.text.secondary}15`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;
