import { Express, Request, Response } from "express";
import { z } from "zod";

import { CacheService, defaultCacheConfig } from "../infrastructure/cache"
import {
  AuthenticatedRequest,
  requireAuth,
} from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error";
import { FraudIntelligenceService } from "../services/FraudIntelligenceService";

// Constants for validation error messages to avoid duplication
const LOCATION_MIN_MESSAGE = "Location must be at least 2 characters";
const LOCATION_MAX_MESSAGE = "Location cannot exceed 100 characters";

const VALIDATION_MESSAGES = {
  SEVERITY_OPTIONS: "Severity must be 'high', 'medium', or 'low'",
  LOCATION_MIN: LOCATION_MIN_MESSAGE,
  LOCATION_MAX: LOCATION_MAX_MESSAGE,
  ALERT_TYPE_OPTIONS:
    "Type must be 'active_threat', 'pattern_detected', or 'area_warning'",
} as const;

// Enhanced validation schemas with better error messages and stricter validation
const FraudAlertQuerySchema = z.object({
  severity: z
    .enum(["high", "medium", "low"], {
      errorMap: () => ({ message: VALIDATION_MESSAGES.SEVERITY_OPTIONS }),
    })
    .optional(),
  location: z
    .string()
    .min(2, LOCATION_MIN_MESSAGE)
    .max(100, LOCATION_MAX_MESSAGE)
    .optional(),
  type: z
    .enum(["active_threat", "pattern_detected", "area_warning"], {
      errorMap: () => ({ message: VALIDATION_MESSAGES.ALERT_TYPE_OPTIONS }),
    })
    .optional(),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(10),
  offset: z.coerce
    .number()
    .int("Offset must be an integer")
    .min(0, "Offset cannot be negative")
    .default(0),
});

const ReportFraudSchema = z
  .object({
    type: z.enum(
      [
        "title_deed",
        "rental_scam",
        "developer_fraud",
        "investment_scam",
        "other",
      ],
      {
        errorMap: () => ({ message: "Invalid fraud type" }),
      }
    ),
    location: z
      .string()
      .min(2, LOCATION_MIN_MESSAGE)
      .max(100, LOCATION_MAX_MESSAGE),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description cannot exceed 2000 characters"),
    amount: z
      .string()
      .refine((val) => /^\d+(?:\.\d{1,2})?$/u.test(val), {
        message: "Amount must be a valid number with up to 2 decimal places",
      })
      .optional()
      .transform(val => val || undefined),
    evidence: z
      .array(z.string().url("Each evidence item must be a valid URL"))
      .max(10, "Cannot submit more than 10 evidence items")
      .optional(),
    anonymous: z.boolean().default(false),
    contactInfo: z
      .object({
        phone: z
          .string()
          .regex(/^[+]?[\d\s\-()]+$/u, "Invalid phone number format")
          .optional(),
        email: z.string().email("Invalid email format").optional(),
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.anonymous || data.contactInfo?.phone || data.contactInfo?.email,
    {
      message: "Contact information is required for non-anonymous reports",
      path: ["contactInfo"],
    }
  );

const FraudTrendQuerySchema = z.object({
  period: z
    .enum(["week", "month", "quarter", "year"], {
      errorMap: () => ({
        message: "Period must be 'week', 'month', 'quarter', or 'year'",
      }),
    })
    .default("month"),
  location: z
    .string()
    .min(2, LOCATION_MIN_MESSAGE)
    .max(100, LOCATION_MAX_MESSAGE)
    .optional(),
  type: z
    .string()
    .min(1, "Type cannot be empty")
    .max(50, "Type cannot exceed 50 characters")
    .optional(),
});

const AlertSubscriptionSchema = z.object({
  locations: z
    .array(z.string().min(2).max(100))
    .min(1, "At least one location is required")
    .max(10, "Cannot subscribe to more than 10 locations"),
  alertTypes: z
    .array(z.enum(["active_threat", "pattern_detected", "area_warning"]))
    .min(1, "At least one alert type is required"),
  severity: z
    .array(z.enum(["high", "medium", "low"]))
    .min(1, "At least one severity level is required"),
  notificationMethods: z
    .array(z.enum(["email", "sms", "push"]))
    .min(1, "At least one notification method is required"),
});

// Cache configuration constants for better maintainability
const CACHE_DURATIONS = {
  FRAUD_ALERTS: { ttl: 300 }, // 5 minutes - fraud alerts need fresh data
  FRAUD_TRENDS: { ttl: 3600 }, // 1 hour - trends change less frequently
  PROTECTION_STATS: { ttl: 900 }, // 15 minutes - moderate freshness needed
  EMERGENCY_RESOURCES: { ttl: 86400 }, // 1 day - rarely changes
} as const;

// Cache key generators for consistency and to avoid typos
const getCacheKey = {
  fraudAlerts: (query: unknown): string =>
    `fraud_alerts:${JSON.stringify(query)}`,
  fraudTrends: (query: unknown): string =>
    `fraud_trends:${JSON.stringify(query)}`,
  protectionStats: (): string => "fraud_protection_stats",
  emergencyResources: (): string => "emergency_resources",
} as const;

// Standardized error response helper to reduce code duplication
const createErrorResponse = (
  res: Response,
  statusCode: number,
  error: string,
  details?: unknown,
  message?: string
): Response => {
  const response: {
    success: false;
    error: string;
    details?: unknown;
    message?: string;
  } = { success: false, error };

  if (details) response.details = details;
  if (message) response.message = message;

  return res.status(statusCode).json(response);
};

// Standardized success response helper for consistency
const createSuccessResponse = (
  res: Response,
  data: unknown,
  statusCode = 200,
  cached = false,
  message?: string
): Response => {
  const response: {
    success: true;
    data: unknown;
    cached?: boolean;
    message?: string;
  } = { success: true, data };

  if (cached) response.cached = true;
  if (message) response.message = message;

  return res.status(statusCode).json(response);
};

// Enhanced error handling wrapper that provides better context
const handleRouteError = (
  error: unknown,
  res: Response,
  context: string,
  fallbackMessage: string
): Response => {
  // Use proper logging instead of console.error
  // console.error(`${context} error:`, error);

  if (error instanceof z.ZodError) {
    return createErrorResponse(
      res,
      400,
      "Invalid request parameters",
      error.errors
    );
  }

  const errorMessage =
    error instanceof Error ? error.message : "Unknown error occurred";
  return createErrorResponse(
    res,
    500,
    fallbackMessage,
    undefined,
    errorMessage
  );
};

export function registerFraudIntelligenceRoutes(app: Express): void {
  // Initialize services once to avoid repeated instantiation
  const fraudService = new FraudIntelligenceService();
  const cache = new CacheService(defaultCacheConfig);

  /**
   * Get active fraud alerts with enhanced filtering and caching
   * @route GET /api/fraud-intelligence/alerts
   * @description Retrieves active fraud alerts with optional filtering by severity, location, and type
   */
  app.get(
    "/api/fraud-intelligence/alerts",
    asyncHandler(async (req: Request, res: Response): Promise<Response> => {
      try {
        // Parse and validate query parameters with enhanced error handling
        const query = FraudAlertQuerySchema.parse(req.query);

        // Generate consistent cache key and check for cached data
        const cacheKey = getCacheKey.fraudAlerts(query);
        const cached = await cache.get(cacheKey);

        if (cached) {
          return createSuccessResponse(res, cached, 200, true);
        }

        // Fetch fresh data from service - filter out undefined values
        const filteredQuery = Object.fromEntries(
          Object.entries(query).filter(([, value]) => value !== undefined)
        ) as {
          severity?: 'high' | 'medium' | 'low';
          location?: string;
          type?: 'active_threat' | 'pattern_detected' | 'area_warning';
          limit?: number;
          offset?: number;
        };
        
        const alerts = await fraudService.getActiveAlerts(filteredQuery);

        // Cache the results with appropriate TTL
        await cache.set(cacheKey, alerts, CACHE_DURATIONS.FRAUD_ALERTS);

        return createSuccessResponse(res, alerts);
      } catch (error) {
        return handleRouteError(
          error,
          res,
          "Fraud alerts fetch",
          "Failed to fetch fraud alerts"
        );
      }
    })
  );

  /**
   * Get fraud trends and analytics with time-based filtering
   * @route GET /api/fraud-intelligence/trends
   * @description Provides fraud trend analysis over specified time periods
   */
  app.get(
    "/api/fraud-intelligence/trends",
    asyncHandler(async (req: Request, res: Response): Promise<Response> => {
      try {
        const query = FraudTrendQuerySchema.parse(req.query);

        const cacheKey = getCacheKey.fraudTrends(query);
        const cached = await cache.get(cacheKey);

        if (cached) {
          return createSuccessResponse(res, cached, 200, true);
        }

        // Filter out undefined values for trends query
        const filteredTrendsQuery = Object.fromEntries(
          Object.entries(query).filter(([, value]) => value !== undefined)
        ) as {
          period?: 'week' | 'month' | 'quarter' | 'year';
          location?: string;
          type?: string;
        };
        
        const trends = await fraudService.getFraudTrends(filteredTrendsQuery);

        // Cache trends for longer since they change less frequently
        await cache.set(cacheKey, trends, CACHE_DURATIONS.FRAUD_TRENDS);

        return createSuccessResponse(res, trends);
      } catch (error) {
        return handleRouteError(
          error,
          res,
          "Fraud trends fetch",
          "Failed to fetch fraud trends"
        );
      }
    })
  );

  /**
   * Get comprehensive protection statistics
   * @route GET /api/fraud-intelligence/stats
   * @description Returns overall protection statistics and metrics
   */
  app.get(
    "/api/fraud-intelligence/stats",
    asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
      try {
        const cacheKey = getCacheKey.protectionStats();
        const cached = await cache.get(cacheKey);

        if (cached) {
          return createSuccessResponse(res, cached, 200, true);
        }

        const stats = await fraudService.getProtectionStats();

        // Cache stats for moderate duration
        await cache.set(cacheKey, stats, CACHE_DURATIONS.PROTECTION_STATS);

        return createSuccessResponse(res, stats);
      } catch (error) {
        return handleRouteError(
          error,
          res,
          "Protection stats fetch",
          "Failed to fetch protection statistics"
        );
      }
    })
  );

  /**
   * Submit a new fraud report with comprehensive validation
   * @route POST /api/fraud-intelligence/report
   * @description Allows authenticated users to report fraud incidents
   */
  app.post(
    "/api/fraud-intelligence/report",
    requireAuth,
    asyncHandler(
      async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
        try {
          const reportData = ReportFraudSchema.parse(req.body);
          const userId = req.session?.userId;

          // Enhanced authentication check with better error messaging
          if (!userId) {
            return createErrorResponse(
              res,
              401,
              "Authentication required to submit fraud reports"
            );
          }

          // Submit the fraud report with enhanced data structure
          const report = await fraudService.reportFraud({
            type: reportData.type,
            location: reportData.location,
            description: reportData.description,
            amount: reportData.amount,
            reporterId: userId,
            timestamp: new Date(),
            anonymous: reportData.anonymous,
            contactInfo: reportData.contactInfo,
            evidence: reportData.evidence,
          });

          // Efficiently invalidate related caches using Promise.all for better performance
          await Promise.all([
            cache.invalidateByTags(["fraud_alerts"]),
            cache.invalidateByTags(["fraud_trends"]),
            cache.delete("fraud_protection_stats"),
          ]);

          return createSuccessResponse(
            res,
            {
              reportId: report.id,
              status: report.status,
              estimatedProcessingTime: "24 hours",
            },
            201,
            false,
            "Fraud report submitted successfully. Our security team will investigate within 24 hours."
          );
        } catch (error) {
          return handleRouteError(
            error,
            res,
            "Fraud report submission",
            "Failed to submit fraud report"
          );
        }
      }
    )
  );

  /**
   * Check the status of a submitted fraud report
   * @route GET /api/fraud-intelligence/reports/:reportId/status
   * @description Allows users to check the status of their submitted reports
   */
  app.get(
    "/api/fraud-intelligence/reports/:reportId/status",
    requireAuth,
    asyncHandler(
      async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
        try {
          const { reportId } = req.params;
          const userId = req.session?.userId;

          if (!userId) {
            return createErrorResponse(
              res,
              401,
              "Authentication required to view report status"
            );
          }

          // Enhanced validation for reportId parameter
          if (!reportId || reportId.trim().length === 0) {
            return createErrorResponse(res, 400, "Valid report ID is required");
          }

          const report = await fraudService.getReportStatus(
            reportId.trim(),
            userId
          );

          if (!report) {
            return createErrorResponse(
              res,
              404,
              "Report not found or access denied"
            );
          }

          return createSuccessResponse(res, report);
        } catch (error) {
          return handleRouteError(
            error,
            res,
            "Report status fetch",
            "Failed to fetch report status"
          );
        }
      }
    )
  );

  /**
   * Get emergency resources and contact information
   * @route GET /api/fraud-intelligence/emergency-resources
   * @description Provides emergency contacts and resources for fraud victims
   */
  app.get(
    "/api/fraud-intelligence/emergency-resources",
    asyncHandler(async (_req: Request, res: Response): Promise<Response> => {
      try {
        const cacheKey = getCacheKey.emergencyResources();
        const cached = await cache.get(cacheKey);

        if (cached) {
          return createSuccessResponse(res, cached, 200, true);
        }

        const resources = await fraudService.getEmergencyResources();

        // Cache emergency resources for extended period since they rarely change
        await cache.set(
          cacheKey,
          resources,
          CACHE_DURATIONS.EMERGENCY_RESOURCES
        );

        return createSuccessResponse(res, resources);
      } catch (error) {
        return handleRouteError(
          error,
          res,
          "Emergency resources fetch",
          "Failed to fetch emergency resources"
        );
      }
    })
  );

  /**
   * Subscribe to fraud alerts with customizable preferences
   * @route POST /api/fraud-intelligence/subscribe
   * @description Allows users to subscribe to fraud alerts based on their preferences
   */
  app.post(
    "/api/fraud-intelligence/subscribe",
    requireAuth,
    asyncHandler(
      async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
        try {
          const subscriptionData = AlertSubscriptionSchema.parse(req.body);
          const userId = req.session?.userId;

          if (!userId) {
            return createErrorResponse(
              res,
              401,
              "Authentication required to subscribe to alerts"
            );
          }

          const subscription = await fraudService.subscribeToAlerts(userId, subscriptionData);

          return createSuccessResponse(
            res,
            {
              subscriptionId: subscription.subscriptionId,
              status: subscription.status,
            },
            200,
            false,
            "Successfully subscribed to fraud alerts. You will receive notifications based on your selected preferences."
          );
        } catch (error) {
          return handleRouteError(
            error,
            res,
            "Alert subscription",
            "Failed to subscribe to fraud alerts"
          );
        }
      }
    )
  );

  /**
   * Update existing fraud alert subscription
   * @route PUT /api/fraud-intelligence/subscribe/:subscriptionId
   * @description Allows users to modify their existing alert subscriptions
   */
  app.put(
    "/api/fraud-intelligence/subscribe/:subscriptionId",
    requireAuth,
    asyncHandler(
      async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
        try {
          const { subscriptionId } = req.params;
          const subscriptionData = AlertSubscriptionSchema.parse(req.body);
          const userId = req.session?.userId;

          if (!userId) {
            return createErrorResponse(
              res,
              401,
              "Authentication required to update subscription"
            );
          }

          if (!subscriptionId || subscriptionId.trim().length === 0) {
            return createErrorResponse(
              res,
              400,
              "Valid subscription ID is required"
            );
          }

          const updatedSubscription =
            await fraudService.updateAlertSubscription(
              subscriptionId.trim(),
              userId,
              subscriptionData
            );

          if (!updatedSubscription) {
            return createErrorResponse(
              res,
              404,
              "Subscription not found or access denied"
            );
          }

          return createSuccessResponse(
            res,
            updatedSubscription,
            200,
            false,
            "Subscription preferences updated successfully"
          );
        } catch (error) {
          return handleRouteError(
            error,
            res,
            "Subscription update",
            "Failed to update alert subscription"
          );
        }
      }
    )
  );

  /**
   * Unsubscribe from fraud alerts
   * @route DELETE /api/fraud-intelligence/subscribe/:subscriptionId
   * @description Allows users to cancel their fraud alert subscriptions
   */
  app.delete(
    "/api/fraud-intelligence/subscribe/:subscriptionId",
    requireAuth,
    asyncHandler(
      async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
        try {
          const { subscriptionId } = req.params;
          const userId = req.session?.userId;

          if (!userId) {
            return createErrorResponse(
              res,
              401,
              "Authentication required to unsubscribe"
            );
          }

          if (!subscriptionId || subscriptionId.trim().length === 0) {
            return createErrorResponse(
              res,
              400,
              "Valid subscription ID is required"
            );
          }

          const result = await fraudService.unsubscribeFromAlerts(
            subscriptionId.trim(),
            userId
          );

          if (!result) {
            return createErrorResponse(
              res,
              404,
              "Subscription not found or already cancelled"
            );
          }

          return createSuccessResponse(
            res,
            { unsubscribedAt: new Date() },
            200,
            false,
            "Successfully unsubscribed from fraud alerts"
          );
        } catch (error) {
          return handleRouteError(
            error,
            res,
            "Unsubscribe",
            "Failed to unsubscribe from alerts"
          );
        }
      }
    )
  );
}
