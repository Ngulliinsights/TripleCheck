import { Request, Response, NextFunction } from 'express';

import { logger } from '../../infrastructure/observability/telemetry';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

import { accessControlService } from './AccessControlService';
import { auditLogger } from './AuditLogger';
import { encryptionService } from './EncryptionService';
import { privacyProtectionService } from './PrivacyProtectionService';

// ─── Domain types ────────────────────────────────────────────────────────────

type Operation    = 'read' | 'write' | 'delete' | 'admin';
type ResourceType = 'session' | 'property' | 'feedback' | 'report' | 'monitoring';
type ProtectionLevel = 'minimal' | 'standard' | 'maximum';
type HealthStatus = 'healthy' | 'warning' | 'critical';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface HealthCheck {
  component: string;
  status: 'pass' | 'fail';
  message: string;
}

interface HealthCheckResult {
  status: HealthStatus;
  checks: HealthCheck[];
}

interface SecureReportResult {
  reportId: string;
  secureUrl: string;
  expiresAt: Date;
}

interface AccessContext {
  userId: string;
  userRole: string;
  operation: Operation;
  resourceType: ResourceType;
  sessionId?: string;
  propertyId?: string;
}

// ─── Rate-limit constants ─────────────────────────────────────────────────────

const RATE_LIMIT_MAX_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS    = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_PRUNE_MS     = 60 * 60 * 1000; // Prune stale entries every hour
const REPORT_EXPIRY_MS        = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Security integration service that provides unified security middleware
 * and utilities for the land verification system.
 */
export class SecurityIntegration {

  /**
   * Class-level store so rate-limit state persists across requests.
   * Keyed by userId (or IP as fallback).
   */
  private static readonly rateLimitStore = new Map<string, RateLimitEntry>();

  /**
   * Prune expired rate-limit entries on a recurring interval to prevent
   * unbounded memory growth in long-running processes.
   */
  private static readonly rateLimitPruner = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of SecurityIntegration.rateLimitStore) {
      if (now > entry.resetTime) {
        SecurityIntegration.rateLimitStore.delete(key);
      }
    }
  }, RATE_LIMIT_PRUNE_MS).unref(); // .unref() so it won't keep the process alive

  // ─── Public middleware factory ──────────────────────────────────────────────

  /**
   * Composes authentication, access-control, audit-logging, and (for mutating
   * operations) rate-limiting middleware for a land-verification endpoint.
   */
  static secureVerificationEndpoint(
    operation: Operation    = 'read',
    resourceType: ResourceType = 'session'
  ): Array<(req: AuthenticatedRequest, res: Response, next: NextFunction) => void> {
    const isMutating = operation === 'write' || operation === 'delete';

    return [
      this.requireAuthentication(),
      this.getAccessControlMiddleware(resourceType, operation),
      this.auditMiddleware(operation, resourceType),
      ...(isMutating ? [this.rateLimitMiddleware()] : []),
    ];
  }

  // ─── Private middleware builders ────────────────────────────────────────────

  private static requireAuthentication() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const userId = req.user?.id?.toString() ?? req.session?.userId?.toString();

      if (!userId) {
        auditLogger.logSecurityEvent(
          'anonymous',
          'authentication_required',
          {
            endpoint:  req.path,
            method:    req.method,
            ip:        req.ip,
            userAgent: req.get('User-Agent'),
            success:   false,
            reason:    'Authentication required',
          }
        );

        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to access this resource',
          },
        });
        return;
      }

      next();
    };
  }

  private static getAccessControlMiddleware(
    resourceType: ResourceType,
    operation: Operation
  ) {
    switch (resourceType) {
      case 'session':
        return accessControlService.requireSessionAccess(operation);
      case 'property':
        return accessControlService.requirePropertyAccess(operation);
      case 'feedback':
        return accessControlService.requireFeedbackAccess(operation);
      case 'report':
        // AccessControlService has no dedicated report accessor; reports are
        // property-scoped resources so property access rules apply.
        return accessControlService.requirePropertyAccess(operation);
      case 'monitoring':
        // Monitoring endpoints are admin/session-scoped.
        return accessControlService.requireSessionAccess(operation);
    }
  }

  /**
   * Intercepts the outgoing response to emit a structured audit event with the
   * actual success/failure outcome, rather than logging a speculative result
   * before the handler has run.
   */
  private static auditMiddleware(operation: Operation, resourceType: ResourceType) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      const userId     = req.user?.id?.toString() ?? req.session?.userId?.toString() ?? 'unknown';
      const sessionId  = req.params.sessionId  ?? req.body?.sessionId;
      const propertyId = req.params.propertyId ?? req.body?.propertyId;
      const resourceId = sessionId ?? propertyId ?? 'unknown';

      // Wrap res.json so we can observe the outcome before it flushes.
      const originalJson = res.json.bind(res) as typeof res.json;

      res.json = (body: Record<string, unknown>): Response => {
        const success = body?.success !== false;
        const errorMessage = success
          ? undefined
          : (body?.error as Record<string, string> | undefined)?.message;

        // Emit a resource-specific event in addition to the generic access log.
        if (resourceType === 'session' && sessionId) {
          auditLogger.logSessionEvent(
            userId, sessionId, `${resourceType}_${operation}`,
            { endpoint: req.path, method: req.method },
            { success, errorMessage }
          );
        } else if (resourceType === 'property' && propertyId) {
          auditLogger.logPropertyEvent(
            userId, propertyId, `${resourceType}_${operation}`,
            { endpoint: req.path, method: req.method },
            { success, errorMessage, sessionId }
          );
        }

        // Log the resolved access outcome.
        auditLogger.logAccessEvent(
          userId, resourceType, resourceId, operation,
          { success, errorMessage, ip: req.ip, userAgent: req.get('User-Agent') }
        ).catch((err: Error) =>
          logger.warn('Failed to write audit log', 'SecurityIntegration', { error: err.message })
        );

        return originalJson(body);
      };

      next();
    };
  }

  /**
   * Sliding-window rate limiter for write/delete operations.
   * State is held in the class-level {@link rateLimitStore}.
   */
  private static rateLimitMiddleware() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      const userId = req.user?.id?.toString() ?? req.session?.userId?.toString() ?? req.ip ?? 'unknown';
      const now    = Date.now();

      const existing = SecurityIntegration.rateLimitStore.get(userId);

      if (!existing || now > existing.resetTime) {
        SecurityIntegration.rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        next();
        return;
      }

      if (existing.count >= RATE_LIMIT_MAX_ATTEMPTS) {
        auditLogger.logSecurityEvent(
          userId,
          'rate_limit_exceeded',
          { endpoint: req.path, method: req.method, attempts: existing.count },
          { 
            ip: req.ip, 
            userAgent: req.get('User-Agent'), 
            success: false, 
            message: 'Rate limit exceeded for sensitive operation' 
          }
        );

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((existing.resetTime - now) / 1000),
          },
        });
        return;
      }

      existing.count += 1;
      next();
    };
  }

  // ─── Public utility methods ─────────────────────────────────────────────────

  /**
   * Applies privacy protection to community feedback and logs the outcome.
   */
  static async secureProcessCommunityFeedback(
    feedback: Record<string, unknown>,
    userId: string,
    sessionId: string,
    protectionLevel: ProtectionLevel = 'standard'
  ): Promise<Record<string, unknown>> {
    try {
      const protectedFeedback = await privacyProtectionService.protectCommunityFeedback(
        feedback,
        protectionLevel
      );

      await auditLogger.logFeedbackEvent(
        userId, sessionId, 'feedback_processed',
        {
          protectionLevel,
          hasSourceDetails: !!feedback.sourceDetails,
          feedbackFields: Object.keys((feedback.feedback as object | undefined) ?? {}),
        },
        { success: true }
      );

      return protectedFeedback;

    } catch (error) {
      const message = (error as Error).message;
      await auditLogger.logFeedbackEvent(
        userId, sessionId, 'feedback_processing_failed',
        { protectionLevel, error: message },
        { success: false, errorMessage: message }
      );
      throw error;
    }
  }

  /**
   * Retrieves data filtered to the caller's access level and, for feedback
   * resources, attempts transparent decryption.
   */
  static async secureDataRetrieval(
    data: Record<string, unknown>,
    userId: string,
    userRole: string,
    resourceType: ResourceType,
    resourceId: string
  ): Promise<Record<string, unknown>> {
    try {
      const accessContext: AccessContext = {
        userId,
        userRole,
        operation: 'read',
        resourceType,
        sessionId:  resourceType === 'session'  ? resourceId : undefined,
        propertyId: resourceType === 'property' ? resourceId : undefined,
      };

      const filteredData = accessControlService.filterDataByAccess(data, accessContext) as Record<string, unknown>;

      let result = filteredData;
      if (resourceType === 'feedback' && filteredData) {
        try {
          result = encryptionService.decryptCommunityFeedback(filteredData);
        } catch (decryptError) {
          logger.warn('Failed to decrypt community feedback — returning filtered data as-is', 'SecurityIntegration', {
            userId,
            resourceId,
            error: (decryptError as Error).message,
          });
          // Return filtered-but-encrypted data rather than hard-failing.
        }
      }

      await auditLogger.logAccessEvent(userId, resourceType, resourceId, 'read', { success: true });

      return result;

    } catch (error) {
      await auditLogger.logAccessEvent(
        userId, resourceType, resourceId, 'read',
        { success: false, errorMessage: (error as Error).message }
      );
      throw error;
    }
  }

  /**
   * Encrypts sensitive ownership fields and logs the operation.
   */
  static async secureOwnershipData(
    ownershipData: Record<string, unknown>,
    userId: string,
    propertyId: string
  ): Promise<Record<string, unknown>> {
    try {
      const encryptedData = encryptionService.encryptOwnershipData(ownershipData);

      await auditLogger.logPropertyEvent(
        userId, propertyId, 'ownership_data_encrypted',
        {
          hasCurrentOwner:    !!ownershipData.currentOwner,
          hasOwnershipHistory: !!ownershipData.ownershipHistory,
          hasLegalInstruments: !!ownershipData.legalInstruments,
        },
        { success: true }
      );

      return encryptedData;

    } catch (error) {
      const message = (error as Error).message;
      await auditLogger.logPropertyEvent(
        userId, propertyId, 'ownership_encryption_failed',
        { error: message },
        { success: false, errorMessage: message }
      );
      throw error;
    }
  }

  /**
   * Generates a time-limited, secure access token and URL for a verification
   * report, then logs the event.
   */
  static async generateSecureReport(
    reportData: Record<string, unknown>,
    userId: string,
    sessionId: string,
    reportType: string
  ): Promise<SecureReportResult> {
    try {
      const reportId  = encryptionService.generateSecureToken();
      const expiresAt = new Date(Date.now() + REPORT_EXPIRY_MS);
      const secureUrl = `/api/land-verification/reports/${reportId}`;

      await auditLogger.logReportEvent(
        userId, sessionId, 'report_generated',
        {
          reportId,
          reportType,
          dataSize: JSON.stringify(reportData).length,
          expiresAt: expiresAt.toISOString(),
        },
        { success: true }
      );

      return { reportId, secureUrl, expiresAt };

    } catch (error) {
      const message = (error as Error).message;
      await auditLogger.logReportEvent(
        userId, sessionId, 'report_generation_failed',
        { reportType, error: message },
        { success: false, errorMessage: message }
      );
      throw error;
    }
  }

  /**
   * Returns `true` when the hash of `data` matches `expectedHash`.
   * Returns `true` unconditionally when no expected hash is supplied so that
   * callers can treat an absent hash as "no constraint".
   */
  static validateDataIntegrity(
    data: Record<string, unknown>,
    expectedHash?: string
  ): boolean {
    if (!expectedHash) return true;

    try {
      return encryptionService.verifyHash(JSON.stringify(data), expectedHash);
    } catch (error) {
      logger.error(
        { error: (error as Error).message, stack: (error as Error).stack },
        'Data integrity validation failed'
      );
      return false;
    }
  }

  /** Returns a SHA-256 hex digest of the JSON-serialised `data`. */
  static generateDataHash(data: Record<string, unknown>): string {
    return encryptionService.generateHash(JSON.stringify(data));
  }

  // ─── Health check ───────────────────────────────────────────────────────────

  /**
   * Exercises each security subsystem and returns a structured health report.
   * A single `critical` failure downgrades the overall status; additional
   * failures in non-critical components produce a `warning`.
   */
  static async performSecurityHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheck[] = [];
    let overallStatus: HealthStatus = 'healthy';

    const record = (
      component: string,
      passed: boolean,
      passMessage: string,
      failMessage: string,
      severity: 'critical' | 'warning' = 'warning'
    ): void => {
      checks.push({
        component,
        status: passed ? 'pass' : 'fail',
        message: passed ? passMessage : failMessage,
      });

      if (!passed) {
        overallStatus = severity === 'critical' ? 'critical'
          : overallStatus === 'critical' ? 'critical'
          : 'warning';
      }
    };

    // ── Encryption service ──────────────────────────────────────────────────
    try {
      const probe      = 'security-health-check';
      const encrypted  = encryptionService.encrypt(probe);
      const decrypted  = encryptionService.decrypt(encrypted);
      const roundTrips = decrypted === probe;

      record(
        'EncryptionService', roundTrips,
        'Encryption/decryption round-trip OK',
        'Encryption/decryption round-trip failed',
        'critical'
      );
    } catch (error) {
      record(
        'EncryptionService', false,
        '',
        `Encryption service threw: ${(error as Error).message}`,
        'critical'
      );
    }

    // ── Access control service ──────────────────────────────────────────────
    try {
      await accessControlService.checkSessionAccess({
        userId: 'health-check-probe',
        userRole: 'admin',
        operation: 'read',
        resourceType: 'session',
        sessionId: 'health-check-probe',
      });

      record('AccessControlService', true, 'Access control checks OK', '');
    } catch (error) {
      record(
        'AccessControlService', false,
        '',
        `Access control threw: ${(error as Error).message}`
      );
    }

    // ── Audit logger ────────────────────────────────────────────────────────
    try {
      await auditLogger.logSystemEvent(
        'security_health_check',
        { timestamp: new Date().toISOString() },
        { success: true }
      );

      record('AuditLogger', true, 'Audit logging OK', '');
    } catch (error) {
      record(
        'AuditLogger', false,
        '',
        `Audit logger threw: ${(error as Error).message}`
      );
    }

    // ── Privacy protection service ──────────────────────────────────────────
    try {
      await privacyProtectionService.protectCommunityFeedback(
        { id: 'probe', sourceDetails: { name: 'Probe User' }, recordedAt: new Date() },
        'minimal'
      );

      record('PrivacyProtectionService', true, 'Privacy protection OK', '');
    } catch (error) {
      record(
        'PrivacyProtectionService', false,
        '',
        `Privacy protection threw: ${(error as Error).message}`
      );
    }

    // ── Emit summary ────────────────────────────────────────────────────────
    await auditLogger.logSystemEvent(
      'security_health_check_completed',
      {
        overallStatus,
        checksPerformed: checks.length,
        passedChecks:    checks.filter(c => c.status === 'pass').length,
        failedChecks:    checks.filter(c => c.status === 'fail').length,
      },
      { success: (overallStatus as HealthStatus) !== 'critical' }
    );

    return { status: overallStatus, checks };
  }
}

export default SecurityIntegration;