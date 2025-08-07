import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';

import {
  InsertMessage,
  InsertMessageThread,
  InsertNotification,
  InsertNotificationPreference,
  Message,
  MessageThread,
  messages,
  messageThreads,
  Notification,
  NotificationPreference,
  notificationPreferences,
  notifications,
  users,
} from '../../src/shared/schema';
import { CacheService } from '../infrastructure/cache/CacheService';
import { db } from '../infrastructure/database/connection';
import { RequestDeduplicator } from '../infrastructure/deduplication/RequestDeduplicator';

/**
 * Interface for creating a new message thread
 */
export interface CreateThreadData {
  title?: string;
  participants: number[];
  threadType?: 'direct' | 'group' | 'support';
  metadata?: {
    propertyId?: number;
    professionalId?: number;
    verificationSessionId?: string;
    tags?: string[];
  };
}

/**
 * Interface for sending a message
 */
export interface SendMessageData {
  threadId: number;
  senderId: number;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
  replyToId?: number;
  metadata?: {
    mentions?: number[];
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  };
}

/**
 * Interface for creating notifications
 */
export interface CreateNotificationData {
  userId: number;
  type: string;
  title: string;
  content: string;
  actionUrl?: string;
  channels?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    inApp?: boolean;
  };
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: {
    messageId?: number;
    propertyId?: number;
    professionalId?: number;
    verificationSessionId?: string;
    relatedUserId?: number;
  };
  expiresAt?: Date;
}

/**
 * Interface for message search filters
 */
export interface MessageSearchFilters {
  threadId?: number;
  senderId?: number;
  messageType?: string;
  content?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  deliveryStatus?: string;
  limit?: number;
  offset?: number;
}

/**
 * Interface for thread search filters
 */
export interface ThreadSearchFilters {
  userId: number;
  threadType?: string;
  isActive?: boolean;
  hasUnreadMessages?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Interface for notification filters
 */
export interface NotificationFilters {
  userId: number;
  type?: string;
  isRead?: boolean;
  priority?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Comprehensive Communication Service
 * Handles messaging, notifications, and real-time communication features
 */
export class CommunicationService {
  private cache: CacheService;
  private deduplicator: RequestDeduplicator;

  constructor(cache?: CacheService) {
    this.cache = cache || new CacheService();
    this.deduplicator = RequestDeduplicator.getInstance({}, this.cache);
  }

  // Message Thread Management

  /**
   * Create a new message thread
   */
  async createThread(data: CreateThreadData, idempotencyKey?: string): Promise<MessageThread> {
    const operation = async () => {
      // Validate participants exist
      const participantUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, data.participants));

      if (participantUsers.length !== data.participants.length) {
        throw new Error('One or more participants do not exist');
      }

      // Check for existing direct thread between same participants
      if (data.threadType === 'direct' && data.participants.length === 2) {
        const existingThread = await this.findDirectThread(data.participants);
        if (existingThread) {
          return existingThread;
        }
      }

      const threadData: InsertMessageThread = {
        title: data.title,
        participants: data.participants,
        threadType: data.threadType || 'direct',
        metadata: data.metadata,
        isActive: true,
      };

      const [thread] = await db.insert(messageThreads).values(threadData).returning();

      // Clear relevant caches
      await this.clearThreadCaches(data.participants);

      return thread;
    };

    if (idempotencyKey) {
      return this.deduplicator.handleIdempotentRequest(
        `create-thread-${idempotencyKey}`,
        operation
      );
    }

    return operation();
  }

  /**
   * Send a message in a thread
   */
  async sendMessage(data: SendMessageData, idempotencyKey?: string): Promise<Message> {
    const operation = async () => {
      // Verify thread exists and user is participant
      const thread = await this.getThreadById(data.threadId);
      if (!thread) {
        throw new Error('Thread not found');
      }

      if (!thread.participants.includes(data.senderId)) {
        throw new Error('User is not a participant in this thread');
      }

      // Validate reply-to message if specified
      if (data.replyToId) {
        const replyToMessage = await db
          .select()
          .from(messages)
          .where(and(eq(messages.id, data.replyToId), eq(messages.threadId, data.threadId)))
          .limit(1);

        if (replyToMessage.length === 0) {
          throw new Error('Reply-to message not found in this thread');
        }
      }

      const messageData: InsertMessage = {
        threadId: data.threadId,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType || 'text',
        attachments: data.attachments,
        replyToId: data.replyToId,
        metadata: data.metadata,
        deliveryStatus: 'sent',
        readBy: [{ userId: data.senderId, readAt: new Date().toISOString() }],
      };

      const [message] = await db.insert(messages).values(messageData).returning();

      // Update thread's last message
      await db
        .update(messageThreads)
        .set({
          lastMessageAt: message.createdAt,
          lastMessageId: message.id,
          updatedAt: new Date(),
        })
        .where(eq(messageThreads.id, data.threadId));

      // Send notifications to other participants
      await this.notifyThreadParticipants(thread, message, data.senderId);

      // Clear relevant caches
      await this.clearMessageCaches(data.threadId, thread.participants);

      return message;
    };

    if (idempotencyKey) {
      return this.deduplicator.handleIdempotentRequest(
        `send-message-${idempotencyKey}`,
        operation
      );
    }

    return operation();
  }

  /**
   * Get messages in a thread with pagination
   */
  async getMessages(
    threadId: number,
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    messages: (Message & { sender: { id: number; username: string; firstName?: string; lastName?: string } })[];
    total: number;
    hasMore: boolean;
  }> {
    const cacheKey = `messages-${threadId}-${limit}-${offset}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    // Verify user is participant
    const thread = await this.getThreadById(threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error('Access denied to this thread');
    }

    // Get messages with sender info
    const messagesWithSender = await db
      .select({
        id: messages.id,
        threadId: messages.threadId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        attachments: messages.attachments,
        replyToId: messages.replyToId,
        isEdited: messages.isEdited,
        editedAt: messages.editedAt,
        deliveryStatus: messages.deliveryStatus,
        readBy: messages.readBy,
        metadata: messages.metadata,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        sender: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.threadId, threadId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.threadId, threadId));

    const result = {
      messages: messagesWithSender,
      total: count,
      hasMore: offset + limit < count,
    };

    // Cache for 1 minute
    await this.cache.set(cacheKey, result, { ttl: 60 });

    return result;
  }

  /**
   * Get user's message threads
   */
  async getUserThreads(
    userId: number,
    filters: Omit<ThreadSearchFilters, 'userId'> = {}
  ): Promise<{
    threads: (MessageThread & { 
      lastMessage?: Message;
      unreadCount: number;
      otherParticipants: { id: number; username: string; firstName?: string; lastName?: string }[];
    })[];
    total: number;
  }> {
    const cacheKey = `user-threads-${userId}-${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    let query = db
      .select()
      .from(messageThreads)
      .where(sql`${userId} = ANY(${messageThreads.participants})`);

    // Apply filters
    if (filters.threadType) {
      query = query.where(eq(messageThreads.threadType, filters.threadType));
    }

    if (filters.isActive !== undefined) {
      query = query.where(eq(messageThreads.isActive, filters.isActive));
    }

    const threads = await query
      .orderBy(desc(messageThreads.lastMessageAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    // Enrich threads with additional data
    const enrichedThreads = await Promise.all(
      threads.map(async (thread) => {
        // Get last message
        let lastMessage = null;
        if (thread.lastMessageId) {
          const [msg] = await db
            .select()
            .from(messages)
            .where(eq(messages.id, thread.lastMessageId))
            .limit(1);
          lastMessage = msg || null;
        }

        // Get unread count for this user
        const [{ count: unreadCount }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.threadId, thread.id),
              sql`NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements(${messages.readBy}) AS elem
                WHERE (elem->>'userId')::int = ${userId}
              )`
            )
          );

        // Get other participants info
        const otherParticipantIds = thread.participants.filter(id => id !== userId);
        const otherParticipants = await db
          .select({
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(inArray(users.id, otherParticipantIds));

        return {
          ...thread,
          lastMessage,
          unreadCount,
          otherParticipants,
        };
      })
    );

    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageThreads)
      .where(sql`${userId} = ANY(${messageThreads.participants})`);

    const result = {
      threads: enrichedThreads,
      total,
    };

    // Cache for 2 minutes
    await this.cache.set(cacheKey, result, { ttl: 120 });

    return result;
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: number, userId: number): Promise<void> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user is participant
    const thread = await this.getThreadById(message.threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error('Access denied');
    }

    // Check if already read
    const readBy = message.readBy || [];
    const alreadyRead = readBy.some((read: any) => read.userId === userId);

    if (!alreadyRead) {
      const updatedReadBy = [...readBy, { userId, readAt: new Date().toISOString() }];
      
      await db
        .update(messages)
        .set({ 
          readBy: updatedReadBy,
          deliveryStatus: 'read',
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId));

      // Clear caches
      await this.clearMessageCaches(message.threadId, thread.participants);
    }
  }

  /**
   * Mark all messages in thread as read
   */
  async markThreadAsRead(threadId: number, userId: number): Promise<void> {
    // Verify user is participant
    const thread = await this.getThreadById(threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error('Access denied to this thread');
    }

    // Get unread messages for this user
    const unreadMessages = await db
      .select({ id: messages.id, readBy: messages.readBy })
      .from(messages)
      .where(
        and(
          eq(messages.threadId, threadId),
          sql`NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(${messages.readBy}) AS elem
            WHERE (elem->>'userId')::int = ${userId}
          )`
        )
      );

    // Update each unread message
    for (const message of unreadMessages) {
      const readBy = message.readBy || [];
      const updatedReadBy = [...readBy, { userId, readAt: new Date().toISOString() }];
      
      await db
        .update(messages)
        .set({ 
          readBy: updatedReadBy,
          deliveryStatus: 'read',
          updatedAt: new Date(),
        })
        .where(eq(messages.id, message.id));
    }

    // Clear caches
    await this.clearMessageCaches(threadId, thread.participants);
  }

  // Notification Management

  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    const notificationData: InsertNotification = {
      userId: data.userId,
      type: data.type,
      title: data.title,
      content: data.content,
      actionUrl: data.actionUrl,
      channels: data.channels || { inApp: true },
      priority: data.priority || 'normal',
      metadata: data.metadata,
      expiresAt: data.expiresAt,
      deliveryStatus: { inApp: 'sent' },
    };

    const [notification] = await db.insert(notifications).values(notificationData).returning();

    // Clear user's notification cache
    await this.cache.delete(`notifications-${data.userId}-*`);

    return notification;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: number,
    filters: Omit<NotificationFilters, 'userId'> = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const cacheKey = `notifications-${userId}-${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    let query = db.select().from(notifications).where(eq(notifications.userId, userId));

    // Apply filters
    if (filters.type) {
      query = query.where(eq(notifications.type, filters.type));
    }

    if (filters.isRead !== undefined) {
      query = query.where(eq(notifications.isRead, filters.isRead));
    }

    if (filters.priority) {
      query = query.where(eq(notifications.priority, filters.priority));
    }

    if (filters.dateFrom) {
      query = query.where(sql`${notifications.createdAt} >= ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
      query = query.where(sql`${notifications.createdAt} <= ${filters.dateTo}`);
    }

    // Filter out expired notifications
    query = query.where(
      or(
        sql`${notifications.expiresAt} IS NULL`,
        sql`${notifications.expiresAt} > NOW()`
      )
    );

    const notificationsList = await query
      .orderBy(desc(notifications.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    // Get unread count
    const [{ count: unreadCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const result = {
      notifications: notificationsList,
      total,
      unreadCount,
    };

    // Cache for 1 minute
    await this.cache.set(cacheKey, result, { ttl: 60 });

    return result;
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: number, userId: number): Promise<void> {
    const result = await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new Error('Notification not found or access denied');
    }

    // Clear user's notification cache
    await this.cache.delete(`notifications-${userId}-*`);
  }

  // Private helper methods

  private async getThreadById(threadId: number): Promise<MessageThread | null> {
    const cacheKey = `thread-${threadId}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as MessageThread;
    }

    const [thread] = await db
      .select()
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);

    if (thread) {
      // Cache for 5 minutes
      await this.cache.set(cacheKey, thread, { ttl: 300 });
    }

    return thread || null;
  }

  private async findDirectThread(participants: number[]): Promise<MessageThread | null> {
    if (participants.length !== 2) return null;

    const [thread] = await db
      .select()
      .from(messageThreads)
      .where(
        and(
          eq(messageThreads.threadType, 'direct'),
          sql`${messageThreads.participants} @> ${JSON.stringify(participants)}`,
          sql`${messageThreads.participants} <@ ${JSON.stringify(participants)}`
        )
      )
      .limit(1);

    return thread || null;
  }

  private async notifyThreadParticipants(
    thread: MessageThread,
    message: Message,
    senderId: number
  ): Promise<void> {
    const otherParticipants = thread.participants.filter(id => id !== senderId);

    // Get sender info for notification
    const [sender] = await db
      .select({ username: users.username, firstName: users.firstName })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    const senderName = sender?.firstName || sender?.username || 'Someone';

    // Create notifications for other participants
    const notifications = otherParticipants.map(userId => ({
      userId,
      type: 'message',
      title: `New message from ${senderName}`,
      content: message.content.length > 100 
        ? `${message.content.substring(0, 100)}...` 
        : message.content,
      actionUrl: `/messages/${thread.id}`,
      channels: { inApp: true, push: true },
      priority: 'normal' as const,
      metadata: {
        messageId: message.id,
        relatedUserId: senderId,
      },
    }));

    if (notifications.length > 0) {
      await db.insert(notifications).values(notifications);
    }
  }

  private async clearThreadCaches(participants: number[]): Promise<void> {
    const cacheKeys = participants.map(userId => `user-threads-${userId}-*`);
    await Promise.all(cacheKeys.map(key => this.cache.delete(key)));
  }

  private async clearMessageCaches(threadId: number, participants: number[]): Promise<void> {
    const cacheKeys = [
      `messages-${threadId}-*`,
      `thread-${threadId}`,
      ...participants.map(userId => `user-threads-${userId}-*`),
      ...participants.map(userId => `notifications-${userId}-*`),
    ];
    
    await Promise.all(cacheKeys.map(key => this.cache.delete(key)));
  }

  // Message Status and Management

  /**
   * Edit a message (soft edit with history)
   */
  async editMessage(
    messageId: number,
    userId: number,
    newContent: string
  ): Promise<Message> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Only the sender can edit this message');
    }

    // Check if message is too old to edit (24 hours)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const maxEditAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (messageAge > maxEditAge) {
      throw new Error('Message is too old to edit');
    }

    const [updatedMessage] = await db
      .update(messages)
      .set({
        content: newContent,
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    // Clear relevant caches
    const thread = await this.getThreadById(message.threadId);
    if (thread) {
      await this.clearMessageCaches(message.threadId, thread.participants);
    }

    return updatedMessage;
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: number, userId: number): Promise<void> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Only the sender can delete this message');
    }

    // Soft delete by updating content
    await db
      .update(messages)
      .set({
        content: '[Message deleted]',
        messageType: 'system',
        attachments: null,
        isEdited: true,
        editedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId));

    // Clear relevant caches
    const thread = await this.getThreadById(message.threadId);
    if (thread) {
      await this.clearMessageCaches(message.threadId, thread.participants);
    }
  }

  /**
   * Archive a thread
   */
  async archiveThread(threadId: number, userId: number): Promise<void> {
    const thread = await this.getThreadById(threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error('Thread not found or access denied');
    }

    await db
      .update(messageThreads)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(messageThreads.id, threadId));

    // Clear caches
    await this.clearThreadCaches(thread.participants);
  }

  /**
   * Unarchive a thread
   */
  async unarchiveThread(threadId: number, userId: number): Promise<void> {
    const thread = await this.getThreadById(threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error('Thread not found or access denied');
    }

    await db
      .update(messageThreads)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(messageThreads.id, threadId));

    // Clear caches
    await this.clearThreadCaches(thread.participants);
  }

  /**
   * Leave a group thread
   */
  async leaveThread(threadId: number, userId: number): Promise<void> {
    const thread = await this.getThreadById(threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error('Thread not found or access denied');
    }

    if (thread.threadType === 'direct') {
      throw new Error('Cannot leave a direct message thread');
    }

    // Remove user from participants
    const updatedParticipants = thread.participants.filter(id => id !== userId);
    
    if (updatedParticipants.length === 0) {
      // If no participants left, archive the thread
      await db
        .update(messageThreads)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(messageThreads.id, threadId));
    } else {
      await db
        .update(messageThreads)
        .set({
          participants: updatedParticipants,
          updatedAt: new Date(),
        })
        .where(eq(messageThreads.id, threadId));

      // Add system message about user leaving
      await this.sendMessage({
        threadId,
        senderId: userId, // System message from the leaving user
        content: `${userId} left the conversation`,
        messageType: 'system',
      });
    }

    // Clear caches
    await this.clearThreadCaches(thread.participants);
  }

  /**
   * Add participants to a group thread
   */
  async addParticipants(
    threadId: number,
    userId: number,
    newParticipantIds: number[]
  ): Promise<void> {
    const thread = await this.getThreadById(threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error('Thread not found or access denied');
    }

    if (thread.threadType === 'direct') {
      throw new Error('Cannot add participants to a direct message thread');
    }

    // Validate new participants exist
    const newParticipants = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(inArray(users.id, newParticipantIds));

    if (newParticipants.length !== newParticipantIds.length) {
      throw new Error('One or more new participants do not exist');
    }

    // Add new participants (avoid duplicates)
    const currentParticipants = new Set(thread.participants);
    const participantsToAdd = newParticipantIds.filter(id => !currentParticipants.has(id));
    
    if (participantsToAdd.length === 0) {
      throw new Error('All specified users are already participants');
    }

    const updatedParticipants = [...thread.participants, ...participantsToAdd];

    await db
      .update(messageThreads)
      .set({
        participants: updatedParticipants,
        updatedAt: new Date(),
      })
      .where(eq(messageThreads.id, threadId));

    // Add system message about new participants
    const addedUsernames = newParticipants
      .filter(user => participantsToAdd.includes(user.id))
      .map(user => user.username)
      .join(', ');

    await this.sendMessage({
      threadId,
      senderId: userId,
      content: `Added ${addedUsernames} to the conversation`,
      messageType: 'system',
    });

    // Clear caches
    await this.clearThreadCaches(updatedParticipants);
  }

  /**
   * Search messages across threads
   */
  async searchMessages(
    userId: number,
    searchQuery: string,
    filters: MessageSearchFilters = {}
  ): Promise<{
    messages: (Message & { 
      sender: { id: number; username: string; firstName?: string; lastName?: string };
      thread: { id: number; title?: string; threadType: string };
    })[];
    total: number;
  }> {
    // Get user's accessible threads
    const userThreads = await db
      .select({ id: messageThreads.id })
      .from(messageThreads)
      .where(sql`${userId} = ANY(${messageThreads.participants})`);

    const threadIds = userThreads.map(t => t.id);

    if (threadIds.length === 0) {
      return { messages: [], total: 0 };
    }

    let query = db
      .select({
        id: messages.id,
        threadId: messages.threadId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        attachments: messages.attachments,
        replyToId: messages.replyToId,
        isEdited: messages.isEdited,
        editedAt: messages.editedAt,
        deliveryStatus: messages.deliveryStatus,
        readBy: messages.readBy,
        metadata: messages.metadata,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        sender: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        thread: {
          id: messageThreads.id,
          title: messageThreads.title,
          threadType: messageThreads.threadType,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .innerJoin(messageThreads, eq(messages.threadId, messageThreads.id))
      .where(
        and(
          inArray(messages.threadId, threadIds),
          sql`${messages.content} ILIKE ${`%${searchQuery}%`}`
        )
      );

    // Apply additional filters
    if (filters.threadId) {
      query = query.where(eq(messages.threadId, filters.threadId));
    }

    if (filters.senderId) {
      query = query.where(eq(messages.senderId, filters.senderId));
    }

    if (filters.messageType) {
      query = query.where(eq(messages.messageType, filters.messageType));
    }

    if (filters.dateFrom) {
      query = query.where(sql`${messages.createdAt} >= ${filters.dateFrom}`);
    }

    if (filters.dateTo) {
      query = query.where(sql`${messages.createdAt} <= ${filters.dateTo}`);
    }

    if (filters.hasAttachments !== undefined) {
      if (filters.hasAttachments) {
        query = query.where(sql`${messages.attachments} IS NOT NULL AND jsonb_array_length(${messages.attachments}) > 0`);
      } else {
        query = query.where(sql`${messages.attachments} IS NULL OR jsonb_array_length(${messages.attachments}) = 0`);
      }
    }

    const searchResults = await query
      .orderBy(desc(messages.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    // Get total count
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          inArray(messages.threadId, threadIds),
          sql`${messages.content} ILIKE ${`%${searchQuery}%`}`
        )
      );

    return {
      messages: searchResults,
      total,
    };
  }

  /**
   * Get message delivery status for a thread
   */
  async getThreadDeliveryStatus(threadId: number, userId: number): Promise<{
    totalMessages: number;
    deliveredMessages: number;
    readMessages: number;
    participants: {
      userId: number;
      username: string;
      lastReadMessageId?: number;
      lastReadAt?: Date;
    }[];
  }> {
    const thread = await this.getThreadById(threadId);
    if (!thread || !thread.participants.includes(userId)) {
      throw new Error('Thread not found or access denied');
    }

    // Get total messages count
    const [{ count: totalMessages }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.threadId, threadId));

    // Get delivered and read counts
    const [{ count: deliveredMessages }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.threadId, threadId),
          sql`${messages.deliveryStatus} IN ('delivered', 'read')`
        )
      );

    const [{ count: readMessages }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.threadId, threadId),
          eq(messages.deliveryStatus, 'read')
        )
      );

    // Get participant read status
    const participantUsers = await db
      .select({
        id: users.id,
        username: users.username,
      })
      .from(users)
      .where(inArray(users.id, thread.participants));

    const participants = await Promise.all(
      participantUsers.map(async (user) => {
        // Find last read message for this user
        const lastReadMessage = await db
          .select({
            id: messages.id,
            readBy: messages.readBy,
          })
          .from(messages)
          .where(
            and(
              eq(messages.threadId, threadId),
              sql`EXISTS (
                SELECT 1 FROM jsonb_array_elements(${messages.readBy}) AS elem
                WHERE (elem->>'userId')::int = ${user.id}
              )`
            )
          )
          .orderBy(desc(messages.createdAt))
          .limit(1);

        let lastReadMessageId: number | undefined;
        let lastReadAt: Date | undefined;

        if (lastReadMessage.length > 0) {
          const readEntry = (lastReadMessage[0].readBy as any[])?.find(
            (entry: any) => entry.userId === user.id
          );
          lastReadMessageId = lastReadMessage[0].id;
          lastReadAt = readEntry ? new Date(readEntry.readAt) : undefined;
        }

        return {
          userId: user.id,
          username: user.username,
          lastReadMessageId,
          lastReadAt,
        };
      })
    );

    return {
      totalMessages,
      deliveredMessages,
      readMessages,
      participants,
    };
  }

  /**
   * Get service statistics
   */
  getStats(): {
    cacheSize: number;
    deduplicationStats: any;
  } {
    return {
      cacheSize: 0, // Would need to implement cache size tracking
      deduplicationStats: this.deduplicator.getStats(),
    };
  }
}

/**
 * Default instance for easy access
 */
export const communicationService = new CommunicationService();