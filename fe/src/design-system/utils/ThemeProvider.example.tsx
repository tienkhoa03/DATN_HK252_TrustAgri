/**
 * ThemeProvider Usage Examples
 * Demonstrates how to use the theme system
 */

import React from 'react';
import { ThemeProvider, useTheme, useThemeColors, usePlatform } from './ThemeProvider';
import { createTheme, extendColorPalette } from './theme';
import { colors } from '../tokens/colors';

/**
 * Example 1: Basic ThemeProvider usage
 */
export const BasicThemeExample: React.FC = () => {
  return (
    <ThemeProvider>
      <div>
        <h1>App with Default Theme</h1>
        <ThemedComponent />
      </div>
    </ThemeProvider>
  );
};

/**
 * Example 2: Custom theme
 */
export const CustomThemeExample: React.FC = () => {
  const customTheme = createTheme({
    name: 'custom-theme',
  });

  return (
    <ThemeProvider theme={customTheme}>
      <div>
        <h1>App with Custom Theme</h1>
        <ThemedComponent />
      </div>
    </ThemeProvider>
  );
};

/**
 * Example 3: Extended color palette
 */
export const ExtendedColorExample: React.FC = () => {
  const extendedColors = extendColorPalette(
    colors,
    {
      customBlue: '#1E90FF',
      customGreen: '#32CD32',
    },
    'functional'
  );

  const customTheme = createTheme({
    name: 'extended-color-theme',
    colors: extendedColors,
  });

  return (
    <ThemeProvider theme={customTheme}>
      <div>
        <h1>App with Extended Colors</h1>
        <ThemedComponent />
      </div>
    </ThemeProvider>
  );
};

/**
 * Example 4: Platform detection disabled
 */
export const NoPlatformDetectionExample: React.FC = () => {
  return (
    <ThemeProvider enablePlatformDetection={false}>
      <div>
        <h1>App without Platform Detection</h1>
        <ThemedComponent />
      </div>
    </ThemeProvider>
  );
};

/**
 * Example component using theme hooks
 */
const ThemedComponent: React.FC = () => {
  const { theme, platform } = useTheme();
  const colors = useThemeColors();
  const detectedPlatform = usePlatform();

  return (
    <div style={{ padding: '20px' }}>
      <h2>Theme Information</h2>
      <p>Theme Name: {theme.name}</p>
      <p>Platform: {platform}</p>
      <p>Detected Platform: {detectedPlatform}</p>
      
      <h3>Colors</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <ColorSwatch color={colors.primary.zaloBlue} name="Zalo Blue" />
        <ColorSwatch color={colors.primary.agriGreen} name="Agri Green" />
        <ColorSwatch color={colors.functional.alertRed} name="Alert Red" />
        <ColorSwatch color={colors.functional.warningYellow} name="Warning Yellow" />
      </div>
      
      <h3>Typography</h3>
      <div style={{ fontFamily: theme.typography.fontFamily.system }}>
        <p style={{ fontSize: theme.typography.fontSize.h1, fontWeight: theme.typography.fontWeight.bold }}>
          Heading 1 - {theme.typography.fontSize.h1}
        </p>
        <p style={{ fontSize: theme.typography.fontSize.h2, fontWeight: theme.typography.fontWeight.semibold }}>
          Heading 2 - {theme.typography.fontSize.h2}
        </p>
        <p style={{ fontSize: theme.typography.fontSize.body }}>
          Body Text - {theme.typography.fontSize.body}
        </p>
        <p style={{ fontSize: theme.typography.fontSize.caption }}>
          Caption - {theme.typography.fontSize.caption}
        </p>
      </div>
      
      <h3>Spacing</h3>
      <div>
        <div style={{ marginBottom: theme.spacing.xs, padding: theme.spacing.xs, background: '#f0f0f0' }}>
          XS Spacing: {theme.spacing.xs}
        </div>
        <div style={{ marginBottom: theme.spacing.sm, padding: theme.spacing.sm, background: '#f0f0f0' }}>
          SM Spacing: {theme.spacing.sm}
        </div>
        <div style={{ marginBottom: theme.spacing.md, padding: theme.spacing.md, background: '#f0f0f0' }}>
          MD Spacing: {theme.spacing.md}
        </div>
      </div>
    </div>
  );
};

/**
 * Color swatch component
 */
const ColorSwatch: React.FC<{ color: string; name: string }> = ({ color, name }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '60px',
          height: '60px',
          backgroundColor: color,
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      />
      <p style={{ fontSize: '12px', marginTop: '4px' }}>{name}</p>
      <p style={{ fontSize: '10px', color: '#666' }}>{color}</p>
    </div>
  );
};

/**
 * Example 5: Using CSS variables
 */
export const CssVariablesExample: React.FC = () => {
  return (
    <ThemeProvider>
      <div style={{
        color: 'var(--color-text-primary)',
        backgroundColor: 'var(--color-background-primary)',
        padding: 'var(--spacing-md)',
        fontFamily: 'var(--font-family-system)',
        fontSize: 'var(--font-size-body)',
      }}>
        <h1 style={{
          color: 'var(--color-primary-zaloBlue)',
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--spacing-md)',
        }}>
          Using CSS Variables
        </h1>
        <p>
          This component uses CSS variables provided by the ThemeProvider.
          The theme is automatically applied to the document root.
        </p>
        <button style={{
          backgroundColor: 'var(--color-primary-agriGreen)',
          color: 'var(--color-text-inverse)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          border: 'none',
          borderRadius: '4px',
          fontSize: 'var(--font-size-body)',
          cursor: 'pointer',
        }}>
          Themed Button
        </button>
      </div>
    </ThemeProvider>
  );
};

/**
 * Example 6: Dynamic theme switching
 */
export const DynamicThemeExample: React.FC = () => {
  return (
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>
  );
};

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const colors = useThemeColors();

  const switchToLightTheme = () => {
    const lightTheme = createTheme({
      name: 'light-theme',
    });
    setTheme(lightTheme);
  };

  const switchToCustomTheme = () => {
    const customColors = extendColorPalette(
      colors,
      {
        customPrimary: '#FF6B6B',
      },
      'primary'
    );

    const customTheme = createTheme({
      name: 'custom-theme',
      colors: customColors,
    });
    setTheme(customTheme);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Current Theme: {theme.name}</h2>
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button onClick={switchToLightTheme}>Switch to Light Theme</button>
        <button onClick={switchToCustomTheme}>Switch to Custom Theme</button>
      </div>
    </div>
  );
};

export default {
  BasicThemeExample,
  CustomThemeExample,
  ExtendedColorExample,
  NoPlatformDetectionExample,
  CssVariablesExample,
  DynamicThemeExample,
};
