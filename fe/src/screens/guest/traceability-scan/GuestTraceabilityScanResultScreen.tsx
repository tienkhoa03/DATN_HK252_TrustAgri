/**
 * Guest Traceability Scan Result Screen
 * Truy xuất nguồn gốc - Quét QR - Màn hình quan trọng nhất cho Khách khi quét QR trên bao bì
 * 
 * Requirements: FR-G01, US-G01, 22.1-22.4
 * 
 * Features:
 * - Ảnh bìa và Định danh: Ảnh chụp thực tế sản phẩm tại vườn, Tên sản phẩm và Tên Farm Lab
 * - Chứng nhận chất lượng: Huy hiệu (Badges) VietGAP, GlobalGAP, OCOP
 * - Biểu đồ Giám sát môi trường: 3 biểu đồ đường từ ra hoa đến thu hoạch (Nhiệt độ, Độ ẩm, Không thuốc BVTV)
 * - Nhật ký canh tác tóm tắt: 3 mốc quan trọng với ảnh minh chứng
 * - Nút Kêu gọi hành động: Sticky Footer để đăng nhập
 */

import React, { useState } from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { Chart } from '../../../design-system/components/Chart';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface GuestTraceabilityScanResultScreenProps {
  productId?: string;
  onLogin?: () => void;
}

interface CertificationBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  image: string;
}

interface EnvironmentalData {
  label: string;
  value: number;
}

/**
 * Guest Traceability Scan Result Screen Component
 * Requirements: FR-G01, US-G01, 22.1-22.4
 */
export const GuestTraceabilityScanResultScreen: React.FC<GuestTraceabilityScanResultScreenProps> = ({
  productId = 'PROD-001',
  onLogin,
}) => {
  const [selectedChart, setSelectedChart] = useState<'temperature' | 'humidity' | 'pesticide'>('temperature');

  // Mock product data - Thông tin sản phẩm
  const productInfo = {
    name: 'Bưởi Da xanh Cô Ba',
    farmName: 'Farm Lab Tiến Khoa',
    farmLocation: 'Vĩnh Long, Đồng bằng sông Cửu Long',
    farmArea: '2 hecta',
    harvestDate: '15/12/2025',
    productImage: '🍊',
    farmImage: '🌳',
  };

  // Certification badges - Chứng nhận chất lượng
  const certifications: CertificationBadge[] = [
    {
      id: '1',
      name: 'VietGAP',
      icon: '✓',
      color: colors.primary.agriGreen,
    },
    {
      id: '2',
      name: 'GlobalGAP',
      icon: '🌍',
      color: colors.primary.zaloBlue,
    },
    {
      id: '3',
      name: 'OCOP 4 sao',
      icon: '⭐',
      color: colors.functional.warningYellow,
    },
  ];

  // Environmental monitoring data - Dữ liệu giám sát môi trường
  const environmentalData = {
    temperature: [
      { label: 'Tuần 1', value: 26 },
      { label: 'Tuần 2', value: 27 },
      { label: 'Tuần 3', value: 28 },
      { label: 'Tuần 4', value: 27 },
      { label: 'Tuần 5', value: 26 },
      { label: 'Tuần 6', value: 28 },
      { label: 'Tuần 7', value: 27 },
      { label: 'Tuần 8', value: 26 },
    ],
    humidity: [
      { label: 'Tuần 1', value: 75 },
      { label: 'Tuần 2', value: 78 },
      { label: 'Tuần 3', value: 80 },
      { label: 'Tuần 4', value: 77 },
      { label: 'Tuần 5', value: 76 },
      { label: 'Tuần 6', value: 79 },
      { label: 'Tuần 7', value: 78 },
      { label: 'Tuần 8', value: 75 },
    ],
    pesticide: [
      { label: 'Tuần 1', value: 0 },
      { label: 'Tuần 2', value: 0 },
      { label: 'Tuần 3', value: 0 },
      { label: 'Tuần 4', value: 0 },
      { label: 'Tuần 5', value: 0 },
      { label: 'Tuần 6', value: 0 },
      { label: 'Tuần 7', value: 0 },
      { label: 'Tuần 8', value: 0 },
    ],
  };

  // Timeline events - Nhật ký canh tác
  const timelineEvents: TimelineEvent[] = [
    {
      id: '1',
      title: 'Xuống giống',
      date: '01/10/2025',
      description: 'Trồng cây giống Bưởi Da xanh chất lượng cao',
      image: '🌱',
    },
    {
      id: '2',
      title: 'Bón phân lần cuối',
      date: '25/11/2025',
      description: 'Bón phân hữu cơ vi sinh, không sử dụng hóa chất',
      image: '🌿',
    },
    {
      id: '3',
      title: 'Thu hoạch',
      date: '15/12/2025',
      description: 'Thu hoạch đúng độ chín, đảm bảo chất lượng',
      image: '🍊',
    },
  ];

  // Styles
  const containerStyles: React.CSSProperties = {
    paddingBottom: '80px', // Space for sticky footer
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
    color: color,
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
    marginBottom: spacing.sm,
  };

  const timelineImageStyles: React.CSSProperties = {
    width: '80px',
    height: '80px',
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    border: `1px solid ${colors.background.tertiary}`,
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

  const getChartData = () => {
    switch (selectedChart) {
      case 'temperature':
        return {
          data: environmentalData.temperature,
          title: 'Nhiệt độ trung bình',
          unit: '°C',
          description: 'Nhiệt độ được duy trì ổn định trong khoảng 26-28°C, phù hợp cho sự phát triển của cây Bưởi',
          yAxisLabel: 'Nhiệt độ (°C)',
        };
      case 'humidity':
        return {
          data: environmentalData.humidity,
          title: 'Độ ẩm đất',
          unit: '%',
          description: 'Độ ẩm đất được duy trì ở mức 75-80%, đảm bảo cây luôn đủ nước',
          yAxisLabel: 'Độ ẩm (%)',
        };
      case 'pesticide':
        return {
          data: environmentalData.pesticide,
          title: 'Không sử dụng thuốc BVTV',
          unit: '',
          description: 'Không phát hiện dư lượng thuốc bảo vệ thực vật trong suốt quá trình canh tác',
          yAxisLabel: 'Dư lượng',
        };
      default:
        return {
          data: environmentalData.temperature,
          title: 'Nhiệt độ trung bình',
          unit: '°C',
          description: 'Nhiệt độ được duy trì ổn định',
          yAxisLabel: 'Nhiệt độ (°C)',
        };
    }
  };

  const currentChartData = getChartData();

  return (
    <Page className="guest-traceability-scan-result-screen">
      <div style={containerStyles}>
        {/* Hero Section - Ảnh bìa sản phẩm */}
        <div style={heroSectionStyles}>
          <div style={productImageStyles}>{productInfo.productImage}</div>
        </div>

        {/* Product Info Section - Định danh sản phẩm */}
        <div style={productInfoSectionStyles}>
          <div style={productNameStyles}>{productInfo.name}</div>
          <div style={farmNameStyles}>
            <span>{productInfo.farmImage}</span>
            <span>{productInfo.farmName}</span>
          </div>
          <div style={farmDetailsStyles}>
            <Icon name="location" size="sm" color={colors.text.secondary} />
            <span>{productInfo.farmLocation}</span>
          </div>
          <div style={farmDetailsStyles}>
            <Icon name="farm" size="sm" color={colors.text.secondary} />
            <span>Diện tích: {productInfo.farmArea}</span>
          </div>
          <div style={farmDetailsStyles}>
            <Icon name="calendar" size="sm" color={colors.text.secondary} />
            <span>Thu hoạch: {productInfo.harvestDate}</span>
          </div>
        </div>

        {/* Certification Section - Chứng nhận chất lượng */}
        <div style={certificationSectionStyles}>
          <div style={sectionTitleStyles}>🏆 Chứng nhận chất lượng</div>
          <div style={badgeContainerStyles}>
            {certifications.map((cert) => (
              <div key={cert.id} style={badgeStyles(cert.color)}>
                <span style={{ fontSize: fontSize.body }}>{cert.icon}</span>
                <span>{cert.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Environmental Charts Section - Biểu đồ Giám sát môi trường */}
        <div style={chartSectionStyles}>
          <div style={sectionTitleStyles}>📊 Giám sát môi trường</div>
          <Text
            size="small"
            style={{ color: colors.text.secondary, marginBottom: spacing.md }}
          >
            Dữ liệu từ giai đoạn ra hoa đến thu hoạch (8 tuần)
          </Text>

          {/* Chart Tabs */}
          <div style={chartTabsStyles}>
            <button
              style={chartTabStyles(selectedChart === 'temperature')}
              onClick={() => setSelectedChart('temperature')}
            >
              🌡️ Nhiệt độ
            </button>
            <button
              style={chartTabStyles(selectedChart === 'humidity')}
              onClick={() => setSelectedChart('humidity')}
            >
              💧 Độ ẩm đất
            </button>
            <button
              style={chartTabStyles(selectedChart === 'pesticide')}
              onClick={() => setSelectedChart('pesticide')}
            >
              🚫 Không thuốc BVTV
            </button>
          </div>

          {/* Chart Description */}
          <div style={chartDescriptionStyles}>
            <Text size="small" style={{ margin: 0 }}>
              {currentChartData.description}
            </Text>
          </div>

          {/* Chart */}
          <Chart
            type="line"
            data={currentChartData.data}
            xAxis={{ label: 'Thời gian' }}
            yAxis={{ label: currentChartData.yAxisLabel }}
            colors={[colors.primary.agriGreen]}
            showGrid={true}
            height={200}
          />
        </div>

        {/* Timeline Section - Nhật ký canh tác tóm tắt */}
        <div style={timelineSectionStyles}>
          <div style={sectionTitleStyles}>📅 Nhật ký canh tác</div>
          <Text
            size="small"
            style={{ color: colors.text.secondary, marginBottom: spacing.md }}
          >
            3 mốc quan trọng trong quá trình canh tác
          </Text>

          <div style={timelineContainerStyles}>
            <div style={timelineLineStyles} />
            {timelineEvents.map((event, index) => (
              <div key={event.id} style={timelineEventStyles}>
                <div style={timelineIconStyles}>{event.image}</div>
                <div style={timelineContentStyles}>
                  <div style={timelineTitleStyles}>{event.title}</div>
                  <div style={timelineDateStyles}>📅 {event.date}</div>
                  <div style={timelineDescriptionStyles}>{event.description}</div>
                  <div style={timelineImageStyles}>{event.image}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Footer - Call to Action */}
        <div style={stickyFooterStyles}>
          <button
            style={ctaButtonStyles}
            onClick={onLogin}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0052CC';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Đăng nhập để xem chi tiết toàn bộ quá trình và đặt mua vụ sau"
          >
            <Icon name="user" size="md" color={colors.text.inverse} />
            <span>Đăng nhập để xem chi tiết toàn bộ quá trình và đặt mua vụ sau</span>
          </button>
        </div>
      </div>
    </Page>
  );
};

export default GuestTraceabilityScanResultScreen;
