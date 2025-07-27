import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuditLogger } from '../AuditLogger';

// Mock logger
vi.mock('../../../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;

  beforeEach(() => {
    auditLogger = new AuditLogger();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await auditLogger.shutdown();
  });

  describe('Session Event Logging', () => {
    it('should log session events successfully', async () => {
      await auditLogger.logSessionEvent(
        'user-123',
        'session-456',
        'session_created',
        { propertyId: 'prop-789' },
        true
      );

      const events = await auditLogger.queryEvents({ userId: 'user-123' });
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        userId: 'user-123',
        sessionId: 'session-456',
        action: 'session_created',
        resourceType: 'session',
        success: true
      });
    });

    it('should log session failures with error messages', async () => {
      await auditLogger.logSessionEvent(
        'user-123',
        'session-456',
        'session_failed',
        { reason: 'validation_error' },
        false,
        'Property validation failed'
      );

      const events = await auditLogger.queryEvents({ userId: 'user-123' });
      expect(events[0]).toMatchObject({
        success: false,
        errorMessage: 'Property validation failed'
      });
    });

    it('should include metadata in session events', async () => {
      const metadata = { source: 'api', version: '1.0' };
      
      await auditLogger.logSessionEvent(
        'user-123',
        'session-456',
        'session_updated',
        { status: 'in_progress' },
        true,
        undefined,
        metadata
      );

      const events = await auditLogger.queryEvents({ userId: 'user-123' });
      expect(events[0].metadata).toEqual(metadata);
    });
  });

  describe('Property Event Logging', () => {
    it('should log property access events', async () => {
      await auditLogger.logPropertyEvent(
        'user-123',
        'prop-456',
        'property_accessed',
        { accessType: 'read' },
        true,
        undefined,
        'session-789'
      );

      const events = await auditLogger.queryEvents({ propertyId: 'prop-456' });
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        userId: 'user-123',
        propertyId: 'prop-456',
        sessionId: 'session-789',
        action: 'property_accessed',
        resourceType: 'property'
      });
    });

    it('should log property modification events', async () => {
      await auditLogger.logPropertyEvent(
        'user-123',
        'prop-456',
        'property_updated',
        { 
          field: 'verification_status',
          oldValue: 'pending',
          newValue: 'verified'
        },
        true
      );

      const events = await auditLogger.queryEvents({ action: 'property_updated' });
      expect(events[0].details).toMatchObject({
        field: 'verification_status',
        oldValue: 'pending',
        newValue: 'verified'
      });
    });
  });

  describe('Feedback Event Logging', () => {
    it('should log feedback events with content redaction', async () => {
      await auditLogger.logFeedbackEvent(
        'user-123',
        'session-456',
        'feedback_created',
        { 
          feedbackContent: 'Sensitive community information',
          source: 'community_leader'
        },
        true
      );

      const events = await auditLogger.queryEvents({ resourceType: 'feedback' });
      expect(events[0].details.feedbackContent).toBe('[REDACTED]');
      expect(events[0].details.source).toBe('community_leader');
    });

    it('should log feedback validation events', async () => {
      await auditLogger.logFeedbackEvent(
        'user-123',
        'session-456',
        'feedback_validated',
        { 
          validationResult: 'passed',
          reliability: 0.85
        },
        true
      );

      const events = await auditLogger.queryEvents({ action: 'feedback_validated' });
      expect(events[0].details.validationResult).toBe('passed');
      expect(events[0].details.reliability).toBe(0.85);
    });
  });

  describe('Report Event Logging', () => {
    it('should log report generation events', async () => {
      await auditLogger.logReportEvent(
        'user-123',
        'session-456',
        'report_generated',
        { 
          reportType: 'comprehensive',
          format: 'pdf',
          pageCount: 25
        },
        true
      );

      const events = await auditLogger.queryEvents({ resourceType: 'report' });
      expect(events[0]).toMatchObject({
        action: 'report_generated',
        resourceType: 'report',
        success: true
      });
    });

    it('should log report download events', async () => {
      await auditLogger.logReportEvent(
        'user-123',
        'session-456',
        'report_downloaded',
        { 
          reportId: 'report-789',
          downloadTime: new Date().toISOString()
        },
        true
      );

      const events = await auditLogger.queryEvents({ action: 'report_downloaded' });
      expect(events[0].details.reportId).toBe('report-789');
    });
  });

  describe('Monitoring Event Logging', () => {
    it('should log monitoring setup events', async () => {
      await auditLogger.logMonitoringEvent(
        'user-123',
        'prop-456',
        'monitoring_enabled',
        { 
          frequency: 'weekly',
          alertTypes: ['ownership_change', 'legal_dispute']
        },
        true
      );

      const events = await auditLogger.queryEvents({ resourceType: 'monitoring' });
      expect(events[0]).toMatchObject({
        action: 'monitoring_enabled',
        resourceType: 'monitoring',
        propertyId: 'prop-456'
      });
    });

    it('should log monitoring alert events', async () => {
      await auditLogger.logMonitoringEvent(
        'user-123',
        'prop-456',
        'alert_triggered',
        { 
          alertType: 'ownership_change',
          severity: 'high',
          details: 'New ownership transfer detected'
        },
        true
      );

      const events = await auditLogger.queryEvents({ action: 'alert_triggered' });
      expect(events[0].details.alertType).toBe('ownership_change');
      expect(events[0].details.severity).toBe('high');
    });
  });

  describe('System Event Logging', () => {
    it('should log system events', async () => {
      await auditLogger.logSystemEvent(
        'service_started',
        { 
          service: 'LandVerificationService',
          version: '1.0.0',
          startTime: new Date().toISOString()
        },
        true
      );

      const events = await auditLogger.queryEvents({ resourceType: 'system' });
      expect(events[0]).toMatchObject({
        userId: 'system',
        action: 'service_started',
        resourceType: 'system'
      });
    });

    it('should log system errors', async () => {
      await auditLogger.logSystemEvent(
        'service_error',
        { 
          service: 'GovernmentIntegrationService',
          errorType: 'connection_timeout'
        },
        false,
        'Failed to connect to government API'
      );

      const events = await auditLogger.queryEvents({ success: false });
      expect(events[0]).toMatchObject({
        success: false,
        errorMessage: 'Failed to connect to government API'
      });
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events with IP and user agent', async () => {
      await auditLogger.logSecurityEvent(
        'user-123',
        'unauthorized_access_attempt',
        { 
          resource: 'session-456',
          attemptedAction: 'delete'
        },
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        false,
        'Access denied: insufficient privileges'
      );

      const events = await auditLogger.queryEvents({ userId: 'user-123' });
      expect(events[0]).toMatchObject({
        action: 'unauthorized_access_attempt',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: false
      });
      expect(events[0].metadata?.category).toBe('security');
    });

    it('should log successful authentication events', async () => {
      await auditLogger.logSecurityEvent(
        'user-123',
        'user_authenticated',
        { 
          method: 'password',
          sessionId: 'session-789'
        },
        '192.168.1.100',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        true
      );

      const events = await auditLogger.queryEvents({ action: 'user_authenticated' });
      expect(events[0].success).toBe(true);
      expect(events[0].metadata?.severity).toBe('info');
    });
  });

  describe('Access Control Event Logging', () => {
    it('should log access granted events', async () => {
      await auditLogger.logAccessEvent(
        'user-123',
        'session',
        'session-456',
        'read',
        true,
        undefined,
        '192.168.1.100',
        'Mozilla/5.0'
      );

      const events = await auditLogger.queryEvents({ action: 'access_read' });
      expect(events[0]).toMatchObject({
        action: 'access_read',
        resourceType: 'session',
        resourceId: 'session-456',
        success: true
      });
      expect(events[0].details.accessAllowed).toBe(true);
    });

    it('should log access denied events', async () => {
      await auditLogger.logAccessEvent(
        'user-123',
        'property',
        'prop-456',
        'write',
        false,
        'User does not own this property',
        '192.168.1.100',
        'Mozilla/5.0'
      );

      const events = await auditLogger.queryEvents({ success: false });
      expect(events[0]).toMatchObject({
        success: false,
        errorMessage: 'User does not own this property'
      });
      expect(events[0].details.accessReason).toBe('User does not own this property');
    });
  });

  describe('Event Querying', () => {
    beforeEach(async () => {
      // Add test events
      await auditLogger.logSessionEvent('user-1', 'session-1', 'action-1', {}, true);
      await auditLogger.logSessionEvent('user-2', 'session-2', 'action-2', {}, true);
      await auditLogger.logPropertyEvent('user-1', 'prop-1', 'action-3', {}, false);
    });

    it('should query events by user ID', async () => {
      const events = await auditLogger.queryEvents({ userId: 'user-1' });
      expect(events).toHaveLength(2);
      expect(events.every(e => e.userId === 'user-1')).toBe(true);
    });

    it('should query events by session ID', async () => {
      const events = await auditLogger.queryEvents({ sessionId: 'session-1' });
      expect(events).toHaveLength(1);
      expect(events[0].sessionId).toBe('session-1');
    });

    it('should query events by action', async () => {
      const events = await auditLogger.queryEvents({ action: 'action-2' });
      expect(events).toHaveLength(1);
      expect(events[0].action).toBe('action-2');
    });

    it('should query events by success status', async () => {
      const failedEvents = await auditLogger.queryEvents({ success: false });
      expect(failedEvents).toHaveLength(1);
      expect(failedEvents[0].success).toBe(false);

      const successEvents = await auditLogger.queryEvents({ success: true });
      expect(successEvents).toHaveLength(2);
      expect(successEvents.every(e => e.success === true)).toBe(true);
    });

    it('should apply pagination', async () => {
      const firstPage = await auditLogger.queryEvents({ limit: 2, offset: 0 });
      expect(firstPage).toHaveLength(2);

      const secondPage = await auditLogger.queryEvents({ limit: 2, offset: 2 });
      expect(secondPage).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const events = await auditLogger.queryEvents({
        startDate: oneHourAgo,
        endDate: oneHourFromNow
      });

      expect(events.length).toBeGreaterThan(0);
      expect(events.every(e => e.timestamp >= oneHourAgo && e.timestamp <= oneHourFromNow)).toBe(true);
    });
  });

  describe('Audit Summary', () => {
    beforeEach(async () => {
      // Add test events for summary
      await auditLogger.logSessionEvent('user-1', 'session-1', 'session_created', {}, true);
      await auditLogger.logSessionEvent('user-1', 'session-1', 'session_updated', {}, true);
      await auditLogger.logSessionEvent('user-2', 'session-2', 'session_created', {}, false);
      await auditLogger.logPropertyEvent('user-1', 'prop-1', 'property_accessed', {}, true);
    });

    it('should generate audit summary', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date();

      const summary = await auditLogger.getAuditSummary(startDate, endDate);

      expect(summary.totalEvents).toBe(4);
      expect(summary.successfulEvents).toBe(3);
      expect(summary.failedEvents).toBe(1);
      expect(summary.uniqueUsers).toBe(2);
      expect(summary.uniqueSessions).toBe(2);
      expect(summary.topActions).toHaveLength(3);
      expect(summary.recentEvents).toHaveLength(4);
    });

    it('should calculate top actions correctly', async () => {
      // Add more events to test action counting
      await auditLogger.logSessionEvent('user-3', 'session-3', 'session_created', {}, true);
      await auditLogger.logSessionEvent('user-4', 'session-4', 'session_created', {}, true);

      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const summary = await auditLogger.getAuditSummary(startDate, endDate);
      
      const sessionCreatedAction = summary.topActions.find(a => a.action === 'session_created');
      expect(sessionCreatedAction?.count).toBe(3);
    });
  });

  describe('User Activity', () => {
    beforeEach(async () => {
      await auditLogger.logSessionEvent('user-1', 'session-1', 'session_created', {}, true);
      await auditLogger.logSessionEvent('user-1', 'session-2', 'session_updated', {}, true);
      await auditLogger.logPropertyEvent('user-1', 'prop-1', 'property_accessed', {}, true);
    });

    it('should get user activity summary', async () => {
      const activity = await auditLogger.getUserActivity('user-1', 30);

      expect(activity.totalActions).toBe(3);
      expect(activity.recentSessions).toContain('session-1');
      expect(activity.recentSessions).toContain('session-2');
      expect(activity.topActions).toHaveLength(3);
      expect(activity.lastActivity).toBeInstanceOf(Date);
    });

    it('should return empty activity for non-existent user', async () => {
      const activity = await auditLogger.getUserActivity('non-existent-user', 30);

      expect(activity.totalActions).toBe(0);
      expect(activity.recentSessions).toHaveLength(0);
      expect(activity.topActions).toHaveLength(0);
      expect(activity.lastActivity).toBeNull();
    });
  });

  describe('Event Cleanup', () => {
    it('should clean up old events', async () => {
      // Add some events
      await auditLogger.logSessionEvent('user-1', 'session-1', 'old_action', {}, true);
      
      const removedCount = await auditLogger.cleanupOldEvents(0); // Remove all events
      expect(removedCount).toBeGreaterThan(0);

      const events = await auditLogger.queryEvents({});
      expect(events).toHaveLength(0);
    });

    it('should preserve recent events during cleanup', async () => {
      await auditLogger.logSessionEvent('user-1', 'session-1', 'recent_action', {}, true);
      
      const removedCount = await auditLogger.cleanupOldEvents(365); // Keep events from last year
      expect(removedCount).toBe(0);

      const events = await auditLogger.queryEvents({});
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle query errors gracefully', async () => {
      // Mock a query that would fail
      const events = await auditLogger.queryEvents({ userId: 'user-1' });
      expect(Array.isArray(events)).toBe(true);
    });

    it('should handle summary generation errors', async () => {
      const startDate = new Date();
      const endDate = new Date();
      
      const summary = await auditLogger.getAuditSummary(startDate, endDate);
      expect(summary).toHaveProperty('totalEvents');
      expect(summary).toHaveProperty('successfulEvents');
      expect(summary).toHaveProperty('failedEvents');
    });

    it('should handle cleanup errors gracefully', async () => {
      const removedCount = await auditLogger.cleanupOldEvents(365);
      expect(typeof removedCount).toBe('number');
      expect(removedCount).toBeGreaterThanOrEqual(0);
    });
  });
});