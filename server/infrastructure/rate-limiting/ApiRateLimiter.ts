import { EnhancedCacheService, CacheFactory } from '../cache/CacheIntegrationAdapter';
import { CacheService } from "../infrastructure/cache"

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string, endpoint: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  headers?: boolean; // Include rate limit headers in response
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  totalRequests: number;
  windowStart: Date;
}

/**
 * Rate limit store entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: Date;
  windowStart: Date;
}

/**
 * Advanced API Rate Limiter with user and global limits
 * Supports both in-memory and Redis backing for distributed rate limiting
 */
export class ApiRateLimiter {
  private static instance: ApiRateLimiter;
  private userLimits = new Map<string, RateLimitEntry>();
  private globalLimits = new Map<string, RateLimitEntry>();
  private endpointLimits = new Map<string, RateLimitEntry>();
  private cache: EnhancedCacheService;
  private defaultConfig: RateLimitConfig;
  
  // Memory management constants
  private readonly MAX_MEMORY_ENTRIES = 10000; // Maximum entries per store
  private readonly MAX_MEMORY_SIZE = 50 * 1024 * 1024; // 50MB max memory usage

  constructor(config: Partial<RateLimitConfig> = {}, cache?: CacheService) {
    this.defaultConfig = {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      keyGenerator: (identifier, endpoint) => `${identifier}:${endpoint}`,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests, please try again later',
      statusCode: 429,
      headers: true,
      ...config
    };
    
    // Use enhanced cache service optimized for rate limiting
    this.cache = cache instanceof EnhancedCacheService 
      ? cache 
      : CacheFactory.createDomainCache('rate-limiting', {
          l1MaxItems: 10000, // Rate limiting needs fast access to many keys
          l1DefaultTtl: this.defaultConfig.windowMs,
          l2DefaultTtl: Math.floor(this.defaultConfig.windowMs / 1000),
          l2KeyPrefix: 'rate_limit:',
          enablePreFetching: false, // Don't pre-fetch rate limit data
          enableStampedeProtection: false // Rate limiting should be immediate
        });

    // Clean up expired entries periodically
    setInterval(() => this.cleanupExpiredEntries(), 60000); // Every minute
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<RateLimitConfig>, cache?: CacheService): ApiRateLimiter {
    if (!ApiRateLimiter.instance) {
      ApiRateLimiter.instance = new ApiRateLimiter(config, cache);
    }
    return ApiRateLimiter.instance;
  }

  /**
   * Check rate limit for user
   */
  async checkUserRateLimit(
    userId: number,
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    // Input validation
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID for rate limiting');
    }
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint for rate limiting');
    }
    
    // Sanitize endpoint to prevent injection
    const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
    
    const finalConfig = { ...this.defaultConfig, ...config };
    const keyGenerator = finalConfig.keyGenerator || this.defaultConfig.keyGenerator;
    if (!keyGenerator) {
      throw new Error('Key generator is required for rate limiting');
    }
    const key = keyGenerator(userId.toString(), sanitizedEndpoint);
    
    return this.checkRateLimit(key, finalConfig, 'user');
  }

  /**
   * Check global rate limit
   */
  async checkGlobalRateLimit(
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    // Input validation
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint for rate limiting');
    }
    
    const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = `global:${sanitizedEndpoint}`;
    
    return this.checkRateLimit(key, finalConfig, 'global');
  }

  /**
   * Check endpoint-specific rate limit
   */
  async checkEndpointRateLimit(
    endpoint: string,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    // Input validation
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint for rate limiting');
    }
    
    const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = `endpoint:${sanitizedEndpoint}`;
    
    return this.checkRateLimit(key, finalConfig, 'endpoint');
  }

  /**
   * Check combined rate limits (user + global + endpoint)
   */
  async checkCombinedRateLimits(
    userId: number,
    endpoint: string,
    configs?: {
      user?: Partial<RateLimitConfig>;
      global?: Partial<RateLimitConfig>;
      endpoint?: Partial<RateLimitConfig>;
    }
  ): Promise<{
    user: RateLimitResult;
    global: RateLimitResult;
    endpoint: RateLimitResult;
    allowed: boolean;
    mostRestrictive: 'user' | 'global' | 'endpoint';
  }> {
    const [userResult, globalResult, endpointResult] = await Promise.all([
      this.checkUserRateLimit(userId, endpoint, configs?.user),
      this.checkGlobalRateLimit(endpoint, configs?.global),
      this.checkEndpointRateLimit(endpoint, configs?.endpoint)
    ]);

    // Determine which limit is most restrictive
    let mostRestrictive: 'user' | 'global' | 'endpoint' = 'user';
    let minRemaining = userResult.remaining;

    if (globalResult.remaining < minRemaining) {
      mostRestrictive = 'global';
      minRemaining = globalResult.remaining;
    }

    if (endpointResult.remaining < minRemaining) {
      mostRestrictive = 'endpoint';
    }

    return {
      user: userResult,
      global: globalResult,
      endpoint: endpointResult,
      allowed: userResult.allowed && globalResult.allowed && endpointResult.allowed,
      mostRestrictive
    };
  }

  /**
   * Increment rate limit counter
   */
  async incrementRateLimit(
    userId: number,
    endpoint: string,
    success: boolean = true
  ): Promise<void> {
    // Input validation
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID for rate limiting');
    }
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint for rate limiting');
    }
    
    const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
    const {keyGenerator} = this.defaultConfig;
    if (!keyGenerator) {
      throw new Error('Key generator is required for rate limiting');
    }
    
    const userKey = keyGenerator(userId.toString(), sanitizedEndpoint);
    const globalKey = `global:${sanitizedEndpoint}`;
    const endpointKey = `endpoint:${sanitizedEndpoint}`;

    // Only increment if we should count this request
    const shouldCount = success ? 
      !this.defaultConfig.skipSuccessfulRequests : 
      !this.defaultConfig.skipFailedRequests;

    if (shouldCount) {
      await Promise.all([
        this.incrementCounter(userKey, 'user'),
        this.incrementCounter(globalKey, 'global'),
        this.incrementCounter(endpointKey, 'endpoint')
      ]);
    }
  }

  /**
   * Reset rate limit for specific key
   */
  async resetRateLimit(userId: number, endpoint: string): Promise<void> {
    // Input validation
    if (!userId || userId <= 0) {
      throw new Error('Invalid user ID for rate limiting');
    }
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint for rate limiting');
    }
    
    const sanitizedEndpoint = this.sanitizeEndpoint(endpoint);
    const {keyGenerator} = this.defaultConfig;
    if (!keyGenerator) {
      throw new Error('Key generator is required for rate limiting');
    }
    
    const userKey = keyGenerator(userId.toString(), sanitizedEndpoint);
    const globalKey = `global:${sanitizedEndpoint}`;
    const endpointKey = `endpoint:${sanitizedEndpoint}`;

    // Clear from memory
    this.userLimits.delete(userKey);
    this.globalLimits.delete(globalKey);
    this.endpointLimits.delete(endpointKey);

    // Clear from unified cache
    await Promise.all([
      this.cache.delete(`user:${userKey}`),
      this.cache.delete(`global:${globalKey}`),
      this.cache.delete(`endpoint:${endpointKey}`)
    ]);
  }

  /**
   * Get rate limit statistics
   */
  getStats(): {
    userLimits: number;
    globalLimits: number;
    endpointLimits: number;
    memoryUsage: number;
  } {
    return {
      userLimits: this.userLimits.size,
      globalLimits: this.globalLimits.size,
      endpointLimits: this.endpointLimits.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Get rate limit configuration for endpoint
   */
  getEndpointConfig(endpoint: string): RateLimitConfig {
    // Define endpoint-specific configurations
    const endpointConfigs: Record<string, Partial<RateLimitConfig>> = {
      '/api/auth/login': {
        windowMs: 900000, // 15 minutes
        maxRequests: 5, // 5 login attempts per 15 minutes
        message: 'Too many login attempts, please try again later'
      },
      '/api/auth/register': {
        windowMs: 3600000, // 1 hour
        maxRequests: 3, // 3 registration attempts per hour
        message: 'Too many registration attempts, please try again later'
      },
      '/api/professionals/search': {
        windowMs: 60000, // 1 minute
        maxRequests: 30, // 30 searches per minute
        message: 'Too many search requests, please slow down'
      },
      '/api/analytics/events': {
        windowMs: 60000, // 1 minute
        maxRequests: 100, // 100 events per minute
        message: 'Too many analytics events, please batch your requests'
      },
      '/api/fraud-intelligence/report': {
        windowMs: 3600000, // 1 hour
        maxRequests: 10, // 10 fraud reports per hour
        message: 'Too many fraud reports, please try again later'
      }
    };

    const specificConfig = endpointConfigs[endpoint] || {};
    return { ...this.defaultConfig, ...specificConfig };
  }

  // Private methods

  /**
   * Sanitize endpoint to prevent injection attacks
   */
  private sanitizeEndpoint(endpoint: string): string {
    // Remove any potentially dangerous characters and normalize
    return endpoint
      .replace(/[^\w\-\/\.:]/g, '') // Only allow word chars, hyphens, slashes, dots, colons
      .substring(0, 200) // Limit length to prevent memory issues
      .toLowerCase();
  }

  private async checkRateLimit(
    key: string,
    config: RateLimitConfig,
    type: 'user' | 'global' | 'endpoint'
  ): Promise<RateLimitResult> {
    const now = new Date();
    let entry = await this.getEntry(key, type);

    // Check if window has expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: new Date(now.getTime() + config.windowMs),
        windowStart: now
      };
      await this.setEntry(key, entry, type);
    }

    const allowed = entry.count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      totalRequests: entry.count,
      windowStart: entry.windowStart
    };
  }

  private async incrementCounter(key: string, type: 'user' | 'global' | 'endpoint'): Promise<void> {
    let entry = await this.getEntry(key, type);
    if (!entry) {
      // Create new entry if it doesn't exist
      const now = new Date();
      entry = {
        count: 0,
        resetTime: new Date(now.getTime() + this.defaultConfig.windowMs),
        windowStart: now
      };
    }
    
    entry.count++;
    await this.setEntry(key, entry, type);
  }

  private async getEntry(key: string, type: 'user' | 'global' | 'endpoint'): Promise<RateLimitEntry | null> {
    // Try memory first
    const memoryStore = this.getMemoryStore(type);
    let entry = memoryStore.get(key);

    if (entry) {
      return entry;
    }

    // Try unified cache
    try {
      const cacheKey = `${type}:${key}`;
      const cached = await this.cache.get(cacheKey);
      if (cached && typeof cached === 'object' && cached !== null) {
        // Validate cached data structure to prevent object injection
        const cachedData = cached as any;
        if (typeof cachedData.count === 'number' && 
            typeof cachedData.resetTime === 'string' && 
            typeof cachedData.windowStart === 'string') {
          entry = {
            count: cachedData.count,
            resetTime: new Date(cachedData.resetTime),
            windowStart: new Date(cachedData.windowStart)
          };
        }
        // Store in memory for faster access
        if (entry) {
          memoryStore.set(key, entry);
        }
        return entry;
      }
    } catch (error) {
      console.warn('Unified cache rate limit lookup failed:', error);
    }

    return null;
  }

  private async setEntry(key: string, entry: RateLimitEntry, type: 'user' | 'global' | 'endpoint'): Promise<void> {
    // Store in memory with bounds checking
    const memoryStore = this.getMemoryStore(type);
    
    // Check memory limits before adding new entries
    if (!memoryStore.has(key)) {
      if (memoryStore.size >= this.MAX_MEMORY_ENTRIES) {
        // Remove oldest entries if we're at the limit
        this.evictOldestEntries(memoryStore, Math.floor(this.MAX_MEMORY_ENTRIES * 0.1));
      }
      
      // Check total memory usage
      if (this.estimateMemoryUsage() > this.MAX_MEMORY_SIZE) {
        // Force cleanup of expired entries
        this.cleanupExpiredEntries();
      }
    }
    
    memoryStore.set(key, entry);

    // Store in unified cache
    try {
      const cacheKey = `${type}:${key}`;
      const ttl = Math.ceil((entry.resetTime.getTime() - Date.now()) / 1000);
      await this.cache.setWithTags(cacheKey, {
        count: entry.count,
        resetTime: entry.resetTime.toISOString(),
        windowStart: entry.windowStart.toISOString()
      }, ['rate-limiting', type], { ttl });
    } catch (error) {
      console.warn('Unified cache rate limit storage failed:', error);
    }
  }

  private getMemoryStore(type: 'user' | 'global' | 'endpoint'): Map<string, RateLimitEntry> {
    switch (type) {
      case 'user': return this.userLimits;
      case 'global': return this.globalLimits;
      case 'endpoint': return this.endpointLimits;
    }
  }

  private cleanupExpiredEntries(): void {
    const now = new Date();
    
    // Clean up all memory stores
    [this.userLimits, this.globalLimits, this.endpointLimits].forEach(store => {
      for (const [key, entry] of store.entries()) {
        if (now >= entry.resetTime) {
          store.delete(key);
        }
      }
    });
  }

  /**
   * Evict oldest entries from memory store when limit is reached
   */
  private evictOldestEntries(store: Map<string, RateLimitEntry>, count: number): void {
    const entries = Array.from(store.entries());
    // Sort by window start time (oldest first)
    entries.sort((a, b) => a[1].windowStart.getTime() - b[1].windowStart.getTime());
    
    // Remove the oldest entries
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      store.delete(entries[i][0]);
    }
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    
    [this.userLimits, this.globalLimits, this.endpointLimits].forEach(store => {
      for (const [key, entry] of store.entries()) {
        size += key.length * 2; // UTF-16 encoding
        size += 100; // Overhead for entry object
      }
    });
    
    return size;
  }
}

/**
 * Default instance for easy access
 */
export const apiRateLimiter = ApiRateLimiter.getInstance();