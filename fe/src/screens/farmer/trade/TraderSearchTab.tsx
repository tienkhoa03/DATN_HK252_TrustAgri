/**
 * TraderSearchTab — search traders and send connection request (FR-F02)
 */

import React, { useState, useEffect, useRef } from 'react';
import { Text } from 'zmp-ui';
import { EmptyState } from '@/design-system/components/EmptyState';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  searchTraders,
  createConnection,
  toConnectionViMessage,
  type TraderSearchResultDto,
} from '@/services/connectionService';
import { listFarms } from '@/services/farmService';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';

const REGION_OPTIONS = ['all', 'Hà Nội', 'TP.HCM', 'Đồng Nai', 'Lâm Đồng', 'An Giang', 'Cần Thơ'];

function trustScoreColor(score: number): string {
  if (score >= 90) return colors.primary.agriGreen;
  if (score >= 70) return colors.primary.zaloBlue;
  return colors.functional.warningYellow;
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
}

export const TraderSearchTab: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();
  const session = useAtomValue(authSessionAtom);

  const [traders, setTraders] = useState<TraderSearchResultDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState('all');
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [farmId, setFarmId] = useState<string | null>(null);
  const farmResolvedRef = useRef(false);

  // Resolve farmId once
  useEffect(() => {
    if (!session?.userId || farmResolvedRef.current) return;
    farmResolvedRef.current = true;
    listFarms({ ownerId: session.userId, page: 1, limit: 1 }).then((res) => {
      setFarmId(res.items[0]?.id ?? null);
    }).catch(() => {});
  }, [session?.userId]);

  // Load traders on mount and filter change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchTraders({ region: region === 'all' ? undefined : region, limit: 20 })
      .then((res) => { if (!cancelled) { setTraders(res.items); setLoading(false); } })
      .catch((err) => {
        if (!cancelled) {
          openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'search'), duration: 3500, icon: true });
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [region, openSnackbar]);

  const handleSendRequest = async (trader: TraderSearchResultDto) => {
    if (!farmId) {
      openSnackbar({ type: 'error', text: 'Cần có vườn để gửi hồ sơ kết nối.', duration: 3000, icon: true });
      return;
    }
    setSending((prev) => ({ ...prev, [trader.userId]: true }));
    try {
      await createConnection({ toUserId: trader.userId, farmId });
      openSnackbar({ type: 'success', text: 'Đã gửi yêu cầu kết nối!', duration: 2500, icon: true });
      // Optimistically update trader status
      setTraders((prev) =>
        prev.map((t) => t.userId === trader.userId ? { ...t, connectionStatus: 'pending_sent' } : t),
      );
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'create'), duration: 3500, icon: true });
    } finally {
      setSending((prev) => ({ ...prev, [trader.userId]: false }));
    }
  };

  return (
    <div>
      {/* Region filter chips */}
      <div style={{ display: 'flex', gap: spacing.xs, overflowX: 'auto', padding: `${spacing.sm} ${spacing.md}` }}>
        {REGION_OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: 20,
              border: `1px solid ${region === r ? colors.primary.zaloBlue : colors.background.secondary}`,
              backgroundColor: region === r ? `${colors.primary.zaloBlue}18` : colors.background.secondary,
              color: region === r ? colors.primary.zaloBlue : colors.text.secondary,
              fontSize: fontSize.small,
              fontWeight: region === r ? fontWeight.semibold : fontWeight.regular,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minHeight: 44,
            }}
          >
            {r === 'all' ? 'Tất cả' : r}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ padding: spacing.lg, textAlign: 'center' }}>
          <span style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>Đang tải…</span>
        </div>
      )}

      {!loading && traders.length === 0 && (
        <EmptyState
          icon="🔍"
          title="Không tìm thấy thương lái"
          description="Thử đổi khu vực tìm kiếm."
        />
      )}

      {!loading && traders.map((trader) => {
        const score = trader.traderProfile.trustScore;
        const scoreColor = trustScoreColor(score);
        const alreadySent = trader.connectionStatus === 'pending_sent' || trader.connectionStatus === 'accepted';
        const isSending = sending[trader.userId] ?? false;

        return (
          <div
            key={trader.userId}
            style={{
              margin: `0 ${spacing.md} ${spacing.sm}`,
              padding: spacing.md,
              backgroundColor: colors.background.primary,
              border: `1px solid ${colors.background.secondary}`,
              borderRadius: 10,
            }}
          >
            {/* Trader header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.sm }}>
              {/* Avatar */}
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                backgroundColor: colors.primary.zaloBlue,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: colors.text.inverse, fontWeight: fontWeight.bold, fontSize: fontSize.caption,
                flexShrink: 0, overflow: 'hidden',
              }}>
                {trader.avatarUrl
                  ? <img src={trader.avatarUrl} alt={trader.displayName} style={{ width: '100%', height: '100%' }} />
                  : <span>{initials(trader.displayName)}</span>}
              </div>

              <div style={{ flex: 1 }}>
                <Text.Title size="small" style={{ margin: 0 }}>{trader.displayName}</Text.Title>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  {trader.traderProfile.companyName}
                </Text>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  {trader.traderProfile.region} · {trader.traderProfile.capacity}
                </Text>
              </div>

              {/* Trust score circle */}
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: `3px solid ${scoreColor}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: fontSize.caption, fontWeight: fontWeight.bold, color: scoreColor, lineHeight: 1 }}>
                  {score}
                </span>
                <span style={{ fontSize: '10px', color: colors.text.secondary, lineHeight: 1 }}>uy tín</span>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => handleSendRequest(trader)}
              disabled={alreadySent || isSending}
              style={{
                width: '100%',
                padding: spacing.sm,
                backgroundColor: alreadySent ? colors.background.secondary : colors.primary.zaloBlue,
                color: alreadySent ? colors.text.secondary : colors.text.inverse,
                border: 'none',
                borderRadius: 8,
                fontSize: fontSize.caption,
                fontWeight: fontWeight.semibold,
                cursor: alreadySent || isSending ? 'not-allowed' : 'pointer',
                minHeight: 44,
              }}
            >
              {isSending ? 'Đang gửi…' : alreadySent ? (trader.connectionStatus === 'accepted' ? 'Đã kết nối' : 'Đã gửi yêu cầu') : 'Gửi hồ sơ năng lực'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default TraderSearchTab;
