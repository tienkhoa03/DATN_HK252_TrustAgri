/**
 * ThemeProvider Component
 * Provides theme context to all components in the application
 * 
 * Requirements: 1.1, 3.1, 3.2, 8.1-8.5
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeConfig, getPlatformTheme, validateTheme } from './theme';

interface ThemeContextValue {
  theme: ThemeConfig;
  platform: 'ios' | 'android' | 'unknown';
  setTheme: (theme: ThemeConfig) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: ThemeConfig;
  enablePlatformDetection?: boolean;
}

/**
 * ThemeProvider component
 * Wraps the application and provides theme context
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme: customTheme,
  enablePlatformDetection = true,
}) => {
  // Detect platform and get appropriate theme
  const [platform, setPlatform] = useState<'ios' | 'android' | 'unknown'>('unknown');
  const [theme, setThemeState] = useState<ThemeConfig>(() => {
    if (customTheme) {
      // Validate custom theme
      const validation = validateTheme(customTheme);
      if (!validation.valid) {
        console.error('Theme validation failed:', validation.errors);
        throw new Error(`Invalid theme configuration: ${validation.errors?.join(', ')}`);
      }
      return customTheme;
    }
    return getPlatformTheme();
  });

  // Detect platform on mount
  useEffect(() => {
    if (enablePlatformDetection) {
      const userAgent = navigator.userAgent;
      let detectedPlatform: 'ios' | 'android' | 'unknown' = 'unknown';
      
      if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        detectedPlatform = 'ios';
      } else if (userAgent.includes('Android')) {
        detectedPlatform = 'android';
      }
      
      setPlatform(detectedPlatform);
      
      // Update theme based on platform if no custom theme provided
      if (!customTheme) {
        setThemeState(getPlatformTheme());
      }
    }
  }, [enablePlatformDetection, customTheme]);

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });
    
    Object.entries(theme.colors.functional).forEach(([key, value]) => {
      root.style.setProperty(`--color-functional-${key}`, value);
    });
    
    Object.entries(theme.colors.semantic).forEach(([key, value]) => {
      root.style.setProperty(`--color-semantic-${key}`, value);
    });
    
    Object.entries(theme.colors.text).forEach(([key, value]) => {
      root.style.setProperty(`--color-text-${key}`, value);
    });
    
    Object.entries(theme.colors.background).forEach(([key, value]) => {
      root.style.setProperty(`--color-background-${key}`, value);
    });
    
    // Apply typography variables
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
    
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, String(value));
    });
    
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, String(value));
    });
    
    // Apply platform-specific font family
    root.style.setProperty('--font-family-system', theme.typography.fontFamily.system);
    
    // Apply spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    // Add platform class to body for platform-specific styling
    document.body.classList.remove('platform-ios', 'platform-android', 'platform-unknown');
    document.body.classList.add(`platform-${platform}`);
  }, [theme, platform]);

  const setTheme = (newTheme: ThemeConfig) => {
    // Validate new theme
    const validation = validateTheme(newTheme);
    if (!validation.valid) {
      console.error('Theme validation failed:', validation.errors);
      throw new Error(`Invalid theme configuration: ${validation.errors?.join(', ')}`);
    }
    setThemeState(newTheme);
  };

  const contextValue = useMemo(
    () => ({
      theme,
      platform,
      setTheme,
    }),
    [theme, platform]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to access theme context
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Hook to get current platform
 */
export const usePlatform = (): 'ios' | 'android' | 'unknown' => {
  const { platform } = useTheme();
  return platform;
};

/**
 * Hook to get theme colors
 */
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

/**
 * Hook to get theme typography
 */
export const useThemeTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

/**
 * Hook to get theme spacing
 */
export const useThemeSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};

/**
 * Hook to get theme icons
 */
export const useThemeIcons = () => {
  const { theme } = useTheme();
  return theme.icons;
};

export default ThemeProvider;
