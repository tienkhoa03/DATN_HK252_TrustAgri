/**
 * Buyer Orders & Proposals Screen
 * Quản lý Đơn hàng và Đề xuất - Quản lý giao dịch và tương tác với thương lái
 * 
 * Requirements: FR-U03, FR-U04, FR-U06
 * 
 * Features:
 * - Tab Chờ xác nhận (Proposals): Danh sách Báo giá/Đề xuất từ thương lái
 * - Tab Đang thực hiện (Active Orders): Danh sách đơn hàng đã đặt cọc
 * - Tab Lịch sử (History): Đơn hàng đã hoàn tất
 */

import React, { useState } from 'react';
import { Page, Box, Text } from 'zmp-ui';
import { Icon } from '../../../design-system/components/Icon';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface BuyerOrdersProposalsScreenProps {
  buyerName?: string;
}

type TabType = 'proposals' | 'active' | 'history';

interface Proposal {
  id: string;
  traderName: string;
  productName: string;
  price: string;
  farmLabName: string;
  farmLabId: string;
  quantity: string;
  deliveryDate: string;
  timestamp: string;
}

interface Order {
  id: string;
  traderName: string;
  productName: string;
  price: string;
  farmLabName: string;
  quantity: string;
  depositAmount: string;
  status: 'deposited' | 'cultivating' | 'pre-harvest' | 'delivering';
  orderDate: string;
  estimatedDelivery: string;
}

interface HistoryOrder {
  id: string;
  traderName: string;
  productName: string;
  price: string;
  quantity: string;
  completedDate: string;
  rating?: number;
  canReorder: boolean;
}

/**
 * Buyer Orders & Proposals Screen Component
 * Requirements: FR-U03, FR-U04, FR-U06
 */
export const BuyerOrdersProposalsScreen: React.FC<BuyerOrdersProposalsScreenProps> = ({
  buyerName = 'Người mua',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('proposals');

  // Mock proposals data - Báo giá/Đề xuất
  const proposals: Proposal[] = [
    {
      id: 'P001',
      traderName: 'Thương lái Minh Tâm',
      productName: 'Bưởi Da Xanh',
      price: '42,000 VNĐ/kg',
      farmLabName: 'Vườn chú Bảy',
      farmLabId: 'FL001',
      quantity: '50 kg',
      deliveryDate: '15/01/2025',
      timestamp: '2 giờ trước',
    },
    {
      id: 'P002',
      traderName: 'Công ty Nông sản Xanh',
      productName: 'Sầu riêng Monthong',
      price: '115,000 VNĐ/kg',
      farmLabName: 'Farm Lab Tiến Khoa',
      farmLabId: 'FL002',
      quantity: '30 kg',
      deliveryDate: '20/01/2025',
      timestamp: '5 giờ trước',
    },
    {
      id: 'P003',
      traderName: 'Thương lái Hồng Phúc',
      productName: 'Xoài Cát Chu',
      price: '33,000 VNĐ/kg',
      farmLabName: 'Vườn cô Ba',
      farmLabId: 'FL003',
      quantity: '100 kg',
      deliveryDate: '18/01/2025',
      timestamp: '1 ngày trước',
    },
  ];

  // Mock active orders data - Đơn hàng đang thực hiện
  const activeOrders: Order[] = [
    {
      id: 'O001',
      traderName: 'Thương lái Minh Tâm',
      productName: 'Bưởi Da Xanh',
      price: '45,000 VNĐ/kg',
      farmLabName: 'Vườn chú Bảy',
      quantity: '50 kg',
      depositAmount: '1,125,000 VNĐ',
      status: 'cultivating',
      orderDate: '01/12/2024',
      estimatedDelivery: '15/01/2025',
    },
    {
      id: 'O002',
      traderName: 'Công ty Nông sản Xanh',
      productName: 'Thanh Long Ruột Đỏ',
      price: '28,000 VNĐ/kg',
      farmLabName: 'Vườn anh Tư',
      quantity: '80 kg',
      depositAmount: '1,120,000 VNĐ',
      status: 'pre-harvest',
      orderDate: '25/11/2024',
      estimatedDelivery: '10/01/2025',
    },
    {
      id: 'O003',
      traderName: 'Thương lái Hồng Phúc',
      productName: 'Cam Sành',
      price: '32,000 VNĐ/kg',
      farmLabName: 'Vườn chị Năm',
      quantity: '60 kg',
      depositAmount: '960,000 VNĐ',
      status: 'delivering',
      orderDate: '20/11/2024',
      estimatedDelivery: '05/01/2025',
    },
  ];

  // Mock history orders data - Lịch sử đơn hàng
  const historyOrders: HistoryOrder[] = [
    {
      id: 'H001',
      traderName: 'Thương lái Minh Tâm',
      productName: 'Bưởi Da Xanh',
      price: '45,000 VNĐ/kg',
      quantity: '50 kg',
      completedDate: '15/11/2024',
      rating: 5,
      canReorder: true,
    },
    {
      id: 'H002',
      traderName: 'Công ty Nông sản Xanh',
      productName: 'Xoài Cát Chu',
      price: '35,000 VNĐ/kg',
      quantity: '40 kg',
      completedDate: '10/11/2024',
      rating: 4,
      canReorder: true,
    },
    {
      id: 'H003',
      traderName: 'Thương lái Hồng Phúc',
      productName: 'Nhãn Lồng',
      price: '55,000 VNĐ/kg',
      quantity: '30 kg',
      completedDate: '05/11/2024',
      canReorder: false,
    },
  ];

  // Status labels and colors
  const statusConfig = {
    deposited: { label: 'Đã cọc', color: colors.primary.zaloBlue },
    cultivating: { label: 'Đang canh tác', color: colors.primary.agriGreen },
    'pre-harvest': { label: 'Chờ thu hoạch', color: colors.functional.warningYellow },
    delivering: { label: 'Đang giao', color: colors.primary.zaloBlue },
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
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const tabStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? `2px solid ${colors.primary.zaloBlue}` : '2px solid transparent',
    color: isActive ? colors.primary.zaloBlue : colors.text.secondary,
    fontSize: fontSize.body,
    fontWeight: isActive ? fontWeight.semibold : fontWeight.regular,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const contentStyles: React.CSSProperties = {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: colors.background.primary,
    borderRadius: '12px',
    padding: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  };

  const cardHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  };

  const traderNameStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
  };

  const timestampStyles: React.CSSProperties = {
    fontSize: fontSize.small,
    color: colors.text.secondary,
  };

  const productNameStyles: React.CSSProperties = {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  };

  const infoRowStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    fontSize: fontSize.caption,
  };

  const labelStyles: React.CSSProperties = {
    color: colors.text.secondary,
  };

  const valueStyles: React.CSSProperties = {
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  };

  const priceStyles: React.CSSProperties = {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.primary.zaloBlue,
    marginTop: spacing.sm,
  };

  const farmLinkStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    color: colors.primary.agriGreen,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    marginTop: spacing.xs,
    textDecoration: 'none',
  };

  const buttonRowStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.md,
  };

  const buttonStyles = (variant: 'primary' | 'secondary' | 'outline'): React.CSSProperties => ({
    flex: 1,
    padding: spacing.sm,
    backgroundColor:
      variant === 'primary'
        ? colors.primary.agriGreen
        : variant === 'secondary'
        ? colors.primary.zaloBlue
        : 'transparent',
    color: variant === 'outline' ? colors.text.secondary : colors.text.inverse,
    border: variant === 'outline' ? `1px solid ${colors.background.tertiary}` : 'none',
    borderRadius: '6px',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const statusBarStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: '8px',
  };

  const statusDotStyles = (isActive: boolean, color: string): React.CSSProperties => ({
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: isActive ? color : colors.background.tertiary,
    border: isActive ? `2px solid ${color}` : `2px solid ${colors.background.tertiary}`,
  });

  const statusLineStyles = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    height: '2px',
    backgroundColor: isActive ? colors.primary.agriGreen : colors.background.tertiary,
  });

  const statusLabelStyles: React.CSSProperties = {
    fontSize: fontSize.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  };

  const ratingStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  };

  const emptyStateStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: `${spacing.xl} ${spacing.md}`,
    color: colors.text.secondary,
  };

  // Render Proposals Tab
  const renderProposals = () => {
    if (proposals.length === 0) {
      return (
        <div style={emptyStateStyles}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📋</div>
          <Text size="normal" style={{ color: colors.text.secondary }}>
            Chưa có đề xuất nào
          </Text>
        </div>
      );
    }

    return proposals.map((proposal) => (
      <div key={proposal.id} style={cardStyles}>
        <div style={cardHeaderStyles}>
          <div>
            <div style={traderNameStyles}>{proposal.traderName}</div>
            <div style={timestampStyles}>{proposal.timestamp}</div>
          </div>
        </div>

        <div style={productNameStyles}>{proposal.productName}</div>

        <div style={infoRowStyles}>
          <span style={labelStyles}>Số lượng:</span>
          <span style={valueStyles}>{proposal.quantity}</span>
        </div>

        <div style={infoRowStyles}>
          <span style={labelStyles}>Ngày giao:</span>
          <span style={valueStyles}>{proposal.deliveryDate}</span>
        </div>

        <div style={priceStyles}>{proposal.price}</div>

        <a
          href="#"
          style={farmLinkStyles}
          onClick={(e) => {
            e.preventDefault();
            console.log('View farm:', proposal.farmLabId);
          }}
        >
          <Icon name="map-pin" size="sm" color={colors.primary.agriGreen} />
          {proposal.farmLabName}
        </a>

        <div style={buttonRowStyles}>
          <button
            style={buttonStyles('primary')}
            onClick={() => console.log('Accept proposal:', proposal.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#35A55F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary.agriGreen;
            }}
          >
            ✓ Chấp nhận
          </button>
          <button
            style={buttonStyles('outline')}
            onClick={() => console.log('Reject proposal:', proposal.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            ✕ Từ chối
          </button>
        </div>
      </div>
    ));
  };

  // Render Active Orders Tab
  const renderActiveOrders = () => {
    if (activeOrders.length === 0) {
      return (
        <div style={emptyStateStyles}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📦</div>
          <Text size="normal" style={{ color: colors.text.secondary }}>
            Chưa có đơn hàng nào
          </Text>
        </div>
      );
    }

    return activeOrders.map((order) => {
      const currentStatus = statusConfig[order.status];
      const statusIndex = Object.keys(statusConfig).indexOf(order.status);

      return (
        <div key={order.id} style={cardStyles}>
          <div style={cardHeaderStyles}>
            <div>
              <div style={traderNameStyles}>{order.traderName}</div>
              <div style={timestampStyles}>Đặt ngày {order.orderDate}</div>
            </div>
          </div>

          <div style={productNameStyles}>{order.productName}</div>

          <div style={infoRowStyles}>
            <span style={labelStyles}>Số lượng:</span>
            <span style={valueStyles}>{order.quantity}</span>
          </div>

          <div style={infoRowStyles}>
            <span style={labelStyles}>Đã đặt cọc:</span>
            <span style={valueStyles}>{order.depositAmount}</span>
          </div>

          <div style={infoRowStyles}>
            <span style={labelStyles}>Dự kiến giao:</span>
            <span style={valueStyles}>{order.estimatedDelivery}</span>
          </div>

          {/* Status Progress Bar */}
          <div style={statusBarStyles}>
            {Object.entries(statusConfig).map(([key, config], index) => (
              <React.Fragment key={key}>
                <div style={statusDotStyles(index <= statusIndex, config.color)} />
                {index < Object.keys(statusConfig).length - 1 && (
                  <div style={statusLineStyles(index < statusIndex)} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={statusLabelStyles}>
            Trạng thái: <strong>{currentStatus.label}</strong>
          </div>

          <div style={buttonRowStyles}>
            <button
              style={buttonStyles('secondary')}
              onClick={() => console.log('Monitor farm:', order.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0052CC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
              }}
            >
              👁 Giám sát vườn
            </button>
          </div>
        </div>
      );
    });
  };

  // Render History Tab
  const renderHistory = () => {
    if (historyOrders.length === 0) {
      return (
        <div style={emptyStateStyles}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>📜</div>
          <Text size="normal" style={{ color: colors.text.secondary }}>
            Chưa có lịch sử đơn hàng
          </Text>
        </div>
      );
    }

    return historyOrders.map((order) => (
      <div key={order.id} style={cardStyles}>
        <div style={cardHeaderStyles}>
          <div>
            <div style={traderNameStyles}>{order.traderName}</div>
            <div style={timestampStyles}>Hoàn tất {order.completedDate}</div>
          </div>
        </div>

        <div style={productNameStyles}>{order.productName}</div>

        <div style={infoRowStyles}>
          <span style={labelStyles}>Số lượng:</span>
          <span style={valueStyles}>{order.quantity}</span>
        </div>

        <div style={priceStyles}>{order.price}</div>

        {order.rating && (
          <div style={ratingStyles}>
            {[...Array(5)].map((_, index) => (
              <Icon
                key={index}
                name={index < order.rating! ? 'star-filled' : 'star'}
                size="sm"
                color={index < order.rating! ? colors.functional.warningYellow : colors.text.disabled}
              />
            ))}
          </div>
        )}

        <div style={buttonRowStyles}>
          {order.canReorder && (
            <button
              style={buttonStyles('primary')}
              onClick={() => console.log('Reorder:', order.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#35A55F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.agriGreen;
              }}
            >
              🔄 Mua lại
            </button>
          )}
          {!order.rating && (
            <button
              style={buttonStyles('secondary')}
              onClick={() => console.log('Rate order:', order.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0052CC';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.zaloBlue;
              }}
            >
              ⭐ Đánh giá
            </button>
          )}
        </div>
      </div>
    ));
  };

  return (
    <Page className="buyer-orders-proposals-screen">
      {/* Header */}
      <div style={headerStyles}>
        <Text size="small" style={{ color: colors.text.secondary, margin: 0 }}>
          Quản lý đơn hàng
        </Text>
        <Text.Title size="normal" style={{ margin: 0, fontWeight: fontWeight.semibold }}>
          {buyerName}
        </Text.Title>
      </div>

      {/* Tab Bar */}
      <div style={tabBarStyles}>
        <button
          style={tabStyles(activeTab === 'proposals')}
          onClick={() => setActiveTab('proposals')}
        >
          Chờ xác nhận
          {proposals.length > 0 && (
            <span
              style={{
                marginLeft: spacing.xs,
                padding: '2px 6px',
                backgroundColor: colors.functional.alertRed,
                color: colors.text.inverse,
                borderRadius: '10px',
                fontSize: fontSize.small,
              }}
            >
              {proposals.length}
            </span>
          )}
        </button>
        <button
          style={tabStyles(activeTab === 'active')}
          onClick={() => setActiveTab('active')}
        >
          Đang thực hiện
        </button>
        <button
          style={tabStyles(activeTab === 'history')}
          onClick={() => setActiveTab('history')}
        >
          Lịch sử
        </button>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {activeTab === 'proposals' && renderProposals()}
        {activeTab === 'active' && renderActiveOrders()}
        {activeTab === 'history' && renderHistory()}
      </div>
    </Page>
  );
};

export default BuyerOrdersProposalsScreen;
