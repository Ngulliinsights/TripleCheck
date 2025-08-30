import { Router, Request, Response } from 'express';
import { z } from 'zod';

import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from "../middleware/error";
import { createRateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { CommunicationService } from '../services/CommunicationService';
import { ResponseHelper } from '../utils/response-helpers';

const router = Router();
const communicationService = new CommunicationService();

// Rate limiting configurations
const messageRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 100 }, // 100 messages per minute
  },
});

const threadRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 20 }, // 20 thread operations per minute
  },
});

// Validation schemas
const createThreadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  participants: z.array(z.number().positive()).min(2).max(50),
  threadType: z.enum(['direct', 'group', 'support']).default('direct'),
  metadata: z.object({
    propertyId: z.number().positive().optional(),
    professionalId: z.number().positive().optional(),
    verificationSessionId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
});

const sendMessageSchema = z.object({
  threadId: z.number().positive(),
  content: z.string().min(1).max(10000),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number().positive(),
    url: z.string().url(),
  })).max(10).optional(),
  replyToId: z.number().positive().optional(),
  metadata: z.object({
    mentions: z.array(z.number().positive()).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  }).optional(),
});

const createNotificationSchema = z.object({
  userId: z.number().positive(),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  actionUrl: z.string().url().optional(),
  channels: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
  }).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  metadata: z.object({
    messageId: z.number().positive().optional(),
    propertyId: z.number().positive().optional(),
    professionalId: z.number().positive().optional(),
    verificationSessionId: z.string().optional(),
    relatedUserId: z.number().positive().optional(),
  }).optional(),
  expiresAt: z.string().datetime().optional(),
});

// Thread Management Routes

/**
 * @route POST /api/communication/threads
 * @desc Create a new message thread
 * @access Private
 */
router.post('/threads',
  requireAuth,
  threadRateLimit,
  validateRequest({ body: createThreadSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const threadData = req.body;
    
    // Ensure current user is in participants
    if (!threadData.participants.includes(userId)) {
      threadData.participants.push(userId);
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;
    const thread = await communicationService.createThread(threadData, idempotencyKey);

    ResponseHelper.success(res, thread, 'Thread created successfully', 201);
  })
);

/**
 * @route GET /api/communication/threads
 * @desc Get user's message threads
 * @access Private
 */
router.get('/threads',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const {
      threadType,
      isActive,
      hasUnreadMessages,
      limit = 50,
      offset = 0,
    } = req.query;

    const filters = {
      threadType: threadType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      hasUnreadMessages: hasUnreadMessages === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await communicationService.getUserThreads(userId, filters);

    ResponseHelper.success(res, result);
  })
);

/**
 * @route GET /api/communication/threads/:threadId
 * @desc Get thread details
 * @access Private
 */
router.get('/threads/:threadId',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const threadId = parseInt(req.params.threadId);

    if (isNaN(threadId)) {
      return ResponseHelper.error(res, 'Invalid thread ID', 400);
    }

    // This will verify access as part of the method
    const result = await communicationService.getMessages(threadId, userId, 1, 0);
    
    ResponseHelper.success(res, { threadId, hasAccess: true });
  })
);

/**
 * @route POST /api/communication/threads/:threadId/archive
 * @desc Archive a thread
 * @access Private
 */
router.post('/threads/:threadId/archive',
  requireAuth,
  threadRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const threadId = parseInt(req.params.threadId);

    if (isNaN(threadId)) {
      return ResponseHelper.error(res, 'Invalid thread ID', 400);
    }

    await communicationService.archiveThread(threadId, userId);

    ResponseHelper.success(res, null, 'Thread archived successfully');
  })
);

/**
 * @route POST /api/communication/threads/:threadId/unarchive
 * @desc Unarchive a thread
 * @access Private
 */
router.post('/threads/:threadId/unarchive',
  requireAuth,
  threadRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const threadId = parseInt(req.params.threadId);

    if (isNaN(threadId)) {
      return ResponseHelper.error(res, 'Invalid thread ID', 400);
    }

    await communicationService.unarchiveThread(threadId, userId);

    ResponseHelper.success(res, null, 'Thread unarchived successfully');
  })
);

// Message Management Routes

/**
 * @route GET /api/communication/threads/:threadId/messages
 * @desc Get messages in a thread
 * @access Private
 */
router.get('/threads/:threadId/messages',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const threadId = parseInt(req.params.threadId);
    const { limit = 50, offset = 0 } = req.query;

    if (isNaN(threadId)) {
      return ResponseHelper.error(res, 'Invalid thread ID', 400);
    }

    const result = await communicationService.getMessages(
      threadId,
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    ResponseHelper.success(res, result);
  })
);

/**
 * @route POST /api/communication/messages
 * @desc Send a message
 * @access Private
 */
router.post('/messages',
  requireAuth,
  messageRateLimit,
  validateRequest({ body: sendMessageSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const messageData = {
      ...req.body,
      senderId: userId,
    };

    const idempotencyKey = req.headers['idempotency-key'] as string;
    const message = await communicationService.sendMessage(messageData, idempotencyKey);

    ResponseHelper.success(res, message, 'Message sent successfully', 201);
  })
);

/**
 * @route PUT /api/communication/messages/:messageId
 * @desc Edit a message
 * @access Private
 */
router.put('/messages/:messageId',
  requireAuth,
  messageRateLimit,
  validateRequest({
    body: z.object({
      content: z.string().min(1).max(10000),
    }),
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const messageId = parseInt(req.params.messageId);
    const { content } = req.body;

    if (isNaN(messageId)) {
      return ResponseHelper.error(res, 'Invalid message ID', 400);
    }

    const message = await communicationService.editMessage(messageId, userId, content);

    ResponseHelper.success(res, message, 'Message updated successfully');
  })
);

/**
 * @route DELETE /api/communication/messages/:messageId
 * @desc Delete a message
 * @access Private
 */
router.delete('/messages/:messageId',
  requireAuth,
  messageRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const messageId = parseInt(req.params.messageId);

    if (isNaN(messageId)) {
      return ResponseHelper.error(res, 'Invalid message ID', 400);
    }

    await communicationService.deleteMessage(messageId, userId);

    ResponseHelper.success(res, null, 'Message deleted successfully');
  })
);

/**
 * @route POST /api/communication/messages/:messageId/read
 * @desc Mark message as read
 * @access Private
 */
router.post('/messages/:messageId/read',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const messageId = parseInt(req.params.messageId);

    if (isNaN(messageId)) {
      return ResponseHelper.error(res, 'Invalid message ID', 400);
    }

    await communicationService.markMessageAsRead(messageId, userId);

    ResponseHelper.success(res, null, 'Message marked as read');
  })
);

/**
 * @route POST /api/communication/threads/:threadId/read
 * @desc Mark all messages in thread as read
 * @access Private
 */
router.post('/threads/:threadId/read',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const threadId = parseInt(req.params.threadId);

    if (isNaN(threadId)) {
      return ResponseHelper.error(res, 'Invalid thread ID', 400);
    }

    await communicationService.markThreadAsRead(threadId, userId);

    ResponseHelper.success(res, null, 'Thread marked as read');
  })
);

/**
 * @route GET /api/communication/search
 * @desc Search messages
 * @access Private
 */
router.get('/search',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const {
      q: searchQuery,
      threadId,
      senderId,
      messageType,
      dateFrom,
      dateTo,
      hasAttachments,
      limit = 50,
      offset = 0,
    } = req.query;

    if (!searchQuery || typeof searchQuery !== 'string') {
      return ResponseHelper.error(res, 'Search query is required', 400);
    }

    const filters = {
      threadId: threadId ? parseInt(threadId as string) : undefined,
      senderId: senderId ? parseInt(senderId as string) : undefined,
      messageType: messageType as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      hasAttachments: hasAttachments === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await communicationService.searchMessages(userId, searchQuery, filters);

    ResponseHelper.success(res, result);
  })
);

// Notification Management Routes

/**
 * @route GET /api/communication/notifications
 * @desc Get user notifications
 * @access Private
 */
router.get('/notifications',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const {
      type,
      isRead,
      priority,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0,
    } = req.query;

    const filters = {
      type: type as string,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      priority: priority as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await communicationService.getUserNotifications(userId, filters);

    ResponseHelper.success(res, result);
  })
);

/**
 * @route POST /api/communication/notifications
 * @desc Create a notification (admin/system use)
 * @access Private
 */
router.post('/notifications',
  requireAuth,
  validateRequest({ body: createNotificationSchema }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notificationData = {
      ...req.body,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    };

    const notification = await communicationService.createNotification(notificationData);

    ResponseHelper.success(res, notification, 'Notification created successfully', 201);
  })
);

/**
 * @route POST /api/communication/notifications/:notificationId/read
 * @desc Mark notification as read
 * @access Private
 */
router.post('/notifications/:notificationId/read',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const notificationId = parseInt(req.params.notificationId);

    if (isNaN(notificationId)) {
      return ResponseHelper.error(res, 'Invalid notification ID', 400);
    }

    await communicationService.markNotificationAsRead(notificationId, userId);

    ResponseHelper.success(res, null, 'Notification marked as read');
  })
);

/**
 * @route GET /api/communication/stats
 * @desc Get communication service statistics
 * @access Private
 */
router.get('/stats',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = communicationService.getStats();

    ResponseHelper.success(res, stats);
  })
);

export { router as communicationRouter };