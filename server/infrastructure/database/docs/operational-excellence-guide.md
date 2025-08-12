# TripleCheck Database Operational Excellence Guide

## Overview

This comprehensive guide provides all necessary information for operating the TripleCheck database system in production. It covers architecture, deployment procedures, monitoring, troubleshooting, and maintenance operations.

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Deployment Procedures](#deployment-procedures)
3. [Monitoring and Alerting](#monitoring-and-alerting)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Disaster Recovery](#disaster-recovery)
6. [Performance Tuning](#performance-tuning)
7. [Security Operations](#security-operations)
8. [Maintenance Procedures](#maintenance-procedures)
9. [Compliance and Auditing](#compliance-and-auditing)
10. [Emergency Procedures](#emergency-procedures)

## Database Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Load Balancer │    │   Monitoring    │
│    Servers      │◄──►│    (HAProxy)    │◄──►│   (Grafana)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Connection    │    │   Primary DB    │    │   Prometheus    │
│   Pool (PgBouncer)   │   PostgreSQL    │    │   Metrics       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Read Replica  │    │   Read Replica  │    │   Backup        │
│   PostgreSQL    │    │   PostgreSQL    │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

#### 1. PostgreSQL Primary Database
- **Version**: PostgreSQL 15+
- **Configuration**: Optimized for OLTP workloads
- **Storage**: SSD with automatic backup
- **Memory**: 16GB+ RAM recommended
- **CPU**: 8+ cores recommended

#### 2. Read Replicas
- **Count**: 2 replicas minimum
- **Replication**: Streaming replication with automatic failover
- **Load Balancing**: Intelligent read/write splitting
- **Geographic Distribution**: Cross-region for disaster recovery

#### 3. Connection Pooling
- **Technology**: PgBouncer + Custom Connection Pool
- **Pool Size**: 5-50 connections (dynamic)
- **Connection Limits**: 1000 max concurrent connections
- **Health Monitoring**: Automatic connection recycling

#### 4. Caching Layer
- **L1 Cache**: In-memory LRU (10K items, 5min TTL)
- **L2 Cache**: Redis (1hr TTL)
- **Cache Strategy**: Write-through with intelligent invalidation
- **Monitoring**: Cache hit ratios and performance metrics

### Database Schema Organization

```
database/
├── schemas/
│   ├── core/           # Users, properties, basic entities
│   ├── verification/   # Land verification workflows
│   ├── trust/          # Trust scoring and reputation
│   ├── fraud/          # Fraud detection and alerts
│   ├── communication/  # Messaging and notifications
│   └── analytics/      # Reporting and analytics
├── migrations/         # Version-controlled schema changes
├── indexes/           # Performance optimization indexes
└── constraints/       # Data integrity constraints
```

## Deployment Procedures

### Pre-Deployment Checklist

#### 1. Environment Validation
```bash
# Check database connectivity
npm run db:test-connection

# Validate schema consistency
npm run db:validate

# Run migration dry-run
npm run migrate:dry-run

# Execute integration tests
npm run test:integration

# Run production readiness assessment
npm run production:assess
```

#### 2. Performance Validation
```bash
# Run performance certification
npm run performance:certify

# Execute load testing
npm run test:load

# Validate backup procedures
npm run dr:test

# Check security compliance
npm run security:scan
```

### Deployment Process

#### 1. Blue-Green Deployment
```bash
# Step 1: Prepare new environment
npm run deploy:prepare-blue

# Step 2: Deploy to blue environment
npm run deploy:blue

# Step 3: Run validation tests
npm run deploy:validate-blue

# Step 4: Switch traffic to blue
npm run deploy:switch-to-blue

# Step 5: Monitor and validate
npm run deploy:monitor

# Step 6: Cleanup old environment (after validation)
npm run deploy:cleanup-green
```

#### 2. Zero-Downtime Migration
```bash
# Step 1: Create migration plan
npm run migrate:plan

# Step 2: Execute online schema changes
npm run migrate:online

# Step 3: Validate data integrity
npm run migrate:validate

# Step 4: Complete migration
npm run migrate:complete
```

### Post-Deployment Validation

#### 1. Health Checks
```bash
# Database health
curl -f http://localhost:3000/health/database

# Application health
curl -f http://localhost:3000/health/app

# Integration health
curl -f http://localhost:3000/health/integration
```

#### 2. Performance Validation
```bash
# Response time validation
npm run performance:validate

# Throughput testing
npm run performance:throughput

# Error rate monitoring
npm run performance:errors
```

## Monitoring and Alerting

### Key Metrics

#### 1. Database Performance
- **Query Response Time**: < 50ms average, < 100ms p95
- **Throughput**: > 10,000 queries per second
- **Connection Pool Utilization**: < 80%
- **Cache Hit Ratio**: > 90%
- **Replication Lag**: < 1 second

#### 2. System Resources
- **CPU Utilization**: < 70% average
- **Memory Usage**: < 80% of available
- **Disk I/O**: < 80% utilization
- **Network Bandwidth**: Monitor for saturation
- **Disk Space**: < 80% full

#### 3. Application Metrics
- **Error Rate**: < 0.01%
- **Uptime**: > 99.99%
- **User Sessions**: Active user monitoring
- **Transaction Success Rate**: > 99.9%

### Alerting Rules

#### Critical Alerts (Immediate Response)
```yaml
# Database down
- alert: DatabaseDown
  expr: up{job="postgresql"} == 0
  for: 30s
  labels:
    severity: critical
  annotations:
    summary: "Database is down"
    description: "PostgreSQL database is not responding"

# High error rate
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  for: 2m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors per second"

# Connection pool exhaustion
- alert: ConnectionPoolExhausted
  expr: connection_pool_active / connection_pool_max > 0.9
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Connection pool nearly exhausted"
    description: "Connection pool utilization is {{ $value }}%"
```

#### Warning Alerts (Monitor Closely)
```yaml
# High response time
- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High response time"
    description: "95th percentile response time is {{ $value }}s"

# Low cache hit ratio
- alert: LowCacheHitRatio
  expr: cache_hit_ratio < 0.8
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Low cache hit ratio"
    description: "Cache hit ratio is {{ $value }}"
```

### Monitoring Dashboards

#### 1. Database Overview Dashboard
- Connection pool status
- Query performance metrics
- Replication lag
- Resource utilization
- Error rates

#### 2. Application Performance Dashboard
- Response time percentiles
- Throughput metrics
- Error rate trends
- User activity
- Business metrics

#### 3. Infrastructure Dashboard
- Server resource utilization
- Network performance
- Storage metrics
- Security events
- Backup status

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. High Response Times

**Symptoms:**
- Slow query performance
- High p95 response times
- User complaints about slowness

**Diagnosis:**
```bash
# Check slow queries
npm run db:slow-queries

# Analyze query performance
npm run performance:analyze

# Check connection pool status
npm run db:pool-status

# Review system resources
npm run system:resources
```

**Solutions:**
1. **Query Optimization**
   ```sql
   -- Identify slow queries
   SELECT query, mean_time, calls, total_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   
   -- Add missing indexes
   CREATE INDEX CONCURRENTLY idx_properties_location 
   ON properties USING GIN (location);
   ```

2. **Connection Pool Tuning**
   ```bash
   # Increase pool size
   npm run db:pool-resize --size=100
   
   # Optimize connection recycling
   npm run db:pool-optimize
   ```

3. **Cache Optimization**
   ```bash
   # Warm up cache
   npm run cache:warmup
   
   # Optimize cache strategy
   npm run cache:optimize
   ```

#### 2. Connection Pool Exhaustion

**Symptoms:**
- "Connection pool exhausted" errors
- Application timeouts
- High connection wait times

**Diagnosis:**
```bash
# Check connection pool metrics
npm run db:pool-metrics

# Identify connection leaks
npm run db:connection-leaks

# Monitor connection lifecycle
npm run db:connection-monitor
```

**Solutions:**
1. **Increase Pool Size**
   ```bash
   # Temporarily increase pool size
   npm run db:pool-emergency-resize --size=200
   
   # Update configuration permanently
   npm run db:pool-configure --min=10 --max=100
   ```

2. **Fix Connection Leaks**
   ```bash
   # Identify and fix leaks
   npm run db:fix-connection-leaks
   
   # Restart connection pool
   npm run db:pool-restart
   ```

#### 3. Replication Lag

**Symptoms:**
- Read replicas behind primary
- Data consistency issues
- Replication alerts

**Diagnosis:**
```bash
# Check replication status
npm run db:replication-status

# Monitor replication lag
npm run db:replication-lag

# Check network connectivity
npm run network:test-replicas
```

**Solutions:**
1. **Network Optimization**
   ```bash
   # Optimize network settings
   npm run network:optimize-replication
   
   # Check bandwidth utilization
   npm run network:bandwidth-check
   ```

2. **Replication Configuration**
   ```bash
   # Optimize replication settings
   npm run db:optimize-replication
   
   # Restart replication if needed
   npm run db:restart-replication
   ```

#### 4. Disk Space Issues

**Symptoms:**
- Disk space alerts
- Write failures
- Performance degradation

**Diagnosis:**
```bash
# Check disk usage
df -h

# Identify large files
du -sh /var/lib/postgresql/data/* | sort -hr

# Check WAL file accumulation
ls -la /var/lib/postgresql/data/pg_wal/
```

**Solutions:**
1. **Immediate Cleanup**
   ```bash
   # Clean old WAL files
   npm run db:cleanup-wal

   # Archive old backups
   npm run backup:archive-old

   # Clean temporary files
   npm run db:cleanup-temp
   ```

2. **Long-term Solutions**
   ```bash
   # Increase disk space
   npm run infrastructure:expand-disk

   # Optimize retention policies
   npm run backup:optimize-retention

   # Set up automated cleanup
   npm run maintenance:setup-cleanup
   ```

### Emergency Procedures

#### 1. Database Failover

**When to Execute:**
- Primary database is unresponsive
- Corruption detected on primary
- Planned maintenance requiring downtime

**Procedure:**
```bash
# Step 1: Assess situation
npm run dr:assess-situation

# Step 2: Initiate failover
npm run dr:failover --to-replica=replica-1

# Step 3: Validate new primary
npm run dr:validate-primary

# Step 4: Update application configuration
npm run app:update-db-config

# Step 5: Monitor system health
npm run monitor:post-failover
```

#### 2. Point-in-Time Recovery

**When to Execute:**
- Data corruption detected
- Accidental data deletion
- Need to recover to specific timestamp

**Procedure:**
```bash
# Step 1: Stop application writes
npm run app:stop-writes

# Step 2: Identify recovery point
npm run dr:identify-recovery-point

# Step 3: Initiate recovery
npm run dr:recover --timestamp="2024-01-15 14:30:00"

# Step 4: Validate recovered data
npm run dr:validate-recovery

# Step 5: Resume normal operations
npm run app:resume-writes
```

#### 3. Security Incident Response

**When to Execute:**
- Unauthorized access detected
- Data breach suspected
- Security alerts triggered

**Procedure:**
```bash
# Step 1: Isolate affected systems
npm run security:isolate

# Step 2: Assess breach scope
npm run security:assess-breach

# Step 3: Secure the environment
npm run security:secure-environment

# Step 4: Collect evidence
npm run security:collect-evidence

# Step 5: Notify stakeholders
npm run security:notify-stakeholders
```

## Disaster Recovery

### Recovery Time Objectives (RTO)

- **Database Failover**: < 15 seconds
- **Point-in-Time Recovery**: < 15 minutes
- **Full System Recovery**: < 1 hour
- **Cross-Region Failover**: < 30 minutes

### Recovery Point Objectives (RPO)

- **Continuous Replication**: < 1 second data loss
- **Backup Recovery**: < 5 minutes data loss
- **Cross-Region Recovery**: < 5 minutes data loss

### Disaster Recovery Procedures

#### 1. Automated Failover
```bash
# Monitor failover status
npm run dr:monitor-failover

# Manual failover trigger
npm run dr:manual-failover

# Validate failover success
npm run dr:validate-failover
```

#### 2. Backup and Recovery
```bash
# Create full backup
npm run dr:backup-full

# Create incremental backup
npm run dr:backup-incremental

# Restore from backup
npm run dr:restore --backup-id=backup_20240115_143000

# Validate restore
npm run dr:validate-restore
```

#### 3. Cross-Region Recovery
```bash
# Initiate cross-region failover
npm run dr:cross-region-failover

# Sync data to new region
npm run dr:sync-cross-region

# Validate cross-region setup
npm run dr:validate-cross-region
```

## Performance Tuning

### Query Optimization

#### 1. Index Management
```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_properties_search 
ON properties USING GIN (
  to_tsvector('english', title || ' ' || description)
);

-- Partial indexes for common filters
CREATE INDEX CONCURRENTLY idx_properties_active_location
ON properties (location) 
WHERE is_active = true;

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_users_trust_score_created
ON users (trust_score DESC, created_at DESC)
WHERE is_active = true;
```

#### 2. Query Rewriting
```sql
-- Before: Inefficient subquery
SELECT * FROM properties 
WHERE owner_id IN (
  SELECT id FROM users WHERE trust_score > 80
);

-- After: Efficient join
SELECT p.* FROM properties p
JOIN users u ON p.owner_id = u.id
WHERE u.trust_score > 80 AND u.is_active = true;
```

### Configuration Tuning

#### 1. PostgreSQL Configuration
```ini
# Memory settings
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 256MB
maintenance_work_mem = 1GB

# Connection settings
max_connections = 200
max_prepared_transactions = 200

# WAL settings
wal_buffers = 64MB
checkpoint_completion_target = 0.9
wal_compression = on

# Query planner
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### 2. Connection Pool Configuration
```javascript
// Connection pool settings
const poolConfig = {
  min: 5,
  max: 50,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
};
```

### Monitoring Performance

#### 1. Key Performance Indicators
```bash
# Query performance
npm run performance:query-stats

# Connection pool metrics
npm run performance:pool-stats

# Cache performance
npm run performance:cache-stats

# System resource usage
npm run performance:system-stats
```

#### 2. Performance Baselines
```bash
# Establish performance baselines
npm run performance:baseline-create

# Compare current performance to baseline
npm run performance:baseline-compare

# Generate performance report
npm run performance:report
```

## Security Operations

### Access Control Management

#### 1. Role-Based Access Control
```sql
-- Create database roles
CREATE ROLE app_read;
CREATE ROLE app_write;
CREATE ROLE app_admin;

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_write;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;

-- Create application users
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT app_write TO app_user;
```

#### 2. Connection Security
```bash
# Enable SSL/TLS
npm run security:enable-ssl

# Configure certificate management
npm run security:manage-certificates

# Update connection strings
npm run security:update-connections
```

### Audit Logging

#### 1. Enable Audit Logging
```sql
-- Enable audit logging
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- Reload configuration
SELECT pg_reload_conf();
```

#### 2. Monitor Security Events
```bash
# Check security logs
npm run security:check-logs

# Generate security report
npm run security:report

# Monitor failed login attempts
npm run security:monitor-failed-logins
```

### Compliance Management

#### 1. GDPR Compliance
```bash
# Data anonymization
npm run compliance:anonymize-data

# Right to be forgotten
npm run compliance:delete-user-data --user-id=12345

# Data export
npm run compliance:export-user-data --user-id=12345

# Compliance audit
npm run compliance:audit
```

#### 2. Security Scanning
```bash
# Vulnerability scanning
npm run security:scan-vulnerabilities

# Dependency checking
npm run security:check-dependencies

# Configuration audit
npm run security:audit-config
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### 1. Daily Tasks
```bash
# Health check
npm run maintenance:daily-health-check

# Backup validation
npm run maintenance:validate-backups

# Performance monitoring
npm run maintenance:performance-check

# Security log review
npm run maintenance:security-review
```

#### 2. Weekly Tasks
```bash
# Database statistics update
npm run maintenance:update-statistics

# Index maintenance
npm run maintenance:reindex

# Cleanup old data
npm run maintenance:cleanup-old-data

# Performance analysis
npm run maintenance:performance-analysis
```

#### 3. Monthly Tasks
```bash
# Full system backup
npm run maintenance:full-backup

# Security audit
npm run maintenance:security-audit

# Capacity planning review
npm run maintenance:capacity-review

# Disaster recovery test
npm run maintenance:dr-test
```

### Automated Maintenance

#### 1. Setup Automated Tasks
```bash
# Configure automated maintenance
npm run maintenance:setup-automation

# Schedule regular tasks
npm run maintenance:schedule-tasks

# Monitor automation health
npm run maintenance:monitor-automation
```

#### 2. Maintenance Windows
```bash
# Schedule maintenance window
npm run maintenance:schedule-window --date="2024-01-15" --time="02:00"

# Execute maintenance tasks
npm run maintenance:execute-window

# Validate post-maintenance
npm run maintenance:validate-window
```

## Emergency Contacts and Escalation

### Contact Information

#### 1. Primary Contacts
- **Database Administrator**: dba@triplecheck.com
- **DevOps Engineer**: devops@triplecheck.com
- **Security Team**: security@triplecheck.com
- **On-Call Engineer**: oncall@triplecheck.com

#### 2. Escalation Matrix
1. **Level 1**: On-call engineer (immediate response)
2. **Level 2**: Senior DBA (within 15 minutes)
3. **Level 3**: Engineering Manager (within 30 minutes)
4. **Level 4**: CTO (within 1 hour)

### Communication Channels

#### 1. Incident Communication
- **Slack**: #incidents-database
- **Email**: incidents@triplecheck.com
- **Phone**: +1-555-INCIDENT
- **Status Page**: status.triplecheck.com

#### 2. Regular Communication
- **Slack**: #database-ops
- **Email**: database-team@triplecheck.com
- **Weekly Reports**: database-reports@triplecheck.com

## Conclusion

This operational excellence guide provides comprehensive procedures for managing the TripleCheck database system in production. Regular review and updates of these procedures ensure continued operational excellence and system reliability.

For additional support or questions, contact the database operations team at database-ops@triplecheck.com.

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Next Review**: April 2024  
**Owner**: Database Operations Team