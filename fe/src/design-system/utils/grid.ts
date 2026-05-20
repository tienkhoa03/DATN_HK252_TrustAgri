/**
 * Layout Grid System
 * Grid utilities for consistent layouts
 * 
 * Requirements: 8.1
 */

import { getSpacing, padding } from './spacing';
import type { SpacingValue } from './spacing';

export interface GridConfig {
  columns: number;
  gap?: SpacingValue;
  rowGap?: SpacingValue;
  columnGap?: SpacingValue;
}

export interface FlexConfig {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: SpacingValue;
}

/**
 * Generate CSS Grid container styles
 */
export const gridContainer = (config: GridConfig): Record<string, string> => {
  const { columns, gap, rowGap, columnGap } = config;
  
  const styles: Record<string, string> = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
  };
  
  if (gap) {
    styles.gap = getSpacing(gap);
  } else {
    if (rowGap) {
      styles.rowGap = getSpacing(rowGap);
    }
    if (columnGap) {
      styles.columnGap = getSpacing(columnGap);
    }
  }
  
  return styles;
};

/**
 * Generate CSS Grid item styles
 */
export const gridItem = (columnSpan?: number, rowSpan?: number): Record<string, string> => {
  const styles: Record<string, string> = {};
  
  if (columnSpan) {
    styles.gridColumn = `span ${columnSpan}`;
  }
  
  if (rowSpan) {
    styles.gridRow = `span ${rowSpan}`;
  }
  
  return styles;
};

/**
 * Generate Flexbox container styles
 */
export const flexContainer = (config: FlexConfig = {}): Record<string, string> => {
  const {
    direction = 'row',
    justify = 'flex-start',
    align = 'stretch',
    wrap = 'nowrap',
    gap,
  } = config;
  
  const styles: Record<string, string> = {
    display: 'flex',
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap,
  };
  
  if (gap) {
    styles.gap = getSpacing(gap);
  }
  
  return styles;
};

/**
 * Generate Flexbox item styles
 */
export const flexItem = (grow?: number, shrink?: number, basis?: string): Record<string, string> => {
  const styles: Record<string, string> = {};
  
  if (grow !== undefined) {
    styles.flexGrow = String(grow);
  }
  
  if (shrink !== undefined) {
    styles.flexShrink = String(shrink);
  }
  
  if (basis) {
    styles.flexBasis = basis;
  }
  
  return styles;
};

/**
 * Common grid layouts for the application
 */
export const commonLayouts = {
  /**
   * 3-column sensor grid (Requirements: 12.1-12.6)
   */
  sensorGrid: gridContainer({ columns: 3, gap: 'md' }),
  
  /**
   * 2-column product grid (Requirements: 20.1-20.4)
   */
  productGrid: gridContainer({ columns: 2, gap: 'md' }),
  
  /**
   * Single column list with spacing
   */
  listLayout: flexContainer({ direction: 'column', gap: 'sm' }),
  
  /**
   * Horizontal navigation bar
   */
  navBar: flexContainer({ direction: 'row', justify: 'space-between', align: 'center', gap: 'md' }),
  
  /**
   * Card grid (responsive)
   */
  cardGrid: gridContainer({ columns: 1, gap: 'lg' }),
  
  /**
   * Form layout
   */
  formLayout: flexContainer({ direction: 'column', gap: 'md' }),
};

/**
 * Screen layout structure (Requirements: 1.1, 8.1)
 */
export const screenLayout = {
  /**
   * Main container with padding
   */
  container: {
    ...padding('md', 'all'),
    width: '100%',
    maxWidth: '414px', // Max mobile width
    margin: '0 auto',
  },
  
  /**
   * Header section
   */
  header: {
    height: '56px',
    ...padding('md', 'horizontal'),
    ...flexContainer({ direction: 'row', justify: 'space-between', align: 'center' }),
  },
  
  /**
   * Content section (scrollable)
   */
  content: {
    ...padding('md', 'all'),
    overflowY: 'auto' as const,
  },
  
  /**
   * Footer/Bottom navigation
   */
  footer: {
    height: '64px',
    ...padding('sm', 'horizontal'),
    ...flexContainer({ direction: 'row', justify: 'space-around', align: 'center' }),
  },
};

/**
 * Grid system utilities
 */
export const gridUtils = {
  gridContainer,
  gridItem,
  flexContainer,
  flexItem,
  commonLayouts,
  screenLayout,
};

export default gridUtils;
