/**
 * Comprehensive Error Handling Service
 * Orchestrates retry → fallback → graceful degradation strategies
 */

import { AppError, ErrorCode, HttpStatusCode, generateCorrelationId, ErrorCategory, ErrorSeverity } from '@shared/types/errors';
import { logger } from '../../infrastructure/observability/telemetry';
import { auditLogger, AuditSeverity, AuditCategory, AuditEventType } from '../AuditLogger';
import { fallbackManager, type FallbackResult } from './FallbackManager';
import { gracefulDegradationManager, type DegradationContext, type DegradationResult, type DegradationLevel } from './GracefulDegradation';
import { retryPolicyManager, type RetryResult } from './RetryPolicyManager';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ErrorHandlingConfig {
  readonly enableRetry: boolean;
  readonly enableFallback: boolean;
  readonly enableDegradation: boolean;
  readonly enableAuditLogging: boolean;
  readonly maxRetryAttempts: number;
  readonly fallbackTimeoutMs: number;
  readonly degradationThreshold: number;
  readonly trackedServices: readonly string[];
}

export interface ErrorContext {
  readonly service: string;
  readonly operation: string;
  readonly sessionId?: string;
  readonly propertyId?: string;
  readonly userId?: string;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}

export type HandlingStrategy = 'primary' | 'retry' | 'fallback' | 'degraded' | 'exhausted';

export interface ErrorHandlingResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: Error;
  readonly retryResult?: RetryResult<T>;
  readonly fallbackResult?: FallbackResult<T>;
  readonly degradationResult?: DegradationResult<T>;
  readonly correlationId: string;
  readonly handlingStrategy: HandlingStrategy;
  readonly warnings: string[];
  readonly recommendations: string[];
  readonly durationMs: number;
}

export interface ErrorHandlingMetrics {
  readonly totalServices: number;
  readonly healthyServices: number;
  readonly unhealthyServices: number;
  readonly averageSuccessRate: number;
  readonly serviceHealth: ServiceHealthSummary[];
}

interface ServiceHealthStatus {
  service: string;
  healthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  totalRequests: number;
  successfulRequests: number;
}

interface ServiceHealthSummary {
  service: string;
  healthy: boolean;
  successRate: number;
  consecutiveFailures: number;
  lastCheck: Date;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_TRACKED_SERVICES = [
  'government-api',
  'court-records',
  'expert-services',
  'document-processing',
  'physical-verification',
  'community-intelligence',
] as const;

const DEFAULT_CONFIG: ErrorHandlingConfig = {
  enableRetry: true,
  enableFallback: true,
  enableDegradation: true,
  enableAuditLogging: true,
  maxRetryAttempts: 3,
  fallbackTimeoutMs: 10_000,
  degradationThreshold: 2,
  trackedServices: DEFAULT_TRACKED_SERVICES,
};

// ─── Main Service Implementation ───────────────────────────────────────────

export class ErrorHandlingService {
  private config: ErrorHandlingConfig;
  private readonly serviceHealthMap: Map<string, ServiceHealthStatus>;

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.serviceHealthMap = this.initializeServiceHealth();
    logger.info('Error handling service initialized', { config: this.config });
  }

  private initializeServiceHealth(): Map<string, ServiceHealthStatus> {
    return new Map(
      this.config.trackedServices.map(service => [
        service,
        {
          service,
          healthy: true,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          totalRequests: 0,
          successfulRequests: 0,
        },
      ])
    );
  }

  /**
   * Execute an operation with comprehensive error handling
   */
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    degradationContext?: DegradationContext
  ): Promise<ErrorHandlingResult<T>> {
    const correlationId = context.correlationId ?? generateCorrelationId();
    const startTime = Date.now();
    const enrichedContext = { ...context, correlationId };

    await this.logOperationStart(enrichedContext);

    try {
      // Strategy 1: Primary with automatic retry
      if (this.config.enableRetry) {
        const retryResult = await retryPolicyManager.executeWithRetry(
          operation,
          context.service,
          context.operation,
          { maxAttempts: this.config.maxRetryAttempts }
        );

        if (retryResult.success) {
          const strategy: HandlingStrategy = retryResult.attempts > 1 ? 'retry' : 'primary';
          await this.recordSuccess(enrichedContext, startTime, strategy, true);
          
          return {
            success: true,
            data: retryResult.data,
            retryResult,
            correlationId,
            handlingStrategy: strategy,
            warnings: retryResult.attempts > 1 ? [`Succeeded after ${retryResult.attempts} attempts`] : [],
            recommendations: [],
            durationMs: Date.now() - startTime,
          };
        }

        this.updateServiceHealth(context.service, false);
      }

      // Strategy 2: Fallback to alternative providers
      if (this.config.enableFallback) {
        const fallbackResult = await this.executeWithFallbackTimeout(
          () => fallbackManager.executeWithFallback(operation, context.service, context.operation),
          this.config.fallbackTimeoutMs,
          enrichedContext
        );

        if (fallbackResult?.success) {
          // Do NOT mark primary service as healthy; record success but skip health update
          await this.recordSuccess(enrichedContext, startTime, 'fallback', false);
          
          return {
            success: true,
            data: fallbackResult.data,
            fallbackResult,
            correlationId,
            handlingStrategy: 'fallback',
            warnings: [`Primary service unavailable — using fallback: ${fallbackResult.provider}`],
            recommendations: ['Monitor primary service for restoration'],
            durationMs: Date.now() - startTime,
          };
        }
      }

      // Strategy 3: Graceful degradation
      if (this.config.enableDegradation && degradationContext) {
        const degradationResult = await gracefulDegradationManager.executeWithDegradation(
          (level: DegradationLevel) => operation(),
          degradationContext,
          context.operation
        );

        if (degradationResult.success) {
          await this.recordSuccess(enrichedContext, startTime, 'degraded', false);
          
          return {
            success: true,
            data: degradationResult.data,
            degradationResult,
            correlationId,
            handlingStrategy: 'degraded',
            warnings: degradationResult.warnings,
            recommendations: degradationResult.recommendations,
            durationMs: Date.now() - startTime,
          };
        }
      }

      // All strategies exhausted
      const finalError = this.createExhaustedError(enrichedContext, correlationId);
      await this.recordFailure(enrichedContext, startTime, finalError);

      return {
        success: false,
        error: finalError,
        correlationId,
        handlingStrategy: 'exhausted',
        warnings: ['All error handling strategies exhausted'],
        recommendations: ['Check service status', 'Contact system administrator', 'Retry after delay'],
        durationMs: Date.now() - startTime,
      };

    } catch (error) {
      const wrappedError = error instanceof Error ? error : new Error(String(error));
      await this.recordFailure(enrichedContext, startTime, wrappedError);

      return {
        success: false,
        error: wrappedError,
        correlationId,
        handlingStrategy: 'exhausted',
        warnings: ['Unexpected error handling failure'],
        recommendations: ['Contact system administrator immediately'],
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Create an error-handled wrapper function
   */
  createErrorHandledFunction<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    context: Omit<ErrorContext, 'correlationId'>,
    degradationContextFactory?: (...args: TArgs) => DegradationContext
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      const result = await this.executeWithErrorHandling(
        () => fn(...args),
        { ...context, correlationId: generateCorrelationId() },
        degradationContextFactory?.(...args)
      );

      if (result.success) {
        return result.data as TReturn;
      }
      throw result.error!;
    };
  }

  // ─── Health & Metrics ────────────────────────────────────────────────────

  getServiceHealth(): ServiceHealthStatus[] {
    return Array.from(this.serviceHealthMap.values());
  }

  getMetrics(): ErrorHandlingMetrics {
    const services = Array.from(this.serviceHealthMap.values());
    const serviceHealth: ServiceHealthSummary[] = services.map(s => ({
      service: s.service,
      healthy: s.healthy,
      successRate: s.totalRequests > 0 ? s.successfulRequests / s.totalRequests : 1,
      consecutiveFailures: s.consecutiveFailures,
      lastCheck: s.lastCheck,
    }));

    const averageSuccessRate = serviceHealth.length > 0
      ? serviceHealth.reduce((sum, s) => sum + s.successRate, 0) / serviceHealth.length
      : 1;

    return {
      totalServices: services.length,
      healthyServices: services.filter(s => s.healthy).length,
      unhealthyServices: services.filter(s => !s.healthy).length,
      averageSuccessRate,
      serviceHealth,
    };
  }

  setServiceHealth(service: string, healthy: boolean): void {
    const health = this.serviceHealthMap.get(service);
    if (!health) return;

    this.serviceHealthMap.set(service, {
      ...health,
      healthy,
      lastCheck: new Date(),
      consecutiveFailures: healthy ? 0 : health.consecutiveFailures,
    });

    logger.info(`Service health manually set: ${service}=${healthy}`, { service, healthy });
  }

  // ─── Configuration ───────────────────────────────────────────────────────

  getConfig(): ErrorHandlingConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<Omit<ErrorHandlingConfig, 'trackedServices'>>): void {
    this.config = { ...this.config, ...updates };
    logger.info('Error handling configuration updated', { updates });
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private updateServiceHealth(service: string, success: boolean): void {
    const health = this.serviceHealthMap.get(service);
    if (!health) return;

    const consecutiveFailures = success ? 0 : health.consecutiveFailures + 1;
    const healthy = consecutiveFailures < this.config.degradationThreshold;

    this.serviceHealthMap.set(service, {
      ...health,
      healthy,
      lastCheck: new Date(),
      consecutiveFailures,
      totalRequests: health.totalRequests + 1,
      successfulRequests: health.successfulRequests + (success ? 1 : 0),
    });
  }

  private async executeWithFallbackTimeout<T>(
    operation: () => Promise<FallbackResult<T>>,
    timeoutMs: number,
    context: ErrorContext & { correlationId: string }
  ): Promise<FallbackResult<T> | null> {
    try {
      return await Promise.race([
        operation(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
      ]);
    } catch (error) {
      logger.warn('Fallback operation threw an error', {
        error: error instanceof Error ? error.message : String(error),
        service: context.service,
        operation: context.operation,
        correlationId: context.correlationId,
      });
      return null;
    }
  }

  private createExhaustedError(context: ErrorContext & { correlationId: string }, correlationId: string): AppError {
    return new AppError(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `All error handling strategies failed: ${context.operation}`,
      HttpStatusCode.SERVICE_UNAVAILABLE,
      ErrorCategory.EXTERNAL_SERVICE,
      {
        severity: ErrorSeverity.CRITICAL,
        details: { service: context.service, operation: context.operation },
        correlationId,
      }
    );
  }

  private async logOperationStart(context: ErrorContext & { correlationId: string }): Promise<void> {
    logger.info(`Starting operation: ${context.operation}`, {
      service: context.service,
      correlationId: context.correlationId,
    });

    if (this.config.enableAuditLogging) {
      await auditLogger.logEvent({
        eventType: AuditEventType.OPERATION_STARTED,
        category: AuditCategory.VERIFICATION,
        severity: AuditSeverity.LOW,
        status: 'started',
        service: context.service,
        operation: context.operation,
        correlationId: context.correlationId,
        details: context as unknown as Record<string, unknown>,
        metadata: {},
      });
    }
  }

  private async recordSuccess(
    context: ErrorContext & { correlationId: string },
    startTime: number,
    strategy: HandlingStrategy,
    updatePrimaryHealth: boolean
  ): Promise<void> {
    const durationMs = Date.now() - startTime;
    
    // Only update primary service health if the primary/retry strategy succeeded
    if (updatePrimaryHealth) {
      this.updateServiceHealth(context.service, true);
    }

    logger.info(`Operation succeeded via ${strategy}`, {
      service: context.service,
      operation: context.operation,
      correlationId: context.correlationId,
      durationMs,
    });

    if (this.config.enableAuditLogging) {
      await auditLogger.logEvent({
        eventType: AuditEventType.OPERATION_SUCCEEDED,
        category: AuditCategory.VERIFICATION,
        severity: AuditSeverity.LOW,
        status: 'completed',
        service: context.service,
        operation: context.operation,
        correlationId: context.correlationId,
        details: { ...context, strategy, durationMs } as unknown as Record<string, unknown>,
        metadata: {},
      });
    }
  }

  private async recordFailure(
    context: ErrorContext & { correlationId: string },
    startTime: number,
    error: Error
  ): Promise<void> {
    const durationMs = Date.now() - startTime;
    this.updateServiceHealth(context.service, false);

    logger.error(`Operation failed: ${context.operation}`, {
      service: context.service,
      correlationId: context.correlationId,
      durationMs,
      error: error.message,
    });

    if (this.config.enableAuditLogging) {
      await auditLogger.logEvent({
        eventType: AuditEventType.OPERATION_FAILED,
        category: AuditCategory.VERIFICATION,
        severity: AuditSeverity.HIGH,
        status: 'failed',
        service: context.service,
        operation: context.operation,
        correlationId: context.correlationId,
        details: { ...context, error: error.message, durationMs } as unknown as Record<string, unknown>,
        metadata: {},
      });
    }
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();