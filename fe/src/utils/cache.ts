/**
 * Caching Strategy Utilities
 * Provides client-side caching for improved performance
 */

/**
 * Cache configuration
 */
interface CacheConfig {
  maxAge: number; // milliseconds
  maxSize: number; // number of items
}

/**
 * Cache entry
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * Simple in-memory cache with TTL and size limits
 */
export class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = {
      maxAge: config.maxAge || 5 * 60 * 1000, // 5 minutes default
      maxSize: config.maxSize || 100, // 100 items default
    };
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T): void {
    // Enforce size limit
    if (this.cache.size >= this.config.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove specific key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * LocalStorage-based cache with TTL
 */
export class LocalStorageCache<T = any> {
  private prefix: string;
  private config: CacheConfig;

  constructor(prefix: string = 'app_cache_', config: Partial<CacheConfig> = {}) {
    this.prefix = prefix;
    this.config = {
      maxAge: config.maxAge || 24 * 60 * 60 * 1000, // 24 hours default
      maxSize: config.maxSize || 50, // 50 items default
    };
  }

  /**
   * Get item from localStorage
   */
  get(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) {
        return null;
      }

      let entry: CacheEntry<T>;
      try {
        entry = JSON.parse(item) as CacheEntry<T>;
      } catch {
        // Corrupted entry — self-heal by removing it
        this.delete(key);
        return null;
      }

      // Check if expired
      const now = Date.now();
      if (now - entry.timestamp > this.config.maxAge) {
        this.delete(key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  /**
   * Set item in localStorage
   */
  set(key: string, data: T): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        key,
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
      
      // Enforce size limit
      this.enforceSizeLimit();
    } catch (error) {
      console.error('LocalStorageCache set error:', error);
      // If quota exceeded, clear old entries
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldest();
        // Try again
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify({ data, timestamp: Date.now(), key }));
        } catch (retryError) {
          console.error('LocalStorageCache retry failed:', retryError);
        }
      }
    }
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const keys = this.getAllKeys();
    keys.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Remove specific key
   */
  delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Get all cache keys
   */
  private getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Enforce size limit by removing oldest entries
   */
  private enforceSizeLimit(): void {
    const keys = this.getAllKeys();
    if (keys.length <= this.config.maxSize) {
      return;
    }

    // Get entries with timestamps
    const entries: Array<{ key: string; timestamp: number }> = [];
    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const entry = JSON.parse(item);
          entries.push({ key, timestamp: entry.timestamp });
        }
      } catch (error) {
        // Skip invalid entries
      }
    });

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries
    const toRemove = entries.length - this.config.maxSize;
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }

  /**
   * Clear oldest entry
   */
  private clearOldest(): void {
    const keys = this.getAllKeys();
    if (keys.length === 0) {
      return;
    }

    let oldestKey = keys[0];
    let oldestTimestamp = Infinity;

    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const entry = JSON.parse(item);
          if (entry.timestamp < oldestTimestamp) {
            oldestTimestamp = entry.timestamp;
            oldestKey = key;
          }
        }
      } catch (error) {
        // Skip invalid entries
      }
    });

    localStorage.removeItem(oldestKey);
  }
}

/**
 * Create a cached version of an async function
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cache: MemoryCache | LocalStorageCache,
  keyGenerator: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Check cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Global cache instances
 */
export const memoryCache = new MemoryCache({
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
});

export const persistentCache = new LocalStorageCache('trustagri_', {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxSize: 50,
});
