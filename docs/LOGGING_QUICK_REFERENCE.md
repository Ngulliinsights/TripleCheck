# Logging Quick Reference

## TL;DR

**Use this for all new code:**
```typescript
import { logger } from '@server/infrastructure/observability/telemetry';
```

**Existing code continues to work unchanged.**

---

## Quick Start

### Basic Logging

```typescript
import { logger } from '@server/infrastructure/observability/telemetry';

// Info
logger.info({ userId: 123 }, 'User logged in');

// Error
logger.error({ error: err, context: 'PaymentService' }, 'Payment failed');

// Warning
logger.warn({ threshold: 100, current: 95 }, 'Approaching limit');

// Debug
logger.debug({ query: 'SELECT *' }, 'Query executed');
```

### With Tracing

```typescript
import { traced } from '@server/infrastructure/observability/telemetry';

// Wrap function
const myFunction = traced('myFunction', async (data) => {
  // Your code - automatically traced
  return result;
});

// Class decorator
import { Traced } from '@server/infrastructure/observability/telemetry';

class MyService {
  @Traced()
  async processData() {
    // Automatically traced
  }
}
```

---

## Cheat Sheet

| Task | Code |
|------|------|
| **Import logger** | `import { logger } from '@server/infrastructure/observability/telemetry';` |
| **Log info** | `logger.info({ data }, 'message');` |
| **Log error** | `logger.error({ error }, 'message');` |
| **Log warning** | `logger.warn({ data }, 'message');` |
| **Log debug** | `logger.debug({ data }, 'message');` |
| **Trace function** | `traced('name', fn)` |
| **Trace method** | `@Traced()` decorator |
| **Set log level** | `logger.level = 'debug'` |
| **Check level** | `logger.isLevelEnabled('debug')` |

---

## Migration

### Before (Old Code)
```typescript
import { logger } from './infrastructure/monitoring/logger';
logger.error('Failed', 'Component', { data }, error);
```

### After (New Code)
```typescript
import { logger } from './infrastructure/observability/telemetry';
logger.error({ context: 'Component', data, error }, 'Failed');
```

**Note**: Old code still works! No need to change immediately.

---

## Environment Variables

```bash
LOG_LEVEL=info          # error, warn, info, debug
PROMETHEUS_PORT=9464    # Metrics endpoint
NODE_ENV=production     # development, production, test
```

---

## Monitoring

- **Logs**: Check console (dev) or log aggregation (prod)
- **Metrics**: `http://localhost:9464/metrics`
- **Traces**: Export to Jaeger/Zipkin/Tempo

---

## Best Practices

✅ **DO**
```typescript
logger.info({ userId, action }, 'Action completed');
logger.error({ context: 'Service', error }, 'Failed');
const fn = traced('criticalOp', async () => { /* ... */ });
```

❌ **DON'T**
```typescript
logger.info(`User ${userId} did ${action}`);  // Use structured data
logger.info({ password }, 'Login');           // Don't log secrets
logger.debug({ hugeObject }, 'Data');         // Don't log huge objects
```

---

## Common Patterns

### API Request
```typescript
logger.info({
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  duration: Date.now() - start
}, 'API request completed');
```

### Database Operation
```typescript
logger.debug({
  operation: 'SELECT',
  table: 'users',
  duration: queryTime
}, 'Database query executed');
```

### Error Handling
```typescript
try {
  await operation();
} catch (error) {
  logger.error({
    context: 'ServiceName',
    operation: 'operationName',
    error
  }, 'Operation failed');
  throw error;
}
```

### Cache Operation
```typescript
const cached = await cache.get(key);
if (cached) {
  logger.debug({ key, hit: true }, 'Cache hit');
} else {
  logger.debug({ key, hit: false }, 'Cache miss');
}
```

---

## Troubleshooting

### Logs not showing?
```typescript
// Check current level
console.log(logger.level);

// Set to debug
logger.level = 'debug';
```

### Need more detail?
```bash
# Set environment variable
LOG_LEVEL=debug npm start
```

### Traces not appearing?
```typescript
// Ensure telemetry is initialized
import { initializeTelemetry } from './infrastructure/observability/telemetry';
initializeTelemetry();
```

---

## Full Documentation

- [Logging Architecture](./LOGGING_ARCHITECTURE.md) - Overview
- [Logging Consolidation Guide](./LOGGING_CONSOLIDATION.md) - Detailed guide
- [Pino Docs](https://getpino.io) - Pino documentation
- [OpenTelemetry Docs](https://opentelemetry.io) - Tracing documentation
