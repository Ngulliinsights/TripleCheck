import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { CacheService } from '..\cache\CacheService'
import { db } from '../infrastructure/database/connection';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from "../middleware/error";
import { createRateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { ResponseHelper } from '../utils/response-helpers';

const router = Router();
const cache = new CacheService();

// Rate limiting
const fraudRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 20 }, // 20 requests per minute
  },
});

// Validation schemas
const fraudAlertSchema = z.object({
  type: z.enum(['property_fraud', 'identity_fraud', 'payment_fraud', 'document_fraud', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  relatedPropertyId: z.number().positive().optional(),
  relatedUserId: z.number().positive().optional(),
  evidence: z.array(z.object({
    type: z.enum(['document', 'screenshot', 'communication', 'transaction', 'other']),
    description: z.string().min(1).max(500),
    url: z.string().url().optional(),
    metadata: z.record(z.any()).optional(),
  })).optional(),
  location: z.object({
    county: z.string().optional(),
    city: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }).optional(),
  contactInfo: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    preferredContact: z.enum(['phone', 'email', 'platform']).default('platform'),
  }).optional(),
});

const updateAlertStatusSchema = z.object({
  status: z.enum(['pending', 'investigating', 'resolved', 'dismissed', 'escalated']),
  resolution: z.string().max(1000).optional(),
  adminNotes: z.string().max(2000).optional(),
});

// Mock fraud alerts data structure (in production, this would be a database table)
interface FraudAlert {
  id: string;
  reporterId: number;
  type: string;
  severity: string;
  title: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed' | 'escalated';
  relatedPropertyId?: number;
  relatedUserId?: number;
  evidence?: any[];
  location?: any;
  contactInfo?: any;
  resolution?: string;
  adminNotes?: string;
  assignedTo?: number;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for demo (replace with database in production)
const fraudAlerts = new Map<string, FraudAlert>();

/**
 * @route GET /api/trust/fraud-alerts
 * @desc Get fraud alerts (admin) or user's own alerts
 * @access Private
 */
router.get('/fraud-alerts',
  requireAuth,
  fraudRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const currentUserId = req.user!.id;
    const { userId, status, type, severity, page = 1, limit = 20 } = req.query;

    try {
      let alerts = Array.from(fraudAlerts.values());

      // Filter by user if specified (admin only) or current user
      if (userId && req.user!.role === 'admin') {
        alerts = alerts.filter(alert => alert.reporterId === parseInt(userId as string));
      } else if (req.user!.role !== 'admin') {
        // Non-admin users can only see their own alerts
        alerts = alerts.filter(alert => alert.reporterId === currentUserId);
      }

      // Apply filters
      if (status) {
        alerts = alerts.filter(alert => alert.status === status);
      }
      if (type) {
        alerts = alerts.filter(alert => alert.type === type);
      }
      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity);
      }

      // Sort by creation date (newest first)
      alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Pagination
      const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
      const endIndex = startIndex + parseInt(limit as string);
      const paginatedAlerts = alerts.slice(startIndex, endIndex);

      ResponseHelper.success(res, {
        alerts: paginatedAlerts,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: alerts.length,
          totalPages: Math.ceil(alerts.length / parseInt(limit as string)),
        },
        summary: {
          totalAlerts: alerts.length,
          pendingAlerts: alerts.filter(a => a.status === 'pending').length,
          investigatingAlerts: alerts.filter(a => a.status === 'investigating').length,
          resolvedAlerts: alerts.filter(a => a.status === 'resolved').length,
        },
      });

    } catch (error) {
      console.error('Get fraud alerts error:', error);
      ResponseHelper.error(res, 'Failed to load fraud alerts', 500);
    }
  })
);

/**
 * @route POST /api/trust/fraud-alerts
 * @desc Report fraud
 * @access Private
 */
router.post('/fraud-alerts',
  requireAuth,
  fraudRateLimit,
  validateRequest({ body: fraudAlertSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const currentUserId = req.user!.id;
    const alertData = req.body;

    try {
      const alertId = `FA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newAlert: FraudAlert = {
        id: alertId,
        reporterId: currentUserId,
        ...alertData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      fraudAlerts.set(alertId, newAlert);

      // In production, you would also:
      // 1. Send notifications to admin team
      // 2. Create audit log entry
      // 3. Update user's trust score if needed
      // 4. Trigger automated fraud detection analysis

      // Clear cache
      await cache.delete('fraud-alerts-*');

      ResponseHelper.success(res, newAlert, 'Fraud alert submitted successfully', 201);

    } catch (error) {
      console.error('Report fraud error:', error);
      ResponseHelper.error(res, 'Failed to submit fraud report', 500);
    }
  })
);

/**
 * @route GET /api/trust/fraud-alerts/:alertId
 * @desc Get specific fraud alert
 * @access Private
 */
router.get('/fraud-alerts/:alertId',
  requireAuth,
  fraudRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {alertId} = req.params;
    const currentUserId = req.user!.id;

    try {
      const alert = fraudAlerts.get(alertId);

      if (!alert) {
        return ResponseHelper.error(res, 'Fraud alert not found', 404);
      }

      // Check access permissions
      if (alert.reporterId !== currentUserId && req.user!.role !== 'admin') {
        return ResponseHelper.error(res, 'Access denied', 403);
      }

      ResponseHelper.success(res, alert);

    } catch (error) {
      console.error('Get fraud alert error:', error);
      ResponseHelper.error(res, 'Failed to load fraud alert', 500);
    }
  })
);

/**
 * @route PATCH /api/trust/fraud-alerts/:alertId
 * @desc Update fraud alert status (admin only)
 * @access Admin
 */
router.patch('/fraud-alerts/:alertId',
  requireAuth,
  fraudRateLimit,
  validateRequest({ body: updateAlertStatusSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {alertId} = req.params;
    const updateData = req.body;

    // Only admins can update alert status
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    try {
      const alert = fraudAlerts.get(alertId);

      if (!alert) {
        return ResponseHelper.error(res, 'Fraud alert not found', 404);
      }

      // Update alert
      const updatedAlert = {
        ...alert,
        ...updateData,
        assignedTo: req.user!.id,
        updatedAt: new Date(),
      };

      fraudAlerts.set(alertId, updatedAlert);

      // In production, you would also:
      // 1. Send notification to reporter
      // 2. Create audit log entry
      // 3. Update related user's trust score if resolved
      // 4. Send notifications to relevant parties

      // Clear cache
      await cache.delete('fraud-alerts-*');

      ResponseHelper.success(res, updatedAlert, 'Fraud alert updated successfully');

    } catch (error) {
      console.error('Update fraud alert error:', error);
      ResponseHelper.error(res, 'Failed to update fraud alert', 500);
    }
  })
);

/**
 * @route DELETE /api/trust/fraud-alerts/:alertId
 * @desc Delete fraud alert (admin only)
 * @access Admin
 */
router.delete('/fraud-alerts/:alertId',
  requireAuth,
  fraudRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {alertId} = req.params;

    // Only admins can delete alerts
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    try {
      const alert = fraudAlerts.get(alertId);

      if (!alert) {
        return ResponseHelper.error(res, 'Fraud alert not found', 404);
      }

      fraudAlerts.delete(alertId);

      // Clear cache
      await cache.delete('fraud-alerts-*');

      ResponseHelper.success(res, null, 'Fraud alert deleted successfully');

    } catch (error) {
      console.error('Delete fraud alert error:', error);
      ResponseHelper.error(res, 'Failed to delete fraud alert', 500);
    }
  })
);

/**
 * @route GET /api/trust/fraud-alerts/stats
 * @desc Get fraud alerts statistics (admin only)
 * @access Admin
 */
router.get('/fraud-alerts/stats',
  requireAuth,
  fraudRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Only admins can view stats
    if (req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Admin access required', 403);
    }

    try {
      const alerts = Array.from(fraudAlerts.values());
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: alerts.length,
        byStatus: {
          pending: alerts.filter(a => a.status === 'pending').length,
          investigating: alerts.filter(a => a.status === 'investigating').length,
          resolved: alerts.filter(a => a.status === 'resolved').length,
          dismissed: alerts.filter(a => a.status === 'dismissed').length,
          escalated: alerts.filter(a => a.status === 'escalated').length,
        },
        byType: {
          property_fraud: alerts.filter(a => a.type === 'property_fraud').length,
          identity_fraud: alerts.filter(a => a.type === 'identity_fraud').length,
          payment_fraud: alerts.filter(a => a.type === 'payment_fraud').length,
          document_fraud: alerts.filter(a => a.type === 'document_fraud').length,
          other: alerts.filter(a => a.type === 'other').length,
        },
        bySeverity: {
          low: alerts.filter(a => a.severity === 'low').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          high: alerts.filter(a => a.severity === 'high').length,
          critical: alerts.filter(a => a.severity === 'critical').length,
        },
        recent: {
          last30Days: alerts.filter(a => a.createdAt >= thirtyDaysAgo).length,
          last7Days: alerts.filter(a => a.createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)).length,
          last24Hours: alerts.filter(a => a.createdAt >= new Date(now.getTime() - 24 * 60 * 60 * 1000)).length,
        },
        averageResolutionTime: calculateAverageResolutionTime(alerts),
      };

      ResponseHelper.success(res, stats);

    } catch (error) {
      console.error('Get fraud stats error:', error);
      ResponseHelper.error(res, 'Failed to load fraud statistics', 500);
    }
  })
);

// Helper function to calculate average resolution time
function calculateAverageResolutionTime(alerts: FraudAlert[]): number {
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
  
  if (resolvedAlerts.length === 0) return 0;

  const totalTime = resolvedAlerts.reduce((sum, alert) => {
    return sum + (alert.updatedAt.getTime() - alert.createdAt.getTime());
  }, 0);

  return Math.round(totalTime / resolvedAlerts.length / (1000 * 60 * 60)); // Convert to hours
}

export { router as fraudAlertsRouter };