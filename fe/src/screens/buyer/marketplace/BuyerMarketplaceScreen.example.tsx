/**
 * Buyer Marketplace Screen Examples
 * Usage examples for the Buyer Marketplace Home Screen
 */

import React from 'react';
import { BuyerMarketplaceScreen } from './BuyerMarketplaceScreen';

/**
 * Example 1: Basic Usage
 * Default marketplace screen with standard buyer name
 */
export const BasicMarketplaceExample = () => {
  return <BuyerMarketplaceScreen />;
};

/**
 * Example 2: Custom Buyer Name
 * Marketplace screen with custom buyer name
 */
export const CustomBuyerNameExample = () => {
  return <BuyerMarketplaceScreen buyerName="Nguyễn Văn A" />;
};

/**
 * Example 3: Demo User
 * Marketplace screen with demo user name (Tiến Khoa)
 */
export const DemoUserExample = () => {
  return <BuyerMarketplaceScreen buyerName="Tiến Khoa" />;
};

export default {
  BasicMarketplaceExample,
  CustomBuyerNameExample,
  DemoUserExample,
};
