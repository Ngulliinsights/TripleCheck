"use strict";
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
exports.webSocketClient = void 0;
exports.useWebSocket = useWebSocket;
exports.useWebSocketMessage = useWebSocketMessage;
var react_1 = require("react");
var WebSocketClient = /** @class */ (function () {
    function WebSocketClient(config) {
        this.ws = null;
        this.eventHandlers = new Map();
        this.statusHandlers = [];
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.isManualClose = false;
        this.config = config;
    }
    // Connect to WebSocket server
    WebSocketClient.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.isManualClose = false;
                _this.ws = new WebSocket(_this.config.url, _this.config.protocols);
                _this.ws.onopen = function () {
                    console.log('WebSocket connected');
                    _this.reconnectAttempts = 0;
                    _this.startHeartbeat();
                    _this.notifyStatusHandlers('connected');
                    resolve();
                };
                _this.ws.onmessage = function (event) {
                    try {
                        var message = JSON.parse(event.data);
                        _this.handleMessage(message);
                    }
                    catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };
                _this.ws.onclose = function (event) {
                    console.log('WebSocket disconnected:', event.code, event.reason);
                    _this.stopHeartbeat();
                    _this.notifyStatusHandlers('disconnected');
                    if (!_this.isManualClose && _this.reconnectAttempts < _this.config.maxReconnectAttempts) {
                        _this.scheduleReconnect();
                    }
                };
                _this.ws.onerror = function (error) {
                    console.error('WebSocket error:', error);
                    _this.notifyStatusHandlers('error');
                    reject(error);
                };
                _this.notifyStatusHandlers('connecting');
            }
            catch (error) {
                reject(error);
            }
        });
    };
    // Disconnect from WebSocket server
    WebSocketClient.prototype.disconnect = function () {
        this.isManualClose = true;
        this.stopHeartbeat();
        this.clearReconnectTimer();
        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
            this.ws = null;
        }
    };
    // Send message to server
    WebSocketClient.prototype.send = function (type, payload) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }
        var message = {
            type: type,
            payload: payload,
            timestamp: Date.now(),
            id: this.generateMessageId(),
        };
        try {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        catch (error) {
            console.error('Failed to send WebSocket message:', error);
            return false;
        }
    };
    // Subscribe to message type
    WebSocketClient.prototype.on = function (messageType, handler) {
        var _this = this;
        if (!this.eventHandlers.has(messageType)) {
            this.eventHandlers.set(messageType, []);
        }
        this.eventHandlers.get(messageType).push(handler);
        // Return unsubscribe function
        return function () {
            var handlers = _this.eventHandlers.get(messageType);
            if (handlers) {
                var index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                }
            }
        };
    };
    // Subscribe to connection status changes
    WebSocketClient.prototype.onStatusChange = function (handler) {
        var _this = this;
        this.statusHandlers.push(handler);
        // Return unsubscribe function
        return function () {
            var index = _this.statusHandlers.indexOf(handler);
            if (index > -1) {
                _this.statusHandlers.splice(index, 1);
            }
        };
    };
    // Get current connection status
    WebSocketClient.prototype.getStatus = function () {
        if (!this.ws)
            return 'disconnected';
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
    };
    WebSocketClient.prototype.handleMessage = function (message) {
        var handlers = this.eventHandlers.get(message.type);
        if (handlers) {
            handlers.forEach(function (handler) {
                try {
                    handler(message);
                }
                catch (error) {
                    console.error('Error in WebSocket message handler:', error);
                }
            });
        }
    };
    WebSocketClient.prototype.notifyStatusHandlers = function (status) {
        this.statusHandlers.forEach(function (handler) {
            try {
                handler(status);
            }
            catch (error) {
                console.error('Error in WebSocket status handler:', error);
            }
        });
    };
    WebSocketClient.prototype.scheduleReconnect = function () {
        var _this = this;
        this.reconnectAttempts++;
        var delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
        console.log("Scheduling WebSocket reconnect attempt ".concat(this.reconnectAttempts, " in ").concat(delay, "ms"));
        this.reconnectTimer = setTimeout(function () {
            _this.connect().catch(function (error) {
                console.error('WebSocket reconnect failed:', error);
            });
        }, delay);
    };
    WebSocketClient.prototype.clearReconnectTimer = function () {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    };
    WebSocketClient.prototype.startHeartbeat = function () {
        var _this = this;
        this.heartbeatTimer = setInterval(function () {
            if (_this.ws && _this.ws.readyState === WebSocket.OPEN) {
                _this.send('ping', { timestamp: Date.now() });
            }
        }, this.config.heartbeatInterval);
    };
    WebSocketClient.prototype.stopHeartbeat = function () {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    };
    WebSocketClient.prototype.generateMessageId = function () {
        return "".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
    };
    return WebSocketClient;
}());
// Default WebSocket configuration
var defaultConfig = {
    url: process.env.NODE_ENV === 'production'
        ? 'wss://your-domain.com/ws'
        : 'ws://localhost:3000/ws',
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000, // 30 seconds
};
// Singleton WebSocket client
exports.webSocketClient = new WebSocketClient(defaultConfig);
// React hook for WebSocket
function useWebSocket() {
    var _a = react_1.default.useState('disconnected'), status = _a[0], setStatus = _a[1];
    var _b = react_1.default.useState(false), isConnected = _b[0], setIsConnected = _b[1];
    react_1.default.useEffect(function () {
        var unsubscribe = exports.webSocketClient.onStatusChange(function (newStatus) {
            setStatus(newStatus);
            setIsConnected(newStatus === 'connected');
        });
        // Connect on mount
        exports.webSocketClient.connect().catch(function (error) {
            console.error('Failed to connect WebSocket:', error);
        });
        return function () {
            unsubscribe();
            exports.webSocketClient.disconnect();
        };
    }, []);
    var send = react_1.default.useCallback(function (type, payload) {
        return exports.webSocketClient.send(type, payload);
    }, []);
    var subscribe = react_1.default.useCallback(function (messageType, handler) {
        return exports.webSocketClient.on(messageType, handler);
    }, []);
    return {
        status: status,
        isConnected: isConnected,
        send: send,
        subscribe: subscribe,
    };
}
// Hook for specific message types
function useWebSocketMessage(messageType) {
    var _a = react_1.default.useState(null), lastMessage = _a[0], setLastMessage = _a[1];
    var _b = react_1.default.useState([]), messages = _b[0], setMessages = _b[1];
    react_1.default.useEffect(function () {
        return exports.webSocketClient.on(messageType, function (message) {
            setLastMessage(message);
            setMessages(function (prev) { return __spreadArray(__spreadArray([], prev.slice(-99), true), [message], false); }); // Keep last 100 messages
        });
    }, [messageType]);
    return {
        lastMessage: lastMessage,
        messages: messages,
        payload: lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.payload,
    };
}
