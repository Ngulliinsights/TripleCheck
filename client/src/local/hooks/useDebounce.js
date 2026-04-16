"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebounce = useDebounce;
exports.useDebouncedCallback = useDebouncedCallback;
exports.useThrottle = useThrottle;
exports.useThrottledCallback = useThrottledCallback;
var react_1 = require("react");
/**
 * Enhanced debounce hook with race condition protection and performance optimizations
 *
 * This hook delays updating the returned value until after the specified delay period
 * has passed without the input value changing. Perfect for search inputs, API calls,
 * and other scenarios where you want to wait for user input to stabilize.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
function useDebounce(value, delay) {
    var _a = (0, react_1.useState)(value), debouncedValue = _a[0], setDebouncedValue = _a[1];
    var timeoutRef = (0, react_1.useRef)(null);
    var mountedRef = (0, react_1.useRef)(true);
    (0, react_1.useEffect)(function () {
        // Clear any existing timeout to prevent stale updates
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Set new timeout with mounted check to prevent memory leaks
        timeoutRef.current = setTimeout(function () {
            if (mountedRef.current) {
                setDebouncedValue(value);
            }
        }, delay);
        // Cleanup function runs on dependency change and unmount
        return function () {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [value, delay]);
    // Track mount status and cleanup on unmount
    (0, react_1.useEffect)(function () {
        mountedRef.current = true;
        return function () {
            mountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    return debouncedValue;
}
/**
 * Debounced callback hook with enhanced type safety and performance optimizations
 *
 * This hook creates a debounced version of your callback function. The callback
 * will only execute after the specified delay has passed since the last call.
 * The callback reference is kept stable to prevent unnecessary re-renders.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns A debounced version of the callback
 */
function useDebouncedCallback(callback, delay) {
    var timeoutRef = (0, react_1.useRef)(null);
    var callbackRef = (0, react_1.useRef)(callback);
    var mountedRef = (0, react_1.useRef)(true);
    // Keep callback reference fresh without affecting memoization
    (0, react_1.useEffect)(function () {
        callbackRef.current = callback;
    }, [callback]);
    // Memoize the debounced function with only delay as dependency
    // This prevents unnecessary re-creations when callback changes
    var debouncedCallback = (0, react_1.useCallback)(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // Clear any pending execution
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Schedule new execution with mount check
        timeoutRef.current = setTimeout(function () {
            if (mountedRef.current) {
                callbackRef.current.apply(callbackRef, args);
            }
        }, delay);
    }, [delay] // Only delay affects the memoization, not the callback itself
    );
    // Mount tracking and cleanup
    (0, react_1.useEffect)(function () {
        mountedRef.current = true;
        return function () {
            mountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    return debouncedCallback;
}
/**
 * Throttle hook for performance-sensitive operations with improved timing accuracy
 *
 * Unlike debouncing which delays execution, throttling ensures the value updates
 * at most once per time interval. This is ideal for scroll handlers, resize events,
 * and other high-frequency operations where you need regular updates but want to
 * limit the rate.
 *
 * @param value - The value to throttle
 * @param limit - Minimum time between updates in milliseconds
 * @returns The throttled value
 */
function useThrottle(value, limit) {
    var _a = (0, react_1.useState)(value), throttledValue = _a[0], setThrottledValue = _a[1];
    var lastExecuted = (0, react_1.useRef)(Date.now());
    var timeoutRef = (0, react_1.useRef)(null);
    var mountedRef = (0, react_1.useRef)(true);
    (0, react_1.useEffect)(function () {
        var now = Date.now();
        var timeSinceLastExecution = now - lastExecuted.current;
        // Clear any pending timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (timeSinceLastExecution >= limit) {
            // Enough time has passed, update immediately
            if (mountedRef.current) {
                setThrottledValue(value);
                lastExecuted.current = now;
            }
        }
        else {
            // Not enough time has passed, schedule update for later
            var remainingTime = limit - timeSinceLastExecution;
            timeoutRef.current = setTimeout(function () {
                if (mountedRef.current) {
                    setThrottledValue(value);
                    lastExecuted.current = Date.now();
                }
            }, remainingTime);
        }
        // Cleanup function
        return function () {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [value, limit]);
    // Mount tracking and cleanup
    (0, react_1.useEffect)(function () {
        mountedRef.current = true;
        return function () {
            mountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    return throttledValue;
}
/**
 * Advanced throttled callback hook with leading and trailing edge options
 *
 * This provides more control over when the throttled function executes:
 * - leading: true means execute immediately on first call
 * - trailing: true means execute once more after the throttle period
 *
 * @param callback - The function to throttle
 * @param delay - Minimum time between executions in milliseconds
 * @param options - Configuration for leading/trailing execution
 * @returns A throttled version of the callback
 */
function useThrottledCallback(callback, delay, options) {
    if (options === void 0) { options = {
        leading: true,
        trailing: true,
    }; }
    var timeoutRef = (0, react_1.useRef)(null);
    var lastCallTime = (0, react_1.useRef)(0);
    var lastArgs = (0, react_1.useRef)();
    var callbackRef = (0, react_1.useRef)(callback);
    var mountedRef = (0, react_1.useRef)(true);
    // Keep callback reference fresh
    (0, react_1.useEffect)(function () {
        callbackRef.current = callback;
    }, [callback]);
    var throttledCallback = (0, react_1.useCallback)(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var now = Date.now();
        var timeSinceLastCall = now - lastCallTime.current;
        lastArgs.current = args;
        // Clear existing timeout to prevent multiple scheduled executions
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        // If this is the first call or enough time has passed, execute immediately (leading edge)
        if (options.leading &&
            (lastCallTime.current === 0 || timeSinceLastCall >= delay)) {
            if (mountedRef.current) {
                lastCallTime.current = now;
                callbackRef.current.apply(callbackRef, args);
            }
            return;
        }
        // Schedule trailing execution if enabled
        if (options.trailing && mountedRef.current) {
            var remainingTime = delay - timeSinceLastCall;
            var timeoutDelay = remainingTime > 0 ? remainingTime : delay;
            timeoutRef.current = setTimeout(function () {
                if (mountedRef.current && lastArgs.current) {
                    lastCallTime.current = Date.now();
                    callbackRef.current.apply(callbackRef, lastArgs.current);
                }
                timeoutRef.current = null;
            }, timeoutDelay);
        }
    }, [delay, options.leading, options.trailing]);
    // Mount tracking and cleanup
    (0, react_1.useEffect)(function () {
        mountedRef.current = true;
        return function () {
            mountedRef.current = false;
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);
    return throttledCallback;
}
