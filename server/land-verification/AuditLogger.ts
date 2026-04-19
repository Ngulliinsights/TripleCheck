/**
 * Comprehensive Audit Logger for Kenya Land Verification System
 * Provides detailed logging and audit trails for all verification activities
 *
 * CANONICAL SOURCE: All audit logging for land-verification domain goes through this class.
 * Used by security/, error-handling/, and audit/ subdomules via thin wrapper re-exports.
 */

import { sql, SQL } from "drizzle-orm";
import { generateCorrelationId } from "../../shared/types/errors";
import { db } from "../infrastructure/database/connection/index";
import { logger } from "../infrastructure/monitoring/logger";

export interface AuditEvent {
  id?: string;
  correlationId: string;
  timestamp: Date;
  eventType: AuditEventType;
  category: AuditCategory;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  propertyId?: string;
  service: string;
  operation: string;
  status: 'started' | 'completed' | 'failed' | 'cancelled';
  duration?: number;
  details: Record<string, any>;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  metadata: Record<string, any>;
}

export enum AuditEventType {
  VERIFICATION_STARTED = 'verification_started',
  VERIFICATION_COMPLETED = 'verification_completed',
  VERIFICATION_FAILED = 'verification_failed',
  LAYER_EXECUTED = 'layer_executed',
  GOVERNMENT_API_CALL = 'government_api_call',
  EXPERT_ASSIGNED = 'expert_assigned',
  RISK_ASSESSMENT = 'risk_assessment',
  DOCUMENT_PROCESSED = 'document_processed',
  COMMUNITY_FEEDBACK = 'community_feedback',
  PHYSICAL_VERIFICATION = 'physical_verification',
  MONITORING_ALERT = 'monitoring_alert',
  SECURITY_EVENT = 'security_event',
  SYSTEM_ERROR = 'system_error',
  DATA_ACCESS = 'data_access',
  CONFIGURATION_CHANGE = 'configuration_change'
}

export enum AuditCategory {
  VERIFICATION = 'verification',
  SECURITY = 'security',
  SYSTEM = 'system',
  DATA = 'data',
  INTEGRATION = 'integration',
  USER_ACTION = 'user_action',
  MONITORING = 'monitoring'
}

export enum AuditSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuditQuery {
  startDate?: Date;
  endDate?: Date;
  eventTypes?: AuditEventType[];
  categories?: AuditCategory[];
  severities?: AuditSeverity[];
  userId?: string;
  sessionId?: string;
  propertyId?: string;
  service?: string;
  status?: string;
  correlationId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByCategory: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  averageDuration: number;
  errorRate: number;
  topErrors: Array<{ error: string; count: number }>;
}

export class AuditLogger {
  private readonly batchSize = 100;
  private readonly flushInterval = 5000; // 5 seconds
  private eventBuffer: AuditEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.startBatchProcessor();
    this.setupGracefulShutdown();
  }

  /**
   * Log audit event
   */
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'correlationId'> & { correlationId?: string }): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      correlationId: event.correlationId || generateCorrelationId()
    };

    // Add to buffer for batch processing
    this.eventBuffer.push(auditEvent);

    // Log to console immediately for critical events
    if (auditEvent.severity === AuditSeverity.CRITICAL) {
      logger.error(
        `CRITICAL AUDIT EVENT: ${auditEvent.eventType}`,
        'AUDIT_LOGGER',
        auditEvent
      );
    }

    // Flush immediately if buffer is full
    if (this.eventBuffer.length >= this.batchSize) {
      await this.flushEvents();
    }
  }

  /**
   * Log verification started event
   */
  async logVerificationStarted(
    sessionId: string,
    propertyId: string,
    userId: string,
    verificationLayers: string[],
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.VERIFICATION_STARTED,
      category: AuditCategory.VERIFICATION,
      severity: AuditSeverity.MEDIUM,
      userId,
      sessionId,
      propertyId,
      service: 'land-verification',
      operation: 'start_verification',
      status: 'started',
      details: {
        verificationLayers,
        ...metadata
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log verification completed event
   */
  async logVerificationCompleted(
    sessionId: string,
    propertyId: string,
    userId: string,
    duration: number,
    results: Record<string, any>,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.VERIFICATION_COMPLETED,
      category: AuditCategory.VERIFICATION,
      severity: AuditSeverity.MEDIUM,
      userId,
      sessionId,
      propertyId,
      service: 'land-verification',
      operation: 'complete_verification',
      status: 'completed',
      duration,
      details: {
        results,
        ...metadata
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log verification failed event
   */
  async logVerificationFailed(
    sessionId: string,
    propertyId: string,
    userId: string,
    duration: number,
    error: Error,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.VERIFICATION_FAILED,
      category: AuditCategory.VERIFICATION,
      severity: AuditSeverity.HIGH,
      userId,
      sessionId,
      propertyId,
      service: 'land-verification',
      operation: 'verification_failure',
      status: 'failed',
      duration,
      details: metadata,
      error: {
        code: (error as any).code || 'UNKNOWN_ERROR',
        message: error.message,
        stack: error.stack
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log government API call
   */
  async logGovernmentApiCall(
    service: string,
    operation: string,
    status: 'completed' | 'failed',
    duration: number,
    sessionId?: string,
    error?: Error,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.GOVERNMENT_API_CALL,
      category: AuditCategory.INTEGRATION,
      severity: status === 'failed' ? AuditSeverity.HIGH : AuditSeverity.LOW,
      sessionId,
      service,
      operation,
      status,
      duration,
      details: metadata,
      error: error ? {
        code: (error as any).code || 'API_ERROR',
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log security event (Enhanced for SecurityIntegration)
   */
  async logSecurityEvent(
    userId: string,
    event: string,
    details: Record<string, any> = {},
    ip?: string,
    userAgent?: string,
    success: boolean = true,
    message?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.SECURITY_EVENT,
      category: AuditCategory.SECURITY,
      severity: success ? AuditSeverity.MEDIUM : AuditSeverity.HIGH,
      userId,
      service: 'security',
      operation: event,
      status: success ? 'completed' : 'failed',
      details: {
        ...details,
        ip,
        userAgent,
        message
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log access event
   */
  async logAccessEvent(
    userId: string,
    resourceType: string,
    resourceId: string,
    operation: string,
    success: boolean = true,
    errorMessage?: string,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.DATA_ACCESS,
      category: AuditCategory.SECURITY,
      severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      userId,
      propertyId: resourceType === 'property' ? resourceId : undefined,
      service: 'access-control',
      operation: `${resourceType}_${operation}`,
      status: success ? 'completed' : 'failed',
      details: {
        resourceType,
        resourceId,
        ip,
        userAgent,
        errorMessage
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log session event
   */
  async logSessionEvent(
    userId: string,
    sessionId: string,
    operation: string,
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.LAYER_EXECUTED,
      category: AuditCategory.USER_ACTION,
      severity: AuditSeverity.LOW,
      userId,
      sessionId,
      service: 'session-manager',
      operation,
      status: success ? 'completed' : 'failed',
      details: {
        ...details,
        errorMessage
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log property event
   */
  async logPropertyEvent(
    userId: string,
    propertyId: string,
    operation: string,
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string,
    sessionId?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.DOCUMENT_PROCESSED,
      category: AuditCategory.VERIFICATION,
      severity: AuditSeverity.LOW,
      userId,
      propertyId,
      sessionId,
      service: 'property-service',
      operation,
      status: success ? 'completed' : 'failed',
      details: {
        ...details,
        errorMessage
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log feedback event
   */
  async logFeedbackEvent(
    userId: string,
    sessionId: string,
    operation: string,
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.COMMUNITY_FEEDBACK,
      category: AuditCategory.VERIFICATION,
      severity: AuditSeverity.LOW,
      userId,
      sessionId,
      service: 'community-intelligence',
      operation,
      status: success ? 'completed' : 'failed',
      details: {
        ...details,
        errorMessage
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log report event
   */
  async logReportEvent(
    userId: string,
    sessionId: string,
    operation: string,
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.RISK_ASSESSMENT,
      category: AuditCategory.VERIFICATION,
      severity: AuditSeverity.MEDIUM,
      userId,
      sessionId,
      service: 'reporting-service',
      operation,
      status: success ? 'completed' : 'failed',
      details: {
        ...details,
        errorMessage
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    operation: string,
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      category: AuditCategory.SYSTEM,
      severity: success ? AuditSeverity.LOW : AuditSeverity.HIGH,
      service: 'system',
      operation,
      status: success ? 'completed' : 'failed',
      details: {
        ...details,
        errorMessage
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    operation: string,
    dataType: string,
    userId?: string,
    propertyId?: string,
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.DATA_ACCESS,
      category: AuditCategory.DATA,
      severity: AuditSeverity.LOW,
      userId,
      propertyId,
      service: 'data-access',
      operation,
      status: 'completed',
      details: {
        dataType,
        ...details
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Log system error
   */
  async logSystemError(
    service: string,
    operation: string,
    error: Error,
    severity: AuditSeverity = AuditSeverity.HIGH,
    sessionId?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    await this.logEvent({
      eventType: AuditEventType.SYSTEM_ERROR,
      category: AuditCategory.SYSTEM,
      severity,
      sessionId,
      service,
      operation,
      status: 'failed',
      details: metadata,
      error: {
        code: (error as any).code || 'SYSTEM_ERROR',
        message: error.message,
        stack: error.stack
      },
      metadata: this.extractMetadata()
    });
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    try {
      // Ensure any pending events are flushed
      await this.flushEvents();

      let querySql: SQL = sql`SELECT * FROM audit_events WHERE 1=1`;
      const params: any[] = [];

      if (query.startDate) {
        querySql = sql`${querySql} AND timestamp >= ${query.startDate.toISOString()}`;
      }

      if (query.endDate) {
        querySql = sql`${querySql} AND timestamp <= ${query.endDate.toISOString()}`;
      }

      if (query.eventTypes && query.eventTypes.length > 0) {
        querySql = sql`${querySql} AND event_type IN (${sql.join(query.eventTypes.map(t => sql`${t}`), sql`, `)})`;
      }

      if (query.categories && query.categories.length > 0) {
        querySql = sql`${querySql} AND category IN (${sql.join(query.categories.map(c => sql`${c}`), sql`, `)})`;
      }

      if (query.severities && query.severities.length > 0) {
        querySql = sql`${querySql} AND severity IN (${sql.join(query.severities.map(s => sql`${s}`), sql`, `)})`;
      }

      if (query.userId) {
        querySql = sql`${querySql} AND user_id = ${query.userId}`;
      }

      if (query.sessionId) {
        querySql = sql`${querySql} AND session_id = ${query.sessionId}`;
      }

      if (query.propertyId) {
        querySql = sql`${querySql} AND property_id = ${query.propertyId}`;
      }

      if (query.service) {
        querySql = sql`${querySql} AND service = ${query.service}`;
      }

      if (query.status) {
        querySql = sql`${querySql} AND status = ${query.status}`;
      }

      if (query.correlationId) {
        querySql = sql`${querySql} AND correlation_id = ${query.correlationId}`;
      }

      querySql = sql`${querySql} ORDER BY timestamp DESC`;

      if (query.limit) {
        querySql = sql`${querySql} LIMIT ${query.limit}`;
      }

      if (query.offset) {
        querySql = sql`${querySql} OFFSET ${query.offset}`;
      }

      const results = await db.execute(querySql);
      return this.mapDatabaseResults(results);
    } catch (error) {
      logger.error(
        'Failed to query audit events',
        'AUDIT_LOGGER',
        { query },
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Get audit metrics
   */
  async getMetrics(startDate?: Date, endDate?: Date): Promise<AuditMetrics> {
    try {
      await this.flushEvents();

      let whereClause = '';
      const params: any[] = [];

      if (startDate || endDate) {
        whereClause = 'WHERE ';
        const conditions: string[] = [];

        if (startDate) {
          conditions.push('timestamp >= ?');
          params.push(startDate.toISOString());
        }

        if (endDate) {
          conditions.push('timestamp <= ?');
          params.push(endDate.toISOString());
        }

        whereClause += conditions.join(' AND ');
      }

      // Get total events
      let totalQuery: SQL = sql`SELECT COUNT(*) as total FROM audit_events`;
      if (startDate || endDate) {
        let conditions: SQL[] = [];
        if (startDate) conditions.push(sql`timestamp >= ${startDate.toISOString()}`);
        if (endDate) conditions.push(sql`timestamp <= ${endDate.toISOString()}`);
        totalQuery = sql`${totalQuery} WHERE ${sql.join(conditions, sql` AND `)}`;
      }
      const totalResult = await db.execute(totalQuery);
      const totalEvents = Number(totalResult[0]?.total || 0);

      // Get events by type
      let typeQuery: SQL = sql`SELECT event_type, COUNT(*) as count FROM audit_events`;
      if (startDate || endDate) {
        let conditions: SQL[] = [];
        if (startDate) conditions.push(sql`timestamp >= ${startDate.toISOString()}`);
        if (endDate) conditions.push(sql`timestamp <= ${endDate.toISOString()}`);
        typeQuery = sql`${typeQuery} WHERE ${sql.join(conditions, sql` AND `)}`;
      }
      typeQuery = sql`${typeQuery} GROUP BY event_type`;
      const typeResults = await db.execute(typeQuery);
      const eventsByType = this.mapCountResults(typeResults);

      // Get events by category
      let categoryQuery: SQL = sql`SELECT category, COUNT(*) as count FROM audit_events`;
      if (startDate || endDate) {
        let conditions: SQL[] = [];
        if (startDate) conditions.push(sql`timestamp >= ${startDate.toISOString()}`);
        if (endDate) conditions.push(sql`timestamp <= ${endDate.toISOString()}`);
        categoryQuery = sql`${categoryQuery} WHERE ${sql.join(conditions, sql` AND `)}`;
      }
      categoryQuery = sql`${categoryQuery} GROUP BY category`;
      const categoryResults = await db.execute(categoryQuery);
      const eventsByCategory = this.mapCountResults(categoryResults);

      // Get events by severity
      let severityQuery: SQL = sql`SELECT severity, COUNT(*) as count FROM audit_events`;
      if (startDate || endDate) {
        let conditions: SQL[] = [];
        if (startDate) conditions.push(sql`timestamp >= ${startDate.toISOString()}`);
        if (endDate) conditions.push(sql`timestamp <= ${endDate.toISOString()}`);
        severityQuery = sql`${severityQuery} WHERE ${sql.join(conditions, sql` AND `)}`;
      }
      severityQuery = sql`${severityQuery} GROUP BY severity`;
      const severityResults = await db.execute(severityQuery);
      const eventsBySeverity = this.mapCountResults(severityResults);

      // Get average duration
      let durationQuery: SQL = sql`SELECT AVG(duration) as avg_duration FROM audit_events`;
      let durationConditions: SQL[] = [sql`duration IS NOT NULL`];
      if (startDate) durationConditions.push(sql`timestamp >= ${startDate.toISOString()}`);
      if (endDate) durationConditions.push(sql`timestamp <= ${endDate.toISOString()}`);
      durationQuery = sql`${durationQuery} WHERE ${sql.join(durationConditions, sql` AND `)}`;
      const durationResult = await db.execute(durationQuery);
      const averageDuration = Number(durationResult[0]?.avg_duration || 0);

      // Get error rate
      let errorQuery: SQL = sql`SELECT COUNT(*) as error_count FROM audit_events`;
      let errorConditions: SQL[] = [sql`status = 'failed'`];
      if (startDate) errorConditions.push(sql`timestamp >= ${startDate.toISOString()}`);
      if (endDate) errorConditions.push(sql`timestamp <= ${endDate.toISOString()}`);
      errorQuery = sql`${errorQuery} WHERE ${sql.join(errorConditions, sql` AND `)}`;
      const errorResult = await db.execute(errorQuery);
      const errorCount = Number(errorResult[0]?.error_count || 0);
      const errorRate = totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0;

      // Get top errors
      let topErrorQuery: SQL = sql`SELECT error_code, COUNT(*) as count FROM audit_events`;
      let topErrorConditions: SQL[] = [sql`error_code IS NOT NULL`];
      if (startDate) topErrorConditions.push(sql`timestamp >= ${startDate.toISOString()}`);
      if (endDate) topErrorConditions.push(sql`timestamp <= ${endDate.toISOString()}`);
      topErrorQuery = sql`${topErrorQuery} WHERE ${sql.join(topErrorConditions, sql` AND `)} GROUP BY error_code ORDER BY count DESC LIMIT 10`;
      const topErrorResults = await db.execute(topErrorQuery);
      const topErrors = topErrorResults.map((row: any) => ({
        error: row.error_code,
        count: Number(row.count)
      }));

      return {
        totalEvents,
        eventsByType,
        eventsByCategory,
        eventsBySeverity,
        averageDuration,
        errorRate,
        topErrors
      };

    } catch (error) {
      logger.error(
        'Failed to get audit metrics',
        'AUDIT_LOGGER',
        { startDate, endDate },
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Flush buffered events to database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await this.batchInsertEvents(eventsToFlush);
      
      logger.debug(
        `Flushed ${eventsToFlush.length} audit events to database`,
        'AUDIT_LOGGER'
      );
    } catch (error) {
      // Put events back in buffer on failure
      this.eventBuffer.unshift(...eventsToFlush);
      
      logger.error(
        'Failed to flush audit events to database',
        'AUDIT_LOGGER',
        { eventCount: eventsToFlush.length },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Batch insert events to database
   */
  private async batchInsertEvents(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return;

    const queryValues = events.map(event => sql`(
      ${event.id}, ${event.correlationId}, ${event.timestamp.toISOString()}, ${event.eventType}, ${event.category}, ${event.severity},
      ${event.userId || null}, ${event.sessionId || null}, ${event.propertyId || null}, ${event.service}, ${event.operation}, ${event.status},
      ${event.duration || null}, ${JSON.stringify(event.details)}, ${event.error?.code || null}, ${event.error?.message || null}, ${event.error?.stack || null}, ${JSON.stringify(event.metadata)}
    )`);

    const insertQuery = sql`
      INSERT INTO audit_events (
        id, correlation_id, timestamp, event_type, category, severity,
        user_id, session_id, property_id, service, operation, status,
        duration, details, error_code, error_message, error_stack, metadata
      ) VALUES ${sql.join(queryValues, sql`, `)}
    `;

    await db.execute(insertQuery);
  }

  /**
   * Start batch processor
   */
  private startBatchProcessor(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushEvents();
    }, this.flushInterval);
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
      await this.flushEvents();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('beforeExit', shutdown);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Extract metadata from request context
   */
  private extractMetadata(): Record<string, any> {
    // In a real implementation, this would extract from request context
    return {
      version: process.env.APP_VERSION || '1.0.0',
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Map database results to audit events
   */
  private mapDatabaseResults(results: any[]): AuditEvent[] {
    return results.map(row => ({
      id: row.id,
      correlationId: row.correlation_id,
      timestamp: new Date(row.timestamp),
      eventType: row.event_type,
      category: row.category,
      severity: row.severity,
      userId: row.user_id,
      sessionId: row.session_id,
      propertyId: row.property_id,
      service: row.service,
      operation: row.operation,
      status: row.status,
      duration: row.duration,
      details: JSON.parse(row.details || '{}'),
      error: row.error_code ? {
        code: row.error_code,
        message: row.error_message,
        stack: row.error_stack
      } : undefined,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  }

  /**
   * Map count results to object
   */
  private mapCountResults(results: any[]): Record<string, number> {
    const mapped: Record<string, number> = {};
    for (const row of results) {
      const key = Object.keys(row).find(k => k !== 'count');
      if (key) {
        mapped[row[key]] = row.count;
      }
    }
    return mapped;
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();