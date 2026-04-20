/**
 * Farmer Contracts Screen - Usage Examples
 */

import React from 'react';
import { FarmerContractsScreen, Contract } from './FarmerContractsScreen';

// Example 1: Basic usage with default data
export const BasicExample = () => {
  return (
    <FarmerContractsScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
    />
  );
};

// Example 2: With custom contracts
export const CustomContractsExample = () => {
  const customContracts: Contract[] = [
    {
      id: '1',
      traderName: 'Công ty TNHH Xuất khẩu',
      productType: 'Bưởi Da Xanh',
      quantity: 3,
      unit: 'tấn',
      harvestDate: new Date('2024-04-10'),
      price: 80000,
      status: 'active',
      terms: [
        'Chất lượng: Loại 1',
        'Thanh toán: 100% khi giao hàng',
      ],
      depositAmount: 0,
      depositPaid: false,
      createdDate: new Date('2024-02-15'),
    },
  ];

  return (
    <FarmerContractsScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      contracts={customContracts}
    />
  );
};

// Example 3: With event handlers
export const WithHandlersExample = () => {
  const handleAcceptChange = (contractId: string) => {
    console.log('Accepted change for contract:', contractId);
    alert(`Đã chấp nhận thay đổi cho hợp đồng ${contractId}`);
  };

  const handleRejectChange = (contractId: string) => {
    console.log('Rejected change for contract:', contractId);
    alert(`Đã từ chối thay đổi cho hợp đồng ${contractId}`);
  };

  const handleViewDetails = (contractId: string) => {
    console.log('Viewing details for contract:', contractId);
  };

  return (
    <FarmerContractsScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      onAcceptChange={handleAcceptChange}
      onRejectChange={handleRejectChange}
      onViewDetails={handleViewDetails}
    />
  );
};

// Example 4: Empty state
export const EmptyStateExample = () => {
  return (
    <FarmerContractsScreen
      farmerName="Tiến Khoa"
      farmName="Sầu riêng Monthong"
      contracts={[]}
    />
  );
};
