/**
 * Error Handling Examples
 * Demonstrates error handling utilities in action
 */

import React from 'react';
import { Page, Box, Text, Button } from 'zmp-ui';
import {
  handleColorValidation,
  handleTypographyValidation,
  handleIconValidation,
  handleAssetLoading,
  handleFontLoading,
  handleThemeConfiguration,
  errorLogger,
  DesignSystemErrorType,
} from './errorHandling';
import { useErrorHandling, useImageLoading } from './useErrorHandling';
import { defaultTheme } from './theme';

/**
 * Example 1: Color Validation Error Handling
 */
export const ColorValidationExample: React.FC = () => {
  const { safeColor, errorState } = useErrorHandling();

  const invalidColor = '#INVALID';
  const validatedColor = safeColor(invalidColor, '#0068FF');

  return (
    <Box p={4}>
      <Text bold size="large">Color Validation Example</Text>
      <Box mt={2}>
        <Text>Invalid Color: {invalidColor}</Text>
        <Text>Validated Color: {validatedColor}</Text>
        <Box
          style={{
            width: '100px',
            height: '100px',
            backgroundColor: validatedColor,
            marginTop: '8px',
          }}
        />
        {errorState.hasError && (
          <Box mt={2} p={2} style={{ backgroundColor: '#FFF3CD', borderRadius: '4px' }}>
            <Text size="small">⚠️ {errorState.error?.message}</Text>
            {errorState.recovered && (
              <Text size="small">✓ Recovered with fallback color</Text>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * Example 2: Typography Validation Error Handling
 */
export const TypographyValidationExample: React.FC = () => {
  const { safeFontSize, errorState } = useErrorHandling();

  const invalidFontSize = '13px'; // Below minimum 14px
  const validatedFontSize = safeFontSize(invalidFontSize, '14px');

  return (
    <Box p={4}>
      <Text bold size="large">Typography Validation Example</Text>
      <Box mt={2}>
        <Text>Invalid Font Size: {invalidFontSize}</Text>
        <Text>Validated Font Size: {validatedFontSize}</Text>
        <Text style={{ fontSize: validatedFontSize, marginTop: '8px' }}>
          This text uses the validated font size
        </Text>
        {errorState.hasError && (
          <Box mt={2} p={2} style={{ backgroundColor: '#FFF3CD', borderRadius: '4px' }}>
            <Text size="small">⚠️ {errorState.error?.message}</Text>
            {errorState.recovered && (
              <Text size="small">✓ Recovered with fallback font size</Text>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * Example 3: Icon Validation Error Handling
 */
export const IconValidationExample: React.FC = () => {
  const { safeIcon, errorState } = useErrorHandling();

  const invalidIcon = 'non-existent-icon';
  const validatedIcon = safeIcon(invalidIcon);

  return (
    <Box p={4}>
      <Text bold size="large">Icon Validation Example</Text>
      <Box mt={2}>
        <Text>Invalid Icon: {invalidIcon}</Text>
        <Text>Validated Icon: {validatedIcon || 'null (icon not rendered)'}</Text>
        {errorState.hasError && (
          <Box mt={2} p={2} style={{ backgroundColor: '#F8D7DA', borderRadius: '4px' }}>
            <Text size="small">❌ {errorState.error?.message}</Text>
            <Text size="small">Icon will not be rendered</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * Example 4: Image Loading Error Handling
 */
export const ImageLoadingExample: React.FC = () => {
  const invalidImageUrl = 'https://invalid-url.com/image.jpg';
  const imageState = useImageLoading(invalidImageUrl);

  return (
    <Box p={4}>
      <Text bold size="large">Image Loading Example</Text>
      <Box mt={2}>
        <Text>Image URL: {invalidImageUrl}</Text>
        <Text>Loading: {imageState.loading ? 'Yes' : 'No'}</Text>
        <Text>Error: {imageState.error ? 'Yes' : 'No'}</Text>
        <Box mt={2}>
          <img
            src={imageState.src}
            alt="Example"
            style={{
              width: '200px',
              height: '200px',
              objectFit: 'cover',
              border: '1px solid #ddd',
            }}
          />
        </Box>
        {imageState.error && (
          <Box mt={2} p={2} style={{ backgroundColor: '#FFF3CD', borderRadius: '4px' }}>
            <Text size="small">⚠️ Failed to load image</Text>
            <Text size="small">✓ Showing placeholder</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * Example 5: Theme Configuration Error Handling
 */
export const ThemeConfigurationExample: React.FC = () => {
  const [result, setResult] = React.useState<any>(null);

  const testInvalidTheme = () => {
    const invalidTheme: any = {
      name: '', // Invalid: empty name
      colors: {}, // Invalid: missing required color categories
      // Missing typography, spacing, icons
    };

    const themeResult = handleThemeConfiguration(invalidTheme);
    setResult(themeResult);
  };

  return (
    <Box p={4}>
      <Text bold size="large">Theme Configuration Example</Text>
      <Box mt={2}>
        <Button onClick={testInvalidTheme}>Test Invalid Theme</Button>
        {result && (
          <Box mt={2}>
            <Text>Theme Used: {result.theme.name}</Text>
            {result.error && (
              <Box mt={2} p={2} style={{ backgroundColor: '#F8D7DA', borderRadius: '4px' }}>
                <Text size="small">❌ {result.error.message}</Text>
                <Text size="small">✓ Using default theme as fallback</Text>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

/**
 * Example 6: Error Logger Dashboard
 */
export const ErrorLoggerExample: React.FC = () => {
  const [logs, setLogs] = React.useState(errorLogger.getLogs());
  const [filterType, setFilterType] = React.useState<DesignSystemErrorType | 'all'>('all');

  const refreshLogs = () => {
    if (filterType === 'all') {
      setLogs(errorLogger.getLogs());
    } else {
      setLogs(errorLogger.getLogsByType(filterType));
    }
  };

  const clearLogs = () => {
    errorLogger.clearLogs();
    setLogs([]);
  };

  React.useEffect(() => {
    const interval = setInterval(refreshLogs, 1000);
    return () => clearInterval(interval);
  }, [filterType]);

  return (
    <Box p={4}>
      <Text bold size="large">Error Logger Dashboard</Text>
      <Box mt={2} flex flexDirection="row" style={{ gap: '8px' }}>
        <Button size="small" onClick={refreshLogs}>Refresh</Button>
        <Button size="small" onClick={clearLogs}>Clear Logs</Button>
      </Box>
      <Box mt={2}>
        <Text>Filter by type:</Text>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          style={{ padding: '4px', marginTop: '4px' }}
        >
          <option value="all">All</option>
          <option value={DesignSystemErrorType.COLOR_VALIDATION}>Color Validation</option>
          <option value={DesignSystemErrorType.TYPOGRAPHY_VALIDATION}>Typography Validation</option>
          <option value={DesignSystemErrorType.ICON_VALIDATION}>Icon Validation</option>
          <option value={DesignSystemErrorType.ASSET_LOADING}>Asset Loading</option>
          <option value={DesignSystemErrorType.FONT_LOADING}>Font Loading</option>
          <option value={DesignSystemErrorType.THEME_CONFIGURATION}>Theme Configuration</option>
        </select>
      </Box>
      <Box mt={2}>
        <Text>Total Logs: {logs.length}</Text>
        <Box mt={2} style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <Text>No errors logged</Text>
          ) : (
            logs.map((log, index) => (
              <Box
                key={index}
                p={2}
                mb={2}
                style={{
                  backgroundColor: log.recovered ? '#D4EDDA' : '#F8D7DA',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: log.recovered ? '#C3E6CB' : '#F5C6CB',
                }}
              >
                <Text bold size="small">{log.error.type}</Text>
                <Text size="xSmall">{log.error.message}</Text>
                <Text size="xSmall">
                  {log.recovered ? '✓ Recovered' : '❌ Not Recovered'}
                </Text>
                <Text size="xSmall">
                  {new Date(log.error.timestamp).toLocaleTimeString()}
                </Text>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Main Example Page
 */
export const ErrorHandlingExamples: React.FC = () => {
  return (
    <Page>
      <Box p={4}>
        <Text bold size="xxLarge">Error Handling Examples</Text>
        <Text size="small" style={{ color: '#666', marginTop: '4px' }}>
          Demonstrates comprehensive error handling for the design system
        </Text>
      </Box>

      <ColorValidationExample />
      <Box style={{ height: '1px', backgroundColor: '#ddd', margin: '16px 0' }} />

      <TypographyValidationExample />
      <Box style={{ height: '1px', backgroundColor: '#ddd', margin: '16px 0' }} />

      <IconValidationExample />
      <Box style={{ height: '1px', backgroundColor: '#ddd', margin: '16px 0' }} />

      <ImageLoadingExample />
      <Box style={{ height: '1px', backgroundColor: '#ddd', margin: '16px 0' }} />

      <ThemeConfigurationExample />
      <Box style={{ height: '1px', backgroundColor: '#ddd', margin: '16px 0' }} />

      <ErrorLoggerExample />
    </Page>
  );
};

export default ErrorHandlingExamples;
