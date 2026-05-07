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

import React, { useState, useEffect } from 'react';
import { Page, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  getProduct,
  standardLabel,
  cropEmoji,
  toMarketplaceViMessage,
  type ProductDto,
} from '../../../services/marketplaceService';

export interface GuestProductDetailScreenProps {
  productId?: string;
  onBack?: () => void;
  onLogin?: () => void;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

const IMAGE_EMOJIS = ['🌳', '🌿', '🍃'];

// Reviews removed — sẽ load từ API khi BE thêm endpoint /products/:id/reviews.

const SkeletonBlock: React.FC<{ height?: number | string; width?: string }> = ({
  height = 16,
  width = '100%',
}) => (
  <div
    style={{
      height,
      width,
      backgroundColor: colors.background.secondary,
      borderRadius: '6px',
      marginBottom: spacing.xs,
    }}
  />
);

/**
 * Guest Product Detail Screen Component
 * Requirements: FR-G03
 */
export const GuestProductDetailScreen: React.FC<GuestProductDetailScreenProps> = ({
  productId = 'prod-001',
  onBack,
  onLogin,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProduct(productId)
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = toMarketplaceViMessage(err, 'detail');
          setError(msg);
          setLoading(false);
          openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
        }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // ── Styles ──────────────────────────────────────────────────────────────────

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
    paddingBottom: '100px',
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

  const reviewCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
    marginBottom: spacing.sm,
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

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Icon
        key={i}
        name={i < rating ? 'star-filled' : 'star'}
        size="sm"
        color={i < rating ? colors.functional.warningYellow : colors.text.disabled}
      />
    ));

  const renderLockSection = (icon: string, label: string) => (
    <div style={blurredSectionStyles}>
      <div style={blurredContentStyles}>
        <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
          {label}
        </Text.Title>
        <div style={blurredPlaceholderStyles}>{icon}</div>
      </div>
      <div style={lockOverlayStyles}>
        <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🔒</div>
        <div style={lockMessageStyles}>
          Tính năng Giám sát vườn và Bản sao số chỉ dành cho thành viên đã đặt cọc
        </div>
        <button
          style={unlockButtonStyles}
          onClick={onLogin}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0052CC'; }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
          }}
        >
          Đăng nhập để mở khóa
        </button>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderBody = () => {
    if (loading) {
      return (
        <div style={contentStyles}>
          <div style={{ ...imageSliderStyles, backgroundColor: colors.background.secondary }} />
          <div style={sectionStyles}>
            <SkeletonBlock height={28} />
            <SkeletonBlock height={14} />
            <SkeletonBlock height={14} width="60%" />
          </div>
        </div>
      );
    }

    if (error || !product) {
      return (
        <div style={{ ...contentStyles, padding: spacing.lg, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>⚠️</div>
          <Text size="small" style={{ color: colors.functional.alertRed }}>
            {error ?? 'Sản phẩm không tồn tại.'}
          </Text>
        </div>
      );
    }

    const emoji = product.images[0] ?? cropEmoji(product.cropType);
    const std = standardLabel(product.standardCode);

    return (
      <>
        <div style={contentStyles}>
          {/* Image Slider */}
          <div style={imageSliderStyles}>
            <div style={imageStyles}>
              {IMAGE_EMOJIS[currentImageIndex] ?? emoji}
            </div>
            <div style={imageDotsStyles}>
              {IMAGE_EMOJIS.map((_, index) => (
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                marginBottom: spacing.sm,
              }}
            >
              <Icon name="star-filled" size="sm" color={colors.functional.warningYellow} />
              <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                4.8
              </Text>
              <Text size="small" style={{ margin: 0, color: colors.text.secondary }}>
                (127 đánh giá)
              </Text>
            </div>

            {std && <div style={standardBadgeStyles}>{std}</div>}

            {product.description && (
              <Text size="small" style={{ marginTop: spacing.md, lineHeight: 1.6 }}>
                {product.description}
              </Text>
            )}

            <div style={{ marginTop: spacing.md }}>
              <Text
                size="small"
                style={{ fontWeight: fontWeight.semibold, marginBottom: spacing.xs }}
              >
                Quy cách đóng gói:
              </Text>
              <Text size="small" style={{ color: colors.text.secondary }}>
                Đóng gói hộp carton chuyên dụng, đơn vị: {product.unit}
              </Text>
            </div>
          </div>

          {/* Farm Location */}
          <div style={sectionStyles}>
            <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
              Địa chỉ vườn trồng
            </Text.Title>

            <div style={infoRowStyles}>
              <Icon name="map-pin" size="md" color={colors.text.secondary} />
              <div>
                <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                  Vườn nguồn
                </Text>
                <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                  {product.farmId ?? 'Chưa có thông tin'}
                </Text>
              </div>
            </div>

            <div style={mapPlaceholderStyles}>🗺️</div>
          </div>

          {/* Blurred Sections */}
          {renderLockSection('📹', 'Camera giám sát thời gian thực')}
          {renderLockSection('🌱', 'Mô hình Bản sao số (Digital Twin)')}

          {/* Reviews — ẩn vì chưa có API đánh giá. Có thể bật lại khi BE thêm /products/:id/reviews. */}
        </div>

        {/* Sticky Footer */}
        <div style={stickyFooterStyles}>
          <div style={priceStyles}>
            {product.price.toLocaleString('vi-VN')} VNĐ/{product.unit}
          </div>

          <button
            style={loginButtonStyles}
            onClick={onLogin}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0052CC'; }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
            }}
          >
            Đăng ký để mua ngay
          </button>
        </div>
      </>
    );
  };

  return (
    <Page className="guest-product-detail-screen">
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
        {product && (
          <Text
            size="small"
            style={{ flex: 1, textAlign: 'center', fontWeight: fontWeight.semibold, margin: 0 }}
          >
            {product.name}
          </Text>
        )}
      </div>

      {renderBody()}
    </Page>
  );
};

export default GuestProductDetailScreen;
