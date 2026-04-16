"use strict";
/**
 * Messaging Hook
 * React hook for managing messaging functionality
 * Integrates with WebSocket for real-time messaging
 */
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.useMessaging = useMessaging;
exports.useThreads = useThreads;
exports.useMessages = useMessages;
exports.useTypingIndicators = useTypingIndicators;
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var websocket_client_1 = require("../../infrastructure/realtime/websocket-client");
// API functions
var messagingAPI = {
    sendMessage: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var formData, response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formData = new FormData();
                        Object.entries(data).forEach(function (_a) {
                            var key = _a[0], value = _a[1];
                            if (key === 'attachments' && Array.isArray(value)) {
                                value.forEach(function (file) { return formData.append('attachments', file); });
                            }
                            else if (value !== undefined) {
                                formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
                            }
                        });
                        return [4 /*yield*/, fetch('/api/messages', {
                                method: 'POST',
                                body: formData,
                                credentials: 'include'
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to send message');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        });
    },
    createThread: function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/threads', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data),
                            credentials: 'include'
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to create thread');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        });
    },
    getThreads: function () {
        return __awaiter(this, arguments, void 0, function (filters, page, limit) {
            var params, response, result;
            if (filters === void 0) { filters = {}; }
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams(__assign({ page: page.toString(), limit: limit.toString() }, Object.fromEntries(Object.entries(filters).filter(function (_a) {
                            var _ = _a[0], value = _a[1];
                            return value !== undefined;
                        }))));
                        return [4 /*yield*/, fetch("/api/threads?".concat(params), {
                                credentials: 'include'
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to get threads');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        });
    },
    getMessages: function (threadId_1) {
        return __awaiter(this, arguments, void 0, function (threadId, page, limit) {
            var params, response, result;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams({
                            page: page.toString(),
                            limit: limit.toString()
                        });
                        return [4 /*yield*/, fetch("/api/threads/".concat(threadId, "/messages?").concat(params), {
                                credentials: 'include'
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to get messages');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        });
    },
    markMessagesAsRead: function (messageIds) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/messages/read', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messageIds: messageIds }),
                            credentials: 'include'
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to mark messages as read');
                        }
                        return [2 /*return*/];
                }
            });
        });
    },
    setTypingIndicator: function (threadId, isTyping) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/threads/".concat(threadId, "/typing"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isTyping: isTyping }),
                            credentials: 'include'
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to set typing indicator');
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
};
// Query keys
var messagingKeys = {
    all: ['messaging'],
    threads: function (filters) { return __spreadArray(__spreadArray([], messagingKeys.all, true), ['threads', filters], false); },
    messages: function (threadId, page) { return __spreadArray(__spreadArray([], messagingKeys.all, true), ['messages', threadId, page], false); },
};
// Main messaging hook
function useMessaging() {
    var _this = this;
    var queryClient = (0, react_query_1.useQueryClient)();
    var _a = (0, websocket_client_1.useWebSocket)(), isConnected = _a.isConnected, sendWebSocketMessage = _a.send;
    // Mutations
    var sendMessageMutation = (0, react_query_1.useMutation)({
        mutationFn: messagingAPI.sendMessage,
        onSuccess: function (message) {
            // Update thread messages cache
            queryClient.setQueryData(messagingKeys.messages(message.threadId, 1), function (old) {
                if (!old)
                    return { messages: [message], total: 1, hasMore: false };
                return __assign(__assign({}, old), { messages: __spreadArray(__spreadArray([], old.messages, true), [message], false), total: old.total + 1 });
            });
            // Invalidate threads to update last message
            queryClient.invalidateQueries({ queryKey: messagingKeys.all });
        }
    });
    var createThreadMutation = (0, react_query_1.useMutation)({
        mutationFn: messagingAPI.createThread,
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: messagingKeys.all });
        }
    });
    var markAsReadMutation = (0, react_query_1.useMutation)({
        mutationFn: messagingAPI.markMessagesAsRead,
        onSuccess: function (_, messageIds) {
            // Update message status in cache
            queryClient.setQueriesData({ queryKey: messagingKeys.all }, function (old) {
                if (!(old === null || old === void 0 ? void 0 : old.messages))
                    return old;
                return __assign(__assign({}, old), { messages: old.messages.map(function (msg) {
                        return messageIds.includes(msg.id)
                            ? __assign(__assign({}, msg), { status: 'read', readAt: new Date().toISOString() }) : msg;
                    }) });
            });
        }
    });
    // Actions
    var sendMessage = (0, react_1.useCallback)(function (data) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, sendMessageMutation.mutateAsync(data)];
        });
    }); }, [sendMessageMutation]);
    var createThread = (0, react_1.useCallback)(function (data) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, createThreadMutation.mutateAsync(data)];
        });
    }); }, [createThreadMutation]);
    var markMessagesAsRead = (0, react_1.useCallback)(function (messageIds) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, markAsReadMutation.mutateAsync(messageIds)];
        });
    }); }, [markAsReadMutation]);
    var setTypingIndicator = (0, react_1.useCallback)(function (threadId, isTyping) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Send via WebSocket for real-time updates
            if (isConnected) {
                sendWebSocketMessage(isTyping ? 'typing_start' : 'typing_stop', { threadId: threadId });
            }
            // Also send via HTTP as fallback
            return [2 /*return*/, messagingAPI.setTypingIndicator(threadId, isTyping)];
        });
    }); }, [isConnected, sendWebSocketMessage]);
    return {
        sendMessage: sendMessage,
        createThread: createThread,
        markMessagesAsRead: markMessagesAsRead,
        setTypingIndicator: setTypingIndicator,
        isConnected: isConnected,
        isSending: sendMessageMutation.isPending,
        isCreatingThread: createThreadMutation.isPending,
        sendError: sendMessageMutation.error,
        createError: createThreadMutation.error
    };
}
// Hook for managing threads
function useThreads(filters) {
    if (filters === void 0) { filters = {}; }
    var _a = (0, react_query_1.useQuery)({
        queryKey: messagingKeys.threads(filters),
        queryFn: function () { return messagingAPI.getThreads(filters); },
        staleTime: 30000, // 30 seconds
    }), data = _a.data, isLoading = _a.isLoading, error = _a.error, refetch = _a.refetch;
    // Listen for real-time updates
    var newMessage = (0, websocket_client_1.useWebSocketMessage)('new_message').lastMessage;
    var threadUpdate = (0, websocket_client_1.useWebSocketMessage)('thread_updated').lastMessage;
    var queryClient = (0, react_query_1.useQueryClient)();
    (0, react_1.useEffect)(function () {
        if (newMessage) {
            // Invalidate threads to update last message and order
            queryClient.invalidateQueries({ queryKey: messagingKeys.threads(filters) });
        }
    }, [newMessage, queryClient, filters]);
    (0, react_1.useEffect)(function () {
        if (threadUpdate) {
            queryClient.invalidateQueries({ queryKey: messagingKeys.threads(filters) });
        }
    }, [threadUpdate, queryClient, filters]);
    return {
        threads: (data === null || data === void 0 ? void 0 : data.threads) || [],
        total: (data === null || data === void 0 ? void 0 : data.total) || 0,
        hasMore: (data === null || data === void 0 ? void 0 : data.hasMore) || false,
        isLoading: isLoading,
        error: error,
        refetch: refetch
    };
}
// Hook for managing messages in a thread
function useMessages(threadId, page) {
    if (page === void 0) { page = 1; }
    var _a = (0, react_query_1.useQuery)({
        queryKey: messagingKeys.messages(threadId, page),
        queryFn: function () { return messagingAPI.getMessages(threadId, page); },
        enabled: !!threadId,
        staleTime: 10000, // 10 seconds
    }), data = _a.data, isLoading = _a.isLoading, error = _a.error, refetch = _a.refetch;
    // Listen for real-time message updates
    var newMessage = (0, websocket_client_1.useWebSocketMessage)('new_message').lastMessage;
    var messageDelivered = (0, websocket_client_1.useWebSocketMessage)('message_delivered').lastMessage;
    var messageRead = (0, websocket_client_1.useWebSocketMessage)('message_read').lastMessage;
    var queryClient = (0, react_query_1.useQueryClient)();
    (0, react_1.useEffect)(function () {
        var _a;
        if (((_a = newMessage === null || newMessage === void 0 ? void 0 : newMessage.payload) === null || _a === void 0 ? void 0 : _a.threadId) === threadId) {
            queryClient.setQueryData(messagingKeys.messages(threadId, page), function (old) {
                if (!old)
                    return { messages: [newMessage.payload], total: 1, hasMore: false };
                // Check if message already exists
                var exists = old.messages.some(function (msg) { return msg.id === newMessage.payload.id; });
                if (exists)
                    return old;
                return __assign(__assign({}, old), { messages: __spreadArray(__spreadArray([], old.messages, true), [newMessage.payload], false), total: old.total + 1 });
            });
        }
    }, [newMessage, threadId, page, queryClient]);
    (0, react_1.useEffect)(function () {
        var _a;
        if ((_a = messageDelivered === null || messageDelivered === void 0 ? void 0 : messageDelivered.payload) === null || _a === void 0 ? void 0 : _a.messageId) {
            queryClient.setQueryData(messagingKeys.messages(threadId, page), function (old) {
                if (!old)
                    return old;
                return __assign(__assign({}, old), { messages: old.messages.map(function (msg) {
                        return msg.id === messageDelivered.payload.messageId
                            ? __assign(__assign({}, msg), { status: 'delivered', deliveredAt: messageDelivered.payload.deliveredAt }) : msg;
                    }) });
            });
        }
    }, [messageDelivered, threadId, page, queryClient]);
    (0, react_1.useEffect)(function () {
        var _a;
        if ((_a = messageRead === null || messageRead === void 0 ? void 0 : messageRead.payload) === null || _a === void 0 ? void 0 : _a.messageId) {
            queryClient.setQueryData(messagingKeys.messages(threadId, page), function (old) {
                if (!old)
                    return old;
                return __assign(__assign({}, old), { messages: old.messages.map(function (msg) {
                        return msg.id === messageRead.payload.messageId
                            ? __assign(__assign({}, msg), { status: 'read', readAt: messageRead.payload.readAt }) : msg;
                    }) });
            });
        }
    }, [messageRead, threadId, page, queryClient]);
    return {
        messages: (data === null || data === void 0 ? void 0 : data.messages) || [],
        total: (data === null || data === void 0 ? void 0 : data.total) || 0,
        hasMore: (data === null || data === void 0 ? void 0 : data.hasMore) || false,
        isLoading: isLoading,
        error: error,
        refetch: refetch
    };
}
// Hook for typing indicators
function useTypingIndicators(threadId) {
    var _a = (0, react_1.useState)([]), typingUsers = _a[0], setTypingUsers = _a[1];
    var typingStart = (0, websocket_client_1.useWebSocketMessage)('user_typing_start').lastMessage;
    var typingStop = (0, websocket_client_1.useWebSocketMessage)('user_typing_stop').lastMessage;
    (0, react_1.useEffect)(function () {
        var _a;
        if (((_a = typingStart === null || typingStart === void 0 ? void 0 : typingStart.payload) === null || _a === void 0 ? void 0 : _a.threadId) === threadId) {
            var userId_1 = typingStart.payload.userId;
            setTypingUsers(function (prev) { return prev.includes(userId_1) ? prev : __spreadArray(__spreadArray([], prev, true), [userId_1], false); });
        }
    }, [typingStart, threadId]);
    (0, react_1.useEffect)(function () {
        var _a;
        if (((_a = typingStop === null || typingStop === void 0 ? void 0 : typingStop.payload) === null || _a === void 0 ? void 0 : _a.threadId) === threadId) {
            var userId_2 = typingStop.payload.userId;
            setTypingUsers(function (prev) { return prev.filter(function (id) { return id !== userId_2; }); });
        }
    }, [typingStop, threadId]);
    // Auto-cleanup typing indicators after 5 seconds
    (0, react_1.useEffect)(function () {
        if (typingUsers.length > 0) {
            var timer_1 = setTimeout(function () {
                setTypingUsers([]);
            }, 5000);
            return function () { return clearTimeout(timer_1); };
        }
    }, [typingUsers]);
    return typingUsers;
}
