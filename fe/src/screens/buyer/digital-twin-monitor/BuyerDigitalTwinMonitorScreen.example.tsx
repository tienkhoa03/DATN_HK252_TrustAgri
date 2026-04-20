/**
 * Buyer Digital Twin Monitor Screen Examples
 * Demonstrates usage of the BuyerDigitalTwinMonitorScreen component
 */

import React from 'react';
import { BuyerDigitalTwinMonitorScreen } from './BuyerDigitalTwinMonitorScreen';

/**
 * Example 1: Basic Usage
 * Màn hình giám sát Digital Twin cơ bản
 */
export const BasicDigitalTwinMonitorExample: React.FC = () => {
  return (
    <BuyerDigitalTwinMonitorScreen
      orderId="DH-2024-001"
      onBack={() => console.log('Navigate back')}
    />
  );
};

/**
 * Example 2: Without Back Button
 * Màn hình giám sát không có nút quay lại
 */
export const NoBackButtonExample: React.FC = () => {
  return (
    <BuyerDigitalTwinMonitorScreen
      orderId="DH-2024-002"
    />
  );
};

/**
 * Example 3: Different Order
 * Màn hình giám sát với đơn hàng khác
 */
export const DifferentOrderExample: React.FC = () => {
  return (
    <BuyerDigitalTwinMonitorScreen
      orderId="DH-2024-003"
      onBack={() => console.log('Navigate back to orders')}
    />
  );
};

/**
 * Example 4: Embedded in Navigation Flow
 * Màn hình giám sát trong luồng điều hướng
 */
export const NavigationFlowExample: React.FC = () => {
  const handleBack = () => {
    // Navigate to previous screen in the flow
    console.log('Navigate to order details');
  };

  return (
    <BuyerDigitalTwinMonitorScreen
      orderId="DH-2024-004"
      onBack={handleBack}
    />
  );
};

/**
 * All Examples Component
 */
export const BuyerDigitalTwinMonitorScreenExamples: React.FC = () => {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <section>
        <h2>Example 1: Basic Usage</h2>
        <p>Màn hình giám sát Digital Twin cơ bản với đầy đủ tính năng</p>
        <BasicDigitalTwinMonitorExample />
      </section>

      <section>
        <h2>Example 2: Without Back Button</h2>
        <p>Màn hình giám sát không có nút quay lại (standalone mode)</p>
        <NoBackButtonExample />
      </section>

      <section>
        <h2>Example 3: Different Order</h2>
        <p>Màn hình giám sát với đơn hàng khác nhau</p>
        <DifferentOrderExample />
      </section>

      <section>
        <h2>Example 4: Embedded in Navigation Flow</h2>
        <p>Màn hình giám sát trong luồng điều hướng hoàn chỉnh</p>
        <NavigationFlowExample />
      </section>
    </div>
  );
};

export default BuyerDigitalTwinMonitorScreenExamples;
