import { Router, Request, Response } from 'express';

import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Type definitions
interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  subject?: string;
  content: string;
  messageType: 'text' | 'property_inquiry' | 'system' | 'notification';
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    size: number;
    type: string;
  }>;
  metadata?: {
    propertyId?: string;
    inquiryType?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

interface MessageThread {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'buyer' | 'seller' | 'agent' | 'admin';
  }>;
  subject: string;
  lastMessage: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  messageCount: number;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'closed';
  propertyId?: string;
  tags: string[];
}

// Helper functions
const generateMockMessages = (threadId: string, count: number = 10): Message[] => {
  const messages: Message[] = [];
  const messageTypes: Message['messageType'][] = ['text', 'property_inquiry', 'system', 'notification'];
  
  for (let i = 0; i < count; i++) {
    const senderId = i % 2 === 0 ? 'user_1' : 'user_2';
    const recipientId = i % 2 === 0 ? 'user_2' : 'user_1';
    
    messages.push({
      id: `msg_${threadId}_${i}`,
      threadId,
      senderId,
      senderName: `User ${senderId}`,
      senderAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}`,
      recipientId,
      recipientName: `User ${recipientId}`,
      subject: i === 0 ? 'Property Inquiry' : undefined,
      content: `This is message ${i + 1} in thread ${threadId}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      messageType: messageTypes[i % messageTypes.length],
      read: Math.random() > 0.3,
      readAt: Math.random() > 0.3 ? new Date(Date.now() - i * 30000).toISOString() : undefined,
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
      updatedAt: new Date(Date.now() - i * 60000).toISOString(),
      metadata: {
        propertyId: `prop_${Math.floor(Math.random() * 100)}`,
        inquiryType: 'viewing_request',
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
      }
    });
  }
  
  return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

const generateMockThreads = (userId: string, count: number = 20): MessageThread[] => {
  const threads: MessageThread[] = [];
  
  for (let i = 0; i < count; i++) {
    const threadId = `thread_${userId}_${i}`;
    const messages = generateMockMessages(threadId, Math.floor(Math.random() * 10) + 1);
    const lastMessage = messages[messages.length - 1];
    
    threads.push({
      id: threadId,
      participants: [
        {
          id: userId,
          name: `User ${userId}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          role: 'buyer'
        },
        {
          id: `user_${i + 100}`,
          name: `Agent ${i + 100}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 100}`,
          role: 'agent'
        }
      ],
      subject: `Property Inquiry #${i + 1}`,
      lastMessage: {
        content: lastMessage.content,
        senderId: lastMessage.senderId,
        timestamp: lastMessage.createdAt
      },
      messageCount: messages.length,
      unreadCount: messages.filter(m => !m.read && m.recipientId === userId).length,
      createdAt: messages[0].createdAt,
      updatedAt: lastMessage.updatedAt,
      status: ['active', 'archived', 'closed'][Math.floor(Math.random() * 3)] as 'active' | 'archived' | 'closed',
      propertyId: `prop_${Math.floor(Math.random() * 100)}`,
      tags: ['property_inquiry', 'urgent', 'follow_up'].slice(0, Math.floor(Math.random() * 3) + 1)
    });
  }
  
  return threads.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

// Get message threads for user
router.get('/threads', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id?.toString();
  const { status, page = '1', limit = '20' } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  let threads = generateMockThreads(userId || 'unknown', 50);
  
  if (status) {
    threads = threads.filter(t => t.status === status);
  }
  
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedThreads = threads.slice(startIndex, startIndex + limitNum);
  
  res.json({
    success: true,
    data: paginatedThreads,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: threads.length,
      hasMore: startIndex + limitNum < threads.length
    },
    summary: {
      totalUnread: threads.reduce((sum, t) => sum + t.unreadCount, 0),
      activeThreads: threads.filter(t => t.status === 'active').length,
      archivedThreads: threads.filter(t => t.status === 'archived').length
    }
  });
});

// Get messages in a thread
router.get('/:threadId/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { threadId } = req.params;
  const { page = '1', limit = '50' } = req.query;
  
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  
  const messages = generateMockMessages(threadId, 100);
  
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedMessages = messages.slice(startIndex, startIndex + limitNum);
  
  res.json({
    success: true,
    data: paginatedMessages,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: messages.length,
      hasMore: startIndex + limitNum < messages.length
    },
    threadInfo: {
      id: threadId,
      totalMessages: messages.length,
      unreadMessages: messages.filter(m => !m.read).length
    }
  });
});

// Get recent messages for a thread (for polling)
router.get('/:threadId/recent', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { threadId } = req.params;
  const { since, limit = '10' } = req.query;
  
  const limitNum = parseInt(limit as string, 10);
  let messages = generateMockMessages(threadId, 20);
  
  if (since) {
    const sinceDate = new Date(since as string);
    messages = messages.filter(m => new Date(m.createdAt) > sinceDate);
  }
  
  // Get most recent messages
  const recentMessages = messages.slice(-limitNum);
  
  res.json({
    success: true,
    data: recentMessages,
    hasNewMessages: recentMessages.length > 0,
    lastMessageAt: recentMessages.length > 0 ? recentMessages[recentMessages.length - 1].createdAt : null
  });
});

// Send message
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { threadId, recipientId, content, subject, messageType = 'text', metadata } = req.body;
  const senderId = req.user?.id?.toString();
  
  if (!content || !recipientId) {
    return res.status(400).json({
      success: false,
      error: 'Content and recipient ID are required'
    });
  }
  
  const message: Message = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    threadId: threadId || `thread_${senderId}_${recipientId}_${Date.now()}`,
    senderId: senderId || 'anonymous',
    senderName: `User ${senderId}`,
    senderAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}`,
    recipientId,
    recipientName: `User ${recipientId}`,
    subject,
    content,
    messageType,
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata
  };
  
  res.status(201).json({
    success: true,
    data: message,
    message: 'Message sent successfully'
  });
});

// Mark message as read
router.patch('/:messageId/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.params;
  
  res.json({
    success: true,
    data: {
      messageId,
      read: true,
      readAt: new Date().toISOString()
    },
    message: 'Message marked as read'
  });
});

// Mark thread as read
router.patch('/threads/:threadId/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { threadId } = req.params;
  
  res.json({
    success: true,
    data: {
      threadId,
      markedAt: new Date().toISOString(),
      messagesMarked: Math.floor(Math.random() * 10) + 1
    },
    message: 'Thread marked as read'
  });
});

// Archive thread
router.patch('/threads/:threadId/archive', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { threadId } = req.params;
  
  res.json({
    success: true,
    data: {
      threadId,
      status: 'archived',
      archivedAt: new Date().toISOString()
    },
    message: 'Thread archived successfully'
  });
});

// Delete message
router.delete('/:messageId', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.params;
  
  res.json({
    success: true,
    data: {
      messageId,
      deletedAt: new Date().toISOString()
    },
    message: 'Message deleted successfully'
  });
});

// Get message statistics
router.get('/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id?.toString();
  
  res.json({
    success: true,
    data: {
      totalThreads: Math.floor(Math.random() * 50) + 10,
      activeThreads: Math.floor(Math.random() * 20) + 5,
      unreadMessages: Math.floor(Math.random() * 15) + 2,
      totalMessages: Math.floor(Math.random() * 500) + 100,
      thisWeek: {
        sent: Math.floor(Math.random() * 20) + 5,
        received: Math.floor(Math.random() * 25) + 8,
        newThreads: Math.floor(Math.random() * 5) + 1
      },
      averageResponseTime: Math.floor(Math.random() * 24) + 2 // 2-26 hours
    }
  });
});

export { router as messagesRouter };