/**
 * Color Tokens Unit Tests
 * Requirements: 2.1-2.6, 8.2
 */

import {
  colors,
  primaryColors,
  functionalColors,
  semanticColors,
  textColors,
  backgroundColors,
  validColorValues,
  colorTokens,
  hexToRgb,
  hexToRgbString,
  toCssVariables,
  toJson,
  toTailwindConfig,
  getDefaultColorFallback,
  getValidatedColor,
  getSemanticColor,
  getStatusColor,
} from '../colors';

describe('Color Tokens', () => {
  describe('Primary Colors', () => {
    test('Zalo Blue should be #0068FF', () => {
      expect(primaryColors.zaloBlue).toBe('#0068FF');
    });

    test('Agri Green should be #3EBB6C', () => {
      expect(primaryColors.agriGreen).toBe('#3EBB6C');
    });
  });

  describe('Functional Colors', () => {
    test('Alert Red should be #F50000', () => {
      expect(functionalColors.alertRed).toBe('#F50000');
    });

    test('Warning Yellow should be #FFCC00', () => {
      expect(functionalColors.warningYellow).toBe('#FFCC00');
    });

    test('Neutral Gray should be #F7F7F8', () => {
      expect(functionalColors.neutralGray).toBe('#F7F7F8');
    });
  });

  describe('Semantic Colors', () => {
    test('Success should match Agri Green', () => {
      expect(semanticColors.success).toBe('#3EBB6C');
      expect(semanticColors.success).toBe(primaryColors.agriGreen);
    });

    test('Error should match Alert Red', () => {
      expect(semanticColors.error).toBe('#F50000');
      expect(semanticColors.error).toBe(functionalColors.alertRed);
    });

    test('Warning should match Warning Yellow', () => {
      expect(semanticColors.warning).toBe('#FFCC00');
      expect(semanticColors.warning).toBe(functionalColors.warningYellow);
    });

    test('Info should match Zalo Blue', () => {
      expect(semanticColors.info).toBe('#0068FF');
      expect(semanticColors.info).toBe(primaryColors.zaloBlue);
    });
  });

  describe('Text Colors', () => {
    test('Primary text should be black', () => {
      expect(textColors.primary).toBe('#000000');
    });

    test('Secondary text should be gray', () => {
      expect(textColors.secondary).toBe('#666666');
    });

    test('Disabled text should be light gray', () => {
      expect(textColors.disabled).toBe('#CCCCCC');
    });

    test('Inverse text should be white', () => {
      expect(textColors.inverse).toBe('#FFFFFF');
    });
  });

  describe('Background Colors', () => {
    test('Primary background should be white', () => {
      expect(backgroundColors.primary).toBe('#FFFFFF');
    });

    test('Secondary background should be neutral gray', () => {
      expect(backgroundColors.secondary).toBe('#F7F7F8');
    });

    test('Tertiary background should be light gray', () => {
      expect(backgroundColors.tertiary).toBe('#F0F0F0');
    });
  });

  describe('Color Palette Structure', () => {
    test('Colors object should contain all categories', () => {
      expect(colors).toHaveProperty('primary');
      expect(colors).toHaveProperty('functional');
      expect(colors).toHaveProperty('semantic');
      expect(colors).toHaveProperty('text');
      expect(colors).toHaveProperty('background');
    });

    test('Valid color values should include all defined colors', () => {
      expect(validColorValues).toContain('#0068FF');
      expect(validColorValues).toContain('#3EBB6C');
      expect(validColorValues).toContain('#F50000');
      expect(validColorValues).toContain('#FFCC00');
      expect(validColorValues).toContain('#F7F7F8');
    });
  });

  describe('Color Tokens Metadata', () => {
    test('Color tokens should have correct structure', () => {
      colorTokens.forEach((token) => {
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('value');
        expect(token).toHaveProperty('usage');
        expect(token).toHaveProperty('category');
      });
    });

    test('Zalo Blue token should have correct metadata', () => {
      const zaloBlueToken = colorTokens.find((t) => t.name === 'zaloBlue');
      expect(zaloBlueToken).toBeDefined();
      expect(zaloBlueToken?.value).toBe('#0068FF');
      expect(zaloBlueToken?.category).toBe('primary');
    });
  });

  describe('Color Conversion Utilities', () => {
    test('hexToRgb should convert hex to RGB object', () => {
      const rgb = hexToRgb('#0068FF');
      expect(rgb).toEqual({ r: 0, g: 104, b: 255 });
    });

    test('hexToRgb should handle hex without #', () => {
      const rgb = hexToRgb('0068FF');
      expect(rgb).toEqual({ r: 0, g: 104, b: 255 });
    });

    test('hexToRgb should return null for invalid hex', () => {
      const rgb = hexToRgb('invalid');
      expect(rgb).toBeNull();
    });

    test('hexToRgbString should convert hex to RGB string', () => {
      const rgbString = hexToRgbString('#0068FF');
      expect(rgbString).toBe('rgb(0, 104, 255)');
    });

    test('hexToRgbString should return original for invalid hex', () => {
      const rgbString = hexToRgbString('invalid');
      expect(rgbString).toBe('invalid');
    });
  });

  describe('Color Export Utilities', () => {
    test('toCssVariables should generate CSS custom properties', () => {
      const css = toCssVariables();
      expect(css).toContain(':root {');
      expect(css).toContain('--color-primary-zaloBlue: #0068FF;');
      expect(css).toContain('--color-primary-agriGreen: #3EBB6C;');
      expect(css).toContain('--color-functional-alertRed: #F50000;');
      expect(css).toContain('}');
    });

    test('toJson should generate valid JSON', () => {
      const json = toJson();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('primary');
      expect(parsed).toHaveProperty('functional');
      expect(parsed).toHaveProperty('semantic');
      expect(parsed.primary.zaloBlue).toBe('#0068FF');
    });

    test('toTailwindConfig should generate Tailwind config object', () => {
      const config = toTailwindConfig();
      expect(config).toHaveProperty('primary');
      expect(config.primary['zalo-blue']).toBe('#0068FF');
      expect(config.primary['agri-green']).toBe('#3EBB6C');
    });
  });

  describe('Color Validation Utilities', () => {
    test('getValidatedColor should return color if valid', () => {
      expect(getValidatedColor('#0068FF')).toBe('#0068FF');
      expect(getValidatedColor('#3EBB6C')).toBe('#3EBB6C');
    });

    test('getValidatedColor should throw error for invalid color', () => {
      expect(() => getValidatedColor('#INVALID')).toThrow(
        'Invalid color: #INVALID. Must use colors from the defined palette.'
      );
    });

    test('getDefaultColorFallback should return a valid color', () => {
      const nearestColor = getDefaultColorFallback('#INVALID');
      expect(validColorValues).toContain(nearestColor);
    });
  });

  describe('Semantic Color Utilities', () => {
    test('getSemanticColor should return correct color for success', () => {
      expect(getSemanticColor('success')).toBe('#3EBB6C');
    });

    test('getSemanticColor should return correct color for error', () => {
      expect(getSemanticColor('error')).toBe('#F50000');
    });

    test('getSemanticColor should return correct color for warning', () => {
      expect(getSemanticColor('warning')).toBe('#FFCC00');
    });

    test('getSemanticColor should return correct color for info', () => {
      expect(getSemanticColor('info')).toBe('#0068FF');
    });
  });

  describe('Status Color Utilities', () => {
    test('getStatusColor should return success color for normal status', () => {
      expect(getStatusColor('normal')).toBe('#3EBB6C');
    });

    test('getStatusColor should return warning color for warning status', () => {
      expect(getStatusColor('warning')).toBe('#FFCC00');
    });

    test('getStatusColor should return error color for danger status', () => {
      expect(getStatusColor('danger')).toBe('#F50000');
    });
  });
});
