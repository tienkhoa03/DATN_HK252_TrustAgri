/**
 * Buyer Orders & Proposals Screen Examples
 * Usage examples for the Buyer Orders & Proposals Screen
 */

import React from 'react';
import { BuyerOrdersProposalsScreen } from './BuyerOrdersProposalsScreen';

/**
 * Example 1: Basic Usage
 * Default buyer orders and proposals screen
 */
export const BasicBuyerOrdersProposalsExample = () => {
  return <BuyerOrdersProposalsScreen />;
};

/**
 * Example 2: With Custom Buyer Name
 * Screen with custom buyer name
 */
export const CustomBuyerNameExample = () => {
  return <BuyerOrdersProposalsScreen buyerName="Nguyễn Văn A" />;
};

/**
 * Example 3: Integration Example
 * How to integrate with navigation
 */
export const IntegrationExample = () => {
  const handleNavigateToFarm = (farmId: string) => {
    console.log('Navigate to farm:', farmId);
    // Navigate to farm monitoring screen
  };

  const handleNavigateToDigitalTwin = (orderId: string) => {
    console.log('Navigate to digital twin:', orderId);
    // Navigate to digital twin monitoring screen
  };

  return (
    <div>
      <BuyerOrdersProposalsScreen buyerName="Tiến Khoa" />
    </div>
  );
};

/**
 * Example 4: Standalone Demo
 * Standalone demo with back navigation
 */
export const StandaloneDemoExample = () => {
  const handleBack = () => {
    console.log('Navigate back to home');
    // Navigate back to home screen
  };

  return (
    <div>
      <button onClick={handleBack}>← Quay về</button>
      <BuyerOrdersProposalsScreen buyerName="Tiến Khoa" />
    </div>
  );
};

export default {
  BasicBuyerOrdersProposalsExample,
  CustomBuyerNameExample,
  IntegrationExample,
  StandaloneDemoExample,
};
