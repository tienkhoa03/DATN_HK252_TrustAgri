/**
 * Design System Validators
 * Validation utilities for design system compliance
 * 
 * Requirements: 8.1-8.5, 10.1-10.5
 */

import { validColorValues, hexToRgb } from '../tokens/colors';
import { validFontSizes, MIN_FONT_SIZE, getFontSizeValue } from '../tokens/typography';
import { iconTokens } from '../tokens/icons';
import { spacing } from '../tokens/spacing';

/**
 * Color Validation Functions
 * Requirements: 2.1-2.6, 8.2
 */

/**
 * Validate if a color is from the defined palette
 * Requirement: 2.1-2.6, 8.2
 */
export const isValidColor = (color: string): boolean => {
  const normalizedColor = color.toUpperCase();
  return validColorValues.some(
    (validColor) => validColor.toUpperCase() === normalizedColor
  );
};

/**
 * Validate if a color is a valid hex color format
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Validate if a color is a valid RGB color format
 */
export const isValidRgbColor = (color: string): boolean => {
  return /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color);
};

/**
 * Validate if a color is a valid RGBA color format
 */
export const isValidRgbaColor = (color: string): boolean => {
  return /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/.test(color);
};

/**
 * Get validation error message for invalid color
 */
export const getColorValidationError = (color: string): string => {
  if (!isValidHexColor(color) && !isValidRgbColor(color) && !isValidRgbaColor(color)) {
    return `Invalid color format: ${color}. Must be a valid hex, RGB, or RGBA color.`;
  }
  return `Invalid color: ${color}. Must use colors from the defined palette.`;
};

/**
 * Validate color contrast ratio for accessibility
 * Requirements: 8.1, 10.1
 * @param foreground - Foreground color (text)
 * @param background - Background color
 * @param level - WCAG level ('AA' or 'AAA')
 * @returns true if contrast ratio meets the specified level
 */
export const validateColorContrast = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): { valid: boolean; ratio: number; required: number } => {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    return { valid: false, ratio: 0, required: level === 'AA' ? 4.5 : 7 };
  }
  
  // Calculate relative luminance
  const getLuminance = (rgb: { r: number; g: number; b: number }): number => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      const sRGB = val / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const fgLuminance = getLuminance(fgRgb);
  const bgLuminance = getLuminance(bgRgb);
  
  // Calculate contrast ratio
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  
  // WCAG 2.1 requirements
  const required = level === 'AA' ? 4.5 : 7;
  
  return {
    valid: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  };
};

/**
 * Typography Validation Functions
 * Requirements: 3.1-3.6, 8.3
 */

/**
 * Validate if a font size is from the typography scale
 * Requirement: 3.3-3.6, 8.3
 */
export const isValidFontSize = (fontSize: string): boolean => {
  return validFontSizes.includes(fontSize as any);
};

/**
 * Validate if font size meets minimum requirement for important information
 * Requirement: 3.6
 */
export const meetsMinimumFontSize = (fontSize: string): boolean => {
  const sizeValue = parseInt(fontSize);
  return sizeValue >= MIN_FONT_SIZE;
};

/**
 * Get validation error message for invalid font size
 */
export const getFontSizeValidationError = (fontSize: string): string => {
  if (!isValidFontSize(fontSize)) {
    return `Invalid font size: ${fontSize}. Must use defined typography scale.`;
  }
  if (!meetsMinimumFontSize(fontSize)) {
    return `Font size ${fontSize} is below minimum ${MIN_FONT_SIZE}px for important information.`;
  }
  return '';
};

/**
 * Validate font weight is within acceptable range
 */
export const isValidFontWeight = (weight: number): boolean => {
  return weight >= 100 && weight <= 900 && weight % 100 === 0;
};

/**
 * Validate line height is reasonable
 */
export const isValidLineHeight = (lineHeight: number): boolean => {
  return lineHeight >= 1 && lineHeight <= 3;
};

/**
 * Validate typography configuration
 */
export const validateTypography = (config: {
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: number;
  isImportant?: boolean;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (config.fontSize) {
    if (!isValidFontSize(config.fontSize)) {
      errors.push(`Invalid font size: ${config.fontSize}. Must use defined typography scale.`);
    }
    if (config.isImportant && !meetsMinimumFontSize(config.fontSize)) {
      errors.push(`Font size ${config.fontSize} is below minimum ${MIN_FONT_SIZE}px for important information.`);
    }
  }
  
  if (config.fontWeight !== undefined && !isValidFontWeight(config.fontWeight)) {
    errors.push(`Invalid font weight: ${config.fontWeight}. Must be between 100-900 in increments of 100.`);
  }
  
  if (config.lineHeight !== undefined && !isValidLineHeight(config.lineHeight)) {
    errors.push(`Invalid line height: ${config.lineHeight}. Must be between 1 and 3.`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Icon Validation Functions
 * Requirements: 4.1-4.6, 8.4
 */

/**
 * Validate if icon style is outline
 * Requirement: 4.1, 8.4
 */
export const isOutlineIconStyle = (iconName: string): boolean => {
  const icon = iconTokens.find((token) => token.name === iconName);
  return icon?.style === 'outline';
};

/**
 * Validate if icon exists in the design system
 */
export const isValidIcon = (iconName: string): boolean => {
  return iconTokens.some((token) => token.name === iconName);
};

/**
 * Validate if icon size is valid
 */
export const isValidIconSize = (size: string): boolean => {
  const validSizes = ['16px', '24px', '32px'];
  return validSizes.includes(size);
};

/**
 * Validate icon configuration
 */
export const validateIcon = (config: {
  name: string;
  size?: string;
  requireOutline?: boolean;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!isValidIcon(config.name)) {
    errors.push(`Invalid icon: ${config.name}. Icon not found in design system.`);
  }
  
  if (config.requireOutline !== false && !isOutlineIconStyle(config.name)) {
    errors.push(`Icon ${config.name} must use outline style.`);
  }
  
  if (config.size && !isValidIconSize(config.size)) {
    errors.push(`Invalid icon size: ${config.size}. Must be 16px, 24px, or 32px.`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Accessibility Validation Functions
 * Requirements: 8.1, 9.4, 10.1
 */

/**
 * Validate touch target size (minimum 44x44px)
 * Requirement: 8.1, 9.4
 */
export const meetsMinimumTouchTarget = (
  width: number,
  height: number
): boolean => {
  const MIN_TOUCH_TARGET = 44;
  return width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET;
};

/**
 * Validate touch target with detailed feedback
 */
export const validateTouchTarget = (
  width: number,
  height: number
): { valid: boolean; error?: string; suggestion?: string } => {
  const MIN_TOUCH_TARGET = 44;
  
  if (width >= MIN_TOUCH_TARGET && height >= MIN_TOUCH_TARGET) {
    return { valid: true };
  }
  
  const widthDeficit = Math.max(0, MIN_TOUCH_TARGET - width);
  const heightDeficit = Math.max(0, MIN_TOUCH_TARGET - height);
  
  return {
    valid: false,
    error: `Touch target size ${width}x${height}px is below minimum ${MIN_TOUCH_TARGET}x${MIN_TOUCH_TARGET}px.`,
    suggestion: `Increase width by ${widthDeficit}px and height by ${heightDeficit}px, or add padding.`,
  };
};

/**
 * Validate spacing between touch targets
 */
export const validateTouchTargetSpacing = (spacing: number): boolean => {
  const MIN_SPACING = 8; // 8px minimum spacing
  return spacing >= MIN_SPACING;
};

/**
 * Validate ARIA label presence
 */
export const hasAriaLabel = (element: { ariaLabel?: string; 'aria-label'?: string }): boolean => {
  return !!(element.ariaLabel || element['aria-label']);
};

/**
 * Validate accessibility attributes
 */
export const validateAccessibility = (config: {
  width?: number;
  height?: number;
  ariaLabel?: string;
  role?: string;
  isInteractive?: boolean;
}): { valid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Touch target validation for interactive elements
  if (config.isInteractive && config.width !== undefined && config.height !== undefined) {
    const touchTargetResult = validateTouchTarget(config.width, config.height);
    if (!touchTargetResult.valid) {
      errors.push(touchTargetResult.error!);
      if (touchTargetResult.suggestion) {
        warnings.push(touchTargetResult.suggestion);
      }
    }
  }
  
  // ARIA label validation for interactive elements
  if (config.isInteractive && !config.ariaLabel) {
    warnings.push('Interactive elements should have an aria-label for screen readers.');
  }
  
  // Role validation
  if (config.role && !['button', 'link', 'navigation', 'main', 'complementary', 'banner'].includes(config.role)) {
    warnings.push(`Uncommon ARIA role: ${config.role}. Verify this is correct.`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Spacing Validation Functions
 * Requirements: 8.1
 */

/**
 * Validate if spacing value is from the defined scale
 */
export const isValidSpacing = (spacingValue: string): boolean => {
  return Object.values(spacing).includes(spacingValue as any);
};

/**
 * Get spacing value in pixels
 */
export const getSpacingValue = (spacingValue: string): number => {
  return parseInt(spacingValue.replace('px', ''));
};

/**
 * Validate spacing configuration
 */
export const validateSpacing = (config: {
  value: string;
}): { valid: boolean; error?: string } => {
  if (!isValidSpacing(config.value)) {
    return {
      valid: false,
      error: `Invalid spacing: ${config.value}. Must use defined spacing scale (xs, sm, md, lg, xl, xxl).`,
    };
  }
  
  return { valid: true };
};

/**
 * Component Compliance Checker
 * Requirements: 8.1-8.5, 10.1-10.5
 */

/**
 * Design Compliance Check interface
 */
export interface DesignComplianceCheck {
  rule: string;
  category: 'color' | 'typography' | 'spacing' | 'accessibility' | 'performance' | 'icon';
  severity: 'error' | 'warning' | 'info';
  validator: (component: any) => boolean;
  message: string;
}

/**
 * Component configuration interface for validation
 */
export interface ComponentConfig {
  // Color properties
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  
  // Typography properties
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: number;
  isImportant?: boolean;
  
  // Icon properties
  iconName?: string;
  iconSize?: string;
  
  // Spacing properties
  padding?: string;
  margin?: string;
  gap?: string;
  
  // Accessibility properties
  width?: number;
  height?: number;
  ariaLabel?: string;
  role?: string;
  isInteractive?: boolean;
  
  // Component metadata
  componentName?: string;
  variant?: string;
}

/**
 * Compliance rules for design system
 */
export const complianceRules: DesignComplianceCheck[] = [
  {
    rule: 'min-font-size',
    category: 'typography',
    severity: 'error',
    validator: (component) => {
      if (component.fontSize && component.isImportant !== false) {
        return meetsMinimumFontSize(component.fontSize);
      }
      return true;
    },
    message: 'Font size must be at least 14px for important information',
  },
  {
    rule: 'color-palette',
    category: 'color',
    severity: 'error',
    validator: (component) => {
      if (component.color) {
        return isValidColor(component.color);
      }
      return true;
    },
    message: 'Color must be from the defined palette',
  },
  {
    rule: 'background-color-palette',
    category: 'color',
    severity: 'error',
    validator: (component) => {
      if (component.backgroundColor) {
        return isValidColor(component.backgroundColor);
      }
      return true;
    },
    message: 'Background color must be from the defined palette',
  },
  {
    rule: 'border-color-palette',
    category: 'color',
    severity: 'error',
    validator: (component) => {
      if (component.borderColor) {
        return isValidColor(component.borderColor);
      }
      return true;
    },
    message: 'Border color must be from the defined palette',
  },
  {
    rule: 'touch-target',
    category: 'accessibility',
    severity: 'error',
    validator: (component) => {
      if (component.isInteractive && component.width && component.height) {
        return meetsMinimumTouchTarget(component.width, component.height);
      }
      return true;
    },
    message: 'Touch target must be at least 44x44px',
  },
  {
    rule: 'icon-style',
    category: 'icon',
    severity: 'error',
    validator: (component) => {
      if (component.iconName) {
        return isOutlineIconStyle(component.iconName);
      }
      return true;
    },
    message: 'Icon style must be outline',
  },
  {
    rule: 'typography-scale',
    category: 'typography',
    severity: 'warning',
    validator: (component) => {
      if (component.fontSize) {
        return isValidFontSize(component.fontSize);
      }
      return true;
    },
    message: 'Font size should use defined typography scale',
  },
  {
    rule: 'spacing-scale',
    category: 'spacing',
    severity: 'warning',
    validator: (component) => {
      const spacingProps = [component.padding, component.margin, component.gap].filter(Boolean);
      return spacingProps.every((value) => isValidSpacing(value));
    },
    message: 'Spacing should use defined spacing scale',
  },
  {
    rule: 'aria-label',
    category: 'accessibility',
    severity: 'warning',
    validator: (component) => {
      if (component.isInteractive) {
        return !!component.ariaLabel;
      }
      return true;
    },
    message: 'Interactive elements should have an aria-label',
  },
  {
    rule: 'icon-size',
    category: 'icon',
    severity: 'warning',
    validator: (component) => {
      if (component.iconSize) {
        return isValidIconSize(component.iconSize);
      }
      return true;
    },
    message: 'Icon size should be 16px, 24px, or 32px',
  },
];

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

/**
 * Validate component against all compliance rules
 */
export const validateComponent = (component: ComponentConfig): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

  for (const rule of complianceRules) {
    if (!rule.validator(component)) {
      const message = `${rule.rule}: ${rule.message}`;
      
      switch (rule.severity) {
        case 'error':
          errors.push(message);
          break;
        case 'warning':
          warnings.push(message);
          break;
        case 'info':
          info.push(message);
          break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
  };
};

/**
 * Validate component with detailed feedback
 */
export const validateComponentDetailed = (component: ComponentConfig): {
  overall: ValidationResult;
  color?: { valid: boolean; errors: string[] };
  typography?: { valid: boolean; errors: string[] };
  icon?: { valid: boolean; errors: string[] };
  accessibility?: { valid: boolean; errors: string[]; warnings: string[] };
  spacing?: { valid: boolean; error?: string };
} => {
  const result: any = {
    overall: validateComponent(component),
  };
  
  // Color validation
  if (component.color || component.backgroundColor || component.borderColor) {
    const colorErrors: string[] = [];
    if (component.color && !isValidColor(component.color)) {
      colorErrors.push(getColorValidationError(component.color));
    }
    if (component.backgroundColor && !isValidColor(component.backgroundColor)) {
      colorErrors.push(getColorValidationError(component.backgroundColor));
    }
    if (component.borderColor && !isValidColor(component.borderColor)) {
      colorErrors.push(getColorValidationError(component.borderColor));
    }
    result.color = {
      valid: colorErrors.length === 0,
      errors: colorErrors,
    };
  }
  
  // Typography validation
  if (component.fontSize || component.fontWeight || component.lineHeight) {
    const typographyResult = validateTypography({
      fontSize: component.fontSize,
      fontWeight: component.fontWeight,
      lineHeight: component.lineHeight,
      isImportant: component.isImportant,
    });
    result.typography = typographyResult;
  }
  
  // Icon validation
  if (component.iconName) {
    const iconResult = validateIcon({
      name: component.iconName,
      size: component.iconSize,
      requireOutline: true,
    });
    result.icon = iconResult;
  }
  
  // Accessibility validation
  if (component.isInteractive || component.width || component.height) {
    const accessibilityResult = validateAccessibility({
      width: component.width,
      height: component.height,
      ariaLabel: component.ariaLabel,
      role: component.role,
      isInteractive: component.isInteractive,
    });
    result.accessibility = accessibilityResult;
  }
  
  // Spacing validation
  if (component.padding || component.margin || component.gap) {
    const spacingValue = component.padding || component.margin || component.gap;
    result.spacing = validateSpacing({ value: spacingValue! });
  }
  
  return result;
};

/**
 * Check if component is compliant with design system
 */
export const isComponentCompliant = (component: ComponentConfig): boolean => {
  const result = validateComponent(component);
  return result.valid;
};

/**
 * Get compliance report for component
 */
export const getComplianceReport = (component: ComponentConfig): string => {
  const result = validateComponentDetailed(component);
  const lines: string[] = [];
  
  lines.push(`Component Compliance Report${component.componentName ? ` - ${component.componentName}` : ''}`);
  lines.push('='.repeat(50));
  
  if (result.overall.valid) {
    lines.push('✓ Component is fully compliant with design system');
  } else {
    lines.push('✗ Component has compliance issues');
  }
  
  if (result.overall.errors.length > 0) {
    lines.push('\nErrors:');
    result.overall.errors.forEach((error) => {
      lines.push(`  ✗ ${error}`);
    });
  }
  
  if (result.overall.warnings.length > 0) {
    lines.push('\nWarnings:');
    result.overall.warnings.forEach((warning) => {
      lines.push(`  ⚠ ${warning}`);
    });
  }
  
  if (result.overall.info.length > 0) {
    lines.push('\nInfo:');
    result.overall.info.forEach((info) => {
      lines.push(`  ℹ ${info}`);
    });
  }
  
  return lines.join('\n');
};

/**
 * Batch validation for multiple components
 */
export const validateComponents = (components: ComponentConfig[]): {
  allValid: boolean;
  results: Array<{ component: ComponentConfig; result: ValidationResult }>;
  summary: { total: number; valid: number; invalid: number };
} => {
  const results = components.map((component) => ({
    component,
    result: validateComponent(component),
  }));
  
  const valid = results.filter((r) => r.result.valid).length;
  const invalid = results.length - valid;
  
  return {
    allValid: invalid === 0,
    results,
    summary: {
      total: results.length,
      valid,
      invalid,
    },
  };
};

/**
 * Export all validators
 */
export default {
  // Color validators
  isValidColor,
  isValidHexColor,
  isValidRgbColor,
  isValidRgbaColor,
  getColorValidationError,
  validateColorContrast,
  
  // Typography validators
  isValidFontSize,
  meetsMinimumFontSize,
  getFontSizeValidationError,
  isValidFontWeight,
  isValidLineHeight,
  validateTypography,
  
  // Icon validators
  isOutlineIconStyle,
  isValidIcon,
  isValidIconSize,
  validateIcon,
  
  // Accessibility validators
  meetsMinimumTouchTarget,
  validateTouchTarget,
  validateTouchTargetSpacing,
  hasAriaLabel,
  validateAccessibility,
  
  // Spacing validators
  isValidSpacing,
  getSpacingValue,
  validateSpacing,
  
  // Component validators
  validateComponent,
  validateComponentDetailed,
  isComponentCompliant,
  getComplianceReport,
  validateComponents,
  
  // Compliance rules
  complianceRules,
};
