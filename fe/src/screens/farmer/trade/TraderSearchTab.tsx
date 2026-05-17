/**
 * TraderSearchTab — 2-step flow (FR-F02)
 *
 * Step 1: Farmer selects which farm to connect on behalf of.
 * Step 2: Farmer browses traders; connection status is scoped to the selected farm.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text } from 'zmp-ui';
import { Icon } from '@/design-system/components/Icon';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  searchTraders,
  createConnection,
  cancelConnection,
  acceptConnection,
  rejectConnection,
  listConnections,
  toConnectionViMessage,
  type TraderSearchResultDto,
  type ConnectionDto,
} from '@/services/connectionService';
import { listFarms, type FarmDto } from '@/services/farmService';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';

// ── Types ──────────────────────────────────────────────────────────────────────

type ConnectionStatus = ConnectionDto['status'];
type TraderConnectionFilter = 'all' | 'none' | ConnectionStatus;

interface ConnectionInfo {
  status: ConnectionStatus;
  connectionId: string;
  /** 'outgoing' = farmer gửi đến trader; 'incoming' = trader gửi đến farmer */
  direction: 'outgoing' | 'incoming';
}

// ── Constants ──────────────────────────────────────────────────────────────────

const REGION_OPTIONS = ['all', 'Hà Nội', 'TP.HCM', 'Đồng Nai', 'Lâm Đồng', 'An Giang', 'Cần Thơ'];

const CONNECTION_STATUS_FILTER_OPTIONS: { value: TraderConnectionFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'none', label: 'Chưa kết nối' },
  { value: 'pending', label: 'Chờ phản hồi' },
  { value: 'accepted', label: 'Đã kết nối' },
  { value: 'negotiating', label: 'Đang đàm phán' },
  { value: 'signed', label: 'Đã ký kết' },
  { value: 'rejected', label: 'Đã từ chối' },
];

const STATUS_LABEL: Record<TraderConnectionFilter, string> = {
  all: '',
  none: 'Chưa kết nối',
  pending: 'Chờ phản hồi',
  accepted: 'Đã kết nối',
  negotiating: 'Đang đàm phán',
  signed: 'Đã ký kết',
  rejected: 'Đã từ chối',
};

const STATUS_COLOR: Record<TraderConnectionFilter, string> = {
  all: colors.text.secondary,
  none: colors.text.secondary,
  pending: colors.functional.warningYellow,
  accepted: colors.primary.agriGreen,
  negotiating: colors.primary.zaloBlue,
  signed: '#9B59B6',
  rejected: colors.functional.alertRed,
};

const STATUS_PRIORITY: Record<ConnectionStatus, number> = {
  rejected: 1,
  pending: 2,
  accepted: 3,
  negotiating: 4,
  signed: 5,
};

const CROP_TYPE_LABELS: Record<string, string> = {
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function cropLabel(cropType: string): string {
  return CROP_TYPE_LABELS[cropType] ?? cropType;
}

function areaDisplay(areaM2: number): string {
  if (areaM2 >= 10000) return `${(areaM2 / 10000).toFixed(2)} ha`;
  return `${areaM2.toLocaleString('vi-VN')} m²`;
}

function trustScoreColor(score: number): string {
  if (score >= 90) return colors.primary.agriGreen;
  if (score >= 70) return colors.primary.zaloBlue;
  return colors.functional.warningYellow;
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase();
}

// ── Skeletons ──────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ width?: string; height?: string }> = ({
  width = '100%',
  height = '14px',
}) => (
  <div style={{ width, height, borderRadius: 4, backgroundColor: colors.background.secondary }} />
);

const FarmCardSkeleton: React.FC = () => (
  <div
    style={{
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: spacing.md,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
      <SkeletonBlock width="55%" height="18px" />
      <SkeletonBlock width="22%" height="18px" />
    </div>
    <div style={{ display: 'flex', gap: spacing.sm }}>
      <SkeletonBlock width="80px" height="12px" />
      <SkeletonBlock width="60px" height="12px" />
    </div>
  </div>
);

const TraderCardSkeleton: React.FC = () => (
  <div
    style={{
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: spacing.md,
    }}
  >
    <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.sm }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: colors.background.secondary, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        <SkeletonBlock width="60%" height="16px" />
        <SkeletonBlock width="45%" height="12px" />
        <SkeletonBlock width="35%" height="12px" />
      </div>
      <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: colors.background.secondary, flexShrink: 0 }} />
    </div>
    <SkeletonBlock width="100%" height="40px" />
  </div>
);

// ── Step 1: Farm Selector ──────────────────────────────────────────────────────

interface FarmSelectorProps {
  myFarms: FarmDto[];
  loading: boolean;
  onSelectFarm: (farm: FarmDto) => void;
}

const FarmSelector: React.FC<FarmSelectorProps> = ({ myFarms, loading, onSelectFarm }) => (
  <div style={{ padding: spacing.md, paddingBottom: 80 }}>
    <div
      style={{
        padding: spacing.md,
        backgroundColor: `${colors.primary.agriGreen}10`,
        borderRadius: 12,
        border: `1px solid ${colors.primary.agriGreen}30`,
        marginBottom: spacing.lg,
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.sm,
      }}
    >
      <Icon name="farm" size="md" color={colors.primary.agriGreen} />
      <div>
        <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen, margin: 0 }}>
          Chọn khu vườn cần kết nối với thương lái
        </Text>
        <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0, marginTop: 2 }}>
          Trạng thái kết nối sẽ được hiển thị riêng theo từng khu vườn
        </Text>
      </div>
    </div>

    {loading && (
      <>
        <FarmCardSkeleton />
        <FarmCardSkeleton />
        <FarmCardSkeleton />
      </>
    )}

    {!loading && myFarms.length === 0 && (
      <div style={{ textAlign: 'center', padding: `${spacing.xl} ${spacing.md}` }}>
        <Icon name="farm" size="lg" color={colors.text.secondary} />
        <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>
          Bạn chưa có khu vườn nào
        </Text>
        <Text size="xSmall" style={{ color: colors.text.secondary }}>
          Tạo vườn trong mục Vườn của tôi để bắt đầu kết nối với thương lái
        </Text>
      </div>
    )}

    {!loading && myFarms.map((farm) => (
      <button
        key={farm.id}
        type="button"
        onClick={() => onSelectFarm(farm)}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: spacing.md,
          backgroundColor: colors.background.primary,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: spacing.md,
          border: `1px solid ${colors.background.secondary}`,
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <Text.Title size="small" style={{ margin: 0, marginBottom: 4 }}>
              {farm.name}
            </Text.Title>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
              {farm.location.province}
              {farm.location.district ? ` · ${farm.location.district}` : ''}
            </Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginLeft: spacing.sm }}>
            <span
              style={{
                padding: `2px ${spacing.sm}`,
                backgroundColor: `${colors.primary.agriGreen}18`,
                borderRadius: 99,
                fontSize: fontSize.small,
                fontWeight: fontWeight.semibold,
                color: colors.primary.agriGreen,
              }}
            >
              {cropLabel(farm.cropType)}
            </span>
            {farm.standardId && (
              <span
                style={{
                  padding: `2px ${spacing.sm}`,
                  backgroundColor: `${colors.primary.zaloBlue}14`,
                  borderRadius: 99,
                  fontSize: fontSize.small,
                  color: colors.primary.zaloBlue,
                }}
              >
                Có tiêu chuẩn
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
          <Icon name="crop" size="sm" color={colors.text.secondary} />
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {areaDisplay(farm.area)}
          </Text>
        </div>

        <div
          style={{
            marginTop: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: spacing.xs,
            color: colors.primary.zaloBlue,
            fontSize: fontSize.small,
            fontWeight: fontWeight.medium,
          }}
        >
          Tìm thương lái
          <Icon name="chevron-right" size="sm" color={colors.primary.zaloBlue} />
        </div>
      </button>
    ))}
  </div>
);

// ── Step 2: Trader Browser ─────────────────────────────────────────────────────

interface TraderBrowserProps {
  selectedFarm: FarmDto;
  onBack: () => void;
}

const TraderBrowser: React.FC<TraderBrowserProps> = ({ selectedFarm, onBack }) => {
  const openSnackbar = useStableOpenSnackbar();
  const session = useAtomValue(authSessionAtom);

  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('all');
  const [connectionStatusFilter, setConnectionStatusFilter] = useState<TraderConnectionFilter>('all');

  const [traders, setTraders] = useState<TraderSearchResultDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Connection status scoped to selectedFarm.id
  const [connectionStatusMap, setConnectionStatusMap] = useState<Record<string, ConnectionInfo>>({});
  const [cancellingTraderId, setCancellingTraderId] = useState<string | null>(null);
  const [sendingTraderId, setSendingTraderId] = useState<string | null>(null);
  const [acceptingTraderId, setAcceptingTraderId] = useState<string | null>(null);

  const loadedKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  // Load ALL connection statuses (both directions) for this specific farm
  const loadConnectionMap = useCallback(async () => {
    const myUserId = session?.userId ?? '';
    if (!myUserId) return;
    try {
      const res = await listConnections({ limit: 100 });
      const map: Record<string, ConnectionInfo> = {};
      res.items
        .filter((conn) => conn.farmId === selectedFarm.id)
        .forEach((conn) => {
          // Identify the trader (the party that is not the current farmer)
          const traderId = conn.fromUserId === myUserId ? conn.toUserId : conn.fromUserId;
          const direction: 'outgoing' | 'incoming' =
            conn.fromUserId === myUserId ? 'outgoing' : 'incoming';
          const existing = map[traderId];
          if (!existing || STATUS_PRIORITY[conn.status] > STATUS_PRIORITY[existing.status]) {
            map[traderId] = { status: conn.status, connectionId: conn.id, direction };
          }
        });
      setConnectionStatusMap(map);
    } catch {
      // Non-blocking
    }
  }, [selectedFarm.id, session?.userId]);

  useEffect(() => { void loadConnectionMap(); }, [loadConnectionMap]);

  // Initial search
  const doSearch = useCallback(
    async (params: { keyword: string; region: string }) => {
      const key = [params.keyword.trim(), params.region].join('|');
      if (loadedKeyRef.current === key) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setLoading(true);
      try {
        const res = await searchTraders({
          keyword: params.keyword.trim() || undefined,
          region: params.region !== 'all' ? params.region : undefined,
          limit: 30,
        });
        setTraders(res.items);
        setTotal(res.total);
        loadedKeyRef.current = key;
      } catch (err) {
        openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'search'), duration: 3500, icon: true });
        setTraders([]);
        setTotal(0);
        loadedKeyRef.current = null;
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    },
    [openSnackbar],
  );

  useEffect(() => {
    void doSearch({ keyword: '', region: 'all' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    loadedKeyRef.current = null;
    void doSearch({ keyword, region });
  };

  const handleSendRequest = async (trader: TraderSearchResultDto) => {
    setSendingTraderId(trader.userId);
    try {
      const conn = await createConnection({ toUserId: trader.userId, farmId: selectedFarm.id });
      setConnectionStatusMap((prev) => ({
        ...prev,
        [trader.userId]: { status: 'pending', connectionId: conn.id, direction: 'outgoing' },
      }));
      openSnackbar({ type: 'success', text: 'Đã gửi yêu cầu kết nối!', duration: 2500, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'create'), duration: 3500, icon: true });
    } finally {
      setSendingTraderId(null);
    }
  };

  const handleCancelRequest = async (traderId: string) => {
    const info = connectionStatusMap[traderId];
    if (!info || info.status !== 'pending' || info.direction !== 'outgoing') return;
    setCancellingTraderId(traderId);
    try {
      await cancelConnection(info.connectionId);
      setConnectionStatusMap((prev) => {
        const next = { ...prev };
        delete next[traderId];
        return next;
      });
      openSnackbar({ type: 'success', text: 'Đã hủy yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'cancel'), duration: 3500, icon: true });
    } finally {
      setCancellingTraderId(null);
    }
  };

  const handleAcceptRequest = async (traderId: string) => {
    const info = connectionStatusMap[traderId];
    if (!info || info.status !== 'pending' || info.direction !== 'incoming') return;
    setAcceptingTraderId(traderId);
    try {
      await acceptConnection(info.connectionId);
      setConnectionStatusMap((prev) => ({
        ...prev,
        [traderId]: { ...prev[traderId], status: 'accepted' },
      }));
      openSnackbar({ type: 'success', text: 'Đã chấp nhận yêu cầu kết nối!', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setAcceptingTraderId(null);
    }
  };

  const handleRejectRequest = async (traderId: string) => {
    const info = connectionStatusMap[traderId];
    if (!info || info.status !== 'pending' || info.direction !== 'incoming') return;
    try {
      await rejectConnection(info.connectionId);
      setConnectionStatusMap((prev) => ({
        ...prev,
        [traderId]: { ...prev[traderId], status: 'rejected' },
      }));
      openSnackbar({ type: 'success', text: 'Đã từ chối yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    }
  };

  const effectiveStatus = (trader: TraderSearchResultDto): TraderConnectionFilter => {
    const mapEntry = connectionStatusMap[trader.userId];
    if (mapEntry) return mapEntry.status;
    // Fallback to search result status (limited to 4 values)
    if (trader.connectionStatus === 'pending_sent') return 'pending';
    if (trader.connectionStatus === 'pending_received') return 'pending';
    if (trader.connectionStatus === 'accepted') return 'accepted';
    return 'none';
  };

  const effectiveDirection = (trader: TraderSearchResultDto): 'outgoing' | 'incoming' | null => {
    const mapEntry = connectionStatusMap[trader.userId];
    if (mapEntry) return mapEntry.direction;
    if (trader.connectionStatus === 'pending_sent') return 'outgoing';
    if (trader.connectionStatus === 'pending_received') return 'incoming';
    return null;
  };

  const displayTraders = traders.filter((t) => {
    const s = effectiveStatus(t);
    if (connectionStatusFilter === 'all') return true;
    return s === connectionStatusFilter;
  });

  const connectBtnStyle: React.CSSProperties = {
    marginTop: spacing.md,
    width: '100%',
    padding: spacing.sm,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: 10,
    border: `1px solid ${colors.background.tertiary}`,
    fontSize: fontSize.body,
    backgroundColor: colors.background.primary,
    marginBottom: spacing.sm,
    boxSizing: 'border-box',
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Back bar + selected farm context */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          backgroundColor: colors.background.primary,
          borderBottom: `1px solid ${colors.background.secondary}`,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: spacing.xs,
            display: 'flex',
            alignItems: 'center',
            minWidth: 44,
            minHeight: 44,
          }}
          aria-label="Quay lại chọn vườn"
        >
          <Icon name="chevron-left" size="md" color={colors.text.primary} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            Vườn đang chọn
          </Text>
          <Text
            size="small"
            style={{ fontWeight: fontWeight.semibold, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {selectedFarm.name}
          </Text>
        </div>
        <span
          style={{
            padding: `2px ${spacing.sm}`,
            backgroundColor: `${colors.primary.agriGreen}18`,
            borderRadius: 99,
            fontSize: fontSize.small,
            fontWeight: fontWeight.semibold,
            color: colors.primary.agriGreen,
            flexShrink: 0,
          }}
        >
          {cropLabel(selectedFarm.cropType)}
        </span>
      </div>

      <div style={{ padding: spacing.md }}>
        {/* Search + filter panel */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.background.secondary,
            borderRadius: 10,
            marginBottom: spacing.md,
          }}
        >
          <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.sm }}>
            Tìm kiếm thương lái
          </Text>

          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Nhập tên thương lái hoặc công ty…"
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: 10,
              border: `1px solid ${colors.background.tertiary}`,
              fontSize: fontSize.body,
              boxSizing: 'border-box',
              marginBottom: spacing.sm,
            }}
          />

          <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: 4 }}>
            Trạng thái kết nối:
          </Text>
          <select
            style={{ ...selectStyle, marginBottom: spacing.md }}
            value={connectionStatusFilter}
            onChange={(e) => setConnectionStatusFilter(e.target.value as TraderConnectionFilter)}
          >
            {CONNECTION_STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            type="button"
            style={{
              width: '100%',
              padding: spacing.md,
              backgroundColor: colors.primary.agriGreen,
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: fontSize.body,
              fontWeight: fontWeight.semibold,
              cursor: 'pointer',
              minHeight: 44,
            }}
            onClick={handleSearch}
          >
            Tìm kiếm
          </button>
        </div>

        {/* Region chips */}
        <div
          style={{
            display: 'flex',
            gap: spacing.xs,
            overflowX: 'auto',
            paddingBottom: spacing.sm,
            marginBottom: spacing.sm,
          }}
        >
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

        {/* Loading */}
        {loading && (
          <>
            <Text.Title size="small" style={{ marginBottom: spacing.md }}>Đang tìm kiếm…</Text.Title>
            {[1, 2, 3].map((k) => <TraderCardSkeleton key={k} />)}
          </>
        )}

        {/* Empty — no server results */}
        {!loading && traders.length === 0 && (
          <div style={{ textAlign: 'center', padding: `${spacing.xl} ${spacing.md}` }}>
            <Icon name="users" size="lg" color={colors.text.secondary} />
            <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>
              Không tìm thấy thương lái phù hợp
            </Text>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Thử điều chỉnh từ khóa hoặc khu vực rồi nhấn Tìm kiếm
            </Text>
          </div>
        )}

        {/* Empty — filtered by status */}
        {!loading && traders.length > 0 && displayTraders.length === 0 && (
          <div style={{ textAlign: 'center', padding: `${spacing.xl} ${spacing.md}` }}>
            <Icon name="filter" size="lg" color={colors.text.secondary} />
            <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>
              Không có thương lái với trạng thái &quot;{STATUS_LABEL[connectionStatusFilter]}&quot;
            </Text>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>Hãy chọn trạng thái khác</Text>
          </div>
        )}

        {/* Trader list */}
        {!loading && displayTraders.length > 0 && (
          <>
            <Text.Title size="small" style={{ marginBottom: spacing.md }}>
              Kết quả ({connectionStatusFilter === 'all' ? total : `${displayTraders.length} / ${traders.length}`})
            </Text.Title>

            {displayTraders.map((trader) => {
              const score = trader.traderProfile.trustScore;
              const scoreColor = trustScoreColor(score);
              const status = effectiveStatus(trader);
              const isCancelling = cancellingTraderId === trader.userId;
              const isSending = sendingTraderId === trader.userId;

              return (
                <div
                  key={trader.userId}
                  style={{
                    padding: spacing.md,
                    backgroundColor: colors.background.primary,
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    marginBottom: spacing.md,
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.sm }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: '50%',
                        backgroundColor: colors.primary.zaloBlue,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: colors.text.inverse, fontWeight: fontWeight.bold, fontSize: fontSize.caption,
                        flexShrink: 0, overflow: 'hidden',
                      }}
                    >
                      {trader.avatarUrl
                        ? <img src={trader.avatarUrl} alt={trader.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span>{initials(trader.displayName)}</span>}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap', marginBottom: 2 }}>
                        <Text.Title size="small" style={{ margin: 0 }}>{trader.displayName}</Text.Title>
                        {status !== 'none' && (
                          <span
                            style={{
                              padding: `2px ${spacing.sm}`,
                              backgroundColor: `${STATUS_COLOR[status]}18`,
                              borderRadius: 99,
                              fontSize: fontSize.small,
                              fontWeight: fontWeight.semibold,
                              color: STATUS_COLOR[status],
                            }}
                          >
                            {STATUS_LABEL[status]}
                          </span>
                        )}
                      </div>
                      <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                        {trader.traderProfile.companyName}
                      </Text>
                      <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                        {trader.traderProfile.region} · {trader.traderProfile.capacity}
                      </Text>
                    </div>

                    {/* Trust score */}
                    <div
                      style={{
                        width: 52, height: 52, borderRadius: '50%',
                        border: `3px solid ${scoreColor}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: fontSize.caption, fontWeight: fontWeight.bold, color: scoreColor, lineHeight: 1 }}>
                        {score}
                      </span>
                      <span style={{ fontSize: '10px', color: colors.text.secondary, lineHeight: 1 }}>uy tín</span>
                    </div>
                  </div>

                  {/* Action button */}
                  {status === 'pending' && effectiveDirection(trader) === 'incoming' ? (
                    // Trader gửi đến farmer → farmer có thể chấp nhận hoặc từ chối
                    <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
                      <button
                        type="button"
                        disabled={acceptingTraderId === trader.userId}
                        onClick={() => void handleAcceptRequest(trader.userId)}
                        style={{ ...connectBtnStyle, flex: 1, marginTop: 0, backgroundColor: acceptingTraderId === trader.userId ? colors.background.secondary : colors.primary.agriGreen, color: acceptingTraderId === trader.userId ? colors.text.secondary : '#fff', cursor: acceptingTraderId === trader.userId ? 'not-allowed' : 'pointer' }}
                      >
                        <Icon name="check" size="sm" color={acceptingTraderId === trader.userId ? colors.text.secondary : '#fff'} />
                        {acceptingTraderId === trader.userId ? 'Đang xử lý...' : 'Chấp nhận'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRejectRequest(trader.userId)}
                        style={{ ...connectBtnStyle, flex: 1, marginTop: 0, backgroundColor: `${colors.functional.alertRed}10`, color: colors.functional.alertRed, cursor: 'pointer' }}
                      >
                        <Icon name="close" size="sm" color={colors.functional.alertRed} />
                        Từ chối
                      </button>
                    </div>
                  ) : status === 'pending' ? (
                    // Farmer gửi đến trader → có thể hủy
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => void handleCancelRequest(trader.userId)}
                      style={{ ...connectBtnStyle, backgroundColor: `${colors.functional.alertRed}10`, color: isCancelling ? colors.text.secondary : colors.functional.alertRed, cursor: isCancelling ? 'not-allowed' : 'pointer' }}
                    >
                      <Icon name="close" size="sm" color={isCancelling ? colors.text.secondary : colors.functional.alertRed} />
                      {isCancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}
                    </button>
                  ) : status === 'accepted' ? (
                    <div style={{ ...connectBtnStyle, backgroundColor: `${colors.primary.agriGreen}18`, color: colors.primary.agriGreen, cursor: 'default' }}>
                      <Icon name="check" size="sm" color={colors.primary.agriGreen} />
                      Đã kết nối
                    </div>
                  ) : status === 'negotiating' ? (
                    <div style={{ ...connectBtnStyle, backgroundColor: `${colors.primary.zaloBlue}12`, color: colors.primary.zaloBlue, cursor: 'default' }}>
                      <Icon name="list" size="sm" color={colors.primary.zaloBlue} />
                      Đang đàm phán
                    </div>
                  ) : status === 'signed' ? (
                    <div style={{ ...connectBtnStyle, backgroundColor: '#9B59B612', color: '#9B59B6', cursor: 'default' }}>
                      <Icon name="star" size="sm" color="#9B59B6" />
                      Đã ký kết
                    </div>
                  ) : status === 'rejected' ? (
                    <div style={{ ...connectBtnStyle, backgroundColor: `${colors.functional.alertRed}10`, color: colors.functional.alertRed, cursor: 'default' }}>
                      <Icon name="close" size="sm" color={colors.functional.alertRed} />
                      Đã từ chối
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSending}
                      onClick={() => void handleSendRequest(trader)}
                      style={{ ...connectBtnStyle, backgroundColor: isSending ? colors.background.secondary : colors.primary.agriGreen, color: isSending ? colors.text.secondary : '#ffffff', cursor: isSending ? 'not-allowed' : 'pointer' }}
                    >
                      <Icon name="users" size="sm" color={isSending ? colors.text.secondary : '#ffffff'} />
                      {isSending ? 'Đang gửi…' : 'Gửi yêu cầu kết nối'}
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export const TraderSearchTab: React.FC = () => {
  const session = useAtomValue(authSessionAtom);
  const openSnackbar = useStableOpenSnackbar();

  const [myFarms, setMyFarms] = useState<FarmDto[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<FarmDto | null>(null);

  useEffect(() => {
    if (!session?.userId) return;
    setFarmsLoading(true);
    listFarms({ ownerId: session.userId, limit: 20 })
      .then((res) => { setMyFarms(res.items); setFarmsLoading(false); })
      .catch(() => {
        openSnackbar({ type: 'error', text: 'Không thể tải danh sách vườn.', duration: 3000, icon: true });
        setFarmsLoading(false);
      });
  }, [session?.userId, openSnackbar]);

  if (selectedFarm) {
    return (
      <TraderBrowser
        selectedFarm={selectedFarm}
        onBack={() => setSelectedFarm(null)}
      />
    );
  }

  return (
    <FarmSelector
      myFarms={myFarms}
      loading={farmsLoading}
      onSelectFarm={setSelectedFarm}
    />
  );
};

export default TraderSearchTab;
