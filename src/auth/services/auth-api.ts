import { apiRequest } from '../../infrastructure/api/queryClient';
import { ApiResponse } from '../../shared/types';
import { User, LoginCredentials, RegisterData } from '../types/auth.types';

const API_BASE = '/api/auth';

export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      return await apiRequest<ApiResponse<{ user: User; token: string }>>(
        'POST',
        `${API_BASE}/login`,
        credentials,
        {
          requestOptions: {
            key: `login:${credentials.email}`,
            priority: 'high',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      throw new Error('Login failed');
    }
  },

  // Register new user
  register: async (data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      return await apiRequest<ApiResponse<{ user: User; token: string }>>(
        'POST',
        `${API_BASE}/register`,
        data,
        {
          requestOptions: {
            key: `register:${data.email}`,
            priority: 'high',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      throw new Error('Registration failed');
    }
  },

  // Logout user
  logout: async (): Promise<ApiResponse<void>> => {
    try {
      return await apiRequest<ApiResponse<void>>(
        'POST',
        `${API_BASE}/logout`,
        undefined,
        {
          requestOptions: {
            key: 'logout',
            priority: 'high',
            cancelPrevious: false
          }
        }
      );
    } catch (error) {
      throw new Error('Logout failed');
    }
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const token = localStorage.getItem('auth_token');
      return await apiRequest<ApiResponse<User>>(
        'GET',
        `${API_BASE}/profile`,
        undefined,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          requestOptions: {
            key: 'user-profile',
            priority: 'normal',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      throw new Error('Failed to fetch profile');
    }
  },

  // Update user profile
  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    try {
      return await apiRequest<ApiResponse<User>>(
        'PATCH',
        `${API_BASE}/profile`,
        updates,
        {
          requestOptions: {
            key: 'update-profile',
            priority: 'high',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  },

  // Refresh authentication token
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    try {
      return await apiRequest<ApiResponse<{ token: string }>>(
        'POST',
        `${API_BASE}/refresh`,
        undefined,
        {
          requestOptions: {
            key: 'refresh-token',
            priority: 'high',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    try {
      return await apiRequest<ApiResponse<void>>(
        'POST',
        `${API_BASE}/forgot-password`,
        { email },
        {
          requestOptions: {
            key: `password-reset:${email}`,
            priority: 'normal',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      throw new Error('Password reset request failed');
    }
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
    try {
      return await apiRequest<ApiResponse<void>>(
        'POST',
        `${API_BASE}/reset-password`,
        { token, password: newPassword },
        {
          requestOptions: {
            key: `reset-password:${token}`,
            priority: 'high',
            cancelPrevious: false
          }
        }
      );
    } catch (error) {
      throw new Error('Password reset failed');
    }
  },

  // Validate password reset token
  validateResetToken: async (token: string): Promise<ApiResponse<{ valid: boolean; email?: string }>> => {
    try {
      return await apiRequest<ApiResponse<{ valid: boolean; email?: string }>>(
        'POST',
        `${API_BASE}/validate-reset-token`,
        { token },
        {
          requestOptions: {
            key: `validate-token:${token}`,
            priority: 'normal',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      throw new Error('Token validation failed');
    }
  },

  // Check password history
  checkPasswordHistory: async (email: string, password: string): Promise<ApiResponse<{ isReused: boolean }>> => {
    try {
      return await apiRequest<ApiResponse<{ isReused: boolean }>>(
        'POST',
        `${API_BASE}/check-password-history`,
        { email, password },
        {
          requestOptions: {
            key: `check-password:${email}`,
            priority: 'normal',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      throw new Error('Password history check failed');
    }
  },

  // Get account lockout status
  getAccountLockout: async (email: string): Promise<ApiResponse<{ isLocked: boolean; lockoutUntil?: string; attemptCount: number }>> => {
    try {
      return await apiRequest<ApiResponse<{ isLocked: boolean; lockoutUntil?: string; attemptCount: number }>>(
        'GET',
        `${API_BASE}/account-lockout/${encodeURIComponent(email)}`,
        undefined,
        {
          requestOptions: {
            key: `lockout-status:${email}`,
            priority: 'normal',
            cancelPrevious: true
          }
        }
      );
    } catch (error) {
      throw new Error('Failed to get account lockout status');
    }
  },
};