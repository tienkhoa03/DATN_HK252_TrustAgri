/**
 * FarmTrafficLightCard — farm compliance card with traffic-light badge
 * FR-T11, NFR-U01, NFR-U03
 */

import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

// Shared crop label map (mirrors TraderSupplyMonitorScreen)
export const CROP_TYPE_LABELS: Record<string, string> = {
  dragon_fruit: 'Thanh long',
  pomelo: 'Bưởi',
  mango: 'Xoài',
  orange: 'Cam',
  longan: 'Nhãn',
  durian: 'Sầu riêng',
  lychee: 'Vải',
  banana: 'Chuối',
  rambutan: 'Chôm chôm',
};

export interface FarmTrafficLightCardProps {
  farmName: string;
  farmerName: string;
  cropType: string;
  province?: string;
  complianceScore: number; // 0–1
  onTap: () => void;
}

interface BadgeConfig {
  color: string;
  label: string;
  dot: string;
}

function getBadgeConfig(score: number): BadgeConfig {
  if (score >= 0.8) {
    return { color: colors.primary.agriGreen, label: 'Tốt', dot: colors.primary.agriGreen };
  }
  if (score >= 0.5) {
    return {
      color: colors.functional.warningYellow,
      label: 'Cần theo dõi',
      dot: colors.functional.warningYellow,
    };
  }
  return { color: colors.functional.alertRed, label: 'Cảnh báo', dot: colors.functional.alertRed };
}

export const FarmTrafficLightCard: React.FC<FarmTrafficLightCardProps> = ({
  farmName,
  farmerName,
  cropType,
  province,
  complianceScore,
  onTap,
}) => {
  const badge = getBadgeConfig(complianceScore);
  const cropLabel = CROP_TYPE_LABELS[cropType] ?? cropType;
  const pct = Math.round(complianceScore * 100);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => e.key === 'Enter' && onTap()}
      style={{
        position: 'relative',
        padding: spacing.md,
        backgroundColor: colors.background.primary,
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: spacing.md,
        cursor: 'pointer',
        minHeight: '44px',
        border: `1px solid ${colors.background.tertiary}`,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.13)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      }}
      aria-label={`${farmName} — tuân thủ ${pct}% — ${badge.label}`}
    >
      {/* Traffic-light badge (top-right) */}
      <div
        style={{
          position: 'absolute',
          top: spacing.sm,
          right: spacing.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          padding: `2px ${spacing.sm}`,
          backgroundColor: `${badge.color}18`,
          borderRadius: '99px',
          border: `1px solid ${badge.color}`,
        }}
        aria-hidden="true"
      >
        {/* Dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: badge.dot,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: fontSize.small,
            fontWeight: fontWeight.semibold,
            color: badge.color,
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* Farm name */}
      <Text.Title
        size="small"
        style={{ margin: 0, marginRight: '80px', marginBottom: spacing.xs }}
      >
        {farmName}
      </Text.Title>

      {/* Farmer name */}
      <Text
        size="small"
        style={{ color: colors.text.secondary, margin: 0, marginBottom: spacing.xs }}
      >
        {farmerName}
      </Text>

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          gap: spacing.md,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginTop: spacing.xs,
        }}
      >
        <span
          style={{
            padding: `2px ${spacing.sm}`,
            backgroundColor: `${colors.primary.agriGreen}18`,
            borderRadius: '99px',
            fontSize: fontSize.small,
            fontWeight: fontWeight.medium,
            color: colors.primary.agriGreen,
          }}
        >
          {cropLabel}
        </span>

        {province && (
          <Text
            size="xSmall"
            style={{ color: colors.text.secondary, margin: 0 }}
          >
            {province}
          </Text>
        )}
      </div>

      {/* Compliance score bar */}
      <div style={{ marginTop: spacing.sm }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            Tuân thủ
          </Text>
          <Text
            size="xSmall"
            style={{ color: badge.color, fontWeight: fontWeight.semibold, margin: 0 }}
          >
            {pct}%
          </Text>
        </div>
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: colors.background.secondary,
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              backgroundColor: badge.color,
              borderRadius: '2px',
              transition: 'width 0.3s',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default FarmTrafficLightCard;
