/**
 * Rate Limiting Service
 * Client-side rate limiting and request throttling
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

interface RequestRecord {
  timestamps: number[];
  blocked: boolean;
  blockedUntil?: number;
}

class RateLimitService {
  private static instance: RateLimitService;
  private requestRecords: Map<string, RequestRecord> = new Map();
  private defaultConfig: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  };

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Check if request is allowed under rate limit
   */
  checkRateLimit(
    endpoint: string, 
    config: Partial<RateLimitConfig> = {}
  ): RateLimitStatus {
    const finalConfig = { ...this.defaultConfig, ...config };
    const identifier = config.identifier || this.getClientIdentifier();
    const key = `${identifier}:${endpoint}`;
    
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;
    
    // Get or create request record
    let record = this.requestRecords.get(key);
    if (!record) {
      record = { timestamps: [], blocked: false };
      this.requestRecords.set(key, record);
    }

    // Check if currently blocked
    if (record.blocked && record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockedUntil,
        retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
      };
    }

    // Clean old timestamps
    record.timestamps = record.timestamps.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (record.timestamps.length >= finalConfig.maxRequests) {
      // Block for the remaining window time
      const oldestRequest = Math.min(...record.timestamps);
      const blockedUntil = oldestRequest + finalConfig.windowMs;
      
      record.blocked = true;
      record.blockedUntil = blockedUntil;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        retryAfter: Math.ceil((blockedUntil - now) / 1000)
      };
    }

    // Request is allowed
    record.timestamps.push(now);
    record.blocked = false;
    record.blockedUntil = undefined;
    
    return {
      allowed: true,
      remaining: finalConfig.maxRequests - record.timestamps.length,
      resetTime: windowStart + finalConfig.windowMs
    };
  }

  /**
   * Record a request attempt
   */
  recordRequest(endpoint: string, identifier?: string): void {
    const key = `${identifier || this.getClientIdentifier()}:${endpoint}`;
    const record = this.requestRecords.get(key);
    
    if (record) {
      record.timestamps.push(Date.now());
    }
  }

  /**
   * Get rate limit status without recording a request
   */
  getRateLimitStatus(
    endpoint: string, 
    config: Partial<RateLimitConfig> = {}
  ): RateLimitStatus {
    const finalConfig = { ...this.defaultConfig, ...config };
    const identifier = config.identifier || this.getClientIdentifier();
    const key = `${identifier}:${endpoint}`;
    
    const now = Date.now();
    const windowStart = now - finalConfig.windowMs;
    
    const record = this.requestRecords.get(key);
    if (!record) {
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        resetTime: now + finalConfig.windowMs
      };
    }

    // Check if currently blocked
    if (record.blocked && record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockedUntil,
        retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
      };
    }

    // Count recent requests
    const recentRequests = record.timestamps.filter(timestamp => timestamp > windowStart);
    
    return {
      allowed: recentRequests.length < finalConfig.maxRequests,
      remaining: Math.max(0, finalConfig.maxRequests - recentRequests.length),
      resetTime: windowStart + finalConfig.windowMs
    };
  }

  /**
   * Clear rate limit for specific endpoint
   */
  clearRateLimit(endpoint: string, identifier?: string): void {
    const key = `${identifier || this.getClientIdentifier()}:${endpoint}`;
    this.requestRecords.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAllRateLimits(): void {
    this.requestRecords.clear();
  }

  /**
   * Get client identifier
   */
  private getClientIdentifier(): string {
    // Use a combination of factors to identify the client
    const factors = [
      navigator.userAgent,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ];
    
    // Simple hash function
    let hash = 0;
    const str = factors.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Cleanup old records
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, record] of this.requestRecords.entries()) {
      // Remove records with no recent activity
      const hasRecentActivity = record.timestamps.some(timestamp => 
        now - timestamp < maxAge
      );
      
      if (!hasRecentActivity && (!record.blockedUntil || now > record.blockedUntil)) {
        this.requestRecords.delete(key);
      }
    }
  }

  /**
   * Get all rate limit statuses
   */
  getAllRateLimitStatuses(): Map<string, RateLimitStatus> {
    const statuses = new Map<string, RateLimitStatus>();
    
    for (const [key] of this.requestRecords.entries()) {
      const [, endpoint] = key.split(':');
      if (endpoint) {
        statuses.set(endpoint, this.getRateLimitStatus(endpoint));
      }
    }
    
    return statuses;
  }

  /**
   * Set default rate limit configuration
   */
  setDefaultConfig(config: Partial<RateLimitConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): RateLimitConfig {
    return { ...this.defaultConfig };
  }
}

// Start cleanup interval
const rateLimitService = RateLimitService.getInstance();

// Cleanup old records every hour
setInterval(() => {
  rateLimitService.cleanup();
}, 60 * 60 * 1000);

export { rateLimitService };
export default rateLimitService;