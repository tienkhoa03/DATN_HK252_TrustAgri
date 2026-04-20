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

import React, { useState } from 'react';
import { Page, Box, Text, Input } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface BuyerMarketplaceScreenProps {
  buyerName?: string;
}

interface Product {
  id: string;
  name: string;
  farmName: string;
  image: string;
  price: string;
  standard?: 'VietGAP' | 'GlobalGAP' | 'Organic';
  available: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  type: 'price-forecast' | 'farming-highlight';
  image: string;
}

/**
 * Buyer Marketplace Home Screen Component
 * Requirements: FR-U01, FR-U02, FR-G02, 20.1-20.4
 */
export const BuyerMarketplaceScreen: React.FC<BuyerMarketplaceScreenProps> = ({
  buyerName = 'Người mua',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  // Mock news data - Banner tin tức
  const newsItems: NewsItem[] = [
    {
      id: '1',
      title: 'Dự báo giá Bưởi Da Xanh tăng 15% tuần tới',
      type: 'price-forecast',
      image: '🍊',
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

  // Mock product data - Danh sách nông sản
  const products: Product[] = [
    {
      id: '1',
      name: 'Bưởi Da Xanh',
      farmName: 'Vườn chú Bảy',
      image: '🍊',
      price: '45,000 VNĐ/kg',
      standard: 'VietGAP',
      available: true,
    },
    {
      id: '2',
      name: 'Sầu riêng Monthong',
      farmName: 'Farm Lab Tiến Khoa',
      image: '🌳',
      price: '120,000 VNĐ/kg',
      standard: 'GlobalGAP',
      available: true,
    },
    {
      id: '3',
      name: 'Xoài Cát Chu',
      farmName: 'Vườn cô Ba',
      image: '🥭',
      price: '35,000 VNĐ/kg',
      standard: 'VietGAP',
      available: true,
    },
    {
      id: '4',
      name: 'Thanh Long Ruột Đỏ',
      farmName: 'Vườn anh Tư',
      image: '🐉',
      price: '28,000 VNĐ/kg',
      standard: 'Organic',
      available: false,
    },
    {
      id: '5',
      name: 'Cam Sành',
      farmName: 'Vườn chị Năm',
      image: '🍊',
      price: '32,000 VNĐ/kg',
      standard: 'VietGAP',
      available: true,
    },
    {
      id: '6',
      name: 'Nhãn Lồng',
      farmName: 'Vườn anh Sáu',
      image: '🍇',
      price: '55,000 VNĐ/kg',
      standard: 'GlobalGAP',
      available: true,
    },
  ];

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.farmName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Styles
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
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  const newsCardStyles: React.CSSProperties = {
    minWidth: '280px',
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
  });

  const productGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: '80px', // Space for FAB
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

  const standardBadgeStyles = (standard: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: colors.primary.agriGreen,
    color: colors.text.inverse,
    borderRadius: '4px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  });

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

        {/* Search Bar - Thanh tìm kiếm */}
        <div style={searchBarStyles}>
          <div style={searchInputWrapperStyles}>
            <div style={searchIconStyles}>
              <Icon name="search" size="md" color={colors.text.secondary} />
            </div>
            <input
              type="text"
              placeholder="Tìm nông sản hoặc Farm Lab..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyles}
            />
          </div>
        </div>

        {/* News Banner - Banner tin tức */}
        <div style={newsBannerStyles}>
          <div
            style={newsCardStyles}
            onClick={() => console.log('View news:', newsItems[currentNewsIndex])}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: spacing.sm }}>
              {newsItems[currentNewsIndex].image}
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
              {newsItems[currentNewsIndex].type === 'price-forecast'
                ? '📊 Dự báo giá'
                : '🌾 Tiêu điểm nông vụ'}
            </Text>
          </div>

          {/* News Dots */}
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

        {/* Product Grid - Danh sách nông sản */}
        <div style={productGridStyles}>
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              style={productCardStyles}
              onClick={() => console.log('View product:', product)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Product Image */}
              <div style={productImageStyles}>{product.image}</div>

              {/* Product Info */}
              <div style={productInfoStyles}>
                <Text.Title size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
                  {product.name}
                </Text.Title>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  {product.farmName}
                </Text>

                {/* Standard Badge */}
                {product.standard && (
                  <div style={standardBadgeStyles(product.standard)}>
                    {product.standard}
                  </div>
                )}

                {/* Price */}
                <div style={priceStyles}>{product.price}</div>

                {/* Action Button */}
                <button
                  style={buttonStyles(product.available)}
                  disabled={!product.available}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (product.available) {
                      console.log('Buy product:', product);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (product.available) {
                      e.currentTarget.style.backgroundColor = '#0052CC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (product.available) {
                      e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
                    }
                  }}
                >
                  {product.available ? 'Mua ngay' : 'Đặt trước'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Action Button - Nút Đăng nhu cầu mua */}
        <button
          style={fabStyles}
          onClick={() => console.log('Post buying request')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Đăng nhu cầu mua"
        >
          <Icon name="plus-circle" size="lg" color={colors.text.inverse} />
        </button>
      </div>
    </Page>
  );
};

export default BuyerMarketplaceScreen;
