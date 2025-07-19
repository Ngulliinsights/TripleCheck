import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../../auth/types/auth.types';
import { ApiResponse } from '../../shared/types';
import { UserBusinessLogic } from '../services/user-business-logic';

// Enhanced user API with business logic integration
const userApi = {
  // Get user with enhanced data
  getUser: async (userId: string): Promise<ApiResponse<User & {
    activityScore: {
      score: number;
      level: string;
      factors: Record<string, number>;
      recommendations: string[];
    };
    insights: {
      insights: string[];
      recommendations: string[];
      achievements: any[];
      goals: any[];
    };
  }>> => {
    const response = await fetch(`/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch user');
    }
    
    const data = await response.json();
    
    if (data.data) {
      // Enhance with business logic calculations
      const user = data.data;
      
      // Calculate activity score (would normally come from backend)
      const mockActivityData = {
        loginFrequency: 3,
        propertyInteractions: 10,
        messageActivity: 5,
        profileCompleteness: 85,
        accountAge: 30,
        verificationLevel: user.isVerified ? 100 : 50,
      };
      
      const activityScore = UserBusinessLogic.calculateActivityScore(mockActivityData);
      const insights = UserBusinessLogic.generateUserInsights(user, mockActivityData);
      
      data.data.activityScore = activityScore;
      data.data.insights = insights;
    }
    
    return data;
  },

  // Update user with validation
  updateUser: async (userId: string, updates: Partial<User>, requestingUserId: string): Promise<ApiResponse<User>> => {
    // Get current user data first
    const currentUserResponse = await userApi.getUser(userId);
    const currentUser = currentUserResponse.data;

    // Validate the update
    const validation = UserBusinessLogic.validateSettingsUpdate(
      currentUser,
      updates,
      requestingUserId
    );

    if (!validation.isValid) {
      throw new Error(`Update validation failed: ${validation.errors.join(', ')}`);
    }

    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(validation.allowedUpdates),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update user');
    }
    
    return response.json();
  },

  // Get user notifications with enhanced data
  getUserNotifications: async (userId: string, params: {
    page?: number;
    limit?: number;
    type?: string;
    unreadOnly?: boolean;
  } = {}): Promise<ApiResponse<{
    notifications: any[];
    summary: {
      total: number;
      unread: number;
      byType: Record<string, number>;
    };
  }>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/users/${userId}/notifications?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch notifications');
    }
    
    return response.json();
  },

  // Mark notification as read
  markNotificationRead: async (notificationId: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to mark notification as read');
    }
    
    return response.json();
  },

  // Get user dashboard data
  getUserDashboard: async (userId: string): Promise<ApiResponse<{
    summary: {
      totalProperties: number;
      activeListings: number;
      totalMessages: number;
      unreadMessages: number;
      trustScore: number;
      verificationStatus: string;
    };
    recentActivity: any[];
    quickActions: any[];
    notifications: any[];
  }>> => {
    const response = await fetch(`/api/users/${userId}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch dashboard data');
    }
    
    return response.json();
  },

  // Update user preferences
  updateUserPreferences: async (userId: string, preferences: User['preferences']): Promise<ApiResponse<User>> => {
    // Validate preferences
    const validatedPreferences = UserBusinessLogic.validateUserPreferences(preferences);

    const response = await fetch(`/api/users/${userId}/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(validatedPreferences),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update preferences');
    }
    
    return response.json();
  },

  // Upload user avatar
  uploadAvatar: async (userId: string, file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`/api/users/${userId}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to upload avatar');
    }
    
    return response.json();
  },

  // Get user activity history
  getUserActivity: async (userId: string, params: {
    page?: number;
    limit?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<ApiResponse<{
    activities: any[];
    summary: {
      totalActivities: number;
      activityScore: number;
      mostActiveDay: string;
      activityTrends: any[];
    };
  }>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/users/${userId}/activity?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch user activity');
    }
    
    return response.json();
  },

  // Delete user account
  deleteUser: async (userId: string, confirmation: {
    password: string;
    reason?: string;
  }): Promise<ApiResponse<void>> => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(confirmation),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete user account');
    }
    
    return response.json();
  },
};

// Query keys
export const userKeys = {
  all: ['users'] as const,
  user: (userId: string) => [...userKeys.all, userId] as const,
  notifications: (userId: string) => [...userKeys.all, userId, 'notifications'] as const,
};

// Get user by ID
export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.user(userId),
    queryFn: () => userApi.getUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: Partial<User> }) =>
      userApi.updateUser(userId, updates),
    onSuccess: (data, variables) => {
      // Update the specific user in cache
      queryClient.setQueryData(userKeys.user(variables.userId), data);
    },
  });
}

// Get user notifications
export function useUserNotifications(userId: string) {
  return useQuery({
    queryKey: userKeys.notifications(userId),
    queryFn: () => userApi.getUserNotifications(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Mark notification as read mutation
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.markNotificationRead,
    onSuccess: () => {
      // Invalidate notifications to refetch
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'notifications'] });
    },
  });
}