"use strict";
/**
 * Performance Monitoring Infrastructure
 * Exports all performance monitoring utilities and components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceConfig = exports.performanceUtils = exports.offlineStorage = exports.useNetworkStatus = exports.useServiceWorker = exports.serviceWorkerManager = exports.performanceMonitor = exports.PerformanceDebugger = exports.PerformanceMonitoringProvider = exports.PerformanceMonitoringContext = exports.usePerformanceMonitoringContext = exports.usePerformanceMonitoring = exports.resourceHintsManager = exports.bundleAnalyzer = exports.coreWebVitalsTracker = void 0;
// Core Web Vitals tracking
var core_web_vitals_1 = require("./core-web-vitals");
Object.defineProperty(exports, "coreWebVitalsTracker", { enumerable: true, get: function () { return core_web_vitals_1.coreWebVitalsTracker; } });
// Bundle analysis
var bundle_analyzer_1 = require("./bundle-analyzer");
Object.defineProperty(exports, "bundleAnalyzer", { enumerable: true, get: function () { return bundle_analyzer_1.bundleAnalyzer; } });
// Resource hints management
var resource_hints_1 = require("./resource-hints");
Object.defineProperty(exports, "resourceHintsManager", { enumerable: true, get: function () { return resource_hints_1.resourceHintsManager; } });
// React integration
var usePerformanceMonitoring_1 = require("./usePerformanceMonitoring");
Object.defineProperty(exports, "usePerformanceMonitoring", { enumerable: true, get: function () { return usePerformanceMonitoring_1.usePerformanceMonitoring; } });
Object.defineProperty(exports, "usePerformanceMonitoringContext", { enumerable: true, get: function () { return usePerformanceMonitoring_1.usePerformanceMonitoringContext; } });
Object.defineProperty(exports, "PerformanceMonitoringContext", { enumerable: true, get: function () { return usePerformanceMonitoring_1.PerformanceMonitoringContext; } });
// Provider component
var PerformanceMonitoringProvider_1 = require("./PerformanceMonitoringProvider");
Object.defineProperty(exports, "PerformanceMonitoringProvider", { enumerable: true, get: function () { return PerformanceMonitoringProvider_1.PerformanceMonitoringProvider; } });
Object.defineProperty(exports, "PerformanceDebugger", { enumerable: true, get: function () { return PerformanceMonitoringProvider_1.PerformanceDebugger; } });
// Legacy performance monitor (enhanced)
var performance_monitoring_service_1 = require("../../local/services/performance-monitoring-service");
Object.defineProperty(exports, "performanceMonitor", { enumerable: true, get: function () { return performance_monitoring_service_1.performanceMonitor; } });
// Service worker utilities
var sw_registration_1 = require("../service-worker/sw-registration");
Object.defineProperty(exports, "serviceWorkerManager", { enumerable: true, get: function () { return sw_registration_1.serviceWorkerManager; } });
Object.defineProperty(exports, "useServiceWorker", { enumerable: true, get: function () { return sw_registration_1.useServiceWorker; } });
Object.defineProperty(exports, "useNetworkStatus", { enumerable: true, get: function () { return sw_registration_1.useNetworkStatus; } });
Object.defineProperty(exports, "offlineStorage", { enumerable: true, get: function () { return sw_registration_1.offlineStorage; } });
// Utility functions for performance optimization
exports.performanceUtils = {
    // Format bytes to human readable format
    formatBytes: function (bytes) {
        if (bytes === 0)
            return '0 B';
        var k = 1024;
        var sizes = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        var sizeIndex = Math.min(i, sizes.length - 1);
        var formattedValue = parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2));
        return "".concat(formattedValue, " ").concat(sizes[sizeIndex]);
    },
    // Calculate performance score based on Core Web Vitals
    calculateCWVScore: function (metrics) {
        var score = 0;
        var count = 0;
        var calculateMetricScore = function (value, goodThreshold, needsImprovementThreshold) {
            if (value <= goodThreshold)
                return 100;
            if (value <= needsImprovementThreshold)
                return 50;
            return 0;
        };
        if (metrics.lcp !== null && metrics.lcp !== undefined) {
            score += calculateMetricScore(metrics.lcp, 2500, 4000);
            count++;
        }
        if (metrics.fid !== null && metrics.fid !== undefined) {
            score += calculateMetricScore(metrics.fid, 100, 300);
            count++;
        }
        if (metrics.cls !== null && metrics.cls !== undefined) {
            score += calculateMetricScore(metrics.cls, 0.1, 0.25);
            count++;
        }
        return count > 0 ? Math.round(score / count) : 0;
    },
    // Get performance grade based on score
    getPerformanceGrade: function (score) {
        if (score >= 90)
            return 'A';
        if (score >= 80)
            return 'B';
        if (score >= 70)
            return 'C';
        if (score >= 60)
            return 'D';
        return 'F';
    },
    // Check if device has limited resources
    isLowEndDevice: function () {
        if (typeof navigator === 'undefined')
            return false;
        var _a = navigator, connection = _a.connection, deviceMemory = _a.deviceMemory;
        var cores = navigator.hardwareConcurrency;
        // Check for slow connection
        if ((connection === null || connection === void 0 ? void 0 : connection.effectiveType) && ['slow-2g', '2g'].includes(connection.effectiveType)) {
            return true;
        }
        // Check for low memory or few CPU cores
        return (deviceMemory && deviceMemory <= 2) || (cores && cores <= 2) || false;
    },
    // Get connection speed estimate
    getConnectionSpeed: function () {
        if (typeof navigator === 'undefined')
            return 'unknown';
        var connection = navigator.connection;
        return (connection === null || connection === void 0 ? void 0 : connection.effectiveType) || 'unknown';
    },
    // Debounce function for performance-sensitive operations
    debounce: function (func, wait) {
        var timeout;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            clearTimeout(timeout);
            timeout = setTimeout(function () { return func.apply(void 0, args); }, wait);
        };
    },
    // Throttle function for performance-sensitive operations
    throttle: function (func, limit) {
        var inThrottle;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (!inThrottle) {
                func.apply(void 0, args);
                inThrottle = true;
                setTimeout(function () { return inThrottle = false; }, limit);
            }
        };
    },
};
// Performance monitoring configuration
exports.performanceConfig = {
    // Core Web Vitals thresholds
    thresholds: {
        lcp: { good: 2500, needsImprovement: 4000 },
        fid: { good: 100, needsImprovement: 300 },
        cls: { good: 0.1, needsImprovement: 0.25 },
        fcp: { good: 1800, needsImprovement: 3000 },
        ttfb: { good: 800, needsImprovement: 1800 },
    },
    // Bundle size limits
    bundleLimits: {
        maxChunkSize: 500000, // 500KB
        maxVendorSize: 1000000, // 1MB
        maxTotalSize: 2000000, // 2MB
    },
    // Cache limits
    cacheLimits: {
        images: 50,
        api: 100,
        dynamic: 200,
    },
    // Performance budget
    budget: {
        javascript: 500000, // 500KB
        css: 100000, // 100KB
        images: 1000000, // 1MB
        fonts: 200000, // 200KB
    },
};
