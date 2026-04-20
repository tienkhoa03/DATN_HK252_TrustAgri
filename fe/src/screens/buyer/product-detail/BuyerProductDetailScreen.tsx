/**
 * Buyer Product Detail & Pre-order Screen
 * Chi tiết Sản phẩm và Đặt cọc - Thuyết phục người mua qua dữ liệu minh bạch
 * 
 * Requirements: FR-U01, FR-G01
 * 
 * Features:
 * - Slider hình ảnh: Ảnh chụp thực tế sản phẩm và video vườn trồng
 * - Thông tin định danh: Tên Thương lái, Tên Nông hộ, Địa chỉ vườn (bản đồ nhỏ)
 * - Hồ sơ năng lực vườn: Tóm tắt lịch sử vụ mùa trước
 * - Thông số cam kết: Độ ngọt, Kích thước, Không dư lượng thuốc BVTV
 * - Khu vực Đặt hàng (Sticky Footer): Giá đặt cọc, Nút Đặt cọc, Nút Chat
 */

import React, { useState } from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface BuyerProductDetailScreenProps {
  productId?: string;
  onBack?: () => void;
}

interface ProductImage {
  id: string;
  url: string;
  type: 'photo' | 'video';
  emoji: string;
}

interface FarmHistory {
  season: string;
  yield: string;
  quality: string;
}

interface QualitySpec {
  label: string;
  value: string;
  icon: string;
}

/**
 * Buyer Product Detail & Pre-order Screen Component
 * Requirements: FR-U01, FR-G01
 */
export const BuyerProductDetailScreen: React.FC<BuyerProductDetailScreenProps> = ({
  productId = '1',
  onBack,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Mock product data
  const product = {
    id: productId,
    name: 'Sầu riêng Monthong',
    farmName: 'Farm Lab Tiến Khoa',
    farmerName: 'Tiến Khoa',
    traderName: 'Công ty TNHH Nông sản Xanh',
    location: 'Cái Bè, Tiền Giang',
    standard: 'GlobalGAP',
    price: 120000,
    depositPrice: 48000, // 40% deposit
    depositPercent: 40,
    rating: 4.8,
    reviewCount: 127,
  };

  // Image slider data
  const images: ProductImage[] = [
    { id: '1', url: '', type: 'photo', emoji: '🌳' },
    { id: '2', url: '', type: 'photo', emoji: '🌿' },
    { id: '3', url: '', type: 'video', emoji: '🎥' },
    { id: '4', url: '', type: 'photo', emoji: '🍃' },
  ];

  // Farm history data
  const farmHistory: FarmHistory[] = [
    {
      season: 'Vụ 2023',
      yield: '5 tấn',
      quality: 'Đạt chuẩn GlobalGAP',
    },
    {
      season: 'Vụ 2022',
      yield: '4.5 tấn',
      quality: 'Đạt chuẩn VietGAP',
    },
  ];

  // Quality specifications
  const qualitySpecs: QualitySpec[] = [
    { label: 'Độ ngọt', value: '≥ 28 Brix', icon: '🍯' },
    { label: 'Kích thước', value: '2.5 - 3.5 kg/trái', icon: '📏' },
    { label: 'Thuốc BVTV', value: 'Không dư lượng', icon: '✅' },
    { label: 'Thời gian thu hoạch', value: '15-20 ngày', icon: '📅' },
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

  const contentStyles: React.CSSProperties = {
    marginTop: '56px',
    paddingBottom: '140px', // Space for sticky footer (increased to prevent content overlap)
  };

  const imageSliderStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '300px',
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  };

  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '120px',
  };

  const imageDotsStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: spacing.md,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: spacing.xs,
  };

  const dotStyles = (isActive: boolean): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isActive ? colors.primary.zaloBlue : 'rgba(255, 255, 255, 0.5)',
    transition: 'all 0.2s',
    cursor: 'pointer',
  });

  const videoIndicatorStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: colors.text.inverse,
    borderRadius: '4px',
    fontSize: fontSize.small,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const sectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    marginBottom: spacing.sm,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    margin: 0,
    marginBottom: spacing.xs,
  };

  const ratingStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  };

  const standardBadgeStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    borderRadius: '4px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
  };

  const infoRowStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  };

  const mapPlaceholderStyles: React.CSSProperties = {
    width: '100%',
    height: '120px',
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    fontSize: '48px',
  };

  const historyCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
    marginBottom: spacing.sm,
  };

  const specGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.sm,
    marginTop: spacing.sm,
  };

  const specCardStyles: React.CSSProperties = {
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
    textAlign: 'center',
  };

  const stickyFooterStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderTop: `1px solid ${colors.background.tertiary}`,
    padding: spacing.md,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  };

  const priceRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  };

  const priceStyles: React.CSSProperties = {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.primary.zaloBlue,
  };

  const depositInfoStyles: React.CSSProperties = {
    fontSize: fontSize.caption,
    color: colors.text.secondary,
  };

  const buttonRowStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
  };

  const chatButtonStyles: React.CSSProperties = {
    flex: '0 0 auto',
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    backgroundColor: colors.background.secondary,
    border: `1px solid ${colors.background.tertiary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const depositButtonStyles: React.CSSProperties = {
    flex: 1,
    height: '48px',
    borderRadius: '8px',
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse,
    border: 'none',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  return (
    <Page className="buyer-product-detail-screen">
      {/* Header with back button */}
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
      </div>

      <div style={contentStyles}>
        {/* Image Slider - Slider hình ảnh */}
        <div style={imageSliderStyles}>
          <div style={imageStyles}>{images[currentImageIndex].emoji}</div>

          {/* Video indicator */}
          {images[currentImageIndex].type === 'video' && (
            <div style={videoIndicatorStyles}>
              <Icon name="play" size="sm" color={colors.text.inverse} />
              <span>Video vườn trồng</span>
            </div>
          )}

          {/* Image dots */}
          <div style={imageDotsStyles}>
            {images.map((_, index) => (
              <div
                key={index}
                style={dotStyles(index === currentImageIndex)}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Product Info - Thông tin sản phẩm */}
        <div style={sectionStyles}>
          <h1 style={titleStyles}>{product.name}</h1>

          {/* Rating */}
          <div style={ratingStyles}>
            <Icon name="star-filled" size="sm" color={colors.functional.warningYellow} />
            <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
              {product.rating}
            </Text>
            <Text size="small" style={{ margin: 0, color: colors.text.secondary }}>
              ({product.reviewCount} đánh giá)
            </Text>
          </div>

          {/* Standard badge */}
          <div style={standardBadgeStyles}>{product.standard}</div>
        </div>

        {/* Farm Identity - Thông tin định danh */}
        <div style={sectionStyles}>
          <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
            Thông tin định danh
          </Text.Title>

          <div style={infoRowStyles}>
            <Icon name="users" size="md" color={colors.text.secondary} />
            <div>
              <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                Thương lái
              </Text>
              <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                {product.traderName}
              </Text>
            </div>
          </div>

          <div style={infoRowStyles}>
            <Icon name="user" size="md" color={colors.text.secondary} />
            <div>
              <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                Nông hộ
              </Text>
              <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                {product.farmerName} - {product.farmName}
              </Text>
            </div>
          </div>

          <div style={infoRowStyles}>
            <Icon name="map-pin" size="md" color={colors.text.secondary} />
            <div>
              <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                Địa chỉ vườn
              </Text>
              <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                {product.location}
              </Text>
            </div>
          </div>

          {/* Map placeholder */}
          <div style={mapPlaceholderStyles}>🗺️</div>
        </div>

        {/* Farm History - Hồ sơ năng lực vườn */}
        <div style={sectionStyles}>
          <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
            Hồ sơ năng lực vườn
          </Text.Title>

          {farmHistory.map((history, index) => (
            <div key={index} style={historyCardStyles}>
              <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                {history.season}
              </Text>
              <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                Sản lượng: {history.yield}
              </Text>
              <Text size="xSmall" style={{ margin: 0, color: colors.primary.agriGreen }}>
                ✓ {history.quality}
              </Text>
            </div>
          ))}
        </div>

        {/* Quality Specs - Thông số cam kết */}
        <div style={sectionStyles}>
          <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
            Thông số cam kết
          </Text.Title>

          <div style={specGridStyles}>
            {qualitySpecs.map((spec, index) => (
              <div key={index} style={specCardStyles}>
                <div style={{ fontSize: '32px', marginBottom: spacing.xs }}>{spec.icon}</div>
                <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                  {spec.label}
                </Text>
                <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                  {spec.value}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Footer - Khu vực Đặt hàng */}
      <div style={stickyFooterStyles}>
        <div style={priceRowStyles}>
          <div>
            <div style={priceStyles}>
              {product.depositPrice.toLocaleString('vi-VN')} VNĐ
            </div>
            <div style={depositInfoStyles}>
              Đặt cọc {product.depositPercent}% • Giá gốc:{' '}
              {product.price.toLocaleString('vi-VN')} VNĐ/kg
            </div>
          </div>
        </div>

        <div style={buttonRowStyles}>
          {/* Chat button */}
          <button
            style={chatButtonStyles}
            onClick={() => console.log('Chat with trader')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.tertiary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.secondary;
            }}
            aria-label="Chat với thương lái"
          >
            <Icon name="message-circle" size="md" color={colors.primary.zaloBlue} />
          </button>

          {/* Deposit button */}
          <button
            style={depositButtonStyles}
            onClick={() => console.log('Place deposit')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0052CC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
            }}
          >
            Đặt cọc ngay
          </button>
        </div>
      </div>
    </Page>
  );
};

export default BuyerProductDetailScreen;
