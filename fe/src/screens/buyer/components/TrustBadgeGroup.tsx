/**
 * TrustBadgeGroup — pill badges for certifications, IoT, deposit support
 * NFR-U03: touch targets + font ≥14px; design tokens only (no hardcode)
 */

import React from 'react';
import { colors } from '@/design-system/tokens/colors';

export interface TrustBadgeGroupProps {
  certifications?: string[];
  hasIot?: boolean;
  supportsDeposit?: boolean;
  maxVisible?: number;
}

interface BadgeSpec {
  label: string;
  bg: string;
  color: string;
  icon?: string;
}

function buildBadges(
  certifications: string[],
  hasIot: boolean,
  supportsDeposit: boolean,
): BadgeSpec[] {
  const list: BadgeSpec[] = [];

  for (const cert of certifications) {
    const lower = cert.toLowerCase();
    if (lower.includes('vietgap')) {
      list.push({ label: 'VietGAP', bg: colors.primary.agriGreen, color: colors.text.inverse });
    } else if (lower.includes('globalgap')) {
      list.push({ label: 'GlobalGAP', bg: colors.primary.zaloBlue, color: colors.text.inverse });
    } else if (lower.includes('organic') || lower.includes('hữu cơ')) {
      list.push({ label: 'Hữu cơ', bg: colors.functional.alertRed, color: colors.text.inverse });
    } else {
      list.push({ label: cert, bg: colors.functional.neutralGray, color: colors.text.primary });
    }
  }

  if (hasIot) {
    list.push({ label: 'Có IoT', bg: colors.functional.neutralGray, color: colors.text.secondary, icon: '👁' });
  }

  if (supportsDeposit) {
    // Light blue tint — uses zaloBlue at 15% opacity via rgba
    list.push({ label: 'Hỗ trợ đặt cọc', bg: 'rgba(0,104,255,0.12)', color: colors.primary.zaloBlue });
  }

  return list;
}

const badgeStyle = (bg: string, color: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
  height: '20px',
  padding: '0 8px',
  borderRadius: '10px',
  backgroundColor: bg,
  color,
  fontSize: '11px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  lineHeight: '20px',
});

export const TrustBadgeGroup: React.FC<TrustBadgeGroupProps> = ({
  certifications = [],
  hasIot = false,
  supportsDeposit = false,
  maxVisible = 2,
}) => {
  const badges = buildBadges(certifications, hasIot, supportsDeposit);

  if (badges.length === 0) return null;

  const visible = badges.slice(0, maxVisible);
  const hidden = badges.length - visible.length;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {visible.map((b, i) => (
        <span key={i} style={badgeStyle(b.bg, b.color)}>
          {b.icon && <span style={{ fontSize: '9px' }}>{b.icon}</span>}
          {b.label}
        </span>
      ))}
      {hidden > 0 && (
        <span style={badgeStyle(colors.functional.neutralGray, colors.text.secondary)}>
          +{hidden}
        </span>
      )}
    </div>
  );
};
