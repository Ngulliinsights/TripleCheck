/**
 * Audit Log Service
 * Security event logging and audit trail management
 */

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  eventType: AuditEventType;
  action: string;
  resource?: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export type AuditEventType = 
  | 'authentication'
  | 'authorization' 
  | 'data_access'
  | 'data_modification'
  | 'system_access'
  | 'security_event'
  | 'user_action'
  | 'api_request'
  | 'error';

export interface AuditFilter {
  userId?: string;
  eventType?: AuditEventType;
  action?: string;
  resource?: string;
  success?: boolean;
  riskLevel?: AuditEvent['riskLevel'];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

class AuditLogService {
  private static instance: AuditLogService;
  private auditEvents: AuditEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events in memory
  private sessionId: string;

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
  }

  /**
   * Log an audit event
   */
  logEvent(
    eventType: AuditEventType,
    action: string,
    details: Record<string, any> = {},
    options: {
      resource?: string;
      resourceId?: string;
      success?: boolean;
      riskLevel?: AuditEvent['riskLevel'];
      userId?: string;
    } = {}
  ): string {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId: options.userId || this.getCurrentUserId(),
      sessionId: this.sessionId,
      eventType,
      action,
      resource: options.resource,
      resourceId: options.resourceId,
      details: {
        ...details,
        url: window.location.href,
        referrer: document.referrer
      },
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      success: options.success !== false,
      riskLevel: options.riskLevel || this.calculateRiskLevel(eventType, action, details)
    };

    this.auditEvents.push(event);

    // Keep only the most recent events
    if (this.auditEvents.length > this.maxEvents) {
      this.auditEvents = this.auditEvents.slice(-this.maxEvents);
    }

    // Send to server in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToServer(event);
    }

    // Log high-risk events to console
    if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
      console.warn('[AUDIT] High-risk event:', event);
    }

    return event.id;
  }

  /**
   * Log authentication events
   */
  logAuthentication(action: string, success: boolean, details: Record<string, any> = {}): string {
    return this.logEvent('authentication', action, details, {
      success,
      riskLevel: success ? 'low' : 'medium'
    });
  }

  /**
   * Log authorization events
   */
  logAuthorization(action: string, resource: string, success: boolean, details: Record<string, any> = {}): string {
    return this.logEvent('authorization', action, details, {
      resource,
      success,
      riskLevel: success ? 'low' : 'high'
    });
  }

  /**
   * Log data access events
   */
  logDataAccess(resource: string, resourceId: string, action: string = 'read', details: Record<string, any> = {}): string {
    return this.logEvent('data_access', action, details, {
      resource,
      resourceId,
      riskLevel: 'low'
    });
  }

  /**
   * Log data modification events
   */
  logDataModification(resource: string, resourceId: string, action: string, details: Record<string, any> = {}): string {
    return this.logEvent('data_modification', action, details, {
      resource,
      resourceId,
      riskLevel: 'medium'
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(action: string, details: Record<string, any> = {}, riskLevel: AuditEvent['riskLevel'] = 'high'): string {
    return this.logEvent('security_event', action, details, {
      riskLevel,
      success: false
    });
  }

  /**
   * Log API requests
   */
  logApiRequest(endpoint: string, method: string, success: boolean, details: Record<string, any> = {}): string {
    return this.logEvent('api_request', `${method} ${endpoint}`, details, {
      resource: 'api',
      resourceId: endpoint,
      success,
      riskLevel: 'low'
    });
  }

  /**
   * Log user actions
   */
  logUserAction(action: string, details: Record<string, any> = {}): string {
    return this.logEvent('user_action', action, details, {
      riskLevel: 'low'
    });
  }

  /**
   * Log errors
   */
  logError(error: Error, context: string, details: Record<string, any> = {}): string {
    return this.logEvent('error', context, {
      ...details,
      error: error.message,
      stack: error.stack
    }, {
      success: false,
      riskLevel: 'medium'
    });
  }

  /**
   * Get audit events with filtering
   */
  getEvents(filter: AuditFilter = {}): AuditEvent[] {
    let events = [...this.auditEvents];

    // Apply filters
    if (filter.userId) {
      events = events.filter(e => e.userId === filter.userId);
    }

    if (filter.eventType) {
      events = events.filter(e => e.eventType === filter.eventType);
    }

    if (filter.action) {
      events = events.filter(e => e.action.includes(filter.action));
    }

    if (filter.resource) {
      events = events.filter(e => e.resource === filter.resource);
    }

    if (filter.success !== undefined) {
      events = events.filter(e => e.success === filter.success);
    }

    if (filter.riskLevel) {
      events = events.filter(e => e.riskLevel === filter.riskLevel);
    }

    if (filter.dateFrom) {
      events = events.filter(e => e.timestamp >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      events = events.filter(e => e.timestamp <= filter.dateTo!);
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filter.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  /**
   * Get security events summary
   */
  getSecuritySummary(): {
    totalEvents: number;
    failedLogins: number;
    unauthorizedAccess: number;
    highRiskEvents: number;
    recentEvents: AuditEvent[];
  } {
    const events = this.auditEvents;
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return {
      totalEvents: events.length,
      failedLogins: events.filter(e => 
        e.eventType === 'authentication' && !e.success
      ).length,
      unauthorizedAccess: events.filter(e => 
        e.eventType === 'authorization' && !e.success
      ).length,
      highRiskEvents: events.filter(e => 
        e.riskLevel === 'high' || e.riskLevel === 'critical'
      ).length,
      recentEvents: events.filter(e => e.timestamp >= last24Hours).slice(0, 10)
    };
  }

  /**
   * Export audit log
   */
  exportAuditLog(filter: AuditFilter = {}): string {
    const events = this.getEvents(filter);
    const csvHeader = 'Timestamp,User ID,Event Type,Action,Resource,Success,Risk Level,Details\n';
    
    const csvRows = events.map(event => {
      const details = JSON.stringify(event.details).replace(/"/g, '""');
      return [
        event.timestamp.toISOString(),
        event.userId || '',
        event.eventType,
        event.action,
        event.resource || '',
        event.success,
        event.riskLevel,
        `"${details}"`
      ].join(',');
    });

    return csvHeader + csvRows.join('\n');
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditEvents = [];
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | undefined {
    // This would typically come from your auth service
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Get client IP (approximation)
   */
  private getClientIP(): string | undefined {
    // In a real application, this would come from the server
    return undefined;
  }

  /**
   * Calculate risk level based on event details
   */
  private calculateRiskLevel(
    eventType: AuditEventType, 
    action: string, 
    details: Record<string, any>
  ): AuditEvent['riskLevel'] {
    // High-risk patterns
    if (eventType === 'security_event') return 'critical';
    if (action.includes('delete') && details.permanent) return 'high';
    if (action.includes('admin') || action.includes('privilege')) return 'high';
    if (eventType === 'authorization' && !details.success) return 'high';
    if (eventType === 'authentication' && action.includes('failed')) return 'medium';
    
    return 'low';
  }

  /**
   * Send event to server
   */
  private async sendToServer(event: AuditEvent): Promise<void> {
    try {
      await fetch('/api/audit/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send audit event to server:', error);
    }
  }

  /**
   * Setup event listeners for automatic logging
   */
  private setupEventListeners(): void {
    // Log page navigation
    window.addEventListener('beforeunload', () => {
      this.logUserAction('page_unload', {
        url: window.location.href,
        duration: Date.now() - performance.timing.navigationStart
      });
    });

    // Log visibility changes
    document.addEventListener('visibilitychange', () => {
      this.logUserAction(document.hidden ? 'page_hidden' : 'page_visible');
    });
  }
}

export const auditLogService = AuditLogService.getInstance();
export default auditLogService;