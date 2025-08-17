/**
 * Shared Services Index
 * 
 * Centralized exports for all shared services in the African Property Trust platform.
 * This provides a single entry point for importing services across the application.
 */

// Core API and Communication Services
export * from './unified-api-client';
export * from './enhanced-cache-manager';

// Security and Monitoring Services
export * from './audit-trail-service';
export * from './security-monitoring-service';
export * from './error-handling-service';
export * from './performance-monitoring-service';

// Service Instances (Singletons)
export { apiClient } from './unified-api-client';
export { enhancedCache } from './enhanced-cache-manager';
export { auditTrailService, auditLogger } from './audit-trail-service';
export { securityMonitoringService, securityMonitor } from './security-monitoring-service';
export { errorHandlingService, errorHandler } from './error-handling-service';
export { performanceMonitoringService, performanceMonitor } from './performance-monitoring-service';

// Service Integration Helper
export class ServiceIntegration {
  /**
   * Initialize all services with proper integration
   */
  static async initialize(): Promise<void> {
    console.log('🚀 Initializing African Property Trust services...');

    try {
      // Set up service event listeners for integration
      this.setupServiceIntegration();
      
      // Initialize performance monitoring
      performanceMonitor.recordMetric('service_initialization', Date.now(), 'timestamp');
      
      console.log('✅ All services initialized successfully');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      await errorHandler.handleSystemError(
        error instanceof Error ? error : new Error('Service initialization failed'),
        { component: 'ServiceIntegration', action: 'initialize' }
      );
    }
  }

  /**
   * Set up cross-service integration and event handling
   */
  private static setupServiceIntegration(): void {
    // Security monitoring alerts trigger audit logging
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
    securityMonitoringService.on('highRiskEvent', async (threat) => {
      await errorHandler.handleSystemError(
        new Error(`High-risk security event: ${threat.description}`),
        {
          component: 'SecurityMonitoring',
          action: 'threat_detection',
          additionalData: {
            threatId: threat.id,
            threatType: threat.type,
            riskScore: threat.riskScore
          }
        }
      );
    });

    // Performance alerts trigger audit logging
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

    // Error handling service logs critical errors to audit trail
    errorHandlingService.on('criticalError', async (error) => {
      // Already handled in the error handling service
      console.warn('Critical error detected:', error.id);
    });

    // Audit trail service monitors for compliance violations
    auditTrailService.on('complianceViolation', (event) => {
      console.warn('Compliance violation detected:', {
        eventId: event.id,
        flags: event.complianceFlags,
        userId: event.userId
      });
    });
  }

  /**
   * Get overall system health status
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
  } {
    try {
      const securityMetrics = securityMonitor.getMetrics();
      const performanceMetrics = performanceMonitor.getCurrentMetrics();
      const errorAnalytics = errorHandler.getAnalytics();

      const services = {
        api: 'up' as const,
        security: securityMetrics.securityScore > 70 ? 'up' as const : 'degraded' as const,
        performance: performanceMetrics.coreWebVitals.lcp ? 
          (performanceMetrics.coreWebVitals.lcp < 4000 ? 'up' as const : 'degraded' as const) : 
          'up' as const,
        audit: 'up' as const,
        errorHandling: errorAnalytics.totalErrors < 100 ? 'up' as const : 'degraded' as const
      };

      const degradedServices = Object.values(services).filter(s => s === 'degraded').length;
      const downServices = Object.values(services).filter(s => s === 'down').length;

      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (downServices > 0) {
        status = 'critical';
      } else if (degradedServices > 1) {
        status = 'critical';
      } else if (degradedServices > 0) {
        status = 'degraded';
      }

      return {
        status,
        services,
        metrics: {
          securityScore: securityMetrics.securityScore,
          performanceScore: 85, // Would calculate from performance metrics
          errorRate: errorAnalytics.totalErrors / 1000, // Errors per thousand operations
          uptime: 99.9 // Would calculate actual uptime
        }
      };
    } catch (error) {
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
        }
      };
    }
  }

  /**
   * Shutdown all services gracefully
   */
  static async shutdown(): Promise<void> {
    console.log('🛑 Shutting down services...');

    try {
      // Clean up performance monitoring
      performanceMonitoringService.destroy();
      
      // Clean up API client cache
      apiClient.clearCache();
      
      console.log('✅ All services shut down successfully');
    } catch (error) {
      console.error('❌ Error during service shutdown:', error);
    }
  }
}

// Auto-initialize services when imported
if (typeof window !== 'undefined') {
  // Browser environment - initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ServiceIntegration.initialize();
    });
  } else {
    ServiceIntegration.initialize();
  }
} else {
  // Node.js environment - initialize immediately
  ServiceIntegration.initialize();
}

// Export service integration for manual control
export { ServiceIntegration };

// Export unified API client types for external use
export type { ApiResponse, ApiRequestOptions } from './unified-api-client';