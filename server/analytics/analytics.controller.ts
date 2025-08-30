import { Request, Response } from 'express';
import { z } from 'zod';

import { CacheService } from "../infrastructure/cache"
import { asyncHandler } from "../middleware/error";
import { AnalyticsService } from '../services/AnalyticsService';
import { ResponseHelper } from '../utils/response-helpers';

// Validation schemas
const trackEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  eventName: z.string().min(1).max(200),
  userId: z.number().optional(),
  sessionId: z.string().optional(),
  propertyId: z.number().optional(),
  professionalId: z.number().optional(),
  eventData: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  referrer: z.string().optional(),
});

const batchTrackEventsSchema = z.object({
  events: z.array(trackEventSchema).min(1).max(100),
});

const trackUserActionSchema = z.object({
  action: z.string().min(1).max(200),
  data: z.record(z.unknown()).optional(),
  sessionId: z.string().optional(),
});

const performanceMetricSchema = z.object({
  metricType: z.string().min(1).max(50),
  metricName: z.string().min(1).max(200),
  value: z.number().min(0),
  unit: z.string().min(1).max(20),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  userId: z.number().optional(),
  sessionId: z.string().optional(),
  deviceType: z.string().optional(),
  connectionType: z.string().optional(),
  additionalData: z.record(z.unknown()).optional(),
});

const analyticsFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventType: z.string().optional(),
  eventName: z.string().optional(),
  userId: z.number().optional(),
  propertyId: z.number().optional(),
  professionalId: z.number().optional(),
  sessionId: z.string().optional(),
  metricType: z.string().optional(),
  aggregationPeriod: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
});

const timeSeriesQuerySchema = z.object({
  metricName: z.string().min(1),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  ...analyticsFiltersSchema.shape,
});

/**
 * Analytics Controller
 * Handles all analytics-related API endpoints with proper validation and caching
 */
export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService(new CacheService());
  }

  /**
   * Track a single analytics event
   * POST /api/analytics/events
   */
  trackEvent = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = trackEventSchema.parse(req.body);

    // Add IP address and user agent from request
    const eventData = {
      ...validatedData,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    await this.analyticsService.trackEvent(eventData);

    ResponseHelper.success(res, { message: 'Event tracked successfully' });
  });

  /**
   * Batch track multiple events
   * POST /api/analytics/events/batch
   */
  batchTrackEvents = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = batchTrackEventsSchema.parse(req.body);

    // Add IP address and user agent to all events
    const eventsWithMetadata = validatedData.events.map(event => ({
      ...event,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    }));

    await this.analyticsService.batchTrackEvents(eventsWithMetadata);

    ResponseHelper.success(res, { 
      message: 'Events tracked successfully',
      count: eventsWithMetadata.length 
    });
  });

  /**
   * Track user action
   * POST /api/analytics/users/:userId/actions
   */
  trackUserAction = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const validatedData = trackUserActionSchema.parse(req.body);

    if (isNaN(userId)) {
      return ResponseHelper.badRequest(res, 'Invalid user ID');
    }

    await this.analyticsService.trackUserAction(
      userId,
      validatedData.action,
      validatedData.data,
      validatedData.sessionId
    );

    ResponseHelper.success(res, { message: 'User action tracked successfully' });
  });

  /**
   * Get analytics metrics
   * GET /api/analytics/metrics
   */
  getMetrics = asyncHandler(async (req: Request, res: Response) => {
    const filters = analyticsFiltersSchema.parse(req.query);
    
    // Convert string dates to Date objects
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const metrics = await this.analyticsService.getMetrics(processedFilters);

    ResponseHelper.success(res, {
      metrics,
      count: metrics.length,
      filters: processedFilters,
    });
  });

  /**
   * Get time series data
   * GET /api/analytics/metrics/:metricName/timeseries
   */
  getTimeSeriesData = asyncHandler(async (req: Request, res: Response) => {
    const {metricName} = req.params;
    const queryData = timeSeriesQuerySchema.parse(req.query);
    
    // Convert string dates to Date objects
    const filters = {
      ...queryData,
      startDate: queryData.startDate ? new Date(queryData.startDate) : undefined,
      endDate: queryData.endDate ? new Date(queryData.endDate) : undefined,
    };

    const timeSeriesData = await this.analyticsService.getTimeSeriesData(
      metricName,
      filters,
      queryData.granularity
    );

    ResponseHelper.success(res, {
      metricName,
      granularity: queryData.granularity,
      data: timeSeriesData,
      count: timeSeriesData.length,
    });
  });

  /**
   * Get user analytics
   * GET /api/analytics/users/:userId
   */
  getUserAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const filters = analyticsFiltersSchema.parse(req.query);

    if (isNaN(userId)) {
      return ResponseHelper.badRequest(res, 'Invalid user ID');
    }

    // Convert string dates to Date objects
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const userAnalytics = await this.analyticsService.getUserAnalytics(userId, processedFilters);

    ResponseHelper.success(res, {
      userId,
      analytics: userAnalytics,
      filters: processedFilters,
    });
  });

  /**
   * Get property analytics
   * GET /api/analytics/properties/:propertyId
   */
  getPropertyAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const propertyId = parseInt(req.params.propertyId);
    const filters = analyticsFiltersSchema.parse(req.query);

    if (isNaN(propertyId)) {
      return ResponseHelper.badRequest(res, 'Invalid property ID');
    }

    // Convert string dates to Date objects
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const propertyAnalytics = await this.analyticsService.getPropertyAnalytics(propertyId, processedFilters);

    ResponseHelper.success(res, {
      propertyId,
      analytics: propertyAnalytics,
      filters: processedFilters,
    });
  });

  /**
   * Record performance metric
   * POST /api/analytics/performance
   */
  recordPerformanceMetric = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = performanceMetricSchema.parse(req.body);

    // Add user agent and session info if available
    const metricData = {
      ...validatedData,
      userAgent: validatedData.userAgent || req.get('User-Agent'),
      userId: validatedData.userId || req.session?.userId,
    };

    await this.analyticsService.recordPerformanceMetric(metricData);

    ResponseHelper.success(res, { message: 'Performance metric recorded successfully' });
  });

  /**
   * Get Core Web Vitals
   * GET /api/analytics/performance/core-web-vitals
   */
  getCoreWebVitals = asyncHandler(async (req: Request, res: Response) => {
    const filters = analyticsFiltersSchema.parse(req.query);
    
    // Convert string dates to Date objects
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const coreWebVitals = await this.analyticsService.getCoreWebVitals(processedFilters);

    ResponseHelper.success(res, {
      coreWebVitals,
      filters: processedFilters,
    });
  });

  /**
   * Get bundle metrics
   * GET /api/analytics/performance/bundle-metrics
   */
  getBundleMetrics = asyncHandler(async (req: Request, res: Response) => {
    const filters = analyticsFiltersSchema.parse(req.query);
    
    // Convert string dates to Date objects
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const bundleMetrics = await this.analyticsService.getBundleMetrics(processedFilters);

    ResponseHelper.success(res, {
      bundleMetrics,
      count: bundleMetrics.length,
      filters: processedFilters,
    });
  });

  /**
   * Get analytics dashboard data
   * GET /api/analytics/dashboard
   */
  getDashboardData = asyncHandler(async (req: Request, res: Response) => {
    const filters = analyticsFiltersSchema.parse(req.query);
    
    // Convert string dates to Date objects
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    // Get multiple analytics data in parallel
    const [metrics, coreWebVitals, bundleMetrics] = await Promise.all([
      this.analyticsService.getMetrics(processedFilters),
      this.analyticsService.getCoreWebVitals(processedFilters),
      this.analyticsService.getBundleMetrics(processedFilters),
    ]);

    ResponseHelper.success(res, {
      dashboard: {
        metrics: {
          data: metrics,
          count: metrics.length,
        },
        performance: {
          coreWebVitals,
          bundleMetrics: {
            data: bundleMetrics,
            count: bundleMetrics.length,
          },
        },
      },
      filters: processedFilters,
    });
  });

  /**
   * Get service health and statistics
   * GET /api/analytics/health
   */
  getHealth = asyncHandler(async (req: Request, res: Response) => {
    const stats = this.analyticsService.getStats();

    ResponseHelper.success(res, {
      status: 'healthy',
      service: 'AnalyticsService',
      stats,
      timestamp: new Date().toISOString(),
    });
  });
}

/**
 * Default instance for easy access
 */
export const analyticsController = new AnalyticsController();