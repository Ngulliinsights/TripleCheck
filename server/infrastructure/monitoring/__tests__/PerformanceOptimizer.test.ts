/**
 * Performance Optimizer Tests
 * Comprehensive test suite for the PerformanceOptimizer service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceOptimizer, PerformanceMetrics, OptimizationRecommendation, PerformanceAlert } from '../PerformanceOptimizer';
import { CachePerformanceMonitor } from '../CachePerformanceMonitor';
import { CacheService } from '../../cache/CacheService';

// Mock dependencies
vi.mock('../CachePerformanceMonitor');
vi.mock('../../cache/CacheService');

describe('PerformanceOptimizer', () => {
  let performanceOptimizer: PerformanceOptimizer;
  let mockMonitor: vi.Mocked<CachePerformanceMonitor>;
  let mockCacheService: vi.Mocked<CacheService>;

  beforeEach(() => {
    // Create mocked instances
    mockMonitor = {
      getMetrics: vi.fn(),
    } as any;

    mockCacheService = {
      cleanup: vi.fn(),
    } as any;

    performanceOptimizer = new PerformanceOptimizer(mockMonitor, mockCacheService);
  });

  afterEach(() => {
    performanceOptimizer.stop();
    vi.clearAllMocks();
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with correct dependencies', () => {
      expect(performanceOptimizer).toBeInstanceOf(PerformanceOptimizer);
    });

    it('should start and stop correctly', () => {
      expect(() => performanceOptimizer.start()).not.toThrow();
      expect(() => performanceOptimizer.stop()).not.toThrow();
    });

    it('should not start twice', () => {
      performanceOptimizer.start();
      // Should not throw when starting again
      expect(() => performanceOptimizer.start()).not.toThrow();
    });
  });

  describe('Performance Metrics Collection', () => {
    beforeEach(() => {
      mockMonitor.getMetrics.mockReturnValue({
        averageResponseTime: 500,
        hitRate: 0.8,
        totalRequests: 1000,
        errorCount: 10,
        cacheHits: 800,
        cacheMisses: 200,
        memoryUsage: 50 * 1024 * 1024, // 50MB
        deduplicationSavings: 0.2,
        missRate: 0.2,
        timestamp: new Date()
      });

      // Mock process.memoryUsage
      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 100 * 1024 * 1024,
        heapTotal: 80 * 1024 * 1024,
        heapUsed: 60 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      });
    });

    it('should collect current performance metrics', async () => {
      const metrics = await performanceOptimizer.getCurrentMetrics();

      expect(metrics).toMatchObject({
        responseTime: 500,
        cacheHitRate: 0.8,
        memoryUsage: 60 * 1024 * 1024,
        requestCount: 1000,
        errorRate: 0.01
      });
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should handle division by zero in error rate calculation', async () => {
      mockMonitor.getMetrics.mockReturnValue({
        averageResponseTime: 500,
        hitRate: 0.8,
        totalRequests: 0,
        errorCount: 0,
        cacheHits: 0,
        cacheMisses: 0,
        memoryUsage: 50 * 1024 * 1024,
        deduplicationSavings: 0.2,
        missRate: 0.2,
        timestamp: new Date()
      });

      const metrics = await performanceOptimizer.getCurrentMetrics();
      expect(metrics.errorRate).toBe(0);
    });
  });

  describe('Optimization Recommendations', () => {
    beforeEach(() => {
      mockMonitor.getMetrics.mockReturnValue({
        averageResponseTime: 1500, // Above threshold
        hitRate: 0.5, // Below threshold
        totalRequests: 1000,
        errorCount: 60, // High error rate
        cacheHits: 500,
        cacheMisses: 500,
        memoryUsage: 50 * 1024 * 1024,
        deduplicationSavings: 0.2,
        missRate: 0.5,
        timestamp: new Date()
      });

      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 200 * 1024 * 1024,
        heapTotal: 180 * 1024 * 1024,
        heapUsed: 150 * 1024 * 1024, // Above threshold
        external: 20 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024
      });
    });

    it('should generate recommendations for poor performance', async () => {
      const recommendations = await performanceOptimizer.generateRecommendations();

      expect(recommendations).toHaveLength(4); // All thresholds exceeded
      
      const cacheRec = recommendations.find(r => r.type === 'cache');
      expect(cacheRec).toBeDefined();
      expect(cacheRec?.priority).toBe('high');

      const responseRec = recommendations.find(r => r.type === 'query');
      expect(responseRec).toBeDefined();
      expect(responseRec?.priority).toBe('high');

      const memoryRec = recommendations.find(r => r.type === 'memory');
      expect(memoryRec).toBeDefined();
      expect(memoryRec?.priority).toBe('medium');

      const errorRec = recommendations.find(r => r.type === 'infrastructure');
      expect(errorRec).toBeDefined();
      expect(errorRec?.priority).toBe('critical');
    });

    it('should not generate recommendations for good performance', async () => {
      mockMonitor.getMetrics.mockReturnValue({
        averageResponseTime: 500, // Good
        hitRate: 0.8, // Good
        totalRequests: 1000,
        errorCount: 10, // Low error rate
        cacheHits: 800,
        cacheMisses: 200,
        memoryUsage: 50 * 1024 * 1024,
        deduplicationSavings: 0.2,
        missRate: 0.2,
        timestamp: new Date()
      });

      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 100 * 1024 * 1024,
        heapTotal: 80 * 1024 * 1024,
        heapUsed: 60 * 1024 * 1024, // Good
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      });

      const recommendations = await performanceOptimizer.generateRecommendations();
      expect(recommendations).toHaveLength(0);
    });

    it('should sort recommendations by priority', async () => {
      const recommendations = await performanceOptimizer.generateRecommendations();
      const storedRecommendations = performanceOptimizer.getRecommendations();

      // Should be sorted with critical first
      expect(storedRecommendations[0].priority).toBe('critical');
    });
  });

  describe('Alert Management', () => {
    beforeEach(() => {
      mockMonitor.getMetrics.mockReturnValue({
        averageResponseTime: 1500, // Above threshold
        hitRate: 0.5, // Below threshold
        totalRequests: 1000,
        errorCount: 60, // High error rate
        cacheHits: 500,
        cacheMisses: 500,
        memoryUsage: 50 * 1024 * 1024,
        deduplicationSavings: 0.2,
        missRate: 0.5,
        timestamp: new Date()
      });

      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 200 * 1024 * 1024,
        heapTotal: 180 * 1024 * 1024,
        heapUsed: 150 * 1024 * 1024, // Above threshold
        external: 20 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024
      });
    });

    it('should create alerts for performance issues', async () => {
      performanceOptimizer.start();
      
      // Wait for alert monitoring to run
      await new Promise(resolve => setTimeout(resolve, 100));

      const alerts = performanceOptimizer.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const responseTimeAlert = alerts.find(a => a.metric === 'responseTime');
      expect(responseTimeAlert).toBeDefined();
      expect(responseTimeAlert?.severity).toBe('error');
    });

    it('should resolve alerts', async () => {
      performanceOptimizer.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      const alerts = performanceOptimizer.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const alertId = alerts[0].id;
      const resolved = performanceOptimizer.resolveAlert(alertId);
      expect(resolved).toBe(true);

      const remainingAlerts = performanceOptimizer.getAlerts();
      expect(remainingAlerts.find(a => a.id === alertId)).toBeUndefined();
    });

    it('should return false when resolving non-existent alert', () => {
      const resolved = performanceOptimizer.resolveAlert('non-existent');
      expect(resolved).toBe(false);
    });
  });

  describe('Automatic Optimizations', () => {
    beforeEach(() => {
      mockMonitor.getMetrics.mockReturnValue({
        averageResponseTime: 500,
        hitRate: 0.6, // Below optimization threshold
        totalRequests: 1000,
        errorCount: 10,
        cacheHits: 600,
        cacheMisses: 400,
        memoryUsage: 50 * 1024 * 1024,
        deduplicationSavings: 0.2,
        missRate: 0.4,
        timestamp: new Date()
      });

      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 150 * 1024 * 1024,
        heapTotal: 130 * 1024 * 1024,
        heapUsed: 110 * 1024 * 1024, // Above 80% of threshold
        external: 15 * 1024 * 1024,
        arrayBuffers: 8 * 1024 * 1024
      });

      mockCacheService.cleanup.mockResolvedValue(undefined);
    });

    it('should apply automatic optimizations', async () => {
      await performanceOptimizer.applyAutomaticOptimizations();

      // Should have called cache cleanup due to high memory usage
      expect(mockCacheService.cleanup).toHaveBeenCalled();
    });

    it('should handle optimization errors gracefully', async () => {
      mockCacheService.cleanup.mockRejectedValue(new Error('Cleanup failed'));

      await expect(performanceOptimizer.applyAutomaticOptimizations()).resolves.not.toThrow();

      // Should create an alert for the error
      const alerts = performanceOptimizer.getAlerts();
      const errorAlert = alerts.find(a => a.message.includes('Memory cleanup error'));
      expect(errorAlert).toBeDefined();
    });
  });

  describe('Performance History', () => {
    it('should track performance history', async () => {
      mockMonitor.getMetrics.mockReturnValue({
        averageResponseTime: 500,
        hitRate: 0.8,
        totalRequests: 1000,
        errorCount: 10,
        cacheHits: 800,
        cacheMisses: 200,
        memoryUsage: 50 * 1024 * 1024,
        deduplicationSavings: 0.2,
        missRate: 0.2,
        timestamp: new Date()
      });

      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 100 * 1024 * 1024,
        heapTotal: 80 * 1024 * 1024,
        heapUsed: 60 * 1024 * 1024,
        external: 10 * 1024 * 1024,
        arrayBuffers: 5 * 1024 * 1024
      });

      performanceOptimizer.start();
      
      // Wait for optimization cycle to run
      await new Promise(resolve => setTimeout(resolve, 100));

      const history = performanceOptimizer.getPerformanceHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toMatchObject({
        responseTime: 500,
        cacheHitRate: 0.8,
        requestCount: 1000
      });
    });

    it('should limit history to specified number of entries', async () => {
      const history = performanceOptimizer.getPerformanceHistory(5);
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Optimization Summary', () => {
    it('should provide optimization summary', () => {
      const summary = performanceOptimizer.getOptimizationSummary();

      expect(summary).toHaveProperty('activeRecommendations');
      expect(summary).toHaveProperty('activeAlerts');
      expect(summary).toHaveProperty('lastOptimization');
      expect(summary).toHaveProperty('systemHealth');
      expect(['excellent', 'good', 'fair', 'poor']).toContain(summary.systemHealth);
    });

    it('should calculate system health correctly', async () => {
      // Generate critical alerts
      mockMonitor.getMetrics.mockReturnValue({
        averageResponseTime: 1500,
        hitRate: 0.3,
        totalRequests: 1000,
        errorCount: 100, // Critical error rate
        cacheHits: 300,
        cacheMisses: 700,
        memoryUsage: 50 * 1024 * 1024,
        deduplicationSavings: 0.2,
        missRate: 0.7,
        timestamp: new Date()
      });

      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 200 * 1024 * 1024,
        heapTotal: 180 * 1024 * 1024,
        heapUsed: 160 * 1024 * 1024,
        external: 20 * 1024 * 1024,
        arrayBuffers: 10 * 1024 * 1024
      });

      performanceOptimizer.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      const summary = performanceOptimizer.getOptimizationSummary();
      expect(summary.systemHealth).toBe('poor');
    });
  });

  describe('Error Handling', () => {
    it('should handle monitor errors gracefully', async () => {
      mockMonitor.getMetrics.mockImplementation(() => {
        throw new Error('Monitor error');
      });

      await expect(performanceOptimizer.getCurrentMetrics()).rejects.toThrow('Monitor error');
    });

    it('should handle cache service errors gracefully', async () => {
      // Set up proper mock data first
      mockMonitor.getMetrics.mockReturnValue({
        averageResponseTime: 500,
        hitRate: 0.6,
        totalRequests: 1000,
        errorCount: 10,
        cacheHits: 600,
        cacheMisses: 400,
        memoryUsage: 50 * 1024 * 1024,
        deduplicationSavings: 0.2,
        missRate: 0.4,
        timestamp: new Date()
      });

      vi.spyOn(process, 'memoryUsage').mockReturnValue({
        rss: 150 * 1024 * 1024,
        heapTotal: 130 * 1024 * 1024,
        heapUsed: 110 * 1024 * 1024,
        external: 15 * 1024 * 1024,
        arrayBuffers: 8 * 1024 * 1024
      });

      mockCacheService.cleanup.mockRejectedValue(new Error('Cache error'));

      await expect(performanceOptimizer.applyAutomaticOptimizations()).resolves.not.toThrow();
    });
  });
});