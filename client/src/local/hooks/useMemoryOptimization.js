"use strict";
/**
 * Memory Optimization Hooks
 * Collection of hooks for optimizing memory usage in React components
 * Refined for TypeScript safety and ESLint compliance
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOptimizedArray = exports.useCleanup = exports.usePerformanceMonitor = exports.useArrayOperations = exports.useMemoryMonitor = exports.useIntersectionObserver = exports.useDebouncedState = exports.useMemorySafeState = exports.useLazyImage = exports.usePagination = exports.useVirtualization = void 0;
exports.usePropertyListVirtualization = usePropertyListVirtualization;
exports.usePropertyGridVirtualization = usePropertyGridVirtualization;
exports.useNotificationListVirtualization = useNotificationListVirtualization;
exports.useReviewListVirtualization = useReviewListVirtualization;
exports.useTenantListVirtualization = useTenantListVirtualization;
exports.useTeamGridVirtualization = useTeamGridVirtualization;
/* eslint-disable security/detect-object-injection */
/* global performance */
var react_1 = require("react");
var useVirtualization = function (items, options) {
    var itemHeight = options.itemHeight, containerHeight = options.containerHeight, _a = options.overscan, overscan = _a === void 0 ? 5 : _a;
    var _b = (0, react_1.useState)(0), scrollTop = _b[0], setScrollTop = _b[1];
    // Calculate which items should be visible based on scroll position
    var visibleRange = (0, react_1.useMemo)(function () {
        var visibleStart = Math.floor(scrollTop / itemHeight);
        var visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight), items.length - 1);
        return {
            start: Math.max(0, visibleStart - overscan),
            end: Math.min(items.length - 1, visibleEnd + overscan),
        };
    }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
    // Extract only the items that need to be rendered
    var visibleItems = (0, react_1.useMemo)(function () {
        return items.slice(visibleRange.start, visibleRange.end + 1).map(function (item, index) { return ({
            item: item,
            index: visibleRange.start + index,
        }); });
    }, [items, visibleRange]);
    var totalHeight = items.length * itemHeight;
    var offsetY = visibleRange.start * itemHeight;
    var handleScroll = (0, react_1.useCallback)(function (event) {
        setScrollTop(event.currentTarget.scrollTop);
    }, []);
    return {
        visibleItems: visibleItems,
        totalHeight: totalHeight,
        offsetY: offsetY,
        handleScroll: handleScroll,
    };
};
exports.useVirtualization = useVirtualization;
// ------------------------------------------------------------------
// 1.1 Specialized Virtualization Helpers
// ------------------------------------------------------------------
function usePropertyListVirtualization(properties, containerHeight, itemHeight) {
    if (itemHeight === void 0) { itemHeight = 280; }
    return (0, react_1.useMemo)(function () { return ({
        items: properties,
        itemHeight: itemHeight,
        containerHeight: containerHeight,
        keyExtractor: function (property, index) { return "".concat(property.id, "-").concat(index); },
        overscanCount: 3,
    }); }, [properties, containerHeight, itemHeight]);
}
function usePropertyGridVirtualization(properties, containerWidth, containerHeight, cardWidth, cardHeight) {
    if (cardWidth === void 0) { cardWidth = 280; }
    if (cardHeight === void 0) { cardHeight = 320; }
    return (0, react_1.useMemo)(function () { return ({
        items: properties,
        itemWidth: cardWidth,
        itemHeight: cardHeight,
        containerWidth: containerWidth,
        containerHeight: containerHeight,
        gap: 16,
        keyExtractor: function (property, index) { return "".concat(property.id, "-").concat(index); },
        overscanCount: 1,
    }); }, [properties, containerWidth, containerHeight, cardWidth, cardHeight]);
}
function useNotificationListVirtualization(notifications, containerHeight, itemHeight) {
    if (itemHeight === void 0) { itemHeight = 80; }
    return (0, react_1.useMemo)(function () { return ({
        items: notifications,
        itemHeight: itemHeight,
        containerHeight: containerHeight,
        keyExtractor: function (notification, index) { return "".concat(notification.id, "-").concat(index); },
        overscanCount: 5,
    }); }, [notifications, containerHeight, itemHeight]);
}
function useReviewListVirtualization(reviews, containerHeight, getItemHeight) {
    if (getItemHeight === void 0) { getItemHeight = function () { return 120; }; }
    return (0, react_1.useMemo)(function () { return ({
        items: reviews,
        itemHeight: getItemHeight,
        containerHeight: containerHeight,
        keyExtractor: function (review, index) { return "".concat(review.id, "-").concat(index); },
        overscanCount: 2,
    }); }, [reviews, containerHeight, getItemHeight]);
}
function useTenantListVirtualization(tenants, containerHeight, itemHeight) {
    if (itemHeight === void 0) { itemHeight = 200; }
    return (0, react_1.useMemo)(function () { return ({
        items: tenants,
        itemHeight: itemHeight,
        containerHeight: containerHeight,
        keyExtractor: function (tenant, index) { return "".concat(tenant.id, "-").concat(index); },
        overscanCount: 3,
    }); }, [tenants, containerHeight, itemHeight]);
}
function useTeamGridVirtualization(members, containerWidth, containerHeight, cardWidth, cardHeight) {
    if (cardWidth === void 0) { cardWidth = 250; }
    if (cardHeight === void 0) { cardHeight = 300; }
    return (0, react_1.useMemo)(function () { return ({
        items: members,
        itemWidth: cardWidth,
        itemHeight: cardHeight,
        containerWidth: containerWidth,
        containerHeight: containerHeight,
        gap: 24,
        keyExtractor: function (member, index) { return "".concat(member.id || index); },
        overscanCount: 1,
    }); }, [members, containerWidth, containerHeight, cardWidth, cardHeight]);
}
var usePagination = function (items, options) {
    var itemsPerPage = options.itemsPerPage, totalItems = options.totalItems;
    var _a = (0, react_1.useState)(0), currentPage = _a[0], setCurrentPage = _a[1];
    var totalPages = Math.ceil(totalItems / itemsPerPage);
    // Extract items for current page
    var paginatedItems = (0, react_1.useMemo)(function () {
        var startIndex = currentPage * itemsPerPage;
        var endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    }, [items, currentPage, itemsPerPage]);
    var goToPage = (0, react_1.useCallback)(function (page) {
        setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    }, [totalPages]);
    var nextPage = (0, react_1.useCallback)(function () {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);
    var previousPage = (0, react_1.useCallback)(function () {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);
    var resetPage = (0, react_1.useCallback)(function () {
        setCurrentPage(0);
    }, []);
    return {
        currentPage: currentPage,
        totalPages: totalPages,
        paginatedItems: paginatedItems,
        goToPage: goToPage,
        nextPage: nextPage,
        previousPage: previousPage,
        resetPage: resetPage,
        hasNextPage: currentPage < totalPages - 1,
        hasPreviousPage: currentPage > 0,
    };
};
exports.usePagination = usePagination;
// ------------------------------------------------------------------
// 3. Lazy Loading Hook for Images
// ------------------------------------------------------------------
var useLazyImage = function (src, placeholder) {
    var _a = (0, react_1.useState)(placeholder || ''), imageSrc = _a[0], setImageSrc = _a[1];
    var _b = (0, react_1.useState)(false), isLoaded = _b[0], setIsLoaded = _b[1];
    var _c = (0, react_1.useState)(false), hasError = _c[0], setHasError = _c[1];
    var imgRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        if (!src)
            return;
        // Create image element safely with proper typing
        var img = new (globalThis.Image || window.Image)();
        imgRef.current = img;
        img.onload = function () {
            setImageSrc(src);
            setIsLoaded(true);
            setHasError(false);
        };
        img.onerror = function () {
            setHasError(true);
            setIsLoaded(false);
        };
        img.src = src;
        // Cleanup function to prevent memory leaks
        return function () {
            if (imgRef.current) {
                imgRef.current.onload = null;
                imgRef.current.onerror = null;
            }
        };
    }, [src]);
    return { imageSrc: imageSrc, isLoaded: isLoaded, hasError: hasError };
};
exports.useLazyImage = useLazyImage;
// ------------------------------------------------------------------
// 4. Memory-Safe State Hook with History Management
// ------------------------------------------------------------------
var useMemorySafeState = function (initialState, maxHistorySize) {
    if (maxHistorySize === void 0) { maxHistorySize = 10; }
    var _a = (0, react_1.useState)(initialState), state = _a[0], setState = _a[1];
    var _b = (0, react_1.useState)([initialState]), history = _b[0], setHistory = _b[1];
    var _c = (0, react_1.useState)(0), historyIndex = _c[0], setHistoryIndex = _c[1];
    var updateState = (0, react_1.useCallback)(function (newState) {
        setState(function (prevState) {
            var nextState = typeof newState === 'function'
                ? newState(prevState)
                : newState;
            // Update history with size limit to prevent memory leaks
            setHistory(function (prevHistory) {
                var newHistory = __spreadArray(__spreadArray([], prevHistory.slice(0, historyIndex + 1), true), [nextState], false);
                return newHistory.length > maxHistorySize
                    ? newHistory.slice(-maxHistorySize)
                    : newHistory;
            });
            setHistoryIndex(function (prevIndex) {
                return Math.min(prevIndex + 1, maxHistorySize - 1);
            });
            return nextState;
        });
    }, [historyIndex, maxHistorySize]);
    var undo = (0, react_1.useCallback)(function () {
        if (historyIndex > 0) {
            var newIndex = historyIndex - 1;
            var previousState = history[newIndex];
            if (previousState !== undefined) {
                setHistoryIndex(newIndex);
                setState(previousState);
            }
        }
    }, [history, historyIndex]);
    var redo = (0, react_1.useCallback)(function () {
        if (historyIndex < history.length - 1) {
            var newIndex = historyIndex + 1;
            var nextState = history[newIndex];
            if (nextState !== undefined) {
                setHistoryIndex(newIndex);
                setState(nextState);
            }
        }
    }, [history, historyIndex]);
    var clearHistory = (0, react_1.useCallback)(function () {
        setHistory([state]);
        setHistoryIndex(0);
    }, [state]);
    return {
        state: state,
        updateState: updateState,
        undo: undo,
        redo: redo,
        clearHistory: clearHistory,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
    };
};
exports.useMemorySafeState = useMemorySafeState;
// ------------------------------------------------------------------
// 5. Debounced State Hook with Cleanup
// ------------------------------------------------------------------
var useDebouncedState = function (initialValue, delay) {
    if (delay === void 0) { delay = 300; }
    var _a = (0, react_1.useState)(initialValue), value = _a[0], setValue = _a[1];
    var _b = (0, react_1.useState)(initialValue), debouncedValue = _b[0], setDebouncedValue = _b[1];
    var timeoutRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        // Clear existing timeout
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
        }
        // Set new timeout
        timeoutRef.current = setTimeout(function () {
            setDebouncedValue(value);
        }, delay);
        // Cleanup function
        return function () {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [value, delay]);
    // Additional cleanup on unmount
    (0, react_1.useEffect)(function () {
        return function () {
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
    return [value, debouncedValue, setValue];
};
exports.useDebouncedState = useDebouncedState;
// ------------------------------------------------------------------
// 6. Intersection Observer Hook for Lazy Loading
// ------------------------------------------------------------------
var useIntersectionObserver = function (options) {
    if (options === void 0) { options = {}; }
    var _a = (0, react_1.useState)(false), isIntersecting = _a[0], setIsIntersecting = _a[1];
    var _b = (0, react_1.useState)(false), hasIntersected = _b[0], setHasIntersected = _b[1];
    var targetRef = (0, react_1.useRef)(null);
    var observerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        var target = targetRef.current;
        if (!target || typeof IntersectionObserver === 'undefined')
            return;
        observerRef.current = new IntersectionObserver(function (entries) {
            var entry = entries[0];
            if (entry) {
                setIsIntersecting(entry.isIntersecting);
                if (entry.isIntersecting && !hasIntersected) {
                    setHasIntersected(true);
                }
            }
        }, __assign({ threshold: 0.1 }, options));
        observerRef.current.observe(target);
        return function () {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasIntersected, options]);
    return { targetRef: targetRef, isIntersecting: isIntersecting, hasIntersected: hasIntersected };
};
exports.useIntersectionObserver = useIntersectionObserver;
// ------------------------------------------------------------------
// 7. Memory Usage Monitor Hook
// ------------------------------------------------------------------
var useMemoryMonitor = function () {
    var _a = (0, react_1.useState)(null), memoryInfo = _a[0], setMemoryInfo = _a[1];
    (0, react_1.useEffect)(function () {
        var updateMemoryInfo = function () {
            // Safe access to performance.memory with proper type checking
            if (typeof performance !== 'undefined' && 'memory' in performance) {
                var memory = performance.memory;
                if (memory) {
                    setMemoryInfo({
                        usedJSHeapSize: memory.usedJSHeapSize,
                        totalJSHeapSize: memory.totalJSHeapSize,
                        jsHeapSizeLimit: memory.jsHeapSizeLimit,
                    });
                }
            }
        };
        updateMemoryInfo();
        var interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds
        return function () { return clearInterval(interval); };
    }, []);
    var memoryUsagePercentage = (0, react_1.useMemo)(function () {
        if (!memoryInfo)
            return 0;
        return (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
    }, [memoryInfo]);
    return {
        memoryInfo: memoryInfo,
        memoryUsagePercentage: memoryUsagePercentage,
        isMemoryAvailable: typeof performance !== 'undefined' && 'memory' in performance,
    };
};
exports.useMemoryMonitor = useMemoryMonitor;
// ------------------------------------------------------------------
// 8. Array Operations Hook
// ------------------------------------------------------------------
var useArrayOperations = function (initialArray, keyExtractor) {
    if (initialArray === void 0) { initialArray = []; }
    var _a = (0, react_1.useState)(initialArray), items = _a[0], setItems = _a[1];
    var itemsMapRef = (0, react_1.useRef)(new Map());
    // Update map when items change - this provides O(1) lookups
    (0, react_1.useEffect)(function () {
        var newMap = new Map();
        items.forEach(function (item) {
            newMap.set(keyExtractor(item), item);
        });
        itemsMapRef.current = newMap;
    }, [items, keyExtractor]);
    var addItem = (0, react_1.useCallback)(function (item) {
        var key = keyExtractor(item);
        if (!itemsMapRef.current.has(key)) {
            setItems(function (prev) { return __spreadArray(__spreadArray([], prev, true), [item], false); });
        }
    }, [keyExtractor]);
    var removeItem = (0, react_1.useCallback)(function (key) {
        if (itemsMapRef.current.has(key)) {
            setItems(function (prev) { return prev.filter(function (item) { return keyExtractor(item) !== key; }); });
        }
    }, [keyExtractor]);
    var updateItem = (0, react_1.useCallback)(function (key, updatedItem) {
        if (itemsMapRef.current.has(key)) {
            setItems(function (prev) { return prev.map(function (item) {
                return keyExtractor(item) === key ? updatedItem : item;
            }); });
        }
    }, [keyExtractor]);
    var findItem = (0, react_1.useCallback)(function (key) {
        return itemsMapRef.current.get(key);
    }, []);
    var hasItem = (0, react_1.useCallback)(function (key) {
        return itemsMapRef.current.has(key);
    }, []);
    var clearItems = (0, react_1.useCallback)(function () {
        setItems([]);
    }, []);
    return {
        items: items,
        addItem: addItem,
        removeItem: removeItem,
        updateItem: updateItem,
        findItem: findItem,
        hasItem: hasItem,
        clearItems: clearItems,
        size: items.length,
    };
};
exports.useArrayOperations = useArrayOperations;
// ------------------------------------------------------------------
// 9. Component Performance Monitor Hook
// ------------------------------------------------------------------
var usePerformanceMonitor = function (componentName) {
    var renderCountRef = (0, react_1.useRef)(0);
    var lastRenderTimeRef = (0, react_1.useRef)(Date.now());
    var _a = (0, react_1.useState)({
        renderCount: 0,
        averageRenderTime: 0,
        lastRenderDuration: 0,
    }), performanceMetrics = _a[0], setPerformanceMetrics = _a[1];
    (0, react_1.useEffect)(function () {
        renderCountRef.current += 1;
        var currentTime = Date.now();
        var renderDuration = currentTime - lastRenderTimeRef.current;
        setPerformanceMetrics(function (prev) { return ({
            renderCount: renderCountRef.current,
            lastRenderDuration: renderDuration,
            averageRenderTime: prev.averageRenderTime === 0
                ? renderDuration
                : (prev.averageRenderTime + renderDuration) / 2,
        }); });
        lastRenderTimeRef.current = currentTime;
        // Performance warnings - only in development
        if (process.env.NODE_ENV === 'development') {
            if (renderDuration > 16) { // More than one frame at 60fps
                // eslint-disable-next-line no-console
                console.warn("".concat(componentName, " render took ").concat(renderDuration, "ms (>16ms)"));
            }
            if (renderCountRef.current > 100 && renderCountRef.current % 50 === 0) {
                // eslint-disable-next-line no-console
                console.info("".concat(componentName, " has rendered ").concat(renderCountRef.current, " times"));
            }
        }
    }, [componentName]); // Include componentName in dependencies
    return performanceMetrics;
};
exports.usePerformanceMonitor = usePerformanceMonitor;
// ------------------------------------------------------------------
// 10. Cleanup Hook for Event Listeners and Timers
// ------------------------------------------------------------------
var useCleanup = function () {
    var cleanupFunctionsRef = (0, react_1.useRef)([]);
    var addCleanup = (0, react_1.useCallback)(function (cleanupFn) {
        cleanupFunctionsRef.current.push(cleanupFn);
    }, []);
    var runCleanup = (0, react_1.useCallback)(function () {
        cleanupFunctionsRef.current.forEach(function (fn) {
            try {
                fn();
            }
            catch (error) {
                // Only log errors in development
                if (process.env.NODE_ENV === 'development') {
                    // eslint-disable-next-line no-console
                    console.error('Error during cleanup:', error);
                }
            }
        });
        cleanupFunctionsRef.current = [];
    }, []);
    (0, react_1.useEffect)(function () {
        return function () {
            runCleanup();
        };
    }, [runCleanup]);
    return { addCleanup: addCleanup, runCleanup: runCleanup };
};
exports.useCleanup = useCleanup;
// Backward compatibility
exports.useOptimizedArray = exports.useArrayOperations;
