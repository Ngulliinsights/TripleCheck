import { EventEmitter } from 'events';

import { logger } from './logger';

export interface Alert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'firing' | 'resolved';
  startsAt: Date;
  endsAt?: Date;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  generatorURL?: string;
  fingerprint: string;
}

export interface EscalationPolicy {
  name: string;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  delay: number; // minutes
  channels: NotificationChannel[];
  conditions?: EscalationCondition[];
}

export interface EscalationCondition {
  type: 'severity' | 'team' | 'duration' | 'custom';
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number;
}

export interface NotificationChannel {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'acknowledged' | 'resolved';
  assignee?: string;
  team: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  alerts: Alert[];
  timeline: IncidentEvent[];
  runbookUrl?: string;
  postmortemRequired: boolean;
}

export interface IncidentEvent {
  id: string;
  type: 'created' | 'acknowledged' | 'escalated' | 'assigned' | 'resolved' | 'note_added';
  timestamp: Date;
  user?: string;
  message: string;
  metadata?: Record<string, any>;
}

export class AlertingSystem extends EventEmitter {
  private static instance: AlertingSystem;
  private alerts: Map<string, Alert> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private escalationPolicies: Map<string, EscalationPolicy> = new Map();
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem();
    }
    return AlertingSystem.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.setupNotificationChannels();
      await this.setupEscalationPolicies();
      
      // Start alert processing
      this.startAlertProcessor();
      
      logger.info('AlertingSystem initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AlertingSystem:', error);
      throw error;
    }
  }

  private async setupNotificationChannels(): Promise<void> {
    // Email notification channel
    this.notificationChannels.set('email-critical', {
      type: 'email',
      enabled: true,
      config: {
        recipients: [
          'alerts@triplecheck.com',
          'oncall@triplecheck.com'
        ],
        smtpHost: process.env.SMTP_HOST || 'localhost',
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.ALERT_FROM_EMAIL || 'alerts@triplecheck.com'
      }
    });

    // Slack notification channel
    this.notificationChannels.set('slack-alerts', {
      type: 'slack',
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      config: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: '#alerts',
        username: 'TripleCheck Alerts',
        iconEmoji: ':warning:'
      }
    });

    // PagerDuty integration
    this.notificationChannels.set('pagerduty-critical', {
      type: 'pagerduty',
      enabled: !!process.env.PAGERDUTY_INTEGRATION_KEY,
      config: {
        integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
        apiUrl: 'https://events.pagerduty.com/v2/enqueue'
      }
    });

    // SMS notifications (via Twilio)
    this.notificationChannels.set('sms-critical', {
      type: 'sms',
      enabled: !!process.env.TWILIO_ACCOUNT_SID,
      config: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER,
        recipients: [
          process.env.ONCALL_PHONE_1,
          process.env.ONCALL_PHONE_2
        ].filter(Boolean)
      }
    });

    // Webhook notifications
    this.notificationChannels.set('webhook-monitoring', {
      type: 'webhook',
      enabled: !!process.env.MONITORING_WEBHOOK_URL,
      config: {
        url: process.env.MONITORING_WEBHOOK_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MONITORING_WEBHOOK_TOKEN}`
        }
      }
    });

    logger.info(`Configured ${this.notificationChannels.size} notification channels`);
  }

  private async setupEscalationPolicies(): Promise<void> {
    // Critical escalation policy (immediate response required)
    this.escalationPolicies.set('immediate', {
      name: 'Immediate Response',
      levels: [
        {
          level: 1,
          delay: 0,
          channels: [
            this.notificationChannels.get('slack-alerts')!,
            this.notificationChannels.get('pagerduty-critical')!
          ]
        },
        {
          level: 2,
          delay: 5,
          channels: [
            this.notificationChannels.get('email-critical')!,
            this.notificationChannels.get('sms-critical')!
          ],
          conditions: [
            { type: 'severity', operator: 'equals', value: 'critical' }
          ]
        },
        {
          level: 3,
          delay: 15,
          channels: [
            this.notificationChannels.get('webhook-monitoring')!
          ]
        }
      ]
    });

    // High priority escalation (15 minute response)
    this.escalationPolicies.set('15min', {
      name: '15 Minute Response',
      levels: [
        {
          level: 1,
          delay: 0,
          channels: [
            this.notificationChannels.get('slack-alerts')!
          ]
        },
        {
          level: 2,
          delay: 15,
          channels: [
            this.notificationChannels.get('email-critical')!,
            this.notificationChannels.get('pagerduty-critical')!
          ]
        },
        {
          level: 3,
          delay: 30,
          channels: [
            this.notificationChannels.get('sms-critical')!
          ]
        }
      ]
    });

    // Medium priority escalation (30 minute response)
    this.escalationPolicies.set('30min', {
      name: '30 Minute Response',
      levels: [
        {
          level: 1,
          delay: 0,
          channels: [
            this.notificationChannels.get('slack-alerts')!
          ]
        },
        {
          level: 2,
          delay: 30,
          channels: [
            this.notificationChannels.get('email-critical')!
          ]
        },
        {
          level: 3,
          delay: 60,
          channels: [
            this.notificationChannels.get('pagerduty-critical')!
          ]
        }
      ]
    });

    // Low priority escalation (2 hour response)
    this.escalationPolicies.set('2hours', {
      name: '2 Hour Response',
      levels: [
        {
          level: 1,
          delay: 0,
          channels: [
            this.notificationChannels.get('slack-alerts')!
          ]
        },
        {
          level: 2,
          delay: 120,
          channels: [
            this.notificationChannels.get('email-critical')!
          ]
        }
      ]
    });

    logger.info(`Configured ${this.escalationPolicies.size} escalation policies`);
  }

  async processAlert(alert: Alert): Promise<void> {
    try {
      const existingAlert = this.alerts.get(alert.fingerprint);
      
      if (alert.status === 'resolved' && existingAlert) {
        // Alert resolved
        existingAlert.status = 'resolved';
        existingAlert.endsAt = alert.endsAt || new Date();
        
        await this.resolveIncident(alert);
        this.emit('alert:resolved', existingAlert);
        
        logger.info(`Alert resolved: ${alert.name}`);
        return;
      }

      if (alert.status === 'firing') {
        if (existingAlert) {
          // Update existing alert
          Object.assign(existingAlert, alert);
        } else {
          // New alert
          this.alerts.set(alert.fingerprint, alert);
          await this.createIncident(alert);
          this.emit('alert:firing', alert);
          
          logger.warn(`New alert firing: ${alert.name} (${alert.severity})`);
        }

        // Start escalation process
        await this.startEscalation(alert);
      }
    } catch (error) {
      logger.error('Error processing alert:', error);
    }
  }

  private async createIncident(alert: Alert): Promise<Incident> {
    const incident: Incident = {
      id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: alert.annotations.summary || alert.name,
      description: alert.annotations.description || 'No description provided',
      severity: alert.severity,
      status: 'open',
      team: alert.labels.team || 'unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      alerts: [alert],
      timeline: [{
        id: `event-${Date.now()}`,
        type: 'created',
        timestamp: new Date(),
        message: `Incident created from alert: ${alert.name}`
      }],
      runbookUrl: alert.annotations.runbook_url,
      postmortemRequired: alert.severity === 'critical'
    };

    this.incidents.set(incident.id, incident);
    this.emit('incident:created', incident);

    logger.info(`Created incident: ${incident.id} for alert: ${alert.name}`);
    return incident;
  }

  private async resolveIncident(alert: Alert): Promise<void> {
    // Find incident containing this alert
    for (const [incidentId, incident] of this.incidents) {
      const alertIndex = incident.alerts.findIndex(a => a.fingerprint === alert.fingerprint);
      
      if (alertIndex !== -1) {
        incident.alerts[alertIndex] = alert;
        
        // Check if all alerts in incident are resolved
        const allResolved = incident.alerts.every(a => a.status === 'resolved');
        
        if (allResolved && incident.status !== 'resolved') {
          incident.status = 'resolved';
          incident.resolvedAt = new Date();
          incident.updatedAt = new Date();
          
          incident.timeline.push({
            id: `event-${Date.now()}`,
            type: 'resolved',
            timestamp: new Date(),
            message: 'All alerts resolved, incident auto-resolved'
          });

          this.emit('incident:resolved', incident);
          logger.info(`Incident resolved: ${incident.id}`);
        }
        break;
      }
    }
  }

  private async startEscalation(alert: Alert): Promise<void> {
    const escalationPolicy = alert.annotations.escalation_policy;
    if (!escalationPolicy) {
      logger.warn(`No escalation policy defined for alert: ${alert.name}`);
      return;
    }

    const policy = this.escalationPolicies.get(escalationPolicy);
    if (!policy) {
      logger.error(`Escalation policy not found: ${escalationPolicy}`);
      return;
    }

    // Clear any existing escalation timer
    const existingTimer = this.escalationTimers.get(alert.fingerprint);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Start escalation levels
    for (const level of policy.levels) {
      const timer = setTimeout(async () => {
        await this.executeEscalationLevel(alert, level);
      }, level.delay * 60 * 1000); // Convert minutes to milliseconds

      this.escalationTimers.set(`${alert.fingerprint}-${level.level}`, timer);
    }

    logger.info(`Started escalation for alert: ${alert.name} using policy: ${escalationPolicy}`);
  }

  private async executeEscalationLevel(alert: Alert, level: EscalationLevel): Promise<void> {
    try {
      // Check if alert is still firing
      const currentAlert = this.alerts.get(alert.fingerprint);
      if (!currentAlert || currentAlert.status === 'resolved') {
        return;
      }

      // Check escalation conditions
      if (level.conditions && !this.evaluateEscalationConditions(alert, level.conditions)) {
        return;
      }

      // Send notifications through all channels in this level
      const notifications = level.channels.map(channel => 
        this.sendNotification(alert, channel)
      );

      await Promise.allSettled(notifications);

      logger.info(`Executed escalation level ${level.level} for alert: ${alert.name}`);
    } catch (error) {
      logger.error(`Error executing escalation level ${level.level}:`, error);
    }
  }

  private evaluateEscalationConditions(alert: Alert, conditions: EscalationCondition[]): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'severity':
          return this.evaluateCondition(alert.severity, condition.operator, condition.value);
        case 'team':
          return this.evaluateCondition(alert.labels.team, condition.operator, condition.value);
        case 'duration':
          const duration = Date.now() - alert.startsAt.getTime();
          return this.evaluateCondition(duration / 1000 / 60, condition.operator, condition.value); // minutes
        default:
          return true;
      }
    });
  }

  private evaluateCondition(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'contains':
        return String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    if (!channel.enabled) {
      return;
    }

    try {
      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(alert, channel);
          break;
        case 'slack':
          await this.sendSlackNotification(alert, channel);
          break;
        case 'pagerduty':
          await this.sendPagerDutyNotification(alert, channel);
          break;
        case 'sms':
          await this.sendSMSNotification(alert, channel);
          break;
        case 'webhook':
          await this.sendWebhookNotification(alert, channel);
          break;
        default:
          logger.warn(`Unknown notification channel type: ${channel.type}`);
      }

      logger.info(`Sent ${channel.type} notification for alert: ${alert.name}`);
    } catch (error) {
      logger.error(`Failed to send ${channel.type} notification:`, error);
    }
  }

  private async sendEmailNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      host: channel.config.smtpHost,
      port: channel.config.smtpPort,
      secure: channel.config.smtpPort === 465,
      auth: {
        user: channel.config.smtpUser,
        pass: channel.config.smtpPassword
      }
    });

    const subject = `[${alert.severity.toUpperCase()}] ${alert.annotations.summary || alert.name}`;
    const html = this.generateEmailTemplate(alert);

    await transporter.sendMail({
      from: channel.config.fromEmail,
      to: channel.config.recipients.join(','),
      subject,
      html
    });
  }

  private async sendSlackNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      icon_emoji: channel.config.iconEmoji,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        title: alert.annotations.summary || alert.name,
        text: alert.annotations.description,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Team',
            value: alert.labels.team || 'Unknown',
            short: true
          },
          {
            title: 'Started At',
            value: alert.startsAt.toISOString(),
            short: true
          }
        ],
        actions: alert.annotations.runbook_url ? [{
          type: 'button',
          text: 'View Runbook',
          url: alert.annotations.runbook_url
        }] : undefined
      }]
    };

    const response = await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  private async sendPagerDutyNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const payload = {
      routing_key: channel.config.integrationKey,
      event_action: alert.status === 'resolved' ? 'resolve' : 'trigger',
      dedup_key: alert.fingerprint,
      payload: {
        summary: alert.annotations.summary || alert.name,
        source: 'TripleCheck Monitoring',
        severity: alert.severity,
        component: alert.labels.team || 'unknown',
        group: alert.labels.service || 'unknown',
        class: alert.labels.alertname || 'unknown',
        custom_details: {
          description: alert.annotations.description,
          runbook_url: alert.annotations.runbook_url,
          labels: alert.labels,
          annotations: alert.annotations
        }
      }
    };

    const response = await fetch(channel.config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`PagerDuty notification failed: ${response.statusText}`);
    }
  }

  private async sendSMSNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const twilio = await import('twilio');
    const client = twilio.default(channel.config.accountSid, channel.config.authToken);

    const message = `[${alert.severity.toUpperCase()}] ${alert.annotations.summary || alert.name}\n${alert.annotations.description}`;

    const promises = channel.config.recipients.map((recipient: string) =>
      client.messages.create({
        body: message.substring(0, 160), // SMS character limit
        from: channel.config.fromNumber,
        to: recipient
      })
    );

    await Promise.all(promises);
  }

  private async sendWebhookNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const payload = {
      alert,
      timestamp: new Date().toISOString(),
      source: 'TripleCheck Alerting System'
    };

    const response = await fetch(channel.config.url, {
      method: channel.config.method || 'POST',
      headers: channel.config.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  }

  private generateEmailTemplate(alert: Alert): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
              <h2 style="margin: 0;">[${alert.severity.toUpperCase()}] Alert</h2>
            </div>
            <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
              <h3>${alert.annotations.summary || alert.name}</h3>
              <p><strong>Description:</strong> ${alert.annotations.description || 'No description provided'}</p>
              <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
              <p><strong>Team:</strong> ${alert.labels.team || 'Unknown'}</p>
              <p><strong>Started At:</strong> ${alert.startsAt.toISOString()}</p>
              ${alert.annotations.runbook_url ? `<p><strong>Runbook:</strong> <a href="${alert.annotations.runbook_url}">View Runbook</a></p>` : ''}
              
              <h4>Labels:</h4>
              <ul>
                ${Object.entries(alert.labels).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}
              </ul>
              
              <div style="margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 3px;">
                <small>This alert was generated by TripleCheck Monitoring System</small>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }

  private startAlertProcessor(): void {
    // Process alerts every 30 seconds
    setInterval(() => {
      this.processAlertQueue();
    }, 30000);

    logger.info('Alert processor started');
  }

  private processAlertQueue(): void {
    // This would typically process alerts from a queue (Redis, RabbitMQ, etc.)
    // For now, it's a placeholder for the alert processing logic
  }

  // Public API methods
  async acknowledgeIncident(incidentId: string, userId: string): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    incident.status = 'acknowledged';
    incident.updatedAt = new Date();
    incident.timeline.push({
      id: `event-${Date.now()}`,
      type: 'acknowledged',
      timestamp: new Date(),
      user: userId,
      message: `Incident acknowledged by ${userId}`
    });

    this.emit('incident:acknowledged', incident);
    logger.info(`Incident acknowledged: ${incidentId} by ${userId}`);
  }

  async assignIncident(incidentId: string, assignee: string, userId: string): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    incident.assignee = assignee;
    incident.updatedAt = new Date();
    incident.timeline.push({
      id: `event-${Date.now()}`,
      type: 'assigned',
      timestamp: new Date(),
      user: userId,
      message: `Incident assigned to ${assignee} by ${userId}`
    });

    this.emit('incident:assigned', incident);
    logger.info(`Incident assigned: ${incidentId} to ${assignee} by ${userId}`);
  }

  async addIncidentNote(incidentId: string, note: string, userId: string): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    incident.updatedAt = new Date();
    incident.timeline.push({
      id: `event-${Date.now()}`,
      type: 'note_added',
      timestamp: new Date(),
      user: userId,
      message: note
    });

    this.emit('incident:note_added', incident);
    logger.info(`Note added to incident: ${incidentId} by ${userId}`);
  }

  getActiveIncidents(): Incident[] {
    return Array.from(this.incidents.values()).filter(i => i.status !== 'resolved');
  }

  getIncident(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => a.status === 'firing');
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const details = {
        activeAlerts: this.getActiveAlerts().length,
        activeIncidents: this.getActiveIncidents().length,
        notificationChannels: this.notificationChannels.size,
        escalationPolicies: this.escalationPolicies.size
      };

      return {
        status: 'healthy',
        details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}

// Export singleton instance
export const alertingSystem = AlertingSystem.getInstance();