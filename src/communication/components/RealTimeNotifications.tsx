import { Bell, X, Check, AlertTriangle, Info, MessageSquare, Home } from 'lucide-react';
import React, { useState } from 'react';

import { useAuth } from '../../auth/hooks/useAuth';
import { useEnhancedCleanupManager } from '../../infrastructure/hooks/useCleanupManager';
import { useSafeEffect } from '../../infrastructure/hooks/useSafeEffect';
import { useWebSocketMessage } from '../../infrastructure/realtime/websocket-client';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
// Removed Framer Motion for better performance and stability

interface RealTimeNotification {
  id: string;
  type: 'message' | 'property_update' | 'trust_alert' | 'system' | 'verification';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  userId: string;
  isRead: boolean;
  metadata?: Record<string, any>;
}

interface RealTimeNotificationsProps {
  maxVisible?: number;
  autoHideDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function RealTimeNotifications({
  maxVisible = 5,
  autoHideDelay = 5000,
  position = 'top-right'
}: RealTimeNotificationsProps) {
  const { user } = useAuth();
  const { lastMessage } = useWebSocketMessage<RealTimeNotification>('notification');
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const cleanupManager = useEnhancedCleanupManager();

  // Handle new notifications from WebSocket
  useSafeEffect(() => {
    if (lastMessage?.payload && user) {
      const notification = lastMessage.payload as RealTimeNotification;
      
      // Only show notifications for the current user
      if (notification.userId === user.id) {
        setNotifications(prev => {
          const newNotifications = [notification, ...prev];
          return newNotifications.slice(0, maxVisible);
        });

        // Auto-hide low priority notifications
        if (notification.priority === 'low' && autoHideDelay > 0) {
          cleanupManager.addTimeout(() => {
            handleDismiss(notification.id);
          }, autoHideDelay, `auto-hide-${notification.id}`);
        }

        // Show browser notification for high priority
        if (notification.priority === 'high' || notification.priority === 'urgent') {
          showBrowserNotification(notification);
        }
      }
    }
  }, [lastMessage, user, maxVisible, autoHideDelay, cleanupManager]);

  const showBrowserNotification = (notification: RealTimeNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/Artmark.svg',
        tag: notification.id,
      });
    }
  };

  const handleDismiss = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const handleAction = (notification: RealTimeNotification) => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    handleDismiss(notification.id);
  };

  const getNotificationIcon = (type: RealTimeNotification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'property_update':
        return <Home className="h-4 w-4" />;
      case 'trust_alert':
        return <AlertTriangle className="h-4 w-4" />;
      case 'verification':
        return <Check className="h-4 w-4" />;
      case 'system':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: RealTimeNotification['priority']) => {
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

  const getPositionClasses = () => {
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

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm w-full`}>
      {/* Header with minimize/expand */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4" />
          <span className="text-sm font-medium">Notifications</span>
          <Badge variant="secondary">{notifications.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? 'Show' : 'Hide'}
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {!isMinimized && notifications.map((notification) => (
          <div
            key={notification.id}
            className="animate-in slide-in-from-right-full duration-300 ease-out"
          >
            <Card className={`shadow-lg border-l-4 ${!notification.isRead ? 'bg-white' : 'bg-gray-50'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {notification.title}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`text-xs mt-1 ${getPriorityColor(notification.priority)}`}
                      >
                        {notification.priority}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(notification.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="h-6 px-2 text-xs"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    
                    {notification.actionUrl && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAction(notification)}
                        className="h-6 px-2 text-xs"
                      >
                        {notification.actionLabel || 'View'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook for managing notification permissions
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useSafeEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  };

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window,
  };
}