"use strict";
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
exports.BREAKPOINT_VALUES = void 0;
exports.LayoutContainer = LayoutContainer;
exports.useBreakpoint = useBreakpoint;
var react_1 = require("react");
var utils_1 = require("@/local/lib/utils");
// Define breakpoint values as constants for consistency and maintainability
var BREAKPOINT_VALUES = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
};
exports.BREAKPOINT_VALUES = BREAKPOINT_VALUES;
function LayoutContainer(_a) {
    var children = _a.children, _b = _a.maxWidth, maxWidth = _b === void 0 ? "xl" : _b, _c = _a.padding, padding = _c === void 0 ? "md" : _c, className = _a.className, _d = _a.fluidTypography, fluidTypography = _d === void 0 ? true : _d, responsiveTypography = _a.responsiveTypography, _e = _a.centerContent, centerContent = _e === void 0 ? false : _e, _f = _a.as, Component = _f === void 0 ? "div" : _f, role = _a.role, ariaLabel = _a["aria-label"];
    var _g = (0, react_1.useState)("xl"), currentBreakpoint = _g[0], setCurrentBreakpoint = _g[1];
    // Memoized breakpoint detection function for performance
    var detectBreakpoint = (0, react_1.useCallback)(function () {
        var width = window.innerWidth;
        // Use a more efficient approach by checking from largest to smallest
        if (width >= BREAKPOINT_VALUES["2xl"])
            return "2xl";
        if (width >= BREAKPOINT_VALUES.xl)
            return "xl";
        if (width >= BREAKPOINT_VALUES.lg)
            return "lg";
        if (width >= BREAKPOINT_VALUES.md)
            return "md";
        return "sm";
    }, []);
    // Extract cleanup logic to reduce nesting
    var createCleanupHandler = (0, react_1.useCallback)(function (rafId, timeoutId) {
        return function () {
            if (typeof rafId.current !== "undefined") {
                window.cancelAnimationFrame(rafId.current);
            }
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, []);
    // Refs for resize handler
    var resizeRafId = (0, react_1.useRef)();
    var resizeTimeoutId = (0, react_1.useRef)();
    // Extract the debounced update function to reduce nesting
    var executeDebouncedUpdate = (0, react_1.useCallback)(function (onBreakpointChange) {
        onBreakpointChange(detectBreakpoint());
    }, [detectBreakpoint]);
    // Extract the RAF callback to reduce nesting
    var executeRafCallback = (0, react_1.useCallback)(function (onBreakpointChange) {
        resizeTimeoutId.current = setTimeout(function () {
            executeDebouncedUpdate(onBreakpointChange);
        }, 150);
    }, [executeDebouncedUpdate]);
    // Extract resize logic to reduce nesting
    var createResizeHandler = (0, react_1.useCallback)(function (onBreakpointChange) {
        var handleResize = function () {
            // Cancel any pending RAF or timeout
            if (typeof resizeRafId.current !== "undefined") {
                window.cancelAnimationFrame(resizeRafId.current);
                resizeRafId.current = undefined;
            }
            if (resizeTimeoutId.current) {
                clearTimeout(resizeTimeoutId.current);
                resizeTimeoutId.current = undefined;
            }
            // Use RAF for smoother updates during active resizing
            resizeRafId.current = window.requestAnimationFrame(function () {
                executeRafCallback(onBreakpointChange);
            });
        };
        var cleanup = createCleanupHandler(resizeRafId, resizeTimeoutId);
        return { handleResize: handleResize, cleanup: cleanup };
    }, [executeRafCallback, createCleanupHandler]);
    (0, react_1.useEffect)(function () {
        // Initial breakpoint detection
        setCurrentBreakpoint(detectBreakpoint());
        // Create resize handler with separated concerns
        var _a = createResizeHandler(setCurrentBreakpoint), handleResize = _a.handleResize, cleanup = _a.cleanup;
        window.addEventListener("resize", handleResize, { passive: true });
        return function () {
            window.removeEventListener("resize", handleResize);
            cleanup();
        };
    }, [detectBreakpoint, createResizeHandler]);
    // Memoized class generation with secure property access
    var maxWidthClass = (0, react_1.useMemo)(function () {
        // Using type-safe property access to avoid security warnings
        var maxWidthMap = {
            sm: "max-w-sm", // ~384px
            md: "max-w-md", // ~448px
            lg: "max-w-4xl", // ~896px - Better for content readability
            xl: "max-w-6xl", // ~1152px
            "2xl": "max-w-7xl", // ~1280px
            full: "max-w-full",
        };
        // Type-safe property access
        if (maxWidth in maxWidthMap) {
            return maxWidthMap[maxWidth];
        }
        return maxWidthMap.xl; // Safe fallback
    }, [maxWidth]);
    var paddingClass = (0, react_1.useMemo)(function () {
        // Using type-safe property access to avoid security warnings
        var paddingMap = {
            none: "",
            // Improved responsive padding with better mobile experience
            sm: "px-3 py-2 sm:px-4 sm:py-3",
            md: "px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-6",
            lg: "px-6 py-4 sm:px-8 sm:py-6 lg:px-12 lg:py-8 xl:px-16 xl:py-10",
            xl: "px-8 py-6 sm:px-12 sm:py-8 lg:px-16 lg:py-12 xl:px-20 xl:py-16",
        };
        // Type-safe property access
        if (padding in paddingMap) {
            return paddingMap[padding];
        }
        return paddingMap.md; // Safe fallback
    }, [padding]);
    // Enhanced fluid typography with better defaults and 2xl support
    var typographyStyles = (0, react_1.useMemo)(function () {
        if (!fluidTypography)
            return {};
        var defaultTypography = {
            sm: "0.875rem", // 14px
            md: "1rem", // 16px
            lg: "1.125rem", // 18px
            xl: "1.25rem", // 20px
            "2xl": "1.375rem", // 22px
        };
        var typography = __assign(__assign({}, defaultTypography), responsiveTypography);
        return {
            // More sophisticated fluid typography with better scaling
            fontSize: "clamp(".concat(typography.sm, ", 1.5vw + 0.5rem, ").concat(typography["2xl"], ")"),
            lineHeight: "clamp(1.4, 1.5, 1.7)",
        };
    }, [fluidTypography, responsiveTypography]);
    // Improved className composition with better organization
    var containerClasses = (0, react_1.useMemo)(function () {
        return (0, utils_1.cn)(
        // Base layout classes
        "mx-auto w-full", 
        // Responsive max-width
        maxWidthClass, 
        // Responsive padding
        paddingClass, 
        // Centering logic with improved flex properties
        centerContent && [
            "flex flex-col items-center justify-center",
            "min-h-[50vh]", // More reasonable minimum height
            "text-center", // Better text alignment for centered content
        ], 
        // Custom classes last for proper override capability
        className);
    }, [maxWidthClass, paddingClass, centerContent, className]);
    return (<Component className={containerClasses} style={typographyStyles} data-breakpoint={currentBreakpoint} data-max-width={maxWidth} role={role} aria-label={ariaLabel}>
      {children}
    </Component>);
}
// Enhanced breakpoint hook with additional utilities
function useBreakpoint() {
    var _a = (0, react_1.useState)("xl"), breakpoint = _a[0], setBreakpoint = _a[1];
    // Memoized breakpoint detection
    var detectBreakpoint = (0, react_1.useCallback)(function () {
        var width = window.innerWidth;
        if (width >= BREAKPOINT_VALUES["2xl"])
            return "2xl";
        if (width >= BREAKPOINT_VALUES.xl)
            return "xl";
        if (width >= BREAKPOINT_VALUES.lg)
            return "lg";
        if (width >= BREAKPOINT_VALUES.md)
            return "md";
        return "sm";
    }, []);
    // Extract timeout callback to reduce nesting
    var executeTimeoutCallback = (0, react_1.useCallback)(function (onBreakpointChange) {
        onBreakpointChange(detectBreakpoint());
    }, [detectBreakpoint]);
    // Extract the RAF callback to reduce nesting in createResizeHandler
    var executeRafCallbackForHandler = (0, react_1.useCallback)(function (onBreakpointChange, timeoutIdRef) {
        timeoutIdRef.current = setTimeout(function () {
            executeTimeoutCallback(onBreakpointChange);
        }, 150);
    }, [executeTimeoutCallback]);
    // Extracted resize handler creation to avoid nesting issues
    var createResizeHandler = (0, react_1.useCallback)(function (onBreakpointChange) {
        var rafId;
        var timeoutId;
        var timeoutIdRef = { current: timeoutId };
        var handleResize = function () {
            if (typeof rafId !== "undefined") {
                window.cancelAnimationFrame(rafId);
                rafId = undefined;
            }
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
                timeoutIdRef.current = undefined;
            }
            rafId = window.requestAnimationFrame(function () {
                executeRafCallbackForHandler(onBreakpointChange, timeoutIdRef);
            });
            // Update the local variable to match the ref
            timeoutId = timeoutIdRef.current;
        };
        var cleanup = function () {
            if (typeof rafId !== "undefined") {
                window.cancelAnimationFrame(rafId);
            }
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
        return { handleResize: handleResize, cleanup: cleanup };
    }, [executeRafCallbackForHandler]);
    (0, react_1.useEffect)(function () {
        setBreakpoint(detectBreakpoint());
        var _a = createResizeHandler(setBreakpoint), handleResize = _a.handleResize, cleanup = _a.cleanup;
        window.addEventListener("resize", handleResize, { passive: true });
        return function () {
            window.removeEventListener("resize", handleResize);
            cleanup();
        };
    }, [detectBreakpoint, createResizeHandler]);
    // Additional utility functions for enhanced developer experience
    var isBreakpoint = (0, react_1.useCallback)(function (target) {
        return breakpoint === target;
    }, [breakpoint]);
    var isBreakpointUp = (0, react_1.useCallback)(function (target) {
        var breakpointOrder = ["sm", "md", "lg", "xl", "2xl"];
        var currentIndex = breakpointOrder.indexOf(breakpoint);
        var targetIndex = breakpointOrder.indexOf(target);
        return currentIndex >= targetIndex;
    }, [breakpoint]);
    var isBreakpointDown = (0, react_1.useCallback)(function (target) {
        var breakpointOrder = ["sm", "md", "lg", "xl", "2xl"];
        var currentIndex = breakpointOrder.indexOf(breakpoint);
        var targetIndex = breakpointOrder.indexOf(target);
        return currentIndex <= targetIndex;
    }, [breakpoint]);
    return {
        breakpoint: breakpoint,
        isBreakpoint: isBreakpoint,
        isBreakpointUp: isBreakpointUp,
        isBreakpointDown: isBreakpointDown,
        // Convenience booleans for common checks
        isMobile: breakpoint === "sm",
        isTablet: breakpoint === "md",
        isDesktop: isBreakpointUp("lg"),
    };
}
