"use strict";
/**
 * Route preloading infrastructure exports
 * Provides centralized access to all route optimization functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeUtils = exports.preloadStrategies = exports.RoutePerformanceDashboard = exports.RoutePerformanceMonitor = exports.useSmartPreloading = exports.useRouteLoadingTracker = exports.useRoutePreloader = exports.routePreloader = void 0;
var route_preloader_1 = require("./route-preloader");
var route_preloader_2 = require("./route-preloader");
Object.defineProperty(exports, "routePreloader", { enumerable: true, get: function () { return route_preloader_2.routePreloader; } });
var useRoutePreloader_1 = require("./useRoutePreloader");
Object.defineProperty(exports, "useRoutePreloader", { enumerable: true, get: function () { return useRoutePreloader_1.useRoutePreloader; } });
Object.defineProperty(exports, "useRouteLoadingTracker", { enumerable: true, get: function () { return useRoutePreloader_1.useRouteLoadingTracker; } });
Object.defineProperty(exports, "useSmartPreloading", { enumerable: true, get: function () { return useRoutePreloader_1.useSmartPreloading; } });
var RoutePerformanceMonitor_1 = require("./RoutePerformanceMonitor");
Object.defineProperty(exports, "RoutePerformanceMonitor", { enumerable: true, get: function () { return RoutePerformanceMonitor_1.RoutePerformanceMonitor; } });
Object.defineProperty(exports, "RoutePerformanceDashboard", { enumerable: true, get: function () { return RoutePerformanceMonitor_1.RoutePerformanceDashboard; } });
// Convenience re-exports for common use cases
exports.preloadStrategies = {
    immediate: 'immediate',
    hover: 'hover',
    idle: 'idle',
    onDemand: 'on-demand',
    viewport: 'viewport',
};
// Route preloading utilities
exports.routeUtils = {
    /**
     * Preload critical routes immediately
     */
    preloadCritical: function () {
        // No-op for disabled preloader
    },
    /**
     * Check if route preloading is supported
     */
    isSupported: function () {
        return typeof window !== 'undefined' && 'requestIdleCallback' in window;
    },
    /**
     * Get current preloading metrics
     */
    getMetrics: function () {
        return route_preloader_1.routePreloader.getMetrics();
    },
    /**
     * Initialize route preloading with custom configuration
     */
    initialize: function (config) {
        var _a = config || {}, _b = _a.enableHover, enableHover = _b === void 0 ? true : _b, _c = _a.enableIdle, enableIdle = _c === void 0 ? true : _c, _d = _a.enableViewport, enableViewport = _d === void 0 ? true : _d;
        if (enableHover) {
            // No-op for disabled preloader
        }
        if (enableIdle || enableViewport) {
            route_preloader_1.routePreloader.initialize();
        }
        console.log('🚀 Route preloading initialized with configuration:', config);
    },
};
// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.__routePreloadingUtils = {
        preloader: route_preloader_1.routePreloader,
        utils: exports.routeUtils,
        getMetrics: function () { return route_preloader_1.routePreloader.getMetrics(); },
        logMetrics: function () { return console.table(route_preloader_1.routePreloader.getMetrics().summary); },
    };
}
