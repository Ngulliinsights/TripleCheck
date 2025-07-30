/**
 * Simple In-Memory Cache Service
 * 
 * A lightweight caching solution for development and small-scale production use.
 * For production at scale, consider using Redis or another external cache.
 */

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Set a value in the cache with TTL (time to live) in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Delete a specific key from the cache
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern (simple wildcard support)
   */
  async deletePattern(pattern: string): Promise<number> {
    let deletedCount = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Check if a key exists in the cache
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalKeys: number;
    expiredKeys: number;
    memoryUsage: number;
  } {
    const now = Date.now();
    let expiredKeys = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys++;
      }
    }

    return {
      totalKeys: this.cache.size,
      expiredKeys,
      memoryUsage: this.getApproximateMemoryUsage(),
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const keyToDelete of keysToDelete) {
      this.cache.delete(keyToDelete);
    }

    if (keysToDelete.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[CacheService] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get approximate memory usage (rough estimate)
   */
  private getApproximateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Rough estimate: key length + JSON string length
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.value).length * 2;
      size += 16; // Overhead for expiresAt and object structure
    }

    return size;
  }

  /**
   * Graceful shutdown - clear the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Export a singleton instance for convenience
export const cacheService = new CacheService();

// Graceful shutdown handling
process.on('SIGINT', () => {
  cacheService.destroy();
});

process.on('SIGTERM', () => {
  cacheService.destroy();
});