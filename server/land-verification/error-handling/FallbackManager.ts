/**
 * Fallback Manager for Kenya Land Verification System
 * Provides fallback mechanisms when external services are unavailable
 */

import { 
  ExternalServiceError, 
  ErrorCode, 
  HttpStatusCode,
  generateCorrelationId 
} from "../../../src/shared/error-handling";
import { logger } from "../../logger";

export interface FallbackConfig {
  enabled: boolean;
  priority: number;
  timeout: number;
  healthCheckInterval: number;
  maxFailures: number;
  recoveryTime: number;
}

export interface FallbackProvider<T> {
  name: string;
  execute: () => Promise<T>;
  healthCheck: () => Promise<boolean>;
  config: FallbackConfig;
}

export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  provider?: string;
  fallbackUsed: boolean;
  error?: Error;
  correlationId: string;
}

export interface ServiceHealth {
  name: string;
  healthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  nextRetryTime?: Date;
}

export class FallbackManager {
  private readonly providers: Map<string, FallbackProvider<any>[]> = new Map();
  private readonly serviceHealth: Map<string, ServiceHealth> = new Map();
  private readonly healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultFallbacks();
  }

  /**
   * Initialize default fallback configurations
   */
  private initializeDefaultFallbacks(): void {
    // Government API fallbacks will be registered by services
    logger.info('Fallback manager initialized', 'FALLBACK_MANAGER');
  }

  /**
   * Register a fallback provider for a service
   */
  registerFallback<T>(
    service: string,
    provider: FallbackProvider<T>
  ): void {
    if (!this.providers.has(service)) {
      this.providers.set(service, []);
    }

    const providers = this.providers.get(service)!;
    providers.push(provider);
    
    // Sort by priority (lower number = higher priority)
    providers.sort((a, b) => a.config.priority - b.config.priority);

    // Initialize health tracking
    this.serviceHealth.set(provider.name, {
      name: provider.name,
      healthy: true,
      lastCheck: new Date(),
      consecutiveFailures: 0
    });

    // Start health check if enabled
    if (provider.config.enabled && provider.config.healthCheckInterval > 0) {
      this.startHealthCheck(provider);
    }

    logger.info(
      `Registered fallback provider: ${provider.name} for service: ${service}`,
      'FALLBACK_MANAGER',
      { service, provider: provider.name, priority: provider.config.priority }
    );
  }

  /**
   * Execute operation with fallback support
   */
  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    service: string,
    operationName: string
  ): Promise<FallbackResult<T>> {
    const correlationId = generateCorrelationId();
    
    logger.info(
      `Executing operation with fallback: ${operationName}`,
      'FALLBACK_MANAGER',
      { service, correlationId }
    );

    // Try primary operation first
    try {
      const result = await primaryOperation();
      
      logger.info(
        `Primary operation succeeded: ${operationName}`,
        'FALLBACK_MANAGER',
        { service, correlationId }
      );

      return {
        success: true,
        data: result,
        provider: 'primary',
        fallbackUsed: false,
        correlationId
      };
    } catch (primaryError) {
      logger.warn(
        `Primary operation failed: ${operationName}`,
        'FALLBACK_MANAGER',
        { 
          service, 
          correlationId, 
          error: primaryError instanceof Error ? primaryError.message : String(primaryError) 
        }
      );

      // Try fallback providers
      const providers = this.providers.get(service) || [];
      
      for (const provider of providers) {
        if (!provider.config.enabled) {
          continue;
        }

        const health = this.serviceHealth.get(provider.name);
        if (!health?.healthy) {
          logger.debug(
            `Skipping unhealthy fallback provider: ${provider.name}`,
            'FALLBACK_MANAGER',
            { service, correlationId, provider: provider.name }
          );
          continue;
        }

        try {
          logger.info(
            `Attempting fallback with provider: ${provider.name}`,
            'FALLBACK_MANAGER',
            { service, correlationId, provider: provider.name }
          );

          const fallbackResult = await this.executeWithTimeout(
            provider.execute,
            provider.config.timeout
          );

          logger.info(
            `Fallback operation succeeded with provider: ${provider.name}`,
            'FALLBACK_MANAGER',
            { service, correlationId, provider: provider.name }
          );

          // Reset failure count on success
          this.updateServiceHealth(provider.name, true);

          return {
            success: true,
            data: fallbackResult,
            provider: provider.name,
            fallbackUsed: true,
            correlationId
          };

        } catch (fallbackError) {
          logger.warn(
            `Fallback provider failed: ${provider.name}`,
            'FALLBACK_MANAGER',
            { 
              service, 
              correlationId, 
              provider: provider.name,
              error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
            }
          );

          // Update failure count
          this.updateServiceHealth(provider.name, false);
        }
      }

      // All fallbacks failed
      const finalError = primaryError instanceof Error ? 
        primaryError : 
        new Error(String(primaryError));

      logger.error(
        `All fallback attempts failed for operation: ${operationName}`,
        'FALLBACK_MANAGER',
        { service, correlationId, totalProviders: providers.length },
        finalError
      );

      return {
        success: false,
        error: finalError,
        fallbackUsed: true,
        correlationId
      };
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Update service health status
   */
  private updateServiceHealth(providerName: string, success: boolean): void {
    const health = this.serviceHealth.get(providerName);
    if (!health) return;

    const now = new Date();
    
    if (success) {
      health.healthy = true;
      health.consecutiveFailures = 0;
      health.nextRetryTime = undefined;
    } else {
      health.consecutiveFailures++;
      
      // Get provider config to check max failures
      const provider = this.findProviderByName(providerName);
      if (provider && health.consecutiveFailures >= provider.config.maxFailures) {
        health.healthy = false;
        health.nextRetryTime = new Date(now.getTime() + provider.config.recoveryTime);
        
        logger.warn(
          `Marking provider as unhealthy: ${providerName}`,
          'FALLBACK_MANAGER',
          { 
            provider: providerName, 
            consecutiveFailures: health.consecutiveFailures,
            nextRetryTime: health.nextRetryTime
          }
        );
      }
    }

    health.lastCheck = now;
    this.serviceHealth.set(providerName, health);
  }

  /**
   * Find provider by name across all services
   */
  private findProviderByName(name: string): FallbackProvider<any> | undefined {
    for (const providers of this.providers.values()) {
      const provider = providers.find(p => p.name === name);
      if (provider) return provider;
    }
    return undefined;
  }

  /**
   * Start health check for a provider
   */
  private startHealthCheck(provider: FallbackProvider<any>): void {
    const interval = setInterval(async () => {
      try {
        const isHealthy = await this.executeWithTimeout(
          provider.healthCheck,
          provider.config.timeout
        );
        
        this.updateServiceHealth(provider.name, isHealthy);
        
        if (!isHealthy) {
          logger.warn(
            `Health check failed for provider: ${provider.name}`,
            'FALLBACK_MANAGER',
            { provider: provider.name }
          );
        }
      } catch (error) {
        logger.warn(
          `Health check error for provider: ${provider.name}`,
          'FALLBACK_MANAGER',
          { 
            provider: provider.name,
            error: error instanceof Error ? error.message : String(error)
          }
        );
        
        this.updateServiceHealth(provider.name, false);
      }
    }, provider.config.healthCheckInterval);

    this.healthCheckIntervals.set(provider.name, interval);
  }

  /**
   * Stop health check for a provider
   */
  private stopHealthCheck(providerName: string): void {
    const interval = this.healthCheckIntervals.get(providerName);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(providerName);
    }
  }

  /**
   * Get health status for all providers
   */
  getHealthStatus(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }

  /**
   * Get health status for specific service providers
   */
  getServiceHealth(service: string): ServiceHealth[] {
    const providers = this.providers.get(service) || [];
    return providers
      .map(p => this.serviceHealth.get(p.name))
      .filter((health): health is ServiceHealth => health !== undefined);
  }

  /**
   * Manually mark provider as healthy/unhealthy
   */
  setProviderHealth(providerName: string, healthy: boolean): void {
    const health = this.serviceHealth.get(providerName);
    if (health) {
      health.healthy = healthy;
      health.lastCheck = new Date();
      if (healthy) {
        health.consecutiveFailures = 0;
        health.nextRetryTime = undefined;
      }
      
      logger.info(
        `Manually set provider health: ${providerName} = ${healthy}`,
        'FALLBACK_MANAGER',
        { provider: providerName, healthy }
      );
    }
  }

  /**
   * Remove fallback provider
   */
  removeFallback(service: string, providerName: string): void {
    const providers = this.providers.get(service);
    if (providers) {
      const index = providers.findIndex(p => p.name === providerName);
      if (index !== -1) {
        providers.splice(index, 1);
        this.stopHealthCheck(providerName);
        this.serviceHealth.delete(providerName);
        
        logger.info(
          `Removed fallback provider: ${providerName} from service: ${service}`,
          'FALLBACK_MANAGER',
          { service, provider: providerName }
        );
      }
    }
  }

  /**
   * Enable/disable fallback provider
   */
  setProviderEnabled(providerName: string, enabled: boolean): void {
    const provider = this.findProviderByName(providerName);
    if (provider) {
      provider.config.enabled = enabled;
      
      if (enabled && provider.config.healthCheckInterval > 0) {
        this.startHealthCheck(provider);
      } else {
        this.stopHealthCheck(providerName);
      }
      
      logger.info(
        `Set provider enabled status: ${providerName} = ${enabled}`,
        'FALLBACK_MANAGER',
        { provider: providerName, enabled }
      );
    }
  }

  /**
   * Get all registered providers for a service
   */
  getProviders(service: string): FallbackProvider<any>[] {
    return this.providers.get(service) || [];
  }

  /**
   * Clear all providers and stop health checks
   */
  clear(): void {
    // Stop all health checks
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }
    
    this.providers.clear();
    this.serviceHealth.clear();
    this.healthCheckIntervals.clear();
    
    logger.info('Cleared all fallback providers', 'FALLBACK_MANAGER');
  }

  /**
   * Create a fallback-enabled wrapper for async functions
   */
  createFallbackFunction<T extends any[], R>(
    primaryFn: (...args: T) => Promise<R>,
    service: string,
    operationName: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const result = await this.executeWithFallback(
        () => primaryFn(...args),
        service,
        operationName
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
export const fallbackManager = new FallbackManager();