import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react"

// Define the theme types more explicitly for better type safety
type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

// Streamlined context interface - focused purely on state management
// This avoids overlap with theme toggle components by not including UI-specific methods
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  // Removed cycleTheme to prevent overlap with toggle component logic
  // Toggle components should implement their own cycling/switching logic
}

// Create context with explicit typing for better developer experience
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  enableStorage?: boolean;
  // New prop to allow theme toggle components to override storage behavior
  storageKey?: string;
}

// Configurable constants that can be customized per implementation
// This allows theme toggle components to use different storage keys if needed
const DEFAULT_STORAGE_KEY = "app-theme" as const;
const THEME_STORAGE_ERROR_MESSAGE = "Theme storage operation failed:" as const;
const MEDIA_QUERY = "(prefers-color-scheme: dark)" as const;
const THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"]' as const;
const DARK_THEME_COLOR = "#0a0a0a" as const;
const LIGHT_THEME_COLOR = "#ffffff" as const;

// Enhanced logger with more granular control for debugging theme issues
const logger = {
  warn: (message: string, error?: unknown): void => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`[ThemeContext] ${message}`, error);
    }
  },
  debug: (message: string, data?: unknown): void => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug(`[ThemeContext] ${message}`, data);
    }
  },
};

// Type guard with improved validation for external theme values
const isValidTheme = (value: unknown): value is Theme => {
  return typeof value === "string" && 
         ["light", "dark", "system"].includes(value);
};

// Custom hook for system preference detection with better error handling
// This separates system detection logic from the main provider for better testability
const useSystemPreference = (): ResolvedTheme => {
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") {
      return "dark"; // Consistent SSR fallback
    }
    
    try {
      return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
    } catch (error) {
      logger.warn("Failed to detect system preference", error);
      return "dark"; // Safe fallback
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mediaQuery: MediaQueryList;
    
    try {
      mediaQuery = window.matchMedia(MEDIA_QUERY);
    } catch (error) {
      logger.warn("MediaQuery not supported", error);
      return;
    }

    const handleChange = (e: MediaQueryListEvent): void => {
      const newSystemTheme = e.matches ? "dark" : "light";
      logger.debug("System preference changed", { newSystemTheme });
      setSystemTheme(newSystemTheme);
    };

    mediaQuery.addEventListener("change", handleChange);

    return (): void => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return systemTheme;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark",
  enableStorage = true,
  storageKey = DEFAULT_STORAGE_KEY,
}) => {
  // Track initialization to prevent unnecessary DOM updates
  const isInitialized = useRef(false);
  const lastAppliedTheme = useRef<ResolvedTheme | null>(null);
  
  // Get system preference using our custom hook
  const systemPreference = useSystemPreference();

  // Optimized storage operations with configurable key
  const storageOperations = useCallback(() => {
    const getStoredTheme = (): Theme | null => {
      if (!enableStorage || typeof window === "undefined") {
        return null;
      }

      try {
        const stored = localStorage.getItem(storageKey);
        return isValidTheme(stored) ? stored : null;
      } catch (error) {
        logger.warn(THEME_STORAGE_ERROR_MESSAGE, error);
        return null;
      }
    };

    const saveTheme = (theme: Theme): void => {
      if (!enableStorage || typeof window === "undefined") {
        return;
      }

      try {
        localStorage.setItem(storageKey, theme);
        logger.debug("Theme saved to storage", { theme, storageKey });
      } catch (error) {
        logger.warn(THEME_STORAGE_ERROR_MESSAGE, error);
      }
    };

    return { getStoredTheme, saveTheme };
  }, [enableStorage, storageKey]);

  // Initialize theme state with improved fallback chain
  const [theme, setThemeState] = useState<Theme>(() => {
    const { getStoredTheme } = storageOperations();
    const stored = getStoredTheme();
    const initialTheme = stored ?? defaultTheme;
    
    logger.debug("Theme initialized", { 
      stored, 
      defaultTheme, 
      initialTheme 
    });
    
    return initialTheme;
  });

  // Calculate resolved theme with memoization for better performance
  const resolvedTheme = React.useMemo((): ResolvedTheme => {
    if (theme === "system") {
      return systemPreference;
    }
    return theme as ResolvedTheme;
  }, [theme, systemPreference]);

  // Optimized DOM update function with better change detection
  const updateDOMTheme = useCallback((newResolvedTheme: ResolvedTheme): void => {
    if (typeof window === "undefined") {
      return;
    }

    // Skip update if theme hasn't actually changed
    if (lastAppliedTheme.current === newResolvedTheme) {
      return;
    }

    const root = document.documentElement;
    
    // Only update if the theme is actually changing to prevent unnecessary DOM manipulation
    const currentThemeClass = root.classList.contains('dark') ? 'dark' : 'light';
    if (currentThemeClass === newResolvedTheme) {
      return;
    }

    // Remove existing theme classes to avoid conflicts
    // This ensures clean state before applying new theme
    root.classList.remove("light", "dark");
    root.classList.add(newResolvedTheme);

    // Update CSS color scheme for better browser integration
    // This helps browsers apply appropriate scrollbar colors, form controls, etc.
    root.style.setProperty("color-scheme", newResolvedTheme);

    // Update theme-color meta tag for mobile browsers
    const metaThemeColor = document.querySelector(
      THEME_COLOR_META_SELECTOR
    ) as HTMLMetaElement;
    
    if (metaThemeColor) {
      metaThemeColor.content = 
        newResolvedTheme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
    }

    lastAppliedTheme.current = newResolvedTheme;
  }, []);

  // Apply theme changes to DOM when resolved theme changes
  useEffect(() => {
    updateDOMTheme(resolvedTheme);
    
    // Mark as initialized after first update
    if (!isInitialized.current) {
      isInitialized.current = true;
    }
  }, [resolvedTheme, updateDOMTheme]);

  // Theme setter with improved state management and storage sync
  const setTheme = useCallback((newTheme: Theme): void => {
    // Prevent unnecessary updates
    if (newTheme === theme) {
      logger.debug("Theme unchanged, skipping update", { theme: newTheme });
      return;
    }

    logger.debug("Theme changing", { from: theme, to: newTheme });

    // Update state immediately for responsive UI
    setThemeState(newTheme);
    
    // Handle storage in the background
    const { saveTheme } = storageOperations();
    saveTheme(newTheme);
  }, [theme, storageOperations]);

  // Memoized context value with stable references
  const contextValue = React.useMemo((): ThemeContextType => ({
    theme,
    setTheme,
    resolvedTheme,
  }), [theme, setTheme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Enhanced useTheme hook with better error context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useTheme must be used within a ThemeProvider. " +
      "Ensure your component tree is wrapped with <ThemeProvider>. " +
      "This error typically occurs when theme toggle components " +
      "are rendered outside the provider scope."
    );
  }

  return context;
};

// Safe theme access hook for conditional theme usage
export const useThemeOptional = (): ThemeContextType | null => {
  return useContext(ThemeContext) ?? null;
};

// Utility hook for theme toggle components to check if context is available
// This prevents theme toggles from breaking when context is missing
export const useHasThemeProvider = (): boolean => {
  return useContext(ThemeContext) !== undefined;
};

// Export types for theme toggle components to maintain consistency
export type { Theme, ResolvedTheme, ThemeContextType };