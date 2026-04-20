/**
 * Trader Standard Library Screen Examples
 * Usage examples for the Trader Standard Library Screen
 */

import React from 'react';
import { TraderStandardLibraryScreen, ProcessStandard } from './TraderStandardLibraryScreen';

/**
 * Example 1: Basic usage with default mock data
 */
export const BasicExample: React.FC = () => {
  return <TraderStandardLibraryScreen />;
};

/**
 * Example 2: With custom standards
 */
export const CustomStandardsExample: React.FC = () => {
  const customStandards: ProcessStandard[] = [
    {
      id: '1',
      name: 'Quy trình Xoài VietGAP',
      cropType: 'Xoài Cát Hòa Lộc',
      description: 'Quy trình canh tác xoài theo tiêu chuẩn VietGAP',
      stages: [
        {
          stage: 'seeding',
          name: 'Gieo hạt',
          duration: 25,
          parameters: {
            minTemp: 22,
            maxTemp: 30,
            minHumidity: 65,
            maxHumidity: 80,
            minLight: 600,
            maxLight: 900,
          },
        },
        {
          stage: 'germination',
          name: 'Nảy mầm',
          duration: 40,
          parameters: {
            minTemp: 24,
            maxTemp: 32,
            minHumidity: 70,
            maxHumidity: 85,
            minLight: 700,
            maxLight: 1000,
          },
        },
        {
          stage: 'flowering',
          name: 'Ra hoa',
          duration: 70,
          parameters: {
            minTemp: 26,
            maxTemp: 33,
            minHumidity: 65,
            maxHumidity: 80,
            minLight: 800,
            maxLight: 1200,
          },
        },
        {
          stage: 'harvest',
          name: 'Thu hoạch',
          duration: 35,
          parameters: {
            minTemp: 25,
            maxTemp: 34,
            minHumidity: 60,
            maxHumidity: 75,
            minLight: 900,
            maxLight: 1300,
          },
        },
      ],
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01'),
    },
  ];

  return <TraderStandardLibraryScreen standards={customStandards} />;
};

/**
 * Example 3: With event handlers
 */
export const WithEventHandlersExample: React.FC = () => {
  const handleCreateStandard = (standard: Omit<ProcessStandard, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('Creating new standard:', standard);
    // In a real app, this would call an API to create the standard
    alert(`Tạo quy trình mới: ${standard.name}`);
  };

  const handleEditStandard = (id: string, standard: Partial<ProcessStandard>) => {
    console.log('Editing standard:', id, standard);
    // In a real app, this would call an API to update the standard
    alert(`Chỉnh sửa quy trình: ${id}`);
  };

  const handleDeleteStandard = (id: string) => {
    console.log('Deleting standard:', id);
    // In a real app, this would call an API to delete the standard
    if (confirm('Bạn có chắc chắn muốn xóa quy trình này?')) {
      alert(`Đã xóa quy trình: ${id}`);
    }
  };

  return (
    <TraderStandardLibraryScreen
      onCreateStandard={handleCreateStandard}
      onEditStandard={handleEditStandard}
      onDeleteStandard={handleDeleteStandard}
    />
  );
};

/**
 * Example 4: Empty state (no standards)
 */
export const EmptyStateExample: React.FC = () => {
  return <TraderStandardLibraryScreen standards={[]} />;
};

export default {
  BasicExample,
  CustomStandardsExample,
  WithEventHandlersExample,
  EmptyStateExample,
};
