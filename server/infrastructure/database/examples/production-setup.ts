/**
 * Production Database Setup Example
 * 
 * Demonstrates how to set up and use the database service in a production environment
 * with proper configuration, monitoring, and error handling.
 */

import { ConnectionPoolManager, DEFAULT_POOL_CONFIG } from '../connection';
import { DatabaseHealthMonitor } from '../health';
import { MigrationManager } from '../migrations';
import { SchemaManager } from '../schemas';
import { seedDevelopmentData } from '../seeds';

/**
 * Production database configuration
 */
const PRODUCTION_CONFIG = {
  ...DEFAULT_POOL_CONFIG,
  maxConnections: 20,
  healthCheckInterval: 15000, // 15 seconds
  circuitBreakerThreshold: 3,
  circuitBreakerTimeout: 30000, // 30 seconds
  retryAttempts: 5,
  maxRetryDelay: 5000
};

/**
 * Health monitoring configuration
 */
const HEALTH_CONFIG = {
  checkInterval: 30000, // 30 seconds
  thresholds: {
    connectionLatency: { warning: 50, critical: 200 },
    queryTime: { warning: 500, critical: 2000 },
    errorRate: { warning: 0.02, critical: 0.05 },
    poolUtilization: { warning: 0.7, critical: 0.9 },
    memoryUsage: { warning: 0.7, critical: 0.9 }
  },
  enableAutoRecovery: true
};

/**
 * Production database service
 */
export class ProductionDatabaseService {
  private connectionPool: ConnectionPoolManager;
  private healthMonitor: DatabaseHealthMonitor;
  private migrationManager: MigrationManager;
  private schemaManager: SchemaManager;
  private isInitialized = false;
  private shutdownHandlers: (() => Promise<void>)[] = [];

  constructor() {
    this.connectionPool = new ConnectionPoolManager(PRODUCTION_CONFIG);
    this.healthMonitor = new DatabaseHealthMonitor(this.connectionPool, HEALTH_CONFIG);
    this.migrationManager = new MigrationManager();
    this.schemaManager = new SchemaManager();
    
    this.setupEventHandlers();
    this.setupGracefulShutdown();
  }

  /**
   * Initialize the production database service
   */
  async initialize(connectionString: string): Promise<void> {
    try {
      console.log('🚀 Initializing production database service...');
      
      // Initialize connection pool
      await this.connectionPool.initialize(connectionString);
      console.log('✅ Connection pool initialized');
      
      // Run migrations
      console.log('🔄 Running database migrations...');
      const migrationResult = await this.migrationManager.runPendingMigrations(
        this.connectionPool as any // Type assertion for compatibility
      );
      
      if (migrationResult.success) {
        console.log(`✅ Migrations completed: ${migrationResult.migrationsRun} migrations run`);
      } else {
        throw new Error(`Migration failed: ${migrationResult.error?.message}`);
      }
      
      // Validate schemas
      console.log('🔍 Validating database schemas...');
      const schemaValidation = await this.schemaManager.validateSchemas(
        this.connectionPool as any // Type assertion for compatibility
      );
      
      if (schemaValidation.isValid) {
        console.log('✅ Schema validation passed');
      } else {
        console.warn('⚠️ Schema validation warnings:', schemaValidation.errors);
      }
      
      // Start health monitoring
      this.healthMonitor.start();
      console.log('✅ Health monitoring started');
      
      this.isInitialized = true;
      console.log('🎉 Production database service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize production database service:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Get connection pool for database operations
   */
  getConnectionPool(): ConnectionPoolManager {
    if (!this.isInitialized) {
      throw new Error('Database service not initialized');
    }
    return this.connectionPool;
  }

  /**
   * Get health monitor for monitoring operations
   */
  getHealthMonitor(): DatabaseHealthMonitor {
    return this.healthMonitor;
  }

  /**
   * Execute a database query with full production features
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.isInitialized) {
      throw new Error('Database service not initialized');
    }
    
    return this.connectionPool.query<T>(sql, params);
  }

  /**
   * Execute a database transaction with full production features
   */
  async transaction<T>(callback: (sql: any) => Promise<T>): Promise<T> {
    if (!this.isInitialized) {
      throw new Error('Database service not initialized');
    }
    
    return this.connectionPool.transaction(callback);
  }

  /**
   * Get comprehensive health status
   */
  getHealthStatus(): {
    overall: string;
    connection: any;
    metrics: any;
    alerts: any[];
    uptime: number;
  } {
    const healthSummary = this.healthMonitor.getHealthSummary();
    const currentMetrics = this.healthMonitor.getCurrentMetrics();
    const activeAlerts = this.healthMonitor.getActiveAlerts();
    const connectionStats = this.connectionPool.getConnectionStats();
    
    return {
      overall: healthSummary.overall,
      connection: {
        healthy: healthSummary.connectionHealth,
        stats: connectionStats,
        lastHealthCheck: currentMetrics?.connectionHealth
      },
      metrics: currentMetrics,
      alerts: activeAlerts,
      uptime: healthSummary.uptime
    };
  }

  /**
   * Seed database with development data
   */
  async seedDevelopmentData(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Database service not initialized');
    }
    
    console.log('🌱 Seeding development data...');
    
    try {
      const result = await seedDevelopmentData(this.connectionPool as any);
      
      if (result.success) {
        console.log(`✅ Development data seeded: ${result.summary.totalRecords} records`);
      } else {
        throw new Error(`Seeding failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to seed development data:', error);
      throw error;
    }
  }

  /**
   * Perform manual health check
   */
  async performHealthCheck(): Promise<any> {
    return this.healthMonitor.getCurrentMetrics();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    connectionStats: any;
    queryMetrics: any;
    systemMetrics: any;
    healthHistory: any[];
  } {
    const connectionStats = this.connectionPool.getConnectionStats();
    const currentMetrics = this.healthMonitor.getCurrentMetrics();
    const healthHistory = this.healthMonitor.getMetricsHistory(
      new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );
    
    return {
      connectionStats,
      queryMetrics: currentMetrics?.queryMetrics,
      systemMetrics: currentMetrics?.systemMetrics,
      healthHistory
    };
  }

  /**
   * Setup event handlers for monitoring and logging
   */
  private setupEventHandlers(): void {
    // Connection pool events
    this.connectionPool.on('initialized', () => {
      console.log('📡 Connection pool initialized');
    });
    
    this.connectionPool.on('queryFailed', (event) => {
      console.error(`❌ Query failed: ${event.sql}`, event.error);
    });
    
    this.connectionPool.on('circuitBreakerStateChange', (event) => {
      console.log(`🔄 Circuit breaker state changed: ${event.from} -> ${event.to}`);
    });
    
    this.connectionPool.on('fallbackTriggered', (event) => {
      console.warn(`⚠️ Fallback triggered for: ${event.context}`);
    });
    
    // Health monitor events
    this.healthMonitor.on('alertTriggered', (alert) => {
      console.warn(`🚨 Health alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
      
      // In production, you might want to send alerts to external systems
      // this.sendAlertToExternalSystem(alert);
    });
    
    this.healthMonitor.on('alertResolved', (alert) => {
      console.log(`✅ Health alert resolved: ${alert.message}`);
    });
    
    this.healthMonitor.on('autoRecoveryTriggered', (event) => {
      if (event.success) {
        console.log(`🔄 Auto-recovery successful for: ${event.alert.message}`);
      } else {
        console.error(`❌ Auto-recovery failed for: ${event.alert.message}`, event.error);
      }
    });
    
    this.healthMonitor.on('metricsCollected', (metrics) => {
      // Log metrics periodically (every 5 minutes)
      if (metrics.timestamp.getMinutes() % 5 === 0) {
        console.log('📊 Health metrics:', {
          connectionLatency: metrics.connectionHealth.latency,
          queryRate: metrics.queryMetrics.queryRate,
          errorRate: metrics.queryMetrics.failedQueries / Math.max(metrics.queryMetrics.totalQueries, 1),
          poolUtilization: metrics.connectionHealth.poolUtilization
        });
      }
    });
  }

  /**
   * Setup graceful shutdown handling
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
      
      try {
        await this.cleanup();
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('❌ Uncaught exception:', error);
      await this.cleanup();
      process.exit(1);
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      await this.cleanup();
      process.exit(1);
    });
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up database service...');
    
    try {
      // Stop health monitoring
      this.healthMonitor.stop();
      
      // Execute custom shutdown handlers
      for (const handler of this.shutdownHandlers) {
        try {
          await handler();
        } catch (error) {
          console.error('❌ Error in shutdown handler:', error);
        }
      }
      
      // Shutdown connection pool
      await this.connectionPool.gracefulShutdown();
      
      this.isInitialized = false;
      console.log('✅ Database service cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Add custom shutdown handler
   */
  addShutdownHandler(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

/**
 * Example usage function
 */
export async function exampleUsage(): Promise<void> {
  const dbService = new ProductionDatabaseService();
  
  try {
    // Initialize with connection string
    await dbService.initialize(process.env.DATABASE_URL || 'postgresql://localhost:5432/triplecheck');
    
    // Seed development data if needed
    if (process.env.NODE_ENV === 'development') {
      await dbService.seedDevelopmentData();
    }
    
    // Example query
    const users = await dbService.query('SELECT * FROM users LIMIT 10');
    console.log(`Found ${users.length} users`);
    
    // Example transaction
    await dbService.transaction(async (sql) => {
      await sql`INSERT INTO users (id, name, email) VALUES (gen_random_uuid(), 'Test User', 'test@example.com')`;
      await sql`INSERT INTO properties (id, title, user_id) VALUES (gen_random_uuid(), 'Test Property', (SELECT id FROM users WHERE email = 'test@example.com'))`;
    });
    
    // Get health status
    const healthStatus = dbService.getHealthStatus();
    console.log('Health status:', healthStatus.overall);
    
    // Get performance metrics
    const metrics = dbService.getPerformanceMetrics();
    console.log('Performance metrics:', {
      totalQueries: metrics.connectionStats.totalQueries,
      averageQueryTime: metrics.connectionStats.averageQueryTime,
      errorRate: metrics.connectionStats.failedQueries / Math.max(metrics.connectionStats.totalQueries, 1)
    });
    
  } catch (error) {
    console.error('❌ Example usage failed:', error);
    throw error;
  }
}

/**
 * Express.js middleware for health checks
 */
export function createHealthCheckMiddleware(dbService: ProductionDatabaseService) {
  return async (req: any, res: any) => {
    try {
      const healthStatus = dbService.getHealthStatus();
      
      const statusCode = healthStatus.overall === 'healthy' ? 200 : 
                        healthStatus.overall === 'warning' ? 200 : 503;
      
      res.status(statusCode).json({
        status: healthStatus.overall,
        timestamp: new Date().toISOString(),
        uptime: healthStatus.uptime,
        connection: healthStatus.connection.healthy,
        activeAlerts: healthStatus.alerts.length,
        details: {
          connectionStats: healthStatus.connection.stats,
          lastHealthCheck: healthStatus.connection.lastHealthCheck,
          alerts: healthStatus.alerts.map(alert => ({
            severity: alert.severity,
            type: alert.type,
            message: alert.message,
            timestamp: alert.timestamp
          }))
        }
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Express.js middleware for metrics endpoint
 */
export function createMetricsMiddleware(dbService: ProductionDatabaseService) {
  return async (req: any, res: any) => {
    try {
      const metrics = dbService.getPerformanceMetrics();
      
      res.json({
        timestamp: new Date().toISOString(),
        connection: metrics.connectionStats,
        queries: metrics.queryMetrics,
        system: metrics.systemMetrics,
        history: metrics.healthHistory.slice(-10) // Last 10 data points
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default ProductionDatabaseService;