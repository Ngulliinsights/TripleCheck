/**
 * Socket.IO Real-time Communication Service
 * Replaces custom WebSocket service
 */

import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { instrument } from '@socket.io/admin-ui';
import * as jwt from 'jsonwebtoken';
import { legacyLogger as logger } from '../infrastructure/observability/telemetry';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export class SocketIOService {
  private io: Server | null = null;
  private redisClient?: any;
  private redisSub?: any;

  /**
   * Initialize Socket.IO server
   */
  async initialize(httpServer: any) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Setup Redis adapter for horizontal scaling
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = createClient({ url: process.env.REDIS_URL });
        this.redisSub = this.redisClient.duplicate();

        await Promise.all([
          this.redisClient.connect(),
          this.redisSub.connect(),
        ]);

        this.io.adapter(createAdapter(this.redisClient, this.redisSub));
        logger.info('Socket.IO Redis adapter initialized');
      } catch (error: any) {
        logger.error('Failed to initialize Redis adapter', {
          error: error.message,
        });
      }
    }

    // Setup admin UI in development
    if (process.env.NODE_ENV === 'development') {
      instrument(this.io, {
        auth: false,
        mode: 'development',
      });
      logger.info('Socket.IO Admin UI available at http://localhost:3000/admin');
    }

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key'
        ) as any;

        socket.userId = decoded.sub;
        socket.user = {
          id: decoded.sub,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
        };

        logger.debug('Socket authenticated', { userId: socket.userId });
        next();
      } catch (error: any) {
        logger.warn('Socket authentication failed', { error: error.message });
        next(new Error('Invalid authentication token'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket.IO service initialized');
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    logger.info('User connected', { userId, socketId: socket.id });

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      userId,
      socketId: socket.id,
      timestamp: Date.now(),
    });

    // Handle typing indicators
    socket.on('typing:start', ({ threadId }) => {
      logger.debug('User started typing', { userId, threadId });
      socket.to(`thread:${threadId}`).emit('user:typing', {
        userId,
        threadId,
        isTyping: true,
        timestamp: Date.now(),
      });
    });

    socket.on('typing:stop', ({ threadId }) => {
      logger.debug('User stopped typing', { userId, threadId });
      socket.to(`thread:${threadId}`).emit('user:typing', {
        userId,
        threadId,
        isTyping: false,
        timestamp: Date.now(),
      });
    });

    // Handle thread joining
    socket.on('thread:join', ({ threadId }) => {
      logger.debug('User joined thread', { userId, threadId });
      socket.join(`thread:${threadId}`);
      socket.to(`thread:${threadId}`).emit('user:joined', {
        userId,
        threadId,
        timestamp: Date.now(),
      });
    });

    socket.on('thread:leave', ({ threadId }) => {
      logger.debug('User left thread', { userId, threadId });
      socket.leave(`thread:${threadId}`);
      socket.to(`thread:${threadId}`).emit('user:left', {
        userId,
        threadId,
        timestamp: Date.now(),
      });
    });

    // Handle presence updates
    socket.on('presence:update', ({ status }) => {
      logger.debug('User presence updated', { userId, status });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('User disconnected', { userId, socketId: socket.id, reason });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', { userId, error: error.message });
    });
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any): boolean {
    if (!this.io) {
      logger.warn('Socket.IO not initialized');
      return false;
    }

    this.io.to(`user:${userId}`).emit(event, data);
    logger.debug('Message sent to user', { userId, event });
    return true;
  }

  /**
   * Send message to multiple users
   */
  sendToUsers(userIds: string[], event: string, data: any): number {
    let sentCount = 0;
    for (const userId of userIds) {
      if (this.sendToUser(userId, event, data)) {
        sentCount++;
      }
    }
    return sentCount;
  }

  /**
   * Send message to thread
   */
  sendToThread(threadId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.IO not initialized');
      return;
    }

    this.io.to(`thread:${threadId}`).emit(event, data);
    logger.debug('Message sent to thread', { threadId, event });
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: any, excludeUserId?: string): number {
    if (!this.io) {
      logger.warn('Socket.IO not initialized');
      return 0;
    }

    if (excludeUserId) {
      this.io.except(`user:${excludeUserId}`).emit(event, data);
    } else {
      this.io.emit(event, data);
    }

    logger.debug('Message broadcasted', { event, excludeUserId });
    return this.io.sockets.sockets.size;
  }

  /**
   * Get online users
   */
  async getOnlineUsers(): Promise<string[]> {
    if (!this.io) {
      return [];
    }

    const sockets = await this.io.fetchSockets();
    const userIds = new Set<string>();

    for (const socket of sockets) {
      const userId = (socket as any).userId;
      if (userId) {
        userIds.add(userId);
      }
    }

    return Array.from(userIds);
  }

  /**
   * Check if user is online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    if (!this.io) {
      return false;
    }

    const sockets = await this.io.in(`user:${userId}`).fetchSockets();
    return sockets.length > 0;
  }

  /**
   * Get connection statistics
   */
  async getStats() {
    if (!this.io) {
      return {
        totalConnections: 0,
        activeConnections: 0,
        onlineUsers: 0,
      };
    }

    const sockets = await this.io.fetchSockets();
    const onlineUsers = new Set<string>();

    for (const socket of sockets) {
      const userId = (socket as any).userId;
      if (userId) {
        onlineUsers.add(userId);
      }
    }

    return {
      totalConnections: sockets.length,
      activeConnections: sockets.length,
      onlineUsers: onlineUsers.size,
    };
  }

  /**
   * Shutdown Socket.IO service
   */
  async shutdown() {
    if (this.io) {
      this.io.close();
      this.io = null;
    }

    if (this.redisClient) {
      await this.redisClient.quit();
    }

    if (this.redisSub) {
      await this.redisSub.quit();
    }

    logger.info('Socket.IO service shut down');
  }
}

// Singleton instance
export const socketService = new SocketIOService();
export default socketService;
