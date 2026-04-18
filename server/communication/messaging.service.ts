/**
 * Messaging Service
 * Core service for handling messages, threads, and notifications
 * Includes real-time messaging, conversation threading, and notification management
 */

import { EventEmitter } from 'events';
} from '@shared/types/messaging';

class MessagingService extends EventEmitter {
  private messages: Map<string, Message> = new Map();
  private threads: Map<string, MessageThread> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private userPresence: Map<string, UserPresence> = new Map();
  private typingIndicators: Map<string, TypingIndicator[]> = new Map();

  constructor() {
    super();
    this.initializeService();
  }

  private initializeService(): void {
    // Initialize with some mock data for development
    this.createMockData();
    
    // Set up cleanup intervals
    setInterval(() => this.cleanupExpiredNotifications(), 60000); // Every minute
    setInterval(() => this.cleanupTypingIndicators(), 5000); // Every 5 seconds
  }

  /**
   * Send a message
   */
  async sendMessage(senderId: string, request: SendMessageRequest): Promise<Message> {
    try {
      // Validate request
      this.validateSendMessageRequest(request);

      // Get or create thread
      let thread: MessageThread;
      if (request.threadId) {
        thread = this.threads.get(request.threadId);
        if (!thread) {
          throw new Error('Thread not found');
        }
      } else {
        // Create new thread
        thread = await this.createThread(senderId, {
          participantIds: [senderId, request.recipientId],
          subject: request.subject,
          threadType: this.determineThreadType(request),
          propertyId: request.propertyId,
          initialMessage: {
            content: request.content,
            messageType: request.messageType,
            attachments: request.attachments
          }
        });
      }

      // Create message
      const message: Message = {
        id: this.generateId(),
        threadId: thread.id,
        senderId,
        recipientId: request.recipientId,
        content: request.content,
        messageType: request.messageType,
        status: 'sent',
        attachments: await this.processAttachments(request.attachments),
        metadata: request.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        deliveredAt: new Date() // Simulate immediate delivery
      };

      // Store message
      this.messages.set(message.id, message);

      // Update thread
      thread.lastMessage = message;
      thread.lastActivity = new Date();
      thread.updatedAt = new Date();
      this.threads.set(thread.id, thread);

      // Create notification for recipient
      await this.createNotification({
        userId: request.recipientId,
        type: 'new_message',
        title: 'New Message',
        message: `You have a new message from ${await this.getUserName(senderId)}`,
        data: {
          messageId: message.id,
          threadId: thread.id,
          senderId,
          actionUrl: `/messages/${thread.id}`
        },
        priority: 'medium'
      });

      // Emit real-time events
      this.emit('message_sent', {
        type: 'message_sent',
        data: message,
        timestamp: new Date(),
        userId: senderId
      } as WebSocketEvent);

      this.emit('message_delivered', {
        type: 'message_delivered',
        data: { ...message, status: 'delivered' },
        timestamp: new Date(),
        userId: request.recipientId
      } as WebSocketEvent);

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Create a new message thread
   */
  async createThread(creatorId: string, request: CreateThreadRequest): Promise<MessageThread> {
    try {
      const thread: MessageThread = {
        id: this.generateId(),
        participants: request.participantIds,
        subject: request.subject,
        threadType: request.threadType,
        propertyId: request.propertyId,
        lastActivity: new Date(),
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: request.metadata
      };

      this.threads.set(thread.id, thread);

      // Send initial message if provided
      if (request.initialMessage) {
        const recipientId = request.participantIds.find(id => id !== creatorId);
        if (recipientId) {
          await this.sendMessage(creatorId, {
            threadId: thread.id,
            recipientId,
            content: request.initialMessage.content,
            messageType: request.initialMessage.messageType,
            attachments: request.initialMessage.attachments
          });
        }
      }

      return thread;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  /**
   * Get messages for a thread with pagination
   */
  async getMessages(
    threadId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<MessagesResponse> {
    try {
      // Verify user has access to thread
      const thread = this.threads.get(threadId);
      if (!thread || !thread.participants.includes(userId)) {
        throw new Error('Access denied to thread');
      }

      // Get messages for thread
      const threadMessages = Array.from(this.messages.values())
        .filter(message => message.threadId === threadId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMessages = threadMessages.slice(startIndex, endIndex);

      // Mark messages as read
      await this.markMessagesAsRead(paginatedMessages.map(m => m.id), userId);

      return {
        messages: paginatedMessages.reverse(), // Return in chronological order
        total: threadMessages.length,
        page,
        limit,
        hasMore: endIndex < threadMessages.length
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Get user's message threads
   */
  async getThreads(
    userId: string,
    filters: Partial<ThreadSearchFilters> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<ThreadsResponse> {
    try {
      let userThreads = Array.from(this.threads.values())
        .filter(thread => thread.participants.includes(userId));

      // Apply filters
      if (filters.threadType) {
        userThreads = userThreads.filter(thread => thread.threadType === filters.threadType);
      }
      if (filters.propertyId) {
        userThreads = userThreads.filter(thread => thread.propertyId === filters.propertyId);
      }
      if (filters.isArchived !== undefined) {
        userThreads = userThreads.filter(thread => thread.isArchived === filters.isArchived);
      }
      if (filters.hasUnread) {
        userThreads = userThreads.filter(thread => this.hasUnreadMessages(thread.id, userId));
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        userThreads = userThreads.filter(thread => 
          thread.subject?.toLowerCase().includes(query) ||
          thread.lastMessage?.content.toLowerCase().includes(query)
        );
      }

      // Sort by last activity
      userThreads.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedThreads = userThreads.slice(startIndex, endIndex);

      return {
        threads: paginatedThreads,
        total: userThreads.length,
        page,
        limit,
        hasMore: endIndex < userThreads.length
      };
    } catch (error) {
      console.error('Error getting threads:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(
    userId: string,
    filters: Partial<NotificationFilters> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<NotificationsResponse> {
    try {
      let userNotifications = Array.from(this.notifications.values())
        .filter(notification => notification.userId === userId);

      // Apply filters
      if (filters.type) {
        userNotifications = userNotifications.filter(n => n.type === filters.type);
      }
      if (filters.isRead !== undefined) {
        userNotifications = userNotifications.filter(n => n.isRead === filters.isRead);
      }
      if (filters.priority) {
        userNotifications = userNotifications.filter(n => n.priority === filters.priority);
      }
      if (filters.dateFrom) {
        userNotifications = userNotifications.filter(n => n.createdAt >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        userNotifications = userNotifications.filter(n => n.createdAt <= filters.dateTo!);
      }

      // Sort by creation date (newest first)
      userNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Calculate unread count
      const unreadCount = userNotifications.filter(n => !n.isRead).length;

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNotifications = userNotifications.slice(startIndex, endIndex);

      return {
        notifications: paginatedNotifications,
        total: userNotifications.length,
        unreadCount,
        page,
        limit,
        hasMore: endIndex < userNotifications.length
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(messageIds: string[], userId: string): Promise<void> {
    try {
      const readAt = new Date();
      
      messageIds.forEach(messageId => {
        const message = this.messages.get(messageId);
        if (message && message.recipientId === userId && !message.readAt) {
          message.readAt = readAt;
          message.status = 'read';
          this.messages.set(messageId, message);

          // Emit read event
          this.emit('message_read', {
            type: 'message_read',
            data: message,
            timestamp: readAt,
            userId
          } as WebSocketEvent);
        }
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(notificationIds: string[], userId: string): Promise<void> {
    try {
      const readAt = new Date();
      
      notificationIds.forEach(notificationId => {
        const notification = this.notifications.get(notificationId);
        if (notification && notification.userId === userId && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = readAt;
          this.notifications.set(notificationId, notification);
        }
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Set user typing indicator
   */
  async setTypingIndicator(threadId: string, userId: string, isTyping: boolean): Promise<void> {
    try {
      const indicators = this.typingIndicators.get(threadId) || [];
      const existingIndex = indicators.findIndex(indicator => indicator.userId === userId);

      if (isTyping) {
        const indicator: TypingIndicator = {
          threadId,
          userId,
          isTyping: true,
          timestamp: new Date()
        };

        if (existingIndex >= 0) {
          indicators[existingIndex] = indicator;
        } else {
          indicators.push(indicator);
        }
      } else {
        if (existingIndex >= 0) {
          indicators.splice(existingIndex, 1);
        }
      }

      this.typingIndicators.set(threadId, indicators);

      // Emit typing event
      this.emit('user_typing', {
        type: 'user_typing',
        data: { threadId, userId, isTyping },
        timestamp: new Date()
      } as WebSocketEvent);
    } catch (error) {
      console.error('Error setting typing indicator:', error);
      throw error;
    }
  }

  /**
   * Update user presence
   */
  async updateUserPresence(userId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    try {
      const presence: UserPresence = {
        userId,
        status,
        lastSeen: new Date()
      };

      this.userPresence.set(userId, presence);

      // Emit presence event
      this.emit(`user_${status}`, {
        type: `user_${status}` as any,
        data: presence,
        timestamp: new Date(),
        userId
      } as WebSocketEvent);
    } catch (error) {
      console.error('Error updating user presence:', error);
      throw error;
    }
  }

  /**
   * Get messaging metrics
   */
  async getMetrics(): Promise<MessageMetrics> {
    try {
      const messages = Array.from(this.messages.values());
      const threads = Array.from(this.threads.values());
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Calculate metrics
      const messagesByType = messages.reduce((acc, message) => {
        acc[message.messageType] = (acc[message.messageType] || 0) + 1;
        return acc;
      }, {} as Record<MessageType, number>);

      const threadsByType = threads.reduce((acc, thread) => {
        acc[thread.threadType] = (acc[thread.threadType] || 0) + 1;
        return acc;
      }, {} as Record<ThreadType, number>);

      const recentMessages = messages.filter(m => m.createdAt >= oneDayAgo);
      const activeUsers = new Set([
        ...recentMessages.map(m => m.senderId),
        ...recentMessages.map(m => m.recipientId)
      ]);

      return {
        totalMessages: messages.length,
        totalThreads: threads.length,
        activeThreads: threads.filter(t => t.lastActivity >= oneDayAgo).length,
        averageResponseTime: this.calculateAverageResponseTime(messages),
        messagesByType,
        threadsByType,
        userEngagement: {
          dailyActiveUsers: activeUsers.size,
          messagesSent: recentMessages.length,
          messagesReceived: recentMessages.length
        }
      };
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw error;
    }
  }

  // Private helper methods

  private validateSendMessageRequest(request: SendMessageRequest): void {
    if (!request.recipientId) {
      throw new Error('Recipient ID is required');
    }
    if (!request.content || request.content.trim().length === 0) {
      throw new Error('Message content is required');
    }
    if (request.content.length > 5000) {
      throw new Error('Message content too long (max 5000 characters)');
    }
  }

  private determineThreadType(request: SendMessageRequest): ThreadType {
    if (request.propertyId) return 'property_inquiry';
    if (request.messageType === 'verification_request') return 'verification_discussion';
    if (request.messageType === 'appointment_request') return 'appointment_scheduling';
    return 'direct_message';
  }

  private async processAttachments(attachments?: File[]): Promise<any[]> {
    // Mock attachment processing
    if (!attachments || attachments.length === 0) return [];
    
    return attachments.map((file, index) => ({
      id: this.generateId(),
      fileName: `attachment_${index}`,
      fileSize: 1024,
      mimeType: 'application/octet-stream',
      url: `/uploads/attachment_${index}`,
      uploadedAt: new Date()
    }));
  }

  private async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> {
    const newNotification: Notification = {
      id: this.generateId(),
      isRead: false,
      createdAt: new Date(),
      ...notification
    };

    this.notifications.set(newNotification.id, newNotification);

    // Emit notification event
    this.emit('notification_received', {
      type: 'notification_received',
      data: newNotification,
      timestamp: new Date(),
      userId: notification.userId
    } as WebSocketEvent);

    return newNotification;
  }

  private hasUnreadMessages(threadId: string, userId: string): boolean {
    return Array.from(this.messages.values()).some(message => 
      message.threadId === threadId && 
      message.recipientId === userId && 
      !message.readAt
    );
  }

  private calculateAverageResponseTime(messages: Message[]): number {
    // Mock calculation - in real implementation, calculate based on conversation patterns
    return 300; // 5 minutes in seconds
  }

  private async getUserName(userId: string): Promise<string> {
    // Mock user name lookup
    return `User ${userId.substring(0, 8)}`;
  }

  private cleanupExpiredNotifications(): void {
    const now = new Date();
    Array.from(this.notifications.entries()).forEach(([id, notification]) => {
      if (notification.expiresAt && notification.expiresAt < now) {
        this.notifications.delete(id);
      }
    });
  }

  private cleanupTypingIndicators(): void {
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    this.typingIndicators.forEach((indicators, threadId) => {
      const activeIndicators = indicators.filter(indicator => 
        indicator.timestamp > fiveSecondsAgo
      );
      if (activeIndicators.length !== indicators.length) {
        this.typingIndicators.set(threadId, activeIndicators);
      }
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private createMockData(): void {
    // Create some mock threads and messages for development
    const mockThread: MessageThread = {
      id: 'thread_1',
      participants: ['user_1', 'user_2'],
      subject: 'Property Inquiry - Modern Apartment in Westlands',
      threadType: 'property_inquiry',
      propertyId: 'prop_1',
      lastActivity: new Date(),
      isArchived: false,
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date(),
      metadata: {
        propertyTitle: 'Modern Apartment in Westlands',
        propertyPrice: 150000,
        inquiryType: 'viewing_request'
      }
    };

    this.threads.set(mockThread.id, mockThread);

    const mockMessage: Message = {
      id: 'msg_1',
      threadId: 'thread_1',
      senderId: 'user_1',
      recipientId: 'user_2',
      content: 'Hi, I\'m interested in viewing this property. When would be a good time?',
      messageType: 'property_inquiry',
      status: 'delivered',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      updatedAt: new Date(Date.now() - 3600000),
      deliveredAt: new Date(Date.now() - 3600000)
    };

    this.messages.set(mockMessage.id, mockMessage);
    mockThread.lastMessage = mockMessage;
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
export default messagingService;