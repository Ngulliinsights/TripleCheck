/**
 * Comprehensive Error Handling Service for Kenya Land Verification System
 * Integrates retry policies, fallback mechanisms, graceful degradation, and audit logging
 */

import {
  AppError,
  ErrorCode,
  HttpStatusCode,
  generateCorrelationId,
  ErrorCategory,
  ErrorSeverity
} from "../../../src/local/error-handling";
import { logger } from "../../infrastructure/monitoring/logger";

import { auditLogger, AuditSeverity } from "./AuditLogger";
import { fallbackManager, FallbackResult } from "./FallbackManager";
import {
  gracefulDegradationManager,
  DegradationContext,
  DegradationResult,
  DegradationLevel
} from "./GracefulDegradationManager";
import { retryPolicyManager, RetryResult } from "./RetryPolicyManager";

export interface ErrorHandlingConfig {
  enableRetry: boolean;
  enableFallback: boolean;
  enableDegradation: boolean;
  enableAuditLogging: boolean;
  maxRetryAttempts?: number;
  fallbackTimeout?: number;
  degradationThreshold?: number;
}

export interface ErrorContext {
  service: string;
  operation: string;
  sessionId?: string;
  propertyId?: string;
  userId?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorHandlingResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  retryResult?: RetryResult<T>;
  fallbackResult?: FallbackResult<T>;
  degradationResult?: DegradationResult<T>;
  correlationId: string;
  handlingStrategy: 'primary' | 'retry' | 'fallback' | 'degradation';
  warnings: string[];
  recommendations: string[];
}

export class ErrorHandlingService {
  private readonly config: ErrorHandlingConfig;
  private readonly serviceHealthMap: Map<string, ServiceHealthStatus> = new Map();

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = {
      enableRetry: true,
      enableFallback: true,
      enableDegradation: true,
      enableAuditLogging: true,
      maxRetryAttempts: 3,
      fallbackTimeout: 10000,
      degradationThreshold: 2,
      ...config
    };

    this.initializeServiceHealth();
    logger.info({ config: this.config }, 'Error handling service initialized');
  }

  /**
   * Execute operation with comprehensive error handling
   */
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    degradationContext?: DegradationContext
  ): Promise<ErrorHandlingResult<T>> {
    const correlationId = context.correlationId || generateCorrelationId();
    const startTime = Date.now();

    logger.info(
      `Starting error-handled operation: ${context.operation}`,
      'ERROR_HANDLER',
      { service: context.service, operation: context.operation, correlationId }
    );

    // Log operation start
    if (this.config.enableAuditLogging) {
      await auditLogger.logEvent({
        eventType: 'system_operation_started' as any,
        category: 'system' as any,
        severity: AuditSeverity.LOW,
        userId: context.userId,
        sessionId: context.sessionId,
        propertyId: context.propertyId,
        service: context.service,
        operation: context.operation,
        status: 'started',
        details: context.metadata || {},
        metadata: { correlationId }
      });
    }

    try {
      // Step 1: Try primary operation with retry
      if (this.config.enableRetry) {
        const retryResult = await this.executeWithRetry(operation, context, correlationId);

        if (retryResult.success) {
          await this.logSuccess(context, correlationId, Date.now() - startTime, 'retry');
          return {
            success: true,
            data: retryResult.data,
            retryResult,
            correlationId,
            handlingStrategy: retryResult.attempts > 1 ? 'retry' : 'primary',
            warnings: retryResult.attempts > 1 ? [`Operation succeeded after ${retryResult.attempts} attempts`] : [],
            recommendations: []
          };
        }

        // Update service health based on retry failure
        this.updateServiceHealth(context.service, false);
      }

      // Step 2: Try fallback mechanisms
      if (this.config.enableFallback) {
        const fallbackResult = await this.executeWithFallback(operation, context, correlationId);

        if (fallbackResult.success) {
          await this.logSuccess(context, correlationId, Date.now() - startTime, 'fallback');
          return {
            success: true,
            data: fallbackResult.data,
            fallbackResult,
            correlationId,
            handlingStrategy: 'fallback',
            warnings: [`Primary service failed, using fallback: ${fallbackResult.provider}`],
            recommendations: ['Monitor primary service for restoration']
          };
        }
      }

      // Step 3: Try graceful degradation
      if (this.config.enableDegradation && degradationContext) {
        const degradationResult = await this.executeWithDegradation(
          operation,
          context,
          degradationContext,
          correlationId
        );

        if (degradationResult.success) {
          await this.logSuccess(context, correlationId, Date.now() - startTime, 'degradation');
          return {
            success: true,
            data: degradationResult.data,
            degradationResult,
            correlationId,
            handlingStrategy: 'degradation',
            warnings: degradationResult.warnings,
            recommendations: degradationResult.recommendations
          };
        }
      }

      // All strategies failed
      const finalError = new AppError(
        ErrorCode.EXTERNAL_SERVICE_ERROR,
        `All error handling strategies failed for ${context.operation}`,
        HttpStatusCode.SERVICE_UNAVAILABLE,
        ErrorCategory.EXTERNAL_SERVICE,
        {
          severity: ErrorSeverity.CRITICAL,
          details: { service: context.service, operation: context.operation },
          correlationId
        }
      );

      await this.logFailure(context, correlationId, Date.now() - startTime, finalError);

      return {
        success: false,
        error: finalError,
        correlationId,
        handlingStrategy: 'primary',
        warnings: ['All error handling strategies exhausted'],
        recommendations: [
          'Check service status',
          'Contact system administrator',
          'Try again later'
        ]
      };

    } catch (error) {
      const handlingError = error instanceof Error ? error : new Error(String(error));
      await this.logFailure(context, correlationId, Date.now() - startTime, handlingError);

      return {
        success: false,
        error: handlingError,
        correlationId,
        handlingStrategy: 'primary',
        warnings: ['Error handling system failure'],
        recommendations: ['Contact system administrator immediately']
      };
    }
  }

  /**
   * Execute operation with retry policy
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    correlationId: string
  ): Promise<RetryResult<T>> {
    logger.debug(
      `Attempting operation with retry: ${context.operation}`,
      'ERROR_HANDLER',
      { service: context.service, correlationId }
    );

    return await retryPolicyManager.executeWithRetry(
      operation,
      context.service,
      context.operation,
      this.config.maxRetryAttempts ? { maxAttempts: this.config.maxRetryAttempts } : undefined
    );
  }

  /**
   * Execute operation with fallback
   */
  private async executeWithFallback<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    correlationId: string
  ): Promise<FallbackResult<T>> {
    logger.debug(
      `Attempting operation with fallback: ${context.operation}`,
      'ERROR_HANDLER',
      { service: context.service, correlationId }
    );

    return await fallbackManager.executeWithFallback(
      operation,
      context.service,
      context.operation
    );
  }

  /**
   * Execute operation with graceful degradation
   */
  private async executeWithDegradation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    degradationContext: DegradationContext,
    correlationId: string
  ): Promise<DegradationResult<T>> {
    logger.debug(
      `Attempting operation with degradation: ${context.operation}`,
      'ERROR_HANDLER',
      { service: context.service, correlationId }
    );

    return await gracefulDegradationManager.executeWithDegradation(
      (level: DegradationLevel) => operation(),
      degradationContext,
      context.operation
    );
  }

  /**
   * Log successful operation
   */
  private async logSuccess(
    context: ErrorContext,
    correlationId: string,
    duration: number,
    strategy: string
  ): Promise<void> {
    logger.info(
      `Operation succeeded with ${strategy} strategy: ${context.operation}`,
      'ERROR_HANDLER',
      { service: context.service, correlationId, duration, strategy }
    );

    if (this.config.enableAuditLogging) {
      await auditLogger.logEvent({
        eventType: 'system_operation_completed' as any,
        category: 'system' as any,
        severity: AuditSeverity.LOW,
        userId: context.userId,
        sessionId: context.sessionId,
        propertyId: context.propertyId,
        service: context.service,
        operation: context.operation,
        status: 'completed',
        duration,
        details: { strategy, ...context.metadata },
        metadata: { correlationId }
      });
    }

    // Update service health on success
    this.updateServiceHealth(context.service, true);
  }

  /**
   * Log failed operation
   */
  private async logFailure(
    context: ErrorContext,
    correlationId: string,
    duration: number,
    error: Error
  ): Promise<void> {
    logger.error(
      `Operation failed: ${context.operation}`,
      'ERROR_HANDLER',
      { service: context.service, correlationId, duration, error: error.message },
      error
    );

    if (this.config.enableAuditLogging) {
      await auditLogger.logSystemError(
        context.service,
        context.operation,
        error,
        AuditSeverity.HIGH,
        context.sessionId,
        { correlationId, duration, ...context.metadata }
      );
    }

    // Update service health on failure
    this.updateServiceHealth(context.service, false);
  }

  /**
   * Initialize service health tracking
   */
  private initializeServiceHealth(): void {
    const services = [
      'government-api',
      'court-records',
      'expert-services',
      'document-processing',
      'physical-verification',
      'community-intelligence'
    ];

    services.forEach(service => {
      this.serviceHealthMap.set(service, {
        service,
        healthy: true,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        totalRequests: 0,
        successfulRequests: 0
      });
    });
  }

  /**
   * Update service health status
   */
  private updateServiceHealth(service: string, success: boolean): void {
    const health = this.serviceHealthMap.get(service);
    if (!health) return;

    health.totalRequests++;
    health.lastCheck = new Date();

    if (success) {
      health.successfulRequests++;
      health.consecutiveFailures = 0;
      health.healthy = true;
    } else {
      health.consecutiveFailures++;

      // Mark as unhealthy after threshold failures
      if (health.consecutiveFailures >= (this.config.degradationThreshold || 2)) {
        health.healthy = false;
      }
    }

    this.serviceHealthMap.set(service, health);
  }

  /**
   * Get service health status
   */
  getServiceHealth(): ServiceHealthStatus[] {
    return Array.from(this.serviceHealthMap.values());
  }

  /**
   * Get health status for specific service
   */
  getServiceHealthStatus(service: string): ServiceHealthStatus | undefined {
    return this.serviceHealthMap.get(service);
  }

  /**
   * Manually set service health
   */
  setServiceHealth(service: string, healthy: boolean): void {
    const health = this.serviceHealthMap.get(service);
    if (health) {
      health.healthy = healthy;
      health.lastCheck = new Date();
      if (healthy) {
        health.consecutiveFailures = 0;
      }
      this.serviceHealthMap.set(service, health);

      logger.info(
        `Manually set service health: ${service} = ${healthy}`,
        'ERROR_HANDLER',
        { service, healthy }
      );
    }
  }

  /**
   * Create error-handled wrapper for async functions
   */
  createErrorHandledFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context: Omit<ErrorContext, 'correlationId'>,
    degradationContextFactory?: (...args: T) => DegradationContext
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const degradationContext = degradationContextFactory ? degradationContextFactory(...args) : undefined;

      const result = await this.executeWithErrorHandling(
        () => fn(...args),
        { ...context, correlationId: generateCorrelationId() },
        degradationContext
      );

      if (result.success) {
        return result.data!;
      } else {
        throw result.error!;
      }
    };
  }

  /**
   * Get error handling configuration
   */
  getConfig(): ErrorHandlingConfig {
    return { ...this.config };
  }

  /**
   * Update error handling configuration
   */
  updateConfig(updates: Partial<ErrorHandlingConfig>): void {
    Object.assign(this.config, updates);

    logger.info(
      'Updated error handling configuration',
      'ERROR_HANDLER',
      { updates }
    );
  }

  /**
   * Get error handling metrics
   */
  getMetrics(): ErrorHandlingMetrics {
    const services = Array.from(this.serviceHealthMap.values());

    return {
      totalServices: services.length,
      healthyServices: services.filter(s => s.healthy).length,
      unhealthyServices: services.filter(s => !s.healthy).length,
      averageSuccessRate: services.reduce((sum, s) =>
        sum + (s.totalRequests > 0 ? s.successfulRequests / s.totalRequests : 1), 0
      ) / services.length,
      serviceHealth: services.map(s => ({
        service: s.service,
        healthy: s.healthy,
        successRate: s.totalRequests > 0 ? s.successfulRequests / s.totalRequests : 1,
        consecutiveFailures: s.consecutiveFailures,
        lastCheck: s.lastCheck
      }))
    };
  }
}

interface ServiceHealthStatus {
  service: string;
  healthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  totalRequests: number;
  successfulRequests: number;
}

interface ErrorHandlingMetrics {
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  averageSuccessRate: number;
  serviceHealth: Array<{
    service: string;
    healthy: boolean;
    successRate: number;
    consecutiveFailures: number;
    lastCheck: Date;
  }>;
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();