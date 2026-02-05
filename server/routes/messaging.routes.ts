/**
 * Messaging Routes
 * API routes for messaging functionality including messages, threads, and notifications
 */

import { Router } from 'express';
import {
  sendMessage,
  createThread,
  getMessages,
  getThreads,
  getNotifications,
  markMessagesAsRead,
  markNotificationsAsRead,
  setTypingIndicator,
  updateUserPresence,
  getMessagingMetrics
} from '../controllers/messaging.controller';

const router = Router();

/**
 * Message Routes
 */

// Send a message
router.post('/messages', sendMessage);

// Mark messages as read
router.put('/messages/read', markMessagesAsRead);

/**
 * Thread Routes
 */

// Create a new thread
router.post('/threads', createThread);

// Get user's threads
router.get('/threads', getThreads);

// Get messages for a specific thread
router.get('/threads/:threadId/messages', getMessages);

// Set typing indicator for a thread
router.post('/threads/:threadId/typing', setTypingIndicator);

/**
 * Notification Routes
 */

// Get user notifications
router.get('/notifications', getNotifications);

// Mark notifications as read
router.put('/notifications/read', markNotificationsAsRead);

/**
 * Presence Routes
 */

// Update user presence status
router.post('/presence', updateUserPresence);

/**
 * Admin Routes
 */

// Get messaging metrics (admin only)
router.get('/messaging/metrics', getMessagingMetrics);

export { router as messagingRouter };