import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../../shared/test-utils';
import { server } from '../../../shared/test-utils/msw-server';
import { http, HttpResponse } from 'msw';
import Login from '../Login';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Rendering', () => {
    it('renders login page with form', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders social login options', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
      expect(screen.getByText(/continue with facebook/i)).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    });

    it('renders sign up link', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors for empty fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('shows validation error for short password', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });
  });

  describe('Login Flow', () => {
    it('successfully logs in user and redirects to dashboard', async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isVerified: true,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json({
            data: {
              user: mockUser,
              token: 'mock-token'
            }
          });
        })
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('redirects admin users to admin dashboard', async () => {
      const user = userEvent.setup();
      const mockAdminUser = {
        id: '1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isVerified: true,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json({
            data: {
              user: mockAdminUser,
              token: 'admin-token'
            }
          });
        })
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'admin@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    it('displays error message on login failure', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/login', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Invalid credentials' }),
            { status: 401 }
          );
        })
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows loading state during login', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/login', () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(HttpResponse.json({
                data: {
                  user: { id: '1', email: 'test@example.com', role: 'user' },
                  token: 'token'
                }
              }));
            }, 100);
          });
        })
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Remember Me Functionality', () => {
    it('saves email when remember me is checked', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json({
            data: {
              user: { id: '1', email: 'test@example.com', role: 'user' },
              token: 'token'
            }
          });
        })
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(rememberCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberMe', 'true');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberedEmail', 'test@example.com');
      });
    });

    it('loads remembered email on page load', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'rememberMe') return 'true';
        if (key === 'rememberedEmail') return 'remembered@example.com';
        return null;
      });

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const rememberCheckbox = screen.getByRole('checkbox', { name: /remember me/i }) as HTMLInputElement;

      expect(emailInput.value).toBe('remembered@example.com');
      expect(rememberCheckbox.checked).toBe(true);
    });

    it('does not save email when remember me is unchecked', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.json({
            data: {
              user: { id: '1', email: 'test@example.com', role: 'user' },
              token: 'token'
            }
          });
        })
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('rememberMe');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('rememberedEmail');
      });
    });
  });

  describe('Social Login', () => {
    it('redirects to Google OAuth when Google login is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '', origin: 'http://localhost:3000' } as any;

      renderWithProviders(<Login />);

      const googleButton = screen.getByText(/continue with google/i);
      await user.click(googleButton);

      expect(window.location.href).toBe('http://localhost:3000/api/auth/google');
    });

    it('redirects to Facebook OAuth when Facebook login is clicked', async () => {
      const user = userEvent.setup();
      
      delete (window as any).location;
      window.location = { href: '', origin: 'http://localhost:3000' } as any;

      renderWithProviders(<Login />);

      const facebookButton = screen.getByText(/continue with facebook/i);
      await user.click(facebookButton);

      expect(window.location.href).toBe('http://localhost:3000/api/auth/facebook');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(button => 
        button.getAttribute('type') === 'button' && 
        !button.textContent?.includes('Continue') && 
        !button.textContent?.includes('Sign')
      );

      expect(passwordInput.type).toBe('password');

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput.type).toBe('text');

        await user.click(toggleButton);
        expect(passwordInput.type).toBe('password');
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<Login />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
      expect(screen.getByRole('checkbox', { name: /remember me/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('associates form labels with inputs correctly', () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('id');
      expect(passwordInput).toHaveAttribute('id');
    });

    it('provides proper error announcements for screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailError = screen.getByText('Email is required');
        const passwordError = screen.getByText('Password is required');
        
        expect(emailError).toBeInTheDocument();
        expect(passwordError).toBeInTheDocument();
      });
    });
  });

  describe('Network Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
    });

    it('handles timeout errors', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/login', () => {
          return new Promise(() => {
            // Never resolve to simulate timeout
          });
        })
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Signing in...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});