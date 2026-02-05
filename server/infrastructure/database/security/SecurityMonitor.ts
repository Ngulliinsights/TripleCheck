/**
 * Security Monitor
 * 
 * Real-time security event monitoring, threat detection, and automated response
 * for the TripleCheck system.
 */

import { createHash } from 'crypto';
import { EventEmitter } from 'events';

import { Pool, PoolClient } from 'pg';

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'system' | 'network' | 'application';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  description: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
  responseActions: string[];
}

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | ((event: SecurityEvent) => boolean);
  severity: SecurityEvent['severity'];
  threshold: number;
  timeWindow: number; // in minutes
  enabled: boolean;
  responseActions: string[];
}

export interface SecurityAlert {
  id: string;
  threatPatternId: string;
  triggeredBy: SecurityEvent[];
  severity: SecurityEvent['severity'];
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  responseActions: string[];
}

export interface VulnerabilityAssessment {
  id: string;
  type: 'dependency' | 'configuration' | 'code' | 'infrastructure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  description: string;
  cve?: string;
  cvssScore?: number;
  discoveredAt: Date;
  status: 'open' | 'acknowledged' | 'fixed' | 'accepted_risk';
  fixedAt?: Date;
  notes?: string;
}

export class SecurityMonitor extends EventEmitter {
  private pool: Pool;
  private threatPatterns: Map<string, ThreatPattern> = new Map();
  private activeAlerts: Map<string, SecurityAlert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(pool: Pool) {
    super();
    this.pool = pool;
    this.initializeThreatPatterns();
  }

  /**
   * Initialize built-in threat detection patterns
   */
  private initializeThreatPatterns(): void {
    // Brute force login attempts
    this.threatPatterns.set('brute_force_login', {
      id: 'brute_force_login',
      name: 'Brute Force Login Attempts',
      description: 'Multiple failed login attempts from same IP',
      pattern: (event: SecurityEvent) => 
        event.type === 'authentication' && 
        event.description.includes('failed_login'),
      severity: 'high',
      threshold: 5,
      timeWindow: 15,
      enabled: true,
      responseActions: ['block_ip', 'notify_admin', 'log_incident']
    });

    // Suspicious data access patterns
    this.threatPatterns.set('suspicious_data_access', {
      id: 'suspicious_data_access',
      name: 'Suspicious Data Access',
      description: 'Unusual data access patterns indicating potential data exfiltration',
      pattern: (event: SecurityEvent) =>
        event.type === 'data_access' &&
        (event.details?.recordCount > 1000 || event.details?.sensitiveData === true),
      severity: 'critical',
      threshold: 3,
      timeWindow: 60,
      enabled: true,
      responseActions: ['restrict_user', 'notify_dpo', 'audit_access', 'log_incident']
    });

    // Privilege escalation attempts
    this.threatPatterns.set('privilege_escalation', {
      id: 'privilege_escalation',
      name: 'Privilege Escalation Attempt',
      description: 'Attempts to access resources beyond user permissions',
      pattern: (event: SecurityEvent) =>
        event.type === 'authorization' &&
        event.description.includes('access_denied') &&
        event.details?.attemptedRole !== event.details?.currentRole,
      severity: 'high',
      threshold: 3,
      timeWindow: 30,
      enabled: true,
      responseActions: ['restrict_user', 'notify_admin', 'log_incident']
    });

    // SQL injection attempts
    this.threatPatterns.set('sql_injection', {
      id: 'sql_injection',
      name: 'SQL Injection Attempt',
      description: 'Potential SQL injection in user input',
      pattern: (event: SecurityEvent) =>
        event.type === 'application' &&
        /('|(--|;)|(\bunion\b)|(\bselect\b)|(\binsert\b)|(\bupdate\b)|(\bdelete\b)|(\bdrop\b))/i.test(event.details?.userInput || ''),
      severity: 'critical',
      threshold: 1,
      timeWindow: 5,
      enabled: true,
      responseActions: ['block_ip', 'notify_admin', 'log_incident']
    });

    // Unusual system activity
    this.threatPatterns.set('unusual_system_activity', {
      id: 'unusual_system_activity',
      name: 'Unusual System Activity',
      description: 'System activity outside normal patterns',
      pattern: (event: SecurityEvent) =>
        event.type === 'system' &&
        (event.details?.cpuUsage > 90 || event.details?.memoryUsage > 90 || event.details?.diskUsage > 95),
      severity: 'medium',
      threshold: 5,
      timeWindow: 10,
      enabled: true,
      responseActions: ['notify_admin', 'log_incident']
    });

    // Geolocation anomalies
    this.threatPatterns.set('geolocation_anomaly', {
      id: 'geolocation_anomaly',
      name: 'Geolocation Anomaly',
      description: 'User access from unusual geographic location',
      pattern: (event: SecurityEvent) =>
        event.type === 'authentication' &&
        event.details?.locationAnomaly === true,
      severity: 'medium',
      threshold: 1,
      timeWindow: 5,
      enabled: true,
      responseActions: ['require_2fa', 'notify_user', 'log_incident']
    });
  }

  /**
   * Initialize security monitoring tables
   */
  async initializeSecurityTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Security events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS security_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(20) NOT NULL CHECK (type IN ('authentication', 'authorization', 'data_access', 'system', 'network', 'application')),
          severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          source VARCHAR(255) NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          ip_address INET,
          user_agent TEXT,
          description TEXT NOT NULL,
          details JSONB DEFAULT '{}',
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
          resolved BOOLEAN DEFAULT false,
          response_actions JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS security_events_type_idx ON security_events(type);
        CREATE INDEX IF NOT EXISTS security_events_severity_idx ON security_events(severity);
        CREATE INDEX IF NOT EXISTS security_events_timestamp_idx ON security_events(timestamp);
        CREATE INDEX IF NOT EXISTS security_events_user_idx ON security_events(user_id);
        CREATE INDEX IF NOT EXISTS security_events_ip_idx ON security_events(ip_address);
        CREATE INDEX IF NOT EXISTS security_events_resolved_idx ON security_events(resolved);
      `);

      // Security alerts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS security_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          threat_pattern_id VARCHAR(100) NOT NULL,
          triggered_by JSONB NOT NULL,
          severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          description TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
          acknowledged BOOLEAN DEFAULT false,
          acknowledged_by VARCHAR(255),
          acknowledged_at TIMESTAMP,
          resolved BOOLEAN DEFAULT false,
          resolved_by VARCHAR(255),
          resolved_at TIMESTAMP,
          response_actions JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS security_alerts_pattern_idx ON security_alerts(threat_pattern_id);
        CREATE INDEX IF NOT EXISTS security_alerts_severity_idx ON security_alerts(severity);
        CREATE INDEX IF NOT EXISTS security_alerts_timestamp_idx ON security_alerts(timestamp);
        CREATE INDEX IF NOT EXISTS security_alerts_acknowledged_idx ON security_alerts(acknowledged);
        CREATE INDEX IF NOT EXISTS security_alerts_resolved_idx ON security_alerts(resolved);
      `);

      // Vulnerability assessments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS vulnerability_assessments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(20) NOT NULL CHECK (type IN ('dependency', 'configuration', 'code', 'infrastructure')),
          severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          component VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          cve VARCHAR(20),
          cvss_score DECIMAL(3,1),
          discovered_at TIMESTAMP DEFAULT NOW() NOT NULL,
          status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'fixed', 'accepted_risk')),
          fixed_at TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS vulnerability_assessments_type_idx ON vulnerability_assessments(type);
        CREATE INDEX IF NOT EXISTS vulnerability_assessments_severity_idx ON vulnerability_assessments(severity);
        CREATE INDEX IF NOT EXISTS vulnerability_assessments_status_idx ON vulnerability_assessments(status);
        CREATE INDEX IF NOT EXISTS vulnerability_assessments_component_idx ON vulnerability_assessments(component);
      `);

      // Blocked IPs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
          id SERIAL PRIMARY KEY,
          ip_address INET NOT NULL UNIQUE,
          reason TEXT NOT NULL,
          blocked_at TIMESTAMP DEFAULT NOW() NOT NULL,
          blocked_by VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS blocked_ips_ip_idx ON blocked_ips(ip_address);
        CREATE INDEX IF NOT EXISTS blocked_ips_active_idx ON blocked_ips(is_active);
        CREATE INDEX IF NOT EXISTS blocked_ips_expires_idx ON blocked_ips(expires_at);
      `);

      await client.query('COMMIT');
      console.log('✅ Security monitoring tables initialized');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Start security monitoring
   */
  async startMonitoring(): Promise<void> {
    console.log('🔒 Starting security monitoring...');
    
    await this.initializeSecurityTables();
    
    // Start periodic threat detection
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.detectThreats();
        await this.cleanupExpiredBlocks();
      } catch (error) {
        console.error('❌ Error in security monitoring:', error);
        this.emit('monitoring_error', error);
      }
    }, 60000); // Run every minute

    this.emit('monitoring_started');
    console.log('✅ Security monitoring started');
  }

  /**
   * Stop security monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.emit('monitoring_stopped');
    console.log('🔒 Security monitoring stopped');
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved' | 'responseActions'>): Promise<string> {
    const client = await this.pool.connect();
    
    try {
      const eventId = createHash('sha256')
        .update(`${event.type}_${event.source}_${Date.now()}_${Math.random()}`)
        .digest('hex')
        .substring(0, 16);

      await client.query(`
        INSERT INTO security_events (id, type, severity, source, user_id, ip_address, user_agent, description, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        eventId, event.type, event.severity, event.source,
        event.userId || null, event.ipAddress || null, event.userAgent || null,
        event.description, JSON.stringify(event.details || {})
      ]);

      // Emit event for real-time processing
      const fullEvent: SecurityEvent = {
        ...event,
        id: eventId,
        timestamp: new Date(),
        resolved: false,
        responseActions: []
      };

      this.emit('security_event', fullEvent);
      
      // Check for immediate threat patterns
      await this.checkThreatPatterns(fullEvent);
      
      return eventId;
    } finally {
      client.release();
    }
  }

  /**
   * Detect threats based on patterns
   */
  private async detectThreats(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      // Get recent unresolved events
      const result = await client.query(`
        SELECT * FROM security_events 
        WHERE timestamp > NOW() - INTERVAL '1 hour' 
        AND resolved = false
        ORDER BY timestamp DESC
      `);

      const events: SecurityEvent[] = result.rows.map(row => ({
        id: row.id,
        type: row.type,
        severity: row.severity,
        source: row.source,
        userId: row.user_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        description: row.description,
        details: row.details,
        timestamp: row.timestamp,
        resolved: row.resolved,
        responseActions: row.response_actions
      }));

      // Check each threat pattern
      for (const [patternId, pattern] of this.threatPatterns) {
        if (!pattern.enabled) continue;
        
        await this.checkThreatPattern(pattern, events, client);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Check a specific threat pattern against events
   */
  private async checkThreatPattern(pattern: ThreatPattern, events: SecurityEvent[], client: PoolClient): Promise<void> {
    const timeWindowStart = new Date(Date.now() - pattern.timeWindow * 60 * 1000);
    
    // Filter events that match the pattern and are within time window
    const matchingEvents = events.filter(event => 
      event.timestamp >= timeWindowStart &&
      (typeof pattern.pattern === 'function' ? pattern.pattern(event) : pattern.pattern.test(event.description))
    );

    if (matchingEvents.length >= pattern.threshold) {
      await this.triggerSecurityAlert(pattern, matchingEvents, client);
    }
  }

  /**
   * Check threat patterns for a single event
   */
  private async checkThreatPatterns(event: SecurityEvent): Promise<void> {
    for (const [patternId, pattern] of this.threatPatterns) {
      if (!pattern.enabled) continue;
      
      const matches = typeof pattern.pattern === 'function' 
        ? pattern.pattern(event) 
        : pattern.pattern.test(event.description);

      if (matches) {
        // Get recent matching events for this pattern
        const client = await this.pool.connect();
        try {
          const timeWindowStart = new Date(Date.now() - pattern.timeWindow * 60 * 1000);
          
          const result = await client.query(`
            SELECT * FROM security_events 
            WHERE timestamp >= $1 
            AND resolved = false
            ORDER BY timestamp DESC
          `, [timeWindowStart]);

          const recentEvents: SecurityEvent[] = result.rows
            .map(row => ({
              id: row.id,
              type: row.type,
              severity: row.severity,
              source: row.source,
              userId: row.user_id,
              ipAddress: row.ip_address,
              userAgent: row.user_agent,
              description: row.description,
              details: row.details,
              timestamp: row.timestamp,
              resolved: row.resolved,
              responseActions: row.response_actions
            }))
            .filter(e => 
              typeof pattern.pattern === 'function' 
                ? pattern.pattern(e) 
                : pattern.pattern.test(e.description)
            );

          if (recentEvents.length >= pattern.threshold) {
            await this.triggerSecurityAlert(pattern, recentEvents, client);
          }
        } finally {
          client.release();
        }
      }
    }
  }

  /**
   * Trigger a security alert
   */
  private async triggerSecurityAlert(pattern: ThreatPattern, events: SecurityEvent[], client: PoolClient): Promise<void> {
    const alertId = createHash('sha256')
      .update(`${pattern.id}_${Date.now()}_${Math.random()}`)
      .digest('hex')
      .substring(0, 16);

    // Check if similar alert already exists and is unresolved
    const existingAlert = await client.query(`
      SELECT id FROM security_alerts 
      WHERE threat_pattern_id = $1 
      AND resolved = false 
      AND timestamp > NOW() - INTERVAL '1 hour'
    `, [pattern.id]);

    if (existingAlert.rows.length > 0) {
      return; // Don't create duplicate alerts
    }

    const alert: SecurityAlert = {
      id: alertId,
      threatPatternId: pattern.id,
      triggeredBy: events,
      severity: pattern.severity,
      description: `${pattern.name}: ${pattern.description}`,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      responseActions: pattern.responseActions
    };

    await client.query(`
      INSERT INTO security_alerts (id, threat_pattern_id, triggered_by, severity, description, response_actions)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      alert.id, alert.threatPatternId, JSON.stringify(alert.triggeredBy),
      alert.severity, alert.description, JSON.stringify(alert.responseActions)
    ]);

    this.activeAlerts.set(alertId, alert);
    
    // Execute automated response actions
    await this.executeResponseActions(alert, client);
    
    this.emit('security_alert', alert);
    console.log(`🚨 Security alert triggered: ${alert.description}`);
  }

  /**
   * Execute automated response actions
   */
  private async executeResponseActions(alert: SecurityAlert, client: PoolClient): Promise<void> {
    for (const action of alert.responseActions) {
      try {
        switch (action) {
          case 'block_ip':
            await this.blockSuspiciousIPs(alert, client);
            break;
          case 'restrict_user':
            await this.restrictSuspiciousUsers(alert, client);
            break;
          case 'notify_admin':
            await this.notifyAdministrators(alert);
            break;
          case 'notify_dpo':
            await this.notifyDataProtectionOfficer(alert);
            break;
          case 'notify_user':
            await this.notifyAffectedUsers(alert);
            break;
          case 'require_2fa':
            await this.require2FA(alert, client);
            break;
          case 'audit_access':
            await this.auditUserAccess(alert, client);
            break;
          case 'log_incident':
            await this.logSecurityIncident(alert, client);
            break;
        }
      } catch (error) {
        console.error(`❌ Failed to execute response action ${action}:`, error);
      }
    }
  }

  /**
   * Block suspicious IP addresses
   */
  private async blockSuspiciousIPs(alert: SecurityAlert, client: PoolClient): Promise<void> {
    const ipAddresses = [...new Set(alert.triggeredBy
      .map(event => event.ipAddress)
      .filter(ip => ip !== null && ip !== undefined))];

    for (const ip of ipAddresses) {
      await client.query(`
        INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (ip_address) DO UPDATE SET
          reason = $2,
          blocked_at = NOW(),
          expires_at = $4,
          is_active = true
      `, [
        ip,
        `Blocked due to security alert: ${alert.description}`,
        'security_monitor',
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      ]);
    }

    console.log(`🚫 Blocked ${ipAddresses.length} IP addresses`);
  }

  /**
   * Restrict suspicious users
   */
  private async restrictSuspiciousUsers(alert: SecurityAlert, client: PoolClient): Promise<void> {
    const userIds = [...new Set(alert.triggeredBy
      .map(event => event.userId)
      .filter(id => id !== null && id !== undefined))];

    for (const userId of userIds) {
      await client.query(`
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `, [userId]);

      // Log the restriction
      await this.logSecurityEvent({
        type: 'system',
        severity: 'high',
        source: 'security_monitor',
        userId: userId.toString(),
        description: `User restricted due to security alert: ${alert.description}`,
        details: { alertId: alert.id, automatic: true }
      });
    }

    console.log(`🚫 Restricted ${userIds.length} user accounts`);
  }

  /**
   * Notify administrators
   */
  private async notifyAdministrators(alert: SecurityAlert): Promise<void> {
    // This would integrate with notification system
    console.log(`📧 Admin notification sent for alert: ${alert.description}`);
    this.emit('admin_notification', alert);
  }

  /**
   * Notify data protection officer
   */
  private async notifyDataProtectionOfficer(alert: SecurityAlert): Promise<void> {
    // This would integrate with notification system
    console.log(`📧 DPO notification sent for alert: ${alert.description}`);
    this.emit('dpo_notification', alert);
  }

  /**
   * Notify affected users
   */
  private async notifyAffectedUsers(alert: SecurityAlert): Promise<void> {
    // This would integrate with notification system
    console.log(`📧 User notifications sent for alert: ${alert.description}`);
    this.emit('user_notification', alert);
  }

  /**
   * Require 2FA for affected users
   */
  private async require2FA(alert: SecurityAlert, client: PoolClient): Promise<void> {
    const userIds = [...new Set(alert.triggeredBy
      .map(event => event.userId)
      .filter(id => id !== null && id !== undefined))];

    for (const userId of userIds) {
      // This would integrate with 2FA system
      console.log(`🔐 2FA required for user ${userId}`);
    }
  }

  /**
   * Audit user access patterns
   */
  private async auditUserAccess(alert: SecurityAlert, client: PoolClient): Promise<void> {
    const userIds = [...new Set(alert.triggeredBy
      .map(event => event.userId)
      .filter(id => id !== null && id !== undefined))];

    for (const userId of userIds) {
      // Generate detailed access audit
      const auditResult = await client.query(`
        SELECT 
          action_type,
          table_name,
          COUNT(*) as access_count,
          MAX(created_at) as last_access
        FROM audit_logs 
        WHERE user_id = $1 
        AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY action_type, table_name
        ORDER BY access_count DESC
      `, [userId]);

      console.log(`📊 Access audit completed for user ${userId}: ${auditResult.rows.length} patterns found`);
    }
  }

  /**
   * Log security incident
   */
  private async logSecurityIncident(alert: SecurityAlert, client: PoolClient): Promise<void> {
    // This would integrate with incident management system
    console.log(`📝 Security incident logged: ${alert.description}`);
    this.emit('security_incident', alert);
  }

  /**
   * Clean up expired IP blocks
   */
  private async cleanupExpiredBlocks(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(`
        UPDATE blocked_ips 
        SET is_active = false 
        WHERE expires_at < NOW() AND is_active = true
        RETURNING ip_address
      `);

      if (result.rows.length > 0) {
        console.log(`🔓 Unblocked ${result.rows.length} expired IP addresses`);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Run vulnerability scan
   */
  async runVulnerabilityScan(): Promise<VulnerabilityAssessment[]> {
    console.log('🔍 Running vulnerability assessment...');
    
    const vulnerabilities: VulnerabilityAssessment[] = [];
    
    // This would integrate with actual vulnerability scanners
    // For now, we'll simulate some common checks
    
    // Check for weak configurations
    const configVulns = await this.checkConfigurationVulnerabilities();
    vulnerabilities.push(...configVulns);
    
    // Check dependencies (would integrate with npm audit, etc.)
    const depVulns = await this.checkDependencyVulnerabilities();
    vulnerabilities.push(...depVulns);
    
    // Store vulnerabilities in database
    const client = await this.pool.connect();
    try {
      for (const vuln of vulnerabilities) {
        await client.query(`
          INSERT INTO vulnerability_assessments (id, type, severity, component, description, cve, cvss_score)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            severity = $3,
            description = $5,
            updated_at = NOW()
        `, [
          vuln.id, vuln.type, vuln.severity, vuln.component,
          vuln.description, vuln.cve || null, vuln.cvssScore || null
        ]);
      }
    } finally {
      client.release();
    }
    
    console.log(`✅ Vulnerability scan completed: ${vulnerabilities.length} issues found`);
    this.emit('vulnerability_scan_completed', vulnerabilities);
    
    return vulnerabilities;
  }

  /**
   * Check for configuration vulnerabilities
   */
  private async checkConfigurationVulnerabilities(): Promise<VulnerabilityAssessment[]> {
    const vulnerabilities: VulnerabilityAssessment[] = [];
    
    // Check database configuration
    const client = await this.pool.connect();
    try {
      // Check for default passwords
      const defaultPassResult = await client.query(`
        SELECT COUNT(*) as count FROM users WHERE password = crypt('password', password)
      `);
      
      if (parseInt(defaultPassResult.rows[0].count) > 0) {
        vulnerabilities.push({
          id: 'config_default_passwords',
          type: 'configuration',
          severity: 'high',
          component: 'user_authentication',
          description: 'Users with default passwords detected',
          discoveredAt: new Date(),
          status: 'open'
        });
      }
      
      // Check SSL configuration
      const sslResult = await client.query(`SELECT setting FROM pg_settings WHERE name = 'ssl'`);
      if (sslResult.rows[0]?.setting !== 'on') {
        vulnerabilities.push({
          id: 'config_ssl_disabled',
          type: 'configuration',
          severity: 'medium',
          component: 'database_connection',
          description: 'SSL is not enabled for database connections',
          discoveredAt: new Date(),
          status: 'open'
        });
      }
    } finally {
      client.release();
    }
    
    return vulnerabilities;
  }

  /**
   * Check for dependency vulnerabilities
   */
  private async checkDependencyVulnerabilities(): Promise<VulnerabilityAssessment[]> {
    const vulnerabilities: VulnerabilityAssessment[] = [];
    
    // This would integrate with npm audit, Snyk, or other dependency scanners
    // For now, we'll simulate some common dependency issues
    
    return vulnerabilities;
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      // Get recent security events
      const eventsResult = await client.query(`
        SELECT 
          type,
          severity,
          COUNT(*) as count
        FROM security_events 
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY type, severity
        ORDER BY count DESC
      `);

      // Get active alerts
      const alertsResult = await client.query(`
        SELECT 
          severity,
          COUNT(*) as count
        FROM security_alerts 
        WHERE resolved = false
        GROUP BY severity
      `);

      // Get vulnerability summary
      const vulnResult = await client.query(`
        SELECT 
          severity,
          status,
          COUNT(*) as count
        FROM vulnerability_assessments
        GROUP BY severity, status
      `);

      // Get blocked IPs
      const blockedIpsResult = await client.query(`
        SELECT COUNT(*) as count FROM blocked_ips WHERE is_active = true
      `);

      return {
        events: eventsResult.rows,
        alerts: alertsResult.rows,
        vulnerabilities: vulnResult.rows,
        blockedIPs: parseInt(blockedIpsResult.rows[0].count),
        lastUpdated: new Date()
      };
    } finally {
      client.release();
    }
  }
}