"use strict";
/**
 * API Client Monitoring and Performance Baseline
 *
 * This service monitors the unified API client performance and provides
 * baseline metrics for regression detection.
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
exports.monitoringUtils = exports.apiMonitor = void 0;
var ApiClientMonitor = /** @class */ (function () {
    function ApiClientMonitor() {
        this.endpointMetrics = new Map();
        this.responseTimes = [];
        this.baseline = null;
        this.isMonitoring = false;
        this.metrics = this.initializeMetrics();
        this.startMonitoring();
    }
    ApiClientMonitor.prototype.initializeMetrics = function () {
        return {
            requestCount: 0,
            successCount: 0,
            errorCount: 0,
            averageResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            cacheHitRate: 0,
            circuitBreakerTrips: 0,
            rateLimitHits: 0,
            securityBlocks: 0,
            lastUpdated: new Date()
        };
    };
    /**
     * Start monitoring API client performance
     */
    ApiClientMonitor.prototype.startMonitoring = function () {
        var _this = this;
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        console.log('🔍 API Client monitoring started');
        // Monitor fetch requests by intercepting them
        this.interceptFetch();
        // Set up periodic metric collection
        setInterval(function () {
            _this.collectMetrics();
        }, 30000); // Every 30 seconds
        // Set up performance baseline collection
        setTimeout(function () {
            _this.establishBaseline();
        }, 60000); // After 1 minute of operation
    };
    /**
     * Intercept fetch requests to monitor API calls
     */
    ApiClientMonitor.prototype.interceptFetch = function () {
        var _this = this;
        var originalFetch = window.fetch;
        window.fetch = function (input, init) { return __awaiter(_this, void 0, void 0, function () {
            var startTime, url, method, response, endTime, responseTime, error_1, endTime, responseTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = performance.now();
                        url = typeof input === 'string' ? input : input.toString();
                        method = (init === null || init === void 0 ? void 0 : init.method) || 'GET';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, originalFetch(input, init)];
                    case 2:
                        response = _a.sent();
                        endTime = performance.now();
                        responseTime = endTime - startTime;
                        this.recordRequest(url, method, response.status, responseTime, response.ok);
                        return [2 /*return*/, response];
                    case 3:
                        error_1 = _a.sent();
                        endTime = performance.now();
                        responseTime = endTime - startTime;
                        this.recordRequest(url, method, 0, responseTime, false, error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * Record individual request metrics
     */
    ApiClientMonitor.prototype.recordRequest = function (url, method, status, responseTime, success, error) {
        // Update global metrics
        this.metrics.requestCount++;
        if (success) {
            this.metrics.successCount++;
        }
        else {
            this.metrics.errorCount++;
        }
        // Track response times
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > 1000) {
            this.responseTimes = this.responseTimes.slice(-1000); // Keep last 1000
        }
        // Update endpoint-specific metrics
        var endpointKey = "".concat(method, ":").concat(this.normalizeUrl(url));
        var endpointMetric = this.endpointMetrics.get(endpointKey);
        if (!endpointMetric) {
            endpointMetric = {
                endpoint: this.normalizeUrl(url),
                method: method,
                requestCount: 0,
                successRate: 0,
                averageResponseTime: 0,
                errorTypes: {}
            };
            this.endpointMetrics.set(endpointKey, endpointMetric);
        }
        endpointMetric.requestCount++;
        // Update success rate
        var successCount = Math.round(endpointMetric.successRate * (endpointMetric.requestCount - 1) / 100);
        var newSuccessCount = success ? successCount + 1 : successCount;
        endpointMetric.successRate = (newSuccessCount / endpointMetric.requestCount) * 100;
        // Update average response time
        var totalTime = endpointMetric.averageResponseTime * (endpointMetric.requestCount - 1);
        endpointMetric.averageResponseTime = (totalTime + responseTime) / endpointMetric.requestCount;
        // Track errors
        if (!success && error) {
            var errorType = error.name || 'UnknownError';
            endpointMetric.errorTypes[errorType] = (endpointMetric.errorTypes[errorType] || 0) + 1;
            endpointMetric.lastError = {
                message: error.message,
                timestamp: new Date(),
                status: status
            };
            // Check for specific error types
            if (error.message.includes('Rate limit')) {
                this.metrics.rateLimitHits++;
            }
            if (error.message.includes('Circuit breaker')) {
                this.metrics.circuitBreakerTrips++;
            }
            if (error.message.includes('security policy')) {
                this.metrics.securityBlocks++;
            }
        }
        this.metrics.lastUpdated = new Date();
    };
    /**
     * Normalize URL for consistent tracking
     */
    ApiClientMonitor.prototype.normalizeUrl = function (url) {
        // Remove query parameters and normalize IDs
        return url
            .replace(/\?.*$/, '') // Remove query params
            .replace(/\/\d+/g, '/:id') // Replace numeric IDs
            .replace(/\/[a-f0-9-]{36}/g, '/:uuid'); // Replace UUIDs
    };
    /**
     * Collect and calculate current metrics
     */
    ApiClientMonitor.prototype.collectMetrics = function () {
        if (this.responseTimes.length === 0)
            return;
        // Calculate response time percentiles
        var sortedTimes = __spreadArray([], this.responseTimes, true).sort(function (a, b) { return a - b; });
        var p95Index = Math.floor(sortedTimes.length * 0.95);
        var p99Index = Math.floor(sortedTimes.length * 0.99);
        this.metrics.averageResponseTime = sortedTimes.reduce(function (sum, time) { return sum + time; }, 0) / sortedTimes.length;
        this.metrics.p95ResponseTime = sortedTimes[p95Index] || 0;
        this.metrics.p99ResponseTime = sortedTimes[p99Index] || 0;
        // Calculate cache hit rate (would need integration with cache service)
        // For now, estimate based on duplicate requests
        this.metrics.cacheHitRate = this.estimateCacheHitRate();
        this.metrics.lastUpdated = new Date();
    };
    /**
     * Estimate cache hit rate based on request patterns
     */
    ApiClientMonitor.prototype.estimateCacheHitRate = function () {
        // Simple estimation - in real implementation would integrate with cache
        var getRequests = Array.from(this.endpointMetrics.values())
            .filter(function (m) { return m.method === 'GET'; })
            .reduce(function (sum, m) { return sum + m.requestCount; }, 0);
        var totalRequests = this.metrics.requestCount;
        if (totalRequests === 0)
            return 0;
        // Rough estimate: assume 30% of GET requests could be cached
        return Math.min((getRequests * 0.3) / totalRequests * 100, 100);
    };
    /**
     * Establish performance baseline
     */
    ApiClientMonitor.prototype.establishBaseline = function () {
        var _a, _b;
        this.baseline = {
            version: '1.0.0', // Would get from package.json
            timestamp: new Date(),
            metrics: __assign({}, this.metrics),
            endpointMetrics: Array.from(this.endpointMetrics.values()),
            systemInfo: {
                userAgent: navigator.userAgent,
                connectionType: (_a = navigator.connection) === null || _a === void 0 ? void 0 : _a.effectiveType,
                memoryUsage: (_b = performance.memory) === null || _b === void 0 ? void 0 : _b.usedJSHeapSize
            }
        };
        console.log('📊 Performance baseline established:', this.baseline);
        // Save baseline to localStorage for persistence
        try {
            localStorage.setItem('api_client_baseline', JSON.stringify(this.baseline));
        }
        catch (error) {
            console.warn('Could not save baseline to localStorage:', error);
        }
    };
    /**
     * Get current metrics
     */
    ApiClientMonitor.prototype.getCurrentMetrics = function () {
        this.collectMetrics();
        return __assign({}, this.metrics);
    };
    /**
     * Get endpoint-specific metrics
     */
    ApiClientMonitor.prototype.getEndpointMetrics = function () {
        return Array.from(this.endpointMetrics.values());
    };
    /**
     * Get performance baseline
     */
    ApiClientMonitor.prototype.getBaseline = function () {
        return this.baseline;
    };
    /**
     * Compare current performance to baseline
     */
    ApiClientMonitor.prototype.compareToBaseline = function () {
        if (!this.baseline) {
            return {
                status: 'no_baseline',
                differences: { responseTime: 0, successRate: 0, errorRate: 0 },
                alerts: ['No baseline available for comparison']
            };
        }
        var current = this.getCurrentMetrics();
        var baseline = this.baseline.metrics;
        var responseTimeChange = baseline.averageResponseTime > 0
            ? ((current.averageResponseTime - baseline.averageResponseTime) / baseline.averageResponseTime) * 100
            : 0;
        var currentSuccessRate = current.requestCount > 0
            ? (current.successCount / current.requestCount) * 100
            : 100;
        var baselineSuccessRate = baseline.requestCount > 0
            ? (baseline.successCount / baseline.requestCount) * 100
            : 100;
        var successRateChange = currentSuccessRate - baselineSuccessRate;
        var currentErrorRate = current.requestCount > 0
            ? (current.errorCount / current.requestCount) * 100
            : 0;
        var baselineErrorRate = baseline.requestCount > 0
            ? (baseline.errorCount / baseline.requestCount) * 100
            : 0;
        var errorRateChange = currentErrorRate - baselineErrorRate;
        var alerts = [];
        // Performance regression alerts
        if (responseTimeChange > 50) {
            alerts.push("Response time increased by ".concat(responseTimeChange.toFixed(1), "%"));
        }
        if (successRateChange < -5) {
            alerts.push("Success rate decreased by ".concat(Math.abs(successRateChange).toFixed(1), "%"));
        }
        if (errorRateChange > 5) {
            alerts.push("Error rate increased by ".concat(errorRateChange.toFixed(1), "%"));
        }
        if (current.circuitBreakerTrips > baseline.circuitBreakerTrips + 5) {
            alerts.push("Circuit breaker trips increased significantly");
        }
        // Determine overall status
        var status = 'similar';
        if (responseTimeChange > 25 || successRateChange < -3 || errorRateChange > 3) {
            status = 'worse';
        }
        else if (responseTimeChange < -10 && successRateChange > 1 && errorRateChange < 1) {
            status = 'better';
        }
        return {
            status: status,
            differences: {
                responseTime: responseTimeChange,
                successRate: successRateChange,
                errorRate: errorRateChange
            },
            alerts: alerts
        };
    };
    /**
     * Generate monitoring report
     */
    ApiClientMonitor.prototype.generateReport = function () {
        var metrics = this.getCurrentMetrics();
        var endpointMetrics = this.getEndpointMetrics();
        var comparison = this.compareToBaseline();
        var successRate = metrics.requestCount > 0
            ? ((metrics.successCount / metrics.requestCount) * 100).toFixed(1)
            : '100';
        var summary = "API Client Health: ".concat(metrics.requestCount, " requests, ").concat(successRate, "% success rate, ").concat(metrics.averageResponseTime.toFixed(0), "ms avg response time");
        var recommendations = [];
        // Generate recommendations based on metrics
        if (metrics.averageResponseTime > 2000) {
            recommendations.push('Consider optimizing slow endpoints or increasing cache TTL');
        }
        if (metrics.errorCount / metrics.requestCount > 0.05) {
            recommendations.push('High error rate detected - investigate failing endpoints');
        }
        if (metrics.circuitBreakerTrips > 0) {
            recommendations.push('Circuit breaker has triggered - check service health');
        }
        if (metrics.rateLimitHits > 0) {
            recommendations.push('Rate limiting active - consider request throttling');
        }
        if (metrics.cacheHitRate < 20) {
            recommendations.push('Low cache hit rate - review caching strategy');
        }
        return {
            summary: summary,
            metrics: metrics,
            endpointMetrics: endpointMetrics,
            baseline: this.baseline,
            comparison: comparison,
            recommendations: recommendations
        };
    };
    /**
     * Reset metrics (useful for testing)
     */
    ApiClientMonitor.prototype.resetMetrics = function () {
        this.metrics = this.initializeMetrics();
        this.endpointMetrics.clear();
        this.responseTimes = [];
        console.log('📊 API Client metrics reset');
    };
    return ApiClientMonitor;
}());
// Export singleton instance
exports.apiMonitor = new ApiClientMonitor();
// Export monitoring utilities
exports.monitoringUtils = {
    /**
     * Get quick health check
     */
    getHealthCheck: function () {
        var metrics = exports.apiMonitor.getCurrentMetrics();
        var comparison = exports.apiMonitor.compareToBaseline();
        if (comparison.alerts.length === 0 && comparison.status !== 'worse') {
            return { status: 'healthy', message: 'API client performing normally' };
        }
        else if (comparison.status === 'worse' || comparison.alerts.length <= 2) {
            return { status: 'degraded', message: "Performance issues detected: ".concat(comparison.alerts.join(', ')) };
        }
        else {
            return { status: 'critical', message: "Critical performance degradation: ".concat(comparison.alerts.join(', ')) };
        }
    },
    /**
     * Log performance summary to console
     */
    logPerformanceSummary: function () {
        var report = exports.apiMonitor.generateReport();
        console.group('🔍 API Client Performance Summary');
        console.log(report.summary);
        console.log('📊 Metrics:', report.metrics);
        console.log('🎯 Top Endpoints:', report.endpointMetrics.slice(0, 5));
        if (report.comparison.alerts.length > 0) {
            console.warn('⚠️ Alerts:', report.comparison.alerts);
        }
        if (report.recommendations.length > 0) {
            console.info('💡 Recommendations:', report.recommendations);
        }
        console.groupEnd();
    },
    /**
     * Start automated monitoring reports
     */
    startAutomatedReporting: function (intervalMinutes) {
        if (intervalMinutes === void 0) { intervalMinutes = 15; }
        setInterval(function () {
            exports.monitoringUtils.logPerformanceSummary();
        }, intervalMinutes * 60 * 1000);
        console.log("\uD83D\uDD04 Automated reporting started (every ".concat(intervalMinutes, " minutes)"));
    }
};
