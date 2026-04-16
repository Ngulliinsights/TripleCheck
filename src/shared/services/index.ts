/**
 * Shared Services Index
 * 
 * Centralized exports for all shared services in the African Property Trust platform.
 * This provides a single entry point for importing services across the application.
 * 
 * Design Philosophy:
 * - Single source of truth for all service imports
 * - Clean separation between service exports and service instances
 * - Integrated error handling and monitoring across all services
 * - Graceful initialization and shutdown patterns
 */

// Import each service only once to avoid duplicate identifier errors
import { apiClient } from "./unified-api-client"
import { performanceMonitoringService, performanceMonitor } from "./performance-monitoring-service"
import { securityMonitoringService, securityMonitor } from "./security-monitoring-service"
import { auditTrailService, auditLogger } from "./audit-trail-service"
import { errorHandler } from "../../../server/middleware/error"

// ============================================================================
// CORE EXPORTS - Module Re-exports
// ============================================================================
// These exports allow other modules to import everything from the service modules
// Example: import { ApiResponse, ApiClient } from '@shared/services'

export * from "./unified-api-client"
export * from './audit-trail-service'
export * from './security-monitoring-service'
export * from './performance-monitoring-service'

// ============================================================================
// SERVICE INSTANCE EXPORTS - Singleton References
// ============================================================================
// These exports provide direct access to the configured service instances
// Example: import { apiClient, performanceMonitor } from '@shared/services'

export { apiClient } from "./unified-api-client"
export { auditTrailService, auditLogger } from './audit-trail-service'
export { securityMonitoringService, securityMonitor } from './security-monitoring-service'
export { performanceMonitoringService, performanceMonitor } from './performance-monitoring-service'
export { errorHandler } from "@server/infrastructure/error-handling"

// ============================================================================
// SERVICE INTEGRATION CLASS
// ============================================================================

export class ServiceIntegration {
  private static isInitialized = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Initialize all services with proper integration
   * Uses singleton pattern to prevent multiple initializations
   */
  static async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      console.log('🔄 Services already initialized, skipping...');
      return;
    }

    console.log('🚀 Initializing African Property Trust services...');

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Internal initialization method that does the actual work
   */
  private static async performInitialization(): Promise<void> {
    try {
      // Set up service event listeners for cross-service integration
      this.setupServiceIntegration();
      
      // Initialize performance monitoring with a startup metric
      // This helps us track how long the entire system takes to boot up
      performanceMonitor.recordMetric('service_initialization', Date.now(), 'timestamp');
      
      // Mark initialization as complete
      this.isInitialized = true;
      console.log('✅ All services initialized successfully');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      
      // Use proper error handling for initialization failures
      // This ensures that startup errors are properly logged and can be monitored
      await errorHandler.handleSystemError(
        error instanceof Error ? error : new Error('Service initialization failed'),
        { 
          component: 'ServiceIntegration', 
          action: 'initialize',
          severity: 'critical' // Startup failures are always critical
        }
      );
      
      // Reset initialization state so it can be retried
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error; // Re-throw so callers know initialization failed
    }
  }

  /**
   * Set up cross-service integration and event handling
   * This creates a web of communication between services so they can work together
   */
  private static setupServiceIntegration(): void {
    // Security monitoring alerts trigger audit logging
    // When security threats are detected, we want a permanent audit record
    securityMonitoringService.on('threatDetected', async (threat) => {
      await auditLogger.suspiciousActivity(
        `Security threat detected: ${threat.type}`,
        {
          threatId: threat.id,
          riskScore: threat.riskScore,
          indicators: threat.indicators.length
        },
        {
          userId: threat.metadata.userId,
          sessionId: threat.metadata.sessionId,
          ipAddress: threat.metadata.ipAddress,
          userAgent: threat.metadata.userAgent,
          roles: [],
          permissions: [],
          isAuthenticated: !!threat.metadata.userId
        }
      );
    });

    // High-risk security events trigger error handling
    // This escalates serious security issues to the error handling system
    securityMonitoringService.on('highRiskEvent', async (threat) => {
      await errorHandler.handleSystemError(
        new Error(`High-risk security event: ${threat.description}`),
        {
          component: 'SecurityMonitoring',
          action: 'threat_detection',
          severity: 'high',
          additionalData: {
            threatId: threat.id,
            threatType: threat.type,
            riskScore: threat.riskScore
          }
        }
      );
    });

    // Performance alerts trigger audit logging for high-severity issues
    // This helps with compliance and troubleshooting performance problems
    performanceMonitoringService.on('alert', async (alert) => {
      if (alert.severity === 'high' || alert.severity === 'critical') {
        await auditLogger.dataRead(
          'performance_alert',
          1,
          {
            userId: alert.context.userId,
            sessionId: alert.context.sessionId,
            roles: [],
            permissions: [],
            isAuthenticated: !!alert.context.userId
          }
        );
      }
    });

    // Error handling service integration
    // Log when critical errors occur, but avoid infinite loops
    errorHandler.on('criticalError', async (error: any) => {
      console.warn('Critical error detected:', error.id);
      // Note: We don't re-log to audit trail here to prevent circular logging
      // The error handler should already be logging to appropriate destinations
    });

    // Audit trail service monitors for compliance violations
    // This helps identify patterns that might indicate compliance issues
    auditTrailService.on('complianceViolation', (event) => {
      console.warn('Compliance violation detected:', {
        eventId: event.id,
        flags: event.complianceFlags,
        userId: event.userId,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Get overall system health status
   * This provides a comprehensive view of how all services are performing
   */
  static getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'critical';
    services: Record<string, 'up' | 'down' | 'degraded'>;
    metrics: {
      securityScore: number;
      performanceScore: number;
      errorRate: number;
      uptime: number;
    };
    lastChecked: string;
  } {
    const lastChecked = new Date().toISOString();

    try {
      // Gather metrics from each service
      const securityMetrics = securityMonitor.getMetrics();
      const performanceMetrics = performanceMonitor.getCurrentMetrics();
      const errorAnalytics = errorHandler.getAnalytics();

      // Evaluate each service's health based on specific criteria
      const services = {
        api: this.isInitialized ? 'up' as const : 'down' as const,
        security: securityMetrics.securityScore > 70 ? 'up' as const : 
                  securityMetrics.securityScore > 40 ? 'degraded' as const : 'down' as const,
        performance: performanceMetrics.coreWebVitals.lcp ? 
          (performanceMetrics.coreWebVitals.lcp < 4000 ? 'up' as const : 
           performanceMetrics.coreWebVitals.lcp < 8000 ? 'degraded' as const : 'down' as const) : 
          'up' as const,
        audit: 'up' as const, // Audit service is typically always available
        errorHandling: errorAnalytics.totalErrors < 100 ? 'up' as const : 
                      errorAnalytics.totalErrors < 500 ? 'degraded' as const : 'down' as const
      };

      // Calculate overall system status based on individual service health
      const serviceStatuses = Object.values(services);
      const degradedServices = serviceStatuses.filter(s => s === 'degraded').length;
      const downServices = serviceStatuses.filter(s => s === 'down').length;

      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (downServices > 0) {
        status = 'critical'; // Any service down makes the system critical
      } else if (degradedServices > 1) {
        status = 'critical'; // Multiple degraded services indicate critical issues
      } else if (degradedServices > 0) {
        status = 'degraded'; // Single degraded service means system is degraded
      }

      // Calculate performance score based on multiple factors
      const performanceScore = Math.max(0, Math.min(100, 
        100 - (degradedServices * 20) - (downServices * 40)
      ));

      return {
        status,
        services,
        metrics: {
          securityScore: securityMetrics.securityScore,
          performanceScore,
          errorRate: Math.min(1, errorAnalytics.totalErrors / 1000), // Cap at 100% error rate
          uptime: downServices === 0 ? 99.9 : Math.max(0, 99.9 - (downServices * 10))
        },
        lastChecked
      };
    } catch (error) {
      // If we can't determine system health, assume the worst
      console.error('Failed to determine system health:', error);
      
      return {
        status: 'critical',
        services: {
          api: 'down',
          security: 'down',
          performance: 'down',
          audit: 'down',
          errorHandling: 'down'
        },
        metrics: {
          securityScore: 0,
          performanceScore: 0,
          errorRate: 1,
          uptime: 0
        },
        lastChecked
      };
    }
  }

  /**
   * Shutdown all services gracefully
   * This ensures proper cleanup when the application is shutting down
   */
  static async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      console.log('🔄 Services not initialized, skipping shutdown...');
      return;
    }

    console.log('🛑 Shutting down services...');

    try {
      // Clean up performance monitoring resources
      // This prevents memory leaks and ensures clean shutdown
      performanceMonitoringService.destroy();
      
      // Clean up API client cache to free memory
      apiClient.clearCache();
      
      // Mark as no longer initialized
      this.isInitialized = false;
      this.initializationPromise = null;
      
      console.log('✅ All services shut down successfully');
    } catch (error) {
      console.error('❌ Error during service shutdown:', error);
      // Don't re-throw shutdown errors - we're already shutting down
    }
  }

  /**
   * Get initialization status
   */
  static get initialized(): boolean {
    return this.isInitialized;
  }
}

// ============================================================================
// AUTO-INITIALIZATION LOGIC
// ============================================================================
// This section automatically initializes services when the module is imported
// The logic differs between browser and Node.js environments

if (typeof window !== 'undefined') {
  // Browser environment - wait for DOM to be ready
  // This ensures that any DOM-dependent services have the proper environment
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ServiceIntegration.initialize().catch(console.error);
    });
  } else {
    // DOM is already ready, initialize immediately
    ServiceIntegration.initialize().catch(console.error);
  }
} else {
  // Node.js environment - initialize immediately
  // Server-side services don't need to wait for DOM events
  ServiceIntegration.initialize().catch(console.error);
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================
// Export TypeScript types for external use

export type { ApiResponse, ApiRequestOptions } from "./unified-api-client"