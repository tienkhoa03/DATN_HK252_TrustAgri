/**
 * Buyer Product Detail Screen
 * Chi tiết sản phẩm — 3 tab + sticky CTA kép
 *
 * Requirements: FR-U01, FR-G01, NFR-U03
 */

import React, { useState, useEffect } from 'react';
import { Page, Text, useNavigate } from 'zmp-ui';
import { useParams } from 'react-router-dom';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  getProduct,
  cropEmoji,
  toMarketplaceViMessage,
  type ProductDto,
} from '../../../services/marketplaceService';
import { BuyerHeader } from '../components/BuyerHeader';
import { ProductDetailTabs } from './ProductDetailTabs';

export interface BuyerProductDetailScreenProps {
  productId?: string;
  onBack?: () => void;
  onOrder?: (productId: string) => void;
}

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
 * Buyer Product Detail Screen
 * Requirements: FR-U01, FR-G01, NFR-U03
 */
export const BuyerProductDetailScreen: React.FC<BuyerProductDetailScreenProps> = ({
  productId: productIdProp,
  onBack,
  onOrder,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const navigate = useNavigate();
  const routeParams = useParams<{ productId?: string }>();
  const productId = productIdProp ?? routeParams.productId ?? '';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(!!productId);
  const [error, setError] = useState<string | null>(productId ? null : 'Sản phẩm không tồn tại.');

  useEffect(() => {
    if (!productId) return;
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

  const contentStyles: React.CSSProperties = {
    paddingBottom: '140px',
  };

  const imageSliderStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '260px',
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  };

  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '100px',
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

  const primaryBtnStyles: React.CSSProperties = {
    flex: 1,
    height: '48px',
    borderRadius: '8px',
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    border: 'none',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '44px',
  };

  const secondaryBtnStyles: React.CSSProperties = {
    flex: 1,
    height: '48px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: colors.primary.zaloBlue,
    border: `2px solid ${colors.primary.zaloBlue}`,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '44px',
  };

  // ── Render helpers ───────────────────────────────────────────────────────────

  const renderStickyFooter = (p: ProductDto) => {
    const inStock = (p.stockQuantity ?? 0) > 0 || p.status === 'active';

    return (
      <div style={stickyFooterStyles}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        }}>
          <div>
            <div style={{ fontSize: fontSize.h1, fontWeight: fontWeight.bold, color: colors.primary.zaloBlue }}>
              {p.price.toLocaleString('vi-VN')} VNĐ
            </div>
            <div style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>
              Đơn vị: {p.unit}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <button
            type="button"
            style={{ ...primaryBtnStyles, flex: 1 }}
            disabled={!inStock}
            onClick={() => {
              if (onOrder) {
                onOrder(p.id);
                return;
              }
              // Tạo yêu cầu mua từ sản phẩm này
              navigate(`/buyer/sourcing?action=create&productId=${encodeURIComponent(p.id)}`);
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primary.agriGreenDark; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.primary.agriGreen; }}
          >
            Gửi yêu cầu mua
          </button>
          <button
            type="button"
            style={{ ...secondaryBtnStyles, flex: 1 }}
            onClick={() => {
              navigate(`/buyer?traderId=${encodeURIComponent(p.traderId)}`);
            }}
          >
            Xem thương lái
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={contentStyles}>
          <div style={{ ...imageSliderStyles, backgroundColor: colors.background.secondary }} />
          <div style={{ padding: spacing.md }}>
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

    const fallbackEmoji = cropEmoji(product.cropType);
    const galleryImages = product.images && product.images.length > 0 ? product.images : [];
    const activeImage = galleryImages[currentImageIndex] ?? null;

    return (
      <>
        <div style={contentStyles}>
          {/* Image Slider */}
          <div style={imageSliderStyles}>
            {activeImage && activeImage.startsWith('http') ? (
              <img
                src={activeImage}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div style={imageStyles}>{activeImage ?? fallbackEmoji}</div>
            )}

            {galleryImages.length > 1 && (
              <div style={imageDotsStyles}>
                {galleryImages.map((_, index) => (
                  <div
                    key={index}
                    style={dotStyles(index === currentImageIndex)}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product name + price summary above tabs */}
          <div style={{
            padding: `${spacing.md} ${spacing.md} 0`,
            backgroundColor: colors.background.primary,
            marginBottom: spacing.sm,
          }}>
            <h1 style={{ fontSize: fontSize.h1, fontWeight: fontWeight.bold, margin: 0, marginBottom: spacing.xs }}>
              {product.name}
            </h1>
            <div style={{ fontSize: fontSize.h2, fontWeight: fontWeight.bold, color: colors.primary.zaloBlue, marginBottom: spacing.xs }}>
              {product.price.toLocaleString('vi-VN')} VNĐ/{product.unit}
            </div>
            <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
              {product.cropType}
            </Text>
          </div>

          {/* 3-Tab Panel */}
          <ProductDetailTabs product={product} />
        </div>

        {/* Sticky Footer CTA */}
        {renderStickyFooter(product)}
      </>
    );
  };

  return (
    <Page className="buyer-product-detail-screen">
      {/* Header */}
      <BuyerHeader
        title={product?.name ?? 'Chi tiết sản phẩm'}
        showSearch={false}
      />

      {renderContent()}
    </Page>
  );
};

export default BuyerProductDetailScreen;
