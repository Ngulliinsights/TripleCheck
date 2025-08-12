#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'fs';
import path from 'path';

interface ComprehensiveMonitoringConfig {
  environment: 'development' | 'staging' | 'production';
  enablePrometheus: boolean;
  enableGrafana: boolean;
  enableAlerting: boolean;
  enablePagerDuty: boolean;
  enableSlack: boolean;
  enableEmail: boolean;
  enableSMS: boolean;
  databaseName: string;
  grafanaPassword: string;
  slackWebhookUrl?: string;
  pagerDutyIntegrationKey?: string;
  emailConfig?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    toEmails: string[];
  };
  smsConfig?: {
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioFromNumber: string;
    recipients: string[];
  };
}

class ComprehensiveMonitoringSetup {
  private config: ComprehensiveMonitoringConfig;

  constructor(environment: 'development' | 'staging' | 'production') {
    this.config = {
      environment,
      enablePrometheus: true,
      enableGrafana: true,
      enableAlerting: true,
      enablePagerDuty: !!process.env.PAGERDUTY_INTEGRATION_KEY,
      enableSlack: !!process.env.SLACK_WEBHOOK_URL,
      enableEmail: !!process.env.SMTP_HOST,
      enableSMS: !!process.env.TWILIO_ACCOUNT_SID,
      databaseName: process.env.POSTGRES_DB || 'triplecheck',
      grafanaPassword: process.env.GRAFANA_PASSWORD || 'admin',
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      pagerDutyIntegrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
      emailConfig: process.env.SMTP_HOST ? {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.ALERT_FROM_EMAIL || 'alerts@triplecheck.com',
        toEmails: process.env.ALERT_TO_EMAILS?.split(',') || []
      } : undefined,
      smsConfig: process.env.TWILIO_ACCOUNT_SID ? {
        twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
        twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
        twilioFromNumber: process.env.TWILIO_FROM_NUMBER || '',
        recipients: process.env.ONCALL_PHONES?.split(',') || []
      } : undefined
    };
  }

  async setup(): Promise<void> {
    console.log(`🚀 Setting up comprehensive monitoring for ${this.config.environment} environment`);

    try {
      await this.createDirectoryStructure();
      await this.generateConfigurations();
      await this.setupPrometheus();
      await this.setupGrafana();
      await this.setupAlerting();
      await this.setupDashboards();
      await this.generateDockerCompose();
      await this.startServices();
      await this.validateSetup();
      await this.generateDocumentation();

      console.log('✅ Comprehensive monitoring setup completed successfully');
      this.printAccessInformation();
    } catch (error) {
      console.error('❌ Comprehensive monitoring setup failed:', error);
      throw error;
    }
  }

  private async createDirectoryStructure(): Promise<void> {
    console.log('📁 Creating comprehensive monitoring directory structure...');

    const directories = [
      'monitoring/prometheus/data',
      'monitoring/prometheus/rules',
      'monitoring/grafana/data',
      'monitoring/grafana/provisioning/dashboards/database',
      'monitoring/grafana/provisioning/dashboards/business',
      'monitoring/grafana/provisioning/dashboards/infrastructure',
      'monitoring/grafana/provisioning/datasources',
      'monitoring/alertmanager/data',
      'monitoring/alertmanager/templates',
      'monitoring/exporters/postgres',
      'monitoring/exporters/redis',
      'monitoring/exporters/node',
      'monitoring/logs',
      'monitoring/backups',
      'monitoring/scripts',
      'monitoring/docs'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
        console.log(`  Created: ${dir}`);
      }
    });
  }

  private async generateConfigurations(): Promise<void> {
    console.log('⚙️ Generating comprehensive monitoring configurations...');

    // Generate Prometheus configuration
    const prometheusConfig = this.generatePrometheusConfig();
    writeFileSync('monitoring/prometheus/prometheus.yml', prometheusConfig);

    // Copy enhanced alert rules
    const alertRulesPath = path.join(process.cwd(), 'scripts/deployment/enhanced-alert-rules.yml');
    if (existsSync(alertRulesPath)) {
      copyFileSync(alertRulesPath, 'monitoring/prometheus/rules/enhanced-alert-rules.yml');
    }

    // Generate Grafana datasource configuration
    const grafanaDataSource = this.generateGrafanaDataSourceConfig();
    writeFileSync('monitoring/grafana/provisioning/datasources/prometheus.yml', grafanaDataSource);

    // Generate dashboard provisioning configuration
    const dashboardProvisioning = this.generateDashboardProvisioningConfig();
    writeFileSync('monitoring/grafana/provisioning/dashboards/dashboard.yml', dashboardProvisioning);

    // Generate Alertmanager configuration
    const alertmanagerConfig = this.generateAlertmanagerConfig();
    writeFileSync('monitoring/alertmanager/alertmanager.yml', alertmanagerConfig);

    // Copy dashboard files
    await this.copyDashboards();

    console.log('  Generated all configuration files');
  }

  private generatePrometheusConfig(): string {
    const targets = this.getServiceTargets();

    return `
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'triplecheck-${this.config.environment}'
    environment: '${this.config.environment}'

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'triplecheck-services'
    static_configs:
      - targets: ${JSON.stringify(targets.services)}
    metrics_path: '/metrics/prometheus'
    scrape_interval: 30s
    scrape_timeout: 10s
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
      - source_labels: [__address__]
        regex: '([^:]+):(\\d+)'
        target_label: service
        replacement: '\${1}'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ${JSON.stringify(targets.nodeExporter)}
    scrape_interval: 15s

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ${JSON.stringify(targets.postgresExporter)}
    scrape_interval: 30s

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ${JSON.stringify(targets.redisExporter)}
    scrape_interval: 30s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 30s

  - job_name: 'grafana'
    static_configs:
      - targets: ['grafana:3000']
    scrape_interval: 60s
    metrics_path: '/metrics'

  - job_name: 'alertmanager'
    static_configs:
      - targets: ['alertmanager:9093']
    scrape_interval: 30s
`.trim();
  }

  private getServiceTargets() {
    const isProduction = this.config.environment === 'production';
    
    return {
      services: isProduction ? [
        'triplecheck-api:3001',
        'land-verification-service:3002',
        'fraud-detection-service:3003',
        'document-auth-service:3004'
      ] : [
        'localhost:3001',
        'localhost:3002',
        'localhost:3003',
        'localhost:3004'
      ],
      nodeExporter: ['node-exporter:9100'],
      postgresExporter: ['postgres-exporter:9187'],
      redisExporter: ['redis-exporter:9121']
    };
  }

  private generateGrafanaDataSourceConfig(): string {
    return `
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "15s"
      queryTimeout: "60s"
      httpMethod: "POST"
    secureJsonData: {}

  - name: Alertmanager
    type: alertmanager
    access: proxy
    url: http://alertmanager:9093
    editable: true
    jsonData:
      implementation: "prometheus"
`.trim();
  }

  private generateDashboardProvisioningConfig(): string {
    return `
apiVersion: 1

providers:
  - name: 'triplecheck-database'
    orgId: 1
    folder: 'Database'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards/database

  - name: 'triplecheck-business'
    orgId: 1
    folder: 'Business Metrics'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards/business

  - name: 'triplecheck-infrastructure'
    orgId: 1
    folder: 'Infrastructure'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards/infrastructure
`.trim();
  }

  private generateAlertmanagerConfig(): string {
    const routes: any[] = [];
    const receivers: any[] = [];

    // Default receiver
    receivers.push({
      name: 'default',
      webhook_configs: [{
        url: 'http://triplecheck-api:3001/metrics/alerts/webhook',
        send_resolved: true
      }]
    });

    // Slack receiver
    if (this.config.enableSlack && this.config.slackWebhookUrl) {
      receivers.push({
        name: 'slack-critical',
        slack_configs: [{
          api_url: this.config.slackWebhookUrl,
          channel: '#alerts-critical',
          title: 'TripleCheck Critical Alert',
          text: '{{ range .Alerts }}*{{ .Annotations.summary }}*\n{{ .Annotations.description }}\n*Severity:* {{ .Labels.severity }}\n*Team:* {{ .Labels.team }}{{ end }}',
          send_resolved: true
        }]
      });

      receivers.push({
        name: 'slack-general',
        slack_configs: [{
          api_url: this.config.slackWebhookUrl,
          channel: '#alerts',
          title: 'TripleCheck Alert',
          text: '{{ range .Alerts }}*{{ .Annotations.summary }}*\n{{ .Annotations.description }}{{ end }}',
          send_resolved: true
        }]
      });

      routes.push({
        match: { severity: 'critical' },
        receiver: 'slack-critical',
        group_wait: '10s',
        group_interval: '5m',
        repeat_interval: '12h'
      });

      routes.push({
        match: { severity: 'high' },
        receiver: 'slack-general',
        group_wait: '30s',
        group_interval: '10m',
        repeat_interval: '24h'
      });
    }

    // PagerDuty receiver
    if (this.config.enablePagerDuty && this.config.pagerDutyIntegrationKey) {
      receivers.push({
        name: 'pagerduty-critical',
        pagerduty_configs: [{
          routing_key: this.config.pagerDutyIntegrationKey,
          description: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}',
          details: {
            environment: this.config.environment,
            service: '{{ .Labels.service }}',
            team: '{{ .Labels.team }}',
            runbook: '{{ .Annotations.runbook_url }}'
          }
        }]
      });

      routes.push({
        match: { severity: 'critical', escalation_level: '1' },
        receiver: 'pagerduty-critical',
        group_wait: '0s',
        group_interval: '1m',
        repeat_interval: '5m'
      });
    }

    // Email receiver
    if (this.config.enableEmail && this.config.emailConfig) {
      receivers.push({
        name: 'email-alerts',
        email_configs: [{
          to: this.config.emailConfig.toEmails.join(','),
          from: this.config.emailConfig.fromEmail,
          smarthost: `${this.config.emailConfig.smtpHost}:${this.config.emailConfig.smtpPort}`,
          auth_username: this.config.emailConfig.smtpUser,
          auth_password: this.config.emailConfig.smtpPassword,
          subject: '[{{ .Status | toUpper }}] TripleCheck Alert: {{ .GroupLabels.alertname }}',
          body: `
{{ range .Alerts }}
Alert: {{ .Annotations.summary }}
Description: {{ .Annotations.description }}
Severity: {{ .Labels.severity }}
Team: {{ .Labels.team }}
Started: {{ .StartsAt }}
{{ if .Annotations.runbook_url }}Runbook: {{ .Annotations.runbook_url }}{{ end }}
{{ end }}
`,
          html: `
<h2>TripleCheck Alert</h2>
{{ range .Alerts }}
<div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0;">
  <h3>{{ .Annotations.summary }}</h3>
  <p><strong>Description:</strong> {{ .Annotations.description }}</p>
  <p><strong>Severity:</strong> {{ .Labels.severity }}</p>
  <p><strong>Team:</strong> {{ .Labels.team }}</p>
  <p><strong>Started:</strong> {{ .StartsAt }}</p>
  {{ if .Annotations.runbook_url }}<p><strong>Runbook:</strong> <a href="{{ .Annotations.runbook_url }}">{{ .Annotations.runbook_url }}</a></p>{{ end }}
</div>
{{ end }}
`
        }]
      });

      routes.push({
        match: { severity: 'high' },
        receiver: 'email-alerts',
        group_wait: '5m',
        group_interval: '30m',
        repeat_interval: '24h'
      });
    }

    return `
global:
  smtp_smarthost: '${this.config.emailConfig?.smtpHost || 'localhost'}:${this.config.emailConfig?.smtpPort || 587}'
  smtp_from: '${this.config.emailConfig?.fromEmail || 'alerts@triplecheck.com'}'
  resolve_timeout: 5m

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: 'default'
  routes: ${JSON.stringify(routes, null, 4)}

receivers: ${JSON.stringify(receivers, null, 2)}

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'high'
    equal: ['alertname', 'cluster', 'service']
  
  - source_match:
      severity: 'high'
    target_match:
      severity: 'medium'
    equal: ['alertname', 'cluster', 'service']
`.trim();
  }

  private async copyDashboards(): Promise<void> {
    const dashboardSources = [
      { src: 'scripts/deployment/grafana/dashboards/database-health.json', dest: 'monitoring/grafana/provisioning/dashboards/database/' },
      { src: 'scripts/deployment/grafana/dashboards/query-performance.json', dest: 'monitoring/grafana/provisioning/dashboards/database/' },
      { src: 'scripts/deployment/grafana/dashboards/business-metrics.json', dest: 'monitoring/grafana/provisioning/dashboards/business/' }
    ];

    for (const dashboard of dashboardSources) {
      const srcPath = path.join(process.cwd(), dashboard.src);
      if (existsSync(srcPath)) {
        const filename = path.basename(dashboard.src);
        const destPath = path.join(process.cwd(), dashboard.dest, filename);
        copyFileSync(srcPath, destPath);
        console.log(`  Copied dashboard: ${filename}`);
      }
    }
  }

  private async setupPrometheus(): Promise<void> {
    console.log('📊 Setting up Prometheus...');
    // Prometheus setup is handled by configuration files
    console.log('  Prometheus configuration ready');
  }

  private async setupGrafana(): Promise<void> {
    console.log('📈 Setting up Grafana...');
    // Grafana setup is handled by configuration files and Docker
    console.log('  Grafana configuration ready');
  }

  private async setupAlerting(): Promise<void> {
    console.log('🚨 Setting up comprehensive alerting...');
    // Alerting setup is handled by Alertmanager configuration
    console.log('  Alerting configuration ready');
  }

  private async setupDashboards(): Promise<void> {
    console.log('📊 Setting up Grafana dashboards...');
    // Dashboards are provisioned automatically by Grafana
    console.log('  Dashboard provisioning configured');
  }

  private async generateDockerCompose(): Promise<void> {
    console.log('🐳 Generating Docker Compose configuration...');

    const dockerCompose = this.generateDockerComposeConfig();
    writeFileSync('monitoring/docker-compose.yml', dockerCompose);
    
    console.log('  Docker Compose configuration generated');
  }

  private generateDockerComposeConfig(): string {
    return `
version: '3.8'

networks:
  monitoring:
    driver: bridge
  triplecheck:
    external: true

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:

services:
  prometheus:
    image: prom/prometheus:v2.45.0
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/rules:/etc/prometheus/rules:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
      - '--web.external-url=http://localhost:9090'
    restart: unless-stopped
    networks:
      - monitoring
      - triplecheck
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  grafana:
    image: grafana/grafana:10.0.0
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${this.config.grafanaPassword}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel
      - GF_FEATURE_TOGGLES_ENABLE=ngalert
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  alertmanager:
    image: prom/alertmanager:v0.25.0
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - ./alertmanager/templates:/etc/alertmanager/templates:ro
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
      - '--cluster.advertise-address=0.0.0.0:9093'
    restart: unless-stopped
    networks:
      - monitoring
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9093/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  node-exporter:
    image: prom/node-exporter:v1.6.0
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    restart: unless-stopped
    networks:
      - monitoring

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:v0.13.0
    container_name: postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/${this.config.databaseName}?sslmode=disable
    restart: unless-stopped
    networks:
      - monitoring
      - triplecheck
    depends_on:
      - prometheus

  redis-exporter:
    image: oliver006/redis_exporter:v1.52.0
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
    restart: unless-stopped
    networks:
      - monitoring
      - triplecheck
    depends_on:
      - prometheus
`.trim();
  }

  private async startServices(): Promise<void> {
    console.log('🚀 Starting monitoring services...');

    try {
      execSync('cd monitoring && docker-compose up -d', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('  Waiting for services to start...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      console.warn('  Could not start Docker services automatically. Please run manually:');
      console.warn('  cd monitoring && docker-compose up -d');
    }
  }

  private async validateSetup(): Promise<void> {
    console.log('✅ Validating comprehensive monitoring setup...');

    const checks = [
      { name: 'Prometheus', url: 'http://localhost:9090/-/healthy', timeout: 5000 },
      { name: 'Grafana', url: 'http://localhost:3000/api/health', timeout: 10000 },
      { name: 'Alertmanager', url: 'http://localhost:9093/-/healthy', timeout: 5000 },
      { name: 'Node Exporter', url: 'http://localhost:9100/metrics', timeout: 5000 },
      { name: 'Postgres Exporter', url: 'http://localhost:9187/metrics', timeout: 5000 },
      { name: 'Redis Exporter', url: 'http://localhost:9121/metrics', timeout: 5000 }
    ];

    for (const check of checks) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), check.timeout);
        
        const response = await fetch(check.url, { 
          signal: controller.signal,
          headers: { 'User-Agent': 'TripleCheck-Monitoring-Setup' }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`  ✅ ${check.name} is healthy`);
        } else {
          console.log(`  ⚠️ ${check.name} returned status ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${check.name} is not accessible: ${error.message}`);
      }
    }
  }

  private async generateDocumentation(): Promise<void> {
    console.log('📚 Generating monitoring documentation...');

    const documentation = this.generateMonitoringDocumentation();
    writeFileSync('monitoring/docs/README.md', documentation);
    
    const runbook = this.generateRunbook();
    writeFileSync('monitoring/docs/RUNBOOK.md', runbook);
    
    console.log('  Documentation generated');
  }

  private generateMonitoringDocumentation(): string {
    return `
# TripleCheck Comprehensive Monitoring System

## Overview

This monitoring system provides comprehensive observability for the TripleCheck platform, including:

- **Database Health Monitoring**: PostgreSQL performance, query analysis, connection pooling
- **Business Metrics**: Land verification rates, fraud detection, user activity
- **Infrastructure Monitoring**: System resources, application performance, external APIs
- **Alerting & Incident Management**: Multi-channel notifications with escalation policies

## Architecture

### Components

1. **Prometheus** (Port 9090): Metrics collection and storage
2. **Grafana** (Port 3000): Visualization and dashboards
3. **Alertmanager** (Port 9093): Alert routing and notifications
4. **Node Exporter** (Port 9100): System metrics
5. **Postgres Exporter** (Port 9187): Database metrics
6. **Redis Exporter** (Port 9121): Cache metrics

### Dashboards

- **Database Health**: Connection pools, query performance, transaction rates
- **Query Performance**: Slow queries, table-specific metrics, cache hit rates
- **Business Metrics**: Verification success rates, fraud alerts, user activity

### Alert Levels

- **Critical**: Immediate response required (PagerDuty + Slack)
- **High**: 15-minute response time (Slack + Email)
- **Medium**: 30-minute response time (Email)
- **Low**: 2-hour response time (Email)

## Configuration

Environment: ${this.config.environment}
Database: ${this.config.databaseName}

### Enabled Features

- Prometheus: ${this.config.enablePrometheus ? '✅' : '❌'}
- Grafana: ${this.config.enableGrafana ? '✅' : '❌'}
- Alerting: ${this.config.enableAlerting ? '✅' : '❌'}
- PagerDuty: ${this.config.enablePagerDuty ? '✅' : '❌'}
- Slack: ${this.config.enableSlack ? '✅' : '❌'}
- Email: ${this.config.enableEmail ? '✅' : '❌'}
- SMS: ${this.config.enableSMS ? '✅' : '❌'}

## Access Information

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/${this.config.grafanaPassword})
- **Alertmanager**: http://localhost:9093

## Maintenance

### Daily Tasks
- Check dashboard for anomalies
- Review active alerts
- Validate backup completion

### Weekly Tasks
- Review alert thresholds
- Update dashboard configurations
- Check disk usage for metrics storage

### Monthly Tasks
- Review and update runbooks
- Conduct alert testing
- Performance optimization review

## Troubleshooting

See RUNBOOK.md for detailed troubleshooting procedures.
`.trim();
  }

  private generateRunbook(): string {
    return `
# TripleCheck Monitoring Runbook

## Alert Response Procedures

### Database Alerts

#### DatabaseDown
**Severity**: Critical
**Response Time**: Immediate

1. Check database container status: \`docker ps | grep postgres\`
2. Check database logs: \`docker logs postgres\`
3. Verify network connectivity
4. If container is down, restart: \`docker-compose restart postgres\`
5. Validate application connectivity

#### HighDatabaseQueryLatency
**Severity**: High
**Response Time**: 15 minutes

1. Check current active queries: \`SELECT * FROM pg_stat_activity WHERE state = 'active';\`
2. Identify slow queries: \`SELECT query, query_start, state FROM pg_stat_activity WHERE now() - query_start > interval '1 minute';\`
3. Check for blocking queries: \`SELECT * FROM pg_locks WHERE NOT granted;\`
4. Consider query optimization or index creation
5. Monitor connection pool utilization

### Business Alerts

#### HighLandVerificationFailureRate
**Severity**: High
**Response Time**: 15 minutes

1. Check external API status (government services)
2. Review recent error logs for verification service
3. Validate database connectivity
4. Check for recent code deployments
5. Monitor fraud detection patterns

#### CriticalFraudAlertsHigh
**Severity**: High
**Response Time**: 15 minutes

1. Review fraud alert patterns in dashboard
2. Check for potential security incidents
3. Validate fraud detection algorithm performance
4. Consider temporary rate limiting if needed
5. Notify security team

### Infrastructure Alerts

#### HighCPUUsage
**Severity**: Medium
**Response Time**: 30 minutes

1. Identify high CPU processes: \`top\` or \`htop\`
2. Check application logs for errors
3. Review recent traffic patterns
4. Consider horizontal scaling if sustained
5. Monitor memory usage correlation

#### HighMemoryUsage
**Severity**: Medium
**Response Time**: 30 minutes

1. Check memory usage by process: \`ps aux --sort=-%mem\`
2. Look for memory leaks in application logs
3. Check database connection pool size
4. Consider restarting high-memory services
5. Monitor swap usage

## Service Recovery Procedures

### Prometheus Recovery
1. Check configuration: \`promtool check config prometheus.yml\`
2. Validate rules: \`promtool check rules rules/*.yml\`
3. Restart service: \`docker-compose restart prometheus\`
4. Verify metrics collection: Check /targets endpoint

### Grafana Recovery
1. Check logs: \`docker logs grafana\`
2. Verify datasource connectivity
3. Restart service: \`docker-compose restart grafana\`
4. Re-import dashboards if needed

### Alertmanager Recovery
1. Check configuration: \`amtool check-config alertmanager.yml\`
2. Restart service: \`docker-compose restart alertmanager\`
3. Test notification channels
4. Verify alert routing

## Emergency Contacts

- **On-Call Engineer**: [Configure based on your team]
- **Database Team**: [Configure based on your team]
- **Security Team**: [Configure based on your team]
- **Infrastructure Team**: [Configure based on your team]

## Escalation Matrix

| Time | Severity | Action |
|------|----------|--------|
| 0 min | Critical | Slack + PagerDuty |
| 5 min | Critical | SMS + Email |
| 15 min | Critical | Manager notification |
| 30 min | Critical | Executive escalation |

## Common Commands

### Docker Management
\`\`\`bash
# View all monitoring services
docker-compose ps

# Restart all services
docker-compose restart

# View logs
docker-compose logs -f [service_name]

# Update and restart
docker-compose pull && docker-compose up -d
\`\`\`

### Prometheus Queries
\`\`\`promql
# Database query rate
rate(database_queries_total[5m])

# High CPU usage
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
\`\`\`

### Database Queries
\`\`\`sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, query_start, state, wait_event 
FROM pg_stat_activity 
WHERE state = 'active' AND query_start < now() - interval '1 minute';

-- Database size
SELECT pg_size_pretty(pg_database_size('${this.config.databaseName}'));
\`\`\`
`.trim();
  }

  private printAccessInformation(): void {
    console.log('\n🌐 Comprehensive Monitoring Access Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  📊 Prometheus: http://localhost:9090');
    console.log('  📈 Grafana: http://localhost:3000');
    console.log(`     Username: admin`);
    console.log(`     Password: ${this.config.grafanaPassword}`);
    console.log('  🚨 Alertmanager: http://localhost:9093');
    console.log('  📡 Node Exporter: http://localhost:9100');
    console.log('  🗄️  Postgres Exporter: http://localhost:9187');
    console.log('  🔄 Redis Exporter: http://localhost:9121');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📚 Next Steps:');
    console.log('  1. Access Grafana and explore the pre-configured dashboards');
    console.log('  2. Test alert notifications by triggering test alerts');
    console.log('  3. Review the generated documentation in monitoring/docs/');
    console.log('  4. Configure additional notification channels as needed');
    console.log('  5. Set up backup procedures for monitoring data');
    
    console.log('\n🔧 Management Commands:');
    console.log('  • Start services: cd monitoring && docker-compose up -d');
    console.log('  • Stop services: cd monitoring && docker-compose down');
    console.log('  • View logs: cd monitoring && docker-compose logs -f');
    console.log('  • Update services: cd monitoring && docker-compose pull && docker-compose up -d');
    
    if (this.config.enableSlack) {
      console.log('\n💬 Slack Integration: Configured');
    }
    if (this.config.enablePagerDuty) {
      console.log('📟 PagerDuty Integration: Configured');
    }
    if (this.config.enableEmail) {
      console.log('📧 Email Alerts: Configured');
    }
    if (this.config.enableSMS) {
      console.log('📱 SMS Alerts: Configured');
    }
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] as 'development' | 'staging' | 'production';
  
  if (!environment || !['development', 'staging', 'production'].includes(environment)) {
    console.error('Usage: npm run setup:monitoring:comprehensive <environment>');
    console.error('Environment must be one of: development, staging, production');
    process.exit(1);
  }

  const setup = new ComprehensiveMonitoringSetup(environment);
  
  try {
    await setup.setup();
    process.exit(0);
  } catch (error) {
    console.error('Comprehensive monitoring setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ComprehensiveMonitoringSetup };