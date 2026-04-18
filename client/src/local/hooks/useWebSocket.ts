/**
 * Enhanced WebSocket Hook
 *
 * Features: automatic reconnection, exponential back-off, heartbeat,
 * message queuing, failover endpoints, and connection metrics.
 *
 * Domain-specific hooks (messaging, property updates, notifications)
 * are included at the bottom of this file.
 */

import { useCallback, useMemo, useRef, useState } from 'react'

import { useEnhancedCleanupManager } from '../../infrastructure/hooks/useCleanupManager'
import { useSafeEffect } from '../../infrastructure/hooks/useSafeEffect'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebSocketMessage {
  type:       string;
  payload:    unknown;
  timestamp:  number;
  id?:        string;
}

export interface UseWebSocketOptions {
  url:                 string;
  protocols?:          string | string[];
  onOpen?:             (event: Event) => void;
  onClose?:            (event: CloseEvent) => void;
  onError?:            (event: Event) => void;
  onMessage?:          (message: WebSocketMessage) => void;
  shouldReconnect?:    boolean;
  reconnectAttempts?:  number;
  reconnectInterval?:  number;
  heartbeatInterval?:  number;
  heartbeatMessage?:   unknown;
  binaryType?:         BinaryType;
}

export interface ConnectionMetrics {
  totalConnections: number;
  totalMessages:    number;
  totalErrors:      number;
  avgLatency:       number;
  uptime:           number;
}

export interface UseWebSocketReturn {
  socket:              WebSocket | null;
  connectionStatus:    'Connecting' | 'Open' | 'Closing' | 'Closed';
  lastMessage:         WebSocketMessage | null;
  sendMessage:         (message: unknown, persistent?: boolean) => void;
  sendJsonMessage:     (object: unknown, persistent?: boolean) => void;
  disconnect:          () => void;
  reconnect:           () => void;
  isConnected:         boolean;
  connectionAttempts:  number;
  healthCheck:         () => void;
  messageReplay:       (lastN?: number) => unknown[];
  connectionPool:      WebSocket[];
  failoverEndpoints:   string[];
  connectionMetrics:   ConnectionMetrics;
  clearMessageQueue:   () => void;
  getQueueSize:        () => number;
}

// ---------------------------------------------------------------------------
// useWebSocket
// ---------------------------------------------------------------------------

export function useWebSocket({
  url,
  protocols,
  onOpen,
  onClose,
  onError,
  onMessage,
  shouldReconnect    = true,
  reconnectAttempts  = 5,
  reconnectInterval  = 3_000,
  heartbeatInterval  = 30_000,
  heartbeatMessage   = { type: 'ping' },
  binaryType         = 'blob',
}: UseWebSocketOptions): UseWebSocketReturn {
  const [socket,             setSocket]             = useState<WebSocket | null>(null);
  const [connectionStatus,   setConnectionStatus]   = useState<UseWebSocketReturn['connectionStatus']>('Closed');
  const [lastMessage,        setLastMessage]        = useState<WebSocketMessage | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  // Expose metrics that need to trigger re-renders as state
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    totalConnections: 0,
    totalMessages:    0,
    totalErrors:      0,
    avgLatency:       0,
    uptime:           0,
  });

  const messageQueueRef       = useRef<unknown[]>([]);
  const shouldReconnectRef    = useRef(shouldReconnect);
  const connectionStartRef    = useRef(Date.now());
  const lastPingTimeRef       = useRef(0);
  const latenciesRef          = useRef<number[]>([]);
  const connectionPoolRef     = useRef<WebSocket[]>([]);
  const cleanupManager        = useEnhancedCleanupManager();

  // Persistent message queue with automatic cap and retry accounting
  const persistentQueue = useMemo(() => {
    const map = new Map<string, { message: unknown; timestamp: number; attempts: number }>();
    const MAX = 1_000;
    return {
      add: (id: string, message: unknown) => {
        map.set(id, { message, timestamp: Date.now(), attempts: 0 });
        if (map.size > MAX) map.delete(map.keys().next().value!);
      },
      remove:           (id: string)  => map.delete(id),
      clear:            ()            => map.clear(),
      size:             ()            => map.size,
      getAll:           ()            => Array.from(map.entries()),
      incrementAttempts:(id: string)  => {
        const item = map.get(id);
        if (item && ++item.attempts > 3) map.delete(id);
      },
    };
  }, []);

  const failoverEndpoints = useMemo(() => {
    if (!url) return [];
    const proto = url.startsWith('wss:') ? 'wss' : 'ws';
    const base  = url.replace(/^wss?:\/\//, '');
    return [url, `${proto}://backup-1.${base}`, `${proto}://backup-2.${base}`];
  }, [url]);

  // Keep shouldReconnect ref in sync
  useSafeEffect(() => { shouldReconnectRef.current = shouldReconnect; }, [shouldReconnect]);

  const bumpErrors = useCallback(() => {
    setMetrics((m) => ({ ...m, totalErrors: m.totalErrors + 1 }));
  }, []);

  const bumpMessages = useCallback(() => {
    setMetrics((m) => ({ ...m, totalMessages: m.totalMessages + 1 }));
  }, []);

  const recordLatency = useCallback((ms: number) => {
    latenciesRef.current.push(ms);
    if (latenciesRef.current.length > 100)
      latenciesRef.current = latenciesRef.current.slice(-50);
    const avg = latenciesRef.current.reduce((a, b) => a + b, 0) / latenciesRef.current.length;
    setMetrics((m) => ({ ...m, avgLatency: avg }));
  }, []);

  const healthCheck = useCallback(() => {
    if (socket?.readyState !== WebSocket.OPEN) return;
    lastPingTimeRef.current = Date.now();
    socket.send(JSON.stringify({
      ...(heartbeatMessage as object),
      timestamp:    Date.now(),
      health:       true,
      connectionId: socket.url,
    }));
  }, [socket, heartbeatMessage]);

  const sendQueuedMessages = useCallback((ws: WebSocket) => {
    messageQueueRef.current.forEach((msg) => {
      ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
      bumpMessages();
    });
    messageQueueRef.current = [];

    persistentQueue.getAll().forEach(([id, item]) => {
      try {
        ws.send(typeof item.message === 'string' ? item.message as string : JSON.stringify(item.message));
        bumpMessages();
        persistentQueue.remove(id);
      } catch {
        persistentQueue.incrementAttempts(id);
        bumpErrors();
      }
    });
  }, [persistentQueue, bumpMessages, bumpErrors]);

  // Connect — forward-declared with useRef to allow self-referencing inside the callback
  const connectRef = useRef<(endpointIndex?: number) => void>(() => undefined);

  connectRef.current = (endpointIndex = 0) => {
    if (endpointIndex >= failoverEndpoints.length) {
      console.error('[WS] All endpoints exhausted');
      setConnectionStatus('Closed');
      return;
    }

    const endpoint = failoverEndpoints[endpointIndex];
    if (!endpoint) return;

    try {
      setConnectionStatus('Connecting');
      setMetrics((m) => ({ ...m, totalConnections: m.totalConnections + 1 }));

      const ws = new WebSocket(endpoint, protocols);
      ws.binaryType = binaryType;

      // Cap pool size at 5
      connectionPoolRef.current.push(ws);
      if (connectionPoolRef.current.length > 5) {
        const old = connectionPoolRef.current.shift();
        if (old?.readyState === WebSocket.OPEN) old.close();
      }

      ws.onopen = (event) => {
        setSocket(ws);
        setConnectionStatus('Open');
        setConnectionAttempts(0);
        connectionStartRef.current = Date.now();
        setMetrics((m) => ({ ...m, uptime: 0 }));

        if (heartbeatInterval > 0)
          cleanupManager.addInterval(() => healthCheck(), heartbeatInterval, 'ws-heartbeat');

        sendQueuedMessages(ws);
        onOpen?.(event);
      };

      ws.onclose = (event) => {
        setSocket(null);
        setConnectionStatus('Closed');
        cleanupManager.removeCleanup('ws-heartbeat');
        onClose?.(event);

        if (!shouldReconnectRef.current || event.wasClean) return;

        // Try next failover endpoint first
        if (endpointIndex < failoverEndpoints.length - 1) {
          connectRef.current(endpointIndex + 1);
          return;
        }

        // All endpoints failed — exponential back-off from primary
        setConnectionAttempts((prev) => {
          if (prev >= reconnectAttempts) return prev;
          const backoff = Math.min(reconnectInterval * 1.5 ** prev, 60_000);
          cleanupManager.addTimeout(() => connectRef.current(0), backoff, 'ws-reconnect');
          return prev + 1;
        });
      };

      ws.onerror = (event) => {
        setConnectionStatus('Closed');
        cleanupManager.removeCleanup('ws-heartbeat');
        bumpErrors();
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as Record<string, unknown>;

          if (data['type'] === 'pong' && lastPingTimeRef.current > 0)
            recordLatency(Date.now() - lastPingTimeRef.current);

          const msg: WebSocketMessage = {
            type:      String(data['type'] ?? 'message'),
            payload:   data['payload'] ?? data,
            timestamp: Date.now(),
            id:        data['id'] as string | undefined,
          };
          setLastMessage(msg);
          onMessage?.(msg);
        } catch {
          const msg: WebSocketMessage = { type: 'raw', payload: event.data, timestamp: Date.now() };
          setLastMessage(msg);
          onMessage?.(msg);
        }
      };

      setSocket(ws);
    } catch (err) {
      bumpErrors();
      console.error('[WS] Connection error:', err);
      if (endpointIndex < failoverEndpoints.length - 1)
        setTimeout(() => connectRef.current(endpointIndex + 1), 1_000);
    }
  };

  const connect = useCallback((idx = 0) => connectRef.current(idx), []);

  const sendMessage = useCallback((message: unknown, persistent = false) => {
    const raw = typeof message === 'string' ? message : JSON.stringify(message);
    if (socket?.readyState === WebSocket.OPEN) {
      try { socket.send(raw); bumpMessages(); }
      catch { bumpErrors(); queueMessage(message, persistent); }
    } else {
      queueMessage(message, persistent);
    }

    function queueMessage(msg: unknown, persist: boolean) {
      if (persist) {
        persistentQueue.add(`msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, msg);
      } else {
        messageQueueRef.current.push(msg);
      }
    }
  }, [socket, persistentQueue, bumpMessages, bumpErrors]);

  const sendJsonMessage = useCallback(
    (object: unknown, persistent = false) => sendMessage(object, persistent),
    [sendMessage],
  );

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    cleanupManager.removeCleanup('ws-reconnect');
    cleanupManager.removeCleanup('ws-heartbeat');
    if (socket) { setConnectionStatus('Closing'); socket.close(1000, 'Manual disconnect'); }
  }, [socket, cleanupManager]);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    setConnectionAttempts(0);
    setTimeout(() => connect(0), 100);
  }, [disconnect, connect]);

  const messageReplay  = useCallback((lastN = 100) =>
    persistentQueue.getAll().slice(-lastN).map(([, item]) => item.message), [persistentQueue]);
  const clearMessageQueue = useCallback(() => {
    messageQueueRef.current = [];
    persistentQueue.clear();
  }, [persistentQueue]);
  const getQueueSize = useCallback(() =>
    messageQueueRef.current.length + persistentQueue.size(), [persistentQueue]);

  // Track uptime while connected
  useSafeEffect(() => {
    if (connectionStatus !== 'Open') return;
    const id = setInterval(() => {
      setMetrics((m) => ({ ...m, uptime: Date.now() - connectionStartRef.current }));
    }, 1_000);
    return () => clearInterval(id);
  }, [connectionStatus]);

  // Initial connection + full cleanup on unmount
  useSafeEffect(() => {
    connect(0);
    return () => {
      shouldReconnectRef.current = false;
      cleanupManager.runAllCleanup();
      connectionPoolRef.current.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.close();
      });
      connectionPoolRef.current = [];
      socket?.close();
    };
  }, []); // eslint-disable-line

  return {
    socket,
    connectionStatus,
    lastMessage,
    sendMessage,
    sendJsonMessage,
    disconnect,
    reconnect,
    isConnected:       connectionStatus === 'Open',
    connectionAttempts,
    healthCheck,
    messageReplay,
    connectionPool:    connectionPoolRef.current,
    failoverEndpoints,
    connectionMetrics: metrics,
    clearMessageQueue,
    getQueueSize,
  };
}

// ---------------------------------------------------------------------------
// Domain-specific hooks
// ---------------------------------------------------------------------------

const WS_BASE = process.env.REACT_APP_WS_URL ?? 'ws://localhost:8080';

export function useMessagingWebSocket(userId: string) {
  const [messages,     setMessages]     = useState<unknown[]>([]);
  const [typingUsers,  setTypingUsers]  = useState<Set<string>>(new Set());

  const { sendJsonMessage, lastMessage, isConnected, ...rest } = useWebSocket({
    url: `${WS_BASE}/ws/messages`,
    onOpen: () => sendJsonMessage({ type: 'auth', payload: { userId, token: localStorage.getItem('authToken') } }),
    onMessage: (message) => {
      switch (message.type) {
        case 'message':      setMessages((prev) => [message.payload, ...prev]); break;
        case 'typing_start': setTypingUsers((prev) => new Set(prev).add((message.payload as Record<string, string>)['userId'])); break;
        case 'typing_stop':  setTypingUsers((prev) => { const s = new Set(prev); s.delete((message.payload as Record<string, string>)['userId']); return s; }); break;
        case 'message_read': setMessages((prev) => prev.map((m: unknown) => {
          const msg = m as Record<string, unknown>;
          return msg['id'] === (message.payload as Record<string, string>)['messageId'] ? { ...msg, isRead: true } : m;
        })); break;
      }
    },
  });

  const sendMessage  = useCallback((recipientId: string, content: string, threadId?: string) =>
    sendJsonMessage({ type: 'send_message', payload: { recipientId, content, threadId, timestamp: Date.now() } }),
  [sendJsonMessage]);
  const startTyping  = useCallback((recipientId: string) =>
    sendJsonMessage({ type: 'typing_start', payload: { recipientId } }), [sendJsonMessage]);
  const stopTyping   = useCallback((recipientId: string) =>
    sendJsonMessage({ type: 'typing_stop',  payload: { recipientId } }), [sendJsonMessage]);
  const markAsRead   = useCallback((messageId: string) =>
    sendJsonMessage({ type: 'mark_read',    payload: { messageId }  }), [sendJsonMessage]);

  return { ...rest, sendJsonMessage, lastMessage, isConnected, messages,
    typingUsers: Array.from(typingUsers), sendMessage, startTyping, stopTyping, markAsRead };
}

export function usePropertyUpdatesWebSocket() {
  const [propertyUpdates, setPropertyUpdates] = useState<unknown[]>([]);
  const [newListings,     setNewListings]     = useState<unknown[]>([]);

  const { sendJsonMessage, isConnected, ...rest } = useWebSocket({
    url: `${WS_BASE}/ws/properties`,
    onOpen:    () => sendJsonMessage({ type: 'subscribe', payload: { token: localStorage.getItem('authToken') } }),
    onMessage: (message) => {
      switch (message.type) {
        case 'property_updated':
        case 'price_change':
          setPropertyUpdates((prev) => [message.payload, ...prev.slice(0, 49)]); break;
        case 'new_listing':
          setNewListings((prev) => [message.payload, ...prev.slice(0, 19)]); break;
      }
    },
  });

  const subscribeToProperty   = useCallback((propertyId: string) =>
    sendJsonMessage({ type: 'subscribe_property',   payload: { propertyId } }), [sendJsonMessage]);
  const unsubscribeFromProperty = useCallback((propertyId: string) =>
    sendJsonMessage({ type: 'unsubscribe_property', payload: { propertyId } }), [sendJsonMessage]);

  return { ...rest, isConnected, propertyUpdates, newListings, subscribeToProperty, unsubscribeFromProperty };
}

export function useNotificationsWebSocket(userId: string) {
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const { sendJsonMessage, isConnected, ...rest } = useWebSocket({
    url: `${WS_BASE}/ws/notifications`,
    onOpen:    () => sendJsonMessage({ type: 'auth', payload: { userId, token: localStorage.getItem('authToken') } }),
    onMessage: (message) => {
      switch (message.type) {
        case 'notification':
          setNotifications((prev) => [message.payload, ...prev]);
          setUnreadCount((c) => c + 1);
          break;
        case 'notification_read':
          setNotifications((prev) => prev.map((n: unknown) => {
            const notification = n as Record<string, unknown>;
            return notification['id'] === (message.payload as Record<string, string>)['notificationId']
              ? { ...notification, isRead: true } : n;
          }));
          setUnreadCount((c) => Math.max(0, c - 1));
          break;
        case 'unread_count':
          setUnreadCount((message.payload as Record<string, number>)['count']);
          break;
      }
    },
  });

  const markAsRead    = useCallback((notificationId: string) =>
    sendJsonMessage({ type: 'mark_read',     payload: { notificationId } }), [sendJsonMessage]);
  const markAllAsRead = useCallback(() =>
    sendJsonMessage({ type: 'mark_all_read', payload: {} }), [sendJsonMessage]);

  return { ...rest, isConnected, notifications, unreadCount, markAsRead, markAllAsRead };
}