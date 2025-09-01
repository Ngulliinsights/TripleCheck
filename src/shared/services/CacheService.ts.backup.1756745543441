/**
 * Cache Service
 * Multi-level caching with intelligent invalidation and performance optimization
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  size: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default TTL in milliseconds
  maxEntries: number; // Maximum number of entries
  enableCompression: boolean;
  enablePersistence: boolean;
  storagePrefix: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalEntries: 0,
    totalSize: 0,
    oldestEntry: 0,
    newestEntry: 0
  };

  private config: CacheConfig = {
    maxSize: 50 * 1024 * 1024, // 50MB
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxEntries: 1000,
    enableCompression: true,
    enablePersistence: true,
    storagePrefix: 'cache_'
  };

  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  constructor() {
    this.loadFromPersistentStorage();
    this.startCleanupInterval();
    this.setupStorageEventListener();
  }

  /**
   * Set cache entry
   */
  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      tags?: string[];
      persist?: boolean;
    } = {}
  ): void {
    const ttl = options.ttl || this.config.defaultTTL;
    const tags = options.tags || [];
    const size = this.calculateSize(data);

    // Check if adding this entry would exceed limits
    if (this.stats.totalSize + size > this.config.maxSize) {
      this.evictLRU(size);
    }

    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
      size
    };

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      const existingEntry = this.cache.get(key)!;
      this.stats.totalSize -= existingEntry.size;
    }

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.totalEntries = this.cache.size;
    this.updateTimestamps();

    // Persist to storage if enabled
    if (this.config.enablePersistence && options.persist !== false) {
      this.persistEntry(key, entry);
    }
  }

  /**
   * Get cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.totalSize -= entry.size;
    this.stats.totalEntries = this.cache.size;
    this.updateTimestamps();

    // Remove from persistent storage
    if (this.config.enablePersistence) {
      this.removePersistentEntry(key);
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalSize = 0;
    this.stats.totalEntries = 0;
    this.updateTimestamps();

    // Clear persistent storage
    if (this.config.enablePersistence) {
      this.clearPersistentStorage();
    }
  }

  /**
   * Invalidate entries by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidated = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.delete(key);
      invalidated++;
    });

    return invalidated;
  }

  /**
   * Get or set with factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
      persist?: boolean;
    } = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, options);
    return data;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Apply new limits
    if (newConfig.maxSize && this.stats.totalSize > newConfig.maxSize) {
      this.evictLRU(this.stats.totalSize - newConfig.maxSize);
    }
    
    if (newConfig.maxEntries && this.cache.size > newConfig.maxEntries) {
      const entriesToRemove = this.cache.size - newConfig.maxEntries;
      for (let i = 0; i < entriesToRemove; i++) {
        this.evictLRU();
      }
    }
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get entries by tag
   */
  getByTag(tag: string): Array<{ key: string; data: any }> {
    const results: Array<{ key: string; data: any }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag) && !this.isExpired(entry)) {
        results.push({ key, data: entry.data });
      }
    }
    
    return results;
  }

  /**
   * Preload data into cache
   */
  async preload<T>(
    entries: Array<{
      key: string;
      factory: () => Promise<T>;
      options?: { ttl?: number; tags?: string[]; persist?: boolean };
    }>
  ): Promise<void> {
    const promises = entries.map(async ({ key, factory, options }) => {
      if (!this.has(key)) {
        try {
          const data = await factory();
          this.set(key, data, options);
        } catch (error) {
          console.warn(`Failed to preload cache entry ${key}:`, error);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Export cache data
   */
  export(): Record<string, any> {
    const exported: Record<string, any> = {};
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        exported[key] = {
          data: entry.data,
          timestamp: entry.timestamp,
          ttl: entry.ttl,
          tags: entry.tags
        };
      }
    }
    
    return exported;
  }

  /**
   * Import cache data
   */
  import(data: Record<string, any>): void {
    for (const [key, entryData] of Object.entries(data)) {
      if (entryData && typeof entryData === 'object') {
        this.set(key, entryData.data, {
          ttl: entryData.ttl,
          tags: entryData.tags
        });
      }
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Calculate size of data
   */
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback for complex objects
      return JSON.stringify(data).length * 2; // Rough estimate
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(targetSize?: number): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    let freedSize = 0;
    const targetToFree = targetSize || 0;
    
    for (const [key, entry] of entries) {
      this.delete(key);
      freedSize += entry.size;
      
      if (targetSize && freedSize >= targetToFree) {
        break;
      }
      
      if (!targetSize) {
        break; // Remove just one entry if no target size
      }
    }
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Update timestamp statistics
   */
  private updateTimestamps(): void {
    if (this.cache.size === 0) {
      this.stats.oldestEntry = 0;
      this.stats.newestEntry = 0;
      return;
    }

    let oldest = Date.now();
    let newest = 0;

    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldest) oldest = entry.timestamp;
      if (entry.timestamp > newest) newest = entry.timestamp;
    }

    this.stats.oldestEntry = oldest;
    this.stats.newestEntry = newest;
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Load cache from persistent storage
   */
  private loadFromPersistentStorage(): void {
    if (!this.config.enablePersistence) return;

    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.config.storagePrefix)
      );

      for (const storageKey of keys) {
        const cacheKey = storageKey.replace(this.config.storagePrefix, '');
        const entryData = localStorage.getItem(storageKey);
        
        if (entryData) {
          const entry = JSON.parse(entryData);
          if (!this.isExpired(entry)) {
            this.cache.set(cacheKey, entry);
            this.stats.totalSize += entry.size;
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      }

      this.stats.totalEntries = this.cache.size;
      this.updateTimestamps();
    } catch (error) {
      console.warn('Failed to load cache from persistent storage:', error);
    }
  }

  /**
   * Persist cache entry to storage
   */
  private persistEntry(key: string, entry: CacheEntry): void {
    try {
      const storageKey = this.config.storagePrefix + key;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  /**
   * Remove persistent cache entry
   */
  private removePersistentEntry(key: string): void {
    try {
      const storageKey = this.config.storagePrefix + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove persistent cache entry:', error);
    }
  }

  /**
   * Clear persistent storage
   */
  private clearPersistentStorage(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.config.storagePrefix)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear persistent storage:', error);
    }
  }

  /**
   * Setup storage event listener for cross-tab synchronization
   */
  private setupStorageEventListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith(this.config.storagePrefix)) {
        const cacheKey = event.key.replace(this.config.storagePrefix, '');
        
        if (event.newValue) {
          // Entry was added/updated
          try {
            const entry = JSON.parse(event.newValue);
            this.cache.set(cacheKey, entry);
          } catch (error) {
            console.warn('Failed to sync cache entry from storage:', error);
          }
        } else {
          // Entry was removed
          this.cache.delete(cacheKey);
        }
        
        this.stats.totalEntries = this.cache.size;
        this.updateTimestamps();
      }
    });
  }
}

export const cacheService = CacheService.getInstance();
export default cacheService;