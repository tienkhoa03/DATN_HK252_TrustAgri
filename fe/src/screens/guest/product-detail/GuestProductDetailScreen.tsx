/**
 * Guest Product Detail Screen
 * Chi tiết Nông sản - Chế độ xem thử (Preview Mode)
 * 
 * Requirements: FR-G03
 * 
 * Features:
 * - Thông tin sản phẩm: Hình ảnh, mô tả hương vị, quy cách đóng gói
 * - Địa chỉ vườn trồng (có bản đồ)
 * - Phần bị làm mờ (Blurred Section): Camera giám sát và Digital Twin
 * - Thông báo mở khóa: "Tính năng Giám sát vườn và Bản sao số chỉ dành cho thành viên đã đặt cọc"
 * - Khu vực Đánh giá (Reviews): Đánh giá 5 sao từ người mua trước
 * - Thanh tác vụ giới hạn: Nút "Đăng ký để mua ngay" thay vì "Đặt cọc"
 */

import React, { useState } from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface GuestProductDetailScreenProps {
  productId?: string;
  onBack?: () => void;
  onLogin?: () => void;
}

interface ProductImage {
  id: string;
  url: string;
  type: 'photo' | 'video';
  emoji: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

/**
 * Guest Product Detail Screen Component
 * Requirements: FR-G03
 */
export const GuestProductDetailScreen: React.FC<GuestProductDetailScreenProps> = ({
  productId = '1',
  onBack,
  onLogin,
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
    rating: 4.8,
    reviewCount: 127,
    description: 'Sầu riêng Monthong chất lượng cao, vị ngọt đậm đà, múi dày, hạt lép. Được trồng theo quy trình GlobalGAP, đảm bảo an toàn thực phẩm.',
    packaging: 'Đóng gói hộp carton chuyên dụng, trọng lượng 2.5-3.5 kg/trái',
  };

  // Image slider data
  const images: ProductImage[] = [
    { id: '1', url: '', type: 'photo', emoji: '🌳' },
    { id: '2', url: '', type: 'photo', emoji: '🌿' },
    { id: '3', url: '', type: 'photo', emoji: '🍃' },
  ];

  // Mock reviews
  const reviews: Review[] = [
    {
      id: '1',
      userName: 'Nguyễn Văn A',
      rating: 5,
      comment: 'Sầu riêng rất ngon, ngọt đậm, múi dày. Giao hàng đúng hẹn!',
      date: '15/12/2024',
    },
    {
      id: '2',
      userName: 'Trần Thị B',
      rating: 5,
      comment: 'Chất lượng tuyệt vời, đúng như mô tả. Sẽ mua lại!',
      date: '10/12/2024',
    },
    {
      id: '3',
      userName: 'Lê Văn C',
      rating: 4,
      comment: 'Sản phẩm tốt, giá hợp lý. Đóng gói cẩn thận.',
      date: '05/12/2024',
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
    paddingBottom: '100px', // Space for sticky footer
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

  // Blurred section styles
  const blurredSectionStyles: React.CSSProperties = {
    position: 'relative',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  };

  const blurredContentStyles: React.CSSProperties = {
    filter: 'blur(8px)',
    opacity: 0.5,
    pointerEvents: 'none',
    userSelect: 'none',
  };

  const blurredPlaceholderStyles: React.CSSProperties = {
    width: '100%',
    height: '200px',
    backgroundColor: colors.background.tertiary,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '64px',
  };

  const lockOverlayStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: spacing.lg,
    textAlign: 'center',
  };

  const lockIconStyles: React.CSSProperties = {
    fontSize: '48px',
    marginBottom: spacing.md,
  };

  const lockMessageStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    lineHeight: 1.5,
  };

  const unlockButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  // Review styles
  const reviewCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
    marginBottom: spacing.sm,
  };

  const reviewHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  };

  const reviewStarsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '2px',
  };

  // Sticky footer styles
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

  const priceStyles: React.CSSProperties = {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.primary.zaloBlue,
    marginBottom: spacing.sm,
  };

  const loginButtonStyles: React.CSSProperties = {
    width: '100%',
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name={index < rating ? 'star-filled' : 'star'}
        size="sm"
        color={index < rating ? colors.functional.warningYellow : colors.text.disabled}
      />
    ));
  };

  return (
    <Page className="guest-product-detail-screen">
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
        {/* Image Slider */}
        <div style={imageSliderStyles}>
          <div style={imageStyles}>{images[currentImageIndex].emoji}</div>

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

        {/* Product Info */}
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

          {/* Description */}
          <Text size="small" style={{ marginTop: spacing.md, lineHeight: 1.6 }}>
            {product.description}
          </Text>

          {/* Packaging */}
          <div style={{ marginTop: spacing.md }}>
            <Text size="small" style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}>
              Quy cách đóng gói:
            </Text>
            <Text size="small" style={{ color: colors.text.secondary }}>
              {product.packaging}
            </Text>
          </div>
        </div>

        {/* Farm Location */}
        <div style={sectionStyles}>
          <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
            Địa chỉ vườn trồng
          </Text.Title>

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
                Địa chỉ
              </Text>
              <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                {product.location}
              </Text>
            </div>
          </div>

          {/* Map placeholder */}
          <div style={mapPlaceholderStyles}>🗺️</div>
        </div>

        {/* Blurred Section - Camera Monitoring */}
        <div style={blurredSectionStyles}>
          <div style={blurredContentStyles}>
            <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
              Camera giám sát thời gian thực
            </Text.Title>
            <div style={blurredPlaceholderStyles}>📹</div>
          </div>

          {/* Lock Overlay */}
          <div style={lockOverlayStyles}>
            <div style={lockIconStyles}>🔒</div>
            <div style={lockMessageStyles}>
              Tính năng Giám sát vườn và Bản sao số chỉ dành cho thành viên đã đặt cọc
            </div>
            <button
              style={unlockButtonStyles}
              onClick={onLogin}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0052CC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
              }}
            >
              Đăng nhập để mở khóa
            </button>
          </div>
        </div>

        {/* Blurred Section - Digital Twin */}
        <div style={blurredSectionStyles}>
          <div style={blurredContentStyles}>
            <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
              Mô hình Bản sao số (Digital Twin)
            </Text.Title>
            <div style={blurredPlaceholderStyles}>🌱</div>
          </div>

          {/* Lock Overlay */}
          <div style={lockOverlayStyles}>
            <div style={lockIconStyles}>🔒</div>
            <div style={lockMessageStyles}>
              Tính năng Giám sát vườn và Bản sao số chỉ dành cho thành viên đã đặt cọc
            </div>
            <button
              style={unlockButtonStyles}
              onClick={onLogin}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0052CC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
              }}
            >
              Đăng nhập để mở khóa
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={sectionStyles}>
          <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.md }}>
            Đánh giá từ người mua ({reviews.length})
          </Text.Title>

          {reviews.map((review) => (
            <div key={review.id} style={reviewCardStyles}>
              <div style={reviewHeaderStyles}>
                <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                  {review.userName}
                </Text>
                <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                  {review.date}
                </Text>
              </div>

              <div style={{ ...reviewStarsStyles, marginBottom: spacing.xs }}>
                {renderStars(review.rating)}
              </div>

              <Text size="small" style={{ margin: 0, color: colors.text.secondary, lineHeight: 1.5 }}>
                {review.comment}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Footer - Limited Actions */}
      <div style={stickyFooterStyles}>
        <div style={priceStyles}>
          {product.price.toLocaleString('vi-VN')} VNĐ/kg
        </div>

        <button
          style={loginButtonStyles}
          onClick={onLogin}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0052CC';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
          }}
        >
          Đăng ký để mua ngay
        </button>
      </div>
    </Page>
  );
};

export default GuestProductDetailScreen;
