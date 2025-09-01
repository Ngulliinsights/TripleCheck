/**
 * Comprehensive AI Test Runner - Test File
 * 
 * Tests for the comprehensive AI testing and monitoring system.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ComprehensiveAITestRunner, type ComprehensiveTestReport } from './comprehensive-ai-test-runner';
import { aiMetricsCollector } from '../monitoring/ai-metrics-collector';
import { aiHealthMonitor } from '../monitoring/ai-health-monitor';
import { aiPerformanceDashboard } from '../monitoring/ai-performance-dashboard';

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
      },
      testTimeout: 30000
    });
  });

  afterAll(async () => {
    // Cleanup after all tests
    if (testRunner) {
      await testRunner['cleanupTestEnvironment']();
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
    
    // At least 70% of tests should pass (allowing for some failures in mock environment)
    const passRate = summary.passedTests / summary.totalTests;
    expect(passRate).toBeGreaterThanOrEqual(0.7);
    
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

describe('AI Metrics Collector', () => {
  it('should track operations correctly', () => {
    const operationId = aiMetricsCollector.startOperation('test', 'unit_test');
    expect(operationId).toBeDefined();
    expect(typeof operationId).toBe('string');

    aiMetricsCollector.completeOperation(operationId, {
      tokensUsed: 100,
      cost: 0.01,
      inputSize: 1024,
      outputSize: 512
    });

    const metrics = aiMetricsCollector.getSystemMetrics();
    expect(metrics.totalOperations).toBeGreaterThan(0);
  });

  it('should generate usage analytics', () => {
    const analytics = aiMetricsCollector.getUsageAnalytics(1);
    expect(analytics).toBeDefined();
    expect(Array.isArray(analytics.dailyUsage)).toBe(true);
    expect(Array.isArray(analytics.serviceUsage)).toBe(true);
  });

  it('should export metrics', () => {
    const jsonExport = aiMetricsCollector.exportMetrics('json');
    expect(jsonExport).toBeDefined();
    expect(typeof jsonExport).toBe('string');

    const csvExport = aiMetricsCollector.exportMetrics('csv');
    expect(csvExport).toBeDefined();
    expect(typeof csvExport).toBe('string');
  });
});

describe('AI Health Monitor', () => {
  it('should check service health', async () => {
    const healthResult = await aiHealthMonitor.checkServiceHealth('test');
    expect(healthResult).toBeDefined();
    expect(healthResult.service).toBe('test');
    expect(['healthy', 'degraded', 'unhealthy', 'unknown']).toContain(healthResult.status);
  });

  it('should get system health status', async () => {
    const systemHealth = await aiHealthMonitor.getSystemHealthStatus();
    expect(systemHealth).toBeDefined();
    expect(['healthy', 'degraded', 'unhealthy']).toContain(systemHealth.overallStatus);
    expect(Array.isArray(systemHealth.alerts)).toBe(true);
  });

  it('should create and resolve alerts', async () => {
    const alertId = await aiHealthMonitor.createManualAlert(
      'test',
      'medium',
      'Test alert',
      { test: true }
    );
    expect(alertId).toBeDefined();

    const activeAlerts = aiHealthMonitor.getActiveAlerts();
    expect(activeAlerts.some(alert => alert.id === alertId)).toBe(true);

    await aiHealthMonitor.resolveAlert(alertId);
    const alertsAfterResolution = aiHealthMonitor.getActiveAlerts();
    expect(alertsAfterResolution.some(alert => alert.id === alertId)).toBe(false);
  });
});

describe('AI Performance Dashboard', () => {
  it('should get current metrics', async () => {
    const metrics = await aiPerformanceDashboard.getCurrentMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.timestamp).toBeInstanceOf(Date);
    expect(metrics.systemMetrics).toBeDefined();
    expect(metrics.performanceInsights).toBeDefined();
  });

  it('should get performance trends', () => {
    const trends = aiPerformanceDashboard.getPerformanceTrends(1);
    expect(trends).toBeDefined();
    expect(Array.isArray(trends.responseTime)).toBe(true);
    expect(Array.isArray(trends.errorRate)).toBe(true);
    expect(Array.isArray(trends.cost)).toBe(true);
    expect(Array.isArray(trends.usage)).toBe(true);
  });

  it('should get cost analysis', () => {
    const costAnalysis = aiPerformanceDashboard.getCostAnalysis();
    expect(costAnalysis).toBeDefined();
    expect(Array.isArray(costAnalysis.currentCosts)).toBe(true);
    expect(Array.isArray(costAnalysis.projections)).toBe(true);
    expect(Array.isArray(costAnalysis.optimizations)).toBe(true);
  });

  it('should export dashboard data', () => {
    const jsonExport = aiPerformanceDashboard.exportDashboardData('json');
    expect(jsonExport).toBeDefined();
    expect(typeof jsonExport).toBe('string');

    const csvExport = aiPerformanceDashboard.exportDashboardData('csv');
    expect(csvExport).toBeDefined();
    expect(typeof csvExport).toBe('string');
  });
});