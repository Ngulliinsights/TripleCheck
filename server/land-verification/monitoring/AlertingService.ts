import { EventEmitter } from 'events';
import { metricsService } from './MetricsService';
import { healthCheckService } from '../health/HealthCheckService';

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any, health: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  cooldownPeriod: number; // milliseconds
  enabled: boolean;
}

interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export class AlertingService extends EventEmitter {
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private lastAlertTimes: Map<string, number> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.setupDefaultAlertRules();
    this.setupDefaultNotificationChannels();
  }

  startMonitoring(intervalMs: number = 300000): void { // Increased to 5 minutes
    // Disable alerting in development to prevent spam
    if (process.env.NODE_ENV === 'development') {
      console.log('Alerting service disabled in development mode');
      return;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.checkAlertRules();
    }, intervalMs);

    console.log(`Alerting service started with ${intervalMs}ms interval`);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  private setupDefaultAlertRules(): void {
    const rules: AlertRule[] = [
      {
        id: 'high_verification_failure_rate',
        name: 'High Verification Failure Rate',
        condition: (metrics) => {
          const total = metrics.totalVerifications;
          const failed = metrics.failedVerifications;
          return total > 10 && (failed / total) > 0.2; // 20% failure rate
        },
        severity: 'high',
        description: 'Land verification failure rate exceeds 20%',
        cooldownPeriod: 300000, // 5 minutes
        enabled: true
      },
      {
        id: 'slow_verification_processing',
        name: 'Slow Verification Processing',
        condition: (metrics) => {
          return metrics.averageProcessingTime > 300; // 5 minutes
        },
        severity: 'medium',
        description: 'Average verification processing time exceeds 5 minutes',
        cooldownPeriod: 600000, // 10 minutes
        enabled: true
      },
      {
        id: 'external_api_failures',
        name: 'External API Failures',
        condition: (metrics) => {
          for (const [api, apiMetrics] of Object.entries(metrics.apiCallMetrics)) {
            const total = apiMetrics.totalCalls;
            const failed = apiMetrics.failedCalls;
            if (total > 5 && (failed / total) > 0.5) { // 50% failure rate
              return true;
            }
          }
          return false;
        },
        severity: 'critical',
        description: 'External API failure rate exceeds 50%',
        cooldownPeriod: 180000, // 3 minutes
        enabled: true
      },
      {
        id: 'database_connection_failure',
        name: 'Database Connection Failure',
        condition: (metrics, health) => {
          return health.checks?.database?.status === 'fail';
        },
        severity: 'critical',
        description: 'Database connection is failing',
        cooldownPeriod: 300000, // 5 minutes - longer cooldown
        enabled: process.env.NODE_ENV === 'production' // Only in production
      },
      {
        id: 'redis_connection_failure',
        name: 'Redis Connection Failure',
        condition: (metrics, health) => {
          return health.checks.redis.status === 'fail';
        },
        severity: 'high',
        description: 'Redis connection is failing',
        cooldownPeriod: 120000, // 2 minutes
        enabled: true
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: (metrics, health) => {
          // Only trigger if memory usage is consistently high and health check fails
          return health.checks?.memory?.status === 'fail' && 
                 health.checks?.memory?.memoryUsage > 0.9; // 90% threshold
        },
        severity: 'medium',
        description: 'Memory usage is critically high (>90%)',
        cooldownPeriod: 1800000, // 30 minutes - much longer cooldown
        enabled: process.env.NODE_ENV === 'production' // Only in production
      },
      {
        id: 'government_api_degraded',
        name: 'Government API Degraded',
        condition: (metrics, health) => {
          return health.checks.externalAPIs.status === 'warn';
        },
        severity: 'medium',
        description: 'Some government APIs are not responding',
        cooldownPeriod: 600000, // 10 minutes
        enabled: true
      },
      {
        id: 'no_verifications_processed',
        name: 'No Verifications Processed',
        condition: (metrics) => {
          // Only alert in production and if system has been running for a while
          return process.env.NODE_ENV === 'production' && 
                 metrics.totalVerifications === 0 && 
                 process.uptime() > 3600; // System running for more than 1 hour
        },
        severity: 'low',
        description: 'No land verifications have been processed in the last hour',
        cooldownPeriod: 7200000, // 2 hours
        enabled: false // Disabled by default
      }
    ];

    rules.forEach(rule => this.alertRules.set(rule.id, rule));
  }

  private setupDefaultNotificationChannels(): void {
    // Email notification channel
    if (process.env.ALERT_EMAIL_ENABLED === 'true') {
      this.notificationChannels.set('email', {
        type: 'email',
        config: {
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          smtpUser: process.env.SMTP_USER,
          smtpPassword: process.env.SMTP_PASSWORD,
          fromEmail: process.env.ALERT_FROM_EMAIL,
          toEmails: process.env.ALERT_TO_EMAILS?.split(',') || []
        },
        enabled: true
      });
    }

    // Slack notification channel
    if (process.env.SLACK_WEBHOOK_URL) {
      this.notificationChannels.set('slack', {
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: process.env.SLACK_ALERT_CHANNEL || '#alerts'
        },
        enabled: true
      });
    }

    // Webhook notification channel
    if (process.env.ALERT_WEBHOOK_URL) {
      this.notificationChannels.set('webhook', {
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.ALERT_WEBHOOK_TOKEN ? `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}` : undefined
          }
        },
        enabled: true
      });
    }
  }

  private async checkAlertRules(): Promise<void> {
    try {
      const metrics = metricsService.getVerificationMetrics();
      const health = await healthCheckService.performHealthCheck();

      for (const [ruleId, rule] of this.alertRules) {
        if (!rule.enabled) continue;

        const lastAlertTime = this.lastAlertTimes.get(ruleId) || 0;
        const now = Date.now();

        // Check cooldown period
        if (now - lastAlertTime < rule.cooldownPeriod) {
          continue;
        }

        try {
          if (rule.condition(metrics, health)) {
            await this.triggerAlert(rule, { metrics, health });
            this.lastAlertTimes.set(ruleId, now);
          }
        } catch (error) {
          console.error(`Error evaluating alert rule ${ruleId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking alert rules:', error);
    }
  }

  private async triggerAlert(rule: AlertRule, context: any): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      timestamp: new Date(),
      source: 'land-verification-system',
      resolved: false,
      metadata: {
        ruleId: rule.id,
        context
      }
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert', alert);

    console.log(`🚨 Alert triggered: ${alert.title} (${alert.severity})`);

    // Send notifications
    await this.sendNotifications(alert);
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    const promises = Array.from(this.notificationChannels.values())
      .filter(channel => channel.enabled)
      .map(channel => this.sendNotification(channel, alert));

    await Promise.allSettled(promises);
  }

  private async sendNotification(channel: NotificationChannel, alert: Alert): Promise<void> {
    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(channel.config, alert);
          break;
        case 'slack':
          await this.sendSlackNotification(channel.config, alert);
          break;
        case 'webhook':
          await this.sendWebhookNotification(channel.config, alert);
          break;
        case 'sms':
          await this.sendSMSNotification(channel.config, alert);
          break;
      }
    } catch (error) {
      console.error(`Failed to send ${channel.type} notification:`, error);
    }
  }

  private async sendEmailNotification(config: any, alert: Alert): Promise<void> {
    // Email notification implementation would go here
    // For now, just log
    console.log(`📧 Email notification sent for alert: ${alert.title}`);
  }

  private async sendSlackNotification(config: any, alert: Alert): Promise<void> {
    const payload = {
      channel: config.channel,
      username: 'Land Verification Alerts',
      icon_emoji: this.getSeverityEmoji(alert.severity),
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        title: alert.title,
        text: alert.description,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Timestamp',
            value: alert.timestamp.toISOString(),
            short: true
          },
          {
            title: 'Source',
            value: alert.source,
            short: true
          }
        ],
        footer: 'Land Verification System',
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }

    console.log(`💬 Slack notification sent for alert: ${alert.title}`);
  }

  private async sendWebhookNotification(config: any, alert: Alert): Promise<void> {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        alert,
        timestamp: new Date().toISOString(),
        source: 'land-verification-system'
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }

    console.log(`🔗 Webhook notification sent for alert: ${alert.title}`);
  }

  private async sendSMSNotification(config: any, alert: Alert): Promise<void> {
    // SMS notification implementation would go here
    console.log(`📱 SMS notification sent for alert: ${alert.title}`);
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return ':rotating_light:';
      case 'high': return ':warning:';
      case 'medium': return ':exclamation:';
      case 'low': return ':information_source:';
      default: return ':question:';
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ff9500';
      case 'low': return 'good';
      default: return '#cccccc';
    }
  }

  // Public methods for managing alerts
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  removeAlertRule(ruleId: string): boolean {
    return this.alertRules.delete(ruleId);
  }

  enableAlertRule(ruleId: string): boolean {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      return true;
    }
    return false;
  }

  disableAlertRule(ruleId: string): boolean {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      return true;
    }
    return false;
  }
}

export const alertingService = new AlertingService();