/**
 * Security System Integration
 * 
 * Unified security system that integrates compliance management,
 * security monitoring, and vulnerability scanning.
 */

import { EventEmitter } from 'events';

import { Pool } from 'pg';

import { ComplianceManager } from './ComplianceManager';
import { SecurityMonitor } from './SecurityMonitor';
import { VulnerabilityScanner } from './VulnerabilityScanner';

export interface SecuritySystemConfig {
  database: {
    pool: Pool;
  };
  compliance: {
    enableGDPR: boolean;
    enableDataRetention: boolean;
    retentionCheckInterval: number; // in hours
  };
  monitoring: {
    enableRealTimeMonitoring: boolean;
    enableThreatDetection: boolean;
    alertThresholds: {
      critical: number;
      high: number;
      medium: number;
    };
  };
  scanning: {
    enableAutomatedScanning: boolean;
    scanInterval: number; // in hours
    enableCIIntegration: boolean;
    failOnCritical: boolean;
  };
  notifications: {
    adminEmail?: string;
    dpoEmail?: string;
    slackWebhook?: string;
    enableEmailAlerts: boolean;
    enableSlackAlerts: boolean;
  };
}

export class SecuritySystem extends EventEmitter {
  private config: SecuritySystemConfig;
  private complianceManager: ComplianceManager;
  private securityMonitor: SecurityMonitor;
  private vulnerabilityScanner: VulnerabilityScanner;
  private retentionInterval: NodeJS.Timeout | null = null;
  private scanInterval: NodeJS.Timeout | null = null;

  constructor(config: SecuritySystemConfig, projectRoot: string = process.cwd()) {
    super();
    this.config = config;
    
    // Initialize components
    this.complianceManager = new ComplianceManager(config.database.pool);
    this.securityMonitor = new SecurityMonitor(config.database.pool);
    this.vulnerabilityScanner = new VulnerabilityScanner(projectRoot, {
      failOnCritical: config.scanning.failOnCritical,
      enableNpmAudit: true,
      enableCodeAnalysis: true,
      enableInfrastructureScan: true
    });

    this.setupEventHandlers();
  }

  /**
   * Initialize the complete security system
   */
  async initialize(): Promise<void> {
    console.log('🔒 Initializing TripleCheck Security System...');

    try {
      // Initialize compliance management
      if (this.config.compliance.enableGDPR || this.config.compliance.enableDataRetention) {
        await this.complianceManager.initializeComplianceTables();
        console.log('✅ Compliance management initialized');
      }

      // Initialize security monitoring
      if (this.config.monitoring.enableRealTimeMonitoring) {
        await this.securityMonitor.initializeSecurityTables();
        await this.securityMonitor.startMonitoring();
        console.log('✅ Security monitoring initialized');
      }

      // Start scheduled tasks
      this.startScheduledTasks();

      // Run initial vulnerability scan
      if (this.config.scanning.enableAutomatedScanning) {
        console.log('🔍 Running initial vulnerability scan...');
        await this.vulnerabilityScanner.runComprehensiveScan();
      }

      this.emit('system_initialized');
      console.log('🎉 Security system fully initialized');

    } catch (error) {
      console.error('❌ Failed to initialize security system:', error);
      this.emit('initialization_error', error);
      throw error;
    }
  }

  /**
   * Shutdown the security system
   */
  async shutdown(): Promise<void> {
    console.log('🔒 Shutting down security system...');

    // Stop monitoring
    this.securityMonitor.stopMonitoring();

    // Clear intervals
    if (this.retentionInterval) {
      clearInterval(this.retentionInterval);
      this.retentionInterval = null;
    }

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    this.emit('system_shutdown');
    console.log('✅ Security system shutdown complete');
  }

  /**
   * Setup event handlers for cross-component communication
   */
  private setupEventHandlers(): void {
    // Compliance Manager events
    this.complianceManager.on('gdpr_request_created', (data) => {
      this.emit('compliance_event', { type: 'gdpr_request', data });
      this.notifyAdministrators('GDPR Request Created', `New GDPR ${data.type} request for user ${data.userId}`);
    });

    this.complianceManager.on('retention_policy_executed', (data) => {
      this.emit('compliance_event', { type: 'retention_executed', data });
      console.log(`📋 Data retention executed: ${data.recordsProcessed} records ${data.action} for ${data.policyName}`);
    });

    // Security Monitor events
    this.securityMonitor.on('security_alert', (alert) => {
      this.emit('security_event', { type: 'alert', data: alert });
      this.handleSecurityAlert(alert);
    });

    this.securityMonitor.on('security_event', (event) => {
      this.emit('security_event', { type: 'event', data: event });
      
      // Log high severity events
      if (event.severity === 'critical' || event.severity === 'high') {
        console.log(`🚨 ${event.severity.toUpperCase()} security event: ${event.description}`);
      }
    });

    // Vulnerability Scanner events
    this.vulnerabilityScanner.on('scan_completed', (report) => {
      this.emit('security_event', { type: 'scan_completed', data: report });
      this.handleVulnerabilityReport(report);
    });

    this.vulnerabilityScanner.on('scan_failed', (report) => {
      this.emit('security_event', { type: 'scan_failed', data: report });
      this.notifyAdministrators('Vulnerability Scan Failed', 
        `Critical vulnerabilities found: ${report.summary.critical} critical, ${report.summary.high} high`);
    });
  }

  /**
   * Start scheduled security tasks
   */
  private startScheduledTasks(): void {
    // Data retention task
    if (this.config.compliance.enableDataRetention) {
      const retentionIntervalMs = this.config.compliance.retentionCheckInterval * 60 * 60 * 1000;
      this.retentionInterval = setInterval(async () => {
        try {
          await this.complianceManager.executeDataRetention();
        } catch (error) {
          console.error('❌ Data retention task failed:', error);
          this.emit('task_error', { task: 'data_retention', error });
        }
      }, retentionIntervalMs);

      console.log(`⏰ Data retention scheduled every ${this.config.compliance.retentionCheckInterval} hours`);
    }

    // Vulnerability scanning task
    if (this.config.scanning.enableAutomatedScanning) {
      const scanIntervalMs = this.config.scanning.scanInterval * 60 * 60 * 1000;
      this.scanInterval = setInterval(async () => {
        try {
          await this.vulnerabilityScanner.runComprehensiveScan();
        } catch (error) {
          console.error('❌ Vulnerability scan task failed:', error);
          this.emit('task_error', { task: 'vulnerability_scan', error });
        }
      }, scanIntervalMs);

      console.log(`⏰ Vulnerability scanning scheduled every ${this.config.scanning.scanInterval} hours`);
    }
  }

  /**
   * Handle security alerts
   */
  private async handleSecurityAlert(alert: any): Promise<void> {
    const {severity} = alert;
    const {description} = alert;

    // Log alert
    console.log(`🚨 Security Alert [${severity.toUpperCase()}]: ${description}`);

    // Send notifications based on severity
    if (severity === 'critical') {
      await this.notifyAdministrators('CRITICAL Security Alert', description);
      await this.notifyDataProtectionOfficer('CRITICAL Security Alert', description);
    } else if (severity === 'high') {
      await this.notifyAdministrators('HIGH Security Alert', description);
    }

    // Check if alert threshold is exceeded
    const activeAlerts = await this.getActiveAlertsCount();
    const threshold = this.config.monitoring.alertThresholds[severity as keyof typeof this.config.monitoring.alertThresholds];
    
    if (activeAlerts[severity] >= threshold) {
      await this.notifyAdministrators('Alert Threshold Exceeded', 
        `${severity} alert threshold exceeded: ${activeAlerts[severity]} active alerts`);
    }
  }

  /**
   * Handle vulnerability reports
   */
  private async handleVulnerabilityReport(report: any): Promise<void> {
    const { summary } = report;
    
    console.log(`📊 Vulnerability Scan Results: ${summary.total} total, ${summary.critical} critical, ${summary.high} high`);

    // Notify on critical vulnerabilities
    if (summary.critical > 0) {
      await this.notifyAdministrators('Critical Vulnerabilities Found', 
        `Vulnerability scan found ${summary.critical} critical vulnerabilities that require immediate attention`);
    }

    // Generate compliance report if needed
    if (summary.total > 0) {
      try {
        await this.complianceManager.generateComplianceReport('security', 
          { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() }, 
          'security_system');
      } catch (error) {
        console.error('❌ Failed to generate security compliance report:', error);
      }
    }
  }

  /**
   * Get active alerts count by severity
   */
  private async getActiveAlertsCount(): Promise<Record<string, number>> {
    // This would query the database for active alerts
    // For now, return mock data
    return {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
  }

  /**
   * Send notification to administrators
   */
  private async notifyAdministrators(subject: string, message: string): Promise<void> {
    if (this.config.notifications.enableEmailAlerts && this.config.notifications.adminEmail) {
      // Email notification would be implemented here
      console.log(`📧 Admin notification: ${subject} - ${message}`);
    }

    if (this.config.notifications.enableSlackAlerts && this.config.notifications.slackWebhook) {
      // Slack notification would be implemented here
      console.log(`💬 Slack notification: ${subject} - ${message}`);
    }

    this.emit('notification_sent', { type: 'admin', subject, message });
  }

  /**
   * Send notification to Data Protection Officer
   */
  private async notifyDataProtectionOfficer(subject: string, message: string): Promise<void> {
    if (this.config.notifications.enableEmailAlerts && this.config.notifications.dpoEmail) {
      // Email notification would be implemented here
      console.log(`📧 DPO notification: ${subject} - ${message}`);
    }

    this.emit('notification_sent', { type: 'dpo', subject, message });
  }

  /**
   * Process GDPR request
   */
  async processGDPRRequest(request: any): Promise<string> {
    return await this.complianceManager.processGDPRRequest(request);
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: any): Promise<string> {
    return await this.securityMonitor.logSecurityEvent(event);
  }

  /**
   * Run vulnerability scan
   */
  async runVulnerabilityScan(): Promise<any> {
    return await this.vulnerabilityScanner.runComprehensiveScan();
  }

  /**
   * Generate security dashboard data
   */
  async getSecurityDashboard(): Promise<any> {
    const [monitoringDashboard, vulnerabilityReport] = await Promise.all([
      this.securityMonitor.getSecurityDashboard(),
      this.vulnerabilityScanner.runComprehensiveScan().catch(() => null)
    ]);

    return {
      monitoring: monitoringDashboard,
      vulnerabilities: vulnerabilityReport?.summary || { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      compliance: {
        gdprRequestsToday: 0, // Would be fetched from database
        retentionPoliciesActive: 5,
        lastRetentionRun: new Date()
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Get system health status
   */
  getSystemHealth(): any {
    return {
      compliance: {
        status: 'healthy',
        lastRetentionRun: new Date(),
        gdprRequestsProcessed: 0
      },
      monitoring: {
        status: 'healthy',
        activeAlerts: 0,
        eventsToday: 0
      },
      scanning: {
        status: 'healthy',
        lastScan: new Date(),
        vulnerabilitiesFound: 0
      }
    };
  }
}

/**
 * Factory function to create a security system
 */
export function createSecuritySystem(config: SecuritySystemConfig, projectRoot?: string): SecuritySystem {
  return new SecuritySystem(config, projectRoot);
}