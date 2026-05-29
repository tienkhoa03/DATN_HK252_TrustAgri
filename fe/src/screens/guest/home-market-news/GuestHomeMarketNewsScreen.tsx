/**
 * Guest Home & Market News Screen
 * Trang chủ Khách và Tin tức thị trường - Màn hình mặc định khi chưa đăng nhập
 * 
 * Requirements: FR-G02, FR-G03, US-G02, 23.1-23.4
 * 
 * Features:
 * - Thanh tiêu đề: Logo ứng dụng và thanh tìm kiếm, Nút Đăng nhập/Đăng ký nổi bật
 * - Khu vực Tin tức nổi bật: Trượt ngang các bản tin (Dự báo giá, Cảnh báo thời tiết, Kỹ thuật canh tác)
 * - Biểu đồ giá cả: Xu hướng tăng/giảm nông sản chủ lực (Bưởi, Xoài, Sầu riêng) 7 ngày
 * - Danh sách Nông sản nổi bật: Sản phẩm đang được đặt cọc nhiều nhất
 * - Thông báo quyền hạn: Dòng thông báo về chế độ Khách
 */

import React, { useState, useEffect } from 'react';
import { Page, Text, useNavigate } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { Chart } from '../../../design-system/components/Chart';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useStableOpenSnackbar } from '@/hooks/useStableOpenSnackbar';
import {
  listProducts,
  cropEmoji,
  toMarketplaceViMessage,
} from '../../../services/marketplaceService';
import {
  getPriceTrends,
  listNews,
  toNewsForecastViMessage,
} from '../../../services/newsForecastService';

export interface GuestHomeMarketNewsScreenProps {
  onLogin?: () => void;
  onProductPress?: (productId: string) => void;
}

interface NewsItem {
  id: string;
  title: string;
  type: 'price-forecast' | 'weather-alert' | 'farming-technique';
  image: string;
  date: string;
}

interface FeaturedProductUi {
  id: string;
  name: string;
  image: string;
  price: string;
}

interface PriceData {
  product: string;
  trend: 'up' | 'down' | 'stable';
  change: number; // Percentage
  data: { day: string; price: number }[];
}

function mapCategoryToSliderType(
  category: string,
): 'price-forecast' | 'weather-alert' | 'farming-technique' {
  if (category === 'weather_alert') return 'weather-alert';
  if (category === 'farming_technique') return 'farming-technique';
  return 'price-forecast';
}

function formatNewsDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const CROP_DEFAULT_LABELS: Record<string, string> = {
  pomelo: 'Bưởi',
  mango: 'Xoài',
  durian: 'Sầu riêng',
};

/**
 * Guest Home & Market News Screen Component
 * Requirements: FR-G02, FR-G03, US-G02, 23.1-23.4
 */
export const GuestHomeMarketNewsScreen: React.FC<GuestHomeMarketNewsScreenProps> = ({
  onLogin,
  onProductPress,
}) => {
  const openSnackbar = useStableOpenSnackbar();
  const navigate = useNavigate();
  const goLogin = () => {
    if (onLogin) onLogin();
    else navigate('/login');
  };
  const goProduct = (productId: string) => {
    if (onProductPress) onProductPress(productId);
    else navigate(`/guest/products/${productId}`);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<string>('pomelo');
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProductUi[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsAndForecastLoading, setNewsAndForecastLoading] = useState(true);
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});

  // Load featured products (public — không cần auth) on mount
  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    listProducts({ status: 'active', page: 1, limit: 4 })
      .then((res) => {
        if (!cancelled) {
          const uiItems: FeaturedProductUi[] = res.items.map((p) => ({
            id: p.id,
            name: p.name,
            image: p.images[0] ?? cropEmoji(p.cropType),
            price: `${p.price.toLocaleString('vi-VN')} VNĐ/${p.unit}`,
          }));
          setFeaturedProducts(uiItems);
          setProductsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setProductsLoading(false);
          openSnackbar({
            type: 'error',
            text: toMarketplaceViMessage(err, 'list'),
            duration: 4000,
            icon: true,
          });
        }
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tin công khai + dự báo giá (GET public — không bắt buộc Bearer), song song với marketplace
  useEffect(() => {
    let cancelled = false;
    setNewsAndForecastLoading(true);
    Promise.all([
      listNews({ page: 1, limit: 12 }),
      getPriceTrends({ days: 7 }),
    ])
      .then(([newsRes, trends]) => {
        if (cancelled) return;
        const slider: NewsItem[] = newsRes.items.map((a) => ({
          id: a.id,
          title: a.title,
          type: mapCategoryToSliderType(a.category),
          image: a.imageUrl && a.imageUrl.startsWith('http') ? '📰' : a.imageUrl || '📰',
          date: formatNewsDate(a.publishedAt),
        }));
        setNewsItems(slider);

        const nextPrice: Record<string, PriceData> = {};
        for (const t of trends) {
          if (t.series.length === 0) continue;
          nextPrice[t.cropType] = {
            product: t.productLabel ?? CROP_DEFAULT_LABELS[t.cropType] ?? t.cropType,
            trend: t.trend ?? 'stable',
            change: t.changePercent ?? 0,
            data: t.series,
          };
        }
        setPriceData(nextPrice);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          openSnackbar({
            type: 'error',
            text: toNewsForecastViMessage(err, 'newsList'),
            duration: 4000,
            icon: true,
          });
          setNewsItems([]);
          setPriceData({});
        }
      })
      .finally(() => {
        if (!cancelled) setNewsAndForecastLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openSnackbar]);

  useEffect(() => {
    setCurrentNewsIndex(0);
  }, [newsItems.length]);

  // Styles
  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  };

  const logoStyles: React.CSSProperties = {
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.primary.agriGreen,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const loginButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.primary.zaloBlue,
    color: colors.text.inverse,
    border: 'none',
    borderRadius: '6px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
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

  const newsSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  };

  const newsSliderStyles: React.CSSProperties = {
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const newsCardStyles = (type: string): React.CSSProperties => ({
    minWidth: '300px',
    padding: spacing.md,
    backgroundColor:
      type === 'price-forecast'
        ? colors.primary.zaloBlue
        : type === 'weather-alert'
        ? colors.functional.warningYellow
        : colors.primary.agriGreen,
    borderRadius: '12px',
    color: type === 'weather-alert' ? colors.text.primary : colors.text.inverse,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  });

  const newsDotsStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  };

  const dotStyles = (isActive: boolean): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isActive ? colors.primary.zaloBlue : colors.background.tertiary,
    transition: 'all 0.2s',
    cursor: 'pointer',
  });

  const marketWidgetStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  };

  const productTabsStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    marginBottom: spacing.md,
    overflowX: 'auto',
    scrollbarWidth: 'none',
  };

  const productTabStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: isActive ? colors.primary.zaloBlue : colors.background.secondary,
    color: isActive ? colors.text.inverse : colors.text.primary,
    border: 'none',
    borderRadius: '20px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  });

  const trendBadgeStyles = (trend: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor:
      trend === 'up'
        ? colors.primary.agriGreen
        : trend === 'down'
        ? colors.functional.alertRed
        : colors.background.tertiary,
    color: trend === 'stable' ? colors.text.primary : colors.text.inverse,
    borderRadius: '4px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  });

  const chartContainerStyles: React.CSSProperties = {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
  };

  const featuredProductsStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
  };

  const productGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
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
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    fontSize: '40px',
  };

  const productInfoStyles: React.CSSProperties = {
    padding: spacing.sm,
  };


  const priceStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.primary.zaloBlue,
    marginTop: spacing.xs,
  };

  const permissionNoticeStyles: React.CSSProperties = {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderLeft: `4px solid ${colors.primary.zaloBlue}`,
    borderRadius: '4px',
  };

  const contentStyles: React.CSSProperties = {
    paddingBottom: spacing.xl,
  };

  const currentPriceData = priceData[selectedProduct] ?? null;
  const sliderNews =
    newsItems.length > 0 ? newsItems[Math.min(currentNewsIndex, newsItems.length - 1)] : null;

  return (
    <Page className="guest-home-market-news-screen">
      <div style={contentStyles}>
        {/* Header - Logo và Nút Đăng nhập */}
        <div style={headerStyles}>
          <div style={logoStyles}>
            <span>🌾</span>
            <span>Nông nghiệp</span>
          </div>
          <button
            style={loginButtonStyles}
            onClick={goLogin}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0052CC';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
            }}
            aria-label="Đăng nhập hoặc Đăng ký"
          >
            Đăng nhập
          </button>
        </div>

        {/* Search Bar - Thanh tìm kiếm */}
        <div style={searchBarStyles}>
          <div style={searchInputWrapperStyles}>
            <div style={searchIconStyles}>
              <Icon name="search" size="md" color={colors.text.secondary} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm nông sản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyles}
            />
          </div>
        </div>

        {/* News Section - Tin tức nổi bật (GET /news) */}
        <div style={newsSectionStyles}>
          <div style={sectionTitleStyles}>📰 Tin tức nổi bật</div>

          {newsAndForecastLoading ? (
            <div
              style={{
                padding: spacing.lg,
                backgroundColor: colors.background.secondary,
                borderRadius: '12px',
                minHeight: '140px',
              }}
            >
              <div style={{ height: '14px', width: '60%', backgroundColor: colors.background.tertiary, borderRadius: '6px', marginBottom: spacing.md }} />
              <div style={{ height: '12px', width: '90%', backgroundColor: colors.background.tertiary, borderRadius: '6px', marginBottom: spacing.sm }} />
              <div style={{ height: '12px', width: '40%', backgroundColor: colors.background.tertiary, borderRadius: '6px' }} />
            </div>
          ) : sliderNews ? (
            <div style={newsSliderStyles}>
              <div
                style={newsCardStyles(sliderNews.type)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: spacing.sm }}>{sliderNews.image}</div>
                <Text.Title
                  size="small"
                  style={{
                    margin: 0,
                    color:
                      sliderNews.type === 'weather-alert' ? colors.text.primary : colors.text.inverse,
                    fontWeight: fontWeight.semibold,
                  }}
                >
                  {sliderNews.title}
                </Text.Title>
                <Text
                  size="xSmall"
                  style={{
                    color:
                      sliderNews.type === 'weather-alert' ? colors.text.secondary : colors.text.inverse,
                    marginTop: spacing.xs,
                    opacity: 0.9,
                  }}
                >
                  {sliderNews.date}
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
          ) : (
            <Text size="small" style={{ color: colors.text.secondary }}>
              Chưa có tin tức công khai.
            </Text>
          )}
        </div>

        {/* Market Widget - Biểu đồ giá (GET /forecasts, forecastData) */}
        <div style={marketWidgetStyles}>
          <div style={sectionTitleStyles}>📊 Xu hướng giá 7 ngày</div>
          {newsAndForecastLoading && (
            <Text size="xSmall" style={{ color: colors.text.secondary, marginBottom: spacing.sm, display: 'block' }}>
              Đang tải dự báo…
            </Text>
          )}

          {/* Product Tabs */}
          <div style={productTabsStyles}>
            <button
              style={productTabStyles(selectedProduct === 'pomelo')}
              onClick={() => setSelectedProduct('pomelo')}
            >
              🍊 Bưởi
            </button>
            <button
              style={productTabStyles(selectedProduct === 'mango')}
              onClick={() => setSelectedProduct('mango')}
            >
              🥭 Xoài
            </button>
            <button
              style={productTabStyles(selectedProduct === 'durian')}
              onClick={() => setSelectedProduct('durian')}
            >
              🌳 Sầu riêng
            </button>
          </div>

          {/* Trend / Chart / Empty state */}
          {currentPriceData ? (
            <>
              <div style={trendBadgeStyles(currentPriceData.trend)}>
                {currentPriceData.trend === 'up' && '📈 Tăng'}
                {currentPriceData.trend === 'down' && '📉 Giảm'}
                {currentPriceData.trend === 'stable' && '➡️ Ổn định'}
                <span style={{ fontWeight: fontWeight.bold }}>
                  {currentPriceData.change > 0 ? '+' : ''}
                  {currentPriceData.change}%
                </span>
              </div>

              <div style={chartContainerStyles}>
                <Chart
                  type="line"
                  data={currentPriceData.data.map((d) => ({
                    label: d.day,
                    value: d.price,
                  }))}
                  xAxis={{ label: 'Ngày' }}
                  yAxis={{ label: 'Giá (nghìn VNĐ)' }}
                  colors={[
                    currentPriceData.trend === 'up'
                      ? colors.primary.agriGreen
                      : currentPriceData.trend === 'down'
                      ? colors.functional.alertRed
                      : colors.text.secondary,
                  ]}
                  showGrid={true}
                />
              </div>
            </>
          ) : (
            !newsAndForecastLoading && (
              <div
                style={{
                  ...chartContainerStyles,
                  textAlign: 'center',
                  color: colors.text.secondary,
                }}
              >
                <Text size="small" style={{ color: colors.text.secondary }}>
                  Chưa có dự báo giá cho loại nông sản này.
                </Text>
              </div>
            )
          )}
        </div>

        {/* Featured Products - Nông sản nổi bật */}
        <div style={featuredProductsStyles}>
          <div style={sectionTitleStyles}>⭐ Nông sản nổi bật</div>
          <Text
            size="small"
            style={{ color: colors.text.secondary, marginBottom: spacing.md }}
          >
            Sản phẩm đang có trên thị trường
          </Text>

          {productsLoading ? (
            <div style={productGridStyles}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
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
                      height: '100px',
                      backgroundColor: colors.background.secondary,
                    }}
                  />
                  <div style={{ padding: spacing.sm }}>
                    {[70, 50].map((w, j) => (
                      <div
                        key={j}
                        style={{
                          height: '12px',
                          width: `${w}%`,
                          backgroundColor: colors.background.secondary,
                          borderRadius: '6px',
                          marginBottom: spacing.xs,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={productGridStyles}>
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  style={productCardStyles}
                  onClick={() => goProduct(product.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div style={productImageStyles}>{product.image}</div>

                  <div style={productInfoStyles}>
                    <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                      {product.name}
                    </Text.Title>

                    <div style={priceStyles}>{product.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permission Notice - Thông báo quyền hạn */}
        <div style={permissionNoticeStyles}>
          <Text size="small" style={{ margin: 0, fontWeight: fontWeight.medium }}>
            ℹ️ Bạn đang xem ở chế độ Khách
          </Text>
          <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
            Hãy đăng nhập để đặt cọc và xem camera giám sát vườn trồng
          </Text>
        </div>
      </div>
    </Page>
  );
};

export default GuestHomeMarketNewsScreen;
