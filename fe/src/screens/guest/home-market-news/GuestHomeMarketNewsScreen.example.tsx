/**
 * Guest Home & Market News Screen Examples
 * Usage examples for the Guest Home & Market News Screen component
 */

import React from 'react';
import { GuestHomeMarketNewsScreen } from './GuestHomeMarketNewsScreen';

/**
 * Example 1: Basic Guest Home Screen
 * Default screen for unauthenticated users
 */
export const BasicGuestHomeExample: React.FC = () => {
  return (
    <GuestHomeMarketNewsScreen
      onLogin={() => {
        console.log('Redirect to Zalo login');
      }}
    />
  );
};

/**
 * Example 2: Guest Home with Custom Login Handler
 * Custom login flow integration
 */
export const CustomLoginExample: React.FC = () => {
  const handleCustomLogin = () => {
    // Custom login logic
    console.log('Custom login flow initiated');
    // Could integrate with Zalo ID, OAuth, etc.
  };

  return <GuestHomeMarketNewsScreen onLogin={handleCustomLogin} />;
};

/**
 * Example 3: Guest Home without Login Handler
 * Display-only mode (login button won't do anything)
 */
export const DisplayOnlyExample: React.FC = () => {
  return <GuestHomeMarketNewsScreen />;
};

/**
 * Integration Example: Using in App Router
 */
export const IntegrationExample: React.FC = () => {
  const handleLogin = () => {
    // Navigate to login screen or trigger Zalo authentication
    window.location.href = '/login';
  };

  return (
    <div>
      <GuestHomeMarketNewsScreen onLogin={handleLogin} />
    </div>
  );
};

export default {
  BasicGuestHomeExample,
  CustomLoginExample,
  DisplayOnlyExample,
  IntegrationExample,
};
