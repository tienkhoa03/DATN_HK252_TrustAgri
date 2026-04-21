/**
 * Trader Supply & Monitor Screen — Phase 6.2 + 14.2 (FR-T07, FR-T08, FR-T11, US-T04)
 *
 * Giám sát nguồn cung nông dân:
 * - Tab "Nông dân của tôi": chọn nông dân → mở panel giám sát cảm biến realtime
 *   GET /api/v1/monitoring/farms/:farmId/latest + history + WS subscribe_farm
 * - Tab "Tìm kiếm": GET /api/v1/farms* qua farmService (Axios thật)
 *
 * Lỗi: Snackbar ZMP-UI tiếng Việt.
 * DTO: camelCase khớp design.md §4.3 + §4.5.
 * ZMP SDK: Token gắn tự động bởi interceptor.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Text, Spinner, useSnackbar } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { authSessionAtom } from '@/state/authAtoms';
import { Icon } from '../../../design-system/components/Icon';
import { SensorDisplay } from '../../../design-system/components/SensorDisplay';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { listFarms } from '@/services/farmService';
import type { FarmDto } from '@/services/farmService';
import { ApiError } from '@/api/errors';
import type { SensorType } from '@/services/monitoringService';
import { SensorLineChart } from '../../../design-system/components/SensorLineChart';
import { useMonitoring } from '@/hooks/useMonitoring';
import {
  listConnections,
  acceptConnection,
  rejectConnection,
  createConnection,
  toConnectionViMessage,
} from '@/services/connectionService';
import type { ConnectionDto } from '@/services/connectionService';
import {
  listContracts,
  getContractCompliance,
  toContractViMessage,
  contractStatusLabelVi,
  type ContractDto,
  type ComplianceDto,
} from '@/services/contractService';

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  { value: 'all', label: 'Tất cả' },
  ...Object.entries(CROP_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const REGION_OPTIONS = [
  'all',
  'Tiền Giang',
  'Bến Tre',
  'Đồng Tháp',
  'Long An',
  'Hà Giang',
  'Hưng Yên',
];

function cropLabel(cropType: string): string {
  return CROP_TYPE_LABELS[cropType] ?? cropType;
}

function formatViDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function complianceContractOptionLabel(c: ContractDto): string {
  const farm = c.farmId ? `Vườn …${c.farmId.slice(-6)}` : 'Chưa gắn vườn';
  return `${contractStatusLabelVi(c.status)} · ${farm} · #${c.id.slice(0, 8)}`;
}

function areaDisplay(areaM2: number): string {
  if (areaM2 >= 10000) return `${(areaM2 / 10000).toFixed(2)} ha`;
  return `${areaM2.toLocaleString('vi-VN')} m²`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TabType = 'my-farmers' | 'search-supply' | 'pending-requests' | 'compliance';

interface MyFarmer {
  id: string;
  name: string;
  farmName: string;
  cropType: string;
  seasonStatus: string;
  complianceScore: number;
  location: string;
  area: string;
}

interface PendingRequest {
  id: string;
  farmerName: string;
  farmName: string;
  cropType: string;
  area: string;
  location: string;
  experience: string;
  requestDate: string;
}

interface MonitoringData {
  temperature: number;
  humidity: number;
  light: number;
  standardTemp: { min: number; max: number };
  standardHumidity: { min: number; max: number };
  standardLight: { min: number; max: number };
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonBlock: React.FC<{ width?: string; height?: string; borderRadius?: string }> = ({
  width = '100%',
  height = '14px',
  borderRadius = '4px',
}) => (
  <div
    className="skeleton-pulse"
    style={{ width, height, borderRadius, backgroundColor: colors.background.secondary }}
  />
);

const FarmSearchCardSkeleton: React.FC = () => (
  <div
    style={{
      padding: spacing.md,
      backgroundColor: colors.background.primary,
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: spacing.md,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
      <SkeletonBlock width="55%" height="18px" />
      <SkeletonBlock width="25%" height="18px" borderRadius="99px" />
    </div>
    <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.sm }}>
      <SkeletonBlock width="90px" height="12px" />
      <SkeletonBlock width="70px" height="12px" />
    </div>
    <SkeletonBlock width="100%" height="34px" borderRadius="8px" />
  </div>
);

// ── Props ─────────────────────────────────────────────────────────────────────

export interface TraderSupplyMonitorScreenProps {
  traderName?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

// ── FarmerMonitoringPanel — sub-component gọi useMonitoring ──────────────────
// Tách ra để hook useMonitoring có thể được gọi tại component level,
// không vi phạm quy tắc hooks React khi farmId thay đổi điều kiện.

interface FarmerMonitoringPanelProps {
  farmId: string;
  farmName: string;
  onClose: () => void;
  monitoringSectionStyles: React.CSSProperties;
  deviationBoxStyles: React.CSSProperties;
}

const PANEL_SENSOR_OPTIONS = [
  { value: 'temperature' as SensorType, label: 'Nhiệt độ', color: '#F50000' },
  { value: 'humidity' as SensorType, label: 'Độ ẩm KK', color: '#0068FF' },
  { value: 'light' as SensorType, label: 'Ánh sáng', color: '#FFCC00' },
  { value: 'soil_moisture' as SensorType, label: 'Ẩm đất', color: '#3EBB6C' },
] as const;

const FarmerMonitoringPanel: React.FC<FarmerMonitoringPanelProps> = ({
  farmId,
  farmName,
  onClose,
  monitoringSectionStyles,
  deviationBoxStyles,
}) => {
  const { openSnackbar } = useSnackbar();
  const [monitoringHistorySensor, setMonitoringHistorySensor] = useState<SensorType>('temperature');

  const {
    latestReadings,
    isLatestLoading,
    historyData,
    isHistoryLoading,
    alerts,
    error,
    loadHistory,
    clearError,
  } = useMonitoring(farmId);

  // Hiển thị Snackbar khi có lỗi
  useEffect(() => {
    if (error) {
      openSnackbar({ type: 'error', text: error, duration: 4500, icon: true });
      clearError();
    }
  }, [error, openSnackbar, clearError]);

  // Load history khi chọn cảm biến
  useEffect(() => {
    loadHistory(monitoringHistorySensor);
  }, [monitoringHistorySensor, loadHistory]);

  const hasDeviations = alerts.some((a) => a.severity === 'danger');

  return (
    <div style={monitoringSectionStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text.Title size="small" style={{ margin: 0 }}>Giám sát: {farmName}</Text.Title>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: spacing.xs }} onClick={onClose} aria-label="Đóng">
          <Icon name="close" size="md" color={colors.text.secondary} />
        </button>
      </div>
      <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
        Dữ liệu IoT thời gian thực — đối chiếu quy trình chuẩn
      </Text>

      {/* Latest sensor snapshot */}
      {isLatestLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm }}>
          {[1, 2, 3, 4].map((k) => (
            <div key={k} style={{ height: 72, borderRadius: 8, backgroundColor: colors.background.secondary }} className="skeleton-pulse" />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, marginBottom: spacing.md }}>
          {latestReadings.map((r) => (
            <div key={r.sensorType}>
              <SensorDisplay
                type={r.sensorType === 'soil_moisture' ? 'humidity' : (r.sensorType as 'temperature' | 'humidity' | 'light')}
                value={r.value}
                unit={r.unit}
                status="normal"
                timestamp={new Date(r.recordedAt)}
              />
              {r.isImputed && (
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#FFCC00', margin: '2px 0 0' }}>~ Ước tính</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History chart */}
      <div>
        <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}>Lịch sử 24 giờ</Text>
        <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.sm, overflowX: 'auto' }}>
          {PANEL_SENSOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMonitoringHistorySensor(opt.value)}
              style={{
                padding: `2px ${spacing.sm}`, borderRadius: 99,
                border: `1px solid ${monitoringHistorySensor === opt.value ? opt.color : colors.background.secondary}`,
                backgroundColor: monitoringHistorySensor === opt.value ? `${opt.color}18` : colors.background.primary,
                color: monitoringHistorySensor === opt.value ? opt.color : colors.text.secondary,
                fontSize: fontSize.small,
                fontWeight: monitoringHistorySensor === opt.value ? fontWeight.semibold : fontWeight.regular,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {isHistoryLoading ? (
          <div style={{ height: 140, borderRadius: 8, backgroundColor: colors.background.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="skeleton-pulse" />
        ) : (
          <SensorLineChart
            data={historyData}
            unit={historyData[0]?.unit}
            lineColor={PANEL_SENSOR_OPTIONS.find((o) => o.value === monitoringHistorySensor)?.color ?? colors.primary.agriGreen}
            width={296}
            height={140}
          />
        )}
      </div>

      {/* Deviation notice */}
      {hasDeviations && (
        <div style={deviationBoxStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Icon name="alert-triangle" size="md" color={colors.functional.alertRed} />
            <Text.Title size="small" style={{ margin: 0, color: colors.functional.alertRed }}>Phát hiện sai lệch</Text.Title>
          </div>
          {alerts.filter((a) => a.severity === 'danger').map((a) => (
            <Text key={a.id} size="small" style={{ color: colors.text.primary }}>
              • {a.suggestedAction ?? `Giá trị ${a.value} vượt ngưỡng ${a.threshold}`}
            </Text>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Error → Vietnamese (search context) ──────────────────────────────────────

function searchErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'UNAUTHORIZED':
        return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      case 'NETWORK_ERROR':
        return 'Không có phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.';
      case 'SERVICE_UNAVAILABLE':
        return 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      default:
        return 'Không thể tải danh sách vườn. Vui lòng thử lại.';
    }
  }
  return 'Không thể tải danh sách vườn. Vui lòng thử lại.';
}

export const TraderSupplyMonitorScreen: React.FC<TraderSupplyMonitorScreenProps> = ({
  traderName = 'Thương lái',
}) => {
  const session = useAtomValue(authSessionAtom);
  const [activeTab, setActiveTab] = useState<TabType>('my-farmers');
  const [selectedFarmer, setSelectedFarmer] = useState<MyFarmer | null>(null);

  // ── Snackbar ──────────────────────────────────────────────────────────────
  const { openSnackbar } = useSnackbar();

  // ── Search tab state ──────────────────────────────────────────────────────
  const [searchFilter, setSearchFilter] = useState({ cropType: 'all', region: 'all' });
  const [searchFarms, setSearchFarms] = useState<FarmDto[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<FarmDto | null>(null);
  const inFlightSearchRef = useRef(false);
  const loadedSearchKeyRef = useRef<string | null>(null);
  const warnedNoSessionRef = useRef(false);

  // ── Load farms for search tab (GET /api/v1/farms) ─────────────────────────

  const loadSearchFarms = useCallback(async () => {
    if (!session?.accessToken) {
      setSearchFarms([]);
      setSearchTotal(0);
      if (!warnedNoSessionRef.current) {
        openSnackbar({
          type: 'error',
          text: 'Phiên đăng nhập chưa sẵn sàng. Vui lòng đăng nhập lại.',
          duration: 3500,
          icon: true,
        });
        warnedNoSessionRef.current = true;
      }
      return;
    }

    warnedNoSessionRef.current = false;
    const searchKey = [session.userId, searchFilter.cropType, searchFilter.region].join('|');
    if (loadedSearchKeyRef.current === searchKey) return;
    if (inFlightSearchRef.current) return;

    inFlightSearchRef.current = true;
    setIsSearchLoading(true);
    setSelectedFarm(null);
    try {
      const res = await listFarms({
        cropType: searchFilter.cropType,
        region: searchFilter.region,
        page: 1,
        limit: 20,
      }, {
        accessToken: session.accessToken,
      });
      setSearchFarms(res.items);
      setSearchTotal(res.total);
      loadedSearchKeyRef.current = searchKey;
    } catch (err) {
      openSnackbar({ type: 'error', text: searchErrorMessage(err), duration: 4500, icon: true });
      setSearchFarms([]);
      setSearchTotal(0);
      loadedSearchKeyRef.current = null;
    } finally {
      setIsSearchLoading(false);
      inFlightSearchRef.current = false;
    }
  }, [searchFilter.cropType, searchFilter.region, session?.accessToken, session?.userId, openSnackbar]);

  // Trigger on tab activation or filter change
  useEffect(() => {
    if (activeTab === 'search-supply') {
      loadSearchFarms();
    }
  }, [activeTab, loadSearchFarms]);

  useEffect(() => {
    loadedSearchKeyRef.current = null;
  }, [session?.userId]);

  // ── Static mock data (My Farmers, Pending Requests, Monitoring) ───────────

  const myFarmers: MyFarmer[] = [
    {
      id: '1',
      name: 'Tiến Khoa',
      farmName: 'Farm Lab Đông A',
      cropType: 'dragon_fruit',
      seasonStatus: 'Đang ra hoa',
      complianceScore: 95,
      location: 'Tiền Giang',
      area: '2.5 ha',
    },
    {
      id: '2',
      name: 'Văn Minh',
      farmName: 'Vườn Bưởi Da Xanh',
      cropType: 'pomelo',
      seasonStatus: 'Đang phát triển',
      complianceScore: 88,
      location: 'Bến Tre',
      area: '1.5 ha',
    },
    {
      id: '3',
      name: 'Thanh Tùng',
      farmName: 'Vườn Xoài Cát Chu',
      cropType: 'mango',
      seasonStatus: 'Sắp thu hoạch',
      complianceScore: 72,
      location: 'Đồng Tháp',
      area: '3 ha',
    },
    {
      id: '4',
      name: 'Minh Tuấn',
      farmName: 'Thanh Long Ruột Đỏ Long An',
      cropType: 'dragon_fruit',
      seasonStatus: 'Đang ra hoa',
      complianceScore: 91,
      location: 'Long An',
      area: '2 ha',
    },
  ];

  // ── Pending connection requests (connectionService — Axios thật) ──────────
  const [pendingConnections, setPendingConnections] = useState<ConnectionDto[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(false);
  const pendingLoadedRef = useRef(false);
  const [connActionPending, setConnActionPending] = useState<Record<string, boolean>>({});

  // ── Tab Tuân thủ — GET /contracts + GET /contracts/:id/compliance (Phase 14.2) ─
  const [complianceContracts, setComplianceContracts] = useState<ContractDto[]>([]);
  const [complianceContractId, setComplianceContractId] = useState('');
  const [complianceListLoading, setComplianceListLoading] = useState(false);
  const [compliance, setCompliance] = useState<ComplianceDto | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  const loadComplianceContractList = useCallback(async () => {
    if (!session?.accessToken) {
      setComplianceContracts([]);
      setComplianceContractId('');
      setCompliance(null);
      openSnackbar({
        type: 'error',
        text: 'Phiên đăng nhập chưa sẵn sàng. Vui lòng đăng nhập lại.',
        duration: 3500,
        icon: true,
      });
      return;
    }
    setComplianceListLoading(true);
    try {
      const res = await listContracts({ role: 'trader', page: 1, limit: 100 });
      setComplianceContracts(res.items);
      setComplianceContractId((prev) => {
        if (prev && res.items.some((c) => c.id === prev)) return prev;
        return res.items[0]?.id ?? '';
      });
      if (res.items.length === 0) setCompliance(null);
    } catch (err) {
      openSnackbar({ type: 'error', text: toContractViMessage(err, 'list'), duration: 4500, icon: true });
      setComplianceContracts([]);
      setComplianceContractId('');
      setCompliance(null);
    } finally {
      setComplianceListLoading(false);
    }
  }, [session?.accessToken, openSnackbar]);

  const loadCompliance = useCallback(
    async (clearPrevious = false) => {
      if (!complianceContractId) return;
      if (clearPrevious) setCompliance(null);
      setComplianceLoading(true);
      try {
        const data = await getContractCompliance(complianceContractId);
        setCompliance(data);
      } catch (err) {
        openSnackbar({ type: 'error', text: toContractViMessage(err, 'compliance'), duration: 5000, icon: true });
        setCompliance(null);
      } finally {
        setComplianceLoading(false);
      }
    },
    [complianceContractId, openSnackbar],
  );

  const loadComplianceRef = useRef(loadCompliance);
  loadComplianceRef.current = loadCompliance;

  useEffect(() => {
    if (activeTab === 'compliance') {
      void loadComplianceContractList();
    }
  }, [activeTab, loadComplianceContractList]);

  useEffect(() => {
    if (activeTab !== 'compliance' || !complianceContractId) return;
    void loadComplianceRef.current(true);
  }, [activeTab, complianceContractId]);

  const loadPendingConnections = useCallback(async () => {
    if (pendingLoadedRef.current) return;
    setIsPendingLoading(true);
    try {
      // GET /api/v1/connections?role=incoming&status=pending — token từ interceptor
      const res = await listConnections({ role: 'incoming', status: 'pending' });
      setPendingConnections(res.items);
      pendingLoadedRef.current = true;
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'list'), duration: 3500, icon: true });
    } finally {
      setIsPendingLoading(false);
    }
  }, [openSnackbar]);

  useEffect(() => {
    if (activeTab === 'pending-requests') {
      loadPendingConnections();
    }
  }, [activeTab, loadPendingConnections]);

  const handleConnAccept = async (conn: ConnectionDto) => {
    setConnActionPending((p) => ({ ...p, [conn.id]: true }));
    try {
      // POST /api/v1/connections/:id/accept
      await acceptConnection(conn.id);
      setPendingConnections((prev) => prev.filter((c) => c.id !== conn.id));
      openSnackbar({ type: 'success', text: 'Đã chấp nhận yêu cầu kết nối thành công.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setConnActionPending((p) => { const n = { ...p }; delete n[conn.id]; return n; });
    }
  };

  const handleConnReject = async (conn: ConnectionDto) => {
    setConnActionPending((p) => ({ ...p, [conn.id]: true }));
    try {
      // POST /api/v1/connections/:id/reject
      await rejectConnection(conn.id);
      setPendingConnections((prev) => prev.filter((c) => c.id !== conn.id));
      openSnackbar({ type: 'success', text: 'Đã từ chối yêu cầu kết nối.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'respond'), duration: 3000, icon: true });
    } finally {
      setConnActionPending((p) => { const n = { ...p }; delete n[conn.id]; return n; });
    }
  };

  const handleSendConnectionRequest = async (farmOwnerId: string, farmId: string) => {
    try {
      // POST /api/v1/connections — fromRole/fromUserId suy ra từ Bearer token phía server
      await createConnection({ toUserId: farmOwnerId, farmId });
      openSnackbar({ type: 'success', text: 'Đã gửi yêu cầu kết nối tới nông dân.', duration: 3000, icon: true });
    } catch (err) {
      openSnackbar({ type: 'error', text: toConnectionViMessage(err, 'create'), duration: 3000, icon: true });
    }
  };

  // pendingRequests static đã thay bằng pendingConnections từ API
  const pendingRequests: PendingRequest[] = [];

  const monitoringData: MonitoringData = {
    temperature: 32,
    humidity: 65,
    light: 850,
    standardTemp: { min: 25, max: 30 },
    standardHumidity: { min: 70, max: 85 },
    standardLight: { min: 800, max: 1200 },
  };

  const isOutOfRange = (value: number, min: number, max: number) => value < min || value > max;

  const getComplianceColor = (score: number) => {
    if (score >= 90) return colors.primary.agriGreen;
    if (score >= 75) return colors.functional.warningYellow;
    return colors.functional.alertRed;
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const tabBarStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
    overflowX: 'auto',
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.primary.zaloBlue}` : '2px solid transparent',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  };

  const farmerCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: spacing.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const complianceBarContainer = (score: number): React.CSSProperties => ({
    width: '100%',
    height: '6px',
    backgroundColor: colors.background.secondary,
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: spacing.xs,
  });

  const complianceBarFill = (score: number): React.CSSProperties => ({
    width: `${score}%`,
    height: '100%',
    backgroundColor: getComplianceColor(score),
    transition: 'width 0.3s',
  });

  const filterSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: '10px',
    marginBottom: spacing.md,
  };

  const filterChipStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: isActive ? colors.primary.zaloBlue : colors.background.primary,
    color: isActive ? '#fff' : colors.text.primary,
    border: `1px solid ${isActive ? colors.primary.zaloBlue : colors.background.tertiary}`,
    borderRadius: '99px',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  const requestCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: spacing.md,
  };

  const actionBtnStyles = (isPrimary: boolean): React.CSSProperties => ({
    flex: 1,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: isPrimary ? colors.primary.agriGreen : colors.background.secondary,
    color: isPrimary ? '#fff' : colors.text.primary,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    transition: 'all 0.2s',
  });

  const monitoringSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginTop: spacing.md,
  };

  const deviationBoxStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: `${colors.functional.alertRed}12`,
    border: `2px solid ${colors.functional.alertRed}`,
    borderRadius: '8px',
    marginTop: spacing.md,
  };

  // ── Tab: My Farmers ────────────────────────────────────────────────────────

  const renderMyFarmersTab = () => (
    <div>
      <Text.Title size="small" style={{ marginBottom: spacing.md }}>
        Danh sách nông dân ({myFarmers.length})
      </Text.Title>

      {myFarmers.map((farmer) => (
        <div
          key={farmer.id}
          style={farmerCardStyles}
          onClick={() => setSelectedFarmer(farmer)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.13)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Text.Title size="small" style={{ margin: 0 }}>{farmer.name}</Text.Title>
              <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>{farmer.farmName}</Text>
            </div>
            <span
              style={{
                padding: `2px ${spacing.sm}`,
                backgroundColor: `${colors.primary.agriGreen}18`,
                borderRadius: '99px',
                fontSize: fontSize.caption,
                fontWeight: fontWeight.semibold,
                color: colors.primary.agriGreen,
              }}
            >
              {cropLabel(farmer.cropType)}
            </span>
          </div>

          <div style={{ marginTop: spacing.sm, display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Icon name="map-pin" size="sm" color={colors.text.secondary} />
              <Text size="xSmall" style={{ color: colors.text.secondary }}>{farmer.location}</Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Icon name="crop" size="sm" color={colors.text.secondary} />
              <Text size="xSmall" style={{ color: colors.text.secondary }}>{farmer.area}</Text>
            </div>
          </div>

          <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
            Trạng thái:{' '}
            <span style={{ color: colors.text.primary, fontWeight: fontWeight.medium }}>
              {farmer.seasonStatus}
            </span>
          </Text>

          <div style={{ marginTop: spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text size="xSmall" style={{ color: colors.text.secondary }}>Chỉ số tuân thủ</Text>
              <Text
                size="xSmall"
                style={{ color: getComplianceColor(farmer.complianceScore), fontWeight: fontWeight.bold }}
              >
                {farmer.complianceScore}%
              </Text>
            </div>
            <div style={complianceBarContainer(farmer.complianceScore)}>
              <div style={complianceBarFill(farmer.complianceScore)} />
            </div>
          </div>
        </div>
      ))}

      {/* Monitoring panel — Phase 6.2 Integration: gọi API thật qua useMonitoring */}
      {selectedFarmer && (
        <FarmerMonitoringPanel
          farmId={`farm-00${selectedFarmer.id}`}
          farmName={selectedFarmer.farmName}
          onClose={() => setSelectedFarmer(null)}
          monitoringSectionStyles={monitoringSectionStyles}
          deviationBoxStyles={deviationBoxStyles}
        />
      )}
    </div>
  );

  // ── Tab: Search Supply (dùng mockFarmService) ──────────────────────────────

  const renderSearchSupplyTab = () => (
    <div>
      {/* Filters */}
      <div style={filterSectionStyles}>
        <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.sm }}>
          Bộ lọc
        </Text>

        <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.xs }}>
          Loại nông sản:
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: spacing.md }}>
          {CROP_FILTER_OPTIONS.slice(0, 7).map((opt) => (
            <button
              key={opt.value}
              style={filterChipStyles(searchFilter.cropType === opt.value)}
              onClick={() => setSearchFilter((prev) => ({ ...prev, cropType: opt.value }))}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.xs }}>
          Tỉnh / Thành phố:
        </Text>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {REGION_OPTIONS.map((region) => (
            <button
              key={region}
              style={filterChipStyles(searchFilter.region === region)}
              onClick={() => setSearchFilter((prev) => ({ ...prev, region }))}
            >
              {region === 'all' ? 'Tất cả' : region}
            </button>
          ))}
        </div>
      </div>

      {/* Map placeholder */}
      <div
        style={{
          padding: spacing.lg,
          backgroundColor: colors.background.secondary,
          borderRadius: '10px',
          textAlign: 'center',
          marginBottom: spacing.md,
        }}
      >
        <Icon name="map" size="lg" color={colors.text.secondary} />
        <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
          Bản đồ số hiển thị vị trí Farm Lab
        </Text>
        <Text size="xSmall" style={{ color: colors.text.secondary }}>
          (Tích hợp Google Maps — Phase 8)
        </Text>
      </div>

      {/* Skeleton */}
      {isSearchLoading && (
        <>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>
            Đang tìm kiếm…
          </Text.Title>
          {[1, 2, 3].map((k) => (
            <FarmSearchCardSkeleton key={k} />
          ))}
        </>
      )}

      {/* Empty state */}
      {!isSearchLoading && searchFarms.length === 0 && (
        <div style={{ textAlign: 'center', padding: `${spacing.xl} ${spacing.md}` }}>
          <Icon name="farm" size="lg" color={colors.text.secondary} />
          <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>
            Không tìm thấy vườn phù hợp
          </Text>
          <Text size="xSmall" style={{ color: colors.text.secondary }}>
            Hãy thử điều chỉnh bộ lọc
          </Text>
        </div>
      )}

      {/* Results */}
      {!isSearchLoading && searchFarms.length > 0 && (
        <>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>
            Kết quả ({searchTotal})
          </Text.Title>

          {searchFarms.map((farm) => (
            <div key={farm.id} style={{ ...farmerCardStyles, cursor: 'default' }}>
              {/* Farm header */}
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                onClick={() => setSelectedFarm(selectedFarm?.id === farm.id ? null : farm)}
              >
                <div style={{ flex: 1 }}>
                  <Text.Title size="small" style={{ margin: 0 }}>{farm.name}</Text.Title>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    {farm.location.province} • {farm.location.district}
                  </Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing.xs }}>
                  <span
                    style={{
                      padding: `2px ${spacing.sm}`,
                      backgroundColor: `${colors.primary.agriGreen}18`,
                      borderRadius: '99px',
                      fontSize: fontSize.caption,
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
                        borderRadius: '99px',
                        fontSize: fontSize.small,
                        color: colors.primary.zaloBlue,
                      }}
                    >
                      Có tiêu chuẩn
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: spacing.sm, display: 'flex', gap: spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  <Icon name="crop" size="sm" color={colors.text.secondary} />
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>
                    {areaDisplay(farm.area)}
                  </Text>
                </div>
              </div>

              {/* Expanded farm detail panel */}
              {selectedFarm?.id === farm.id && (
                <div
                  style={{
                    marginTop: spacing.md,
                    padding: spacing.md,
                    backgroundColor: colors.background.secondary,
                    borderRadius: '10px',
                    border: `1px solid ${colors.background.tertiary}`,
                  }}
                >
                  <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm, fontWeight: fontWeight.semibold }}>
                    Chi tiết vườn
                  </Text.Title>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
                      <Icon name="map-pin" size="sm" color={colors.primary.zaloBlue} />
                      <div>
                        <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Địa chỉ</Text>
                        <Text size="small" style={{ margin: 0 }}>
                          {farm.location.addressLine}, {farm.location.district}, {farm.location.province}
                        </Text>
                      </div>
                    </div>

                    {farm.location.lat && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                        <Icon name="map" size="sm" color={colors.text.secondary} />
                        <Text size="xSmall" style={{ color: colors.text.secondary }}>
                          Tọa độ: {farm.location.lat.toFixed(4)}, {farm.location.lng?.toFixed(4)}
                        </Text>
                      </div>
                    )}

                    {farm.standardId && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                        <Icon name="check" size="sm" color={colors.primary.agriGreen} />
                        <Text size="xSmall" style={{ color: colors.primary.agriGreen }}>
                          Tiêu chuẩn: {farm.standardId}
                        </Text>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Connect button */}
              <button
                style={{
                  ...actionBtnStyles(false),
                  marginTop: spacing.md,
                  width: '100%',
                  padding: spacing.sm,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.xs,
                }}
                onClick={() => handleSendConnectionRequest(farm.ownerId, farm.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.tertiary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                }}
              >
                <Icon name="users" size="sm" color={colors.primary.zaloBlue} />
                Gửi yêu cầu kết nối
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );

  // ── Tab: Pending Requests (mockConnectionService) ─────────────────────────

  const renderPendingRequestsTab = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <Text.Title size="small" style={{ margin: 0 }}>
          Yêu cầu kết nối đến {!isPendingLoading && `(${pendingConnections.length})`}
        </Text.Title>
      </div>

      {isPendingLoading ? (
        <>
          {[1, 2].map((k) => (
            <div key={k} style={{ ...requestCardStyles, display: 'flex', gap: spacing.md }}>
              <div className="skeleton-pulse" style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: colors.background.secondary, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                <div className="skeleton-pulse" style={{ width: '55%', height: 16, borderRadius: 4, backgroundColor: colors.background.secondary }} />
                <div className="skeleton-pulse" style={{ width: '80%', height: 12, borderRadius: 4, backgroundColor: colors.background.secondary }} />
                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <div className="skeleton-pulse" style={{ flex: 1, height: 34, borderRadius: 8, backgroundColor: colors.background.secondary }} />
                  <div className="skeleton-pulse" style={{ flex: 1, height: 34, borderRadius: 8, backgroundColor: colors.background.secondary }} />
                </div>
              </div>
            </div>
          ))}
        </>
      ) : pendingConnections.length === 0 ? (
        <div style={{ padding: spacing.xl, textAlign: 'center' }}>
          <Icon name="users" size="lg" color={colors.text.secondary} />
          <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>
            Không có yêu cầu kết nối mới
          </Text>
          <Text size="xSmall" style={{ color: colors.text.secondary }}>
            Khi nông dân gửi yêu cầu kết nối, chúng sẽ hiển thị ở đây
          </Text>
        </div>
      ) : (
        pendingConnections.map((conn) => {
          const isPending = !!connActionPending[conn.id];
          return (
            <div key={conn.id} style={{ ...requestCardStyles, borderLeft: `3px solid ${colors.functional.warningYellow}` }}>
              <div style={{ display: 'flex', gap: spacing.md }}>
                {/* Avatar */}
                <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: '50%', backgroundColor: colors.primary.agriGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.h2 }}>
                  N
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                    <Text.Title size="small" style={{ margin: 0 }}>
                      {`Nông dân (...${conn.fromUserId.slice(-4)})`}
                    </Text.Title>
                    <Text size="xSmall" style={{ color: colors.text.secondary }}>
                      {(() => {
                        const diff = Date.now() - new Date(conn.createdAt).getTime();
                        const days = Math.floor(diff / 86400000);
                        return days === 0 ? 'Hôm nay' : `${days} ngày trước`;
                      })()}
                    </Text>
                  </div>

                  {conn.message && (
                    <div style={{ padding: spacing.sm, backgroundColor: colors.background.secondary, borderRadius: 8, marginBottom: spacing.sm }}>
                      <Text size="small" style={{ color: colors.text.secondary, fontStyle: 'italic', margin: 0 }}>
                        "{conn.message}"
                      </Text>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <button
                      style={{ ...actionBtnStyles(true), opacity: isPending ? 0.6 : 1 }}
                      onClick={() => !isPending && handleConnAccept(conn)}
                      disabled={isPending}
                    >
                      ✓ Chấp nhận
                    </button>
                    <button
                      style={{ ...actionBtnStyles(false), opacity: isPending ? 0.6 : 1 }}
                      onClick={() => !isPending && handleConnReject(conn)}
                      disabled={isPending}
                    >
                      ✕ Từ chối
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ── Tab: Tuân thủ (contractService — GET /contracts/:id/compliance) ────────

  const renderComplianceTab = () => {
    const pctSteps =
      compliance && compliance.totalSteps > 0
        ? Math.round((100 * compliance.completedSteps) / compliance.totalSteps)
        : 0;
    const scorePct = compliance ? Math.round(compliance.complianceScore * 1000) / 10 : 0;

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.xs }}>
              Đối chiếu tuân thủ quy trình
            </Text.Title>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
              Theo hợp đồng của thương lái — FR-T11 (API thật)
            </Text>
          </div>
          <button
            type="button"
            style={{
              ...actionBtnStyles(true),
              flex: '0 0 auto',
              opacity: complianceLoading || complianceListLoading || !complianceContractId ? 0.65 : 1,
            }}
            disabled={complianceLoading || complianceListLoading || !complianceContractId}
            onClick={() => void loadCompliance(false)}
          >
            {complianceLoading ? 'Đang cập nhật…' : 'Cập nhật'}
          </button>
        </div>

        {complianceContracts.length > 0 && (
          <>
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.xs }}>
              Hợp đồng
            </Text>
            <select
              value={complianceContractId}
              onChange={(e) => setComplianceContractId(e.target.value)}
              disabled={complianceListLoading}
              style={{
                width: '100%',
                padding: `${spacing.sm} ${spacing.md}`,
                marginBottom: spacing.md,
                borderRadius: 8,
                border: `1px solid ${colors.background.tertiary}`,
                fontSize: fontSize.small,
                backgroundColor: colors.background.primary,
                color: colors.text.primary,
                opacity: complianceListLoading ? 0.6 : 1,
              }}
            >
              {complianceContracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {complianceContractOptionLabel(c)}
                </option>
              ))}
            </select>
          </>
        )}

        {complianceListLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: spacing.xl, gap: spacing.sm }}>
            <Spinner />
            <Text size="small" style={{ color: colors.text.secondary }}>
              Đang tải danh sách hợp đồng…
            </Text>
          </div>
        )}

        {!complianceListLoading && complianceContracts.length === 0 && (
          <div style={{ padding: spacing.xl, textAlign: 'center' }}>
            <Icon name="package" size="lg" color={colors.text.secondary} />
            <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>
              Chưa có hợp đồng nào với vai trò thương lái
            </Text>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Khi có hợp đồng gắn farm và tiêu chuẩn, bạn có thể đối chiếu tuân thủ tại đây.
            </Text>
          </div>
        )}

        {!complianceListLoading && complianceContracts.length > 0 && complianceLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: spacing.xl, gap: spacing.sm }}>
            <Spinner />
            <Text size="small" style={{ color: colors.text.secondary }}>
              Đang tính toán tuân thủ…
            </Text>
          </div>
        )}

        {!complianceListLoading && complianceContracts.length > 0 && !complianceLoading && !compliance && complianceContractId && (
          <div style={{ padding: spacing.md, textAlign: 'center' }}>
            <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
              Chưa có dữ liệu tuân thủ cho hợp đồng này hoặc tải thất bại. Nhấn «Cập nhật» để thử lại.
            </Text>
          </div>
        )}

        {!complianceListLoading && complianceContracts.length > 0 && !complianceLoading && compliance && (
          <>
            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.background.primary,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: spacing.md,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                  Tiến độ bước quy trình
                </Text>
                <Text size="small" style={{ color: colors.primary.zaloBlue, fontWeight: fontWeight.bold, margin: 0 }}>
                  {compliance.completedSteps}/{compliance.totalSteps}
                </Text>
              </div>
              <div style={{ ...complianceBarContainer(pctSteps), height: 8, marginTop: spacing.xs }}>
                <div style={{ ...complianceBarFill(pctSteps), width: `${pctSteps}%` }} />
              </div>
              <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.sm, marginBottom: 0 }}>
                Mã tiêu chuẩn:{' '}
                <span style={{ color: colors.text.primary, fontWeight: fontWeight.medium }}>{compliance.standardCode}</span>
              </Text>
            </div>

            <div
              style={{
                padding: spacing.md,
                backgroundColor: colors.background.primary,
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginBottom: spacing.md,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
                  Điểm tuân thủ
                </Text>
                <Text
                  size="normal"
                  style={{
                    fontWeight: fontWeight.bold,
                    color: getComplianceColor(scorePct),
                    margin: 0,
                  }}
                >
                  {scorePct}%
                </Text>
              </div>
              <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs, marginBottom: 0 }}>
                (Giá trị 0–100%, tương ứng complianceScore 0–1 trên API)
              </Text>
            </div>

            <div style={{ marginBottom: spacing.sm }}>
              <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}>
                Sai lệch ({compliance.deviations.length})
              </Text>
              {compliance.deviations.length === 0 ? (
                <div
                  style={{
                    padding: spacing.md,
                    backgroundColor: `${colors.primary.agriGreen}12`,
                    borderRadius: 8,
                    border: `1px solid ${colors.primary.agriGreen}`,
                  }}
                >
                  <Text size="small" style={{ color: colors.primary.agriGreen, margin: 0 }}>
                    Không phát hiện sai lệch so với quy trình chuẩn.
                  </Text>
                </div>
              ) : (
                compliance.deviations.map((d, idx) => (
                  <div
                    key={`${d.careLogId}-${d.stepId}-${idx}`}
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.background.secondary,
                      borderRadius: 10,
                      marginBottom: spacing.sm,
                      borderLeft: `3px solid ${colors.functional.warningYellow}`,
                    }}
                  >
                    <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.xs }}>
                      {formatViDateTime(d.detectedAt)} · {d.stepId}
                    </Text>
                    <Text size="small" style={{ margin: 0, marginBottom: spacing.xs }}>
                      {d.reason}
                    </Text>
                    <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                      Nhật ký: {d.careLogId}
                    </Text>
                  </div>
                ))
              )}
            </div>

            <Text size="xSmall" style={{ color: colors.text.secondary, textAlign: 'center', margin: 0 }}>
              Cập nhật lần cuối: {formatViDateTime(compliance.lastComputedAt)}
            </Text>
          </>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 1.4s ease-in-out infinite;
        }
      `}</style>

      <Page className="trader-supply-monitor-screen">
        {/* Header */}
        <div style={headerStyles}>
          <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>Quản lý Nguồn cung</Text>
          <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
            {traderName}
          </Text.Title>
        </div>

        {/* Tab Bar */}
        <div style={tabBarStyles}>
          <button style={tabButtonStyles(activeTab === 'my-farmers')} onClick={() => setActiveTab('my-farmers')}>
            Nông dân của tôi
          </button>
          <button style={tabButtonStyles(activeTab === 'search-supply')} onClick={() => setActiveTab('search-supply')}>
            Tìm kiếm
          </button>
          <button style={tabButtonStyles(activeTab === 'pending-requests')} onClick={() => setActiveTab('pending-requests')}>
            Yêu cầu {pendingConnections.length > 0 && `(${pendingConnections.length})`}
          </button>
          <button style={tabButtonStyles(activeTab === 'compliance')} onClick={() => setActiveTab('compliance')}>
            Tuân thủ
          </button>
        </div>

        {/* Content */}
        <div style={contentStyles}>
          {activeTab === 'my-farmers' && renderMyFarmersTab()}
          {activeTab === 'search-supply' && renderSearchSupplyTab()}
          {activeTab === 'pending-requests' && renderPendingRequestsTab()}
          {activeTab === 'compliance' && renderComplianceTab()}
        </div>
      </Page>
    </>
  );
};

export default TraderSupplyMonitorScreen;
