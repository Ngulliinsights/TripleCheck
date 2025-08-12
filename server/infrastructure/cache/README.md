# Unified Cache System

A comprehensive multi-level caching solution that consolidates existing cache implementations into a unified L1/L2 architecture with intelligent warming strategies and performance monitoring.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│                 Cache Integration Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ CacheService    │  │ RequestDedup    │  │ RateLimit   │ │
│  │ Adapter         │  │ Integration     │  │ Integration │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                 Unified Cache Manager                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ L1 Cache (In-Memory LRU)                               │ │
│  │ • 10K items max                                        │ │
│  │ • 5min default TTL                                     │ │
│  │ • 50MB memory limit                                    │ │
│  │ • Tag-based invalidation                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ L2 Cache (Redis)                                       │ │
│  │ • 1hr default TTL                                      │ │
│  │ • Distributed caching                                  │ │
│  │ • Persistence across restarts                          │ │
│  │ • Cross-instance sharing                               │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Support Systems                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Cache Warming   │  │ Performance     │  │ Stampede    │ │
│  │ Strategies      │  │ Monitoring      │  │ Protection  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 🚀 Multi-Level Architecture
- **L1 Cache**: Ultra-fast in-memory LRU cache for frequently accessed data
- **L2 Cache**: Redis-based distributed cache for persistence and sharing
- **Automatic Fallback**: Seamless fallback from L1 to L2 to source

### 🏷️ Tag-Based Invalidation
- Invalidate related data efficiently using tags
- Supports complex dependency relationships
- Prevents stale data across related entities

### 🛡️ Stampede Protection
- Prevents multiple concurrent requests for the same data
- Uses distributed locking for coordination
- Configurable timeout and retry logic

### 🔥 Intelligent Warming
- Pre-fetches data based on access patterns
- Multiple warming strategies (access, schedule, invalidation)
- Configurable warming priorities and conditions

### 📊 Performance Monitoring
- Real-time metrics collection
- Hit rate optimization recommendations
- Memory usage tracking and alerts

### 🔄 Backward Compatibility
- Drop-in replacement for existing cache implementations
- Gradual migration support
- Maintains existing APIs

## Quick Start

### Basic Usage

```typescript
import { unifiedCacheManager } from './infrastructure/cache';

// Simple get/set operations
await unifiedCacheManager.set('user:123', userData, {
  l1Ttl: 5 * 60 * 1000, // 5 minutes in L1
  l2Ttl: 3600,           // 1 hour in L2
  tags: ['user', 'profile']
});

const result = await unifiedCacheManager.get('user:123');
if (result.hit) {
  console.log('Cache hit from:', result.source); // 'l1' or 'l2'
  console.log('Data:', result.value);
}
```

### Cache-Aside Pattern with Stampede Protection

```typescript
const userData = await unifiedCacheManager.getOrSet(
  'user:123',
  async () => {
    // This factory function is only called on cache miss
    return await fetchUserFromDatabase(123);
  },
  {
    l1Ttl: 5 * 60 * 1000,
    l2Ttl: 3600,
    tags: ['user', 'profile']
  }
);
```

### Tag-Based Invalidation

```typescript
// Invalidate all user-related data
await unifiedCacheManager.invalidateByTags(['user']);

// Invalidate specific user's data
await unifiedCacheManager.invalidateByTags(['user:123']);
```

## Domain-Specific Cache Instances

The system provides pre-configured cache instances optimized for different domains:

```typescript
import { propertyCache, userCache, fraudCache } from './infrastructure/cache';

// Property cache - optimized for frequent access
await propertyCache.setWithTags('property:456', propertyData, ['property', 'listing']);

// User cache - optimized for session data
await userCache.setWithTags('user:789', userData, ['user', 'session']);

// Fraud cache - optimized for security data
await fraudCache.setWithTags('fraud:alert:123', alertData, ['fraud', 'alert']);
```

## Configuration

### Environment-Based Setup

```typescript
import { setupCache } from './infrastructure/cache';

// Automatically configures based on environment
const cache = setupCache(process.env.NODE_ENV as 'development' | 'production' | 'test');
```

### Custom Configuration

```typescript
import { UnifiedCacheManager } from './infrastructure/cache';

const cache = new UnifiedCacheManager({
  // L1 Cache Configuration
  l1MaxItems: 5000,
  l1DefaultTtl: 10 * 60 * 1000, // 10 minutes
  l1MaxMemoryMB: 100,
  
  // L2 Cache Configuration
  l2DefaultTtl: 7200, // 2 hours
  l2KeyPrefix: 'myapp:',
  
  // Redis Configuration
  redisUrl: process.env.REDIS_URL,
  redisOptions: {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },
  
  // Performance Features
  enablePreFetching: true,
  preFetchThreshold: 5,
  enableStampedeProtection: true,
  stampedeTimeout: 30000,
  
  // Monitoring
  enableMetrics: true,
  metricsInterval: 60000
});
```

## Cache Warming Strategies

### Built-in Strategies

The system includes several built-in warming strategies:

1. **Property Related Data**: Warms property reviews and similar properties
2. **User Dashboard Data**: Pre-loads user properties and notifications
3. **Popular Properties**: Schedules warming of trending properties
4. **Search Results Preload**: Pre-fetches next page of search results

### Custom Warming Strategy

```typescript
import { cacheWarmingManager } from './infrastructure/cache';

cacheWarmingManager.addStrategy({
  name: 'custom-product-warming',
  enabled: true,
  priority: 'high',
  trigger: 'access',
  patterns: ['product:*'],
  condition: (key, accessCount) => accessCount >= 3,
  relatedDataFetcher: async (key) => {
    const productId = key.split(':')[1];
    return [
      {
        key: `product:${productId}:reviews`,
        fetcher: () => fetchProductReviews(productId),
        tags: ['product', 'reviews'],
        ttl: 1800
      }
    ];
  }
});
```

## Performance Monitoring

### Health Check

```typescript
import { checkCacheHealth } from './infrastructure/cache';

const health = await checkCacheHealth();
console.log('Cache Status:', health.status);
console.log('L1 Hit Rate:', health.l1Cache.hitRate);
console.log('L2 Connected:', health.l2Cache.connected);
```

### Performance Recommendations

```typescript
import { getCacheRecommendations } from './infrastructure/cache';

const recommendations = getCacheRecommendations();
recommendations.forEach(rec => console.log('💡', rec));
```

### Detailed Statistics

```typescript
const stats = unifiedCacheManager.getStats();

console.log('Overall Hit Rate:', stats.overall.hitRate);
console.log('L1 Memory Usage:', stats.l1.memoryUsageMB, 'MB');
console.log('L2 Connected:', stats.l2.connected);
console.log('Total Requests:', stats.overall.totalRequests);
```

## Migration Guide

### From Legacy CacheService

The unified cache system provides backward compatibility:

```typescript
// Old code (still works)
import { cacheService } from './infrastructure/cache/CacheService';

// New code (recommended)
import { cacheService } from './infrastructure/cache'; // Now uses unified cache
```

### Gradual Migration

1. **Phase 1**: Replace imports to use unified cache exports
2. **Phase 2**: Add tags to cache operations for better invalidation
3. **Phase 3**: Implement cache warming strategies
4. **Phase 4**: Optimize based on performance metrics

## Best Practices

### 1. Use Appropriate TTLs

```typescript
// Frequently changing data
await cache.set('user:session', sessionData, { l1Ttl: 5 * 60 * 1000, l2Ttl: 900 });

// Relatively stable data
await cache.set('user:profile', profileData, { l1Ttl: 15 * 60 * 1000, l2Ttl: 3600 });

// Static reference data
await cache.set('countries', countriesData, { l1Ttl: 60 * 60 * 1000, l2Ttl: 86400 });
```

### 2. Use Tags Effectively

```typescript
// Hierarchical tagging
await cache.setWithTags('property:123', propertyData, [
  'property',           // All properties
  'property:123',       // Specific property
  'property:type:house', // Property type
  'property:city:nairobi' // Location
]);
```

### 3. Implement Cache-Aside Pattern

```typescript
async function getProperty(id: string) {
  return await cache.getOrSet(
    `property:${id}`,
    () => database.getProperty(id),
    {
      tags: ['property', `property:${id}`],
      l1Ttl: 10 * 60 * 1000,
      l2Ttl: 3600
    }
  );
}
```

### 4. Handle Cache Failures Gracefully

```typescript
async function getUserData(id: string) {
  try {
    const cached = await cache.get(`user:${id}`);
    if (cached.hit) {
      return cached.value;
    }
  } catch (error) {
    console.warn('Cache error, falling back to database:', error);
  }
  
  // Always have a fallback
  return await database.getUser(id);
}
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Increase `l1MaxMemoryMB` or reduce `l1MaxItems`
   - Check for memory leaks in cached objects
   - Consider data compression

2. **Low Hit Rate**
   - Increase TTL values
   - Implement cache warming strategies
   - Review cache key patterns

3. **Redis Connection Issues**
   - Check `REDIS_URL` environment variable
   - Verify Redis server availability
   - Review Redis configuration

4. **Performance Issues**
   - Monitor cache statistics
   - Optimize data serialization
   - Consider cache partitioning

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
process.env.CACHE_DEBUG = 'true';
```

## API Reference

### UnifiedCacheManager

#### Methods

- `get<T>(key: string, tags?: string[]): Promise<CacheResult<T>>`
- `set<T>(key: string, value: T, options?: SetOptions): Promise<void>`
- `getOrSet<T>(key: string, factory: () => Promise<T>, options?: SetOptions): Promise<T>`
- `delete(key: string): Promise<boolean>`
- `invalidateByTags(tags: string[]): Promise<number>`
- `clear(): Promise<void>`
- `getStats(): CacheStats`

#### Configuration Options

- `l1MaxItems`: Maximum items in L1 cache
- `l1DefaultTtl`: Default TTL for L1 cache (milliseconds)
- `l1MaxMemoryMB`: Maximum memory for L1 cache (MB)
- `l2DefaultTtl`: Default TTL for L2 cache (seconds)
- `l2KeyPrefix`: Prefix for L2 cache keys
- `redisUrl`: Redis connection URL
- `enablePreFetching`: Enable intelligent pre-fetching
- `enableStampedeProtection`: Enable stampede protection
- `enableMetrics`: Enable performance monitoring

## Contributing

When contributing to the cache system:

1. Add comprehensive tests for new features
2. Update documentation for API changes
3. Consider backward compatibility
4. Monitor performance impact
5. Add appropriate error handling

## License

This cache system is part of the TripleCheck project and follows the same license terms.