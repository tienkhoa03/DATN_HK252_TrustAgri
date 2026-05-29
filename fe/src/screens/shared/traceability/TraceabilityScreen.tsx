/**
 * Traceability Screen — shared across all roles (FR-G01 / US-G01 / NFR-U01)
 * Accessible at /trace and /trace/:code
 * Public: no auth required. Auth session controls login CTA visibility only.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Page, Text, Spinner, useNavigate, useParams } from 'zmp-ui';
import { useAtomValue } from 'jotai';
import { Icon } from '@/design-system/components/Icon';
import { Chart } from '@/design-system/components/Chart';
import { colors } from '@/design-system/tokens/colors';
import { spacing } from '@/design-system/tokens/spacing';
import { fontSize, fontWeight } from '@/design-system/tokens/typography';
import { ApiError } from '@/api/errors';
import {
  getTraceabilityByQrCode,
  toTraceabilityViMessage,
  type TraceabilityDto,
} from '@/services/traceabilityService';
import { cropEmoji, cropLabel } from '@/services/marketplaceService';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import { authSessionAtom } from '@/state/authAtoms';
import { ProcessComplianceCard } from './ProcessComplianceCard';
import { EnvironmentSnapshotCard } from './EnvironmentSnapshotCard';
import { ComplianceCertificateCard } from './ComplianceCertificateCard';
import { ContractContextBanner } from './ContractContextBanner';

const SENSOR_TAB_LABELS: Record<string, string> = {
  temperature_c: '🌡️ Nhiệt độ',
  soil_moisture_pct: '💧 Độ ẩm đất',
  pesticide_residue_ppm: '🚫 Dư lượng BVTV',
};

const SENSOR_Y_LABELS: Record<string, string> = {
  temperature_c: 'Nhiệt độ (°C)',
  soil_moisture_pct: 'Độ ẩm (%)',
  pesticide_residue_ppm: 'ppm',
};

const CARE_ACTION_VI: Record<string, string> = {
  sowing: 'Xuống giống',
  fertilizing: 'Bón phân',
  watering: 'Tưới tiêu',
  harvest: 'Thu hoạch',
  pruning: 'Tỉa cành',
  spraying: 'Phun thuốc',
  monitoring: 'Giám sát',
};

function formatViDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function chartLabelFromT(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  } catch {
    return iso;
  }
}

function formatFarmLocation(d: TraceabilityDto['farm']): string {
  const { province, district, addressLine } = d.location;
  return [addressLine, district, province].filter(Boolean).join(', ');
}

function sensorDescription(sensorType: string): string {
  switch (sensorType) {
    case 'temperature_c':
      return 'Nhiệt độ được theo dõi theo tuần trong giai đoạn ra hoa đến thu hoạch, duy trì trong ngưỡng phù hợp cho cây trồng.';
    case 'soil_moisture_pct':
      return 'Độ ẩm đất phản ánh khả năng cấp nước cho rễ; giá trị ổn định giúp giảm stress sinh lý.';
    case 'pesticide_residue_ppm':
      return 'Theo dõi dư lượng thuốc BVTV (ppm). Giá trị 0 trong suốt chu kỳ minh chứng hướng canh tác an toàn.';
    default:
      return 'Dữ liệu cảm biến từ vườn (digital twin).';
  }
}

export const TraceabilityScreen: React.FC = () => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const params = useParams<{ code?: string }>();
  const session = useAtomValue(authSessionAtom);

  const [inputValue, setInputValue] = useState('');
  const [searchedCode, setSearchedCode] = useState('');
  const [data, setData] = useState<TraceabilityDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedSensorIndex, setSelectedSensorIndex] = useState(0);
  const [retryTick, setRetryTick] = useState(0);

  // Pre-fill input from URL param — user must press "Tìm kiếm" to trigger search
  useEffect(() => {
    if (params.code) {
      setInputValue(decodeURIComponent(params.code));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when searchedCode changes or retry requested
  useEffect(() => {
    if (!searchedCode) return;

    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setLoadError(false);
    setData(null);

    getTraceabilityByQrCode(searchedCode)
      .then((dto) => {
        if (!cancelled) setData(dto);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (
          err instanceof ApiError &&
          (err.httpStatus === 404 || err.code === 'NOT_FOUND')
        ) {
          setNotFound(true);
        } else {
          setLoadError(true);
          openSnackbar({
            type: 'error',
            text: toTraceabilityViMessage(err),
            duration: 4500,
            icon: true,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchedCode, retryTick]);

  useEffect(() => {
    if (data?.sensorChart?.length) setSelectedSensorIndex(0);
  }, [data?.productCode]);

  const sortedTimeline = useMemo(() => {
    if (!data) return [];
    return [...data.careLogTimeline].sort(
      (a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime(),
    );
  }, [data]);

  const currentSeries = data?.sensorChart?.[selectedSensorIndex];
  const chartPoints = useMemo(() => {
    if (!currentSeries?.series?.length) return [];
    return currentSeries.series.map((p) => ({
      label: chartLabelFromT(p.t),
      value: p.value,
    }));
  }, [currentSeries]);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;
    setSearchedCode(trimmed);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // ── Style objects ──────────────────────────────────────────────────────────

  const headerStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `0 ${spacing.md}`,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
    zIndex: 1000,
  };

  const backBtnStyles: React.CSSProperties = {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '50%',
    flexShrink: 0,
  };

  const searchBarStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const inputStyles: React.CSSProperties = {
    flex: 1,
    height: '44px',
    border: `1.5px solid ${colors.background.tertiary}`,
    borderRadius: '8px',
    padding: `0 ${spacing.md}`,
    fontSize: fontSize.body,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    outline: 'none',
  };

  const searchBtnStyles = (disabled: boolean): React.CSSProperties => ({
    height: '44px',
    padding: `0 ${spacing.md}`,
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    whiteSpace: 'nowrap',
  });

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  };

  const productNameStyles: React.CSSProperties = {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  };

  const farmNameStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    color: colors.primary.agriGreen,
    marginBottom: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const farmDetailsStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const badgeStyles = (color: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: `${color}20`,
    border: `2px solid ${color}`,
    borderRadius: '8px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    color,
  });

  const chartTabStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: isActive ? colors.primary.zaloBlue : colors.background.primary,
    color: isActive ? colors.text.inverse : colors.text.primary,
    border: 'none',
    borderRadius: '20px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  });

  const chartDescriptionStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    borderLeft: `4px solid ${colors.primary.agriGreen}`,
  };

  const timelineContainerStyles: React.CSSProperties = {
    position: 'relative',
    paddingLeft: spacing.xl,
  };

  const timelineLineStyles: React.CSSProperties = {
    position: 'absolute',
    left: '16px',
    top: '0',
    bottom: '0',
    width: '2px',
    backgroundColor: colors.primary.agriGreen,
  };

  const timelineEventStyles: React.CSSProperties = {
    position: 'relative',
    marginBottom: spacing.lg,
  };

  const timelineIconStyles: React.CSSProperties = {
    position: 'absolute',
    left: '-44px',
    top: '0',
    width: '32px',
    height: '32px',
    backgroundColor: colors.background.primary,
    border: `3px solid ${colors.primary.agriGreen}`,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  };

  const timelineContentStyles: React.CSSProperties = {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: '8px',
  };

  const stickyFooterStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderTop: `1px solid ${colors.background.tertiary}`,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  };

  const ctaButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.md,
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  };

  const primaryBtnStyles: React.CSSProperties = {
    height: '44px',
    padding: `0 ${spacing.lg}`,
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
  };

  const timelineBadge = (color: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: `2px ${spacing.sm}`,
    backgroundColor: `${color}18`,
    border: `1px solid ${color}`,
    borderRadius: '12px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color,
    minHeight: '22px',
  });

  const isSearchDisabled = !inputValue.trim() || loading;
  const showStickyFooter = !session && !!data;
  const contentPaddingBottom = showStickyFooter ? '80px' : spacing.xl;

  return (
    <Page className="traceability-screen">
      {/* Fixed header */}
      <div style={headerStyles}>
        <button type="button" style={backBtnStyles} onClick={handleBack} aria-label="Quay lại">
          <Icon name="chevron-left" size="md" color={colors.text.primary} />
        </button>
        <Text style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold, color: colors.text.primary }}>
          Truy xuất nguồn gốc
        </Text>
      </div>

      {/* Scrollable content */}
      <div style={{ marginTop: '56px', paddingBottom: contentPaddingBottom }}>
        {/* Search bar */}
        <div style={searchBarStyles}>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Nhập mã QR (VD: TR-abc123... hoặc LOT-abc123...)"
              style={inputStyles}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearchDisabled}
              style={searchBtnStyles(isSearchDisabled)}
            >
              {loading ? '...' : 'Tìm kiếm'}
            </button>
          </div>
          <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
            Quét mã QR trên bao bì sản phẩm hoặc nhập mã trực tiếp
          </Text>
        </div>

        {/* Empty state */}
        {!searchedCode && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', padding: spacing.lg, textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: spacing.md }}>🌾</div>
            <Text style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.sm }}>
              Tra cứu nguồn gốc nông sản
            </Text>
            <Text size="small" style={{ color: colors.text.secondary, maxWidth: 300 }}>
              Nhập mã QR từ bao bì sản phẩm để xem thông tin vườn trồng, nhật ký canh tác và dữ liệu cảm biến.
            </Text>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
            <Spinner />
            <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.md }}>Đang tải thông tin...</Text>
          </div>
        )}

        {/* Not found state */}
        {!loading && notFound && (
          <div style={{ padding: spacing.lg, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🔎</div>
            <Text style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold }}>Không tìm thấy</Text>
            <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
              Mã "{searchedCode}" không tồn tại hoặc chưa được kích hoạt trên hệ thống TrustAgri.
            </Text>
          </div>
        )}

        {/* Error state */}
        {!loading && loadError && (
          <div style={{ padding: spacing.lg, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: spacing.md }}>⚠️</div>
            <Text style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold }}>Lỗi kết nối</Text>
            <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.sm, marginBottom: spacing.lg }}>
              Không thể kết nối máy chủ. Vui lòng kiểm tra mạng.
            </Text>
            <button type="button" style={primaryBtnStyles} onClick={() => setRetryTick((n) => n + 1)}>
              Thử lại
            </button>
          </div>
        )}

        {/* Result */}
        {!loading && data && (
          <>
            {/* Hero */}
            <div style={{ position: 'relative', height: '200px', backgroundColor: colors.background.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <div style={{ fontSize: '120px', textAlign: 'center' }}>{cropEmoji(data.farm.cropType)}</div>
            </div>

            {/* Contract scope banner */}
            <ContractContextBanner scope={data.scope ?? 'farm-overview'} contract={data.contract} />

            {/* Lớp 1: Identity — Product & Farm info */}
            <div style={{ padding: spacing.md, backgroundColor: colors.background.primary }}>
              <div style={productNameStyles}>{data.productCode}</div>
              <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.sm }}>
                {cropLabel(data.farm.cropType)}
              </Text>
              <div style={farmNameStyles}>
                <span>🌳</span>
                <span>{data.farm.name}</span>
              </div>
              <div style={farmDetailsStyles}>
                <Icon name="location" size="sm" color={colors.text.secondary} />
                <span>{formatFarmLocation(data.farm)}</span>
              </div>
              {data.farm.area != null && (
                <div style={farmDetailsStyles}>
                  <span>📐</span>
                  <span>Diện tích: {data.farm.area} ha</span>
                </div>
              )}
              {data.farm.plantingDate && (
                <div style={farmDetailsStyles}>
                  <span>🌱</span>
                  <span>Ngày trồng: {new Date(data.farm.plantingDate).toLocaleDateString('vi-VN')}</span>
                </div>
              )}
              {data.farm.ownerDisplayName && (
                <div style={farmDetailsStyles}>
                  <span>👤</span>
                  <span>Chủ vườn: {data.farm.ownerDisplayName}</span>
                </div>
              )}
            </div>

            {/* Contract & các bên — chỉ render khi QR thuộc về 1 hợp đồng */}
            {data.contract && (
              <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderTop: `1px solid ${colors.background.secondary}` }}>
                <div style={sectionTitleStyles}>📜 Hợp đồng nguồn gốc</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.sm }}>
                    <Text size="small" style={{ color: colors.text.secondary }}>Mã hợp đồng</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.text.primary, textAlign: 'right', wordBreak: 'break-all' }}>
                      {data.contract.id.slice(0, 8)}…
                    </Text>
                  </div>
                  {data.contract.quantity !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.sm }}>
                      <Text size="small" style={{ color: colors.text.secondary }}>Khối lượng cam kết</Text>
                      <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.text.primary }}>
                        {data.contract.quantity.toLocaleString('vi-VN')} {data.contract.unit ?? ''}
                      </Text>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.sm }}>
                    <Text size="small" style={{ color: colors.text.secondary }}>Thời hạn canh tác</Text>
                    <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.text.primary }}>
                      {new Date(data.contract.plantingDate ?? data.contract.startDate).toLocaleDateString('vi-VN')}
                      {' → '}
                      {new Date(data.contract.endDate).toLocaleDateString('vi-VN')}
                    </Text>
                  </div>
                </div>
              </div>
            )}

            {/* Certification */}
            <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderTop: `1px solid ${colors.background.secondary}` }}>
              <div style={sectionTitleStyles}>🏆 Tiêu chuẩn & chứng nhận</div>
              {data.standard ? (
                <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
                  <div style={badgeStyles(colors.primary.agriGreen)}>
                    <span style={{ fontSize: fontSize.body }}>✓</span>
                    <span>
                      {data.standard.code} — {data.standard.name}
                    </span>
                  </div>
                </div>
              ) : (
                <Text size="small" style={{ color: colors.text.secondary }}>
                  Chưa có thông tin tiêu chuẩn công khai cho lô hàng này.
                </Text>
              )}
            </div>

            {/* Lớp 2: Process Compliance */}
            {data.process && <ProcessComplianceCard process={data.process} />}

            {/* Lớp 4: Compliance Certificate */}
            {data.scope === 'contract' && data.complianceCertificate && data.complianceCertificate.status !== 'none' && (
              <div style={{ paddingTop: spacing.md, backgroundColor: colors.background.primary }}>
                <div style={{ ...sectionTitleStyles, padding: `0 ${spacing.md}` }}>Chứng nhận hợp đồng</div>
                <ComplianceCertificateCard certificate={data.complianceCertificate} />
              </div>
            )}

            {/* Lớp 3: IoT Snapshot — chỉ hiển thị cho farm-overview hoặc contract đang hoạt động */}
            {(data.scope === 'farm-overview' ||
              (data.scope === 'contract' && (data.contract?.status === 'active' || data.contract?.status === 'pending_change'))) && (
              <EnvironmentSnapshotCard readings={data.currentEnvironment ?? []} />
            )}

            {/* Sensor chart */}
            <div style={{ padding: spacing.md, backgroundColor: colors.background.secondary }}>
              <div style={sectionTitleStyles}>📊 Giám sát cảm biến</div>
              <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
                {data.scope === 'contract' && data.contract
                  ? `Dữ liệu cảm biến từ ${new Date(data.contract.startDate).toLocaleDateString('vi-VN')} đến ${new Date(data.contract.endDate).toLocaleDateString('vi-VN')}`
                  : 'Dữ liệu 7 ngày gần nhất (public traceability)'}
              </Text>
              {data.sensorChart.length > 0 ? (
                <>
                  <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md, overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {data.sensorChart.map((s, idx) => (
                      <button
                        key={s.sensorType}
                        type="button"
                        style={chartTabStyles(selectedSensorIndex === idx)}
                        onClick={() => setSelectedSensorIndex(idx)}
                      >
                        {SENSOR_TAB_LABELS[s.sensorType] ?? s.sensorType}
                      </button>
                    ))}
                  </div>
                  <div style={chartDescriptionStyles}>
                    <Text size="small" style={{ margin: 0 }}>
                      {currentSeries ? sensorDescription(currentSeries.sensorType) : ''}
                    </Text>
                  </div>
                  {chartPoints.length > 0 ? (
                    <Chart
                      type="line"
                      data={chartPoints}
                      xAxis={{ label: 'Thời gian' }}
                      yAxis={{
                        label: currentSeries
                          ? SENSOR_Y_LABELS[currentSeries.sensorType] ?? currentSeries.sensorType
                          : '',
                      }}
                      colors={[colors.primary.agriGreen]}
                      showGrid
                      height={200}
                    />
                  ) : (
                    <Text size="small" style={{ color: colors.text.secondary }}>
                      Chưa có điểm đo cho chuỗi cảm biến này.
                    </Text>
                  )}
                </>
              ) : (
                <Text size="small" style={{ color: colors.text.secondary }}>
                  Chưa có dữ liệu cảm biến công khai.
                </Text>
              )}
            </div>

            {/* Care log timeline */}
            <div style={{ padding: spacing.md, backgroundColor: colors.background.primary }}>
              <div style={sectionTitleStyles}>📅 Nhật ký canh tác</div>
              <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
                Các mốc đã ghi nhận (care log)
              </Text>
              <div style={timelineContainerStyles}>
                <div style={timelineLineStyles} />
                {sortedTimeline.map((ev, index) => (
                  <div key={ev.id ?? `${ev.performedAt}-${index}`} style={timelineEventStyles}>
                    <div style={timelineIconStyles}>🌾</div>
                    <div style={timelineContentStyles}>
                      <div style={{ fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: colors.text.primary, marginBottom: spacing.xs }}>
                        {ev.standardStepTitle ?? CARE_ACTION_VI[ev.action] ?? ev.action}
                      </div>
                      <div style={{ fontSize: fontSize.small, color: colors.primary.zaloBlue, fontWeight: fontWeight.medium, marginBottom: spacing.xs }}>
                        📅 {formatViDateTime(ev.performedAt)}
                      </div>

                      {/* Badges */}
                      {(ev.deviation || ev.isLate || ev.isEdited) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs }}>
                          {ev.deviation && (
                            <span style={timelineBadge('#EF4444')}>Lệch quy trình</span>
                          )}
                          {ev.isLate && (
                            <span style={timelineBadge('#F97316')}>Trễ tiến độ</span>
                          )}
                          {ev.isEdited && (
                            <span
                              style={timelineBadge('#6366F1')}
                              title="Bản ghi đã sửa — thông tin gốc lưu trong sổ kiểm toán hệ thống"
                            >
                              Đã chỉnh sửa
                            </span>
                          )}
                        </div>
                      )}

                      {ev.notes ? (
                        <div style={{ fontSize: fontSize.caption, color: colors.text.secondary, marginBottom: spacing.xs }}>{ev.notes}</div>
                      ) : null}

                      {/* Evidence thumbnails (max 3) */}
                      {ev.evidences && ev.evidences.length > 0 && (
                        <div style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
                          {ev.evidences.slice(0, 3).map((e, ei) => (
                            e.mimeType.startsWith('image/') ? (
                              <a key={ei} href={e.fileUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={e.fileUrl}
                                  alt="Minh chứng"
                                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: `1px solid ${colors.background.tertiary}` }}
                                />
                              </a>
                            ) : (
                              <a
                                key={ei}
                                href={e.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.tertiary, borderRadius: '6px', fontSize: '24px', textDecoration: 'none' }}
                              >
                                📄
                              </a>
                            )
                          ))}
                          {ev.evidences.length > 3 && (
                            <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background.tertiary, borderRadius: '6px', fontSize: fontSize.caption, color: colors.text.secondary }}>
                              +{ev.evidences.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky login CTA — guests only, after result loaded */}
      {showStickyFooter && (
        <div style={stickyFooterStyles}>
          <button type="button" style={ctaButtonStyles} onClick={() => navigate('/login')}>
            <Icon name="user" size="md" color={colors.text.inverse} />
            <span>Đăng nhập để đặt mua và theo dõi vườn này</span>
          </button>
        </div>
      )}
    </Page>
  );
};

export default TraceabilityScreen;
