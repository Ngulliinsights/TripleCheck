/**
 * Communication Context
 * Provides WebSocket connections and communication state to the entire app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWebSocketManager, WebSocketConnectionStatus } from '../services/WebSocketManager';
import { useAuth } from '../../auth/hooks/useAuth';

interface CommunicationContextValue {
  // Connection status
  connectionStatus: WebSocketConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  
  // WebSocket connections
  messaging: ReturnType<typeof useWebSocketManager>['messaging'];
  notifications: ReturnType<typeof useWebSocketManager>['notifications'];
  propertyUpdates: ReturnType<typeof useWebSocketManager>['propertyUpdates'];
  
  // Connection management
  reconnectAll: () => void;
  disconnectAll: () => void;
  healthCheckAll: () => void;
  
  // Connection metrics
  connectionMetrics: ReturnType<typeof useWebSocketManager>['connectionMetrics'];
  
  // Error state
  connectionError: string | null;
  clearConnectionError: () => void;
}

const CommunicationContext = createContext<CommunicationContextValue | null>(null);

interface CommunicationProviderProps {
  children: ReactNode;
}

export const CommunicationProvider: React.FC<CommunicationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize WebSocket manager only when authenticated
  const webSocketManager = useWebSocketManager({
    userId: user?.id || '',
    authToken: localStorage.getItem('authToken') || '',
    baseUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:8080'
  });

  // Monitor connection status changes
  useEffect(() => {
    if (!isAuthenticated) {
      setIsConnecting(false);
      setConnectionError(null);
      return;
    }

    const wasConnecting = isConnecting;
    const isCurrentlyConnected = webSocketManager.isFullyConnected;
    
    if (wasConnecting && isCurrentlyConnected) {
      setIsConnecting(false);
      setConnectionError(null);
    } else if (!wasConnecting && !isCurrentlyConnected) {
      setIsConnecting(true);
    }
  }, [webSocketManager.isFullyConnected, isAuthenticated, isConnecting]);

  // Handle connection errors
  useEffect(() => {
    const errorHandler = (error: Error) => {
      setConnectionError(error.message);
      setIsConnecting(false);
    };

    // Register error handlers for each connection
    const messagingErrorHandler = (event: Event) => {
      errorHandler(new Error('Messaging connection failed'));
    };
    
    const notificationsErrorHandler = (event: Event) => {
      errorHandler(new Error('Notifications connection failed'));
    };
    
    const propertyUpdatesErrorHandler = (event: Event) => {
      errorHandler(new Error('Property updates connection failed'));
    };

    // Note: In a real implementation, you'd add these event listeners to the actual WebSocket instances
    // This is a simplified version for demonstration

    return () => {
      // Cleanup error handlers
    };
  }, []);

  // Auto-reconnect on authentication changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setIsConnecting(true);
      setConnectionError(null);
      
      // Small delay to ensure auth token is available
      const timer = setTimeout(() => {
        webSocketManager.reconnectAll();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      webSocketManager.disconnectAll();
      setIsConnecting(false);
    }
  }, [isAuthenticated, user?.id]);

  // Periodic health checks
  useEffect(() => {
    if (!isAuthenticated) return;

    const healthCheckInterval = setInterval(() => {
      if (webSocketManager.isFullyConnected) {
        webSocketManager.healthCheckAll();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [isAuthenticated, webSocketManager]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Reconnect when page becomes visible
        if (!webSocketManager.isFullyConnected) {
          webSocketManager.reconnectAll();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, webSocketManager]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated && !webSocketManager.isFullyConnected) {
        setIsConnecting(true);
        webSocketManager.reconnectAll();
      }
    };

    const handleOffline = () => {
      setConnectionError('You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, webSocketManager]);

  const clearConnectionError = () => {
    setConnectionError(null);
  };

  const contextValue: CommunicationContextValue = {
    connectionStatus: webSocketManager.connectionStatus,
    isConnected: webSocketManager.isFullyConnected,
    isConnecting,
    
    messaging: webSocketManager.messaging,
    notifications: webSocketManager.notifications,
    propertyUpdates: webSocketManager.propertyUpdates,
    
    reconnectAll: webSocketManager.reconnectAll,
    disconnectAll: webSocketManager.disconnectAll,
    healthCheckAll: webSocketManager.healthCheckAll,
    
    connectionMetrics: webSocketManager.connectionMetrics,
    
    connectionError,
    clearConnectionError
  };

  return (
    <CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>
  );
};

export const useCommunication = (): CommunicationContextValue => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};

/**
 * Hook to get connection status with automatic reconnection
 */
export const useConnectionStatus = () => {
  const { connectionStatus, isConnected, isConnecting, connectionError, reconnectAll } = useCommunication();
  
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Auto-retry connection on failure
  useEffect(() => {
    if (connectionError && retryCount < maxRetries) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
      
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        reconnectAll();
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [connectionError, retryCount, maxRetries, reconnectAll]);

  // Reset retry count on successful connection
  useEffect(() => {
    if (isConnected) {
      setRetryCount(0);
    }
  }, [isConnected]);

  return {
    connectionStatus,
    isConnected,
    isConnecting,
    connectionError,
    retryCount,
    maxRetries,
    canRetry: retryCount < maxRetries
  };
};

/**
 * Hook to monitor specific connection types
 */
export const useConnectionMonitor = (connectionType: keyof WebSocketConnectionStatus) => {
  const { connectionStatus, connectionMetrics } = useCommunication();
  
  return {
    isConnected: connectionStatus[connectionType],
    metrics: connectionMetrics[connectionType as keyof typeof connectionMetrics],
    status: connectionStatus[connectionType] ? 'connected' : 'disconnected'
  };
};