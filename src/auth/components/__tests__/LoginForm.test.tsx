/**
 * LoginForm Component Tests
 * Comprehensive testing for authentication form functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders, userEventInstance } from '@/shared/test-utils';
import { formTestingUtils, FormValidationHelpers, type FormField } from '@/shared/test-utils/form-testing';
import { LoginForm } from '../LoginForm';
import type { User } from '../../types/auth.types';

// Mock dependencies
vi.mock('../../hooks/useAuth', () => ({
  useLogin: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  })),
}));

vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: vi.fn(),
}));

vi.mock('zxcvbn', () => ({
  default: vi.fn(() => ({
    score: 3,
    feedback: {
      suggestions: ['Add more variety to your password'],
      warning: '',
    },
  })),
}));

describe('LoginForm', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnSuccess = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock useLogin hook
    const { useLogin } = require('../../hooks/useAuth');
    useLogin.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      renderWithProviders(<LoginForm />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your TripleCheck account')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render social login options when enabled', () => {
      renderWithProviders(<LoginForm showSocialLogin={true} />);

      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with facebook/i })).toBeInTheDocument();
    });

    it('should render biometric login when supported and enabled', () => {
      // Mock WebAuthn support
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: function() {},
        writable: true,
      });

      renderWithProviders(<LoginForm enableBiometric={true} />);

      expect(screen.getByRole('button', { name: /use biometric login/i })).toBeInTheDocument();
    });

    it('should not render social login when disabled', () => {
      renderWithProviders(<LoginForm showSocialLogin={false} />);

      expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /continue with facebook/i })).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate email field correctly', async () => {
      renderWithProviders(<LoginForm />);

      const emailValidationTests = FormValidationHelpers.emailValidation();
      await formTestingUtils.testFormValidation(emailValidationTests);
    });

    it('should validate password field correctly', async () => {
      renderWithProviders(<LoginForm />);

      const passwordValidationTests = FormValidationHelpers.passwordValidation();
      await formTestingUtils.testFormValidation(passwordValidationTests);
    });

    it('should show password strength indicator', async () => {
      renderWithProviders(<LoginForm />);

      const passwordField = screen.getByLabelText(/password/i);
      await userEventInstance.type(passwordField, 'testpassword123');

      await waitFor(() => {
        expect(screen.getByText(/password strength/i)).toBeInTheDocument();
        expect(screen.getByText(/good/i)).toBeInTheDocument();
      });
    });

    it('should show password strength feedback', async () => {
      renderWithProviders(<LoginForm />);

      const passwordField = screen.getByLabelText(/password/i);
      await userEventInstance.type(passwordField, 'weak');

      await waitFor(() => {
        expect(screen.getByText(/add more variety to your password/i)).toBeInTheDocument();
      });
    });

    it('should prevent form submission with invalid data', async () => {
      renderWithProviders(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEventInstance.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      mockMutateAsync.mockResolvedValue({ data: { user: mockUser } });
      renderWithProviders(<LoginForm onSuccess={mockOnSuccess} />);

      const formFields: FormField[] = [
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          value: 'test@example.com',
        },
        {
          name: 'password',
          type: 'password',
          label: 'Password',
          value: 'password123',
        },
      ];

      await formTestingUtils.testFormSubmission(formFields, {
        onSubmit: mockMutateAsync,
        expectedSubmitData: {
          email: 'test@example.com',
          password: 'password123',
          rememberMe: false,
        },
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
    });

    it('should handle remember me functionality', async () => {
      mockMutateAsync.mockResolvedValue({ data: { user: mockUser } });
      renderWithProviders(<LoginForm />);

      const formFields: FormField[] = [
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          value: 'test@example.com',
        },
        {
          name: 'password',
          type: 'password',
          label: 'Password',
          value: 'password123',
        },
        {
          name: 'rememberMe',
          type: 'checkbox',
          label: 'Remember me on this device',
          value: true,
        },
      ];

      await formTestingUtils.fillForm(formFields);
      await formTestingUtils.submitForm();

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            rememberMe: true,
          })
        );
      });

      // Verify localStorage interactions
      expect(localStorage.setItem).toHaveBeenCalledWith('rememberMe', 'true');
      expect(localStorage.setItem).toHaveBeenCalledWith('rememberedEmail', 'test@example.com');
    });

    it('should show loading state during submission', async () => {
      const { useLogin } = require('../../hooks/useAuth');
      useLogin.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        error: null,
      });

      renderWithProviders(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /signing in/i });
      expect(submitButton).toBeDisabled();
    });

    it('should handle submission errors', async () => {
      const error = new Error('Invalid credentials');
      const { useLogin } = require('../../hooks/useAuth');
      useLogin.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error,
      });

      renderWithProviders(<LoginForm />);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
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

  describe('Social Login', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:3000',
          href: '',
        },
        writable: true,
      });
    });

    it('should handle Google login', async () => {
      renderWithProviders(<LoginForm showSocialLogin={true} />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await userEventInstance.click(googleButton);

      expect(window.location.href).toBe('http://localhost:3000/api/auth/google');
    });

    it('should handle Facebook login', async () => {
      renderWithProviders(<LoginForm showSocialLogin={true} />);

      const facebookButton = screen.getByRole('button', { name: /continue with facebook/i });
      await userEventInstance.click(facebookButton);

      expect(window.location.href).toBe('http://localhost:3000/api/auth/facebook');
    });

    it('should include redirect parameter in social login', async () => {
      renderWithProviders(<LoginForm showSocialLogin={true} redirectTo="/dashboard" />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await userEventInstance.click(googleButton);

      expect(window.location.href).toBe('http://localhost:3000/api/auth/google?redirect=%2Fdashboard');
    });

    it('should show loading state for social login', async () => {
      renderWithProviders(<LoginForm showSocialLogin={true} />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await userEventInstance.click(googleButton);

      // Button should show loading state briefly before redirect
      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    });
  });

  describe('Biometric Authentication', () => {
    beforeEach(() => {
      // Mock WebAuthn support
      Object.defineProperty(window, 'PublicKeyCredential', {
        value: function() {},
        writable: true,
      });

      // Mock fetch
      global.fetch = vi.fn();
    });

    it('should handle biometric login flow', async () => {
      const mockCredential = { id: 'test-credential' };
      const { startAuthentication } = require('@simplewebauthn/browser');
      startAuthentication.mockResolvedValue(mockCredential);

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ challenge: 'test-challenge' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { user: mockUser } }),
        });

      renderWithProviders(<LoginForm enableBiometric={true} onSuccess={mockOnSuccess} />);

      // Fill email first (required for biometric)
      const emailField = screen.getByLabelText(/email address/i);
      await userEventInstance.type(emailField, 'test@example.com');

      const biometricButton = screen.getByRole('button', { name: /use biometric login/i });
      await userEventInstance.click(biometricButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
      });
    });

    it('should disable biometric button without email', () => {
      renderWithProviders(<LoginForm enableBiometric={true} />);

      const biometricButton = screen.getByRole('button', { name: /use biometric login/i });
      expect(biometricButton).toBeDisabled();
    });

    it('should handle biometric authentication errors', async () => {
      const { startAuthentication } = require('@simplewebauthn/browser');
      startAuthentication.mockRejectedValue(new Error('Biometric failed'));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ challenge: 'test-challenge' }),
      });

      renderWithProviders(<LoginForm enableBiometric={true} />);

      const emailField = screen.getByLabelText(/email address/i);
      await userEventInstance.type(emailField, 'test@example.com');

      const biometricButton = screen.getByRole('button', { name: /use biometric login/i });
      await userEventInstance.click(biometricButton);

      // Should handle error gracefully without crashing
      await waitFor(() => {
        expect(biometricButton).not.toHaveTextContent(/authenticating/i);
      });
    });
  });

  describe('Remember Me Functionality', () => {
    it('should load remembered email on mount', () => {
      (localStorage.getItem as any)
        .mockReturnValueOnce('true') // rememberMe
        .mockReturnValueOnce('remembered@example.com'); // rememberedEmail

      renderWithProviders(<LoginForm />);

      const emailField = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const rememberCheckbox = screen.getByLabelText(/remember me/i) as HTMLInputElement;

      expect(emailField.value).toBe('remembered@example.com');
      expect(rememberCheckbox.checked).toBe(true);
    });

    it('should clear remember me data when unchecked', async () => {
      mockMutateAsync.mockResolvedValue({ data: { user: mockUser } });
      renderWithProviders(<LoginForm />);

      const formFields: FormField[] = [
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          value: 'test@example.com',
        },
        {
          name: 'password',
          type: 'password',
          label: 'Password',
          value: 'password123',
        },
        {
          name: 'rememberMe',
          type: 'checkbox',
          label: 'Remember me on this device',
          value: false,
        },
      ];

      await formTestingUtils.fillForm(formFields);
      await formTestingUtils.submitForm();

      await waitFor(() => {
        expect(localStorage.removeItem).toHaveBeenCalledWith('rememberMe');
        expect(localStorage.removeItem).toHaveBeenCalledWith('rememberedEmail');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form accessibility', async () => {
      renderWithProviders(<LoginForm />);

      const formFields: FormField[] = [
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
        },
        {
          name: 'password',
          type: 'password',
          label: 'Password',
          required: true,
        },
        {
          name: 'rememberMe',
          type: 'checkbox',
          label: 'Remember me on this device',
        },
      ];

      await formTestingUtils.testFormAccessibility(formFields);
    });

    it('should have proper ARIA labels for password toggle', () => {
      renderWithProviders(<LoginForm />);

      const passwordField = screen.getByLabelText(/password/i);
      expect(passwordField).toHaveAttribute('type', 'password');

      // Password toggle button should be accessible
      const toggleButton = screen.getByRole('button', { name: '' });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should announce form errors to screen readers', async () => {
      renderWithProviders(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEventInstance.click(submitButton);

      await waitFor(() => {
        const emailError = screen.getByText(/email is required/i);
        const passwordError = screen.getByText(/password is required/i);

        expect(emailError).toHaveAttribute('role', 'alert');
        expect(passwordError).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation through form fields', async () => {
      renderWithProviders(<LoginForm />);

      const expectedFocusOrder = [
        'Email Address',
        'Password',
        'Remember me on this device',
        'Sign In',
      ];

      await formTestingUtils.testFormAccessibility([
        { name: 'email', type: 'email', label: 'Email Address' },
        { name: 'password', type: 'password', label: 'Password' },
        { name: 'rememberMe', type: 'checkbox', label: 'Remember me on this device' },
      ]);
    });

    it('should handle Enter key submission', async () => {
      mockMutateAsync.mockResolvedValue({ data: { user: mockUser } });
      renderWithProviders(<LoginForm />);

      const emailField = screen.getByLabelText(/email address/i);
      const passwordField = screen.getByLabelText(/password/i);

      await userEventInstance.type(emailField, 'test@example.com');
      await userEventInstance.type(passwordField, 'password123');
      await userEventInstance.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display network errors', async () => {
      const networkError = new Error('Network error');
      const { useLogin } = require('../../hooks/useAuth');
      useLogin.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: networkError,
      });

      renderWithProviders(<LoginForm />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should display generic error for unknown errors', async () => {
      const { useLogin } = require('../../hooks/useAuth');
      useLogin.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        error: 'Unknown error',
      });

      renderWithProviders(<LoginForm />);

      expect(screen.getByText(/login failed.*check your credentials/i)).toBeInTheDocument();
    });
  });

  describe('Redirect Functionality', () => {
    it('should redirect after successful login', async () => {
      mockMutateAsync.mockResolvedValue({ data: { user: mockUser } });
      
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      renderWithProviders(<LoginForm redirectTo="/dashboard" />);

      const formFields: FormField[] = [
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          value: 'test@example.com',
        },
        {
          name: 'password',
          type: 'password',
          label: 'Password',
          value: 'password123',
        },
      ];

      await formTestingUtils.fillForm(formFields);
      await formTestingUtils.submitForm();

      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard');
      });
    });
  });
});