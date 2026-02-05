import { Router, Request, Response } from 'express';

import { requireAuth, AuthenticatedRequest } from '..\middleware\auth.middleware';

const router = Router();

// Type definitions for better type safety
interface UserNotification {
  id: string;
  type: 'property_update' | 'message' | 'verification' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

interface UserDashboard {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  stats: {
    propertiesOwned: number;
    propertiesViewed: number;
    messagesUnread: number;
    notificationsUnread: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  notifications: UserNotification[];
}

interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  timezone: string;
  currency: string;
  theme: 'light' | 'dark' | 'auto';
}

// Helper function to generate mock notifications
const generateMockNotifications = (userId: string, limit: number = 10): UserNotification[] => {
  const notifications: UserNotification[] = [];
  const types: UserNotification['type'][] = ['property_update', 'message', 'verification', 'system'];
  
  for (let i = 0; i < limit; i++) {
    const type = types[i % types.length];
    notifications.push({
      id: `notif_${userId}_${i}`,
      type,
      title: `${type.replace('_', ' ').toUpperCase()} Notification`,
      message: `This is a sample ${type} notification for user ${userId}`,
      read: Math.random() > 0.3, // 70% chance of being read
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      data: { userId, index: i }
    });
  }
  
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Helper function to generate mock activity
const generateMockActivity = (userId: string, limit: number = 20) => {
  const activities = [];
  const activityTypes = [
    'viewed_property',
    'saved_property',
    'sent_message',
    'updated_profile',
    'verified_document'
  ];
  
  for (let i = 0; i < limit; i++) {
    const type = activityTypes[i % activityTypes.length];
    activities.push({
      id: `activity_${userId}_${i}`,
      type,
      description: `User ${type.replace('_', ' ')} - Activity ${i + 1}`,
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
    });
  }
  
  return activities;
};

// Get all users (authenticated)
router.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  // Mock users list
  res.json({ 
    success: true, 
    data: [
      { id: 1, username: 'user1', firstName: 'John', lastName: 'Doe' },
      { id: 2, username: 'user2', firstName: 'Jane', lastName: 'Smith' }
    ]
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      id: req.params.id, 
      username: `user${req.params.id}`,
      firstName: 'Test',
      lastName: 'User',
      email: `user${req.params.id}@example.com`
    } 
  });
});

// Update user (authenticated)
router.patch('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    success: true, 
    data: { 
      id: req.params.id, 
      ...req.body,
      updatedAt: new Date().toISOString()
    },
    message: 'User updated successfully'
  });
});

// Delete user (authenticated)
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { reason } = req.body;
  res.json({ 
    success: true, 
    message: 'User deleted successfully',
    data: {
      deletedAt: new Date().toISOString(),
      reason: reason || 'No reason provided'
    }
  });
});

// **NEW ENDPOINTS** - User Notifications

// Get user notifications
router.get('/:id/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id: userId } = req.params;
  const { page = '1', limit = '10', unreadOnly = 'false' } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const showUnreadOnly = unreadOnly === 'true';
  
  let notifications = generateMockNotifications(userId, 50);
  
  if (showUnreadOnly) {
    notifications = notifications.filter(n => !n.read);
  }
  
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedNotifications = notifications.slice(startIndex, startIndex + limitNum);
  
  res.json({
    success: true,
    data: paginatedNotifications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: notifications.length,
      hasMore: startIndex + limitNum < notifications.length
    }
  });
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', requireAuth, (req: AuthenticatedRequest, res) => {
  const { notificationId } = req.params;
  
  res.json({
    success: true,
    data: {
      id: notificationId,
      read: true,
      readAt: new Date().toISOString()
    },
    message: 'Notification marked as read'
  });
});

// **NEW ENDPOINTS** - User Dashboard

// Get user dashboard data
router.get('/:id/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id: userId } = req.params;
  
  const notifications = generateMockNotifications(userId, 5);
  const recentActivity = generateMockActivity(userId, 10);
  
  const dashboardData: UserDashboard = {
    user: {
      id: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: `user${userId}@example.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
    },
    stats: {
      propertiesOwned: Math.floor(Math.random() * 10) + 1,
      propertiesViewed: Math.floor(Math.random() * 50) + 10,
      messagesUnread: Math.floor(Math.random() * 5),
      notificationsUnread: notifications.filter(n => !n.read).length
    },
    recentActivity,
    notifications
  };
  
  res.json({
    success: true,
    data: dashboardData
  });
});

// **NEW ENDPOINTS** - User Preferences

// Get user preferences
router.get('/:id/preferences', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id: userId } = req.params;
  
  const preferences: UserPreferences = {
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    theme: 'light'
  };
  
  res.json({
    success: true,
    data: preferences
  });
});

// Update user preferences
router.patch('/:id/preferences', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id: userId } = req.params;
  const preferences = req.body;
  
  res.json({
    success: true,
    data: {
      ...preferences,
      updatedAt: new Date().toISOString()
    },
    message: 'Preferences updated successfully'
  });
});

// **NEW ENDPOINTS** - User Avatar

// Upload user avatar
router.post('/:id/avatar', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id: userId } = req.params;
  
  // Mock file upload response
  res.json({
    success: true,
    data: {
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}_${Date.now()}`,
      uploadedAt: new Date().toISOString()
    },
    message: 'Avatar uploaded successfully'
  });
});

// **NEW ENDPOINTS** - User Activity

// Get user activity
router.get('/:id/activity', requireAuth, (req: AuthenticatedRequest, res) => {
  const { id: userId } = req.params;
  const { page = '1', limit = '20', type } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  let activities = generateMockActivity(userId, 100);
  
  if (type) {
    activities = activities.filter(a => a.type === type);
  }
  
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedActivities = activities.slice(startIndex, startIndex + limitNum);
  
  res.json({
    success: true,
    data: paginatedActivities,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: activities.length,
      hasMore: startIndex + limitNum < activities.length
    }
  });
});

export { router as userRouter };