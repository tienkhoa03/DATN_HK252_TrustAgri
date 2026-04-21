/**
 * Buyer Marketplace Home Screen
 * Trang chủ và Chợ Nông sản - Điểm chạm đầu tiên để tìm kiếm sản phẩm
 *
 * Requirements: FR-U01, FR-U02, FR-G02, 20.1-20.4
 *
 * Features:
 * - Thanh tìm kiếm: Tìm theo tên nông sản hoặc tên Farm Lab
 * - Banner Tin tức: Slide chạy ngang hiển thị dự báo giá và tiêu điểm nông vụ
 * - Nút tác vụ nhanh: Nút Đăng nhu cầu mua (Floating Action Button)
 * - Danh sách Nông sản: Lưới 2 cột với thẻ sản phẩm
 */

import React, { useState, useEffect } from 'react';
import { Page, Text, useSnackbar } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import {
  listProducts,
  standardLabel,
  cropEmoji,
  toMarketplaceViMessage,
  type ProductDto,
} from '../../../services/marketplaceService';

export interface BuyerMarketplaceScreenProps {
  buyerName?: string;
  onProductPress?: (productId: string) => void;
  onPostBuyingRequest?: () => void;
}

interface NewsItem {
  id: string;
  title: string;
  type: 'price-forecast' | 'farming-highlight';
  image: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: '1',
    title: 'Dự báo giá Bưởi Da Xanh tăng 15% tuần tới',
    type: 'price-forecast',
    image: '📊',
  },
  {
    id: '2',
    title: 'Tiêu điểm: Vụ Sầu riêng Monthong đạt năng suất cao',
    type: 'farming-highlight',
    image: '🌟',
  },
  {
    id: '3',
    title: 'Giá Xoài Cát Chu ổn định trong tháng 12',
    type: 'price-forecast',
    image: '🥭',
  },
];

// Skeleton card placeholder
const SkeletonCard: React.FC = () => (
  <div
    style={{
      backgroundColor: colors.background.primary,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}
  >
    <div
      style={{
        width: '100%',
        height: '120px',
        backgroundColor: colors.background.secondary,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
    <div style={{ padding: spacing.sm }}>
      {[70, 50, 40].map((w, i) => (
        <div
          key={i}
          style={{
            height: '12px',
            width: `${w}%`,
            backgroundColor: colors.background.secondary,
            borderRadius: '6px',
            marginBottom: spacing.xs,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  </div>
);

/**
 * Buyer Marketplace Home Screen Component
 * Requirements: FR-U01, FR-U02, FR-G02, 20.1-20.4
 */
export const BuyerMarketplaceScreen: React.FC<BuyerMarketplaceScreenProps> = ({
  buyerName = 'Người mua',
  onProductPress,
  onPostBuyingRequest,
}) => {
  const { openSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load products on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProducts({ status: 'active' })
      .then((res) => {
        if (!cancelled) {
          setProducts(res.items);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = toMarketplaceViMessage(err, 'list');
          setError(msg);
          setLoading(false);
          openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
        }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client-side filter based on search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ── Styles ──────────────────────────────────────────────────────────────────

  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const searchBarStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  };

  const searchInputWrapperStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const searchIconStyles: React.CSSProperties = {
    position: 'absolute',
    left: spacing.md,
    pointerEvents: 'none',
    zIndex: 1,
  };

  const searchInputStyles: React.CSSProperties = {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md} ${spacing.sm} 44px`,
    backgroundColor: colors.background.secondary,
    border: 'none',
    borderRadius: '8px',
    fontSize: fontSize.body,
  };

  const newsBannerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  };

  const newsCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.primary.zaloBlue,
    borderRadius: '12px',
    color: colors.text.inverse,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  };

  const newsDotsStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  };

  const dotStyles = (isActive: boolean): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isActive ? colors.primary.zaloBlue : colors.background.tertiary,
    transition: 'all 0.2s',
    cursor: 'pointer',
  });

  const productGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: '80px',
  };

  const productCardStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  const productImageStyles: React.CSSProperties = {
    width: '100%',
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    fontSize: '48px',
  };

  const productInfoStyles: React.CSSProperties = {
    padding: spacing.sm,
  };

  const standardBadgeStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: `2px ${spacing.sm}`,
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    borderRadius: '4px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  };

  const priceStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.primary.zaloBlue,
    marginTop: spacing.xs,
  };

  const buttonStyles = (available: boolean): React.CSSProperties => ({
    width: '100%',
    padding: spacing.sm,
    backgroundColor: available ? colors.primary.zaloBlue : colors.background.tertiary,
    color: available ? colors.text.inverse : colors.text.disabled,
    border: 'none',
    borderRadius: '6px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: available ? 'pointer' : 'not-allowed',
    marginTop: spacing.sm,
    transition: 'all 0.2s',
  });

  const fabStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: spacing.lg,
    right: spacing.lg,
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    border: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    transition: 'transform 0.2s',
  };

  const contentStyles: React.CSSProperties = {
    paddingBottom: spacing.xl,
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderProductGrid = () => {
    if (loading) {
      return (
        <div style={productGridStyles}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: spacing.lg, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>⚠️</div>
          <Text size="small" style={{ color: colors.functional.alertRed }}>
            {error}
          </Text>
        </div>
      );
    }

    if (filteredProducts.length === 0) {
      return (
        <div style={{ padding: spacing.lg, textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🔍</div>
          <Text size="small" style={{ color: colors.text.secondary }}>
            Không tìm thấy sản phẩm phù hợp.
          </Text>
        </div>
      );
    }

    const available = (p: ProductDto) =>
      p.status === 'active' && (p.stockQuantity === undefined || p.stockQuantity > 0);

    return (
      <div style={productGridStyles}>
        {filteredProducts.map((product) => {
          const isAvailable = available(product);
          const std = standardLabel(product.standardCode);
          const emoji = product.images[0] ?? cropEmoji(product.cropType);
          return (
            <div
              key={product.id}
              style={productCardStyles}
              onClick={() => onProductPress?.(product.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={productImageStyles}>{emoji}</div>

              <div style={productInfoStyles}>
                <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                  {product.name}
                </Text.Title>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  {product.cropType}
                </Text>

                {std && <div style={standardBadgeStyles}>{std}</div>}

                <div style={priceStyles}>
                  {product.price.toLocaleString('vi-VN')} VNĐ/{product.unit}
                </div>

                <button
                  style={buttonStyles(isAvailable)}
                  disabled={!isAvailable}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isAvailable) onProductPress?.(product.id);
                  }}
                  onMouseEnter={(e) => {
                    if (isAvailable) e.currentTarget.style.backgroundColor = '#0052CC';
                  }}
                  onMouseLeave={(e) => {
                    if (isAvailable)
                      e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
                  }}
                >
                  {isAvailable ? 'Mua ngay' : 'Hết hàng'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Page className="buyer-marketplace-screen">
      <div style={contentStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
            Xin chào,
          </Text>
          <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
            {buyerName}
          </Text.Title>
        </div>

        {/* Search Bar */}
        <div style={searchBarStyles}>
          <div style={searchInputWrapperStyles}>
            <div style={searchIconStyles}>
              <Icon name="search" size="md" color={colors.text.secondary} />
            </div>
            <input
              type="text"
              placeholder="Tìm nông sản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyles}
            />
          </div>
        </div>

        {/* News Banner */}
        <div style={newsBannerStyles}>
          <div
            style={newsCardStyles}
            onClick={() => {/* navigate to news */ }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div style={{ fontSize: '32px', marginBottom: spacing.sm }}>
              {NEWS_ITEMS[currentNewsIndex].image}
            </div>
            <Text.Title
              size="small"
              style={{ margin: 0, color: colors.text.inverse, fontWeight: fontWeight.semibold }}
            >
              {NEWS_ITEMS[currentNewsIndex].title}
            </Text.Title>
            <Text
              size="xSmall"
              style={{ color: colors.text.inverse, marginTop: spacing.xs, opacity: 0.9 }}
            >
              {NEWS_ITEMS[currentNewsIndex].type === 'price-forecast'
                ? '📊 Dự báo giá'
                : '🌾 Tiêu điểm nông vụ'}
            </Text>
          </div>

          <div style={newsDotsStyles}>
            {NEWS_ITEMS.map((_, index) => (
              <div
                key={index}
                style={dotStyles(index === currentNewsIndex)}
                onClick={() => setCurrentNewsIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Section title */}
        <div style={{ padding: `${spacing.md} ${spacing.md} 0` }}>
          <Text.Title size="small" style={{ margin: 0 }}>
            {loading ? 'Đang tải...' : `Nông sản (${filteredProducts.length})`}
          </Text.Title>
        </div>

        {/* Product Grid */}
        {renderProductGrid()}

        {/* Floating Action Button */}
        <button
          style={fabStyles}
          onClick={onPostBuyingRequest}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          aria-label="Đăng nhu cầu mua"
        >
          <Icon name="plus-circle" size="lg" color={colors.text.inverse} />
        </button>
      </div>
    </Page>
  );
};

export default BuyerMarketplaceScreen;
