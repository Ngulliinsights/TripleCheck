"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGlobalPerformanceMonitor = exports.GlobalPerformanceMonitor = void 0;
var raceConditionTest_1 = require("../../property/utils/raceConditionTest");
// Global performance monitoring utility that works with any component
var GlobalPerformanceMonitor = /** @class */ (function () {
    function GlobalPerformanceMonitor() {
        this.componentStats = new Map();
    }
    GlobalPerformanceMonitor.getInstance = function () {
        if (!GlobalPerformanceMonitor.instance) {
            GlobalPerformanceMonitor.instance = new GlobalPerformanceMonitor();
        }
        return GlobalPerformanceMonitor.instance;
    };
    GlobalPerformanceMonitor.prototype.getComponentStats = function (componentName) {
        if (!this.componentStats.has(componentName)) {
            this.componentStats.set(componentName, {
                apiCallCount: 0,
                apiCallHistory: [],
                renderCount: 0,
                lastRenderTime: 0,
                lastApiCallTime: 0,
            });
        }
        return this.componentStats.get(componentName);
    };
    GlobalPerformanceMonitor.prototype.trackApiCall = function (componentName, data) {
        var timestamp = Date.now();
        var dataString = JSON.stringify(data);
        var stats = this.getComponentStats(componentName);
        // Throttle API call tracking to prevent overwhelming the monitor
        if (timestamp - stats.lastApiCallTime < 50) {
            if (process.env.NODE_ENV === "development") {
                console.warn("[".concat(componentName, "] API call tracking throttled (").concat(timestamp - stats.lastApiCallTime, "ms since last)"));
            }
            return;
        }
        stats.lastApiCallTime = timestamp;
        // Check if this is a duplicate of the last call within a short timeframe
        var lastCall = stats.apiCallHistory[stats.apiCallHistory.length - 1];
        if (lastCall &&
            lastCall.data === dataString &&
            timestamp - lastCall.timestamp < 200) {
            if (process.env.NODE_ENV === "development") {
                console.warn("[".concat(componentName, "] Duplicate API call detected within 200ms - skipping track"));
            }
            return;
        }
        stats.apiCallCount++;
        stats.apiCallHistory.push({ timestamp: timestamp, data: dataString });
        // Keep only recent history (last 50 calls)
        if (stats.apiCallHistory.length > 50) {
            stats.apiCallHistory = stats.apiCallHistory.slice(-50);
        }
        if (process.env.NODE_ENV === "development") {
            console.log("[".concat(componentName, "] API Call #").concat(stats.apiCallCount, " (").concat(timestamp - ((lastCall === null || lastCall === void 0 ? void 0 : lastCall.timestamp) || timestamp), "ms since last):"), data);
        }
        // Update race condition tester
        raceConditionTest_1.raceConditionTester.recordApiCall();
    };
    GlobalPerformanceMonitor.prototype.trackRender = function (componentName) {
        var timestamp = Date.now();
        var stats = this.getComponentStats(componentName);
        stats.renderCount++;
        // Check for excessive re-renders
        if (stats.lastRenderTime && timestamp - stats.lastRenderTime < 5) {
            if (process.env.NODE_ENV === "development") {
                console.warn("[".concat(componentName, "] Potential excessive re-render detected. Time since last render: ").concat(timestamp - stats.lastRenderTime, "ms"));
            }
        }
        stats.lastRenderTime = timestamp;
        if (process.env.NODE_ENV === "development") {
            console.log("[".concat(componentName, "] Render #").concat(stats.renderCount));
        }
        // Update race condition tester
        raceConditionTest_1.raceConditionTester.recordRender();
    };
    GlobalPerformanceMonitor.prototype.getStats = function (componentName) {
        var stats = this.getComponentStats(componentName);
        var now = Date.now();
        // Calculate recent API calls (last 10 seconds)
        var recentCalls = stats.apiCallHistory.filter(function (call) { return now - call.timestamp < 10000; });
        // Calculate average time between calls
        var averageTimeBetweenCalls = 0;
        if (stats.apiCallHistory.length > 1) {
            var lastCall = stats.apiCallHistory[stats.apiCallHistory.length - 1];
            var firstCall = stats.apiCallHistory[0];
            if (lastCall && firstCall) {
                var totalTime = lastCall.timestamp - firstCall.timestamp;
                averageTimeBetweenCalls = totalTime / (stats.apiCallHistory.length - 1);
            }
        }
        return {
            totalApiCalls: stats.apiCallCount,
            totalRenders: stats.renderCount,
            recentApiCalls: recentCalls.length,
            averageTimeBetweenCalls: averageTimeBetweenCalls,
            lastRenderTime: stats.lastRenderTime,
            lastApiCallTime: stats.lastApiCallTime,
        };
    };
    GlobalPerformanceMonitor.prototype.getAllComponentStats = function () {
        var allStats = {};
        for (var _i = 0, _a = this.componentStats; _i < _a.length; _i++) {
            var componentName = _a[_i][0];
            allStats[componentName] = this.getStats(componentName);
        }
        return allStats;
    };
    GlobalPerformanceMonitor.prototype.reset = function (componentName) {
        if (componentName) {
            this.componentStats.delete(componentName);
        }
        else {
            this.componentStats.clear();
        }
        raceConditionTest_1.raceConditionTester.reset();
    };
    // Get performance issues across all components
    GlobalPerformanceMonitor.prototype.getGlobalPerformanceIssues = function () {
        var issues = [];
        var allStats = this.getAllComponentStats();
        for (var _i = 0, _a = Object.entries(allStats); _i < _a.length; _i++) {
            var _b = _a[_i], componentName = _b[0], stats = _b[1];
            if (stats.averageTimeBetweenCalls < 300 && stats.totalApiCalls > 5) {
                issues.push("".concat(componentName, ": Rapid API calls detected (avg ").concat(Math.round(stats.averageTimeBetweenCalls), "ms between calls)"));
            }
            if (stats.recentApiCalls > 10) {
                issues.push("".concat(componentName, ": High API call frequency (").concat(stats.recentApiCalls, " calls in last 10s)"));
            }
        }
        return issues;
    };
    return GlobalPerformanceMonitor;
}());
exports.GlobalPerformanceMonitor = GlobalPerformanceMonitor;
// React hook for global performance monitoring
var useGlobalPerformanceMonitor = function (componentName) {
    var monitor = GlobalPerformanceMonitor.getInstance();
    return {
        trackApiCall: function (data) { return monitor.trackApiCall(componentName, data); },
        trackRender: function () { return monitor.trackRender(componentName); },
        getStats: function () { return monitor.getStats(componentName); },
        reset: function () { return monitor.reset(componentName); },
    };
};
exports.useGlobalPerformanceMonitor = useGlobalPerformanceMonitor;
exports.default = GlobalPerformanceMonitor;
