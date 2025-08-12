# TripleCheck Comprehensive Monitoring Integration Guide

## Overview

This guide explains how to integrate and use the comprehensive observability and alerting system built for TripleCheck's database optimization and production readiness.

## Quick Start

### 1. Install Dependencies

```bash
npm install prom-client nodemailer twilio
```

### 2. Set Up Environment Variables

Create a `.env` file with the following variables:

```bash
# Database Configuration
POSTGRES_USER=triplecheck_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=triplecheck

# Grafana Configuration
GRAFANA_PASSWORD=your_grafana_password

# Slack Integration (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# PagerDuty Integration (Optional)
PAGERDUTY_INTEGRATION_KEY=your_pagerduty_integration_key

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@triplecheck.com
SMTP_PASSWORD=your_email_password
ALERT_FROM_EMAIL=alerts@triplecheck.com
ALERT_TO_EMAILS=oncall@triplecheck.com,admin@triplecheck.com

# SMS Configuration (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=+1234567890
ONCALL_PHONES=+1234567890,+0987654321
```

### 3. Deploy Monitoring Stack

```bash
# For development environment
npm run setup:monitoring:comprehensive development

# For staging environment
npm run setup:monitoring:comprehensive staging

# For production environment
npm run setup:monitoring:comprehensive production
```

### 4. Integrate with Your Application

Add to your main application file (e.g., `server/app.ts`):

```typescript
import { initializeMonitoring } from './infrastructure/monitoring';

// Initialize monitoring before other middleware
await initializeMonitoring(app, {
  enableMetrics: true,
  enableAlerting: true,
  enableHttpMetrics: true,
  enableDatabaseMetrics: true,
  enableBusinessMetrics: true,
  enableCacheMetrics: true
});
```

## Component Overview

### 1. ObservabilitySystem (`server/infrastructure/monitoring/ObservabilitySystem.ts`)

Core metrics collection system with Prometheus integration:

- **Database Metrics**: Query duration, throughput, errors, connection pool status
- **Business Metrics**: Land verification rates, fraud alerts, user activity
- **Cache Metrics**: Hit rates, miss rates, performance
- **Application Metrics**: HTTP requests, response times, error rates

### 2. AlertingSystem (`server/infrastructure/monitoring/AlertingSystem.ts`)

Comprehensive alerting with multi-channel notifications:

- **Alert Processing**: Automatic alert lifecycle management
- **Escalation Policies**: Time-based escalation with multiple notification channels
- **Incident Management**: Full incident tracking with timeline and assignment
- **Notification Channels**: Slack, PagerDuty, Email, SMS, Webhooks

### 3. PrometheusMetrics (`server/infrastructure/monitoring/PrometheusMetrics.ts`)

Express middleware and utility functions for metrics collection:

- **HTTP Middleware**: Automatic request/response metrics
- **Database Wrapper**: Query performance tracking
- **Cache Wrapper**: Cache operation metrics
- **Business Event Recording**: Custom business metrics

### 4. Grafana Dashboards

Pre-configured dashboards for comprehensive monitoring:

- **Database Health** (`scripts/deployment/grafana/dashboards/database-health.json`)
- **Query Performance** (`scripts/deployment/grafana/dashboards/query-performance.json`)
- **Business Metrics** (`scripts/deployment/grafana/dashboards/business-metrics.json`)

## Usage Examples

### Recording Database Operations

```typescript
import { recordDatabaseQuery } from './infrastructure/monitoring';

// Wrap database queries
const users = await recordDatabaseQuery('SELECT', 'users', async () => {
  return await db.select().from(users).where(eq(users.active, true));
});
```

### Recording Business Events

```typescript
import { 
  recordLandVerificationStarted,
  recordLandVerificationCompleted,
  recordFraudAlert 
} from './infrastructure/monitoring';

// Record land verification events
recordLandVerificationStarted('Nairobi', 'residential');

// After verification completes
recordLandVerificationCompleted('success', 'Nairobi', 'residential', 1800); // 30 minutes

// Record fraud alerts
recordFraudAlert('high', 'document_forgery', 'Nairobi');
```

### Recording Cache Operations

```typescript
import { recordCacheOperation } from './infrastructure/monitoring';

// Wrap cache operations
const cachedData = await recordCacheOperation('get', 'L1', 'user:*', async () => {
  return await cache.get(cacheKey);
});
```

### Manual Alert Creation

```typescript
import { alertingSystem } from './infrastructure/monitoring';

// Create a custom alert
await alertingSystem.processAlert({
  id: 'custom-alert-123',
  name: 'Custom Business Alert',
  severity: 'high',
  status: 'firing',
  startsAt: new Date(),
  labels: {
    alertname: 'CustomAlert',
    team: 'business',
    service: 'verification'
  },
  annotations: {
    summary: 'Custom business condition detected',
    description: 'Detailed description of the issue',
    runbook_url: 'https://docs.triplecheck.com/runbooks/custom-alert'
  },
  fingerprint: 'custom-alert-fingerprint'
});
```

## Alert Configuration

### Alert Severity Levels

- **Critical**: Immediate response required (0-5 minutes)
- **High**: Quick response required (15 minutes)
- **Medium**: Standard response time (30 minutes)
- **Low**: Non-urgent issues (2 hours)

### Escalation Policies

1. **Immediate**: Critical alerts with instant notifications
2. **15min**: High priority with 15-minute escalation
3. **30min**: Medium priority with 30-minute escalation
4. **2hours**: Low priority with 2-hour escalation

### Notification Channels

- **Slack**: Real-time team notifications
- **PagerDuty**: On-call engineer alerts
- **Email**: Detailed alert information
- **SMS**: Critical alert notifications
- **Webhook**: Integration with external systems

## Dashboard Access

After deployment, access the monitoring dashboards:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/your_password)
- **Alertmanager**: http://localhost:9093

### Key Dashboards

1. **Database Health**
   - Connection pool usage
   - Transaction success rates
   - Buffer cache hit ratios
   - Active locks and queries

2. **Query Performance**
   - Query response times by operation
   - Slow query detection
   - Table-specific performance
   - Cache hit rates

3. **Business Metrics**
   - Land verification success rates
   - Fraud detection activity
   - User registration and activity
   - Property listing metrics

## Maintenance

### Daily Tasks

1. Check Grafana dashboards for anomalies
2. Review active alerts in Alertmanager
3. Validate that all exporters are running

### Weekly Tasks

1. Review alert thresholds and adjust if needed
2. Check disk usage for Prometheus data
3. Update dashboard configurations

### Monthly Tasks

1. Review and update runbooks
2. Test all notification channels
3. Analyze performance trends and optimize

## Troubleshooting

### Common Issues

1. **Metrics not appearing in Prometheus**
   - Check that your application is exposing `/metrics/prometheus` endpoint
   - Verify Prometheus configuration includes your service targets
   - Check network connectivity between Prometheus and your services

2. **Alerts not firing**
   - Verify alert rules syntax with `promtool check rules`
   - Check that metrics are being collected
   - Review alert rule expressions in Prometheus UI

3. **Notifications not being sent**
   - Check Alertmanager configuration
   - Verify notification channel credentials
   - Test notification channels manually

4. **Grafana dashboards not loading**
   - Check Grafana logs for errors
   - Verify datasource configuration
   - Ensure dashboard JSON files are valid

### Logs and Debugging

```bash
# View all monitoring service logs
cd monitoring && docker-compose logs -f

# Check specific service logs
docker logs prometheus
docker logs grafana
docker logs alertmanager

# Validate configurations
promtool check config monitoring/prometheus/prometheus.yml
amtool check-config monitoring/alertmanager/alertmanager.yml
```

## Performance Considerations

### Metrics Retention

- **Prometheus**: 30 days of metrics data
- **Grafana**: Dashboards and configurations
- **Alertmanager**: 5 days of alert history

### Resource Usage

- **Prometheus**: ~2GB RAM, 10GB disk for 30 days
- **Grafana**: ~512MB RAM, 1GB disk
- **Alertmanager**: ~256MB RAM, 1GB disk

### Scaling

For high-traffic environments:

1. Use Prometheus federation for multiple instances
2. Implement remote storage for long-term retention
3. Use Grafana clustering for high availability
4. Consider Thanos for long-term storage and querying

## Security Considerations

1. **Network Security**: Use internal networks for monitoring traffic
2. **Authentication**: Enable authentication for all monitoring services
3. **Encryption**: Use TLS for all external communications
4. **Access Control**: Implement role-based access for Grafana
5. **Secrets Management**: Use secure secret storage for credentials

## Integration with CI/CD

Add monitoring validation to your deployment pipeline:

```yaml
# Example GitHub Actions step
- name: Validate Monitoring
  run: |
    # Check that metrics endpoint is accessible
    curl -f http://localhost:3001/metrics/prometheus
    
    # Validate alert rules
    promtool check rules monitoring/prometheus/rules/*.yml
    
    # Test notification channels
    npm run test:monitoring:notifications
```

## Support and Documentation

- **Runbook**: `monitoring/docs/RUNBOOK.md`
- **Architecture**: `monitoring/docs/README.md`
- **API Documentation**: Available at `/metrics/health` endpoint
- **Prometheus Queries**: See dashboard JSON files for examples

For additional support, refer to the generated documentation in the `monitoring/docs/` directory after running the setup script.