"use strict";
/**
 * Health Monitoring Hooks
 * React hooks for monitoring system health and performance
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
exports.useApiResponseTimeMonitoring = exports.useConnectionMonitoring = exports.usePerformanceMetrics = exports.useEndpointHealth = exports.useSystemHealth = void 0;
var react_1 = require("react");
var HealthCheckService_1 = require("../services/HealthCheckService");
/**
 * Hook for monitoring overall system health
 */
var useSystemHealth = function (autoStart) {
    if (autoStart === void 0) { autoStart = true; }
    var _a = (0, react_1.useState)(null), health = _a[0], setHealth = _a[1];
    var _b = (0, react_1.useState)(false), isMonitoring = _b[0], setIsMonitoring = _b[1];
    var callbackId = (0, react_1.useRef)();
    (0, react_1.useEffect)(function () {
        if (autoStart) {
            startMonitoring();
        }
        return function () {
            stopMonitoring();
        };
    }, [autoStart]);
    var startMonitoring = (0, react_1.useCallback)(function () {
        if (isMonitoring)
            return;
        callbackId.current = "health_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        HealthCheckService_1.healthCheckService.onHealthUpdate(callbackId.current, function (newHealth) {
            setHealth(newHealth);
        });
        HealthCheckService_1.healthCheckService.startMonitoring(30000); // Check every 30 seconds
        setIsMonitoring(true);
        // Get initial health status
        var currentHealth = HealthCheckService_1.healthCheckService.getCurrentHealth();
        if (currentHealth) {
            setHealth(currentHealth);
        }
    }, [isMonitoring]);
    var stopMonitoring = (0, react_1.useCallback)(function () {
        if (!isMonitoring)
            return;
        if (callbackId.current) {
            HealthCheckService_1.healthCheckService.offHealthUpdate(callbackId.current);
        }
        HealthCheckService_1.healthCheckService.stopMonitoring();
        setIsMonitoring(false);
    }, [isMonitoring]);
    var performHealthCheck = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var newHealth;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, HealthCheckService_1.healthCheckService.performHealthChecks()];
                case 1:
                    newHealth = _a.sent();
                    setHealth(newHealth);
                    return [2 /*return*/, newHealth];
            }
        });
    }); }, []);
    return {
        health: health,
        isMonitoring: isMonitoring,
        startMonitoring: startMonitoring,
        stopMonitoring: stopMonitoring,
        performHealthCheck: performHealthCheck
    };
};
exports.useSystemHealth = useSystemHealth;
/**
 * Hook for monitoring specific endpoint health
 */
var useEndpointHealth = function (endpointName) {
    var _a = (0, react_1.useState)([]), healthHistory = _a[0], setHealthHistory = _a[1];
    var _b = (0, react_1.useState)(null), currentHealth = _b[0], setCurrentHealth = _b[1];
    var _c = (0, react_1.useState)(false), isLoading = _c[0], setIsLoading = _c[1];
    var refreshHealth = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var history_1;
        return __generator(this, function (_a) {
            setIsLoading(true);
            try {
                history_1 = HealthCheckService_1.healthCheckService.getHealthHistory(endpointName, 50);
                setHealthHistory(history_1);
                if (history_1.length > 0) {
                    setCurrentHealth(history_1[history_1.length - 1]);
                }
            }
            catch (error) {
                console.error('Failed to refresh endpoint health:', error);
            }
            finally {
                setIsLoading(false);
            }
            return [2 /*return*/];
        });
    }); }, [endpointName]);
    (0, react_1.useEffect)(function () {
        refreshHealth();
        // Set up interval to refresh health data
        var interval = setInterval(refreshHealth, 30000);
        return function () { return clearInterval(interval); };
    }, [refreshHealth]);
    var checkHealth = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var endpoints, endpoint, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    endpoints = HealthCheckService_1.healthCheckService['criticalEndpoints'] || [];
                    endpoint = endpoints.find(function (e) { return e.name === endpointName; });
                    if (!endpoint) return [3 /*break*/, 4];
                    return [4 /*yield*/, HealthCheckService_1.healthCheckService.checkEndpointHealth(endpointName, endpoint.url, endpoint.timeout)];
                case 2:
                    result = _a.sent();
                    setCurrentHealth(result);
                    return [4 /*yield*/, refreshHealth()];
                case 3:
                    _a.sent();
                    return [2 /*return*/, result];
                case 4: return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    console.error('Failed to check endpoint health:', error_1);
                    return [3 /*break*/, 7];
                case 6:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [endpointName, refreshHealth]);
    return {
        currentHealth: currentHealth,
        healthHistory: healthHistory,
        isLoading: isLoading,
        refreshHealth: refreshHealth,
        checkHealth: checkHealth
    };
};
exports.useEndpointHealth = useEndpointHealth;
/**
 * Hook for monitoring performance metrics
 */
var usePerformanceMetrics = function () {
    var _a = (0, react_1.useState)(new Map()), metrics = _a[0], setMetrics = _a[1];
    var _b = (0, react_1.useState)(false), isLoading = _b[0], setIsLoading = _b[1];
    var refreshMetrics = (0, react_1.useCallback)(function () {
        setIsLoading(true);
        try {
            var currentMetrics = HealthCheckService_1.healthCheckService.getPerformanceMetrics();
            setMetrics(currentMetrics);
        }
        catch (error) {
            console.error('Failed to refresh performance metrics:', error);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    (0, react_1.useEffect)(function () {
        refreshMetrics();
        // Refresh metrics every minute
        var interval = setInterval(refreshMetrics, 60000);
        return function () { return clearInterval(interval); };
    }, [refreshMetrics]);
    var getMetricsForEndpoint = (0, react_1.useCallback)(function (endpointName) {
        return metrics.get(endpointName) || null;
    }, [metrics]);
    var getAllMetrics = (0, react_1.useCallback)(function () {
        return Array.from(metrics.values());
    }, [metrics]);
    return {
        metrics: metrics,
        isLoading: isLoading,
        refreshMetrics: refreshMetrics,
        getMetricsForEndpoint: getMetricsForEndpoint,
        getAllMetrics: getAllMetrics
    };
};
exports.usePerformanceMetrics = usePerformanceMetrics;
/**
 * Hook for connection monitoring
 */
var useConnectionMonitoring = function () {
    var _a = (0, react_1.useState)(navigator.onLine), isOnline = _a[0], setIsOnline = _a[1];
    var _b = (0, react_1.useState)('good'), connectionQuality = _b[0], setConnectionQuality = _b[1];
    var _c = (0, react_1.useState)(null), lastOnlineTime = _c[0], setLastOnlineTime = _c[1];
    (0, react_1.useEffect)(function () {
        var handleOnline = function () {
            setIsOnline(true);
            setConnectionQuality('good');
            setLastOnlineTime(new Date());
        };
        var handleOffline = function () {
            setIsOnline(false);
            setConnectionQuality('offline');
        };
        // Test connection quality
        var testConnectionQuality = function () { return __awaiter(void 0, void 0, void 0, function () {
            var startTime, response, responseTime, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!navigator.onLine)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        startTime = Date.now();
                        return [4 /*yield*/, fetch('/api/health/ping', {
                                method: 'HEAD',
                                cache: 'no-cache'
                            })];
                    case 2:
                        response = _a.sent();
                        responseTime = Date.now() - startTime;
                        if (response.ok) {
                            if (responseTime < 500) {
                                setConnectionQuality('good');
                            }
                            else if (responseTime < 2000) {
                                setConnectionQuality('poor');
                            }
                            else {
                                setConnectionQuality('poor');
                            }
                        }
                        else {
                            setConnectionQuality('poor');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        setConnectionQuality('poor');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        // Test connection quality every 30 seconds
        var qualityInterval = setInterval(testConnectionQuality, 30000);
        // Initial quality test
        testConnectionQuality();
        return function () {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(qualityInterval);
        };
    }, []);
    return {
        isOnline: isOnline,
        connectionQuality: connectionQuality,
        lastOnlineTime: lastOnlineTime
    };
};
exports.useConnectionMonitoring = useConnectionMonitoring;
/**
 * Hook for API response time monitoring
 */
var useApiResponseTimeMonitoring = function () {
    var _a = (0, react_1.useState)(new Map()), responseTimes = _a[0], setResponseTimes = _a[1];
    var recordResponseTime = (0, react_1.useCallback)(function (endpoint, responseTime) {
        setResponseTimes(function (prev) {
            var newMap = new Map(prev);
            var times = newMap.get(endpoint) || [];
            // Keep only last 50 response times
            var updatedTimes = __spreadArray(__spreadArray([], times, true), [responseTime], false).slice(-50);
            newMap.set(endpoint, updatedTimes);
            return newMap;
        });
    }, []);
    var getAverageResponseTime = (0, react_1.useCallback)(function (endpoint) {
        var times = responseTimes.get(endpoint) || [];
        if (times.length === 0)
            return 0;
        return times.reduce(function (sum, time) { return sum + time; }, 0) / times.length;
    }, [responseTimes]);
    var getResponseTimePercentile = (0, react_1.useCallback)(function (endpoint, percentile) {
        var times = responseTimes.get(endpoint) || [];
        if (times.length === 0)
            return 0;
        var sorted = __spreadArray([], times, true).sort(function (a, b) { return a - b; });
        var index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }, [responseTimes]);
    var clearResponseTimes = (0, react_1.useCallback)(function (endpoint) {
        if (endpoint) {
            setResponseTimes(function (prev) {
                var newMap = new Map(prev);
                newMap.delete(endpoint);
                return newMap;
            });
        }
        else {
            setResponseTimes(new Map());
        }
    }, []);
    return {
        responseTimes: responseTimes,
        recordResponseTime: recordResponseTime,
        getAverageResponseTime: getAverageResponseTime,
        getResponseTimePercentile: getResponseTimePercentile,
        clearResponseTimes: clearResponseTimes
    };
};
exports.useApiResponseTimeMonitoring = useApiResponseTimeMonitoring;
