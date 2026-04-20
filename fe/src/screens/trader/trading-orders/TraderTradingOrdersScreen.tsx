/**
 * Trader Trading & Orders Screen
 * Sàn giao dịch và Đơn hàng - Thực hiện nghiệp vụ thương mại với Người mua
 * 
 * Requirements: FR-T03, FR-T04, FR-T05, FR-T06, US-T03, 18.1-18.4
 * 
 * Features:
 * - Tab Kho hàng (My Products): Quản lý tin đăng bán, Tạo tin mới
 * - Tab Nhu cầu mua (Buying Requests): Yêu cầu từ người mua, Báo giá/Kết nối
 * - Tab Quản lý Đơn hàng (Orders): Trạng thái đơn hàng, Chi tiết đơn hàng
 * - Chi tiết Đơn hàng: Thông tin người mua, Gán nguồn cung, Truy xuất nguồn gốc
 */

import React, { useState } from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { Card } from '../../../design-system/components/Card';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface TraderTradingOrdersScreenProps {
  traderName?: string;
}

type TabType = 'my-products' | 'buying-requests' | 'orders';
type OrderStatus = 'pending' | 'deposited' | 'shipping' | 'completed';

interface Product {
  id: string;
  name: string;
  cropType: string;
  price: number;
  depositAmount: number;
  quantity: string;
  farmSource: string;
  images: string[];
  standard: string;
  status: 'active' | 'sold-out';
}

interface BuyingRequest {
  id: string;
  buyerName: string;
  cropType: string;
  quantity: string;
  priceRange: string;
  standard: string;
  description: string;
  requestDate: string;
}

interface Order {
  id: string;
  orderNumber: string;
  buyerName: string;
  cropType: string;
  quantity: string;
  totalAmount: number;
  depositPaid: number;
  status: OrderStatus;
  farmSource?: string;
  orderDate: string;
  deliveryDate?: string;
  traceabilityEnabled: boolean;
}

/**
 * Trader Trading & Orders Screen Component
 * Requirements: FR-T03, FR-T04, FR-T05, FR-T06, US-T03, 18.1-18.4
 */
export const TraderTradingOrdersScreen: React.FC<TraderTradingOrdersScreenProps> = ({
  traderName = 'Thương lái',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('my-products');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Mock data - My Products
  const myProducts: Product[] = [
    {
      id: '1',
      name: 'Sầu riêng Monthong',
      cropType: 'Sầu riêng',
      price: 120000,
      depositAmount: 60000,
      quantity: '500 kg',
      farmSource: 'Farm Lab Tiến Khoa',
      images: ['product1.jpg'],
      standard: 'VietGAP',
      status: 'active',
    },
    {
      id: '2',
      name: 'Bưởi Da Xanh',
      cropType: 'Bưởi',
      price: 45000,
      depositAmount: 20000,
      quantity: '1 tấn',
      farmSource: 'Farm Lab Văn Minh',
      images: ['product2.jpg'],
      standard: 'GlobalGAP',
      status: 'active',
    },
    {
      id: '3',
      name: 'Xoài Cát Chu',
      cropType: 'Xoài',
      price: 55000,
      depositAmount: 25000,
      quantity: '0 kg',
      farmSource: 'Farm Lab Thanh Tùng',
      images: ['product3.jpg'],
      standard: 'VietGAP',
      status: 'sold-out',
    },
  ];

  // Mock data - Buying Requests
  const buyingRequests: BuyingRequest[] = [
    {
      id: '1',
      buyerName: 'Nhà hàng Sài Gòn',
      cropType: 'Sầu riêng',
      quantity: '200 kg',
      priceRange: '100,000 - 130,000 VNĐ/kg',
      standard: 'VietGAP',
      description: 'Cần sầu riêng size lớn, vỏ vàng đều, không sẹo',
      requestDate: '1 ngày trước',
    },
    {
      id: '2',
      buyerName: 'Siêu thị Organic',
      cropType: 'Bưởi',
      quantity: '500 kg',
      priceRange: '40,000 - 50,000 VNĐ/kg',
      standard: 'Hữu cơ',
      description: 'Bưởi da xanh, size trung bình, không thuốc BVTV',
      requestDate: '3 ngày trước',
    },
    {
      id: '3',
      buyerName: 'Cửa hàng Trái cây Tươi',
      cropType: 'Xoài',
      quantity: '300 kg',
      priceRange: '50,000 - 60,000 VNĐ/kg',
      standard: 'VietGAP',
      description: 'Xoài cát chu, độ ngọt trên 14 Brix',
      requestDate: '5 ngày trước',
    },
  ];

  // Mock data - Orders
  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      buyerName: 'Nhà hàng Sài Gòn',
      cropType: 'Sầu riêng Monthong',
      quantity: '200 kg',
      totalAmount: 24000000,
      depositPaid: 12000000,
      status: 'deposited',
      farmSource: 'Farm Lab Tiến Khoa',
      orderDate: '15/12/2024',
      deliveryDate: '25/12/2024',
      traceabilityEnabled: true,
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      buyerName: 'Siêu thị Organic',
      cropType: 'Bưởi Da Xanh',
      quantity: '500 kg',
      totalAmount: 22500000,
      depositPaid: 0,
      status: 'pending',
      orderDate: '14/12/2024',
      traceabilityEnabled: false,
    },
    {
      id: '3',
      orderNumber: 'ORD-2024-003',
      buyerName: 'Cửa hàng Trái cây',
      cropType: 'Xoài Cát Chu',
      quantity: '300 kg',
      totalAmount: 16500000,
      depositPaid: 16500000,
      status: 'shipping',
      farmSource: 'Farm Lab Thanh Tùng',
      orderDate: '10/12/2024',
      deliveryDate: '16/12/2024',
      traceabilityEnabled: true,
    },
  ];

  // Get order status info
  const getOrderStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Chờ xác nhận', color: colors.functional.warningYellow };
      case 'deposited':
        return { label: 'Đã đặt cọc', color: colors.primary.zaloBlue };
      case 'shipping':
        return { label: 'Đang giao', color: colors.primary.agriGreen };
      case 'completed':
        return { label: 'Hoàn tất', color: colors.text.secondary };
      default:
        return { label: 'Không xác định', color: colors.text.secondary };
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Styles
  const headerStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
  };

  const tabBarStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.secondary}`,
    overflowX: 'auto',
  };

  const tabButtonStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.primary.zaloBlue}` : '2px solid transparent',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  };

  const productCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: spacing.md,
  };

  const requestCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: spacing.md,
  };

  const orderCardStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: spacing.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const actionButtonStyles = (isPrimary: boolean): React.CSSProperties => ({
    flex: 1,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: isPrimary ? colors.primary.zaloBlue : colors.background.secondary,
    color: isPrimary ? colors.text.inverse : colors.text.primary,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    transition: 'all 0.2s',
  });

  const fabStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: spacing.xl,
    right: spacing.md,
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: colors.primary.zaloBlue,
    border: 'none',
    boxShadow: '0 4px 12px rgba(0, 104, 255, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    zIndex: 1000,
  };

  const orderDetailStyles: React.CSSProperties = {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    marginTop: spacing.md,
  };

  // Render My Products Tab
  const renderMyProductsTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <Text.Title size="small">
          Kho hàng ({myProducts.length})
        </Text.Title>
      </div>

      {myProducts.map((product) => (
        <div key={product.id} style={productCardStyles}>
          <div style={{ display: 'flex', gap: spacing.md }}>
            {/* Product Image Placeholder */}
            <div
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: colors.background.secondary,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="package" size="lg" color={colors.text.secondary} />
            </div>

            {/* Product Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text.Title size="small" style={{ margin: 0 }}>
                    {product.name}
                  </Text.Title>
                  <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                    {product.farmSource}
                  </Text>
                </div>
                <div
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    backgroundColor: product.status === 'active' 
                      ? `${colors.primary.agriGreen}15` 
                      : `${colors.text.secondary}15`,
                    borderRadius: '6px',
                  }}
                >
                  <Text size="xSmall" style={{ 
                    color: product.status === 'active' ? colors.primary.agriGreen : colors.text.secondary,
                    fontWeight: fontWeight.semibold 
                  }}>
                    {product.status === 'active' ? 'Đang bán' : 'Hết hàng'}
                  </Text>
                </div>
              </div>

              <div style={{ marginTop: spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                  <Icon name="dollar-sign" size="sm" color={colors.primary.zaloBlue} />
                  <Text size="small" style={{ fontWeight: fontWeight.semibold }}>
                    {formatCurrency(product.price)}/kg
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                  <Icon name="package" size="sm" color={colors.text.secondary} />
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>
                    Còn lại: {product.quantity}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name="check" size="sm" color={colors.primary.agriGreen} />
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>
                    {product.standard}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md }}>
            <button
              style={actionButtonStyles(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }}
            >
              Chỉnh sửa
            </button>
            <button
              style={actionButtonStyles(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      ))}

      {/* FAB - Create New Product */}
      <button
        style={fabStyles}
        onClick={() => setShowCreateProduct(true)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        aria-label="Tạo tin mới"
      >
        <Icon name="add" size="lg" color={colors.text.inverse} />
      </button>
    </div>
  );

  // Render Buying Requests Tab
  const renderBuyingRequestsTab = () => (
    <div>
      <Text.Title size="small" style={{ marginBottom: spacing.md }}>
        Nhu cầu mua ({buyingRequests.length})
      </Text.Title>

      {buyingRequests.map((request) => (
        <div key={request.id} style={requestCardStyles}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
            <div>
              <Text.Title size="small" style={{ margin: 0 }}>
                {request.buyerName}
              </Text.Title>
              <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                {request.requestDate}
              </Text>
            </div>
            <div
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: `${colors.primary.agriGreen}15`,
                borderRadius: '6px',
              }}
            >
              <Text size="xSmall" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.semibold }}>
                {request.cropType}
              </Text>
            </div>
          </div>

          <div
            style={{
              padding: spacing.sm,
              backgroundColor: colors.background.secondary,
              borderRadius: '6px',
              marginBottom: spacing.sm,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Icon name="package" size="sm" color={colors.text.secondary} />
              <Text size="small">
                Số lượng: <span style={{ fontWeight: fontWeight.medium }}>{request.quantity}</span>
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Icon name="dollar-sign" size="sm" color={colors.text.secondary} />
              <Text size="small">
                Giá: <span style={{ fontWeight: fontWeight.medium }}>{request.priceRange}</span>
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Icon name="check" size="sm" color={colors.primary.agriGreen} />
              <Text size="small">
                Tiêu chuẩn: <span style={{ fontWeight: fontWeight.medium }}>{request.standard}</span>
              </Text>
            </div>
          </div>

          <div
            style={{
              padding: spacing.sm,
              backgroundColor: `${colors.primary.zaloBlue}08`,
              borderRadius: '6px',
              marginBottom: spacing.md,
            }}
          >
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Mô tả yêu cầu:
            </Text>
            <Text size="small" style={{ marginTop: spacing.xs }}>
              {request.description}
            </Text>
          </div>

          <div style={{ display: 'flex', gap: spacing.sm }}>
            <button
              style={actionButtonStyles(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }}
            >
              Xem chi tiết
            </button>
            <button
              style={actionButtonStyles(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Báo giá / Kết nối
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Render Orders Tab
  const renderOrdersTab = () => (
    <div>
      <Text.Title size="small" style={{ marginBottom: spacing.md }}>
        Quản lý Đơn hàng ({orders.length})
      </Text.Title>

      {orders.map((order) => {
        const statusInfo = getOrderStatusInfo(order.status);
        return (
          <div
            key={order.id}
            style={orderCardStyles}
            onClick={() => setSelectedOrder(order)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              <div>
                <Text.Title size="small" style={{ margin: 0 }}>
                  {order.orderNumber}
                </Text.Title>
                <Text size="xSmall" style={{ color: colors.text.secondary, margin: 0 }}>
                  {order.buyerName}
                </Text>
              </div>
              <div
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: `${statusInfo.color}15`,
                  borderRadius: '6px',
                }}
              >
                <Text size="xSmall" style={{ color: statusInfo.color, fontWeight: fontWeight.semibold }}>
                  {statusInfo.label}
                </Text>
              </div>
            </div>

            <div style={{ marginBottom: spacing.sm }}>
              <Text size="small" style={{ fontWeight: fontWeight.medium }}>
                {order.cropType}
              </Text>
              <Text size="xSmall" style={{ color: colors.text.secondary }}>
                Số lượng: {order.quantity}
              </Text>
            </div>

            <div
              style={{
                padding: spacing.sm,
                backgroundColor: colors.background.secondary,
                borderRadius: '6px',
                marginBottom: spacing.sm,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <Text size="xSmall" style={{ color: colors.text.secondary }}>
                  Tổng giá trị:
                </Text>
                <Text size="small" style={{ fontWeight: fontWeight.semibold }}>
                  {formatCurrency(order.totalAmount)}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text size="xSmall" style={{ color: colors.text.secondary }}>
                  Đã đặt cọc:
                </Text>
                <Text size="small" style={{ fontWeight: fontWeight.semibold, color: colors.primary.agriGreen }}>
                  {formatCurrency(order.depositPaid)}
                </Text>
              </div>
            </div>

            <div style={{ display: 'flex', gap: spacing.md, fontSize: fontSize.small }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <Icon name="clock" size="sm" color={colors.text.secondary} />
                <Text size="xSmall" style={{ color: colors.text.secondary }}>
                  {order.orderDate}
                </Text>
              </div>
              {order.farmSource && (
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  <Icon name="plant" size="sm" color={colors.primary.agriGreen} />
                  <Text size="xSmall" style={{ color: colors.text.secondary }}>
                    {order.farmSource}
                  </Text>
                </div>
              )}
            </div>

            {order.traceabilityEnabled && (
              <div
                style={{
                  marginTop: spacing.sm,
                  padding: spacing.xs,
                  backgroundColor: `${colors.primary.agriGreen}15`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                <Icon name="qr-code" size="sm" color={colors.primary.agriGreen} />
                <Text size="xSmall" style={{ color: colors.primary.agriGreen, fontWeight: fontWeight.medium }}>
                  Truy xuất nguồn gốc đã kích hoạt
                </Text>
              </div>
            )}
          </div>
        );
      })}

      {/* Order Detail Modal */}
      {selectedOrder && renderOrderDetail()}
    </div>
  );

  // Render Order Detail
  const renderOrderDetail = () => {
    if (!selectedOrder) return null;
    const statusInfo = getOrderStatusInfo(selectedOrder.status);

    return (
      <div style={orderDetailStyles}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <Text.Title size="small" style={{ margin: 0 }}>
            Chi tiết Đơn hàng
          </Text.Title>
          <button
            style={{
              padding: spacing.sm,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedOrder(null)}
            aria-label="Đóng"
          >
            <Icon name="close" size="md" color={colors.text.secondary} />
          </button>
        </div>

        {/* Order Info */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.background.secondary,
            borderRadius: '8px',
            marginBottom: spacing.md,
          }}
        >
          <div style={{ marginBottom: spacing.sm }}>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Mã đơn hàng
            </Text>
            <Text.Title size="small" style={{ margin: 0 }}>
              {selectedOrder.orderNumber}
            </Text.Title>
          </div>

          <div style={{ marginBottom: spacing.sm }}>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Trạng thái
            </Text>
            <div
              style={{
                display: 'inline-block',
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: `${statusInfo.color}15`,
                borderRadius: '6px',
                marginTop: spacing.xs,
              }}
            >
              <Text size="small" style={{ color: statusInfo.color, fontWeight: fontWeight.semibold }}>
                {statusInfo.label}
              </Text>
            </div>
          </div>

          <div style={{ marginBottom: spacing.sm }}>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Người mua
            </Text>
            <Text size="small" style={{ fontWeight: fontWeight.medium }}>
              {selectedOrder.buyerName}
            </Text>
          </div>

          <div style={{ marginBottom: spacing.sm }}>
            <Text size="xSmall" style={{ color: colors.text.secondary }}>
              Sản phẩm
            </Text>
            <Text size="small" style={{ fontWeight: fontWeight.medium }}>
              {selectedOrder.cropType} - {selectedOrder.quantity}
            </Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <Text size="small" style={{ color: colors.text.secondary }}>
              Tổng giá trị:
            </Text>
            <Text size="small" style={{ fontWeight: fontWeight.bold }}>
              {formatCurrency(selectedOrder.totalAmount)}
            </Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text size="small" style={{ color: colors.text.secondary }}>
              Số tiền đã cọc:
            </Text>
            <Text size="small" style={{ fontWeight: fontWeight.bold, color: colors.primary.agriGreen }}>
              {formatCurrency(selectedOrder.depositPaid)}
            </Text>
          </div>
        </div>

        {/* Farm Source Assignment */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.background.secondary,
            borderRadius: '8px',
            marginBottom: spacing.md,
          }}
        >
          <Text.Title size="small" style={{ marginBottom: spacing.sm }}>
            Nguồn cung
          </Text.Title>

          {selectedOrder.farmSource ? (
            <div
              style={{
                padding: spacing.sm,
                backgroundColor: colors.background.primary,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Icon name="plant" size="md" color={colors.primary.agriGreen} />
              <div>
                <Text size="small" style={{ fontWeight: fontWeight.medium }}>
                  {selectedOrder.farmSource}
                </Text>
                <Text size="xSmall" style={{ color: colors.text.secondary }}>
                  Đã gán nguồn cung
                </Text>
              </div>
            </div>
          ) : (
            <button
              style={{
                ...actionButtonStyles(true),
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Gán nguồn cung từ vườn nông dân
            </button>
          )}
        </div>

        {/* Traceability */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: selectedOrder.traceabilityEnabled
              ? `${colors.primary.agriGreen}15`
              : colors.background.secondary,
            borderRadius: '8px',
            marginBottom: spacing.md,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Icon
              name="qr-code"
              size="md"
              color={selectedOrder.traceabilityEnabled ? colors.primary.agriGreen : colors.text.secondary}
            />
            <Text.Title size="small" style={{ margin: 0 }}>
              Truy xuất nguồn gốc
            </Text.Title>
          </div>

          {selectedOrder.traceabilityEnabled ? (
            <Text size="small" style={{ color: colors.primary.agriGreen }}>
              ✓ Đã kích hoạt - Người mua có thể quét QR để xem nguồn gốc
            </Text>
          ) : (
            <div>
              <Text size="small" style={{ color: colors.text.secondary, marginBottom: spacing.sm }}>
                Chưa kích hoạt - Cần gán nguồn cung trước
              </Text>
              <button
                style={{
                  ...actionButtonStyles(false),
                  width: '100%',
                }}
                disabled
              >
                Kích hoạt truy xuất nguồn gốc
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {selectedOrder.status === 'pending' && (
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <button
              style={actionButtonStyles(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.tertiary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.secondary;
              }}
            >
              Từ chối
            </button>
            <button
              style={actionButtonStyles(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Xác nhận đơn hàng
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Page className="trader-trading-orders-screen">
      {/* Header */}
      <div style={headerStyles}>
        <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
          Sàn giao dịch
        </Text>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          {traderName}
        </Text.Title>
      </div>

      {/* Tab Bar */}
      <div style={tabBarStyles}>
        <button
          style={tabButtonStyles(activeTab === 'my-products')}
          onClick={() => setActiveTab('my-products')}
        >
          Kho hàng
        </button>
        <button
          style={tabButtonStyles(activeTab === 'buying-requests')}
          onClick={() => setActiveTab('buying-requests')}
        >
          Nhu cầu mua ({buyingRequests.length})
        </button>
        <button
          style={tabButtonStyles(activeTab === 'orders')}
          onClick={() => setActiveTab('orders')}
        >
          Đơn hàng ({orders.length})
        </button>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {activeTab === 'my-products' && renderMyProductsTab()}
        {activeTab === 'buying-requests' && renderBuyingRequestsTab()}
        {activeTab === 'orders' && renderOrdersTab()}
      </div>
    </Page>
  );
};

export default TraderTradingOrdersScreen;
