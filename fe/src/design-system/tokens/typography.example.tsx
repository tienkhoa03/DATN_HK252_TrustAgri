/**
 * Typography System Usage Examples
 * Demonstrates how to use the typography system in components
 * 
 * Requirements: 3.1-3.6, 8.3, 9.1
 */

import React from 'react';
import {
  typography,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  getPlatformFontFamily,
  createTypographyStyle,
  getResponsiveFontSize,
  validateMinimumFontSize,
  isValidTypographyScale,
  getNearestValidFontSize,
} from './typography';

/**
 * Example 1: Using typography tokens directly
 */
export const DirectUsageExample: React.FC = () => {
  return (
    <div>
      <h1 style={{ 
        fontSize: fontSize.h1,
        fontWeight: fontWeight.bold,
        lineHeight: lineHeight.tight,
        fontFamily: getPlatformFontFamily(),
      }}>
        Farm Lab Dashboard
      </h1>
      
      <p style={{
        fontSize: fontSize.body,
        fontWeight: fontWeight.regular,
        lineHeight: lineHeight.normal,
        fontFamily: getPlatformFontFamily(),
      }}>
        Welcome to your agricultural monitoring system
      </p>
    </div>
  );
};

/**
 * Example 2: Using createTypographyStyle utility
 */
export const UtilityUsageExample: React.FC = () => {
  return (
    <div>
      <h1 style={createTypographyStyle('h1')}>
        Sensor Monitoring
      </h1>
      
      <h2 style={createTypographyStyle('h2')}>
        Temperature Readings
      </h2>
      
      <p style={createTypographyStyle('body')}>
        Current temperature: 28°C
      </p>
      
      <span style={createTypographyStyle('caption')}>
        Last updated: 2 minutes ago
      </span>
    </div>
  );
};

/**
 * Example 3: Using typography with overrides
 */
export const OverrideExample: React.FC = () => {
  return (
    <div>
      <h2 style={createTypographyStyle('h2', { fontWeight: fontWeight.bold })}>
        Critical Alert
      </h2>
      
      <p style={createTypographyStyle('body', { fontWeight: fontWeight.medium })}>
        Temperature exceeds safe threshold
      </p>
    </div>
  );
};

/**
 * Example 4: Responsive typography
 */
export const ResponsiveExample: React.FC = () => {
  const [screenWidth, setScreenWidth] = React.useState(window.innerWidth);
  
  React.useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const responsiveFontSize = getResponsiveFontSize(fontSize.body, screenWidth);
  
  return (
    <p style={{ fontSize: responsiveFontSize }}>
      This text scales based on screen width
    </p>
  );
};

/**
 * Example 5: Typography validation in component
 */
interface ValidatedTextProps {
  text: string;
  fontSize: string;
  isImportant?: boolean;
}

export const ValidatedText: React.FC<ValidatedTextProps> = ({ 
  text, 
  fontSize: requestedSize, 
  isImportant = true 
}) => {
  // Validate font size
  const validation = validateMinimumFontSize(requestedSize, isImportant);
  
  if (!validation.valid) {
    console.warn(validation.error);
  }
  
  // Use nearest valid size if invalid
  const validSize = isValidTypographyScale(requestedSize) 
    ? requestedSize 
    : getNearestValidFontSize(requestedSize);
  
  return (
    <p style={{ 
      fontSize: validSize,
      fontFamily: getPlatformFontFamily(),
    }}>
      {text}
    </p>
  );
};

/**
 * Example 6: Platform-specific typography
 */
export const PlatformSpecificExample: React.FC = () => {
  const platformFont = getPlatformFontFamily();
  
  return (
    <div>
      <p style={{ fontFamily: platformFont }}>
        This text uses the platform-specific font:
      </p>
      <code>{platformFont}</code>
      <ul>
        <li>iOS: San Francisco</li>
        <li>Android: Roboto</li>
        <li>Other: System default</li>
      </ul>
    </div>
  );
};

/**
 * Example 7: Typography scale reference
 */
export const TypographyScaleReference: React.FC = () => {
  return (
    <div style={{ fontFamily: getPlatformFontFamily() }}>
      <h1 style={{ fontSize: fontSize.h1, fontWeight: fontWeight.bold }}>
        H1 - 22px Bold (Screen Titles)
      </h1>
      
      <h2 style={{ fontSize: fontSize.h2, fontWeight: fontWeight.semibold }}>
        H2 - 18px Semibold (Section Titles)
      </h2>
      
      <p style={{ fontSize: fontSize.body, fontWeight: fontWeight.regular }}>
        Body - 16px Regular (Main Content)
      </p>
      
      <p style={{ fontSize: fontSize.caption, fontWeight: fontWeight.regular }}>
        Caption - 14px Regular (Labels & Captions)
      </p>
      
      <p style={{ fontSize: fontSize.small, fontWeight: fontWeight.regular }}>
        Small - 12px Regular (Secondary Info)
      </p>
    </div>
  );
};

/**
 * Example 8: Styled component with typography
 */
interface StyledTextProps {
  variant: 'h1' | 'h2' | 'body' | 'caption' | 'small';
  children: React.ReactNode;
  className?: string;
}

export const StyledText: React.FC<StyledTextProps> = ({ 
  variant, 
  children, 
  className 
}) => {
  const style = createTypographyStyle(variant);
  
  const Component = variant.startsWith('h') ? variant : 'p';
  
  return React.createElement(
    Component,
    { style, className },
    children
  );
};

// Usage:
// <StyledText variant="h1">My Title</StyledText>
// <StyledText variant="body">My content</StyledText>
