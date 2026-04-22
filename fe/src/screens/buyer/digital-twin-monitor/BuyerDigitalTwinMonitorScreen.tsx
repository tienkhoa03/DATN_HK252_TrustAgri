/**
 * Buyer Digital Twin Monitor Screen
 * Giám sát Bản sao số - Tính năng quan trọng nhất cho đơn hàng đã đặt cọc
 * 
 * Requirements: FR-U05, US-U03, US-U05
 * 
 * Features:
 * - Mô hình Cây trồng 3D/2D (Visual Stage): Chiếm 50% màn hình phía trên
 * - Nhãn dữ liệu nổi (Overlay): Bong bóng nhỏ hiển thị Nhiệt độ, Độ ẩm
 * - Dòng thời gian Nhật ký (Timeline): Trục dọc từ gieo hạt đến hiện tại
 * - Camera trực tiếp: Nút xem ảnh mới nhất hoặc video từ Farm Lab
 */

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'zmp-ui';
import { RoleAppShell } from '@/navigation/RoleAppShell';
import { DigitalTwinViewer, GrowthStage, HealthStatus } from '../../../design-system/components/DigitalTwinViewer';
import { Icon } from '../../../design-system/components/Icon';
import { SensorLineChart } from '../../../design-system/components/SensorLineChart';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useMonitoring } from '@/hooks/useMonitoring';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import type { SensorReadingDto, SensorType } from '@/services/monitoringService';

export interface BuyerDigitalTwinMonitorScreenProps {
  orderId?: string;
  /** farmId liên kết với đơn hàng — dùng để lấy dữ liệu cảm biến */
  farmId?: string;
  onBack?: () => void;
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  icon: string;
  hasPhoto: boolean;
  photoEmoji?: string;
}

interface SensorOverlay {
  label: string;
  value: string;
  icon: string;
  position: { top: string; left: string };
}

/**
 * Buyer Digital Twin Monitor Screen Component
 * Requirements: FR-U05, US-U03, US-U05
 */
export const BuyerDigitalTwinMonitorScreen: React.FC<BuyerDigitalTwinMonitorScreenProps> = ({
  orderId = '1',
  farmId = 'farm-001',
  onBack,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorType>('temperature');

  // ── Monitoring — REST cold start + WebSocket realtime (Phase 6.2) ─────────
  const {
    latestReadings,
    historyData,
    isHistoryLoading,
    error: monitoringError,
    loadHistory,
    clearError,
  } = useMonitoring(farmId);

  // Hiển thị Snackbar khi lỗi API
  useEffect(() => {
    if (monitoringError) {
      openSnackbar({ type: 'error', text: monitoringError, duration: 4500, icon: true });
      clearError();
    }
  }, [monitoringError, openSnackbar, clearError]);

  // Load history khi chọn cảm biến
  useEffect(() => {
    loadHistory(selectedSensor);
  }, [selectedSensor, loadHistory]);

  // Mock order data
  const order = {
    id: orderId,
    productName: 'Sầu riêng Monthong',
    farmName: 'Farm Lab Tiến Khoa',
    farmerName: 'Tiến Khoa',
    orderDate: '15/11/2024',
    expectedHarvest: '05/01/2025',
    daysRemaining: 21,
  };

  // Plant model data
  const plantModel = {
    id: '1',
    name: order.productName,
    type: 'Durio zibethinus',
  };

  // Current environment data
  const environmentData = {
    temperature: 28,
    humidity: 75,
    light: 850,
  };

  // Current growth stage and health
  const growthStage: GrowthStage = 'flowering';
  const health: HealthStatus = 'healthy';

  // Sensor overlays — dùng live data nếu có, fallback về static
  const latestMap: Partial<Record<SensorType, SensorReadingDto>> = {};
  for (const r of latestReadings) latestMap[r.sensorType] = r;

  const sensorOverlays: SensorOverlay[] = [
    {
      label: 'Nhiệt độ',
      value: latestMap.temperature
        ? `${latestMap.temperature.value}${latestMap.temperature.unit}${latestMap.temperature.isImputed ? ' ~' : ''}`
        : `${environmentData.temperature}°C`,
      icon: '🌡️',
      position: { top: '15%', left: '10%' },
    },
    {
      label: 'Độ ẩm',
      value: latestMap.humidity
        ? `${latestMap.humidity.value}${latestMap.humidity.unit}${latestMap.humidity.isImputed ? ' ~' : ''}`
        : `${environmentData.humidity}%`,
      icon: '💧',
      position: { top: '15%', left: '75%' },
    },
  ];

  // Timeline events
  const timelineEvents: TimelineEvent[] = [
    {
      id: '1',
      date: '15/11/2024',
      title: 'Gieo hạt',
      description: 'Gieo hạt giống Monthong chất lượng cao',
      icon: '🌱',
      hasPhoto: true,
      photoEmoji: '📷',
    },
    {
      id: '2',
      date: '25/11/2024',
      title: 'Bón phân lần 1',
      description: 'Bón phân hữu cơ NPK 16-16-8',
      icon: '🌿',
      hasPhoto: true,
      photoEmoji: '📷',
    },
    {
      id: '3',
      date: '05/12/2024',
      title: 'Tưới nước',
      description: 'Tưới nước tự động 2 lần/ngày',
      icon: '💧',
      hasPhoto: false,
    },
    {
      id: '4',
      date: '15/12/2024',
      title: 'Ra hoa',
      description: 'Cây bắt đầu ra hoa, điều kiện tốt',
      icon: '🌸',
      hasPhoto: true,
      photoEmoji: '📷',
    },
    {
      id: '5',
      date: '20/12/2024',
      title: 'Hiện tại',
      description: 'Đang trong giai đoạn ra hoa',
      icon: '⏱️',
      hasPhoto: false,
    },
  ];

  // Styles
  const headerStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${colors.background.tertiary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${spacing.md}`,
    zIndex: 1000,
  };

  const backButtonStyles: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: colors.background.primary,
    border: `1px solid ${colors.background.tertiary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const cameraButtonStyles: React.CSSProperties = {
    padding: `${spacing.xs} ${spacing.md}`,
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '20px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    transition: 'all 0.2s',
  };

  const contentStyles: React.CSSProperties = {
    marginTop: '56px',
    paddingBottom: spacing.lg,
  };

  // Visual Stage - 50% of screen
  const visualStageStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '50vh',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const overlayBubbleStyles = (position: { top: string; left: string }): React.CSSProperties => ({
    position: 'absolute',
    top: position.top,
    left: position.left,
    transform: 'translate(-50%, -50%)',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: '80px',
    zIndex: 10,
  });

  const bubbleTextStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const orderInfoStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.tertiary}`,
  };

  const infoRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  };

  const harvestCountdownStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    textAlign: 'center',
    marginBottom: spacing.sm,
  };

  const timelineSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  };

  const timelineContainerStyles: React.CSSProperties = {
    position: 'relative',
    paddingLeft: spacing.xl,
    marginTop: spacing.md,
  };

  const timelineLineStyles: React.CSSProperties = {
    position: 'absolute',
    left: '16px',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: colors.background.tertiary,
  };

  const timelineEventStyles = (isSelected: boolean): React.CSSProperties => ({
    position: 'relative',
    marginBottom: spacing.lg,
    cursor: 'pointer',
    transition: 'all 0.2s',
    opacity: isSelected ? 1 : 0.8,
  });

  const timelineIconStyles: React.CSSProperties = {
    position: 'absolute',
    left: '-28px',
    top: '4px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: colors.background.primary,
    border: `2px solid ${colors.primary.agriGreen}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    zIndex: 1,
  };

  const eventCardStyles: React.CSSProperties = {
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
    border: `1px solid ${colors.background.tertiary}`,
  };

  const photoButtonStyles: React.CSSProperties = {
    marginTop: spacing.xs,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '6px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    transition: 'all 0.2s',
  };

  const cameraModalStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: spacing.lg,
  };

  const cameraContentStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    padding: spacing.lg,
    maxWidth: '400px',
    width: '100%',
  };

  const cameraImageStyles: React.CSSProperties = {
    width: '100%',
    height: '300px',
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '80px',
    marginBottom: spacing.md,
  };

  const closeButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <RoleAppShell role="buyer" className="buyer-digital-twin-monitor-screen">
      {/* Header */}
      <div style={headerStyles}>
        {onBack && (
          <button
            style={backButtonStyles}
            onClick={onBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.primary;
            }}
            aria-label="Quay lại"
          >
            <Icon name="chevron-left" size="md" color={colors.text.primary} />
          </button>
        )}

        <button
          style={cameraButtonStyles}
          onClick={() => setShowCamera(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0052CC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
          }}
          aria-label="Xem camera"
        >
          <Icon name="camera" size="sm" color={colors.text.inverse} />
          <span>Camera</span>
        </button>
      </div>

      <div style={contentStyles}>
        {/* Order Info */}
        <div style={orderInfoStyles}>
          <div style={infoRowStyles}>
            <Text size="small" style={{ margin: 0, color: colors.text.secondary }}>
              Đơn hàng #{order.id}
            </Text>
            <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
              {order.orderDate}
            </Text>
          </div>
          <Text.Title size="small" style={{ margin: 0 }}>
            {order.productName}
          </Text.Title>
          <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
            {order.farmName} - {order.farmerName}
          </Text>
        </div>

        {/* Harvest Countdown */}
        <div style={harvestCountdownStyles}>
          <Text size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
            {order.daysRemaining} ngày
          </Text>
          <Text size="small" style={{ margin: 0 }}>
            đến ngày thu hoạch dự kiến ({order.expectedHarvest})
          </Text>
        </div>

        {/* Visual Stage - Mô hình Cây trồng 3D/2D */}
        <div style={visualStageStyles}>
          {/* Sensor Overlays - Nhãn dữ liệu nổi */}
          {sensorOverlays.map((overlay, index) => (
            <div key={index} style={overlayBubbleStyles(overlay.position)}>
              <span style={{ fontSize: '20px' }}>{overlay.icon}</span>
              <div style={bubbleTextStyles}>
                <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                  {overlay.label}
                </Text>
                <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                  {overlay.value}
                </Text>
              </div>
            </div>
          ))}

          {/* Digital Twin Viewer */}
          <DigitalTwinViewer
            plantModel={plantModel}
            environmentData={environmentData}
            growthStage={growthStage}
            health={health}
          />
        </div>

        {/* Timeline Section - Dòng thời gian Nhật ký */}
        <div style={timelineSectionStyles}>
          <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
            Nhật ký canh tác
          </Text.Title>

          <div style={timelineContainerStyles}>
            {/* Timeline vertical line */}
            <div style={timelineLineStyles} />

            {/* Timeline events */}
            {timelineEvents.map((event) => (
              <div
                key={event.id}
                style={timelineEventStyles(selectedEvent === event.id)}
                onClick={() => setSelectedEvent(event.id === selectedEvent ? null : event.id)}
              >
                {/* Event icon */}
                <div style={timelineIconStyles}>
                  <span>{event.icon}</span>
                </div>

                {/* Event card */}
                <div style={eventCardStyles}>
                  <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                    {event.date}
                  </Text>
                  <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                    {event.title}
                  </Text>
                  <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                    {event.description}
                  </Text>

                  {/* Photo button */}
                  {event.hasPhoto && (
                    <button
                      style={photoButtonStyles}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('View photo for event:', event.id);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#0052CC';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
                      }}
                    >
                      <span>{event.photoEmoji}</span>
                      <span>Xem ảnh</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sensor Chart Section — Phase 6.1 ────────────────────────────── */}
      <div style={{ padding: spacing.md, backgroundColor: colors.background.primary, marginTop: spacing.sm }}>
        <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
          Dữ liệu cảm biến 24 giờ
        </Text.Title>

        {/* Sensor selector */}
        <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.sm, overflowX: 'auto' }}>
          {(
            [
              { value: 'temperature' as SensorType, label: 'Nhiệt độ', color: colors.functional.alertRed },
              { value: 'humidity' as SensorType, label: 'Độ ẩm KK', color: colors.primary.zaloBlue },
              { value: 'light' as SensorType, label: 'Ánh sáng', color: '#FFCC00' },
              { value: 'soil_moisture' as SensorType, label: 'Ẩm đất', color: colors.primary.agriGreen },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedSensor(opt.value)}
              style={{
                padding: `2px ${spacing.sm}`,
                borderRadius: 99,
                border: `1px solid ${selectedSensor === opt.value ? opt.color : colors.background.secondary}`,
                backgroundColor: selectedSensor === opt.value ? `${opt.color}18` : colors.background.primary,
                color: selectedSensor === opt.value ? opt.color : colors.text.secondary,
                fontSize: fontSize.small,
                fontWeight: selectedSensor === opt.value ? fontWeight.semibold : fontWeight.regular,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isHistoryLoading ? (
          <div
            style={{
              height: 148, borderRadius: 8,
              backgroundColor: colors.background.secondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text size="small" style={{ color: colors.text.secondary }}>Đang tải…</Text>
          </div>
        ) : (
          <SensorLineChart
            data={historyData}
            title={
              selectedSensor === 'temperature' ? 'Nhiệt độ' :
              selectedSensor === 'humidity' ? 'Độ ẩm không khí' :
              selectedSensor === 'light' ? 'Ánh sáng' : 'Độ ẩm đất'
            }
            unit={historyData[0]?.unit}
            lineColor={
              selectedSensor === 'temperature' ? colors.functional.alertRed :
              selectedSensor === 'humidity' ? colors.primary.zaloBlue :
              selectedSensor === 'light' ? '#FFCC00' :
              colors.primary.agriGreen
            }
            width={328}
            height={148}
          />
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div style={cameraModalStyles} onClick={() => setShowCamera(false)}>
          <div style={cameraContentStyles} onClick={(e) => e.stopPropagation()}>
            <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.md }}>
              Camera trực tiếp
            </Text.Title>

            {/* Camera feed placeholder */}
            <div style={cameraImageStyles}>📹</div>

            <Text size="small" style={{ margin: 0, marginBottom: spacing.md, textAlign: 'center' }}>
              Ảnh mới nhất từ Farm Lab
            </Text>
            <Text size="xSmall" style={{ margin: 0, marginBottom: spacing.md, textAlign: 'center', color: colors.text.secondary }}>
              Cập nhật: 20/12/2024 14:30
            </Text>

            <button
              style={closeButtonStyles}
              onClick={() => setShowCamera(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </RoleAppShell>
  );
};

export default BuyerDigitalTwinMonitorScreen;
