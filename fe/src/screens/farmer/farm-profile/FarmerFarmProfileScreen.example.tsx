/**
 * Farmer Farm Profile Screen Examples
 * Các ví dụ sử dụng màn hình Hồ sơ Vườn
 */

import React from 'react';
import { FarmerFarmProfileScreen, FarmProfile, IoTDevice } from './FarmerFarmProfileScreen';

/**
 * Example 1: Basic Farm Profile
 * Hồ sơ vườn cơ bản với thông tin tối thiểu
 */
export const BasicFarmProfileExample: React.FC = () => {
  const farmProfile: FarmProfile = {
    name: 'Vườn Xoài Cát Chu',
    area: 1.5,
    address: 'Xã Mỹ Phước, Huyện Cao Lãnh, Tỉnh Đồng Tháp',
  };

  const devices: IoTDevice[] = [
    {
      id: 'NODE-001',
      name: 'Node Cảm biến 1',
      type: 'sensor',
      status: 'online',
      batteryLevel: 75,
      lastUpdate: new Date(),
      sensors: ['temperature', 'humidity'],
    },
  ];

  return (
    <FarmerFarmProfileScreen
      farmProfile={farmProfile}
      devices={devices}
      onEditProfile={() => console.log('Edit profile')}
      onAddDevice={() => console.log('Add device')}
    />
  );
};

/**
 * Example 2: Complete Farm Profile
 * Hồ sơ vườn đầy đủ với tất cả thông tin
 */
export const CompleteFarmProfileExample: React.FC = () => {
  const farmProfile: FarmProfile = {
    name: 'Sầu riêng Monthong',
    area: 3.2,
    address: 'Xã Tân Thành, Huyện Châu Thành, Tỉnh Tiền Giang',
    coordinates: {
      lat: 10.3833,
      lng: 106.3667,
    },
    coverImage: '/images/farm-cover.jpg',
    cropType: 'Sầu riêng Monthong',
    establishedDate: new Date('2019-03-20'),
  };

  const devices: IoTDevice[] = [
    {
      id: 'NODE-001',
      name: 'Node Cảm biến Khu A',
      type: 'sensor',
      status: 'online',
      batteryLevel: 95,
      lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
      sensors: ['temperature', 'humidity', 'light', 'ph'],
    },
    {
      id: 'NODE-002',
      name: 'Node Cảm biến Khu B',
      type: 'sensor',
      status: 'online',
      batteryLevel: 88,
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
      sensors: ['temperature', 'humidity', 'light'],
    },
    {
      id: 'NODE-003',
      name: 'Node Cảm biến Khu C',
      type: 'sensor',
      status: 'online',
      batteryLevel: 72,
      lastUpdate: new Date(Date.now() - 8 * 60 * 1000),
      sensors: ['temperature', 'humidity'],
    },
  ];

  return (
    <FarmerFarmProfileScreen
      farmProfile={farmProfile}
      devices={devices}
      onEditProfile={() => alert('Mở form chỉnh sửa thông tin vườn')}
      onAddDevice={() => alert('Mở form thêm thiết bị IoT mới')}
      onDeviceClick={(device) => alert(`Chi tiết thiết bị: ${device.name}`)}
    />
  );
};

/**
 * Example 3: Farm with Low Battery Devices
 * Vườn có thiết bị pin yếu cần cảnh báo
 */
export const LowBatteryDevicesExample: React.FC = () => {
  const farmProfile: FarmProfile = {
    name: 'Bưởi Da Xanh',
    area: 2.0,
    address: 'Xã Vĩnh Kim, Huyện Châu Thành, Tỉnh Tiền Giang',
    coordinates: {
      lat: 10.2500,
      lng: 106.1500,
    },
    cropType: 'Bưởi Da Xanh',
    establishedDate: new Date('2021-06-10'),
  };

  const devices: IoTDevice[] = [
    {
      id: 'NODE-001',
      name: 'Node Cảm biến 1',
      type: 'sensor',
      status: 'online',
      batteryLevel: 18, // Low battery - Alert Red
      lastUpdate: new Date(Date.now() - 10 * 60 * 1000),
      sensors: ['temperature', 'humidity'],
    },
    {
      id: 'NODE-002',
      name: 'Node Cảm biến 2',
      type: 'sensor',
      status: 'online',
      batteryLevel: 35, // Medium battery - Warning Yellow
      lastUpdate: new Date(Date.now() - 15 * 60 * 1000),
      sensors: ['temperature', 'light'],
    },
    {
      id: 'NODE-003',
      name: 'Node Cảm biến 3',
      type: 'sensor',
      status: 'offline', // Offline
      batteryLevel: 5,
      lastUpdate: new Date(Date.now() - 180 * 60 * 1000),
      sensors: ['temperature'],
    },
  ];

  return (
    <FarmerFarmProfileScreen
      farmProfile={farmProfile}
      devices={devices}
      onEditProfile={() => console.log('Edit profile')}
      onAddDevice={() => console.log('Add device')}
      onDeviceClick={(device) => {
        if (device.batteryLevel < 20) {
          alert(`⚠️ Cảnh báo: ${device.name} có pin yếu (${device.batteryLevel}%). Vui lòng thay pin!`);
        } else {
          console.log('Device clicked:', device);
        }
      }}
    />
  );
};

/**
 * Example 4: Farm with Offline Devices
 * Vườn có nhiều thiết bị offline
 */
export const OfflineDevicesExample: React.FC = () => {
  const farmProfile: FarmProfile = {
    name: 'Chanh Dây',
    area: 1.8,
    address: 'Xã Phú Mỹ, Huyện Tân Phú, Tỉnh Đồng Nai',
    cropType: 'Chanh Dây',
    establishedDate: new Date('2022-01-05'),
  };

  const devices: IoTDevice[] = [
    {
      id: 'NODE-001',
      name: 'Node Cảm biến 1',
      type: 'sensor',
      status: 'online',
      batteryLevel: 82,
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
      sensors: ['temperature', 'humidity', 'light'],
    },
    {
      id: 'NODE-002',
      name: 'Node Cảm biến 2',
      type: 'sensor',
      status: 'offline',
      batteryLevel: 0,
      lastUpdate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      sensors: ['temperature', 'humidity'],
    },
    {
      id: 'NODE-003',
      name: 'Node Cảm biến 3',
      type: 'sensor',
      status: 'offline',
      batteryLevel: 12,
      lastUpdate: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      sensors: ['temperature'],
    },
  ];

  return (
    <FarmerFarmProfileScreen
      farmProfile={farmProfile}
      devices={devices}
      onEditProfile={() => console.log('Edit profile')}
      onAddDevice={() => console.log('Add device')}
      onDeviceClick={(device) => {
        if (device.status === 'offline') {
          alert(`❌ ${device.name} đang offline. Vui lòng kiểm tra kết nối!`);
        }
      }}
    />
  );
};

/**
 * Example 5: New Farm with No Devices
 * Vườn mới chưa có thiết bị
 */
export const NewFarmNoDevicesExample: React.FC = () => {
  const farmProfile: FarmProfile = {
    name: 'Vườn Mới',
    area: 0.5,
    address: 'Xã Tân Lập, Huyện Tân Phước, Tỉnh Tiền Giang',
    cropType: 'Chuối',
    establishedDate: new Date(),
  };

  return (
    <FarmerFarmProfileScreen
      farmProfile={farmProfile}
      devices={[]}
      onEditProfile={() => console.log('Edit profile')}
      onAddDevice={() => alert('Thêm thiết bị IoT đầu tiên cho vườn của bạn!')}
    />
  );
};

/**
 * Example 6: Large Farm with Many Devices
 * Vườn lớn với nhiều thiết bị
 */
export const LargeFarmExample: React.FC = () => {
  const farmProfile: FarmProfile = {
    name: 'Trang trại Nông nghiệp Công nghệ cao',
    area: 10.5,
    address: 'Xã Tân Thạnh, Huyện Châu Thành, Tỉnh Long An',
    coordinates: {
      lat: 10.5000,
      lng: 106.5000,
    },
    cropType: 'Đa dạng (Rau, Củ, Quả)',
    establishedDate: new Date('2018-05-15'),
  };

  const devices: IoTDevice[] = Array.from({ length: 8 }, (_, i) => ({
    id: `NODE-${String(i + 1).padStart(3, '0')}`,
    name: `Node Cảm biến Khu ${String.fromCharCode(65 + i)}`,
    type: 'sensor' as const,
    status: i % 5 === 0 ? 'offline' : 'online' as const,
    batteryLevel: Math.floor(Math.random() * 100),
    lastUpdate: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
    sensors: ['temperature', 'humidity', 'light', 'ph'].slice(0, Math.floor(Math.random() * 3) + 2),
  }));

  return (
    <FarmerFarmProfileScreen
      farmProfile={farmProfile}
      devices={devices}
      onEditProfile={() => console.log('Edit profile')}
      onAddDevice={() => console.log('Add device')}
      onDeviceClick={(device) => console.log('Device clicked:', device)}
    />
  );
};

/**
 * Example 7: Farm with Custom Handlers
 * Vườn với các handler tùy chỉnh
 */
export const CustomHandlersExample: React.FC = () => {
  const [farmProfile, setFarmProfile] = React.useState<FarmProfile>({
    name: 'Vườn Thông minh',
    area: 2.5,
    address: 'Xã Mỹ Hạnh, Huyện Đức Hòa, Tỉnh Long An',
    coordinates: {
      lat: 10.8500,
      lng: 106.4000,
    },
    cropType: 'Dưa lưới',
    establishedDate: new Date('2020-08-20'),
  });

  const [devices, setDevices] = React.useState<IoTDevice[]>([
    {
      id: 'NODE-001',
      name: 'Node Cảm biến 1',
      type: 'sensor',
      status: 'online',
      batteryLevel: 90,
      lastUpdate: new Date(),
      sensors: ['temperature', 'humidity', 'light'],
    },
  ]);

  const handleEditProfile = () => {
    const newName = prompt('Nhập tên vườn mới:', farmProfile.name);
    if (newName) {
      setFarmProfile({ ...farmProfile, name: newName });
    }
  };

  const handleAddDevice = () => {
    const deviceName = prompt('Nhập tên thiết bị mới:');
    if (deviceName) {
      const newDevice: IoTDevice = {
        id: `NODE-${String(devices.length + 1).padStart(3, '0')}`,
        name: deviceName,
        type: 'sensor',
        status: 'online',
        batteryLevel: 100,
        lastUpdate: new Date(),
        sensors: ['temperature', 'humidity'],
      };
      setDevices([...devices, newDevice]);
      alert(`Đã thêm thiết bị: ${deviceName}`);
    }
  };

  const handleDeviceClick = (device: IoTDevice) => {
    alert(
      `Thông tin thiết bị:\n` +
      `- Tên: ${device.name}\n` +
      `- ID: ${device.id}\n` +
      `- Trạng thái: ${device.status}\n` +
      `- Pin: ${device.batteryLevel}%\n` +
      `- Cảm biến: ${device.sensors?.join(', ')}`
    );
  };

  return (
    <FarmerFarmProfileScreen
      farmProfile={farmProfile}
      devices={devices}
      onEditProfile={handleEditProfile}
      onAddDevice={handleAddDevice}
      onDeviceClick={handleDeviceClick}
    />
  );
};
