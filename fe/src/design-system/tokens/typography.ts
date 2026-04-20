/**
 * Typography Design Tokens
 * Hệ thống typography cho Zalo Mini App Nông nghiệp
 * 
 * Requirements: 3.1-3.6, 8.3, 9.1
 */

import React from 'react';

export interface TypographyToken {
  name: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  fontFamily: string;
  usage: string;
}

// Font Families
export const fontFamily = {
  ios: '-apple-system, San Francisco',
  android: 'Roboto, sans-serif',
  system: '-apple-system, Roboto, sans-serif',
} as const;

// Font Sizes
export const fontSize = {
  h1: '22px',
  h2: '18px',
  body: '16px',
  caption: '14px',
  small: '12px',
} as const;

// Font Weights
export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Line Heights
export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Typography scale
export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
} as const;

// Typography tokens with metadata
export const typographyTokens: TypographyToken[] = [
  {
    name: 'h1',
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: 1.2,
    fontFamily: fontFamily.system,
    usage: 'Tiêu đề màn hình, tên Farm Lab',
  },
  {
    name: 'h2',
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.2,
    fontFamily: fontFamily.system,
    usage: 'Tiêu đề mục, tên chỉ số',
  },
  {
    name: 'body',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5,
    fontFamily: fontFamily.system,
    usage: 'Nội dung chính',
  },
  {
    name: 'caption',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
    fontFamily: fontFamily.system,
    usage: 'Chú thích, label',
  },
  {
    name: 'small',
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.5,
    fontFamily: fontFamily.system,
    usage: 'Thông tin phụ',
  },
];

// Valid font sizes for validation
export const validFontSizes = Object.values(fontSize);

// Minimum font size for important information (Requirement 3.6)
export const MIN_FONT_SIZE = 14;

/**
 * Get platform-specific font family
 * Requirements: 3.1, 3.2
 */
export const getPlatformFontFamily = (): string => {
  const platform = navigator.userAgent;
  if (platform.includes('iPhone') || platform.includes('iPad')) {
    return fontFamily.ios;
  } else if (platform.includes('Android')) {
    return fontFamily.android;
  }
  return fontFamily.system;
};

/**
 * Typography Scale Utilities
 * Requirements: 3.3-3.6, 8.3
 */

/**
 * Get typography token by name
 */
export const getTypographyToken = (name: string): TypographyToken | undefined => {
  return typographyTokens.find((token) => token.name === name);
};

/**
 * Get font size value (numeric) from string
 */
export const getFontSizeValue = (fontSize: string): number => {
  return parseInt(fontSize.replace('px', ''));
};

/**
 * Validate font size against typography scale
 * Requirement: 8.3
 */
export const isValidTypographyScale = (fontSize: string): boolean => {
  return validFontSizes.includes(fontSize as any);
};

/**
 * Get nearest valid font size from typography scale
 */
export const getNearestValidFontSize = (fontSize: string): string => {
  const sizeValue = getFontSizeValue(fontSize);
  const validSizeValues = validFontSizes.map(getFontSizeValue);
  
  let nearest = validSizeValues[0];
  let minDiff = Math.abs(sizeValue - nearest);
  
  for (const validSize of validSizeValues) {
    const diff = Math.abs(sizeValue - validSize);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = validSize;
    }
  }
  
  return `${nearest}px`;
};

/**
 * Validate minimum font size for important information
 * Requirement: 3.6
 */
export const validateMinimumFontSize = (fontSize: string, isImportant: boolean = true): {
  valid: boolean;
  error?: string;
} => {
  if (!isImportant) {
    return { valid: true };
  }
  
  const sizeValue = getFontSizeValue(fontSize);
  
  if (sizeValue < MIN_FONT_SIZE) {
    return {
      valid: false,
      error: `Font size ${fontSize} is below minimum ${MIN_FONT_SIZE}px for important information`,
    };
  }
  
  return { valid: true };
};

/**
 * Create typography style object
 */
export const createTypographyStyle = (
  variant: 'h1' | 'h2' | 'body' | 'caption' | 'small',
  overrides?: Partial<TypographyToken>
): React.CSSProperties => {
  const token = getTypographyToken(variant);
  
  if (!token) {
    throw new Error(`Invalid typography variant: ${variant}`);
  }
  
  return {
    fontSize: overrides?.fontSize || token.fontSize,
    fontWeight: overrides?.fontWeight || token.fontWeight,
    lineHeight: overrides?.lineHeight || token.lineHeight,
    fontFamily: overrides?.fontFamily || getPlatformFontFamily(),
  };
};

/**
 * Apply responsive font size based on screen width
 */
export const getResponsiveFontSize = (
  baseSize: string,
  screenWidth: number
): string => {
  const baseSizeValue = getFontSizeValue(baseSize);
  
  // Scale down for smaller screens (< 360px)
  if (screenWidth < 360) {
    const scaleFactor = screenWidth / 360;
    const scaledSize = Math.max(MIN_FONT_SIZE, Math.round(baseSizeValue * scaleFactor));
    return `${scaledSize}px`;
  }
  
  // Scale up slightly for larger screens (> 414px)
  if (screenWidth > 414) {
    const scaleFactor = Math.min(1.1, screenWidth / 414);
    const scaledSize = Math.round(baseSizeValue * scaleFactor);
    return `${scaledSize}px`;
  }
  
  return baseSize;
};

/**
 * Load platform-specific fonts
 * Requirement: 9.1 - Use system fonts for optimal performance
 */
export const loadPlatformFonts = (): void => {
  // System fonts are already available, no need to load
  // This function exists for API consistency and future extensibility
  console.log('Using system fonts for optimal performance');
};

export default typography;
