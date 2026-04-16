"use strict";
/**
 * Health Check Service
 * Monitors API endpoints, connection status, and system health
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
exports.healthCheckService = void 0;
var HealthCheckService = /** @class */ (function () {
    function HealthCheckService() {
        this.healthResults = new Map();
        this.performanceMetrics = new Map();
        this.healthCheckInterval = null;
        this.startTime = new Date();
        this.callbacks = new Map();
        // Critical endpoints to monitor
        this.criticalEndpoints = [
            { name: 'auth', url: '/api/auth/status', timeout: 5000 },
            { name: 'users', url: '/api/users/health', timeout: 5000 },
            { name: 'properties', url: '/api/properties/health', timeout: 5000 },
            { name: 'search', url: '/api/search/health', timeout: 5000 },
            { name: 'messaging', url: '/api/messaging/health', timeout: 5000 },
            { name: 'notifications', url: '/api/notifications/health', timeout: 5000 }
        ];
    }
    HealthCheckService.getInstance = function () {
        if (!HealthCheckService.instance) {
            HealthCheckService.instance = new HealthCheckService();
        }
        return HealthCheckService.instance;
    };
    /**
     * Start continuous health monitoring
     */
    HealthCheckService.prototype.startMonitoring = function (intervalMs) {
        var _this = this;
        if (intervalMs === void 0) { intervalMs = 30000; }
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        // Initial check
        this.performHealthChecks();
        // Set up interval
        this.healthCheckInterval = setInterval(function () {
            _this.performHealthChecks();
        }, intervalMs);
    };
    /**
     * Stop health monitoring
     */
    HealthCheckService.prototype.stopMonitoring = function () {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    };
    /**
     * Perform health checks on all critical endpoints
     */
    HealthCheckService.prototype.performHealthChecks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var healthPromises, results, services, healthyCount, degradedCount, overall, totalServices, unhealthyCount, systemHealth;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        healthPromises = this.criticalEndpoints.map(function (endpoint) {
                            return _this.checkEndpointHealth(endpoint.name, endpoint.url, endpoint.timeout);
                        });
                        return [4 /*yield*/, Promise.allSettled(healthPromises)];
                    case 1:
                        results = _a.sent();
                        services = {};
                        healthyCount = 0;
                        degradedCount = 0;
                        results.forEach(function (result, index) {
                            var _a;
                            var endpointName = _this.criticalEndpoints[index].name;
                            if (result.status === 'fulfilled') {
                                services[endpointName] = result.value;
                                if (result.value.status === 'healthy')
                                    healthyCount++;
                                else if (result.value.status === 'degraded')
                                    degradedCount++;
                            }
                            else {
                                services[endpointName] = {
                                    endpoint: _this.criticalEndpoints[index].url,
                                    status: 'unhealthy',
                                    responseTime: 0,
                                    timestamp: new Date(),
                                    error: ((_a = result.reason) === null || _a === void 0 ? void 0 : _a.message) || 'Health check failed'
                                };
                            }
                        });
                        overall = 'healthy';
                        totalServices = Object.keys(services).length;
                        unhealthyCount = totalServices - healthyCount - degradedCount;
                        if (unhealthyCount > totalServices * 0.5) {
                            overall = 'unhealthy';
                        }
                        else if (unhealthyCount > 0 || degradedCount > totalServices * 0.3) {
                            overall = 'degraded';
                        }
                        systemHealth = {
                            overall: overall,
                            services: services,
                            lastCheck: new Date(),
                            uptime: Date.now() - this.startTime.getTime()
                        };
                        // Notify callbacks
                        this.callbacks.forEach(function (callback) {
                            try {
                                callback(systemHealth);
                            }
                            catch (error) {
                                console.error('Error in health check callback:', error);
                            }
                        });
                        return [2 /*return*/, systemHealth];
                }
            });
        });
    };
    /**
     * Check health of a specific endpoint
     */
    HealthCheckService.prototype.checkEndpointHealth = function (name_1, url_1) {
        return __awaiter(this, arguments, void 0, function (name, url, timeout) {
            var startTime, controller_1, timeoutId, response, responseTime, status_1, result, error_1, responseTime, result;
            if (timeout === void 0) { timeout = 5000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        controller_1 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_1.abort(); }, timeout);
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('authToken')),
                                    'Content-Type': 'application/json',
                                },
                                signal: controller_1.signal
                            })];
                    case 2:
                        response = _a.sent();
                        clearTimeout(timeoutId);
                        responseTime = Date.now() - startTime;
                        status_1 = 'healthy';
                        if (responseTime > 2000) {
                            status_1 = 'degraded';
                        }
                        if (!response.ok) {
                            status_1 = response.status >= 500 ? 'unhealthy' : 'degraded';
                        }
                        result = {
                            endpoint: url,
                            status: status_1,
                            responseTime: responseTime,
                            timestamp: new Date(),
                            statusCode: response.status
                        };
                        // Store result
                        this.storeHealthResult(name, result);
                        this.updatePerformanceMetrics(name, result);
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        responseTime = Date.now() - startTime;
                        result = {
                            endpoint: url,
                            status: 'unhealthy',
                            responseTime: responseTime,
                            timestamp: new Date(),
                            error: error_1.message
                        };
                        this.storeHealthResult(name, result);
                        this.updatePerformanceMetrics(name, result);
                        return [2 /*return*/, result];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Store health check result
     */
    HealthCheckService.prototype.storeHealthResult = function (name, result) {
        if (!this.healthResults.has(name)) {
            this.healthResults.set(name, []);
        }
        var results = this.healthResults.get(name);
        results.push(result);
        // Keep only last 100 results per endpoint
        if (results.length > 100) {
            results.splice(0, results.length - 100);
        }
    };
    /**
     * Update performance metrics
     */
    HealthCheckService.prototype.updatePerformanceMetrics = function (name, result) {
        if (!this.performanceMetrics.has(name)) {
            this.performanceMetrics.set(name, {
                endpoint: result.endpoint,
                averageResponseTime: 0,
                successRate: 0,
                totalRequests: 0,
                failedRequests: 0,
                lastHour: { requests: 0, failures: 0, avgResponseTime: 0 },
                lastDay: { requests: 0, failures: 0, avgResponseTime: 0 }
            });
        }
        var metrics = this.performanceMetrics.get(name);
        var isSuccess = result.status !== 'unhealthy';
        // Update overall metrics
        metrics.totalRequests++;
        if (!isSuccess)
            metrics.failedRequests++;
        metrics.successRate = ((metrics.totalRequests - metrics.failedRequests) / metrics.totalRequests) * 100;
        metrics.averageResponseTime = this.calculateAverageResponseTime(name);
        // Update time-based metrics
        this.updateTimeBasedMetrics(name, result, isSuccess);
    };
    /**
     * Calculate average response time for an endpoint
     */
    HealthCheckService.prototype.calculateAverageResponseTime = function (name) {
        var results = this.healthResults.get(name) || [];
        if (results.length === 0)
            return 0;
        var total = results.reduce(function (sum, result) { return sum + result.responseTime; }, 0);
        return total / results.length;
    };
    /**
     * Update time-based metrics (last hour, last day)
     */
    HealthCheckService.prototype.updateTimeBasedMetrics = function (name, result, isSuccess) {
        var metrics = this.performanceMetrics.get(name);
        var now = new Date();
        var oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        var oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        var results = this.healthResults.get(name) || [];
        // Last hour metrics
        var lastHourResults = results.filter(function (r) { return r.timestamp >= oneHourAgo; });
        metrics.lastHour = {
            requests: lastHourResults.length,
            failures: lastHourResults.filter(function (r) { return r.status === 'unhealthy'; }).length,
            avgResponseTime: lastHourResults.length > 0
                ? lastHourResults.reduce(function (sum, r) { return sum + r.responseTime; }, 0) / lastHourResults.length
                : 0
        };
        // Last day metrics
        var lastDayResults = results.filter(function (r) { return r.timestamp >= oneDayAgo; });
        metrics.lastDay = {
            requests: lastDayResults.length,
            failures: lastDayResults.filter(function (r) { return r.status === 'unhealthy'; }).length,
            avgResponseTime: lastDayResults.length > 0
                ? lastDayResults.reduce(function (sum, r) { return sum + r.responseTime; }, 0) / lastDayResults.length
                : 0
        };
    };
    /**
     * Get current system health
     */
    HealthCheckService.prototype.getCurrentHealth = function () {
        var _this = this;
        var services = {};
        var hasData = false;
        this.criticalEndpoints.forEach(function (endpoint) {
            var results = _this.healthResults.get(endpoint.name);
            if (results && results.length > 0) {
                services[endpoint.name] = results[results.length - 1];
                hasData = true;
            }
        });
        if (!hasData)
            return null;
        var healthyCount = Object.values(services).filter(function (s) { return s.status === 'healthy'; }).length;
        var degradedCount = Object.values(services).filter(function (s) { return s.status === 'degraded'; }).length;
        var totalServices = Object.keys(services).length;
        var unhealthyCount = totalServices - healthyCount - degradedCount;
        var overall = 'healthy';
        if (unhealthyCount > totalServices * 0.5) {
            overall = 'unhealthy';
        }
        else if (unhealthyCount > 0 || degradedCount > totalServices * 0.3) {
            overall = 'degraded';
        }
        return {
            overall: overall,
            services: services,
            lastCheck: new Date(),
            uptime: Date.now() - this.startTime.getTime()
        };
    };
    /**
     * Get performance metrics for all endpoints
     */
    HealthCheckService.prototype.getPerformanceMetrics = function () {
        return new Map(this.performanceMetrics);
    };
    /**
     * Get health history for an endpoint
     */
    HealthCheckService.prototype.getHealthHistory = function (endpointName, limit) {
        if (limit === void 0) { limit = 50; }
        var results = this.healthResults.get(endpointName) || [];
        return results.slice(-limit);
    };
    /**
     * Subscribe to health updates
     */
    HealthCheckService.prototype.onHealthUpdate = function (id, callback) {
        this.callbacks.set(id, callback);
    };
    /**
     * Unsubscribe from health updates
     */
    HealthCheckService.prototype.offHealthUpdate = function (id) {
        this.callbacks.delete(id);
    };
    /**
     * Add custom endpoint to monitor
     */
    HealthCheckService.prototype.addEndpoint = function (name, url, timeout) {
        if (timeout === void 0) { timeout = 5000; }
        this.criticalEndpoints.push({ name: name, url: url, timeout: timeout });
    };
    /**
     * Remove endpoint from monitoring
     */
    HealthCheckService.prototype.removeEndpoint = function (name) {
        var index = this.criticalEndpoints.findIndex(function (e) { return e.name === name; });
        if (index > -1) {
            this.criticalEndpoints.splice(index, 1);
            this.healthResults.delete(name);
            this.performanceMetrics.delete(name);
        }
    };
    return HealthCheckService;
}());
exports.healthCheckService = HealthCheckService.getInstance();
exports.default = exports.healthCheckService;
