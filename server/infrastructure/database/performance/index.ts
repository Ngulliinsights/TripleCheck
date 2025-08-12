/**
 * Database Performance Testing and Optimization System
 * 
 * Comprehensive performance testing, load testing, certification, and monitoring
 * system for production database validation.
 */

// Core Components
export { 
  LoadTestingFramework,
  createLoadTestingFramework,
  getLoadTestingFramework
} from './LoadTestingFramework';

export {
  PerformanceCertificationSystem,
  createPerformanceCertificationSystem,
  getPerformanceCertificationSystem
} from './PerformanceCertificationSystem';

export {
  PerformanceMonitoringDashboard,
  createPerformanceMonitoringDashboard,
  getPerformanceMonitoringDashboard
} from './PerformanceMonitoringDashboard';

// Types and Interfaces
export type {
  LoadTestConfig,
  LoadTestMetrics,
  LoadTestResult
} from './LoadTestingFramework';

export type {
  CertificationConfig,
  CertificationResult
} from './PerformanceCertificationSystem';

export type {
  DashboardConfig,
  PerformanceMetrics
} from './PerformanceMonitoringDashboard';

// Default Configurations
export const DEFAULT_LOAD_TEST_CONFIG = {
  testDuration: 300000,               // 5 minutes
  warmupDuration: 30000,              // 30 seconds
  cooldownDuration: 10000,            // 10 seconds
  maxConcurrentUsers: 1000,
  rampUpDuration: 60000,              // 1 minute
  rampDownDuration: 30000,            // 30 seconds
  performanceTargets: {
    avgResponseTime: 50,
    p95ResponseTime: 100,
    p99ResponseTime: 200,
    throughput: 10000,
    errorRate: 0.0001,
    connectionSuccessRate: 0.9999
  },
  resourceMonitoring: {
    enabled: true,
    cpuThreshold: 0.7,
    memoryThreshold: 0.8,
    diskIOThreshold: 0.8,
    connectionPoolThreshold: 0.8
  },
  reporting: {
    enableRealTimeMetrics: true,
    metricsInterval: 5000,
    enableDetailedLogging: true,
    generateReport: true,
    reportFormat: 'json'
  }
};

export const DEFAULT_CERTIFICATION_CONFIG = {
  targets: {
    avgResponseTime: 50,
    p95ResponseTime: 100,
    p99ResponseTime: 200,
    sustainedThroughput: 10000,
    peakThroughput: 15000,
    concurrentConnections: 1000,
    uptime: 0.9999,
    errorRate: 0.0001,
    connectionSuccessRate: 0.9999,
    maxCpuUtilization: 0.7,
    maxMemoryUtilization: 0.8,
    maxDiskIOUtilization: 0.8,
    maxConnectionPoolUtilization: 0.8
  },
  certification: {
    passingScore: 85,
    criticalFailureThreshold: 0,
    requiredScenarios: ['normal_load', 'peak_load', 'stress_test'],
    validityPeriod: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  reporting: {
    generateDetailedReport: true,
    includeRecommendations: true,
    includePerformanceGraphs: true,
    reportFormats: ['json', 'html'],
    outputDirectory: './database/performance/reports'
  }
};

export const DEFAULT_DASHBOARD_CONFIG = {
  refreshInterval: 5000,
  metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
  alertThresholds: {
    avgResponseTime: 100,
    p95ResponseTime: 200,
    errorRate: 0.01,
    connectionUtilization: 0.8,
    cpuUtilization: 0.8,
    memoryUtilization: 0.85
  },
  enableAlerts: true,
  outputDirectory: './database/performance/dashboard'
};

// Utility Functions
export function createPerformanceTestSuite(pool: any, config?: any) {
  const loadTesting = createLoadTestingFramework(pool, config?.loadTest);
  const certification = createPerformanceCertificationSystem(pool, config?.certification);
  const dashboard = createPerformanceMonitoringDashboard(pool, config?.dashboard);

  return {
    loadTesting,
    certification,
    dashboard,
    
    async runComprehensiveTest() {
      // Start monitoring
      await dashboard.startMonitoring();
      
      try {
        // Run load test
        const loadTestResult = await loadTesting.executeLoadTest();
        
        // Run certification
        const certificationResult = await certification.executeCertification();
        
        return {
          loadTest: loadTestResult,
          certification: certificationResult,
          monitoring: dashboard.getCurrentMetrics()
        };
      } finally {
        await dashboard.stopMonitoring();
      }
    }
  };
}