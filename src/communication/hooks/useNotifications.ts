/**
 * Notifications Hook
 * React hook for managing notifications and real-time updates
 */

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebSocketMessage } from '../../infrastructure/realtime/websocket-client'

// Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  priority: NotificationPriority;
  expiresAt?: string;
  createdAt: string;
  readAt?: string;
}

export type NotificationType = 
  | 'new_message' 
  | 'property_update' 
  | 'verification_status'
  | 'appointment_reminder'
  | 'system_alert'
  | 'marketing'
  | 'security_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationData {
  messageId?: string;
  threadId?: string;
  propertyId?: string;
  userId?: string;
  actionUrl?: string;
  imageUrl?: string;
  [key: string]: any;
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  priority?: NotificationPriority;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  notificationTypes: {
    [K in NotificationType]: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

// API functions
const notificationsAPI = {
  async getNotifications(filters: NotificationFilters = {}, page = 1, limit = 20): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )
    });

    const response = await fetch(`/api/notifications?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to get notifications');
    }

    const result = await response.json();
    return result.data;
  },

  async markAsRead(notificationIds: string[]): Promise<void> {
    const response = await fetch('/api/notifications/read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to mark notifications as read');
    }
  },

  async markAllAsRead(): Promise<void> {
    const response = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  },

  async getSettings(): Promise<NotificationSettings> {
    const response = await fetch('/api/notifications/settings', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to get notification settings');
    }

    const result = await response.json();
    return result.data;
  },

  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await fetch('/api/notifications/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to update notification settings');
    }

    const result = await response.json();
    return result.data;
  }
};

// Query keys
const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters: NotificationFilters) => [...notificationKeys.all, 'list', filters] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
};

// Main notifications hook
export function useNotifications(filters: NotificationFilters = {}) {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationsAPI.getNotifications(filters),
    staleTime: 30000, // 30 seconds
  });

  // Listen for real-time notification updates
  const { lastMessage: newNotification } = useWebSocketMessage('new_notification');

  useEffect(() => {
    if (newNotification) {
      queryClient.setQueryData(
        notificationKeys.list(filters),
        (old: any) => {
          if (!old) return { 
            notifications: [newNotification.payload], 
            total: 1, 
            unreadCount: 1, 
            hasMore: false 
          };
          
          return {
            ...old,
            notifications: [newNotification.payload, ...old.notifications],
            total: old.total + 1,
            unreadCount: old.unreadCount + 1
          };
        }
      );

      // Show browser notification if supported and enabled
      showBrowserNotification(newNotification.payload);
    }
  }, [newNotification, queryClient, filters]);

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markAsRead,
    onSuccess: (_, notificationIds) => {
      queryClient.setQueryData(
        notificationKeys.list(filters),
        (old: any) => {
          if (!old) return old;
          
          const updatedNotifications = old.notifications.map((notification: Notification) =>
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          );

          const unreadCount = updatedNotifications.filter((n: Notification) => !n.isRead).length;

          return {
            ...old,
            notifications: updatedNotifications,
            unreadCount
          };
        }
      );
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsAPI.markAllAsRead,
    onSuccess: () => {
      queryClient.setQueryData(
        notificationKeys.list(filters),
        (old: any) => {
          if (!old) return old;
          
          return {
            ...old,
            notifications: old.notifications.map((notification: Notification) => ({
              ...notification,
              isRead: true,
              readAt: new Date().toISOString()
            })),
            unreadCount: 0
          };
        }
      );
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationsAPI.deleteNotification,
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData(
        notificationKeys.list(filters),
        (old: any) => {
          if (!old) return old;
          
          const filteredNotifications = old.notifications.filter(
            (notification: Notification) => notification.id !== notificationId
          );

          return {
            ...old,
            notifications: filteredNotifications,
            total: old.total - 1,
            unreadCount: filteredNotifications.filter((n: Notification) => !n.isRead).length
          };
        }
      );
    }
  });

  // Actions
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    return markAsReadMutation.mutateAsync(notificationIds);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    return markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    return deleteNotificationMutation.mutateAsync(notificationId);
  }, [deleteNotificationMutation]);

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    unreadCount: data?.unreadCount || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending
  };
}

// Hook for notification settings
export function useNotificationSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: notificationsAPI.getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateSettingsMutation = useMutation({
    mutationFn: notificationsAPI.updateSettings,
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(notificationKeys.settings(), updatedSettings);
    }
  });

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    return updateSettingsMutation.mutateAsync(newSettings);
  }, [updateSettingsMutation]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    isUpdating: updateSettingsMutation.isPending,
    updateError: updateSettingsMutation.error
  };
}

// Hook for unread notification count
export function useUnreadNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { data } = useQuery({
    queryKey: notificationKeys.list({}),
    queryFn: () => notificationsAPI.getNotifications({}, 1, 1),
    staleTime: 30000,
    select: (data) => data.unreadCount
  });

  const { lastMessage: newNotification } = useWebSocketMessage('new_notification');

  useEffect(() => {
    if (data !== undefined) {
      setUnreadCount(data);
    }
  }, [data]);

  useEffect(() => {
    if (newNotification) {
      setUnreadCount(prev => prev + 1);
    }
  }, [newNotification]);

  return unreadCount;
}

// Helper function to show browser notifications
function showBrowserNotification(notification: Notification) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Don't show browser notification for low priority notifications
  if (notification.priority === 'low') {
    return;
  }

  const options: NotificationOptions = {
    body: notification.message,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: notification.id,
    requireInteraction: notification.priority === 'urgent',
  };

  if (notification.data?.imageUrl) {
    options.image = notification.data.imageUrl;
  }

  const browserNotification = new Notification(notification.title, options);

  // Handle notification click
  browserNotification.onclick = () => {
    window.focus();
    
    if (notification.data?.actionUrl) {
      window.location.href = notification.data.actionUrl;
    }
    
    browserNotification.close();
  };

  // Auto-close after 5 seconds for non-urgent notifications
  if (notification.priority !== 'urgent') {
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  }
}

// Hook to request notification permission
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied'
  };
}