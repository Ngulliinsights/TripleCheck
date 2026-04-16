"use strict";
/**
 * Notifications Hook
 * React hook for managing notifications and real-time updates
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
exports.useNotifications = useNotifications;
exports.useNotificationSettings = useNotificationSettings;
exports.useUnreadNotificationCount = useUnreadNotificationCount;
exports.useNotificationPermission = useNotificationPermission;
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var websocket_client_1 = require("../../infrastructure/realtime/websocket-client");
// API functions
var notificationsAPI = {
    getNotifications: function () {
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
                        return [4 /*yield*/, fetch("/api/notifications?".concat(params), {
                                credentials: 'include'
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to get notifications');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        });
    },
    markAsRead: function (notificationIds) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/notifications/read', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notificationIds: notificationIds }),
                            credentials: 'include'
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to mark notifications as read');
                        }
                        return [2 /*return*/];
                }
            });
        });
    },
    markAllAsRead: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/notifications/read-all', {
                            method: 'PUT',
                            credentials: 'include'
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to mark all notifications as read');
                        }
                        return [2 /*return*/];
                }
            });
        });
    },
    deleteNotification: function (notificationId) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/notifications/".concat(notificationId), {
                            method: 'DELETE',
                            credentials: 'include'
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to delete notification');
                        }
                        return [2 /*return*/];
                }
            });
        });
    },
    getSettings: function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/notifications/settings', {
                            credentials: 'include'
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to get notification settings');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        });
    },
    updateSettings: function (settings) {
        return __awaiter(this, void 0, void 0, function () {
            var response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/notifications/settings', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(settings),
                            credentials: 'include'
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error('Failed to update notification settings');
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        });
    }
};
// Query keys
var notificationKeys = {
    all: ['notifications'],
    list: function (filters) { return __spreadArray(__spreadArray([], notificationKeys.all, true), ['list', filters], false); },
    settings: function () { return __spreadArray(__spreadArray([], notificationKeys.all, true), ['settings'], false); },
};
// Main notifications hook
function useNotifications(filters) {
    var _this = this;
    if (filters === void 0) { filters = {}; }
    var queryClient = (0, react_query_1.useQueryClient)();
    var _a = (0, react_query_1.useQuery)({
        queryKey: notificationKeys.list(filters),
        queryFn: function () { return notificationsAPI.getNotifications(filters); },
        staleTime: 30000, // 30 seconds
    }), data = _a.data, isLoading = _a.isLoading, error = _a.error, refetch = _a.refetch;
    // Listen for real-time notification updates
    var newNotification = (0, websocket_client_1.useWebSocketMessage)('new_notification').lastMessage;
    (0, react_1.useEffect)(function () {
        if (newNotification) {
            queryClient.setQueryData(notificationKeys.list(filters), function (old) {
                if (!old)
                    return {
                        notifications: [newNotification.payload],
                        total: 1,
                        unreadCount: 1,
                        hasMore: false
                    };
                return __assign(__assign({}, old), { notifications: __spreadArray([newNotification.payload], old.notifications, true), total: old.total + 1, unreadCount: old.unreadCount + 1 });
            });
            // Show browser notification if supported and enabled
            showBrowserNotification(newNotification.payload);
        }
    }, [newNotification, queryClient, filters]);
    // Mutations
    var markAsReadMutation = (0, react_query_1.useMutation)({
        mutationFn: notificationsAPI.markAsRead,
        onSuccess: function (_, notificationIds) {
            queryClient.setQueryData(notificationKeys.list(filters), function (old) {
                if (!old)
                    return old;
                var updatedNotifications = old.notifications.map(function (notification) {
                    return notificationIds.includes(notification.id)
                        ? __assign(__assign({}, notification), { isRead: true, readAt: new Date().toISOString() }) : notification;
                });
                var unreadCount = updatedNotifications.filter(function (n) { return !n.isRead; }).length;
                return __assign(__assign({}, old), { notifications: updatedNotifications, unreadCount: unreadCount });
            });
        }
    });
    var markAllAsReadMutation = (0, react_query_1.useMutation)({
        mutationFn: notificationsAPI.markAllAsRead,
        onSuccess: function () {
            queryClient.setQueryData(notificationKeys.list(filters), function (old) {
                if (!old)
                    return old;
                return __assign(__assign({}, old), { notifications: old.notifications.map(function (notification) { return (__assign(__assign({}, notification), { isRead: true, readAt: new Date().toISOString() })); }), unreadCount: 0 });
            });
        }
    });
    var deleteNotificationMutation = (0, react_query_1.useMutation)({
        mutationFn: notificationsAPI.deleteNotification,
        onSuccess: function (_, notificationId) {
            queryClient.setQueryData(notificationKeys.list(filters), function (old) {
                if (!old)
                    return old;
                var filteredNotifications = old.notifications.filter(function (notification) { return notification.id !== notificationId; });
                return __assign(__assign({}, old), { notifications: filteredNotifications, total: old.total - 1, unreadCount: filteredNotifications.filter(function (n) { return !n.isRead; }).length });
            });
        }
    });
    // Actions
    var markAsRead = (0, react_1.useCallback)(function (notificationIds) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, markAsReadMutation.mutateAsync(notificationIds)];
        });
    }); }, [markAsReadMutation]);
    var markAllAsRead = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, markAllAsReadMutation.mutateAsync()];
        });
    }); }, [markAllAsReadMutation]);
    var deleteNotification = (0, react_1.useCallback)(function (notificationId) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, deleteNotificationMutation.mutateAsync(notificationId)];
        });
    }); }, [deleteNotificationMutation]);
    return {
        notifications: (data === null || data === void 0 ? void 0 : data.notifications) || [],
        total: (data === null || data === void 0 ? void 0 : data.total) || 0,
        unreadCount: (data === null || data === void 0 ? void 0 : data.unreadCount) || 0,
        hasMore: (data === null || data === void 0 ? void 0 : data.hasMore) || false,
        isLoading: isLoading,
        error: error,
        refetch: refetch,
        markAsRead: markAsRead,
        markAllAsRead: markAllAsRead,
        deleteNotification: deleteNotification,
        isMarkingAsRead: markAsReadMutation.isPending,
        isMarkingAllAsRead: markAllAsReadMutation.isPending,
        isDeleting: deleteNotificationMutation.isPending
    };
}
// Hook for notification settings
function useNotificationSettings() {
    var _this = this;
    var queryClient = (0, react_query_1.useQueryClient)();
    var _a = (0, react_query_1.useQuery)({
        queryKey: notificationKeys.settings(),
        queryFn: notificationsAPI.getSettings,
        staleTime: 5 * 60 * 1000, // 5 minutes
    }), settings = _a.data, isLoading = _a.isLoading, error = _a.error;
    var updateSettingsMutation = (0, react_query_1.useMutation)({
        mutationFn: notificationsAPI.updateSettings,
        onSuccess: function (updatedSettings) {
            queryClient.setQueryData(notificationKeys.settings(), updatedSettings);
        }
    });
    var updateSettings = (0, react_1.useCallback)(function (newSettings) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, updateSettingsMutation.mutateAsync(newSettings)];
        });
    }); }, [updateSettingsMutation]);
    return {
        settings: settings,
        isLoading: isLoading,
        error: error,
        updateSettings: updateSettings,
        isUpdating: updateSettingsMutation.isPending,
        updateError: updateSettingsMutation.error
    };
}
// Hook for unread notification count
function useUnreadNotificationCount() {
    var _a = (0, react_1.useState)(0), unreadCount = _a[0], setUnreadCount = _a[1];
    var data = (0, react_query_1.useQuery)({
        queryKey: notificationKeys.list({}),
        queryFn: function () { return notificationsAPI.getNotifications({}, 1, 1); },
        staleTime: 30000,
        select: function (data) { return data.unreadCount; }
    }).data;
    var newNotification = (0, websocket_client_1.useWebSocketMessage)('new_notification').lastMessage;
    (0, react_1.useEffect)(function () {
        if (data !== undefined) {
            setUnreadCount(data);
        }
    }, [data]);
    (0, react_1.useEffect)(function () {
        if (newNotification) {
            setUnreadCount(function (prev) { return prev + 1; });
        }
    }, [newNotification]);
    return unreadCount;
}
// Helper function to show browser notifications
function showBrowserNotification(notification) {
    var _a;
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }
    // Don't show browser notification for low priority notifications
    if (notification.priority === 'low') {
        return;
    }
    var options = {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
    };
    // Note: 'image' property is not standard in all browsers
    if ((_a = notification.data) === null || _a === void 0 ? void 0 : _a.imageUrl) {
        options.image = notification.data.imageUrl;
    }
    var browserNotification = new Notification(notification.title, options);
    // Handle notification click
    browserNotification.onclick = function () {
        var _a;
        window.focus();
        if ((_a = notification.data) === null || _a === void 0 ? void 0 : _a.actionUrl) {
            window.location.href = notification.data.actionUrl;
        }
        browserNotification.close();
    };
    // Auto-close after 5 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
        setTimeout(function () {
            browserNotification.close();
        }, 5000);
    }
}
// Hook to request notification permission
function useNotificationPermission() {
    var _this = this;
    var _a = (0, react_1.useState)('default'), permission = _a[0], setPermission = _a[1];
    (0, react_1.useEffect)(function () {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);
    var requestPermission = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!('Notification' in window)) {
                        throw new Error('This browser does not support notifications');
                    }
                    return [4 /*yield*/, Notification.requestPermission()];
                case 1:
                    result = _a.sent();
                    setPermission(result);
                    return [2 /*return*/, result];
            }
        });
    }); }, []);
    return {
        permission: permission,
        requestPermission: requestPermission,
        isSupported: 'Notification' in window,
        isGranted: permission === 'granted',
        isDenied: permission === 'denied'
    };
}
