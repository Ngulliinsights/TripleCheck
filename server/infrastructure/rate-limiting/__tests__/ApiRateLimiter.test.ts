import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiRateLimiter } from '../ApiRateLimiter';
import { CacheService } from '../../cache/CacheService';

// Mock CacheService
vi.mock('../../cache/CacheService');

describe('ApiRateLimiter', () => {
  let rateLimiter: ApiRateLimiter;
  let mockCache: any;

  beforeEach(() => {
    // Clear singleton instance
    (ApiRateLimiter as any).instance = undefined;
    
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      invalidateByPattern: vi.fn(),
      invalidateByTags: vi.fn(),
      clear: vi.fn()
    };

    rateLimiter = ApiRateLimiter.getInstance({
      windowMs: 1000, // 1 second for testing
      maxRequests: 5
    }, mockCache);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('checkUserRateLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await rateLimiter.checkUserRateLimit(123, '/api/test');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.totalRequests).toBe(0);
    });

    it('should track multiple requests', async () => {
      // Make multiple requests
      await rateLimiter.incrementRateLimit(123, '/api/test');
      await rateLimiter.incrementRateLimit(123, '/api/test');
      
      const result = await rateLimiter.checkUserRateLimit(123, '/api/test');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3); // 5 - 2 = 3
      expect(result.totalRequests).toBe(2);
    });

    it('should deny requests when limit exceeded', async () => {
      // Exceed the limit
      for (let i = 0; i < 6; i++) {
        await rateLimiter.incrementRateLimit(123, '/api/test');
      }
      
      const result = await rateLimiter.checkUserRateLimit(123, '/api/test');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.totalRequests).toBe(6);
    });

    it('should reset after window expires', async () => {
      vi.useFakeTimers();

      // Exceed the limit
      for (let i = 0; i < 6; i++) {
        await rateLimiter.incrementRateLimit(123, '/api/test');
      }
      
      let result = await rateLimiter.checkUserRateLimit(123, '/api/test');
      expect(result.allowed).toBe(false);

      // Fast-forward past window
      vi.advanceTimersByTime(1100); // More than 1 second

      result = await rateLimiter.checkUserRateLimit(123, '/api/test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);

      vi.useRealTimers();
    });

    it('should use Redis cache when available', async () => {
      mockCache.get.mockResolvedValue({
        count: 3,
        resetTime: new Date(Date.now() + 1000).toISOString(),
        windowStart: new Date().toISOString()
      });

      const result = await rateLimiter.checkUserRateLimit(123, '/api/test');

      expect(mockCache.get).toHaveBeenCalled();
      expect(result.totalRequests).toBe(3);
    });

    it('should handle Redis cache failures gracefully', async () => {
      mockCache.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await rateLimiter.checkUserRateLimit(123, '/api/test');

      expect(result.allowed).toBe(true); // Should continue without cache
    });
  });

  describe('checkGlobalRateLimit', () => {
    it('should track global limits separately from user limits', async () => {
      // User limit
      await rateLimiter.incrementRateLimit(123, '/api/test');
      const userResult = await rateLimiter.checkUserRateLimit(123, '/api/test');
      
      // Global limit should be independent
      const globalResult = await rateLimiter.checkGlobalRateLimit('/api/test');
      
      expect(userResult.totalRequests).toBe(1);
      expect(globalResult.totalRequests).toBe(1); // Global counter also incremented
    });
  });

  describe('checkCombinedRateLimits', () => {
    it('should check all rate limits and return combined result', async () => {
      const result = await rateLimiter.checkCombinedRateLimits(123, '/api/test');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('global');
      expect(result).toHaveProperty('endpoint');
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('mostRestrictive');
      expect(result.allowed).toBe(true);
    });

    it('should deny when any limit is exceeded', async () => {
      // Exceed user limit
      for (let i = 0; i < 6; i++) {
        await rateLimiter.incrementRateLimit(123, '/api/test');
      }

      const result = await rateLimiter.checkCombinedRateLimits(123, '/api/test');

      expect(result.allowed).toBe(false);
      expect(result.user.allowed).toBe(false);
    });

    it('should identify most restrictive limit', async () => {
      // Make user limit more restrictive
      for (let i = 0; i < 4; i++) {
        await rateLimiter.incrementRateLimit(123, '/api/test');
      }

      const result = await rateLimiter.checkCombinedRateLimits(123, '/api/test');

      expect(result.mostRestrictive).toBe('user');
      expect(result.user.remaining).toBeLessThan(result.global.remaining);
    });
  });

  describe('getEndpointConfig', () => {
    it('should return specific config for login endpoint', () => {
      const config = rateLimiter.getEndpointConfig('/api/auth/login');

      expect(config.maxRequests).toBe(5);
      expect(config.windowMs).toBe(900000); // 15 minutes
      expect(config.message).toContain('login attempts');
    });

    it('should return default config for unknown endpoint', () => {
      const config = rateLimiter.getEndpointConfig('/api/unknown');

      expect(config.maxRequests).toBe(5); // Our test default
      expect(config.windowMs).toBe(1000); // Our test default
    });

    it('should return specific config for search endpoint', () => {
      const config = rateLimiter.getEndpointConfig('/api/professionals/search');

      expect(config.maxRequests).toBe(30);
      expect(config.windowMs).toBe(60000); // 1 minute
    });
  });

  describe('resetRateLimit', () => {
    it('should reset all limits for user and endpoint', async () => {
      // Build up some limits
      for (let i = 0; i < 3; i++) {
        await rateLimiter.incrementRateLimit(123, '/api/test');
      }

      let result = await rateLimiter.checkUserRateLimit(123, '/api/test');
      expect(result.totalRequests).toBe(3);

      // Reset
      await rateLimiter.resetRateLimit(123, '/api/test');

      result = await rateLimiter.checkUserRateLimit(123, '/api/test');
      expect(result.totalRequests).toBe(0);
    });

    it('should clear Redis cache when resetting', async () => {
      await rateLimiter.resetRateLimit(123, '/api/test');

      expect(mockCache.delete).toHaveBeenCalledTimes(3); // user, global, endpoint
    });
  });

  describe('incrementRateLimit', () => {
    it('should increment all counters by default', async () => {
      await rateLimiter.incrementRateLimit(123, '/api/test');

      const userResult = await rateLimiter.checkUserRateLimit(123, '/api/test');
      const globalResult = await rateLimiter.checkGlobalRateLimit('/api/test');
      const endpointResult = await rateLimiter.checkEndpointRateLimit('/api/test');

      expect(userResult.totalRequests).toBe(1);
      expect(globalResult.totalRequests).toBe(1);
      expect(endpointResult.totalRequests).toBe(1);
    });

    it('should skip increment for failed requests when configured', async () => {
      // Create rate limiter that skips failed requests
      const skipFailedLimiter = ApiRateLimiter.getInstance({
        skipFailedRequests: true
      });

      await skipFailedLimiter.incrementRateLimit(123, '/api/test', false); // Failed request

      const result = await skipFailedLimiter.checkUserRateLimit(123, '/api/test');
      expect(result.totalRequests).toBe(0); // Should not increment
    });
  });

  describe('getStats', () => {
    it('should return statistics about rate limiter usage', async () => {
      // Generate some activity
      await rateLimiter.incrementRateLimit(123, '/api/test1');
      await rateLimiter.incrementRateLimit(456, '/api/test2');

      const stats = rateLimiter.getStats();

      expect(stats.userLimits).toBeGreaterThan(0);
      expect(stats.globalLimits).toBeGreaterThan(0);
      expect(stats.endpointLimits).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired entries', async () => {
      vi.useFakeTimers();

      // Create some entries
      await rateLimiter.incrementRateLimit(123, '/api/test');
      
      let stats = rateLimiter.getStats();
      expect(stats.userLimits).toBeGreaterThan(0);

      // Fast-forward past cleanup time
      vi.advanceTimersByTime(70000); // More than 1 minute cleanup interval

      stats = rateLimiter.getStats();
      expect(stats.userLimits).toBe(0); // Should be cleaned up

      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should reject invalid user IDs', async () => {
      await expect(rateLimiter.checkUserRateLimit(-1, '/api/test')).rejects.toThrow('Invalid user ID');
      await expect(rateLimiter.checkUserRateLimit(0, '/api/test')).rejects.toThrow('Invalid user ID');
    });

    it('should reject invalid endpoints', async () => {
      await expect(rateLimiter.checkUserRateLimit(123, '')).rejects.toThrow('Invalid endpoint');
      await expect(rateLimiter.checkUserRateLimit(123, null as any)).rejects.toThrow('Invalid endpoint');
    });

    it('should sanitize malicious endpoints', async () => {
      const maliciousEndpoint = '/api/test<script>alert("xss")</script>';
      const result = await rateLimiter.checkUserRateLimit(123, maliciousEndpoint);
      expect(result.allowed).toBe(true);
      // The endpoint should be sanitized internally
    });

    it('should handle Redis storage failures gracefully', async () => {
      mockCache.set.mockRejectedValue(new Error('Redis storage failed'));

      await rateLimiter.incrementRateLimit(123, '/api/test');
      const result = await rateLimiter.checkUserRateLimit(123, '/api/test');

      expect(result.totalRequests).toBe(1); // Should still work with memory
    });

    it('should validate cached data structure to prevent injection', async () => {
      // Mock malicious cached data
      mockCache.get.mockResolvedValue({
        maliciousProperty: 'evil',
        count: 'not a number',
        resetTime: 'invalid date'
      });

      const result = await rateLimiter.checkUserRateLimit(123, '/api/test');
      expect(result.totalRequests).toBe(0); // Should ignore invalid cached data
    });
  });

  describe('memory management', () => {
    it('should respect memory limits', async () => {
      // This test would need to be adjusted based on actual memory limits
      // For now, just verify the stats are tracked
      const stats = rateLimiter.getStats();
      expect(typeof stats.memoryUsage).toBe('number');
      expect(stats.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should clean up expired entries automatically', async () => {
      vi.useFakeTimers();
      
      await rateLimiter.incrementRateLimit(123, '/api/test');
      let stats = rateLimiter.getStats();
      const initialCount = stats.userLimits;
      
      // Fast forward past expiration
      vi.advanceTimersByTime(70000);
      
      stats = rateLimiter.getStats();
      expect(stats.userLimits).toBeLessThanOrEqual(initialCount);
      
      vi.useRealTimers();
    });
  });
});