import { useCallback, useEffect, useRef, useState } from 'react';

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

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>();
  const messageQueueRef = useRef<any[]>([]);
  const shouldReconnectRef = useRef(shouldReconnect);
  const urlRef = useRef(url);

  // Update refs when props change
  useEffect(() => {
    shouldReconnectRef.current = shouldReconnect;
    urlRef.current = url;
  }, [shouldReconnect, url]);

  // Heartbeat function
  const sendHeartbeat = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(heartbeatMessage));
    }
  }, [socket, heartbeatMessage]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval > 0) {
      heartbeatTimeoutRef.current = setInterval(sendHeartbeat, heartbeatInterval);
    }
  }, [sendHeartbeat, heartbeatInterval]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearInterval(heartbeatTimeoutRef.current);
    }
  }, []);

  // Send queued messages
  const sendQueuedMessages = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN && messageQueueRef.current.length > 0) {
      messageQueueRef.current.forEach(message => {
        socket.send(message);
      });
      messageQueueRef.current = [];
    }
  }, [socket]);

  // Connect function
  const connect = useCallback(() => {
    try {
      setConnectionStatus('Connecting');
      
      const ws = new WebSocket(urlRef.current, protocols);
      ws.binaryType = binaryType;

      ws.onopen = (event) => {
        setSocket(ws);
        setConnectionStatus('Open');
        setConnectionAttempts(0);
        startHeartbeat();
        sendQueuedMessages();
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setSocket(null);
        setConnectionStatus('Closed');
        stopHeartbeat();
        onClose?.(event);

        // Attempt reconnection if enabled and not a clean close
        if (shouldReconnectRef.current && !event.wasClean && connectionAttempts < reconnectAttempts) {
          setConnectionAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (event) => {
        setConnectionStatus('Closed');
        stopHeartbeat();
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
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
      console.error('WebSocket connection failed:', error);
    }
  }, [
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
  ]);

  // Send message function
  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      // Queue message for later sending
      messageQueueRef.current.push(message);
    }
  }, [socket]);

  // Send JSON message function
  const sendJsonMessage = useCallback((object: any) => {
    sendMessage(JSON.stringify(object));
  }, [sendMessage]);

  // Disconnect function
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    stopHeartbeat();
    
    if (socket) {
      setConnectionStatus('Closing');
      socket.close(1000, 'Manual disconnect');
    }
  }, [socket, stopHeartbeat]);

  // Reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    setConnectionAttempts(0);
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  // Initial connection
  useEffect(() => {
    connect();
    
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
      if (socket) {
        socket.close();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    socket,
    connectionStatus,
    lastMessage,
    sendMessage,
    sendJsonMessage,
    disconnect,
    reconnect,
    isConnected: connectionStatus === 'Open',
    connectionAttempts,
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
          setTypingUsers(prev => new Set([...prev, message.payload.userId]));
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