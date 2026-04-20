/**
 * Guest Product Detail Screen Examples
 * Usage examples for the Guest Product Detail Screen
 */

import React from 'react';
import { GuestProductDetailScreen } from './GuestProductDetailScreen';

/**
 * Example 1: Basic Guest Product Detail Screen
 * Shows product details with blurred monitoring features
 */
export const BasicGuestProductDetailExample = () => {
  const handleLogin = () => {
    console.log('Redirect to Zalo login');
  };

  return (
    <GuestProductDetailScreen
      productId="1"
      onLogin={handleLogin}
    />
  );
};

/**
 * Example 2: Guest Product Detail with Navigation
 * Includes back navigation handler
 */
export const GuestProductDetailWithNavigationExample = () => {
  const handleBack = () => {
    console.log('Navigate back to marketplace');
  };

  const handleLogin = () => {
    console.log('Redirect to Zalo login');
  };

  return (
    <GuestProductDetailScreen
      productId="2"
      onBack={handleBack}
      onLogin={handleLogin}
    />
  );
};

/**
 * Example 3: Guest Product Detail for Different Product
 * Shows how to use with different product IDs
 */
export const DifferentProductExample = () => {
  const handleLogin = () => {
    console.log('Redirect to Zalo login');
    // In real app: navigate to Zalo OAuth flow
  };

  return (
    <GuestProductDetailScreen
      productId="premium-durian-001"
      onLogin={handleLogin}
    />
  );
};

/**
 * Usage Notes:
 * 
 * 1. Product Information:
 *    - Shows product images, description, and packaging details
 *    - Displays farm location with map
 *    - Shows product rating and reviews
 * 
 * 2. Blurred Sections:
 *    - Camera monitoring section is blurred with lock overlay
 *    - Digital Twin section is blurred with lock overlay
 *    - Both sections show unlock message
 * 
 * 3. Limited Actions:
 *    - "Đăng ký để mua ngay" button instead of "Đặt cọc"
 *    - Clicking login buttons triggers onLogin callback
 *    - No direct purchase capability for guests
 * 
 * 4. Social Proof:
 *    - Reviews section shows 5-star ratings from previous buyers
 *    - Builds trust for guest users
 * 
 * 5. Call to Action:
 *    - Multiple prompts to login/register
 *    - Clear messaging about member-only features
 */
