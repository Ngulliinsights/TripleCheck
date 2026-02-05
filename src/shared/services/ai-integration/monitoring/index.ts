/**
 * AI Monitoring and Testing Suite
 * 
 * Comprehensive monitoring, testing, and analytics system for AI services.
 * Provides metrics collection, health monitoring, performance dashboards,
 * and comprehensive testing capabilities.
 */

// Metrics Collection
export {
  AIMetricsCollector,
  aiMetricsCollector,
  type AIOperationMetrics,
  type AIServiceMetrics,
  type AISystemMetrics,
  type CostBreakdown,
  type UsageAnalytics
} from './ai-metrics-collector'

// Health Monitoring
export {
  AIHealthMonitor,
  aiHealthMonitor,
  type HealthCheckResult,
  type ServiceHealthThresholds,
  type SystemHealthStatus,
  type HealthAlert,
  type HealthMonitorConfig
} from './ai-health-monitor'

// Performance Dashboard
export {
  AIPerformanceDashboard,
  aiPerformanceDashboard,
  type DashboardMetrics,
  type PerformanceInsights,
  type DashboardRecommendation,
  type DashboardConfig
} from './ai-performance-dashboard'

// Testing Suite
export {
  AITestSuite,
  aiTestUtils,
  type AITestConfig,
  type AITestResult,
  type AITestSuiteReport
} from '../__tests__/ai-test-suite'

// Comprehensive Test Runner
export {
  ComprehensiveAITestRunner,
  type ComprehensiveTestConfig,
  type ComprehensiveTestReport
} from '../__tests__/comprehensive-ai-test-runner'

/**
 * Initialize all monitoring systems
 */
export async function initializeAIMonitoring(config?: {
  metrics?: boolean;
  health?: boolean;
  dashboard?: boolean;
}): Promise<{
  metricsCollector: AIMetricsCollector;
  healthMonitor: AIHealthMonitor;
  performanceDashboard: AIPerformanceDashboard;
}> {
  const { metrics = true, health = true, dashboard = true } = config || {};

  const systems = {
    metricsCollector: aiMetricsCollector,
    healthMonitor: aiHealthMonitor,
    performanceDashboard: aiPerformanceDashboard
  };

  // Initialize systems based on configuration
  if (health) {
    // Perform initial health checks
    await aiHealthMonitor.getSystemHealthStatus();
  }

  if (dashboard) {
    // Get initial dashboard metrics
    await aiPerformanceDashboard.getCurrentMetrics();
  }

  return systems;
}

/**
 * Get comprehensive AI system status
 */
export async function getAISystemStatus(): Promise<{
  health: SystemHealthStatus;
  metrics: AISystemMetrics;
  dashboard: DashboardMetrics;
  timestamp: Date;
}> {
  const [health, metrics, dashboard] = await Promise.all([
    aiHealthMonitor.getSystemHealthStatus(),
    Promise.resolve(aiMetricsCollector.getSystemMetrics()),
    aiPerformanceDashboard.getCurrentMetrics()
  ]);

  return {
    health,
    metrics,
    dashboard,
    timestamp: new Date()
  };
}

/**
 * Run quick AI system health check
 */
export async function quickAIHealthCheck(): Promise<{
  healthy: boolean;
  issues: string[];
  summary: {
    services: number;
    healthyServices: number;
    alerts: number;
    uptime: number;
  };
}> {
  try {
    const [healthStatus, systemMetrics] = await Promise.all([
      aiHealthMonitor.getSystemHealthStatus(),
      Promise.resolve(aiMetricsCollector.getSystemMetrics())
    ]);

    const healthy = healthStatus.overallStatus === 'healthy';
    const issues: string[] = [];

    if (healthStatus.overallStatus !== 'healthy') {
      issues.push(`System status: ${healthStatus.overallStatus}`);
    }

    if (healthStatus.alerts.length > 0) {
      issues.push(`${healthStatus.alerts.length} active alerts`);
    }

    if (systemMetrics.overallErrorRate > 0.1) {
      issues.push(`High error rate: ${(systemMetrics.overallErrorRate * 100).toFixed(1)}%`);
    }

    return {
      healthy,
      issues,
      summary: {
        services: Object.keys(systemMetrics.services).length,
        healthyServices: Object.values(healthStatus.servicesStatus).filter(s => s === 'healthy').length,
        alerts: healthStatus.alerts.length,
        uptime: healthStatus.uptime
      }
    };
  } catch (error) {
    return {
      healthy: false,
      issues: [`Health check failed: ${error instanceof Error ? error.message : String(error)}`],
      summary: {
        services: 0,
        healthyServices: 0,
        alerts: 0,
        uptime: 0
      }
    };
  }
}

/**
 * Export all monitoring data for analysis
 */
export function exportAllMonitoringData(format: 'json' | 'csv' = 'json'): {
  metrics: string;
  dashboard: string;
  health: string;
  timestamp: string;
} {
  const timestamp = new Date().toISOString();
  
  return {
    metrics: aiMetricsCollector.exportMetrics(format),
    dashboard: aiPerformanceDashboard.exportDashboardData(format),
    health: JSON.stringify(aiHealthMonitor.exportHealthData(), null, 2),
    timestamp
  };
}

/**
 * Cleanup all monitoring systems
 */
export function cleanupAIMonitoring(): void {
  aiMetricsCollector.destroy();
  aiHealthMonitor.destroy();
  aiPerformanceDashboard.destroy();
}