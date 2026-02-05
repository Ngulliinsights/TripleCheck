# Comprehensive Disaster Recovery System

A complete disaster recovery solution for TripleCheck's database infrastructure, providing automated backup management, point-in-time recovery, cross-region failover, and comprehensive testing capabilities.

## Features

### 🔄 Automated Backup Management
- **Full and Incremental Backups**: Automated daily full backups and 6-hourly incremental backups
- **WAL Archiving**: Continuous Write-Ahead Log archiving for point-in-time recovery
- **Cross-Region Replication**: Automatic backup replication to multiple regions (S3, GCS, Azure)
- **Backup Validation**: Automated integrity checks and restore testing
- **Compression & Encryption**: AES-256 encryption and intelligent compression

### 🚨 Disaster Recovery Scenarios
- **Complete Database Loss**: Full database restoration from backups
- **Point-in-Time Recovery**: Recover to any specific point in time
- **Partial Data Corruption**: Selective recovery of corrupted tables
- **Cross-Region Failover**: Automatic failover to secondary regions

### 🔍 Health Monitoring & Alerting
- **Real-time Health Checks**: Continuous monitoring of database health
- **Multi-channel Alerting**: Email, Slack, SMS, and webhook notifications
- **Performance Monitoring**: Query performance, connection pool, and resource usage
- **Automated Response**: Configurable automated recovery actions

### 🧪 Comprehensive Testing Framework
- **Automated Testing**: Scheduled disaster recovery drills
- **Dry Run Capabilities**: Test scenarios without affecting production
- **Performance Validation**: RTO/RPO compliance testing
- **Detailed Reporting**: Comprehensive test reports and metrics

### 📖 Documentation & Runbooks
- **Auto-generated Runbooks**: Step-by-step recovery procedures
- **Scenario-specific Guides**: Detailed procedures for each disaster type
- **Operational Procedures**: Daily, weekly, and monthly maintenance tasks
- **Testing Procedures**: Comprehensive testing guidelines

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Initialize disaster recovery system
npm run dr:init
```

### Configuration

Create or update `database/disaster-recovery/config.json`:

```json
{
  "database": {
    "primary": {
      "host": "localhost",
      "port": 5432,
      "database": "triplecheck",
      "username": "postgres",
      "password": "your-password"
    }
  },
  "storage": {
    "local": {
      "path": "./database/disaster-recovery/storage",
      "maxSizeGB": 100
    }
  },
  "recovery": {
    "rpoMinutes": 5,
    "rtoMinutes": 15,
    "enableWALArchiving": true,
    "enablePointInTimeRecovery": true,
    "retentionDays": 30
  }
}
```

### Basic Usage

```bash
# Perform health check
npm run dr:health-check

# Create full backup
npm run dr:backup:full

# Test all disaster recovery scenarios
npm run dr:test-all

# Execute disaster recovery (dry run)
npm run dr:recover complete_database_loss --dry-run

# Generate runbooks
npm run dr:generate-runbooks
```

## Available Commands

### Health & Monitoring
```bash
npm run dr:health-check              # Comprehensive health check
npm run dr:health-check:json         # Health check with JSON output
npm run dr:monitor                   # Start continuous monitoring
npm run dr:monitor:fast              # Monitor every 30 seconds
```

### Disaster Recovery
```bash
npm run dr:recover <scenario>                    # Execute recovery scenario
npm run dr:recover:complete-database-loss       # Complete database loss recovery
npm run dr:recover:point-in-time                # Point-in-time recovery
npm run dr:recover:partial-corruption           # Partial data corruption recovery
npm run dr:recover:cross-region-failover        # Cross-region failover
```

### Testing
```bash
npm run dr:test-all                  # Test all scenarios
npm run dr:test <scenario>           # Test specific scenario
npm run dr:test:complete-database-loss    # Test database loss scenario
npm run dr:test:point-in-time            # Test point-in-time recovery
```

### Backup Management
```bash
npm run dr:backup:full               # Create full backup
npm run dr:backup:incremental        # Create incremental backup
npm run dr:backup:status             # Show backup status
npm run dr:backup:validate           # Validate all backups
npm run dr:backup:cleanup            # Clean up old backups
```

### Documentation
```bash
npm run dr:generate-runbooks         # Generate all runbooks
npm run dr:list-scenarios            # List available scenarios
```

## Disaster Recovery Scenarios

### 1. Complete Database Loss
**Scenario**: Primary database is completely unavailable
- **Estimated RTO**: 15 minutes
- **Estimated RPO**: 5 minutes
- **Automated Response**: Optional

**Recovery Steps**:
1. Assess situation and verify database unavailability
2. Activate read replica if available
3. Restore from latest full backup
4. Apply WAL files for point-in-time recovery
5. Update application configuration

### 2. Point-in-Time Recovery
**Scenario**: Data corruption or user error requiring rollback
- **Estimated RTO**: 10 minutes
- **Estimated RPO**: 1 minute
- **Automated Response**: No (requires manual approval)

**Recovery Steps**:
1. Identify exact recovery point
2. Create recovery database instance
3. Restore base backup
4. Apply WAL files to target time
5. Validate recovery and switch over

### 3. Partial Data Corruption
**Scenario**: Specific tables or data segments corrupted
- **Estimated RTO**: 8 minutes
- **Estimated RPO**: 2 minutes
- **Automated Response**: No

**Recovery Steps**:
1. Identify corrupted data
2. Backup current state
3. Extract clean data from backup
4. Replace corrupted data
5. Verify data integrity

### 4. Cross-Region Failover
**Scenario**: Primary region unavailable
- **Estimated RTO**: 12 minutes
- **Estimated RPO**: 10 minutes
- **Automated Response**: Optional

**Recovery Steps**:
1. Assess primary region availability
2. Activate secondary region
3. Sync latest data if possible
4. Update DNS routing
5. Validate failover

## Configuration Reference

### Database Configuration
```json
{
  "database": {
    "primary": {
      "host": "primary-db.example.com",
      "port": 5432,
      "database": "triplecheck",
      "username": "postgres",
      "password": "secure-password"
    },
    "replicas": [
      {
        "id": "replica-1",
        "host": "replica1.example.com",
        "port": 5432,
        "region": "us-east-1",
        "priority": 1
      }
    ]
  }
}
```

### Storage Configuration
```json
{
  "storage": {
    "local": {
      "path": "./disaster-recovery/storage",
      "maxSizeGB": 100
    },
    "crossRegion": {
      "enabled": true,
      "regions": [
        {
          "id": "us-east-1",
          "type": "s3",
          "bucket": "triplecheck-dr-backups",
          "encryption": true
        }
      ]
    }
  }
}
```

### Recovery Configuration
```json
{
  "recovery": {
    "rpoMinutes": 5,
    "rtoMinutes": 15,
    "enableWALArchiving": true,
    "enablePointInTimeRecovery": true,
    "retentionDays": 30,
    "testingSchedule": {
      "backupValidation": "daily",
      "pointInTimeRecovery": "weekly",
      "fullDisasterRecovery": "monthly"
    }
  }
}
```

### Monitoring Configuration
```json
{
  "monitoring": {
    "enableHealthChecks": true,
    "checkIntervalSeconds": 60,
    "alerting": {
      "enabled": true,
      "channels": [
        {
          "type": "email",
          "config": {
            "recipients": ["admin@triplecheck.co.ke"]
          },
          "severity": "high"
        },
        {
          "type": "slack",
          "config": {
            "webhookUrl": "https://hooks.slack.com/...",
            "channel": "#disaster-recovery"
          },
          "severity": "medium"
        }
      ]
    },
    "thresholds": {
      "backupAge": 25,
      "walArchiveLag": 10,
      "replicationLag": 30,
      "diskUsage": 85,
      "connectionFailures": 3
    }
  }
}
```

### Automation Configuration
```json
{
  "automation": {
    "enableAutomatedFailover": false,
    "enableAutomatedRecovery": false,
    "enableAutomatedTesting": true,
    "maxAutomatedActions": 5,
    "requireManualApproval": true
  }
}
```

## API Usage

### Programmatic Usage

```typescript
import { ComprehensiveDisasterRecovery } from './database/disaster-recovery';

// Initialize system
const drSystem = new ComprehensiveDisasterRecovery(config);
await drSystem.initialize();

// Perform health check
const healthStatus = await drSystem.performHealthChecks();
console.log('System health:', healthStatus.overall);

// Execute disaster recovery
const executionId = await drSystem.executeDisasterRecovery('complete_database_loss', {
  dryRun: true
});

// Test all scenarios
const testResults = await drSystem.testAllScenarios();
console.log(`Tests passed: ${testResults.summary.passed}/${testResults.summary.totalScenarios}`);

// Generate runbooks
const runbooks = await drSystem.generateComprehensiveRunbooks();
console.log(`Generated ${runbooks.length} runbooks`);

// Cleanup
await drSystem.shutdown();
```

### Event Handling

```typescript
// Listen for system events
drSystem.on('system_initialized', () => {
  console.log('Disaster recovery system initialized');
});

drSystem.on('disaster_recovery_started', ({ execution, scenario }) => {
  console.log(`Started recovery: ${scenario.name}`);
});

drSystem.on('disaster_recovery_completed', ({ execution, scenario }) => {
  console.log(`Completed recovery: ${scenario.name} in ${execution.metrics.actualRTO} minutes`);
});

drSystem.on('critical_alert', ({ message, healthStatus }) => {
  console.error('CRITICAL ALERT:', message);
  // Trigger emergency procedures
});

drSystem.on('health_check_completed', (healthStatus) => {
  if (healthStatus.overall !== 'healthy') {
    console.warn('Health check warning:', healthStatus);
  }
});
```

## Testing

### Unit Tests
```bash
npm run test database/disaster-recovery/__tests__/
```

### Integration Tests
```bash
npm run test database/disaster-recovery/__tests__/disaster-recovery-integration.test.ts
```

### End-to-End Testing
```bash
# Test all disaster recovery scenarios
npm run dr:test-all

# Test specific scenario with detailed output
npm run dr:test complete_database_loss --dry-run
```

## Monitoring & Alerting

### Health Check Metrics
- **Database Connectivity**: Primary and replica database connections
- **Backup Age**: Time since last successful backup
- **WAL Archiving**: Write-Ahead Log archiving status
- **Disk Usage**: Storage utilization for backup storage
- **Replication Lag**: Delay between primary and replicas

### Alert Channels
- **Email**: SMTP-based email notifications
- **Slack**: Webhook-based Slack notifications
- **SMS**: Twilio-based SMS alerts for critical issues
- **Webhook**: Custom webhook integrations

### Alert Severities
- **Critical**: Immediate action required (database down, backup failures)
- **High**: Urgent attention needed (high replication lag, disk space low)
- **Medium**: Monitoring required (backup age warnings)
- **Low**: Informational (successful tests, routine maintenance)

## Security

### Data Protection
- **Encryption at Rest**: AES-256 encryption for all backups
- **Encryption in Transit**: TLS 1.3 for all database connections
- **Access Control**: Role-based access control for disaster recovery operations
- **Audit Logging**: Comprehensive logging of all recovery operations

### Compliance
- **GDPR Compliance**: Data anonymization and right-to-be-forgotten support
- **Audit Trail**: Tamper-proof audit logs with 7-year retention
- **Security Monitoring**: Real-time threat detection and response

## Performance

### Benchmarks
- **Health Check Duration**: < 5 seconds
- **Backup Creation**: < 30 minutes for full backup
- **Recovery Time**: < 15 minutes (RTO target)
- **Data Loss**: < 5 minutes (RPO target)

### Optimization
- **Parallel Processing**: Concurrent backup and recovery operations
- **Compression**: Intelligent compression reducing storage by 70%
- **Incremental Backups**: Reduced backup time and storage usage
- **Connection Pooling**: Optimized database connection management

## Troubleshooting

### Common Issues

#### Backup Failures
```bash
# Check backup status
npm run dr:backup:status

# Validate existing backups
npm run dr:backup:validate

# Check disk space
df -h ./database/disaster-recovery/storage
```

#### Health Check Failures
```bash
# Run detailed health check
npm run dr:health-check:json

# Check database connectivity
psql -h localhost -p 5432 -U postgres -d triplecheck -c "SELECT 1"

# Check WAL archiving
npm run dr:health-check | grep "WAL"
```

#### Recovery Failures
```bash
# Check recovery logs
tail -f ./database/disaster-recovery/storage/logs/recovery.log

# Test recovery in dry run mode
npm run dr:test complete_database_loss --dry-run

# Validate recovery prerequisites
npm run dr:health-check
```

### Log Locations
- **System Logs**: `./database/disaster-recovery/storage/logs/system.log`
- **Recovery Logs**: `./database/disaster-recovery/storage/logs/recovery.log`
- **Backup Logs**: `./database/disaster-recovery/storage/logs/backup.log`
- **Test Logs**: `./database/disaster-recovery/storage/logs/testing.log`

## Contributing

### Development Setup
```bash
# Clone repository
git clone https://github.com/triplecheck/triplecheck.git
cd triplecheck

# Install dependencies
npm install

# Run tests
npm run test database/disaster-recovery/

# Run integration tests
npm run test:integration database/disaster-recovery/
```

### Adding New Scenarios
1. Define scenario in `ComprehensiveDisasterRecovery.ts`
2. Add recovery steps and validation checks
3. Create scenario-specific tests
4. Update documentation and runbooks

### Code Style
- Follow TypeScript best practices
- Use comprehensive error handling
- Include detailed logging
- Write comprehensive tests
- Document all public APIs

## Support

### Documentation
- **Runbooks**: Auto-generated in `./database/disaster-recovery/storage/runbooks/`
- **API Documentation**: TypeScript definitions and JSDoc comments
- **Configuration Guide**: Detailed configuration examples

### Getting Help
- **Technical Issues**: Create GitHub issue with detailed logs
- **Configuration Help**: Check configuration examples and validation
- **Emergency Support**: Follow emergency contact procedures in runbooks

## License

This disaster recovery system is part of the TripleCheck project and follows the same licensing terms.

---

**⚠️ Important**: This system handles critical database operations. Always test thoroughly in non-production environments before deploying to production. Ensure you have proper backups and recovery procedures in place before relying on automated disaster recovery.