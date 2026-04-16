import { eq } from 'drizzle-orm';

import { logger } from '../../infrastructure/observability/telemetry';
import { db } from '../../infrastructure/database/connection/index';

export interface AuditEvent {
  id?: string;
  userId: string;
  sessionId?: string;
  propertyId?: string;
  action: string;
  resourceType: 'session' | 'property' | 'feedback' | 'report' | 'monitoring' | 'system';
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  userId?: string;
  sessionId?: string;
  propertyId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topActions: Array<{ action: string; count: number }>;
  recentEvents: AuditEvent[];
}

/**
 * Service for comprehensive audit logging of all verification activities
 * Tracks user actions, system events, and security-related activities
 */
export class AuditLogger {
  private eventBuffer: AuditEvent[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.startPeriodicFlush();
  }

  /**
   * Log a verification session event
   */
  async logSessionEvent(
    userId: string,
    sessionId: string,
    action: string,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: AuditEvent = {
      userId,
      sessionId,
      action,
      resourceType: 'session',
      resourceId: sessionId,
      details,
      timestamp: new Date(),
      success,
      errorMessage,
      metadata
    };

    await this.logEvent(event);
  }

  /**
   * Log a property access event
   */
  async logPropertyEvent(
    userId: string,
    propertyId: string,
    action: string,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string,
    sessionId?: string
  ): Promise<void> {
    const event: AuditEvent = {
      userId,
      propertyId,
      sessionId,
      action,
      resourceType: 'property',
      resourceId: propertyId,
      details,
      timestamp: new Date(),
      success,
      errorMessage
    };

    await this.logEvent(event);
  }

  /**
   * Log a community feedback event
   */
  async logFeedbackEvent(
    userId: string,
    sessionId: string,
    action: string,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const event: AuditEvent = {
      userId,
      sessionId,
      action,
      resourceType: 'feedback',
      resourceId: sessionId,
      details: {
        ...details,
        // Remove sensitive feedback content from audit logs
        feedbackContent: details.feedbackContent ? '[REDACTED]' : undefined
      },
      timestamp: new Date(),
      success,
      errorMessage
    };

    await this.logEvent(event);
  }

  /**
   * Log a report generation event
   */
  async logReportEvent(
    userId: string,
    sessionId: string,
    action: string,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const event: AuditEvent = {
      userId,
      sessionId,
      action,
      resourceType: 'report',
      resourceId: sessionId,
      details,
      timestamp: new Date(),
      success,
      errorMessage
    };

    await this.logEvent(event);
  }

  /**
   * Log a monitoring event
   */
  async logMonitoringEvent(
    userId: string,
    propertyId: string,
    action: string,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const event: AuditEvent = {
      userId,
      propertyId,
      action,
      resourceType: 'monitoring',
      resourceId: propertyId,
      details,
      timestamp: new Date(),
      success,
      errorMessage
    };

    await this.logEvent(event);
  }

  /**
   * Log a system event
   */
  async logSystemEvent(
    action: string,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string,
    userId?: string
  ): Promise<void> {
    const event: AuditEvent = {
      userId: userId || 'system',
      action,
      resourceType: 'system',
      details,
      timestamp: new Date(),
      success,
      errorMessage
    };

    await this.logEvent(event);
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    userId: string,
    action: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const event: AuditEvent = {
      userId,
      action,
      resourceType: 'system',
      details: {
        ...details,
        securityEvent: true
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success,
      errorMessage,
      metadata: {
        severity: success ? 'info' : 'warning',
        category: 'security'
      }
    };

    await this.logEvent(event);

    // Log security events immediately to structured logger
    logger.warn('Security event logged', 'AuditLogger', {
      userId,
      action,
      ipAddress,
      userAgent,
      success,
      errorMessage
    });
  }

  /**
   * Log access control event
   */
  async logAccessEvent(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    allowed: boolean,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const event: AuditEvent = {
      userId,
      action: `access_${action}`,
      resourceType: resourceType as AuditEvent['resourceType'],
      resourceId,
      details: {
        accessAllowed: allowed,
        accessReason: reason,
        requestedAction: action
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success: allowed,
      errorMessage: allowed ? undefined : reason,
      metadata: {
        category: 'access_control'
      }
    };

    await this.logEvent(event);
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    try {
      // This would query the audit_events table when implemented
      // For now, return from buffer
      let events = [...this.eventBuffer];

      // Apply filters
      if (query.userId) {
        events = events.filter(e => e.userId === query.userId);
      }
      if (query.sessionId) {
        events = events.filter(e => e.sessionId === query.sessionId);
      }
      if (query.propertyId) {
        events = events.filter(e => e.propertyId === query.propertyId);
      }
      if (query.action) {
        events = events.filter(e => e.action === query.action);
      }
      if (query.resourceType) {
        events = events.filter(e => e.resourceType === query.resourceType);
      }
      if (query.success !== undefined) {
        events = events.filter(e => e.success === query.success);
      }
      if (query.startDate) {
        events = events.filter(e => e.timestamp >= query.startDate!);
      }
      if (query.endDate) {
        events = events.filter(e => e.timestamp <= query.endDate!);
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 50;
      return events.slice(offset, offset + limit);

    } catch (error) {
      logger.error({ error: (error as Error).message, stack: (error as Error).stack }, 'Failed to query audit events');
      return [];
    }
  }

  /**
   * Get audit summary for a time period
   */
  async getAuditSummary(startDate: Date, endDate: Date): Promise<AuditSummary> {
    try {
      const events = await this.queryEvents({ startDate, endDate, limit: 1000 });

      const totalEvents = events.length;
      const successfulEvents = events.filter(e => e.success).length;
      const failedEvents = totalEvents - successfulEvents;
      const uniqueUsers = new Set(events.map(e => e.userId)).size;
      const uniqueSessions = new Set(events.filter(e => e.sessionId).map(e => e.sessionId)).size;

      // Calculate top actions
      const actionCounts = events.reduce((acc, event) => {
        acc[event.action] = (acc[event.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const recentEvents = events.slice(0, 20);

      return {
        totalEvents,
        successfulEvents,
        failedEvents,
        uniqueUsers,
        uniqueSessions,
        topActions,
        recentEvents
      };

    } catch (error) {
      logger.error({ error: (error as Error).message, stack: (error as Error).stack }, 'Failed to generate audit summary');
      return {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        uniqueUsers: 0,
        uniqueSessions: 0,
        topActions: [],
        recentEvents: []
      };
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string, days: number = 30): Promise<{
    totalActions: number;
    recentSessions: string[];
    topActions: Array<{ action: string; count: number }>;
    lastActivity: Date | null;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.queryEvents({ userId, startDate, limit: 500 });

    const totalActions = events.length;
    const recentSessions = [...new Set(events.filter(e => e.sessionId).map(e => e.sessionId!))].slice(0, 10);
    
    const actionCounts = events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const lastActivity = events.length > 0 ? events[0].timestamp : null;

    return {
      totalActions,
      recentSessions,
      topActions,
      lastActivity
    };
  }

  /**
   * Clean up old audit events
   */
  async cleanupOldEvents(retentionDays: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Remove old events from buffer
      const initialCount = this.eventBuffer.length;
      this.eventBuffer = this.eventBuffer.filter(event => event.timestamp > cutoffDate);
      const removedCount = initialCount - this.eventBuffer.length;

      logger.info('Cleaned up ${removedCount} old audit events');
      return removedCount;

    } catch (error) {
      logger.error({ error: (error as Error).message, stack: (error as Error).stack }, 'Failed to cleanup old audit events');
      return 0;
    }
  }

  // Private methods

  private async logEvent(event: AuditEvent): Promise<void> {
    try {
      // Add to buffer
      this.eventBuffer.push(event);

      // Flush if buffer is full
      if (this.eventBuffer.length >= this.bufferSize) {
        await this.flushEvents();
      }

      // Log to structured logger for immediate visibility
      logger.info('Audit event logged', 'AuditLogger', {
        userId: event.userId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        success: event.success,
        timestamp: event.timestamp
      });

    } catch (error) {
      logger.error({ error: (error as Error).message, stack: (error as Error).stack }, 'Failed to log audit event');
    }
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    try {
      // In a real implementation, this would batch insert to database
      // For now, just log the flush operation
      logger.info('Flushing ${this.eventBuffer.length} audit events to storage');

      // Clear the buffer
      this.eventBuffer = [];

    } catch (error) {
      logger.error({ error: (error as Error).message, stack: (error as Error).stack }, 'Failed to flush audit events');
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushEvents();
    }, this.flushInterval);
  }

  /**
   * Shutdown the audit logger
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushEvents();
  }
}

// Create singleton instance
export const auditLogger = new AuditLogger();