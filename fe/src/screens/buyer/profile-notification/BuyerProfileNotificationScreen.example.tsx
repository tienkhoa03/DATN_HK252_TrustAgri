/**
 * Buyer Profile & Notification Screen Examples
 * Usage examples for the Buyer Profile & Notification Screen
 */

import React from 'react';
import { BuyerProfileNotificationScreen } from './BuyerProfileNotificationScreen';

/**
 * Example 1: Basic Usage
 * Default buyer profile with standard name
 */
export const BasicBuyerProfileExample = () => {
  return <BuyerProfileNotificationScreen />;
};

/**
 * Example 2: Custom Buyer Name
 * Profile with custom buyer name
 */
export const CustomBuyerNameExample = () => {
  return <BuyerProfileNotificationScreen buyerName="Nguyễn Văn A" buyerId="BU002" />;
};

/**
 * Example 3: With Avatar
 * Profile with custom avatar image
 */
export const WithAvatarExample = () => {
  return (
    <BuyerProfileNotificationScreen
      buyerName="Trần Thị B"
      buyerId="BU003"
      buyerAvatar="https://via.placeholder.com/80"
    />
  );
};

/**
 * Example 4: Different Buyer ID
 * Profile with different buyer ID format
 */
export const DifferentBuyerIdExample = () => {
  return <BuyerProfileNotificationScreen buyerName="Lê Văn C" buyerId="BUYER-2024-001" />;
};

// Export all examples
export const BuyerProfileNotificationScreenExamples = {
  BasicBuyerProfileExample,
  CustomBuyerNameExample,
  WithAvatarExample,
  DifferentBuyerIdExample,
};
