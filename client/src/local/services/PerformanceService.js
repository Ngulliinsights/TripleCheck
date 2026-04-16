"use strict";
/**
 * Client-side Performance Monitoring with web-vitals
 * Replaces custom PerformanceService
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
exports.performanceMonitoring = void 0;
var web_vitals_1 = require("web-vitals");
var PerformanceMonitoring = /** @class */ (function () {
    function PerformanceMonitoring() {
        this.metrics = [];
        this.analyticsEndpoint = '/api/analytics/vitals';
    }
    PerformanceMonitoring.prototype.initialize = function () {
        // Core Web Vitals
        (0, web_vitals_1.onCLS)(this.handleMetric.bind(this));
        (0, web_vitals_1.onFID)(this.handleMetric.bind(this));
        (0, web_vitals_1.onLCP)(this.handleMetric.bind(this));
        (0, web_vitals_1.onFCP)(this.handleMetric.bind(this));
        (0, web_vitals_1.onTTFB)(this.handleMetric.bind(this));
        (0, web_vitals_1.onINP)(this.handleMetric.bind(this));
        console.log('Performance monitoring initialized');
    };
    PerformanceMonitoring.prototype.handleMetric = function (metric) {
        var performanceMetric = {
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
            navigationType: metric.navigationType,
        };
        this.metrics.push(performanceMetric);
        // Send to analytics
        this.sendToAnalytics(performanceMetric);
        // Log in development
        if (process.env.NODE_ENV === 'development') {
            console.log("[Performance] ".concat(metric.name, ":"), {
                value: metric.value,
                rating: metric.rating,
            });
        }
    };
    PerformanceMonitoring.prototype.sendToAnalytics = function (metric) {
        if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
            return;
        }
        var body = JSON.stringify(__assign(__assign({}, metric), { url: window.location.href, userAgent: navigator.userAgent, timestamp: Date.now() }));
        // Use sendBeacon for reliability (works even if page is closing)
        navigator.sendBeacon(this.analyticsEndpoint, body);
    };
    /**
     * Get all collected metrics
     */
    PerformanceMonitoring.prototype.getMetrics = function () {
        return __spreadArray([], this.metrics, true);
    };
    /**
     * Get metrics summary
     */
    PerformanceMonitoring.prototype.getSummary = function () {
        var summary = {};
        for (var _i = 0, _a = this.metrics; _i < _a.length; _i++) {
            var metric = _a[_i];
            if (!summary[metric.name]) {
                summary[metric.name] = {
                    name: metric.name,
                    value: metric.value,
                    rating: metric.rating,
                };
            }
        }
        return summary;
    };
    /**
     * Measure custom timing
     */
    PerformanceMonitoring.prototype.measureTiming = function (name, startMark, endMark) {
        try {
            performance.measure(name, startMark, endMark);
            var measure = performance.getEntriesByName(name)[0];
            if (measure) {
                this.sendToAnalytics({
                    name: "custom.".concat(name),
                    value: measure.duration,
                    rating: 'good',
                    delta: measure.duration,
                    id: "custom-".concat(Date.now()),
                    navigationType: 'navigate',
                });
            }
        }
        catch (error) {
            console.warn('Failed to measure timing:', error);
        }
    };
    /**
     * Mark a performance point
     */
    PerformanceMonitoring.prototype.mark = function (name) {
        try {
            performance.mark(name);
        }
        catch (error) {
            console.warn('Failed to mark performance:', error);
        }
    };
    /**
     * Clear all marks and measures
     */
    PerformanceMonitoring.prototype.clear = function () {
        try {
            performance.clearMarks();
            performance.clearMeasures();
            this.metrics = [];
        }
        catch (error) {
            console.warn('Failed to clear performance data:', error);
        }
    };
    return PerformanceMonitoring;
}());
exports.performanceMonitoring = new PerformanceMonitoring();
// Auto-initialize in browser
if (typeof window !== 'undefined') {
    exports.performanceMonitoring.initialize();
}
exports.default = exports.performanceMonitoring;
