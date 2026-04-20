/**
 * Farmer Market & Connect Screen
 * Màn hình Thị trường và Kết nối
 * 
 * Requirements: FR-F02, FR-F03, FR-F04, US-F04
 * 
 * Features:
 * - Tab Thị trường: Biểu đồ giá 7 ngày qua, Dự báo xu hướng giá tuần tới
 * - Tab Đối tác (Mặc định): Lời mời kết nối từ thương lái, Tìm kiếm thương lái
 * - Nút Chấp nhận (Xanh) và Từ chối (Xám)
 * - Nút Gửi yêu cầu kết nối
 */

import React, { useState } from 'react';
import { Page, Box, Text, Input } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { Button } from '../../../design-system/components/Button';
import { Card } from '../../../design-system/components/Card';
import { Chart } from '../../../design-system/components/Chart';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface TraderInvitation {
  id: string;
  traderName: string;
  trustScore: number; // 0-100
  productType: string;
  location: string;
  avatarUrl?: string;
  description?: string;
}

export interface TraderProfile {
  id: string;
  name: string;
  trustScore: number;
  productTypes: string[];
  location: string;
  distance: number; // km
  avatarUrl?: string;
  verified: boolean;
}

export interface PriceData {
  date: Date;
  price: number;
}

export interface FarmerMarketConnectScreenProps {
  farmerName?: string;
  farmName?: string;
  invitations?: TraderInvitation[];
  availableTraders?: TraderProfile[];
  priceHistory?: PriceData[];
  priceForecast?: PriceData[];
  productType?: string;
  onAcceptInvitation?: (invitationId: string) => void;
  onRejectInvitation?: (invitationId: string) => void;
  onSendConnectionRequest?: (traderId: string) => void;
  onBack?: () => void;
}

/**
 * Farmer Market & Connect Screen Component
 * Giúp nông dân kết nối với thương lái và theo dõi giá thị trường
 */
export const FarmerMarketConnectScreen: React.FC<FarmerMarketConnectScreenProps> = ({
  farmerName = 'Tiến Khoa',
  farmName = 'Sầu riêng Monthong',
  invitations: initialInvitations,
  availableTraders: initialAvailableTraders,
  priceHistory: initialPriceHistory,
  priceForecast: initialPriceForecast,
  productType = 'Sầu riêng',
  onAcceptInvitation,
  onRejectInvitation,
  onSendConnectionRequest,
  onBack,
}) => {
  // Default data
  const defaultInvitations: TraderInvitation[] = [
    {
      id: '1',
      traderName: 'Công ty TNHH Trái cây Miền Nam',
      trustScore: 95,
      productType: 'Sầu riêng, Bưởi',
      location: 'TP. Hồ Chí Minh',
      description: 'Chuyên thu mua sầu riêng chất lượng cao, thanh toán nhanh',
    },
    {
      id: '2',
      traderName: 'Hợp tác xã Nông sản Đồng Tháp',
      trustScore: 88,
      productType: 'Sầu riêng, Xoài',
      location: 'Đồng Tháp',
      description: 'Hợp tác lâu dài, hỗ trợ kỹ thuật canh tác',
    },
  ];

  const defaultAvailableTraders: TraderProfile[] = [
    {
      id: '3',
      name: 'Thương lái Nguyễn Văn A',
      trustScore: 92,
      productTypes: ['Sầu riêng', 'Măng cụt'],
      location: 'Tiền Giang',
      distance: 15,
      verified: true,
    },
    {
      id: '4',
      name: 'Công ty Xuất khẩu Trái cây',
      trustScore: 85,
      productTypes: ['Sầu riêng', 'Bưởi', 'Xoài'],
      location: 'Bến Tre',
      distance: 25,
      verified: true,
    },
    {
      id: '5',
      name: 'Hợp tác xã Nông dân',
      trustScore: 78,
      productTypes: ['Sầu riêng'],
      location: 'Vĩnh Long',
      distance: 35,
      verified: false,
    },
  ];

  // Generate price history (7 days)
  const generatePriceHistory = (): PriceData[] => {
    const basePrice = 120000; // 120k VND/kg
    const data: PriceData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = Math.random() * 20000 - 10000; // ±10k variation
      data.push({
        date,
        price: basePrice + variation,
      });
    }
    return data;
  };

  // Generate price forecast (7 days)
  const generatePriceForecast = (history: PriceData[]): PriceData[] => {
    const lastPrice = history[history.length - 1].price;
    const trend = 5000; // Upward trend
    const data: PriceData[] = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const variation = Math.random() * 15000 - 7500; // ±7.5k variation
      data.push({
        date,
        price: lastPrice + (trend * i) + variation,
      });
    }
    return data;
  };

  const priceHistory = initialPriceHistory || generatePriceHistory();
  const priceForecast = initialPriceForecast || generatePriceForecast(priceHistory);

  const [invitations, setInvitations] = useState<TraderInvitation[]>(initialInvitations || defaultInvitations);
  const [availableTraders] = useState<TraderProfile[]>(initialAvailableTraders || defaultAvailableTraders);
  const [activeTab, setActiveTab] = useState<'partners' | 'market'>('partners');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle accept invitation
  const handleAcceptInvitation = (invitationId: string) => {
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    if (onAcceptInvitation) {
      onAcceptInvitation(invitationId);
    }
  };

  // Handle reject invitation
  const handleRejectInvitation = (invitationId: string) => {
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    if (onRejectInvitation) {
      onRejectInvitation(invitationId);
    }
  };

  // Handle send connection request
  const handleSendRequest = (traderId: string) => {
    if (onSendConnectionRequest) {
      onSendConnectionRequest(traderId);
    }
  };

  // Filter traders by search query
  const filteredTraders = availableTraders.filter(trader =>
    trader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trader.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trader.productTypes.some(type => type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Prepare chart data - combine history and forecast
  const chartData = [
    ...priceHistory.map(d => ({
      label: d.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      value: d.price / 1000, // Convert to thousands
    })),
    ...priceForecast.map(d => ({
      label: d.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      value: d.price / 1000,
    })),
  ];

  // Styles
  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const tabContainerStyles: React.CSSProperties = {
    display: 'flex',
    borderBottom: `2px solid ${colors.background.secondary}`,
    backgroundColor: colors.background.primary,
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${isActive ? colors.primary.agriGreen : 'transparent'}`,
    color: isActive ? colors.primary.agriGreen : colors.text.secondary,
    fontSize: fontSize.body,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    paddingBottom: '80px',
  };

  const invitationCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    border: `1px solid ${colors.background.secondary}`,
    marginBottom: spacing.md,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  const traderCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    border: `1px solid ${colors.background.secondary}`,
    marginBottom: spacing.md,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  const trustScoreStyles = (score: number): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs} ${spacing.sm}`,
    backgroundColor: score >= 90 ? `${colors.primary.agriGreen}15` : score >= 80 ? `${colors.primary.zaloBlue}15` : `${colors.functional.warningYellow}15`,
    color: score >= 90 ? colors.primary.agriGreen : score >= 80 ? colors.primary.zaloBlue : colors.functional.warningYellow,
    borderRadius: '4px',
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
  });

  const actionButtonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.md,
  };

  const searchContainerStyles: React.CSSProperties = {
    marginBottom: spacing.md,
  };

  return (
    <Page className="farmer-market-connect-screen">
      {/* Header */}
      <div style={headerStyles}>
        <div>
          <Text.Title size="small" style={{ margin: 0 }}>
            Thị trường & Kết nối
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {farmName}
          </Text>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: spacing.sm,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Quay lại"
          >
            <Icon name="home" size="md" color={colors.text.primary} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={tabContainerStyles}>
        <button
          style={tabButtonStyles(activeTab === 'partners')}
          onClick={() => setActiveTab('partners')}
          aria-label="Đối tác"
          aria-current={activeTab === 'partners' ? 'page' : undefined}
        >
          🤝 Đối tác
        </button>
        <button
          style={tabButtonStyles(activeTab === 'market')}
          onClick={() => setActiveTab('market')}
          aria-label="Thị trường"
          aria-current={activeTab === 'market' ? 'page' : undefined}
        >
          📈 Thị trường
        </button>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {activeTab === 'partners' ? (
          <>
            {/* Invitations Section */}
            {invitations.length > 0 && (
              <div style={{ marginBottom: spacing.lg }}>
                <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                  Lời mời kết nối ({invitations.length})
                </Text.Title>
                
                {invitations.map(invitation => (
                  <div key={invitation.id} style={invitationCardStyles}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          minWidth: '48px',
                          borderRadius: '50%',
                          backgroundColor: colors.primary.agriGreen,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.text.inverse,
                          fontSize: fontSize.h2,
                          fontWeight: fontWeight.semibold,
                        }}
                      >
                        {invitation.avatarUrl ? (
                          <img
                            src={invitation.avatarUrl}
                            alt={invitation.traderName}
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                          />
                        ) : (
                          <span>{invitation.traderName.charAt(0)}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <Text
                          size="normal"
                          style={{ fontWeight: fontWeight.semibold, margin: 0 }}
                        >
                          {invitation.traderName}
                        </Text>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
                          <div style={trustScoreStyles(invitation.trustScore)}>
                            ⭐ {invitation.trustScore}/100
                          </div>
                          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                            📍 {invitation.location}
                          </Text>
                        </div>

                        <Text
                          size="small"
                          style={{ color: colors.text.secondary, marginTop: spacing.sm, margin: 0 }}
                        >
                          Loại nông sản: {invitation.productType}
                        </Text>

                        {invitation.description && (
                          <Text
                            size="small"
                            style={{ color: colors.text.secondary, marginTop: spacing.xs, margin: 0 }}
                          >
                            {invitation.description}
                          </Text>
                        )}

                        {/* Action Buttons */}
                        <div style={actionButtonContainerStyles}>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            style={{ flex: 1 }}
                          >
                            ✓ Chấp nhận
                          </Button>
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => handleRejectInvitation(invitation.id)}
                            style={{ flex: 1 }}
                          >
                            ✕ Từ chối
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search Section */}
            <div style={{ marginBottom: spacing.lg }}>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                Tìm kiếm thương lái uy tín
              </Text.Title>
              
              <div style={searchContainerStyles}>
                <Input
                  type="text"
                  placeholder="Tìm theo tên, khu vực, loại nông sản..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    border: `1px solid ${colors.background.secondary}`,
                    borderRadius: '8px',
                    fontSize: fontSize.body,
                  }}
                />
              </div>

              {/* Available Traders */}
              {filteredTraders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.text.secondary }}>
                  <Icon name="search" size="lg" color={colors.text.secondary} />
                  <Text style={{ marginTop: spacing.md }}>
                    Không tìm thấy thương lái phù hợp
                  </Text>
                </div>
              ) : (
                filteredTraders.map(trader => (
                  <div key={trader.id} style={traderCardStyles}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          minWidth: '48px',
                          borderRadius: '50%',
                          backgroundColor: colors.primary.zaloBlue,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.text.inverse,
                          fontSize: fontSize.h2,
                          fontWeight: fontWeight.semibold,
                        }}
                      >
                        {trader.avatarUrl ? (
                          <img
                            src={trader.avatarUrl}
                            alt={trader.name}
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                          />
                        ) : (
                          <span>{trader.name.charAt(0)}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                          <Text
                            size="normal"
                            style={{ fontWeight: fontWeight.semibold, margin: 0 }}
                          >
                            {trader.name}
                          </Text>
                          {trader.verified && (
                            <span style={{ color: colors.primary.zaloBlue, fontSize: fontSize.body }}>
                              ✓
                            </span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs, flexWrap: 'wrap' }}>
                          <div style={trustScoreStyles(trader.trustScore)}>
                            ⭐ {trader.trustScore}/100
                          </div>
                          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                            📍 {trader.location} ({trader.distance}km)
                          </Text>
                        </div>

                        <Text
                          size="small"
                          style={{ color: colors.text.secondary, marginTop: spacing.sm, margin: 0 }}
                        >
                          Chuyên: {trader.productTypes.join(', ')}
                        </Text>

                        {/* Action Button */}
                        <div style={{ marginTop: spacing.md }}>
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleSendRequest(trader.id)}
                            style={{ width: '100%' }}
                          >
                            📤 Gửi yêu cầu kết nối
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Market Tab */
          <>
            {/* Price Chart Section */}
            <div style={{ marginBottom: spacing.lg }}>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                Biểu đồ giá {productType}
              </Text.Title>
              
              <Card>
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                      Giá hiện tại
                    </Text>
                    <Text.Title size="large" style={{ color: colors.primary.agriGreen, margin: 0 }}>
                      {(priceHistory[priceHistory.length - 1].price / 1000).toFixed(0)}k
                    </Text.Title>
                  </div>
                  <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs }}>
                    VND/kg
                  </Text>
                </div>

                <Chart
                  type="line"
                  data={chartData}
                  xAxis={{
                    label: 'Ngày',
                  }}
                  yAxis={{
                    label: 'Giá (nghìn VND)',
                  }}
                  colors={[colors.primary.agriGreen]}
                  showGrid={true}
                  showLegend={false}
                  width={320}
                  height={200}
                />
              </Card>
            </div>

            {/* Price Trend Analysis */}
            <div style={{ marginBottom: spacing.lg }}>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                Phân tích xu hướng
              </Text.Title>
              
              <Card status="success">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      minWidth: '48px',
                      borderRadius: '50%',
                      backgroundColor: `${colors.primary.agriGreen}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="trending-up" size="lg" color={colors.primary.agriGreen} />
                  </div>
                  <div>
                    <Text
                      size="normal"
                      style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen, margin: 0 }}
                    >
                      Xu hướng tăng giá
                    </Text>
                    <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.xs, margin: 0 }}>
                      Dự báo giá {productType} sẽ tăng 5-8% trong tuần tới do nhu cầu thị trường tăng cao.
                    </Text>
                    <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.sm, margin: 0 }}>
                      💡 Khuyến nghị: Đây là thời điểm tốt để thu hoạch và bán sản phẩm.
                    </Text>
                  </div>
                </div>
              </Card>
            </div>

            {/* Market News */}
            <div>
              <Text.Title size="small" style={{ marginBottom: spacing.md }}>
                Tin tức thị trường
              </Text.Title>
              
              <Card>
                <div style={{ marginBottom: spacing.md }}>
                  <Text
                    size="normal"
                    style={{ fontWeight: fontWeight.semibold, margin: 0 }}
                  >
                    📰 Nhu cầu xuất khẩu {productType} tăng mạnh
                  </Text>
                  <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs, margin: 0 }}>
                    2 giờ trước
                  </Text>
                  <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.sm, margin: 0 }}>
                    Thị trường Trung Quốc và Nhật Bản đang tăng cường nhập khẩu {productType} chất lượng cao...
                  </Text>
                </div>
              </Card>

              <Card style={{ marginTop: spacing.md }}>
                <div>
                  <Text
                    size="normal"
                    style={{ fontWeight: fontWeight.semibold, margin: 0 }}
                  >
                    🌦️ Dự báo thời tiết thuận lợi cho thu hoạch
                  </Text>
                  <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.xs, margin: 0 }}>
                    5 giờ trước
                  </Text>
                  <Text size="small" style={{ color: colors.text.secondary, marginTop: spacing.sm, margin: 0 }}>
                    Thời tiết khô ráo trong 7 ngày tới, thuận lợi cho việc thu hoạch và vận chuyển...
                  </Text>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </Page>
  );
};

export default FarmerMarketConnectScreen;
