"use strict";
/**
 * INTERSECTION OBSERVER HOOK
 * ==========================
 *
 * Custom hook for intersection observer-based lazy loading with configurable thresholds.
 * Provides efficient viewport detection for image loading optimization.
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
exports.useIntersectionObserver = useIntersectionObserver;
exports.useLazyImageLoading = useLazyImageLoading;
exports.useViewportEntry = useViewportEntry;
var react_1 = require("react");
/**
 * Custom hook for intersection observer functionality
 *
 * @param options - Configuration options for the intersection observer
 * @returns Object containing intersection state and ref callback
 */
function useIntersectionObserver(options) {
    if (options === void 0) { options = {}; }
    var _a = options.threshold, threshold = _a === void 0 ? 0.1 : _a, _b = options.rootMargin, rootMargin = _b === void 0 ? '50px' : _b, _c = options.triggerOnce, triggerOnce = _c === void 0 ? true : _c, _d = options.skip, skip = _d === void 0 ? false : _d;
    var _e = (0, react_1.useState)(false), isIntersecting = _e[0], setIsIntersecting = _e[1];
    var _f = (0, react_1.useState)(null), entry = _f[0], setEntry = _f[1];
    var elementRef = (0, react_1.useRef)(null);
    var observerRef = (0, react_1.useRef)(null);
    // Callback to set the element reference
    var setRef = (0, react_1.useCallback)(function (element) {
        if (elementRef.current && observerRef.current) {
            observerRef.current.unobserve(elementRef.current);
        }
        elementRef.current = element;
        if (element && observerRef.current) {
            observerRef.current.observe(element);
        }
    }, []);
    (0, react_1.useEffect)(function () {
        if (skip || !(window === null || window === void 0 ? void 0 : window.IntersectionObserver)) {
            return;
        }
        // Create intersection observer
        observerRef.current = new IntersectionObserver(function (entries) {
            var _a;
            var entry = entries[0];
            setEntry(entry);
            if (entry.isIntersecting) {
                setIsIntersecting(true);
                // If triggerOnce is true, stop observing after first intersection
                if (triggerOnce && elementRef.current) {
                    (_a = observerRef.current) === null || _a === void 0 ? void 0 : _a.unobserve(elementRef.current);
                }
            }
            else if (!triggerOnce) {
                setIsIntersecting(false);
            }
        }, {
            threshold: threshold,
            rootMargin: rootMargin
        });
        // Observe current element if it exists
        if (elementRef.current) {
            observerRef.current.observe(elementRef.current);
        }
        // Cleanup function
        return function () {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [threshold, rootMargin, triggerOnce, skip]);
    return {
        isIntersecting: isIntersecting,
        entry: entry,
        ref: setRef
    };
}
/**
 * Hook specifically for lazy loading images
 * Provides optimized defaults for image loading scenarios
 */
function useLazyImageLoading(options) {
    if (options === void 0) { options = {}; }
    return useIntersectionObserver(__assign({ threshold: 0.1, rootMargin: '100px', triggerOnce: true }, options));
}
/**
 * Hook for detecting when an element enters the viewport
 * Useful for animations and progressive loading
 */
function useViewportEntry(options) {
    if (options === void 0) { options = {}; }
    return useIntersectionObserver(__assign({ threshold: 0.3, rootMargin: '0px', triggerOnce: false }, options));
}
