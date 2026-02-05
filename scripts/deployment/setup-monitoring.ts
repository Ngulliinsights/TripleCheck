#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from '..\cleanup-redundancies';

interface MonitoringConfig {
  environment: 'development' | 'staging' | 'production';
  enablePrometheus: boolean;
  enableGrafana: boolean;
  enableAlerting: boolean;
  slackWebhookUrl?: string;
  emailConfig?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    toEmails: string[];
  };
}

class MonitoringSetup {
  private config: MonitoringConfig;

  constructor(environment: 'development' | 'staging' | 'production') {
    this.config = {
      environment,
      enablePrometheus: true,
      enableGrafana: true,
      enableAlerting: true,
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      emailConfig: process.env.SMTP_HOST ? {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.ALERT_FROM_EMAIL || '',
        toEmails: process.env.ALERT_TO_EMAILS?.split(',') || []
      } : undefined
    };
  }

  async setup(): Promise<void> {
    console.log(`🔧 Setting up monitoring for ${this.config.environment} environment`);

    try {
      await this.createDirectories();
      await this.generateConfigurations();
      await this.setupPrometheus();
      await this.setupGrafana();
      await this.setupAlerting();
      await this.startServices();
      await this.validateSetup();

      console.log('✅ Monitoring setup completed successfully');
      this.printAccessInformation();
    } catch (error) {
      console.error('❌ Monitoring setup failed:', error);
      throw error;
    }
  }

  private async createDirectories(): Promise<void> {
    console.log('📁 Creating monitoring directories...');

    const directories = [
      'monitoring/prometheus/data',
      'monitoring/grafana/data',
      'monitoring/grafana/provisioning/dashboards',
      'monitoring/grafana/provisioning/datasources',
      'monitoring/alertmanager/data',
      'monitoring/logs'
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
    console.log('⚙️ Generating monitoring configurations...');

    // Generate environment-specific Prometheus config
    const prometheusConfig = this.generatePrometheusConfig();
    writeFileSync('monitoring/prometheus/prometheus.yml', prometheusConfig);

    // Generate Grafana datasource config
    const grafanaDataSource = this.generateGrafanaDataSourceConfig();
    writeFileSync('monitoring/grafana/provisioning/datasources/prometheus.yml', grafanaDataSource);

    // Generate Alertmanager config
    const alertmanagerConfig = this.generateAlertmanagerConfig();
    writeFileSync('monitoring/alertmanager/alertmanager.yml', alertmanagerConfig);

    // Generate Docker Compose for monitoring stack
    const dockerCompose = this.generateMonitoringDockerCompose();
    writeFileSync('monitoring/docker-compose.monitoring.yml', dockerCompose);

    console.log('  Generated all configuration files');
  }

  private generatePrometheusConfig(): string {
    const targets = this.config.environment === 'production' 
      ? [
          'land-verification-service:3001',
          'government-integration-service:3002',
          'risk-assessment-service:3003',
          'community-intelligence-service:3004',
          'monitoring-service:3005'
        ]
      : ['localhost:3001', 'localhost:3002', 'localhost:3003', 'localhost:3004', 'localhost:3005'];

    return `
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'land-verification-services'
    static_configs:
      - targets: ${JSON.stringify(targets)}
    metrics_path: '/metrics/prometheus'
    scrape_interval: 30s
    scrape_timeout: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']
`.trim();
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
`.trim();
  }

  private generateAlertmanagerConfig(): string {
    const routes: any[] = [];
    const receivers: any[] = [];

    // Default receiver
    receivers.push({
      name: 'default',
      webhook_configs: [{
        url: 'http://monitoring-service:3005/api/alerts/webhook'
      }]
    });

    // Slack receiver
    if (this.config.slackWebhookUrl) {
      receivers.push({
        name: 'slack',
        slack_configs: [{
          api_url: this.config.slackWebhookUrl,
          channel: '#alerts',
          title: 'Land Verification Alert',
          text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'
        }]
      });
      routes.push({
        match: { severity: 'critical' },
        receiver: 'slack'
      });
    }

    // Email receiver
    if (this.config.emailConfig) {
      receivers.push({
        name: 'email',
        email_configs: [{
          to: this.config.emailConfig.toEmails.join(','),
          from: this.config.emailConfig.fromEmail,
          smarthost: `${this.config.emailConfig.smtpHost}:${this.config.emailConfig.smtpPort}`,
          auth_username: this.config.emailConfig.smtpUser,
          auth_password: this.config.emailConfig.smtpPassword,
          subject: 'Land Verification Alert: {{ .GroupLabels.alertname }}',
          body: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'
        }]
      });
      routes.push({
        match: { severity: 'high' },
        receiver: 'email'
      });
    }

    return `
global:
  smtp_smarthost: '${this.config.emailConfig?.smtpHost || 'localhost'}:${this.config.emailConfig?.smtpPort || 587}'
  smtp_from: '${this.config.emailConfig?.fromEmail || 'alerts@landverification.com'}'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
  routes: ${JSON.stringify(routes, null, 4)}

receivers: ${JSON.stringify(receivers, null, 2)}
`.trim();
  }

  private generateMonitoringDockerCompose(): string {
    return `
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/alert_rules.yml:/etc/prometheus/alert_rules.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    restart: unless-stopped
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    restart: unless-stopped
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
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

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis://redis:6379
    restart: unless-stopped
    networks:
      - monitoring

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    ports:
      - "9187:9187"
    environment:
      - DATA_SOURCE_NAME=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}?sslmode=disable
    restart: unless-stopped
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:

networks:
  monitoring:
    driver: bridge
`.trim();
  }

  private async setupPrometheus(): Promise<void> {
    if (!this.config.enablePrometheus) return;

    console.log('📊 Setting up Prometheus...');
    
    // Copy alert rules
    execSync('cp scripts/deployment/alert_rules.yml monitoring/prometheus/', { stdio: 'inherit' });
    
    console.log('  Prometheus configuration ready');
  }

  private async setupGrafana(): Promise<void> {
    if (!this.config.enableGrafana) return;

    console.log('📈 Setting up Grafana...');
    
    // Create dashboard configuration
    const dashboardConfig = `
apiVersion: 1

providers:
  - name: 'land-verification-dashboards'
    orgId: 1
    folder: 'Land Verification'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
`.trim();

    writeFileSync('monitoring/grafana/provisioning/dashboards/dashboard.yml', dashboardConfig);
    
    console.log('  Grafana configuration ready');
  }

  private async setupAlerting(): Promise<void> {
    if (!this.config.enableAlerting) return;

    console.log('🚨 Setting up alerting...');
    
    console.log('  Alerting configuration ready');
  }

  private async startServices(): Promise<void> {
    console.log('🚀 Starting monitoring services...');

    try {
      execSync('cd monitoring && docker-compose -f docker-compose.monitoring.yml up -d', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      // Wait for services to start
      console.log('  Waiting for services to start...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
    } catch (error) {
      console.warn('  Could not start Docker services automatically. Please run manually:');
      console.warn('  cd monitoring && docker-compose -f docker-compose.monitoring.yml up -d');
    }
  }

  private async validateSetup(): Promise<void> {
    console.log('✅ Validating monitoring setup...');

    const checks = [
      { name: 'Prometheus', url: 'http://localhost:9090/-/healthy' },
      { name: 'Grafana', url: 'http://localhost:3000/api/health' },
      { name: 'Alertmanager', url: 'http://localhost:9093/-/healthy' }
    ];

    for (const check of checks) {
      try {
        const response = await fetch(check.url);
        if (response.ok) {
          console.log(`  ✅ ${check.name} is healthy`);
        } else {
          console.log(`  ⚠️ ${check.name} returned status ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${check.name} is not accessible`);
      }
    }
  }

  private printAccessInformation(): void {
    console.log('\n🌐 Monitoring Services Access Information:');
    console.log('  Prometheus: http://localhost:9090');
    console.log('  Grafana: http://localhost:3000 (admin/admin)');
    console.log('  Alertmanager: http://localhost:9093');
    console.log('  Node Exporter: http://localhost:9100');
    console.log('\n📚 Next Steps:');
    console.log('  1. Access Grafana and import dashboards');
    console.log('  2. Configure notification channels in Alertmanager');
    console.log('  3. Set up custom alert rules as needed');
    console.log('  4. Monitor the /metrics endpoints of your services');
  }
}

// CLI interface
async function main() {
  const environment = process.argv[2] as 'development' | 'staging' | 'production';
  
  if (!environment || !['development', 'staging', 'production'].includes(environment)) {
    console.error('Usage: npm run setup:monitoring <environment>');
    console.error('Environment must be one of: development, staging, production');
    process.exit(1);
  }

  const setup = new MonitoringSetup(environment);
  
  try {
    await setup.setup();
    process.exit(0);
  } catch (error) {
    console.error('Monitoring setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { MonitoringSetup };