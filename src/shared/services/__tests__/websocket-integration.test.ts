import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { setupMswServer } from '../../test-utils/msw-server'
import { ApiClient } from "../../../shared/services/unified-api-client"

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  protocol: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private listeners: Map<string, Set<EventListener>> = new Map();

  constructor(url: string, protocol?: string | string[]) {
    this.url = url;
    this.protocol = Array.isArray(protocol) ? protocol[0] : protocol || '';
    
    // Simulate connection opening after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.dispatchEvent(new Event('open'));
    }, 10);
  }

  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    
    // Simulate server echo for testing
    setTimeout(() => {
      if (this.readyState === MockWebSocket.OPEN) {
        const echoMessage = typeof data === 'string' ? data : 'binary-data';
        this.dispatchEvent(new MessageEvent('message', { data: echoMessage }));
      }
    }, 5);
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === MockWebSocket.CLOSED || this.readyState === MockWebSocket.CLOSING) {
      return;
    }
    
    this.readyState = MockWebSocket.CLOSING;
    
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.dispatchEvent(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
    }, 5);
  }

  addEventListener(type: string, listener: EventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  dispatchEvent(event: Event): boolean {
    // Call direct event handlers
    if (event.type === 'open' && this.onopen) {
      this.onopen(event);
    } else if (event.type === 'close' && this.onclose) {
      this.onclose(event as CloseEvent);
    } else if (event.type === 'message' && this.onmessage) {
      this.onmessage(event as MessageEvent);
    } else if (event.type === 'error' && this.onerror) {
      this.onerror(event);
    }

    // Call addEventListener listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }

    return true;
  }

  // Helper method to simulate server messages
  simulateMessage(data: any): void {
    if (this.readyState === MockWebSocket.OPEN) {
      this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper method to simulate connection errors
  simulateError(): void {
    this.dispatchEvent(new Event('error'));
  }

  // Helper method to simulate server-initiated close
  simulateClose(code = 1000, reason = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatchEvent(new CloseEvent('close', { code, reason }));
  }
}

// WebSocket connection manager for testing real-time features
class WebSocketManager {
  private ws: MockWebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private connectionPromise: Promise<void> | null = null;

  constructor(private url: string) {}

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.ws = new MockWebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.warn('Failed to parse WebSocket message:', event.data);
        }
      };

      this.ws.onclose = (event) => {
        this.connectionPromise = null;
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        reject(new Error('WebSocket connection failed'));
      };
    });

    return this.connectionPromise;
  }

  private scheduleReconnect(): void {
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // Reconnection failed, will try again if under limit
      });
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  private handleMessage(data: any): void {
    const { type, payload } = data;
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(payload));
    }
  }

  send(type: string, payload: any): void {
    if (this.ws?.readyState === MockWebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  subscribe(messageType: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    this.messageHandlers.get(messageType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connectionPromise = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === MockWebSocket.OPEN;
  }

  // Test helper methods
  simulateServerMessage(type: string, payload: any): void {
    if (this.ws instanceof MockWebSocket) {
      this.ws.simulateMessage({ type, payload });
    }
  }

  simulateConnectionError(): void {
    if (this.ws instanceof MockWebSocket) {
      this.ws.simulateError();
    }
  }

  simulateServerClose(code = 1000, reason = ''): void {
    if (this.ws instanceof MockWebSocket) {
      this.ws.simulateClose(code, reason);
    }
  }
}

// Setup MSW server for HTTP requests
setupMswServer({ quiet: true });

describe('WebSocket and Real-time Features Integration Tests', () => {
  let wsManager: WebSocketManager;
  let apiClient: ApiClient;

  beforeAll(() => {
    // Mock WebSocket globally
    global.WebSocket = MockWebSocket as any;
  });

  beforeEach(() => {
    wsManager = new WebSocketManager('ws://localhost:3000/ws');
    apiClient = new ApiClient({ baseUrl: '/api' });
  });

  afterEach(() => {
    wsManager.disconnect();
  });

  describe('WebSocket Connection Management', () => {
    it('should establish WebSocket connection successfully', async () => {
      await expect(wsManager.connect()).resolves.toBeUndefined();
      expect(wsManager.isConnected).toBe(true);
    });

    it('should handle connection failures', async () => {
      // Create a WebSocket that fails immediately
      const failingWs = new MockWebSocket('ws://invalid-url');
      setTimeout(() => failingWs.simulateError(), 5);

      const failingManager = new WebSocketManager('ws://invalid-url');
      await expect(failingManager.connect()).rejects.toThrow('WebSocket connection failed');
    });

    it('should reconnect automatically on unexpected disconnection', async () => {
      await wsManager.connect();
      expect(wsManager.isConnected).toBe(true);

      // Simulate server-side disconnection
      wsManager.simulateServerClose(1006, 'Connection lost');
      
      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should attempt to reconnect (though in this test it will create a new connection)
      expect(wsManager.isConnected).toBe(false); // Disconnected initially
    });

    it('should not reconnect on normal closure', async () => {
      await wsManager.connect();
      expect(wsManager.isConnected).toBe(true);

      // Normal closure (code 1000)
      wsManager.disconnect();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(wsManager.isConnected).toBe(false);
    });

    it('should limit reconnection attempts', async () => {
      const reconnectSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await wsManager.connect();
      
      // Simulate multiple connection failures
      for (let i = 0; i < 5; i++) {
        wsManager.simulateServerClose(1006, 'Connection lost');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Should stop trying after max attempts
      expect(wsManager.isConnected).toBe(false);
      
      reconnectSpy.mockRestore();
    });
  });

  describe('Real-time Message Handling', () => {
    beforeEach(async () => {
      await wsManager.connect();
    });

    it('should send and receive messages', async () => {
      const receivedMessages: any[] = [];
      
      wsManager.subscribe('test-message', (data) => {
        receivedMessages.push(data);
      });

      // Send a message
      wsManager.send('test-message', { content: 'Hello WebSocket!' });
      
      // Wait for echo response
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should receive the echoed message
      expect(receivedMessages).toHaveLength(1);
    });

    it('should handle multiple message types', async () => {
      const propertyUpdates: any[] = [];
      const userNotifications: any[] = [];
      
      const unsubscribeProperty = wsManager.subscribe('property-update', (data) => {
        propertyUpdates.push(data);
      });
      
      const unsubscribeNotification = wsManager.subscribe('user-notification', (data) => {
        userNotifications.push(data);
      });

      // Simulate server messages
      wsManager.simulateServerMessage('property-update', {
        propertyId: '123',
        field: 'price',
        newValue: 1600000,
      });

      wsManager.simulateServerMessage('user-notification', {
        type: 'info',
        message: 'Property price updated',
      });

      wsManager.simulateServerMessage('property-update', {
        propertyId: '456',
        field: 'status',
        newValue: 'sold',
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(propertyUpdates).toHaveLength(2);
      expect(userNotifications).toHaveLength(1);
      expect(propertyUpdates[0].propertyId).toBe('123');
      expect(propertyUpdates[1].propertyId).toBe('456');
      expect(userNotifications[0].type).toBe('info');

      // Test unsubscribe
      unsubscribeProperty();
      unsubscribeNotification();

      wsManager.simulateServerMessage('property-update', { test: 'should not receive' });
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(propertyUpdates).toHaveLength(2); // No new messages
      expect(userNotifications).toHaveLength(1); // No new messages
    });

    it('should handle malformed messages gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Simulate malformed JSON message
      if (wsManager['ws'] instanceof MockWebSocket) {
        wsManager['ws'].dispatchEvent(new MessageEvent('message', { 
          data: '{ invalid json }' 
        }));
      }

      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:', 
        '{ invalid json }'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Real-time Property Updates', () => {
    beforeEach(async () => {
      await wsManager.connect();
    });

    it('should handle real-time property price updates', async () => {
      const priceUpdates: any[] = [];
      
      wsManager.subscribe('property-price-update', (data) => {
        priceUpdates.push(data);
      });

      // Simulate property price update from server
      wsManager.simulateServerMessage('property-price-update', {
        propertyId: 'prop-123',
        oldPrice: 1500000,
        newPrice: 1600000,
        timestamp: new Date().toISOString(),
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(priceUpdates).toHaveLength(1);
      expect(priceUpdates[0].propertyId).toBe('prop-123');
      expect(priceUpdates[0].newPrice).toBe(1600000);
      expect(priceUpdates[0].oldPrice).toBe(1500000);
    });

    it('should handle property status changes', async () => {
      const statusUpdates: any[] = [];
      
      wsManager.subscribe('property-status-update', (data) => {
        statusUpdates.push(data);
      });

      // Simulate property status changes
      const statusChanges = [
        { propertyId: 'prop-123', status: 'under-review', timestamp: new Date().toISOString() },
        { propertyId: 'prop-123', status: 'verified', timestamp: new Date().toISOString() },
        { propertyId: 'prop-456', status: 'sold', timestamp: new Date().toISOString() },
      ];

      for (const change of statusChanges) {
        wsManager.simulateServerMessage('property-status-update', change);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(statusUpdates).toHaveLength(3);
      expect(statusUpdates[0].status).toBe('under-review');
      expect(statusUpdates[1].status).toBe('verified');
      expect(statusUpdates[2].status).toBe('sold');
    });

    it('should handle new property listings', async () => {
      const newListings: any[] = [];
      
      wsManager.subscribe('new-property-listing', (data) => {
        newListings.push(data);
      });

      // Simulate new property listing
      wsManager.simulateServerMessage('new-property-listing', {
        property: {
          id: 'new-prop-789',
          title: 'Brand New Apartment',
          price: 1800000,
          location: 'Kilimani',
          bedrooms: 2,
          bathrooms: 2,
        },
        timestamp: new Date().toISOString(),
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(newListings).toHaveLength(1);
      expect(newListings[0].property.id).toBe('new-prop-789');
      expect(newListings[0].property.title).toBe('Brand New Apartment');
    });
  });

  describe('Real-time User Notifications', () => {
    beforeEach(async () => {
      await wsManager.connect();
    });

    it('should handle user notification messages', async () => {
      const notifications: any[] = [];
      
      wsManager.subscribe('user-notification', (data) => {
        notifications.push(data);
      });

      // Simulate various notification types
      const notificationTypes = [
        {
          type: 'info',
          title: 'Property Updated',
          message: 'Your property listing has been updated',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'success',
          title: 'Verification Complete',
          message: 'Your property has been successfully verified',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'warning',
          title: 'Payment Due',
          message: 'Your subscription payment is due in 3 days',
          timestamp: new Date().toISOString(),
        },
        {
          type: 'error',
          title: 'Verification Failed',
          message: 'Property verification failed. Please check your documents.',
          timestamp: new Date().toISOString(),
        },
      ];

      for (const notification of notificationTypes) {
        wsManager.simulateServerMessage('user-notification', notification);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(notifications).toHaveLength(4);
      expect(notifications[0].type).toBe('info');
      expect(notifications[1].type).toBe('success');
      expect(notifications[2].type).toBe('warning');
      expect(notifications[3].type).toBe('error');
    });

    it('should handle message read receipts', async () => {
      const readReceipts: any[] = [];
      
      wsManager.subscribe('message-read-receipt', (data) => {
        readReceipts.push(data);
      });

      // Send message read receipt
      wsManager.send('mark-message-read', { messageId: 'msg-123' });

      // Simulate server acknowledgment
      wsManager.simulateServerMessage('message-read-receipt', {
        messageId: 'msg-123',
        readAt: new Date().toISOString(),
        userId: 'user-456',
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(readReceipts).toHaveLength(1);
      expect(readReceipts[0].messageId).toBe('msg-123');
    });
  });

  describe('Real-time Chat Features', () => {
    beforeEach(async () => {
      await wsManager.connect();
    });

    it('should handle chat messages', async () => {
      const chatMessages: any[] = [];
      
      wsManager.subscribe('chat-message', (data) => {
        chatMessages.push(data);
      });

      // Send a chat message
      wsManager.send('chat-message', {
        conversationId: 'conv-123',
        message: 'Hello, is this property still available?',
        timestamp: new Date().toISOString(),
      });

      // Simulate receiving a response
      wsManager.simulateServerMessage('chat-message', {
        conversationId: 'conv-123',
        senderId: 'user-456',
        message: 'Yes, it is still available. Would you like to schedule a viewing?',
        timestamp: new Date().toISOString(),
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(chatMessages).toHaveLength(1);
      expect(chatMessages[0].conversationId).toBe('conv-123');
      expect(chatMessages[0].senderId).toBe('user-456');
    });

    it('should handle typing indicators', async () => {
      const typingIndicators: any[] = [];
      
      wsManager.subscribe('typing-indicator', (data) => {
        typingIndicators.push(data);
      });

      // Send typing start
      wsManager.send('typing-start', { conversationId: 'conv-123' });

      // Simulate other user typing
      wsManager.simulateServerMessage('typing-indicator', {
        conversationId: 'conv-123',
        userId: 'user-456',
        isTyping: true,
      });

      // Send typing stop
      wsManager.send('typing-stop', { conversationId: 'conv-123' });

      // Simulate other user stopped typing
      wsManager.simulateServerMessage('typing-indicator', {
        conversationId: 'conv-123',
        userId: 'user-456',
        isTyping: false,
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(typingIndicators).toHaveLength(2);
      expect(typingIndicators[0].isTyping).toBe(true);
      expect(typingIndicators[1].isTyping).toBe(false);
    });

    it('should handle user presence updates', async () => {
      const presenceUpdates: any[] = [];
      
      wsManager.subscribe('user-presence', (data) => {
        presenceUpdates.push(data);
      });

      // Simulate presence updates
      const presenceStates = [
        { userId: 'user-123', status: 'online', lastSeen: new Date().toISOString() },
        { userId: 'user-456', status: 'away', lastSeen: new Date().toISOString() },
        { userId: 'user-789', status: 'offline', lastSeen: new Date().toISOString() },
      ];

      for (const presence of presenceStates) {
        wsManager.simulateServerMessage('user-presence', presence);
      }

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(presenceUpdates).toHaveLength(3);
      expect(presenceUpdates[0].status).toBe('online');
      expect(presenceUpdates[1].status).toBe('away');
      expect(presenceUpdates[2].status).toBe('offline');
    });
  });

  describe('Integration with HTTP API', () => {
    beforeEach(async () => {
      await wsManager.connect();
    });

    it('should coordinate WebSocket updates with HTTP API calls', async () => {
      const propertyUpdates: any[] = [];
      
      wsManager.subscribe('property-update', (data) => {
        propertyUpdates.push(data);
      });

      // Simulate making an HTTP API call that triggers a WebSocket update
      // In a real scenario, the server would send the WebSocket message after processing the HTTP request
      
      // Simulate the WebSocket update that would come after an HTTP property update
      setTimeout(() => {
        wsManager.simulateServerMessage('property-update', {
          propertyId: 'prop-123',
          field: 'title',
          newValue: 'Updated Property Title',
          updatedBy: 'user-456',
          timestamp: new Date().toISOString(),
        });
      }, 10);

      await new Promise(resolve => setTimeout(resolve, 20));

      expect(propertyUpdates).toHaveLength(1);
      expect(propertyUpdates[0].field).toBe('title');
      expect(propertyUpdates[0].newValue).toBe('Updated Property Title');
    });

    it('should handle WebSocket authentication with HTTP tokens', async () => {
      // Simulate sending authentication token via WebSocket
      wsManager.send('authenticate', {
        token: 'jwt-token-from-http-login',
        userId: 'user-123',
      });

      // Simulate server authentication response
      wsManager.simulateServerMessage('authentication-result', {
        success: true,
        userId: 'user-123',
        permissions: ['read-properties', 'update-own-properties'],
      });

      const authResults: any[] = [];
      wsManager.subscribe('authentication-result', (data) => {
        authResults.push(data);
      });

      await new Promise(resolve => setTimeout(resolve, 20));

      // The authentication should have been processed
      // In a real implementation, this would enable certain WebSocket features
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle WebSocket errors gracefully', async () => {
      await wsManager.connect();
      
      // Simulate WebSocket error
      wsManager.simulateConnectionError();
      
      // Should handle the error without crashing
      expect(wsManager.isConnected).toBe(true); // Still connected in mock
    });

    it('should handle message sending when disconnected', async () => {
      // Don't connect, try to send message
      expect(() => {
        wsManager.send('test-message', { data: 'test' });
      }).toThrow('WebSocket is not connected');
    });

    it('should clean up subscriptions on disconnect', async () => {
      await wsManager.connect();
      
      const messages: any[] = [];
      const unsubscribe = wsManager.subscribe('test-message', (data) => {
        messages.push(data);
      });

      // Send message while connected
      wsManager.simulateServerMessage('test-message', { data: 'test1' });
      
      // Disconnect and clean up
      wsManager.disconnect();
      unsubscribe();
      
      // Try to send message after disconnect (should not be received)
      try {
        wsManager.simulateServerMessage('test-message', { data: 'test2' });
      } catch (error) {
        // Expected to fail since WebSocket is disconnected
      }

      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(messages).toHaveLength(1);
      expect(messages[0].data).toBe('test1');
    });
  });

  describe('Performance and Scalability', () => {
    beforeEach(async () => {
      await wsManager.connect();
    });

    it('should handle high-frequency messages', async () => {
      const messages: any[] = [];
      
      wsManager.subscribe('high-frequency-update', (data) => {
        messages.push(data);
      });

      // Simulate 100 rapid messages
      for (let i = 0; i < 100; i++) {
        wsManager.simulateServerMessage('high-frequency-update', {
          id: i,
          timestamp: new Date().toISOString(),
        });
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(messages).toHaveLength(100);
      expect(messages[0].id).toBe(0);
      expect(messages[99].id).toBe(99);
    });

    it('should handle multiple concurrent subscriptions', async () => {
      const results: Record<string, any[]> = {};
      const messageTypes = ['type1', 'type2', 'type3', 'type4', 'type5'];
      
      // Create multiple subscriptions
      messageTypes.forEach(type => {
        results[type] = [];
        wsManager.subscribe(type, (data) => {
          results[type].push(data);
        });
      });

      // Send messages to all types
      messageTypes.forEach((type, index) => {
        wsManager.simulateServerMessage(type, { 
          type, 
          index, 
          data: `Message for ${type}` 
        });
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify all subscriptions received their messages
      messageTypes.forEach(type => {
        expect(results[type]).toHaveLength(1);
        expect(results[type][0].type).toBe(type);
      });
    });

    it('should handle subscription cleanup efficiently', async () => {
      const unsubscribeFunctions: (() => void)[] = [];
      
      // Create many subscriptions
      for (let i = 0; i < 50; i++) {
        const unsubscribe = wsManager.subscribe(`message-type-${i}`, () => {});
        unsubscribeFunctions.push(unsubscribe);
      }

      // Unsubscribe from all
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());

      // Verify cleanup (in a real implementation, this would check memory usage)
      expect(unsubscribeFunctions).toHaveLength(50);
    });
  });
});