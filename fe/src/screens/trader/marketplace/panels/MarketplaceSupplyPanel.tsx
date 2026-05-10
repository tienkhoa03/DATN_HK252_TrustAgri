/**
 * MarketplaceSupplyPanel — "Nguồn cung" tab inside TraderMarketplaceScreen.
 * Migrated from TraderSupplyMonitorScreen tab: search-supply.
 * Adds new "certification" filter.
 *
 * Requirements: FR-T07, FR-T08, US-T04
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
import { ApiError } from '@/api/errors';
import { createConnection, listConnections, toConnectionViMessage, searchFarmers } from '@/services/connectionService';
import type { FarmerSearchResultDto } from '@/services/connectionService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function cropLabel(cropType: string): string {
  return CROP_TYPE_LABELS[cropType] ?? cropType;
}

function areaDisplay(areaM2: number): string {
  if (areaM2 >= 10000) return `${(areaM2 / 10000).toFixed(2)} ha`;
  return `${areaM2.toLocaleString('vi-VN')} m²`;
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

  const [searchKeyword, setSearchKeyword] = useState('');
  const [filter, setFilter] = useState({ cropType: 'all', region: 'all', certification: 'all' });
  const [farms, setFarms] = useState<FarmDto[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<FarmDto | null>(null);
  const [farmerNames, setFarmerNames] = useState<Record<string, string>>({});

  const [suggestions, setSuggestions] = useState<FarmDto[]>([]);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [connectionStatusMap, setConnectionStatusMap] = useState<Record<string, 'pending' | 'accepted'>>({});

  const inFlightRef = useRef(false);
  const loadedKeyRef = useRef<string | null>(null);
  const warnedRef = useRef(false);
  const suggestTimerRef = useRef<number | null>(null);

  const loadFarms = useCallback(async () => {
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
    const key = [session.userId, filter.cropType, filter.region, filter.certification, searchKeyword.trim()].join('|');
    if (loadedKeyRef.current === key) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setIsLoading(true);
    setSelectedFarm(null);
    try {
      // certifications is not in ListFarmsParams; spread via unknown cast so Axios forwards it as query param without modifying farmService.ts
      const extraParams = filter.certification !== 'all' ? { certifications: filter.certification } : {};
      const res = await listFarms(
        {
          keyword: searchKeyword.trim() || undefined,
          cropType: filter.cropType !== 'all' ? filter.cropType : undefined,
          region: filter.region !== 'all' ? filter.region : undefined,
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
  }, [filter.cropType, filter.region, filter.certification, searchKeyword, session?.accessToken, session?.userId, openSnackbar]);

  const loadSuggestions = useCallback(async (kw: string) => {
    if (!session?.accessToken || !kw.trim()) { setSuggestions([]); return; }
    setIsSuggestLoading(true);
    try {
      const res = await listFarms({ keyword: kw.trim(), cropType: filter.cropType !== 'all' ? filter.cropType : undefined, region: filter.region !== 'all' ? filter.region : undefined, page: 1, limit: 5 }, { accessToken: session.accessToken });
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
      const map: Record<string, 'pending' | 'accepted'> = {};
      res.items.forEach((conn) => {
        if (conn.status === 'rejected') return;
        // Xác định userId của nông dân trong kết nối (bất kể chiều nào)
        const farmerId = conn.fromRole === 'farmer' ? conn.fromUserId : conn.toUserId;
        // accepted ưu tiên cao hơn pending
        if (!map[farmerId] || conn.status === 'accepted') {
          map[farmerId] = conn.status;
        }
      });
      setConnectionStatusMap(map);
    } catch { /* ignore — không block UI */ }
  }, [session?.accessToken]);

  // Initial load
  useEffect(() => { void loadFarms(); }, [loadFarms]);
  useEffect(() => { loadedKeyRef.current = null; }, [session?.userId]);
  useEffect(() => { void loadFarmerNames(); }, [loadFarmerNames]);
  useEffect(() => { void loadExistingConnections(); }, [loadExistingConnections]);

  // Suggestions debounce
  useEffect(() => {
    if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current);
    suggestTimerRef.current = window.setTimeout(() => { void loadSuggestions(searchKeyword); }, 320);
    return () => { if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current); };
  }, [loadSuggestions, searchKeyword]);

  const handleSendConnectionRequest = async (farmOwnerId: string, farmId: string) => {
    try {
      await createConnection({ toUserId: farmOwnerId, farmId });
      setConnectionStatusMap((prev) => ({ ...prev, [farmOwnerId]: 'pending' }));
      openSnackbar({ type: 'success', text: 'Đã gửi yêu cầu kết nối tới nông dân.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'create'), duration: 3000, icon: true });
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
                    onClick={() => { setSearchKeyword(f.name); setSuggestions([]); loadedKeyRef.current = null; void loadFarms(); }}>
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
        <select style={{ ...selectStyle, marginBottom: spacing.md }} value={filter.certification} onChange={(e) => setFilter((prev) => ({ ...prev, certification: e.target.value }))}>
          {CERTIFICATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <button
          type="button"
          style={{ width: '100%', padding: spacing.md, backgroundColor: colors.primary.agriGreen, color: '#ffffff', border: 'none', borderRadius: 8, fontSize: fontSize.body, fontWeight: fontWeight.semibold, cursor: 'pointer', minHeight: 44 }}
          onClick={() => { loadedKeyRef.current = null; void loadFarms(); }}
        >
          Tìm kiếm
        </button>
      </div>

      {/* Map placeholder */}
      <div style={{ padding: spacing.lg, backgroundColor: colors.background.secondary, borderRadius: 10, textAlign: 'center', marginBottom: spacing.md }}>
        <Icon name="map" size="lg" color={colors.text.secondary} />
        <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>Bản đồ số hiển thị vị trí Farm Lab</Text>
        <Text size="xSmall" style={{ color: colors.text.secondary }}>(Tích hợp Google Maps — Phase 8)</Text>
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
          <Text size="xSmall" style={{ color: colors.text.secondary }}>Hãy thử điều chỉnh bộ lọc</Text>
        </div>
      )}

      {/* Results */}
      {!isLoading && farms.length > 0 && (
        <>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>Kết quả ({total})</Text.Title>

          {farms.map((farm) => (
            <div key={farm.id} style={farmCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setSelectedFarm(selectedFarm?.id === farm.id ? null : farm)}>
                <div style={{ flex: 1 }}>
                  <Text.Title size="small" style={{ margin: 0 }}>{farm.name}</Text.Title>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    {farm.location.province} • {farm.location.district}
                  </Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing.xs }}>
                  <span style={{ padding: `2px ${spacing.sm}`, backgroundColor: `${colors.primary.agriGreen}18`, borderRadius: 99, fontSize: fontSize.caption, fontWeight: fontWeight.semibold, color: colors.primary.agriGreen }}>
                    {cropLabel(farm.cropType)}
                  </span>
                  {farm.standardId && (
                    <span style={{ padding: `2px ${spacing.sm}`, backgroundColor: `${colors.primary.zaloBlue}14`, borderRadius: 99, fontSize: fontSize.small, color: colors.primary.zaloBlue }}>
                      Có tiêu chuẩn
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
                        <Text size="small" style={{ margin: 0 }}>{farmerNames[farm.ownerId] ?? `…${farm.ownerId.slice(-6)}`}</Text>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
                      <Icon name="map-pin" size="sm" color={colors.primary.zaloBlue} />
                      <div>
                        <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Địa chỉ</Text>
                        <Text size="small" style={{ margin: 0 }}>{farm.location.addressLine}, {farm.location.district}, {farm.location.province}</Text>
                      </div>
                    </div>
                    {farm.location.lat && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                        <Icon name="map" size="sm" color={colors.text.secondary} />
                        <Text size="xSmall" style={{ color: colors.text.secondary }}>Tọa độ: {farm.location.lat.toFixed(4)}, {farm.location.lng?.toFixed(4)}</Text>
                      </div>
                    )}
                    {farm.standardId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                        <Icon name="check" size="sm" color={colors.primary.agriGreen} />
                        <Text size="xSmall" style={{ color: colors.primary.agriGreen }}>Tiêu chuẩn: {farm.standardId}</Text>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Connect button / status badge */}
              {connectionStatusMap[farm.ownerId] === 'accepted' ? (
                <div style={{ ...connectBtnStyle, backgroundColor: `${colors.primary.agriGreen}18`, color: colors.primary.agriGreen, cursor: 'default' }}>
                  <Icon name="check" size="sm" color={colors.primary.agriGreen} />
                  Đã kết nối
                </div>
              ) : connectionStatusMap[farm.ownerId] === 'pending' ? (
                <div style={{ ...connectBtnStyle, backgroundColor: `${colors.primary.zaloBlue}10`, color: colors.primary.zaloBlue, cursor: 'default' }}>
                  <Icon name="clock" size="sm" color={colors.primary.zaloBlue} />
                  Đã gửi yêu cầu
                </div>
              ) : (
                <button style={connectBtnStyle} type="button" onClick={() => void handleSendConnectionRequest(farm.ownerId, farm.id)}>
                  <Icon name="users" size="sm" color={colors.primary.zaloBlue} />
                  Gửi yêu cầu kết nối
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default MarketplaceSupplyPanel;
