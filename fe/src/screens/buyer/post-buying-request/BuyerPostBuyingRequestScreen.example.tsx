/**
 * Buyer Post Buying Request Screen Examples
 * The screen is integrated with the buying-request API (FR-U02);
 * buyer identity comes from the JWT, so no props are required.
 */

import React from 'react';
import { BuyerPostBuyingRequestScreen } from './BuyerPostBuyingRequestScreen';

export const BasicUsageExample: React.FC = () => {
  return <BuyerPostBuyingRequestScreen />;
};

export default BasicUsageExample;
