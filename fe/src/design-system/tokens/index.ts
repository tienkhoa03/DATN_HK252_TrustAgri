/**
 * Design Tokens Index
 * Export tất cả design tokens
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './icons';

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import icons from './icons';

export const designTokens = {
  colors,
  typography,
  spacing,
  icons,
} as const;

export default designTokens;
