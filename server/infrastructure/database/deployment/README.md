# Zero-Downtime Deployment System

A comprehensive zero-downtime deployment and migration system for PostgreSQL databases, featuring blue-green deployment strategies, online schema changes, and comprehensive validation.

## Features

- **Zero-Downtime Migrations**: Online schema changes with minimal locking
- **Blue-Green Deployments**: Complete environment switching with validation
- **Comprehensive Validation**: Data consistency, performance, and functional testing
- **Safety Checks**: Pre-migration analysis and risk assessment
- **Progress Monitoring**: Real-time migration progress and performance impact tracking
- **Automatic Rollback**: Intelligent rollback on failure detection
- **CLI Tools**: Command-line interface for deployment management

## Quick Start

### Basic Migration

```typescript
import { ZeroDowntimeMigrationManager, MigrationBuilder } from './database/deployment';
import { Pool } from 'pg';

// Create database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize migration manager
const migrationManager = new ZeroDowntimeMigrationManager(pool);
await migrationManager.initialize();

// Create a migration operation
const operation = MigrationBuilder.addColumn(
  'users',
  'phone_verified BOOLEAN',
  {
    description: 'Add phone verification status',
    defaultValue: 'false',
    riskLevel: 'LOW'
  }
);

// Execute migration
const operationId = await migrationManager.executeMigration(operation);
console.log(`Migration completed: ${operationId}`);
```

### Blue-Green Deployment

```typescript
import { BlueGreenDeploymentManager } from './database/deployment';

// Configure blue-green environments
const config = {
  blueEnvironment: {
    connectionString: process.env.BLUE_DATABASE_URL,
    poolConfig: { min: 2, max: 10, idleTimeoutMillis: 30000 }
  },
  greenEnvironment: {
    connectionString: process.env.GREEN_DATABASE_URL,
    poolConfig: { min: 2, max: 10, idleTimeoutMillis: 30000 }
  },
  switchoverTimeout: 30000,
  enableAutomaticRollback: true
};

// Initialize deployment manager
const deploymentManager = new BlueGreenDeploymentManager(config);
await deploymentManager.initialize();

// Create deployment plan
const plan = deploymentManager.createDeploymentPlan('v2.1.0');

// Execute deployment
const executionId = await deploymentManager.executeDeployment(plan);
console.log(`Deployment completed: ${executionId}`);
```

### CLI Usage

```bash
# Add a column with zero downtime
npx deployment-cli migration add-column -t users -c "phone_verified BOOLEAN DEFAULT false"

# Create an index concurrently
npx deployment-cli migration add-index -t properties -i "(location, price)"

# Check migration status
npx deployment-cli migration status

# Create deployment plan
npx deployment-cli deploy plan -v "v2.1.0"

# Execute deployment
npx deployment-cli deploy execute -v "v2.1.0" --auto-approve

# Check deployment status
npx deployment-cli deploy status

# System health check
npx deployment-cli health
```

## Architecture

### Core Components

1. **ZeroDowntimeMigrationManager**: Handles online schema changes
2. **BlueGreenDeploymentManager**: Manages environment switching
3. **DeploymentValidator**: Comprehensive validation system
4. **MigrationBuilder**: Utility for creating migration operations
5. **DatabaseAnalyzer**: Database analysis and risk assessment

### Migration Types

- **ADD_COLUMN**: Add new columns with minimal locking
- **DROP_COLUMN**: Remove columns safely
- **ADD_INDEX**: Create indexes concurrently
- **DROP_INDEX**: Remove indexes with minimal impact
- **RENAME_TABLE**: Rename tables with brief exclusive lock
- **CUSTOM**: Custom SQL operations with monitoring

### Validation Types

- **Data Consistency**: Row counts, checksums, and data integrity
- **Performance**: Response times, throughput, and error rates
- **Functional**: Application-specific test suites
- **Schema**: Structure, constraints, and index consistency
- **Rollback**: Environment health and dependency checks

## Configuration

### Zero-Downtime Migration Config

```typescript
const migrationConfig = {
  batchSize: 1000,                    // Rows per batch
  maxLockTime: 100,                   // Maximum lock time (ms)
  progressReportInterval: 10000,      // Progress reporting interval (ms)
  validationSampleSize: 1000,         // Sample size for validation
  enableSafetyChecks: true,           // Enable pre-migration safety checks
  requireApproval: false,             // Require manual approval
  maxTableSize: 10 * 1024 * 1024 * 1024, // 10GB max table size
  enableProgressMonitoring: true,     // Enable real-time monitoring
  enablePerformanceMonitoring: true,  // Monitor performance impact
  alertOnSlowdown: true               // Alert on performance degradation
};
```

### Blue-Green Deployment Config

```typescript
const blueGreenConfig = {
  switchoverTimeout: 30000,           // Switchover timeout (ms)
  validationTimeout: 300000,          // Validation timeout (ms)
  rollbackTimeout: 60000,             // Rollback timeout (ms)
  healthCheckInterval: 10000,         // Health check interval (ms)
  enableDataConsistencyCheck: true,   // Enable data validation
  enablePerformanceValidation: true,  // Enable performance validation
  enableFunctionalTesting: true,      // Enable functional tests
  enableRollbackReadiness: true,      // Enable rollback validation
  requireManualApproval: false,       // Require manual approval
  enableAutomaticRollback: true,      // Enable automatic rollback
  maxFailureThreshold: 3              // Maximum failures before rollback
};
```

### Validation Config

```typescript
const validationConfig = {
  dataConsistency: {
    enabled: true,
    sampleSize: 1000,
    toleranceThreshold: 0.0001,       // 0.01% tolerance
    criticalTables: ['users', 'properties', 'transactions'],
    checksumValidation: true
  },
  performance: {
    enabled: true,
    baselineMetrics: {
      avgResponseTime: 50,            // 50ms baseline
      p95ResponseTime: 100,           // 100ms p95 baseline
      throughput: 1000,               // 1000 qps baseline
      errorRate: 0.0001               // 0.01% error rate baseline
    },
    toleranceMultiplier: 1.2,         // 20% degradation allowed
    testDuration: 60000,              // 60 second test
    warmupDuration: 10000             // 10 second warmup
  },
  functional: {
    enabled: true,
    testSuites: [/* custom test suites */],
    parallelExecution: true,
    failFast: false
  }
};
```

## Migration Examples

### Adding a Column

```typescript
// Simple column addition
const addColumn = MigrationBuilder.addColumn(
  'users',
  'last_login TIMESTAMP',
  {
    description: 'Track user last login time',
    riskLevel: 'LOW'
  }
);

// Column with default value
const addColumnWithDefault = MigrationBuilder.addColumn(
  'properties',
  'featured BOOLEAN',
  {
    description: 'Add featured property flag',
    defaultValue: 'false',
    nullable: false,
    riskLevel: 'LOW'
  }
);
```

### Creating Indexes

```typescript
// Simple index
const addIndex = MigrationBuilder.addIndex(
  'properties',
  '(location, price)',
  {
    indexName: 'idx_properties_location_price',
    description: 'Index for location-based price searches',
    riskLevel: 'MEDIUM'
  }
);

// Partial index
const addPartialIndex = MigrationBuilder.addIndex(
  'properties',
  '(created_at DESC) WHERE is_active = true',
  {
    indexName: 'idx_properties_active_recent',
    description: 'Index for active properties by creation date',
    riskLevel: 'MEDIUM'
  }
);

// GIN index for JSONB
const addGinIndex = MigrationBuilder.addIndex(
  'properties',
  'USING GIN (features)',
  {
    indexName: 'idx_properties_features_gin',
    description: 'GIN index for property features search',
    riskLevel: 'MEDIUM'
  }
);
```

### Custom Migrations

```typescript
const customMigration = MigrationBuilder.custom(
  'users',
  `
    UPDATE users 
    SET email = LOWER(email) 
    WHERE email != LOWER(email)
  `,
  {
    description: 'Normalize email addresses to lowercase',
    estimatedDuration: 60000,
    riskLevel: 'MEDIUM',
    lockingBehavior: 'MINIMAL',
    reversible: false,
    validationSql: `
      SELECT CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END as valid
      FROM users 
      WHERE email != LOWER(email)
    `
  }
);
```

## Safety and Best Practices

### Pre-Migration Checklist

1. **Backup Database**: Always create a full backup before migrations
2. **Test in Staging**: Verify migrations work in staging environment
3. **Review Dependencies**: Check for application compatibility
4. **Monitor Resources**: Ensure sufficient system resources
5. **Check Blockers**: Verify no long-running transactions
6. **Plan Rollback**: Document rollback procedures

### Risk Assessment

The system automatically assesses migration risk based on:

- **Operation Type**: Some operations are inherently riskier
- **Table Size**: Large tables require more careful handling
- **Locking Behavior**: Exclusive locks cause downtime
- **Reversibility**: Irreversible operations need extra caution

### Performance Monitoring

During migrations, the system monitors:

- **Query Performance**: Average and p95 response times
- **Connection Utilization**: Active connections and pool usage
- **Error Rates**: Database errors and failed queries
- **Resource Usage**: CPU, memory, and disk utilization

## Troubleshooting

### Common Issues

1. **Migration Timeout**: Increase timeout or break into smaller operations
2. **Lock Conflicts**: Wait for blocking transactions to complete
3. **Validation Failures**: Review data consistency and fix issues
4. **Performance Degradation**: Monitor and optimize during migration

### Error Recovery

The system provides automatic error recovery:

- **Automatic Rollback**: On critical failures
- **Retry Logic**: For transient errors
- **Circuit Breaker**: To prevent cascade failures
- **Graceful Degradation**: Fallback to safe operations

### Monitoring and Alerts

Set up monitoring for:

- **Migration Progress**: Track completion percentage
- **Performance Impact**: Monitor query times and throughput
- **Error Rates**: Alert on increased error rates
- **System Health**: Monitor database and application health

## Integration

### With Existing Systems

The deployment system integrates with:

- **CI/CD Pipelines**: Automated deployment workflows
- **Monitoring Systems**: Prometheus, Grafana, and custom metrics
- **Alerting Systems**: PagerDuty, Slack, and email notifications
- **Load Balancers**: For blue-green traffic switching

### Event System

The system emits events for integration:

```typescript
migrationManager.on('migration_started', ({ operationId, operation }) => {
  // Handle migration start
});

migrationManager.on('migration_progress', ({ operationId, progress }) => {
  // Handle progress updates
});

migrationManager.on('migration_completed', ({ operationId, operation, progress }) => {
  // Handle successful completion
});

migrationManager.on('migration_failed', ({ operationId, operation, error }) => {
  // Handle migration failure
});
```

## Performance Characteristics

### Migration Performance

- **Small Tables** (< 100MB): < 30 seconds
- **Medium Tables** (100MB - 1GB): 1-5 minutes
- **Large Tables** (1GB - 10GB): 5-30 minutes
- **Very Large Tables** (> 10GB): Requires batching

### Downtime Expectations

- **ADD_COLUMN**: ~100ms
- **DROP_COLUMN**: ~50ms
- **ADD_INDEX (Concurrent)**: 0ms
- **RENAME_TABLE**: ~10ms
- **Blue-Green Switch**: ~100ms

### Resource Usage

- **CPU**: Moderate during index creation
- **Memory**: Minimal additional usage
- **Disk**: Temporary space for index creation
- **Network**: Minimal for replication

## Security Considerations

### Access Control

- **Database Permissions**: Require appropriate DDL permissions
- **Audit Logging**: Log all migration activities
- **Approval Workflows**: Optional manual approval for high-risk operations

### Data Protection

- **Encryption**: Maintain encryption during migrations
- **Backup Security**: Secure backup storage and access
- **Compliance**: Maintain GDPR and regulatory compliance

## Limitations

### Current Limitations

1. **PostgreSQL Only**: Currently supports PostgreSQL databases only
2. **Schema Changes**: Some complex schema changes not supported
3. **Cross-Database**: No support for cross-database migrations
4. **Stored Procedures**: Limited support for stored procedure migrations

### Future Enhancements

- **Multi-Database Support**: MySQL, SQL Server support
- **Advanced Schema Changes**: Complex column type changes
- **Distributed Deployments**: Multi-region deployment support
- **Enhanced Validation**: More comprehensive test suites

## Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build system
npm run build

# Run CLI
npx tsx database/deployment/deployment-cli.ts --help
```

### Testing

The system includes comprehensive tests:

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Security validation testing

## License

This zero-downtime deployment system is part of the TripleCheck database infrastructure and follows the same licensing terms as the main project.