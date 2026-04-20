/**
 * Simple test to verify FarmerContractsScreen renders
 */

import React from 'react';
import { FarmerContractsScreen } from './FarmerContractsScreen';

// This is a simple component to test if FarmerContractsScreen renders
export const TestFarmerContractsScreen = () => {
  console.log('TestFarmerContractsScreen rendering...');
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: '20px' }}>Test Farmer Contracts Screen</h1>
      <FarmerContractsScreen
        farmerName="Tiến Khoa"
        farmName="Sầu riêng Monthong"
      />
    </div>
  );
};

export default TestFarmerContractsScreen;
