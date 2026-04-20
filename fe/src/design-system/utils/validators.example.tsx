/**
 * Validators Usage Examples
 * Demonstrates how to use the design system validation utilities
 * 
 * Requirements: 8.1-8.5, 10.1-10.5
 */

import React from 'react';
import {
  validateComponent,
  validateComponentDetailed,
  getComplianceReport,
  validateColorContrast,
  validateTypography,
  validateIcon,
  validateAccessibility,
  isComponentCompliant,
  ComponentConfig,
} from './validators';

/**
 * Example 1: Basic Component Validation
 */
export const BasicValidationExample = () => {
  const buttonConfig: ComponentConfig = {
    componentName: 'PrimaryButton',
    color: '#FFFFFF',
    backgroundColor: '#0068FF',
    fontSize: '16px',
    fontWeight: 600,
    width: 120,
    height: 48,
    isInteractive: true,
    ariaLabel: 'Submit form',
  };

  const result = validateComponent(buttonConfig);

  return (
    <div>
      <h3>Basic Component Validation</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
      {result.valid ? (
        <p style={{ color: 'green' }}>✓ Component is valid</p>
      ) : (
        <div>
          <p style={{ color: 'red' }}>✗ Component has errors:</p>
          <ul>
            {result.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Example 2: Detailed Component Validation
 */
export const DetailedValidationExample = () => {
  const cardConfig: ComponentConfig = {
    componentName: 'SensorCard',
    color: '#000000',
    backgroundColor: '#FFFFFF',
    borderColor: '#F7F7F8',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5,
    iconName: 'temperature',
    iconSize: '24px',
    padding: '16px',
    width: 200,
    height: 120,
    isInteractive: false,
  };

  const result = validateComponentDetailed(cardConfig);

  return (
    <div>
      <h3>Detailed Component Validation</h3>
      <h4>Overall Result</h4>
      <pre>{JSON.stringify(result.overall, null, 2)}</pre>
      
      {result.color && (
        <>
          <h4>Color Validation</h4>
          <pre>{JSON.stringify(result.color, null, 2)}</pre>
        </>
      )}
      
      {result.typography && (
        <>
          <h4>Typography Validation</h4>
          <pre>{JSON.stringify(result.typography, null, 2)}</pre>
        </>
      )}
      
      {result.icon && (
        <>
          <h4>Icon Validation</h4>
          <pre>{JSON.stringify(result.icon, null, 2)}</pre>
        </>
      )}
      
      {result.accessibility && (
        <>
          <h4>Accessibility Validation</h4>
          <pre>{JSON.stringify(result.accessibility, null, 2)}</pre>
        </>
      )}
    </div>
  );
};

/**
 * Example 3: Compliance Report
 */
export const ComplianceReportExample = () => {
  const alertConfig: ComponentConfig = {
    componentName: 'ErrorAlert',
    color: '#FFFFFF',
    backgroundColor: '#F50000',
    fontSize: '14px',
    fontWeight: 500,
    iconName: 'alert',
    iconSize: '24px',
    padding: '16px',
    margin: '8px',
    width: 300,
    height: 60,
    isInteractive: true,
    ariaLabel: 'Error notification',
    role: 'alert',
  };

  const report = getComplianceReport(alertConfig);

  return (
    <div>
      <h3>Compliance Report</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{report}</pre>
    </div>
  );
};

/**
 * Example 4: Color Contrast Validation
 */
export const ColorContrastExample = () => {
  const combinations = [
    { fg: '#000000', bg: '#FFFFFF', label: 'Black on White' },
    { fg: '#0068FF', bg: '#FFFFFF', label: 'Zalo Blue on White' },
    { fg: '#3EBB6C', bg: '#FFFFFF', label: 'Agri Green on White' },
    { fg: '#F50000', bg: '#FFFFFF', label: 'Alert Red on White' },
    { fg: '#666666', bg: '#FFFFFF', label: 'Secondary Text on White' },
    { fg: '#FFFFFF', bg: '#0068FF', label: 'White on Zalo Blue' },
  ];

  return (
    <div>
      <h3>Color Contrast Validation (WCAG AA)</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Combination</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Preview</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Ratio</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>AA</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>AAA</th>
          </tr>
        </thead>
        <tbody>
          {combinations.map((combo, i) => {
            const aaResult = validateColorContrast(combo.fg, combo.bg, 'AA');
            const aaaResult = validateColorContrast(combo.fg, combo.bg, 'AAA');
            
            return (
              <tr key={i}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{combo.label}</td>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '8px',
                    backgroundColor: combo.bg,
                    color: combo.fg,
                  }}
                >
                  Sample Text
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{aaResult.ratio}:1</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {aaResult.valid ? '✓' : '✗'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {aaaResult.valid ? '✓' : '✗'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Example 5: Typography Validation
 */
export const TypographyValidationExample = () => {
  const configs = [
    { fontSize: '22px', fontWeight: 700, lineHeight: 1.2, label: 'Heading 1' },
    { fontSize: '18px', fontWeight: 600, lineHeight: 1.2, label: 'Heading 2' },
    { fontSize: '16px', fontWeight: 400, lineHeight: 1.5, label: 'Body Text' },
    { fontSize: '14px', fontWeight: 400, lineHeight: 1.5, label: 'Caption' },
    { fontSize: '12px', fontWeight: 400, lineHeight: 1.5, label: 'Small Text', isImportant: false },
  ];

  return (
    <div>
      <h3>Typography Validation</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Type</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Size</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Weight</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Line Height</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Valid</th>
          </tr>
        </thead>
        <tbody>
          {configs.map((config, i) => {
            const result = validateTypography(config);
            
            return (
              <tr key={i}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{config.label}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{config.fontSize}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{config.fontWeight}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{config.lineHeight}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {result.valid ? '✓' : '✗'}
                  {result.errors.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'red' }}>
                      {result.errors.join(', ')}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Example 6: Icon Validation
 */
export const IconValidationExample = () => {
  const icons = [
    { name: 'home', size: '24px', label: 'Home Icon' },
    { name: 'temperature', size: '24px', label: 'Temperature Icon' },
    { name: 'humidity', size: '24px', label: 'Humidity Icon' },
    { name: 'light', size: '24px', label: 'Light Icon' },
    { name: 'alert', size: '24px', label: 'Alert Icon' },
  ];

  return (
    <div>
      <h3>Icon Validation</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Icon</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Size</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Valid</th>
          </tr>
        </thead>
        <tbody>
          {icons.map((icon, i) => {
            const result = validateIcon(icon);
            
            return (
              <tr key={i}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{icon.label}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{icon.name}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{icon.size}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {result.valid ? '✓' : '✗'}
                  {result.errors.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'red' }}>
                      {result.errors.join(', ')}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Example 7: Accessibility Validation
 */
export const AccessibilityValidationExample = () => {
  const components = [
    {
      label: 'Valid Button',
      config: { width: 48, height: 48, ariaLabel: 'Submit', isInteractive: true },
    },
    {
      label: 'Small Button (Invalid)',
      config: { width: 40, height: 40, ariaLabel: 'Submit', isInteractive: true },
    },
    {
      label: 'Button without ARIA',
      config: { width: 48, height: 48, isInteractive: true },
    },
    {
      label: 'Non-interactive Element',
      config: { width: 100, height: 30, isInteractive: false },
    },
  ];

  return (
    <div>
      <h3>Accessibility Validation</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Component</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Size</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Valid</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>Issues</th>
          </tr>
        </thead>
        <tbody>
          {components.map((item, i) => {
            const result = validateAccessibility(item.config);
            
            return (
              <tr key={i}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.label}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {item.config.width}x{item.config.height}px
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {result.valid ? '✓' : '✗'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  {result.errors.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'red' }}>
                      Errors: {result.errors.join(', ')}
                    </div>
                  )}
                  {result.warnings.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'orange' }}>
                      Warnings: {result.warnings.join(', ')}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Example 8: Quick Compliance Check
 */
export const QuickComplianceCheckExample = () => {
  const components: ComponentConfig[] = [
    {
      componentName: 'Button',
      color: '#FFFFFF',
      backgroundColor: '#0068FF',
      fontSize: '16px',
      width: 120,
      height: 48,
      isInteractive: true,
      ariaLabel: 'Click me',
    },
    {
      componentName: 'InvalidButton',
      color: '#FF0000', // Invalid color
      backgroundColor: '#0068FF',
      fontSize: '10px', // Too small
      width: 30, // Too small
      height: 30, // Too small
      isInteractive: true,
    },
  ];

  return (
    <div>
      <h3>Quick Compliance Check</h3>
      {components.map((component, i) => (
        <div key={i} style={{ marginBottom: '20px' }}>
          <h4>{component.componentName}</h4>
          <p>
            Compliant: {isComponentCompliant(component) ? '✓ Yes' : '✗ No'}
          </p>
        </div>
      ))}
    </div>
  );
};

/**
 * Main Example Component
 */
export const ValidatorsExample = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Design System Validators - Usage Examples</h1>
      <p>
        These examples demonstrate how to use the validation utilities to ensure
        components comply with the Zalo UI Design System requirements.
      </p>

      <hr />
      <BasicValidationExample />
      
      <hr />
      <DetailedValidationExample />
      
      <hr />
      <ComplianceReportExample />
      
      <hr />
      <ColorContrastExample />
      
      <hr />
      <TypographyValidationExample />
      
      <hr />
      <IconValidationExample />
      
      <hr />
      <AccessibilityValidationExample />
      
      <hr />
      <QuickComplianceCheckExample />
    </div>
  );
};

export default ValidatorsExample;
