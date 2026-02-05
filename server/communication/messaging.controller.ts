/**
 * Messaging Controller
 * Handles HTTP requests for messaging functionality
 * Includes message sending, thread management, and notifications
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { messagingService } from './messaging.service';
import {
  SendMessageRequest,
  CreateThreadRequest,
  MessageSearchFilters,
  ThreadSearchFilters,
  NotificationFilters,
  MessageType,
  ThreadType,
  NotificationType,
  NotificationPriority
} from '../types/messaging.types';

// Validation schemas
const sendMessageSchema = z.object({
  threadId: z.string().optional(),
  recipientId: z.string().min(1, 'Recipient ID is required'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  messageType: z.enum(['text', 'image', 'document', 'property_inquiry', 'system_message', 'verification_request', 'appointment_request']),
  propertyId: z.string().optional(),
  subject: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const createThreadSchema = z.object({
  participantIds: z.array(z.string()).min(2, 'At least 2 participants required'),
  subject: z.string().optional(),
  threadType: z.enum(['property_inquiry', 'general_support', 'verification_discussion', 'appointment_scheduling', 'direct_message']),
  propertyId: z.string().optional(),
  initialMessage: z.object({
    content: z.string().min(1),
    messageType: z.enum(['text', 'image', 'document', 'property_inquiry', 'system_message', 'verification_request', 'appointment_request'])
  }).optional(),
  metadata: z.record(z.any()).optional()
});

const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

/**
 * Send a message
 * POST /api/messages
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = sendMessageSchema.parse(req.body);
    
    const message = await messagingService.sendMessage(userId, validatedData);

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>)
      });
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send message'
    });
  }
};

/**
 * Create a new message thread
 * POST /api/threads
 */
export const createThread = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = createThreadSchema.parse(req.body);
    
    // Ensure the creator is included in participants
    if (!validatedData.participantIds.includes(userId)) {
      validatedData.participantIds.push(userId);
    }

    const thread = await messagingService.createThread(userId, validatedData);

    res.status(201).json({
      success: true,
      data: thread,
      message: 'Thread created successfully'
    });
  } catch (error) {
    console.error('Create thread error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>)
      });
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create thread'
    });
  }
};

/**
 * Get messages for a thread
 * GET /api/threads/:threadId/messages
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { threadId } = req.params;
    const { page = 1, limit = 50 } = paginationSchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });

    const result = await messagingService.getMessages(threadId, userId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get messages'
    });
  }
};

/**
 * Get user's message threads
 * GET /api/threads
 */
export const getThreads = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 20 } = paginationSchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });

    // Build filters from query parameters
    const filters: Partial<ThreadSearchFilters> = {
      userId,
      threadType: req.query.threadType as ThreadType,
      propertyId: req.query.propertyId as string,
      isArchived: req.query.isArchived ? req.query.isArchived === 'true' : undefined,
      hasUnread: req.query.hasUnread ? req.query.hasUnread === 'true' : undefined,
      searchQuery: req.query.search as string
    };

    const result = await messagingService.getThreads(userId, filters, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get threads'
    });
  }
};

/**
 * Get user notifications
 * GET /api/notifications
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 20 } = paginationSchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });

    // Build filters from query parameters
    const filters: Partial<NotificationFilters> = {
      userId,
      type: req.query.type as NotificationType,
      isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
      priority: req.query.priority as NotificationPriority,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
    };

    const result = await messagingService.getNotifications(userId, filters, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get notifications'
    });
  }
};

/**
 * Mark messages as read
 * PUT /api/messages/read
 */
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message IDs array is required'
      });
    }

    await messagingService.markMessagesAsRead(messageIds, userId);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to mark messages as read'
    });
  }
};

/**
 * Mark notifications as read
 * PUT /api/notifications/read
 */
export const markNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Notification IDs array is required'
      });
    }

    await messagingService.markNotificationsAsRead(notificationIds, userId);

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to mark notifications as read'
    });
  }
};

/**
 * Set typing indicator
 * POST /api/threads/:threadId/typing
 */
export const setTypingIndicator = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { threadId } = req.params;
    const { isTyping } = req.body;

    if (typeof isTyping !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isTyping must be a boolean'
      });
    }

    await messagingService.setTypingIndicator(threadId, userId, isTyping);

    res.json({
      success: true,
      message: 'Typing indicator updated'
    });
  } catch (error) {
    console.error('Set typing indicator error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to set typing indicator'
    });
  }
};

/**
 * Update user presence
 * POST /api/presence
 */
export const updateUserPresence = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { status } = req.body;
    if (!['online', 'offline', 'away'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be online, offline, or away'
      });
    }

    await messagingService.updateUserPresence(userId, status);

    res.json({
      success: true,
      message: 'Presence updated'
    });
  } catch (error) {
    console.error('Update presence error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update presence'
    });
  }
};

/**
 * Get messaging metrics (admin only)
 * GET /api/messaging/metrics
 */
export const getMessagingMetrics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId || userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const metrics = await messagingService.getMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get messaging metrics error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get metrics'
    });
  }
};