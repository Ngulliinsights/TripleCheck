import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { AnalyticsService, AnalyticsEvent, PerformanceMetric } from '../AnalyticsService';
import { CacheService } from '../../../core/src/cache'
import { RequestDeduplicator } from '../../infrastructure/deduplication/RequestDeduplicator';
import { db } from '../../infrastructure/database/connection';

// Mock dependencies
vi.mock('../../infrastructure/database/connection');
vi.mock('../../infrastructure/cache/CacheService');
vi.mock('../../infrastructure/deduplication/RequestDeduplicator');

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockDb: Mock;
  let mockCache: Mock;
  let mockDeduplicator: Mock;

  const mockAnalyticsEvent: AnalyticsEvent = {
    eventType: 'user_action',
    eventName: 'property_view',
    userId: 1,
    sessionId: 'session123',
    propertyId: 100,
    eventData: { page: 'property-details' },
    metadata: { source: 'web' },
  };

  const mockPerformanceMetric: PerformanceMetric = {
    metricType: 'page_load',
    metricName: 'LCP',
    value: 2500,
    unit: 'ms',
    url: '/property/100',
    userId: 1,
    deviceType: 'desktop',
  };

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock database operations
    mockDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    };

    // Mock CacheService
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      invalidateByPattern: vi.fn(),
    };

    // Mock RequestDeduplicator
    mockDeduplicator = {
      handleIdempotentRequest: vi.fn(),
      generateIdempotencyKey: vi.fn(),
      clearCache: vi.fn(),
      getStats: vi.fn().mockReturnValue({
        pendingRequests: 0,
        completedRequests: 0,
        memoryUsage: 0,
      }),
    };

    // Setup mocks
    (CacheService as any).mockImplementation(() => mockCache);
    (RequestDeduplicator.getInstance as any).mockReturnValue(mockDeduplicator);
    (db as any) = mockDb;

    analyticsService = new AnalyticsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackEvent', () => {
    it('should track a valid analytics event', async () => {
      // Act
      await analyticsService.trackEvent(mockAnalyticsEvent);

      // Assert
      expect(analyticsService.getStats().bufferSize).toBeGreaterThan(0);
    });

    it('should validate event data', async () => {
      const invalidEvent = {
        eventType: '', // Invalid: empty string
        eventName: 'test',
      } as AnalyticsEvent;

      // Act & Assert
      await expect(analyticsService.trackEvent(invalidEvent)).rejects.toThrow(
        'Event type and name are required'
      );
    });

    it('should reject events with names that are too long', async () => {
      const invalidEvent = {
        eventType: 'test',
        eventName: 'a'.repeat(201), // Too long
      } as AnalyticsEvent;

      // Act & Assert
      await expect(analyticsService.trackEvent(invalidEvent)).rejects.toThrow(
        'Event type or name too long'
      );
    });
  });

  describe('trackUserAction', () => {
    it('should track user action with proper formatting', async () => {
      const userId = 1;
      const action = 'property_view';
      const data = { propertyId: 100 };
      const sessionId = 'session123';

      // Act
      await analyticsService.trackUserAction(userId, action, data, sessionId);

      // Assert
      expect(analyticsService.getStats().bufferSize).toBeGreaterThan(0);
    });
  });

  describe('batchTrackEvents', () => {
    it('should track multiple events in batch', async () => {
      const events = [
        mockAnalyticsEvent,
        { ...mockAnalyticsEvent, eventName: 'property_search' },
        { ...mockAnalyticsEvent, eventName: 'property_favorite' },
      ];

      // Act
      await analyticsService.batchTrackEvents(events);

      // Assert
      expect(analyticsService.getStats().bufferSize).toBe(3);
    });

    it('should validate all events in batch', async () => {
      const events = [
        mockAnalyticsEvent,
        { eventType: '', eventName: 'invalid' } as AnalyticsEvent, // Invalid event
      ];

      // Act & Assert
      await expect(analyticsService.batchTrackEvents(events)).rejects.toThrow(
        'Event type and name are required'
      );
    });
  });

  describe('getMetrics', () => {
    it('should retrieve metrics with caching', async () => {
      const mockMetrics = [
        { id: 1, metricName: 'page_views', value: '100' },
        { id: 2, metricName: 'user_sessions', value: '50' },
      ];

      mockDeduplicator.handleIdempotentRequest.mockResolvedValue(mockMetrics);

      // Act
      const result = await analyticsService.getMetrics();

      // Assert
      expect(mockDeduplicator.handleIdempotentRequest).toHaveBeenCalledWith(
        expect.stringContaining('analytics:metrics:'),
        expect.any(Function),
        300000
      );
      expect(result).toEqual(mockMetrics);
    });

    it('should apply filters to metrics query', async () => {
      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        metricType: 'counter',
      };

      mockDeduplicator.handleIdempotentRequest.mockResolvedValue([]);

      // Act
      await analyticsService.getMetrics(filters);

      // Assert
      expect(mockDeduplicator.handleIdempotentRequest).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(filters)),
        expect.any(Function),
        300000
      );
    });
  });

  describe('getTimeSeriesData', () => {
    it('should retrieve time series data with granularity', async () => {
      const mockTimeSeriesData = [
        { timestamp: '2024-01-01T00:00:00Z', value: '100', dimensions: {} },
        { timestamp: '2024-01-02T00:00:00Z', value: '150', dimensions: {} },
      ];

      mockDeduplicator.handleIdempotentRequest.mockResolvedValue(mockTimeSeriesData);

      // Act
      const result = await analyticsService.getTimeSeriesData('page_views', {}, 'day');

      // Assert
      expect(mockDeduplicator.handleIdempotentRequest).toHaveBeenCalledWith(
        expect.stringContaining('analytics:timeseries:page_views:day:'),
        expect.any(Function),
        600000
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('value');
    });
  });

  describe('getUserAnalytics', () => {
    it('should retrieve user-specific analytics', async () => {
      const userId = 1;
      const mockUserAnalytics = {
        events: [mockAnalyticsEvent],
        eventCounts: [{ eventType: 'user_action', count: 5 }],
        totalEvents: 1,
      };

      mockDeduplicator.handleIdempotentRequest.mockResolvedValue(mockUserAnalytics);

      // Act
      const result = await analyticsService.getUserAnalytics(userId);

      // Assert
      expect(mockDeduplicator.handleIdempotentRequest).toHaveBeenCalledWith(
        expect.stringContaining(`analytics:user:${userId}:`),
        expect.any(Function),
        300000
      );
      expect(result).toEqual(mockUserAnalytics);
    });
  });

  describe('getPropertyAnalytics', () => {
    it('should retrieve property-specific analytics', async () => {
      const propertyId = 100;
      const mockPropertyAnalytics = {
        events: [mockAnalyticsEvent],
        viewCount: 25,
        totalEvents: 1,
      };

      mockDeduplicator.handleIdempotentRequest.mockResolvedValue(mockPropertyAnalytics);

      // Act
      const result = await analyticsService.getPropertyAnalytics(propertyId);

      // Assert
      expect(mockDeduplicator.handleIdempotentRequest).toHaveBeenCalledWith(
        expect.stringContaining(`analytics:property:${propertyId}:`),
        expect.any(Function),
        300000
      );
      expect(result).toEqual(mockPropertyAnalytics);
    });
  });

  describe('recordPerformanceMetric', () => {
    it('should record performance metric successfully', async () => {
      // Act
      await analyticsService.recordPerformanceMetric(mockPerformanceMetric);

      // Assert
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should handle performance metric recording errors', async () => {
      mockDb.insert.mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act & Assert
      await expect(
        analyticsService.recordPerformanceMetric(mockPerformanceMetric)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getCoreWebVitals', () => {
    it('should retrieve Core Web Vitals metrics', async () => {
      const mockCoreWebVitals = {
        LCP: { average: 2500, p50: 2200, p75: 2800, p95: 3500, count: 100 },
        FID: { average: 100, p50: 80, p75: 120, p95: 200, count: 100 },
        CLS: { average: 0.1, p50: 0.05, p75: 0.15, p95: 0.25, count: 100 },
      };

      mockDeduplicator.handleIdempotentRequest.mockResolvedValue(mockCoreWebVitals);

      // Act
      const result = await analyticsService.getCoreWebVitals();

      // Assert
      expect(mockDeduplicator.handleIdempotentRequest).toHaveBeenCalledWith(
        expect.stringContaining('analytics:core-web-vitals:'),
        expect.any(Function),
        600000
      );
      expect(result).toEqual(mockCoreWebVitals);
    });
  });

  describe('getBundleMetrics', () => {
    it('should retrieve bundle metrics', async () => {
      const mockBundleMetrics = [
        { id: 1, metricName: 'main_bundle', value: '250000', unit: 'bytes' },
        { id: 2, metricName: 'vendor_bundle', value: '500000', unit: 'bytes' },
      ];

      mockDeduplicator.handleIdempotentRequest.mockResolvedValue(mockBundleMetrics);

      // Act
      const result = await analyticsService.getBundleMetrics();

      // Assert
      expect(mockDeduplicator.handleIdempotentRequest).toHaveBeenCalledWith(
        expect.stringContaining('analytics:bundle-metrics:'),
        expect.any(Function),
        300000
      );
      expect(result).toEqual(mockBundleMetrics);
    });
  });

  describe('getStats', () => {
    it('should return service statistics', () => {
      // Act
      const stats = analyticsService.getStats();

      // Assert
      expect(stats).toHaveProperty('bufferSize');
      expect(stats).toHaveProperty('batchSize');
      expect(stats).toHaveProperty('flushInterval');
      expect(typeof stats.bufferSize).toBe('number');
      expect(typeof stats.batchSize).toBe('number');
      expect(typeof stats.flushInterval).toBe('number');
    });
  });

  describe('batch processing', () => {
    it('should flush buffer when batch size is reached', async () => {
      // Create events to fill the buffer
      const events = Array.from({ length: 100 }, (_, i) => ({
        ...mockAnalyticsEvent,
        eventName: `event_${i}`,
      }));

      // Act
      await analyticsService.batchTrackEvents(events);

      // Assert - buffer should be flushed when it reaches batch size
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.insert.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act & Assert
      await expect(analyticsService.trackEvent(mockAnalyticsEvent)).rejects.toThrow();
    });

    it('should handle cache errors gracefully', async () => {
      mockDeduplicator.handleIdempotentRequest.mockRejectedValue(
        new Error('Cache error')
      );

      // Act & Assert
      await expect(analyticsService.getMetrics()).rejects.toThrow('Cache error');
    });
  });
});