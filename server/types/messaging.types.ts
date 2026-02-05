/**
 * Messaging System Types
 * Comprehensive type definitions for the communication and messaging system
 */

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: MessageType;
  status: MessageStatus;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  deliveredAt?: Date;
}

export interface MessageThread {
  id: string;
  participants: string[];
  subject?: string;
  threadType: ThreadType;
  propertyId?: string; // For property-related conversations
  lastMessage?: Message;
  lastActivity: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: ThreadMetadata;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  priority: NotificationPriority;
  expiresAt?: Date;
  createdAt: Date;
  readAt?: Date;
}

// Enums and Union Types
export type MessageType = 
  | 'text' 
  | 'image' 
  | 'document' 
  | 'property_inquiry' 
  | 'system_message'
  | 'verification_request'
  | 'appointment_request';

export type MessageStatus = 
  | 'sent' 
  | 'delivered' 
  | 'read' 
  | 'failed'
  | 'pending';

export type ThreadType = 
  | 'property_inquiry' 
  | 'general_support' 
  | 'verification_discussion'
  | 'appointment_scheduling'
  | 'direct_message';

export type NotificationType = 
  | 'new_message' 
  | 'property_update' 
  | 'verification_status'
  | 'appointment_reminder'
  | 'system_alert'
  | 'marketing'
  | 'security_alert';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Metadata interfaces
export interface MessageMetadata {
  propertyId?: string;
  appointmentId?: string;
  verificationId?: string;
  systemGenerated?: boolean;
  autoReply?: boolean;
  templateId?: string;
  [key: string]: any;
}

export interface ThreadMetadata {
  propertyTitle?: string;
  propertyPrice?: number;
  agentId?: string;
  inquiryType?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  [key: string]: any;
}

export interface NotificationData {
  messageId?: string;
  threadId?: string;
  propertyId?: string;
  userId?: string;
  actionUrl?: string;
  imageUrl?: string;
  [key: string]: any;
}

// Request/Response interfaces
export interface SendMessageRequest {
  threadId?: string; // Optional for new conversations
  recipientId: string;
  content: string;
  messageType: MessageType;
  propertyId?: string;
  subject?: string; // For new threads
  attachments?: File[];
  metadata?: MessageMetadata;
}

export interface CreateThreadRequest {
  participantIds: string[];
  subject?: string;
  threadType: ThreadType;
  propertyId?: string;
  initialMessage?: {
    content: string;
    messageType: MessageType;
    attachments?: File[];
  };
  metadata?: ThreadMetadata;
}

export interface MessageSearchFilters {
  threadId?: string;
  senderId?: string;
  recipientId?: string;
  messageType?: MessageType;
  status?: MessageStatus;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  searchQuery?: string;
}

export interface ThreadSearchFilters {
  userId: string;
  threadType?: ThreadType;
  propertyId?: string;
  isArchived?: boolean;
  hasUnread?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
}

export interface NotificationFilters {
  userId: string;
  type?: NotificationType;
  isRead?: boolean;
  priority?: NotificationPriority;
  dateFrom?: Date;
  dateTo?: Date;
}

// Response interfaces
export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ThreadsResponse {
  threads: MessageThread[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// WebSocket event types
export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp: Date;
  userId?: string;
}

export type WebSocketEventType = 
  | 'message_sent'
  | 'message_delivered'
  | 'message_read'
  | 'user_typing'
  | 'user_online'
  | 'user_offline'
  | 'notification_received'
  | 'thread_updated';

export interface TypingIndicator {
  threadId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

// Validation schemas
export interface MessageValidation {
  content: {
    minLength: number;
    maxLength: number;
    allowedTypes: MessageType[];
  };
  attachments: {
    maxCount: number;
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
  rateLimit: {
    messagesPerMinute: number;
    messagesPerHour: number;
  };
}

// Analytics and metrics
export interface MessageMetrics {
  totalMessages: number;
  totalThreads: number;
  activeThreads: number;
  averageResponseTime: number;
  messagesByType: Record<MessageType, number>;
  threadsByType: Record<ThreadType, number>;
  userEngagement: {
    dailyActiveUsers: number;
    messagesSent: number;
    messagesReceived: number;
  };
}