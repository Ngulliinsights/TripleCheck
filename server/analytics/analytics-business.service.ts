import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';

import { CacheService } from '../cache/CacheService'
import { db } from '../infrastructure/database/connection';
import { analyticsEvents, performanceMetrics } from '../infrastructure/database/schemas/consolidated';
import { RequestDeduplicator } from '../infrastructure/deduplication/RequestDeduplicator';

/**
 * Analytics event data structure
 */
export interface AnalyticsEvent {
  eventType: string;
  eventName: string;
  userId?: number | undefined;
  sessionId?: string | undefined;
  propertyId?: number | undefined;
  professionalId?: number | undefined;
  eventData?: Record<string, unknown> | undefined;
  metadata?: Record<string, unknown> | undefined;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
  referrer?: string | undefined;
  timestamp?: Date;
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
  timestamp?: Date;
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
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.error('Failed to batch track events:', error);
      throw error;
    }
  }

  /**
   * Get analytics metrics with smart caching
   */
  async getMetrics(filters: AnalyticsFilters = {}): Promise<Record<string, unknown>[]> {
    const cacheKey = `analytics:metrics:${JSON.stringify(filters)}`;

    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        const query = db.select().from(performanceMetrics);

        // Apply filters
        const conditions = this.buildPerformanceConditions(filters);
        if (conditions.length > 0) {
          query.where(and(...conditions));
        }

        return await query
          .orderBy(desc(performanceMetrics.createdAt))
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
            timestamp: sql`${truncateFunction}(${performanceMetrics.timestamp})`.as('timestamp'),
            value: sql`AVG(${performanceMetrics.value})`.as('value'),
            metadata: performanceMetrics.metadata,
          })
          .from(performanceMetrics)
          .where(
            and(
              eq(performanceMetrics.name, metricName),
              ...this.buildPerformanceConditions(filters)
            )
          )
          .groupBy(sql`${truncateFunction}(${performanceMetrics.timestamp})`, performanceMetrics.metadata)
          .orderBy(sql`${truncateFunction}(${performanceMetrics.timestamp})`);

        return results.map(row => ({
          timestamp: new Date(row.timestamp as string),
          value: Number(row.value),
          dimensions: row.metadata as Record<string, unknown>,
        }));
      },
      600000 // 10 minutes cache
    );
  }

  /**
   * Get user analytics data
   */
  async getUserAnalytics(userId: number, filters: AnalyticsFilters = {}): Promise<{
    events: Record<string, unknown>[];
    eventCounts: Record<string, unknown>[];
    totalEvents: number;
  }> {
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
  async getPropertyAnalytics(propertyId: number, filters: AnalyticsFilters = {}): Promise<{
    events: Record<string, unknown>[];
    viewCount: number;
    totalEvents: number;
  }> {
    const cacheKey = `analytics:property:${propertyId}:${JSON.stringify(filters)}`;

    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        const events = await db
          .select()
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.relatedEntityId, propertyId),
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
              eq(analyticsEvents.relatedEntityId, propertyId),
              eq(analyticsEvents.action, 'property_view')
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
        metricId: `${metric.metricType}_${Date.now()}`,
        name: metric.metricName,
        type: metric.metricType as 'counter' | 'gauge' | 'histogram' | 'timer',
        value: metric.value.toString(),
        source: 'analytics_service',
      });

      // Update aggregated metrics
      await this.updateAggregatedMetrics(metric);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to record performance metric:', error);
      throw error;
    }
  }

  /**
   * Get Core Web Vitals with time range filtering
   */
  async getCoreWebVitals(filters: AnalyticsFilters = {}): Promise<Record<string, {
    average: number;
    p50: number;
    p75: number;
    p95: number;
    count: number;
  }>> {
    const cacheKey = `analytics:core-web-vitals:${JSON.stringify(filters)}`;

    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        const webVitalsMetrics = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];

        const results = await db
          .select({
            metricName: performanceMetrics.name,
            avgValue: sql`AVG(${performanceMetrics.value})`.as('avgValue'),
            p50Value: sql`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${performanceMetrics.value})`.as('p50Value'),
            p75Value: sql`PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${performanceMetrics.value})`.as('p75Value'),
            p95Value: sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ${performanceMetrics.value})`.as('p95Value'),
            count: count(),
          })
          .from(performanceMetrics)
          .where(
            and(
              sql`${performanceMetrics.name} = ANY(${webVitalsMetrics})`,
              ...this.buildPerformanceConditions(filters)
            )
          )
          .groupBy(performanceMetrics.name);

        return results.reduce((acc, row) => {
          acc[row.metricName] = {
            average: Number(row.avgValue),
            p50: Number(row.p50Value),
            p75: Number(row.p75Value),
            p95: Number(row.p95Value),
            count: Number(row.count),
          };
          return acc;
        }, {} as Record<string, {
          average: number;
          p50: number;
          p75: number;
          p95: number;
          count: number;
        }>);
      },
      600000 // 10 minutes cache
    );
  }

  /**
   * Get bundle metrics for frontend optimization
   */
  async getBundleMetrics(filters: AnalyticsFilters = {}): Promise<Record<string, unknown>[]> {
    const cacheKey = `analytics:bundle-metrics:${JSON.stringify(filters)}`;

    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        return await db
          .select()
          .from(performanceMetrics)
          .where(
            and(
              eq(performanceMetrics.type, 'gauge'),
              sql`${performanceMetrics.name} LIKE '%bundle%'`,
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
        eventsToFlush.map((event, index) => ({
          eventId: `${Date.now()}_${index}`,
          sessionId: event.sessionId,
          userId: event.userId,
          eventType: event.eventType as 'page_view' | 'property_view' | 'search' | 'filter_applied' | 'property_favorite' | 'property_unfavorite' | 'property_inquiry' | 'user_registration' | 'user_login' | 'verification_started' | 'verification_completed' | 'transaction_initiated' | 'transaction_completed' | 'error_occurred',
          category: 'user_behavior' as 'user_behavior' | 'property_interaction' | 'verification_process' | 'transaction_flow' | 'system_performance' | 'error_tracking',
          action: event.eventName,
          label: event.eventName,
          properties: event.eventData || {},
          relatedEntityId: event.propertyId,
          relatedEntityType: event.propertyId ? 'property' : undefined,
          userAgent: event.userAgent,
          ipAddress: event.ipAddress,
          referrer: event.referrer,
        }))
      );
    } catch (error) {
      // eslint-disable-next-line no-console
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

  private buildEventConditions(filters: AnalyticsFilters) {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(gte(analyticsEvents.timestamp, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(analyticsEvents.timestamp, filters.endDate));
    }
    if (filters.eventType) {
      conditions.push(eq(analyticsEvents.eventType, filters.eventType as any));
    }
    if (filters.eventName) {
      conditions.push(eq(analyticsEvents.action, filters.eventName));
    }
    if (filters.sessionId) {
      conditions.push(eq(analyticsEvents.sessionId, filters.sessionId));
    }

    return conditions;
  }



  private buildPerformanceConditions(filters: AnalyticsFilters) {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(gte(performanceMetrics.timestamp, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(performanceMetrics.timestamp, filters.endDate));
    }
    // Note: userId is not available in performance_metrics table
    // This filter is ignored for performance metrics

    return conditions;
  }

  private getTruncateFunction(granularity: string): unknown {
    switch (granularity) {
      case 'hour':
        return sql`DATE_TRUNC('hour', ${performanceMetrics.timestamp})`;
      case 'day':
        return sql`DATE_TRUNC('day', ${performanceMetrics.timestamp})`;
      case 'week':
        return sql`DATE_TRUNC('week', ${performanceMetrics.timestamp})`;
      case 'month':
        return sql`DATE_TRUNC('month', ${performanceMetrics.timestamp})`;
      default:
        return sql`DATE_TRUNC('day', ${performanceMetrics.timestamp})`;
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
      await db.insert(performanceMetrics).values({
        metricId: `${metric.metricName}_${Date.now()}`,
        name: metric.metricName,
        type: metric.metricType as 'counter' | 'gauge' | 'histogram' | 'timer',
        value: metric.value.toString(),
        source: 'analytics_aggregation',
      });
    } catch (error) {
      // If insert fails due to conflict, update existing record
      // eslint-disable-next-line no-console
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