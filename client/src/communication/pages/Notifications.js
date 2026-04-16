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
exports.default = Notifications;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var badge_1 = require("../../local/components/ui/badge");
var switch_1 = require("../../local/components/ui/switch");
var label_1 = require("../../local/components/ui/label");
var use_toast_1 = require("../../local/hooks/use-toast");
// Mock notifications data
var mockNotifications = [
    {
        id: '1',
        type: 'verification',
        title: 'Property Verification Complete',
        message: 'Your property "3BR Apartment in Westlands" has been successfully verified and is now live.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        isRead: false,
        isImportant: true,
        actionUrl: '/property/prop-1',
        metadata: {
            propertyId: 'prop-1',
            propertyTitle: '3BR Apartment in Westlands'
        }
    },
    {
        id: '2',
        type: 'message',
        title: 'New Message from John Kamau',
        message: 'Regarding your inquiry about the villa in Karen - I have some additional information to share.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        isRead: false,
        isImportant: false,
        actionUrl: '/messages',
        metadata: {
            senderId: 'user-123',
            senderName: 'John Kamau'
        }
    },
    {
        id: '3',
        type: 'alert',
        title: 'Suspicious Activity Detected',
        message: 'We detected unusual activity on a property you viewed. Our fraud detection system flagged potential issues.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        isRead: true,
        isImportant: true,
        actionUrl: '/trust/fraud-detection',
        metadata: {
            propertyId: 'prop-2'
        }
    },
    {
        id: '4',
        type: 'property',
        title: 'New Property Match',
        message: 'A new verified property matching your search criteria has been listed in Nairobi.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        isRead: true,
        isImportant: false,
        actionUrl: '/properties',
    },
    {
        id: '5',
        type: 'system',
        title: 'Account Security Update',
        message: 'Your account security settings have been updated successfully.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        isRead: true,
        isImportant: false,
        actionUrl: '/settings',
    }
];
var getNotificationIcon = function (type) {
    switch (type) {
        case 'property': return lucide_react_1.Home;
        case 'verification': return lucide_react_1.Shield;
        case 'message': return lucide_react_1.MessageSquare;
        case 'alert': return lucide_react_1.AlertTriangle;
        case 'system': return lucide_react_1.Settings;
        default: return lucide_react_1.Bell;
    }
};
var getNotificationColor = function (type) {
    switch (type) {
        case 'property': return 'text-blue-500';
        case 'verification': return 'text-green-500';
        case 'message': return 'text-purple-500';
        case 'alert': return 'text-red-500';
        case 'system': return 'text-gray-500';
        default: return 'text-gray-500';
    }
};
function Notifications() {
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(mockNotifications), notifications = _a[0], setNotifications = _a[1];
    var _b = (0, react_1.useState)('all'), filter = _b[0], setFilter = _b[1];
    var _c = (0, react_1.useState)(false), showSettings = _c[0], setShowSettings = _c[1];
    var _d = (0, react_1.useState)({
        emailNotifications: true,
        pushNotifications: true,
        propertyAlerts: true,
        verificationUpdates: true,
        messageNotifications: true,
        marketingEmails: false,
    }), settings = _d[0], setSettings = _d[1];
    // Filter notifications
    var filteredNotifications = (0, react_1.useMemo)(function () {
        switch (filter) {
            case 'unread':
                return notifications.filter(function (n) { return !n.isRead; });
            case 'important':
                return notifications.filter(function (n) { return n.isImportant; });
            default:
                return notifications;
        }
    }, [notifications, filter]);
    var unreadCount = notifications.filter(function (n) { return !n.isRead; }).length;
    var handleMarkAsRead = (0, react_1.useCallback)(function (id) {
        setNotifications(function (prev) {
            return prev.map(function (n) { return n.id === id ? __assign(__assign({}, n), { isRead: true }) : n; });
        });
    }, []);
    var handleMarkAllAsRead = (0, react_1.useCallback)(function () {
        setNotifications(function (prev) { return prev.map(function (n) { return (__assign(__assign({}, n), { isRead: true })); }); });
        toast({
            title: 'All notifications marked as read',
            description: "".concat(unreadCount, " notifications marked as read."),
        });
    }, [unreadCount, toast]);
    var handleDeleteNotification = (0, react_1.useCallback)(function (id) {
        setNotifications(function (prev) { return prev.filter(function (n) { return n.id !== id; }); });
        toast({
            title: 'Notification deleted',
            description: 'The notification has been removed.',
        });
    }, [toast]);
    var handleNotificationClick = (0, react_1.useCallback)(function (notification) {
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }
        if (notification.actionUrl) {
            // In a real app, this would navigate to the URL
            window.location.href = notification.actionUrl;
        }
    }, [handleMarkAsRead]);
    var formatTime = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / (1000 * 60));
        var hours = Math.floor(diff / (1000 * 60 * 60));
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (minutes < 60)
            return "".concat(minutes, "m ago");
        if (hours < 24)
            return "".concat(hours, "h ago");
        if (days < 7)
            return "".concat(days, "d ago");
        return date.toLocaleDateString();
    };
    var updateSetting = (0, react_1.useCallback)(function (key, value) {
        setSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
        toast({
            title: 'Settings updated',
            description: 'Your notification preferences have been saved.',
        });
    }, [toast]);
    if (showSettings) {
        return (<div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button_1.Button variant="ghost" onClick={function () { return setShowSettings(false); }}>
                ← Back to Notifications
              </button_1.Button>
            </div>
            <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
            <p className="text-muted-foreground">
              Manage how and when you receive notifications
            </p>
          </div>

          <div className="max-w-2xl">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Notification Preferences</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label_1.Label htmlFor="email-notifications" className="text-base font-medium">
                      Email Notifications
                    </label_1.Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <switch_1.Switch id="email-notifications" checked={settings.emailNotifications} onCheckedChange={function (checked) { return updateSetting('emailNotifications', checked); }}/>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label_1.Label htmlFor="push-notifications" className="text-base font-medium">
                      Push Notifications
                    </label_1.Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <switch_1.Switch id="push-notifications" checked={settings.pushNotifications} onCheckedChange={function (checked) { return updateSetting('pushNotifications', checked); }}/>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label_1.Label htmlFor="property-alerts" className="text-base font-medium">
                      Property Alerts
                    </label_1.Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new properties matching your criteria
                    </p>
                  </div>
                  <switch_1.Switch id="property-alerts" checked={settings.propertyAlerts} onCheckedChange={function (checked) { return updateSetting('propertyAlerts', checked); }}/>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label_1.Label htmlFor="verification-updates" className="text-base font-medium">
                      Verification Updates
                    </label_1.Label>
                    <p className="text-sm text-muted-foreground">
                      Updates about property verification status
                    </p>
                  </div>
                  <switch_1.Switch id="verification-updates" checked={settings.verificationUpdates} onCheckedChange={function (checked) { return updateSetting('verificationUpdates', checked); }}/>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label_1.Label htmlFor="message-notifications" className="text-base font-medium">
                      Message Notifications
                    </label_1.Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for new messages and replies
                    </p>
                  </div>
                  <switch_1.Switch id="message-notifications" checked={settings.messageNotifications} onCheckedChange={function (checked) { return updateSetting('messageNotifications', checked); }}/>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label_1.Label htmlFor="marketing-emails" className="text-base font-medium">
                      Marketing Emails
                    </label_1.Label>
                    <p className="text-sm text-muted-foreground">
                      Promotional emails and product updates
                    </p>
                  </div>
                  <switch_1.Switch id="marketing-emails" checked={settings.marketingEmails} onCheckedChange={function (checked) { return updateSetting('marketingEmails', checked); }}/>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <lucide_react_1.Bell className="w-8 h-8"/>
                Notifications
                {unreadCount > 0 && (<badge_1.Badge variant="destructive">{unreadCount}</badge_1.Badge>)}
              </h1>
              <p className="text-muted-foreground">
                Stay updated with your property activities and messages
              </p>
            </div>
            <button_1.Button variant="outline" onClick={function () { return setShowSettings(true); }} className="flex items-center gap-2">
              <lucide_react_1.Settings className="w-4 h-4"/>
              Settings
            </button_1.Button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {['all', 'unread', 'important'].map(function (f) { return (<button_1.Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm" onClick={function () { return setFilter(f); }} className="capitalize">
                  {f}
                  {f === 'unread' && unreadCount > 0 && (<badge_1.Badge variant="secondary" className="ml-2">
                      {unreadCount}
                    </badge_1.Badge>)}
                </button_1.Button>); })}
            </div>

            {unreadCount > 0 && (<button_1.Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="flex items-center gap-2">
                <lucide_react_1.CheckCheck className="w-4 h-4"/>
                Mark all as read
              </button_1.Button>)}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (<card_1.Card>
              <card_1.CardContent className="py-12 text-center">
                <lucide_react_1.Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                <h3 className="font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {filter === 'unread' ? 'All caught up! No unread notifications.' :
                filter === 'important' ? 'No important notifications at the moment.' :
                    'You have no notifications yet.'}
                </p>
              </card_1.CardContent>
            </card_1.Card>) : (filteredNotifications.map(function (notification) {
            var IconComponent = getNotificationIcon(notification.type);
            var iconColor = getNotificationColor(notification.type);
            return (<card_1.Card key={notification.id} className={"cursor-pointer transition-all hover:shadow-md ".concat(!notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : '')} onClick={function () { return handleNotificationClick(notification); }}>
                  <card_1.CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={"p-2 rounded-full bg-muted ".concat(iconColor)}>
                        <IconComponent className="w-5 h-5"/>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className={"font-semibold ".concat(!notification.isRead ? 'text-foreground' : 'text-muted-foreground')}>
                              {notification.title}
                            </h3>
                            {notification.isImportant && (<lucide_react_1.Star className="w-4 h-4 text-yellow-500"/>)}
                            {!notification.isRead && (<div className="w-2 h-2 bg-primary rounded-full"/>)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.timestamp)}
                            </span>
                            <button_1.Button variant="ghost" size="sm" onClick={function (e) {
                    e.stopPropagation();
                    handleDeleteNotification(notification.id);
                }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <lucide_react_1.Trash2 className="w-4 h-4"/>
                            </button_1.Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>

                        {notification.metadata && (<div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {notification.metadata.propertyTitle && (<span>Property: {notification.metadata.propertyTitle}</span>)}
                            {notification.metadata.senderName && (<span>From: {notification.metadata.senderName}</span>)}
                          </div>)}
                      </div>

                      <div className="flex flex-col gap-2">
                        {!notification.isRead && (<button_1.Button variant="ghost" size="sm" onClick={function (e) {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                    }} title="Mark as read">
                            <lucide_react_1.Eye className="w-4 h-4"/>
                          </button_1.Button>)}
                      </div>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>);
        }))}
        </div>
      </div>
    </div>);
}
