/**
 * MarketplaceSupplyPanel — "Nguồn cung" tab inside TraderMarketplaceScreen.
 * Requirements: FR-T07, FR-T08, US-T04
 *
 * Changes:
 * - Search only triggers on button click (not on each dropdown change)
 * - Removed Google Maps placeholder
 * - Pending connections show "Hủy yêu cầu" button; accepted connections stay unchanged
 * - Trạng thái kết nối theo farmId (ConnectionDto.farmId), không gộp theo ownerId
 * - Lọc trạng thái kết nối (pending/accepted/negotiating/signed/rejected/chưa kết nối) phía client
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, Spinner } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import { Icon } from '@/design-system/components/Icon';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { listFarms } from '@/services/farmService';
import type { FarmDto } from '@/services/farmService';
import { listStandards, type StandardDto } from '@/services/standardService';
import { ApiError } from '@/api/errors';
import {
  createConnection,
  cancelConnection,
  acceptConnection,
  rejectConnection,
  listConnections,
  toConnectionViMessage,
  searchFarmers,
} from '@/services/connectionService';
import type { ConnectionDto, FarmerSearchResultDto } from '@/services/connectionService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { farmOwnerDisplay } from '@/utils/displayLabels';

type ConnectionStatus = ConnectionDto['status'];
// UI-only derived states layered on top of the connection lifecycle:
//   negotiating = trader & farmer đang đàm phán hợp đồng
//   signed      = hợp đồng đã ký kết
// Không tồn tại trong ConnectionDto backend; suy ra từ API contracts hoặc cập nhật cục bộ.
type DerivedConnectionStatus = 'negotiating' | 'signed';
type AnyConnectionStatus = ConnectionStatus | DerivedConnectionStatus;
type FarmConnectionFilter = 'all' | 'none' | AnyConnectionStatus;

// ── Constants ─────────────────────────────────────────────────────────────────

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

const CROP_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả loại' },
  ...Object.entries(CROP_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const REGION_OPTIONS = [
  { value: 'all', label: 'Tất cả tỉnh' },
  { value: 'Tiền Giang', label: 'Tiền Giang' },
  { value: 'Bến Tre', label: 'Bến Tre' },
  { value: 'Đồng Tháp', label: 'Đồng Tháp' },
  { value: 'Long An', label: 'Long An' },
  { value: 'Hà Giang', label: 'Hà Giang' },
  { value: 'Hưng Yên', label: 'Hưng Yên' },
];

const CERTIFICATION_OPTIONS = [
  { value: 'all', label: 'Tất cả tiêu chuẩn' },
  { value: 'vietgap', label: 'VietGAP' },
  { value: 'globalgap', label: 'GlobalGAP' },
  { value: 'organic', label: 'Hữu cơ' },
];

const CONNECTION_STATUS_FILTER_OPTIONS: { value: FarmConnectionFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'none', label: 'Chưa kết nối' },
  { value: 'pending', label: 'Chờ phản hồi' },
  { value: 'accepted', label: 'Đã kết nối' },
  { value: 'negotiating', label: 'Đang đàm phán' },
  { value: 'signed', label: 'Đã ký kết' },
  { value: 'rejected', label: 'Đã từ chối' },
];

const STATUS_PRIORITY: Record<AnyConnectionStatus, number> = {
  rejected: 1,
  cancelled: 1,
  pending: 2,
  accepted: 3,
  negotiating: 4,
  signed: 5,
};

const STATUS_LABEL: Record<FarmConnectionFilter, string> = {
  all: '',
  none: 'Chưa kết nối',
  pending: 'Chờ phản hồi',
  accepted: 'Đã kết nối',
  negotiating: 'Đang đàm phán',
  signed: 'Đã ký kết',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
};

const STATUS_COLOR: Record<FarmConnectionFilter, string> = {
  all: colors.text.secondary,
  none: colors.text.secondary,
  pending: colors.functional.warningYellow,
  accepted: colors.primary.agriGreen,
  negotiating: colors.primary.zaloBlue,
  signed: '#9B59B6',
  rejected: colors.functional.alertRed,
  cancelled: colors.text.secondary,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConnectionInfo {
  status: AnyConnectionStatus;
  connectionId: string;
  /** 'outgoing' = trader gửi đến farmer; 'incoming' = farmer gửi đến trader */
  direction: 'outgoing' | 'incoming';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cropLabel(cropType: string): string {
  return CROP_TYPE_LABELS[cropType] ?? cropType;
}

function areaDisplay(areaM2: number): string {
  if (areaM2 >= 10000) return `${(areaM2 / 10000).toFixed(2)} ha`;
  return `${areaM2.toLocaleString('vi-VN')} m²`;
}

function farmConnectionStatus(
  farmId: string,
  map: Record<string, ConnectionInfo>,
): FarmConnectionFilter {
  return map[farmId]?.status ?? 'none';
}

function matchesConnectionStatusFilter(
  farmId: string,
  filter: FarmConnectionFilter,
  map: Record<string, ConnectionInfo>,
): boolean {
  if (filter === 'all') return true;
  return farmConnectionStatus(farmId, map) === filter;
}

function searchErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED': return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'NETWORK_ERROR': return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE': return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'RATE_LIMIT_EXCEEDED': return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      default: return 'Không thể tải danh sách vườn. Vui lòng thử lại.';
    }
  }
  return 'Không thể tải danh sách vườn. Vui lòng thử lại.';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ width?: string; height?: string }> = ({ width = '100%', height = '14px' }) => (
  <div style={{ width, height, borderRadius: 4, backgroundColor: colors.background.secondary }} />
);

const FarmCardSkeleton: React.FC = () => (
  <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: spacing.md }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
      <SkeletonBlock width="55%" height="18px" />
      <SkeletonBlock width="25%" height="18px" />
    </div>
    <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.sm }}>
      <SkeletonBlock width="90px" height="12px" />
      <SkeletonBlock width="70px" height="12px" />
    </div>
    <SkeletonBlock width="100%" height="34px" />
  </div>
);

// ── Main Panel ────────────────────────────────────────────────────────────────

export const MarketplaceSupplyPanel: React.FC = () => {
  const openSnackbar = useStableOpenSnackbar();
  const session = useAtomValue(authSessionAtom);

  // UI-only filter state (dropdowns / keyword input — does NOT trigger search)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filter, setFilter] = useState({
    cropType: 'all',
    region: 'all',
    certification: 'all',
    connectionStatus: 'all' as FarmConnectionFilter,
  });

  // Results state
  const [farms, setFarms] = useState<FarmDto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<FarmDto | null>(null);
  const [farmerNames, setFarmerNames] = useState<Record<string, string>>({});

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<FarmDto[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);

  // Connection status: keyed by farmId (ConnectionDto.farmId) → { status, connectionId }
  const [connectionStatusMap, setConnectionStatusMap] = useState<Record<string, ConnectionInfo>>({});
  const [cancellingFarmId, setCancellingFarmId] = useState<string | null>(null);
  const [acceptingFarmId, setAcceptingFarmId] = useState<string | null>(null);

  // Standard lookup: id → StandardDto (cho hiển thị tên thay vì UUID)
  const [standardsById, setStandardsById] = useState<Record<string, StandardDto>>({});

  const inFlightRef = useRef(false);
  const loadedKeyRef = useRef<string | null>(null);
  const warnedRef = useRef(false);
  const suggestTimerRef = useRef<number | null>(null);

  // ── Core search function (imperative, called explicitly) ──────────────────

  const doSearch = useCallback(async (params: { cropType: string; region: string; certification: string; keyword: string }) => {
    if (!session?.accessToken) {
      setFarms([]);
      setTotal(0);
      if (!warnedRef.current) {
        openSnackbar({ type: 'error', text: 'Phiên đăng nhập chưa sẵn sàng. Vui lòng đăng nhập lại.', duration: 3500, icon: true });
        warnedRef.current = true;
      }
      return;
    }
    warnedRef.current = false;
    const key = [session.userId, params.cropType, params.region, params.certification, params.keyword.trim()].join('|');
    if (loadedKeyRef.current === key) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setIsLoading(true);
    setSelectedFarm(null);
    try {
      const extraParams = params.certification !== 'all' ? { certifications: params.certification } : {};
      const res = await listFarms(
        {
          keyword: params.keyword.trim() || undefined,
          cropType: params.cropType !== 'all' ? params.cropType : undefined,
          region: params.region !== 'all' ? params.region : undefined,
          page: 1,
          limit: 20,
          ...(extraParams as object),
        } as Parameters<typeof listFarms>[0],
        { accessToken: session.accessToken },
      );
      setFarms(res.items);
      setTotal(res.total);
      loadedKeyRef.current = key;
    } catch (err) {
      openSnackbar({ type: 'error', text: searchErrorMessage(err), duration: 4500, icon: true });
      setFarms([]);
      setTotal(0);
      loadedKeyRef.current = null;
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [session?.accessToken, session?.userId, openSnackbar]);

  const loadSuggestions = useCallback(async (kw: string) => {
    if (!session?.accessToken || !kw.trim()) { setSuggestions([]); return; }
    setIsSuggestLoading(true);
    try {
      const res = await listFarms(
        { keyword: kw.trim(), cropType: filter.cropType !== 'all' ? filter.cropType : undefined, region: filter.region !== 'all' ? filter.region : undefined, page: 1, limit: 5 },
        { accessToken: session.accessToken },
      );
      setSuggestions(res.items);
    } catch { setSuggestions([]); }
    finally { setIsSuggestLoading(false); }
  }, [filter.cropType, filter.region, session?.accessToken]);

  const loadFarmerNames = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await searchFarmers({ page: 1, limit: 200 });
      const map: Record<string, string> = {};
      res.items.forEach((f: FarmerSearchResultDto) => { map[f.userId] = f.displayName; });
      setFarmerNames(map);
    } catch { /* ignore */ }
  }, [session?.accessToken]);

  const loadExistingConnections = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const res = await listConnections({ limit: 100 });
      const myUserId = session?.userId ?? '';
      const map: Record<string, ConnectionInfo> = {};
      res.items.forEach((conn) => {
        if (!conn.farmId) return;
        const farmId = conn.farmId;
        const direction: 'outgoing' | 'incoming' =
          conn.fromUserId === myUserId ? 'outgoing' : 'incoming';
        const existing = map[farmId];
        if (!existing || STATUS_PRIORITY[conn.status] > STATUS_PRIORITY[existing.status]) {
          map[farmId] = { status: conn.status, connectionId: conn.id, direction };
        }
      });
      setConnectionStatusMap(map);
    } catch { /* ignore — không block UI */ }
  }, [session?.accessToken]);

  // Auto-load on mount / session change
  useEffect(() => {
    if (session?.userId) {
      loadedKeyRef.current = null;
      void doSearch({ cropType: 'all', region: 'all', certification: 'all', keyword: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId]);

  useEffect(() => { void loadFarmerNames(); }, [loadFarmerNames]);
  useEffect(() => { void loadExistingConnections(); }, [loadExistingConnections]);
  useEffect(() => {
    let cancelled = false;
    void listStandards({ page: 1, limit: 200 })
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, StandardDto> = {};
        res.items.forEach((s) => { map[s.id] = s; });
        setStandardsById(map);
      })
      .catch(() => { /* không block UI */ });
    return () => { cancelled = true; };
  }, []);

  // Suggestions debounce
  useEffect(() => {
    if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
    suggestTimerRef.current = window.setTimeout(() => { void loadSuggestions(searchKeyword); }, 320);
    return () => { if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current); };
  }, [loadSuggestions, searchKeyword]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSearch = () => {
    loadedKeyRef.current = null;
    void doSearch({ cropType: filter.cropType, region: filter.region, certification: filter.certification, keyword: searchKeyword.trim() });
  };

  const handleSendConnectionRequest = async (farmOwnerId: string, farmId: string) => {
    try {
      const conn = await createConnection({ toUserId: farmOwnerId, farmId });
      setConnectionStatusMap((prev) => ({
        ...prev,
        [farmId]: { status: 'pending', connectionId: conn.id, direction: 'outgoing' },
      }));
      openSnackbar({ type: 'success', text: 'Đã gửi yêu cầu kết nối tới nông dân.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'create'), duration: 3000, icon: true });
    }
  };

  const handleAcceptConnectionRequest = async (farmId: string) => {
    const info = connectionStatusMap[farmId];
    if (!info || info.status !== 'pending' || info.direction !== 'incoming') return;
    setAcceptingFarmId(farmId);
    try {
      await acceptConnection(info.connectionId);
      setConnectionStatusMap((prev) => ({
        ...prev,
        [farmId]: { ...prev[farmId], status: 'accepted' },
      }));
      openSnackbar({ type: 'success', text: 'Đã chấp nhận kết nối với nông dân.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setAcceptingFarmId(null);
    }
  };

  const handleRejectConnectionRequest = async (farmId: string) => {
    const info = connectionStatusMap[farmId];
    if (!info || info.status !== 'pending' || info.direction !== 'incoming') return;
    try {
      await rejectConnection(info.connectionId);
      setConnectionStatusMap((prev) => ({
        ...prev,
        [farmId]: { ...prev[farmId], status: 'rejected' },
      }));
      openSnackbar({ type: 'success', text: 'Đã từ chối yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    }
  };

  const handleCancelConnectionRequest = async (farmId: string) => {
    const info = connectionStatusMap[farmId];
    if (!info || info.status !== 'pending') return;
    setCancellingFarmId(farmId);
    try {
      await cancelConnection(info.connectionId);
      setConnectionStatusMap((prev) => {
        const next = { ...prev };
        delete next[farmId];
        return next;
      });
      openSnackbar({ type: 'success', text: 'Đã hủy yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'cancel'), duration: 3000, icon: true });
    } finally {
      setCancellingFarmId(null);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: 10,
    border: `1px solid ${colors.background.tertiary}`,
    fontSize: fontSize.body,
    backgroundColor: colors.background.primary,
    marginBottom: spacing.sm,
  };

  const farmCardStyle: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: spacing.md,
  };

  const displayFarms = farms.filter((farm) =>
    matchesConnectionStatusFilter(farm.id, filter.connectionStatus, connectionStatusMap),
  );

  const connectBtnStyle: React.CSSProperties = {
    marginTop: spacing.md,
    width: '100%',
    padding: spacing.sm,
    borderRadius: 8,
    border: 'none',
    backgroundColor: colors.background.secondary,
    color: colors.primary.zaloBlue,
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: spacing.md, paddingBottom: 80 }}>
      {/* Filters */}
      <div style={{ padding: spacing.md, backgroundColor: colors.background.secondary, borderRadius: 10, marginBottom: spacing.md }}>
        <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.sm }}>Tìm kiếm vườn</Text>

        {/* Search input with suggestions */}
        <div style={{ position: 'relative', marginBottom: spacing.sm }}>
          <input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSuggestions([]); handleSearch(); } }}
            placeholder="Nhập tên vườn…"
            style={{ width: '100%', padding: `${spacing.sm} ${spacing.md}`, borderRadius: 10, border: `1px solid ${colors.background.tertiary}`, fontSize: fontSize.body, boxSizing: 'border-box' }}
          />
          {(isSuggestLoading || suggestions.length > 0) && searchKeyword.trim() && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: colors.background.primary, border: `1px solid ${colors.background.tertiary}`, borderRadius: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.12)', zIndex: 10, overflow: 'hidden' }}>
              {isSuggestLoading ? (
                <div style={{ padding: spacing.md, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Spinner />
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>Đang gợi ý…</Text>
                </div>
              ) : (
                suggestions.map((f) => (
                  <button key={f.id} type="button" style={{ width: '100%', textAlign: 'left', padding: `${spacing.sm} ${spacing.md}`, background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      const kw = f.name;
                      setSearchKeyword(kw);
                      setSuggestions([]);
                      loadedKeyRef.current = null;
                      void doSearch({ cropType: filter.cropType, region: filter.region, certification: filter.certification, keyword: kw });
                    }}>
                    <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>{f.name}</Text>
                    <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>{f.location?.province ? `${f.location.province} • ${cropLabel(f.cropType)}` : cropLabel(f.cropType)}</Text>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: 4 }}>Loại nông sản:</Text>
        <select style={selectStyle} value={filter.cropType} onChange={(e) => setFilter((prev) => ({ ...prev, cropType: e.target.value }))}>
          {CROP_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: 4 }}>Tỉnh / Thành phố:</Text>
        <select style={selectStyle} value={filter.region} onChange={(e) => setFilter((prev) => ({ ...prev, region: e.target.value }))}>
          {REGION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: 4 }}>Tiêu chuẩn:</Text>
        <select style={selectStyle} value={filter.certification} onChange={(e) => setFilter((prev) => ({ ...prev, certification: e.target.value }))}>
          {CERTIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: 4 }}>Trạng thái kết nối:</Text>
        <select
          style={{ ...selectStyle, marginBottom: spacing.md }}
          value={filter.connectionStatus}
          onChange={(e) => setFilter((prev) => ({ ...prev, connectionStatus: e.target.value as FarmConnectionFilter }))}
        >
          {CONNECTION_STATUS_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button
          type="button"
          style={{ width: '100%', padding: spacing.md, backgroundColor: colors.primary.agriGreen, color: '#ffffff', border: 'none', borderRadius: 8, fontSize: fontSize.body, fontWeight: fontWeight.semibold, cursor: 'pointer', minHeight: 44 }}
          onClick={handleSearch}
        >
          Tìm kiếm
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>Đang tìm kiếm…</Text.Title>
          {[1, 2, 3].map((k) => <FarmCardSkeleton key={k} />)}
        </>
      )}

      {/* Empty state */}
      {!isLoading && farms.length === 0 && (
        <div style={{ textAlign: 'center', padding: `${spacing.xl} ${spacing.md}` }}>
          <Icon name="farm" size="lg" color={colors.text.secondary} />
          <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>Không tìm thấy vườn phù hợp</Text>
          <Text size="xSmall" style={{ color: colors.text.secondary }}>Hãy thử điều chỉnh bộ lọc hoặc nhấn Tìm kiếm</Text>
        </div>
      )}

      {/* Empty state — filtered out by connection status */}
      {!isLoading && farms.length > 0 && displayFarms.length === 0 && (
        <div style={{ textAlign: 'center', padding: `${spacing.xl} ${spacing.md}` }}>
          <Icon name="users" size="lg" color={colors.text.secondary} />
          <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>
            Không có vườn với trạng thái &quot;{STATUS_LABEL[filter.connectionStatus]}&quot;
          </Text>
          <Text size="xSmall" style={{ color: colors.text.secondary }}>Hãy chọn trạng thái khác hoặc nhấn Tìm kiếm lại</Text>
        </div>
      )}

      {/* Results */}
      {!isLoading && displayFarms.length > 0 && (
        <>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>
            Kết quả (
            {filter.connectionStatus === 'all' ? total : `${displayFarms.length} / ${farms.length}`}
            )
          </Text.Title>

          {displayFarms.map((farm) => {
            const connInfo = connectionStatusMap[farm.id];
            const farmStatus = farmConnectionStatus(farm.id, connectionStatusMap);
            const isCancelling = cancellingFarmId === farm.id;

            return (
              <div key={farm.id} style={farmCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setSelectedFarm(selectedFarm?.id === farm.id ? null : farm)}>
                  <div style={{ flex: 1 }}>
                    <Text.Title size="small" style={{ margin: 0 }}>{farm.name}</Text.Title>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      {farm.location.province} • {farm.location.district}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing.xs }}>
                    {farmStatus !== 'none' && (
                      <span style={{ padding: `2px ${spacing.sm}`, backgroundColor: `${STATUS_COLOR[farmStatus]}18`, borderRadius: 99, fontSize: fontSize.small, fontWeight: fontWeight.semibold, color: STATUS_COLOR[farmStatus] }}>
                        {STATUS_LABEL[farmStatus]}
                      </span>
                    )}
                    <span style={{ padding: `2px ${spacing.sm}`, backgroundColor: `${colors.primary.agriGreen}18`, borderRadius: 99, fontSize: fontSize.caption, fontWeight: fontWeight.semibold, color: colors.primary.agriGreen }}>
                      {cropLabel(farm.cropType)}
                    </span>
                    {farm.standardId && (
                      <span style={{ padding: `2px ${spacing.sm}`, backgroundColor: `${colors.primary.zaloBlue}14`, borderRadius: 99, fontSize: fontSize.small, color: colors.primary.zaloBlue }}>
                        {standardsById[farm.standardId]?.name ?? 'Có tiêu chuẩn'}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: spacing.sm, display: 'flex', gap: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <Icon name="crop" size="sm" color={colors.text.secondary} />
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>{areaDisplay(farm.area)}</Text>
                  </div>
                </div>

                {/* Expanded detail */}
                {selectedFarm?.id === farm.id && (
                  <div style={{ marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.background.secondary, borderRadius: 10, border: `1px solid ${colors.background.tertiary}` }}>
                    <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>Chi tiết vườn</Text.Title>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
                        <Icon name="users" size="sm" color={colors.text.secondary} />
                        <div>
                          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Nông dân</Text>
                          <Text size="small" style={{ margin: 0 }}>{farmOwnerDisplay(farm, farmerNames[farm.ownerId])}</Text>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
                        <Icon name="map-pin" size="sm" color={colors.primary.zaloBlue} />
                        <div>
                          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Địa chỉ</Text>
                          <Text size="small" style={{ margin: 0 }}>{farm.location.addressLine}, {farm.location.district}, {farm.location.province}</Text>
                        </div>
                      </div>
                      {farm.standardId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                          <Icon name="check" size="sm" color={colors.primary.agriGreen} />
                          <Text size="xSmall" style={{ color: colors.primary.agriGreen }}>
                            Tiêu chuẩn: {standardsById[farm.standardId]?.name ?? 'Đã gán tiêu chuẩn'}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Connection button / status */}
                {connInfo?.status === 'pending' && connInfo.direction === 'incoming' ? (
                  // Farmer gửi đến trader → trader có thể chấp nhận hoặc từ chối
                  <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
                    <button
                      type="button"
                      disabled={acceptingFarmId === farm.id}
                      onClick={() => void handleAcceptConnectionRequest(farm.id)}
                      style={{ ...connectBtnStyle, flex: 1, marginTop: 0, backgroundColor: acceptingFarmId === farm.id ? colors.background.secondary : colors.primary.agriGreen, color: acceptingFarmId === farm.id ? colors.text.secondary : '#fff', cursor: acceptingFarmId === farm.id ? 'not-allowed' : 'pointer' }}
                    >
                      <Icon name="check" size="sm" color={acceptingFarmId === farm.id ? colors.text.secondary : '#fff'} />
                      {acceptingFarmId === farm.id ? 'Đang xử lý...' : 'Chấp nhận'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRejectConnectionRequest(farm.id)}
                      style={{ ...connectBtnStyle, flex: 1, marginTop: 0, backgroundColor: `${colors.functional.alertRed}10`, color: colors.functional.alertRed, cursor: 'pointer' }}
                    >
                      <Icon name="close" size="sm" color={colors.functional.alertRed} />
                      Từ chối
                    </button>
                  </div>
                ) : connInfo?.status === 'pending' ? (
                  // Trader gửi đến farmer → có thể hủy
                  <button
                    style={{ ...connectBtnStyle, backgroundColor: `${colors.functional.alertRed}10`, color: colors.functional.alertRed, cursor: isCancelling ? 'not-allowed' : 'pointer' }}
                    type="button"
                    disabled={isCancelling}
                    onClick={() => void handleCancelConnectionRequest(farm.id)}
                  >
                    <Icon name="close" size="sm" color={isCancelling ? colors.text.secondary : colors.functional.alertRed} />
                    {isCancelling ? 'Đang hủy...' : 'Hủy yêu cầu'}
                  </button>
                ) : connInfo?.status === 'accepted' ? (
                  <div style={{ ...connectBtnStyle, backgroundColor: `${colors.primary.agriGreen}18`, color: colors.primary.agriGreen, cursor: 'default' }}>
                    <Icon name="check" size="sm" color={colors.primary.agriGreen} />
                    Đã kết nối
                  </div>
                ) : connInfo?.status === 'negotiating' ? (
                  <div style={{ ...connectBtnStyle, backgroundColor: `${colors.primary.zaloBlue}12`, color: colors.primary.zaloBlue, cursor: 'default' }}>
                    <Icon name="list" size="sm" color={colors.primary.zaloBlue} />
                    Đang đàm phán
                  </div>
                ) : connInfo?.status === 'signed' ? (
                  <div style={{ ...connectBtnStyle, backgroundColor: '#9B59B612', color: '#9B59B6', cursor: 'default' }}>
                    <Icon name="star" size="sm" color="#9B59B6" />
                    Đã ký kết
                  </div>
                ) : connInfo?.status === 'rejected' ? (
                  <div style={{ ...connectBtnStyle, backgroundColor: `${colors.functional.alertRed}10`, color: colors.functional.alertRed, cursor: 'default' }}>
                    <Icon name="close" size="sm" color={colors.functional.alertRed} />
                    Đã từ chối
                  </div>
                ) : (
                  <button style={connectBtnStyle} type="button" onClick={() => void handleSendConnectionRequest(farm.ownerId, farm.id)}>
                    <Icon name="users" size="sm" color={colors.primary.zaloBlue} />
                    Gửi yêu cầu kết nối
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export default MarketplaceSupplyPanel;
