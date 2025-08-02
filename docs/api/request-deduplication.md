# Request Deduplication API

## Overview

The Request Deduplication system prevents duplicate processing of identical requests and provides race condition protection for API endpoints. It combines in-memory caching with optional Redis backing for scalability.

## Features

- **Idempotent Request Handling**: Ensures identical requests return the same response
- **Race Condition Protection**: Prevents concurrent duplicate requests
- **Dual-Layer Caching**: In-memory cache with Redis fallback
- **Performance Monitoring**: Built-in metrics and alerting
- **Configurable TTL**: Flexible time-to-live settings
- **Automatic Cleanup**: Memory management and expired entry removal

## Configuration

### Basic Setup

```typescript
import { RequestDeduplicator } from '@server/infrastructure/deduplication/RequestDeduplicator';
import { CacheService } from '@server/infrastructure/cache/CacheService';

// Get singleton instance with default configuration
const deduplicator = RequestDeduplicator.getInstance();

// Or configure with custom settings
const customDeduplicator = RequestDeduplicator.getInstance({
  defaultTtl: 600000, // 10 minutes
  maxPendingTime: 30000, // 30 seconds
  enableRedisBackup: true,
  keyPrefix: 'api-dedup:'
}, cacheService);
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultTtl` | number | 300000 | Default TTL in milliseconds (5 minutes) |
| `maxPendingTime` | number | 30000 | Max time to wait for pending requests (30 seconds) |
| `enableRedisBackup` | boolean | true | Whether to use Redis as backup storage |
| `keyPrefix` | string | 'dedup:' | Prefix for cache keys |

## API Methods

### handleIdempotentRequest

Handles an idempotent request with automatic deduplication.

```typescript
async handleIdempotentRequest<T>(
  key: string,
  operation: () => Promise<T>,
  ttl?: number
): Promise<T>
```

**Parameters:**
- `key`: Unique identifier for the request
- `operation`: Async function to execute if not cached
- `ttl`: Optional TTL override in milliseconds

**Returns:** Promise resolving to the operation result

**Example:**
```typescript
const result = await deduplicator.handleIdempotentRequest(
  'user-profile-123',
  async () => {
    return await fetchUserProfile(123);
  },
  300000 // 5 minutes TTL
);
```

### generateIdempotencyKey

Generates a consistent idempotency key from request parameters.

```typescript
generateIdempotencyKey(
  userId: number,
  endpoint: string,
  data?: any
): string
```

**Parameters:**
- `userId`: User identifier
- `endpoint`: API endpoint path
- `data`: Optional request data

**Returns:** 16-character hash string

**Example:**
```typescript
const key = deduplicator.generateIdempotencyKey(
  123,
  '/api/properties/search',
  { location: 'Nairobi', type: 'apartment' }
);
```

### generateRequestHash

Generates a hash for content-based deduplication.

```typescript
generateRequestHash(
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): string
```

**Parameters:**
- `method`: HTTP method (GET, POST, etc.)
- `url`: Request URL
- `body`: Optional request body
- `headers`: Optional HTTP headers

**Returns:** SHA-256 hash string

### shouldDeduplicate

Determines if a request should be deduplicated based on method and endpoint.

```typescript
shouldDeduplicate(method: string, endpoint: string): boolean
```

**Parameters:**
- `method`: HTTP method
- `endpoint`: API endpoint path

**Returns:** Boolean indicating if deduplication should be applied

**Deduplication Rules:**
- **Always deduplicated**: GET, HEAD, OPTIONS requests
- **Conditionally deduplicated**: PUT, DELETE for specific endpoints
- **Selectively deduplicated**: POST for search and analytics endpoints

### clearCache

Clears cached entries by key or pattern.

```typescript
async clearCache(keyOrPattern: string): Promise<void>
```

**Parameters:**
- `keyOrPattern`: Specific key or wildcard pattern (e.g., 'user-*')

**Example:**
```typescript
// Clear specific key
await deduplicator.clearCache('user-profile-123');

// Clear all user-related cache
await deduplicator.clearCache('user-*');
```

### getStats

Returns current cache statistics.

```typescript
getStats(): {
  pendingRequests: number;
  completedRequests: number;
  memoryUsage: number;
}
```

**Returns:** Object with current cache statistics

## Middleware Integration

### Express Middleware

```typescript
import { RequestDeduplicator } from '@server/infrastructure/deduplication/RequestDeduplicator';

const deduplicationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const deduplicator = RequestDeduplicator.getInstance();
  
  // Check if request should be deduplicated
  if (!deduplicator.shouldDeduplicate(req.method, req.path)) {
    return next();
  }
  
  // Generate deduplication key
  const userId = req.user?.id || 0;
  const key = deduplicator.generateIdempotencyKey(
    userId,
    req.path,
    { method: req.method, body: req.body, query: req.query }
  );
  
  // Handle idempotent request
  deduplicator.handleIdempotentRequest(key, async () => {
    // Execute the actual request handler
    return new Promise((resolve, reject) => {
      const originalSend = res.send;
      res.send = function(data) {
        resolve(data);
        return originalSend.call(this, data);
      };
      
      const originalStatus = res.status;
      res.status = function(code) {
        if (code >= 400) {
          reject(new Error(`HTTP ${code}`));
        }
        return originalStatus.call(this, code);
      };
      
      next();
    });
  }).then(result => {
    res.send(result);
  }).catch(error => {
    next(error);
  });
};

// Apply to specific routes
app.use('/api/properties', deduplicationMiddleware);
app.use('/api/users', deduplicationMiddleware);
```

## Performance Monitoring

The system includes built-in performance monitoring with metrics and alerting.

### Monitoring Integration

```typescript
import { cachePerformanceMonitor } from '@server/infrastructure/monitoring/CachePerformanceMonitor';

// Subscribe to performance alerts
cachePerformanceMonitor.onAlert((alert) => {
  console.warn(`Cache Performance Alert: ${alert.message}`);
  
  if (alert.severity === 'critical') {
    // Send notification to monitoring system
    notificationService.sendAlert(alert);
  }
});

// Get performance report
const report = cachePerformanceMonitor.generateReport(24); // Last 24 hours
console.log('Cache Performance Report:', report);
```

### Available Metrics

- **Hit Rate**: Percentage of requests served from cache
- **Memory Usage**: Current cache memory consumption
- **Response Time**: Average response time for cached vs uncached requests
- **Deduplication Savings**: Number of duplicate requests prevented
- **Error Rate**: Percentage of cache operations that failed

### Performance Alerts

The system automatically generates alerts for:
- Low cache hit rate (< 70%)
- High memory usage (> 100MB)
- High error rate (> 5%)
- Slow response times (> 1000ms)

## Best Practices

### 1. Key Generation

```typescript
// Good: Include relevant parameters
const key = deduplicator.generateIdempotencyKey(
  userId,
  '/api/properties/search',
  { location, type, priceRange }
);

// Bad: Too generic
const key = deduplicator.generateIdempotencyKey(userId, '/api/search');
```

### 2. TTL Configuration

```typescript
// Short TTL for frequently changing data
await deduplicator.handleIdempotentRequest(key, operation, 60000); // 1 minute

// Longer TTL for stable data
await deduplicator.handleIdempotentRequest(key, operation, 3600000); // 1 hour
```

### 3. Error Handling

```typescript
try {
  const result = await deduplicator.handleIdempotentRequest(key, async () => {
    const data = await expensiveOperation();
    if (!data) {
      throw new Error('No data found');
    }
    return data;
  });
} catch (error) {
  // Handle both operation errors and deduplication errors
  console.error('Request failed:', error);
  throw error;
}
```

### 4. Memory Management

```typescript
// Monitor cache statistics
const stats = deduplicator.getStats();
if (stats.memoryUsage > 50 * 1024 * 1024) { // 50MB
  console.warn('High cache memory usage:', stats.memoryUsage);
  
  // Clear old cache entries
  await deduplicator.clearCache('old-*');
}
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Reduce TTL values
   - Implement more aggressive cleanup
   - Use Redis for large datasets

2. **Low Hit Rate**
   - Review key generation strategy
   - Increase TTL for stable data
   - Check for unnecessary cache invalidation

3. **Timeout Errors**
   - Increase `maxPendingTime` configuration
   - Optimize slow operations
   - Implement circuit breaker pattern

4. **Redis Connection Issues**
   - Verify Redis configuration
   - Implement connection retry logic
   - Use in-memory fallback

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
// Set environment variable
process.env.DEDUP_DEBUG = 'true';

// Or configure programmatically
const deduplicator = RequestDeduplicator.getInstance({
  debug: true
});
```

## Security Considerations

1. **Key Collision**: Use strong hash functions and include user context
2. **Cache Poisoning**: Validate input data before caching
3. **Memory Exhaustion**: Implement memory limits and monitoring
4. **Data Leakage**: Ensure proper access control and key isolation

## Migration Guide

### From v1.x to v2.x

```typescript
// Old API
const result = await deduplicator.deduplicate(key, operation);

// New API
const result = await deduplicator.handleIdempotentRequest(key, operation);
```

### Redis Migration

```typescript
// Enable Redis gradually
const deduplicator = RequestDeduplicator.getInstance({
  enableRedisBackup: true // Start with backup only
});

// Later, migrate to Redis primary
const deduplicator = RequestDeduplicator.getInstance({
  enableRedisBackup: true,
  preferRedis: true // New option in future version
});
```