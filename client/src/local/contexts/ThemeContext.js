"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHasThemeProvider = exports.useThemeOptional = exports.useTheme = exports.ThemeProvider = void 0;
var react_1 = require("react");
// Create context with explicit typing for better developer experience
var ThemeContext = (0, react_1.createContext)(undefined);
// Configurable constants that can be customized per implementation
// This allows theme toggle components to use different storage keys if needed
var DEFAULT_STORAGE_KEY = "app-theme";
var THEME_STORAGE_ERROR_MESSAGE = "Theme storage operation failed:";
var MEDIA_QUERY = "(prefers-color-scheme: dark)";
var THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"]';
var DARK_THEME_COLOR = "#0a0a0a";
var LIGHT_THEME_COLOR = "#ffffff";
// Enhanced logger with more granular control for debugging theme issues
var logger = {
    warn: function (message, error) {
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn("[ThemeContext] ".concat(message), error);
        }
    },
    debug: function (message, data) {
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.debug("[ThemeContext] ".concat(message), data);
        }
    },
};
// Type guard with improved validation for external theme values
var isValidTheme = function (value) {
    return typeof value === "string" &&
        ["light", "dark", "system"].includes(value);
};
// Custom hook for system preference detection with better error handling
// This separates system detection logic from the main provider for better testability
var useSystemPreference = function () {
    var _a = (0, react_1.useState)(function () {
        if (typeof window === "undefined") {
            return "dark"; // Consistent SSR fallback
        }
        try {
            return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
        }
        catch (error) {
            logger.warn("Failed to detect system preference", error);
            return "dark"; // Safe fallback
        }
    }), systemTheme = _a[0], setSystemTheme = _a[1];
    (0, react_1.useEffect)(function () {
        if (typeof window === "undefined")
            return;
        var mediaQuery;
        try {
            mediaQuery = window.matchMedia(MEDIA_QUERY);
        }
        catch (error) {
            logger.warn("MediaQuery not supported", error);
            return;
        }
        var handleChange = function (e) {
            var newSystemTheme = e.matches ? "dark" : "light";
            logger.debug("System preference changed", { newSystemTheme: newSystemTheme });
            setSystemTheme(newSystemTheme);
        };
        mediaQuery.addEventListener("change", handleChange);
        return function () {
            mediaQuery.removeEventListener("change", handleChange);
        };
    }, []);
    return systemTheme;
};
var ThemeProvider = function (_a) {
    var children = _a.children, _b = _a.defaultTheme, defaultTheme = _b === void 0 ? "dark" : _b, _c = _a.enableStorage, enableStorage = _c === void 0 ? true : _c, _d = _a.storageKey, storageKey = _d === void 0 ? DEFAULT_STORAGE_KEY : _d;
    // Track initialization to prevent unnecessary DOM updates
    var isInitialized = (0, react_1.useRef)(false);
    var lastAppliedTheme = (0, react_1.useRef)(null);
    // Get system preference using our custom hook
    var systemPreference = useSystemPreference();
    // Optimized storage operations with configurable key
    var storageOperations = (0, react_1.useCallback)(function () {
        var getStoredTheme = function () {
            if (!enableStorage || typeof window === "undefined") {
                return null;
            }
            try {
                var stored = localStorage.getItem(storageKey);
                return isValidTheme(stored) ? stored : null;
            }
            catch (error) {
                logger.warn(THEME_STORAGE_ERROR_MESSAGE, error);
                return null;
            }
        };
        var saveTheme = function (theme) {
            if (!enableStorage || typeof window === "undefined") {
                return;
            }
            try {
                localStorage.setItem(storageKey, theme);
                logger.debug("Theme saved to storage", { theme: theme, storageKey: storageKey });
            }
            catch (error) {
                logger.warn(THEME_STORAGE_ERROR_MESSAGE, error);
            }
        };
        return { getStoredTheme: getStoredTheme, saveTheme: saveTheme };
    }, [enableStorage, storageKey]);
    // Initialize theme state with improved fallback chain
    var _e = (0, react_1.useState)(function () {
        var getStoredTheme = storageOperations().getStoredTheme;
        var stored = getStoredTheme();
        var initialTheme = stored !== null && stored !== void 0 ? stored : defaultTheme;
        logger.debug("Theme initialized", {
            stored: stored,
            defaultTheme: defaultTheme,
            initialTheme: initialTheme
        });
        return initialTheme;
    }), theme = _e[0], setThemeState = _e[1];
    // Calculate resolved theme with memoization for better performance
    var resolvedTheme = react_1.default.useMemo(function () {
        if (theme === "system") {
            return systemPreference;
        }
        return theme;
    }, [theme, systemPreference]);
    // Optimized DOM update function with better change detection
    var updateDOMTheme = (0, react_1.useCallback)(function (newResolvedTheme) {
        if (typeof window === "undefined") {
            return;
        }
        // Skip update if theme hasn't actually changed
        if (lastAppliedTheme.current === newResolvedTheme) {
            return;
        }
        var root = document.documentElement;
        // Only update if the theme is actually changing to prevent unnecessary DOM manipulation
        var currentThemeClass = root.classList.contains('dark') ? 'dark' : 'light';
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
        var metaThemeColor = document.querySelector(THEME_COLOR_META_SELECTOR);
        if (metaThemeColor) {
            metaThemeColor.content =
                newResolvedTheme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
        }
        lastAppliedTheme.current = newResolvedTheme;
    }, []);
    // Apply theme changes to DOM when resolved theme changes
    (0, react_1.useEffect)(function () {
        updateDOMTheme(resolvedTheme);
        // Mark as initialized after first update
        if (!isInitialized.current) {
            isInitialized.current = true;
        }
    }, [resolvedTheme, updateDOMTheme]);
    // Theme setter with improved state management and storage sync
    var setTheme = (0, react_1.useCallback)(function (newTheme) {
        // Prevent unnecessary updates
        if (newTheme === theme) {
            logger.debug("Theme unchanged, skipping update", { theme: newTheme });
            return;
        }
        logger.debug("Theme changing", { from: theme, to: newTheme });
        // Update state immediately for responsive UI
        setThemeState(newTheme);
        // Handle storage in the background
        var saveTheme = storageOperations().saveTheme;
        saveTheme(newTheme);
    }, [theme, storageOperations]);
    // Memoized context value with stable references
    var contextValue = react_1.default.useMemo(function () { return ({
        theme: theme,
        setTheme: setTheme,
        resolvedTheme: resolvedTheme,
    }); }, [theme, setTheme, resolvedTheme]);
    return (<ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>);
};
exports.ThemeProvider = ThemeProvider;
// Enhanced useTheme hook with better error context
var useTheme = function () {
    var context = (0, react_1.useContext)(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider. " +
            "Ensure your component tree is wrapped with <ThemeProvider>. " +
            "This error typically occurs when theme toggle components " +
            "are rendered outside the provider scope.");
    }
    return context;
};
exports.useTheme = useTheme;
// Safe theme access hook for conditional theme usage
var useThemeOptional = function () {
    var _a;
    return (_a = (0, react_1.useContext)(ThemeContext)) !== null && _a !== void 0 ? _a : null;
};
exports.useThemeOptional = useThemeOptional;
// Utility hook for theme toggle components to check if context is available
// This prevents theme toggles from breaking when context is missing
var useHasThemeProvider = function () {
    return (0, react_1.useContext)(ThemeContext) !== undefined;
};
exports.useHasThemeProvider = useHasThemeProvider;
