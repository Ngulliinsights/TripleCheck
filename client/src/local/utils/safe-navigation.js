"use strict";
/**
 * Safe navigation utilities to prevent crashes and provide fallbacks
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAVIGATION_TIMEOUTS = exports.DebouncedNavigator = void 0;
exports.safeNavigate = safeNavigate;
exports.safeSearchNavigate = safeSearchNavigate;
exports.useSafeNavigation = useSafeNavigation;
exports.createSafeNavigationHandler = createSafeNavigationHandler;
/**
 * Safe navigation function with timeout protection and fallbacks
 */
function safeNavigate(navigate, url, options) {
    if (options === void 0) { options = {}; }
    var _a = options.timeout, timeout = _a === void 0 ? 3000 : _a, _b = options.fallbackUrl, fallbackUrl = _b === void 0 ? '/' : _b, onError = options.onError, onTimeout = options.onTimeout;
    // Validate URL
    if (!url || typeof url !== 'string') {
        console.warn('Invalid navigation URL provided');
        return;
    }
    // Set up timeout protection
    var timeoutId = setTimeout(function () {
        console.warn("Navigation timeout after ".concat(timeout, "ms, using fallback"));
        onTimeout === null || onTimeout === void 0 ? void 0 : onTimeout();
        try {
            window.location.href = url;
        }
        catch (error) {
            console.error('Fallback navigation failed:', error);
            window.location.href = fallbackUrl;
        }
    }, timeout);
    try {
        navigate(url);
        clearTimeout(timeoutId);
    }
    catch (error) {
        clearTimeout(timeoutId);
        var navigationError = error instanceof Error ? error : new Error('Navigation failed');
        console.warn('React Router navigation failed:', navigationError);
        onError === null || onError === void 0 ? void 0 : onError(navigationError);
        // Immediate fallback to native navigation
        try {
            window.location.href = url;
        }
        catch (fallbackError) {
            console.error('Complete navigation failure:', fallbackError);
            window.location.href = fallbackUrl;
        }
    }
}
/**
 * Safe search navigation with URL encoding
 */
function safeSearchNavigate(navigate, query, options) {
    if (options === void 0) { options = {}; }
    if (!query.trim()) {
        console.warn('Empty search query provided');
        return;
    }
    try {
        var searchUrl = "/search?q=".concat(encodeURIComponent(query.trim()));
        safeNavigate(navigate, searchUrl, options);
    }
    catch (error) {
        console.error('Search URL encoding failed:', error);
        // Fallback to simple search
        safeNavigate(navigate, '/search', options);
    }
}
/**
 * Debounced navigation to prevent rapid successive calls
 */
var DebouncedNavigator = /** @class */ (function () {
    function DebouncedNavigator(navigateFunction, debounceMs) {
        if (debounceMs === void 0) { debounceMs = 300; }
        this.navigateFunction = navigateFunction;
        this.debounceMs = debounceMs;
        this.timeoutId = null;
        this.isNavigating = false;
    }
    DebouncedNavigator.prototype.navigate = function (url, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // Prevent multiple simultaneous navigations
        if (this.isNavigating) {
            console.warn('Navigation already in progress, ignoring duplicate request');
            return;
        }
        // Clear any pending navigation
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(function () {
            _this.isNavigating = true;
            safeNavigate(_this.navigateFunction, url, __assign(__assign({}, options), { onError: function (error) {
                    var _a;
                    _this.isNavigating = false;
                    (_a = options.onError) === null || _a === void 0 ? void 0 : _a.call(options, error);
                }, onTimeout: function () {
                    var _a;
                    _this.isNavigating = false;
                    (_a = options.onTimeout) === null || _a === void 0 ? void 0 : _a.call(options);
                } }));
            // Reset navigation state after a delay
            setTimeout(function () {
                _this.isNavigating = false;
            }, 1000);
        }, this.debounceMs);
    };
    DebouncedNavigator.prototype.cleanup = function () {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.isNavigating = false;
    };
    return DebouncedNavigator;
}());
exports.DebouncedNavigator = DebouncedNavigator;
/**
 * Hook for safe navigation with automatic cleanup
 */
function useSafeNavigation() {
    // This would typically use useNavigate from react-router-dom
    // For now, we'll return the utility functions
    return {
        safeNavigate: safeNavigate,
        safeSearchNavigate: safeSearchNavigate,
        DebouncedNavigator: DebouncedNavigator
    };
}
/**
 * Navigation event handler factory
 */
function createSafeNavigationHandler(navigate, url, options) {
    if (options === void 0) { options = {}; }
    return function (event) {
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
exports.NAVIGATION_TIMEOUTS = {
    FAST: 1000,
    NORMAL: 3000,
    SLOW: 5000
};
