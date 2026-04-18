/**
 * Audit Log Service
 * Security event logging and audit trail management
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

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

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  eventType: AuditEventType;
  action: string;
  resource?: string;
  resourceId?: string;
  details: Record<string, unknown>;
  userAgent: string;
  success: boolean;
  riskLevel: RiskLevel;
}

export interface AuditFilter {
  userId?: string;
  eventType?: AuditEventType;
  /** Substring match against action */
  action?: string;
  resource?: string;
  success?: boolean;
  riskLevel?: RiskLevel;
  dateFrom?: Date;
  dateTo?: Date;
  /** Maximum number of results (applied after sort) */
  limit?: number;
}

export interface LogEventOptions {
  resource?: string;
  resourceId?: string;
  success?: boolean;
  riskLevel?: RiskLevel;
  userId?: string;
}

export interface SecuritySummary {
  totalEvents: number;
  failedLogins: number;
  unauthorizedAccess: number;
  highRiskEvents: number;
  recentEvents: AuditEvent[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a short random string using the Web Crypto API where available. */
function randomSuffix(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = crypto.getRandomValues(new Uint8Array(5));
    return Array.from(bytes, b => b.toString(36)).join('');
  }
  return Math.random().toString(36).slice(2, 9);
}

/** Escape a CSV cell value, guarding against CSV injection. */
function escapeCsvCell(value: string): string {
  // Strip leading =, +, -, @ characters that spreadsheets interpret as formulas.
  const sanitised = value.replace(/^[=+\-@\t\r]+/, '');
  // Wrap in quotes and escape inner quotes.
  return `"${sanitised.replace(/"/g, '""')}"`;
}

/** Safely check if we're running in a browser context. */
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// ─── Service ──────────────────────────────────────────────────────────────────

class AuditLogService {
  // ── Singleton ──────────────────────────────────────────────────────────────

  private static instance: AuditLogService;

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  // ── State ──────────────────────────────────────────────────────────────────

  private readonly auditEvents: AuditEvent[] = [];
  private readonly maxEvents = 10_000;
  private readonly sessionId: string;
  private readonly sessionStart = Date.now();

  /** userId resolver — can be overridden via {@link setUserResolver}. */
  private userResolver: (() => string | undefined) | null = null;

  /** Server endpoint — set via {@link configure}. */
  private serverEndpoint: string | null = null;

  /** Pending server flush (for batching). */
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly pendingServerEvents: AuditEvent[] = [];
  private readonly FLUSH_INTERVAL_MS = 2_000;
  private readonly MAX_BATCH_SIZE = 50;

  // ── Constructor ────────────────────────────────────────────────────────────

  /** Use {@link AuditLogService.getInstance} instead of constructing directly. */
  private constructor() {
    this.sessionId = `session_${Date.now()}_${randomSuffix()}`;
    if (isBrowser) {
      this.setupEventListeners();
    }
  }

  // ── Configuration ──────────────────────────────────────────────────────────

  /**
   * Configure runtime options.
   * Call this once during app initialisation.
   */
  configure(options: { serverEndpoint?: string }): void {
    if (options.serverEndpoint) {
      this.serverEndpoint = options.serverEndpoint;
    }
  }

  /**
   * Provide a function that resolves the current user's ID.
   * Injecting this dependency keeps the service decoupled from your auth layer.
   *
   * @example
   * auditLogService.setUserResolver(() => authStore.currentUser?.id);
   */
  setUserResolver(resolver: () => string | undefined): void {
    this.userResolver = resolver;
  }

  // ── Core Logging ───────────────────────────────────────────────────────────

  /**
   * Record an audit event and return its generated ID.
   */
  logEvent(
    eventType: AuditEventType,
    action: string,
    details: Record<string, unknown> = {},
    options: LogEventOptions = {}
  ): string {
    const success = options.success !== false;

    const event: AuditEvent = {
      id: `audit_${Date.now()}_${randomSuffix()}`,
      timestamp: new Date(),
      userId: options.userId ?? this.userResolver?.(),
      sessionId: this.sessionId,
      eventType,
      action,
      resource: options.resource,
      resourceId: options.resourceId,
      details: isBrowser
        ? { ...details, url: window.location.href, referrer: document.referrer }
        : details,
      userAgent: isBrowser ? navigator.userAgent : 'server',
      success,
      riskLevel:
        options.riskLevel ??
        this.calculateRiskLevel(eventType, action, success),
    };

    this.storeEvent(event);
    this.scheduleServerFlush(event);

    if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
      console.warn('[AUDIT] High-risk event detected:', event);
    }

    return event.id;
  }

  // ── Convenience Methods ────────────────────────────────────────────────────

  logAuthentication(
    action: string,
    success: boolean,
    details: Record<string, unknown> = {}
  ): string {
    return this.logEvent('authentication', action, details, {
      success,
      riskLevel: success ? 'low' : 'medium',
    });
  }

  logAuthorization(
    action: string,
    resource: string,
    success: boolean,
    details: Record<string, unknown> = {}
  ): string {
    return this.logEvent('authorization', action, details, {
      resource,
      success,
      riskLevel: success ? 'low' : 'high',
    });
  }

  logDataAccess(
    resource: string,
    resourceId: string,
    action = 'read',
    details: Record<string, unknown> = {}
  ): string {
    return this.logEvent('data_access', action, details, {
      resource,
      resourceId,
      riskLevel: 'low',
    });
  }

  logDataModification(
    resource: string,
    resourceId: string,
    action: string,
    details: Record<string, unknown> = {}
  ): string {
    return this.logEvent('data_modification', action, details, {
      resource,
      resourceId,
      riskLevel: 'medium',
    });
  }

  logSecurityEvent(
    action: string,
    details: Record<string, unknown> = {},
    riskLevel: RiskLevel = 'high'
  ): string {
    return this.logEvent('security_event', action, details, {
      riskLevel,
      success: false,
    });
  }

  logApiRequest(
    endpoint: string,
    method: string,
    success: boolean,
    details: Record<string, unknown> = {}
  ): string {
    return this.logEvent('api_request', `${method.toUpperCase()} ${endpoint}`, details, {
      resource: 'api',
      resourceId: endpoint,
      success,
      riskLevel: 'low',
    });
  }

  logUserAction(action: string, details: Record<string, unknown> = {}): string {
    return this.logEvent('user_action', action, details, { riskLevel: 'low' });
  }

  logError(error: Error, context: string, details: Record<string, unknown> = {}): string {
    return this.logEvent(
      'error',
      context,
      { ...details, errorMessage: error.message, stack: error.stack },
      { success: false, riskLevel: 'medium' }
    );
  }

  // ── Querying ───────────────────────────────────────────────────────────────

  /**
   * Return a filtered, sorted (newest-first) snapshot of recorded events.
   */
  getEvents(filter: AuditFilter = {}): AuditEvent[] {
    let events = this.auditEvents.filter(event => {
      if (filter.userId !== undefined && event.userId !== filter.userId) return false;
      if (filter.eventType !== undefined && event.eventType !== filter.eventType) return false;
      if (filter.action !== undefined && !event.action.includes(filter.action)) return false;
      if (filter.resource !== undefined && event.resource !== filter.resource) return false;
      if (filter.success !== undefined && event.success !== filter.success) return false;
      if (filter.riskLevel !== undefined && event.riskLevel !== filter.riskLevel) return false;
      if (filter.dateFrom !== undefined && event.timestamp < filter.dateFrom) return false;
      if (filter.dateTo !== undefined && event.timestamp > filter.dateTo) return false;
      return true;
    });

    // Newest first
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter.limit !== undefined) {
      events = events.slice(0, filter.limit);
    }

    return events;
  }

  /**
   * Return a high-level security summary for the current session.
   */
  getSecuritySummary(): SecuritySummary {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1_000);

    return {
      totalEvents: this.auditEvents.length,
      failedLogins: this.auditEvents.filter(
        e => e.eventType === 'authentication' && !e.success
      ).length,
      unauthorizedAccess: this.auditEvents.filter(
        e => e.eventType === 'authorization' && !e.success
      ).length,
      highRiskEvents: this.auditEvents.filter(
        e => e.riskLevel === 'high' || e.riskLevel === 'critical'
      ).length,
      recentEvents: this.auditEvents
        .filter(e => e.timestamp >= last24h)
        .slice(0, 10),
    };
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  /**
   * Export filtered events as a CSV string.
   * Cell values are sanitised against CSV injection attacks.
   */
  exportAuditLog(filter: AuditFilter = {}): string {
    const HEADERS = [
      'Timestamp', 'Event ID', 'User ID', 'Session ID',
      'Event Type', 'Action', 'Resource', 'Resource ID',
      'Success', 'Risk Level', 'Details',
    ];

    const rows = this.getEvents(filter).map(event =>
      [
        event.timestamp.toISOString(),
        event.id,
        event.userId ?? '',
        event.sessionId,
        event.eventType,
        event.action,
        event.resource ?? '',
        event.resourceId ?? '',
        String(event.success),
        event.riskLevel,
        JSON.stringify(event.details),
      ]
        .map(escapeCsvCell)
        .join(',')
    );

    return [HEADERS.join(','), ...rows].join('\n');
  }

  // ── Maintenance ────────────────────────────────────────────────────────────

  /**
   * Purge all in-memory events.
   * The clear action is itself recorded before purging.
   */
  clearAuditLog(): void {
    this.logSecurityEvent('audit_log_cleared', {
      clearedEventCount: this.auditEvents.length,
    }, 'high');
    this.auditEvents.splice(0, this.auditEvents.length);
  }

  /**
   * Remove event listeners and cancel any pending server flush.
   * Call when tearing down the service (e.g. in tests).
   */
  destroy(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (isBrowser) {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private storeEvent(event: AuditEvent): void {
    this.auditEvents.push(event);
    // Evict the oldest events when the buffer is full.
    if (this.auditEvents.length > this.maxEvents) {
      this.auditEvents.splice(0, this.auditEvents.length - this.maxEvents);
    }
  }

  /**
   * Determine risk level from event metadata.
   * Accepts `success` as an explicit parameter rather than reading from details,
   * avoiding a prior bug where `details.success` was checked before it was set.
   */
  private calculateRiskLevel(
    eventType: AuditEventType,
    action: string,
    success: boolean
  ): RiskLevel {
    if (eventType === 'security_event') return 'critical';
    if (eventType === 'authorization' && !success) return 'high';
    if (/\b(admin|privilege|sudo)\b/i.test(action)) return 'high';
    if (eventType === 'authentication' && !success) return 'medium';
    if (eventType === 'data_modification') return 'medium';
    if (eventType === 'error') return 'medium';
    return 'low';
  }

  // ── Server Batching ────────────────────────────────────────────────────────

  private scheduleServerFlush(event: AuditEvent): void {
    if (!this.serverEndpoint) return;

    this.pendingServerEvents.push(event);

    // Flush immediately if the batch is full.
    if (this.pendingServerEvents.length >= this.MAX_BATCH_SIZE) {
      this.flushToServer();
      return;
    }

    // Otherwise debounce.
    if (this.flushTimer === null) {
      this.flushTimer = setTimeout(() => this.flushToServer(), this.FLUSH_INTERVAL_MS);
    }
  }

  private flushToServer(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.pendingServerEvents.length === 0 || !this.serverEndpoint) return;

    const batch = this.pendingServerEvents.splice(0);
    this.sendBatchToServer(batch);
  }

  private async sendBatchToServer(
    events: AuditEvent[],
    attempt = 1
  ): Promise<void> {
    if (!this.serverEndpoint) return;

    try {
      const response = await fetch(this.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Use keepalive so the request survives page unload.
        keepalive: true,
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      const MAX_RETRIES = 3;
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(1_000 * 2 ** (attempt - 1), 8_000); // 1s, 2s, 4s
        setTimeout(() => this.sendBatchToServer(events, attempt + 1), delay);
      } else {
        console.error('[AUDIT] Failed to deliver events after max retries:', error);
      }
    }
  }

  // ── Browser Event Listeners ────────────────────────────────────────────────

  private readonly handleBeforeUnload = (): void => {
    this.logUserAction('page_unload', {
      url: window.location.href,
      sessionDurationMs: Date.now() - this.sessionStart,
    });
    // Flush any pending events synchronously before the page closes.
    this.flushToServer();
  };

  private readonly handleVisibilityChange = (): void => {
    this.logUserAction(document.hidden ? 'page_hidden' : 'page_visible');
  };

  private setupEventListeners(): void {
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const auditLogService = AuditLogService.getInstance();
export default auditLogService;