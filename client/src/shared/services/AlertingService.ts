/**
 * Alerting Service
 * Manages system alerts and notifications for monitoring
 */

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: Alert['severity'];
  enabled: boolean;
  cooldownMs: number;
  lastTriggered?: Date;
}

class AlertingService {
  private static instance: AlertingService;
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private alertCallbacks: Map<string, (alert: Alert) => void> = new Map();

  // Default alert rules
  private defaultRules: Omit<AlertRule, 'id'>[] = [
    {
      name: 'High Response Time',
      condition: 'response_time > threshold',
      threshold: 5000, // 5 seconds
      severity: 'high',
      enabled: true,
      cooldownMs: 300000 // 5 minutes
    },
    {
      name: 'Service Unhealthy',
      condition: 'health_status == unhealthy',
      threshold: 1,
      severity: 'critical',
      enabled: true,
      cooldownMs: 60000 // 1 minute
    },
    {
      name: 'Low Success Rate',
      condition: 'success_rate < threshold',
      threshold: 95, // 95%
      severity: 'medium',
      enabled: true,
      cooldownMs: 600000 // 10 minutes
    },
    {
      name: 'High Error Rate',
      condition: 'error_rate > threshold',
      threshold: 5, // 5%
      severity: 'high',
      enabled: true,
      cooldownMs: 300000 // 5 minutes
    }
  ];

  static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.defaultRules.forEach(rule => {
      this.addAlertRule({
        ...rule,
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    });
  }

  /**
   * Create a new alert
   */
  createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    title: string,
    message: string,
    source: string,
    metadata?: Record<string, any>
  ): string {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      message,
      source,
      timestamp: new Date(),
      resolved: false,
      metadata
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });

    // Log alert
    console.warn(`[ALERT] ${severity.toUpperCase()}: ${title} - ${message}`, {
      source,
      metadata
    });

    return alert.id;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Get all alerts
   */
  getAlerts(filter?: {
    type?: Alert['type'];
    severity?: Alert['severity'];
    resolved?: boolean;
    source?: string;
  }): Alert[] {
    let filteredAlerts = [...this.alerts];

    if (filter?.type) {
      filteredAlerts = filteredAlerts.filter(a => a.type === filter.type);
    }

    if (filter?.severity) {
      filteredAlerts = filteredAlerts.filter(a => a.severity === filter.severity);
    }

    if (filter?.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(a => a.resolved === filter.resolved);
    }

    if (filter?.source) {
      filteredAlerts = filteredAlerts.filter(a => a.source === filter.source);
    }

    return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get active (unresolved) alerts
   */
  getActiveAlerts(): Alert[] {
    return this.getAlerts({ resolved: false });
  }

  /**
   * Get alert counts by severity
   */
  getAlertCounts(): Record<Alert['severity'], number> {
    const activeAlerts = this.getActiveAlerts();
    
    return {
      low: activeAlerts.filter(a => a.severity === 'low').length,
      medium: activeAlerts.filter(a => a.severity === 'medium').length,
      high: activeAlerts.filter(a => a.severity === 'high').length,
      critical: activeAlerts.filter(a => a.severity === 'critical').length
    };
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const index = this.alertRules.findIndex(r => r.id === ruleId);
    if (index > -1) {
      this.alertRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      return true;
    }
    return false;
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * Evaluate alert rules against metrics
   */
  evaluateRules(metrics: {
    endpoint: string;
    responseTime: number;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    successRate: number;
    errorRate: number;
  }): void {
    const now = new Date();

    this.alertRules.forEach(rule => {
      if (!rule.enabled) return;

      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = now.getTime() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldownMs) {
          return;
        }
      }

      let shouldTrigger = false;
      let alertTitle = '';
      let alertMessage = '';

      // Evaluate conditions
      switch (rule.condition) {
        case 'response_time > threshold':
          shouldTrigger = metrics.responseTime > rule.threshold;
          if (shouldTrigger) {
            alertTitle = `High Response Time - ${metrics.endpoint}`;
            alertMessage = `Response time (${metrics.responseTime}ms) exceeds threshold (${rule.threshold}ms)`;
          }
          break;

        case 'health_status == unhealthy':
          shouldTrigger = metrics.healthStatus === 'unhealthy';
          if (shouldTrigger) {
            alertTitle = `Service Unhealthy - ${metrics.endpoint}`;
            alertMessage = `Service health status is unhealthy`;
          }
          break;

        case 'success_rate < threshold':
          shouldTrigger = metrics.successRate < rule.threshold;
          if (shouldTrigger) {
            alertTitle = `Low Success Rate - ${metrics.endpoint}`;
            alertMessage = `Success rate (${metrics.successRate.toFixed(1)}%) is below threshold (${rule.threshold}%)`;
          }
          break;

        case 'error_rate > threshold':
          shouldTrigger = metrics.errorRate > rule.threshold;
          if (shouldTrigger) {
            alertTitle = `High Error Rate - ${metrics.endpoint}`;
            alertMessage = `Error rate (${metrics.errorRate.toFixed(1)}%) exceeds threshold (${rule.threshold}%)`;
          }
          break;
      }

      if (shouldTrigger) {
        this.createAlert(
          rule.severity === 'critical' ? 'error' : 'warning',
          rule.severity,
          alertTitle,
          alertMessage,
          `monitoring.${metrics.endpoint}`,
          {
            rule: rule.name,
            ruleId: rule.id,
            metrics
          }
        );

        rule.lastTriggered = now;
      }
    });
  }

  /**
   * Subscribe to alert notifications
   */
  onAlert(id: string, callback: (alert: Alert) => void): void {
    this.alertCallbacks.set(id, callback);
  }

  /**
   * Unsubscribe from alert notifications
   */
  offAlert(id: string): void {
    this.alertCallbacks.delete(id);
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Clear resolved alerts older than specified time
   */
  clearOldAlerts(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): void { // 7 days default
    const cutoffTime = new Date(Date.now() - olderThanMs);
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || alert.timestamp > cutoffTime
    );
  }
}

export const alertingService = AlertingService.getInstance();
export default alertingService;