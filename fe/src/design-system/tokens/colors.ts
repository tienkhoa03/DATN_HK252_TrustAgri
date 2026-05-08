/**
 * Color Design Tokens
 * Hệ thống màu sắc cho Zalo Mini App Nông nghiệp
 * 
 * Requirements: 2.1-2.6, 8.2
 */

export interface ColorToken {
  name: string;
  value: string;
  usage: string;
  category: 'primary' | 'functional' | 'semantic' | 'text' | 'background';
}

// Primary Colors
export const primaryColors = {
  zaloBlue: '#0068FF',
  zaloBlueDark: '#0052CC',
  agriGreen: '#3EBB6C',
  agriGreenDark: '#35A55F',
} as const;

// Chart accent palette (data-series colors, not UI elements)
export const chartPalette = [
  '#0068FF', // zaloBlue
  '#FFCC00', // warningYellow
  '#3EBB6C', // agriGreen
  '#9B59B6', // purple
  '#5C6BC0', // indigo
] as const;

// Functional Colors
export const functionalColors = {
  alertRed: '#F50000',
  warningYellow: '#FFCC00',
  neutralGray: '#F7F7F8',
} as const;

// Semantic Colors (derived from functional)
export const semanticColors = {
  success: '#3EBB6C',
  error: '#F50000',
  warning: '#FFCC00',
  info: '#0068FF',
} as const;

// Text Colors
export const textColors = {
  primary: '#000000',
  secondary: '#666666',
  disabled: '#CCCCCC',
  inverse: '#FFFFFF',
} as const;

// Background Colors
export const backgroundColors = {
  primary: '#FFFFFF',
  secondary: '#F7F7F8',
  tertiary: '#F0F0F0',
} as const;

// Combined color palette
export const colors = {
  primary: primaryColors,
  functional: functionalColors,
  semantic: semanticColors,
  text: textColors,
  background: backgroundColors,
} as const;

// All valid color values for validation
export const validColorValues = [
  ...Object.values(primaryColors),
  ...Object.values(functionalColors),
  ...Object.values(semanticColors),
  ...Object.values(textColors),
  ...Object.values(backgroundColors),
] as const;

// Color tokens with metadata
export const colorTokens: ColorToken[] = [
  {
    name: 'zaloBlue',
    value: '#0068FF',
    usage: 'Nút hành động chính, links',
    category: 'primary',
  },
  {
    name: 'agriGreen',
    value: '#3EBB6C',
    usage: 'Trạng thái tốt, nông nghiệp',
    category: 'primary',
  },
  {
    name: 'alertRed',
    value: '#F50000',
    usage: 'Cảnh báo nguy hiểm',
    category: 'functional',
  },
  {
    name: 'warningYellow',
    value: '#FFCC00',
    usage: 'Cảnh báo chú ý',
    category: 'functional',
  },
  {
    name: 'neutralGray',
    value: '#F7F7F8',
    usage: 'Nền, đường viền',
    category: 'functional',
  },
  {
    name: 'success',
    value: '#3EBB6C',
    usage: 'Trạng thái thành công',
    category: 'semantic',
  },
  {
    name: 'error',
    value: '#F50000',
    usage: 'Trạng thái lỗi',
    category: 'semantic',
  },
  {
    name: 'warning',
    value: '#FFCC00',
    usage: 'Trạng thái cảnh báo',
    category: 'semantic',
  },
  {
    name: 'info',
    value: '#0068FF',
    usage: 'Thông tin',
    category: 'semantic',
  },
];

/**
 * Convert hex color to RGB object
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Convert hex color to RGB string
 */
export const hexToRgbString = (hex: string): string => {
  const rgb = hexToRgb(hex);
  return rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : hex;
};

/**
 * Export colors as CSS custom properties
 */
export const toCssVariables = (): string => {
  const cssVars: string[] = [':root {'];
  
  // Primary colors
  Object.entries(primaryColors).forEach(([key, value]) => {
    cssVars.push(`  --color-primary-${key}: ${value};`);
  });
  
  // Functional colors
  Object.entries(functionalColors).forEach(([key, value]) => {
    cssVars.push(`  --color-functional-${key}: ${value};`);
  });
  
  // Semantic colors
  Object.entries(semanticColors).forEach(([key, value]) => {
    cssVars.push(`  --color-semantic-${key}: ${value};`);
  });
  
  // Text colors
  Object.entries(textColors).forEach(([key, value]) => {
    cssVars.push(`  --color-text-${key}: ${value};`);
  });
  
  // Background colors
  Object.entries(backgroundColors).forEach(([key, value]) => {
    cssVars.push(`  --color-background-${key}: ${value};`);
  });
  
  cssVars.push('}');
  return cssVars.join('\n');
};

/**
 * Export colors as JSON
 */
export const toJson = (): string => {
  return JSON.stringify(colors, null, 2);
};

/**
 * Export colors as Tailwind config
 */
export const toTailwindConfig = () => {
  return {
    primary: {
      'zalo-blue': primaryColors.zaloBlue,
      'agri-green': primaryColors.agriGreen,
    },
    functional: {
      'alert-red': functionalColors.alertRed,
      'warning-yellow': functionalColors.warningYellow,
      'neutral-gray': functionalColors.neutralGray,
    },
    semantic: {
      success: semanticColors.success,
      error: semanticColors.error,
      warning: semanticColors.warning,
      info: semanticColors.info,
    },
    text: {
      primary: textColors.primary,
      secondary: textColors.secondary,
      disabled: textColors.disabled,
      inverse: textColors.inverse,
    },
    background: {
      primary: backgroundColors.primary,
      secondary: backgroundColors.secondary,
      tertiary: backgroundColors.tertiary,
    },
  };
};

/**
 * Get nearest valid color from palette
 * Used for error recovery when invalid color is provided
 */
export const getNearestValidColor = (color: string): string => {
  // Simple implementation: return first primary color as fallback
  // In production, this could use color distance algorithms
  return primaryColors.zaloBlue;
};

/**
 * Validate and get color value
 * Throws error if color is not in palette
 */
export const getValidatedColor = (color: string): string => {
  const normalizedColor = color.toUpperCase();
  const isValid = validColorValues.some(
    (validColor) => validColor.toUpperCase() === normalizedColor
  );
  
  if (!isValid) {
    throw new Error(
      `Invalid color: ${color}. Must use colors from the defined palette.`
    );
  }
  
  return color;
};

/**
 * Get color by semantic meaning
 */
export const getSemanticColor = (
  semantic: 'success' | 'error' | 'warning' | 'info'
): string => {
  return semanticColors[semantic];
};

/**
 * Get color by status
 */
export const getStatusColor = (
  status: 'normal' | 'warning' | 'danger'
): string => {
  switch (status) {
    case 'normal':
      return semanticColors.success;
    case 'warning':
      return semanticColors.warning;
    case 'danger':
      return semanticColors.error;
    default:
      return textColors.primary;
  }
};

export default colors;
