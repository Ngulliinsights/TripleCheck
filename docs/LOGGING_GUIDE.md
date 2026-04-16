# Logging Guide

## Architecture

The application uses a **unified logging system** with a single source of truth:

**`server/infrastructure/observability/telemetry.ts`**

All other loggers are adapters that wrap this unified logger, ensuring consistency while maintaining backward compatibility.

```
┌──────────────────────────────────────────────────────────────────┐
│                    UNIFIED LOGGER                                 │
│         server/infrastructure/observability/telemetry.ts         │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐         │
│  │    Pino     │  │OpenTelemetry │  │  Prometheus    │         │
│  │  (Logging)  │  │  (Tracing)   │  │  (Metrics)     │         │
│  └─────────────┘  └──────────────┘  └────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────────┐  ┌───────▼──────────┐  ┌──────▼──────────┐
│ Legacy Logger    │  │ Simple Logger    │  │  Audit Trail    │
│    Adapter       │  │    Adapter       │  │    Service      │
└──────────────────┘  └──────────────────┘  └─────────────────┘
```

## Quick Start

### New Code (Recommended)

```typescript
import { logger, traced } from '@server/infrastructure/observability/telemetry';

// Structured logging
logger.info({ userId: 123, action: 'login' }, 'User logged in');
logger.error({ error: err, context: 'PaymentService' }, 'Payment failed');

// Automatic tracing
const processPayment = traced('processPayment', async (payment) => {
  // Your code - automatically traced
  return result;
});
```

### Existing Code (Backward Compatible)

```typescript
import { logger } from '@server/infrastructure/monitoring/logger';

logger.error('Failed to cache', 'AnalyticsCache', undefined, error);
logger.info('Server started', 'SERVER', { port: 3000 });
```

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

## Environment Variables

```bash
LOG_LEVEL=info          # error, warn, info, debug
PROMETHEUS_PORT=9464    # Metrics endpoint
NODE_ENV=production     # development, production, test
```

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

## Migration Status

### Components

1. **`server/infrastructure/observability/telemetry.ts`** - PRIMARY LOGGER
   - Main unified logger with all features
   - Pino + OpenTelemetry + Prometheus
   - Use this for all new code

2. **`server/infrastructure/monitoring/logger.ts`** - ADAPTER
   - Wraps telemetry.ts
   - Provides backward compatibility
   - Existing code continues to work

3. **`server/infrastructure/storage/logger.ts`** - ADAPTER
   - Wraps telemetry.ts
   - Simple interface for storage operations

4. **`src/shared/services/audit-trail-service.ts`** - AUDIT TRAIL SERVICE
   - Domain-specific audit logging
   - Already uses unified logger internally

## For Details

- **Architecture decisions**: See `docs/adr/018-logging-architecture.md`
- **Full architectural overview**: See top section above
- **Troubleshooting**: See sections below

## Troubleshooting

### Logs not showing?
```typescript
// Check current level
console.log(logger.level);

// Set to debug
logger.level = 'debug';
```

### Logs missing details?
Set environment variable:
```bash
LOG_LEVEL=debug npm start
```

### Traces not appearing?
Ensure telemetry is initialized before use.
