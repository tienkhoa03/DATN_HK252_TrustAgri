/**
 * Error Handling Utilities
 * Comprehensive error handling for design system
 * 
 * Requirements: 8.1-8.5
 * Task: 35. Implement Error Handling
 */

import { isValidColor, getColorValidationError } from './validators';
import { isValidFontSize, getFontSizeValidationError } from './validators';
import { isValidIcon, isOutlineIconStyle } from './validators';
import { validateTheme, ThemeConfig, defaultTheme } from './theme';

/**
 * Check if running in production environment
 */
const isProduction = (): boolean => {
  try {
    // Use globalThis to avoid TypeScript errors
    const env = (globalThis as any).process?.env?.NODE_ENV;
    return env === 'production';
  } catch {
    return false;
  }
};

/**
 * Error Types
 */
export enum DesignSystemErrorType {
  COLOR_VALIDATION = 'COLOR_VALIDATION',
  TYPOGRAPHY_VALIDATION = 'TYPOGRAPHY_VALIDATION',
  ICON_VALIDATION = 'ICON_VALIDATION',
  ASSET_LOADING = 'ASSET_LOADING',
  FONT_LOADING = 'FONT_LOADING',
  THEME_CONFIGURATION = 'THEME_CONFIGURATION',
}

/**
 * Base Design System Error
 */
export class DesignSystemError extends Error {
  public readonly type: DesignSystemErrorType;
  public readonly context?: Record<string, any>;
  public readonly recoverable: boolean;
  public readonly timestamp: Date;

  constructor(
    type: DesignSystemErrorType,
    message: string,
    context?: Record<string, any>,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'DesignSystemError';
    this.type = type;
    this.context = context;
    this.recoverable = recoverable;
    this.timestamp = new Date();

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, DesignSystemError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      context: this.context,
      recoverable: this.recoverable,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Color Validation Error Handler
 * Requirement: 2.1-2.6, 8.2
 */
export class ColorValidationError extends DesignSystemError {
  constructor(color: string, context?: Record<string, any>) {
    const message = getColorValidationError(color);
    super(DesignSystemErrorType.COLOR_VALIDATION, message, {
      ...context,
      invalidColor: color,
    });
    this.name = 'ColorValidationError';
  }
}

/**
 * Handle color validation with fallback
 */
export const handleColorValidation = (
  color: string,
  fallbackColor: string = '#000000'
): { color: string; error?: ColorValidationError } => {
  if (isValidColor(color)) {
    return { color };
  }

  const error = new ColorValidationError(color, {
    fallbackColor,
    suggestion: 'Using fallback color. Please use colors from the defined palette.',
  });

  // Log error for monitoring
  console.error('[Design System]', error.message, error.context);
  errorLogger.log(error, true, fallbackColor);

  return {
    color: fallbackColor,
    error,
  };
};

/**
 * Get nearest valid color from palette
 */
export const getNearestValidColor = (color: string): string => {
  // Simple fallback logic - in production, could use color distance algorithms
  const validColors = {
    blue: '#0068FF',
    green: '#3EBB6C',
    red: '#F50000',
    yellow: '#FFCC00',
    gray: '#F7F7F8',
    black: '#000000',
    white: '#FFFFFF',
  };

  // Try to match by color name or return default
  const colorLower = color.toLowerCase();
  for (const [name, value] of Object.entries(validColors)) {
    if (colorLower.includes(name)) {
      return value;
    }
  }

  return validColors.black;
};

/**
 * Typography Validation Error Handler
 * Requirement: 3.1-3.6, 8.3
 */
export class TypographyValidationError extends DesignSystemError {
  constructor(fontSize: string, context?: Record<string, any>) {
    const message = getFontSizeValidationError(fontSize);
    super(DesignSystemErrorType.TYPOGRAPHY_VALIDATION, message, {
      ...context,
      invalidFontSize: fontSize,
    });
    this.name = 'TypographyValidationError';
  }
}

/**
 * Handle typography validation with fallback
 */
export const handleTypographyValidation = (
  fontSize: string,
  fallbackSize: string = '16px'
): { fontSize: string; error?: TypographyValidationError } => {
  if (isValidFontSize(fontSize)) {
    return { fontSize };
  }

  const error = new TypographyValidationError(fontSize, {
    fallbackSize,
    suggestion: 'Using fallback font size. Please use defined typography scale.',
  });

  // Log error for monitoring
  console.error('[Design System]', error.message, error.context);
  errorLogger.log(error, true, fallbackSize);

  return {
    fontSize: fallbackSize,
    error,
  };
};

/**
 * Round font size to nearest valid size
 */
export const roundToNearestFontSize = (fontSize: string): string => {
  const validSizes = ['12px', '14px', '16px', '18px', '22px'];
  const sizeValue = parseInt(fontSize);

  if (isNaN(sizeValue)) {
    return '16px'; // Default body size
  }

  // Find nearest valid size
  let nearest = validSizes[0];
  let minDiff = Math.abs(sizeValue - parseInt(nearest));

  for (const validSize of validSizes) {
    const diff = Math.abs(sizeValue - parseInt(validSize));
    if (diff < minDiff) {
      minDiff = diff;
      nearest = validSize;
    }
  }

  return nearest;
};

/**
 * Icon Validation Error Handler
 * Requirement: 4.1-4.6, 8.4
 */
export class IconValidationError extends DesignSystemError {
  constructor(iconName: string, reason: string, context?: Record<string, any>) {
    const message = `Invalid icon: ${iconName}. ${reason}`;
    super(DesignSystemErrorType.ICON_VALIDATION, message, {
      ...context,
      invalidIcon: iconName,
      reason,
    });
    this.name = 'IconValidationError';
  }
}

/**
 * Handle icon validation with fallback
 */
export const handleIconValidation = (
  iconName: string,
  requireOutline: boolean = true
): { iconName: string | null; error?: IconValidationError } => {
  // Check if icon exists
  if (!isValidIcon(iconName)) {
    const error = new IconValidationError(
      iconName,
      'Icon not found in design system.',
      {
        suggestion: 'Check icon name or add icon to design system.',
      }
    );

    console.error('[Design System]', error.message, error.context);

    return {
      iconName: null, // Return null to indicate no icon should be rendered
      error,
    };
  }

  // Check if icon style is outline
  if (requireOutline && !isOutlineIconStyle(iconName)) {
    const error = new IconValidationError(
      iconName,
      'Icon must use outline style.',
      {
        suggestion: 'Replace with outline version of icon.',
      }
    );

    console.warn('[Design System]', error.message, error.context);

    return {
      iconName, // Still return the icon but log warning
      error,
    };
  }

  return { iconName };
};

/**
 * Asset Loading Error Handler
 * Handles errors when loading images, icons, or other assets
 */
export class AssetLoadingError extends DesignSystemError {
  constructor(assetUrl: string, assetType: string, context?: Record<string, any>) {
    const message = `Failed to load ${assetType}: ${assetUrl}`;
    super(DesignSystemErrorType.ASSET_LOADING, message, {
      ...context,
      assetUrl,
      assetType,
    });
    this.name = 'AssetLoadingError';
  }
}

/**
 * Handle asset loading with fallback
 */
export const handleAssetLoading = (
  assetUrl: string,
  assetType: 'image' | 'icon' | 'font' | 'other',
  fallbackUrl?: string
): { url: string; error?: AssetLoadingError } => {
  const error = new AssetLoadingError(assetUrl, assetType, {
    fallbackUrl,
    suggestion: fallbackUrl
      ? 'Using fallback asset.'
      : 'Displaying placeholder. Check asset URL and network connection.',
  });

  console.error('[Design System]', error.message, error.context);

  // Get placeholder for non-image/icon types
  const placeholder = (assetType === 'image' || assetType === 'icon') 
    ? getAssetPlaceholder(assetType)
    : '';

  // Log error
  errorLogger.log(error, true, fallbackUrl || placeholder);

  return {
    url: fallbackUrl || placeholder, // Return fallback or placeholder
    error,
  };
};

/**
 * Get placeholder for failed asset
 */
export const getAssetPlaceholder = (assetType: 'image' | 'icon'): string => {
  if (assetType === 'image') {
    // Return a data URL for a simple gray placeholder
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23F7F7F8"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666666" font-family="sans-serif" font-size="14"%3EImage%3C/text%3E%3C/svg%3E';
  } else {
    // Return a simple question mark icon
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23666666" stroke-width="2"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cpath d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/%3E%3Cline x1="12" y1="17" x2="12.01" y2="17"/%3E%3C/svg%3E';
  }
};

/**
 * Font Loading Error Handler
 * Requirement: 9.1
 */
export class FontLoadingError extends DesignSystemError {
  constructor(fontFamily: string, context?: Record<string, any>) {
    const message = `Failed to load font: ${fontFamily}`;
    super(DesignSystemErrorType.FONT_LOADING, message, {
      ...context,
      fontFamily,
    });
    this.name = 'FontLoadingError';
  }
}

/**
 * Handle font loading with fallback
 */
export const handleFontLoading = (
  fontFamily: string,
  fallbackFonts: string[] = ['sans-serif']
): { fontFamily: string; error?: FontLoadingError } => {
  const error = new FontLoadingError(fontFamily, {
    fallbackFonts,
    suggestion: `Falling back to: ${fallbackFonts.join(', ')}`,
  });

  console.warn('[Design System]', error.message, error.context);

  // Return font stack with fallbacks
  const fontStack = [fontFamily, ...fallbackFonts].join(', ');

  return {
    fontFamily: fontStack,
    error,
  };
};

/**
 * Get system font fallback based on platform
 */
export const getSystemFontFallback = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  } else if (userAgent.includes('Android')) {
    return 'Roboto, "Segoe UI", sans-serif';
  }
  return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
};

/**
 * Theme Configuration Error Handler
 * Requirement: 8.1-8.5
 */
export class ThemeConfigurationError extends DesignSystemError {
  constructor(errors: string[], context?: Record<string, any>) {
    const message = `Invalid theme configuration: ${errors.join(', ')}`;
    super(DesignSystemErrorType.THEME_CONFIGURATION, message, {
      ...context,
      errors,
    }, false); // Theme errors are not recoverable
    this.name = 'ThemeConfigurationError';
  }
}

/**
 * Handle theme configuration with fallback
 */
export const handleThemeConfiguration = (
  theme: ThemeConfig
): { theme: ThemeConfig; error?: ThemeConfigurationError } => {
  const validation = validateTheme(theme);

  if (validation.valid) {
    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('[Design System] Theme warnings:', validation.warnings);
    }
    return { theme };
  }

  // Theme is invalid, use default theme
  const error = new ThemeConfigurationError(validation.errors || [], {
    suggestion: 'Using default theme. Fix theme configuration errors.',
    providedTheme: theme.name,
    fallbackTheme: defaultTheme.name,
  });

  console.error('[Design System]', error.message, error.context);

  return {
    theme: defaultTheme,
    error,
  };
};

/**
 * Validate and fix theme configuration
 * Attempts to fix common issues automatically
 */
export const validateAndFixTheme = (theme: Partial<ThemeConfig>): ThemeConfig => {
  const fixedTheme: ThemeConfig = {
    name: theme.name || 'custom-theme',
    colors: theme.colors || defaultTheme.colors,
    typography: theme.typography || defaultTheme.typography,
    spacing: theme.spacing || defaultTheme.spacing,
    icons: theme.icons || defaultTheme.icons,
    components: theme.components,
  };

  // Validate the fixed theme
  const validation = validateTheme(fixedTheme);

  if (!validation.valid) {
    console.error('[Design System] Could not fix theme configuration:', validation.errors);
    return defaultTheme;
  }

  if (validation.warnings && validation.warnings.length > 0) {
    console.warn('[Design System] Theme warnings after fixes:', validation.warnings);
  }

  return fixedTheme;
};

/**
 * Error Recovery Strategies
 */
export interface ErrorRecoveryStrategy {
  type: DesignSystemErrorType;
  recover: (error: DesignSystemError) => any;
}

/**
 * Default error recovery strategies
 */
export const defaultRecoveryStrategies: ErrorRecoveryStrategy[] = [
  {
    type: DesignSystemErrorType.COLOR_VALIDATION,
    recover: (error: DesignSystemError) => {
      const invalidColor = error.context?.invalidColor;
      return getNearestValidColor(invalidColor || '#000000');
    },
  },
  {
    type: DesignSystemErrorType.TYPOGRAPHY_VALIDATION,
    recover: (error: DesignSystemError) => {
      const invalidFontSize = error.context?.invalidFontSize;
      return roundToNearestFontSize(invalidFontSize || '16px');
    },
  },
  {
    type: DesignSystemErrorType.ICON_VALIDATION,
    recover: (error: DesignSystemError) => {
      return null; // Don't render invalid icons
    },
  },
  {
    type: DesignSystemErrorType.ASSET_LOADING,
    recover: (error: DesignSystemError) => {
      const assetType = error.context?.assetType;
      return getAssetPlaceholder(assetType === 'image' ? 'image' : 'icon');
    },
  },
  {
    type: DesignSystemErrorType.FONT_LOADING,
    recover: (error: DesignSystemError) => {
      return getSystemFontFallback();
    },
  },
  {
    type: DesignSystemErrorType.THEME_CONFIGURATION,
    recover: (error: DesignSystemError) => {
      return defaultTheme;
    },
  },
];

/**
 * Error Recovery Manager
 */
export class ErrorRecoveryManager {
  private strategies: Map<DesignSystemErrorType, ErrorRecoveryStrategy>;

  constructor(strategies: ErrorRecoveryStrategy[] = defaultRecoveryStrategies) {
    this.strategies = new Map(strategies.map((s) => [s.type, s]));
  }

  /**
   * Add or update recovery strategy
   */
  addStrategy(strategy: ErrorRecoveryStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  /**
   * Recover from error
   */
  recover(error: DesignSystemError): any {
    const strategy = this.strategies.get(error.type);
    if (!strategy) {
      console.warn(`[Design System] No recovery strategy for error type: ${error.type}`);
      return null;
    }

    try {
      return strategy.recover(error);
    } catch (recoveryError) {
      console.error('[Design System] Error during recovery:', recoveryError);
      return null;
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: DesignSystemError): boolean {
    return error.recoverable && this.strategies.has(error.type);
  }
}

/**
 * Global error recovery manager instance
 */
export const errorRecoveryManager = new ErrorRecoveryManager();

/**
 * Error Logger
 * Centralized error logging for monitoring
 */
export interface ErrorLog {
  error: DesignSystemError;
  recovered: boolean;
  recoveryValue?: any;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs: number = 100;

  log(error: DesignSystemError, recovered: boolean, recoveryValue?: any): void {
    const log: ErrorLog = {
      error,
      recovered,
      recoveryValue,
    };

    this.logs.push(log);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // In production, send to monitoring service
    if (isProduction()) {
      this.sendToMonitoring(log);
    }
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  getLogsByType(type: DesignSystemErrorType): ErrorLog[] {
    return this.logs.filter((log) => log.error.type === type);
  }

  clearLogs(): void {
    this.logs = [];
  }

  private sendToMonitoring(log: ErrorLog): void {
    // Placeholder for monitoring service integration
    // In production, send to services like Sentry, LogRocket, etc.
    console.log('[Monitoring]', log.error.toJSON());
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger();

/**
 * Safe wrapper for design system operations
 * Automatically handles errors and applies recovery strategies
 */
export function safeDesignSystemOperation<T>(
  operation: () => T,
  errorType: DesignSystemErrorType,
  fallback: T
): T {
  try {
    return operation();
  } catch (error) {
    const dsError = error instanceof DesignSystemError
      ? error
      : new DesignSystemError(
          errorType,
          error instanceof Error ? error.message : String(error),
          { originalError: error }
        );

    // Try to recover
    if (errorRecoveryManager.isRecoverable(dsError)) {
      const recoveryValue = errorRecoveryManager.recover(dsError);
      errorLogger.log(dsError, true, recoveryValue);
      return recoveryValue ?? fallback;
    }

    // Log unrecoverable error
    errorLogger.log(dsError, false);
    console.error('[Design System] Unrecoverable error:', dsError);

    return fallback;
  }
}

/**
 * Export all error handling utilities
 */
export default {
  // Error classes
  DesignSystemError,
  ColorValidationError,
  TypographyValidationError,
  IconValidationError,
  AssetLoadingError,
  FontLoadingError,
  ThemeConfigurationError,

  // Error handlers
  handleColorValidation,
  handleTypographyValidation,
  handleIconValidation,
  handleAssetLoading,
  handleFontLoading,
  handleThemeConfiguration,

  // Recovery utilities
  getNearestValidColor,
  roundToNearestFontSize,
  getAssetPlaceholder,
  getSystemFontFallback,
  validateAndFixTheme,

  // Error management
  errorRecoveryManager,
  errorLogger,
  safeDesignSystemOperation,

  // Types
  DesignSystemErrorType,
};
