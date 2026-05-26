/**
 * Guest Traceability Scan Result Screen — FR-G01 / US-G01
 * GET /api/v1/traceability/qr/:code (public, không gửi Authorization).
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Page, Box, Text, Spinner, useNavigate, useParams } from 'zmp-ui';
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

export interface GuestTraceabilityScanResultScreenProps {
  /** Khi nhúng ngoài router (demo / test), truyền mã QR; mặc định lấy từ `/guest/trace/:code`. */
  qrCode?: string;
  onLogin?: () => void;
  hideCta?: boolean;
}

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

export const GuestTraceabilityScanResultScreen: React.FC<GuestTraceabilityScanResultScreenProps> = ({
  qrCode,
  onLogin,
  hideCta = false,
}) => {
  const navigate = useNavigate();
  const openSnackbar = useStableOpenSnackbar();
  const params = useParams<{ code?: string }>();
  const effectiveCode = (qrCode ?? params.code ?? '').trim();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [data, setData] = useState<TraceabilityDto | null>(null);
  const [selectedSensorIndex, setSelectedSensorIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setLoadError(false);
    setData(null);

    if (!effectiveCode) {
      setNotFound(true);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    getTraceabilityByQrCode(effectiveCode)
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
  }, [effectiveCode, retryTick]);

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

  const handleCta = () => {
    if (onLogin) onLogin();
    else navigate('/login');
  };

  const containerStyles: React.CSSProperties = {
    paddingBottom: '80px',
  };

  const heroSectionStyles: React.CSSProperties = {
    position: 'relative',
    height: '240px',
    backgroundColor: colors.background.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const productImageStyles: React.CSSProperties = {
    fontSize: '120px',
    textAlign: 'center',
  };

  const productInfoSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
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

  const certificationSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderTop: `1px solid ${colors.background.secondary}`,
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  };

  const badgeContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.md,
    flexWrap: 'wrap',
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

  const chartSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
  };

  const chartTabsStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    marginBottom: spacing.md,
    overflowX: 'auto',
    scrollbarWidth: 'none',
  };

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

  const timelineSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
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

  const timelineTitleStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  };

  const timelineDateStyles: React.CSSProperties = {
    fontSize: fontSize.small,
    color: colors.primary.zaloBlue,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
  };

  const timelineDescriptionStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
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
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  };

  if (loading) {
    return (
      <Page className="guest-traceability-scan-result-screen">
        <Box className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
          <Spinner />
          <Text size="small" className="mt-3" style={{ color: colors.text.secondary }}>
            Đang tải thông tin truy xuất…
          </Text>
        </Box>
      </Page>
    );
  }

  if (loadError) {
    return (
      <Page className="guest-traceability-scan-result-screen">
        <Box
          className="flex flex-col items-center justify-center"
          style={{ minHeight: '70vh', padding: spacing.lg, textAlign: 'center' }}
        >
          <Text style={{ fontSize: '48px', marginBottom: spacing.md }}>⚠️</Text>
          <Text style={{ ...productNameStyles, textAlign: 'center' }}>Không tải được dữ liệu</Text>
          <Text
            size="small"
            style={{ color: colors.text.secondary, marginBottom: spacing.lg, maxWidth: 320 }}
          >
            Đã có lỗi khi kết nối máy chủ. Bạn có thể thử lại hoặc quay về trang chủ.
          </Text>
          <Box className="flex flex-col gap-2" style={{ width: '100%', maxWidth: 280 }}>
            <button
              type="button"
              style={ctaButtonStyles}
              onClick={() => setRetryTick((n) => n + 1)}
            >
              Thử lại
            </button>
            <button
              type="button"
              style={{
                ...ctaButtonStyles,
                backgroundColor: colors.background.secondary,
                color: colors.text.primary,
                border: `1px solid ${colors.background.tertiary}`,
              }}
              onClick={() => navigate('/guest')}
            >
              Về trang chủ khách
            </button>
          </Box>
        </Box>
      </Page>
    );
  }

  if (notFound || !data) {
    return (
      <Page className="guest-traceability-scan-result-screen">
        <Box
          className="flex flex-col items-center justify-center"
          style={{ minHeight: '70vh', padding: spacing.lg, textAlign: 'center' }}
        >
          <Text style={{ fontSize: '48px', marginBottom: spacing.md }}>🔎</Text>
          <Text style={{ ...productNameStyles, textAlign: 'center' }}>Không tìm thấy lô hàng</Text>
          <Text
            size="small"
            style={{ color: colors.text.secondary, marginBottom: spacing.lg, maxWidth: 320 }}
          >
            Mã QR không hợp lệ, đã thu hồi hoặc chưa được kích hoạt trên hệ thống TrustAgri. Vui lòng
            kiểm tra lại bao bì hoặc liên hệ người bán.
          </Text>
          <button
            type="button"
            style={{
              ...ctaButtonStyles,
              width: 'auto',
              minWidth: 200,
              backgroundColor: colors.primary.agriGreen,
            }}
            onClick={() => navigate('/guest')}
          >
            Về trang chủ khách
          </button>
        </Box>
      </Page>
    );
  }

  const cropIcon = cropEmoji(data.farm.cropType);
  const cropTitle = cropLabel(data.farm.cropType);

  return (
    <Page className="guest-traceability-scan-result-screen">
      <div style={containerStyles}>
        <div style={heroSectionStyles}>
          <div style={productImageStyles}>{cropIcon}</div>
        </div>

        <div style={productInfoSectionStyles}>
          <div style={productNameStyles}>{data.productCode}</div>
          <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.sm }}>
            {cropTitle}
          </Text>
          <div style={farmNameStyles}>
            <span>🌳</span>
            <span>{data.farm.name}</span>
          </div>
          <div style={farmDetailsStyles}>
            <Icon name="location" size="sm" color={colors.text.secondary} />
            <span>{formatFarmLocation(data.farm)}</span>
          </div>
        </div>

        {data.contract && (
          <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, borderTop: `1px solid ${colors.background.secondary}` }}>
            <div style={sectionTitleStyles}>📜 Hợp đồng nguồn gốc</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.sm }}>
                <Text size="small" style={{ color: colors.text.secondary }}>Mã hợp đồng</Text>
                <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.text.primary }}>
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

        <div style={certificationSectionStyles}>
          <div style={sectionTitleStyles}>🏆 Tiêu chuẩn & chứng nhận</div>
          {data.standard ? (
            <div style={badgeContainerStyles}>
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

        <div style={chartSectionStyles}>
          <div style={sectionTitleStyles}>📊 Giám sát cảm biến</div>
          <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
            Dữ liệu minh họa theo thời gian (public traceability)
          </Text>

          {data.sensorChart.length > 0 ? (
            <>
              <div style={chartTabsStyles}>
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

        <div style={timelineSectionStyles}>
          <div style={sectionTitleStyles}>📅 Nhật ký canh tác</div>
          <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.md }}>
            Các mốc đã ghi nhận (care log)
          </Text>

          <div style={timelineContainerStyles}>
            <div style={timelineLineStyles} />
            {sortedTimeline.map((ev, index) => (
              <div key={`${ev.performedAt}-${index}`} style={timelineEventStyles}>
                <div style={timelineIconStyles}>🌾</div>
                <div style={timelineContentStyles}>
                  <div style={timelineTitleStyles}>
                    {ev.standardStepTitle ?? CARE_ACTION_VI[ev.action] ?? ev.action}
                  </div>
                  <div style={timelineDateStyles}>📅 {formatViDateTime(ev.performedAt)}</div>
                  {ev.notes ? (
                    <div style={timelineDescriptionStyles}>{ev.notes}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!hideCta && (
          <div style={stickyFooterStyles}>
            <button type="button" style={ctaButtonStyles} onClick={handleCta}>
              <Icon name="user" size="md" color={colors.text.inverse} />
              <span>Đăng nhập để xem chi tiết toàn bộ quá trình và đặt mua vụ sau</span>
            </button>
          </div>
        )}
      </div>
    </Page>
  );
};

export default GuestTraceabilityScanResultScreen;
