# Kenya Land Verification System - Error Handling and Resilience

This directory contains a comprehensive error handling and resilience system for the Kenya Land Verification System. The implementation provides robust error recovery mechanisms, intelligent retry policies, fallback strategies, graceful degradation, and comprehensive audit logging.

## Components

### 1. RetryPolicyManager (`RetryPolicyManager.ts`)

Implements intelligent retry strategies for government API failures and external service issues.

**Features:**
- Configurable retry policies per service
- Multiple backoff strategies (exponential, linear, fixed)
- Jitter support to prevent thundering herd
- Error classification (retryable vs non-retryable)
- Comprehensive logging and correlation tracking

**Default Configurations:**
- Government API: 5 attempts, exponential backoff, 2-30s delays
- Court Records: 3 attempts, exponential backoff, 1.5-15s delays
- Expert Services: 2 attempts, linear backoff, 1-10s delays
- Database: 3 attempts, exponential backoff, 0.5-5s delays

### 2. FallbackManager (`FallbackManager.ts`)

Provides fallback mechanisms when external services are unavailable.

**Features:**
- Priority-based fallback providers
- Health monitoring and circuit breaker patterns
- Automatic provider recovery
- Timeout handling for fallback operations
- Provider enable/disable controls

**Fallback Types:**
- Cached data providers
- Alternative service endpoints
- Manual escalation processes
- Degraded functionality modes

### 3. GracefulDegradationManager (`GracefulDegradationManager.ts`)

Handles partial data scenarios and provides degraded but functional service.

**Features:**
- Multiple degradation levels (full, partial, minimal, emergency)
- Feature availability checking
- Data completeness calculation
- Warning and recommendation generation
- Custom degradation rules support

**Degradation Levels:**
- **Full**: All services operational (100% data quality)
- **Partial**: Some services down, alternative methods used (75% data quality)
- **Minimal**: External services unavailable, local verification only (50% data quality)
- **Emergency**: Critical functionality only, manual review required (25% data quality)

### 4. AuditLogger (`AuditLogger.ts`)

Provides comprehensive logging and audit trails for all verification activities.

**Features:**
- Structured audit events with correlation IDs
- Batch processing for performance
- Multiple event types and categories
- Audit metrics and reporting
- Database persistence with indexing

**Event Types:**
- Verification lifecycle events
- Government API calls
- Security events
- System errors
- Data access events
- Configuration changes

### 5. ErrorHandlingService (`ErrorHandlingService.ts`)

Main orchestration service that integrates all error handling components.

**Features:**
- Unified error handling interface
- Service health monitoring
- Strategy coordination (retry → fallback → degradation)
- Performance metrics collection
- Configuration management

## Database Schema

The system includes a database migration for audit logging:

```sql
-- migrations/0001_audit_events_table.sql
CREATE TABLE audit_events (
    id VARCHAR(255) PRIMARY KEY,
    correlation_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    -- ... additional fields
);
```

## Usage Examples

### Basic Error Handling

```typescript
import { errorHandlingService } from './ErrorHandlingService';

const result = await errorHandlingService.executeWithErrorHandling(
  () => governmentApiCall(),
  {
    service: 'government-api',
    operation: 'search_registry',
    sessionId: 'session-123',
    propertyId: 'property-456'
  }
);

if (result.success) {
  console.log('Data:', result.data);
  console.log('Strategy used:', result.handlingStrategy);
} else {
  console.error('All strategies failed:', result.error);
}
```

### Registering Fallback Providers

```typescript
import { fallbackManager } from './FallbackManager';

fallbackManager.registerFallback('government-api', {
  name: 'cached-data-provider',
  execute: async () => getCachedData(),
  healthCheck: async () => checkCacheHealth(),
  config: {
    enabled: true,
    priority: 1,
    timeout: 5000,
    healthCheckInterval: 60000,
    maxFailures: 3,
    recoveryTime: 300000
  }
});
```

### Custom Retry Configuration

```typescript
import { retryPolicyManager } from './RetryPolicyManager';

retryPolicyManager.registerConfig('custom-service', {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffStrategy: 'exponential',
  jitter: true,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT'],
  retryableStatusCodes: [500, 502, 503, 504]
});
```

### Graceful Degradation

```typescript
import { gracefulDegradationManager } from './GracefulDegradationManager';

const context = {
  availableServices: ['physical-verification'],
  failedServices: ['government-api', 'court-records'],
  partialData: { propertyId: '123' },
  userRequirements: ['ownership-verification'],
  criticalityLevel: 'high' as const
};

const result = await gracefulDegradationManager.executeWithDegradation(
  (level) => performVerification(level),
  context,
  'property-verification'
);
```

## Integration Example

The `examples/GovernmentApiIntegration.ts` file demonstrates how to integrate the error handling system with existing services:

```typescript
export class GovernmentApiService {
  async searchLandRegistry(titleNumber: string): Promise<RegistrySearchResult> {
    const result = await errorHandlingService.executeWithErrorHandling(
      () => this.performRegistrySearch(titleNumber),
      {
        service: 'government-registry',
        operation: 'search_land_registry',
        metadata: { titleNumber }
      },
      {
        availableServices: ['government-api', 'cached-data'],
        failedServices: [],
        partialData: { titleNumber },
        userRequirements: ['ownership-verification'],
        criticalityLevel: 'high'
      }
    );

    if (result.success) {
      return result.data!;
    } else {
      throw result.error!;
    }
  }
}
```

## Testing

Comprehensive test suites are provided for all components:

- `__tests__/RetryPolicyManager.test.ts` - Retry policy testing
- `__tests__/FallbackManager.test.ts` - Fallback mechanism testing
- `__tests__/GracefulDegradationManager.test.ts` - Degradation testing
- `__tests__/ErrorHandlingService.test.ts` - Integration testing

Run tests with:
```bash
npm test -- server/land-verification/error-handling/__tests__ --run
```

## Configuration

The error handling system is highly configurable:

```typescript
const errorHandlingService = new ErrorHandlingService({
  enableRetry: true,
  enableFallback: true,
  enableDegradation: true,
  enableAuditLogging: true,
  maxRetryAttempts: 3,
  fallbackTimeout: 10000,
  degradationThreshold: 2
});
```

## Monitoring and Metrics

The system provides comprehensive monitoring capabilities:

```typescript
// Get service health status
const health = errorHandlingService.getServiceHealth();

// Get error handling metrics
const metrics = errorHandlingService.getMetrics();

// Get audit metrics
const auditMetrics = await auditLogger.getMetrics();
```

## Key Benefits

1. **Resilience**: Automatic recovery from transient failures
2. **Availability**: Graceful degradation maintains service availability
3. **Observability**: Comprehensive logging and metrics
4. **Flexibility**: Configurable policies per service
5. **Performance**: Intelligent backoff and circuit breaker patterns
6. **Compliance**: Full audit trails for regulatory requirements

## Cross-Cutting Concerns

This error handling system addresses all requirements as it provides cross-cutting error handling capabilities that can be applied to any service or operation within the Kenya Land Verification System.

The implementation ensures that:
- Government API failures are handled with appropriate retry policies
- Fallback mechanisms provide alternative data sources
- Graceful degradation maintains functionality with partial data
- Comprehensive audit logging tracks all activities
- Recovery mechanisms restore service automatically

This robust error handling foundation enables the land verification system to operate reliably even in challenging network conditions and service outages common in Kenya's infrastructure environment.