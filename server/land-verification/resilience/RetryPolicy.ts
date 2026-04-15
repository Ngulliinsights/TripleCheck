/**
 * Retry policy implementation for land verification operations
 * Provides configurable retry strategies with exponential backoff
 */

import { logger } from '../../infrastructure/observability/telemetry';
import { LandVerificationErrorCode } from '../errors/LandVerificationErrors';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  jitter: boolean; // Add randomness to prevent thundering herd
  retryableErrors: (string | LandVerificationErrorCode)[];
  timeoutMs?: number;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  error: Error;
  timestamp: Date;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: RetryAttempt[];
  totalDuration: number;
}

export class RetryPolicy {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffStrategy: 'exponential',
    jitter: true,
    retryableErrors: [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      LandVerificationErrorCode.GOVERNMENT_API_UNAVAILABLE,
      LandVerificationErrorCode.GOVERNMENT_API_TIMEOUT,
      LandVerificationErrorCode.LAND_REGISTRY_UNAVAILABLE,
      LandVerificationErrorCode.COURT_SYSTEM_UNAVAILABLE,
      LandVerificationErrorCode.MONITORING_SERVICE_UNAVAILABLE
    ],
    timeoutMs: 60000
  };

  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...RetryPolicy.DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute operation with retry policy
   */
  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    correlationId?: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    const attempts: RetryAttempt[] = [];
    let lastError: Error;

    logger.info(
      `Starting retry operation: ${operationName}`,
      'RetryPolicy',
      correlationId
    );

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const attemptStartTime = Date.now();

      try {
        // Apply timeout if configured
        const result = this.config.timeoutMs
          ? await this.withTimeout(operation(), this.config.timeoutMs)
          : await operation();

        const totalDuration = Date.now() - startTime;

        logger.info(
          `Retry operation succeeded: ${operationName} (attempt ${attempt + 1}/${this.config.maxRetries + 1}, duration: ${totalDuration}ms)`,
          'RetryPolicy',
          correlationId
        );

        return {
          success: true,
          result,
          attempts,
          totalDuration
        };
      } catch (error) {
        lastError = error as Error;
        const attemptDuration = Date.now() - attemptStartTime;

        attempts.push({
          attempt: attempt + 1,
          delay: 0, // Will be set below if retrying
          error: lastError,
          timestamp: new Date()
        });

        logger.warn(
          `Retry operation failed: ${operationName} (attempt ${attempt + 1}/${this.config.maxRetries + 1}, error: ${lastError.message})`,
          'RetryPolicy',
          correlationId,
          lastError
        );

        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          logger.info(
            `Error not retryable for operation: ${operationName}`,
            'RetryPolicy',
            correlationId
          );
          break;
        }

        // Check if we have more retries left
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt);
          attempts[attempts.length - 1].delay = delay;

          logger.info(
            `Retrying operation: ${operationName} in ${delay}ms (attempt ${attempt + 2}/${this.config.maxRetries + 1})`,
            'RetryPolicy',
            correlationId
          );

          await this.sleep(delay);
        }
      }
    }

    const totalDuration = Date.now() - startTime;

    logger.error(
      `Retry operation exhausted: ${operationName} (${this.config.maxRetries + 1} attempts, duration: ${totalDuration}ms)`,
      'RetryPolicy',
      correlationId,
      lastError
    );

    return {
      success: false,
      error: lastError,
      attempts,
      totalDuration
    };
  }

  /**
   * Check if error is retryable based on configuration
   */
  private isRetryableError(error: Error): boolean {
    // Check error code
    if ('code' in error && typeof error.code === 'string') {
      if (this.config.retryableErrors.includes(error.code)) {
        return true;
      }
    }

    // Check error message for specific patterns
    const errorMessage = error.message.toLowerCase();
    const retryablePatterns = [
      'timeout',
      'connection refused',
      'network error',
      'service unavailable',
      'temporary failure',
      'rate limit'
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Calculate delay for next retry attempt
   */
  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.backoffStrategy) {
      case 'exponential':
        delay = this.config.baseDelay * Math.pow(2, attempt);
        break;
      case 'linear':
        delay = this.config.baseDelay * (attempt + 1);
        break;
      case 'fixed':
      default:
        delay = this.config.baseDelay;
        break;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter if enabled
    if (this.config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, Math.round(delay));
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wrap operation with timeout
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  /**
   * Create retry policy for government API calls
   */
  static forGovernmentAPI(): RetryPolicy {
    return new RetryPolicy({
      maxRetries: 5,
      baseDelay: 2000,
      maxDelay: 60000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryableErrors: [
        'ECONNREFUSED',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ECONNRESET',
        LandVerificationErrorCode.GOVERNMENT_API_UNAVAILABLE,
        LandVerificationErrorCode.GOVERNMENT_API_TIMEOUT,
        LandVerificationErrorCode.GOVERNMENT_API_RATE_LIMITED,
        LandVerificationErrorCode.LAND_REGISTRY_UNAVAILABLE,
        LandVerificationErrorCode.COURT_SYSTEM_UNAVAILABLE
      ],
      timeoutMs: 30000
    });
  }

  /**
   * Create retry policy for database operations
   */
  static forDatabase(): RetryPolicy {
    return new RetryPolicy({
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 5000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryableErrors: [
        'ECONNREFUSED',
        'ECONNRESET',
        'CONNECTION_FAILURE',
        'CONNECTION_EXCEPTION'
      ],
      timeoutMs: 10000
    });
  }

  /**
   * Create retry policy for expert coordination
   */
  static forExpertCoordination(): RetryPolicy {
    return new RetryPolicy({
      maxRetries: 2,
      baseDelay: 5000,
      maxDelay: 30000,
      backoffStrategy: 'linear',
      jitter: false,
      retryableErrors: [
        LandVerificationErrorCode.EXPERT_UNAVAILABLE,
        LandVerificationErrorCode.EXPERT_REPORT_DELAYED
      ],
      timeoutMs: 60000
    });
  }

  /**
   * Create retry policy for physical verification
   */
  static forPhysicalVerification(): RetryPolicy {
    return new RetryPolicy({
      maxRetries: 2,
      baseDelay: 3000,
      maxDelay: 15000,
      backoffStrategy: 'fixed',
      jitter: true,
      retryableErrors: [
        LandVerificationErrorCode.GPS_ACCURACY_INSUFFICIENT,
        LandVerificationErrorCode.SURVEY_DATA_INCONSISTENT
      ],
      timeoutMs: 45000
    });
  }

  /**
   * Create retry policy for monitoring services
   */
  static forMonitoring(): RetryPolicy {
    return new RetryPolicy({
      maxRetries: 4,
      baseDelay: 1000,
      maxDelay: 20000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryableErrors: [
        LandVerificationErrorCode.MONITORING_SERVICE_UNAVAILABLE,
        LandVerificationErrorCode.MONITORING_DATA_STALE,
        LandVerificationErrorCode.ALERT_DELIVERY_FAILED
      ],
      timeoutMs: 15000
    });
  }
}

/**
 * Decorator for automatic retry functionality
 */
export function withRetry(retryPolicy: RetryPolicy, operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const opName = operationName || `${target.constructor.name}.${propertyKey}`;
      const correlationId = args.find(arg => typeof arg === 'string' && arg.includes('-')) || undefined;

      const result = await retryPolicy.execute(
        () => originalMethod.apply(this, args),
        opName,
        correlationId
      );

      if (!result.success) {
        throw result.error;
      }

      return result.result;
    };

    return descriptor;
  };
}