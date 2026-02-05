/**
 * Notification Center Component
 * Displays notifications with real-time updates and management
 */

import React, { useState, useCallback } from 'react'
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  X, 
  Settings, 
  Filter,
  MessageSquare,
  Home,
  Shield,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react'
import { useNotifications, useUnreadNotificationCount, Notification, NotificationType } from '../hooks/useNotifications'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Badge } from '../../shared/components/ui/badge'
import { ScrollArea } from '../../shared/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../shared/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../shared/components/ui/tooltip'

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onClick
}) => {
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'property_update':
        return <Home className="w-5 h-5 text-green-500" />;
      case 'verification_status':
        return <Shield className="w-5 h-5 text-purple-500" />;
      case 'appointment_reminder':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'system_alert':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'security_alert':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div
      className={`p-4 border-l-4 cursor-pointer transition-colors hover:bg-gray-50 ${
        !notification.isRead ? getPriorityColor(notification.priority) : 'border-l-gray-200 bg-white'
      }`}
      onClick={() => onClick?.(notification)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {formatTime(notification.createdAt)}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mark as read</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'messages' | 'system'>('all');
  
  const allNotifications = useNotifications();
  const unreadNotifications = useNotifications({ isRead: false });
  const messageNotifications = useNotifications({ type: 'new_message' });
  const systemNotifications = useNotifications({ 
    type: 'system_alert' 
  });

  const handleNotificationClick = useCallback((notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      allNotifications.markAsRead([notification.id]);
    }

    // Navigate to action URL if provided
    if (notification.data?.actionUrl) {
      window.location.href = notification.data.actionUrl;
    }

    onClose();
  }, [allNotifications, onClose]);

  const handleMarkAsRead = useCallback((notificationId: string) => {
    allNotifications.markAsRead([notificationId]);
  }, [allNotifications]);

  const handleDelete = useCallback((notificationId: string) => {
    allNotifications.deleteNotification(notificationId);
  }, [allNotifications]);

  const handleMarkAllAsRead = useCallback(() => {
    allNotifications.markAllAsRead();
  }, [allNotifications]);

  const getCurrentNotifications = () => {
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

  const currentNotifications = getCurrentNotifications();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${className}`}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l">
        <Card className="h-full rounded-none border-0">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {allNotifications.unreadCount > 0 && (
                  <Badge variant="secondary">
                    {allNotifications.unreadCount}
                  </Badge>
                )}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {allNotifications.unreadCount > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAllAsRead}
                          disabled={allNotifications.isMarkingAllAsRead}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Mark all as read</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="all" className="flex-1">
                  All
                  {allNotifications.total > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {allNotifications.total}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="unread" className="flex-1">
                  Unread
                  {allNotifications.unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {allNotifications.unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex-1">
                  Messages
                </TabsTrigger>
                <TabsTrigger value="system" className="flex-1">
                  System
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0 h-full">
                <ScrollArea className="h-[calc(100vh-200px)]">
                  {currentNotifications.isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : currentNotifications.notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                      <BellOff className="w-8 h-8 mb-2" />
                      <p>No notifications</p>
                    </div>
                  ) : (
                    <div>
                      {currentNotifications.notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={handleMarkAsRead}
                          onDelete={handleDelete}
                          onClick={handleNotificationClick}
                        />
                      ))}
                      
                      {currentNotifications.hasMore && (
                        <div className="p-4 text-center">
                          <Button variant="outline" size="sm">
                            Load More
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};