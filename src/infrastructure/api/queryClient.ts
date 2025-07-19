import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { APIError, parseError, isRetryableError, logError } from "../../shared/utils/error-handling";

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
 * Enhanced API request function that handles different request types and formats
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url API endpoint URL
 * @param data Optional request payload (for POST, PUT, etc.)
 * @param options Additional fetch options
 * @returns JSON parsed response or null for empty responses
 */
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<T> {
  // Ensure URL starts with / for consistency
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  
  // Handle different types of request data
  let headers: HeadersInit = {};
  
  // Safely add headers from options
  if (options.headers && typeof options.headers === 'object') {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        if (headers instanceof Headers) {
          headers.append(key, value);
        } else if (typeof headers === 'object') {
          (headers as Record<string, string>)[key] = value;
        }
      });
    } else {
      headers = { ...options.headers as Record<string, string> };
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
  
  try {
    const res = await fetch(normalizedUrl, {
      method,
      headers,
      body,
      credentials: "include",
      ...options
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
  } catch (error) {
    console.error(`API request failed for ${method} ${normalizedUrl}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity to prevent stale data
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
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
      onError: (error: any) => {
        const parsedError = parseError(error);
        logError(parsedError, 'React Query Error');
      },
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
      onError: (error: any) => {
        const parsedError = parseError(error);
        logError(parsedError, 'React Query Mutation Error');
      },
    },
  },
});
