import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/auth-api';
import { LoginCredentials, RegisterData, User } from '../types/auth.types';

// Query keys
export const authKeys = {
  profile: ['auth', 'profile'] as const,
};

// Get current user profile
export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile,
    queryFn: authApi.getProfile,
    retry: false, // Don't retry auth requests
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store token in localStorage
      if (data.data.token) {
        localStorage.setItem('auth_token', data.data.token);
      }
      // Set user data in cache
      queryClient.setQueryData(authKeys.profile, { data: data.data.user });
    },
  });
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      // Store token in localStorage
      if (data.data.token) {
        localStorage.setItem('auth_token', data.data.token);
      }
      // Set user data in cache
      queryClient.setQueryData(authKeys.profile, { data: data.data.user });
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear token from localStorage
      localStorage.removeItem('auth_token');
      // Clear all cached data
      queryClient.clear();
    },
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      // Update profile in cache
      queryClient.setQueryData(authKeys.profile, data);
    },
  });
}

// Password reset request mutation
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: authApi.requestPasswordReset,
  });
}

// Password reset mutation
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });
}

// Custom hook for auth state
export function useAuth() {
  const { data: profileData, isLoading, error } = useProfile();
  
  return {
    user: profileData?.data || null,
    isAuthenticated: !!profileData?.data,
    isLoading,
    error,
  };
}