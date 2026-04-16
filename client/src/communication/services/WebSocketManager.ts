/**
 * WebSocket Manager for Communication Module
 * Manages WebSocket connections for messaging and notifications
 */

import { useMessagingWebSocket, useNotificationsWebSocket, usePropertyUpdatesWebSocket } from '../../local/hooks/useWebSocket'

export interface WebSocketManagerConfig {
  userId: string;
  authToken: string;
  baseUrl?: string;
}

export interface WebSocketConnectionStatus {
  messaging: boolean;
  notifications: boolean;
  propertyUpdates: boolean;
  overall: boolean;
}

/**
 * Hook to manage all communication WebSocket connections
 */
export function useWebSocketManager(config: WebSocketManagerConfig) {
  const { userId, authToken, baseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080' } = config;

  // Initialize WebSocket connections
  const messagingWS = useMessagingWebSocket(userId);
  const notificationsWS = useNotificationsWebSocket(userId);
  const propertyUpdatesWS = usePropertyUpdatesWebSocket();

  // Connection status
  const connectionStatus: WebSocketConnectionStatus = {
    messaging: messagingWS.isConnected,
    notifications: notificationsWS.isConnected,
    propertyUpdates: propertyUpdatesWS.isConnected,
    overall: messagingWS.isConnected && notificationsWS.isConnected && propertyUpdatesWS.isConnected
  };

  // Connection metrics
  const connectionMetrics = {
    messaging: messagingWS.connectionMetrics,
    notifications: notificationsWS.connectionMetrics,
    propertyUpdates: propertyUpdatesWS.connectionMetrics,
    totalConnections: messagingWS.connectionMetrics.totalConnections + 
                     notificationsWS.connectionMetrics.totalConnections + 
                     propertyUpdatesWS.connectionMetrics.totalConnections,
    totalMessages: messagingWS.connectionMetrics.totalMessages + 
                   notificationsWS.connectionMetrics.totalMessages + 
                   propertyUpdatesWS.connectionMetrics.totalMessages,
    totalErrors: messagingWS.connectionMetrics.totalErrors + 
                 notificationsWS.connectionMetrics.totalErrors + 
                 propertyUpdatesWS.connectionMetrics.totalErrors
  };

  // Health check all connections
  const healthCheckAll = () => {
    messagingWS.healthCheck();
    notificationsWS.healthCheck();
    propertyUpdatesWS.healthCheck();
  };

  // Reconnect all connections
  const reconnectAll = () => {
    messagingWS.reconnect();
    notificationsWS.reconnect();
    propertyUpdatesWS.reconnect();
  };

  // Disconnect all connections
  const disconnectAll = () => {
    messagingWS.disconnect();
    notificationsWS.disconnect();
    propertyUpdatesWS.disconnect();
  };

  return {
    // Individual connections
    messaging: messagingWS,
    notifications: notificationsWS,
    propertyUpdates: propertyUpdatesWS,
    
    // Overall status and metrics
    connectionStatus,
    connectionMetrics,
    
    // Management functions
    healthCheckAll,
    reconnectAll,
    disconnectAll,
    
    // Utility functions
    isFullyConnected: connectionStatus.overall,
    hasAnyConnection: connectionStatus.messaging || connectionStatus.notifications || connectionStatus.propertyUpdates
  };
}

/**
 * WebSocket Event Types for Communication Module
 */
export const WebSocketEvents = {
  // Messaging events
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_READ: 'message_read',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  THREAD_CREATED: 'thread_created',
  THREAD_UPDATED: 'thread_updated',
  
  // Notification events
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATION_DELETED: 'notification_deleted',
  
  // Property events
  PROPERTY_UPDATED: 'property_updated',
  PROPERTY_FAVORITED: 'property_favorited',
  PROPERTY_UNFAVORITED: 'property_unfavorited',
  NEW_LISTING: 'new_listing',
  PRICE_CHANGE: 'price_change',
  
  // System events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  CONNECTION_STATUS: 'connection_status',
  SYSTEM_MAINTENANCE: 'system_maintenance'
} as const;

export type WebSocketEventType = typeof WebSocketEvents[keyof typeof WebSocketEvents];

/**
 * WebSocket Message Interface
 */
export interface WebSocketMessage<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: number;
  id?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * WebSocket Error Handler
 */
export class WebSocketErrorHandler {
  private static instance: WebSocketErrorHandler;
  private errorCallbacks: Map<string, (error: Error) => void> = new Map();
  
  static getInstance(): WebSocketErrorHandler {
    if (!WebSocketErrorHandler.instance) {
      WebSocketErrorHandler.instance = new WebSocketErrorHandler();
    }
    return WebSocketErrorHandler.instance;
  }
  
  registerErrorCallback(id: string, callback: (error: Error) => void) {
    this.errorCallbacks.set(id, callback);
  }
  
  unregisterErrorCallback(id: string) {
    this.errorCallbacks.delete(id);
  }
  
  handleError(error: Error, context?: string) {
    console.error(`WebSocket Error${context ? ` (${context})` : ''}:`, error);
    
    // Notify all registered error handlers
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in WebSocket error callback:', callbackError);
      }
    });
    
    // Send error to monitoring service
    this.sendErrorToMonitoring(error, context);
  }
  
  private sendErrorToMonitoring(error: Error, context?: string) {
    // In a real application, send to monitoring service like Sentry
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { tags: { context } });
    }
  }
}

/**
 * WebSocket Connection Pool Manager
 */
export class WebSocketConnectionPool {
  private static instance: WebSocketConnectionPool;
  private connections: Map<string, WebSocket> = new Map();
  private maxConnections = 10;
  
  static getInstance(): WebSocketConnectionPool {
    if (!WebSocketConnectionPool.instance) {
      WebSocketConnectionPool.instance = new WebSocketConnectionPool();
    }
    return WebSocketConnectionPool.instance;
  }
  
  addConnection(id: string, connection: WebSocket) {
    // Remove oldest connection if at max capacity
    if (this.connections.size >= this.maxConnections) {
      const oldestId = this.connections.keys().next().value;
      if (oldestId) {
        this.removeConnection(oldestId);
      }
    }
    
    this.connections.set(id, connection);
  }
  
  removeConnection(id: string) {
    const connection = this.connections.get(id);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.close();
    }
    this.connections.delete(id);
  }
  
  getConnection(id: string): WebSocket | undefined {
    return this.connections.get(id);
  }
  
  getAllConnections(): WebSocket[] {
    return Array.from(this.connections.values());
  }
  
  closeAllConnections() {
    this.connections.forEach((connection, id) => {
      this.removeConnection(id);
    });
  }
  
  getConnectionCount(): number {
    return this.connections.size;
  }
  
  getHealthyConnectionCount(): number {
    return Array.from(this.connections.values())
      .filter(conn => conn.readyState === WebSocket.OPEN).length;
  }
}

/**
 * WebSocket Message Queue for offline support
 */
export class WebSocketMessageQueue {
  private static instance: WebSocketMessageQueue;
  private queue: Map<string, WebSocketMessage[]> = new Map();
  private maxQueueSize = 100;
  
  static getInstance(): WebSocketMessageQueue {
    if (!WebSocketMessageQueue.instance) {
      WebSocketMessageQueue.instance = new WebSocketMessageQueue();
    }
    return WebSocketMessageQueue.instance;
  }
  
  enqueue(connectionId: string, message: WebSocketMessage) {
    if (!this.queue.has(connectionId)) {
      this.queue.set(connectionId, []);
    }
    
    const messages = this.queue.get(connectionId)!;
    
    // Remove oldest messages if at max capacity
    if (messages.length >= this.maxQueueSize) {
      messages.shift();
    }
    
    messages.push(message);
  }
  
  dequeue(connectionId: string): WebSocketMessage | undefined {
    const messages = this.queue.get(connectionId);
    return messages?.shift();
  }
  
  dequeueAll(connectionId: string): WebSocketMessage[] {
    const messages = this.queue.get(connectionId) || [];
    this.queue.set(connectionId, []);
    return messages;
  }
  
  getQueueSize(connectionId: string): number {
    return this.queue.get(connectionId)?.length || 0;
  }
  
  clearQueue(connectionId: string) {
    this.queue.delete(connectionId);
  }
  
  clearAllQueues() {
    this.queue.clear();
  }
}