/**
 * Retry Policy Manager for Kenya Land Verification System
 * Implements intelligent retry strategies for government API failures and external service issues
 */

import { 
  ExternalServiceError, 
  ErrorCode, 
  HttpStatusCode,
  generateCorrelationId 
} from "../../../src/shared/utils/errors";
import { logger } from "../../logger";

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  jitter: boolean;
  retryableErrors: string[];
  retryableStatusCodes: number[];
}

export interface RetryContext {
  attempt: number;
  totalAttempts: number;
  lastError: Error;
  startTime: number;
  correlationId: string;
  operation: string;
  service: string;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
  correlationId: string;
}

export class RetryPolicyManager {
  private readonly configs: Map<string, RetryConfig> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Initialize default retry configurations for different services
   */
  private initializeDefaultConfigs(): void {
    // Government API retry config - more aggressive due to known instability
    this.configs.set('government-api', {
      maxAttempts: 5,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryableErrors: [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN',
        'EXTERNAL_SERVICE_TIMEOUT',
        'EXTERNAL_SERVICE_UNAVAILABLE'
      ],
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    });

    // Court records system - moderate retry policy
    this.configs.set('court-records', {
      maxAttempts: 3,
      baseDelay: 1500,
      maxDelay: 15000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'EXTERNAL_SERVICE_TIMEOUT',
        'EXTERNAL_SERVICE_UNAVAILABLE'
      ],
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    });

    // Expert services - conservative retry policy
    this.configs.set('expert-services', {
      maxAttempts: 2,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffStrategy: 'linear',
      jitter: false,
      retryableErrors: [
        'ECONNRESET',
        'ETIMEDOUT',
        'EXTERNAL_SERVICE_TIMEOUT'
      ],
      retryableStatusCodes: [408, 500, 502, 503, 504]
    });

    // Database operations - minimal retry for transient issues
    this.configs.set('database', {
      maxAttempts: 3,
      baseDelay: 500,
      maxDelay: 5000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryableErrors: [
        'ECONNRESET',
        'CONNECTION_FAILURE',
        'CONNECTION_EXCEPTION'
      ],
      retryableStatusCodes: []
    });

    // Document processing - moderate retry for file operations
    this.configs.set('document-processing', {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      backoffStrategy: 'exponential',
      jitter: true,
      retryableErrors: [
        'ENOENT',
        'EMFILE',
        'ENFILE',
        'EXTERNAL_SERVICE_TIMEOUT'
      ],
      retryableStatusCodes: [408, 429, 500, 502, 503]
    });
  }

  /**
   * Execute operation with retry policy
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    service: string,
    operationName: string,
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config = this.getConfig(service, customConfig);
    const correlationId = generateCorrelationId();
    const startTime = Date.now();

    logger.info(
      `Starting retry operation: ${operationName}`,
      'RETRY_MANAGER',
      { service, correlationId, config }
    );

    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      const context: RetryContext = {
        attempt,
        totalAttempts: config.maxAttempts,
        lastError,
        startTime,
        correlationId,
        operation: operationName,
        service
      };

      try {
        logger.debug(
          `Retry attempt ${attempt}/${config.maxAttempts} for ${operationName}`,
          'RETRY_MANAGER',
          { correlationId, service }
        );

        const result = await operation();
        
        const totalDuration = Date.now() - startTime;
        
        logger.info(
          `Retry operation succeeded on attempt ${attempt}`,
          'RETRY_MANAGER',
          { 
            service, 
            operationName, 
            correlationId, 
            attempts: attempt, 
            totalDuration 
          }
        );

        return {
          success: true,
          data: result,
          attempts: attempt,
          totalDuration,
          correlationId
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        logger.warn(
          `Retry attempt ${attempt}/${config.maxAttempts} failed for ${operationName}`,
          'RETRY_MANAGER',
          { 
            correlationId, 
            service, 
            error: lastError.message,
            errorCode: (lastError as any).code 
          }
        );

        // Check if error is retryable
        if (!this.isRetryableError(lastError, config)) {
          logger.error(
            `Non-retryable error encountered for ${operationName}`,
            'RETRY_MANAGER',
            { correlationId, service, error: lastError.message },
            lastError
          );
          break;
        }

        // Don't delay after the last attempt
        if (attempt < config.maxAttempts) {
          const delay = this.calculateDelay(attempt, config);
          
          logger.debug(
            `Waiting ${delay}ms before retry attempt ${attempt + 1}`,
            'RETRY_MANAGER',
            { correlationId, service }
          );

          await this.delay(delay);
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    
    logger.error(
      `Retry operation failed after ${config.maxAttempts} attempts`,
      'RETRY_MANAGER',
      { 
        service, 
        operationName, 
        correlationId, 
        totalDuration,
        finalError: lastError.message 
      },
      lastError
    );

    return {
      success: false,
      error: lastError,
      attempts: config.maxAttempts,
      totalDuration,
      correlationId
    };
  }

  /**
   * Get retry configuration for a service
   */
  private getConfig(service: string, customConfig?: Partial<RetryConfig>): RetryConfig {
    const baseConfig = this.configs.get(service) || this.configs.get('government-api')!;
    
    if (customConfig) {
      return { ...baseConfig, ...customConfig };
    }
    
    return baseConfig;
  }

  /**
   * Check if an error is retryable based on configuration
   */
  private isRetryableError(error: Error, config: RetryConfig): boolean {
    // Check HTTP status codes first - don't retry client errors (4xx)
    const {statusCode} = (error as any);
    if (statusCode) {
      // Don't retry client errors (4xx)
      if (statusCode >= 400 && statusCode < 500) {
        return false;
      }
      // Retry server errors and other configured status codes
      if (config.retryableStatusCodes.includes(statusCode)) {
        return true;
      }
    }

    // Check error codes
    const errorCode = (error as any).code;
    if (errorCode && config.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check error messages for common patterns
    const message = error.message.toLowerCase();
    const retryablePatterns = [
      'timeout',
      'connection reset',
      'connection refused',
      'service unavailable',
      'bad gateway',
      'gateway timeout',
      'too many requests'
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  /**
   * Calculate delay based on backoff strategy
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay: number;

    switch (config.backoffStrategy) {
      case 'exponential':
        delay = Math.min(config.baseDelay * Math.pow(2, attempt - 1), config.maxDelay);
        break;
      case 'linear':
        delay = Math.min(config.baseDelay * attempt, config.maxDelay);
        break;
      case 'fixed':
      default:
        delay = config.baseDelay;
        break;
    }

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, Math.round(delay));
  }

  /**
   * Delay execution
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Register custom retry configuration
   */
  registerConfig(service: string, config: RetryConfig): void {
    this.configs.set(service, config);
    
    logger.info(
      `Registered retry configuration for service: ${service}`,
      'RETRY_MANAGER',
      { service, config }
    );
  }

  /**
   * Get all registered configurations
   */
  getConfigurations(): Map<string, RetryConfig> {
    return new Map(this.configs);
  }

  /**
   * Update configuration for existing service
   */
  updateConfig(service: string, updates: Partial<RetryConfig>): void {
    const existing = this.configs.get(service);
    if (existing) {
      this.configs.set(service, { ...existing, ...updates });
      
      logger.info(
        `Updated retry configuration for service: ${service}`,
        'RETRY_MANAGER',
        { service, updates }
      );
    } else {
      logger.warn(
        `Attempted to update non-existent retry configuration: ${service}`,
        'RETRY_MANAGER',
        { service }
      );
    }
  }

  /**
   * Remove configuration for a service
   */
  removeConfig(service: string): void {
    if (this.configs.delete(service)) {
      logger.info(
        `Removed retry configuration for service: ${service}`,
        'RETRY_MANAGER',
        { service }
      );
    }
  }

  /**
   * Create a retryable wrapper for async functions
   */
  createRetryableFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    service: string,
    operationName: string,
    customConfig?: Partial<RetryConfig>
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const result = await this.executeWithRetry(
        () => fn(...args),
        service,
        operationName,
        customConfig
      );

      if (result.success) {
        return result.data!;
      } else {
        throw result.error!;
      }
    };
  }
}

// Export singleton instance
export const retryPolicyManager = new RetryPolicyManager();