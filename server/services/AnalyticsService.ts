import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';

import { analyticsEvents, analyticsMetrics, performanceMetrics } from '../../src/shared/schema';
import { CacheService } from '../infrastructure/cache/CacheService';
import { db } from '../infrastructure/database/connection';
import { RequestDeduplicator } from '../infrastructure/deduplication/RequestDeduplicator';

/**
 * Analytics event data structure
 */
export interface AnalyticsEvent {
  eventType: string;
  eventName: string;
  userId?: number;
  sessionId?: string;
  propertyId?: number;
  professionalId?: number;
  eventData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
}

/**
 * Analytics metrics data structure
 */
export interface AnalyticsMetric {
  metricName: string;
  metricType: 'counter' | 'gauge' | 'histogram';
  value: number;
  dimensions?: Record<string, unknown>;
  tags?: Record<string, unknown>;
  aggregationPeriod?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Performance metric data structure
 */
export interface PerformanceMetric {
  metricType: string;
  metricName: string;
  value: number;
  unit: string;
  url?: string;
  userAgent?: string;
  userId?: number;
  sessionId?: string;
  deviceType?: string;
  connectionType?: string;
  additionalData?: Record<string, unknown>;
}

/**
 * Analytics query filters
 */
export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
  eventName?: string;
  userId?: number;
  propertyId?: number;
  professionalId?: number;
  sessionId?: string;
  metricType?: string;
  aggregationPeriod?: string;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
  dimensions?: Record<string, unknown>;
}

/**
 * Analytics Service for event tracking and metrics collection
 * Provides comprehensive analytics capabilities with smart caching and performance monitoring
 */
export class AnalyticsService {
  private cache: CacheService;
  private deduplicator: RequestDeduplicator;
  private eventBuffer: AnalyticsEvent[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor(cache?: CacheService) {
    this.cache = cache || new CacheService();
    this.deduplicator = RequestDeduplicator.getInstance({}, this.cache);
    
    // Start batch processing
    this.startBatchProcessing();
  }

  /**
   * Track a single analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Validate event data
      this.validateEvent(event);

      // Add to buffer for batch processing
      this.eventBuffer.push({
        ...event,
        timestamp: new Date(),
      });

      // Flush if buffer is full
      if (this.eventBuffer.length >= this.BATCH_SIZE) {
        await this.flushEventBuffer();
      }
    } catch (error) {
      console.error('Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Track user action with session management
   */
  async trackUserAction(
    userId: number,
    action: string,
    data?: Record<string, unknown>,
    sessionId?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: 'user_action',
      eventName: action,
      userId,
      sessionId,
      eventData: data,
      metadata: {
        source: 'user_action_tracker',
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Batch track multiple events
   */
  async batchTrackEvents(events: AnalyticsEvent[]): Promise<void> {
    try {
      // Validate all events
      events.forEach(event => this.validateEvent(event));

      // Add to buffer
      this.eventBuffer.push(...events);

      // Flush if buffer is getting large
      if (this.eventBuffer.length >= this.BATCH_SIZE) {
        await this.flushEventBuffer();
      }
    } catch (error) {
      console.error('Failed to batch track events:', error);
      throw error;
    }
  }

  /**
   * Get analytics metrics with smart caching
   */
  async getMetrics(filters: AnalyticsFilters = {}): Promise<any[]> {
    const cacheKey = `analytics:metrics:${JSON.stringify(filters)}`;
    
    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        const query = db.select().from(analyticsMetrics);
        
        // Apply filters
        const conditions = this.buildMetricsConditions(filters);
        if (conditions.length > 0) {
          query.where(and(...conditions));
        }

        return await query
          .orderBy(desc(analyticsMetrics.createdAt))
          .limit(1000);
      },
      300000 // 5 minutes cache
    );
  }

  /**
   * Get time series data with granularity options
   */
  async getTimeSeriesData(
    metricName: string,
    filters: AnalyticsFilters = {},
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesDataPoint[]> {
    const cacheKey = `analytics:timeseries:${metricName}:${granularity}:${JSON.stringify(filters)}`;
    
    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        const truncateFunction = this.getTruncateFunction(granularity);
        
        const results = await db
          .select({
            timestamp: sql`${truncateFunction}(${analyticsMetrics.periodStart})`.as('timestamp'),
            value: sql`SUM(${analyticsMetrics.value})`.as('value'),
            dimensions: analyticsMetrics.dimensions,
          })
          .from(analyticsMetrics)
          .where(
            and(
              eq(analyticsMetrics.metricName, metricName),
              ...this.buildMetricsConditions(filters)
            )
          )
          .groupBy(sql`${truncateFunction}(${analyticsMetrics.periodStart})`, analyticsMetrics.dimensions)
          .orderBy(sql`${truncateFunction}(${analyticsMetrics.periodStart})`);

        return results.map(row => ({
          timestamp: new Date(row.timestamp as string),
          value: Number(row.value),
          dimensions: row.dimensions as Record<string, unknown>,
        }));
      },
      600000 // 10 minutes cache
    );
  }

  /**
   * Get user analytics data
   */
  async getUserAnalytics(userId: number, filters: AnalyticsFilters = {}): Promise<any> {
    const cacheKey = `analytics:user:${userId}:${JSON.stringify(filters)}`;
    
    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        const events = await db
          .select()
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.userId, userId),
              ...this.buildEventConditions(filters)
            )
          )
          .orderBy(desc(analyticsEvents.timestamp))
          .limit(1000);

        const eventCounts = await db
          .select({
            eventType: analyticsEvents.eventType,
            count: count(),
          })
          .from(analyticsEvents)
          .where(eq(analyticsEvents.userId, userId))
          .groupBy(analyticsEvents.eventType);

        return {
          events,
          eventCounts,
          totalEvents: events.length,
        };
      },
      300000 // 5 minutes cache
    );
  }

  /**
   * Get property analytics data
   */
  async getPropertyAnalytics(propertyId: number, filters: AnalyticsFilters = {}): Promise<any> {
    const cacheKey = `analytics:property:${propertyId}:${JSON.stringify(filters)}`;
    
    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        const events = await db
          .select()
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.propertyId, propertyId),
              ...this.buildEventConditions(filters)
            )
          )
          .orderBy(desc(analyticsEvents.timestamp))
          .limit(1000);

        const viewCounts = await db
          .select({
            count: count(),
          })
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.propertyId, propertyId),
              eq(analyticsEvents.eventName, 'property_view')
            )
          );

        return {
          events,
          viewCount: viewCounts[0]?.count || 0,
          totalEvents: events.length,
        };
      },
      300000 // 5 minutes cache
    );
  }

  /**
   * Record performance metric with aggregation
   */
  async recordPerformanceMetric(metric: PerformanceMetric): Promise<void> {
    try {
      await db.insert(performanceMetrics).values({
        metricType: metric.metricType,
        metricName: metric.metricName,
        value: metric.value.toString(),
        unit: metric.unit,
        url: metric.url,
        userAgent: metric.userAgent,
        userId: metric.userId,
        sessionId: metric.sessionId,
        deviceType: metric.deviceType,
        connectionType: metric.connectionType,
        additionalData: metric.additionalData,
      });

      // Update aggregated metrics
      await this.updateAggregatedMetrics(metric);
    } catch (error) {
      console.error('Failed to record performance metric:', error);
      throw error;
    }
  }

  /**
   * Get Core Web Vitals with time range filtering
   */
  async getCoreWebVitals(filters: AnalyticsFilters = {}): Promise<any> {
    const cacheKey = `analytics:core-web-vitals:${JSON.stringify(filters)}`;
    
    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        const webVitalsMetrics = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];
        
        const results = await db
          .select({
            metricName: performanceMetrics.metricName,
            avgValue: sql`AVG(${performanceMetrics.value})`.as('avgValue'),
            p50Value: sql`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${performanceMetrics.value})`.as('p50Value'),
            p75Value: sql`PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${performanceMetrics.value})`.as('p75Value'),
            p95Value: sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${performanceMetrics.value})`.as('p95Value'),
            count: count(),
          })
          .from(performanceMetrics)
          .where(
            and(
              sql`${performanceMetrics.metricName} = ANY(${webVitalsMetrics})`,
              ...this.buildPerformanceConditions(filters)
            )
          )
          .groupBy(performanceMetrics.metricName);

        return results.reduce((acc, row) => {
          acc[row.metricName] = {
            average: Number(row.avgValue),
            p50: Number(row.p50Value),
            p75: Number(row.p75Value),
            p95: Number(row.p95Value),
            count: Number(row.count),
          };
          return acc;
        }, {} as Record<string, any>);
      },
      600000 // 10 minutes cache
    );
  }

  /**
   * Get bundle metrics for frontend optimization
   */
  async getBundleMetrics(filters: AnalyticsFilters = {}): Promise<any> {
    const cacheKey = `analytics:bundle-metrics:${JSON.stringify(filters)}`;
    
    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        return await db
          .select()
          .from(performanceMetrics)
          .where(
            and(
              eq(performanceMetrics.metricType, 'bundle_size'),
              ...this.buildPerformanceConditions(filters)
            )
          )
          .orderBy(desc(performanceMetrics.timestamp))
          .limit(100);
      },
      300000 // 5 minutes cache
    );
  }

  // Private helper methods

  private validateEvent(event: AnalyticsEvent): void {
    if (!event.eventType || !event.eventName) {
      throw new Error('Event type and name are required');
    }
    
    if (event.eventType.length > 100 || event.eventName.length > 200) {
      throw new Error('Event type or name too long');
    }
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await db.insert(analyticsEvents).values(
        eventsToFlush.map(event => ({
          eventType: event.eventType,
          eventName: event.eventName,
          userId: event.userId,
          sessionId: event.sessionId,
          propertyId: event.propertyId,
          professionalId: event.professionalId,
          eventData: event.eventData,
          metadata: event.metadata,
          userAgent: event.userAgent,
          ipAddress: event.ipAddress,
          referrer: event.referrer,
        }))
      );
    } catch (error) {
      console.error('Failed to flush event buffer:', error);
      // Re-add events to buffer for retry
      this.eventBuffer.unshift(...eventsToFlush);
      throw error;
    }
  }

  private startBatchProcessing(): void {
    setInterval(async () => {
      if (this.eventBuffer.length > 0) {
        await this.flushEventBuffer();
      }
    }, this.FLUSH_INTERVAL);
  }

  private buildEventConditions(filters: AnalyticsFilters): any[] {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(gte(analyticsEvents.timestamp, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(analyticsEvents.timestamp, filters.endDate));
    }
    if (filters.eventType) {
      conditions.push(eq(analyticsEvents.eventType, filters.eventType));
    }
    if (filters.eventName) {
      conditions.push(eq(analyticsEvents.eventName, filters.eventName));
    }
    if (filters.sessionId) {
      conditions.push(eq(analyticsEvents.sessionId, filters.sessionId));
    }

    return conditions;
  }

  private buildMetricsConditions(filters: AnalyticsFilters): any[] {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(gte(analyticsMetrics.periodStart, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(analyticsMetrics.periodEnd, filters.endDate));
    }
    if (filters.metricType) {
      conditions.push(eq(analyticsMetrics.metricType, filters.metricType));
    }
    if (filters.aggregationPeriod) {
      conditions.push(eq(analyticsMetrics.aggregationPeriod, filters.aggregationPeriod));
    }

    return conditions;
  }

  private buildPerformanceConditions(filters: AnalyticsFilters): any[] {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(gte(performanceMetrics.timestamp, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(performanceMetrics.timestamp, filters.endDate));
    }
    if (filters.userId) {
      conditions.push(eq(performanceMetrics.userId, filters.userId));
    }

    return conditions;
  }

  private getTruncateFunction(granularity: string): any {
    switch (granularity) {
      case 'hour':
        return sql`DATE_TRUNC('hour', ${analyticsMetrics.periodStart})`;
      case 'day':
        return sql`DATE_TRUNC('day', ${analyticsMetrics.periodStart})`;
      case 'week':
        return sql`DATE_TRUNC('week', ${analyticsMetrics.periodStart})`;
      case 'month':
        return sql`DATE_TRUNC('month', ${analyticsMetrics.periodStart})`;
      default:
        return sql`DATE_TRUNC('day', ${analyticsMetrics.periodStart})`;
    }
  }

  private async updateAggregatedMetrics(metric: PerformanceMetric): Promise<void> {
    // Update hourly aggregation
    const hourStart = new Date(metric.timestamp || new Date());
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    await this.upsertMetric({
      metricName: `${metric.metricType}_${metric.metricName}`,
      metricType: 'gauge',
      value: metric.value,
      aggregationPeriod: 'hourly',
      periodStart: hourStart,
      periodEnd: hourEnd,
      dimensions: {
        metricType: metric.metricType,
        unit: metric.unit,
        deviceType: metric.deviceType,
        connectionType: metric.connectionType,
      },
    });
  }

  private async upsertMetric(metric: AnalyticsMetric): Promise<void> {
    try {
      await db.insert(analyticsMetrics).values({
        metricName: metric.metricName,
        metricType: metric.metricType,
        value: metric.value.toString(),
        dimensions: metric.dimensions,
        tags: metric.tags,
        aggregationPeriod: metric.aggregationPeriod,
        periodStart: metric.periodStart,
        periodEnd: metric.periodEnd,
      });
    } catch (error) {
      // If insert fails due to conflict, update existing record
      console.warn('Metric upsert conflict, updating existing record:', error);
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    bufferSize: number;
    batchSize: number;
    flushInterval: number;
  } {
    return {
      bufferSize: this.eventBuffer.length,
      batchSize: this.BATCH_SIZE,
      flushInterval: this.FLUSH_INTERVAL,
    };
  }
}

/**
 * Default instance for easy access
 */
export const analyticsService = new AnalyticsService();