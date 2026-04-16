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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNotifications = UserNotifications;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var components_1 = require("../../local/components");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var useMemoryOptimization_1 = require("../../local/hooks/useMemoryOptimization");
var getNotificationIcon = function (type) {
    switch (type) {
        case 'success':
            return lucide_react_1.CheckCircle;
        case 'warning':
            return lucide_react_1.AlertCircle;
        case 'error':
            return lucide_react_1.X;
        default:
            return lucide_react_1.Info;
    }
};
var getNotificationColor = function (type) {
    switch (type) {
        case 'success':
            return 'text-green-600';
        case 'warning':
            return 'text-yellow-600';
        case 'error':
            return 'text-red-600';
        default:
            return 'text-blue-600';
    }
};
// Virtualized Notifications List Component
var VirtualizedNotificationsList = function (_a) {
    var notifications = _a.notifications, onMarkAsRead = _a.onMarkAsRead;
    var containerRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(400), containerHeight = _b[0], setContainerHeight = _b[1];
    react_1.default.useEffect(function () {
        var updateHeight = function () {
            if (containerRef.current) {
                var rect = containerRef.current.getBoundingClientRect();
                var availableHeight = window.innerHeight - rect.top - 100;
                setContainerHeight(Math.max(300, Math.min(500, availableHeight)));
            }
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return function () { return window.removeEventListener('resize', updateHeight); };
    }, []);
    var listProps = (0, useMemoryOptimization_1.useNotificationListVirtualization)(notifications, containerHeight, 90 // notification item height
    );
    var renderNotificationItem = (0, react_1.useCallback)(function (item, _index, style) {
        var notification = item;
        var Icon = getNotificationIcon(notification.type);
        var iconColor = getNotificationColor(notification.type);
        return (<div className="notification-item p-1" style={style}>
        <div className={"flex items-start gap-3 p-3 rounded-lg border transition-colors ".concat(notification.read ? 'bg-muted/30' : 'bg-background border-primary/20')}>
          <Icon className={"h-5 w-5 mt-0.5 ".concat(iconColor)}/>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
              </div>
              <div className="flex items-center gap-1">
                {!notification.read && (<button_1.Button variant="ghost" size="sm" onClick={function () { return onMarkAsRead(String(notification.id)); }} className="h-8 w-8 p-0">
                    <lucide_react_1.Check className="h-4 w-4"/>
                  </button_1.Button>)}
                <div className={"w-2 h-2 rounded-full bg-primary ".concat(notification.read ? 'notification-read-indicator' : 'notification-unread-indicator')}/>
              </div>
            </div>
          </div>
        </div>
      </div>);
    }, [onMarkAsRead]);
    return (<div ref={containerRef} className="w-full">
      <components_1.EnterpriseVirtualizedList {...listProps} renderItem={renderNotificationItem}/>
    </div>);
};
function UserNotifications(_a) {
    var _b = _a.notifications, notifications = _b === void 0 ? [] : _b, onMarkAsRead = _a.onMarkAsRead, onMarkAllAsRead = _a.onMarkAllAsRead, _onDismiss = _a.onDismiss;
    var _c = (0, react_1.useState)(notifications), localNotifications = _c[0], setLocalNotifications = _c[1];
    var unreadCount = Array.isArray(localNotifications) ? localNotifications.filter(function (n) { return n && !n.read; }).length : 0;
    var handleMarkAsRead = function (id) {
        setLocalNotifications(function (prev) {
            return Array.isArray(prev) ? prev.map(function (n) { return n && n.id === id ? __assign(__assign({}, n), { read: true }) : n; }) : [];
        });
        onMarkAsRead === null || onMarkAsRead === void 0 ? void 0 : onMarkAsRead(id);
    };
    var handleMarkAllAsRead = function () {
        setLocalNotifications(function (prev) {
            return Array.isArray(prev) ? prev.map(function (n) { return n ? __assign(__assign({}, n), { read: true }) : n; }) : [];
        });
        onMarkAllAsRead === null || onMarkAllAsRead === void 0 ? void 0 : onMarkAllAsRead();
    };
    return (<card_1.Card>
      <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <card_1.CardTitle className="flex items-center gap-2">
          <lucide_react_1.Bell className="h-5 w-5"/>
          Notifications
          {unreadCount > 0 && (<badge_1.Badge variant="destructive" className="ml-2">
              {unreadCount}
            </badge_1.Badge>)}
        </card_1.CardTitle>
        {unreadCount > 0 && (<button_1.Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark All Read
          </button_1.Button>)}
      </card_1.CardHeader>
      <card_1.CardContent>
        {localNotifications.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
            <lucide_react_1.Bell className="h-12 w-12 mx-auto mb-4 opacity-50"/>
            <p>No notifications</p>
          </div>) : (<VirtualizedNotificationsList notifications={localNotifications} onMarkAsRead={handleMarkAsRead}/>)}
      </card_1.CardContent>
    </card_1.Card>);
}
