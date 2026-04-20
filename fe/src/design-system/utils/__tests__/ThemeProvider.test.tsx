/**
 * ThemeProvider Component Tests
 * Tests for ThemeProvider and theme hooks
 * 
 * Requirements: 1.1, 3.1, 3.2, 8.1-8.5
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import {
  ThemeProvider,
  useTheme,
  usePlatform,
  useThemeColors,
  useThemeTypography,
  useThemeSpacing,
  useThemeIcons,
} from '../ThemeProvider';
import { createTheme, defaultTheme } from '../theme';

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset document styles
    document.documentElement.style.cssText = '';
    document.body.className = '';
  });

  describe('Basic Rendering', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div>Test Content</div>
        </ThemeProvider>
      );
      
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should provide default theme', () => {
      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>{theme.name}</div>;
      };
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText(defaultTheme.name)).toBeInTheDocument();
    });

    it('should provide custom theme', () => {
      const customTheme = createTheme({ name: 'custom-test-theme' });
      
      const TestComponent = () => {
        const { theme } = useTheme();
        return <div>{theme.name}</div>;
      };
      
      render(
        <ThemeProvider theme={customTheme}>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText('custom-test-theme')).toBeInTheDocument();
    });
  });

  describe('Platform Detection', () => {
    it('should detect iOS platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });
      
      const TestComponent = () => {
        const platform = usePlatform();
        return <div>{platform}</div>;
      };
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText('ios')).toBeInTheDocument();
    });

    it('should detect Android platform', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      });
      
      const TestComponent = () => {
        const platform = usePlatform();
        return <div>{platform}</div>;
      };
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText('android')).toBeInTheDocument();
    });

    it('should add platform class to body', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });
      
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );
      
      expect(document.body.classList.contains('platform-ios')).toBe(true);
    });

    it('should disable platform detection when specified', () => {
      const TestComponent = () => {
        const platform = usePlatform();
        return <div>{platform}</div>;
      };
      
      render(
        <ThemeProvider enablePlatformDetection={false}>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText('unknown')).toBeInTheDocument();
    });
  });

  describe('CSS Variables', () => {
    it('should apply color CSS variables to document root', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary-zaloBlue')).toBe('#0068FF');
      expect(root.style.getPropertyValue('--color-primary-agriGreen')).toBe('#3EBB6C');
    });

    it('should apply typography CSS variables to document root', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--font-size-h1')).toBe('22px');
      expect(root.style.getPropertyValue('--font-size-body')).toBe('16px');
    });

    it('should apply spacing CSS variables to document root', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--spacing-md')).toBe('16px');
      expect(root.style.getPropertyValue('--spacing-lg')).toBe('24px');
    });

    it('should update CSS variables when theme changes', () => {
      const TestComponent = () => {
        const { setTheme } = useTheme();
        
        const changeTheme = () => {
          const newTheme = createTheme({
            name: 'new-theme',
            colors: {
              ...defaultTheme.colors,
              primary: {
                ...defaultTheme.colors.primary,
                zaloBlue: '#FF0000',
              } as any,
            } as any,
          });
          setTheme(newTheme);
        };
        
        return <button onClick={changeTheme}>Change Theme</button>;
      };
      
      const { getByText } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary-zaloBlue')).toBe('#0068FF');
      
      act(() => {
        getByText('Change Theme').click();
      });
      
      expect(root.style.getPropertyValue('--color-primary-zaloBlue')).toBe('#FF0000');
    });
  });

  describe('Theme Hooks', () => {
    it('useTheme should provide theme context', () => {
      const TestComponent = () => {
        const { theme, platform } = useTheme();
        return (
          <div>
            <div>{theme.name}</div>
            <div>{platform}</div>
          </div>
        );
      };
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText(defaultTheme.name)).toBeInTheDocument();
    });

    it('useThemeColors should provide colors', () => {
      const TestComponent = () => {
        const colors = useThemeColors();
        return <div>{colors.primary.zaloBlue}</div>;
      };
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText('#0068FF')).toBeInTheDocument();
    });

    it('useThemeTypography should provide typography', () => {
      const TestComponent = () => {
        const typography = useThemeTypography();
        return <div>{typography.fontSize.h1}</div>;
      };
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText('22px')).toBeInTheDocument();
    });

    it('useThemeSpacing should provide spacing', () => {
      const TestComponent = () => {
        const spacing = useThemeSpacing();
        return <div>{spacing.md}</div>;
      };
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText('16px')).toBeInTheDocument();
    });

    it('useThemeIcons should provide icons', () => {
      const TestComponent = () => {
        const icons = useThemeIcons();
        return <div>{icons.navigation.home}</div>;
      };
      
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(screen.getByText('custom-icon-home')).toBeInTheDocument();
    });

    it('should throw error when hooks used outside provider', () => {
      const TestComponent = () => {
        useTheme();
        return <div>Test</div>;
      };
      
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Theme Validation', () => {
    it('should throw error for invalid theme', () => {
      const invalidTheme = {
        ...defaultTheme,
        name: '',
      };
      
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        render(
          <ThemeProvider theme={invalidTheme}>
            <div>Test</div>
          </ThemeProvider>
        );
      }).toThrow('Invalid theme configuration');
      
      consoleSpy.mockRestore();
    });

    it('should validate theme when setting new theme', () => {
      // Capture console.error calls
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const TestComponent = () => {
        const { setTheme } = useTheme();
        
        const trySetInvalidTheme = () => {
          try {
            const invalidTheme = {
              ...defaultTheme,
              name: '',
            };
            setTheme(invalidTheme);
          } catch (err) {
            // Error is expected
          }
        };
        
        return <button onClick={trySetInvalidTheme}>Set Invalid Theme</button>;
      };
      
      const { getByText } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      getByText('Set Invalid Theme').click();
      
      // Check that validation error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Theme validation failed:',
        expect.arrayContaining(['Theme name is required'])
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Theme Updates', () => {
    it('should update theme when setTheme is called', () => {
      const TestComponent = () => {
        const { theme, setTheme } = useTheme();
        
        const updateTheme = () => {
          const newTheme = createTheme({ name: 'updated-theme' });
          setTheme(newTheme);
        };
        
        return (
          <div>
            <div data-testid="theme-name">{theme.name}</div>
            <button onClick={updateTheme}>Update Theme</button>
          </div>
        );
      };
      
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
      
      expect(getByTestId('theme-name')).toHaveTextContent(defaultTheme.name);
      
      act(() => {
        getByText('Update Theme').click();
      });
      
      expect(getByTestId('theme-name')).toHaveTextContent('updated-theme');
    });

    it('should maintain theme consistency across multiple components', () => {
      const Component1 = () => {
        const { theme } = useTheme();
        return <div data-testid="comp1">{theme.name}</div>;
      };
      
      const Component2 = () => {
        const { theme } = useTheme();
        return <div data-testid="comp2">{theme.name}</div>;
      };
      
      const Component3 = () => {
        const { theme, setTheme } = useTheme();
        
        const updateTheme = () => {
          const newTheme = createTheme({ name: 'shared-theme' });
          setTheme(newTheme);
        };
        
        return <button onClick={updateTheme}>Update</button>;
      };
      
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <Component1 />
          <Component2 />
          <Component3 />
        </ThemeProvider>
      );
      
      act(() => {
        getByText('Update').click();
      });
      
      expect(getByTestId('comp1')).toHaveTextContent('shared-theme');
      expect(getByTestId('comp2')).toHaveTextContent('shared-theme');
    });
  });
});
