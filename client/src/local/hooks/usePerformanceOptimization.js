"use strict";
/**
 * Performance Optimization Hooks
 * React hooks for caching, lazy loading, and performance monitoring
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
exports.usePreloader = exports.useVirtualScrolling = exports.useExpensiveMemo = exports.usePerformanceMonitoring = exports.useThrottle = exports.useDebounce = exports.useLazyLoading = exports.useCache = void 0;
var react_1 = require("react");
var PerformanceService_1 = require("../services/PerformanceService");
// Simple performance metric recorder
var recordMetric = function (name, value, _type, metadata) {
    if (process.env.NODE_ENV === 'development') {
        console.log("[Performance] ".concat(name, ":"), value, metadata);
    }
    // In production, this could send to analytics
};
// Simple client-side cache (no server imports)
var clientCache = new Map();
var cacheService = {
    get: function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var item;
            return __generator(this, function (_a) {
                item = clientCache.get(key);
                if (!item)
                    return [2 /*return*/, null];
                if (Date.now() > item.expiry) {
                    clientCache.delete(key);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/, item.value];
            });
        });
    },
    set: function (key, value, options) {
        return __awaiter(this, void 0, void 0, function () {
            var ttl;
            return __generator(this, function (_a) {
                ttl = (options === null || options === void 0 ? void 0 : options.ttl) || 3600;
                clientCache.set(key, {
                    value: value,
                    expiry: Date.now() + (ttl * 1000)
                });
                return [2 /*return*/, true];
            });
        });
    },
    delete: function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, clientCache.delete(key)];
            });
        });
    }
};
/**
 * Hook for intelligent caching with React Query-like interface
 */
var useCache = function (key, fetcher, options) {
    if (options === void 0) { options = {}; }
    var _a = (0, react_1.useState)(null), data = _a[0], setData = _a[1];
    var _b = (0, react_1.useState)(false), isLoading = _b[0], setIsLoading = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    var _d = (0, react_1.useState)(false), isStale = _d[0], setIsStale = _d[1];
    var _e = options.enabled, enabled = _e === void 0 ? true : _e, _f = options.staleWhileRevalidate, staleWhileRevalidate = _f === void 0 ? false : _f;
    var fetcherRef = (0, react_1.useRef)(fetcher);
    fetcherRef.current = fetcher;
    var fetchData = (0, react_1.useCallback)(function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (useStale) {
            var cachedData, freshData, err_1, error_1;
            var _a, _b;
            if (useStale === void 0) { useStale = false; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!enabled)
                            return [2 /*return*/];
                        cachedData = cacheService.get(key);
                        if (cachedData) {
                            setData(cachedData);
                            setError(null);
                            if (!useStale) {
                                return [2 /*return*/, cachedData];
                            }
                            else {
                                setIsStale(true);
                            }
                        }
                        if (!(!cachedData || useStale)) return [3 /*break*/, 6];
                        setIsLoading(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, 5, 6]);
                        PerformanceService_1.performanceMonitoring.mark("cache_fetch_".concat(key, "_start"));
                        return [4 /*yield*/, fetcherRef.current()];
                    case 2:
                        freshData = _c.sent();
                        PerformanceService_1.performanceMonitoring.mark("cache_fetch_".concat(key, "_end"));
                        PerformanceService_1.performanceMonitoring.measureTiming("cache_fetch_".concat(key), "cache_fetch_".concat(key, "_start"), "cache_fetch_".concat(key, "_end"));
                        // Cache the fresh data
                        return [4 /*yield*/, cacheService.set(key, freshData, options.ttl)];
                    case 3:
                        // Cache the fresh data
                        _c.sent();
                        setData(freshData);
                        setError(null);
                        setIsStale(false);
                        (_a = options.onSuccess) === null || _a === void 0 ? void 0 : _a.call(options, freshData);
                        return [2 /*return*/, freshData];
                    case 4:
                        err_1 = _c.sent();
                        error_1 = err_1;
                        setError(error_1);
                        (_b = options.onError) === null || _b === void 0 ? void 0 : _b.call(options, error_1);
                        throw error_1;
                    case 5:
                        setIsLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }, [key, enabled, options]);
    var invalidate = (0, react_1.useCallback)(function () {
        cacheService.delete(key);
        setData(null);
        setIsStale(false);
    }, [key]);
    var refetch = (0, react_1.useCallback)(function () {
        invalidate();
        return fetchData();
    }, [invalidate, fetchData]);
    // Initial fetch
    (0, react_1.useEffect)(function () {
        if (enabled) {
            fetchData(staleWhileRevalidate);
        }
    }, [fetchData, enabled, staleWhileRevalidate]);
    return {
        data: data,
        isLoading: isLoading,
        error: error,
        isStale: isStale,
        refetch: refetch,
        invalidate: invalidate
    };
};
exports.useCache = useCache;
/**
 * Hook for lazy loading with intersection observer
 */
var useLazyLoading = function (options) {
    if (options === void 0) { options = {}; }
    var _a = (0, react_1.useState)(false), isVisible = _a[0], setIsVisible = _a[1];
    var _b = (0, react_1.useState)(false), hasTriggered = _b[0], setHasTriggered = _b[1];
    var elementRef = (0, react_1.useRef)(null);
    var observerRef = (0, react_1.useRef)();
    var _c = options.threshold, threshold = _c === void 0 ? 0.1 : _c, _d = options.rootMargin, rootMargin = _d === void 0 ? '50px' : _d, _e = options.triggerOnce, triggerOnce = _e === void 0 ? true : _e;
    (0, react_1.useEffect)(function () {
        var element = elementRef.current;
        if (!element)
            return;
        observerRef.current = new IntersectionObserver(function (_a) {
            var _b;
            var entry = _a[0];
            var isIntersecting = entry.isIntersecting;
            if (isIntersecting && (!triggerOnce || !hasTriggered)) {
                setIsVisible(true);
                setHasTriggered(true);
                recordMetric('lazy_load_triggered', Date.now(), 'custom', { element: element.tagName.toLowerCase() });
                if (triggerOnce) {
                    (_b = observerRef.current) === null || _b === void 0 ? void 0 : _b.unobserve(element);
                }
            }
            else if (!triggerOnce) {
                setIsVisible(isIntersecting);
            }
        }, { threshold: threshold, rootMargin: rootMargin });
        observerRef.current.observe(element);
        return function () {
            var _a;
            (_a = observerRef.current) === null || _a === void 0 ? void 0 : _a.disconnect();
        };
    }, [threshold, rootMargin, triggerOnce, hasTriggered]);
    return {
        elementRef: elementRef,
        isVisible: isVisible,
        hasTriggered: hasTriggered
    };
};
exports.useLazyLoading = useLazyLoading;
/**
 * Hook for debounced values to optimize performance
 */
var useDebounce = function (value, delay) {
    var _a = (0, react_1.useState)(value), debouncedValue = _a[0], setDebouncedValue = _a[1];
    (0, react_1.useEffect)(function () {
        var handler = setTimeout(function () {
            setDebouncedValue(value);
        }, delay);
        return function () {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};
exports.useDebounce = useDebounce;
/**
 * Hook for throttled callbacks
 */
var useThrottle = function (callback, delay) {
    var lastRun = (0, react_1.useRef)(Date.now());
    var timeoutRef = (0, react_1.useRef)();
    return (0, react_1.useCallback)((function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (Date.now() - lastRun.current >= delay) {
            callback.apply(void 0, args);
            lastRun.current = Date.now();
        }
        else {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(function () {
                callback.apply(void 0, args);
                lastRun.current = Date.now();
            }, delay - (Date.now() - lastRun.current));
        }
    }), [callback, delay]);
};
exports.useThrottle = useThrottle;
/**
 * Hook for performance monitoring
 */
var usePerformanceMonitoring = function (componentName) {
    var renderStartTime = (0, react_1.useRef)(Date.now());
    var mountTime = (0, react_1.useRef)();
    (0, react_1.useEffect)(function () {
        // Record mount time
        mountTime.current = Date.now();
        var mountDuration = mountTime.current - renderStartTime.current;
        recordMetric("component_mount_".concat(componentName), mountDuration, 'custom', { component: componentName });
        return function () {
            // Record unmount time
            if (mountTime.current) {
                var unmountDuration = Date.now() - mountTime.current;
                recordMetric("component_lifetime_".concat(componentName), unmountDuration, 'custom', { component: componentName });
            }
        };
    }, [componentName]);
    var measureRender = (0, react_1.useCallback)(function () {
        renderStartTime.current = Date.now();
    }, []);
    var recordCustomMetric = (0, react_1.useCallback)(function (name, value, tags) {
        recordMetric("".concat(componentName, "_").concat(name), value, 'custom', __assign({ component: componentName }, tags));
    }, [componentName]);
    return {
        measureRender: measureRender,
        recordCustomMetric: recordCustomMetric
    };
};
exports.usePerformanceMonitoring = usePerformanceMonitoring;
/**
 * Hook for memoized expensive calculations
 */
var useExpensiveMemo = function (factory, deps, cacheKey) {
    var memoizedValue = (0, react_1.useMemo)(function () {
        var startTime = Date.now();
        // Check cache if key provided
        if (cacheKey) {
            var cached = cacheService.get(cacheKey);
            if (cached) {
                recordMetric('expensive_memo_cache_hit', Date.now() - startTime, 'custom', { cacheKey: cacheKey });
                return cached;
            }
        }
        // Calculate value
        var result = factory();
        var duration = Date.now() - startTime;
        // Cache result if key provided
        if (cacheKey) {
            cacheService.set(cacheKey, result, {
                ttl: 5 * 60 * 1000, // 5 minutes
                tags: ['expensive_memo']
            });
        }
        recordMetric('expensive_memo_calculation', duration, 'custom', { cacheKey: cacheKey || 'no_cache', cached: false });
        return result;
    }, deps);
    return memoizedValue;
};
exports.useExpensiveMemo = useExpensiveMemo;
/**
 * Hook for virtual scrolling optimization
 */
var useVirtualScrolling = function (items, itemHeight, containerHeight, overscan) {
    if (overscan === void 0) { overscan = 5; }
    var _a = (0, react_1.useState)(0), scrollTop = _a[0], setScrollTop = _a[1];
    var visibleRange = (0, react_1.useMemo)(function () {
        var startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        var endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
        return { startIndex: startIndex, endIndex: endIndex };
    }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
    var visibleItems = (0, react_1.useMemo)(function () {
        return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map(function (item, index) { return ({
            item: item,
            index: visibleRange.startIndex + index
        }); });
    }, [items, visibleRange]);
    var totalHeight = items.length * itemHeight;
    var offsetY = visibleRange.startIndex * itemHeight;
    var handleScroll = (0, react_1.useCallback)(function (event) {
        setScrollTop(event.currentTarget.scrollTop);
    }, []);
    return {
        visibleItems: visibleItems,
        totalHeight: totalHeight,
        offsetY: offsetY,
        handleScroll: handleScroll
    };
};
exports.useVirtualScrolling = useVirtualScrolling;
/**
 * Hook for preloading resources
 */
var usePreloader = function () {
    var _a = (0, react_1.useState)(new Set()), loadedResources = _a[0], setLoadedResources = _a[1];
    var _b = (0, react_1.useState)(new Set()), loadingResources = _b[0], setLoadingResources = _b[1];
    var preloadImage = (0, react_1.useCallback)(function (src) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (loadedResources.has(src) || loadingResources.has(src)) {
                return [2 /*return*/];
            }
            setLoadingResources(function (prev) { return new Set(prev).add(src); });
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var img = new Image();
                    img.onload = function () {
                        setLoadedResources(function (prev) { return new Set(prev).add(src); });
                        setLoadingResources(function (prev) {
                            var newSet = new Set(prev);
                            newSet.delete(src);
                            return newSet;
                        });
                        recordMetric('image_preload_success', Date.now(), 'custom', { src: src });
                        resolve();
                    };
                    img.onerror = function () {
                        setLoadingResources(function (prev) {
                            var newSet = new Set(prev);
                            newSet.delete(src);
                            return newSet;
                        });
                        recordMetric('image_preload_error', Date.now(), 'custom', { src: src });
                        reject(new Error("Failed to preload image: ".concat(src)));
                    };
                    img.src = src;
                })];
        });
    }); }, [loadedResources, loadingResources]);
    var preloadScript = (0, react_1.useCallback)(function (src) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (loadedResources.has(src) || loadingResources.has(src)) {
                return [2 /*return*/];
            }
            setLoadingResources(function (prev) { return new Set(prev).add(src); });
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var script = document.createElement('script');
                    script.onload = function () {
                        setLoadedResources(function (prev) { return new Set(prev).add(src); });
                        setLoadingResources(function (prev) {
                            var newSet = new Set(prev);
                            newSet.delete(src);
                            return newSet;
                        });
                        recordMetric('script_preload_success', Date.now(), 'custom', { src: src });
                        resolve();
                    };
                    script.onerror = function () {
                        setLoadingResources(function (prev) {
                            var newSet = new Set(prev);
                            newSet.delete(src);
                            return newSet;
                        });
                        recordMetric('script_preload_error', Date.now(), 'custom', { src: src });
                        reject(new Error("Failed to preload script: ".concat(src)));
                    };
                    script.src = src;
                    document.head.appendChild(script);
                })];
        });
    }); }, [loadedResources, loadingResources]);
    return {
        preloadImage: preloadImage,
        preloadScript: preloadScript,
        loadedResources: Array.from(loadedResources),
        loadingResources: Array.from(loadingResources),
        isLoaded: function (src) { return loadedResources.has(src); },
        isLoading: function (src) { return loadingResources.has(src); }
    };
};
exports.usePreloader = usePreloader;
