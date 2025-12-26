/**
 * Storage Cache Layer
 * Provides in-memory caching for frequently accessed storage data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class StorageCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Expired
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data with TTL (time to live in ms)
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cached data
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cached data matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

export const storageCache = new StorageCache();

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  RULES: 5000, // 5 seconds for rules
  SETTINGS: 10000, // 10 seconds for settings
  GROUPS: 5000, // 5 seconds for groups
} as const;
