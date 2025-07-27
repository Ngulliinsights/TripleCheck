import React from 'react';

// WebSocket client for real-time features
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  protocols?: string[];
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export type WebSocketStatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, WebSocketEventHandler[]> = new Map();
  private statusHandlers: WebSocketStatusHandler[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isManualClose = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  // Connect to WebSocket server
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManualClose = false;
        this.ws = new WebSocket(this.config.url, this.config.protocols);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.notifyStatusHandlers('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.stopHeartbeat();
          this.notifyStatusHandlers('disconnected');
          
          if (!this.isManualClose && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.notifyStatusHandlers('error');
          reject(error);
        };

        this.notifyStatusHandlers('connecting');
      } catch (error) {
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  // Send message to server
  public send(type: string, payload: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return false;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateMessageId(),
    };

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  // Subscribe to message type
  public on(messageType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(messageType)) {
      this.eventHandlers.set(messageType, []);
    }
    
    this.eventHandlers.get(messageType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // Subscribe to connection status changes
  public onStatusChange(handler: WebSocketStatusHandler): () => void {
    this.statusHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.statusHandlers.indexOf(handler);
      if (index > -1) {
        this.statusHandlers.splice(index, 1);
      }
    };
  }

  // Get current connection status
  public getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  private notifyStatusHandlers(status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in WebSocket status handler:', error);
      }
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('WebSocket reconnect failed:', error);
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Default WebSocket configuration
const defaultConfig: WebSocketConfig = {
  url: process.env.NODE_ENV === 'production' 
    ? 'wss://your-domain.com/ws' 
    : 'ws://localhost:3001/ws',
  reconnectInterval: 1000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000, // 30 seconds
};

// Singleton WebSocket client
export const webSocketClient = new WebSocketClient(defaultConfig);

// React hook for WebSocket
export function useWebSocket() {
  const [status, setStatus] = React.useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = webSocketClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === 'connected');
    });

    // Connect on mount
    webSocketClient.connect().catch(error => {
      console.error('Failed to connect WebSocket:', error);
    });

    return () => {
      unsubscribe();
      webSocketClient.disconnect();
    };
  }, []);

  const send = React.useCallback((type: string, payload: any) => {
    return webSocketClient.send(type, payload);
  }, []);

  const subscribe = React.useCallback((messageType: string, handler: WebSocketEventHandler) => {
    return webSocketClient.on(messageType, handler);
  }, []);

  return {
    status,
    isConnected,
    send,
    subscribe,
  };
}

// Hook for specific message types
export function useWebSocketMessage<T = any>(messageType: string) {
  const [lastMessage, setLastMessage] = React.useState<WebSocketMessage | null>(null);
  const [messages, setMessages] = React.useState<WebSocketMessage[]>([]);

  React.useEffect(() => {
    const unsubscribe = webSocketClient.on(messageType, (message) => {
      setLastMessage(message);
      setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
    });

    return unsubscribe;
  }, [messageType]);

  return {
    lastMessage,
    messages,
    payload: lastMessage?.payload as T,
  };
}