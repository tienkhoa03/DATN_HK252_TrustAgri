/**
 * DigitalTwinViewer Component
 * Component hiển thị mô hình Digital Twin của cây trồng với growth stage và health status
 * 
 * Requirements: 6.1-6.4, 21.1, 21.2
 */

import React, { useEffect, useState } from 'react';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize, fontWeight } from '../../tokens/typography';

export type GrowthStage = 'seedling' | 'vegetative' | 'flowering' | 'fruiting';
export type HealthStatus = 'healthy' | 'stressed' | 'diseased';

export interface PlantModel {
  id: string;
  name: string;
  type: string;
}

export interface EnvironmentData {
  temperature: number;
  humidity: number;
  light: number;
}

export interface DigitalTwinViewerProps {
  plantModel: PlantModel;
  environmentData: EnvironmentData;
  growthStage: GrowthStage;
  health: HealthStatus;
  className?: string;
  'aria-label'?: string;
}

/**
 * DigitalTwinViewer Component
 * Hiển thị mô hình trực quan của cây trồng với màu sắc và animation theo trạng thái
 * 
 * Requirements:
 * - 6.1: Ưu tiên biểu đồ và Digital Twin thay vì bảng số liệu
 * - 6.2: Đồng bộ hóa trạng thái cây thành hình ảnh trực quan
 * - 6.3: Màu sắc lá phản ánh trạng thái sinh trưởng
 * - 6.4: Sử dụng tông màu xanh lá đặc trưng
 * - 21.1: Hiển thị mô hình Digital Twin
 * - 21.2: Cập nhật màu sắc và hình ảnh khi trạng thái thay đổi
 */
export const DigitalTwinViewer: React.FC<DigitalTwinViewerProps> = ({
  plantModel,
  environmentData,
  growthStage,
  health,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousStage, setPreviousStage] = useState<GrowthStage>(growthStage);
  const [previousHealth, setPreviousHealth] = useState<HealthStatus>(health);

  // Trigger animation on state change - Requirement 6.2
  useEffect(() => {
    if (growthStage !== previousStage || health !== previousHealth) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPreviousStage(growthStage);
        setPreviousHealth(health);
      }, 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [growthStage, health, previousStage, previousHealth]);

  // Health status color mapping - Requirement 6.3
  const healthColors: Record<HealthStatus, string> = {
    healthy: colors.primary.agriGreen,    // Green for healthy - Requirement 6.4
    stressed: colors.functional.warningYellow, // Yellow for stressed
    diseased: '#8B4513',                   // Brown for diseased
  };

  // Growth stage visualization parameters
  const stageParams: Record<GrowthStage, {
    height: number;
    leafCount: number;
    leafSize: number;
    stemThickness: number;
    hasFlowers: boolean;
    hasFruits: boolean;
  }> = {
    seedling: {
      height: 60,
      leafCount: 2,
      leafSize: 20,
      stemThickness: 3,
      hasFlowers: false,
      hasFruits: false,
    },
    vegetative: {
      height: 120,
      leafCount: 6,
      leafSize: 30,
      stemThickness: 5,
      hasFlowers: false,
      hasFruits: false,
    },
    flowering: {
      height: 150,
      leafCount: 8,
      leafSize: 35,
      stemThickness: 6,
      hasFlowers: true,
      hasFruits: false,
    },
    fruiting: {
      height: 160,
      leafCount: 10,
      leafSize: 35,
      stemThickness: 7,
      hasFlowers: false,
      hasFruits: true,
    },
  };

  const currentParams = stageParams[growthStage];
  const leafColor = healthColors[health];

  // Growth stage labels
  const stageLabels: Record<GrowthStage, string> = {
    seedling: 'Giai đoạn mầm',
    vegetative: 'Giai đoạn sinh trưởng',
    flowering: 'Giai đoạn ra hoa',
    fruiting: 'Giai đoạn kết trái',
  };

  // Health status labels
  const healthLabels: Record<HealthStatus, string> = {
    healthy: 'Khỏe mạnh',
    stressed: 'Căng thẳng',
    diseased: 'Bệnh',
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    minHeight: '300px',
    gap: spacing.md,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    textAlign: 'center',
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    margin: 0,
    textAlign: 'center',
  };

  const plantContainerStyles: React.CSSProperties = {
    position: 'relative',
    width: '200px',
    height: `${currentParams.height + 40}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    transition: isAnimating ? 'all 0.6s ease-in-out' : 'none',
    transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
  };

  const statusBadgeStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.background.secondary,
    borderRadius: '20px',
    border: `2px solid ${leafColor}`,
  };

  const statusDotStyles: React.CSSProperties = {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: leafColor,
  };

  const statusTextStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    margin: 0,
  };

  const infoGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.md,
  };

  const infoItemStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
  };

  const infoLabelStyles: React.CSSProperties = {
    fontSize: fontSize.small,
    fontWeight: fontWeight.regular,
    color: colors.text.secondary,
    margin: 0,
  };

  const infoValueStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
  };

  // Render plant SVG based on growth stage and health
  const renderPlant = () => {
    const svgWidth = 200;
    const svgHeight = currentParams.height + 40;
    const centerX = svgWidth / 2;
    const groundY = svgHeight - 20;

    return (
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          transition: isAnimating ? 'all 0.6s ease-in-out' : 'none',
        }}
      >
        {/* Ground */}
        <rect
          x="0"
          y={groundY}
          width={svgWidth}
          height="20"
          fill={colors.functional.neutralGray}
          rx="4"
        />

        {/* Stem */}
        <line
          x1={centerX}
          y1={groundY}
          x2={centerX}
          y2={groundY - currentParams.height}
          stroke={colors.primary.agriGreen}
          strokeWidth={currentParams.stemThickness}
          strokeLinecap="round"
          style={{
            transition: isAnimating ? 'all 0.6s ease-in-out' : 'none',
          }}
        />

        {/* Leaves */}
        {Array.from({ length: currentParams.leafCount }).map((_, index) => {
          const yPosition = groundY - (currentParams.height / currentParams.leafCount) * (index + 1);
          const isLeft = index % 2 === 0;
          const xOffset = isLeft ? -currentParams.leafSize : currentParams.leafSize;
          
          return (
            <ellipse
              key={`leaf-${index}`}
              cx={centerX + xOffset / 2}
              cy={yPosition}
              rx={currentParams.leafSize}
              ry={currentParams.leafSize / 2}
              fill={leafColor}
              opacity={isAnimating ? 0.8 : 1}
              style={{
                transition: isAnimating ? 'all 0.6s ease-in-out' : 'none',
                transformOrigin: `${centerX}px ${yPosition}px`,
              }}
            />
          );
        })}

        {/* Flowers */}
        {currentParams.hasFlowers && Array.from({ length: 3 }).map((_, index) => {
          const yPosition = groundY - currentParams.height + (index * 20);
          const xOffset = (index - 1) * 30;
          
          return (
            <g key={`flower-${index}`}>
              {/* Flower petals */}
              {Array.from({ length: 5 }).map((_, petalIndex) => {
                const angle = (petalIndex * 72 * Math.PI) / 180;
                const petalX = centerX + xOffset + Math.cos(angle) * 8;
                const petalY = yPosition + Math.sin(angle) * 8;
                
                return (
                  <circle
                    key={`petal-${petalIndex}`}
                    cx={petalX}
                    cy={petalY}
                    r="5"
                    fill="#FFD700"
                    opacity={isAnimating ? 0.8 : 1}
                    style={{
                      transition: isAnimating ? 'all 0.6s ease-in-out' : 'none',
                    }}
                  />
                );
              })}
              {/* Flower center */}
              <circle
                cx={centerX + xOffset}
                cy={yPosition}
                r="4"
                fill="#FFA500"
              />
            </g>
          );
        })}

        {/* Fruits */}
        {currentParams.hasFruits && Array.from({ length: 4 }).map((_, index) => {
          const yPosition = groundY - currentParams.height + (index * 25);
          const xOffset = (index % 2 === 0 ? -1 : 1) * 25;
          
          return (
            <circle
              key={`fruit-${index}`}
              cx={centerX + xOffset}
              cy={yPosition}
              r="10"
              fill="#FF6347"
              opacity={isAnimating ? 0.8 : 1}
              style={{
                transition: isAnimating ? 'all 0.6s ease-in-out' : 'none',
              }}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div
      className={`digital-twin-viewer digital-twin-${growthStage} digital-twin-${health} ${className}`}
      style={containerStyles}
      role="region"
      aria-label={ariaLabel || `Digital Twin: ${plantModel.name} - ${stageLabels[growthStage]} - ${healthLabels[health]}`}
      data-growth-stage={growthStage}
      data-health={health}
      data-animating={isAnimating}
    >
      {/* Header */}
      <div style={headerStyles}>
        <h3 style={titleStyles}>{plantModel.name}</h3>
        <p style={subtitleStyles}>{plantModel.type}</p>
      </div>

      {/* Plant Visualization */}
      <div style={plantContainerStyles}>
        {renderPlant()}
      </div>

      {/* Status Badge */}
      <div style={statusBadgeStyles}>
        <div style={statusDotStyles} aria-hidden="true" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={statusTextStyles}>{stageLabels[growthStage]}</span>
          <span style={{ ...statusTextStyles, color: colors.text.secondary }}>
            {healthLabels[health]}
          </span>
        </div>
      </div>

      {/* Environment Info */}
      <div style={infoGridStyles}>
        <div style={infoItemStyles}>
          <span style={infoLabelStyles}>Nhiệt độ</span>
          <span style={infoValueStyles}>{environmentData.temperature}°C</span>
        </div>
        <div style={infoItemStyles}>
          <span style={infoLabelStyles}>Độ ẩm</span>
          <span style={infoValueStyles}>{environmentData.humidity}%</span>
        </div>
        <div style={infoItemStyles}>
          <span style={infoLabelStyles}>Ánh sáng</span>
          <span style={infoValueStyles}>{environmentData.light}</span>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinViewer;
