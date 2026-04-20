/**
 * Farmer Dashboard Screen Examples
 * Các ví dụ sử dụng màn hình Farmer Dashboard
 */

import React from 'react';
import { FarmerDashboardScreen } from './FarmerDashboardScreen';

/**
 * Example 1: Basic Usage
 * Sử dụng cơ bản với giá trị mặc định
 */
export const BasicExample = () => {
  return <FarmerDashboardScreen />;
};

/**
 * Example 2: With Custom Farmer Name
 * Với tên nông dân tùy chỉnh
 */
export const WithCustomNameExample = () => {
  return (
    <FarmerDashboardScreen
      farmerName="Anh Minh"
      farmName="Farm Lab Mekong"
    />
  );
};

/**
 * Example 3: With Notifications
 * Với thông báo chưa đọc
 */
export const WithNotificationsExample = () => {
  return (
    <FarmerDashboardScreen
      farmerName="Chị Lan"
      farmName="Farm Lab Đồng Tháp"
      notificationCount={5}
    />
  );
};

/**
 * Example 4: With Avatar
 * Với ảnh đại diện
 */
export const WithAvatarExample = () => {
  return (
    <FarmerDashboardScreen
      farmerName="Anh Bảy"
      farmName="Farm Lab Bưởi Da Xanh"
      avatarUrl="https://via.placeholder.com/44"
      notificationCount={2}
    />
  );
};

/**
 * Example 5: Multiple Farmers Comparison
 * So sánh nhiều nông dân
 */
export const MultipleFarmersExample = () => {
  const farmers = [
    {
      name: 'Anh Minh',
      farm: 'Farm Lab Mekong',
      notifications: 3,
    },
    {
      name: 'Chị Lan',
      farm: 'Farm Lab Đồng Tháp',
      notifications: 0,
    },
    {
      name: 'Anh Bảy',
      farm: 'Farm Lab Bưởi',
      notifications: 7,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {farmers.map((farmer, index) => (
        <div key={index} style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
          <FarmerDashboardScreen
            farmerName={farmer.name}
            farmName={farmer.farm}
            notificationCount={farmer.notifications}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Example 6: Integration with State Management
 * Tích hợp với quản lý state
 */
export const WithStateManagementExample = () => {
  const [farmerData, setFarmerData] = React.useState({
    name: 'Anh Minh',
    farm: 'Farm Lab Mekong',
    notifications: 3,
  });

  // Simulate notification updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setFarmerData(prev => ({
        ...prev,
        notifications: Math.floor(Math.random() * 10),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <FarmerDashboardScreen
      farmerName={farmerData.name}
      farmName={farmerData.farm}
      notificationCount={farmerData.notifications}
    />
  );
};

/**
 * Example 7: Responsive Layout Test
 * Test responsive layout
 */
export const ResponsiveLayoutExample = () => {
  const screenSizes = [
    { width: '360px', label: 'Small (360px)' },
    { width: '375px', label: 'Medium (375px)' },
    { width: '414px', label: 'Large (414px)' },
  ];

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {screenSizes.map((size, index) => (
        <div key={index} style={{ width: size.width, border: '2px solid #0068FF', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '8px', backgroundColor: '#0068FF', color: 'white', textAlign: 'center', fontSize: '12px' }}>
            {size.label}
          </div>
          <FarmerDashboardScreen
            farmerName="Test User"
            farmName="Test Farm"
            notificationCount={3}
          />
        </div>
      ))}
    </div>
  );
};

export default {
  BasicExample,
  WithCustomNameExample,
  WithNotificationsExample,
  WithAvatarExample,
  MultipleFarmersExample,
  WithStateManagementExample,
  ResponsiveLayoutExample,
};
