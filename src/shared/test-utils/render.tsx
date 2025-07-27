import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock user context for testing
interface MockUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'agent' | 'admin';
  trustScore: number;
  isVerifiedAgent: boolean;
}

// Mock auth context
const MockAuthContext = React.createContext<{
  user: MockUser | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}>({
  user: null,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
});

// Mock auth provider
export function MockAuthProvider({ 
  children, 
  user = null,
  isAuthenticated = false 
}: { 
  children: ReactNode;
  user?: MockUser | null;
  isAuthenticated?: boolean;
}) {
  const mockAuthValue = {
    user,
    isAuthenticated,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    loading: false,
  };

  return (
    <MockAuthContext.Provider value={mockAuthValue}>
      {children}
    </MockAuthContext.Provider>
  );
}

// Mock theme provider
export function MockThemeProvider({ children }: { children: ReactNode }) {
  return (
    <div data-theme="light" className="theme-provider">
      {children}
    </div>
  );
}

// Create a test query client with optimized settings for testing
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Updated from cacheTime
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
      },
    },
    // Removed logger option as it's not supported in newer versions of React Query
  });
}

// Enhanced render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  initialEntries?: string[];
  queryClient?: QueryClient;
  user?: MockUser | null;
  isAuthenticated?: boolean;
  withRouter?: boolean;
  routerType?: 'browser' | 'memory';
  preloadedState?: any;
}

// Default mock user for testing
export const defaultMockUser: MockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  trustScore: 85,
  isVerifiedAgent: false,
};

// Main render function with all providers
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    user = null,
    isAuthenticated = false,
    withRouter = true,
    routerType = 'memory',
    preloadedState,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Set up window.location for browser router
  if (routerType === 'browser' && route !== '/') {
    window.history.pushState({}, 'Test page', route);
  }

  function AllTheProviders({ children }: { children: ReactNode }) {
    let content = children;

    // Wrap with theme provider
    content = <MockThemeProvider>{content}</MockThemeProvider>;

    // Wrap with auth provider
    content = (
      <MockAuthProvider user={user} isAuthenticated={isAuthenticated}>
        {content}
      </MockAuthProvider>
    );

    // Wrap with query client provider
    content = (
      <QueryClientProvider client={queryClient}>
        {content}
      </QueryClientProvider>
    );

    // Wrap with router if needed
    if (withRouter) {
      if (routerType === 'memory') {
        content = (
          <MemoryRouter initialEntries={initialEntries}>
            {content}
          </MemoryRouter>
        );
      } else {
        content = <BrowserRouter>{content}</BrowserRouter>;
      }
    }

    return <>{content}</>;
  }

  const renderResult = render(ui, { 
    wrapper: AllTheProviders, 
    ...renderOptions 
  });

  return {
    ...renderResult,
    queryClient,
    user,
    rerender: (newUi: ReactElement) => 
      renderResult.rerender(
        <AllTheProviders>{newUi}</AllTheProviders>
      ),
  };
}

// Convenience function for rendering with authenticated user
export function renderWithAuth(
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'user' | 'isAuthenticated'> & {
    user?: MockUser;
  } = {}
) {
  return renderWithProviders(ui, {
    ...options,
    user: options.user || defaultMockUser,
    isAuthenticated: true,
  });
}

// Convenience function for rendering with admin user
export function renderWithAdmin(
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'user' | 'isAuthenticated'> = {}
) {
  const adminUser: MockUser = {
    ...defaultMockUser,
    id: 3,
    username: 'admin',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    trustScore: 100,
  };

  return renderWithProviders(ui, {
    ...options,
    user: adminUser,
    isAuthenticated: true,
  });
}

// Convenience function for rendering with agent user
export function renderWithAgent(
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'user' | 'isAuthenticated'> = {}
) {
  const agentUser: MockUser = {
    ...defaultMockUser,
    id: 2,
    username: 'agent',
    email: 'agent@example.com',
    firstName: 'Agent',
    lastName: 'User',
    role: 'agent',
    trustScore: 92,
    isVerifiedAgent: true,
  };

  return renderWithProviders(ui, {
    ...options,
    user: agentUser,
    isAuthenticated: true,
  });
}

// Function for rendering without router (for isolated component testing)
export function renderWithoutRouter(
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'withRouter'> = {}
) {
  return renderWithProviders(ui, {
    ...options,
    withRouter: false,
  });
}

// Function for testing route changes
export function renderWithRoutes(
  ui: ReactElement,
  routes: string[],
  options: Omit<CustomRenderOptions, 'initialEntries'> = {}
) {
  return renderWithProviders(ui, {
    ...options,
    initialEntries: routes,
    routerType: 'memory',
  });
}

// Helper to create a render function with specific defaults
export function createRenderWithDefaults(defaults: Partial<CustomRenderOptions>) {
  return (ui: ReactElement, options: CustomRenderOptions = {}) => {
    return renderWithProviders(ui, { ...defaults, ...options });
  };
}

// Export the mock context for use in tests
export { MockAuthContext };

// Legacy compatibility - keeping the old function name
export const renderWithAllProviders = renderWithProviders;