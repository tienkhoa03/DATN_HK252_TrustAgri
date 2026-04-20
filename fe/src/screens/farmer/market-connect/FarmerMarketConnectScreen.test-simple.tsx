/**
 * Simple test version of FarmerMarketConnectScreen
 * Use this to debug if the main component doesn't load
 */

import React from 'react';
import { Page, Text } from 'zmp-ui';

export const FarmerMarketConnectScreenSimple: React.FC = () => {
  return (
    <Page>
      <div style={{ padding: '20px' }}>
        <Text.Title>Test: Farmer Market & Connect Screen</Text.Title>
        <Text>If you see this, the component is loading correctly.</Text>
        <Text>The issue might be with the full implementation.</Text>
      </div>
    </Page>
  );
};

export default FarmerMarketConnectScreenSimple;
