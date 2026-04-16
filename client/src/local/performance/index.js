"use strict";
/**
 * Performance Optimization Framework Index
 * Exports all performance-related services, hooks, and components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressiveImage = exports.InfiniteScroll = exports.LazyRoute = exports.VirtualizedList = exports.LazyComponent = exports.LazyImage = exports.usePreloader = exports.useVirtualScrolling = exports.useExpensiveMemo = exports.usePerformanceMonitoring = exports.useThrottle = exports.useDebounce = exports.useLazyLoading = exports.useCache = exports.performanceService = void 0;
// Services
// export { default as cacheService } from "../services/CacheService" // File doesn't exist
var PerformanceService_1 = require("../services/PerformanceService");
Object.defineProperty(exports, "performanceService", { enumerable: true, get: function () { return PerformanceService_1.default; } });
// Hooks
var usePerformanceOptimization_1 = require("../hooks/usePerformanceOptimization");
Object.defineProperty(exports, "useCache", { enumerable: true, get: function () { return usePerformanceOptimization_1.useCache; } });
Object.defineProperty(exports, "useLazyLoading", { enumerable: true, get: function () { return usePerformanceOptimization_1.useLazyLoading; } });
Object.defineProperty(exports, "useDebounce", { enumerable: true, get: function () { return usePerformanceOptimization_1.useDebounce; } });
Object.defineProperty(exports, "useThrottle", { enumerable: true, get: function () { return usePerformanceOptimization_1.useThrottle; } });
Object.defineProperty(exports, "usePerformanceMonitoring", { enumerable: true, get: function () { return usePerformanceOptimization_1.usePerformanceMonitoring; } });
Object.defineProperty(exports, "useExpensiveMemo", { enumerable: true, get: function () { return usePerformanceOptimization_1.useExpensiveMemo; } });
Object.defineProperty(exports, "useVirtualScrolling", { enumerable: true, get: function () { return usePerformanceOptimization_1.useVirtualScrolling; } });
Object.defineProperty(exports, "usePreloader", { enumerable: true, get: function () { return usePerformanceOptimization_1.usePreloader; } });
// Components
var LazyComponents_1 = require("../components/LazyComponents");
Object.defineProperty(exports, "LazyImage", { enumerable: true, get: function () { return LazyComponents_1.LazyImage; } });
Object.defineProperty(exports, "LazyComponent", { enumerable: true, get: function () { return LazyComponents_1.LazyComponent; } });
Object.defineProperty(exports, "VirtualizedList", { enumerable: true, get: function () { return LazyComponents_1.VirtualizedList; } });
Object.defineProperty(exports, "LazyRoute", { enumerable: true, get: function () { return LazyComponents_1.LazyRoute; } });
Object.defineProperty(exports, "InfiniteScroll", { enumerable: true, get: function () { return LazyComponents_1.InfiniteScroll; } });
Object.defineProperty(exports, "ProgressiveImage", { enumerable: true, get: function () { return LazyComponents_1.ProgressiveImage; } });
