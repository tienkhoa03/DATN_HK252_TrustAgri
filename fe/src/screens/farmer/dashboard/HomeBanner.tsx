/**
 * HomeBanner — priority action banner for farmer dashboard (FR-F07, NFR-U01)
 */

import React from 'react';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';

export type BannerKind = 'iot-alert' | 'contract-pending' | 'connection-request' | 'all-good';

export interface HomeBannerProps {
  kind: BannerKind;
  alertCount?: number;
  pendingCount?: number;
  complianceScore?: number;
  onCta: () => void;
}

interface BannerConfig {
  bg: string;
  border: string;
  emoji: string;
  text: string;
  ctaLabel: string;
}

export const HomeBanner: React.FC<HomeBannerProps> = ({
  kind,
  alertCount = 0,
  pendingCount = 0,
  complianceScore = 0,
  onCta,
}) => {
  const config: BannerConfig = (() => {
    switch (kind) {
      case 'iot-alert':
        return {
          bg: `${colors.functional.alertRed}12`,
          border: colors.functional.alertRed,
          emoji: '🚨',
          text: `Có ${alertCount} cảnh báo IoT chưa xử lý`,
          ctaLabel: 'Xem cách xử lý',
        };
      case 'contract-pending':
      case 'connection-request':
        return {
          bg: `${colors.functional.warningYellow}18`,
          border: colors.functional.warningYellow,
          emoji: '🤝',
          text: `Bạn có ${pendingCount} yêu cầu hợp tác mới`,
          ctaLabel: 'Xem ngay',
        };
      case 'all-good':
      default:
        return {
          bg: `${colors.primary.agriGreen}12`,
          border: colors.primary.agriGreen,
          emoji: '✅',
          text: `Mọi thứ ổn định – tuân thủ ${complianceScore}%`,
          ctaLabel: 'Xem chi tiết',
        };
    }
  })();

  return (
    <div style={{
      margin: `${spacing.sm} ${spacing.md} 0`,
      padding: spacing.md,
      backgroundColor: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
        <span style={{ fontSize: '20px', lineHeight: 1 }}>{config.emoji}</span>
        <span style={{
          fontSize: fontSize.caption,
          fontWeight: fontWeight.medium,
          color: colors.text.primary,
          lineHeight: 1.4,
        }}>
          {config.text}
        </span>
      </div>
      <button
        type="button"
        onClick={onCta}
        style={{
          padding: `${spacing.xs} ${spacing.sm}`,
          backgroundColor: config.border,
          color: kind === 'iot-alert' || kind === 'all-good' ? colors.text.inverse : colors.text.primary,
          border: 'none',
          borderRadius: 6,
          fontSize: fontSize.small,
          fontWeight: fontWeight.semibold,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          minHeight: 44,
          minWidth: 80,
          flexShrink: 0,
        }}
      >
        {config.ctaLabel}
      </button>
    </div>
  );
};

export default HomeBanner;
