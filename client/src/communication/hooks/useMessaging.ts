/**
 * Messaging Hook
 * React hook for managing messaging functionality
 * Integrates with WebSocket for real-time messaging
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWebSocket, useWebSocketMessage } from '../../infrastructure/realtime/websocket-client'

// Types
export interface Message {
  id: string;
  threadId?: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: MessageType;
  subject?: string;
  status: MessageStatus;
  isRead?: boolean;
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
  priority?: MessagePriority;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  deliveredAt?: string;
}

export interface MessageThread {
  id: string;
  participants: string[];
  subject?: string;
  threadType: ThreadType;
  propertyId?: string;
  lastMessage?: Message;
  lastActivity: string;
  messageCount?: number;
  unreadCount?: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

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

export type MessagePriority = 'low' | 'medium' | 'high';

export type ThreadType = 
  | 'property_inquiry' 
  | 'general_support' 
  | 'verification_discussion'
  | 'appointment_scheduling'
  | 'direct_message';

export interface SendMessageRequest {
  threadId?: string;
  recipientId: string;
  content: string;
  messageType: MessageType;
  propertyId?: string;
  subject?: string;
  attachments?: File[];
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
}

export interface ThreadFilters {
  threadType?: ThreadType;
  propertyId?: string;
  isArchived?: boolean;
  hasUnread?: boolean;
  searchQuery?: string;
}

// API functions
const messagingAPI = {
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'attachments' && Array.isArray(value)) {
        value.forEach(file => formData.append('attachments', file));
      } else if (value !== undefined) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });

    const response = await fetch('/api/messages', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const result = await response.json();
    return result.data;
  },

  async createThread(data: CreateThreadRequest): Promise<MessageThread> {
    const response = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to create thread');
    }

    const result = await response.json();
    return result.data;
  },

  async getThreads(filters: ThreadFilters = {}, page = 1, limit = 20): Promise<{
    threads: MessageThread[];
    total: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined)
      )
    });

    const response = await fetch(`/api/threads?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to get threads');
    }

    const result = await response.json();
    return result.data;
  },

  async getMessages(threadId: string, page = 1, limit = 50): Promise<{
    messages: Message[];
    total: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`/api/threads/${threadId}/messages?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to get messages');
    }

    const result = await response.json();
    return result.data;
  },

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    const response = await fetch('/api/messages/read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to mark messages as read');
    }
  },

  async setTypingIndicator(threadId: string, isTyping: boolean): Promise<void> {
    const response = await fetch(`/api/threads/${threadId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to set typing indicator');
    }
  }
};

// Query keys
const messagingKeys = {
  all: ['messaging'] as const,
  threads: (filters: ThreadFilters) => [...messagingKeys.all, 'threads', filters] as const,
  messages: (threadId: string, page: number) => [...messagingKeys.all, 'messages', threadId, page] as const,
};

// Main messaging hook
export function useMessaging() {
  const queryClient = useQueryClient();
  const { isConnected, send: sendWebSocketMessage } = useWebSocket();

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: messagingAPI.sendMessage,
    onSuccess: (message) => {
      // Update thread messages cache
      queryClient.setQueryData(
        messagingKeys.messages(message.threadId!, 1),
        (old: any) => {
          if (!old) return { messages: [message], total: 1, hasMore: false };
          return {
            ...old,
            messages: [...old.messages, message],
            total: old.total + 1
          };
        }
      );

      // Invalidate threads to update last message
      queryClient.invalidateQueries({ queryKey: messagingKeys.all });
    }
  });

  const createThreadMutation = useMutation({
    mutationFn: messagingAPI.createThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.all });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: messagingAPI.markMessagesAsRead,
    onSuccess: (_, messageIds) => {
      // Update message status in cache
      queryClient.setQueriesData(
        { queryKey: messagingKeys.all },
        (old: any) => {
          if (!old?.messages) return old;
          return {
            ...old,
            messages: old.messages.map((msg: Message) =>
              messageIds.includes(msg.id) 
                ? { ...msg, status: 'read', readAt: new Date().toISOString() }
                : msg
            )
          };
        }
      );
    }
  });

  // Actions
  const sendMessage = useCallback(async (data: SendMessageRequest) => {
    return sendMessageMutation.mutateAsync(data);
  }, [sendMessageMutation]);

  const createThread = useCallback(async (data: CreateThreadRequest) => {
    return createThreadMutation.mutateAsync(data);
  }, [createThreadMutation]);

  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    return markAsReadMutation.mutateAsync(messageIds);
  }, [markAsReadMutation]);

  const setTypingIndicator = useCallback(async (threadId: string, isTyping: boolean) => {
    // Send via WebSocket for real-time updates
    if (isConnected) {
      sendWebSocketMessage(isTyping ? 'typing_start' : 'typing_stop', { threadId });
    }
    
    // Also send via HTTP as fallback
    return messagingAPI.setTypingIndicator(threadId, isTyping);
  }, [isConnected, sendWebSocketMessage]);

  return {
    sendMessage,
    createThread,
    markMessagesAsRead,
    setTypingIndicator,
    isConnected,
    isSending: sendMessageMutation.isPending,
    isCreatingThread: createThreadMutation.isPending,
    sendError: sendMessageMutation.error,
    createError: createThreadMutation.error
  };
}

// Hook for managing threads
export function useThreads(filters: ThreadFilters = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: messagingKeys.threads(filters),
    queryFn: () => messagingAPI.getThreads(filters),
    staleTime: 30000, // 30 seconds
  });

  // Listen for real-time updates
  const { lastMessage: newMessage } = useWebSocketMessage('new_message');
  const { lastMessage: threadUpdate } = useWebSocketMessage('thread_updated');

  const queryClient = useQueryClient();

  useEffect(() => {
    if (newMessage) {
      // Invalidate threads to update last message and order
      queryClient.invalidateQueries({ queryKey: messagingKeys.threads(filters) });
    }
  }, [newMessage, queryClient, filters]);

  useEffect(() => {
    if (threadUpdate) {
      queryClient.invalidateQueries({ queryKey: messagingKeys.threads(filters) });
    }
  }, [threadUpdate, queryClient, filters]);

  return {
    threads: data?.threads || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refetch
  };
}

// Hook for managing messages in a thread
export function useMessages(threadId: string, page = 1) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: messagingKeys.messages(threadId, page),
    queryFn: () => messagingAPI.getMessages(threadId, page),
    enabled: !!threadId,
    staleTime: 10000, // 10 seconds
  });

  // Listen for real-time message updates
  const { lastMessage: newMessage } = useWebSocketMessage('new_message');
  const { lastMessage: messageDelivered } = useWebSocketMessage('message_delivered');
  const { lastMessage: messageRead } = useWebSocketMessage('message_read');

  const queryClient = useQueryClient();

  useEffect(() => {
    if (newMessage?.payload?.threadId === threadId) {
      queryClient.setQueryData(
        messagingKeys.messages(threadId, page),
        (old: any) => {
          if (!old) return { messages: [newMessage.payload], total: 1, hasMore: false };
          
          // Check if message already exists
          const exists = old.messages.some((msg: Message) => msg.id === newMessage.payload.id);
          if (exists) return old;

          return {
            ...old,
            messages: [...old.messages, newMessage.payload],
            total: old.total + 1
          };
        }
      );
    }
  }, [newMessage, threadId, page, queryClient]);

  useEffect(() => {
    if (messageDelivered?.payload?.messageId) {
      queryClient.setQueryData(
        messagingKeys.messages(threadId, page),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((msg: Message) =>
              msg.id === messageDelivered.payload.messageId
                ? { ...msg, status: 'delivered', deliveredAt: messageDelivered.payload.deliveredAt }
                : msg
            )
          };
        }
      );
    }
  }, [messageDelivered, threadId, page, queryClient]);

  useEffect(() => {
    if (messageRead?.payload?.messageId) {
      queryClient.setQueryData(
        messagingKeys.messages(threadId, page),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((msg: Message) =>
              msg.id === messageRead.payload.messageId
                ? { ...msg, status: 'read', readAt: messageRead.payload.readAt }
                : msg
            )
          };
        }
      );
    }
  }, [messageRead, threadId, page, queryClient]);

  return {
    messages: data?.messages || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refetch
  };
}

// Hook for typing indicators
export function useTypingIndicators(threadId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const { lastMessage: typingStart } = useWebSocketMessage('user_typing_start');
  const { lastMessage: typingStop } = useWebSocketMessage('user_typing_stop');

  useEffect(() => {
    if (typingStart?.payload?.threadId === threadId) {
      const userId = typingStart.payload.userId;
      setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    }
  }, [typingStart, threadId]);

  useEffect(() => {
    if (typingStop?.payload?.threadId === threadId) {
      const userId = typingStop.payload.userId;
      setTypingUsers(prev => prev.filter(id => id !== userId));
    }
  }, [typingStop, threadId]);

  // Auto-cleanup typing indicators after 5 seconds
  useEffect(() => {
    if (typingUsers.length > 0) {
      const timer = setTimeout(() => {
        setTypingUsers([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [typingUsers]);

  return typingUsers;
}