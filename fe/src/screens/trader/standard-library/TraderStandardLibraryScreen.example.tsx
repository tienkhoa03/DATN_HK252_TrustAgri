/**
 * Trader Standard Library Screen Examples
 * The screen now drives itself from the standards API; no props are required.
 */

import React from 'react';
import { TraderStandardLibraryScreen } from './TraderStandardLibraryScreen';

export const BasicExample: React.FC = () => {
  return <TraderStandardLibraryScreen />;
};

export const InTabExample: React.FC = () => {
  return <TraderStandardLibraryScreen inTab />;
};

export default {
  BasicExample,
  InTabExample,
};
