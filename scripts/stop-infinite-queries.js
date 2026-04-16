#!/usr/bin/env tsx
"use strict";
/**
 * Advanced script to detect and prevent infinite API queries
 * Implements multiple detection strategies and adaptive thresholds
 * Optimized for performance, memory efficiency, and maintainability
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedInfiniteQueryDetector = exports.queryDetector = void 0;
var crypto_1 = require("crypto");
var perf_hooks_1 = require("perf_hooks");
// Simple logger to handle console statements in production
/* eslint-disable no-console */
var log = process.env.NODE_ENV === 'production' ? function () { } : console.log;
var warn = process.env.NODE_ENV === 'production' ? function () { } : console.warn;
var error = process.env.NODE_ENV === 'production' ? function () { } : console.error;
var AdvancedInfiniteQueryDetector = /** @class */ (function () {
    function AdvancedInfiniteQueryDetector() {
        // Using private readonly for immutable references
        this.queryMetrics = new Map();
        this.circuitBreakers = new Map();
        // Configurable thresholds moved to readonly property for better encapsulation
        this.thresholds = {
            rapidFire: {
                maxCalls: 10, // Maximum calls in time window
                timeWindow: 5000, // 5 seconds
                penalty: 30000 // 30 second circuit breaker
            },
            burstPattern: {
                maxBursts: 3, // Maximum burst sequences
                burstSize: 5, // Calls that constitute a burst
                burstWindow: 1000, // 1 second for burst detection
                penalty: 60000 // 1 minute circuit breaker
            },
            sustainedLoad: {
                maxCallsPerMinute: 100, // Reasonable sustained rate
                evaluationWindow: 60000, // 1 minute evaluation
                penalty: 120000 // 2 minute circuit breaker
            }
        }; // Using 'as const' for immutability
        this.monitoringActive = true;
        log('🔍 Advanced infinite query detection initialized');
        log('📋 Detection strategies: Rapid Fire, Burst Pattern, Sustained Load');
        this.startMonitoring();
    }
    /**
     * Generates a consistent hash for query parameters with improved error handling
     * This prevents memory issues with large parameter objects and handles edge cases
     */
    AdvancedInfiniteQueryDetector.prototype.generateParamHash = function (params) {
        try {
            // Handle null, undefined, or primitive types more efficiently
            if (params === null || params === undefined) {
                return '00000000'; // Consistent hash for empty params
            }
            if (typeof params !== 'object') {
                // NOTE: sha256 truncated to 8 chars is NOT for cryptographic security,
                //       only for lightweight, collision-resistant cache keys.
                return (0, crypto_1.createHash)('sha256')
                    .update(String(params))
                    .digest('hex')
                    .substring(0, AdvancedInfiniteQueryDetector.HASH_LENGTH);
            }
            // More robust object handling with circular reference protection
            var sortedParams = this.createSortedParamsObject(params);
            // NOTE: sha256 truncated to 8 chars is NOT for cryptographic security,
            //       only for lightweight, collision-resistant cache keys.
            return (0, crypto_1.createHash)('sha256')
                .update(JSON.stringify(sortedParams))
                .digest('hex')
                .substring(0, AdvancedInfiniteQueryDetector.HASH_LENGTH);
        }
        catch (error) {
            // Fallback hash generation for problematic objects
            console.warn('Parameter hashing failed, using fallback:', error);
            // NOTE: sha256 truncated to 8 chars is NOT for cryptographic security,
            //       only for lightweight, collision-resistant cache keys.
            return (0, crypto_1.createHash)('sha256')
                .update(String(params))
                .digest('hex')
                .substring(0, AdvancedInfiniteQueryDetector.HASH_LENGTH);
        }
    };
    /**
     * Creates a sorted parameters object while handling circular references
     * This helper method improves code organization and error handling
     */
    AdvancedInfiniteQueryDetector.prototype.createSortedParamsObject = function (params) {
        var seen = new WeakSet(); // Track circular references
        var sortObject = function (obj) {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            if (seen.has(obj)) {
                return '[Circular Reference]';
            }
            seen.add(obj);
            if (Array.isArray(obj)) {
                return obj.map(sortObject);
            }
            var sortedObj = {};
            Object.keys(obj)
                .sort(function (a, b) { return a.localeCompare(b, undefined, { sensitivity: 'base' }); })
                .forEach(function (key) {
                /* eslint-disable security/detect-object-injection -- safe, keys are sorted literals */
                sortedObj[key] = sortObject(obj[key]);
                /* eslint-enable security/detect-object-injection */
            });
            return sortedObj;
        };
        return sortObject(params);
    };
    /**
     * Creates a unique identifier for tracking queries with improved validation
     */
    AdvancedInfiniteQueryDetector.prototype.generateQueryKey = function (endpoint, params) {
        // Input validation for better error handling
        if (typeof endpoint !== 'string' || endpoint.trim().length === 0) {
            throw new Error('Endpoint must be a non-empty string');
        }
        var cleanEndpoint = endpoint.trim();
        var paramHash = this.generateParamHash(params);
        return "".concat(cleanEndpoint, ":").concat(paramHash);
    };
    /**
     * Detects rapid-fire queries with improved readability and performance
     */
    AdvancedInfiniteQueryDetector.prototype.detectRapidFire = function (metrics) {
        var timeSpan = metrics.lastCallTime - metrics.firstCallTime;
        var _a = this.thresholds.rapidFire, maxCalls = _a.maxCalls, timeWindow = _a.timeWindow;
        // Early return for better performance
        if (metrics.callCount < maxCalls) {
            return null;
        }
        return timeSpan <= timeWindow ? 'rapid_fire' : null;
    };
    /**
     * Detects burst patterns with enhanced logic and better performance
     */
    AdvancedInfiniteQueryDetector.prototype.detectBurstPattern = function (metrics) {
        var _a = this.thresholds.burstPattern, burstSize = _a.burstSize, burstWindow = _a.burstWindow, maxBursts = _a.maxBursts;
        // Early return if we don't have enough calls for a burst
        if (metrics.callCount < burstSize) {
            return null;
        }
        var now = perf_hooks_1.performance.now();
        var recentTimeSpan = now - metrics.firstCallTime;
        if (recentTimeSpan <= burstWindow) {
            // We're in a rapid calling period - increment burst counter
            metrics.consecutiveRapidCalls++;
            if (metrics.consecutiveRapidCalls >= maxBursts) {
                return 'burst_pattern';
            }
        }
        else {
            // Reset burst counter if we're outside the burst window
            metrics.consecutiveRapidCalls = 0;
        }
        return null;
    };
    /**
     * Detects sustained high load with improved calculations
     */
    AdvancedInfiniteQueryDetector.prototype.detectSustainedLoad = function (metrics) {
        var _a = this.thresholds.sustainedLoad, maxCallsPerMinute = _a.maxCallsPerMinute, evaluationWindow = _a.evaluationWindow;
        var timeSpan = metrics.lastCallTime - metrics.firstCallTime;
        // Need sufficient time span for meaningful evaluation
        if (timeSpan < evaluationWindow) {
            return null;
        }
        // Calculate calls per minute more accurately
        var callsPerMinute = (metrics.callCount / timeSpan) * 60000;
        return callsPerMinute > maxCallsPerMinute ? 'sustained_load' : null;
    };
    /**
     * Creates appropriate error messages for different detection strategies
     * This helper improves code organization and makes messages more consistent
     */
    AdvancedInfiniteQueryDetector.prototype.createDetectionMessage = function (strategy, metrics) {
        switch (strategy) {
            case 'rapid_fire': {
                var timeSpan = (metrics.lastCallTime - metrics.firstCallTime).toFixed(0);
                return "\uD83D\uDD25 Rapid-fire detected: ".concat(metrics.callCount, " calls in ").concat(timeSpan, "ms");
            }
            case 'burst_pattern': {
                return "\uD83D\uDCA5 Burst pattern detected: ".concat(metrics.consecutiveRapidCalls, " consecutive bursts");
            }
            case 'sustained_load': {
                var rate = ((metrics.callCount / (metrics.lastCallTime - metrics.firstCallTime)) * 60000).toFixed(1);
                return "\u26A1 Sustained overload: ".concat(rate, " calls/minute");
            }
            default: {
                // TypeScript exhaustiveness check - this should never happen
                var _exhaustiveCheck = strategy;
                return "Unknown detection strategy: ".concat(_exhaustiveCheck);
            }
        }
    };
    /**
     * Applies the appropriate circuit breaker with improved error handling and logging
     */
    AdvancedInfiniteQueryDetector.prototype.activateCircuitBreaker = function (queryKey, strategy, metrics) {
        var _this = this;
        var _a;
        var now = perf_hooks_1.performance.now();
        // Get penalty duration based on strategy
        var penaltyMap = {
            rapid_fire: this.thresholds.rapidFire.penalty,
            burst_pattern: this.thresholds.burstPattern.penalty,
            sustained_load: this.thresholds.sustainedLoad.penalty
        };
        var penalty = penaltyMap[strategy];
        var message = this.createDetectionMessage(strategy, metrics);
        // Create or update circuit breaker state
        var existingState = this.circuitBreakers.get(queryKey);
        var circuitState = {
            isOpen: true,
            openedAt: now,
            failureCount: ((_a = existingState === null || existingState === void 0 ? void 0 : existingState.failureCount) !== null && _a !== void 0 ? _a : 0) + 1,
            lastFailureTime: now
        };
        this.circuitBreakers.set(queryKey, circuitState);
        // Enhanced logging with more context
        console.warn("\uD83D\uDEA8 Circuit breaker activated for: ".concat(metrics.endpoint));
        console.warn("   Strategy: ".concat(strategy.replace('_', ' ').toUpperCase()));
        console.warn("   ".concat(message));
        console.warn("   Penalty duration: ".concat((penalty / 1000).toFixed(0), " seconds"));
        console.warn("   Failure count: ".concat(circuitState.failureCount));
        // Auto-reset after penalty period with improved cleanup
        var timeoutId = setTimeout(function () {
            var current = _this.circuitBreakers.get(queryKey);
            if ((current === null || current === void 0 ? void 0 : current.isOpen) && current.openedAt === circuitState.openedAt) {
                current.isOpen = false;
                console.log("\u2705 Circuit breaker reset for: ".concat(metrics.endpoint));
            }
        }, penalty);
        // Ensure timeout is cleaned up to prevent memory leaks
        timeoutId.unref();
    };
    /**
     * Main method to track and evaluate queries with enhanced error handling
     */
    AdvancedInfiniteQueryDetector.prototype.trackQuery = function (endpoint, params) {
        if (params === void 0) { params = {}; }
        try {
            if (!this.monitoringActive) {
                return true;
            }
            var queryKey = this.generateQueryKey(endpoint, params);
            var now = perf_hooks_1.performance.now();
            // Check circuit breaker status first
            var circuitState = this.circuitBreakers.get(queryKey);
            if (circuitState === null || circuitState === void 0 ? void 0 : circuitState.isOpen) {
                console.warn("\u26D4 Query blocked by circuit breaker: ".concat(endpoint));
                return false;
            }
            // Get or initialize metrics with better initialization
            var metrics = this.queryMetrics.get(queryKey);
            if (!metrics) {
                metrics = this.createInitialMetrics(endpoint, params, now);
                this.queryMetrics.set(queryKey, metrics);
            }
            // Update metrics with improved calculations
            this.updateMetrics(metrics, now);
            // Apply detection strategies with early termination
            var detectionStrategies = [
                this.detectRapidFire.bind(this),
                this.detectBurstPattern.bind(this),
                this.detectSustainedLoad.bind(this)
            ];
            for (var _i = 0, detectionStrategies_1 = detectionStrategies; _i < detectionStrategies_1.length; _i++) {
                var detectStrategy = detectionStrategies_1[_i];
                var detectedStrategy = detectStrategy(metrics);
                if (detectedStrategy) {
                    this.activateCircuitBreaker(queryKey, detectedStrategy, metrics);
                    metrics.blocked = true;
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            // Graceful error handling - log error but don't block legitimate requests
            console.error('Error in query tracking:', error);
            return true; // Fail open for better availability
        }
    };
    /**
     * Helper method to create initial metrics with better organization
     */
    AdvancedInfiniteQueryDetector.prototype.createInitialMetrics = function (endpoint, params, now) {
        return {
            endpoint: endpoint,
            paramHash: this.generateParamHash(params),
            callCount: 0,
            firstCallTime: now,
            lastCallTime: now,
            averageInterval: 0,
            consecutiveRapidCalls: 0,
            blocked: false
        };
    };
    /**
     * Helper method to update metrics with improved calculations
     */
    AdvancedInfiniteQueryDetector.prototype.updateMetrics = function (metrics, now) {
        metrics.callCount++;
        metrics.lastCallTime = now;
        // Calculate average interval more efficiently
        if (metrics.callCount > 1) {
            var totalTime = now - metrics.firstCallTime;
            metrics.averageInterval = totalTime / (metrics.callCount - 1);
        }
    };
    /**
     * Starts background monitoring with improved error handling
     */
    AdvancedInfiniteQueryDetector.prototype.startMonitoring = function () {
        var _this = this;
        try {
            // Clean up stale metrics periodically
            this.cleanupInterval = setInterval(function () {
                try {
                    _this.cleanupStaleMetrics();
                }
                catch (error) {
                    console.error('Error during cleanup:', error);
                }
            }, AdvancedInfiniteQueryDetector.CLEANUP_INTERVAL);
            // Log statistics periodically
            this.statsInterval = setInterval(function () {
                try {
                    _this.logStatistics();
                }
                catch (error) {
                    console.error('Error during statistics logging:', error);
                }
            }, AdvancedInfiniteQueryDetector.STATS_INTERVAL);
            // Prevent intervals from keeping process alive unnecessarily
            this.cleanupInterval.unref();
            this.statsInterval.unref();
        }
        catch (error) {
            console.error('Failed to start monitoring:', error);
        }
    };
    /**
     * Removes old metrics with improved memory management
     */
    AdvancedInfiniteQueryDetector.prototype.cleanupStaleMetrics = function () {
        var now = perf_hooks_1.performance.now();
        var maxAge = this.thresholds.sustainedLoad.evaluationWindow *
            AdvancedInfiniteQueryDetector.MEMORY_CLEANUP_MULTIPLIER;
        var cleanedQueryMetrics = 0;
        var cleanedCircuitBreakers = 0;
        // Clean up stale query metrics
        for (var _i = 0, _a = this.queryMetrics.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], metrics = _b[1];
            if (now - metrics.lastCallTime > maxAge) {
                this.queryMetrics.delete(key);
                cleanedQueryMetrics++;
            }
        }
        // Clean up closed circuit breakers that are old
        for (var _c = 0, _d = this.circuitBreakers.entries(); _c < _d.length; _c++) {
            var _e = _d[_c], key = _e[0], state = _e[1];
            if (!state.isOpen && now - state.openedAt > maxAge) {
                this.circuitBreakers.delete(key);
                cleanedCircuitBreakers++;
            }
        }
        var totalCleaned = cleanedQueryMetrics + cleanedCircuitBreakers;
        if (totalCleaned > 0) {
            console.log("\uD83E\uDDF9 Cleaned up ".concat(cleanedQueryMetrics, " query metrics and ").concat(cleanedCircuitBreakers, " circuit breakers"));
        }
    };
    /**
     * Provides detailed monitoring statistics with improved formatting
     */
    AdvancedInfiniteQueryDetector.prototype.logStatistics = function () {
        var activeQueries = this.queryMetrics.size;
        var openCircuitBreakers = Array.from(this.circuitBreakers.values())
            .filter(function (state) { return state.isOpen; }).length;
        var totalCircuitBreakers = this.circuitBreakers.size;
        // Only log if there's something interesting to report
        if (activeQueries === 0 && openCircuitBreakers === 0) {
            return;
        }
        console.log("\uD83D\uDCCA Query Monitor Statistics:");
        console.log("   Active tracked queries: ".concat(activeQueries));
        console.log("   Open circuit breakers: ".concat(openCircuitBreakers, "/").concat(totalCircuitBreakers));
        // Show most active endpoints with better formatting
        this.logTopQueries();
        this.logBlockedQueries();
    };
    /**
     * Helper method to log top queries with improved organization
     */
    AdvancedInfiniteQueryDetector.prototype.logTopQueries = function () {
        var topQueries = Array.from(this.queryMetrics.entries())
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b.callCount - a.callCount;
        })
            .slice(0, 3);
        if (topQueries.length > 0) {
            console.log("   Most active endpoints:");
            topQueries.forEach(function (_a) {
                var metrics = _a[1];
                var rate = metrics.averageInterval > 0
                    ? (60000 / metrics.averageInterval).toFixed(1)
                    : 'N/A';
                console.log("     ".concat(metrics.endpoint, ": ").concat(metrics.callCount, " calls (").concat(rate, "/min avg)"));
            });
        }
    };
    /**
     * Helper method to log blocked queries
     */
    AdvancedInfiniteQueryDetector.prototype.logBlockedQueries = function () {
        var blockedQueries = Array.from(this.queryMetrics.values())
            .filter(function (metrics) { return metrics.blocked; });
        if (blockedQueries.length > 0) {
            console.log("   Recently blocked: ".concat(blockedQueries.length, " query types"));
        }
    };
    /**
     * Public API methods for external control with improved type safety
     */
    AdvancedInfiniteQueryDetector.prototype.getStatistics = function () {
        var openCircuitBreakers = Array.from(this.circuitBreakers.values())
            .filter(function (state) { return state.isOpen; }).length;
        return {
            activeQueries: this.queryMetrics.size,
            circuitBreakers: this.circuitBreakers.size,
            openCircuitBreakers: openCircuitBreakers,
            queryMetrics: Array.from(this.queryMetrics.entries()).map(function (_a) {
                var metrics = _a[1];
                return ({
                    endpoint: metrics.endpoint,
                    calls: metrics.callCount,
                    avgInterval: metrics.averageInterval,
                    blocked: metrics.blocked
                });
            })
        };
    };
    AdvancedInfiniteQueryDetector.prototype.resetCircuitBreaker = function (endpoint, params) {
        if (params === void 0) { params = {}; }
        try {
            var queryKey = this.generateQueryKey(endpoint, params);
            var state = this.circuitBreakers.get(queryKey);
            if (state === null || state === void 0 ? void 0 : state.isOpen) {
                state.isOpen = false;
                console.log("\uD83D\uDD04 Manually reset circuit breaker for: ".concat(endpoint));
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error resetting circuit breaker:', error);
            return false;
        }
    };
    AdvancedInfiniteQueryDetector.prototype.resetAllCircuitBreakers = function () {
        var resetCount = 0;
        for (var _i = 0, _a = this.circuitBreakers.values(); _i < _a.length; _i++) {
            var state = _a[_i];
            if (state.isOpen) {
                state.isOpen = false;
                resetCount++;
            }
        }
        if (resetCount > 0) {
            console.log("\uD83D\uDD04 Reset ".concat(resetCount, " circuit breakers"));
        }
        return resetCount;
    };
    AdvancedInfiniteQueryDetector.prototype.stop = function () {
        this.monitoringActive = false;
        // Clean up intervals with null checks
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = undefined;
        }
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = undefined;
        }
        console.log('🛑 Query monitoring stopped');
    };
    /**
     * New method for graceful shutdown with resource cleanup
     */
    AdvancedInfiniteQueryDetector.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🔄 Initiating graceful shutdown...');
                this.stop();
                // Clear all data structures
                this.queryMetrics.clear();
                this.circuitBreakers.clear();
                console.log('✅ Shutdown complete');
                return [2 /*return*/];
            });
        });
    };
    // Constants for better maintainability
    AdvancedInfiniteQueryDetector.CLEANUP_INTERVAL = 120000; // 2 minutes
    AdvancedInfiniteQueryDetector.STATS_INTERVAL = 30000; // 30 seconds
    AdvancedInfiniteQueryDetector.HASH_LENGTH = 8;
    AdvancedInfiniteQueryDetector.MEMORY_CLEANUP_MULTIPLIER = 2;
    return AdvancedInfiniteQueryDetector;
}());
exports.AdvancedInfiniteQueryDetector = AdvancedInfiniteQueryDetector;
// Create and export global instance
var queryDetector = new AdvancedInfiniteQueryDetector();
exports.queryDetector = queryDetector;
// CLI interface and testing with improved error handling
if (import.meta.url === "file://".concat(process.argv[1])) {
    console.log('🛡️  Advanced Infinite Query Detector started');
    console.log('   Multi-strategy detection: Rapid Fire | Burst Pattern | Sustained Load');
    console.log('   Press Ctrl+C to stop\n');
    // Enhanced graceful shutdown with proper cleanup
    var shutdown = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n👋 Shutting down detector...');
                    return [4 /*yield*/, queryDetector.shutdown()];
                case 1:
                    _a.sent();
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    }); };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    // Enhanced testing suite with better error handling
    var runTests = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    console.log('🧪 Running comprehensive test suite...\n');
                    return [4 /*yield*/, runNormalUsageTest_1()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, runRapidFireTest_1()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, runBurstPatternTest_1()];
                case 3:
                    _a.sent();
                    // Show final statistics after a brief delay
                    setTimeout(function () {
                        console.log('\n📊 Final Statistics:');
                        var stats = queryDetector.getStatistics();
                        console.log(JSON.stringify(stats, null, 2));
                    }, 2000);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Test suite failed:', error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var runNormalUsageTest_1 = function () { return __awaiter(void 0, void 0, void 0, function () {
        var i, allowed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('📋 Test 1: Normal API usage');
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 5)) return [3 /*break*/, 4];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    _a.sent();
                    allowed = queryDetector.trackQuery('/api/properties', { page: i });
                    console.log("  Normal query ".concat(i + 1, ": ").concat(allowed ? '✅ Allowed' : '❌ Blocked'));
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var runRapidFireTest_1 = function () { return __awaiter(void 0, void 0, void 0, function () {
        var i, allowed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📋 Test 2: Rapid-fire detection');
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < 12)) return [3 /*break*/, 4];
                    allowed = queryDetector.trackQuery('/api/search', {
                        term: 'apartments',
                        location: 'Nairobi'
                    });
                    console.log("  Rapid query ".concat(i + 1, ": ").concat(allowed ? '✅ Allowed' : '❌ Blocked'));
                    if (!(i < 8)) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var runBurstPatternTest_1 = function () { return __awaiter(void 0, void 0, void 0, function () {
        var burst, i, allowed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('\n📋 Test 3: Burst pattern detection');
                    burst = 0;
                    _a.label = 1;
                case 1:
                    if (!(burst < 4)) return [3 /*break*/, 4];
                    console.log("  Burst ".concat(burst + 1, ":"));
                    for (i = 0; i < 6; i++) {
                        allowed = queryDetector.trackQuery('/api/similar', { propertyId: 123 });
                        console.log("    Call ".concat(i + 1, ": ").concat(allowed ? '✅ Allowed' : '❌ Blocked'));
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    burst++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Start tests after initialization
    setTimeout(runTests, 1000);
}
