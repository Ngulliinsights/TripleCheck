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
exports.useComponentPerformance = void 0;
exports.withPerformanceMonitor = withPerformanceMonitor;
exports.usePerformanceMonitor = usePerformanceMonitor;
var react_1 = require("react");
// ------------------------------------------------------------------
// Enhanced Component Performance Hook (consolidated from usePerformanceMonitor)
// ------------------------------------------------------------------
/**
 * Enhanced component performance monitoring hook
 * Consolidates functionality from usePerformanceMonitor and useComponentPerformance
 *
 * @param options - Configuration options for performance monitoring
 * @returns Performance monitoring functions and metrics
 */
var useComponentPerformance = function (options) {
    // Handle both old and new API signatures for backward compatibility
    var config = typeof options === "string" ?
        {
            componentName: options,
            trackRenders: true,
            enabled: process.env.NODE_ENV === "development",
            threshold: 16
        }
        : __assign({ trackRenders: true, enabled: process.env.NODE_ENV === "development", threshold: 16 }, options);
    var componentName = config.componentName, _a = config.enabled, enabled = _a === void 0 ? false : _a, _b = config.threshold, threshold = _b === void 0 ? 16 : _b, _c = config.trackRenders, trackRenders = _c === void 0 ? true : _c;
    // Performance tracking refs
    var renderStartTime = (0, react_1.useRef)(0);
    var renderCount = (0, react_1.useRef)(0);
    var totalRenderTime = (0, react_1.useRef)(0);
    var lastRenderTime = (0, react_1.useRef)(0);
    // Start timing at the beginning of render
    if (enabled && trackRenders && (window === null || window === void 0 ? void 0 : window.performance)) {
        renderStartTime.current = window.performance.now();
    }
    var logMetrics = (0, react_1.useCallback)(function (metrics) {
        if (!enabled)
            return;
        if (metrics.renderTime > threshold) {
            // eslint-disable-next-line no-console
            console.warn("\uD83D\uDC0C Slow render detected in ".concat(metrics.componentName, ":"), {
                renderTime: "".concat(metrics.renderTime.toFixed(2), "ms"),
                propsCount: metrics.propsCount,
                timestamp: new Date(metrics.timestamp).toISOString(),
            });
        }
        // Log performance summary every 100 renders
        if (renderCount.current % 100 === 0 && renderCount.current > 0) {
            var avgRenderTime = totalRenderTime.current / renderCount.current;
            // eslint-disable-next-line no-console
            console.info("\uD83D\uDCCA Performance summary for ".concat(componentName, ":"), {
                totalRenders: renderCount.current,
                averageRenderTime: "".concat(avgRenderTime.toFixed(2), "ms"),
                totalTime: "".concat(totalRenderTime.current.toFixed(2), "ms"),
            });
        }
    }, [enabled, threshold, componentName]);
    // Track API calls with data
    var trackApiCall = (0, react_1.useCallback)(function (data) {
        if (!enabled)
            return;
        // eslint-disable-next-line no-console
        console.debug("\uD83D\uDCE1 API call tracked for ".concat(componentName, ":"), {
            timestamp: new Date().toISOString(),
            data: typeof data === "object" ?
                "".concat(JSON.stringify(data).slice(0, 100), "...")
                : data,
        });
    }, [enabled, componentName]);
    // Manually track renders
    var trackRender = (0, react_1.useCallback)(function () {
        if (!enabled || !(window === null || window === void 0 ? void 0 : window.performance))
            return;
        var currentTime = window.performance.now();
        var renderTime = currentTime - lastRenderTime.current;
        lastRenderTime.current = currentTime;
        renderCount.current += 1;
        totalRenderTime.current += renderTime;
        var metrics = {
            renderTime: renderTime,
            componentName: componentName,
            propsCount: 0, // Could be enhanced to count actual props
            timestamp: Date.now(),
        };
        logMetrics(metrics);
    }, [enabled, componentName, logMetrics]);
    // Get current stats
    var getStats = (0, react_1.useCallback)(function () {
        return {
            componentName: componentName,
            renderCount: renderCount.current,
            totalRenderTime: totalRenderTime.current,
            averageRenderTime: renderCount.current > 0 ?
                totalRenderTime.current / renderCount.current
                : 0,
            lastRenderTime: lastRenderTime.current,
        };
    }, [componentName]);
    // Reset stats for this component
    var reset = (0, react_1.useCallback)(function () {
        renderCount.current = 0;
        totalRenderTime.current = 0;
        lastRenderTime.current = (window === null || window === void 0 ? void 0 : window.performance) ? window.performance.now() : 0;
    }, []);
    // Auto-track renders if enabled
    (0, react_1.useEffect)(function () {
        if (!enabled || !trackRenders || !(window === null || window === void 0 ? void 0 : window.performance))
            return;
        var renderEndTime = window.performance.now();
        var renderTime = renderEndTime - renderStartTime.current;
        renderCount.current += 1;
        totalRenderTime.current += renderTime;
        lastRenderTime.current = renderEndTime;
        var metrics = {
            renderTime: renderTime,
            componentName: componentName,
            propsCount: 0, // Could be enhanced to count actual props
            timestamp: Date.now(),
        };
        logMetrics(metrics);
    });
    return {
        trackApiCall: trackApiCall,
        trackRender: trackRender,
        getStats: getStats,
        reset: reset,
        renderCount: renderCount.current,
        averageRenderTime: renderCount.current > 0 ?
            totalRenderTime.current / renderCount.current
            : 0,
    };
};
exports.useComponentPerformance = useComponentPerformance;
// ------------------------------------------------------------------
// Higher-Order Component (consolidated from usePerformanceMonitor)
// ------------------------------------------------------------------
/**
 * Higher-order component to add performance monitoring to any component
 * Consolidated from usePerformanceMonitor for backward compatibility
 */
function withPerformanceMonitor(Component, componentName) {
    var WrappedComponent = function (props) {
        (0, exports.useComponentPerformance)({
            componentName: componentName || Component.displayName || Component.name || "Unknown",
        });
        return <Component {...props}/>;
    };
    WrappedComponent.displayName = "withPerformanceMonitor(".concat(componentName || Component.displayName || Component.name, ")");
    return WrappedComponent;
}
/**
 * Compatibility function for usePerformanceMonitor migration
 * Maps old usePerformanceMonitor API to new useComponentPerformance API
 */
function usePerformanceMonitor(options) {
    var _a, _b;
    var result = (0, exports.useComponentPerformance)({
        componentName: options.componentName,
        enabled: (_a = options.enabled) !== null && _a !== void 0 ? _a : process.env.NODE_ENV === "development",
        threshold: (_b = options.threshold) !== null && _b !== void 0 ? _b : 16,
        trackRenders: true,
    });
    // Return API that matches old usePerformanceMonitor
    return {
        renderCount: result.renderCount,
        averageRenderTime: result.averageRenderTime,
    };
}
exports.default = exports.useComponentPerformance;
