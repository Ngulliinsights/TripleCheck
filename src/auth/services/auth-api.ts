import { ApiResponse } from '../../shared/types';
import { User, LoginCredentials, RegisterData } from '../types/auth.types';

const API_BASE = '/api/auth';

export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  // Register new user
  register: async (data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },

  // Logout user
  logout: async (): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Logout failed');
    return response.json();
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE}/profile`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  // Update user profile
  updateProfile: async (updates: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  // Refresh authentication token
  refreshToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const response = await fetch(`${API_BASE}/refresh`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Token refresh failed');
    return response.json();
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error('Password reset request failed');
    return response.json();
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword }),
    });
    if (!response.ok) throw new Error('Password reset failed');
    return response.json();
  },
};