import { QueryClient, QueryFunction } from "@tanstack/react-query";

import { requestManager, RequestOptions } from "./request-manager";

// Simple API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Simple error handling utilities
function parseError(error: any): APIError {
  if (error instanceof APIError) return error;
  if (error instanceof Error) {
    return new APIError(error.message, 500);
  }
  return new APIError(String(error), 500);
}

function isRetryableError(error: APIError): boolean {
  return error.status >= 500 || error.status === 429;
}

function logError(error: APIError, context: string): void {
  console.error(`[${context}] ${error.message}`, error);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let errorData;
    
    try {
      errorData = JSON.parse(text);
    } catch {
      errorData = { message: text };
    }
    
    throw new APIError(
      errorData.message || res.statusText,
      res.status,
      errorData.code,
      errorData
    );
  }
}

/**
 * Enhanced API request function with coordinated request management
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url API endpoint URL
 * @param data Optional request payload (for POST, PUT, etc.)
 * @param options Additional fetch options and request management options
 * @returns JSON parsed response or null for empty responses
 */
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: Omit<RequestInit, 'method' | 'body'> & {
    requestOptions?: RequestOptions;
  } = {}
): Promise<T> {
  // Ensure URL starts with / for consistency
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  
  // Extract request management options
  const { requestOptions, ...fetchOptions } = options;
  
  // Generate request key for coordination
  const requestKey = requestOptions?.key || `${method}:${normalizedUrl}`;
  
  // Use RequestManager for coordinated request handling
  return requestManager.makeRequest<T>(
    async (signal: AbortSignal) => {
      // Handle different types of request data
      let headers: HeadersInit = {};
      
      // Safely add headers from options
      if (fetchOptions.headers && typeof fetchOptions.headers === 'object') {
        if (fetchOptions.headers instanceof Headers) {
          fetchOptions.headers.forEach((value, key) => {
            if (headers instanceof Headers) {
              headers.append(key, value);
            } else if (typeof headers === 'object') {
              (headers as Record<string, string>)[key] = value;
            }
          });
        } else {
          headers = { ...fetchOptions.headers as Record<string, string> };
        }
      }
      
      let body: any = undefined;
      
      // Handle various data types appropriately
      if (data) {
        if (data instanceof FormData) {
          // FormData should not set Content-Type as browser will set it with boundary
          body = data;
        } else if (typeof data === 'object') {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(data);
        } else {
          body = data;
        }
      }
      
      const res = await fetch(normalizedUrl, {
        method,
        headers,
        body,
        credentials: "include",
        signal, // Use the coordinated abort signal
        ...fetchOptions
      });

      await throwIfResNotOk(res);
      
      // For empty responses or non-JSON responses
      if (res.status === 204 || res.headers.get('content-length') === '0') {
        return null as T;
      }
      
      try {
        return await res.json() as T;
      } catch (error) {
        console.warn(`Response could not be parsed as JSON from ${normalizedUrl}`);
        return null as T;
      }
    },
    {
      key: requestKey,
      cancelPrevious: method === 'GET', // Cancel previous GET requests by default
      retry: {
        attempts: 3,
        delay: 1000,
        backoff: 'exponential'
      },
      ...requestOptions
    }
  );
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T | null> =>
  async ({ queryKey, signal }) => {
    const { on401: unauthorizedBehavior } = options;
    // Use RequestManager for coordinated query requests
    return requestManager.makeRequest<T | null>(
      async (coordinatedSignal: AbortSignal) => {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
          signal: coordinatedSignal,
        });

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        await throwIfResNotOk(res);
        return await res.json();
      },
      {
        key: `query:${queryKey.join(':')}`,
        signal, // Pass through the query's abort signal
        cancelPrevious: true, // Cancel previous queries with same key
        priority: 'normal'
      }
    );
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Enhanced caching strategy based on data type
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for offline access
      retry: (failureCount, error: any) => {
        const parsedError = parseError(error);
        logError(parsedError, 'React Query Retry');
        
        // Use the new error handling system
        if (!isRetryableError(parsedError)) {
          return false;
        }
        
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        const parsedError = parseError(error);
        logError(parsedError, 'React Query Mutation Retry');
        
        // Use the new error handling system
        if (!isRetryableError(parsedError)) {
          return false;
        }
        
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Enhanced query key factories with caching strategies
export const queryKeys = {
  // Static/reference data - cache for 1 hour
  static: {
    propertyTypes: ['property-types'] as const,
    locations: ['locations'] as const,
    amenities: ['amenities'] as const,
  },
  
  // User-specific data - cache for 10 minutes
  user: {
    profile: (userId: string) => ['user', 'profile', userId] as const,
    preferences: (userId: string) => ['user', 'preferences', userId] as const,
    notifications: (userId: string) => ['user', 'notifications', userId] as const,
  },
  
  // Property data - cache for 5 minutes
  properties: {
    list: (filters?: any) => ['properties', 'list', filters] as const,
    detail: (id: string) => ['properties', 'detail', id] as const,
    similar: (id: string) => ['properties', 'similar', id] as const,
    stats: (filters?: any) => ['properties', 'stats', filters] as const,
    owner: (ownerId: string) => ['properties', 'owner', ownerId] as const,
  },
  
  // Trust/verification data - cache for 2 minutes (more dynamic)
  trust: {
    score: (userId: string) => ['trust', 'score', userId] as const,
    verification: (userId: string) => ['trust', 'verification', userId] as const,
    community: (userId: string) => ['trust', 'community', userId] as const,
  },
  
  // Analytics data - cache for 15 minutes
  analytics: {
    metrics: (filters?: any) => ['analytics', 'metrics', filters] as const,
    timeSeries: (filters?: any) => ['analytics', 'timeSeries', filters] as const,
  }
};

// Cache configuration presets
export const cachePresets = {
  // Static reference data
  static: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // User profile data
  profile: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  
  // Property listings
  listings: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // Real-time data
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Analytics data
  analytics: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  }
};
