import path from 'path';

import { and, desc, eq, sql } from 'drizzle-orm';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';

import {
  users,
  properties,
  reviews,
  transactions,
  notifications,
  professionals,
} from 'shared/validation/core';
import { CacheService } from "../infrastructure/cache"
import { db } from '../infrastructure/database/connection';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from "../middleware/error";
import { createRateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { ResponseHelper } from '../utils/response-helpers';

const router = Router();
const cache = new CacheService();

// Rate limiting
const dashboardRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 30 }, // 30 requests per minute
  },
});

// Multer configuration for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Validation schemas
const preferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  language: z.enum(['en', 'sw', 'fr']).default('en'),
  timezone: z.string().default('Africa/Nairobi'),
  currency: z.enum(['KES', 'USD', 'EUR']).default('KES'),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  privacyLevel: z.enum(['public', 'private', 'friends']).default('public'),
  twoFactorEnabled: z.boolean().default(false),
});

/**
 * @route GET /api/users/:userId/dashboard
 * @desc Get user dashboard data
 * @access Private
 */
router.get('/:userId/dashboard',
  requireAuth,
  dashboardRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;

    // Users can only access their own dashboard unless admin
    if (userId !== currentUserId && req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Access denied', 403);
    }

    const cacheKey = `user-dashboard-${userId}`;
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return ResponseHelper.success(res, cached);
    }

    try {
      // Get user basic info
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          trustScore: users.trustScore,
          isVerifiedAgent: users.isVerifiedAgent,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return ResponseHelper.error(res, 'User not found', 404);
      }

      // Get user's properties count
      const [propertiesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(properties)
        .where(eq(properties.ownerId, userId));

      // Get user's reviews count (as reviewer)
      const [reviewsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(eq(reviews.userId, userId));

      // Get user's transactions count
      const [transactionsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.userId, userId));

      // Get recent notifications (last 5)
      const recentNotifications = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          content: notifications.content,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(5);

      // Get unread notifications count
      const [unreadCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      // Check if user is a professional
      const [professional] = await db
        .select({
          id: professionals.id,
          businessName: professionals.businessName,
          averageRating: professionals.averageRating,
          completedProjects: professionals.completedProjects,
        })
        .from(professionals)
        .where(eq(professionals.userId, userId))
        .limit(1);

      // Get recent activity (last 10 transactions)
      const recentActivity = await db
        .select({
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          status: transactions.status,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt))
        .limit(10);

      const dashboardData = {
        user: {
          ...user,
          isProfessional: !!professional,
        },
        stats: {
          propertiesCount: propertiesCount?.count || 0,
          reviewsCount: reviewsCount?.count || 0,
          transactionsCount: transactionsCount?.count || 0,
          unreadNotifications: unreadCount?.count || 0,
        },
        professional: professional || null,
        recentNotifications,
        recentActivity,
        summary: {
          trustLevel: getTrustLevel(user.trustScore || 50),
          accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          verificationStatus: user.isVerifiedAgent ? 'verified' : 'unverified',
        },
      };

      // Cache for 5 minutes
      await cache.set(cacheKey, dashboardData, { ttl: 300 });

      ResponseHelper.success(res, dashboardData);

    } catch (error) {
      console.error('Dashboard error:', error);
      ResponseHelper.error(res, 'Failed to load dashboard', 500);
    }
  })
);

/**
 * @route GET /api/users/:userId/preferences
 * @desc Get user preferences
 * @access Private
 */
router.get('/:userId/preferences',
  requireAuth,
  dashboardRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;

    // Users can only access their own preferences unless admin
    if (userId !== currentUserId && req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Access denied', 403);
    }

    try {
      const [user] = await db
        .select({
          preferences: users.preferences,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return ResponseHelper.error(res, 'User not found', 404);
      }

      // Merge with default preferences
      const defaultPreferences = {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        marketingEmails: false,
        language: 'en',
        timezone: 'Africa/Nairobi',
        currency: 'KES',
        theme: 'light',
        privacyLevel: 'public',
        twoFactorEnabled: false,
      };

      const preferences = { ...defaultPreferences, ...(user.preferences || {}) };

      ResponseHelper.success(res, preferences);

    } catch (error) {
      console.error('Preferences error:', error);
      ResponseHelper.error(res, 'Failed to load preferences', 500);
    }
  })
);

/**
 * @route PATCH /api/users/:userId/preferences
 * @desc Update user preferences
 * @access Private
 */
router.patch('/:userId/preferences',
  requireAuth,
  dashboardRateLimit,
  validateRequest({ body: preferencesSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;

    // Users can only update their own preferences unless admin
    if (userId !== currentUserId && req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Access denied', 403);
    }

    try {
      const preferences = req.body;

      await db
        .update(users)
        .set({
          preferences,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Clear dashboard cache
      await cache.delete(`user-dashboard-${userId}`);

      ResponseHelper.success(res, preferences, 'Preferences updated successfully');

    } catch (error) {
      console.error('Update preferences error:', error);
      ResponseHelper.error(res, 'Failed to update preferences', 500);
    }
  })
);

/**
 * @route POST /api/users/:userId/avatar
 * @desc Upload user avatar
 * @access Private
 */
router.post('/:userId/avatar',
  requireAuth,
  upload.single('avatar'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;

    // Users can only update their own avatar unless admin
    if (userId !== currentUserId && req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Access denied', 403);
    }

    if (!req.file) {
      return ResponseHelper.error(res, 'No file uploaded', 400);
    }

    try {
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      await db
        .update(users)
        .set({
          profileImageUrl: avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Clear dashboard cache
      await cache.delete(`user-dashboard-${userId}`);

      ResponseHelper.success(res, {
        avatarUrl,
        filename: req.file.filename,
        size: req.file.size,
      }, 'Avatar uploaded successfully');

    } catch (error) {
      console.error('Avatar upload error:', error);
      ResponseHelper.error(res, 'Failed to upload avatar', 500);
    }
  })
);

/**
 * @route GET /api/users/:userId/activity
 * @desc Get user activity log
 * @access Private
 */
router.get('/:userId/activity',
  requireAuth,
  dashboardRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;

    // Users can only access their own activity unless admin
    if (userId !== currentUserId && req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Access denied', 403);
    }

    const { page = 1, limit = 20, type } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    try {
      let query = db
        .select({
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          status: transactions.status,
          description: transactions.description,
          metadata: transactions.metadata,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId));

      // Filter by type if specified
      if (type && typeof type === 'string') {
        query = query.where(and(eq(transactions.userId, userId), eq(transactions.type, type)));
      }

      const activities = await query
        .orderBy(desc(transactions.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);

      // Get total count
      const [totalCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.userId, userId));

      ResponseHelper.success(res, {
        activities,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / parseInt(limit as string)),
        },
      });

    } catch (error) {
      console.error('Activity error:', error);
      ResponseHelper.error(res, 'Failed to load activity', 500);
    }
  })
);

/**
 * @route GET /api/users/:userId/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/:userId/notifications',
  requireAuth,
  dashboardRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;

    // Users can only access their own notifications unless admin
    if (userId !== currentUserId && req.user!.role !== 'admin') {
      return ResponseHelper.error(res, 'Access denied', 403);
    }

    const { page = 1, limit = 20, unread } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    try {
      let query = db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId));

      // Filter by read status if specified
      if (unread === 'true') {
        query = query.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      }

      const userNotifications = await query
        .orderBy(desc(notifications.createdAt))
        .limit(parseInt(limit as string))
        .offset(offset);

      // Get total count
      const [totalCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.userId, userId));

      // Get unread count
      const [unreadCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      ResponseHelper.success(res, {
        notifications: userNotifications,
        unreadCount: unreadCount?.count || 0,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / parseInt(limit as string)),
        },
      });

    } catch (error) {
      console.error('Notifications error:', error);
      ResponseHelper.error(res, 'Failed to load notifications', 500);
    }
  })
);

/**
 * @route PATCH /api/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.patch('/notifications/:notificationId/read',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notificationId = parseInt(req.params.notificationId);
    const currentUserId = req.user!.id;

    try {
      // Verify notification belongs to user
      const [notification] = await db
        .select({ userId: notifications.userId })
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (!notification) {
        return ResponseHelper.error(res, 'Notification not found', 404);
      }

      if (notification.userId !== currentUserId && req.user!.role !== 'admin') {
        return ResponseHelper.error(res, 'Access denied', 403);
      }

      await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(notifications.id, notificationId));

      // Clear dashboard cache
      await cache.delete(`user-dashboard-${notification.userId}`);

      ResponseHelper.success(res, null, 'Notification marked as read');

    } catch (error) {
      console.error('Mark notification read error:', error);
      ResponseHelper.error(res, 'Failed to mark notification as read', 500);
    }
  })
);

// Helper function
function getTrustLevel(score: number): string {
  if (score >= 90) return 'very_high';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'very_low';
}

export { router as userDashboardRouter };