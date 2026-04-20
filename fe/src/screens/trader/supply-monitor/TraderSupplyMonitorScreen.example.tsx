/**
 * Trader Supply & Monitor Screen Examples
 * Usage examples for the Trader Supply & Monitor Screen
 */

import React from 'react';
import { TraderSupplyMonitorScreen } from './TraderSupplyMonitorScreen';

/**
 * Example 1: Basic Usage
 * Default trader supply & monitor screen with standard trader name
 */
export const BasicTraderSupplyMonitorExample: React.FC = () => {
  return <TraderSupplyMonitorScreen />;
};

/**
 * Example 2: Custom Trader Name
 * Supply & monitor screen with custom trader name
 */
export const CustomTraderNameExample: React.FC = () => {
  return <TraderSupplyMonitorScreen traderName="Nguyễn Văn A" />;
};

/**
 * Example 3: Integration Example
 * How to integrate the screen in a larger application
 */
export const IntegrationExample: React.FC = () => {
  const handleFarmerSelect = (farmerId: string) => {
    console.log('Selected farmer:', farmerId);
    // Navigate to farmer detail or show monitoring data
  };

  const handleRequestAccept = (requestId: string) => {
    console.log('Accepted request:', requestId);
    // Process the connection request
  };

  const handleRequestReject = (requestId: string) => {
    console.log('Rejected request:', requestId);
    // Process the rejection
  };

  return (
    <div>
      <TraderSupplyMonitorScreen traderName="Tiến Khoa" />
    </div>
  );
};

export default {
  BasicTraderSupplyMonitorExample,
  CustomTraderNameExample,
  IntegrationExample,
};
