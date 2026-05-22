/**
 * SeasonHistorySection — client-side season grouping of care logs (FR-F09)
 */

import React, { useState, useEffect } from 'react';
import { Text } from 'zmp-ui';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { listCareLogs, type CareLogDto } from '@/services/careLogService';

interface SeasonGroup {
  key: string;  // "MM/YYYY"
  label: string;
  logs: CareLogDto[];
  actionTypes: string[];
}

const ACTION_LABELS: Record<string, string> = {
  watering: 'Tưới nước',
  fertilizing: 'Bón phân',
  pest_control: 'Phun thuốc',
  inspection: 'Kiểm tra',
  harvesting: 'Thu hoạch',
  other: 'Khác',
};

function groupBySeason(logs: CareLogDto[]): SeasonGroup[] {
  const map = new Map<string, CareLogDto[]>();
  for (const log of logs) {
    const d = new Date(log.performedAt);
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(log);
  }

  const groups: SeasonGroup[] = [];
  map.forEach((groupLogs, key) => {
    // Only include if ≥5 logs (qualify as a "season")
    if (groupLogs.length >= 5) {
      const actionSet = new Set(groupLogs.map((l) => l.standardStepTitle ?? l.action));
      groups.push({
        key,
        label: key,
        logs: groupLogs,
        actionTypes: [...actionSet].slice(0, 5),
      });
    }
  });

  // Sort descending by key (most recent first)
  groups.sort((a, b) => {
    const [ma, ya] = a.key.split('/').map(Number);
    const [mb, yb] = b.key.split('/').map(Number);
    if (ya !== yb) return yb - ya;
    return mb - ma;
  });

  return groups;
}

export interface SeasonHistorySectionProps {
  farmId: string | null;
}

export const SeasonHistorySection: React.FC<SeasonHistorySectionProps> = ({ farmId }) => {
  const openSnackbar = useStableOpenSnackbar();
  const [logs, setLogs] = useState<CareLogDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!farmId) return;
    let cancelled = false;
    setLoading(true);
    listCareLogs(farmId, { limit: 100 })
      .then((res) => { if (!cancelled) { setLogs(res.items); setLoading(false); } })
      .catch(() => {
        if (!cancelled) {
          openSnackbar({ type: 'error', text: 'Không thể tải lịch sử nhật ký.', duration: 3000, icon: true });
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [farmId, openSnackbar]);

  if (loading) {
    return (
      <div style={{ padding: spacing.md }}>
        <div style={{ height: 120, backgroundColor: colors.background.secondary, borderRadius: 8 }} className="skeleton-pulse" />
      </div>
    );
  }

  const seasons = groupBySeason(logs);

  if (seasons.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="Chưa đủ dữ liệu mùa vụ"
        description="Cần ít nhất 5 nhật ký trong một tháng để hiển thị mùa vụ."
      />
    );
  }

  return (
    <div style={{ padding: `0 ${spacing.md}` }}>
      <Text.Title size="small" style={{ margin: `0 0 ${spacing.sm}` }}>Lịch sử mùa vụ</Text.Title>
      {seasons.map((season) => (
        <div
          key={season.key}
          style={{
            padding: spacing.md,
            backgroundColor: colors.background.primary,
            border: `1px solid ${colors.background.secondary}`,
            borderRadius: 10,
            marginBottom: spacing.sm,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <Text.Title size="small" style={{ margin: 0 }}>Mùa {season.label}</Text.Title>
            <span style={{ fontSize: fontSize.small, color: colors.text.secondary, fontWeight: fontWeight.medium }}>
              {season.logs.length} nhật ký
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
            {season.actionTypes.map((action) => (
              <span
                key={action}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: `${colors.primary.agriGreen}18`,
                  border: `1px solid ${colors.primary.agriGreen}30`,
                  borderRadius: 20,
                  fontSize: fontSize.small,
                  color: colors.primary.agriGreen,
                  fontWeight: fontWeight.medium,
                }}
              >
                {ACTION_LABELS[action] ?? action}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SeasonHistorySection;
