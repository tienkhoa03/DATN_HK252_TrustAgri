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

import React, { useState, useEffect } from 'react';
import { Page, Text, useSnackbar } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import {
  getProduct,
  standardLabel,
  cropEmoji,
  toMarketplaceViMessage,
  type ProductDto,
} from '../../../services/marketplaceService';

export interface BuyerProductDetailScreenProps {
  productId?: string;
  onBack?: () => void;
  onOrder?: (productId: string) => void;
}

const DEPOSIT_PERCENT = 40;

// Static quality specs (UI-only, không có trong ProductDto)
const QUALITY_SPECS = [
  { label: 'Độ ngọt', value: '≥ 28 Brix', icon: '🍯' },
  { label: 'Kích thước', value: '2.5 – 3.5 kg/trái', icon: '📏' },
  { label: 'Thuốc BVTV', value: 'Không dư lượng', icon: '✅' },
  { label: 'Thu hoạch', value: '15–20 ngày', icon: '📅' },
];

const FARM_HISTORY = [
  { season: 'Vụ 2024', yield: '5.2 tấn', quality: 'Đạt chuẩn GlobalGAP' },
  { season: 'Vụ 2023', yield: '4.8 tấn', quality: 'Đạt chuẩn VietGAP' },
];

const IMAGE_EMOJIS = ['🌳', '🌿', '🎥', '🍃'];

const SkeletonBlock: React.FC<{ height?: number | string }> = ({ height = 16 }) => (
  <div
    style={{
      height,
      backgroundColor: colors.background.secondary,
      borderRadius: '6px',
      marginBottom: spacing.xs,
      animation: 'pulse 1.5s ease-in-out infinite',
    }}
  />
);

/**
 * Buyer Product Detail & Pre-order Screen Component
 * Requirements: FR-U01, FR-G01
 */
export const BuyerProductDetailScreen: React.FC<BuyerProductDetailScreenProps> = ({
  productId = 'prod-001',
  onBack,
  onOrder,
}) => {
  const { openSnackbar } = useSnackbar();
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
    backgroundColor: 'rgba(255,255,255,0.95)',
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
    paddingBottom: '140px',
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
    backgroundColor: isActive ? colors.primary.zaloBlue : 'rgba(255,255,255,0.5)',
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
    boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
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

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) {
      return (
        <div style={contentStyles}>
          <div style={{ ...imageSliderStyles, backgroundColor: colors.background.secondary }} />
          <div style={sectionStyles}>
            <SkeletonBlock height={28} />
            <SkeletonBlock height={14} />
            <SkeletonBlock height={14} />
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

    const depositPrice = Math.round(product.price * (DEPOSIT_PERCENT / 100));
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

            {currentImageIndex === 2 && (
              <div
                style={{
                  position: 'absolute',
                  top: spacing.md,
                  right: spacing.md,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: colors.text.inverse,
                  borderRadius: '4px',
                  fontSize: fontSize.small,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                <Icon name="play" size="sm" color={colors.text.inverse} />
                <span>Video vườn trồng</span>
              </div>
            )}

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
          </div>

          {/* Farm Identity */}
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
                  {product.traderId}
                </Text>
              </div>
            </div>

            <div style={infoRowStyles}>
              <Icon name="map-pin" size="md" color={colors.text.secondary} />
              <div>
                <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                  Vườn nguồn
                </Text>
                <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
                  {product.farmId ?? 'Chưa gán vườn'}
                </Text>
              </div>
            </div>

            <div style={mapPlaceholderStyles}>🗺️</div>
          </div>

          {/* Farm History */}
          <div style={sectionStyles}>
            <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
              Hồ sơ năng lực vườn
            </Text.Title>
            {FARM_HISTORY.map((h, i) => (
              <div key={i} style={historyCardStyles}>
                <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                  {h.season}
                </Text>
                <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>
                  Sản lượng: {h.yield}
                </Text>
                <Text size="xSmall" style={{ margin: 0, color: colors.primary.agriGreen }}>
                  ✓ {h.quality}
                </Text>
              </div>
            ))}
          </div>

          {/* Quality Specs */}
          <div style={sectionStyles}>
            <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
              Thông số cam kết
            </Text.Title>
            <div style={specGridStyles}>
              {QUALITY_SPECS.map((spec, i) => (
                <div key={i} style={specCardStyles}>
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

        {/* Sticky Footer */}
        <div style={stickyFooterStyles}>
          <div style={priceRowStyles}>
            <div>
              <div style={priceStyles}>
                {depositPrice.toLocaleString('vi-VN')} VNĐ
              </div>
              <div style={depositInfoStyles}>
                Đặt cọc {DEPOSIT_PERCENT}% • Giá gốc:{' '}
                {product.price.toLocaleString('vi-VN')} VNĐ/{product.unit}
              </div>
            </div>
          </div>

          <div style={buttonRowStyles}>
            <button
              style={chatButtonStyles}
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

            <button
              style={depositButtonStyles}
              onClick={() => onOrder?.(product.id)}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0052CC'; }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
              }}
            >
              Đặt cọc ngay
            </button>
          </div>
        </div>
      </>
    );
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
        {product && (
          <Text
            size="small"
            style={{ margin: '0 auto', fontWeight: fontWeight.semibold, flex: 1, textAlign: 'center' }}
          >
            {product.name}
          </Text>
        )}
      </div>

      {renderContent()}
    </Page>
  );
};

export default BuyerProductDetailScreen;
