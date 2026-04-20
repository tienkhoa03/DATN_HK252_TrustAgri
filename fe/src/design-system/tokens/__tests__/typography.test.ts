/**
 * Typography Tokens Unit Tests
 * Requirements: 3.1-3.6, 8.3, 9.1
 */

import {
  typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  typographyTokens,
  validFontSizes,
  MIN_FONT_SIZE,
  getPlatformFontFamily,
  getTypographyToken,
  getFontSizeValue,
  isValidTypographyScale,
  getNearestValidFontSize,
  validateMinimumFontSize,
  createTypographyStyle,
  getResponsiveFontSize,
  loadPlatformFonts,
} from '../typography';

describe('Typography Tokens', () => {
  describe('Font Families', () => {
    test('iOS font family should be San Francisco', () => {
      expect(fontFamily.ios).toBe('-apple-system, San Francisco');
    });

    test('Android font family should be Roboto', () => {
      expect(fontFamily.android).toBe('Roboto, sans-serif');
    });

    test('System font family should include both', () => {
      expect(fontFamily.system).toBe('-apple-system, Roboto, sans-serif');
    });
  });

  describe('Font Sizes', () => {
    test('H1 should be 22px', () => {
      expect(fontSize.h1).toBe('22px');
    });

    test('H2 should be 18px', () => {
      expect(fontSize.h2).toBe('18px');
    });

    test('Body should be 16px', () => {
      expect(fontSize.body).toBe('16px');
    });

    test('Caption should be 14px', () => {
      expect(fontSize.caption).toBe('14px');
    });

    test('Small should be 12px', () => {
      expect(fontSize.small).toBe('12px');
    });

    test('All important text sizes should meet minimum requirement', () => {
      const importantSizes = [fontSize.h1, fontSize.h2, fontSize.body, fontSize.caption];
      importantSizes.forEach((size) => {
        const sizeValue = parseInt(size);
        expect(sizeValue).toBeGreaterThanOrEqual(MIN_FONT_SIZE);
      });
    });
  });

  describe('Font Weights', () => {
    test('Font weights should be defined correctly', () => {
      expect(fontWeight.regular).toBe(400);
      expect(fontWeight.medium).toBe(500);
      expect(fontWeight.semibold).toBe(600);
      expect(fontWeight.bold).toBe(700);
    });
  });

  describe('Line Heights', () => {
    test('Line heights should be defined correctly', () => {
      expect(lineHeight.tight).toBe(1.2);
      expect(lineHeight.normal).toBe(1.5);
      expect(lineHeight.relaxed).toBe(1.75);
    });
  });

  describe('Typography Structure', () => {
    test('Typography object should contain all properties', () => {
      expect(typography).toHaveProperty('fontFamily');
      expect(typography).toHaveProperty('fontSize');
      expect(typography).toHaveProperty('fontWeight');
      expect(typography).toHaveProperty('lineHeight');
    });
  });

  describe('Typography Tokens Metadata', () => {
    test('Typography tokens should have correct structure', () => {
      typographyTokens.forEach((token) => {
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('fontSize');
        expect(token).toHaveProperty('fontWeight');
        expect(token).toHaveProperty('lineHeight');
        expect(token).toHaveProperty('fontFamily');
        expect(token).toHaveProperty('usage');
      });
    });

    test('H1 token should have correct metadata', () => {
      const h1Token = typographyTokens.find((t) => t.name === 'h1');
      expect(h1Token).toBeDefined();
      expect(h1Token?.fontSize).toBe('22px');
      expect(h1Token?.fontWeight).toBe(700);
    });
  });

  describe('Valid Font Sizes', () => {
    test('Valid font sizes should include all defined sizes', () => {
      expect(validFontSizes).toContain('22px');
      expect(validFontSizes).toContain('18px');
      expect(validFontSizes).toContain('16px');
      expect(validFontSizes).toContain('14px');
      expect(validFontSizes).toContain('12px');
    });
  });

  describe('Platform Font Family Detection', () => {
    test('getPlatformFontFamily should return a font family', () => {
      const platformFont = getPlatformFontFamily();
      expect(platformFont).toBeDefined();
      expect(typeof platformFont).toBe('string');
    });
  });

  describe('Minimum Font Size', () => {
    test('Minimum font size should be 14px', () => {
      expect(MIN_FONT_SIZE).toBe(14);
    });
  });
});

describe('Typography Scale Utilities', () => {
  describe('getTypographyToken', () => {
    test('should return correct token for valid name', () => {
      const h1Token = getTypographyToken('h1');
      expect(h1Token).toBeDefined();
      expect(h1Token?.name).toBe('h1');
      expect(h1Token?.fontSize).toBe('22px');
    });

    test('should return undefined for invalid name', () => {
      const invalidToken = getTypographyToken('invalid');
      expect(invalidToken).toBeUndefined();
    });
  });

  describe('getFontSizeValue', () => {
    test('should extract numeric value from font size string', () => {
      expect(getFontSizeValue('22px')).toBe(22);
      expect(getFontSizeValue('16px')).toBe(16);
      expect(getFontSizeValue('14px')).toBe(14);
    });
  });

  describe('isValidTypographyScale', () => {
    test('should return true for valid font sizes', () => {
      expect(isValidTypographyScale('22px')).toBe(true);
      expect(isValidTypographyScale('18px')).toBe(true);
      expect(isValidTypographyScale('16px')).toBe(true);
      expect(isValidTypographyScale('14px')).toBe(true);
      expect(isValidTypographyScale('12px')).toBe(true);
    });

    test('should return false for invalid font sizes', () => {
      expect(isValidTypographyScale('20px')).toBe(false);
      expect(isValidTypographyScale('15px')).toBe(false);
      expect(isValidTypographyScale('10px')).toBe(false);
    });
  });

  describe('getNearestValidFontSize', () => {
    test('should return nearest valid font size', () => {
      expect(getNearestValidFontSize('20px')).toBe('22px');
      expect(getNearestValidFontSize('15px')).toBe('16px');
      expect(getNearestValidFontSize('13px')).toBe('14px');
    });

    test('should return same size if already valid', () => {
      expect(getNearestValidFontSize('22px')).toBe('22px');
      expect(getNearestValidFontSize('16px')).toBe('16px');
    });
  });

  describe('validateMinimumFontSize', () => {
    test('should validate important text meets minimum size', () => {
      const result1 = validateMinimumFontSize('16px', true);
      expect(result1.valid).toBe(true);

      const result2 = validateMinimumFontSize('14px', true);
      expect(result2.valid).toBe(true);

      const result3 = validateMinimumFontSize('12px', true);
      expect(result3.valid).toBe(false);
      expect(result3.error).toContain('below minimum');
    });

    test('should allow any size for non-important text', () => {
      const result = validateMinimumFontSize('12px', false);
      expect(result.valid).toBe(true);
    });
  });

  describe('createTypographyStyle', () => {
    test('should create style object for valid variant', () => {
      const style = createTypographyStyle('h1');
      expect(style).toHaveProperty('fontSize');
      expect(style).toHaveProperty('fontWeight');
      expect(style).toHaveProperty('lineHeight');
      expect(style).toHaveProperty('fontFamily');
    });

    test('should apply overrides', () => {
      const style = createTypographyStyle('body', { fontWeight: 700 });
      expect(style.fontWeight).toBe(700);
    });

    test('should throw error for invalid variant', () => {
      expect(() => createTypographyStyle('invalid' as any)).toThrow();
    });
  });

  describe('getResponsiveFontSize', () => {
    test('should scale down for small screens', () => {
      const result = getResponsiveFontSize('16px', 320);
      const value = getFontSizeValue(result);
      expect(value).toBeLessThan(16);
      expect(value).toBeGreaterThanOrEqual(14); // Should not go below minimum
    });

    test('should keep same size for normal screens', () => {
      expect(getResponsiveFontSize('16px', 375)).toBe('16px');
      expect(getResponsiveFontSize('16px', 414)).toBe('16px');
    });

    test('should scale up slightly for large screens', () => {
      const result = getResponsiveFontSize('16px', 450);
      const value = getFontSizeValue(result);
      expect(value).toBeGreaterThan(16);
    });
  });

  describe('loadPlatformFonts', () => {
    test('should execute without errors', () => {
      expect(() => loadPlatformFonts()).not.toThrow();
    });
  });
});
