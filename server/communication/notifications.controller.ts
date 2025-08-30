import { Router, Request, Response } from 'express';

import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Type definitions
interface Notification {
  id: string;
  userId: string;
  type: 'property_update' | 'message' | 'verification' | 'system' | 'marketing';
  title: string;
  message: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  data?: any;
  actionUrl?: string;
}

// Helper function to generate mock notifications
const generateMockNotifications = (userId?: string, count: number = 20): Notification[] => {
  const notifications: Notification[] = [];
  const types: Notification['type'][] = ['property_update', 'message', 'verification', 'system', 'marketing'];
  const priorities: Notification['priority'][] = ['low', 'medium', 'high', 'urgent'];
  
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const priority = priorities[i % priorities.length];
    const isRead = Math.random() > 0.4; // 60% chance of being read
    
    notifications.push({
      id: `notif_${i}_${Date.now()}`,
      userId: userId || `user_${Math.floor(Math.random() * 1000)}`,
      type,
      title: `${type.replace('_', ' ').toUpperCase()} - ${priority.toUpperCase()}`,
      message: `This is a ${priority} priority ${type} notification. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      read: isRead,
      priority,
      createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      readAt: isRead ? new Date(Date.now() - i * 30 * 60 * 1000).toISOString() : undefined,
      data: { 
        notificationIndex: i,
        userId,
        metadata: `Sample data for ${type} notification`
      },
      actionUrl: type === 'property_update' ? `/properties/${i}` : 
                 type === 'message' ? `/messages/${i}` :
                 type === 'verification' ? `/verification/${i}` : undefined
    });
  }
  
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Get all notifications for authenticated user
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id?.toString();
  const { page = '1', limit = '20', unreadOnly = 'false', type, priority } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const showUnreadOnly = unreadOnly === 'true';
  
  let notifications = generateMockNotifications(userId, 100);
  
  // Apply filters
  if (showUnreadOnly) {
    notifications = notifications.filter(n => !n.read);
  }
  
  if (type) {
    notifications = notifications.filter(n => n.type === type);
  }
  
  if (priority) {
    notifications = notifications.filter(n => n.priority === priority);
  }
  
  // Paginate
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
    },
    summary: {
      totalUnread: notifications.filter(n => !n.read).length,
      totalByType: {
        property_update: notifications.filter(n => n.type === 'property_update').length,
        message: notifications.filter(n => n.type === 'message').length,
        verification: notifications.filter(n => n.type === 'verification').length,
        system: notifications.filter(n => n.type === 'system').length,
        marketing: notifications.filter(n => n.type === 'marketing').length
      }
    }
  });
});

// Get unread notifications count
router.get('/unread', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id?.toString();
  const notifications = generateMockNotifications(userId, 50);
  const unreadNotifications = notifications.filter(n => !n.read);
  
  res.json({
    success: true,
    data: {
      count: unreadNotifications.length,
      urgent: unreadNotifications.filter(n => n.priority === 'urgent').length,
      high: unreadNotifications.filter(n => n.priority === 'high').length,
      medium: unreadNotifications.filter(n => n.priority === 'medium').length,
      low: unreadNotifications.filter(n => n.priority === 'low').length
    }
  });
});

// Get notification by ID
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id?.toString();
  
  // Mock notification data
  const notification: Notification = {
    id,
    userId: userId || 'unknown',
    type: 'property_update',
    title: 'Property Update Notification',
    message: 'Your property listing has been updated with new information.',
    read: false,
    priority: 'medium',
    createdAt: new Date().toISOString(),
    data: {
      propertyId: 'prop_123',
      updateType: 'price_change',
      oldPrice: 250000,
      newPrice: 240000
    },
    actionUrl: '/properties/prop_123'
  };
  
  res.json({
    success: true,
    data: notification
  });
});

// Mark notification as read
router.patch('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      read: true,
      readAt: new Date().toISOString()
    },
    message: 'Notification marked as read'
  });
});

// Mark notification as unread
router.patch('/:id/unread', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      read: false,
      readAt: null
    },
    message: 'Notification marked as unread'
  });
});

// Mark all notifications as read
router.patch('/mark-all-read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id?.toString();
  const { type, priority } = req.body;
  
  let affectedCount = 20; // Mock count
  
  if (type || priority) {
    affectedCount = Math.floor(Math.random() * 10) + 1;
  }
  
  res.json({
    success: true,
    data: {
      affectedCount,
      markedAt: new Date().toISOString(),
      filters: { type, priority }
    },
    message: `${affectedCount} notifications marked as read`
  });
});

// Delete notification
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      deletedAt: new Date().toISOString()
    },
    message: 'Notification deleted successfully'
  });
});

// Delete all read notifications
router.delete('/read/all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const deletedCount = Math.floor(Math.random() * 15) + 5; // Mock count
  
  res.json({
    success: true,
    data: {
      deletedCount,
      deletedAt: new Date().toISOString()
    },
    message: `${deletedCount} read notifications deleted`
  });
});

// Create notification (for testing/admin purposes)
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { type, title, message, priority = 'medium', actionUrl, data } = req.body;
  const userId = req.user?.id?.toString();
  
  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: userId || 'unknown',
    type: type || 'system',
    title: title || 'New Notification',
    message: message || 'You have a new notification.',
    read: false,
    priority,
    createdAt: new Date().toISOString(),
    data,
    actionUrl
  };
  
  res.status(201).json({
    success: true,
    data: notification,
    message: 'Notification created successfully'
  });
});

// Get notification preferences
router.get('/preferences', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      emailNotifications: {
        property_update: true,
        message: true,
        verification: true,
        system: true,
        marketing: false
      },
      pushNotifications: {
        property_update: true,
        message: true,
        verification: true,
        system: false,
        marketing: false
      },
      smsNotifications: {
        property_update: false,
        message: false,
        verification: true,
        system: false,
        marketing: false
      },
      frequency: 'immediate', // immediate, daily, weekly
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    }
  });
});

// Update notification preferences
router.patch('/preferences', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const preferences = req.body;
  
  res.json({
    success: true,
    data: {
      ...preferences,
      updatedAt: new Date().toISOString()
    },
    message: 'Notification preferences updated successfully'
  });
});

export { router as notificationsRouter };