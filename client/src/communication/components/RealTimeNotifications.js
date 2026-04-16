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
exports.RealTimeNotifications = RealTimeNotifications;
exports.useNotificationPermission = useNotificationPermission;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var useAuth_1 = require("../../auth/hooks/useAuth");
var useCleanupManager_1 = require("../../infrastructure/hooks/useCleanupManager");
var useSafeEffect_1 = require("../../infrastructure/hooks/useSafeEffect");
var websocket_client_1 = require("../../infrastructure/realtime/websocket-client");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
function RealTimeNotifications(_a) {
    var _b = _a.maxVisible, maxVisible = _b === void 0 ? 5 : _b, _c = _a.autoHideDelay, autoHideDelay = _c === void 0 ? 5000 : _c, _d = _a.position, position = _d === void 0 ? 'top-right' : _d;
    var user = (0, useAuth_1.useAuth)().user;
    var lastMessage = (0, websocket_client_1.useWebSocketMessage)('notification').lastMessage;
    var _e = (0, react_1.useState)([]), notifications = _e[0], setNotifications = _e[1];
    var _f = (0, react_1.useState)(false), isMinimized = _f[0], setIsMinimized = _f[1];
    var cleanupManager = (0, useCleanupManager_1.useEnhancedCleanupManager)();
    // Handle new notifications from WebSocket
    (0, useSafeEffect_1.useSafeEffect)(function () {
        if ((lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.payload) && user) {
            var notification_1 = lastMessage.payload;
            // Only show notifications for the current user
            if (notification_1.userId === user.id) {
                setNotifications(function (prev) {
                    var newNotifications = __spreadArray([notification_1], prev, true);
                    return newNotifications.slice(0, maxVisible);
                });
                // Auto-hide low priority notifications
                if (notification_1.priority === 'low' && autoHideDelay > 0) {
                    cleanupManager.addTimeout(function () {
                        handleDismiss(notification_1.id);
                    }, autoHideDelay, "auto-hide-".concat(notification_1.id));
                }
                // Show browser notification for high priority
                if (notification_1.priority === 'high' || notification_1.priority === 'urgent') {
                    showBrowserNotification(notification_1);
                }
            }
        }
    }, [lastMessage, user, maxVisible, autoHideDelay, cleanupManager]);
    var showBrowserNotification = function (notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/assets/Artmark.svg',
                tag: notification.id,
            });
        }
    };
    var handleDismiss = function (notificationId) {
        setNotifications(function (prev) { return prev.filter(function (n) { return n.id !== notificationId; }); });
    };
    var handleMarkAsRead = function (notificationId) {
        setNotifications(function (prev) {
            return prev.map(function (n) { return n.id === notificationId ? __assign(__assign({}, n), { isRead: true }) : n; });
        });
    };
    var handleAction = function (notification) {
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
        handleDismiss(notification.id);
    };
    var getNotificationIcon = function (type) {
        switch (type) {
            case 'message':
                return <lucide_react_1.MessageSquare className="h-4 w-4"/>;
            case 'property_update':
                return <lucide_react_1.Home className="h-4 w-4"/>;
            case 'trust_alert':
                return <lucide_react_1.AlertTriangle className="h-4 w-4"/>;
            case 'verification':
                return <lucide_react_1.Check className="h-4 w-4"/>;
            case 'system':
            default:
                return <lucide_react_1.Info className="h-4 w-4"/>;
        }
    };
    var getPriorityColor = function (priority) {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'low':
            default:
                return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };
    var getPositionClasses = function () {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'top-right':
            default:
                return 'top-4 right-4';
        }
    };
    if (notifications.length === 0) {
        return null;
    }
    return (<div className={"fixed ".concat(getPositionClasses(), " z-50 space-y-2 max-w-sm w-full")}>
      {/* Header with minimize/expand */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <lucide_react_1.Bell className="h-4 w-4"/>
          <span className="text-sm font-medium">Notifications</span>
          <badge_1.Badge variant="secondary">{notifications.length}</badge_1.Badge>
        </div>
        <button_1.Button variant="ghost" size="sm" onClick={function () { return setIsMinimized(!isMinimized); }}>
          {isMinimized ? 'Show' : 'Hide'}
        </button_1.Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {!isMinimized && notifications.map(function (notification) { return (<div key={notification.id} className="animate-in slide-in-from-right-full duration-300 ease-out">
            <card_1.Card className={"shadow-lg border-l-4 ".concat(!notification.isRead ? 'bg-white' : 'bg-gray-50')}>
              <card_1.CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <card_1.CardTitle className="text-sm font-medium truncate">
                        {notification.title}
                      </card_1.CardTitle>
                      <badge_1.Badge variant="outline" className={"text-xs mt-1 ".concat(getPriorityColor(notification.priority))}>
                        {notification.priority}
                      </badge_1.Badge>
                    </div>
                  </div>
                  <button_1.Button variant="ghost" size="sm" onClick={function () { return handleDismiss(notification.id); }} className="h-6 w-6 p-0">
                    <lucide_react_1.X className="h-3 w-3"/>
                  </button_1.Button>
                </div>
              </card_1.CardHeader>
              <card_1.CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {!notification.isRead && (<button_1.Button variant="outline" size="sm" onClick={function () { return handleMarkAsRead(notification.id); }} className="h-6 px-2 text-xs">
                        <lucide_react_1.Check className="h-3 w-3 mr-1"/>
                        Mark Read
                      </button_1.Button>)}
                    
                    {notification.actionUrl && (<button_1.Button variant="default" size="sm" onClick={function () { return handleAction(notification); }} className="h-6 px-2 text-xs">
                        {notification.actionLabel || 'View'}
                      </button_1.Button>)}
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>); })}
      </div>
    </div>);
}
// Hook for managing notification permissions
function useNotificationPermission() {
    var _this = this;
    var _a = (0, react_1.useState)('default'), permission = _a[0], setPermission = _a[1];
    (0, useSafeEffect_1.useSafeEffect)(function () {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);
    var requestPermission = function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!('Notification' in window)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Notification.requestPermission()];
                case 1:
                    result = _a.sent();
                    setPermission(result);
                    return [2 /*return*/, result];
                case 2: return [2 /*return*/, 'denied'];
            }
        });
    }); };
    return {
        permission: permission,
        requestPermission: requestPermission,
        isSupported: 'Notification' in window,
    };
}
