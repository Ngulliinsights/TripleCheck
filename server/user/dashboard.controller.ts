import path from 'path';
import multer from 'multer';
import { and, desc, eq, sql } from 'drizzle-orm';
import { Router, Response } from 'express';
import { z } from 'zod';

import {
  users,
  properties,
  reviews,
  transactions,
  notifications,
  professionals,
} from '../infrastructure/database/schemas/consolidated';
import { CacheService } from '../infrastructure/cache/CacheService';
import { db } from '../infrastructure/database/connection';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error';
import { createRateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { ResponseHelper } from '../utils/response-helpers';

// ---------------------------------------------------------------------------
// Router & services
// ---------------------------------------------------------------------------

const router = Router();
const cache  = new CacheService();

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const dashboardRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60_000, maxRequests: 30 },
  },
});

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const preferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications:   z.boolean().default(false),
  pushNotifications:  z.boolean().default(true),
  marketingEmails:    z.boolean().default(false),
  language:           z.enum(['en', 'sw', 'fr']).default('en'),
  timezone:           z.string().default('Africa/Nairobi'),
  currency:           z.enum(['KES', 'USD', 'EUR']).default('KES'),
  theme:              z.enum(['light', 'dark', 'auto']).default('light'),
  privacyLevel:       z.enum(['public', 'private', 'friends']).default('public'),
  twoFactorEnabled:   z.boolean().default(false),
});

/** Canonical default preferences — derived from the schema so defaults are never duplicated. */
const DEFAULT_PREFERENCES = preferencesSchema.parse({});

// ---------------------------------------------------------------------------
// Multer — avatar uploads
// ---------------------------------------------------------------------------

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const ext    = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    if (allowed.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Returns true when the requesting user is allowed to access `targetUserId`'s data. */
const canAccess = (req: AuthenticatedRequest, targetUserId: number): boolean =>
  req.user!.id === targetUserId || req.user!.role === 'admin';

/** Parses and validates a `:userId` route param. Returns null when invalid. */
const parseUserId = (param: string): number | null => {
  const id = parseInt(param, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
};

/** Parses and validates an integer route param. Returns null when invalid. */
const parseIntParam = (param: string): number | null => {
  const n = parseInt(param, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Parses page/limit query params with safe defaults and an upper bound on limit.
 * All parseInt calls use radix 10.
 */
const parsePagination = (
  query: AuthenticatedRequest['query'],
  maxLimit = 100,
) => {
  const page  = Math.max(1, parseInt((query.page  as string) || '1',  10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt((query.limit as string) || '20', 10)));
  return { page, limit, offset: (page - 1) * limit };
};

/** Cache key factory — single source of truth, avoids magic strings. */
const cacheKey = {
  dashboard: (userId: number) => `user-dashboard:${userId}`,
} as const;

/** Maps a numeric trust score to a label. */
function getTrustLevel(score: number): string {
  if (score >= 90) return 'very_high';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'very_low';
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/users/:userId/dashboard
 * Returns aggregated dashboard data for a user.
 * Requires authentication; users may only view their own dashboard (admins exempt).
 */
router.get(
  '/:userId/dashboard',
  requireAuth,
  dashboardRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseUserId(req.params.userId);
    if (!userId) return ResponseHelper.error(res, 'Invalid user ID', 400);
    if (!canAccess(req, userId)) return ResponseHelper.error(res, 'Access denied', 403);

    // Serve from cache when available.
    const key    = cacheKey.dashboard(userId);
    const cached = await cache.get(key);
    if (cached) return ResponseHelper.success(res, cached);

    // Fetch user record first — bail early if the user doesn't exist.
    const [user] = await db
      .select({
        id:              users.id,
        username:        users.username,
        firstName:       users.firstName,
        lastName:        users.lastName,
        email:           users.email,
        profileImageUrl: users.profileImageUrl,
        trustScore:      users.trustScore,
        isVerifiedAgent: users.isVerifiedAgent,
        createdAt:       users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return ResponseHelper.error(res, 'User not found', 404);

    // All remaining queries are independent — run them in parallel.
    const [
      [propertiesCount],
      [reviewsCount],
      [transactionsCount],
      [unreadCount],
      [professional],
      recentNotifications,
      recentActivity,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(properties)
        .where(eq(properties.ownerId, userId)),

      db.select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(eq(reviews.userId, userId)),

      db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.userId, userId)),

      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),

      db.select({
          id:               professionals.id,
          businessName:     professionals.businessName,
          averageRating:    professionals.averageRating,
          completedProjects: professionals.completedProjects,
        })
        .from(professionals)
        .where(eq(professionals.userId, userId))
        .limit(1),

      db.select({
          id:        notifications.id,
          type:      notifications.type,
          title:     notifications.title,
          content:   notifications.content,
          isRead:    notifications.isRead,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(5),

      db.select({
          id:        transactions.id,
          type:      transactions.transactionType,
          amount:    transactions.amount,
          status:    transactions.status,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt))
        .limit(10),
    ]);

    const dashboardData = {
      user: {
        ...user,
        isProfessional: !!professional,
      },
      stats: {
        propertiesCount:      propertiesCount?.count  ?? 0,
        reviewsCount:         reviewsCount?.count     ?? 0,
        transactionsCount:    transactionsCount?.count ?? 0,
        unreadNotifications:  unreadCount?.count      ?? 0,
      },
      professional: professional ?? null,
      recentNotifications,
      recentActivity,
      summary: {
        trustLevel:          getTrustLevel(user.trustScore ?? 50),
        accountAge:          Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000),
        verificationStatus:  user.isVerifiedAgent ? 'verified' : 'unverified',
      },
    };

    // Cache for 5 minutes.
    await cache.set(key, dashboardData, { ttl: 300 });

    return ResponseHelper.success(res, dashboardData);
  }),
);

/**
 * GET /api/users/:userId/preferences
 * Returns a user's preferences merged with defaults.
 */
router.get(
  '/:userId/preferences',
  requireAuth,
  dashboardRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseUserId(req.params.userId);
    if (!userId) return ResponseHelper.error(res, 'Invalid user ID', 400);
    if (!canAccess(req, userId)) return ResponseHelper.error(res, 'Access denied', 403);

    const [user] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return ResponseHelper.error(res, 'User not found', 404);

    // Merge stored prefs over defaults — stored values win.
    const preferences = { ...DEFAULT_PREFERENCES, ...(user.preferences ?? {}) };

    return ResponseHelper.success(res, preferences);
  }),
);

/**
 * PATCH /api/users/:userId/preferences
 * Replaces a user's preferences (validated against preferencesSchema).
 */
router.patch(
  '/:userId/preferences',
  requireAuth,
  dashboardRateLimit,
  validateRequest({ body: preferencesSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseUserId(req.params.userId);
    if (!userId) return ResponseHelper.error(res, 'Invalid user ID', 400);
    if (!canAccess(req, userId)) return ResponseHelper.error(res, 'Access denied', 403);

    const preferences = req.body;

    await db
      .update(users)
      .set({ preferences, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await cache.delete(cacheKey.dashboard(userId));

    return ResponseHelper.success(res, preferences, 'Preferences updated successfully');
  }),
);

/**
 * POST /api/users/:userId/avatar
 * Uploads a new avatar image for a user.
 */
router.post(
  '/:userId/avatar',
  requireAuth,
  upload.single('avatar'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseUserId(req.params.userId);
    if (!userId) return ResponseHelper.error(res, 'Invalid user ID', 400);
    if (!canAccess(req, userId)) return ResponseHelper.error(res, 'Access denied', 403);
    if (!req.file)  return ResponseHelper.error(res, 'No file uploaded', 400);

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await db
      .update(users)
      .set({ profileImageUrl: avatarUrl, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await cache.delete(cacheKey.dashboard(userId));

    return ResponseHelper.success(
      res,
      { avatarUrl, filename: req.file.filename, size: req.file.size },
      'Avatar uploaded successfully',
    );
  }),
);

/**
 * GET /api/users/:userId/activity
 * Returns a paginated transaction activity log for a user.
 * Supports optional `type` filter and `page`/`limit` pagination.
 */
router.get(
  '/:userId/activity',
  requireAuth,
  dashboardRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseUserId(req.params.userId);
    if (!userId) return ResponseHelper.error(res, 'Invalid user ID', 400);
    if (!canAccess(req, userId)) return ResponseHelper.error(res, 'Access denied', 403);

    const { page, limit, offset } = parsePagination(req.query);
    const { type } = req.query;

    const conditions = [eq(transactions.userId, userId)];
    if (type && typeof type === 'string') {
      // FIX: was `transactions.type` (doesn't exist); correct field is transactionType.
      conditions.push(eq(transactions.transactionType, type));
    }

    const [activities, [totalCount]] = await Promise.all([
      db.select({
          id:          transactions.id,
          type:        transactions.transactionType,
          amount:      transactions.amount,
          status:      transactions.status,
          description: transactions.notes,
          metadata:    transactions.otherParties,
          createdAt:   transactions.createdAt,
        })
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(and(...conditions)), // count respects the same type filter
    ]);

    return ResponseHelper.success(res, {
      activities,
      pagination: {
        page,
        limit,
        total:      totalCount?.count ?? 0,
        totalPages: Math.ceil((totalCount?.count ?? 0) / limit),
      },
    });
  }),
);

/**
 * GET /api/users/:userId/notifications
 * Returns a paginated notification list with an unread count.
 * Supports `unread=true` filter and `page`/`limit` pagination.
 */
router.get(
  '/:userId/notifications',
  requireAuth,
  dashboardRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseUserId(req.params.userId);
    if (!userId) return ResponseHelper.error(res, 'Invalid user ID', 400);
    if (!canAccess(req, userId)) return ResponseHelper.error(res, 'Access denied', 403);

    const { page, limit, offset } = parsePagination(req.query);
    const onlyUnread = req.query.unread === 'true';

    const listConditions = [
      eq(notifications.userId, userId),
      ...(onlyUnread ? [eq(notifications.isRead, false)] : []),
    ];

    const [userNotifications, [totalCount], [unreadCount]] = await Promise.all([
      db.select({
          id:        notifications.id,
          type:      notifications.type,
          title:     notifications.title,
          content:   notifications.content,
          isRead:    notifications.isRead,
          createdAt: notifications.createdAt,
          readAt:    notifications.readAt,
        })
        .from(notifications)
        .where(and(...listConditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(eq(notifications.userId, userId)),

      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
    ]);

    return ResponseHelper.success(res, {
      notifications: userNotifications,
      unreadCount:   unreadCount?.count ?? 0,
      pagination: {
        page,
        limit,
        total:      totalCount?.count ?? 0,
        totalPages: Math.ceil((totalCount?.count ?? 0) / limit),
      },
    });
  }),
);

/**
 * PATCH /api/notifications/:notificationId/read
 * Marks a single notification as read.
 * Only the owning user (or an admin) may mark a notification read.
 */
router.patch(
  '/notifications/:notificationId/read',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notificationId = parseIntParam(req.params.notificationId);
    if (!notificationId) return ResponseHelper.error(res, 'Invalid notification ID', 400);

    const [notification] = await db
      .select({ userId: notifications.userId })
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (!notification) return ResponseHelper.error(res, 'Notification not found', 404);
    if (!canAccess(req, notification.userId)) return ResponseHelper.error(res, 'Access denied', 403);

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
      .where(eq(notifications.id, notificationId));

    await cache.delete(cacheKey.dashboard(notification.userId));

    return ResponseHelper.success(res, null, 'Notification marked as read');
  }),
);

export { router as userDashboardRouter };