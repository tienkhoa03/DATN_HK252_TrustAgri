/**
 * Validators Unit Tests
 * Requirements: 8.1-8.5, 10.1-10.5
 */

import {
  isValidColor,
  isValidHexColor,
  isValidRgbColor,
  isValidRgbaColor,
  getColorValidationError,
  validateColorContrast,
  isValidFontSize,
  meetsMinimumFontSize,
  isValidFontWeight,
  isValidLineHeight,
  validateTypography,
  isOutlineIconStyle,
  isValidIcon,
  isValidIconSize,
  validateIcon,
  meetsMinimumTouchTarget,
  validateTouchTarget,
  validateAccessibility,
  isValidSpacing,
  validateSpacing,
  validateComponent,
  validateComponentDetailed,
  isComponentCompliant,
  getComplianceReport,
  validateComponents,
  complianceRules,
} from '../validators';

describe('Design System Validators', () => {
  describe('Color Validation', () => {
    test('should validate colors from the palette', () => {
      expect(isValidColor('#0068FF')).toBe(true);
      expect(isValidColor('#3EBB6C')).toBe(true);
      expect(isValidColor('#F50000')).toBe(true);
      expect(isValidColor('#FFCC00')).toBe(true);
    });

    test('should reject colors not in the palette', () => {
      expect(isValidColor('#FF0000')).toBe(false);
      expect(isValidColor('#00FF00')).toBe(false);
      expect(isValidColor('#123456')).toBe(false);
    });

    test('should be case-insensitive', () => {
      expect(isValidColor('#0068ff')).toBe(true);
      expect(isValidColor('#0068FF')).toBe(true);
    });

    test('isValidHexColor should validate hex format', () => {
      expect(isValidHexColor('#0068FF')).toBe(true);
      expect(isValidHexColor('0068FF')).toBe(true);
      expect(isValidHexColor('#FFF')).toBe(true);
      expect(isValidHexColor('FFF')).toBe(true);
      expect(isValidHexColor('#GGGGGG')).toBe(false);
      expect(isValidHexColor('invalid')).toBe(false);
    });

    test('isValidRgbColor should validate RGB format', () => {
      expect(isValidRgbColor('rgb(0, 104, 255)')).toBe(true);
      expect(isValidRgbColor('rgb(255, 255, 255)')).toBe(true);
      expect(isValidRgbColor('rgb(0,0,0)')).toBe(true);
      expect(isValidRgbColor('rgba(0, 0, 0, 0.5)')).toBe(false);
      expect(isValidRgbColor('#0068FF')).toBe(false);
    });

    test('getColorValidationError should return appropriate error message', () => {
      const hexError = getColorValidationError('#123456');
      expect(hexError).toContain('Invalid color: #123456');
      expect(hexError).toContain('Must use colors from the defined palette');

      const invalidError = getColorValidationError('invalid');
      expect(invalidError).toContain('Invalid color format');
    });
  });

  describe('Font Size Validation', () => {
    test('should validate font sizes from the typography scale', () => {
      expect(isValidFontSize('22px')).toBe(true);
      expect(isValidFontSize('18px')).toBe(true);
      expect(isValidFontSize('16px')).toBe(true);
      expect(isValidFontSize('14px')).toBe(true);
      expect(isValidFontSize('12px')).toBe(true);
    });

    test('should reject font sizes not in the scale', () => {
      expect(isValidFontSize('20px')).toBe(false);
      expect(isValidFontSize('15px')).toBe(false);
      expect(isValidFontSize('10px')).toBe(false);
    });
  });

  describe('Minimum Font Size Validation', () => {
    test('should accept font sizes >= 14px', () => {
      expect(meetsMinimumFontSize('14px')).toBe(true);
      expect(meetsMinimumFontSize('16px')).toBe(true);
      expect(meetsMinimumFontSize('18px')).toBe(true);
      expect(meetsMinimumFontSize('22px')).toBe(true);
    });

    test('should reject font sizes < 14px', () => {
      expect(meetsMinimumFontSize('12px')).toBe(false);
      expect(meetsMinimumFontSize('10px')).toBe(false);
      expect(meetsMinimumFontSize('8px')).toBe(false);
    });
  });

  describe('Touch Target Validation', () => {
    test('should accept touch targets >= 44x44px', () => {
      expect(meetsMinimumTouchTarget(44, 44)).toBe(true);
      expect(meetsMinimumTouchTarget(48, 48)).toBe(true);
      expect(meetsMinimumTouchTarget(50, 50)).toBe(true);
    });

    test('should reject touch targets < 44x44px', () => {
      expect(meetsMinimumTouchTarget(40, 40)).toBe(false);
      expect(meetsMinimumTouchTarget(44, 40)).toBe(false);
      expect(meetsMinimumTouchTarget(40, 44)).toBe(false);
    });
  });

  describe('Component Validation', () => {
    test('should validate component with valid properties', () => {
      const validComponent = {
        color: '#0068FF',
        fontSize: '16px',
        width: 48,
        height: 48,
      };

      const result = validateComponent(validComponent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid color', () => {
      const invalidComponent = {
        color: '#FF0000',
      };

      const result = validateComponent(invalidComponent);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('color-palette');
    });

    test('should detect font size below minimum', () => {
      const invalidComponent = {
        fontSize: '12px',
      };

      const result = validateComponent(invalidComponent);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('min-font-size');
    });

    test('should detect touch target below minimum', () => {
      const invalidComponent = {
        width: 40,
        height: 40,
        isInteractive: true,
      };

      const result = validateComponent(invalidComponent);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('touch-target');
    });
  });

  describe('Compliance Rules', () => {
    test('should have all required compliance rules', () => {
      const ruleNames = complianceRules.map((rule) => rule.rule);
      expect(ruleNames).toContain('min-font-size');
      expect(ruleNames).toContain('color-palette');
      expect(ruleNames).toContain('touch-target');
      expect(ruleNames).toContain('icon-style');
    });

    test('each rule should have required properties', () => {
      complianceRules.forEach((rule) => {
        expect(rule).toHaveProperty('rule');
        expect(rule).toHaveProperty('category');
        expect(rule).toHaveProperty('severity');
        expect(rule).toHaveProperty('validator');
        expect(rule).toHaveProperty('message');
      });
    });
  });

  describe('RGBA Color Validation', () => {
    test('should validate RGBA format', () => {
      expect(isValidRgbaColor('rgba(0, 104, 255, 1)')).toBe(true);
      expect(isValidRgbaColor('rgba(255, 255, 255, 0.5)')).toBe(true);
      expect(isValidRgbaColor('rgba(0, 0, 0, 0)')).toBe(true);
      expect(isValidRgbaColor('rgba(0,0,0,0.75)')).toBe(true);
    });

    test('should reject invalid RGBA format', () => {
      expect(isValidRgbaColor('rgb(0, 0, 0)')).toBe(false);
      expect(isValidRgbaColor('rgba(0, 0, 0, 2)')).toBe(false);
      expect(isValidRgbaColor('#0068FF')).toBe(false);
    });
  });

  describe('Color Contrast Validation', () => {
    test('should validate color contrast for AA level', () => {
      // Black on white has high contrast
      const result1 = validateColorContrast('#000000', '#FFFFFF', 'AA');
      expect(result1.valid).toBe(true);
      expect(result1.ratio).toBeGreaterThan(4.5);

      // Zalo Blue on white
      const result2 = validateColorContrast('#0068FF', '#FFFFFF', 'AA');
      expect(result2.valid).toBe(true);
    });

    test('should validate color contrast for AAA level', () => {
      const result = validateColorContrast('#000000', '#FFFFFF', 'AAA');
      expect(result.valid).toBe(true);
      expect(result.ratio).toBeGreaterThan(7);
    });

    test('should detect insufficient contrast', () => {
      // Light gray on white has low contrast
      const result = validateColorContrast('#F7F7F8', '#FFFFFF', 'AA');
      expect(result.valid).toBe(false);
    });
  });

  describe('Typography Validation', () => {
    test('should validate font weight', () => {
      expect(isValidFontWeight(400)).toBe(true);
      expect(isValidFontWeight(700)).toBe(true);
      expect(isValidFontWeight(900)).toBe(true);
      expect(isValidFontWeight(350)).toBe(false);
      expect(isValidFontWeight(1000)).toBe(false);
    });

    test('should validate line height', () => {
      expect(isValidLineHeight(1.2)).toBe(true);
      expect(isValidLineHeight(1.5)).toBe(true);
      expect(isValidLineHeight(2.0)).toBe(true);
      expect(isValidLineHeight(0.5)).toBe(false);
      expect(isValidLineHeight(4.0)).toBe(false);
    });

    test('should validate complete typography configuration', () => {
      const validConfig = {
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.5,
      };
      const result = validateTypography(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid typography configuration', () => {
      const invalidConfig = {
        fontSize: '15px',
        fontWeight: 350,
        lineHeight: 5,
      };
      const result = validateTypography(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Icon Validation', () => {
    test('should validate icon existence', () => {
      expect(isValidIcon('home')).toBe(true);
      expect(isValidIcon('temperature')).toBe(true);
      expect(isValidIcon('nonexistent')).toBe(false);
    });

    test('should validate icon size', () => {
      expect(isValidIconSize('16px')).toBe(true);
      expect(isValidIconSize('24px')).toBe(true);
      expect(isValidIconSize('32px')).toBe(true);
      expect(isValidIconSize('20px')).toBe(false);
    });

    test('should validate complete icon configuration', () => {
      const validConfig = {
        name: 'home',
        size: '24px',
        requireOutline: true,
      };
      const result = validateIcon(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid icon configuration', () => {
      const invalidConfig = {
        name: 'nonexistent',
        size: '20px',
      };
      const result = validateIcon(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Touch Target Validation', () => {
    test('should provide detailed feedback for invalid touch targets', () => {
      const result = validateTouchTarget(40, 40);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion).toContain('4px');
    });

    test('should validate valid touch targets', () => {
      const result = validateTouchTarget(48, 48);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Accessibility Validation', () => {
    test('should validate interactive elements', () => {
      const validConfig = {
        width: 48,
        height: 48,
        ariaLabel: 'Click me',
        isInteractive: true,
      };
      const result = validateAccessibility(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should warn about missing aria-label', () => {
      const config = {
        width: 48,
        height: 48,
        isInteractive: true,
      };
      const result = validateAccessibility(config);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('aria-label');
    });

    test('should detect touch target issues', () => {
      const config = {
        width: 40,
        height: 40,
        isInteractive: true,
      };
      const result = validateAccessibility(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Spacing Validation', () => {
    test('should validate spacing from scale', () => {
      expect(isValidSpacing('4px')).toBe(true);
      expect(isValidSpacing('8px')).toBe(true);
      expect(isValidSpacing('16px')).toBe(true);
      expect(isValidSpacing('24px')).toBe(true);
      expect(isValidSpacing('32px')).toBe(true);
      expect(isValidSpacing('48px')).toBe(true);
    });

    test('should reject spacing not in scale', () => {
      expect(isValidSpacing('10px')).toBe(false);
      expect(isValidSpacing('20px')).toBe(false);
      expect(isValidSpacing('15px')).toBe(false);
    });

    test('should validate spacing configuration', () => {
      const validConfig = { value: '16px' };
      const result = validateSpacing(validConfig);
      expect(result.valid).toBe(true);

      const invalidConfig = { value: '15px' };
      const result2 = validateSpacing(invalidConfig);
      expect(result2.valid).toBe(false);
      expect(result2.error).toBeDefined();
    });
  });

  describe('Component Detailed Validation', () => {
    test('should provide detailed validation results', () => {
      const component = {
        color: '#0068FF',
        fontSize: '16px',
        iconName: 'home',
        width: 48,
        height: 48,
        isInteractive: true,
        ariaLabel: 'Home',
      };
      const result = validateComponentDetailed(component);
      expect(result.overall.valid).toBe(true);
      expect(result.color).toBeDefined();
      expect(result.typography).toBeDefined();
      expect(result.icon).toBeDefined();
      expect(result.accessibility).toBeDefined();
    });

    test('should detect multiple validation issues', () => {
      const component = {
        color: '#FF0000',
        fontSize: '10px',
        iconName: 'nonexistent',
        width: 30,
        height: 30,
        isInteractive: true,
      };
      const result = validateComponentDetailed(component);
      expect(result.overall.valid).toBe(false);
      expect(result.color?.valid).toBe(false);
      expect(result.typography?.valid).toBe(false);
      expect(result.icon?.valid).toBe(false);
      expect(result.accessibility?.valid).toBe(false);
    });
  });

  describe('Component Compliance', () => {
    test('should check if component is compliant', () => {
      const compliantComponent = {
        color: '#0068FF',
        fontSize: '16px',
        width: 48,
        height: 48,
      };
      expect(isComponentCompliant(compliantComponent)).toBe(true);

      const nonCompliantComponent = {
        color: '#FF0000',
        fontSize: '10px',
      };
      expect(isComponentCompliant(nonCompliantComponent)).toBe(false);
    });

    test('should generate compliance report', () => {
      const component = {
        componentName: 'TestButton',
        color: '#FF0000',
        fontSize: '10px',
      };
      const report = getComplianceReport(component);
      expect(report).toContain('TestButton');
      expect(report).toContain('compliance issues');
      expect(report).toContain('Errors:');
    });
  });

  describe('Batch Component Validation', () => {
    test('should validate multiple components', () => {
      const components = [
        { color: '#0068FF', fontSize: '16px' },
        { color: '#3EBB6C', fontSize: '18px' },
        { color: '#FF0000', fontSize: '10px' },
      ];
      const result = validateComponents(components);
      expect(result.allValid).toBe(false);
      expect(result.summary.total).toBe(3);
      expect(result.summary.valid).toBe(2);
      expect(result.summary.invalid).toBe(1);
    });

    test('should handle empty component list', () => {
      const result = validateComponents([]);
      expect(result.allValid).toBe(true);
      expect(result.summary.total).toBe(0);
    });
  });
});
