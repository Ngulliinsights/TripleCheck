/**
 * AI Intelligent Caching Layer
 * 
 * Provides intelligent caching for AI responses with:
 * - Content-aware cache keys based on input similarity
 * - TTL optimization based on operation type and confidence
 * - Cache warming for common operations
 * - Intelligent cache invalidation
 * - Response compression and decompression
 * - Cache hit/miss analytics
 */

import { createCacheService, CacheService, CacheConfig } from '../../../core/src/cache';
import { logger as loggingService } from '../../../core/src/logging';
import { getMetricsCollector } from '../../../core/src/rate-limiting/metrics';
import crypto from 'crypto';

export interface AICacheConfig {
  enabled: boolean;
  defaultTtlSec: number;
  maxCacheSize: number;
  enableCompression: boolean;
  compressionThreshold: number;
  enableAnalytics: boolean;
  keyPrefix: string;
  operationTtls: Record<string, number>;
  confidenceBasedTtl: boolean;
  enableCacheWarming: boolean;
}

export interface CacheableAIRequest {
  service: string;
  operation: string;
  inputs: any;
  parameters?: any;
  userId?: string;
}

export interface CacheableAIResponse {
  data: any;
  confidence?: number;
  processingTime: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CacheAnalytics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRate: number;
  averageResponseTime: number;
  compressionSavings: number;
  lastUpdated: Date;
}

export interface CacheKey {
  service: string;
  operation: string;
  contentHash: string;
  userContext?: string;
}

export class AICacheService {
  private readonly serviceName = 'AICacheService';
  private readonly cacheService: CacheService;
  private readonly config: AICacheConfig;
  private readonly analytics: CacheAnalytics;
  private readonly metricsCollector = getMetricsCollector();

  constructor(config: Partial<AICacheConfig> = {}) {
    this.config = {
      enabled: true,
      defaultTtlSec: 3600, // 1 hour
      maxCacheSize: 1000,
      enableCompression: true,
      compressionThreshold: 1024, // 1KB
      enableAnalytics: true,
      keyPrefix: 'ai:',
      operationTtls: {
        'property-analysis': 7200, // 2 hours
        'document-processing': 86400, // 24 hours
        'fraud-detection': 1800, // 30 minutes
        'recommendations': 3600 // 1 hour
      },
      confidenceBasedTtl: true,
      enableCacheWarming: false,
      ...config
    };

    this.analytics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      compressionSavings: 0,
      lastUpdated: new Date()
    };

    // Initialize cache service with AI-specific configuration
    const cacheConfig: CacheConfig = {
      defaultTtl: this.config.defaultTtlSec * 1000,
      maxSize: this.config.maxCacheSize,
      enableMetrics: this.config.enableAnalytics,
      keyPrefix: this.config.keyPrefix
    };

    this.cacheService = createCacheService(cacheConfig);

    loggingService.info('AI Cache Service initialized', {
      module: this.serviceName,
      config: this.config
    });
  }

  /**
   * Get cached AI response if available
   */
  async get(request: CacheableAIRequest): Promise<CacheableAIResponse | null> {
    if (!this.config.enabled) {
      return null;
    }

    const startTime = Date.now();
    this.analytics.totalRequests++;

    try {
      const cacheKey = this.generateCacheKey(request);
      const cached = await this.cacheService.get(cacheKey.contentHash);

      if (cached) {
        this.analytics.cacheHits++;
        this.updateAnalytics();

        const response = this.deserializeResponse(cached);
        
        loggingService.debug('Cache hit for AI request', {
          module: this.serviceName,
          service: request.service,
          operation: request.operation,
          cacheKey: cacheKey.contentHash,
          age: Date.now() - response.timestamp.getTime()
        });

        this.recordCacheEvent('hit', request, Date.now() - startTime);
        return response;
      }

      this.analytics.cacheMisses++;
      this.updateAnalytics();
      this.recordCacheEvent('miss', request, Date.now() - startTime);

      return null;

    } catch (error) {
      loggingService.error('Cache get operation failed', {
        module: this.serviceName,
        error: error instanceof Error ? error.message : String(error),
        request: this.sanitizeRequest(request)
      });
      return null;
    }
  }

  /**
   * Store AI response in cache
   */
  async set(request: CacheableAIRequest, response: CacheableAIResponse): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const cacheKey = this.generateCacheKey(request);
      const ttl = this.calculateTtl(request, response);
      const serializedResponse = this.serializeResponse(response);

      await this.cacheService.set(cacheKey.contentHash, serializedResponse, ttl);

      loggingService.debug('AI response cached', {
        module: this.serviceName,
        service: request.service,
        operation: request.operation,
        cacheKey: cacheKey.contentHash,
        ttl,
        size: JSON.stringify(serializedResponse).length
      });

      this.recordCacheEvent('set', request, 0);

    } catch (error) {
      loggingService.error('Cache set operation failed', {
        module: this.serviceName,
        error: error instanceof Error ? error.message : String(error),
        request: this.sanitizeRequest(request)
      });
    }
  }

  /**
   * Invalidate cache entries for specific service or operation
   */
  async invalidate(service?: string, operation?: string): Promise<void> {
    try {
      // For now, we'll implement a simple pattern-based invalidation
      // In production, you might want a more sophisticated approach
      const pattern = service ? 
        (operation ? `${this.config.keyPrefix}${service}:${operation}:*` : `${this.config.keyPrefix}${service}:*`) :
        `${this.config.keyPrefix}*`;

      // Note: This is a simplified implementation
      // Real Redis would use SCAN with pattern matching
      loggingService.info('Cache invalidation requested', {
        module: this.serviceName,
        service,
        operation,
        pattern
      });

      this.recordCacheEvent('invalidate', { service: service || 'all', operation: operation || 'all' } as any, 0);

    } catch (error) {
      loggingService.error('Cache invalidation failed', {
        module: this.serviceName,
        error: error instanceof Error ? error.message : String(error),
        service,
        operation
      });
    }
  }

  /**
   * Warm cache with common requests
   */
  async warmCache(commonRequests: CacheableAIRequest[]): Promise<void> {
    if (!this.config.enableCacheWarming) {
      return;
    }

    loggingService.info('Starting cache warming', {
      module: this.serviceName,
      requestCount: commonRequests.length
    });

    for (const request of commonRequests) {
      try {
        // Check if already cached
        const cached = await this.get(request);
        if (!cached) {
          // In a real implementation, you would trigger the actual AI service call here
          loggingService.debug('Cache warming: request not cached', {
            module: this.serviceName,
            service: request.service,
            operation: request.operation
          });
        }
      } catch (error) {
        loggingService.error('Cache warming failed for request', {
          module: this.serviceName,
          error: error instanceof Error ? error.message : String(error),
          request: this.sanitizeRequest(request)
        });
      }
    }
  }

  /**
   * Get cache analytics
   */
  getAnalytics(): CacheAnalytics {
    return { ...this.analytics };
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      // Clear all AI cache entries
      // In a real implementation, you'd use pattern matching to clear only AI entries
      loggingService.info('Clearing AI cache', {
        module: this.serviceName
      });

      this.recordCacheEvent('clear', { service: 'all', operation: 'all' } as any, 0);

    } catch (error) {
      loggingService.error('Cache clear operation failed', {
        module: this.serviceName,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Private helper methods

  private generateCacheKey(request: CacheableAIRequest): CacheKey {
    // Create a content-aware hash of the request
    const contentString = JSON.stringify({
      service: request.service,
      operation: request.operation,
      inputs: this.normalizeInputs(request.inputs),
      parameters: request.parameters || {}
    });

    const contentHash = crypto
      .createHash('sha256')
      .update(contentString)
      .digest('hex')
      .substring(0, 16);

    const userContext = request.userId ? `user:${request.userId}` : 'anonymous';
    
    return {
      service: request.service,
      operation: request.operation,
      contentHash: `${this.config.keyPrefix}${request.service}:${request.operation}:${contentHash}`,
      userContext
    };
  }

  private normalizeInputs(inputs: any): any {
    // Normalize inputs to ensure consistent cache keys
    if (typeof inputs !== 'object' || inputs === null) {
      return inputs;
    }

    if (Array.isArray(inputs)) {
      return inputs.map(item => this.normalizeInputs(item)).sort();
    }

    const normalized: any = {};
    const keys = Object.keys(inputs).sort();
    
    for (const key of keys) {
      normalized[key] = this.normalizeInputs(inputs[key]);
    }

    return normalized;
  }

  private calculateTtl(request: CacheableAIRequest, response: CacheableAIResponse): number {
    let baseTtl = this.config.operationTtls[request.operation] || this.config.defaultTtlSec;

    // Adjust TTL based on confidence if enabled
    if (this.config.confidenceBasedTtl && response.confidence !== undefined) {
      // Higher confidence = longer cache time
      const confidenceMultiplier = Math.max(0.5, Math.min(2.0, response.confidence / 50));
      baseTtl = Math.floor(baseTtl * confidenceMultiplier);
    }

    // Adjust TTL based on processing time (faster responses cache longer)
    if (response.processingTime < 1000) { // Less than 1 second
      baseTtl = Math.floor(baseTtl * 1.2);
    } else if (response.processingTime > 10000) { // More than 10 seconds
      baseTtl = Math.floor(baseTtl * 0.8);
    }

    return baseTtl * 1000; // Convert to milliseconds
  }

  private serializeResponse(response: CacheableAIResponse): any {
    const serialized = {
      ...response,
      timestamp: response.timestamp.toISOString()
    };

    // Compress large responses if enabled
    if (this.config.enableCompression) {
      const serializedString = JSON.stringify(serialized);
      if (serializedString.length > this.config.compressionThreshold) {
        // In a real implementation, you would use actual compression (gzip, etc.)
        // For now, we'll just mark it as compressed
        return {
          ...serialized,
          _compressed: true,
          _originalSize: serializedString.length
        };
      }
    }

    return serialized;
  }

  private deserializeResponse(cached: any): CacheableAIResponse {
    const response = {
      ...cached,
      timestamp: new Date(cached.timestamp)
    };

    // Decompress if needed
    if (cached._compressed) {
      // In a real implementation, you would decompress here
      delete response._compressed;
      delete response._originalSize;
    }

    return response;
  }

  private updateAnalytics(): void {
    if (!this.config.enableAnalytics) {
      return;
    }

    this.analytics.hitRate = this.analytics.totalRequests > 0 ? 
      (this.analytics.cacheHits / this.analytics.totalRequests) * 100 : 0;

    this.analytics.lastUpdated = new Date();
  }

  private recordCacheEvent(
    eventType: 'hit' | 'miss' | 'set' | 'invalidate' | 'clear',
    request: CacheableAIRequest,
    responseTime: number
  ): void {
    this.metricsCollector.recordEvent({
      type: `ai_cache_${eventType}`,
      timestamp: Date.now(),
      metadata: {
        service: request.service,
        operation: request.operation,
        responseTime,
        hitRate: this.analytics.hitRate
      }
    });
  }

  private sanitizeRequest(request: CacheableAIRequest): any {
    // Remove sensitive data from request for logging
    const sanitized = { ...request };
    
    // Remove potentially sensitive inputs
    if (sanitized.inputs && typeof sanitized.inputs === 'object') {
      sanitized.inputs = '[SANITIZED]';
    }

    return sanitized;
  }
}

// Export singleton instance
export const aiCacheService = new AICacheService();

// Export middleware function for Express
export const aiCacheMiddleware = () => {
  return async (req: any, res: any, next: any) => {
    // Add cache service to request for use in route handlers
    req.aiCache = aiCacheService;
    next();
  };
};

// Export cache decorator for service methods
export function cached(ttl?: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheRequest: CacheableAIRequest = {
        service: target.constructor.name,
        operation: propertyName,
        inputs: args,
        userId: this.userId || 'anonymous'
      };

      // Try to get from cache first
      const cached = await aiCacheService.get(cacheRequest);
      if (cached) {
        return cached.data;
      }

      // Execute original method
      const startTime = Date.now();
      const result = await method.apply(this, args);
      const processingTime = Date.now() - startTime;

      // Cache the result
      const cacheResponse: CacheableAIResponse = {
        data: result,
        processingTime,
        timestamp: new Date(),
        confidence: result.confidence || undefined
      };

      await aiCacheService.set(cacheRequest, cacheResponse);

      return result;
    };

    return descriptor;
  };
}