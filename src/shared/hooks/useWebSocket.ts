import { useCallback, useRef, useState, useMemo } from 'react';

import { useEnhancedCleanupManager } from '../../infrastructure/hooks/useCleanupManager';
import { useSafeEffect } from '../../infrastructure/hooks/useSafeEffect';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

interface UseWebSocketOptions {
  url: string;
  protocols?: string | string[];
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  shouldReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: any;
  binaryType?: BinaryType;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  connectionStatus: 'Connecting' | 'Open' | 'Closing' | 'Closed';
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  sendJsonMessage: (object: any) => void;
  disconnect: () => void;
  reconnect: () => void;
  isConnected: boolean;
  connectionAttempts: number;
  // Enterprise features
  healthCheck: () => void;
  messageReplay: (lastN?: number) => any[];
  connectionPool: WebSocket[];
  failoverEndpoints: string[];
  connectionMetrics: {
    totalConnections: number;
    totalMessages: number;
    totalErrors: number;
    avgLatency: number;
    uptime: number;
  };
  clearMessageQueue: () => void;
  getQueueSize: () => number;
}

/**
 * Enhanced WebSocket hook with automatic reconnection, heartbeat, and message queuing
 * Critical for real-time messaging, property updates, and live notifications
 */
export function useWebSocket({
  url,
  protocols,
  onOpen,
  onClose,
  onError,
  onMessage,
  shouldReconnect = true,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  heartbeatInterval = 30000,
  heartbeatMessage = { type: 'ping' },
  binaryType = 'blob',
}: UseWebSocketOptions): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Open' | 'Closing' | 'Closed'>('Closed');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const messageQueueRef = useRef<any[]>([]);
  const shouldReconnectRef = useRef(shouldReconnect);
  const urlRef = useRef(url);
  const cleanupManager = useEnhancedCleanupManager();

  // Enterprise connection pool
  const connectionPool = useRef<WebSocket[]>([]);
  
  // Enterprise metrics
  const metrics = useRef({
    totalConnections: 0,
    totalMessages: 0,
    totalErrors: 0,
    latencies: [] as number[],
    connectionStartTime: Date.now(),
    lastPingTime: 0,
  });

  // Enterprise message queue with persistence
  const persistentQueue = useMemo(() => {
    const queue = new Map<string, { message: any; timestamp: number; attempts: number }>();
    return {
      add: (id: string, message: any) => {
        queue.set(id, { message, timestamp: Date.now(), attempts: 0 });
        // Limit queue size to prevent memory leaks
        if (queue.size > 1000) {
          const oldestKey = Array.from(queue.keys())[0];
          if (oldestKey) {
            queue.delete(oldestKey);
          }
        }
      },
      remove: (id: string) => queue.delete(id),
      clear: () => queue.clear(),
      size: () => queue.size,
      getAll: () => Array.from(queue.entries()),
      incrementAttempts: (id: string) => {
        const item = queue.get(id);
        if (item) {
          item.attempts++;
          if (item.attempts > 3) {
            queue.delete(id); // Remove after 3 failed attempts
          }
        }
      },
    };
  }, []);

  // Enterprise failover endpoints
  const failoverEndpoints = useMemo(() => {
    if (!url) return [];
    
    const baseUrl = url.replace(/^(ws|wss):\/\//, '');
    const protocol = url.startsWith('wss:') ? 'wss' : 'ws';
    
    return [
      url, // Primary endpoint
      `${protocol}://backup-1.${baseUrl}`,
      `${protocol}://backup-2.${baseUrl}`,
      `${protocol}://fallback.${baseUrl}`,
    ];
  }, [url]);

  // Update refs when props change
  useSafeEffect(() => {
    shouldReconnectRef.current = shouldReconnect;
    urlRef.current = url;
  }, [shouldReconnect, url]);

  // Enterprise health monitoring
  const healthCheck = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      metrics.current.lastPingTime = Date.now();
      const healthMessage = {
        ...heartbeatMessage,
        timestamp: Date.now(),
        health: true,
        connectionId: socket.url,
      };
      socket.send(JSON.stringify(healthMessage));
    }
  }, [socket, heartbeatMessage]);

  // Heartbeat function with health monitoring
  const sendHeartbeat = useCallback(() => {
    healthCheck();
  }, [healthCheck]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval > 0) {
      cleanupManager.addInterval(sendHeartbeat, heartbeatInterval, 'websocket-heartbeat');
    }
  }, [sendHeartbeat, heartbeatInterval, cleanupManager]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    cleanupManager.removeCleanup('websocket-heartbeat');
  }, [cleanupManager]);

  // Enhanced message queue processing with retry logic
  const sendQueuedMessages = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Send regular queue
      if (messageQueueRef.current.length > 0) {
        messageQueueRef.current.forEach(message => {
          socket.send(message);
          metrics.current.totalMessages++;
        });
        messageQueueRef.current = [];
      }

      // Send persistent queue with retry logic
      const queuedItems = persistentQueue.getAll();
      queuedItems.forEach(([id, item]) => {
        try {
          socket.send(typeof item.message === 'string' ? item.message : JSON.stringify(item.message));
          metrics.current.totalMessages++;
          persistentQueue.remove(id);
        } catch (error) {
          persistentQueue.incrementAttempts(id);
          metrics.current.totalErrors++;
        }
      });
    }
  }, [socket, persistentQueue]);

  // Enhanced connect function with failover
  const connect = useCallback((endpointIndex: number = 0) => {
    if (endpointIndex >= failoverEndpoints.length) {
      console.error('All WebSocket endpoints failed');
      setConnectionStatus('Closed');
      return;
    }

    try {
      setConnectionStatus('Connecting');
      metrics.current.totalConnections++;
      
      const currentUrl = failoverEndpoints[endpointIndex];
      if (!currentUrl) {
        throw new Error('No valid endpoint available');
      }
      const ws = new WebSocket(currentUrl, protocols);
      ws.binaryType = binaryType;

      // Add to connection pool
      connectionPool.current.push(ws);
      if (connectionPool.current.length > 5) {
        // Clean up old connections
        const oldWs = connectionPool.current.shift();
        if (oldWs && oldWs.readyState === WebSocket.OPEN) {
          oldWs.close();
        }
      }

      ws.onopen = (event) => {
        setSocket(ws);
        setConnectionStatus('Open');
        setConnectionAttempts(0);
        metrics.current.connectionStartTime = Date.now();
        startHeartbeat();
        sendQueuedMessages();
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setSocket(null);
        setConnectionStatus('Closed');
        stopHeartbeat();
        onClose?.(event);

        // Try failover endpoints first, then reconnect
        if (shouldReconnectRef.current && !event.wasClean) {
          if (endpointIndex < failoverEndpoints.length - 1) {
            // Try next endpoint immediately
            connect(endpointIndex + 1);
          } else if (connectionAttempts < reconnectAttempts) {
            // All endpoints failed, use exponential backoff
            setConnectionAttempts(prev => prev + 1);
            const backoff = Math.min(reconnectInterval * Math.pow(1.5, connectionAttempts), 60000);
            cleanupManager.addTimeout(() => {
              connect(0); // Start from primary endpoint again
            }, backoff, 'websocket-reconnect');
          }
        }
      };

      ws.onerror = (event) => {
        setConnectionStatus('Closed');
        stopHeartbeat();
        metrics.current.totalErrors++;
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          // Calculate latency if this is a pong response
          const data = JSON.parse(event.data);
          if (data.type === 'pong' && metrics.current.lastPingTime > 0) {
            const latency = Date.now() - metrics.current.lastPingTime;
            metrics.current.latencies.push(latency);
            if (metrics.current.latencies.length > 100) {
              metrics.current.latencies = metrics.current.latencies.slice(-50);
            }
          }

          const message: WebSocketMessage = {
            type: data.type || 'message',
            payload: data.payload || data,
            timestamp: Date.now(),
            id: data.id,
          };
          
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          // Handle non-JSON messages
          const message: WebSocketMessage = {
            type: 'raw',
            payload: event.data,
            timestamp: Date.now(),
          };
          
          setLastMessage(message);
          onMessage?.(message);
        }
      };

      setSocket(ws);
    } catch (error) {
      setConnectionStatus('Closed');
      metrics.current.totalErrors++;
      console.error('WebSocket connection failed:', error);
      
      // Try next endpoint on connection error
      if (endpointIndex < failoverEndpoints.length - 1) {
        setTimeout(() => connect(endpointIndex + 1), 1000);
      }
    }
  }, [
    failoverEndpoints,
    protocols,
    binaryType,
    onOpen,
    onClose,
    onError,
    onMessage,
    startHeartbeat,
    stopHeartbeat,
    sendQueuedMessages,
    connectionAttempts,
    reconnectAttempts,
    reconnectInterval,
    cleanupManager,
  ]);

  // Enhanced send message function with persistence
  const sendMessage = useCallback((message: any, persistent: boolean = false) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(message);
        metrics.current.totalMessages++;
      } catch (error) {
        metrics.current.totalErrors++;
        if (persistent) {
          const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          persistentQueue.add(messageId, message);
        } else {
          messageQueueRef.current.push(message);
        }
      }
    } else {
      // Queue message for later sending
      if (persistent) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        persistentQueue.add(messageId, message);
      } else {
        messageQueueRef.current.push(message);
      }
    }
  }, [socket, persistentQueue]);

  // Enhanced send JSON message function
  const sendJsonMessage = useCallback((object: any, persistent: boolean = false) => {
    sendMessage(JSON.stringify(object), persistent);
  }, [sendMessage]);

  // Disconnect function
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    cleanupManager.removeCleanup('websocket-reconnect');
    
    stopHeartbeat();
    
    if (socket) {
      setConnectionStatus('Closing');
      socket.close(1000, 'Manual disconnect');
    }
  }, [socket, stopHeartbeat, cleanupManager]);

  // Enhanced reconnect function
  const enhancedReconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    setConnectionAttempts(0);
    setTimeout(() => connect(0), 100);
  }, [disconnect, connect]);

  // Enterprise message replay
  const messageReplay = useCallback((lastN: number = 100) => {
    return persistentQueue.getAll()
      .slice(-lastN)
      .map(([_, item]) => item.message);
  }, [persistentQueue]);

  // Enterprise utility functions
  const clearMessageQueue = useCallback(() => {
    messageQueueRef.current = [];
    persistentQueue.clear();
  }, [persistentQueue]);

  const getQueueSize = useCallback(() => {
    return messageQueueRef.current.length + persistentQueue.size();
  }, [persistentQueue]);

  // Calculate connection metrics
  const connectionMetrics = useMemo(() => {
    const avgLatency = metrics.current.latencies.length > 0 
      ? metrics.current.latencies.reduce((a, b) => a + b, 0) / metrics.current.latencies.length 
      : 0;
    
    const uptime = connectionStatus === 'Open' 
      ? Date.now() - metrics.current.connectionStartTime 
      : 0;

    return {
      totalConnections: metrics.current.totalConnections,
      totalMessages: metrics.current.totalMessages,
      totalErrors: metrics.current.totalErrors,
      avgLatency,
      uptime,
    };
  }, [connectionStatus, metrics.current]);

  // Initial connection
  useSafeEffect(() => {
    connect(0);
    
    return () => {
      shouldReconnectRef.current = false;
      cleanupManager.runAllCleanup();
      
      // Clean up all connections in pool
      connectionPool.current.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      connectionPool.current = [];
      
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Cleanup on unmount
  useSafeEffect(() => {
    return () => {
      cleanupManager.runAllCleanup();
    };
  }, [cleanupManager]);

  return {
    socket,
    connectionStatus,
    lastMessage,
    sendMessage,
    sendJsonMessage,
    disconnect,
    reconnect: enhancedReconnect,
    isConnected: connectionStatus === 'Open',
    connectionAttempts,
    // Enterprise features
    healthCheck,
    messageReplay,
    connectionPool: connectionPool.current,
    failoverEndpoints,
    connectionMetrics,
    clearMessageQueue,
    getQueueSize,
  };
}

/**
 * Real-time messaging WebSocket hook
 */
export function useMessagingWebSocket(userId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const { sendJsonMessage, lastMessage, isConnected, ...rest } = useWebSocket({
    url: `${process.env.REACT_APP_WS_URL || 'ws://localhost:8080'}/ws/messages`,
    onOpen: () => {
      // Authenticate the connection
      sendJsonMessage({
        type: 'auth',
        payload: {
          userId,
          token: localStorage.getItem('authToken'),
        },
      });
    },
    onMessage: (message) => {
      switch (message.type) {
        case 'message':
          setMessages(prev => [message.payload, ...prev]);
          break;
        case 'typing_start':
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(message.payload.userId);
            return newSet;
          });
          break;
        case 'typing_stop':
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(message.payload.userId);
            return newSet;
          });
          break;
        case 'message_read':
          setMessages(prev => 
            prev.map(msg => 
              msg.id === message.payload.messageId 
                ? { ...msg, isRead: true }
                : msg
            )
          );
          break;
      }
    },
  });

  const sendMessage = useCallback((recipientId: string, content: string, threadId?: string) => {
    sendJsonMessage({
      type: 'send_message',
      payload: {
        recipientId,
        content,
        threadId,
        timestamp: Date.now(),
      },
    });
  }, [sendJsonMessage]);

  const startTyping = useCallback((recipientId: string) => {
    sendJsonMessage({
      type: 'typing_start',
      payload: { recipientId },
    });
  }, [sendJsonMessage]);

  const stopTyping = useCallback((recipientId: string) => {
    sendJsonMessage({
      type: 'typing_stop',
      payload: { recipientId },
    });
  }, [sendJsonMessage]);

  const markAsRead = useCallback((messageId: string) => {
    sendJsonMessage({
      type: 'mark_read',
      payload: { messageId },
    });
  }, [sendJsonMessage]);

  return {
    ...rest,
    sendJsonMessage,
    lastMessage,
    isConnected,
    messages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
}

/**
 * Property updates WebSocket hook
 */
export function usePropertyUpdatesWebSocket() {
  const [propertyUpdates, setPropertyUpdates] = useState<any[]>([]);
  const [newListings, setNewListings] = useState<any[]>([]);

  const { sendJsonMessage, isConnected, ...rest } = useWebSocket({
    url: `${process.env.REACT_APP_WS_URL || 'ws://localhost:8080'}/ws/properties`,
    onOpen: () => {
      sendJsonMessage({
        type: 'subscribe',
        payload: {
          token: localStorage.getItem('authToken'),
        },
      });
    },
    onMessage: (message) => {
      switch (message.type) {
        case 'property_updated':
          setPropertyUpdates(prev => [message.payload, ...prev.slice(0, 49)]); // Keep last 50
          break;
        case 'new_listing':
          setNewListings(prev => [message.payload, ...prev.slice(0, 19)]); // Keep last 20
          break;
        case 'property_sold':
          // Handle property sold notifications
          break;
        case 'price_change':
          setPropertyUpdates(prev => [
            { ...message.payload, type: 'price_change' },
            ...prev.slice(0, 49)
          ]);
          break;
      }
    },
  });

  const subscribeToProperty = useCallback((propertyId: string) => {
    sendJsonMessage({
      type: 'subscribe_property',
      payload: { propertyId },
    });
  }, [sendJsonMessage]);

  const unsubscribeFromProperty = useCallback((propertyId: string) => {
    sendJsonMessage({
      type: 'unsubscribe_property',
      payload: { propertyId },
    });
  }, [sendJsonMessage]);

  return {
    ...rest,
    isConnected,
    propertyUpdates,
    newListings,
    subscribeToProperty,
    unsubscribeFromProperty,
  };
}

/**
 * Notifications WebSocket hook
 */
export function useNotificationsWebSocket(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { sendJsonMessage, isConnected, ...rest } = useWebSocket({
    url: `${process.env.REACT_APP_WS_URL || 'ws://localhost:8080'}/ws/notifications`,
    onOpen: () => {
      sendJsonMessage({
        type: 'auth',
        payload: {
          userId,
          token: localStorage.getItem('authToken'),
        },
      });
    },
    onMessage: (message) => {
      switch (message.type) {
        case 'notification':
          setNotifications(prev => [message.payload, ...prev]);
          setUnreadCount(prev => prev + 1);
          break;
        case 'notification_read':
          setNotifications(prev =>
            prev.map(notif =>
              notif.id === message.payload.notificationId
                ? { ...notif, isRead: true }
                : notif
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
          break;
        case 'unread_count':
          setUnreadCount(message.payload.count);
          break;
      }
    },
  });

  const markAsRead = useCallback((notificationId: string) => {
    sendJsonMessage({
      type: 'mark_read',
      payload: { notificationId },
    });
  }, [sendJsonMessage]);

  const markAllAsRead = useCallback(() => {
    sendJsonMessage({
      type: 'mark_all_read',
      payload: {},
    });
  }, [sendJsonMessage]);

  return {
    ...rest,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}