/**
 * Audit Logger — Kenya Land Verification System
 *
 * CANONICAL SOURCE: All audit logging for the land-verification domain flows through
 * this class. Security, error-handling, and audit sub-modules re-export thin wrappers.
 *
 * Design decisions:
 *  - Severity uses a risk scale (LOW → CRITICAL), not a log-level scale.
 *  - Events are buffered and flushed in batches; CRITICAL events also log immediately.
 *  - Flush failures re-queue events at the tail (preserving order) and do not throw.
 *  - All public-facing types use `unknown` rather than `any`.
 */

import { sql, SQL } from 'drizzle-orm';
import { generateCorrelationId } from '../../shared/types/errors';
import { db } from '../infrastructure/database/connection/index';
import { logger } from '../infrastructure/monitoring/logger';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum AuditEventType {
  // Verification lifecycle
  VERIFICATION_STARTED    = 'verification_started',
  VERIFICATION_COMPLETED  = 'verification_completed',
  VERIFICATION_FAILED     = 'verification_failed',
  OPERATION_STARTED       = 'operation_started',
  OPERATION_SUCCEEDED     = 'operation_succeeded',
  OPERATION_FAILED        = 'operation_failed',
  LAYER_EXECUTED          = 'layer_executed',
  // Integrations
  GOVERNMENT_API_CALL     = 'government_api_call',
  // Domain actions
  EXPERT_ASSIGNED         = 'expert_assigned',
  RISK_ASSESSMENT         = 'risk_assessment',
  DOCUMENT_PROCESSED      = 'document_processed',
  COMMUNITY_FEEDBACK      = 'community_feedback',
  PHYSICAL_VERIFICATION   = 'physical_verification',
  PROPERTY_ACTION         = 'property_action',
  // Session & access
  SESSION_ACTION          = 'session_action',
  DATA_ACCESS             = 'data_access',
  // Reports
  REPORT_GENERATED        = 'report_generated',
  // System & security
  SECURITY_EVENT          = 'security_event',
  SYSTEM_EVENT            = 'system_event',
  SYSTEM_ERROR            = 'system_error',
  MONITORING_ALERT        = 'monitoring_alert',
  CONFIGURATION_CHANGE    = 'configuration_change',
}

export enum AuditCategory {
  VERIFICATION  = 'verification',
  INTEGRATION   = 'integration',
  SECURITY      = 'security',
  USER_ACTION   = 'user_action',
  DATA          = 'data',
  MONITORING    = 'monitoring',
  SYSTEM        = 'system',
}

/** Risk-oriented severity, not a log-level scale. */
export enum AuditSeverity {
  LOW      = 'low',
  MEDIUM   = 'medium',
  HIGH     = 'high',
  CRITICAL = 'critical',
}

export type AuditEventStatus = 'started' | 'completed' | 'failed' | 'cancelled';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AuditError {
  readonly code: string;
  readonly message: string;
  readonly stack?: string;
}

export interface AuditEvent {
  readonly id: string;
  readonly correlationId: string;
  readonly timestamp: Date;
  readonly eventType: AuditEventType;
  readonly category: AuditCategory;
  readonly severity: AuditSeverity;
  readonly status: AuditEventStatus;
  readonly service: string;
  readonly operation: string;
  // Optional context
  readonly userId?: string;
  readonly sessionId?: string;
  readonly propertyId?: string;
  readonly duration?: number;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  // Payload
  readonly details: Record<string, unknown>;
  readonly error?: AuditError;
  readonly metadata: Record<string, unknown>;
}

export interface AuditQuery {
  readonly correlationId?: string;
  readonly eventTypes?: AuditEventType[];
  readonly categories?: AuditCategory[];
  readonly severities?: AuditSeverity[];
  readonly status?: AuditEventStatus;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly propertyId?: string;
  readonly service?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

export interface AuditMetrics {
  readonly totalEvents: number;
  readonly eventsByType: Record<string, number>;
  readonly eventsByCategory: Record<string, number>;
  readonly eventsBySeverity: Record<string, number>;
  readonly averageDuration: number;
  readonly errorRate: number;
  readonly topErrors: ReadonlyArray<{ error: string; count: number }>;
}

// ─── AuditLogger ──────────────────────────────────────────────────────────────

export class AuditLogger {
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;
  private buffer: AuditEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(options: { batchSize?: number; flushIntervalMs?: number } = {}) {
    this.batchSize     = options.batchSize     ?? 100;
    this.flushIntervalMs = options.flushIntervalMs ?? 5_000;
    this.startBatchProcessor();
    this.registerShutdownHooks();
  }

  // ── Core log method ─────────────────────────────────────────────────────────

  async logEvent(
    event: Omit<AuditEvent, 'id' | 'timestamp' | 'correlationId'> & { correlationId?: string },
  ): Promise<void> {
    const full: AuditEvent = {
      ...event,
      id:            this.generateEventId(),
      correlationId: event.correlationId ?? generateCorrelationId(),
      timestamp:     new Date(),
    };

    // Immediate console output for CRITICAL events so they are never silently lost.
    if (full.severity === AuditSeverity.CRITICAL) {
      logger.error(`[AUDIT:CRITICAL] ${full.eventType}`, 'AUDIT_LOGGER', full);
    }

    this.buffer.push(full);

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  // ── Domain convenience methods ───────────────────────────────────────────────

  async logVerificationStarted(
    sessionId: string,
    propertyId: string,
    userId: string,
    verificationLayers: string[],
    details: Record<string, unknown> = {},
  ): Promise<void> {
    await this.logEvent({
      eventType:  AuditEventType.VERIFICATION_STARTED,
      category:   AuditCategory.VERIFICATION,
      severity:   AuditSeverity.MEDIUM,
      status:     'started',
      service:    'land-verification',
      operation:  'start_verification',
      userId, sessionId, propertyId,
      details:    { verificationLayers, ...details },
      metadata:   this.extractMetadata(),
    });
  }

  async logVerificationCompleted(
    sessionId: string,
    propertyId: string,
    userId: string,
    duration: number,
    results: Record<string, unknown>,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    await this.logEvent({
      eventType:  AuditEventType.VERIFICATION_COMPLETED,
      category:   AuditCategory.VERIFICATION,
      severity:   AuditSeverity.MEDIUM,
      status:     'completed',
      service:    'land-verification',
      operation:  'complete_verification',
      userId, sessionId, propertyId, duration,
      details:    { results, ...details },
      metadata:   this.extractMetadata(),
    });
  }

  async logVerificationFailed(
    sessionId: string,
    propertyId: string,
    userId: string,
    duration: number,
    error: Error,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    await this.logEvent({
      eventType:  AuditEventType.VERIFICATION_FAILED,
      category:   AuditCategory.VERIFICATION,
      severity:   AuditSeverity.HIGH,
      status:     'failed',
      service:    'land-verification',
      operation:  'verification_failure',
      userId, sessionId, propertyId, duration,
      details,
      error:      this.serializeError(error),
      metadata:   this.extractMetadata(),
    });
  }

  async logGovernmentApiCall(
    service: string,
    operation: string,
    status: 'completed' | 'failed',
    duration: number,
    sessionId?: string,
    error?: Error,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    await this.logEvent({
      eventType:  AuditEventType.GOVERNMENT_API_CALL,
      category:   AuditCategory.INTEGRATION,
      severity:   status === 'failed' ? AuditSeverity.HIGH : AuditSeverity.LOW,
      service, operation, status, duration, sessionId,
      details,
      error:      error ? this.serializeError(error) : undefined,
      metadata:   this.extractMetadata(),
    });
  }

  async logSecurityEvent(
    userId: string,
    operation: string,
    details: Record<string, unknown> = {},
    options: { ip?: string; userAgent?: string; success?: boolean; message?: string } = {},
  ): Promise<void> {
    const { ip, userAgent, success = true, message } = options;
    await this.logEvent({
      eventType:   AuditEventType.SECURITY_EVENT,
      category:    AuditCategory.SECURITY,
      severity:    success ? AuditSeverity.MEDIUM : AuditSeverity.HIGH,
      status:      success ? 'completed' : 'failed',
      service:     'security',
      operation, userId, ipAddress: ip, userAgent,
      details:     { ...details, message },
      metadata:    this.extractMetadata(),
    });
  }

  async logAccessEvent(
    userId: string,
    resourceType: string,
    resourceId: string,
    operation: string,
    options: { success?: boolean; errorMessage?: string; ip?: string; userAgent?: string } = {},
  ): Promise<void> {
    const { success = true, errorMessage, ip, userAgent } = options;
    await this.logEvent({
      eventType:   AuditEventType.DATA_ACCESS,
      category:    AuditCategory.SECURITY,
      severity:    success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      status:      success ? 'completed' : 'failed',
      service:     'access-control',
      operation:   `${resourceType}_${operation}`,
      userId,
      propertyId:  resourceType === 'property' ? resourceId : undefined,
      ipAddress:   ip,
      userAgent,
      details:     { resourceType, resourceId, errorMessage },
      metadata:    this.extractMetadata(),
    });
  }

  async logSessionEvent(
    userId: string,
    sessionId: string,
    operation: string,
    details: Record<string, unknown> = {},
    options: { success?: boolean; errorMessage?: string } = {},
  ): Promise<void> {
    const { success = true, errorMessage } = options;
    await this.logEvent({
      eventType:  AuditEventType.SESSION_ACTION,
      category:   AuditCategory.USER_ACTION,
      severity:   AuditSeverity.LOW,
      status:     success ? 'completed' : 'failed',
      service:    'session-manager',
      operation, userId, sessionId,
      details:    { ...details, errorMessage },
      metadata:   this.extractMetadata(),
    });
  }

  async logPropertyEvent(
    userId: string,
    propertyId: string,
    operation: string,
    details: Record<string, unknown> = {},
    options: { success?: boolean; errorMessage?: string; sessionId?: string } = {},
  ): Promise<void> {
    const { success = true, errorMessage, sessionId } = options;
    await this.logEvent({
      eventType:  AuditEventType.PROPERTY_ACTION,
      category:   AuditCategory.VERIFICATION,
      severity:   AuditSeverity.LOW,
      status:     success ? 'completed' : 'failed',
      service:    'property-service',
      operation, userId, propertyId, sessionId,
      details:    { ...details, errorMessage },
      metadata:   this.extractMetadata(),
    });
  }

  async logFeedbackEvent(
    userId: string,
    sessionId: string,
    operation: string,
    details: Record<string, unknown> = {},
    options: { success?: boolean; errorMessage?: string } = {},
  ): Promise<void> {
    const { success = true, errorMessage } = options;
    await this.logEvent({
      eventType:  AuditEventType.COMMUNITY_FEEDBACK,
      category:   AuditCategory.VERIFICATION,
      severity:   AuditSeverity.LOW,
      status:     success ? 'completed' : 'failed',
      service:    'community-intelligence',
      operation, userId, sessionId,
      details:    { ...details, errorMessage },
      metadata:   this.extractMetadata(),
    });
  }

  async logReportEvent(
    userId: string,
    sessionId: string,
    operation: string,
    details: Record<string, unknown> = {},
    options: { success?: boolean; errorMessage?: string } = {},
  ): Promise<void> {
    const { success = true, errorMessage } = options;
    await this.logEvent({
      eventType:  AuditEventType.REPORT_GENERATED,
      category:   AuditCategory.VERIFICATION,
      severity:   AuditSeverity.MEDIUM,
      status:     success ? 'completed' : 'failed',
      service:    'reporting-service',
      operation, userId, sessionId,
      details:    { ...details, errorMessage },
      metadata:   this.extractMetadata(),
    });
  }

  async logSystemEvent(
    operation: string,
    details: Record<string, unknown> = {},
    options: { success?: boolean; errorMessage?: string } = {},
  ): Promise<void> {
    const { success = true, errorMessage } = options;
    await this.logEvent({
      eventType:  success ? AuditEventType.SYSTEM_EVENT : AuditEventType.SYSTEM_ERROR,
      category:   AuditCategory.SYSTEM,
      severity:   success ? AuditSeverity.LOW : AuditSeverity.HIGH,
      status:     success ? 'completed' : 'failed',
      service:    'system',
      operation,
      details:    { ...details, errorMessage },
      metadata:   this.extractMetadata(),
    });
  }

  async logSystemError(
    service: string,
    operation: string,
    error: Error,
    options: { severity?: AuditSeverity; sessionId?: string; details?: Record<string, unknown> } = {},
  ): Promise<void> {
    const { severity = AuditSeverity.HIGH, sessionId, details = {} } = options;
    await this.logEvent({
      eventType:  AuditEventType.SYSTEM_ERROR,
      category:   AuditCategory.SYSTEM,
      severity, status: 'failed',
      service, operation, sessionId,
      details,
      error:      this.serializeError(error),
      metadata:   this.extractMetadata(),
    });
  }

  async logDataAccess(
    operation: string,
    dataType: string,
    options: { userId?: string; propertyId?: string; details?: Record<string, unknown> } = {},
  ): Promise<void> {
    const { userId, propertyId, details = {} } = options;
    await this.logEvent({
      eventType:  AuditEventType.DATA_ACCESS,
      category:   AuditCategory.DATA,
      severity:   AuditSeverity.LOW,
      status:     'completed',
      service:    'data-access',
      operation, userId, propertyId,
      details:    { dataType, ...details },
      metadata:   this.extractMetadata(),
    });
  }

  // ── Query & Metrics ──────────────────────────────────────────────────────────

  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    try {
      await this.flush();

      let q: SQL = sql`SELECT * FROM audit_events WHERE 1=1`;

      if (query.correlationId) q = sql`${q} AND correlation_id = ${query.correlationId}`;
      if (query.userId)        q = sql`${q} AND user_id        = ${query.userId}`;
      if (query.sessionId)     q = sql`${q} AND session_id     = ${query.sessionId}`;
      if (query.propertyId)    q = sql`${q} AND property_id    = ${query.propertyId}`;
      if (query.service)       q = sql`${q} AND service        = ${query.service}`;
      if (query.status)        q = sql`${q} AND status         = ${query.status}`;
      if (query.startDate)     q = sql`${q} AND timestamp >= ${query.startDate.toISOString()}`;
      if (query.endDate)       q = sql`${q} AND timestamp <= ${query.endDate.toISOString()}`;

      if (query.eventTypes?.length) {
        q = sql`${q} AND event_type IN (${sql.join(query.eventTypes.map(t => sql`${t}`), sql`, `)})`;
      }
      if (query.categories?.length) {
        q = sql`${q} AND category IN (${sql.join(query.categories.map(c => sql`${c}`), sql`, `)})`;
      }
      if (query.severities?.length) {
        q = sql`${q} AND severity IN (${sql.join(query.severities.map(s => sql`${s}`), sql`, `)})`;
      }

      q = sql`${q} ORDER BY timestamp DESC`;
      if (query.limit)  q = sql`${q} LIMIT  ${query.limit}`;
      if (query.offset) q = sql`${q} OFFSET ${query.offset}`;

      const rows = await db.execute(q);
      return this.mapRows(rows as Record<string, unknown>[]);
    } catch (error) {
      logger.error('Failed to query audit events', 'AUDIT_LOGGER', { query },
        error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  async getMetrics(startDate?: Date, endDate?: Date): Promise<AuditMetrics> {
    try {
      await this.flush();

      // Build a reusable date-range WHERE fragment.
      const dateConditions: SQL[] = [];
      if (startDate) dateConditions.push(sql`timestamp >= ${startDate.toISOString()}`);
      if (endDate)   dateConditions.push(sql`timestamp <= ${endDate.toISOString()}`);

      const withDateFilter = (base: SQL, extra?: SQL): SQL => {
        const all = extra ? [...dateConditions, extra] : [...dateConditions];
        return all.length
          ? sql`${base} WHERE ${sql.join(all, sql` AND `)}`
          : base;
      };

      const [
        totalResult,
        typeResults,
        categoryResults,
        severityResults,
        durationResult,
        errorResult,
        topErrorResults,
      ] = await Promise.all([
        db.execute(withDateFilter(sql`SELECT COUNT(*) AS total FROM audit_events`)),
        db.execute(sql`${withDateFilter(sql`SELECT event_type, COUNT(*) AS count FROM audit_events`)} GROUP BY event_type`),
        db.execute(sql`${withDateFilter(sql`SELECT category, COUNT(*) AS count FROM audit_events`)} GROUP BY category`),
        db.execute(sql`${withDateFilter(sql`SELECT severity, COUNT(*) AS count FROM audit_events`)} GROUP BY severity`),
        db.execute(withDateFilter(sql`SELECT AVG(duration) AS avg_duration FROM audit_events`, sql`duration IS NOT NULL`)),
        db.execute(withDateFilter(sql`SELECT COUNT(*) AS error_count FROM audit_events`, sql`status = 'failed'`)),
        db.execute(sql`${withDateFilter(sql`SELECT error_code, COUNT(*) AS count FROM audit_events`, sql`error_code IS NOT NULL`)} GROUP BY error_code ORDER BY count DESC LIMIT 10`),
      ]);

      const totalEvents   = Number((totalResult[0] as Record<string, unknown>)?.total    ?? 0);
      const errorCount    = Number((errorResult[0]  as Record<string, unknown>)?.error_count ?? 0);
      const averageDuration = Number((durationResult[0] as Record<string, unknown>)?.avg_duration ?? 0);

      return {
        totalEvents,
        eventsByType:     this.mapCountRows(typeResults     as Record<string, unknown>[], 'event_type'),
        eventsByCategory: this.mapCountRows(categoryResults as Record<string, unknown>[], 'category'),
        eventsBySeverity: this.mapCountRows(severityResults as Record<string, unknown>[], 'severity'),
        averageDuration,
        errorRate: totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0,
        topErrors: (topErrorResults as Record<string, unknown>[]).map(row => ({
          error: String(row.error_code),
          count: Number(row.count),
        })),
      };
    } catch (error) {
      logger.error('Failed to get audit metrics', 'AUDIT_LOGGER', { startDate, endDate },
        error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // ── Flush & lifecycle ────────────────────────────────────────────────────────

  /** Flush the in-memory buffer to the database. Safe to call manually. */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      await this.batchInsert(batch);
      logger.debug(`Flushed ${batch.length} audit events`, 'AUDIT_LOGGER');
    } catch (error) {
      // Re-queue at the tail to preserve chronological order.
      this.buffer.push(...batch);
      logger.error('Failed to flush audit events', 'AUDIT_LOGGER',
        { eventCount: batch.length },
        error instanceof Error ? error : new Error(String(error)));
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    await this.flush();
    logger.info('Audit logger shut down', 'AUDIT_LOGGER');
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async batchInsert(events: AuditEvent[]): Promise<void> {
    if (events.length === 0) return;

    const values = events.map(e => sql`(
      ${e.id}, ${e.correlationId}, ${e.timestamp.toISOString()},
      ${e.eventType}, ${e.category}, ${e.severity},
      ${e.userId ?? null}, ${e.sessionId ?? null}, ${e.propertyId ?? null},
      ${e.service}, ${e.operation}, ${e.status},
      ${e.duration ?? null}, ${e.ipAddress ?? null}, ${e.userAgent ?? null},
      ${JSON.stringify(e.details)},
      ${e.error?.code ?? null}, ${e.error?.message ?? null}, ${e.error?.stack ?? null},
      ${JSON.stringify(e.metadata)}
    )`);

    await db.execute(sql`
      INSERT INTO audit_events (
        id, correlation_id, timestamp,
        event_type, category, severity,
        user_id, session_id, property_id,
        service, operation, status,
        duration, ip_address, user_agent,
        details,
        error_code, error_message, error_stack,
        metadata
      ) VALUES ${sql.join(values, sql`, `)}
    `);
  }

  private startBatchProcessor(): void {
    this.flushTimer = setInterval(() => { void this.flush(); }, this.flushIntervalMs);
  }

  private registerShutdownHooks(): void {
    const handler = () => { void this.shutdown(); };
    process.on('SIGINT',     handler);
    process.on('SIGTERM',    handler);
    process.on('beforeExit', handler);
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private serializeError(error: Error): AuditError {
    return {
      code:    (error as Error & { code?: string }).code ?? 'UNKNOWN_ERROR',
      message: error.message,
      stack:   error.stack,
    };
  }

  private extractMetadata(): Record<string, unknown> {
    return {
      version:     process.env.APP_VERSION ?? '1.0.0',
      nodeVersion: process.version,
      timestamp:   new Date().toISOString(),
    };
  }

  /** Map DB rows to strongly-typed AuditEvent objects. */
  private mapRows(rows: Record<string, unknown>[]): AuditEvent[] {
    return rows.map(r => ({
      id:            String(r.id),
      correlationId: String(r.correlation_id),
      timestamp:     new Date(String(r.timestamp)),
      eventType:     r.event_type     as AuditEventType,
      category:      r.category       as AuditCategory,
      severity:      r.severity       as AuditSeverity,
      status:        r.status         as AuditEventStatus,
      service:       String(r.service),
      operation:     String(r.operation),
      userId:        r.user_id     ? String(r.user_id)     : undefined,
      sessionId:     r.session_id  ? String(r.session_id)  : undefined,
      propertyId:    r.property_id ? String(r.property_id) : undefined,
      duration:      r.duration    ? Number(r.duration)    : undefined,
      ipAddress:     r.ip_address  ? String(r.ip_address)  : undefined,
      userAgent:     r.user_agent  ? String(r.user_agent)  : undefined,
      details:       JSON.parse(String(r.details  ?? '{}')),
      error: r.error_code ? {
        code:    String(r.error_code),
        message: String(r.error_message),
        stack:   r.error_stack ? String(r.error_stack) : undefined,
      } : undefined,
      metadata: JSON.parse(String(r.metadata ?? '{}')),
    }));
  }

  /** Map `SELECT key, COUNT(*) AS count` rows into a plain object. */
  private mapCountRows(
    rows: Record<string, unknown>[],
    keyColumn: string,
  ): Record<string, number> {
    return Object.fromEntries(
      rows
        .filter(r => r[keyColumn] != null)
        .map(r => [String(r[keyColumn]), Number(r.count)]),
    );
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const auditLogger = new AuditLogger();