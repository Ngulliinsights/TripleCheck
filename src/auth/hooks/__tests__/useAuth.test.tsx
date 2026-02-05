import React from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  useAuth, 
  useLogin, 
  useRegister, 
  useLogout, 
  useUpdateProfile,
  useRequestPasswordReset,
  useResetPassword,
  useValidateResetToken
} from '../useAuth'
import { server } from '../../../shared/test-utils/msw-server'
import { http, HttpResponse } from 'msw'

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

describe('useAuth hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    server.listen();
  });

  afterEach(() => {
    queryClient.clear();
    server.resetHandlers();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('useAuth', () => {
    it('returns unauthenticated state when no user data', async () => {
      // Mock failed profile fetch
      server.use(
        http.get('/api/auth/profile', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.user).toBe(null);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('returns authenticated state when user data exists', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as const,
        isVerified: true,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('handles loading state correctly', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useLogin', () => {
    it('successfully logs in user with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as const,
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

      const { result } = renderHook(() => useLogin(), { wrapper });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      };

      await result.current.mutateAsync(credentials);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'mock-token');
      expect(queryClient.getQueryData(['auth', 'profile'])).toEqual({ data: mockUser });
    });

    it('handles login failure with invalid credentials', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Invalid credentials' }),
            { status: 401 }
          );
        })
      );

      const { result } = renderHook(() => useLogin(), { wrapper });

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(result.current.mutateAsync(credentials)).rejects.toThrow('Login failed');
    });

    it('handles network errors during login', async () => {
      server.use(
        http.post('/api/auth/login', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useLogin(), { wrapper });

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      await expect(result.current.mutateAsync(credentials)).rejects.toThrow('Login failed');
    });
  });

  describe('useRegister', () => {
    it('successfully registers new user', async () => {
      const mockUser = {
        id: '2',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        role: 'user' as const,
        isVerified: false,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.post('/api/auth/register', () => {
          return HttpResponse.json({
            data: {
              user: mockUser,
              token: 'new-user-token'
            }
          });
        })
      );

      const { result } = renderHook(() => useRegister(), { wrapper });

      const registrationData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        agreeToTerms: true
      };

      await result.current.mutateAsync(registrationData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-user-token');
      expect(queryClient.getQueryData(['auth', 'profile'])).toEqual({ data: mockUser });
    });

    it('handles registration failure with existing email', async () => {
      server.use(
        http.post('/api/auth/register', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Email already exists' }),
            { status: 409 }
          );
        })
      );

      const { result } = renderHook(() => useRegister(), { wrapper });

      const registrationData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        agreeToTerms: true
      };

      await expect(result.current.mutateAsync(registrationData)).rejects.toThrow('Registration failed');
    });

    it('handles validation errors during registration', async () => {
      server.use(
        http.post('/api/auth/register', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Validation failed' }),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useRegister(), { wrapper });

      const registrationData = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
        agreeToTerms: false
      };

      await expect(result.current.mutateAsync(registrationData)).rejects.toThrow('Registration failed');
    });
  });

  describe('useLogout', () => {
    it('successfully logs out user', async () => {
      // Set up initial authenticated state
      localStorageMock.getItem.mockReturnValue('existing-token');
      queryClient.setQueryData(['auth', 'profile'], { data: { id: '1', email: 'test@example.com' } });

      server.use(
        http.post('/api/auth/logout', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useLogout(), { wrapper });

      await result.current.mutateAsync();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });

    it('clears local data even if logout request fails', async () => {
      localStorageMock.getItem.mockReturnValue('existing-token');
      queryClient.setQueryData(['auth', 'profile'], { data: { id: '1', email: 'test@example.com' } });

      server.use(
        http.post('/api/auth/logout', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useLogout(), { wrapper });

      await expect(result.current.mutateAsync()).rejects.toThrow('Logout failed');
      
      // Should still clear local data
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
  });

  describe('useUpdateProfile', () => {
    it('successfully updates user profile', async () => {
      const updatedUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        role: 'user' as const,
        isVerified: true,
        preferences: {
          notifications: { email: false, sms: true, push: true },
          privacy: { showProfile: false, showContactInfo: true }
        }
      };

      server.use(
        http.patch('/api/auth/profile', () => {
          return HttpResponse.json({ data: updatedUser });
        })
      );

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        preferences: {
          notifications: { email: false, sms: true, push: true },
          privacy: { showProfile: false, showContactInfo: true }
        }
      };

      await result.current.mutateAsync(updates);

      expect(queryClient.getQueryData(['auth', 'profile'])).toEqual({ data: updatedUser });
    });

    it('handles profile update failure', async () => {
      server.use(
        http.patch('/api/auth/profile', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Update failed' }),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      const updates = { firstName: 'Updated' };

      await expect(result.current.mutateAsync(updates)).rejects.toThrow('Failed to update profile');
    });
  });

  describe('useRequestPasswordReset', () => {
    it('successfully requests password reset', async () => {
      server.use(
        http.post('/api/auth/forgot-password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useRequestPasswordReset(), { wrapper });

      await result.current.mutateAsync('test@example.com');

      expect(result.current.isSuccess).toBe(true);
    });

    it('handles password reset request failure', async () => {
      server.use(
        http.post('/api/auth/forgot-password', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Email not found' }),
            { status: 404 }
          );
        })
      );

      const { result } = renderHook(() => useRequestPasswordReset(), { wrapper });

      await expect(result.current.mutateAsync('nonexistent@example.com')).rejects.toThrow('Password reset request failed');
    });
  });

  describe('useResetPassword', () => {
    it('successfully resets password with valid token', async () => {
      server.use(
        http.post('/api/auth/reset-password', () => {
          return HttpResponse.json({ success: true });
        })
      );

      const { result } = renderHook(() => useResetPassword(), { wrapper });

      await result.current.mutateAsync({
        token: 'valid-reset-token',
        password: 'newpassword123'
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('handles password reset failure with invalid token', async () => {
      server.use(
        http.post('/api/auth/reset-password', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Invalid or expired token' }),
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useResetPassword(), { wrapper });

      await expect(result.current.mutateAsync({
        token: 'invalid-token',
        password: 'newpassword123'
      })).rejects.toThrow('Password reset failed');
    });
  });

  describe('useValidateResetToken', () => {
    it('successfully validates reset token', async () => {
      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: true, email: 'test@example.com' }
          });
        })
      );

      const { result } = renderHook(() => useValidateResetToken(), { wrapper });

      const response = await result.current.mutateAsync('valid-token');

      expect(response.data.valid).toBe(true);
      expect(response.data.email).toBe('test@example.com');
    });

    it('handles invalid reset token', async () => {
      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.json({
            data: { valid: false }
          });
        })
      );

      const { result } = renderHook(() => useValidateResetToken(), { wrapper });

      const response = await result.current.mutateAsync('invalid-token');

      expect(response.data.valid).toBe(false);
    });

    it('handles token validation failure', async () => {
      server.use(
        http.post('/api/auth/validate-reset-token', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useValidateResetToken(), { wrapper });

      await expect(result.current.mutateAsync('token')).rejects.toThrow('Token validation failed');
    });
  });
});