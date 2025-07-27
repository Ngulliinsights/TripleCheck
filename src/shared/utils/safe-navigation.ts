/**
 * Safe navigation utilities to prevent crashes and provide fallbacks
 */

export interface SafeNavigationOptions {
  timeout?: number;
  fallbackUrl?: string;
  onError?: (error: Error) => void;
  onTimeout?: () => void;
}

/**
 * Safe navigation function with timeout protection and fallbacks
 */
export function safeNavigate(
  navigate: (url: string) => void,
  url: string,
  options: SafeNavigationOptions = {}
): void {
  const {
    timeout = 3000,
    fallbackUrl = '/',
    onError,
    onTimeout
  } = options;

  // Validate URL
  if (!url || typeof url !== 'string') {
    console.warn('Invalid navigation URL provided');
    return;
  }

  // Set up timeout protection
  const timeoutId = setTimeout(() => {
    console.warn(`Navigation timeout after ${timeout}ms, using fallback`);
    onTimeout?.();
    
    try {
      window.location.href = url;
    } catch (error) {
      console.error('Fallback navigation failed:', error);
      window.location.href = fallbackUrl;
    }
  }, timeout);

  try {
    navigate(url);
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    
    const navigationError = error instanceof Error ? error : new Error('Navigation failed');
    console.warn('React Router navigation failed:', navigationError);
    onError?.(navigationError);

    // Immediate fallback to native navigation
    try {
      window.location.href = url;
    } catch (fallbackError) {
      console.error('Complete navigation failure:', fallbackError);
      window.location.href = fallbackUrl;
    }
  }
}

/**
 * Safe search navigation with URL encoding
 */
export function safeSearchNavigate(
  navigate: (url: string) => void,
  query: string,
  options: SafeNavigationOptions = {}
): void {
  if (!query.trim()) {
    console.warn('Empty search query provided');
    return;
  }

  try {
    const searchUrl = `/search?q=${encodeURIComponent(query.trim())}`;
    safeNavigate(navigate, searchUrl, options);
  } catch (error) {
    console.error('Search URL encoding failed:', error);
    // Fallback to simple search
    safeNavigate(navigate, '/search', options);
  }
}

/**
 * Debounced navigation to prevent rapid successive calls
 */
export class DebouncedNavigator {
  private timeoutId: NodeJS.Timeout | null = null;
  private isNavigating = false;

  constructor(
    private navigate: (url: string) => void,
    private debounceMs = 300
  ) {}

  navigate(url: string, options: SafeNavigationOptions = {}): void {
    // Prevent multiple simultaneous navigations
    if (this.isNavigating) {
      console.warn('Navigation already in progress, ignoring duplicate request');
      return;
    }

    // Clear any pending navigation
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.isNavigating = true;
      
      safeNavigate(this.navigate, url, {
        ...options,
        onError: (error) => {
          this.isNavigating = false;
          options.onError?.(error);
        },
        onTimeout: () => {
          this.isNavigating = false;
          options.onTimeout?.();
        }
      });

      // Reset navigation state after a delay
      setTimeout(() => {
        this.isNavigating = false;
      }, 1000);
    }, this.debounceMs);
  }

  cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isNavigating = false;
  }
}

/**
 * Hook for safe navigation with automatic cleanup
 */
export function useSafeNavigation() {
  // This would typically use useNavigate from react-router-dom
  // For now, we'll return the utility functions
  return {
    safeNavigate,
    safeSearchNavigate,
    DebouncedNavigator
  };
}

/**
 * Navigation event handler factory
 */
export function createSafeNavigationHandler(
  navigate: (url: string) => void,
  url: string,
  options: SafeNavigationOptions = {}
) {
  return (event?: React.MouseEvent) => {
    // Prevent default link behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    safeNavigate(navigate, url, options);
  };
}

/**
 * Navigation timeout constants
 */
export const NAVIGATION_TIMEOUTS = {
  FAST: 1000,
  NORMAL: 3000,
  SLOW: 5000
} as const;