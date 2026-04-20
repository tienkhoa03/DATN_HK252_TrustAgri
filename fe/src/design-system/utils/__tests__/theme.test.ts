/**
 * Theme Utilities Tests
 * Tests for theme configuration and validation
 * 
 * Requirements: 1.1, 3.1, 3.2, 8.1-8.5
 */

import {
  getPlatform,
  getPlatformTheme,
  validateTheme,
  validateComponentTheme,
  createTheme,
  mergeThemes,
  extendColorPalette,
  exportThemeAsCss,
  exportThemeAsJson,
  defaultTheme,
  ThemeConfig,
  ComponentTheme,
} from '../theme';
import { colors } from '../../tokens/colors';

describe('Theme Utilities', () => {
  describe('getPlatform', () => {
    it('should detect iOS platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });
      
      expect(getPlatform()).toBe('ios');
    });

    it('should detect iPad as iOS platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
      });
      
      expect(getPlatform()).toBe('ios');
    });

    it('should detect Android platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      });
      
      expect(getPlatform()).toBe('android');
    });

    it('should return unknown for unrecognized platforms', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });
      
      expect(getPlatform()).toBe('unknown');
    });
  });

  describe('getPlatformTheme', () => {
    it('should return iOS theme for iOS platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });
      
      const theme = getPlatformTheme();
      expect(theme.typography.fontFamily.system).toContain('San Francisco');
    });

    it('should return Android theme for Android platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      });
      
      const theme = getPlatformTheme();
      expect(theme.typography.fontFamily.system).toContain('Roboto');
    });

    it('should return default theme for unknown platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });
      
      const theme = getPlatformTheme();
      expect(theme).toEqual(defaultTheme);
    });
  });

  describe('validateTheme', () => {
    it('should validate default theme successfully', () => {
      const validation = validateTheme(defaultTheme);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toBeUndefined();
    });

    it('should fail validation for theme without name', () => {
      const invalidTheme = {
        ...defaultTheme,
        name: '',
      };
      
      const validation = validateTheme(invalidTheme);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Theme name is required');
    });

    it('should fail validation for theme without colors', () => {
      const invalidTheme = {
        ...defaultTheme,
        colors: undefined as any,
      };
      
      const validation = validateTheme(invalidTheme);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Theme colors are required');
    });

    it('should fail validation for theme without primary colors', () => {
      const invalidTheme = {
        ...defaultTheme,
        colors: {
          ...defaultTheme.colors,
          primary: undefined as any,
        },
      };
      
      const validation = validateTheme(invalidTheme);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Primary colors are required');
    });

    it('should fail validation for invalid hex color', () => {
      const invalidTheme = {
        ...defaultTheme,
        colors: {
          ...defaultTheme.colors,
          primary: {
            zaloBlue: 'invalid-color',
            agriGreen: '#3EBB6C',
          } as any,
        },
      };
      
      const validation = validateTheme(invalidTheme);
      expect(validation.valid).toBe(false);
      expect(validation.errors?.some(e => e.includes('Invalid color value'))).toBe(true);
    });

    it('should fail validation for theme without typography', () => {
      const invalidTheme = {
        ...defaultTheme,
        typography: undefined as any,
      };
      
      const validation = validateTheme(invalidTheme);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Theme typography is required');
    });

    it('should fail validation for theme without spacing', () => {
      const invalidTheme = {
        ...defaultTheme,
        spacing: undefined as any,
      };
      
      const validation = validateTheme(invalidTheme);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Theme spacing is required');
    });

    it('should provide warnings for missing optional fields', () => {
      const themeWithoutIcons = {
        ...defaultTheme,
        icons: {
          navigation: undefined as any,
          agriculture: undefined as any,
          actions: {} as any,
          sizes: {} as any,
        },
      };
      
      const validation = validateTheme(themeWithoutIcons);
      expect(validation.warnings).toBeDefined();
      expect(validation.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('validateComponentTheme', () => {
    it('should validate valid component theme', () => {
      const componentTheme: ComponentTheme = {
        componentName: 'Button',
        defaultProps: { variant: 'primary' },
        styleOverrides: { padding: '10px' },
      };
      
      const validation = validateComponentTheme(componentTheme);
      expect(validation.valid).toBe(true);
    });

    it('should fail validation for component theme without name', () => {
      const componentTheme: ComponentTheme = {
        componentName: '',
        defaultProps: {},
        styleOverrides: {},
      };
      
      const validation = validateComponentTheme(componentTheme);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Component name is required');
    });

    it('should provide warnings for missing recommended fields', () => {
      const componentTheme: ComponentTheme = {
        componentName: 'Button',
        defaultProps: undefined as any,
        styleOverrides: undefined as any,
      };
      
      const validation = validateComponentTheme(componentTheme);
      expect(validation.warnings).toBeDefined();
      expect(validation.warnings?.length).toBeGreaterThan(0);
    });
  });

  describe('createTheme', () => {
    it('should create theme with default values', () => {
      const theme = createTheme();
      expect(theme).toEqual(defaultTheme);
    });

    it('should create theme with custom name', () => {
      const theme = createTheme({ name: 'custom-theme' });
      expect(theme.name).toBe('custom-theme');
      expect(theme.colors).toEqual(defaultTheme.colors);
    });

    it('should create theme with custom colors', () => {
      const customColors = {
        ...defaultTheme.colors,
        primary: {
          ...defaultTheme.colors.primary,
          zaloBlue: '#FF0000',
        } as any,
      };
      
      const theme = createTheme({ colors: customColors as any });
      expect(theme.colors.primary.zaloBlue).toBe('#FF0000');
    });

    it('should throw error for invalid theme', () => {
      expect(() => {
        createTheme({
          name: '',
        });
      }).toThrow('Invalid theme configuration');
    });

    it('should log warnings for theme with warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const theme = createTheme({
        icons: {
          navigation: undefined as any,
          agriculture: undefined as any,
          actions: {} as any,
          sizes: {} as any,
        } as any,
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('mergeThemes', () => {
    it('should merge two themes', () => {
      const baseTheme = defaultTheme;
      const overrideTheme = {
        name: 'merged-theme',
      };
      
      const merged = mergeThemes(baseTheme, overrideTheme);
      expect(merged.name).toBe('merged-theme');
      expect(merged.colors).toEqual(baseTheme.colors);
    });

    it('should override colors in merged theme', () => {
      const baseTheme = defaultTheme;
      const overrideTheme = {
        colors: {
          ...defaultTheme.colors,
          primary: {
            ...defaultTheme.colors.primary,
            zaloBlue: '#FF0000',
          } as any,
        } as any,
      };
      
      const merged = mergeThemes(baseTheme, overrideTheme);
      expect(merged.colors.primary.zaloBlue).toBe('#FF0000');
    });

    it('should maintain backward compatibility', () => {
      const baseTheme = defaultTheme;
      const overrideTheme = {
        name: 'new-theme',
      };
      
      const merged = mergeThemes(baseTheme, overrideTheme);
      
      // All original properties should still exist
      expect(merged.colors).toBeDefined();
      expect(merged.typography).toBeDefined();
      expect(merged.spacing).toBeDefined();
      expect(merged.icons).toBeDefined();
    });
  });

  describe('extendColorPalette', () => {
    it('should extend color palette with new colors', () => {
      const extended = extendColorPalette(
        colors,
        { customBlue: '#1E90FF' },
        'functional'
      );
      
      expect(extended.functional).toHaveProperty('customBlue');
      expect((extended.functional as any).customBlue).toBe('#1E90FF');
    });

    it('should maintain existing colors', () => {
      const extended = extendColorPalette(
        colors,
        { customBlue: '#1E90FF' },
        'functional'
      );
      
      expect(extended.functional.alertRed).toBe(colors.functional.alertRed);
      expect(extended.functional.warningYellow).toBe(colors.functional.warningYellow);
    });

    it('should throw error for invalid hex color', () => {
      expect(() => {
        extendColorPalette(
          colors,
          { invalidColor: 'not-a-hex' },
          'functional'
        );
      }).toThrow('Invalid color value');
    });

    it('should extend different color categories', () => {
      const extendedPrimary = extendColorPalette(
        colors,
        { customPrimary: '#FF0000' },
        'primary'
      );
      
      expect((extendedPrimary.primary as any).customPrimary).toBe('#FF0000');
      
      const extendedSemantic = extendColorPalette(
        colors,
        { customSemantic: '#00FF00' },
        'semantic'
      );
      
      expect((extendedSemantic.semantic as any).customSemantic).toBe('#00FF00');
    });
  });

  describe('exportThemeAsCss', () => {
    it('should export theme as CSS variables', () => {
      const css = exportThemeAsCss(defaultTheme);
      
      expect(css).toContain(':root {');
      expect(css).toContain('--color-primary-zaloBlue: #0068FF;');
      expect(css).toContain('--color-primary-agriGreen: #3EBB6C;');
      expect(css).toContain('--font-size-h1: 22px;');
      expect(css).toContain('--spacing-md: 16px;');
      expect(css).toContain('}');
    });

    it('should include all color categories', () => {
      const css = exportThemeAsCss(defaultTheme);
      
      expect(css).toContain('--color-primary-');
      expect(css).toContain('--color-functional-');
      expect(css).toContain('--color-semantic-');
      expect(css).toContain('--color-text-');
      expect(css).toContain('--color-background-');
    });

    it('should include typography variables', () => {
      const css = exportThemeAsCss(defaultTheme);
      
      expect(css).toContain('--font-size-');
      expect(css).toContain('--font-weight-');
      expect(css).toContain('--line-height-');
      expect(css).toContain('--font-family-system:');
    });

    it('should include spacing variables', () => {
      const css = exportThemeAsCss(defaultTheme);
      
      expect(css).toContain('--spacing-xs:');
      expect(css).toContain('--spacing-sm:');
      expect(css).toContain('--spacing-md:');
      expect(css).toContain('--spacing-lg:');
      expect(css).toContain('--spacing-xl:');
      expect(css).toContain('--spacing-xxl:');
    });
  });

  describe('exportThemeAsJson', () => {
    it('should export theme as JSON string', () => {
      const json = exportThemeAsJson(defaultTheme);
      const parsed = JSON.parse(json);
      
      expect(parsed.name).toBe(defaultTheme.name);
      expect(parsed.colors).toBeDefined();
      expect(parsed.typography).toBeDefined();
      expect(parsed.spacing).toBeDefined();
      expect(parsed.icons).toBeDefined();
    });

    it('should be valid JSON', () => {
      const json = exportThemeAsJson(defaultTheme);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should preserve all theme properties', () => {
      const json = exportThemeAsJson(defaultTheme);
      const parsed = JSON.parse(json);
      
      expect(parsed.colors.primary.zaloBlue).toBe('#0068FF');
      expect(parsed.typography.fontSize.h1).toBe('22px');
      expect(parsed.spacing.md).toBe('16px');
    });
  });
});
