"use strict";
/**
 * Communication Context
 * Provides WebSocket connections and communication state to the entire app
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConnectionMonitor = exports.useConnectionStatus = exports.useCommunication = exports.CommunicationProvider = void 0;
var react_1 = require("react");
var WebSocketManager_1 = require("../services/WebSocketManager");
var useAuth_1 = require("../../auth/hooks/useAuth");
var CommunicationContext = (0, react_1.createContext)(null);
var CommunicationProvider = function (_a) {
    var children = _a.children;
    var _b = (0, useAuth_1.useAuth)(), user = _b.user, isAuthenticated = _b.isAuthenticated;
    var _c = (0, react_1.useState)(false), isConnecting = _c[0], setIsConnecting = _c[1];
    var _d = (0, react_1.useState)(null), connectionError = _d[0], setConnectionError = _d[1];
    // Initialize WebSocket manager only when authenticated
    var webSocketManager = (0, WebSocketManager_1.useWebSocketManager)({
        userId: (user === null || user === void 0 ? void 0 : user.id) || '',
        authToken: localStorage.getItem('authToken') || '',
        baseUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:8080'
    });
    // Monitor connection status changes
    (0, react_1.useEffect)(function () {
        if (!isAuthenticated) {
            setIsConnecting(false);
            setConnectionError(null);
            return;
        }
        var wasConnecting = isConnecting;
        var isCurrentlyConnected = webSocketManager.isFullyConnected;
        if (wasConnecting && isCurrentlyConnected) {
            setIsConnecting(false);
            setConnectionError(null);
        }
        else if (!wasConnecting && !isCurrentlyConnected) {
            setIsConnecting(true);
        }
    }, [webSocketManager.isFullyConnected, isAuthenticated, isConnecting]);
    // Handle connection errors
    (0, react_1.useEffect)(function () {
        var errorHandler = function (error) {
            setConnectionError(error.message);
            setIsConnecting(false);
        };
        // Register error handlers for each connection
        var messagingErrorHandler = function (event) {
            errorHandler(new Error('Messaging connection failed'));
        };
        var notificationsErrorHandler = function (event) {
            errorHandler(new Error('Notifications connection failed'));
        };
        var propertyUpdatesErrorHandler = function (event) {
            errorHandler(new Error('Property updates connection failed'));
        };
        // Note: In a real implementation, you'd add these event listeners to the actual WebSocket instances
        // This is a simplified version for demonstration
        return function () {
            // Cleanup error handlers
        };
    }, []);
    // Auto-reconnect on authentication changes
    (0, react_1.useEffect)(function () {
        if (isAuthenticated && (user === null || user === void 0 ? void 0 : user.id)) {
            setIsConnecting(true);
            setConnectionError(null);
            // Small delay to ensure auth token is available
            var timer_1 = setTimeout(function () {
                webSocketManager.reconnectAll();
            }, 100);
            return function () { return clearTimeout(timer_1); };
        }
        else {
            webSocketManager.disconnectAll();
            setIsConnecting(false);
        }
    }, [isAuthenticated, user === null || user === void 0 ? void 0 : user.id]);
    // Periodic health checks
    (0, react_1.useEffect)(function () {
        if (!isAuthenticated)
            return;
        var healthCheckInterval = setInterval(function () {
            if (webSocketManager.isFullyConnected) {
                webSocketManager.healthCheckAll();
            }
        }, 30000); // Every 30 seconds
        return function () { return clearInterval(healthCheckInterval); };
    }, [isAuthenticated, webSocketManager]);
    // Handle page visibility changes
    (0, react_1.useEffect)(function () {
        var handleVisibilityChange = function () {
            if (document.visibilityState === 'visible' && isAuthenticated) {
                // Reconnect when page becomes visible
                if (!webSocketManager.isFullyConnected) {
                    webSocketManager.reconnectAll();
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return function () { return document.removeEventListener('visibilitychange', handleVisibilityChange); };
    }, [isAuthenticated, webSocketManager]);
    // Handle online/offline events
    (0, react_1.useEffect)(function () {
        var handleOnline = function () {
            if (isAuthenticated && !webSocketManager.isFullyConnected) {
                setIsConnecting(true);
                webSocketManager.reconnectAll();
            }
        };
        var handleOffline = function () {
            setConnectionError('You are offline');
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return function () {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isAuthenticated, webSocketManager]);
    var clearConnectionError = function () {
        setConnectionError(null);
    };
    var contextValue = {
        connectionStatus: webSocketManager.connectionStatus,
        isConnected: webSocketManager.isFullyConnected,
        isConnecting: isConnecting,
        messaging: webSocketManager.messaging,
        notifications: webSocketManager.notifications,
        propertyUpdates: webSocketManager.propertyUpdates,
        reconnectAll: webSocketManager.reconnectAll,
        disconnectAll: webSocketManager.disconnectAll,
        healthCheckAll: webSocketManager.healthCheckAll,
        connectionMetrics: webSocketManager.connectionMetrics,
        connectionError: connectionError,
        clearConnectionError: clearConnectionError
    };
    return (<CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>);
};
exports.CommunicationProvider = CommunicationProvider;
var useCommunication = function () {
    var context = (0, react_1.useContext)(CommunicationContext);
    if (!context) {
        throw new Error('useCommunication must be used within a CommunicationProvider');
    }
    return context;
};
exports.useCommunication = useCommunication;
/**
 * Hook to get connection status with automatic reconnection
 */
var useConnectionStatus = function () {
    var _a = (0, exports.useCommunication)(), connectionStatus = _a.connectionStatus, isConnected = _a.isConnected, isConnecting = _a.isConnecting, connectionError = _a.connectionError, reconnectAll = _a.reconnectAll;
    var _b = (0, react_1.useState)(0), retryCount = _b[0], setRetryCount = _b[1];
    var maxRetries = 3;
    // Auto-retry connection on failure
    (0, react_1.useEffect)(function () {
        if (connectionError && retryCount < maxRetries) {
            var retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
            var timer_2 = setTimeout(function () {
                setRetryCount(function (prev) { return prev + 1; });
                reconnectAll();
            }, retryDelay);
            return function () { return clearTimeout(timer_2); };
        }
    }, [connectionError, retryCount, maxRetries, reconnectAll]);
    // Reset retry count on successful connection
    (0, react_1.useEffect)(function () {
        if (isConnected) {
            setRetryCount(0);
        }
    }, [isConnected]);
    return {
        connectionStatus: connectionStatus,
        isConnected: isConnected,
        isConnecting: isConnecting,
        connectionError: connectionError,
        retryCount: retryCount,
        maxRetries: maxRetries,
        canRetry: retryCount < maxRetries
    };
};
exports.useConnectionStatus = useConnectionStatus;
/**
 * Hook to monitor specific connection types
 */
var useConnectionMonitor = function (connectionType) {
    var _a = (0, exports.useCommunication)(), connectionStatus = _a.connectionStatus, connectionMetrics = _a.connectionMetrics;
    return {
        isConnected: connectionStatus[connectionType],
        metrics: connectionMetrics[connectionType],
        status: connectionStatus[connectionType] ? 'connected' : 'disconnected'
    };
};
exports.useConnectionMonitor = useConnectionMonitor;
