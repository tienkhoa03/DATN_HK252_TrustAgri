/**
 * Performance Monitoring Utilities
 * Provides utilities for monitoring and optimizing application performance
 */

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
}

/**
 * Bundle size information
 */
interface BundleSizeInfo {
  total: number;
  chunks: Record<string, number>;
  limit: number;
  percentage: number;
}

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private marks: Map<string, number> = new Map();

  /**
   * Start measuring performance
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * End measuring and record metric
   */
  measure(name: string, startMark?: string): number {
    const endTime = performance.now();
    const startTime = startMark ? this.marks.get(startMark) : this.marks.get(name);
    
    if (startTime === undefined) {
      console.warn(`Performance mark "${startMark || name}" not found`);
      return 0;
    }

    const duration = endTime - startTime;
    
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    // Clean up mark
    if (!startMark) {
      this.marks.delete(name);
    }

    return duration;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const summary: Record<string, { count: number; avg: number; min: number; max: number }> = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity,
        };
      }
      
      const s = summary[metric.name];
      s.count++;
      s.avg = (s.avg * (s.count - 1) + metric.duration) / s.count;
      s.min = Math.min(s.min, metric.duration);
      s.max = Math.max(s.max, metric.duration);
    });

    console.table(summary);
  }
}

/**
 * Measure component render time
 */
export function measureRender<T extends (...args: any[]) => any>(
  componentName: string,
  renderFn: T
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now();
    const result = renderFn(...args);
    const duration = performance.now() - startTime;
    
    if (duration > 16) { // More than one frame (60fps)
      console.warn(`Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
}

/**
 * Measure async operation
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    console.log(`${name} completed in ${duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`${name} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Check if bundle size is within limit
 */
export function checkBundleSize(sizeInBytes: number, limitInMB: number = 20): BundleSizeInfo {
  const limitInBytes = limitInMB * 1024 * 1024;
  const percentage = (sizeInBytes / limitInBytes) * 100;
  
  return {
    total: sizeInBytes,
    chunks: {},
    limit: limitInBytes,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Get Web Vitals metrics
 */
export function getWebVitals(): void {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP not supported
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    });
    
    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // FID not supported
    }

    // Cumulative Layout Shift (CLS)
    let clsScore = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
          console.log('CLS:', clsScore);
        }
      });
    });
    
    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS not supported
    }
  }
}

/**
 * Monitor memory usage (if available)
 */
export function monitorMemory(): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory Usage:', {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    });
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  // Monitor page load
  if (document.readyState === 'complete') {
    logPageLoadMetrics();
  } else {
    window.addEventListener('load', logPageLoadMetrics);
  }

  // Monitor Web Vitals
  getWebVitals();

  // Monitor memory periodically (every 30 seconds)
  setInterval(monitorMemory, 30000);
}

/**
 * Log page load metrics
 */
function logPageLoadMetrics(): void {
  const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (perfData) {
    console.log('Page Load Metrics:', {
      'DNS Lookup': `${(perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2)}ms`,
      'TCP Connection': `${(perfData.connectEnd - perfData.connectStart).toFixed(2)}ms`,
      'Request Time': `${(perfData.responseStart - perfData.requestStart).toFixed(2)}ms`,
      'Response Time': `${(perfData.responseEnd - perfData.responseStart).toFixed(2)}ms`,
      'DOM Processing': `${(perfData.domComplete - perfData.responseEnd).toFixed(2)}ms`,
      'Total Load Time': `${(perfData.loadEventEnd - perfData.fetchStart).toFixed(2)}ms`,
    });
  }
}
