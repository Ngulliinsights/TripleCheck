import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from "../middleware/error";
import { createRateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { TrustIntegrationService } from './integration.service';
import { ResponseHelper } from '../utils/response-helpers';

const router = Router();
const trustIntegrationService = new TrustIntegrationService();

// Initialize the service
trustIntegrationService.initialize().catch(console.error);

// Rate limiting configurations
const trustRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 50 }, // 50 trust operations per minute
  },
});

const fraudRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 20 }, // 20 fraud checks per minute
  },
});

// Validation schemas
const trustScoreRequestSchema = z.object({
  userId: z.number().positive().optional(), // Optional, defaults to current user
  context: z.object({
    propertyId: z.number().positive().optional(),
    transactionType: z.string().optional(),
    amount: z.number().positive().optional(),
    riskFactors: z.array(z.string()).optional(),
  }).optional(),
  includeBreakdown: z.boolean().default(false),
});

const trustScoreUpdateSchema = z.object({
  userId: z.number().positive(),
  action: z.enum(['positive', 'negative', 'neutral']),
  category: z.enum(['verification', 'transaction', 'community', 'fraud', 'system']),
  impact: z.number().min(-100).max(100),
  reason: z.string().min(1).max(500),
  metadata: z.record(z.any()).optional(),
});

const fraudDetectionSchema = z.object({
  userId: z.number().positive().optional(), // Optional, defaults to current user
  activityType: z.enum(['property_listing', 'transaction', 'communication', 'profile_update']),
  activityData: z.record(z.any()),
  riskFactors: z.array(z.string()).optional(),
});

const accessControlSchema = z.object({
  userId: z.number().positive().optional(), // Optional, defaults to current user
  resource: z.string().min(1),
  action: z.string().min(1),
  context: z.record(z.any()).optional(),
});

const bulkTrustUpdateSchema = z.object({
  operations: z.array(trustScoreUpdateSchema).min(1).max(100),
  batchId: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

// Trust Score Management Routes

/**
 * @route GET /api/trust-integration/score
 * @desc Get comprehensive trust score for current user
 * @access Private
 */
router.get('/score',
  requireAuth,
  trustRateLimit,
  validateRequest({ query: trustScoreRequestSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.query.userId as number || req.user!.id;
    const context = req.query.context as any;
    const includeBreakdown = req.query.includeBreakdown as boolean;

    // Ensure users can only access their own trust score unless admin
    if (userId !== req.user!.id && req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Access denied', 403);
    }

    const trustScore = await trustIntegrationService.calculateTrustScore({
      userId,
      context,
      includeBreakdown,
    });

    ResponseHelper.success(res, trustScore);
  })
);

/**
 * @route GET /api/trust-integration/score/:userId
 * @desc Get trust score for specific user (admin only)
 * @access Admin
 */
router.get('/score/:userId',
  requireAuth,
  trustRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return ResponseHelper.error(res, 'Invalid user ID', 400);
    }

    const includeBreakdown = req.query.includeBreakdown === 'true';

    const trustScore = await trustIntegrationService.calculateTrustScore({
      userId,
      includeBreakdown,
    });

    ResponseHelper.success(res, trustScore);
  })
);

/**
 * @route POST /api/trust-integration/score/update
 * @desc Update user trust score (admin only)
 * @access Admin
 */
router.post('/score/update',
  requireAuth,
  trustRateLimit,
  validateRequest({ body: trustScoreUpdateSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    const updateRequest = req.body;
    const updatedScore = await trustIntegrationService.updateTrustScore(updateRequest);

    ResponseHelper.success(res, updatedScore, 'Trust score updated successfully');
  })
);

/**
 * @route POST /api/trust-integration/score/bulk-update
 * @desc Process bulk trust score updates (admin only)
 * @access Admin
 */
router.post('/score/bulk-update',
  requireAuth,
  validateRequest({ body: bulkTrustUpdateSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    const bulkOperation = req.body;
    const result = await trustIntegrationService.processBulkTrustUpdates(bulkOperation);

    ResponseHelper.success(res, result, 'Bulk trust score update completed');
  })
);

/**
 * @route GET /api/trust-integration/analytics
 * @desc Get trust analytics for current user
 * @access Private
 */
router.get('/analytics',
  requireAuth,
  trustRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const analytics = await trustIntegrationService.getTrustAnalytics(userId);

    ResponseHelper.success(res, analytics);
  })
);

/**
 * @route GET /api/trust-integration/analytics/:userId
 * @desc Get trust analytics for specific user (admin only)
 * @access Admin
 */
router.get('/analytics/:userId',
  requireAuth,
  trustRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return ResponseHelper.error(res, 'Invalid user ID', 400);
    }

    const analytics = await trustIntegrationService.getTrustAnalytics(userId);

    ResponseHelper.success(res, analytics);
  })
);

// Fraud Detection Routes

/**
 * @route POST /api/trust-integration/fraud/detect
 * @desc Detect potential fraud in user activity
 * @access Private
 */
router.post('/fraud/detect',
  requireAuth,
  fraudRateLimit,
  validateRequest({ body: fraudDetectionSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.body.userId || req.user!.id;
    
    // Ensure users can only check their own activities unless admin
    if (userId !== req.user!.id && req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Access denied', 403);
    }

    const fraudRequest = {
      ...req.body,
      userId,
    };

    const fraudResult = await trustIntegrationService.detectFraud(fraudRequest);

    ResponseHelper.success(res, fraudResult);
  })
);

// Access Control Routes

/**
 * @route POST /api/trust-integration/access/check
 * @desc Check if user has access to a resource
 * @access Private
 */
router.post('/access/check',
  requireAuth,
  trustRateLimit,
  validateRequest({ body: accessControlSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.body.userId || req.user!.id;
    
    // Ensure users can only check their own access unless admin
    if (userId !== req.user!.id && req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Access denied', 403);
    }

    const accessRequest = {
      ...req.body,
      userId,
    };

    const accessResult = await trustIntegrationService.checkAccess(accessRequest);

    ResponseHelper.success(res, accessResult);
  })
);

/**
 * @route GET /api/trust-integration/limits/transaction
 * @desc Get trust-based transaction limits for current user
 * @access Private
 */
router.get('/limits/transaction',
  requireAuth,
  trustRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const limits = await trustIntegrationService.getTransactionLimits(userId);

    ResponseHelper.success(res, limits);
  })
);

/**
 * @route GET /api/trust-integration/limits/transaction/:userId
 * @desc Get transaction limits for specific user (admin only)
 * @access Admin
 */
router.get('/limits/transaction/:userId',
  requireAuth,
  trustRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return ResponseHelper.error(res, 'Invalid user ID', 400);
    }

    const limits = await trustIntegrationService.getTransactionLimits(userId);

    ResponseHelper.success(res, limits);
  })
);

// Trust-based Middleware Factory

/**
 * Create middleware to check trust-based access
 */
export const createTrustAccessMiddleware = (resource: string, action: string, minTrustLevel?: string) => {
  return asyncHandler(async (req: AuthenticatedRequest, res: Response, next: Function) => {
    if (!req.user) {
      return ResponseHelper.error(res, 'Authentication required', 401);
    }

    const accessResult = await trustIntegrationService.checkAccess({
      userId: req.user.id,
      resource,
      action,
      context: { ...req.body, ...req.query, ...req.params },
    });

    if (!accessResult.allowed) {
      return ResponseHelper.error(res, accessResult.reason || 'Access denied', 403, {
        requiredTrustLevel: accessResult.requiredTrustLevel,
        currentTrustLevel: accessResult.currentTrustLevel,
        restrictions: accessResult.restrictions,
        upgradeActions: accessResult.upgradeActions,
      });
    }

    // Add trust info to request for downstream use
    (req as any).trustInfo = {
      trustLevel: accessResult.currentTrustLevel,
      accessGranted: true,
    };

    next();
  });
};

/**
 * Middleware to check minimum trust score
 */
export const requireMinTrustScore = (minScore: number) => {
  return asyncHandler(async (req: AuthenticatedRequest, res: Response, next: Function) => {
    if (!req.user) {
      return ResponseHelper.error(res, 'Authentication required', 401);
    }

    const trustScore = await trustIntegrationService.calculateTrustScore({
      userId: req.user.id,
    });

    if (trustScore.trustScore < minScore) {
      return ResponseHelper.error(res, `Minimum trust score of ${minScore} required`, 403, {
        currentScore: trustScore.trustScore,
        requiredScore: minScore,
        recommendations: trustScore.recommendations,
      });
    }

    // Add trust info to request
    (req as any).trustInfo = {
      trustScore: trustScore.trustScore,
      trustLevel: trustScore.trustLevel,
    };

    next();
  });
};

/**
 * Middleware to check transaction limits
 */
export const checkTransactionLimits = (transactionAmount?: number) => {
  return asyncHandler(async (req: AuthenticatedRequest, res: Response, next: Function) => {
    if (!req.user) {
      return ResponseHelper.error(res, 'Authentication required', 401);
    }

    const amount = transactionAmount || req.body.amount || req.query.amount;
    if (!amount) {
      return next(); // Skip check if no amount specified
    }

    const limits = await trustIntegrationService.getTransactionLimits(req.user.id);

    if (amount > limits.maxAmount) {
      return ResponseHelper.error(res, 'Transaction amount exceeds trust-based limits', 403, {
        maxAmount: limits.maxAmount,
        requestedAmount: amount,
        requiresEscrow: limits.requiresEscrow,
        requiresVerification: limits.requiresVerification,
      });
    }

    // Add transaction info to request
    (req as any).transactionInfo = {
      amount,
      limits,
      withinLimits: true,
    };

    next();
  });
};

/**
 * @route GET /api/trust-integration/stats
 * @desc Get trust integration service statistics
 * @access Private
 */
router.get('/stats',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = trustIntegrationService.getStats();

    ResponseHelper.success(res, stats);
  })
);

/**
 * @route GET /api/trust-integration/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req: Request, res: Response) => {
  ResponseHelper.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'trust-integration',
  });
});

export { router as trustIntegrationRouter };