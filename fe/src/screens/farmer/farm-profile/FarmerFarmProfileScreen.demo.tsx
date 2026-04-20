/**
 * Farmer Farm Profile Screen Demo
 * Interactive demo for the Farmer Farm Profile Screen
 */

import React from 'react';
import { Page } from 'zmp-ui';
import { FarmerFarmProfileScreen, IoTDevice, FarmProfile } from './FarmerFarmProfileScreen';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { fontSize, fontWeight } from '../../../design-system/tokens/typography';

export interface FarmerFarmProfileScreenDemoProps {
  onBack?: () => void;
}

export const FarmerFarmProfileScreenDemo: React.FC<FarmerFarmProfileScreenDemoProps> = ({ onBack }) => {
  // Tên cứng theo yêu cầu
  const farmerName = 'Tiến Khoa';
  const farmName = 'Sầu riêng Monthong';

  // Mock farm profile data
  const farmProfile: FarmProfile = {
    name: farmName,
    area: 2.5,
    address: 'Xã Tân Thành, Huyện Châu Thành, Tỉnh Tiền Giang',
    coordinates: {
      lat: 10.3833,
      lng: 106.3667,
    },
    cropType: 'Sầu riêng Monthong',
    establishedDate: new Date('2020-01-15'),
  };

  // Mock IoT devices data
  const devices: IoTDevice[] = [
    {
      id: 'NODE-001',
      name: 'Node Cảm biến Khu A',
      type: 'sensor',
      status: 'online',
      batteryLevel: 85,
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      sensors: ['temperature', 'humidity', 'light'],
    },
    {
      id: 'NODE-002',
      name: 'Node Cảm biến Khu B',
      type: 'sensor',
      status: 'online',
      batteryLevel: 92,
      lastUpdate: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      sensors: ['temperature', 'humidity', 'ph'],
    },
    {
      id: 'NODE-003',
      name: 'Node Cảm biến Khu C',
      type: 'sensor',
      status: 'offline',
      batteryLevel: 15,
      lastUpdate: new Date(Date.now() - 120 * 60 * 1000), // 2 hours ago
      sensors: ['temperature', 'humidity'],
    },
    {
      id: 'NODE-004',
      name: 'Node Cảm biến Khu D',
      type: 'sensor',
      status: 'online',
      batteryLevel: 68,
      lastUpdate: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      sensors: ['temperature', 'light', 'ph'],
    },
  ];

  const handleEditProfile = () => {
    console.log('Edit farm profile');
    alert('Chức năng chỉnh sửa thông tin vườn');
  };

  const handleAddDevice = () => {
    console.log('Add new device');
    alert('Chức năng thêm thiết bị IoT mới');
  };

  const handleDeviceClick = (device: IoTDevice) => {
    console.log('Device clicked:', device);
    alert(`Xem chi tiết thiết bị: ${device.name}\nTrạng thái: ${device.status}\nPin: ${device.batteryLevel}%`);
  };

  const backBarStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '48px',
    backgroundColor: colors.background.primary,
    borderBottom: `1px solid ${colors.background.tertiary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `0 ${spacing.md}`,
    zIndex: 1001,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  const backButtonStyles: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: 'transparent',
    color: colors.text.primary,
    border: `1px solid ${colors.background.tertiary}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: fontSize.caption,
    fontWeight: fontWeight.medium,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };

  const contentWrapperStyles: React.CSSProperties = {
    marginTop: '48px', // Space for back bar
  };

  return (
    <Page className="farmer-farm-profile-demo">
      {/* Back Bar */}
      {onBack && (
        <div style={backBarStyles}>
          <button
            style={backButtonStyles}
            onClick={onBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.background.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Quay về màn hình chính"
          >
            ← Quay về màn hình chính
          </button>
        </div>
      )}

      {/* Farmer Farm Profile Screen */}
      <div style={contentWrapperStyles}>
        <FarmerFarmProfileScreen
          farmProfile={farmProfile}
          devices={devices}
          onEditProfile={handleEditProfile}
          onAddDevice={handleAddDevice}
          onDeviceClick={handleDeviceClick}
        />
      </div>
    </Page>
  );
};

export default FarmerFarmProfileScreenDemo;
