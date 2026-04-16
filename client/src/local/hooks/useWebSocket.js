"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = useWebSocket;
exports.useMessagingWebSocket = useMessagingWebSocket;
exports.usePropertyUpdatesWebSocket = usePropertyUpdatesWebSocket;
exports.useNotificationsWebSocket = useNotificationsWebSocket;
var react_1 = require("react");
var useCleanupManager_1 = require("../../infrastructure/hooks/useCleanupManager");
var useSafeEffect_1 = require("../../infrastructure/hooks/useSafeEffect");
/**
 * Enhanced WebSocket hook with automatic reconnection, heartbeat, and message queuing
 * Critical for real-time messaging, property updates, and live notifications
 */
function useWebSocket(_a) {
    var url = _a.url, protocols = _a.protocols, onOpen = _a.onOpen, onClose = _a.onClose, onError = _a.onError, onMessage = _a.onMessage, _b = _a.shouldReconnect, shouldReconnect = _b === void 0 ? true : _b, _c = _a.reconnectAttempts, reconnectAttempts = _c === void 0 ? 5 : _c, _d = _a.reconnectInterval, reconnectInterval = _d === void 0 ? 3000 : _d, _e = _a.heartbeatInterval, heartbeatInterval = _e === void 0 ? 30000 : _e, _f = _a.heartbeatMessage, heartbeatMessage = _f === void 0 ? { type: 'ping' } : _f, _g = _a.binaryType, binaryType = _g === void 0 ? 'blob' : _g;
    var _h = (0, react_1.useState)(null), socket = _h[0], setSocket = _h[1];
    var _j = (0, react_1.useState)('Closed'), connectionStatus = _j[0], setConnectionStatus = _j[1];
    var _k = (0, react_1.useState)(null), lastMessage = _k[0], setLastMessage = _k[1];
    var _l = (0, react_1.useState)(0), connectionAttempts = _l[0], setConnectionAttempts = _l[1];
    var messageQueueRef = (0, react_1.useRef)([]);
    var shouldReconnectRef = (0, react_1.useRef)(shouldReconnect);
    var urlRef = (0, react_1.useRef)(url);
    var cleanupManager = (0, useCleanupManager_1.useEnhancedCleanupManager)();
    // Enterprise connection pool
    var connectionPool = (0, react_1.useRef)([]);
    // Enterprise metrics
    var metrics = (0, react_1.useRef)({
        totalConnections: 0,
        totalMessages: 0,
        totalErrors: 0,
        latencies: [],
        connectionStartTime: Date.now(),
        lastPingTime: 0,
    });
    // Enterprise message queue with persistence
    var persistentQueue = (0, react_1.useMemo)(function () {
        var queue = new Map();
        return {
            add: function (id, message) {
                queue.set(id, { message: message, timestamp: Date.now(), attempts: 0 });
                // Limit queue size to prevent memory leaks
                if (queue.size > 1000) {
                    var oldestKey = Array.from(queue.keys())[0];
                    if (oldestKey) {
                        queue.delete(oldestKey);
                    }
                }
            },
            remove: function (id) { return queue.delete(id); },
            clear: function () { return queue.clear(); },
            size: function () { return queue.size; },
            getAll: function () { return Array.from(queue.entries()); },
            incrementAttempts: function (id) {
                var item = queue.get(id);
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
    var failoverEndpoints = (0, react_1.useMemo)(function () {
        if (!url)
            return [];
        var baseUrl = url.replace(/^(ws|wss):\/\//, '');
        var protocol = url.startsWith('wss:') ? 'wss' : 'ws';
        return [
            url, // Primary endpoint
            "".concat(protocol, "://backup-1.").concat(baseUrl),
            "".concat(protocol, "://backup-2.").concat(baseUrl),
            "".concat(protocol, "://fallback.").concat(baseUrl),
        ];
    }, [url]);
    // Update refs when props change
    (0, useSafeEffect_1.useSafeEffect)(function () {
        shouldReconnectRef.current = shouldReconnect;
        urlRef.current = url;
    }, [shouldReconnect, url]);
    // Enterprise health monitoring
    var healthCheck = (0, react_1.useCallback)(function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
            metrics.current.lastPingTime = Date.now();
            var healthMessage = __assign(__assign({}, heartbeatMessage), { timestamp: Date.now(), health: true, connectionId: socket.url });
            socket.send(JSON.stringify(healthMessage));
        }
    }, [socket, heartbeatMessage]);
    // Heartbeat function with health monitoring
    var sendHeartbeat = (0, react_1.useCallback)(function () {
        healthCheck();
    }, [healthCheck]);
    // Start heartbeat
    var startHeartbeat = (0, react_1.useCallback)(function () {
        if (heartbeatInterval > 0) {
            cleanupManager.addInterval(sendHeartbeat, heartbeatInterval, 'websocket-heartbeat');
        }
    }, [sendHeartbeat, heartbeatInterval, cleanupManager]);
    // Stop heartbeat
    var stopHeartbeat = (0, react_1.useCallback)(function () {
        cleanupManager.removeCleanup('websocket-heartbeat');
    }, [cleanupManager]);
    // Enhanced message queue processing with retry logic
    var sendQueuedMessages = (0, react_1.useCallback)(function () {
        if (socket && socket.readyState === WebSocket.OPEN) {
            // Send regular queue
            if (messageQueueRef.current.length > 0) {
                messageQueueRef.current.forEach(function (message) {
                    socket.send(message);
                    metrics.current.totalMessages++;
                });
                messageQueueRef.current = [];
            }
            // Send persistent queue with retry logic
            var queuedItems = persistentQueue.getAll();
            queuedItems.forEach(function (_a) {
                var id = _a[0], item = _a[1];
                try {
                    socket.send(typeof item.message === 'string' ? item.message : JSON.stringify(item.message));
                    metrics.current.totalMessages++;
                    persistentQueue.remove(id);
                }
                catch (error) {
                    persistentQueue.incrementAttempts(id);
                    metrics.current.totalErrors++;
                }
            });
        }
    }, [socket, persistentQueue]);
    // Enhanced connect function with failover
    var connect = (0, react_1.useCallback)(function (endpointIndex) {
        if (endpointIndex === void 0) { endpointIndex = 0; }
        if (endpointIndex >= failoverEndpoints.length) {
            console.error('All WebSocket endpoints failed');
            setConnectionStatus('Closed');
            return;
        }
        try {
            setConnectionStatus('Connecting');
            metrics.current.totalConnections++;
            var currentUrl = failoverEndpoints[endpointIndex];
            if (!currentUrl) {
                throw new Error('No valid endpoint available');
            }
            var ws_1 = new WebSocket(currentUrl, protocols);
            ws_1.binaryType = binaryType;
            // Add to connection pool
            connectionPool.current.push(ws_1);
            if (connectionPool.current.length > 5) {
                // Clean up old connections
                var oldWs = connectionPool.current.shift();
                if (oldWs && oldWs.readyState === WebSocket.OPEN) {
                    oldWs.close();
                }
            }
            ws_1.onopen = function (event) {
                setSocket(ws_1);
                setConnectionStatus('Open');
                setConnectionAttempts(0);
                metrics.current.connectionStartTime = Date.now();
                startHeartbeat();
                sendQueuedMessages();
                onOpen === null || onOpen === void 0 ? void 0 : onOpen(event);
            };
            ws_1.onclose = function (event) {
                setSocket(null);
                setConnectionStatus('Closed');
                stopHeartbeat();
                onClose === null || onClose === void 0 ? void 0 : onClose(event);
                // Try failover endpoints first, then reconnect
                if (shouldReconnectRef.current && !event.wasClean) {
                    if (endpointIndex < failoverEndpoints.length - 1) {
                        // Try next endpoint immediately
                        connect(endpointIndex + 1);
                    }
                    else if (connectionAttempts < reconnectAttempts) {
                        // All endpoints failed, use exponential backoff
                        setConnectionAttempts(function (prev) { return prev + 1; });
                        var backoff = Math.min(reconnectInterval * Math.pow(1.5, connectionAttempts), 60000);
                        cleanupManager.addTimeout(function () {
                            connect(0); // Start from primary endpoint again
                        }, backoff, 'websocket-reconnect');
                    }
                }
            };
            ws_1.onerror = function (event) {
                setConnectionStatus('Closed');
                stopHeartbeat();
                metrics.current.totalErrors++;
                onError === null || onError === void 0 ? void 0 : onError(event);
            };
            ws_1.onmessage = function (event) {
                try {
                    // Calculate latency if this is a pong response
                    var data = JSON.parse(event.data);
                    if (data.type === 'pong' && metrics.current.lastPingTime > 0) {
                        var latency = Date.now() - metrics.current.lastPingTime;
                        metrics.current.latencies.push(latency);
                        if (metrics.current.latencies.length > 100) {
                            metrics.current.latencies = metrics.current.latencies.slice(-50);
                        }
                    }
                    var message = {
                        type: data.type || 'message',
                        payload: data.payload || data,
                        timestamp: Date.now(),
                        id: data.id,
                    };
                    setLastMessage(message);
                    onMessage === null || onMessage === void 0 ? void 0 : onMessage(message);
                }
                catch (error) {
                    // Handle non-JSON messages
                    var message = {
                        type: 'raw',
                        payload: event.data,
                        timestamp: Date.now(),
                    };
                    setLastMessage(message);
                    onMessage === null || onMessage === void 0 ? void 0 : onMessage(message);
                }
            };
            setSocket(ws_1);
        }
        catch (error) {
            setConnectionStatus('Closed');
            metrics.current.totalErrors++;
            console.error('WebSocket connection failed:', error);
            // Try next endpoint on connection error
            if (endpointIndex < failoverEndpoints.length - 1) {
                setTimeout(function () { return connect(endpointIndex + 1); }, 1000);
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
    var sendMessage = (0, react_1.useCallback)(function (message, persistent) {
        if (persistent === void 0) { persistent = false; }
        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                socket.send(message);
                metrics.current.totalMessages++;
            }
            catch (error) {
                metrics.current.totalErrors++;
                if (persistent) {
                    var messageId = "msg_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                    persistentQueue.add(messageId, message);
                }
                else {
                    messageQueueRef.current.push(message);
                }
            }
        }
        else {
            // Queue message for later sending
            if (persistent) {
                var messageId = "msg_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                persistentQueue.add(messageId, message);
            }
            else {
                messageQueueRef.current.push(message);
            }
        }
    }, [socket, persistentQueue]);
    // Enhanced send JSON message function
    var sendJsonMessage = (0, react_1.useCallback)(function (object, persistent) {
        if (persistent === void 0) { persistent = false; }
        sendMessage(JSON.stringify(object), persistent);
    }, [sendMessage]);
    // Disconnect function
    var disconnect = (0, react_1.useCallback)(function () {
        shouldReconnectRef.current = false;
        cleanupManager.removeCleanup('websocket-reconnect');
        stopHeartbeat();
        if (socket) {
            setConnectionStatus('Closing');
            socket.close(1000, 'Manual disconnect');
        }
    }, [socket, stopHeartbeat, cleanupManager]);
    // Enhanced reconnect function
    var enhancedReconnect = (0, react_1.useCallback)(function () {
        disconnect();
        shouldReconnectRef.current = true;
        setConnectionAttempts(0);
        setTimeout(function () { return connect(0); }, 100);
    }, [disconnect, connect]);
    // Enterprise message replay
    var messageReplay = (0, react_1.useCallback)(function (lastN) {
        if (lastN === void 0) { lastN = 100; }
        return persistentQueue.getAll()
            .slice(-lastN)
            .map(function (_a) {
            var _ = _a[0], item = _a[1];
            return item.message;
        });
    }, [persistentQueue]);
    // Enterprise utility functions
    var clearMessageQueue = (0, react_1.useCallback)(function () {
        messageQueueRef.current = [];
        persistentQueue.clear();
    }, [persistentQueue]);
    var getQueueSize = (0, react_1.useCallback)(function () {
        return messageQueueRef.current.length + persistentQueue.size();
    }, [persistentQueue]);
    // Calculate connection metrics
    var connectionMetrics = (0, react_1.useMemo)(function () {
        var avgLatency = metrics.current.latencies.length > 0
            ? metrics.current.latencies.reduce(function (a, b) { return a + b; }, 0) / metrics.current.latencies.length
            : 0;
        var uptime = connectionStatus === 'Open'
            ? Date.now() - metrics.current.connectionStartTime
            : 0;
        return {
            totalConnections: metrics.current.totalConnections,
            totalMessages: metrics.current.totalMessages,
            totalErrors: metrics.current.totalErrors,
            avgLatency: avgLatency,
            uptime: uptime,
        };
    }, [connectionStatus, metrics.current]);
    // Initial connection
    (0, useSafeEffect_1.useSafeEffect)(function () {
        connect(0);
        return function () {
            shouldReconnectRef.current = false;
            cleanupManager.runAllCleanup();
            // Clean up all connections in pool
            connectionPool.current.forEach(function (ws) {
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
    (0, useSafeEffect_1.useSafeEffect)(function () {
        return function () {
            cleanupManager.runAllCleanup();
        };
    }, [cleanupManager]);
    return {
        socket: socket,
        connectionStatus: connectionStatus,
        lastMessage: lastMessage,
        sendMessage: sendMessage,
        sendJsonMessage: sendJsonMessage,
        disconnect: disconnect,
        reconnect: enhancedReconnect,
        isConnected: connectionStatus === 'Open',
        connectionAttempts: connectionAttempts,
        // Enterprise features
        healthCheck: healthCheck,
        messageReplay: messageReplay,
        connectionPool: connectionPool.current,
        failoverEndpoints: failoverEndpoints,
        connectionMetrics: connectionMetrics,
        clearMessageQueue: clearMessageQueue,
        getQueueSize: getQueueSize,
    };
}
/**
 * Real-time messaging WebSocket hook
 */
function useMessagingWebSocket(userId) {
    var _a = (0, react_1.useState)([]), messages = _a[0], setMessages = _a[1];
    var _b = (0, react_1.useState)(new Set()), typingUsers = _b[0], setTypingUsers = _b[1];
    var _c = useWebSocket({
        url: "".concat(process.env.REACT_APP_WS_URL || 'ws://localhost:8080', "/ws/messages"),
        onOpen: function () {
            // Authenticate the connection
            sendJsonMessage({
                type: 'auth',
                payload: {
                    userId: userId,
                    token: localStorage.getItem('authToken'),
                },
            });
        },
        onMessage: function (message) {
            switch (message.type) {
                case 'message':
                    setMessages(function (prev) { return __spreadArray([message.payload], prev, true); });
                    break;
                case 'typing_start':
                    setTypingUsers(function (prev) {
                        var newSet = new Set(prev);
                        newSet.add(message.payload.userId);
                        return newSet;
                    });
                    break;
                case 'typing_stop':
                    setTypingUsers(function (prev) {
                        var newSet = new Set(prev);
                        newSet.delete(message.payload.userId);
                        return newSet;
                    });
                    break;
                case 'message_read':
                    setMessages(function (prev) {
                        return prev.map(function (msg) {
                            return msg.id === message.payload.messageId
                                ? __assign(__assign({}, msg), { isRead: true }) : msg;
                        });
                    });
                    break;
            }
        },
    }), sendJsonMessage = _c.sendJsonMessage, lastMessage = _c.lastMessage, isConnected = _c.isConnected, rest = __rest(_c, ["sendJsonMessage", "lastMessage", "isConnected"]);
    var sendMessage = (0, react_1.useCallback)(function (recipientId, content, threadId) {
        sendJsonMessage({
            type: 'send_message',
            payload: {
                recipientId: recipientId,
                content: content,
                threadId: threadId,
                timestamp: Date.now(),
            },
        });
    }, [sendJsonMessage]);
    var startTyping = (0, react_1.useCallback)(function (recipientId) {
        sendJsonMessage({
            type: 'typing_start',
            payload: { recipientId: recipientId },
        });
    }, [sendJsonMessage]);
    var stopTyping = (0, react_1.useCallback)(function (recipientId) {
        sendJsonMessage({
            type: 'typing_stop',
            payload: { recipientId: recipientId },
        });
    }, [sendJsonMessage]);
    var markAsRead = (0, react_1.useCallback)(function (messageId) {
        sendJsonMessage({
            type: 'mark_read',
            payload: { messageId: messageId },
        });
    }, [sendJsonMessage]);
    return __assign(__assign({}, rest), { sendJsonMessage: sendJsonMessage, lastMessage: lastMessage, isConnected: isConnected, messages: messages, typingUsers: Array.from(typingUsers), sendMessage: sendMessage, startTyping: startTyping, stopTyping: stopTyping, markAsRead: markAsRead });
}
/**
 * Property updates WebSocket hook
 */
function usePropertyUpdatesWebSocket() {
    var _a = (0, react_1.useState)([]), propertyUpdates = _a[0], setPropertyUpdates = _a[1];
    var _b = (0, react_1.useState)([]), newListings = _b[0], setNewListings = _b[1];
    var _c = useWebSocket({
        url: "".concat(process.env.REACT_APP_WS_URL || 'ws://localhost:8080', "/ws/properties"),
        onOpen: function () {
            sendJsonMessage({
                type: 'subscribe',
                payload: {
                    token: localStorage.getItem('authToken'),
                },
            });
        },
        onMessage: function (message) {
            switch (message.type) {
                case 'property_updated':
                    setPropertyUpdates(function (prev) { return __spreadArray([message.payload], prev.slice(0, 49), true); }); // Keep last 50
                    break;
                case 'new_listing':
                    setNewListings(function (prev) { return __spreadArray([message.payload], prev.slice(0, 19), true); }); // Keep last 20
                    break;
                case 'property_sold':
                    // Handle property sold notifications
                    break;
                case 'price_change':
                    setPropertyUpdates(function (prev) { return __spreadArray([
                        __assign(__assign({}, message.payload), { type: 'price_change' })
                    ], prev.slice(0, 49), true); });
                    break;
            }
        },
    }), sendJsonMessage = _c.sendJsonMessage, isConnected = _c.isConnected, rest = __rest(_c, ["sendJsonMessage", "isConnected"]);
    var subscribeToProperty = (0, react_1.useCallback)(function (propertyId) {
        sendJsonMessage({
            type: 'subscribe_property',
            payload: { propertyId: propertyId },
        });
    }, [sendJsonMessage]);
    var unsubscribeFromProperty = (0, react_1.useCallback)(function (propertyId) {
        sendJsonMessage({
            type: 'unsubscribe_property',
            payload: { propertyId: propertyId },
        });
    }, [sendJsonMessage]);
    return __assign(__assign({}, rest), { isConnected: isConnected, propertyUpdates: propertyUpdates, newListings: newListings, subscribeToProperty: subscribeToProperty, unsubscribeFromProperty: unsubscribeFromProperty });
}
/**
 * Notifications WebSocket hook
 */
function useNotificationsWebSocket(userId) {
    var _a = (0, react_1.useState)([]), notifications = _a[0], setNotifications = _a[1];
    var _b = (0, react_1.useState)(0), unreadCount = _b[0], setUnreadCount = _b[1];
    var _c = useWebSocket({
        url: "".concat(process.env.REACT_APP_WS_URL || 'ws://localhost:8080', "/ws/notifications"),
        onOpen: function () {
            sendJsonMessage({
                type: 'auth',
                payload: {
                    userId: userId,
                    token: localStorage.getItem('authToken'),
                },
            });
        },
        onMessage: function (message) {
            switch (message.type) {
                case 'notification':
                    setNotifications(function (prev) { return __spreadArray([message.payload], prev, true); });
                    setUnreadCount(function (prev) { return prev + 1; });
                    break;
                case 'notification_read':
                    setNotifications(function (prev) {
                        return prev.map(function (notif) {
                            return notif.id === message.payload.notificationId
                                ? __assign(__assign({}, notif), { isRead: true }) : notif;
                        });
                    });
                    setUnreadCount(function (prev) { return Math.max(0, prev - 1); });
                    break;
                case 'unread_count':
                    setUnreadCount(message.payload.count);
                    break;
            }
        },
    }), sendJsonMessage = _c.sendJsonMessage, isConnected = _c.isConnected, rest = __rest(_c, ["sendJsonMessage", "isConnected"]);
    var markAsRead = (0, react_1.useCallback)(function (notificationId) {
        sendJsonMessage({
            type: 'mark_read',
            payload: { notificationId: notificationId },
        });
    }, [sendJsonMessage]);
    var markAllAsRead = (0, react_1.useCallback)(function () {
        sendJsonMessage({
            type: 'mark_all_read',
            payload: {},
        });
    }, [sendJsonMessage]);
    return __assign(__assign({}, rest), { isConnected: isConnected, notifications: notifications, unreadCount: unreadCount, markAsRead: markAsRead, markAllAsRead: markAllAsRead });
}
