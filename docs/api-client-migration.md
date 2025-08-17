# API Client Migration Guide

## Overview

The African Property Trust application has been updated to use a unified API client that combines the best features from multiple implementations:

- **Race condition protection** from the original api-client
- **Circuit breaker and rate limiting** from the enhanced-api-client  
- **Security monitoring integration** for enterprise compliance
- **Intelligent caching** with TTL support
- **Comprehensive audit logging** for compliance

## Migration Changes

### Import Changes

**Before:**
```typescript
import { apiClient } from '../shared/services/api-client';
import { apiClient } from '../shared/services/enhanced-api-client';
```

**After:**
```typescript
import { apiClient } from '../shared/services/unified-api-client';
// or from the services index
import { apiClient } from '../shared/services';
```

### Configuration Changes

**Before (enhanced-api-client):**
```typescript
const client = new EnhancedApiClient({
  baseURL: '/api',
  timeout: 10000,
  circuitBreakerOptions: { ... },
  rateLimitOptions: { ... }
});
```

**After (unified-api-client):**
```typescript
const client = new UnifiedApiClient({
  baseUrl: '/api',
  defaultOptions: {
    timeout: 10000,
    retries: 3,
    useCache: true,
    cacheTtl: 300000
  }
});
```

### API Method Changes

The API methods remain the same, but now include additional features:

```typescript
// All methods now support enhanced options
const response = await apiClient.get<UserData>('/users', {
  useCache: true,
  cacheTtl: 60000,
  timeout: 5000,
  retries: 2
});

const response = await apiClient.post<CreateUserResponse>('/users', userData, {
  timeout: 10000,
  retries: 1
});
```

## New Features

### 1. Race Condition Protection
Duplicate requests are automatically deduplicated to prevent race conditions.

### 2. Circuit Breaker
Automatic fault tolerance with circuit breaker pattern:
- Opens after 5 consecutive failures
- Half-open state for recovery testing
- 30-second recovery timeout

### 3. Rate Limiting
Built-in rate limiting (100 requests per minute by default) to prevent abuse.

### 4. Security Integration
Automatic security monitoring for all requests:
- Threat detection
- Risk scoring
- Request blocking for high-risk scenarios

### 5. Audit Logging
Comprehensive audit trail for compliance:
- All API calls logged
- User context tracking
- Compliance flag detection

### 6. Intelligent Caching
Enhanced caching with TTL support:
- Automatic cache invalidation
- Memory-efficient storage
- Configurable TTL per request

## Breaking Changes

### Test Configuration

**Before:**
```typescript
const client = new ApiClient({
  cacheStrategy: {
    type: 'LRU',
    maxSize: 100,
    defaultTTL: 300000
  }
});
```

**After:**
```typescript
const client = new UnifiedApiClient({
  defaultOptions: {
    useCache: true,
    cacheTtl: 300000
  }
});
```

### Error Handling

Error responses now include additional metadata:

```typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  status: number;
  headers?: Record<string, string>;
  cached?: boolean;        // New: indicates if response was cached
  requestId: string;       // New: unique request identifier
}
```

## Migration Checklist

- [x] Update imports to use `unified-api-client`
- [x] Update service index exports
- [x] Update test files with new class names
- [x] Update configuration objects
- [ ] Update any custom API client instances
- [ ] Test all API integrations
- [ ] Verify caching behavior
- [ ] Confirm security monitoring is working
- [ ] Check audit logs are being generated

## Benefits

1. **Improved Reliability**: Circuit breaker and retry logic prevent cascading failures
2. **Better Performance**: Intelligent caching and race condition protection
3. **Enhanced Security**: Built-in threat detection and monitoring
4. **Compliance Ready**: Comprehensive audit logging for regulatory requirements
5. **Developer Experience**: Unified API with consistent error handling

## Rollback Plan

If issues arise, you can temporarily revert by:

1. Changing imports back to the original API client
2. Updating the services index file
3. Reverting configuration changes

The old API client files are preserved for emergency rollback scenarios.

## Support

For questions or issues with the migration:
1. Check the unified API client documentation
2. Review the test files for usage examples
3. Contact the development team for assistance