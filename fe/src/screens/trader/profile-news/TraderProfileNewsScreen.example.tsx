/**
 * Trader Profile & News Screen Examples
 * Usage examples for the Trader Profile & News Screen
 */

import React from 'react';
import { TraderProfileNewsScreen } from './TraderProfileNewsScreen';

/**
 * Example 1: Basic Usage
 * Default trader profile and news screen
 */
export const BasicExample = () => {
  return <TraderProfileNewsScreen />;
};

/**
 * Example 2: Custom Trader Name
 * Profile screen with custom trader name
 */
export const CustomTraderExample = () => {
  return (
    <TraderProfileNewsScreen
      traderName="Nguyễn Văn A"
      companyName="Công ty TNHH Nông sản Xanh"
    />
  );
};

/**
 * Example 3: Different Company
 * Profile screen for different company
 */
export const DifferentCompanyExample = () => {
  return (
    <TraderProfileNewsScreen
      traderName="Trần Thị B"
      companyName="Hợp tác xã Nông nghiệp Hữu cơ"
    />
  );
};

// Export all examples
export const examples = {
  basic: BasicExample,
  customTrader: CustomTraderExample,
  differentCompany: DifferentCompanyExample,
};

export default examples;
