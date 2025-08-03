import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { cachePresets, queryKeys } from "../../infrastructure/api/queryClient";
import { authApi } from "../services/auth-api";

// Use standardized query keys from infrastructure
export const authKeys = {
  profile: (userId: string) => queryKeys.user.profile(userId),
};

// Get current user profile
export function useProfile() {
  return useQuery({
    queryKey: ["auth", "profile"], // Keep simple key for profile
    queryFn: authApi.getProfile,
    retry: false, // Don't retry auth requests
    ...cachePresets.profile, // Use standardized cache preset
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
        localStorage.setItem("auth_token", data.data.token);
      }
      // Set user data in cache
      queryClient.setQueryData(["auth", "profile"], { data: data.data.user });
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
        localStorage.setItem("auth_token", data.data.token);
      }
      // Set user data in cache
      queryClient.setQueryData(["auth", "profile"], { data: data.data.user });
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
      localStorage.removeItem("auth_token");
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
      queryClient.setQueryData(["auth", "profile"], data);
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

// Validate reset token
export function useValidateResetToken() {
  return useMutation({
    mutationFn: authApi.validateResetToken,
  });
}

// Check password history
export function useCheckPasswordHistory() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.checkPasswordHistory(email, password),
  });
}

// Get account lockout status
export function useAccountLockout(email: string) {
  return useQuery({
    queryKey: ["auth", "lockout", email],
    queryFn: () => authApi.getAccountLockout(email),
    enabled: !!email,
    retry: false,
    staleTime: 30000, // 30 seconds
  });
}

// Re-export the context hook as the main auth hook
export { useAuthContext as useAuth } from '../contexts/AuthContext';
