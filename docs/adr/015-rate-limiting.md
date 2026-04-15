# ADR 015: Rate Limiting - express-rate-limit

**Status**: Accepted  
**Date**: 2024-01-01  
**Supersedes**: Custom ai-rate-limiting middleware

## Context

The custom `ai-rate-limiting.ts` implemented:
- Manual request tracking
- In-memory rate limit storage
- Basic IP-based limiting
- No distributed support

This resulted in:
- Rate limits not shared across servers
- Memory leaks from unbounded storage
- Inconsistent rate limiting

## Decision

Replace with express-rate-limit:

### Rate Limiting: express-rate-limit
- IP-based rate limiting
- Different limits for different endpoints
- Automatic retry-after headers
- Redis-backed for distributed systems
- Configurable windows and limits

**Location**: `server/middleware/rate-limit.ts`

## Implementation

```typescript
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rate-limit';

app.use('/api/', apiLimiter);           // 100 req/15min
app.use('/api/auth/', authLimiter);     // 5 req/15min
app.use('/api/ai/', aiLimiter);         // 20 req/15min
```

## Consequences

### Positive
- Battle-tested rate limiting
- Redis-backed for multi-server support
- Automatic retry-after headers
- Configurable per endpoint
- Reduced custom code
- Better DDoS protection

### Negative
- Requires Redis for distributed systems
- Rate limit format changed
- Additional dependency

### Neutral
- Different limits for different endpoints
- Configurable windows and thresholds
- IP-based by default

## Rate Limit Configuration

```typescript
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests'
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,                     // Stricter for auth
  skipSuccessfulRequests: true
});

export const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,                    // Limited for expensive AI calls
});
```

## Response Headers

When rate limited:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000000
Retry-After: 900
```

## Distributed Support

With Redis store:
- Rate limits shared across servers
- Consistent limiting in clusters
- No memory leaks

## References

- [express-rate-limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
