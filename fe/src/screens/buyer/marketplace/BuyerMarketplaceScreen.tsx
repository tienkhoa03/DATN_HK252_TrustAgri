/**
 * Buyer Marketplace / Discover Screen
 * Tab "Khám phá" — tìm kiếm + bộ lọc + lưới sản phẩm
 *
 * Requirements: FR-U01, FR-U02, FR-G02, NFR-U01, NFR-U03
 */

import React, { useState, useEffect } from 'react';
import { Page, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listProducts,
  standardLabel,
  cropEmoji,
  toMarketplaceViMessage,
  type ProductDto,
} from '../../../services/marketplaceService';
import { listNews, type NewsArticleDto } from '@/services/newsForecastService';
import { BuyerHeader } from '../components/BuyerHeader';
import { BuyerDashboardScreen } from '../dashboard';
import { TrustBadgeGroup } from '../components/TrustBadgeGroup';

const NEWS_LIMIT = 5;
const PRODUCTS_PER_PAGE = 12;

type FilterOption = 'Tất cả' | 'Có IoT' | 'VietGAP' | 'Hỗ trợ đặt cọc' | 'Sẵn hàng';
const FILTER_OPTIONS: FilterOption[] = ['Tất cả', 'Có IoT', 'VietGAP', 'Hỗ trợ đặt cọc', 'Sẵn hàng'];

export interface BuyerMarketplaceScreenProps {
  buyerName?: string;
  onProductPress?: (productId: string) => void;
  onPostBuyingRequest?: () => void;
}

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
 * Buyer Marketplace / Discover Screen
 * Requirements: FR-U01, FR-U02, FR-G02, NFR-U01, NFR-U03
 */
export const BuyerMarketplaceScreen: React.FC<BuyerMarketplaceScreenProps> = ({
  onProductPress,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsArticleDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('Tất cả');
  const [searchVisible, setSearchVisible] = useState(false);

  // Load news
  useEffect(() => {
    let cancelled = false;
    listNews({ limit: NEWS_LIMIT })
      .then((res) => { if (!cancelled) setNewsItems(res.items); })
      .catch(() => { /* silently hide news on error */ });
    return () => { cancelled = true; };
  }, []);

  // Load products
  useEffect(() => {
    let cancelled = false;
    if (productPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    listProducts({ status: 'active', page: productPage, limit: PRODUCTS_PER_PAGE })
      .then((res) => {
        if (!cancelled) {
          setProducts((prev) => productPage === 1 ? res.items : [...prev, ...res.items]);
          setProductTotal(res.total);
          setLoading(false);
          setLoadingMore(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = toMarketplaceViMessage(err, 'list');
          setError(msg);
          setLoading(false);
          setLoadingMore(false);
          openSnackbar({ type: 'error', text: msg, duration: 4000, icon: true });
        }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productPage]);

  // Client-side filter: search + active filter chip
  const filteredProducts = (() => {
    let list = products;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.cropType.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      );
    }

    switch (activeFilter) {
      case 'Có IoT':
        return list.filter((p) => (p as any).hasIotData ?? false);
      case 'VietGAP':
        return list.filter((p) =>
          ((p as any).certifications as string[] | undefined)?.includes('VietGAP') ?? false,
        );
      case 'Hỗ trợ đặt cọc':
        return list.filter((p) => (p as any).supportsDeposit ?? false);
      case 'Sẵn hàng':
        return list.filter(
          (p) =>
            (p as any).harvestStatus === 'available' || !(p as any).harvestStatus,
        );
      default:
        return list;
    }
  })();

  // ── Styles ──────────────────────────────────────────────────────────────────

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
    fontSize: fontSize.caption,
    outline: 'none',
  };

  const newsBannerStyles: React.CSSProperties = {
    padding: `0 ${spacing.md} ${spacing.md}`,
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

  const filterBarStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    overflowX: 'auto',
    padding: `0 ${spacing.md} ${spacing.sm}`,
    scrollbarWidth: 'none',
  };

  const filterChipStyles = (active: boolean): React.CSSProperties => ({
    flexShrink: 0,
    minHeight: '44px',
    padding: `0 ${spacing.md}`,
    borderRadius: '22px',
    border: 'none',
    backgroundColor: active ? colors.primary.agriGreen : colors.background.secondary,
    color: active ? colors.text.inverse : colors.text.primary,
    fontSize: fontSize.caption,
    fontWeight: active ? fontWeight.semibold : fontWeight.regular,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
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

  const productImageContainerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '120px',
    backgroundColor: colors.background.secondary,
  };

  const productImageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
  };

  const badgeOverlayStyles: React.CSSProperties = {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    maxWidth: 'calc(100% - 8px)',
  };

  const productInfoStyles: React.CSSProperties = {
    padding: spacing.sm,
  };

  const priceStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.primary.zaloBlue,
    marginTop: spacing.xs,
  };

  const viewDetailButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: spacing.sm,
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '6px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    marginTop: spacing.sm,
    minHeight: '44px',
    transition: 'all 0.2s',
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

    return (
      <div style={productGridStyles}>
        {filteredProducts.map((product) => {
          const emoji = (product.images[0] as string | undefined) ?? cropEmoji(product.cropType);
          const std = standardLabel(product.standardCode);
          const p = product as any;
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
              <div style={productImageContainerStyles}>
                <div style={productImageStyles}>{emoji}</div>
                <div style={badgeOverlayStyles}>
                  <TrustBadgeGroup
                    certifications={p.certifications ?? (std ? [std] : [])}
                    hasIot={p.hasIotData ?? false}
                    supportsDeposit={p.supportsDeposit ?? false}
                    maxVisible={2}
                  />
                </div>
              </div>

              <div style={productInfoStyles}>
                <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.semibold, fontSize: fontSize.caption }}>
                  {product.name}
                </Text.Title>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0, fontSize: '11px' }}>
                  {product.cropType}
                </Text>

                <div style={priceStyles}>
                  {product.price.toLocaleString('vi-VN')}
                  <span style={{ fontSize: fontSize.caption, fontWeight: fontWeight.regular }}> VNĐ/{product.unit}</span>
                </div>

                {product.traderId && (
                  <Text size="small" style={{ color: colors.text.secondary, margin: 0, fontSize: '11px' }}>
                    Thương lái: {product.traderId.slice(0, 8)}
                  </Text>
                )}

                <button
                  style={viewDetailButtonStyles}
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductPress?.(product.id);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary.agriGreenDark;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary.agriGreen;
                  }}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Page className="buyer-discover-screen">
      {/* Header — BuyerHeader with search icon */}
      <BuyerHeader
        title="Khám phá"
        showSearch={true}
        onSearchPress={() => setSearchVisible((v) => !v)}
      />

      <div style={{ paddingBottom: spacing.xl }}>
        <BuyerDashboardScreen />

        {/* Search Bar — shown when search icon tapped */}
        {searchVisible && (
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
                autoFocus
              />
            </div>
          </div>
        )}

        {/* News Banner */}
        {newsItems.length > 0 && (
          <div style={newsBannerStyles}>
            <div
              style={newsCardStyles}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '32px', marginBottom: spacing.sm }}>
                {newsItems[currentNewsIndex].imageUrl ? '🖼️' : '📰'}
              </div>
              <Text.Title
                size="small"
                style={{ margin: 0, color: colors.text.inverse, fontWeight: fontWeight.semibold }}
              >
                {newsItems[currentNewsIndex].title}
              </Text.Title>
              <Text
                size="xSmall"
                style={{ color: colors.text.inverse, marginTop: spacing.xs, opacity: 0.9 }}
              >
                {newsItems[currentNewsIndex].category === 'price_forecast'
                  ? '📊 Dự báo giá'
                  : '🌾 Tiêu điểm nông vụ'}
              </Text>
            </div>

            <div style={newsDotsStyles}>
              {newsItems.map((_, index) => (
                <div
                  key={index}
                  style={dotStyles(index === currentNewsIndex)}
                  onClick={() => setCurrentNewsIndex(index)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filter Chip Bar */}
        <div style={filterBarStyles}>
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              style={filterChipStyles(activeFilter === opt)}
              onClick={() => setActiveFilter(opt)}
              type="button"
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Section title */}
        <div style={{ padding: `0 ${spacing.md} 0` }}>
          <Text.Title size="small" style={{ margin: 0 }}>
            {loading
              ? 'Đang tải...'
              : `Nông sản (${filteredProducts.length}${productTotal > products.length ? `/${productTotal}` : ''})`}
          </Text.Title>
        </div>

        {/* Product Grid */}
        {renderProductGrid()}

        {/* Xem thêm */}
        {!loading && !error && products.length < productTotal && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: `0 ${spacing.md} ${spacing.md}` }}>
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => setProductPage((p) => p + 1)}
              style={{
                padding: `${spacing.sm} ${spacing.lg}`,
                backgroundColor: colors.background.secondary,
                color: colors.primary.zaloBlue,
                border: `1px solid ${colors.primary.zaloBlue}`,
                borderRadius: '8px',
                fontSize: fontSize.body,
                fontWeight: fontWeight.semibold,
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                minHeight: '44px',
              }}
            >
              {loadingMore ? 'Đang tải...' : 'Xem thêm'}
            </button>
          </div>
        )}
      </div>
    </Page>
  );
};

// Alias — same component, used in routes as BuyerDiscoverScreen
export const BuyerDiscoverScreen = BuyerMarketplaceScreen;

export default BuyerMarketplaceScreen;
