/**
 * Testing Utilities
 * Comprehensive testing helpers and utilities
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React, { ReactElement } from 'react';
import { vi } from 'vitest';

// Mock services for testing
export const mockServices = {
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    has: vi.fn(),
    getStats: vi.fn(() => ({
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: 0,
      newestEntry: 0
    }))
  },
  
  authTokenService: {
    getAccessToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    getTokenPayload: vi.fn(),
    hasPermission: vi.fn(),
    hasRole: vi.fn(),
    getUserId: vi.fn(),
    getUserEmail: vi.fn()
  },
  
  validationService: {
    validate: vi.fn(),
    sanitizeHtml: vi.fn(),
    sanitizeSql: vi.fn(),
    sanitizeUserInput: vi.fn()
  },
  
  performanceService: {
    recordMetric: vi.fn(),
    startTiming: vi.fn(() => vi.fn()),
    measureAsync: vi.fn(),
    measureSync: vi.fn(),
    getPerformanceReport: vi.fn(() => ({
      metrics: [],
      summary: {
        totalMetrics: 0,
        averageLoadTime: 0,
        slowestResource: '',
        fastestResource: '',
        coreWebVitals: { lcp: 0, fid: 0, cls: 0 }
      },
      recommendations: []
    }))
  },
  
  healthCheckService: {
    performHealthChecks: vi.fn(),
    checkEndpointHealth: vi.fn(),
    getCurrentHealth: vi.fn(),
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn()
  },
  
  auditLogService: {
    logEvent: vi.fn(),
    logAuthentication: vi.fn(),
    logAuthorization: vi.fn(),
    logDataAccess: vi.fn(),
    logSecurityEvent: vi.fn(),
    getEvents: vi.fn(() => []),
    getSecuritySummary: vi.fn(() => ({
      totalEvents: 0,
      failedLogins: 0,
      unauthorizedAccess: 0,
      highRiskEvents: 0,
      recentEvents: []
    }))
  }
};

// Test providers wrapper
interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

const TestProviders: React.FC<TestProvidersProps> = ({ 
  children, 
  queryClient,
  initialRoute = '/'
}) => {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Mock window.location for routing tests
  if (initialRoute !== '/') {
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        pathname: initialRoute,
      },
      writable: true,
    });
  }

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { queryClient, initialRoute, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestProviders queryClient={queryClient} initialRoute={initialRoute}>
      {children}
    </TestProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock API responses
export const mockApiResponses = {
  success: (data: any) => ({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  }),
  
  error: (status: number, message: string) => ({
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: message }),
    text: async () => JSON.stringify({ error: message }),
  }),
  
  loading: () => new Promise(() => {}), // Never resolves
};

// Mock fetch function
export const mockFetch = (response: any) => {
  global.fetch = vi.fn().mockResolvedValue(response);
};

// Mock WebSocket
export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string, public protocols?: string | string[]) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send(data: string | ArrayBuffer | Blob | ArrayBufferView) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.(new CloseEvent('close', { code, reason }));
    }, 0);
  }

  // Test helpers
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }
}

// Mock localStorage
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
};

// Mock sessionStorage
export const mockSessionStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
};

// Mock IntersectionObserver
export const mockIntersectionObserver = () => {
  const mockObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };

  global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
    return {
      ...mockObserver,
      trigger: (entries: any[]) => callback(entries),
    };
  });

  return mockObserver;
};

// Mock ResizeObserver
export const mockResizeObserver = () => {
  const mockObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };

  global.ResizeObserver = vi.fn().mockImplementation((callback) => {
    return {
      ...mockObserver,
      trigger: (entries: any[]) => callback(entries),
    };
  });

  return mockObserver;
};

// Mock performance API
export const mockPerformance = () => {
  const mockPerformance = {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  };

  Object.defineProperty(global, 'performance', {
    value: mockPerformance,
    writable: true,
  });

  return mockPerformance;
};

// Test data factories
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user',
  permissions: ['read', 'write'],
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockProperty = (overrides: Partial<any> = {}) => ({
  id: 'prop-123',
  title: 'Beautiful Family Home',
  description: 'A lovely 3-bedroom house in a quiet neighborhood',
  price: 350000,
  address: '123 Main St, Anytown, USA',
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 1500,
  images: ['image1.jpg', 'image2.jpg'],
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockMessage = (overrides: Partial<any> = {}) => ({
  id: 'msg-123',
  threadId: 'thread-123',
  senderId: 'user-123',
  content: 'Hello, this is a test message',
  messageType: 'text',
  timestamp: new Date().toISOString(),
  isRead: false,
  deliveryStatus: 'delivered',
  ...overrides,
});

// Async testing utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (!condition() && Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};

// Error boundary for testing
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Something went wrong</div>;
    }

    return this.props.children;
  }
}

// Setup and teardown helpers
export const setupTest = () => {
  // Mock services
  vi.clearAllMocks();
  
  // Mock browser APIs
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage(),
    writable: true,
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage(),
    writable: true,
  });
  
  global.WebSocket = MockWebSocket as any;
  mockIntersectionObserver();
  mockResizeObserver();
  mockPerformance();
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
};

export const teardownTest = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};