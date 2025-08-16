import { Bell, Check, X, AlertCircle, Info, CheckCircle } from "lucide-react";
import React, { useState, useCallback, useRef } from "react";

import { EnterpriseVirtualizedList } from "../../shared/components";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card";
import { useNotificationListVirtualization } from "../../shared/hooks/useMemoryOptimization";

// Use the BaseEntity interface that matches the virtualization hook
interface BaseEntity {
  id: string | number;
  [key: string]: unknown;
}

interface Notification extends BaseEntity {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface UserNotificationsProps {
  readonly notifications?: Notification[];
  readonly onMarkAsRead?: (id: string) => void;
  readonly onMarkAllAsRead?: () => void;
  readonly onDismiss?: (id: string) => void;
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

// Virtualized Notifications List Component
const VirtualizedNotificationsList: React.FC<{
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}> = ({ notifications, onMarkAsRead }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100;
        setContainerHeight(Math.max(300, Math.min(500, availableHeight)));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const listProps = useNotificationListVirtualization(
    notifications as readonly BaseEntity[],
    containerHeight,
    90 // notification item height
  );

  const renderNotificationItem = useCallback((item: BaseEntity, _index: number, style: React.CSSProperties) => {
    const notification = item as Notification;
    const Icon = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);
    
    return (
      <div className="notification-item p-1" style={style}>
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
            notification.read ? 'bg-muted/30' : 'bg-background border-primary/20'
          }`}
        >
          <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{notification.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
              </div>
              <div className="flex items-center gap-1">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(String(notification.id))}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <div className={`w-2 h-2 rounded-full bg-primary ${notification.read ? 'notification-read-indicator' : 'notification-unread-indicator'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [onMarkAsRead]);

  return (
    <div ref={containerRef} className="w-full">
      <EnterpriseVirtualizedList
        {...listProps}
        renderItem={renderNotificationItem}
      />
    </div>
  );
};

export function UserNotifications({ 
  notifications = [], 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDismiss: _onDismiss 
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
          <VirtualizedNotificationsList 
            notifications={localNotifications}
            onMarkAsRead={handleMarkAsRead}
          />
        )}
      </CardContent>
    </Card>
  );
}