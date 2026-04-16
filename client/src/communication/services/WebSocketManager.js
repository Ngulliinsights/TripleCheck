"use strict";
/**
 * WebSocket Manager for Communication Module
 * Manages WebSocket connections for messaging and notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketMessageQueue = exports.WebSocketConnectionPool = exports.WebSocketErrorHandler = exports.WebSocketEvents = void 0;
exports.useWebSocketManager = useWebSocketManager;
var useWebSocket_1 = require("../../local/hooks/useWebSocket");
/**
 * Hook to manage all communication WebSocket connections
 */
function useWebSocketManager(config) {
    var userId = config.userId, authToken = config.authToken, _a = config.baseUrl, baseUrl = _a === void 0 ? process.env.REACT_APP_WS_URL || 'ws://localhost:8080' : _a;
    // Initialize WebSocket connections
    var messagingWS = (0, useWebSocket_1.useMessagingWebSocket)(userId);
    var notificationsWS = (0, useWebSocket_1.useNotificationsWebSocket)(userId);
    var propertyUpdatesWS = (0, useWebSocket_1.usePropertyUpdatesWebSocket)();
    // Connection status
    var connectionStatus = {
        messaging: messagingWS.isConnected,
        notifications: notificationsWS.isConnected,
        propertyUpdates: propertyUpdatesWS.isConnected,
        overall: messagingWS.isConnected && notificationsWS.isConnected && propertyUpdatesWS.isConnected
    };
    // Connection metrics
    var connectionMetrics = {
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
    var healthCheckAll = function () {
        messagingWS.healthCheck();
        notificationsWS.healthCheck();
        propertyUpdatesWS.healthCheck();
    };
    // Reconnect all connections
    var reconnectAll = function () {
        messagingWS.reconnect();
        notificationsWS.reconnect();
        propertyUpdatesWS.reconnect();
    };
    // Disconnect all connections
    var disconnectAll = function () {
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
        connectionStatus: connectionStatus,
        connectionMetrics: connectionMetrics,
        // Management functions
        healthCheckAll: healthCheckAll,
        reconnectAll: reconnectAll,
        disconnectAll: disconnectAll,
        // Utility functions
        isFullyConnected: connectionStatus.overall,
        hasAnyConnection: connectionStatus.messaging || connectionStatus.notifications || connectionStatus.propertyUpdates
    };
}
/**
 * WebSocket Event Types for Communication Module
 */
exports.WebSocketEvents = {
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
};
/**
 * WebSocket Error Handler
 */
var WebSocketErrorHandler = /** @class */ (function () {
    function WebSocketErrorHandler() {
        this.errorCallbacks = new Map();
    }
    WebSocketErrorHandler.getInstance = function () {
        if (!WebSocketErrorHandler.instance) {
            WebSocketErrorHandler.instance = new WebSocketErrorHandler();
        }
        return WebSocketErrorHandler.instance;
    };
    WebSocketErrorHandler.prototype.registerErrorCallback = function (id, callback) {
        this.errorCallbacks.set(id, callback);
    };
    WebSocketErrorHandler.prototype.unregisterErrorCallback = function (id) {
        this.errorCallbacks.delete(id);
    };
    WebSocketErrorHandler.prototype.handleError = function (error, context) {
        console.error("WebSocket Error".concat(context ? " (".concat(context, ")") : '', ":"), error);
        // Notify all registered error handlers
        this.errorCallbacks.forEach(function (callback) {
            try {
                callback(error);
            }
            catch (callbackError) {
                console.error('Error in WebSocket error callback:', callbackError);
            }
        });
        // Send error to monitoring service
        this.sendErrorToMonitoring(error, context);
    };
    WebSocketErrorHandler.prototype.sendErrorToMonitoring = function (error, context) {
        // In a real application, send to monitoring service like Sentry
        if (process.env.NODE_ENV === 'production') {
            // Example: Sentry.captureException(error, { tags: { context } });
        }
    };
    return WebSocketErrorHandler;
}());
exports.WebSocketErrorHandler = WebSocketErrorHandler;
/**
 * WebSocket Connection Pool Manager
 */
var WebSocketConnectionPool = /** @class */ (function () {
    function WebSocketConnectionPool() {
        this.connections = new Map();
        this.maxConnections = 10;
    }
    WebSocketConnectionPool.getInstance = function () {
        if (!WebSocketConnectionPool.instance) {
            WebSocketConnectionPool.instance = new WebSocketConnectionPool();
        }
        return WebSocketConnectionPool.instance;
    };
    WebSocketConnectionPool.prototype.addConnection = function (id, connection) {
        // Remove oldest connection if at max capacity
        if (this.connections.size >= this.maxConnections) {
            var oldestId = this.connections.keys().next().value;
            if (oldestId) {
                this.removeConnection(oldestId);
            }
        }
        this.connections.set(id, connection);
    };
    WebSocketConnectionPool.prototype.removeConnection = function (id) {
        var connection = this.connections.get(id);
        if (connection && connection.readyState === WebSocket.OPEN) {
            connection.close();
        }
        this.connections.delete(id);
    };
    WebSocketConnectionPool.prototype.getConnection = function (id) {
        return this.connections.get(id);
    };
    WebSocketConnectionPool.prototype.getAllConnections = function () {
        return Array.from(this.connections.values());
    };
    WebSocketConnectionPool.prototype.closeAllConnections = function () {
        var _this = this;
        this.connections.forEach(function (connection, id) {
            _this.removeConnection(id);
        });
    };
    WebSocketConnectionPool.prototype.getConnectionCount = function () {
        return this.connections.size;
    };
    WebSocketConnectionPool.prototype.getHealthyConnectionCount = function () {
        return Array.from(this.connections.values())
            .filter(function (conn) { return conn.readyState === WebSocket.OPEN; }).length;
    };
    return WebSocketConnectionPool;
}());
exports.WebSocketConnectionPool = WebSocketConnectionPool;
/**
 * WebSocket Message Queue for offline support
 */
var WebSocketMessageQueue = /** @class */ (function () {
    function WebSocketMessageQueue() {
        this.queue = new Map();
        this.maxQueueSize = 100;
    }
    WebSocketMessageQueue.getInstance = function () {
        if (!WebSocketMessageQueue.instance) {
            WebSocketMessageQueue.instance = new WebSocketMessageQueue();
        }
        return WebSocketMessageQueue.instance;
    };
    WebSocketMessageQueue.prototype.enqueue = function (connectionId, message) {
        if (!this.queue.has(connectionId)) {
            this.queue.set(connectionId, []);
        }
        var messages = this.queue.get(connectionId);
        // Remove oldest messages if at max capacity
        if (messages.length >= this.maxQueueSize) {
            messages.shift();
        }
        messages.push(message);
    };
    WebSocketMessageQueue.prototype.dequeue = function (connectionId) {
        var messages = this.queue.get(connectionId);
        return messages === null || messages === void 0 ? void 0 : messages.shift();
    };
    WebSocketMessageQueue.prototype.dequeueAll = function (connectionId) {
        var messages = this.queue.get(connectionId) || [];
        this.queue.set(connectionId, []);
        return messages;
    };
    WebSocketMessageQueue.prototype.getQueueSize = function (connectionId) {
        var _a;
        return ((_a = this.queue.get(connectionId)) === null || _a === void 0 ? void 0 : _a.length) || 0;
    };
    WebSocketMessageQueue.prototype.clearQueue = function (connectionId) {
        this.queue.delete(connectionId);
    };
    WebSocketMessageQueue.prototype.clearAllQueues = function () {
        this.queue.clear();
    };
    return WebSocketMessageQueue;
}());
exports.WebSocketMessageQueue = WebSocketMessageQueue;
