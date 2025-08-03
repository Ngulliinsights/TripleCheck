import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Bell, Check, X, AlertCircle, Info, CheckCircle } from "lucide-react";
import { useState } from "react";

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface UserNotificationsProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertCircle;
    case 'error':
      return X;
    default:
      return Info;
  }
};

const getNotificationColor = (type: Notification['type']) => {
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

export function UserNotifications({ 
  notifications = [], 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDismiss 
}: UserNotificationsProps) {
  const [localNotifications, setLocalNotifications] = useState(notifications);
  
  const unreadCount = Array.isArray(localNotifications) ? localNotifications.filter(n => n && !n.read).length : 0;

  const handleMarkAsRead = (id: string) => {
    setLocalNotifications(prev => 
      Array.isArray(prev) ? prev.map(n => n && n.id === id ? { ...n, read: true } : n) : []
    );
    onMarkAsRead?.(id);
  };

  const handleMarkAllAsRead = () => {
    setLocalNotifications(prev => 
      Array.isArray(prev) ? prev.map(n => n ? { ...n, read: true } : n) : []
    );
    onMarkAllAsRead?.();
  };

  const handleDismiss = (id: string) => {
    setLocalNotifications(prev => 
      Array.isArray(prev) ? prev.filter(n => n && n.id !== id) : []
    );
    onDismiss?.(id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark All Read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {localNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    notification.read ? 'bg-muted/30' : 'bg-background border-primary/20'
                  }`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className={`font-medium text-sm ${
                          notification.read ? 'text-muted-foreground' : 'text-foreground'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          notification.read ? 'text-muted-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.timestamp}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(notification.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}