/**
 * Spacing Utilities
 * Utilities for applying spacing tokens consistently
 * 
 * Requirements: 8.1
 */

import { spacing, spacingTokens } from '../tokens/spacing';

export type SpacingValue = keyof typeof spacing;
export type SpacingDirection = 'top' | 'right' | 'bottom' | 'left' | 'horizontal' | 'vertical' | 'all';

/**
 * Get spacing value by token name
 */
export const getSpacing = (token: SpacingValue): string => {
  return spacing[token];
};

/**
 * Get multiple spacing values
 */
export const getSpacings = (...tokens: SpacingValue[]): string[] => {
  return tokens.map(token => spacing[token]);
};

/**
 * Generate margin CSS properties
 */
export const margin = (value: SpacingValue, direction: SpacingDirection = 'all'): Record<string, string> => {
  const spacingValue = spacing[value];
  
  switch (direction) {
    case 'top':
      return { marginTop: spacingValue };
    case 'right':
      return { marginRight: spacingValue };
    case 'bottom':
      return { marginBottom: spacingValue };
    case 'left':
      return { marginLeft: spacingValue };
    case 'horizontal':
      return { marginLeft: spacingValue, marginRight: spacingValue };
    case 'vertical':
      return { marginTop: spacingValue, marginBottom: spacingValue };
    case 'all':
    default:
      return { margin: spacingValue };
  }
};

/**
 * Generate padding CSS properties
 */
export const padding = (value: SpacingValue, direction: SpacingDirection = 'all'): Record<string, string> => {
  const spacingValue = spacing[value];
  
  switch (direction) {
    case 'top':
      return { paddingTop: spacingValue };
    case 'right':
      return { paddingRight: spacingValue };
    case 'bottom':
      return { paddingBottom: spacingValue };
    case 'left':
      return { paddingLeft: spacingValue };
    case 'horizontal':
      return { paddingLeft: spacingValue, paddingRight: spacingValue };
    case 'vertical':
      return { paddingTop: spacingValue, paddingBottom: spacingValue };
    case 'all':
    default:
      return { padding: spacingValue };
  }
};

/**
 * Generate gap CSS property for flexbox/grid
 */
export const gap = (value: SpacingValue): Record<string, string> => {
  return { gap: spacing[value] };
};

/**
 * Generate row and column gap CSS properties
 */
export const gridGap = (rowGap: SpacingValue, columnGap?: SpacingValue): Record<string, string> => {
  const colGap = columnGap || rowGap;
  return {
    rowGap: spacing[rowGap],
    columnGap: spacing[colGap],
  };
};

/**
 * Create spacing utility classes for inline styles
 */
export const spacingUtils = {
  getSpacing,
  getSpacings,
  margin,
  padding,
  gap,
  gridGap,
};

export default spacingUtils;
