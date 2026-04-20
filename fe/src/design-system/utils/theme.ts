/**
 * Theme Configuration Utilities
 * Theme management for Zalo Mini App
 * 
 * Requirements: 1.1, 3.1, 3.2, 8.1-8.5
 */

import { colors, ColorToken, validColorValues } from '../tokens/colors';
import { typography, TypographyToken, validFontSizes } from '../tokens/typography';
import { spacing, SpacingToken } from '../tokens/spacing';
import { icons, IconToken } from '../tokens/icons';

/**
 * Theme Configuration interface
 */
export interface ThemeConfig {
  name: string;
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  icons: typeof icons;
  components?: Record<string, ComponentTheme>;
}

/**
 * Component Theme interface
 */
export interface ComponentTheme {
  componentName: string;
  defaultProps: Record<string, any>;
  styleOverrides: Record<string, any>;
}

/**
 * Theme Validation Result
 */
export interface ThemeValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Default theme configuration
 */
export const defaultTheme: ThemeConfig = {
  name: 'zalo-agri-default',
  colors,
  typography,
  spacing,
  icons,
};

/**
 * Get platform type
 * Requirement: 1.1 - Platform detection for native-like experience
 */
export const getPlatform = (): 'ios' | 'android' | 'unknown' => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return 'ios';
  } else if (userAgent.includes('Android')) {
    return 'android';
  }
  return 'unknown';
};

/**
 * Get platform-specific theme
 * Requirements: 3.1, 3.2 - Platform-specific font families
 */
export const getPlatformTheme = (): ThemeConfig => {
  const platform = getPlatform();
  
  // Adjust font family based on platform (Requirements 3.1, 3.2)
  if (platform === 'ios') {
    return {
      ...defaultTheme,
      typography: {
        ...typography,
        fontFamily: {
          ios: typography.fontFamily.ios,
          android: typography.fontFamily.android,
          system: typography.fontFamily.ios as typeof typography.fontFamily.system,
        },
      },
    };
  } else if (platform === 'android') {
    return {
      ...defaultTheme,
      typography: {
        ...typography,
        fontFamily: {
          ios: typography.fontFamily.ios,
          android: typography.fontFamily.android,
          system: typography.fontFamily.android as typeof typography.fontFamily.system,
        },
      },
    };
  }

  return defaultTheme;
};

/**
 * Validate theme configuration
 * Requirements: 8.1-8.5 - Design system consistency
 */
export const validateTheme = (theme: ThemeConfig): ThemeValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate theme name
  if (!theme.name || theme.name.trim() === '') {
    errors.push('Theme name is required');
  }

  // Validate colors structure
  if (!theme.colors) {
    errors.push('Theme colors are required');
  } else {
    // Validate color categories exist
    if (!theme.colors.primary) {
      errors.push('Primary colors are required');
    }
    if (!theme.colors.functional) {
      errors.push('Functional colors are required');
    }
    if (!theme.colors.semantic) {
      errors.push('Semantic colors are required');
    }
    if (!theme.colors.text) {
      errors.push('Text colors are required');
    }
    if (!theme.colors.background) {
      errors.push('Background colors are required');
    }

    // Validate color values are valid hex colors
    const validateColorValue = (value: string, name: string) => {
      if (!/^#[0-9A-F]{6}$/i.test(value)) {
        errors.push(`Invalid color value for ${name}: ${value}. Must be a valid hex color.`);
      }
    };

    if (theme.colors.primary) {
      Object.entries(theme.colors.primary).forEach(([key, value]) => {
        validateColorValue(value, `primary.${key}`);
      });
    }
  }

  // Validate typography structure
  if (!theme.typography) {
    errors.push('Theme typography is required');
  } else {
    // Validate font families
    if (!theme.typography.fontFamily) {
      errors.push('Font family configuration is required');
    } else {
      if (!theme.typography.fontFamily.ios) {
        errors.push('iOS font family is required');
      }
      if (!theme.typography.fontFamily.android) {
        errors.push('Android font family is required');
      }
      if (!theme.typography.fontFamily.system) {
        errors.push('System font family is required');
      }
    }

    // Validate font sizes
    if (!theme.typography.fontSize) {
      errors.push('Font size configuration is required');
    } else {
      const requiredSizes = ['h1', 'h2', 'body', 'caption', 'small'];
      requiredSizes.forEach((size) => {
        if (!theme.typography.fontSize[size as keyof typeof theme.typography.fontSize]) {
          errors.push(`Font size for ${size} is required`);
        }
      });
    }

    // Validate font weights
    if (!theme.typography.fontWeight) {
      errors.push('Font weight configuration is required');
    }

    // Validate line heights
    if (!theme.typography.lineHeight) {
      errors.push('Line height configuration is required');
    }
  }

  // Validate spacing structure
  if (!theme.spacing) {
    errors.push('Theme spacing is required');
  } else {
    const requiredSpacing = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    requiredSpacing.forEach((size) => {
      if (!theme.spacing[size as keyof typeof theme.spacing]) {
        errors.push(`Spacing for ${size} is required`);
      }
    });
  }

  // Validate icons structure
  if (!theme.icons) {
    errors.push('Theme icons are required');
  } else {
    if (!theme.icons.navigation) {
      warnings.push('Navigation icons are recommended');
    }
    if (!theme.icons.agriculture) {
      warnings.push('Agriculture icons are recommended');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Validate component theme
 */
export const validateComponentTheme = (componentTheme: ComponentTheme): ThemeValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!componentTheme.componentName || componentTheme.componentName.trim() === '') {
    errors.push('Component name is required');
  }

  if (!componentTheme.defaultProps) {
    warnings.push('Default props are recommended for component theme');
  }

  if (!componentTheme.styleOverrides) {
    warnings.push('Style overrides are recommended for component theme');
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

/**
 * Extend color palette (Requirement 10.1)
 * Maintains backward compatibility while adding new colors
 */
export const extendColorPalette = (
  baseColors: typeof colors,
  newColors: Record<string, string>,
  category: 'primary' | 'functional' | 'semantic' | 'text' | 'background' = 'functional'
): typeof colors => {
  // Validate new colors are valid hex colors
  Object.entries(newColors).forEach(([key, value]) => {
    if (!/^#[0-9A-F]{6}$/i.test(value)) {
      throw new Error(`Invalid color value for ${key}: ${value}. Must be a valid hex color.`);
    }
  });

  return {
    ...baseColors,
    [category]: {
      ...baseColors[category],
      ...newColors,
    },
  } as typeof colors;
};

/**
 * Create theme with custom overrides
 * Validates the resulting theme configuration
 */
export const createTheme = (overrides?: Partial<ThemeConfig>): ThemeConfig => {
  const newTheme = {
    ...defaultTheme,
    ...overrides,
    // Deep merge for nested objects
    colors: overrides?.colors ? { ...defaultTheme.colors, ...overrides.colors } : defaultTheme.colors,
    typography: overrides?.typography ? { ...defaultTheme.typography, ...overrides.typography } : defaultTheme.typography,
    spacing: overrides?.spacing ? { ...defaultTheme.spacing, ...overrides.spacing } : defaultTheme.spacing,
    icons: overrides?.icons ? { ...defaultTheme.icons, ...overrides.icons } : defaultTheme.icons,
  };

  // Validate the new theme
  const validation = validateTheme(newTheme);
  if (!validation.valid) {
    throw new Error(`Invalid theme configuration: ${validation.errors?.join(', ')}`);
  }

  if (validation.warnings && validation.warnings.length > 0) {
    console.warn('Theme warnings:', validation.warnings);
  }

  return newTheme;
};

/**
 * Merge themes
 * Combines two themes with the second theme taking precedence
 * Requirement: 10.5 - Backward compatibility
 */
export const mergeThemes = (baseTheme: ThemeConfig, overrideTheme: Partial<ThemeConfig>): ThemeConfig => {
  return createTheme({
    ...baseTheme,
    ...overrideTheme,
    colors: overrideTheme.colors ? { ...baseTheme.colors, ...overrideTheme.colors } : baseTheme.colors,
    typography: overrideTheme.typography ? { ...baseTheme.typography, ...overrideTheme.typography } : baseTheme.typography,
    spacing: overrideTheme.spacing ? { ...baseTheme.spacing, ...overrideTheme.spacing } : baseTheme.spacing,
    icons: overrideTheme.icons ? { ...baseTheme.icons, ...overrideTheme.icons } : baseTheme.icons,
    components: overrideTheme.components ? { ...baseTheme.components, ...overrideTheme.components } : baseTheme.components,
  });
};

/**
 * Get component theme from theme configuration
 */
export const getComponentTheme = (theme: ThemeConfig, componentName: string): ComponentTheme | undefined => {
  return theme.components?.[componentName];
};

/**
 * Apply component theme to props
 */
export const applyComponentTheme = <T extends Record<string, any>>(
  props: T,
  componentTheme?: ComponentTheme
): T => {
  if (!componentTheme) {
    return props;
  }

  return {
    ...componentTheme.defaultProps,
    ...props,
  };
};

/**
 * Export theme as CSS variables string
 */
export const exportThemeAsCss = (theme: ThemeConfig): string => {
  const cssVars: string[] = [':root {'];
  
  // Colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    cssVars.push(`  --color-primary-${key}: ${value};`);
  });
  
  Object.entries(theme.colors.functional).forEach(([key, value]) => {
    cssVars.push(`  --color-functional-${key}: ${value};`);
  });
  
  Object.entries(theme.colors.semantic).forEach(([key, value]) => {
    cssVars.push(`  --color-semantic-${key}: ${value};`);
  });
  
  Object.entries(theme.colors.text).forEach(([key, value]) => {
    cssVars.push(`  --color-text-${key}: ${value};`);
  });
  
  Object.entries(theme.colors.background).forEach(([key, value]) => {
    cssVars.push(`  --color-background-${key}: ${value};`);
  });
  
  // Typography
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`  --font-size-${key}: ${value};`);
  });
  
  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    cssVars.push(`  --font-weight-${key}: ${value};`);
  });
  
  Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
    cssVars.push(`  --line-height-${key}: ${value};`);
  });
  
  cssVars.push(`  --font-family-system: ${theme.typography.fontFamily.system};`);
  
  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssVars.push(`  --spacing-${key}: ${value};`);
  });
  
  cssVars.push('}');
  return cssVars.join('\n');
};

/**
 * Export theme as JSON
 */
export const exportThemeAsJson = (theme: ThemeConfig): string => {
  return JSON.stringify(theme, null, 2);
};

export default {
  defaultTheme,
  getPlatform,
  getPlatformTheme,
  validateTheme,
  validateComponentTheme,
  extendColorPalette,
  createTheme,
  mergeThemes,
  getComponentTheme,
  applyComponentTheme,
  exportThemeAsCss,
  exportThemeAsJson,
};
