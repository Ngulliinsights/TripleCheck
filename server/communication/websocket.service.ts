/**
 * WebSocket Service
 * Real-time messaging service for handling WebSocket connections
 * Integrates with MessagingService for real-time message delivery
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { messagingService } from './MessagingService';
import {
  WebSocketEvent,
  WebSocketEventType,
  TypingIndicator,
  UserPresence
} from '../types/messaging.types';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
  lastPing?: number;
}

interface WebSocketConnection {
  ws: AuthenticatedWebSocket;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, WebSocketConnection[]> = new Map(); // userId -> connections
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupMessagingServiceListeners();
  }

  /**
   * Initialize WebSocket server
   */
  public initialize(server: any): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();
    this.startCleanup();

    console.log('WebSocket service initialized');
  }

  /**
   * Shutdown WebSocket service
   */
  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.connections.clear();
    console.log('WebSocket service shutdown');
  }

  /**
   * Send message to specific user
   */
  public sendToUser(userId: string, message: WebSocketMessage): boolean {
    const userConnections = this.connections.get(userId);
    if (!userConnections || userConnections.length === 0) {
      return false;
    }

    let sent = false;
    userConnections.forEach(connection => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(JSON.stringify(message));
          connection.lastActivity = new Date();
          sent = true;
        } catch (error) {
          console.error('Error sending message to user:', error);
        }
      }
    });

    return sent;
  }

  /**
   * Send message to multiple users
   */
  public sendToUsers(userIds: string[], message: WebSocketMessage): number {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (this.sendToUser(userId, message)) {
        sentCount++;
      }
    });
    return sentCount;
  }

  /**
   * Broadcast message to all connected users
   */
  public broadcast(message: WebSocketMessage, excludeUserId?: string): number {
    let sentCount = 0;
    
    this.connections.forEach((userConnections, userId) => {
      if (excludeUserId && userId === excludeUserId) {
        return;
      }

      if (this.sendToUser(userId, message)) {
        sentCount++;
      }
    });

    return sentCount;
  }

  /**
   * Get online users
   */
  public getOnlineUsers(): string[] {
    return Array.from(this.connections.keys()).filter(userId => {
      const userConnections = this.connections.get(userId);
      return userConnections && userConnections.some(conn => 
        conn.ws.readyState === WebSocket.OPEN
      );
    });
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    const userConnections = this.connections.get(userId);
    return userConnections ? userConnections.some(conn => 
      conn.ws.readyState === WebSocket.OPEN
    ) : false;
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    totalConnections: number;
    activeConnections: number;
    onlineUsers: number;
    connectionsByUser: Record<string, number>;
  } {
    let totalConnections = 0;
    let activeConnections = 0;
    const connectionsByUser: Record<string, number> = {};

    this.connections.forEach((userConnections, userId) => {
      const activeUserConnections = userConnections.filter(conn => 
        conn.ws.readyState === WebSocket.OPEN
      );
      
      totalConnections += userConnections.length;
      activeConnections += activeUserConnections.length;
      connectionsByUser[userId] = activeUserConnections.length;
    });

    return {
      totalConnections,
      activeConnections,
      onlineUsers: this.getOnlineUsers().length,
      connectionsByUser
    };
  }

  private verifyClient(info: { origin: string; secure: boolean; req: IncomingMessage }): boolean {
    // In production, implement proper authentication verification
    // For now, allow all connections
    return true;
  }

  private handleConnection(ws: AuthenticatedWebSocket, request: IncomingMessage): void {
    console.log('New WebSocket connection');

    // Extract user ID from query parameters or headers
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const userId = url.searchParams.get('userId') || 'anonymous';

    ws.userId = userId;
    ws.isAlive = true;
    ws.lastPing = Date.now();

    // Store connection
    const connection: WebSocketConnection = {
      ws,
      userId,
      connectedAt: new Date(),
      lastActivity: new Date()
    };

    if (!this.connections.has(userId)) {
      this.connections.set(userId, []);
    }
    this.connections.get(userId)!.push(connection);

    // Set up event handlers
    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(ws);
    });

    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastPing = Date.now();
    });

    // Update user presence
    if (userId !== 'anonymous') {
      messagingService.updateUserPresence(userId, 'online').catch(console.error);
    }

    // Send welcome message
    this.sendToUser(userId, {
      type: 'connection_established',
      payload: {
        userId,
        timestamp: Date.now(),
        message: 'WebSocket connection established'
      },
      timestamp: Date.now()
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const userId = ws.userId;

      if (!userId) {
        return;
      }

      // Update last activity
      const userConnections = this.connections.get(userId);
      if (userConnections) {
        const connection = userConnections.find(conn => conn.ws === ws);
        if (connection) {
          connection.lastActivity = new Date();
        }
      }

      // Handle different message types
      switch (message.type) {
        case 'ping':
          this.handlePing(ws, message);
          break;
        
        case 'typing_start':
          this.handleTypingIndicator(userId, message.payload, true);
          break;
        
        case 'typing_stop':
          this.handleTypingIndicator(userId, message.payload, false);
          break;
        
        case 'presence_update':
          this.handlePresenceUpdate(userId, message.payload);
          break;
        
        case 'join_thread':
          this.handleJoinThread(userId, message.payload);
          break;
        
        case 'leave_thread':
          this.handleLeaveThread(userId, message.payload);
          break;
        
        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket): void {
    const userId = ws.userId;
    if (!userId) {
      return;
    }

    console.log(`WebSocket disconnected for user: ${userId}`);

    // Remove connection
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const index = userConnections.findIndex(conn => conn.ws === ws);
      if (index > -1) {
        userConnections.splice(index, 1);
      }

      // If no more connections for this user, update presence
      if (userConnections.length === 0) {
        this.connections.delete(userId);
        if (userId !== 'anonymous') {
          messagingService.updateUserPresence(userId, 'offline').catch(console.error);
        }
      }
    }
  }

  private handlePing(ws: AuthenticatedWebSocket, message: WebSocketMessage): void {
    // Respond with pong
    const pongMessage: WebSocketMessage = {
      type: 'pong',
      payload: {
        timestamp: Date.now(),
        clientTimestamp: message.payload?.timestamp
      },
      timestamp: Date.now()
    };

    try {
      ws.send(JSON.stringify(pongMessage));
    } catch (error) {
      console.error('Error sending pong:', error);
    }
  }

  private handleTypingIndicator(userId: string, payload: any, isTyping: boolean): void {
    const { threadId } = payload;
    if (!threadId) {
      return;
    }

    // Update typing indicator in messaging service
    messagingService.setTypingIndicator(threadId, userId, isTyping).catch(console.error);

    // Broadcast typing indicator to other thread participants
    // In a real implementation, you'd get thread participants from the messaging service
    const typingMessage: WebSocketMessage = {
      type: isTyping ? 'user_typing_start' : 'user_typing_stop',
      payload: {
        threadId,
        userId,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    // For now, broadcast to all users except the sender
    this.broadcast(typingMessage, userId);
  }

  private handlePresenceUpdate(userId: string, payload: any): void {
    const { status } = payload;
    if (!['online', 'offline', 'away'].includes(status)) {
      return;
    }

    messagingService.updateUserPresence(userId, status).catch(console.error);
  }

  private handleJoinThread(userId: string, payload: any): void {
    const { threadId } = payload;
    if (!threadId) {
      return;
    }

    // Notify other thread participants
    const joinMessage: WebSocketMessage = {
      type: 'user_joined_thread',
      payload: {
        threadId,
        userId,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    this.broadcast(joinMessage, userId);
  }

  private handleLeaveThread(userId: string, payload: any): void {
    const { threadId } = payload;
    if (!threadId) {
      return;
    }

    // Notify other thread participants
    const leaveMessage: WebSocketMessage = {
      type: 'user_left_thread',
      payload: {
        threadId,
        userId,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    this.broadcast(leaveMessage, userId);
  }

  private setupMessagingServiceListeners(): void {
    // Listen to messaging service events and broadcast to relevant users
    messagingService.on('message_sent', (event: WebSocketEvent) => {
      const message = event.data;
      this.sendToUser(message.recipientId, {
        type: 'new_message',
        payload: message,
        timestamp: Date.now()
      });
    });

    messagingService.on('message_delivered', (event: WebSocketEvent) => {
      const message = event.data;
      this.sendToUser(message.senderId, {
        type: 'message_delivered',
        payload: { messageId: message.id, deliveredAt: message.deliveredAt },
        timestamp: Date.now()
      });
    });

    messagingService.on('message_read', (event: WebSocketEvent) => {
      const message = event.data;
      this.sendToUser(message.senderId, {
        type: 'message_read',
        payload: { messageId: message.id, readAt: message.readAt },
        timestamp: Date.now()
      });
    });

    messagingService.on('notification_received', (event: WebSocketEvent) => {
      const notification = event.data;
      this.sendToUser(notification.userId, {
        type: 'new_notification',
        payload: notification,
        timestamp: Date.now()
      });
    });

    messagingService.on('user_typing', (event: WebSocketEvent) => {
      const { threadId, userId, isTyping } = event.data;
      this.broadcast({
        type: isTyping ? 'user_typing_start' : 'user_typing_stop',
        payload: { threadId, userId },
        timestamp: Date.now()
      }, userId);
    });

    messagingService.on('user_online', (event: WebSocketEvent) => {
      const presence = event.data;
      this.broadcast({
        type: 'user_presence_changed',
        payload: presence,
        timestamp: Date.now()
      }, presence.userId);
    });

    messagingService.on('user_offline', (event: WebSocketEvent) => {
      const presence = event.data;
      this.broadcast({
        type: 'user_presence_changed',
        payload: presence,
        timestamp: Date.now()
      }, presence.userId);
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 60000); // 1 minute
  }

  private cleanupStaleConnections(): void {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    this.connections.forEach((userConnections, userId) => {
      const activeConnections = userConnections.filter(connection => {
        const isStale = now - connection.lastActivity.getTime() > staleThreshold;
        const isOpen = connection.ws.readyState === WebSocket.OPEN;
        
        if (isStale || !isOpen) {
          if (isOpen) {
            connection.ws.terminate();
          }
          return false;
        }
        return true;
      });

      if (activeConnections.length !== userConnections.length) {
        if (activeConnections.length === 0) {
          this.connections.delete(userId);
          if (userId !== 'anonymous') {
            messagingService.updateUserPresence(userId, 'offline').catch(console.error);
          }
        } else {
          this.connections.set(userId, activeConnections);
        }
      }
    });
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;