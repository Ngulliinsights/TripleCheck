import React, { useState, useCallback, useMemo } from 'react'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  Settings,
  Home,
  Shield,
  MessageSquare,
  AlertTriangle,
  Star,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react'

import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Badge } from '../../local/components/ui/badge'
import { Switch } from '../../local/components/ui/switch'
import { Label } from '../../local/components/ui/label'
import { useToast } from '../../local/hooks/use-toast'

interface Notification {
  id: string;
  type: 'property' | 'verification' | 'message' | 'alert' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  isImportant: boolean;
  actionUrl?: string;
  metadata?: {
    propertyId?: string;
    propertyTitle?: string;
    senderId?: string;
    senderName?: string;
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  propertyAlerts: boolean;
  verificationUpdates: boolean;
  messageNotifications: boolean;
  marketingEmails: boolean;
}

// Mock notifications data
const mockNotifications: Notification[] = [
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

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'property': return Home;
    case 'verification': return Shield;
    case 'message': return MessageSquare;
    case 'alert': return AlertTriangle;
    case 'system': return Settings;
    default: return Bell;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'property': return 'text-blue-500';
    case 'verification': return 'text-green-500';
    case 'message': return 'text-purple-500';
    case 'alert': return 'text-red-500';
    case 'system': return 'text-gray-500';
    default: return 'text-gray-500';
  }
};

export default function Notifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    propertyAlerts: true,
    verificationUpdates: true,
    messageNotifications: true,
    marketingEmails: false,
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'important':
        return notifications.filter(n => n.isImportant);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast({
      title: 'All notifications marked as read',
      description: `${unreadCount} notifications marked as read.`,
    });
  }, [unreadCount, toast]);

  const handleDeleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast({
      title: 'Notification deleted',
      description: 'The notification has been removed.',
    });
  }, [toast]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      // In a real app, this would navigate to the URL
      window.location.href = notification.actionUrl;
    }
  }, [handleMarkAsRead]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const updateSetting = useCallback((key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: 'Settings updated',
      description: 'Your notification preferences have been saved.',
    });
  }, [toast]);

  if (showSettings) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowSettings(false)}
              >
                ← Back to Notifications
              </Button>
            </div>
            <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
            <p className="text-muted-foreground">
              Manage how and when you receive notifications
            </p>
          </div>

          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="text-base font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="text-base font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="property-alerts" className="text-base font-medium">
                      Property Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new properties matching your criteria
                    </p>
                  </div>
                  <Switch
                    id="property-alerts"
                    checked={settings.propertyAlerts}
                    onCheckedChange={(checked) => updateSetting('propertyAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="verification-updates" className="text-base font-medium">
                      Verification Updates
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Updates about property verification status
                    </p>
                  </div>
                  <Switch
                    id="verification-updates"
                    checked={settings.verificationUpdates}
                    onCheckedChange={(checked) => updateSetting('verificationUpdates', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="message-notifications" className="text-base font-medium">
                      Message Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for new messages and replies
                    </p>
                  </div>
                  <Switch
                    id="message-notifications"
                    checked={settings.messageNotifications}
                    onCheckedChange={(checked) => updateSetting('messageNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketing-emails" className="text-base font-medium">
                      Marketing Emails
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Promotional emails and product updates
                    </p>
                  </div>
                  <Switch
                    id="marketing-emails"
                    checked={settings.marketingEmails}
                    onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Bell className="w-8 h-8" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive">{unreadCount}</Badge>
                )}
              </h1>
              <p className="text-muted-foreground">
                Stay updated with your property activities and messages
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(['all', 'unread', 'important'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                  {f === 'unread' && unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {filter === 'unread' ? 'All caught up! No unread notifications.' :
                   filter === 'important' ? 'No important notifications at the moment.' :
                   'You have no notifications yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);

              return (
                <Card 
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h3>
                            {notification.isImportant && (
                              <Star className="w-4 h-4 text-yellow-500" />
                            )}
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.timestamp)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>

                        {notification.metadata && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {notification.metadata.propertyTitle && (
                              <span>Property: {notification.metadata.propertyTitle}</span>
                            )}
                            {notification.metadata.senderName && (
                              <span>From: {notification.metadata.senderName}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            title="Mark as read"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}