/**
 * Trader Dashboard Screen
 * Màn hình trung tâm giúp thương lái nắm bắt bức tranh toàn cảnh
 * 
 * Requirements: FR-T02, FR-T12, US-T01, 7.1, 7.2, 17.1-17.4
 * 
 * Features:
 * - Khu vực Tổng quan (Overview Cards): 4 thẻ thống kê
 * - Biểu đồ Xu hướng thị trường: Biểu đồ đường hiển thị biến động giá
 * - Trung tâm Tác vụ (Action Center): Yêu cầu kết nối, Đơn hàng mới, Cảnh báo rủi ro
 * - Use outline icons for clean look
 * - Optimize for 4G network loading
 */

import React, { useState } from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { Card } from '../../../design-system/components/Card';
import { Chart } from '../../../design-system/components/Chart';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface TraderDashboardScreenProps {
  traderName?: string;
  companyName?: string;
}

/**
 * Trader Dashboard Screen Component
 * Requirements: FR-T02, FR-T12, US-T01, 7.1, 7.2, 17.1-17.4
 */
export const TraderDashboardScreen: React.FC<TraderDashboardScreenProps> = ({
  traderName = 'Thương lái',
  companyName = 'Công ty TNHH Nông sản',
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days'>('7days');

  // Mock overview data - Requirements 17.1
  const overviewData = {
    estimatedRevenue: {
      value: '250M',
      label: 'Doanh thu ước tính',
      icon: 'dollar-sign' as const,
      color: colors.primary.agriGreen,
    },
    newOrders: {
      value: '12',
      label: 'Đơn hàng mới',
      icon: 'shopping-cart' as const,
      color: colors.primary.zaloBlue,
    },
    farmers: {
      value: '45',
      label: 'Số nông hộ',
      icon: 'users' as const,
      color: colors.primary.agriGreen,
    },
    expectedYield: {
      value: '8.5 tấn',
      label: 'Sản lượng dự kiến',
      icon: 'package' as const,
      color: colors.primary.zaloBlue,
    },
  };

  // Mock market trend data - Requirements 17.2
  const marketTrendData = selectedPeriod === '7days' 
    ? [
        { x: 'T2', y: 45000 },
        { x: 'T3', y: 47000 },
        { x: 'T4', y: 46500 },
        { x: 'T5', y: 48000 },
        { x: 'T6', y: 49500 },
        { x: 'T7', y: 51000 },
        { x: 'CN', y: 50000 },
      ]
    : [
        { x: 'T1', y: 42000 },
        { x: 'T2', y: 45000 },
        { x: 'T3', y: 47000 },
        { x: 'T4', y: 50000 },
      ];

  // Mock action center data - Requirements 17.3, 17.4
  const actionCenterData = {
    connectionRequests: {
      count: 8,
      label: 'Yêu cầu kết nối',
      description: 'Nông dân mới gửi hồ sơ',
      color: colors.primary.zaloBlue,
      icon: 'users' as const,
    },
    newOrders: {
      count: 5,
      label: 'Đơn hàng mới',
      description: 'Người mua vừa đặt cọc',
      color: colors.primary.agriGreen,
      icon: 'shopping-cart' as const,
    },
    riskAlerts: {
      count: 2,
      label: 'Cảnh báo rủi ro',
      description: 'Farm Lab vi phạm quy trình',
      color: colors.functional.warningYellow,
      icon: 'alert-triangle' as const,
    },
  };

  // Styles
  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const overviewGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.md,
    padding: spacing.md,
  };

  const overviewCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  };

  const chartSectionStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    margin: `0 ${spacing.md} ${spacing.md}`,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const periodSelectorStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.md,
  };

  const periodButtonStyles = (isActive: boolean): React.CSSProperties => ({
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: isActive ? colors.primary.zaloBlue : colors.background.secondary,
    color: isActive ? colors.text.inverse : colors.text.primary,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    transition: 'all 0.2s',
  });

  const actionCenterStyles: React.CSSProperties = {
    padding: spacing.md,
  };

  const actionCardStyles = (bgColor: string): React.CSSProperties => ({
    padding: spacing.md,
    backgroundColor: `${bgColor}15`,
    borderRadius: '8px',
    border: `2px solid ${bgColor}`,
    marginBottom: spacing.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const contentStyles: React.CSSProperties = {
    paddingBottom: spacing.xl,
  };

  return (
    <Page className="trader-dashboard-screen">
      <div style={contentStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
            Xin chào,
          </Text>
          <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
            {traderName}
          </Text.Title>
          <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
            {companyName}
          </Text>
        </div>

        {/* Overview Cards - 4 thẻ thống kê */}
        <div style={overviewGridStyles}>
          {/* Estimated Revenue */}
          <div style={overviewCardStyles}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: `${overviewData.estimatedRevenue.color}15`,
              }}
            >
              <Icon
                name={overviewData.estimatedRevenue.icon}
                size="lg"
                color={overviewData.estimatedRevenue.color}
              />
            </div>
            <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
              {overviewData.estimatedRevenue.value}
            </Text.Title>
            <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
              {overviewData.estimatedRevenue.label}
            </Text>
          </div>

          {/* New Orders */}
          <div style={overviewCardStyles}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: `${overviewData.newOrders.color}15`,
              }}
            >
              <Icon
                name={overviewData.newOrders.icon}
                size="lg"
                color={overviewData.newOrders.color}
              />
            </div>
            <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
              {overviewData.newOrders.value}
            </Text.Title>
            <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
              {overviewData.newOrders.label}
            </Text>
          </div>

          {/* Farmers */}
          <div style={overviewCardStyles}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: `${overviewData.farmers.color}15`,
              }}
            >
              <Icon
                name={overviewData.farmers.icon}
                size="lg"
                color={overviewData.farmers.color}
              />
            </div>
            <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
              {overviewData.farmers.value}
            </Text.Title>
            <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
              {overviewData.farmers.label}
            </Text>
          </div>

          {/* Expected Yield */}
          <div style={overviewCardStyles}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: `${overviewData.expectedYield.color}15`,
              }}
            >
              <Icon
                name={overviewData.expectedYield.icon}
                size="lg"
                color={overviewData.expectedYield.color}
              />
            </div>
            <Text.Title size="large" style={{ margin: 0, fontWeight: fontWeight.bold }}>
              {overviewData.expectedYield.value}
            </Text.Title>
            <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
              {overviewData.expectedYield.label}
            </Text>
          </div>
        </div>

        {/* Market Trend Chart - Biểu đồ xu hướng thị trường */}
        <div style={chartSectionStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text.Title size="small" style={{ margin: 0 }}>
              Xu hướng thị trường
            </Text.Title>
            <Icon name="trending-up" size="md" color={colors.primary.agriGreen} />
          </div>

          {/* Period Selector */}
          <div style={periodSelectorStyles}>
            <button
              style={periodButtonStyles(selectedPeriod === '7days')}
              onClick={() => setSelectedPeriod('7days')}
              onMouseEnter={(e) => {
                if (selectedPeriod !== '7days') {
                  e.currentTarget.style.backgroundColor = colors.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPeriod !== '7days') {
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                }
              }}
            >
              7 ngày
            </button>
            <button
              style={periodButtonStyles(selectedPeriod === '30days')}
              onClick={() => setSelectedPeriod('30days')}
              onMouseEnter={(e) => {
                if (selectedPeriod !== '30days') {
                  e.currentTarget.style.backgroundColor = colors.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPeriod !== '30days') {
                  e.currentTarget.style.backgroundColor = colors.background.tertiary;
                }
              }}
            >
              30 ngày
            </button>
          </div>

          {/* Chart */}
          <div style={{ marginTop: spacing.md }}>
            <Chart
              type="line"
              data={marketTrendData}
              xAxis={{
                label: selectedPeriod === '7days' ? 'Ngày trong tuần' : 'Tuần',
                dataKey: 'x',
              }}
              yAxis={{
                label: 'Giá (VNĐ/kg)',
                dataKey: 'y',
              }}
              colors={[colors.primary.agriGreen]}
              showGrid={true}
              showLegend={false}
            />
          </div>

          <Text size="xSmall" style={{ color: colors.text.secondary, marginTop: spacing.sm }}>
            Giá trung bình: {selectedPeriod === '7days' ? '48,000' : '46,000'} VNĐ/kg
          </Text>
        </div>

        {/* Action Center - Trung tâm Tác vụ */}
        <div style={actionCenterStyles}>
          <Text.Title size="small" style={{ marginBottom: spacing.md }}>
            Trung tâm Tác vụ
          </Text.Title>

          {/* Connection Requests */}
          <div
            style={actionCardStyles(actionCenterData.connectionRequests.color)}
            onClick={() => console.log('View connection requests')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: actionCenterData.connectionRequests.color,
                }}
              >
                <Icon
                  name={actionCenterData.connectionRequests.icon}
                  size="lg"
                  color={colors.text.inverse}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Text.Title size="small" style={{ margin: 0 }}>
                    {actionCenterData.connectionRequests.label}
                  </Text.Title>
                  <div
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: actionCenterData.connectionRequests.color,
                      color: colors.text.inverse,
                      borderRadius: '12px',
                      fontSize: fontSize.small,
                      fontWeight: fontWeight.bold,
                    }}
                  >
                    {actionCenterData.connectionRequests.count}
                  </div>
                </div>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  {actionCenterData.connectionRequests.description}
                </Text>
              </div>
            </div>
          </div>

          {/* New Orders */}
          <div
            style={actionCardStyles(actionCenterData.newOrders.color)}
            onClick={() => console.log('View new orders')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: actionCenterData.newOrders.color,
                }}
              >
                <Icon
                  name={actionCenterData.newOrders.icon}
                  size="lg"
                  color={colors.text.inverse}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Text.Title size="small" style={{ margin: 0 }}>
                    {actionCenterData.newOrders.label}
                  </Text.Title>
                  <div
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: actionCenterData.newOrders.color,
                      color: colors.text.inverse,
                      borderRadius: '12px',
                      fontSize: fontSize.small,
                      fontWeight: fontWeight.bold,
                    }}
                  >
                    {actionCenterData.newOrders.count}
                  </div>
                </div>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  {actionCenterData.newOrders.description}
                </Text>
              </div>
            </div>
          </div>

          {/* Risk Alerts */}
          <div
            style={actionCardStyles(actionCenterData.riskAlerts.color)}
            onClick={() => console.log('View risk alerts')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: actionCenterData.riskAlerts.color,
                }}
              >
                <Icon
                  name={actionCenterData.riskAlerts.icon}
                  size="lg"
                  color={colors.text.primary}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Text.Title size="small" style={{ margin: 0 }}>
                    {actionCenterData.riskAlerts.label}
                  </Text.Title>
                  <div
                    style={{
                      padding: `${spacing.xs} ${spacing.sm}`,
                      backgroundColor: actionCenterData.riskAlerts.color,
                      color: colors.text.primary,
                      borderRadius: '12px',
                      fontSize: fontSize.small,
                      fontWeight: fontWeight.bold,
                    }}
                  >
                    {actionCenterData.riskAlerts.count}
                  </div>
                </div>
                <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
                  {actionCenterData.riskAlerts.description}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default TraderDashboardScreen;
