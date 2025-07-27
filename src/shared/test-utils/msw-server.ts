import { setupServer } from 'msw/node';
import { http, HttpResponse, type RequestHandler } from 'msw';
import { handlers } from './api-handlers';

// Create MSW server with default handlers
export const server = setupServer(...handlers);

// Enhanced server setup with configuration options
export function setupMswServer(options: {
  onUnhandledRequest?: 'error' | 'warn' | 'bypass';
  quiet?: boolean;
  additionalHandlers?: RequestHandler[];
} = {}) {
  const { 
    onUnhandledRequest = 'warn', 
    quiet = false,
    additionalHandlers = []
  } = options;

  // Add additional handlers if provided
  if (additionalHandlers.length > 0) {
    server.use(...additionalHandlers);
  }

  // Start the server before all tests
  beforeAll(() => {
    server.listen({ 
      onUnhandledRequest,
      ...(quiet && { onUnhandledRequest: 'bypass' })
    });
    
    if (!quiet) {
      console.log('🔧 MSW server started');
    }
  });
  
  // Reset handlers between tests to ensure test isolation
  afterEach(() => {
    server.resetHandlers();
  });
  
  // Close server after all tests
  afterAll(() => {
    server.close();
    
    if (!quiet) {
      console.log('🔧 MSW server stopped');
    }
  });
}

// Helper to create a success response with consistent format
export function mockApiSuccess<T>(path: string, data: T, options: {
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  status?: number;
  message?: string;
  delay?: number;
} = {}) {
  const { method = 'get', status = 200, message = 'Success', delay = 0 } = options;
  
  const handler = http[method](path, async () => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return HttpResponse.json({
      success: true,
      data,
      message,
    }, { status });
  });
  
  return handler;
}

// Helper to create an error response with consistent format
export function mockApiError(path: string, options: {
  method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
  status?: number;
  message?: string;
  error?: string;
  delay?: number;
} = {}) {
  const { 
    method = 'get', 
    status = 400, 
    message = 'Error occurred',
    error = 'Bad Request',
    delay = 0
  } = options;
  
  const handler = http[method](path, async () => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return new HttpResponse(
      JSON.stringify({
        success: false,
        error,
        message,
      }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  });
  
  return handler;
}

// Helper to create paginated response
export function mockApiPaginated<T>(
  path: string, 
  items: T[], 
  options: {
    method?: 'get' | 'post';
    defaultPage?: number;
    defaultLimit?: number;
    totalCount?: number;
  } = {}
) {
  const { method = 'get', defaultPage = 1, defaultLimit = 20, totalCount = items.length } = options;
  
  const handler = http[method](path, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || String(defaultPage));
    const limit = parseInt(url.searchParams.get('limit') || String(defaultLimit));
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    return HttpResponse.json({
      success: true,
      data: {
        items: paginatedItems,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: endIndex < totalCount,
        hasPreviousPage: page > 1,
      },
    });
  });
  
  return handler;
}

// Helper to mock authentication endpoints
export function mockAuthEndpoints(options: {
  validCredentials?: { email: string; password: string };
  mockUser?: any;
  tokenExpiry?: number;
} = {}) {
  const { 
    validCredentials = { email: 'test@example.com', password: 'password123' },
    mockUser = { id: 1, email: 'test@example.com', name: 'Test User' },
    tokenExpiry = 3600000 // 1 hour
  } = options;
  
  return [
    // Login endpoint
    http.post('/api/auth/login', async ({ request }) => {
      const body = await request.json() as any;
      
      if (body.email === validCredentials.email && body.password === validCredentials.password) {
        return HttpResponse.json({
          success: true,
          data: {
            user: mockUser,
            token: 'mock-jwt-token',
            expiresIn: tokenExpiry,
          },
        });
      }
      
      return new HttpResponse(
        JSON.stringify({
          success: false,
          error: 'Invalid credentials',
        }),
        { status: 401 }
      );
    }),
    
    // Register endpoint
    http.post('/api/auth/register', async ({ request }) => {
      const body = await request.json() as any;
      
      return HttpResponse.json({
        success: true,
        data: {
          user: { ...mockUser, ...body, id: Date.now() },
          token: 'mock-jwt-token',
          expiresIn: tokenExpiry,
        },
      }, { status: 201 });
    }),
    
    // Logout endpoint
    http.post('/api/auth/logout', () => {
      return HttpResponse.json({
        success: true,
        message: 'Logged out successfully',
      });
    }),
    
    // Current user endpoint
    http.get('/api/auth/me', () => {
      return HttpResponse.json({
        success: true,
        data: mockUser,
      });
    }),
    
    // Session validation endpoint
    http.get('/api/auth/validate-session', () => {
      return HttpResponse.json({
        success: true,
        data: { valid: true, user: mockUser },
      });
    }),
  ];
}

// Helper to simulate network conditions
export function simulateNetworkConditions(options: {
  offline?: boolean;
  slow?: boolean;
  unreliable?: boolean;
} = {}) {
  const { offline = false, slow = false, unreliable = false } = options;
  
  if (offline) {
    // Mock all requests to fail with network error
    server.use(
      http.all('*', () => {
        return HttpResponse.error();
      })
    );
  } else if (slow) {
    // Add delay to all requests
    server.use(
      http.all('*', async ({ request }) => {
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        return new HttpResponse(null, { status: 408 }); // Request timeout
      })
    );
  } else if (unreliable) {
    // Randomly fail some requests
    server.use(
      http.all('*', ({ request }) => {
        if (Math.random() < 0.3) { // 30% failure rate
          return new HttpResponse(
            JSON.stringify({
              success: false,
              error: 'Network error',
            }),
            { status: 500 }
          );
        }
        // Let other handlers process the request
        return;
      })
    );
  }
}

// Helper to add request logging for debugging
export function enableRequestLogging() {
  server.events.on('request:start', ({ request }) => {
    console.log(`🌐 ${request.method} ${request.url}`);
  });
  
  server.events.on('request:match', ({ request }) => {
    console.log(`✅ Matched ${request.method} ${request.url}`);
  });
  
  server.events.on('request:unhandled', ({ request }) => {
    console.log(`❌ Unhandled ${request.method} ${request.url}`);
  });
}

// Helper to reset server to default state
export function resetServerToDefaults() {
  server.resetHandlers(...handlers);
}

// Helper to add temporary handlers for specific tests
export function withTemporaryHandlers(
  tempHandlers: RequestHandler[],
  testFn: () => Promise<void> | void
) {
  return async () => {
    server.use(...tempHandlers);
    try {
      await testFn();
    } finally {
      server.resetHandlers();
    }
  };
}

// Export server instance and common utilities
export { server as mswServer };
export default server;