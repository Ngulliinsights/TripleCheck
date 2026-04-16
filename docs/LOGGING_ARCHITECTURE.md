# Logging Architecture - Single Source of Truth

## Executive Summary

The application now has a **unified logging system** with a single source of truth:

**`server/infrastructure/observability/telemetry.ts`**

All other loggers are now adapters that wrap this unified logger, ensuring consistency while maintaining backward compatibility.

## Architecture Diagram

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
│                  │  │                  │  │                 │
│ monitoring/      │  │ storage/         │  │ shared/         │
│ logger.ts        │  │ logger.ts        │  │ audit-trail-    │
│                  │  │                  │  │ service.ts      │
│ (Backward        │  │ (Backward        │  │ (Domain         │
│  Compatible)     │  │  Compatible)     │  │  Specific)      │
└──────────────────┘  └──────────────────┘  └─────────────────┘
```

## Components

### 1. Unified Logger (Primary)
**Location**: `server/infrastructure/observability/telemetry.ts`

**Features**:
- Pino for fast, structured JSON logging
- OpenTelemetry for distributed tracing
- Prometheus metrics export
- Automatic trace/span ID injection
- Development-friendly pretty printing
- Production-optimized performance

**Exports**:
- `logger` - Main Pino logger instance
- `tracer` - OpenTelemetry tracer
- `traced()` - Function wrapper for tracing
- `@Traced()` - Decorator for class methods
- `legacyLogger` - Backward compatibility adapter
- `simpleLogger` - Simple interface adapter

### 2. Legacy Logger Adapter
**Location**: `server/infrastructure/monitoring/logger.ts`

**Purpose**: Backward compatibility for existing code

**Status**: ✅ Consolidated - wraps telemetry.ts

**Interface**:
```typescript
logger.error(message, context?, data?, error?)
logger.warn(message, context?, data?)
logger.info(message, context?, data?)
logger.debug(message, context?, data?)
```

### 3. Simple Logger Adapter
**Location**: `server/infrastructure/storage/logger.ts`

**Purpose**: Simple interface for storage operations

**Status**: ✅ Consolidated - wraps telemetry.ts

**Interface**:
```typescript
logger.info(message, meta?)
logger.warn(message, meta?)
logger.error(message, meta?)
logger.debug(message, meta?)
```

### 4. Audit Trail Service
**Location**: `src/shared/services/audit-trail-service.ts`

**Purpose**: Domain-specific audit logging for compliance

**Status**: ✅ Keep as-is - provides business logic

**Note**: Uses unified logger internally for actual logging

## Migration Status

### ✅ Completed
- [x] Created unified logger with Pino + OpenTelemetry
- [x] Added backward compatibility adapters
- [x] Updated monitoring/logger.ts to wrap unified logger
- [x] Updated storage/logger.ts to wrap unified logger
- [x] All existing code continues to work without changes

### 📋 Recommended (Non-Breaking)
- [ ] Gradually update imports to use telemetry.ts directly
- [ ] Modernize log calls to use Pino format
- [ ] Add tracing to critical functions
- [ ] Remove StructuredLogger.ts (Winston) when no longer used
- [ ] Consolidate duplicate audit loggers

### 🎯 Future Enhancements
- [ ] Set up log aggregation (ELK, Loki, etc.)
- [ ] Configure alert rules
- [ ] Add custom business metrics
- [ ] Integrate with APM tools (Datadog, New Relic, etc.)

## Usage Examples

### New Code (Recommended)

```typescript
import { logger, traced } from '@server/infrastructure/observability/telemetry';

// Structured logging
logger.info({ userId: 123, action: 'login' }, 'User logged in');
logger.error({ error: err, context: 'PaymentService' }, 'Payment failed');

// Automatic tracing
const processPayment = traced('processPayment', async (payment) => {
  // Your code here - automatically traced
  return result;
});

// Class method tracing
import { Traced } from '@server/infrastructure/observability/telemetry';

class PaymentService {
  @Traced('processPayment')
  async process(payment: Payment) {
    // Automatically traced with OpenTelemetry
  }
}
```

### Existing Code (Backward Compatible)

```typescript
// Old code continues to work unchanged
import { logger } from '@server/infrastructure/monitoring/logger';

logger.error('Failed to cache', 'AnalyticsCache', undefined, error);
logger.info('Server started', 'SERVER', { port: 3000 });
```

## Benefits

### 1. Single Source of Truth
- One logger implementation to maintain
- Consistent behavior across the application
- Centralized configuration

### 2. Production-Ready
- Battle-tested libraries (Pino, OpenTelemetry)
- Industry-standard observability
- High performance (Pino is one of the fastest Node.js loggers)

### 3. Observability
- Distributed tracing with OpenTelemetry
- Automatic trace/span correlation
- Prometheus metrics export
- Integration with monitoring tools (Grafana, Jaeger, etc.)

### 4. Backward Compatibility
- No breaking changes
- Existing code continues to work
- Gradual migration path

### 5. Developer Experience
- Pretty printing in development
- Structured JSON in production
- Type-safe interfaces
- Easy to use and understand

## Configuration

### Environment Variables

```bash
# Log level
LOG_LEVEL=info  # error, warn, info, debug

# Prometheus metrics port
PROMETHEUS_PORT=9464

# Application version (for tracing)
APP_VERSION=1.0.0

# Environment
NODE_ENV=production  # development, production, test
```

### Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| `error` | Errors requiring attention | Database connection failed |
| `warn` | Potential issues | Rate limit approaching |
| `info` | Normal operations | Server started, user logged in |
| `debug` | Detailed debugging | Query executed, cache hit |

## Monitoring Integration

### Prometheus Metrics
Access metrics at: `http://localhost:9464/metrics`

### Grafana Dashboards
Import Prometheus data source and visualize:
- Request rates and latencies
- Error rates by endpoint
- Cache hit rates
- Custom business metrics

### Distributed Tracing
Export traces to:
- Jaeger
- Zipkin
- Grafana Tempo
- Any OpenTelemetry-compatible backend

## Best Practices

1. **Use structured logging**
   ```typescript
   // ✅ Good
   logger.info({ userId, action, duration }, 'Action completed');
   
   // ❌ Avoid
   logger.info(`User ${userId} completed ${action}`);
   ```

2. **Include context**
   ```typescript
   logger.error({ 
     context: 'PaymentService',
     userId,
     error 
   }, 'Payment failed');
   ```

3. **Add tracing to critical paths**
   ```typescript
   const criticalFunction = traced('criticalFunction', async () => {
     // Critical business logic
   });
   ```

4. **Don't log sensitive data**
   ```typescript
   // ❌ Bad
   logger.info({ password, creditCard }, 'User data');
   
   // ✅ Good
   logger.info({ userId, action: 'update_profile' }, 'Profile updated');
   ```

## Files Reference

### Primary Logger
- `server/infrastructure/observability/telemetry.ts` - **USE THIS**

### Adapters (Backward Compatible)
- `server/infrastructure/monitoring/logger.ts` - Legacy adapter
- `server/infrastructure/storage/logger.ts` - Simple adapter

### Domain-Specific (Keep)
- `src/shared/services/audit-trail-service.ts` - Audit trails

### To Be Migrated
- `server/monitoring/StructuredLogger.ts` - Winston logger
- `server/fraud-detection/utils/Logger.ts` - Component logger
- `server/land-verification/audit/AuditLogger.ts` - Domain audit
- `server/land-verification/error-handling/AuditLogger.ts` - Error audit
- `server/land-verification/security/AuditLogger.ts` - Security audit

## Documentation

- [Logging Consolidation Guide](./LOGGING_CONSOLIDATION.md) - Detailed migration guide
- [Pino Documentation](https://getpino.io) - Pino logger docs
- [OpenTelemetry Documentation](https://opentelemetry.io) - Tracing docs

## Support

For questions or issues:
1. Review this documentation
2. Check the telemetry.ts source code
3. Consult the detailed consolidation guide
4. Review Pino and OpenTelemetry documentation
