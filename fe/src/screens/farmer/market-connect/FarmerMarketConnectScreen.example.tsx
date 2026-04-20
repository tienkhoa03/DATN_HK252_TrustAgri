/**
 * Farmer Market & Connect Screen Examples
 * Các ví dụ sử dụng màn hình Thị trường và Kết nối
 */

import React from 'react';
import { FarmerMarketConnectScreen, TraderInvitation, TraderProfile, PriceData } from './FarmerMarketConnectScreen';

/**
 * Example 1: Basic Usage
 * Sử dụng cơ bản với dữ liệu mặc định
 */
export const BasicExample: React.FC = () => {
  return (
    <FarmerMarketConnectScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      productType="Sầu riêng"
    />
  );
};

/**
 * Example 2: With Custom Invitations
 * Với danh sách lời mời tùy chỉnh
 */
export const WithInvitationsExample: React.FC = () => {
  const invitations: TraderInvitation[] = [
    {
      id: '1',
      traderName: 'Công ty TNHH Trái cây Miền Nam',
      trustScore: 95,
      productType: 'Sầu riêng, Bưởi, Xoài',
      location: 'TP. Hồ Chí Minh',
      description: 'Chuyên thu mua sầu riêng chất lượng cao, thanh toán nhanh trong 24h',
    },
    {
      id: '2',
      traderName: 'Hợp tác xã Nông sản Đồng Tháp',
      trustScore: 88,
      productType: 'Sầu riêng, Xoài',
      location: 'Đồng Tháp',
      description: 'Hợp tác lâu dài, hỗ trợ kỹ thuật canh tác và đầu vào',
    },
    {
      id: '3',
      traderName: 'Công ty Xuất khẩu Nông sản Việt',
      trustScore: 92,
      productType: 'Sầu riêng',
      location: 'Bình Dương',
      description: 'Xuất khẩu sang Trung Quốc, Nhật Bản. Yêu cầu chất lượng cao',
    },
  ];

  return (
    <FarmerMarketConnectScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      invitations={invitations}
      onAcceptInvitation={(id) => {
        console.log('Accepted invitation:', id);
        alert(`Đã chấp nhận lời mời từ thương lái ${id}`);
      }}
      onRejectInvitation={(id) => {
        console.log('Rejected invitation:', id);
        alert(`Đã từ chối lời mời từ thương lái ${id}`);
      }}
    />
  );
};

/**
 * Example 3: With Available Traders
 * Với danh sách thương lái có sẵn
 */
export const WithTradersExample: React.FC = () => {
  const traders: TraderProfile[] = [
    {
      id: '1',
      name: 'Thương lái Nguyễn Văn A',
      trustScore: 92,
      productTypes: ['Sầu riêng', 'Măng cụt', 'Chôm chôm'],
      location: 'Tiền Giang',
      distance: 15,
      verified: true,
    },
    {
      id: '2',
      name: 'Công ty Xuất khẩu Trái cây',
      trustScore: 85,
      productTypes: ['Sầu riêng', 'Bưởi', 'Xoài', 'Thanh long'],
      location: 'Bến Tre',
      distance: 25,
      verified: true,
    },
    {
      id: '3',
      name: 'Hợp tác xã Nông dân Vĩnh Long',
      trustScore: 78,
      productTypes: ['Sầu riêng', 'Bưởi'],
      location: 'Vĩnh Long',
      distance: 35,
      verified: false,
    },
    {
      id: '4',
      name: 'Thương lái Trần Thị B',
      trustScore: 90,
      productTypes: ['Sầu riêng'],
      location: 'Cần Thơ',
      distance: 20,
      verified: true,
    },
  ];

  return (
    <FarmerMarketConnectScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      availableTraders={traders}
      onSendConnectionRequest={(id) => {
        console.log('Sent connection request to:', id);
        alert(`Đã gửi yêu cầu kết nối đến thương lái ${id}`);
      }}
    />
  );
};

/**
 * Example 4: With Custom Price Data
 * Với dữ liệu giá tùy chỉnh
 */
export const WithPriceDataExample: React.FC = () => {
  // Generate custom price history (last 7 days)
  const priceHistory: PriceData[] = [
    { date: new Date('2024-01-01'), price: 115000 },
    { date: new Date('2024-01-02'), price: 118000 },
    { date: new Date('2024-01-03'), price: 120000 },
    { date: new Date('2024-01-04'), price: 117000 },
    { date: new Date('2024-01-05'), price: 122000 },
    { date: new Date('2024-01-06'), price: 125000 },
    { date: new Date('2024-01-07'), price: 128000 },
  ];

  // Generate price forecast (next 7 days)
  const priceForecast: PriceData[] = [
    { date: new Date('2024-01-08'), price: 130000 },
    { date: new Date('2024-01-09'), price: 133000 },
    { date: new Date('2024-01-10'), price: 135000 },
    { date: new Date('2024-01-11'), price: 132000 },
    { date: new Date('2024-01-12'), price: 138000 },
    { date: new Date('2024-01-13'), price: 140000 },
    { date: new Date('2024-01-14'), price: 142000 },
  ];

  return (
    <FarmerMarketConnectScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      productType="Sầu riêng Monthong"
      priceHistory={priceHistory}
      priceForecast={priceForecast}
    />
  );
};

/**
 * Example 5: Complete Example
 * Ví dụ đầy đủ với tất cả dữ liệu
 */
export const CompleteExample: React.FC = () => {
  const invitations: TraderInvitation[] = [
    {
      id: '1',
      traderName: 'Công ty TNHH Trái cây Miền Nam',
      trustScore: 95,
      productType: 'Sầu riêng, Bưởi',
      location: 'TP. Hồ Chí Minh',
      description: 'Chuyên thu mua sầu riêng chất lượng cao',
    },
  ];

  const traders: TraderProfile[] = [
    {
      id: '1',
      name: 'Thương lái Nguyễn Văn A',
      trustScore: 92,
      productTypes: ['Sầu riêng', 'Măng cụt'],
      location: 'Tiền Giang',
      distance: 15,
      verified: true,
    },
    {
      id: '2',
      name: 'Công ty Xuất khẩu Trái cây',
      trustScore: 85,
      productTypes: ['Sầu riêng', 'Bưởi', 'Xoài'],
      location: 'Bến Tre',
      distance: 25,
      verified: true,
    },
  ];

  const priceHistory: PriceData[] = [
    { date: new Date('2024-01-01'), price: 115000 },
    { date: new Date('2024-01-02'), price: 118000 },
    { date: new Date('2024-01-03'), price: 120000 },
    { date: new Date('2024-01-04'), price: 117000 },
    { date: new Date('2024-01-05'), price: 122000 },
    { date: new Date('2024-01-06'), price: 125000 },
    { date: new Date('2024-01-07'), price: 128000 },
  ];

  const priceForecast: PriceData[] = [
    { date: new Date('2024-01-08'), price: 130000 },
    { date: new Date('2024-01-09'), price: 133000 },
    { date: new Date('2024-01-10'), price: 135000 },
    { date: new Date('2024-01-11'), price: 132000 },
    { date: new Date('2024-01-12'), price: 138000 },
    { date: new Date('2024-01-13'), price: 140000 },
    { date: new Date('2024-01-14'), price: 142000 },
  ];

  const handleAcceptInvitation = (id: string) => {
    console.log('Accepted invitation:', id);
    alert(`Đã chấp nhận lời mời từ thương lái ${id}`);
  };

  const handleRejectInvitation = (id: string) => {
    console.log('Rejected invitation:', id);
    alert(`Đã từ chối lời mời từ thương lái ${id}`);
  };

  const handleSendRequest = (id: string) => {
    console.log('Sent connection request to:', id);
    alert(`Đã gửi yêu cầu kết nối đến thương lái ${id}`);
  };

  return (
    <FarmerMarketConnectScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      productType="Sầu riêng Monthong"
      invitations={invitations}
      availableTraders={traders}
      priceHistory={priceHistory}
      priceForecast={priceForecast}
      onAcceptInvitation={handleAcceptInvitation}
      onRejectInvitation={handleRejectInvitation}
      onSendConnectionRequest={handleSendRequest}
    />
  );
};

/**
 * Example 6: With Back Navigation
 * Với nút quay lại
 */
export const WithBackNavigationExample: React.FC = () => {
  const handleBack = () => {
    console.log('Back button clicked');
    alert('Quay về màn hình chính');
  };

  return (
    <FarmerMarketConnectScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      onBack={handleBack}
    />
  );
};

/**
 * Example 7: Empty State
 * Trạng thái không có dữ liệu
 */
export const EmptyStateExample: React.FC = () => {
  return (
    <FarmerMarketConnectScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      invitations={[]}
      availableTraders={[]}
    />
  );
};
