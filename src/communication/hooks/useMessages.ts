import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, PaginatedResponse } from '../../shared/types';

// Message types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  threadId?: string;
}

export interface MessageThread {
  id: string;
  participants: string[];
  subject: string;
  lastMessage: Message;
  messageCount: number;
  unreadCount: number;
}

// Mock API functions - replace with actual API calls
const messageApi = {
  getMessages: async (userId: string, page = 1, limit = 20): Promise<PaginatedResponse<Message>> => {
    const response = await fetch(`/api/communication/messages?userId=${userId}&page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  getThreads: async (userId: string): Promise<ApiResponse<MessageThread[]>> => {
    const response = await fetch(`/api/communication/threads?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch message threads');
    return response.json();
  },

  sendMessage: async (message: {
    recipientId: string;
    subject: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    threadId?: string;
  }): Promise<ApiResponse<Message>> => {
    const response = await fetch('/api/communication/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },

  markAsRead: async (messageId: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`/api/communication/messages/${messageId}/read`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to mark message as read');
    return response.json();
  },

  deleteMessage: async (messageId: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`/api/communication/messages/${messageId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete message');
    return response.json();
  },
};

// Query keys
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (userId: string, page: number) => [...messageKeys.lists(), userId, page] as const,
  threads: (userId: string) => [...messageKeys.all, 'threads', userId] as const,
};

// Get messages for a user
export function useMessages(userId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: messageKeys.list(userId, page),
    queryFn: () => messageApi.getMessages(userId, page, limit),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Get message threads for a user
export function useMessageThreads(userId: string) {
  return useQuery({
    queryKey: messageKeys.threads(userId),
    queryFn: () => messageApi.getThreads(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Send message mutation
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messageApi.sendMessage,
    onSuccess: () => {
      // Invalidate message lists and threads to refetch
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...messageKeys.all, 'threads'] });
    },
  });
}

// Mark message as read mutation
export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messageApi.markAsRead,
    onSuccess: () => {
      // Invalidate message lists to refetch
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...messageKeys.all, 'threads'] });
    },
  });
}

// Delete message mutation
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messageApi.deleteMessage,
    onSuccess: () => {
      // Invalidate message lists to refetch
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...messageKeys.all, 'threads'] });
    },
  });
}