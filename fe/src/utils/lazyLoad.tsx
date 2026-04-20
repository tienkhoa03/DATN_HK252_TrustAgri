/**
 * Lazy Loading Utility
 * Provides optimized lazy loading for screens with loading fallback
 */

import React, { Suspense, ComponentType, lazy } from 'react';
import { Box, Spinner } from 'zmp-ui';

/**
 * Loading fallback component
 */
const LoadingFallback: React.FC = () => (
  <Box className="flex items-center justify-center min-h-screen">
    <Spinner />
  </Box>
);

/**
 * Lazy load a component with automatic code splitting
 * @param importFunc - Dynamic import function
 * @param fallback - Optional custom loading fallback
 * @returns Lazy loaded component wrapped in Suspense
 */
export function lazyLoadScreen<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload a lazy component
 * Useful for prefetching screens before navigation
 */
export function preloadScreen(importFunc: () => Promise<any>): void {
  importFunc();
}

/**
 * Lazy load multiple screens and return them as an object
 */
export function lazyLoadScreens<T extends Record<string, () => Promise<any>>>(
  imports: T
): { [K in keyof T]: ReturnType<typeof lazyLoadScreen> } {
  const result = {} as any;
  
  for (const [key, importFunc] of Object.entries(imports)) {
    result[key] = lazyLoadScreen(importFunc);
  }
  
  return result;
}
