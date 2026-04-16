"use strict";
/**
 * Notification Center Component
 * Displays notifications with real-time updates and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationCenter = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var useNotifications_1 = require("../hooks/useNotifications");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var badge_1 = require("../../local/components/ui/badge");
var scroll_area_1 = require("../../local/components/ui/scroll-area");
var tabs_1 = require("../../local/components/ui/tabs");
var tooltip_1 = require("../../local/components/ui/tooltip");
var NotificationItem = function (_a) {
    var notification = _a.notification, onMarkAsRead = _a.onMarkAsRead, onDelete = _a.onDelete, onClick = _a.onClick;
    var getNotificationIcon = function (type) {
        switch (type) {
            case 'new_message':
                return <lucide_react_1.MessageSquare className="w-5 h-5 text-blue-500"/>;
            case 'property_update':
                return <lucide_react_1.Home className="w-5 h-5 text-green-500"/>;
            case 'verification_status':
                return <lucide_react_1.Shield className="w-5 h-5 text-purple-500"/>;
            case 'appointment_reminder':
                return <lucide_react_1.Calendar className="w-5 h-5 text-orange-500"/>;
            case 'system_alert':
                return <lucide_react_1.Info className="w-5 h-5 text-blue-500"/>;
            case 'security_alert':
                return <lucide_react_1.AlertTriangle className="w-5 h-5 text-red-500"/>;
            default:
                return <lucide_react_1.Bell className="w-5 h-5 text-gray-500"/>;
        }
    };
    var getPriorityColor = function (priority) {
        switch (priority) {
            case 'urgent':
                return 'border-l-red-500 bg-red-50';
            case 'high':
                return 'border-l-orange-500 bg-orange-50';
            case 'medium':
                return 'border-l-blue-500 bg-blue-50';
            default:
                return 'border-l-gray-300 bg-gray-50';
        }
    };
    var formatTime = function (dateString) {
        var date = new Date(dateString);
        var now = new Date();
        var diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        if (diffInHours < 1) {
            var minutes = Math.floor(diffInHours * 60);
            return "".concat(minutes, "m ago");
        }
        else if (diffInHours < 24) {
            return "".concat(Math.floor(diffInHours), "h ago");
        }
        else {
            return date.toLocaleDateString();
        }
    };
    return (<div className={"p-4 border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ".concat(!notification.isRead ? getPriorityColor(notification.priority) : 'border-l-gray-200 bg-white')} onClick={function () { return onClick === null || onClick === void 0 ? void 0 : onClick(notification); }}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={"text-sm font-medium ".concat(!notification.isRead ? 'text-gray-900' : 'text-gray-600')}>
                {notification.title}
              </h4>
              <p className={"text-sm mt-1 ".concat(!notification.isRead ? 'text-gray-700' : 'text-gray-500')}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {formatTime(notification.createdAt)}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              {!notification.isRead && (<tooltip_1.TooltipProvider>
                  <tooltip_1.Tooltip>
                    <tooltip_1.TooltipTrigger asChild>
                      <button_1.Button variant="ghost" size="sm" onClick={function (e) {
                e.stopPropagation();
                onMarkAsRead(notification.id);
            }}>
                        <lucide_react_1.Check className="w-3 h-3"/>
                      </button_1.Button>
                    </tooltip_1.TooltipTrigger>
                    <tooltip_1.TooltipContent>Mark as read</tooltip_1.TooltipContent>
                  </tooltip_1.Tooltip>
                </tooltip_1.TooltipProvider>)}
              
              <tooltip_1.TooltipProvider>
                <tooltip_1.Tooltip>
                  <tooltip_1.TooltipTrigger asChild>
                    <button_1.Button variant="ghost" size="sm" onClick={function (e) {
            e.stopPropagation();
            onDelete(notification.id);
        }}>
                      <lucide_react_1.X className="w-3 h-3"/>
                    </button_1.Button>
                  </tooltip_1.TooltipTrigger>
                  <tooltip_1.TooltipContent>Delete</tooltip_1.TooltipContent>
                </tooltip_1.Tooltip>
              </tooltip_1.TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>);
};
var NotificationCenter = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, _b = _a.className, className = _b === void 0 ? '' : _b;
    var _c = (0, react_1.useState)('all'), activeTab = _c[0], setActiveTab = _c[1];
    var allNotifications = (0, useNotifications_1.useNotifications)();
    var unreadNotifications = (0, useNotifications_1.useNotifications)({ isRead: false });
    var messageNotifications = (0, useNotifications_1.useNotifications)({ type: 'new_message' });
    var systemNotifications = (0, useNotifications_1.useNotifications)({
        type: 'system_alert'
    });
    var handleNotificationClick = (0, react_1.useCallback)(function (notification) {
        var _a;
        // Mark as read if not already read
        if (!notification.isRead) {
            allNotifications.markAsRead([notification.id]);
        }
        // Navigate to action URL if provided
        if ((_a = notification.data) === null || _a === void 0 ? void 0 : _a.actionUrl) {
            window.location.href = notification.data.actionUrl;
        }
        onClose();
    }, [allNotifications, onClose]);
    var handleMarkAsRead = (0, react_1.useCallback)(function (notificationId) {
        allNotifications.markAsRead([notificationId]);
    }, [allNotifications]);
    var handleDelete = (0, react_1.useCallback)(function (notificationId) {
        allNotifications.deleteNotification(notificationId);
    }, [allNotifications]);
    var handleMarkAllAsRead = (0, react_1.useCallback)(function () {
        allNotifications.markAllAsRead();
    }, [allNotifications]);
    var getCurrentNotifications = function () {
        switch (activeTab) {
            case 'unread':
                return unreadNotifications;
            case 'messages':
                return messageNotifications;
            case 'system':
                return systemNotifications;
            default:
                return allNotifications;
        }
    };
    var currentNotifications = getCurrentNotifications();
    if (!isOpen)
        return null;
    return (<div className={"fixed inset-0 z-50 ".concat(className)}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20" onClick={onClose}/>
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l">
        <card_1.Card className="h-full rounded-none border-0">
          <card_1.CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Bell className="w-5 h-5"/>
                Notifications
                {allNotifications.unreadCount > 0 && (<badge_1.Badge variant="secondary">
                    {allNotifications.unreadCount}
                  </badge_1.Badge>)}
              </card_1.CardTitle>
              
              <div className="flex items-center gap-2">
                {allNotifications.unreadCount > 0 && (<tooltip_1.TooltipProvider>
                    <tooltip_1.Tooltip>
                      <tooltip_1.TooltipTrigger asChild>
                        <button_1.Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={allNotifications.isMarkingAllAsRead}>
                          <lucide_react_1.CheckCheck className="w-4 h-4"/>
                        </button_1.Button>
                      </tooltip_1.TooltipTrigger>
                      <tooltip_1.TooltipContent>Mark all as read</tooltip_1.TooltipContent>
                    </tooltip_1.Tooltip>
                  </tooltip_1.TooltipProvider>)}
                
                <button_1.Button variant="ghost" size="sm">
                  <lucide_react_1.Settings className="w-4 h-4"/>
                </button_1.Button>
                
                <button_1.Button variant="ghost" size="sm" onClick={onClose}>
                  <lucide_react_1.X className="w-4 h-4"/>
                </button_1.Button>
              </div>
            </div>
          </card_1.CardHeader>

          <card_1.CardContent className="p-0 flex-1 overflow-hidden">
            <tabs_1.Tabs value={activeTab} onValueChange={function (value) { return setActiveTab(value); }}>
              <tabs_1.TabsList className="w-full rounded-none border-b">
                <tabs_1.TabsTrigger value="all" className="flex-1">
                  All
                  {allNotifications.total > 0 && (<badge_1.Badge variant="secondary" className="ml-1 text-xs">
                      {allNotifications.total}
                    </badge_1.Badge>)}
                </tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="unread" className="flex-1">
                  Unread
                  {allNotifications.unreadCount > 0 && (<badge_1.Badge variant="secondary" className="ml-1 text-xs">
                      {allNotifications.unreadCount}
                    </badge_1.Badge>)}
                </tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="messages" className="flex-1">
                  Messages
                </tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="system" className="flex-1">
                  System
                </tabs_1.TabsTrigger>
              </tabs_1.TabsList>

              <tabs_1.TabsContent value={activeTab} className="mt-0 h-full">
                <scroll_area_1.ScrollArea className="h-[calc(100vh-200px)]">
                  {currentNotifications.isLoading ? (<div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"/>
                    </div>) : currentNotifications.notifications.length === 0 ? (<div className="flex flex-col items-center justify-center h-32 text-gray-500">
                      <lucide_react_1.BellOff className="w-8 h-8 mb-2"/>
                      <p>No notifications</p>
                    </div>) : (<div>
                      {currentNotifications.notifications.map(function (notification) { return (<NotificationItem key={notification.id} notification={notification} onMarkAsRead={handleMarkAsRead} onDelete={handleDelete} onClick={handleNotificationClick}/>); })}
                      
                      {currentNotifications.hasMore && (<div className="p-4 text-center">
                          <button_1.Button variant="outline" size="sm">
                            Load More
                          </button_1.Button>
                        </div>)}
                    </div>)}
                </scroll_area_1.ScrollArea>
              </tabs_1.TabsContent>
            </tabs_1.Tabs>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
};
exports.NotificationCenter = NotificationCenter;
