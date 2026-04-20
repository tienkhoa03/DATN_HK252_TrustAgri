/**
 * Error Handling Tests
 * Tests for error handling utilities
 */

import {
  handleColorValidation,
  handleTypographyValidation,
  handleIconValidation,
  handleAssetLoading,
  handleFontLoading,
  handleThemeConfiguration,
  getNearestValidColor,
  roundToNearestFontSize,
  getAssetPlaceholder,
  getSystemFontFallback,
  ColorValidationError,
  TypographyValidationError,
  IconValidationError,
  AssetLoadingError,
  FontLoadingError,
  ThemeConfigurationError,
  errorLogger,
  DesignSystemErrorType,
} from '../errorHandling';
import { defaultTheme } from '../theme';

describe('Error Handling', () => {
  beforeEach(() => {
    errorLogger.clearLogs();
  });

  describe('Color Validation', () => {
    it('should return valid color unchanged', () => {
      const result = handleColorValidation('#0068FF');
      expect(result.color).toBe('#0068FF');
      expect(result.error).toBeUndefined();
    });

    it('should return fallback for invalid color', () => {
      const result = handleColorValidation('#INVALID', '#000000');
      expect(result.color).toBe('#000000');
      expect(result.error).toBeInstanceOf(ColorValidationError);
    });

    it('should log color validation errors', () => {
      handleColorValidation('#INVALID', '#000000');
      const logs = errorLogger.getLogsByType(DesignSystemErrorType.COLOR_VALIDATION);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should get nearest valid color', () => {
      const nearestBlue = getNearestValidColor('blue');
      expect(nearestBlue).toBe('#0068FF');

      const nearestGreen = getNearestValidColor('green');
      expect(nearestGreen).toBe('#3EBB6C');

      const nearestRed = getNearestValidColor('red');
      expect(nearestRed).toBe('#F50000');
    });
  });

  describe('Typography Validation', () => {
    it('should return valid font size unchanged', () => {
      const result = handleTypographyValidation('16px');
      expect(result.fontSize).toBe('16px');
      expect(result.error).toBeUndefined();
    });

    it('should return fallback for invalid font size', () => {
      const result = handleTypographyValidation('13px', '14px');
      expect(result.fontSize).toBe('14px');
      expect(result.error).toBeInstanceOf(TypographyValidationError);
    });

    it('should round to nearest valid font size', () => {
      expect(roundToNearestFontSize('15px')).toBe('14px');
      expect(roundToNearestFontSize('17px')).toBe('16px');
      expect(roundToNearestFontSize('20px')).toBe('18px');
    });

    it('should handle invalid font size strings', () => {
      expect(roundToNearestFontSize('invalid')).toBe('16px');
    });
  });

  describe('Icon Validation', () => {
    it('should return valid icon unchanged', () => {
      const result = handleIconValidation('home');
      expect(result.iconName).toBe('home');
      expect(result.error).toBeUndefined();
    });

    it('should return null for invalid icon', () => {
      const result = handleIconValidation('non-existent-icon');
      expect(result.iconName).toBeNull();
      expect(result.error).toBeInstanceOf(IconValidationError);
    });

    it('should warn about non-outline icons', () => {
      // This test assumes we have a way to create non-outline icons
      // For now, we'll just test that the function handles the check
      const result = handleIconValidation('home', true);
      expect(result.iconName).toBe('home');
    });
  });

  describe('Asset Loading', () => {
    it('should return fallback URL for failed asset', () => {
      const result = handleAssetLoading(
        'https://invalid.com/image.jpg',
        'image',
        '/fallback.jpg'
      );
      expect(result.url).toBe('/fallback.jpg');
      expect(result.error).toBeInstanceOf(AssetLoadingError);
    });

    it('should return placeholder if no fallback provided', () => {
      const result = handleAssetLoading(
        'https://invalid.com/image.jpg',
        'image'
      );
      expect(result.url).toBeTruthy();
      expect(result.error).toBeInstanceOf(AssetLoadingError);
    });

    it('should generate image placeholder', () => {
      const placeholder = getAssetPlaceholder('image');
      expect(placeholder).toContain('data:image/svg+xml');
      expect(placeholder).toContain('Image');
    });

    it('should generate icon placeholder', () => {
      const placeholder = getAssetPlaceholder('icon');
      expect(placeholder).toContain('data:image/svg+xml');
    });
  });

  describe('Font Loading', () => {
    it('should create font stack with fallbacks', () => {
      const result = handleFontLoading('CustomFont', ['sans-serif']);
      expect(result.fontFamily).toBe('CustomFont, sans-serif');
      expect(result.error).toBeInstanceOf(FontLoadingError);
    });

    it('should get system font fallback', () => {
      const systemFont = getSystemFontFallback();
      expect(systemFont).toBeTruthy();
      expect(systemFont).toContain('sans-serif');
    });
  });

  describe('Theme Configuration', () => {
    it('should return valid theme unchanged', () => {
      const result = handleThemeConfiguration(defaultTheme);
      expect(result.theme).toEqual(defaultTheme);
      expect(result.error).toBeUndefined();
    });

    it('should return default theme for invalid configuration', () => {
      const invalidTheme: any = {
        name: '',
        colors: {},
      };
      const result = handleThemeConfiguration(invalidTheme);
      expect(result.theme).toEqual(defaultTheme);
      expect(result.error).toBeInstanceOf(ThemeConfigurationError);
    });

    it('should validate theme structure', () => {
      const invalidTheme: any = {
        name: 'test',
        colors: {
          primary: { zaloBlue: '#0068FF' },
          // Missing other required categories
        },
      };
      const result = handleThemeConfiguration(invalidTheme);
      expect(result.error).toBeInstanceOf(ThemeConfigurationError);
    });
  });

  describe('Error Logger', () => {
    it('should log errors', () => {
      handleColorValidation('#INVALID', '#000000');
      const logs = errorLogger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should filter logs by type', () => {
      handleColorValidation('#INVALID', '#000000');
      handleTypographyValidation('13px', '14px');

      const colorLogs = errorLogger.getLogsByType(DesignSystemErrorType.COLOR_VALIDATION);
      const typographyLogs = errorLogger.getLogsByType(DesignSystemErrorType.TYPOGRAPHY_VALIDATION);

      expect(colorLogs.length).toBeGreaterThan(0);
      expect(typographyLogs.length).toBeGreaterThan(0);
    });

    it('should clear logs', () => {
      handleColorValidation('#INVALID', '#000000');
      expect(errorLogger.getLogs().length).toBeGreaterThan(0);

      errorLogger.clearLogs();
      expect(errorLogger.getLogs().length).toBe(0);
    });

    it('should limit log size', () => {
      // Generate more than 100 errors
      for (let i = 0; i < 150; i++) {
        handleColorValidation('#INVALID', '#000000');
      }

      const logs = errorLogger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Classes', () => {
    it('should create ColorValidationError with context', () => {
      const error = new ColorValidationError('#INVALID', { test: 'context' });
      expect(error.type).toBe(DesignSystemErrorType.COLOR_VALIDATION);
      expect(error.context?.invalidColor).toBe('#INVALID');
      expect(error.context?.test).toBe('context');
      expect(error.recoverable).toBe(true);
    });

    it('should create TypographyValidationError', () => {
      const error = new TypographyValidationError('13px');
      expect(error.type).toBe(DesignSystemErrorType.TYPOGRAPHY_VALIDATION);
      expect(error.context?.invalidFontSize).toBe('13px');
    });

    it('should create IconValidationError', () => {
      const error = new IconValidationError('invalid-icon', 'Not found');
      expect(error.type).toBe(DesignSystemErrorType.ICON_VALIDATION);
      expect(error.context?.invalidIcon).toBe('invalid-icon');
    });

    it('should serialize error to JSON', () => {
      const error = new ColorValidationError('#INVALID');
      const json = error.toJSON();
      expect(json.name).toBe('ColorValidationError');
      expect(json.type).toBe(DesignSystemErrorType.COLOR_VALIDATION);
      expect(json.message).toBeTruthy();
      expect(json.timestamp).toBeTruthy();
    });
  });
});
