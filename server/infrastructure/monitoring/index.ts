import { Express } from 'express';

import metricsRoutes from '../../routes/metrics.routes';

import { alertingSystem } from './AlertingSystem';
import { logger } from './logger';
import { observabilitySystem } from './ObservabilitySystem';
import { prometheusMetrics, httpMetricsMiddleware } from './PrometheusMetrics';

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableAlerting: boolean;
  enableHttpMetrics: boolean;
  enableDatabaseMetrics: boolean;
  enableBusinessMetrics: boolean;
  enableCacheMetrics: boolean;
  metricsPath: string;
  excludePaths: string[];
}

export class MonitoringIntegration {
  private static instance: MonitoringIntegration;
  private config: MonitoringConfig;
  private isInitialized = false;

  static getInstance(config?: Partial<MonitoringConfig>): MonitoringIntegration {
    if (!MonitoringIntegration.instance) {
      MonitoringIntegration.instance = new MonitoringIntegration(config);
    }
    return MonitoringIntegration.instance;
  }

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enableMetrics: true,
      enableAlerting: true,
      enableHttpMetrics: true,
      enableDatabaseMetrics: true,
      enableBusinessMetrics: true,
      enableCacheMetrics: true,
      metricsPath: '/metrics',
      excludePaths: ['/health', '/metrics', '/favicon.ico'],
      ...config
    };
  }

  async initialize(app: Express): Promise<void> {
    if (this.isInitialized) {
      logger.warn('MonitoringIntegration already initialized');
      return;
    }

    try {
      logger.info('Initializing comprehensive observability system...');

      // Initialize core monitoring components
      if (this.config.enableMetrics) {
        await prometheusMetrics.initialize();
        logger.info('✅ Prometheus metrics initialized');
      }

      if (this.config.enableAlerting) {
        await alertingSystem.initialize();
        logger.info('✅ Alerting system initialized');
      }

      // Setup Express middleware
      this.setupMiddleware(app);

      // Setup routes
      this.setupRoutes(app);

      // Setup error handling
      this.setupErrorHandling(app);

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.isInitialized = true;
      logger.info('🎉 Comprehensive observability system initialized successfully');

      // Log configuration
      this.logConfiguration();

    } catch (error) {
      logger.error('❌ Failed to initialize monitoring integration:', error);
      throw error;
    }
  }

  private setupMiddleware(app: Express): void {
    if (this.config.enableHttpMetrics) {
      // Add HTTP metrics middleware early in the stack
      app.use(httpMetricsMiddleware());
      logger.info('✅ HTTP metrics middleware configured');
    }
  }

  private setupRoutes(app: Express): void {
    // Mount metrics routes
    app.use(this.config.metricsPath, metricsRoutes);
    logger.info(`✅ Metrics routes mounted at ${this.config.metricsPath}`);
  }

  private setupErrorHandling(app: Express): void {
    // Error handling middleware for monitoring endpoints
    app.use(this.config.metricsPath, (error: any, req: any, res: any, next: any) => {
      logger.error('Error in metrics endpoint:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal monitoring system error',
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown of monitoring system...`);

      try {
        // Cleanup monitoring resources
        await this.cleanup();
        logger.info('✅ Monitoring system shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during monitoring system shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  private async cleanup(): Promise<void> {
    // Cleanup resources, close connections, etc.
    logger.info('Cleaning up monitoring resources...');
  }

  private logConfiguration(): void {
    logger.info('📊 Monitoring Configuration:');
    logger.info(`  • Metrics: ${this.config.enableMetrics ? '✅' : '❌'}`);
    logger.info(`  • Alerting: ${this.config.enableAlerting ? '✅' : '❌'}`);
    logger.info(`  • HTTP Metrics: ${this.config.enableHttpMetrics ? '✅' : '❌'}`);
    logger.info(`  • Database Metrics: ${this.config.enableDatabaseMetrics ? '✅' : '❌'}`);
    logger.info(`  • Business Metrics: ${this.config.enableBusinessMetrics ? '✅' : '❌'}`);
    logger.info(`  • Cache Metrics: ${this.config.enableCacheMetrics ? '✅' : '❌'}`);
    logger.info(`  • Metrics Path: ${this.config.metricsPath}`);
    logger.info(`  • Excluded Paths: ${this.config.excludePaths.join(', ')}`);
  }

  // Public API methods
  getMetrics() {
    return prometheusMetrics;
  }

  getAlerting() {
    return alertingSystem;
  }

  getObservability() {
    return observabilitySystem;
  }

  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const [metricsHealth, alertingHealth, observabilityHealth] = await Promise.all([
        this.config.enableMetrics ? prometheusMetrics.healthCheck() : { status: 'disabled' },
        this.config.enableAlerting ? alertingSystem.healthCheck() : { status: 'disabled' },
        observabilitySystem.healthCheck()
      ]);

      const allHealthy = [metricsHealth, alertingHealth, observabilityHealth]
        .filter(h => h.status !== 'disabled')
        .every(h => h.status === 'healthy');

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        details: {
          initialized: this.isInitialized,
          config: this.config,
          components: {
            metrics: metricsHealth,
            alerting: alertingHealth,
            observability: observabilityHealth
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}

// Export singleton instance and convenience functions
export const monitoringIntegration = MonitoringIntegration.getInstance();

// Export all monitoring components for direct access
export {
  prometheusMetrics,
  alertingSystem,
  observabilitySystem,
  httpMetricsMiddleware
};

// Export convenience functions for easy integration
export const initializeMonitoring = (app: Express, config?: Partial<MonitoringConfig>) => {
  const integration = MonitoringIntegration.getInstance(config);
  return integration.initialize(app);
};

export const recordDatabaseQuery = prometheusMetrics.wrapDatabaseQuery.bind(prometheusMetrics);
export const recordCacheOperation = prometheusMetrics.wrapCacheOperation.bind(prometheusMetrics);

// Business metrics recording functions
export const recordLandVerificationStarted = prometheusMetrics.recordLandVerificationStarted.bind(prometheusMetrics);
export const recordLandVerificationCompleted = prometheusMetrics.recordLandVerificationCompleted.bind(prometheusMetrics);
export const recordFraudAlert = prometheusMetrics.recordFraudAlert.bind(prometheusMetrics);
export const recordUserRegistration = prometheusMetrics.recordUserRegistration.bind(prometheusMetrics);
export const recordUserLogin = prometheusMetrics.recordUserLogin.bind(prometheusMetrics);
export const recordPropertyListing = prometheusMetrics.recordPropertyListing.bind(prometheusMetrics);
export const recordPropertyView = prometheusMetrics.recordPropertyView.bind(prometheusMetrics);
export const recordPropertyInquiry = prometheusMetrics.recordPropertyInquiry.bind(prometheusMetrics);
export const recordDocumentAuthentication = prometheusMetrics.recordDocumentAuthentication.bind(prometheusMetrics);
export const recordFraudAnalysis = prometheusMetrics.recordFraudAnalysis.bind(prometheusMetrics);
export const recordExternalApiCall = prometheusMetrics.recordExternalApiCall.bind(prometheusMetrics);
export const updateActiveUsers = prometheusMetrics.updateActiveUsers.bind(prometheusMetrics);
export const updateTrustScore = prometheusMetrics.updateTrustScore.bind(prometheusMetrics);
export const updateConnectionPoolMetrics = prometheusMetrics.updateConnectionPoolMetrics.bind(prometheusMetrics);