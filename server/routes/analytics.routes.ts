import { Router } from 'express';

import { analyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { createDeduplicationMiddleware } from '../middleware/deduplication.middleware';
import { createRateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';

const router = Router();

// Rate limiting configurations for different endpoints
const eventTrackingRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  enableGlobalLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 100 }, // 100 events per minute per user
    global: { windowMs: 60000, maxRequests: 10000 }, // 10k events per minute globally
  },
});

const batchTrackingRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  enableGlobalLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 20 }, // 20 batch requests per minute per user
    global: { windowMs: 60000, maxRequests: 1000 }, // 1k batch requests per minute globally
  },
});

const metricsRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  enableGlobalLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 60 }, // 60 metrics requests per minute per user
    global: { windowMs: 60000, maxRequests: 5000 }, // 5k metrics requests per minute globally
  },
});

const performanceRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  enableGlobalLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 200 }, // 200 performance metrics per minute per user
    global: { windowMs: 60000, maxRequests: 20000 }, // 20k performance metrics per minute globally
  },
});

// Deduplication middleware for metrics queries
const metricsDeduplication = createDeduplicationMiddleware({
  enabled: true,
  ttl: 300000, // 5 minutes
  forcePatterns: [
    /^\/api\/analytics\/metrics$/,
    /^\/api\/analytics\/dashboard$/,
    /^\/api\/analytics\/performance\/core-web-vitals$/,
  ],
});

const timeSeriesDeduplication = createDeduplicationMiddleware({
  enabled: true,
  ttl: 600000, // 10 minutes
  forcePatterns: [/^\/api\/analytics\/metrics\/.*\/timeseries$/],
});

// Public routes (no authentication required)

/**
 * @route GET /api/analytics/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', analyticsController.getHealth);

// Event tracking routes (authentication required)

/**
 * @route POST /api/analytics/events
 * @desc Track a single analytics event
 * @access Private
 * @rateLimit 100 requests per minute per user
 */
router.post('/events',
  authMiddleware,
  eventTrackingRateLimit,
  validationMiddleware,
  analyticsController.trackEvent
);

/**
 * @route POST /api/analytics/events/batch
 * @desc Batch track multiple events
 * @access Private
 * @rateLimit 20 requests per minute per user
 */
router.post('/events/batch',
  authMiddleware,
  batchTrackingRateLimit,
  validationMiddleware,
  analyticsController.batchTrackEvents
);

/**
 * @route POST /api/analytics/users/:userId/actions
 * @desc Track user action
 * @access Private
 * @rateLimit 100 requests per minute per user
 */
router.post('/users/:userId(\\d+)/actions',
  authMiddleware,
  eventTrackingRateLimit,
  validationMiddleware,
  analyticsController.trackUserAction
);

// Performance tracking routes

/**
 * @route POST /api/analytics/performance
 * @desc Record performance metric
 * @access Private
 * @rateLimit 200 requests per minute per user
 */
router.post('/performance',
  authMiddleware,
  performanceRateLimit,
  validationMiddleware,
  analyticsController.recordPerformanceMetric
);

// Metrics retrieval routes (authentication required)

/**
 * @route GET /api/analytics/metrics
 * @desc Get analytics metrics with filters
 * @access Private
 * @rateLimit 60 requests per minute per user
 */
router.get('/metrics',
  authMiddleware,
  metricsRateLimit,
  metricsDeduplication,
  analyticsController.getMetrics
);

/**
 * @route GET /api/analytics/metrics/:metricName/timeseries
 * @desc Get time series data for a specific metric
 * @access Private
 * @rateLimit 60 requests per minute per user
 */
router.get('/metrics/:metricName/timeseries',
  authMiddleware,
  metricsRateLimit,
  timeSeriesDeduplication,
  analyticsController.getTimeSeriesData
);

/**
 * @route GET /api/analytics/users/:userId
 * @desc Get user analytics data
 * @access Private
 * @rateLimit 60 requests per minute per user
 */
router.get('/users/:userId(\\d+)',
  authMiddleware,
  metricsRateLimit,
  metricsDeduplication,
  analyticsController.getUserAnalytics
);

/**
 * @route GET /api/analytics/properties/:propertyId
 * @desc Get property analytics data
 * @access Private
 * @rateLimit 60 requests per minute per user
 */
router.get('/properties/:propertyId(\\d+)',
  authMiddleware,
  metricsRateLimit,
  metricsDeduplication,
  analyticsController.getPropertyAnalytics
);

// Performance metrics routes

/**
 * @route GET /api/analytics/performance/core-web-vitals
 * @desc Get Core Web Vitals metrics
 * @access Private
 * @rateLimit 60 requests per minute per user
 */
router.get('/performance/core-web-vitals',
  authMiddleware,
  metricsRateLimit,
  metricsDeduplication,
  analyticsController.getCoreWebVitals
);

/**
 * @route GET /api/analytics/performance/bundle-metrics
 * @desc Get bundle metrics for frontend optimization
 * @access Private
 * @rateLimit 60 requests per minute per user
 */
router.get('/performance/bundle-metrics',
  authMiddleware,
  metricsRateLimit,
  metricsDeduplication,
  analyticsController.getBundleMetrics
);

// Dashboard routes

/**
 * @route GET /api/analytics/dashboard
 * @desc Get comprehensive analytics dashboard data
 * @access Private
 * @rateLimit 60 requests per minute per user
 */
router.get('/dashboard',
  authMiddleware,
  metricsRateLimit,
  metricsDeduplication,
  analyticsController.getDashboardData
);

// Admin routes (admin authentication required)
// TODO: Add admin middleware when implemented

/**
 * @route GET /api/analytics/admin/stats
 * @desc Get detailed analytics service statistics (admin only)
 * @access Admin
 */
// router.get('/admin/stats', adminMiddleware, analyticsController.getAdminStats);

/**
 * @route POST /api/analytics/admin/flush
 * @desc Manually flush event buffer (admin only)
 * @access Admin
 */
// router.post('/admin/flush', adminMiddleware, analyticsController.flushEventBuffer);

export default router;