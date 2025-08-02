// Test utilities with race condition protection
import React from 'react';

export const createMockFetch = (mockResponse: any, delay = 0) => {
  return jest.fn().mockImplementation((url: string, options?: RequestInit) => {
    const controller = options?.signal as AbortController['signal'];
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (controller?.aborted) {
          reject(new Error('AbortError'));
          return;
        }
        
        resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          status: 200,
          statusText: 'OK',
        });
      }, delay);

      // Handle abort signal
      if (controller) {
        controller.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('AbortError'));
        });
      }
    });
  });
};

export const createSafeFetch = (originalFetch: typeof fetch) => {
  return (url: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    return originalFetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId);
    });
  };
};

// Mock auth provider for tests
export const MockAuthProvider = ({ 
  children, 
  user = null, 
  loading = false 
}: { 
  children: React.ReactNode;
  user?: any;
  loading?: boolean;
}) => {
  const [currentUser, setCurrentUser] = React.useState(user);
  const [isLoading, setIsLoading] = React.useState(loading);

  React.useEffect(() => {
    const controller = new AbortController();
    
    if (!user && !loading) {
      // Simulate auth check with race condition protection
      fetch('/api/auth/profile', { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          if (!controller.signal.aborted && data.data) {
            setCurrentUser(data.data);
          }
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            setCurrentUser(null);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        });
    }

    return () => {
      controller.abort();
    };
  }, [user, loading]);

  return (
    <div data-testid="mock-auth-provider">
      {isLoading ? <div>Loading...</div> : children}
    </div>
  );
};