import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import PasswordReset from '../PasswordReset'
import * as authHooks from '../../hooks/useAuth'

// Mock the auth hooks
vi.mock('../../hooks/useAuth');

// Mock zxcvbn for password strength testing
vi.mock('zxcvbn', () => ({
  default: vi.fn((password: string) => ({
    score: password.length >= 16 ? 4 : password.length >= 12 ? 3 : password.length >= 8 ? 2 : 0,
    feedback: {
      suggestions: password.length < 8 ? ['Use a longer password'] : [],
      warning: password.length < 8 ? 'Too short' : '',
    },
  })),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; searchParams?: string }> = ({ 
  children, 
  searchParams = '' 
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  // Mock window.location.search
  Object.defineProperty(window, 'location', {
    value: {
      search: searchParams,
    },
    writable: true,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PasswordReset Component', () => {
  const mockRequestPasswordReset = vi.fn();
  const mockResetPassword = vi.fn();

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Mock the hooks
    vi.mocked(authHooks.useRequestPasswordReset).mockReturnValue({
      mutateAsync: mockRequestPasswordReset,
      isPending: false,
      error: null,
      data: null,
      isError: false,
      isSuccess: false,
      mutate: vi.fn(),
      reset: vi.fn(),
    } as any);

    vi.mocked(authHooks.useResetPassword).mockReturnValue({
      mutateAsync: mockResetPassword,
      isPending: false,
      error: null,
      data: null,
      isError: false,
      isSuccess: false,
      mutate: vi.fn(),
      reset: vi.fn(),
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Password Reset Request Flow', () => {
    it('should render request form by default', () => {
      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      );

      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('should successfully request password reset', async () => {
      const user = userEvent.setup();
      mockRequestPasswordReset.mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@example.com');
      });

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });
    });
  });

  describe('Account Lockout Protection', () => {
    it('should show lockout warning when approaching max attempts', async () => {
      // Simulate 3 failed attempts
      localStorage.setItem('password_reset_lockout_test@example.com', JSON.stringify({
        attemptCount: 3,
        lockoutUntil: null,
      }));

      render(
        <TestWrapper searchParams="?email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/2 attempts remaining/i)).toBeInTheDocument();
      });
    });

    it('should prevent requests when account is locked', async () => {
      const user = userEvent.setup();
      const lockoutUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      localStorage.setItem('password_reset_lockout_test@example.com', JSON.stringify({
        attemptCount: 5,
        lockoutUntil: lockoutUntil.toISOString(),
      }));

      render(
        <TestWrapper searchParams="?email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await waitFor(() => {
        expect(screen.getByText(/account temporarily locked/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      await user.click(submitButton);
      expect(mockRequestPasswordReset).not.toHaveBeenCalled();
    });

    it('should clear lockout after expiration', async () => {
      const expiredLockout = new Date(Date.now() - 1000); // 1 second ago
      
      localStorage.setItem('password_reset_lockout_test@example.com', JSON.stringify({
        attemptCount: 5,
        lockoutUntil: expiredLockout.toISOString(),
      }));

      render(
        <TestWrapper searchParams="?email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(screen.queryByText(/account temporarily locked/i)).not.toBeInTheDocument();
      });
    });

    it('should increment attempt count on failed request', async () => {
      const user = userEvent.setup();
      mockRequestPasswordReset.mockRejectedValueOnce(new Error('Failed'));

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const stored = localStorage.getItem('password_reset_lockout_test@example.com');
        expect(stored).toBeTruthy();
        const lockout = JSON.parse(stored!);
        expect(lockout.attemptCount).toBe(1);
      });
    });
  });

  describe('Password Reset Form', () => {
    it('should render reset form when token is present', () => {
      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      expect(screen.getByText('Create New Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
    });

    it('should validate password strength requirements', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      // Test weak password
      await user.type(passwordInput, 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // Test password without uppercase
      await user.clear(passwordInput);
      await user.type(passwordInput, 'lowercase123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('should show password strength indicator', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');

      await user.type(passwordInput, 'StrongPassword123!');

      await waitFor(() => {
        expect(screen.getByText('Password Strength:')).toBeInTheDocument();
        expect(screen.getByText('Fair')).toBeInTheDocument(); // Score 3 maps to Fair
      });
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const toggleButton = passwordInput.parentElement?.querySelector('button');

      expect(passwordInput).toHaveAttribute('type', 'password');

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    it('should validate password confirmation match', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const confirmInput = screen.getByPlaceholderText('Confirm new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'StrongPassword123!');
      await user.type(confirmInput, 'DifferentPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password History Tracking', () => {
    it('should prevent password reuse', async () => {
      const user = userEvent.setup();
      
      // Set up password history
      const passwordHash = btoa('OldPassword123!');
      localStorage.setItem('password_history_test@example.com', JSON.stringify([passwordHash]));

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const confirmInput = screen.getByPlaceholderText('Confirm new password');

      await user.type(passwordInput, 'OldPassword123!');
      await user.type(confirmInput, 'OldPassword123!');

      await waitFor(() => {
        expect(screen.getByText(/this password has been used recently/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toBeDisabled();
    });

    it('should allow new passwords not in history', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValueOnce({ success: true });

      // Set up password history with different password
      const passwordHash = btoa('OldPassword123!');
      localStorage.setItem('password_history_test@example.com', JSON.stringify([passwordHash]));

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const confirmInput = screen.getByPlaceholderText('Confirm new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewStrongPassword123!');
      await user.type(confirmInput, 'NewStrongPassword123!');

      expect(screen.queryByText(/this password has been used recently/i)).not.toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          token: 'valid-token',
          password: 'NewStrongPassword123!',
        });
      });
    });

    it('should add new password to history after successful reset', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const confirmInput = screen.getByPlaceholderText('Confirm new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123!');
      await user.type(confirmInput, 'NewPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        const history = JSON.parse(localStorage.getItem('password_history_test@example.com') || '[]');
        expect(history).toContain(btoa('NewPassword123!'));
      });
    });

    it('should maintain maximum password history limit', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValueOnce({ success: true });

      // Fill password history to maximum
      const maxHistory = Array.from({ length: 5 }, (_, i) => btoa(`OldPassword${i}!`));
      localStorage.setItem('password_history_test@example.com', JSON.stringify(maxHistory));

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const confirmInput = screen.getByPlaceholderText('Confirm new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123!');
      await user.type(confirmInput, 'NewPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        const history = JSON.parse(localStorage.getItem('password_history_test@example.com') || '[]');
        expect(history).toHaveLength(5); // Should still be 5
        expect(history[0]).toBe(btoa('NewPassword123!')); // New password should be first
        expect(history).not.toContain(btoa('OldPassword4!')); // Oldest should be removed
      });
    });
  });

  describe('Security Notifications', () => {
    it('should show security notifications', async () => {
      // Add some security notifications
      const notifications = [
        {
          type: 'success',
          message: 'Password reset successfully.',
          timestamp: new Date(),
        },
        {
          type: 'error',
          message: 'Failed to send reset email.',
          timestamp: new Date(),
        },
      ];
      localStorage.setItem('security_notifications', JSON.stringify(notifications));

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Password reset successfully.')).toBeInTheDocument();
        expect(screen.getByText('Failed to send reset email.')).toBeInTheDocument();
      });
    });

    it('should add notification on successful password reset', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const confirmInput = screen.getByPlaceholderText('Confirm new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123!');
      await user.type(confirmInput, 'NewPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        const notifications = JSON.parse(localStorage.getItem('security_notifications') || '[]');
        expect(notifications).toHaveLength(1);
        expect(notifications[0].type).toBe('success');
        expect(notifications[0].message).toContain('Password reset successfully');
      });
    });

    it('should limit security notifications to maximum count', async () => {
      // Fill with maximum notifications
      const maxNotifications = Array.from({ length: 10 }, (_, i) => ({
        type: 'info',
        message: `Notification ${i}`,
        timestamp: new Date().toISOString(),
      }));
      localStorage.setItem('security_notifications', JSON.stringify(maxNotifications));

      const user = userEvent.setup();
      mockRequestPasswordReset.mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const notifications = JSON.parse(localStorage.getItem('security_notifications') || '[]');
        expect(notifications).toHaveLength(10); // Should still be 10
        expect(notifications[0].message).toContain('Password reset email sent successfully');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      mockRequestPasswordReset.mockRejectedValueOnce(new Error('Network error'));

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email address');
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Check that error notification was added to localStorage
        const notifications = JSON.parse(localStorage.getItem('security_notifications') || '[]');
        expect(notifications).toHaveLength(1);
        expect(notifications[0].type).toBe('error');
        expect(notifications[0].message).toContain('Failed to send password reset email');
      });
    });

    it('should handle password reset API errors', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockRejectedValueOnce(new Error('Invalid token'));

      render(
        <TestWrapper searchParams="?token=invalid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const confirmInput = screen.getByPlaceholderText('Confirm new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123!');
      await user.type(confirmInput, 'NewPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        // Check that error notification was added to localStorage
        const notifications = JSON.parse(localStorage.getItem('security_notifications') || '[]');
        expect(notifications).toHaveLength(1);
        expect(notifications[0].type).toBe('error');
        expect(notifications[0].message).toContain('Failed to reset password');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to login', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <PasswordReset />
        </TestWrapper>
      );

      const backButton = screen.getByRole('button', { name: /back to login/i });
      await user.click(backButton);

      // Note: In a real test, you would check if navigation occurred
      // This would require mocking useNavigate or checking window.location
    });

    it('should show success page after successful reset', async () => {
      const user = userEvent.setup();
      mockResetPassword.mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper searchParams="?token=valid-token&email=test@example.com">
          <PasswordReset />
        </TestWrapper>
      );

      const passwordInput = screen.getByPlaceholderText('Enter new password');
      const confirmInput = screen.getByPlaceholderText('Confirm new password');
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'NewPassword123!');
      await user.type(confirmInput, 'NewPassword123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successfully')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue to login/i })).toBeInTheDocument();
      });
    });
  });
});