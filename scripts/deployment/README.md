# Land Verification System - Deployment Guide

This directory contains all the deployment and monitoring infrastructure for the Kenya Land Verification System.

## Overview

The deployment system provides:
- Automated deployment scripts for all environments
- Comprehensive health checks and monitoring
- Metrics collection and alerting
- Production-ready Docker configurations
- Kubernetes deployment manifests
- Deployment validation tests

## Quick Start

### 1. Deploy to Development
```bash
npm run deploy:land-verification:dev
```

### 2. Deploy to Staging
```bash
npm run deploy:land-verification:staging
```

### 3. Deploy to Production
```bash
npm run deploy:land-verification:prod
```

### 4. Set up Monitoring
```bash
npm run setup:monitoring:prod
```

### 5. Run Deployment Tests
```bash
npm run test:deployment:prod
```

## Components

### Deployment Scripts

#### `deploy-land-verification.ts`
Main deployment orchestrator that:
- Runs pre-deployment checks
- Builds and deploys all services
- Executes database migrations
- Performs health checks
- Runs deployment validation tests
- Handles rollback on failure

#### `setup-monitoring.ts`
Monitoring infrastructure setup that:
- Configures Prometheus for metrics collection
- Sets up Grafana dashboards
- Configures Alertmanager for notifications
- Creates Docker Compose configurations
- Validates monitoring stack health

#### `deployment-tests.ts`
Comprehensive test suite that validates:
- Health check endpoints
- API endpoint functionality
- Database connectivity
- External API integrations
- Performance benchmarks
- Security configurations
- Monitoring system health

### Docker Configurations

#### `docker-compose.land-verification.yml`
Production-ready Docker Compose configuration including:
- All land verification services
- Redis for caching
- PostgreSQL database
- Prometheus monitoring
- Grafana dashboards
- Health checks and restart policies

### Kubernetes Manifests

#### `kubernetes/land-verification-deployment.yaml`
Kubernetes deployment configurations with:
- Service deployments with replicas
- Resource limits and requests
- Health checks (liveness/readiness)
- Service discovery
- ConfigMaps and Secrets

### Monitoring Configuration

#### `prometheus.yml`
Prometheus configuration for:
- Service discovery
- Metrics scraping
- Alert rule evaluation
- Integration with Alertmanager

#### `alert_rules.yml`
Alert rules for:
- High verification failure rates
- Slow processing times
- External API failures
- Infrastructure issues
- Security concerns

#### `grafana/`
Grafana configuration including:
- Data source provisioning
- Dashboard provisioning
- Custom dashboards for land verification metrics

## Environment Variables

### Required for Deployment
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port

# External APIs
MINISTRY_OF_LANDS_API_KEY=your_api_key
MINISTRY_OF_LANDS_API_URL=https://api.lands.go.ke
COURT_RECORDS_API_KEY=your_api_key
COURT_RECORDS_API_URL=https://api.courts.go.ke

# Monitoring
MONITORING_API_KEY=your_monitoring_key
```

### Optional for Alerting
```bash
# Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_ALERT_CHANNEL=#alerts

# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
ALERT_FROM_EMAIL=alerts@yourcompany.com
ALERT_TO_EMAILS=admin@yourcompany.com,ops@yourcompany.com

# Webhook notifications
ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
ALERT_WEBHOOK_TOKEN=your_webhook_token
```

## Deployment Process

### 1. Pre-deployment Checks
- Environment variable validation
- Database connectivity
- External API availability
- Resource availability

### 2. Build Phase
- Service compilation
- Container image building
- Asset optimization

### 3. Database Migration
- Schema updates
- Data migrations
- Index creation

### 4. Service Deployment
- Rolling updates
- Health check validation
- Service registration

### 5. Post-deployment Validation
- End-to-end testing
- Performance validation
- Security checks
- Monitoring verification

### 6. Rollback (if needed)
- Service version revert
- Database rollback
- Cache invalidation

## Monitoring and Alerting

### Metrics Collected
- **Verification Metrics**: Success rates, processing times, risk assessments
- **API Metrics**: Response times, error rates, availability
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Business Metrics**: User activity, system utilization

### Alert Conditions
- **Critical**: Service failures, database issues, security breaches
- **High**: Performance degradation, API failures
- **Medium**: Resource warnings, slow responses
- **Low**: Informational alerts, maintenance reminders

### Notification Channels
- **Slack**: Real-time team notifications
- **Email**: Detailed alert information
- **Webhook**: Integration with external systems
- **SMS**: Critical alerts (if configured)

## Health Checks

### Endpoint Types
- **`/health`**: Comprehensive health status with dependency checks
- **`/ready`**: Readiness for traffic (Kubernetes readiness probe)
- **`/live`**: Basic liveness check (Kubernetes liveness probe)

### Health Check Components
- Database connectivity
- Redis availability
- External API accessibility
- Memory usage
- Disk space

## Performance Monitoring

### Key Performance Indicators
- **Verification Success Rate**: Target >95%
- **Average Processing Time**: Target <2 minutes
- **API Response Time**: Target <5 seconds
- **System Uptime**: Target >99.9%

### Performance Testing
- Load testing with concurrent verifications
- Stress testing under high load
- Endurance testing for long-running processes
- Spike testing for traffic bursts

## Security

### Security Measures
- HTTPS enforcement
- API authentication and authorization
- Input validation and sanitization
- SQL injection protection
- Rate limiting
- Audit logging

### Security Testing
- Vulnerability scanning
- Penetration testing
- Authentication bypass testing
- Authorization testing
- Data protection validation

## Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check deployment logs
docker-compose logs -f land-verification-service

# Validate configuration
npm run test:deployment

# Check health status
curl http://localhost:3000/health
```

#### Performance Issues
```bash
# Check metrics
curl http://localhost:3000/metrics

# Monitor resource usage
docker stats

# Check database performance
npm run db:check
```

#### Alert Issues
```bash
# Test alerting
curl -X POST http://localhost:3000/alerts/test

# Check alert rules
curl http://localhost:9090/api/v1/rules

# Validate notification channels
curl http://localhost:9093/api/v1/status
```

## Maintenance

### Regular Tasks
- **Daily**: Monitor alerts and system health
- **Weekly**: Review performance metrics and trends
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Capacity planning and performance optimization

### Backup and Recovery
- Database backups (automated daily)
- Configuration backups
- Monitoring data retention
- Disaster recovery procedures

## Support

For deployment issues or questions:
1. Check the troubleshooting section above
2. Review deployment logs and metrics
3. Consult the monitoring dashboards
4. Contact the development team

## Contributing

When adding new services or modifying deployment:
1. Update deployment scripts
2. Add appropriate health checks
3. Include monitoring metrics
4. Update alert rules
5. Add deployment tests
6. Update this documentation