/**
 * Jest Test Setup
 * Configuration for testing environment
 */

import '@testing-library/jest-dom';

// Mock navigator.userAgent for platform detection tests
Object.defineProperty(window.navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
});
