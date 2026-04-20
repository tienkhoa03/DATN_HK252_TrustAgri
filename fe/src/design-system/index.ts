/**
 * Design System Index
 * Main entry point for Zalo Mini App Design System
 */

export * from './tokens';
export * from './utils';
export * from './components';
export * from './layouts';

import designTokens from './tokens';
import utils from './utils';

export const designSystem = {
  tokens: designTokens,
  utils,
} as const;

export default designSystem;
