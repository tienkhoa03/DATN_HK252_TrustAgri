/**
 * SensorDisplay Component
 * Component hiển thị dữ liệu cảm biến với icon, status color, và timestamp
 * 
 * Requirements: 4.3-4.6, 12.2-12.6
 */

import React from 'react';
import { Icon } from '../Icon/Icon';
import { colors, getStatusColor } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize, fontWeight } from '../../tokens/typography';

export type SensorType = 'temperature' | 'humidity' | 'light';
export type SensorStatus = 'normal' | 'warning' | 'danger';

export interface SensorDisplayProps {
  type: SensorType;
  value: number;
  unit: string;
  status: SensorStatus;
  isImputed?: boolean;
  timestamp: Date;
  className?: string;
  'aria-label'?: string;
}

/**
 * SensorDisplay Component
 * Hiển thị thông số cảm biến với icon mapping, status color, và imputed data labeling
 * 
 * Requirements:
 * - 4.3: Temperature với icon nhiệt kế
 * - 4.4: Humidity với icon giọt nước
 * - 4.5: Light với icon mặt trời
 * - 12.2-12.6: Status color mapping, imputed data labeling, timestamp display
 */
export const SensorDisplay: React.FC<SensorDisplayProps> = ({
  type,
  value,
  unit,
  status,
  isImputed = false,
  timestamp,
  className = '',
  'aria-label': ariaLabel,
}) => {
  // Icon mapping per sensor type - Requirements 4.3-4.5
  const iconMapping: Record<SensorType, 'temperature' | 'humidity' | 'light'> = {
    temperature: 'temperature',
    humidity: 'humidity',
    light: 'light',
  };

  // Status color mapping - Requirement 12.2-12.5
  const statusColor = getStatusColor(status);

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) {
      return 'Vừa xong';
    } else if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // Sensor type labels
  const sensorLabels: Record<SensorType, string> = {
    temperature: 'Nhiệt độ',
    humidity: 'Độ ẩm',
    light: 'Ánh sáng',
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    border: `2px solid ${statusColor}`,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    minWidth: '100px',
    position: 'relative',
    gap: spacing.sm,
  };

  const iconContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: `${statusColor}15`,
  };

  const labelStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    margin: 0,
    textAlign: 'center',
  };

  const valueContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: spacing.xs,
  };

  const valueStyles: React.CSSProperties = {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: statusColor,
    margin: 0,
    lineHeight: 1,
  };

  const unitStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    margin: 0,
  };

  const timestampStyles: React.CSSProperties = {
    fontSize: fontSize.small,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    margin: 0,
    textAlign: 'center',
  };

  const imputedBadgeStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.text.inverse,
    backgroundColor: colors.functional.warningYellow,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: '4px',
    display: isImputed ? 'block' : 'none',
  };

  const statusIndicatorStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: statusColor,
    border: `2px solid ${colors.background.primary}`,
  };

  return (
    <div
      className={`sensor-display sensor-display-${type} sensor-display-${status} ${className}`}
      style={containerStyles}
      role="region"
      aria-label={ariaLabel || `${sensorLabels[type]}: ${value} ${unit}`}
      data-sensor-type={type}
      data-status={status}
      data-imputed={isImputed}
    >
      {/* Status Indicator */}
      <div style={statusIndicatorStyles} aria-hidden="true" />

      {/* Imputed Data Badge - Requirement 12.6 */}
      {isImputed && (
        <div
          style={imputedBadgeStyles}
          role="status"
          aria-label="Dữ liệu bổ khuyết"
        >
          Bổ khuyết
        </div>
      )}

      {/* Icon - Requirements 4.3-4.5 */}
      <div style={iconContainerStyles}>
        <Icon
          name={iconMapping[type]}
          size="lg"
          color={statusColor}
          aria-hidden="true"
        />
      </div>

      {/* Sensor Label */}
      <p style={labelStyles}>{sensorLabels[type]}</p>

      {/* Value and Unit */}
      <div style={valueContainerStyles}>
        <span style={valueStyles}>{value}</span>
        <span style={unitStyles}>{unit}</span>
      </div>

      {/* Timestamp - Requirement 12.2 */}
      <p style={timestampStyles} aria-label={`Cập nhật: ${formatTimestamp(timestamp)}`}>
        {formatTimestamp(timestamp)}
      </p>
    </div>
  );
};

export default SensorDisplay;
