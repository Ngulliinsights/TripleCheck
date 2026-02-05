import { EventEmitter } from 'events';

import { logger } from './logger';
import { performanceMonitor, MetricCategory } from './PerformanceMonitor';
import { queryMonitor } from './QueryPerformanceMonitor';

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels?: string[];
}

export interface AlertRule {
  name: string;
  expression: string;
  threshold: number;
  duration: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  runbook?: string;
}

export interface DashboardConfig {
  title: string;
  description: string;
  panels: DashboardPanel[];
  refresh: string;
  timeRange: {
    from: string;
    to: string;
  };
}

export interface DashboardPanel {
  title: string;
  type: 'graph' | 'stat' | 'gauge' | 'table';
  queries: MetricQuery[];
  gridPos: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface MetricQuery {
  expr: string;
  legendFormat: string;
  refId: string;
}

export class ObservabilitySystem extends EventEmitter {
  private static instance: ObservabilitySystem;
  private metrics: Map<string, any> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private dashboards: Map<string, DashboardConfig> = new Map();
  private prometheusRegistry: any;
  private isInitialized = false;

  static getInstance(): ObservabilitySystem {
    if (!ObservabilitySystem.instance) {
      ObservabilitySystem.instance = new ObservabilitySystem();
    }
    return ObservabilitySystem.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Prometheus client
      const promClient = await import('prom-client');
      this.prometheusRegistry = new promClient.Registry();
      
      // Add default metrics
      promClient.collectDefaultMetrics({ register: this.prometheusRegistry });

      // Initialize custom metrics
      await this.initializeCustomMetrics();
      
      // Setup alert rules
      await this.setupAlertRules();
      
      // Configure dashboards
      await this.configureDashboards();

      this.isInitialized = true;
      logger.info('ObservabilitySystem initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ObservabilitySystem:', error);
      throw error;
    }
  }

  private async initializeCustomMetrics(): Promise<void> {
    const promClient = await import('prom-client');

    // Database metrics
    const dbQueryDuration = new promClient.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
      registers: [this.prometheusRegistry]
    });

    const dbQueriesTotal = new promClient.Counter({
      name: 'database_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status'],
      registers: [this.prometheusRegistry]
    });

    const dbSlowQueries = new promClient.Counter({
      name: 'database_slow_queries_total',
      help: 'Total number of slow database queries',
      labelNames: ['duration_threshold', 'table', 'operation'],
      registers: [this.prometheusRegistry]
    });

    const dbQueryErrors = new promClient.Counter({
      name: 'database_query_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['error_type', 'table', 'operation'],
      registers: [this.prometheusRegistry]
    });

    // Connection pool metrics
    const connectionPoolActive = new promClient.Gauge({
      name: 'connection_pool_active_connections',
      help: 'Number of active database connections',
      registers: [this.prometheusRegistry]
    });

    const connectionPoolIdle = new promClient.Gauge({
      name: 'connection_pool_idle_connections',
      help: 'Number of idle database connections',
      registers: [this.prometheusRegistry]
    });

    const connectionPoolWaiting = new promClient.Gauge({
      name: 'connection_pool_waiting_requests',
      help: 'Number of requests waiting for database connections',
      registers: [this.prometheusRegistry]
    });

    // Business metrics
    const landVerificationStarted = new promClient.Counter({
      name: 'land_verification_started_total',
      help: 'Total number of land verifications started',
      labelNames: ['region', 'property_type'],
      registers: [this.prometheusRegistry]
    });

    const landVerificationCompleted = new promClient.Counter({
      name: 'land_verification_completed_total',
      help: 'Total number of land verifications completed',
      labelNames: ['status', 'region', 'property_type'],
      registers: [this.prometheusRegistry]
    });

    const landVerificationDuration = new promClient.Histogram({
      name: 'land_verification_duration_seconds',
      help: 'Duration of land verification process in seconds',
      labelNames: ['status', 'complexity'],
      buckets: [60, 300, 600, 1800, 3600, 7200, 14400, 28800],
      registers: [this.prometheusRegistry]
    });

    const fraudAlertsTotal = new promClient.Counter({
      name: 'fraud_alerts_total',
      help: 'Total number of fraud alerts generated',
      labelNames: ['severity', 'type', 'region'],
      registers: [this.prometheusRegistry]
    });

    const userRegistrations = new promClient.Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['user_type', 'region'],
      registers: [this.prometheusRegistry]
    });

    const userLogins = new promClient.Counter({
      name: 'user_logins_total',
      help: 'Total number of user logins',
      labelNames: ['user_type', 'method'],
      registers: [this.prometheusRegistry]
    });

    const activeUsers = new promClient.Gauge({
      name: 'active_users_current',
      help: 'Current number of active users',
      labelNames: ['user_type'],
      registers: [this.prometheusRegistry]
    });

    const propertyListings = new promClient.Counter({
      name: 'property_listings_created_total',
      help: 'Total number of property listings created',
      labelNames: ['property_type', 'region'],
      registers: [this.prometheusRegistry]
    });

    const propertyViews = new promClient.Counter({
      name: 'property_views_total',
      help: 'Total number of property views',
      labelNames: ['property_type', 'region'],
      registers: [this.prometheusRegistry]
    });

    const propertyInquiries = new promClient.Counter({
      name: 'property_inquiries_total',
      help: 'Total number of property inquiries',
      labelNames: ['property_type', 'inquiry_type'],
      registers: [this.prometheusRegistry]
    });

    const documentAuthenticationDuration = new promClient.Histogram({
      name: 'document_authentication_duration_seconds',
      help: 'Duration of document authentication process in seconds',
      labelNames: ['document_type', 'status'],
      buckets: [1, 5, 10, 30, 60, 120, 300],
      registers: [this.prometheusRegistry]
    });

    const fraudAnalysisDuration = new promClient.Histogram({
      name: 'fraud_analysis_duration_seconds',
      help: 'Duration of fraud analysis process in seconds',
      labelNames: ['analysis_type', 'complexity'],
      buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
      registers: [this.prometheusRegistry]
    });

    const trustScoreAverage = new promClient.Gauge({
      name: 'trust_score_average',
      help: 'Average trust score by user type',
      labelNames: ['user_type', 'region'],
      registers: [this.prometheusRegistry]
    });

    const externalApiCalls = new promClient.Counter({
      name: 'external_api_calls_total',
      help: 'Total number of external API calls',
      labelNames: ['api', 'status', 'endpoint'],
      registers: [this.prometheusRegistry]
    });

    // Cache metrics
    const cacheHits = new promClient.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type', 'key_pattern'],
      registers: [this.prometheusRegistry]
    });

    const cacheMisses = new promClient.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type', 'key_pattern'],
      registers: [this.prometheusRegistry]
    });

    const redisCacheHits = new promClient.Counter({
      name: 'redis_cache_hits_total',
      help: 'Total number of Redis cache hits',
      labelNames: ['key_pattern'],
      registers: [this.prometheusRegistry]
    });

    const redisCacheMisses = new promClient.Counter({
      name: 'redis_cache_misses_total',
      help: 'Total number of Redis cache misses',
      labelNames: ['key_pattern'],
      registers: [this.prometheusRegistry]
    });

    // Store metrics for easy access
    this.metrics.set('dbQueryDuration', dbQueryDuration);
    this.metrics.set('dbQueriesTotal', dbQueriesTotal);
    this.metrics.set('dbSlowQueries', dbSlowQueries);
    this.metrics.set('dbQueryErrors', dbQueryErrors);
    this.metrics.set('connectionPoolActive', connectionPoolActive);
    this.metrics.set('connectionPoolIdle', connectionPoolIdle);
    this.metrics.set('connectionPoolWaiting', connectionPoolWaiting);
    this.metrics.set('landVerificationStarted', landVerificationStarted);
    this.metrics.set('landVerificationCompleted', landVerificationCompleted);
    this.metrics.set('landVerificationDuration', landVerificationDuration);
    this.metrics.set('fraudAlertsTotal', fraudAlertsTotal);
    this.metrics.set('userRegistrations', userRegistrations);
    this.metrics.set('userLogins', userLogins);
    this.metrics.set('activeUsers', activeUsers);
    this.metrics.set('propertyListings', propertyListings);
    this.metrics.set('propertyViews', propertyViews);
    this.metrics.set('propertyInquiries', propertyInquiries);
    this.metrics.set('documentAuthenticationDuration', documentAuthenticationDuration);
    this.metrics.set('fraudAnalysisDuration', fraudAnalysisDuration);
    this.metrics.set('trustScoreAverage', trustScoreAverage);
    this.metrics.set('externalApiCalls', externalApiCalls);
    this.metrics.set('cacheHits', cacheHits);
    this.metrics.set('cacheMisses', cacheMisses);
    this.metrics.set('redisCacheHits', redisCacheHits);
    this.metrics.set('redisCacheMisses', redisCacheMisses);
  }

  private async setupAlertRules(): Promise<void> {
    const alertRules: AlertRule[] = [
      {
        name: 'HighDatabaseQueryLatency',
        expression: 'histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m])) > 0.1',
        threshold: 0.1,
        duration: '2m',
        severity: 'high',
        description: 'Database query latency is above 100ms for 95th percentile',
        runbook: 'Check database performance, review slow queries, consider index optimization'
      },
      {
        name: 'HighDatabaseErrorRate',
        expression: 'rate(database_query_errors_total[5m]) / rate(database_queries_total[5m]) > 0.01',
        threshold: 0.01,
        duration: '1m',
        severity: 'critical',
        description: 'Database error rate is above 1%',
        runbook: 'Check database connectivity, review error logs, investigate failing queries'
      },
      {
        name: 'ConnectionPoolExhaustion',
        expression: 'connection_pool_waiting_requests > 10',
        threshold: 10,
        duration: '30s',
        severity: 'critical',
        description: 'Connection pool has more than 10 waiting requests',
        runbook: 'Check connection pool configuration, investigate long-running queries'
      },
      {
        name: 'HighLandVerificationFailureRate',
        expression: 'rate(land_verification_completed_total{status="failure"}[5m]) / rate(land_verification_completed_total[5m]) > 0.2',
        threshold: 0.2,
        duration: '2m',
        severity: 'high',
        description: 'Land verification failure rate is above 20%',
        runbook: 'Check external API connectivity, review verification logic, investigate error patterns'
      },
      {
        name: 'SlowLandVerificationProcessing',
        expression: 'histogram_quantile(0.95, rate(land_verification_duration_seconds_bucket[5m])) > 300',
        threshold: 300,
        duration: '5m',
        severity: 'medium',
        description: '95th percentile of land verification processing time is above 5 minutes',
        runbook: 'Review verification workflow, check external API performance, optimize processing logic'
      },
      {
        name: 'HighFraudAlertVolume',
        expression: 'rate(fraud_alerts_total{severity="critical"}[5m]) > 0.1',
        threshold: 0.1,
        duration: '1m',
        severity: 'high',
        description: 'Critical fraud alerts are being generated at high volume',
        runbook: 'Review fraud detection patterns, investigate potential attack, validate alert accuracy'
      },
      {
        name: 'LowCacheHitRate',
        expression: 'rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m])) < 0.8',
        threshold: 0.8,
        duration: '5m',
        severity: 'medium',
        description: 'Cache hit rate is below 80%',
        runbook: 'Review cache configuration, check cache expiration policies, investigate cache invalidation patterns'
      },
      {
        name: 'ExternalAPIHighFailureRate',
        expression: 'rate(external_api_calls_total{status="failure"}[5m]) / rate(external_api_calls_total[5m]) > 0.1',
        threshold: 0.1,
        duration: '2m',
        severity: 'high',
        description: 'External API failure rate is above 10%',
        runbook: 'Check external API status, review API credentials, implement circuit breaker if needed'
      }
    ];

    alertRules.forEach(rule => {
      this.alertRules.set(rule.name, rule);
    });

    logger.info(`Configured ${alertRules.length} alert rules`);
  }

  private async configureDashboards(): Promise<void> {
    // Dashboard configurations are already created as JSON files
    // This method can be used to programmatically generate or update dashboards
    logger.info('Dashboard configurations loaded from JSON files');
  }

  // Metric recording methods
  recordDatabaseQuery(operation: string, table: string, duration: number, status: 'success' | 'error' = 'success'): void {
    const dbQueryDuration = this.metrics.get('dbQueryDuration');
    const dbQueriesTotal = this.metrics.get('dbQueriesTotal');
    const dbSlowQueries = this.metrics.get('dbSlowQueries');

    if (dbQueryDuration) {
      dbQueryDuration.observe({ operation, table, status }, duration / 1000);
    }

    if (dbQueriesTotal) {
      dbQueriesTotal.inc({ operation, table, status });
    }

    // Record slow queries
    if (duration > 1000 && dbSlowQueries) { // > 1 second
      dbSlowQueries.inc({ duration_threshold: '1000', table, operation });
    }
    if (duration > 5000 && dbSlowQueries) { // > 5 seconds
      dbSlowQueries.inc({ duration_threshold: '5000', table, operation });
    }
  }

  recordDatabaseError(errorType: string, table: string, operation: string): void {
    const dbQueryErrors = this.metrics.get('dbQueryErrors');
    if (dbQueryErrors) {
      dbQueryErrors.inc({ error_type: errorType, table, operation });
    }
  }

  updateConnectionPoolMetrics(active: number, idle: number, waiting: number): void {
    const connectionPoolActive = this.metrics.get('connectionPoolActive');
    const connectionPoolIdle = this.metrics.get('connectionPoolIdle');
    const connectionPoolWaiting = this.metrics.get('connectionPoolWaiting');

    if (connectionPoolActive) connectionPoolActive.set(active);
    if (connectionPoolIdle) connectionPoolIdle.set(idle);
    if (connectionPoolWaiting) connectionPoolWaiting.set(waiting);
  }

  recordLandVerificationStarted(region: string, propertyType: string): void {
    const landVerificationStarted = this.metrics.get('landVerificationStarted');
    if (landVerificationStarted) {
      landVerificationStarted.inc({ region, property_type: propertyType });
    }
  }

  recordLandVerificationCompleted(status: string, region: string, propertyType: string, duration: number): void {
    const landVerificationCompleted = this.metrics.get('landVerificationCompleted');
    const landVerificationDuration = this.metrics.get('landVerificationDuration');

    if (landVerificationCompleted) {
      landVerificationCompleted.inc({ status, region, property_type: propertyType });
    }

    if (landVerificationDuration) {
      const complexity = duration > 3600 ? 'high' : duration > 1800 ? 'medium' : 'low';
      landVerificationDuration.observe({ status, complexity }, duration);
    }
  }

  recordFraudAlert(severity: string, type: string, region: string): void {
    const fraudAlertsTotal = this.metrics.get('fraudAlertsTotal');
    if (fraudAlertsTotal) {
      fraudAlertsTotal.inc({ severity, type, region });
    }
  }

  recordUserRegistration(userType: string, region: string): void {
    const userRegistrations = this.metrics.get('userRegistrations');
    if (userRegistrations) {
      userRegistrations.inc({ user_type: userType, region });
    }
  }

  recordUserLogin(userType: string, method: string): void {
    const userLogins = this.metrics.get('userLogins');
    if (userLogins) {
      userLogins.inc({ user_type: userType, method });
    }
  }

  updateActiveUsers(userType: string, count: number): void {
    const activeUsers = this.metrics.get('activeUsers');
    if (activeUsers) {
      activeUsers.set({ user_type: userType }, count);
    }
  }

  recordPropertyListing(propertyType: string, region: string): void {
    const propertyListings = this.metrics.get('propertyListings');
    if (propertyListings) {
      propertyListings.inc({ property_type: propertyType, region });
    }
  }

  recordPropertyView(propertyType: string, region: string): void {
    const propertyViews = this.metrics.get('propertyViews');
    if (propertyViews) {
      propertyViews.inc({ property_type: propertyType, region });
    }
  }

  recordPropertyInquiry(propertyType: string, inquiryType: string): void {
    const propertyInquiries = this.metrics.get('propertyInquiries');
    if (propertyInquiries) {
      propertyInquiries.inc({ property_type: propertyType, inquiry_type: inquiryType });
    }
  }

  recordDocumentAuthentication(documentType: string, duration: number, status: string): void {
    const documentAuthenticationDuration = this.metrics.get('documentAuthenticationDuration');
    if (documentAuthenticationDuration) {
      documentAuthenticationDuration.observe({ document_type: documentType, status }, duration / 1000);
    }
  }

  recordFraudAnalysis(analysisType: string, duration: number, complexity: string): void {
    const fraudAnalysisDuration = this.metrics.get('fraudAnalysisDuration');
    if (fraudAnalysisDuration) {
      fraudAnalysisDuration.observe({ analysis_type: analysisType, complexity }, duration / 1000);
    }
  }

  updateTrustScore(userType: string, region: string, averageScore: number): void {
    const trustScoreAverage = this.metrics.get('trustScoreAverage');
    if (trustScoreAverage) {
      trustScoreAverage.set({ user_type: userType, region }, averageScore);
    }
  }

  recordExternalApiCall(api: string, endpoint: string, status: string): void {
    const externalApiCalls = this.metrics.get('externalApiCalls');
    if (externalApiCalls) {
      externalApiCalls.inc({ api, status, endpoint });
    }
  }

  recordCacheHit(cacheType: string, keyPattern: string): void {
    const cacheHits = this.metrics.get('cacheHits');
    if (cacheHits) {
      cacheHits.inc({ cache_type: cacheType, key_pattern: keyPattern });
    }
  }

  recordCacheMiss(cacheType: string, keyPattern: string): void {
    const cacheMisses = this.metrics.get('cacheMisses');
    if (cacheMisses) {
      cacheMisses.inc({ cache_type: cacheType, key_pattern: keyPattern });
    }
  }

  recordRedisCacheHit(keyPattern: string): void {
    const redisCacheHits = this.metrics.get('redisCacheHits');
    if (redisCacheHits) {
      redisCacheHits.inc({ key_pattern: keyPattern });
    }
  }

  recordRedisCacheMiss(keyPattern: string): void {
    const redisCacheMisses = this.metrics.get('redisCacheMisses');
    if (redisCacheMisses) {
      redisCacheMisses.inc({ key_pattern: keyPattern });
    }
  }

  // Prometheus metrics endpoint
  async getMetrics(): Promise<string> {
    if (!this.prometheusRegistry) {
      throw new Error('ObservabilitySystem not initialized');
    }
    return this.prometheusRegistry.metrics();
  }

  // Alert evaluation (simplified - in production, use Prometheus Alertmanager)
  evaluateAlerts(): void {
    // This is a simplified alert evaluation
    // In production, Prometheus Alertmanager would handle this
    this.alertRules.forEach((rule, name) => {
      // Simplified alert logic - in reality, this would query Prometheus
      logger.debug(`Evaluating alert rule: ${name}`);
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const details = {
        initialized: this.isInitialized,
        metricsCount: this.metrics.size,
        alertRulesCount: this.alertRules.size,
        dashboardsCount: this.dashboards.size
      };

      return {
        status: this.isInitialized ? 'healthy' : 'unhealthy',
        details
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }
}

// Export singleton instance
export const observabilitySystem = ObservabilitySystem.getInstance();