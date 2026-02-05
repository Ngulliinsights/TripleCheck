import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../../../shared/test-utils'
import { server } from '../../../shared/test-utils/msw-server'
import { http, HttpResponse } from 'msw'

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
  };
});

// Create a ProtectedRoute component for testing
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'user' | 'agent' | 'admin';
  fallback?: React.ReactNode;
}

function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requiredRole,
  fallback = <div>Access Denied</div>
}: ProtectedRouteProps) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();
    
    // Simulate auth check with race condition protection
    fetch('/api/auth/profile', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setUser(data.data);
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setUser(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (requireAuth && !user) {
    return <div data-testid="navigate-to">/auth/login</div>;
  }

  if (requiredRole && user && (user as any).role !== requiredRole) {
    return fallback;
  }

  return <>{children}</>;
}

// Test components
const ProtectedContent = () => <div>Protected Content</div>;
const AdminContent = () => <div>Admin Only Content</div>;
const AgentContent = () => <div>Agent Only Content</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Authentication Guards', () => {
    it('shows loading state while checking authentication', () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return new Promise(() => {
            // Never resolve to keep loading state
          });
        })
      );

      renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects to login when user is not authenticated', async () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate-to')).toHaveTextContent('/auth/login');
      });

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders protected content when user is authenticated', async () => {
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
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUser });
        })
      );

      renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('allows access to public routes without authentication', async () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      renderWithProviders(
        <ProtectedRoute requireAuth={false}>
          <div>Public Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Public Content')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('allows access when user has required role', async () => {
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
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockAdminUser });
        })
      );

      renderWithProviders(
        <ProtectedRoute requiredRole="admin">
          <AdminContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
      });
    });

    it('denies access when user lacks required role', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
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

      renderWithProviders(
        <ProtectedRoute requiredRole="admin">
          <AdminContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    });

    it('shows custom fallback for unauthorized access', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
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

      const customFallback = <div>You need admin privileges to access this page</div>;

      renderWithProviders(
        <ProtectedRoute requiredRole="admin" fallback={customFallback}>
          <AdminContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('You need admin privileges to access this page')).toBeInTheDocument();
      });
    });

    it('allows agent access to agent-only content', async () => {
      const mockAgentUser = {
        id: '2',
        email: 'agent@example.com',
        firstName: 'Agent',
        lastName: 'User',
        role: 'agent',
        isVerified: true,
        isVerifiedAgent: true,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockAgentUser });
        })
      );

      renderWithProviders(
        <ProtectedRoute requiredRole="agent">
          <AgentContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Agent Only Content')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors during auth check', async () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate-to')).toHaveTextContent('/auth/login');
      });
    });

    it('handles malformed auth response', async () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ invalid: 'response' });
        })
      );

      renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate-to')).toHaveTextContent('/auth/login');
      });
    });

    it('handles timeout during auth check', async () => {
      server.use(
        http.get('/api/auth/profile', () => {
          return new Promise(() => {
            // Simulate timeout by never resolving
          });
        })
      );

      renderWithProviders(
        <ProtectedRoute>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // Should show loading state indefinitely
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Multiple Role Requirements', () => {
    // Test component that accepts multiple roles
    function MultiRoleProtectedRoute({ 
      children, 
      allowedRoles = [],
      fallback = <div>Access Denied</div>
    }: { 
      children: React.ReactNode;
      allowedRoles?: string[];
      fallback?: React.ReactNode;
    }) {
      const [user, setUser] = React.useState(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        fetch('/api/auth/profile')
          .then(res => res.json())
          .then(data => {
            if (data.data) {
              setUser(data.data);
            }
          })
          .catch(() => {
            setUser(null);
          })
          .finally(() => {
            setLoading(false);
          });
      }, []);

      if (loading) {
        return <div>Loading...</div>;
      }

      if (!user) {
        return <div data-testid="navigate-to">/auth/login</div>;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes((user as any).role)) {
        return fallback;
      }

      return <>{children}</>;
    }

    it('allows access when user has one of multiple allowed roles', async () => {
      const mockAgentUser = {
        id: '2',
        email: 'agent@example.com',
        firstName: 'Agent',
        lastName: 'User',
        role: 'agent',
        isVerified: true,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockAgentUser });
        })
      );

      renderWithProviders(
        <MultiRoleProtectedRoute allowedRoles={['agent', 'admin']}>
          <div>Agent or Admin Content</div>
        </MultiRoleProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Agent or Admin Content')).toBeInTheDocument();
      });
    });

    it('denies access when user role is not in allowed roles', async () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user',
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

      renderWithProviders(
        <MultiRoleProtectedRoute allowedRoles={['agent', 'admin']}>
          <div>Agent or Admin Content</div>
        </MultiRoleProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });

      expect(screen.queryByText('Agent or Admin Content')).not.toBeInTheDocument();
    });
  });

  describe('Verification Status Guards', () => {
    // Test component that requires verified users
    function VerifiedUserRoute({ 
      children, 
      requireVerified = true,
      fallback = <div>Please verify your account</div>
    }: { 
      children: React.ReactNode;
      requireVerified?: boolean;
      fallback?: React.ReactNode;
    }) {
      const [user, setUser] = React.useState(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        fetch('/api/auth/profile')
          .then(res => res.json())
          .then(data => {
            if (data.data) {
              setUser(data.data);
            }
          })
          .catch(() => {
            setUser(null);
          })
          .finally(() => {
            setLoading(false);
          });
      }, []);

      if (loading) {
        return <div>Loading...</div>;
      }

      if (!user) {
        return <div data-testid="navigate-to">/auth/login</div>;
      }

      if (requireVerified && !(user as any).isVerified) {
        return fallback;
      }

      return <>{children}</>;
    }

    it('allows access for verified users', async () => {
      const mockVerifiedUser = {
        id: '1',
        email: 'verified@example.com',
        firstName: 'Verified',
        lastName: 'User',
        role: 'user',
        isVerified: true,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockVerifiedUser });
        })
      );

      renderWithProviders(
        <VerifiedUserRoute>
          <div>Verified User Content</div>
        </VerifiedUserRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Verified User Content')).toBeInTheDocument();
      });
    });

    it('blocks access for unverified users', async () => {
      const mockUnverifiedUser = {
        id: '1',
        email: 'unverified@example.com',
        firstName: 'Unverified',
        lastName: 'User',
        role: 'user',
        isVerified: false,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUnverifiedUser });
        })
      );

      renderWithProviders(
        <VerifiedUserRoute>
          <div>Verified User Content</div>
        </VerifiedUserRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Please verify your account')).toBeInTheDocument();
      });

      expect(screen.queryByText('Verified User Content')).not.toBeInTheDocument();
    });

    it('allows unverified users when verification is not required', async () => {
      const mockUnverifiedUser = {
        id: '1',
        email: 'unverified@example.com',
        firstName: 'Unverified',
        lastName: 'User',
        role: 'user',
        isVerified: false,
        preferences: {
          notifications: { email: true, sms: false, push: true },
          privacy: { showProfile: true, showContactInfo: false }
        }
      };

      server.use(
        http.get('/api/auth/profile', () => {
          return HttpResponse.json({ data: mockUnverifiedUser });
        })
      );

      renderWithProviders(
        <VerifiedUserRoute requireVerified={false}>
          <div>Content for All Users</div>
        </VerifiedUserRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Content for All Users')).toBeInTheDocument();
      });
    });
  });
});