/**
 * ProductDetailTabs — 3-tab panel for product detail screen
 * Tabs: Thông tin Sản phẩm | Hồ sơ Thương lái | Nhật ký Vườn trồng
 *
 * Requirements: FR-U01, FR-G01, NFR-U03
 */

import React, { useState } from 'react';
import { Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';
import { useTrustScore } from '@/hooks/useTrustScore';
import { standardLabel } from '../../../services/marketplaceService';
import type { ProductDto } from '../../../services/marketplaceService';
import { useNavigate } from 'zmp-ui';

type TabId = 'info' | 'trader' | 'journal';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'info',    label: 'Thông tin SP' },
  { id: 'trader',  label: 'Hồ sơ Thương lái' },
  { id: 'journal', label: 'Nhật ký Vườn' },
];

// Static quality specs (UI-only)
const QUALITY_SPECS = [
  { label: 'Độ ngọt',    value: '≥ 28 Brix',        icon: '🍯' },
  { label: 'Kích thước', value: '2.5 – 3.5 kg/trái', icon: '📏' },
  { label: 'Thuốc BVTV', value: 'Không dư lượng',    icon: '✅' },
  { label: 'Thu hoạch',  value: '15–20 ngày',         icon: '📅' },
];

const FARM_HISTORY = [
  { season: 'Vụ 2024', yield: '5.2 tấn', quality: 'Đạt chuẩn GlobalGAP' },
  { season: 'Vụ 2023', yield: '4.8 tấn', quality: 'Đạt chuẩn VietGAP' },
];

export interface ProductDetailTabsProps {
  product: ProductDto;
}

export const ProductDetailTabs: React.FC<ProductDetailTabsProps> = ({ product }) => {
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const { trustScore, isLoading: trustScoreLoading } = useTrustScore(product.traderId);
  const navigate = useNavigate();

  const tabBarStyles: React.CSSProperties = {
    display: 'flex',
    borderBottom: `2px solid ${colors.background.tertiary}`,
    backgroundColor: colors.background.primary,
  };

  const tabButtonStyles = (active: boolean): React.CSSProperties => ({
    flex: 1,
    minHeight: '44px',
    padding: `0 ${spacing.sm}`,
    border: 'none',
    borderBottom: active ? `2px solid ${colors.primary.agriGreen}` : '2px solid transparent',
    marginBottom: '-2px',
    backgroundColor: 'transparent',
    color: active ? colors.primary.agriGreen : colors.text.secondary,
    fontSize: '12px',
    fontWeight: active ? fontWeight.semibold : fontWeight.regular,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  const sectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
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

  const historyCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
    marginBottom: spacing.sm,
  };

  const std = standardLabel(product.standardCode);

  const renderInfoTab = () => (
    <div style={sectionStyles}>
      <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
        Thông tin sản phẩm
      </Text.Title>

      {std && (
        <div style={{
          display: 'inline-block',
          padding: `${spacing.xs} ${spacing.sm}`,
          backgroundColor: colors.primary.agriGreen,
          color: colors.text.inverse,
          borderRadius: '4px',
          fontSize: fontSize.caption,
          fontWeight: fontWeight.medium,
          marginBottom: spacing.sm,
        }}>
          {std}
        </div>
      )}

      {product.description && (
        <Text size="small" style={{ lineHeight: 1.6, marginBottom: spacing.md }}>
          {product.description}
        </Text>
      )}

      <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
        <div>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Giá</Text>
          <Text size="small" style={{ fontWeight: fontWeight.bold, color: colors.primary.zaloBlue, margin: 0 }}>
            {product.price.toLocaleString('vi-VN')} VNĐ/{product.unit}
          </Text>
        </div>
        {product.cropType && (
          <div>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Loại</Text>
            <Text size="small" style={{ fontWeight: fontWeight.medium, margin: 0 }}>{product.cropType}</Text>
          </div>
        )}
      </div>

      <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.sm }}>
        Thông số cam kết
      </Text.Title>
      <div style={specGridStyles}>
        {QUALITY_SPECS.map((spec, i) => (
          <div key={i} style={specCardStyles}>
            <div style={{ fontSize: '28px', marginBottom: spacing.xs }}>{spec.icon}</div>
            <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>{spec.label}</Text>
            <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>{spec.value}</Text>
          </div>
        ))}
      </div>

      <Text.Title size="small" style={{ margin: `${spacing.md} 0 ${spacing.sm}` }}>
        Hồ sơ năng lực vườn
      </Text.Title>
      {FARM_HISTORY.map((h, i) => (
        <div key={i} style={historyCardStyles}>
          <Text size="small" style={{ margin: 0, fontWeight: fontWeight.semibold }}>{h.season}</Text>
          <Text size="xSmall" style={{ margin: 0, color: colors.text.secondary }}>Sản lượng: {h.yield}</Text>
          <Text size="xSmall" style={{ margin: 0, color: colors.primary.agriGreen }}>✓ {h.quality}</Text>
        </div>
      ))}
    </div>
  );

  const renderTraderTab = () => {
    const score = trustScore;
    const scoreColor =
      score && score.average !== null
        ? score.average >= 80
          ? colors.primary.agriGreen
          : score.average >= 60
          ? colors.functional.warningYellow
          : colors.text.secondary
        : colors.text.secondary;

    return (
      <div style={sectionStyles}>
        <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.md }}>
          Hồ sơ Thương lái
        </Text.Title>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: colors.background.secondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}>
            🧑‍💼
          </div>
          <div style={{ flex: 1 }}>
            <Text size="small" style={{ fontWeight: fontWeight.semibold, margin: 0 }}>
              {product.traderId}
            </Text>
            {trustScoreLoading ? (
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Đang tải đánh giá...</Text>
            ) : score && score.count > 0 && score.average !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: '2px' }}>
                <Icon name="star-filled" size="sm" color={colors.functional.warningYellow} />
                <span style={{ fontSize: fontSize.caption, fontWeight: fontWeight.semibold, color: scoreColor }}>
                  {score.average.toFixed(1)}
                </span>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  ({score.count} đánh giá)
                </Text>
              </div>
            ) : (
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Chưa có đánh giá</Text>
            )}
          </div>
        </div>

        <div style={{
          padding: spacing.sm,
          backgroundColor: colors.background.secondary,
          borderRadius: '8px',
          marginBottom: spacing.md,
        }}>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            <Icon name="map-pin" size="sm" color={colors.text.secondary} />
            <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
              {(product as any).region ?? 'Khu vực chưa cập nhật'}
            </Text>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/buyer?traderId=${product.traderId}`)}
          style={{
            width: '100%',
            minHeight: '44px',
            border: `1px solid ${colors.primary.zaloBlue}`,
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: colors.primary.zaloBlue,
            fontSize: fontSize.caption,
            fontWeight: fontWeight.medium,
            cursor: 'pointer',
          }}
        >
          Xem nông sản khác của thương lái
        </button>
      </div>
    );
  };

  const renderJournalTab = () => (
    <div style={sectionStyles}>
      <Text.Title size="small" style={{ margin: 0, marginBottom: spacing.md }}>
        Nhật ký Vườn trồng
      </Text.Title>

      <div style={{
        padding: spacing.md,
        backgroundColor: colors.background.secondary,
        borderRadius: '8px',
        marginBottom: spacing.md,
      }}>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Icon name="map-pin" size="sm" color={colors.text.secondary} />
          <div>
            <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>Mã vườn</Text>
            <Text size="small" style={{ fontWeight: fontWeight.medium, margin: 0 }}>
              {product.farmId ?? 'Chưa gán vườn'}
            </Text>
          </div>
        </div>
      </div>

      {/* Locked state — nhật ký chỉ mở khóa sau khi đặt cọc */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        backgroundColor: colors.background.secondary,
        borderRadius: '12px',
        gap: spacing.md,
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: colors.background.tertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
        }}>
          🔒
        </div>
        <Text size="small" style={{
          color: colors.text.secondary,
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.6,
          fontSize: fontSize.caption,
        }}>
          Chi tiết nhật ký được hiển thị sau khi đặt cọc
        </Text>
      </div>
    </div>
  );

  return (
    <div>
      {/* Tab Bar */}
      <div style={tabBarStyles}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={tabButtonStyles(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info'    && renderInfoTab()}
      {activeTab === 'trader'  && renderTraderTab()}
      {activeTab === 'journal' && renderJournalTab()}
    </div>
  );
};
