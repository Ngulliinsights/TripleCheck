import { IncomingMessage } from 'http';
import { parse } from 'url';

import { WebSocket, WebSocketServer } from 'ws';

/**
 * Real-time Notification Service
 * Handles WebSocket connections and real-time notifications
 */

interface NotificationClient {
  ws: WebSocket;
  userId: number;
  lastActivity: Date;
}

interface Notification {
  id: string;
  userId: number;
  type: 'payment' | 'property' | 'message' | 'verification' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

interface NotificationTemplate {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export class NotificationService {
  private wss: WebSocketServer;
  private clients: Map<number, NotificationClient> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor(server?: any) {
    // Only initialize WebSocket server if a proper server is provided
    if (server && typeof server.on === 'function') {
      this.wss = new WebSocketServer({
        server: server as any,
        path: '/ws/notifications'
      });
      this.setupWebSocketServer();
    } else {
      // Create a mock WebSocket server for testing/development
      this.wss = new WebSocketServer({
        noServer: true
      });
    }

    this.setupNotificationTemplates();
    this.startCleanupInterval();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      console.log('New WebSocket connection');

      // Extract user ID from query parameters or headers
      const url = parse(request.url || '', true);
      const userId = parseInt(url.query.userId as string);

      if (!userId || isNaN(userId)) {
        console.log('WebSocket connection rejected: No valid user ID');
        ws.close(1008, 'Authentication required');
        return;
      }

      // Store client connection
      const client: NotificationClient = {
        ws,
        userId,
        lastActivity: new Date()
      };

      this.clients.set(userId, client);
      console.log(`User ${userId} connected to notifications`);

      // Send pending notifications
      this.sendPendingNotifications(userId);

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(userId, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      // Handle connection close
      ws.on('close', () => {
        this.clients.delete(userId);
        console.log(`User ${userId} disconnected from notifications`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        this.clients.delete(userId);
      });

      // Send connection confirmation
      this.sendToClient(userId, {
        type: 'connection',
        status: 'connected',
        message: 'Real-time notifications enabled'
      });
    });
  }

  private setupNotificationTemplates() {
    const templates: Record<string, NotificationTemplate> = {
      payment_success: {
        type: 'payment',
        title: 'Payment Successful',
        message: 'Your payment of KES {amount} has been processed successfully.',
        priority: 'medium'
      },
      payment_failed: {
        type: 'payment',
        title: 'Payment Failed',
        message: 'Your payment of KES {amount} could not be processed. Please try again.',
        priority: 'high'
      },
      property_verified: {
        type: 'property',
        title: 'Property Verified',
        message: 'Your property "{propertyTitle}" has been successfully verified.',
        priority: 'medium'
      },
      property_rejected: {
        type: 'property',
        title: 'Property Verification Failed',
        message: 'Your property "{propertyTitle}" could not be verified. Please review and resubmit.',
        priority: 'high'
      },
      new_inquiry: {
        type: 'message',
        title: 'New Property Inquiry',
        message: 'You have a new inquiry for "{propertyTitle}" from {senderName}.',
        priority: 'medium'
      },
      document_processed: {
        type: 'verification',
        title: 'Document Processed',
        message: 'Your document verification is complete. Results are now available.',
        priority: 'medium'
      },
      system_maintenance: {
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will begin at {time}. Some features may be temporarily unavailable.',
        priority: 'low'
      }
    };

    Object.entries(templates).forEach(([key, template]) => {
      this.templates.set(key, template);
    });
  }

  private handleClientMessage(userId: number, message: Record<string, unknown>) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(userId, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      case 'mark_read':
        if (message.notificationId) {
          this.markNotificationAsRead(message.notificationId as string);
        }
        break;

      case 'get_notifications':
        this.sendPendingNotifications(userId);
        break;

      default:
        console.log(`Unknown message type from user ${userId}:`, message.type);
    }

    // Update last activity
    const client = this.clients.get(userId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  private sendToClient(userId: number, data: Record<string, unknown>) {
    const client = this.clients.get(userId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error(`Failed to send to user ${userId}:`, error);
        this.clients.delete(userId);
        return false;
      }
    }
    return false;
  }

  private sendPendingNotifications(userId: number) {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.read)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20); // Limit to 20 most recent

    if (userNotifications.length > 0) {
      this.sendToClient(userId, {
        type: 'notifications',
        data: userNotifications
      });
    }
  }

  /**
   * Create and send a notification
   */
  public async createNotification(
    userId: number,
    templateKey: string,
    variables: Record<string, any> = {},
    options: Partial<Notification> = {}
  ): Promise<string> {
    const template = this.templates.get(templateKey);
    if (!template) {
      throw new Error(`Notification template '${templateKey}' not found`);
    }

    // Replace variables in template
    let { title } = template;
    let { message } = template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      message = message.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Create notification
    const notificationId = `notif_${Date.now()}_${userId}_${Math.random().toString(36).substring(2, 11)}`;
    const notification: Notification = {
      id: notificationId,
      userId,
      type: template.type as any,
      title,
      message,
      ...(options.data && { data: options.data }),
      priority: options.priority || template.priority,
      read: false,
      createdAt: new Date(),
      ...options
    };

    if (options.expiresAt !== undefined) {
      notification.expiresAt = options.expiresAt;
    }

    // Store notification
    this.notifications.set(notificationId, notification);

    // Send to client if connected
    const sent = this.sendToClient(userId, {
      type: 'notification',
      data: notification
    });

    console.log(`Notification created for user ${userId}: ${title} (sent: ${sent})`);
    return notificationId;
  }

  /**
   * Send notification to multiple users
   */
  public async broadcastNotification(
    userIds: number[],
    templateKey: string,
    variables: Record<string, unknown> = {},
    options: Partial<Notification> = {}
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const userId of userIds) {
      try {
        const id = await this.createNotification(userId, templateKey, variables, options);
        notificationIds.push(id);
      } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
      }
    }

    return notificationIds;
  }

  /**
   * Mark notification as read
   */
  public markNotificationAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * Get notifications for a user
   */
  public getUserNotifications(userId: number, limit: number = 50): Notification[] {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get unread notification count for a user
   */
  public getUnreadCount(userId: number): number {
    return Array.from(this.notifications.values())
      .filter(n => n.userId === userId && !n.read).length;
  }

  /**
   * Delete old notifications
   */
  private startCleanupInterval() {
    setInterval(() => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let deletedCount = 0;
      for (const [id, notification] of this.notifications.entries()) {
        // Delete if expired or older than 1 week
        if (
          (notification.expiresAt && notification.expiresAt < now) ||
          notification.createdAt < oneWeekAgo
        ) {
          this.notifications.delete(id);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} old notifications`);
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.clients.size;
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: number): boolean {
    const client = this.clients.get(userId);
    return client ? client.ws.readyState === WebSocket.OPEN : false;
  }

  /**
   * Disconnect a user
   */
  public disconnectUser(userId: number): boolean {
    const client = this.clients.get(userId);
    if (client) {
      client.ws.close();
      this.clients.delete(userId);
      return true;
    }
    return false;
  }

  /**
   * Send fraud report notification to fraud team
   */
  async sendFraudReportNotification(report: Record<string, unknown>): Promise<void> {
    // This would send notifications to fraud investigation team
    console.log('Fraud report notification:', report.id);

    // In a real implementation, this would:
    // 1. Send email to fraud team
    // 2. Create internal notifications
    // 3. Trigger alerts if high-severity
  }

  /**
   * Send community moderation notification
   */
  async sendCommunityModerationNotification(experience: Record<string, unknown>): Promise<void> {
    // This would send notifications to community moderators
    console.log('Community moderation notification:', experience.id);

    // In a real implementation, this would:
    // 1. Send notifications to moderators
    // 2. Auto-flag content based on keywords
    // 3. Queue for review if needed
  }

  /**
   * Send content report notification
   */
  async sendContentReportNotification(_report: Record<string, unknown>): Promise<void> {
    // This would send notifications to content moderators


    // In a real implementation, this would:
    // 1. Send notifications to content moderators
    // 2. Escalate based on report type
    // 3. Auto-hide content if multiple reports
  }
}

// Export types
export type { Notification, NotificationClient, NotificationTemplate };