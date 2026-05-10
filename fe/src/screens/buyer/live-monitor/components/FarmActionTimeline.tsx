/**
 * FarmActionTimeline — Phase 4 (FR-U05)
 * Scrollable timeline of farm care-log entries for buyer visibility.
 */

import React from 'react';
import { Text } from 'zmp-ui';
import { colors } from '@/design-system/tokens/colors';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { spacing } from '@/design-system/tokens/spacing';

export interface CareLogEntry {
  id: string;
  actorName?: string;
  actorAvatar?: string;
  timestamp: string;
  action: string;
  imageUrl?: string;
  notes?: string;
}

export interface FarmActionTimelineProps {
  entries: CareLogEntry[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | undefined): string {
  if (!name) return 'ND';
  return name
    .split(' ')
    .slice(-2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `${timeStr} hôm nay`;
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

const SkeletonRow: React.FC = () => (
  <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md }}>
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: colors.background.tertiary,
        flexShrink: 0,
      }}
    />
    <div style={{ flex: 1 }}>
      {[60, 40, 80].map((w, i) => (
        <div
          key={i}
          style={{
            height: '12px',
            width: `${w}%`,
            backgroundColor: colors.background.tertiary,
            borderRadius: '6px',
            marginBottom: spacing.xs,
          }}
        />
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const FarmActionTimeline: React.FC<FarmActionTimelineProps> = ({
  entries,
  loading = false,
  onLoadMore,
  hasMore = false,
}) => {
  if (loading && entries.length === 0) {
    return (
      <div style={{ padding: `${spacing.sm} 0` }}>
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (!loading && entries.length === 0) {
    return (
      <div
        style={{
          padding: spacing.lg,
          textAlign: 'center',
        }}
      >
        <Text size="small" style={{ color: colors.text.secondary }}>
          Chưa có hoạt động nào
        </Text>
      </div>
    );
  }

  return (
    <div>
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{
            display: 'flex',
            gap: spacing.sm,
            marginBottom: spacing.md,
            alignItems: 'flex-start',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: entry.actorAvatar ? 'transparent' : `${colors.primary.agriGreen}25`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {entry.actorAvatar ? (
              <img
                src={entry.actorAvatar}
                alt={entry.actorName ?? 'Nông dân'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Text
                size="xSmall"
                style={{
                  color: colors.primary.agriGreen,
                  fontWeight: fontWeight.bold,
                  fontSize: '12px',
                }}
              >
                {getInitials(entry.actorName)}
              </Text>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.xs }}>
              <Text
                size="small"
                style={{ fontWeight: fontWeight.semibold, margin: 0, color: colors.text.primary, fontSize: fontSize.caption }}
              >
                {entry.actorName ?? 'Nông dân'}
              </Text>
              <Text
                size="xSmall"
                style={{ color: colors.text.secondary, margin: 0, fontSize: '11px', flexShrink: 0, marginLeft: spacing.xs }}
              >
                {formatTimestamp(entry.timestamp)}
              </Text>
            </div>

            <Text
              size="small"
              style={{ margin: `0 0 ${spacing.xs} 0`, color: colors.text.primary, fontSize: fontSize.caption }}
            >
              {entry.action}
            </Text>

            {/* Image thumbnail */}
            {entry.imageUrl && (
              <div style={{ marginBottom: spacing.xs }}>
                <img
                  src={entry.imageUrl}
                  alt={entry.action}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                />
              </div>
            )}

            {/* Notes */}
            {entry.notes && (
              <Text
                size="xSmall"
                style={{ color: colors.text.secondary, margin: 0, fontSize: '12px' }}
              >
                {entry.notes}
              </Text>
            )}
          </div>
        </div>
      ))}

      {/* Load more */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: spacing.sm }}>
          <button
            onClick={onLoadMore}
            style={{
              minHeight: '44px',
              padding: `${spacing.sm} ${spacing.lg}`,
              backgroundColor: 'transparent',
              border: `1px solid ${colors.background.tertiary}`,
              borderRadius: '8px',
              color: colors.text.secondary,
              fontSize: fontSize.caption,
              cursor: 'pointer',
            }}
          >
            Tải thêm
          </button>
        </div>
      )}
    </div>
  );
};
