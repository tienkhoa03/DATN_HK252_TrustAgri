/**
 * Design System Utilities Index
 */

export * from './validators';
export * from './theme';
export * from './spacing';
export * from './grid';
export * from './ThemeProvider';
export * from './errorHandling';

import validators from './validators';
import theme from './theme';
import spacingUtils from './spacing';
import gridUtils from './grid';
import errorHandling from './errorHandling';

export const utils = {
  validators,
  theme,
  spacing: spacingUtils,
  grid: gridUtils,
  errorHandling,
} as const;

export default utils;
