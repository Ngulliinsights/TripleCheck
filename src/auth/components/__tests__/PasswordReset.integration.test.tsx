import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../../../shared/test-utils'
import { server } from '../../../shared/test-utils/msw-server'
import { http, HttpResponse } from 'msw'

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
  };
});

// Mock PasswordReset components for testing
function ForgotPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to send reset email');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div data-testid="success-message">
        <h2>Check Your Email</h2>
        <p>We've sent a password reset link to {email}</p>
        <p>Please check your email and follow the instructions to reset your password.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="forgot-password-form">
      <h2>Reset Your Password</h2>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
      
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email address"
        />
      </div>

      <button type="submit" disabled={loading || !email}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>

      <div>
        <a href="/auth/login">Back to Login</a>
      </div>
    </form>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const [formData, setFormData] = React.useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [tokenValid, setTokenValid] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    // Validate token on mount
    fetch('/api/auth/validate-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(res => res.json())
      .then(data => {
        setTokenValid(data.data.valid);
      })
      .catch(() => {
        setTokenValid(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reset password');
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (tokenValid === null) {
    return <div>Validating reset link...</div>;
  }

  if (tokenValid === false) {
    return (
      <div data-testid="invalid-token">
        <h2>Invalid Reset Link</h2>
        <p>This password reset link is invalid or has expired.</p>
        <a href="/auth/forgot-password">Request a new reset link</a>
      </div>
    );
  }

  if (success) {
    return (
      <div data-testid="reset-success">
        <h2>Password Reset Successful</h2>
        <p>Your password has been successfully reset.</p>
        <a href="/auth/login">Sign in with your new password</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-testid="reset-password-form">
      <h2>Set New Password</h2>
      <p>Enter your new password below.</p>
      
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          required
          placeholder="Enter new password"
          minLength={8}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          required
          placeholder="Confirm new password"
        />
      </div>

      <button type="submit" disabled={loading || !formData.password || !formData.confirmPassword}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

// Main password reset flow component
function PasswordResetFlow() {
  const [step, setStep] = React.useState<'request' | 'reset'>('request');
  const [resetToken, setResetToken] = React.useState('');

  React.useEffect(() => {
    // Check if we have a reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setStep('reset');
    }
  }, []);

  if (step === 'reset' && resetToken) {
    return <ResetPasswordForm token={resetToken} />;
  }

  return <ForgotPasswordForm onSuccess={() => setStep('request')} />;
}

describe('Password Reset Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.listen();
    // Clear URL parameters
    window.history.replaceState({}, '', '/auth/forgot-password');
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Forgot Password Flow', () => {
    it('renders forgot password form', () => {
      renderWithProviders(<ForgotPasswordForm />);

      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
      expect(screen.getByText(/back to login/i)).toBeInTheDocument();
    });

    it('validates email input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ForgotPasswordForm />);

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      
      // Button should be disabled when email is empty
      expect(submitButton).toBeDisabled();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      // Button should be enabled with valid email
      expect(submitButton).not.toBeDisabled();
    });

    it('successfully sends reset email', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();

      server.use(
        http.post('/api/auth/forgot-password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<ForgotPasswordForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
        expect(screen.getByText(/we've sent a password reset link to test@example.com/i)).toBeInTheDocument();
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('handles email not found error', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/forgot-password', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Email not found' }),
            { status: 404 }
          );
        })
      );

      renderWithProviders(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to send reset email');
      });

      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
    });

    it('shows loading state during request', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/forgot-password', () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(HttpResponse.json({ success: true }));
            }, 100);
          });
        })
      );

      renderWithProviders(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('handles network errors', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/forgot-password', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to send reset email');
      });
    });
  });

  describe('Reset Password Flow', () => {
    it('validates reset token on mount', async () => {
      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: true, email: 'test@example.com' }
          });
        })
      );

      renderWithProviders(<ResetPasswordForm token="valid-token" />);

      expect(screen.getByText('Validating reset link...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
      });
    });

    it('handles invalid reset token', async () => {
      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: false }
          });
        })
      );

      renderWithProviders(<ResetPasswordForm token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('invalid-token')).toBeInTheDocument();
        expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
        expect(screen.getByText(/request a new reset link/i)).toBeInTheDocument();
      });
    });

    it('handles token validation error', async () => {
      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<ResetPasswordForm token="error-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('invalid-token')).toBeInTheDocument();
      });
    });

    it('validates password requirements', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: true, email: 'test@example.com' }
          });
        })
      );

      renderWithProviders(<ResetPasswordForm token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      // Test short password
      await user.type(passwordInput, '123');
      await user.type(confirmPasswordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 8 characters');
      });
    });

    it('validates password confirmation', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: true, email: 'test@example.com' }
          });
        })
      );

      renderWithProviders(<ResetPasswordForm token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'differentpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent("Passwords don't match");
      });
    });

    it('successfully resets password', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: true, email: 'test@example.com' }
          });
        }),
        http.post('/api/auth/reset-password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      renderWithProviders(<ResetPasswordForm token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('reset-success')).toBeInTheDocument();
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
        expect(screen.getByText(/sign in with your new password/i)).toBeInTheDocument();
      });
    });

    it('handles reset password failure', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: true, email: 'test@example.com' }
          });
        }),
        http.post('/api/auth/reset-password', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Token expired' }),
            { status: 400 }
          );
        })
      );

      renderWithProviders(<ResetPasswordForm token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to reset password');
      });

      expect(screen.queryByTestId('reset-success')).not.toBeInTheDocument();
    });

    it('shows loading state during password reset', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: true, email: 'test@example.com' }
          });
        }),
        http.post('/api/auth/reset-password', () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(HttpResponse.json({ success: true }));
            }, 100);
          });
        })
      );

      renderWithProviders(<ResetPasswordForm token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      await user.click(submitButton);

      expect(screen.getByText('Resetting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Complete Password Reset Flow', () => {
    it('handles complete flow from request to reset', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/forgot-password', () => {
          return HttpResponse.json({ success: true });
        }),
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: true, email: 'test@example.com' }
          });
        }),
        http.post('/api/auth/reset-password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      // Start with forgot password form
      renderWithProviders(<PasswordResetFlow />);

      expect(screen.getByText('Reset Your Password')).toBeInTheDocument();

      // Request reset
      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });

      // Simulate clicking reset link (with token in URL)
      window.history.replaceState({}, '', '/auth/reset-password?token=valid-reset-token');
      
      // Re-render with token
      renderWithProviders(<PasswordResetFlow />);

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
      });

      // Reset password
      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'newpassword123');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles in forgot password form', () => {
      renderWithProviders(<ForgotPasswordForm />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('required');
    });

    it('has proper ARIA labels and roles in reset password form', async () => {
      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: true, email: 'test@example.com' }
          });
        })
      );

      renderWithProviders(<ResetPasswordForm token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toHaveAttribute('type', 'password');
        expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
        expect(screen.getByLabelText(/new password/i)).toHaveAttribute('required');
        expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('required');
      });
    });

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/forgot-password', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<ForgotPasswordForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveTextContent('Failed to send reset email');
      });
    });
  });
});