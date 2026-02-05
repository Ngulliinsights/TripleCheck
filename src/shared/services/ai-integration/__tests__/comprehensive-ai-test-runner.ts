/**
 * Comprehensive AI Test Runner
 * 
 * Orchestrates comprehensive testing of AI services including real API tests,
 * mock tests, performance monitoring, health checks, and usage analytics.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { AITestSuite, AITestConfig, AITestSuiteReport, aiTestUtils } from './ai-test-suite'
import { aiMetricsCollector } from '../monitoring/ai-metrics-collector'
import { aiHealthMonitor } from '../monitoring/ai-health-monitor'
import { aiPerformanceDashboard } from '../monitoring/ai-performance-dashboard'
import { logger as loggingService } from '../../../../../core/src/logging'

export interface ComprehensiveTestConfig extends AITestConfig {
  testModes: {
    mockOnly: boolean;
    realAPI: boolean;
    performance: boolean;
    stress: boolean;
    monitoring: boolean;
  };
  reporting: {
    generateReport: boolean;
    exportMetrics: boolean;
    saveDashboard: boolean;
  };
  cleanup: {
    clearMetrics: boolean;
    resetHealth: boolean;
  };
}

export interface ComprehensiveTestReport {
  testSuite: AITestSuiteReport;
  monitoring: {
    systemMetrics: any;
    healthStatus: any;
    dashboardMetrics: any;
  };
  performance: {
    benchmarks: any[];
    bottlenecks: any[];
    recommendations: any[];
  };
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    executionTime: number;
    overallStatus: 'passed' | 'failed' | 'partial';
  };
  exports: {
    metricsExport?: string;
    dashboardExport?: string;
    healthExport?: string;
  };
}

export class ComprehensiveAITestRunner {
  private config: ComprehensiveTestConfig;
  private startTime: number = 0;

  constructor(config?: Partial<ComprehensiveTestConfig>) {
    this.config = {
      useRealAPI: false,
      enablePerformanceTests: true,
      enableHealthChecks: true,
      enableUsageTracking: true,
      testTimeout: 30000,
      performanceThresholds: {
        maxResponseTime: 5000,
        maxErrorRate: 0.1,
        minSuccessRate: 0.9
      },
      testModes: {
        mockOnly: true,
        realAPI: false,
        performance: true,
        stress: false,
        monitoring: true
      },
      reporting: {
        generateReport: true,
        exportMetrics: true,
        saveDashboard: true
      },
      cleanup: {
        clearMetrics: false,
        resetHealth: false
      },
      ...config
    };
  }

  /**
   * Run comprehensive AI service tests
   */
  async runComprehensiveTests(): Promise<ComprehensiveTestReport> {
    this.startTime = Date.now();

    loggingService.info('Starting comprehensive AI test runner', {
      module: 'ComprehensiveAITestRunner',
      config: this.config
    });

    try {
      // Initialize monitoring systems
      await this.initializeTestEnvironment();

      // Run test suites based on configuration
      const testResults = await this.executeTestSuites();

      // Collect monitoring data
      const monitoringData = await this.collectMonitoringData();

      // Generate performance analysis
      const performanceAnalysis = await this.analyzePerformance();

      // Generate comprehensive report
      const report = await this.generateComprehensiveReport(
        testResults,
        monitoringData,
        performanceAnalysis
      );

      // Cleanup if requested
      if (this.config.cleanup.clearMetrics || this.config.cleanup.resetHealth) {
        await this.cleanupTestEnvironment();
      }

      loggingService.info('Comprehensive AI tests completed', {
        module: 'ComprehensiveAITestRunner',
        executionTime: Date.now() - this.startTime,
        overallStatus: report.summary.overallStatus,
        totalTests: report.summary.totalTests,
        passedTests: report.summary.passedTests
      });

      return report;
    } catch (error) {
      loggingService.error('Comprehensive AI tests failed', {
        module: 'ComprehensiveAITestRunner',
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - this.startTime
      });

      throw error;
    }
  }

  /**
   * Run specific test category
   */
  async runTestCategory(category: 'mock' | 'real' | 'performance' | 'stress' | 'monitoring'): Promise<AITestSuiteReport> {
    const testConfig: Partial<AITestConfig> = {
      ...this.config,
      useRealAPI: category === 'real',
      enablePerformanceTests: ['performance', 'stress'].includes(category),
      enableHealthChecks: category === 'monitoring',
      enableUsageTracking: category === 'monitoring'
    };

    const testSuite = new AITestSuite(testConfig);
    return await testSuite.runFullTestSuite();
  }

  /**
   * Get current system health for testing
   */
  async getSystemHealthForTesting(): Promise<{
    healthy: boolean;
    issues: string[];
    metrics: any;
  }> {
    try {
      const healthCheck = await aiTestUtils.quickHealthCheck();
      const metrics = await aiTestUtils.getCurrentMetrics();

      return {
        healthy: healthCheck.healthy,
        issues: healthCheck.issues,
        metrics
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [`Health check failed: ${error instanceof Error ? error.message : String(error)}`],
        metrics: {}
      };
    }
  }

  /**
   * Run performance benchmarks
   */
  async runPerformanceBenchmarks(): Promise<{
    benchmarks: Array<{
      name: string;
      service: string;
      averageTime: number;
      minTime: number;
      maxTime: number;
      successRate: number;
      throughput: number;
    }>;
    summary: {
      totalBenchmarks: number;
      averagePerformance: number;
      performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    };
  }> {
    const benchmarks = [];
    const services = ['propertyAnalysis', 'documentProcessing', 'fraudDetection', 'recommendations'];

    for (const service of services) {
      const benchmark = await this.runServiceBenchmark(service);
      benchmarks.push(benchmark);
    }

    const averagePerformance = benchmarks.reduce((sum, b) => sum + b.averageTime, 0) / benchmarks.length;
    const performanceGrade = this.calculatePerformanceGrade(averagePerformance);

    return {
      benchmarks,
      summary: {
        totalBenchmarks: benchmarks.length,
        averagePerformance,
        performanceGrade
      }
    };
  }

  // Private helper methods

  private async initializeTestEnvironment(): Promise<void> {
    loggingService.info('Initializing test environment', {
      module: 'ComprehensiveAITestRunner'
    });

    // Clear metrics if requested
    if (this.config.cleanup.clearMetrics) {
      aiMetricsCollector.clearOldMetrics(0); // Clear all metrics
    }

    // Initialize monitoring systems
    if (this.config.testModes.monitoring) {
      // Ensure monitoring systems are ready
      const systemMetrics = aiMetricsCollector.getSystemMetrics();
      const healthStatus = await aiHealthMonitor.getSystemHealthStatus();
      
      loggingService.debug('Monitoring systems initialized', {
        module: 'ComprehensiveAITestRunner',
        metricsAvailable: !!systemMetrics,
        healthStatusAvailable: !!healthStatus
      });
    }
  }

  private async executeTestSuites(): Promise<AITestSuiteReport[]> {
    const testResults: AITestSuiteReport[] = [];

    // Mock tests (always run)
    if (this.config.testModes.mockOnly) {
      loggingService.info('Running mock API tests', {
        module: 'ComprehensiveAITestRunner'
      });

      const mockTestSuite = new AITestSuite({
        ...this.config,
        useRealAPI: false
      });
      const mockResults = await mockTestSuite.runFullTestSuite();
      testResults.push(mockResults);
    }

    // Real API tests (if enabled and configured)
    if (this.config.testModes.realAPI && this.config.useRealAPI) {
      loggingService.info('Running real API tests', {
        module: 'ComprehensiveAITestRunner'
      });

      const realTestSuite = new AITestSuite({
        ...this.config,
        useRealAPI: true
      });
      const realResults = await realTestSuite.runFullTestSuite();
      testResults.push(realResults);
    }

    // Performance tests
    if (this.config.testModes.performance) {
      loggingService.info('Running performance tests', {
        module: 'ComprehensiveAITestRunner'
      });

      const perfTestSuite = new AITestSuite({
        ...this.config,
        enablePerformanceTests: true
      });
      const perfResults = await perfTestSuite.runFullTestSuite();
      testResults.push(perfResults);
    }

    // Stress tests
    if (this.config.testModes.stress) {
      loggingService.info('Running stress tests', {
        module: 'ComprehensiveAITestRunner'
      });

      const stressTestSuite = new AITestSuite({
        ...this.config,
        enablePerformanceTests: true,
        testTimeout: 60000 // Longer timeout for stress tests
      });
      const stressResults = await stressTestSuite.runFullTestSuite();
      testResults.push(stressResults);
    }

    return testResults;
  }

  private async collectMonitoringData(): Promise<{
    systemMetrics: any;
    healthStatus: any;
    dashboardMetrics: any;
  }> {
    try {
      const [systemMetrics, healthStatus, dashboardMetrics] = await Promise.all([
        Promise.resolve(aiMetricsCollector.getSystemMetrics()),
        aiHealthMonitor.getSystemHealthStatus(),
        aiPerformanceDashboard.getCurrentMetrics()
      ]);

      return {
        systemMetrics,
        healthStatus,
        dashboardMetrics
      };
    } catch (error) {
      loggingService.warn('Failed to collect some monitoring data', {
        module: 'ComprehensiveAITestRunner',
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        systemMetrics: aiMetricsCollector.getSystemMetrics(),
        healthStatus: { status: 'unknown', error: 'Failed to get health status' },
        dashboardMetrics: { error: 'Failed to get dashboard metrics' }
      };
    }
  }

  private async analyzePerformance(): Promise<{
    benchmarks: any[];
    bottlenecks: any[];
    recommendations: any[];
  }> {
    try {
      const dashboardMetrics = await aiPerformanceDashboard.getCurrentMetrics();
      const benchmarks = await this.runPerformanceBenchmarks();

      return {
        benchmarks: benchmarks.benchmarks,
        bottlenecks: dashboardMetrics.performanceInsights?.bottlenecks || [],
        recommendations: dashboardMetrics.recommendations || []
      };
    } catch (error) {
      loggingService.warn('Failed to analyze performance', {
        module: 'ComprehensiveAITestRunner',
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        benchmarks: [],
        bottlenecks: [],
        recommendations: []
      };
    }
  }

  private async generateComprehensiveReport(
    testResults: AITestSuiteReport[],
    monitoringData: any,
    performanceAnalysis: any
  ): Promise<ComprehensiveTestReport> {
    // Combine all test results
    const combinedResults = this.combineTestResults(testResults);

    // Calculate summary
    const summary = {
      totalTests: combinedResults.totalTests,
      passedTests: combinedResults.passedTests,
      failedTests: combinedResults.failedTests,
      executionTime: Date.now() - this.startTime,
      overallStatus: this.determineOverallStatus(combinedResults)
    };

    // Generate exports if requested
    const exports: any = {};
    if (this.config.reporting.exportMetrics) {
      exports.metricsExport = aiMetricsCollector.exportMetrics('json');
    }
    if (this.config.reporting.saveDashboard) {
      exports.dashboardExport = aiPerformanceDashboard.exportDashboardData('json');
    }
    exports.healthExport = JSON.stringify(monitoringData.healthStatus, null, 2);

    return {
      testSuite: combinedResults,
      monitoring: monitoringData,
      performance: performanceAnalysis,
      summary,
      exports
    };
  }

  private combineTestResults(testResults: AITestSuiteReport[]): AITestSuiteReport {
    if (testResults.length === 0) {
      return {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        testResults: [],
        performanceMetrics: [],
        healthStatus: {},
        usageAnalytics: {}
      };
    }

    if (testResults.length === 1) {
      return testResults[0];
    }

    // Combine multiple test results
    const combined = {
      totalTests: testResults.reduce((sum, r) => sum + r.totalTests, 0),
      passedTests: testResults.reduce((sum, r) => sum + r.passedTests, 0),
      failedTests: testResults.reduce((sum, r) => sum + r.failedTests, 0),
      averageResponseTime: testResults.reduce((sum, r) => sum + r.averageResponseTime, 0) / testResults.length,
      errorRate: testResults.reduce((sum, r) => sum + r.errorRate, 0) / testResults.length,
      testResults: testResults.flatMap(r => r.testResults),
      performanceMetrics: testResults.flatMap(r => r.performanceMetrics),
      healthStatus: testResults[testResults.length - 1].healthStatus, // Use latest
      usageAnalytics: testResults[testResults.length - 1].usageAnalytics // Use latest
    };

    return combined;
  }

  private determineOverallStatus(results: AITestSuiteReport): 'passed' | 'failed' | 'partial' {
    if (results.totalTests === 0) return 'failed';
    if (results.failedTests === 0) return 'passed';
    if (results.passedTests === 0) return 'failed';
    return 'partial';
  }

  private async runServiceBenchmark(service: string): Promise<{
    name: string;
    service: string;
    averageTime: number;
    minTime: number;
    maxTime: number;
    successRate: number;
    throughput: number;
  }> {
    const iterations = 10;
    const times: number[] = [];
    let successes = 0;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const operationStart = Date.now();
      
      try {
        // Simulate service operation
        const operationId = aiMetricsCollector.startOperation(service, 'benchmark_test');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        
        aiMetricsCollector.completeOperation(operationId, {
          tokensUsed: 25,
          cost: 0.005
        });
        
        const operationTime = Date.now() - operationStart;
        times.push(operationTime);
        successes++;
      } catch (error) {
        const operationTime = Date.now() - operationStart;
        times.push(operationTime);
      }
    }

    const totalTime = Date.now() - startTime;
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = successes / iterations;
    const throughput = iterations / (totalTime / 1000); // Operations per second

    return {
      name: `${service} Benchmark`,
      service,
      averageTime,
      minTime,
      maxTime,
      successRate,
      throughput
    };
  }

  private calculatePerformanceGrade(averageTime: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (averageTime < 100) return 'A';
    if (averageTime < 250) return 'B';
    if (averageTime < 500) return 'C';
    if (averageTime < 1000) return 'D';
    return 'F';
  }

  private async cleanupTestEnvironment(): Promise<void> {
    loggingService.info('Cleaning up test environment', {
      module: 'ComprehensiveAITestRunner'
    });

    if (this.config.cleanup.clearMetrics) {
      aiMetricsCollector.clearOldMetrics(0);
    }

    // Additional cleanup can be added here
  }
}

// Vitest test suite integration
describe('Comprehensive AI Service Testing', () => {
  let testRunner: ComprehensiveAITestRunner;
  let testReport: ComprehensiveTestReport;

  beforeAll(async () => {
    testRunner = new ComprehensiveAITestRunner({
      testModes: {
        mockOnly: true,
        realAPI: false, // Set to true if you want to test real APIs
        performance: true,
        stress: false, // Set to true for stress testing
        monitoring: true
      },
      reporting: {
        generateReport: true,
        exportMetrics: true,
        saveDashboard: true
      }
    });
  });

  afterAll(async () => {
    // Cleanup after all tests
    if (testRunner) {
      await testRunner.cleanupTestEnvironment();
    }
  });

  it('should run comprehensive AI service tests', async () => {
    testReport = await testRunner.runComprehensiveTests();
    
    expect(testReport).toBeDefined();
    expect(testReport.summary.totalTests).toBeGreaterThan(0);
    expect(testReport.summary.overallStatus).toMatch(/^(passed|failed|partial)$/);
  }, 120000); // 2 minute timeout

  it('should have monitoring data available', async () => {
    expect(testReport.monitoring).toBeDefined();
    expect(testReport.monitoring.systemMetrics).toBeDefined();
    expect(testReport.monitoring.healthStatus).toBeDefined();
  });

  it('should have performance analysis', async () => {
    expect(testReport.performance).toBeDefined();
    expect(Array.isArray(testReport.performance.benchmarks)).toBe(true);
    expect(Array.isArray(testReport.performance.bottlenecks)).toBe(true);
    expect(Array.isArray(testReport.performance.recommendations)).toBe(true);
  });

  it('should generate exports when requested', async () => {
    expect(testReport.exports).toBeDefined();
    expect(testReport.exports.metricsExport).toBeDefined();
    expect(testReport.exports.dashboardExport).toBeDefined();
    expect(testReport.exports.healthExport).toBeDefined();
  });

  it('should have acceptable performance metrics', async () => {
    const { summary } = testReport;
    
    // At least 80% of tests should pass
    const passRate = summary.passedTests / summary.totalTests;
    expect(passRate).toBeGreaterThanOrEqual(0.8);
    
    // Execution time should be reasonable (less than 2 minutes)
    expect(summary.executionTime).toBeLessThan(120000);
  });

  it('should run individual test categories', async () => {
    const mockResults = await testRunner.runTestCategory('mock');
    expect(mockResults.totalTests).toBeGreaterThan(0);
    
    const performanceResults = await testRunner.runTestCategory('performance');
    expect(performanceResults.totalTests).toBeGreaterThan(0);
    
    const monitoringResults = await testRunner.runTestCategory('monitoring');
    expect(monitoringResults.totalTests).toBeGreaterThan(0);
  });

  it('should check system health', async () => {
    const healthStatus = await testRunner.getSystemHealthForTesting();
    expect(healthStatus).toBeDefined();
    expect(typeof healthStatus.healthy).toBe('boolean');
    expect(Array.isArray(healthStatus.issues)).toBe(true);
  });

  it('should run performance benchmarks', async () => {
    const benchmarks = await testRunner.runPerformanceBenchmarks();
    expect(benchmarks.benchmarks).toBeDefined();
    expect(benchmarks.summary).toBeDefined();
    expect(benchmarks.summary.performanceGrade).toMatch(/^[A-F]$/);
  });
});

// Export for use in other test files
export type { ComprehensiveTestConfig, ComprehensiveTestReport };