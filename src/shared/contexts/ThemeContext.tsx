import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Define the theme types more explicitly for better type safety
type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
}

// Create context with a more descriptive undefined check
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  // Optional prop to disable localStorage for testing or server-side rendering
  enableStorage?: boolean;
}

// Define all string constants at the top to eliminate duplication
// This follows the DRY principle and makes maintenance much easier
const STORAGE_KEY = 'theme' as const;
const THEME_STORAGE_ERROR_MESSAGE = 'Failed to access localStorage for theme:' as const;
const THEME_SAVE_ERROR_MESSAGE = 'Failed to save theme to localStorage:' as const;
const MEDIA_QUERY = '(prefers-color-scheme: dark)' as const;
const THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"]' as const;
const DARK_THEME_COLOR = '#000000' as const;
const LIGHT_THEME_COLOR = '#ffffff' as const;

// Create a simple logger that respects environment settings
// This replaces direct console usage and can be easily extended
const logger = {
  warn: (message: string, error?: unknown): void => {
    // Only log in development environment to keep production clean
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(message, error);
    }
    // In production, you might want to send to a logging service instead
    // Example: logService.warn(message, error);
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark', // Dark mode by default as requested
  enableStorage = true,
}) => {
  // Helper function to safely access localStorage
  // This demonstrates defensive programming - anticipating and handling edge cases
  const getStoredTheme = useCallback((): Theme | null => {
    // Early return pattern for cleaner code flow
    if (!enableStorage || typeof window === 'undefined') {
      return null;
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Type guard to ensure runtime type safety matches compile-time expectations
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
      return null;
    } catch (error) {
      // Handle localStorage access errors gracefully (e.g., in private browsing)
      logger.warn(THEME_STORAGE_ERROR_MESSAGE, error);
      return null;
    }
  }, [enableStorage]);

  // Initialize theme state with better error handling
  const [theme, setTheme] = useState<Theme>(() => {
    return getStoredTheme() || defaultTheme;
  });

  // Initialize resolved theme based on current theme and system preference
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') {
      // Server-side rendering fallback - prevents hydration mismatches
      return defaultTheme === 'system' ? 'dark' : (defaultTheme as ResolvedTheme);
    }
    
    if (theme === 'system') {
      return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
    }
    
    return theme as ResolvedTheme;
  });

  // Memoized function to update the theme in the DOM
  // Explicit void return type satisfies TypeScript's requirement for all code paths
  const updateDOMTheme = useCallback((newResolvedTheme: ResolvedTheme): void => {
    // Guard clause pattern - exit early if conditions aren't met
    if (typeof window === 'undefined') {
      return;
    }
    
    const root = window.document.documentElement;
    
    // Remove existing theme classes to avoid conflicts
    root.classList.remove('light', 'dark');
    root.classList.add(newResolvedTheme);
    
    // Update CSS color scheme for better browser integration
    root.style.setProperty('color-scheme', newResolvedTheme);
    
    // Update meta tag for mobile browsers (if it exists)
    // This enhances the user experience on mobile devices
    const metaThemeColor = document.querySelector(THEME_COLOR_META_SELECTOR);
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        newResolvedTheme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR
      );
    }
  }, []);

  // Memoized function to determine resolved theme
  // Separating concerns makes the code more testable and maintainable
  const calculateResolvedTheme = useCallback((currentTheme: Theme): ResolvedTheme => {
    if (currentTheme === 'system') {
      if (typeof window === 'undefined') {
        return 'dark'; // Fallback for SSR consistency
      }
      return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
    }
    return currentTheme as ResolvedTheme;
  }, []);

  // Effect to handle theme changes and system preference updates
  // This demonstrates proper cleanup patterns in React
  useEffect(() => {
    const newResolvedTheme = calculateResolvedTheme(theme);
    setResolvedTheme(newResolvedTheme);
    updateDOMTheme(newResolvedTheme);

    // Set up system preference listener only when needed
    // This is an optimization - we only listen when it matters
    if (theme === 'system') {
      const mediaQuery = window.matchMedia(MEDIA_QUERY);
      
      const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
        const systemResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(systemResolvedTheme);
        updateDOMTheme(systemResolvedTheme);
      };

      // Use the modern addEventListener approach consistently
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // Cleanup function prevents memory leaks
      return (): void => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
    
    // Explicit return for the case where no cleanup is needed
    return undefined;
  }, [theme, calculateResolvedTheme, updateDOMTheme]);

  // Optimized theme setter with better error handling
  // Explicit void return type makes the function's intent clear
  const handleSetTheme = useCallback((newTheme: Theme): void => {
    setTheme(newTheme);
    
    // Only attempt localStorage if enabled and available
    if (enableStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (error) {
        // Log errors appropriately based on environment
        logger.warn(THEME_SAVE_ERROR_MESSAGE, error);
        // Continue execution even if localStorage fails - graceful degradation
      }
    }
  }, [enableStorage]);

  // Memoize the context value to prevent unnecessary re-renders
  // This is a performance optimization that prevents child re-renders
  const contextValue: ThemeContextType = React.useMemo(() => ({
    theme,
    setTheme: handleSetTheme,
    resolvedTheme,
  }), [theme, handleSetTheme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Enhanced useTheme hook with better error messaging
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error(
      'useTheme must be used within a ThemeProvider. ' +
      'Make sure to wrap your component tree with <ThemeProvider>.'
    );
  }
  
  return context;
};

// Optional: Export a hook for checking if theme provider is available
// This provides flexibility for components that might work with or without themes
export const useThemeOptional = (): ThemeContextType | null => {
  return useContext(ThemeContext) || null;
};