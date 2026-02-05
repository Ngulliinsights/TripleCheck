/**
 * AI Monitoring System Tests
 * 
 * Tests for the AI monitoring, metrics collection, and health monitoring systems.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock the logging service before importing the monitoring modules
vi.mock('../../../../../core/src/logging', () => ({
  loggingService: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

import { aiMetricsCollector } from '../monitoring/ai-metrics-collector'
import { aiHealthMonitor } from '../monitoring/ai-health-monitor'
import { aiPerformanceDashboard } from '../monitoring/ai-performance-dashboard'

describe('AI Metrics Collector', () => {
  beforeEach(() => {
    // Clear any existing metrics
    aiMetricsCollector.clearOldMetrics(0);
  });

  it('should track operations correctly', () => {
    const operationId = aiMetricsCollector.startOperation('test', 'unit_test', {
      testData: 'monitoring'
    });
    
    expect(operationId).toBeDefined();
    expect(typeof operationId).toBe('string');
    expect(operationId).toContain('test_unit_test');

    aiMetricsCollector.completeOperation(operationId, {
      tokensUsed: 100,
      cost: 0.01,
      inputSize: 1024,
      outputSize: 512,
      cacheHit: false
    });

    const metrics = aiMetricsCollector.getSystemMetrics();
    expect(metrics.totalOperations).toBeGreaterThan(0);
    expect(metrics.totalTokensUsed).toBeGreaterThanOrEqual(100);
    expect(metrics.totalCost).toBeGreaterThanOrEqual(0.01);
  });

  it('should handle failed operations', () => {
    const operationId = aiMetricsCollector.startOperation('test', 'failed_test');
    
    aiMetricsCollector.failOperation(operationId, 'Test error message', {
      retryCount: 2
    });

    const metrics = aiMetricsCollector.getSystemMetrics();
    expect(metrics.totalFailedOperations).toBeGreaterThan(0);
    expect(metrics.overallErrorRate).toBeGreaterThan(0);
  });

  it('should generate usage analytics', () => {
    // Create some test operations
    for (let i = 0; i < 5; i++) {
      const operationId = aiMetricsCollector.startOperation('testService', 'analytics_test');
      aiMetricsCollector.completeOperation(operationId, {
        tokensUsed: 50 + i * 10,
        cost: 0.005 + i * 0.001
      });
    }

    const analytics = aiMetricsCollector.getUsageAnalytics(1);
    expect(analytics).toBeDefined();
    expect(Array.isArray(analytics.dailyUsage)).toBe(true);
    expect(Array.isArray(analytics.serviceUsage)).toBe(true);
    expect(Array.isArray(analytics.topOperations)).toBe(true);
    expect(Array.isArray(analytics.errorAnalysis)).toBe(true);
  });

  it('should export metrics in different formats', () => {
    // Create a test operation
    const operationId = aiMetricsCollector.startOperation('export', 'test');
    aiMetricsCollector.completeOperation(operationId, { tokensUsed: 25, cost: 0.002 });

    const jsonExport = aiMetricsCollector.exportMetrics('json');
    expect(jsonExport).toBeDefined();
    expect(typeof jsonExport).toBe('string');
    
    // Verify it's valid JSON
    expect(() => JSON.parse(jsonExport)).not.toThrow();

    const csvExport = aiMetricsCollector.exportMetrics('csv');
    expect(csvExport).toBeDefined();
    expect(typeof csvExport).toBe('string');
    expect(csvExport).toContain('timestamp,service,operation');
  });

  it('should calculate cost breakdown', () => {
    // Create operations with different costs
    const services = ['service1', 'service2', 'service3'];
    
    services.forEach((service, index) => {
      const operationId = aiMetricsCollector.startOperation(service, 'cost_test');
      aiMetricsCollector.completeOperation(operationId, {
        tokensUsed: 100 * (index + 1),
        cost: 0.01 * (index + 1)
      });
    });

    const costBreakdown = aiMetricsCollector.getCostBreakdown();
    expect(Array.isArray(costBreakdown)).toBe(true);
    expect(costBreakdown.length).toBeGreaterThan(0);
    
    const totalCost = costBreakdown.reduce((sum, entry) => sum + entry.totalCost, 0);
    expect(totalCost).toBeGreaterThan(0);
  });
});

describe('AI Health Monitor', () => {
  it('should check service health', async () => {
    const healthResult = await aiHealthMonitor.checkServiceHealth('testService');
    
    expect(healthResult).toBeDefined();
    expect(healthResult.service).toBe('testService');
    expect(['healthy', 'degraded', 'unhealthy', 'unknown']).toContain(healthResult.status);
    expect(healthResult.lastCheck).toBeInstanceOf(Date);
    expect(typeof healthResult.responseTime).toBe('number');
  });

  it('should get system health status', async () => {
    const systemHealth = await aiHealthMonitor.getSystemHealthStatus();
    
    expect(systemHealth).toBeDefined();
    expect(['healthy', 'degraded', 'unhealthy']).toContain(systemHealth.overallStatus);
    expect(Array.isArray(systemHealth.alerts)).toBe(true);
    expect(systemHealth.lastUpdate).toBeInstanceOf(Date);
    expect(typeof systemHealth.uptime).toBe('number');
    expect(systemHealth.systemMetrics).toBeDefined();
  });

  it('should create and manage alerts', async () => {
    const alertId = await aiHealthMonitor.createManualAlert(
      'testService',
      'medium',
      'Test alert for monitoring',
      { testData: true }
    );
    
    expect(alertId).toBeDefined();
    expect(typeof alertId).toBe('string');

    const activeAlerts = aiHealthMonitor.getActiveAlerts();
    expect(Array.isArray(activeAlerts)).toBe(true);
    
    const testAlert = activeAlerts.find(alert => alert.id === alertId);
    expect(testAlert).toBeDefined();
    expect(testAlert?.service).toBe('testService');
    expect(testAlert?.severity).toBe('medium');
    expect(testAlert?.resolved).toBe(false);

    // Resolve the alert
    await aiHealthMonitor.resolveAlert(alertId, 'test-system');
    
    const alertsAfterResolution = aiHealthMonitor.getActiveAlerts();
    const resolvedAlert = alertsAfterResolution.find(alert => alert.id === alertId);
    expect(resolvedAlert).toBeUndefined(); // Should not be in active alerts anymore
  });

  it('should export health data', () => {
    const healthData = aiHealthMonitor.exportHealthData();
    
    expect(healthData).toBeDefined();
    expect(Array.isArray(healthData.healthChecks)).toBe(true);
    expect(Array.isArray(healthData.alerts)).toBe(true);
    expect(healthData.exportTime).toBeInstanceOf(Date);
  });
});

describe('AI Performance Dashboard', () => {
  it('should get current metrics', async () => {
    // Create some test data first
    const operationId = aiMetricsCollector.startOperation('dashboard', 'test');
    aiMetricsCollector.completeOperation(operationId, {
      tokensUsed: 75,
      cost: 0.008
    });

    const metrics = await aiPerformanceDashboard.getCurrentMetrics();
    
    expect(metrics).toBeDefined();
    expect(metrics.timestamp).toBeInstanceOf(Date);
    expect(metrics.systemMetrics).toBeDefined();
    expect(metrics.systemHealth).toBeDefined();
    expect(Array.isArray(metrics.alerts)).toBe(true);
    expect(Array.isArray(metrics.recommendations)).toBe(true);
    expect(metrics.performanceInsights).toBeDefined();
  });

  it('should get performance trends', async () => {
    // Ensure we have current metrics first
    await aiPerformanceDashboard.getCurrentMetrics();
    
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
    
    // Check projection structure
    costAnalysis.projections.forEach(projection => {
      expect(projection.period).toBeDefined();
      expect(typeof projection.projectedCost).toBe('number');
      expect(typeof projection.confidence).toBe('number');
    });
  });

  it('should export dashboard data', () => {
    const jsonExport = aiPerformanceDashboard.exportDashboardData('json');
    expect(jsonExport).toBeDefined();
    expect(typeof jsonExport).toBe('string');
    
    // Verify it's valid JSON
    expect(() => JSON.parse(jsonExport)).not.toThrow();

    const csvExport = aiPerformanceDashboard.exportDashboardData('csv');
    expect(csvExport).toBeDefined();
    expect(typeof csvExport).toBe('string');
    expect(csvExport).toContain('timestamp,service,metric,value');
  });

  it('should get service-specific performance data', () => {
    // Create some service-specific data
    const operationId = aiMetricsCollector.startOperation('specificService', 'performance_test');
    aiMetricsCollector.completeOperation(operationId, {
      tokensUsed: 50,
      cost: 0.005
    });

    const servicePerformance = aiPerformanceDashboard.getServicePerformance('specificService');
    
    expect(servicePerformance).toBeDefined();
    expect(servicePerformance.currentMetrics).toBeDefined();
    expect(servicePerformance.trends).toBeDefined();
    expect(Array.isArray(servicePerformance.recommendations)).toBe(true);
  });
});

describe('Integration Tests', () => {
  it('should work together across all monitoring systems', async () => {
    // Create a comprehensive test scenario
    const services = ['integration1', 'integration2', 'integration3'];
    
    // Generate operations across multiple services
    for (const service of services) {
      for (let i = 0; i < 3; i++) {
        const operationId = aiMetricsCollector.startOperation(service, `operation_${i}`);
        
        if (i === 2) {
          // Make one operation fail
          aiMetricsCollector.failOperation(operationId, 'Integration test error');
        } else {
          aiMetricsCollector.completeOperation(operationId, {
            tokensUsed: 25 + i * 10,
            cost: 0.003 + i * 0.001,
            cacheHit: i === 0
          });
        }
      }
    }

    // Check health for all services
    const healthChecks = await Promise.all(
      services.map(service => aiHealthMonitor.checkServiceHealth(service))
    );
    
    expect(healthChecks).toHaveLength(services.length);
    healthChecks.forEach(check => {
      expect(['healthy', 'degraded', 'unhealthy', 'unknown']).toContain(check.status);
    });

    // Get system-wide metrics
    const systemMetrics = aiMetricsCollector.getSystemMetrics();
    expect(systemMetrics.totalOperations).toBeGreaterThanOrEqual(services.length * 3);
    expect(systemMetrics.totalFailedOperations).toBeGreaterThanOrEqual(services.length);

    // Get dashboard metrics
    const dashboardMetrics = await aiPerformanceDashboard.getCurrentMetrics();
    expect(dashboardMetrics.systemMetrics.totalOperations).toEqual(systemMetrics.totalOperations);

    // Verify system health
    const systemHealth = await aiHealthMonitor.getSystemHealthStatus();
    expect(systemHealth.systemMetrics.totalServices).toBeGreaterThanOrEqual(services.length);
  });

  it('should handle high-volume operations efficiently', async () => {
    const startTime = Date.now();
    const operationCount = 100;
    
    // Create many operations quickly
    const operationIds = [];
    for (let i = 0; i < operationCount; i++) {
      const operationId = aiMetricsCollector.startOperation('volume', 'high_volume_test');
      operationIds.push(operationId);
    }

    // Complete all operations
    operationIds.forEach((operationId, index) => {
      if (index % 10 === 0) {
        // Fail every 10th operation
        aiMetricsCollector.failOperation(operationId, 'Volume test error');
      } else {
        aiMetricsCollector.completeOperation(operationId, {
          tokensUsed: 10,
          cost: 0.001
        });
      }
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Verify all operations were processed
    const metrics = aiMetricsCollector.getSystemMetrics();
    expect(metrics.totalOperations).toBeGreaterThanOrEqual(operationCount);
    
    // Verify processing was reasonably fast (less than 5 seconds)
    expect(processingTime).toBeLessThan(5000);
    
    // Verify error rate calculation
    const expectedErrorRate = 0.1; // 10% failure rate
    expect(Math.abs(metrics.overallErrorRate - expectedErrorRate)).toBeLessThan(0.05);
  });
});