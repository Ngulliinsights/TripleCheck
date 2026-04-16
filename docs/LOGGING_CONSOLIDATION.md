# Logging Consolidation Guide

## Overview

The application has been consolidated to use a **single source of truth** for logging: the unified logger in `server/infrastructure/observability/telemetry.ts`.

This logger combines:
- **Pino** - Fast, structured JSON logging
- **OpenTelemetry** - Distributed tracing and observability
- **Prometheus** - Metrics export
- **Backward compatibility adapters** - For legacy code

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Unified Logger (telemetry.ts)                    │
│  - Pino + OpenTelemetry + Prometheus                    │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
│Legacy Logger │  │Simple Logger│  │Audit Trail │
│   Adapter    │  │   Adapter   │  │  Service   │
│(monitoring/) │  │ (storage/)  │  │  (shared/) │
└──────────────┘  └─────────────┘  └────────────┘
```

## Migration Status

### ✅ Consolidated Files

1. **`server/infrastructure/observability/telemetry.ts`** - **PRIMARY LOGGER**
   - Main unified logger with all features
   - Use this for all new code

2. **`server/infrastructure/monitoring/logger.ts`** - **ADAPTER**
   - Now wraps telemetry.ts
   - Provides backward compatibility
   - Existing code continues to work

3. **`server/infrastructure/storage/logger.ts`** - **ADAPTER**
   - Now wraps telemetry.ts
   - Simple interface for storage operations

### 📋 To Be Migrated

These files should be gradually migrated to use the unified logger:

1. **`server/monitoring/StructuredLogger.ts`** - Winston-based logger
   - Used in some legacy code
   - Can be replaced with telemetry.ts

2. **`server/fraud-detection/utils/Logger.ts`** - Component-specific logger
   - Should use telemetry.ts with context

3. **`server/land-verification/audit/AuditLogger.ts`** - Domain audit logger
   - Keep for domain-specific audit logic
   - Use telemetry.ts for actual logging

4. **`server/land-verification/error-handling/AuditLogger.ts`** - Error audit logger
   - Consolidate with main audit logger

5. **`server/land-verification/security/AuditLogger.ts`** - Security audit logger
   - Consolidate with main audit logger

### ✅ Keep As-Is

1. **`src/shared/services/audit-trail-service.ts`** - Audit Trail Service
   - Domain-specific audit logic
   - Already uses proper logging internally
   - Keep for compliance and security requirements

## Usage Guide

### For New Code

```typescript
// Import the unified logger
import { logger } from '@server/infrastructure/observability/telemetry';

// Basic logging
logger.info({ userId: 123, action: 'login' }, 'User logged in');
logger.error({ error: err }, 'Failed to process request');
logger.warn({ threshold: 100 }, 'Rate limit approaching');
logger.debug({ query: 'SELECT *' }, 'Database query executed');

// With tracing
import { traced, tracer } from '@server/infrastructure/observability/telemetry';

const myFunction = traced('myFunction', async () => {
  // Your code here
  // Automatically traced with OpenTelemetry
});

// Class method tracing
import { Traced } from '@server/infrastructure/observability/telemetry';

class MyService {
  @Traced()
  async processData() {
    // Automatically traced
  }
}
```

### For Existing Code (Backward Compatible)

```typescript
// Old code continues to work
import { logger } from '@server/infrastructure/monitoring/logger';

logger.error('Failed to cache', 'AnalyticsCache', undefined, error);
logger.info('Server started', 'SERVER', { port: 3000 });

// Storage logger
import { logger } from '@server/infrastructure/storage/logger';

logger.info('File uploaded', { filename: 'doc.pdf' });
```

## Migration Steps

### Step 1: Update Imports (Recommended)

Replace old imports with the unified logger:

```typescript
// Before
import { logger } from './infrastructure/monitoring/logger';
import { logger } from './infrastructure/storage/logger';

// After
import { logger } from './infrastructure/observability/telemetry';
```

### Step 2: Update Log Calls (Optional)

Modernize log calls to use Pino's format:

```typescript
// Before (legacy format)
logger.error('Failed to process', 'MyComponent', { userId: 123 }, error);

// After (Pino format - recommended)
logger.error({ 
  context: 'MyComponent', 
  userId: 123, 
  error 
}, 'Failed to process');
```

### Step 3: Add Tracing (Optional)

Enhance critical functions with tracing:

```typescript
import { traced } from './infrastructure/observability/telemetry';

const criticalFunction = traced('criticalFunction', async (data) => {
  // Your code here
  // Now automatically traced in OpenTelemetry
});
```

## Benefits

### 1. **Performance**
- Pino is one of the fastest Node.js loggers
- Structured JSON logging
- Minimal overhead

### 2. **Observability**
- Automatic trace/span ID injection
- Distributed tracing with OpenTelemetry
- Prometheus metrics export
- Correlation across services

### 3. **Consistency**
- Single logging format across the application
- Unified configuration
- Centralized log level management

### 4. **Production-Ready**
- Battle-tested libraries (Pino, OpenTelemetry)
- Industry-standard observability
- Easy integration with monitoring tools (Grafana, Jaeger, etc.)

### 5. **Backward Compatibility**
- Existing code continues to work
- Gradual migration path
- No breaking changes

## Configuration

### Environment Variables

```bash
# Log level (error, warn, info, debug)
LOG_LEVEL=info

# Prometheus metrics port
PROMETHEUS_PORT=9464

# Application version (for tracing)
APP_VERSION=1.0.0

# Node environment
NODE_ENV=production
```

### Log Levels

- **error** - Errors and exceptions
- **warn** - Warnings and potential issues
- **info** - General information (default)
- **debug** - Detailed debugging information

## Integration with Monitoring Tools

### Prometheus

Metrics are automatically exported on port 9464:
```
http://localhost:9464/metrics
```

### Grafana

Import the Prometheus data source and create dashboards for:
- Request rates
- Error rates
- Response times
- Custom metrics

### Jaeger/Zipkin

OpenTelemetry traces can be exported to Jaeger or Zipkin for distributed tracing visualization.

## Best Practices

1. **Use structured logging**
   ```typescript
   // Good
   logger.info({ userId, action, duration }, 'Action completed');
   
   // Avoid
   logger.info(`User ${userId} completed ${action} in ${duration}ms`);
   ```

2. **Include context**
   ```typescript
   logger.error({ 
     context: 'PaymentService',
     userId,
     transactionId,
     error 
   }, 'Payment failed');
   ```

3. **Use appropriate log levels**
   - `error` - Actual errors that need attention
   - `warn` - Potential issues or degraded performance
   - `info` - Normal operations and milestones
   - `debug` - Detailed information for debugging

4. **Add tracing to critical paths**
   ```typescript
   const processPayment = traced('processPayment', async (payment) => {
     // Critical business logic
   });
   ```

5. **Avoid logging sensitive data**
   ```typescript
   // Bad
   logger.info({ password, creditCard }, 'User data');
   
   // Good
   logger.info({ userId, action: 'update_profile' }, 'User data updated');
   ```

## Troubleshooting

### Logs not appearing

Check the log level:
```typescript
import { logger } from './infrastructure/observability/telemetry';
console.log('Current log level:', logger.level);
logger.level = 'debug'; // Set to debug
```

### Traces not showing

Ensure OpenTelemetry is initialized:
```typescript
import { initializeTelemetry } from './infrastructure/observability/telemetry';
initializeTelemetry();
```

### Performance issues

Reduce log level in production:
```bash
LOG_LEVEL=warn npm start
```

## Future Improvements

1. **Log aggregation** - Send logs to ELK stack or similar
2. **Alert rules** - Set up alerts based on log patterns
3. **Log retention** - Configure log rotation and retention policies
4. **Custom metrics** - Add business-specific metrics
5. **Complete migration** - Remove all legacy logger implementations

## Support

For questions or issues:
1. Check this documentation
2. Review the telemetry.ts source code
3. Consult the Pino documentation: https://getpino.io
4. Consult the OpenTelemetry documentation: https://opentelemetry.io
