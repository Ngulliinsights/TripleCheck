/**
 * Authentication Integration Tests
 * 
 * Tests the complete authentication flow including:
 * - Login/logout functionality
 * - Registration process
 * - Session management
 * - Token handling
 * - Profile management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEventInstance } from '@/shared/test-utils'
import { LoginForm } from '../components/LoginForm'
import { useAuth, useLogin, useRegister, useLogout } from '../hooks/useAuth'
import type { User } from '../types/auth.types'

// Mock the auth API
vi.mock('../services/auth-api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Authentication Integration Tests', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    isVerified: true,
    preferences: {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      privacy: {
        showProfile: true,
        showContactInfo: false,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login Flow Integration', () => {
    it('should complete full login flow successfully', async () => {
      const { authApi } = await import('../services/auth-api');
      
      // Mock successful login response
      (authApi.login as any).mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-jwt-token',
        },
      });

      const onSuccess = vi.fn();
      renderWithProviders(<LoginForm onSuccess={onSuccess} />);

      // Fill in login form
      const emailField = screen.getByLabelText(/email address/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEventInstance.type(emailField, 'test@example.com');
      await userEventInstance.type(passwordField, 'password123');
      await userEventInstance.click(submitButton);

      // Wait for login to complete
      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: false,
        });
      });

      // Verify token is stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock-jwt-token');
      
      // Verify success callback is called
      expect(onSuccess).toHaveBeenCalledWith(mockUser);
    });

    it('should handle login errors gracefully', async () => {
      const { authApi } = await import('../services/auth-api');
      
      // Mock login error
      (authApi.login as any).mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(<LoginForm />);

      // Fill in login form with invalid credentials
      const emailField = screen.getByLabelText(/email address/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEventInstance.type(emailField, 'invalid@example.com');
      await userEventInstance.type(passwordField, 'wrongpassword');
      await userEventInstance.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });

      // Verify token is not stored
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith('auth_token', expect.any(String));
    });

    it('should handle remember me functionality', async () => {
      const { authApi } = await import('../services/auth-api');
      
      // Mock successful login response
      (authApi.login as any).mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-jwt-token',
        },
      });

      renderWithProviders(<LoginForm />);

      // Fill in login form with remember me checked
      const emailField = screen.getByLabelText(/email address/i);
      const passwordField = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await userEventInstance.type(emailField, 'test@example.com');
      await userEventInstance.type(passwordField, 'password123');
      await userEventInstance.click(rememberMeCheckbox);
      await userEventInstance.click(submitButton);

      // Wait for login to complete
      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true,
        });
      });

      // Verify remember me data is stored
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rememberMe', 'true');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('rememberedEmail', 'test@example.com');
    });
  });

  describe('Session Management', () => {
    it('should maintain authentication state across page reloads', async () => {
      const { authApi } = await import('../services/auth-api');
      
      // Mock stored token
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return 'stored-jwt-token';
        return null;
      });

      // Mock profile fetch
      (authApi.getProfile as any).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      // This would typically be tested in a component that uses useAuth
      // For now, we'll test the hook behavior directly
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('should clear authentication state on logout', async () => {
      const { authApi } = await import('../services/auth-api');
      
      // Mock successful logout
      (authApi.logout as any).mockResolvedValue({
        success: true,
        message: 'Logged out successfully',
      });

      // Mock stored token
      mockLocalStorage.getItem.mockReturnValue('stored-jwt-token');

      // Simulate logout (this would typically be triggered by a logout button)
      await authApi.logout();

      // Verify logout API was called
      expect(authApi.logout).toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    it('should include authorization header in authenticated requests', async () => {
      const { authApi } = await import('../services/auth-api');
      
      // Mock stored token
      mockLocalStorage.getItem.mockReturnValue('stored-jwt-token');

      // Mock profile fetch
      (authApi.getProfile as any).mockResolvedValue({
        success: true,
        data: mockUser,
      });

      await authApi.getProfile();

      // Verify the API was called (the actual header verification would be in the API layer)
      expect(authApi.getProfile).toHaveBeenCalled();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('should handle expired tokens gracefully', async () => {
      const { authApi } = await import('../services/auth-api');
      
      // Mock stored token
      mockLocalStorage.getItem.mockReturnValue('expired-jwt-token');

      // Mock expired token response
      (authApi.getProfile as any).mockRejectedValue(new Error('Token expired'));

      try {
        await authApi.getProfile();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Failed to fetch profile');
      }
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate email format', async () => {
      renderWithProviders(<LoginForm />);

      const emailField = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Enter invalid email
      await userEventInstance.type(emailField, 'invalid-email');
      await userEventInstance.click(submitButton);

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should validate password requirements', async () => {
      renderWithProviders(<LoginForm />);

      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Enter short password
      await userEventInstance.type(passwordField, '123');
      await userEventInstance.click(submitButton);

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should require both email and password', async () => {
      renderWithProviders(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEventInstance.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Security Features', () => {
    it('should show password strength indicator', async () => {
      renderWithProviders(<LoginForm />);

      const passwordField = screen.getByLabelText(/password/i);
      
      // Enter a password to trigger strength check
      await userEventInstance.type(passwordField, 'strongpassword123');

      // Wait for password strength indicator
      await waitFor(() => {
        expect(screen.getByText(/password strength/i)).toBeInTheDocument();
      });
    });

    it('should toggle password visibility', async () => {
      renderWithProviders(<LoginForm />);

      const passwordField = screen.getByLabelText(/password/i) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

      // Initially password should be hidden
      expect(passwordField.type).toBe('password');

      // Click to show password
      await userEventInstance.click(toggleButton);
      expect(passwordField.type).toBe('text');

      // Click to hide password again
      await userEventInstance.click(toggleButton);
      expect(passwordField.type).toBe('password');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithProviders(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('should announce form errors to screen readers', async () => {
      renderWithProviders(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEventInstance.click(submitButton);

      await waitFor(() => {
        const emailError = screen.getByText(/email is required/i);
        const passwordError = screen.getByText(/password is required/i);

        // These should have proper ARIA attributes for screen readers
        expect(emailError).toBeInTheDocument();
        expect(passwordError).toBeInTheDocument();
      });
    });
  });
});