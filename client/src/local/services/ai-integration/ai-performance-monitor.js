"use strict";
/**
 * AI Performance Monitoring Service
 *
 * Comprehensive monitoring system for AI services including performance metrics,
 * usage analytics, cost tracking, and real-time health monitoring.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.aiMonitoringUtils = exports.aiPerformanceMonitor = exports.AIPerformanceMonitor = void 0;
var events_1 = require("events");
var logger_1 = require("../../../../server/infrastructure/monitoring/logger");
var base_error_1 = require("../../error-handling/errors/base-error");
var AIPerformanceMonitorError = /** @class */ (function (_super) {
    __extends(AIPerformanceMonitorError, _super);
    function AIPerformanceMonitorError(message, operation, cause) {
        return _super.call(this, message, {
            code: 'AI_PERFORMANCE_MONITOR_ERROR',
            domain: base_error_1.ErrorDomain.SYSTEM,
            severity: base_error_1.ErrorSeverity.MEDIUM,
            cause: cause,
            details: { operation: operation }
        }) || this;
    }
    return AIPerformanceMonitorError;
}(base_error_1.BaseError));
var AIPerformanceMonitor = /** @class */ (function (_super) {
    __extends(AIPerformanceMonitor, _super);
    function AIPerformanceMonitor(config) {
        var _this = _super.call(this) || this;
        _this.metrics = [];
        _this.config = __assign({ enableMetricsCollection: true, enableUsageAnalytics: true, enableCostTracking: true, enableHealthMonitoring: true, metricsRetentionDays: 30, healthCheckInterval: 60000, alertThresholds: {
                responseTime: 5000, // 5 seconds
                errorRate: 0.1, // 10%
                availability: 0.95, // 95%
                costPerHour: 10 // $10 per hour
            }, costTracking: {
                enableBudgetAlerts: true,
                monthlyBudget: 1000, // $1000 per month
                alertThresholds: [50, 75, 90, 95] // percentage thresholds
            } }, config);
        _this.healthStatus = _this.initializeHealthStatus();
        _this.costTracking = _this.initializeCostTracking();
        _this.startHealthMonitoring();
        _this.startMetricsCleanup();
        logger_1.logger.info('AI Performance Monitor initialized', {
            module: 'AIPerformanceMonitor',
            config: _this.config
        });
        return _this;
    }
    AIPerformanceMonitor.getInstance = function (config) {
        if (!AIPerformanceMonitor.instance) {
            AIPerformanceMonitor.instance = new AIPerformanceMonitor(config);
        }
        return AIPerformanceMonitor.instance;
    };
    /**
     * Record AI operation metrics
     */
    AIPerformanceMonitor.prototype.recordMetrics = function (metrics) {
        if (!this.config.enableMetricsCollection)
            return;
        var fullMetrics = __assign(__assign({}, metrics), { timestamp: new Date() });
        this.metrics.push(fullMetrics);
        // Update cost tracking
        if (this.config.enableCostTracking && metrics.cost) {
            this.updateCostTracking(fullMetrics);
        }
        // Check for alerts
        this.checkAlerts(fullMetrics);
        // Emit metrics event
        this.emit('metrics', fullMetrics);
        logger_1.logger.debug('AI metrics recorded', {
            module: 'AIPerformanceMonitor',
            service: metrics.service,
            operation: metrics.operation,
            responseTime: metrics.responseTime,
            success: metrics.success,
            cost: metrics.cost
        });
    };
    /**
     * Get usage analytics for specified time range
     */
    AIPerformanceMonitor.prototype.getUsageAnalytics = function (startDate, endDate, service) {
        if (!this.config.enableUsageAnalytics) {
            throw new AIPerformanceMonitorError('Usage analytics is disabled', 'getUsageAnalytics');
        }
        var now = new Date();
        var start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        var end = endDate || now;
        var filteredMetrics = this.metrics.filter(function (m) { return m.timestamp >= start && m.timestamp <= end; });
        if (service) {
            filteredMetrics = filteredMetrics.filter(function (m) { return m.service === service; });
        }
        var totalRequests = filteredMetrics.length;
        var successfulRequests = filteredMetrics.filter(function (m) { return m.success; }).length;
        var failedRequests = totalRequests - successfulRequests;
        var responseTimes = filteredMetrics.map(function (m) { return m.responseTime; }).sort(function (a, b) { return a - b; });
        var averageResponseTime = responseTimes.reduce(function (sum, rt) { return sum + rt; }, 0) / responseTimes.length || 0;
        var medianResponseTime = responseTimes[Math.floor(responseTimes.length / 2)] || 0;
        var p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
        var p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
        var errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
        var totalCost = filteredMetrics.reduce(function (sum, m) { return sum + (m.cost || 0); }, 0);
        var costPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
        var timeRangeHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        var requestsPerHour = timeRangeHours > 0 ? totalRequests / timeRangeHours : 0;
        var requestsPerDay = requestsPerHour * 24;
        // Calculate top errors
        var errorCounts = filteredMetrics
            .filter(function (m) { return !m.success && m.errorType; })
            .reduce(function (counts, m) {
            counts[m.errorType] = (counts[m.errorType] || 0) + 1;
            return counts;
        }, {});
        var topErrors = Object.entries(errorCounts)
            .map(function (_a) {
            var error = _a[0], count = _a[1];
            return ({
                error: error,
                count: count,
                percentage: (count / failedRequests) * 100
            });
        })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 10);
        // Calculate service breakdown
        var serviceBreakdown = this.calculateServiceBreakdown(filteredMetrics);
        var operationBreakdown = this.calculateOperationBreakdown(filteredMetrics);
        return {
            totalRequests: totalRequests,
            successfulRequests: successfulRequests,
            failedRequests: failedRequests,
            averageResponseTime: averageResponseTime,
            medianResponseTime: medianResponseTime,
            p95ResponseTime: p95ResponseTime,
            p99ResponseTime: p99ResponseTime,
            errorRate: errorRate,
            totalCost: totalCost,
            costPerRequest: costPerRequest,
            requestsPerHour: requestsPerHour,
            requestsPerDay: requestsPerDay,
            topErrors: topErrors,
            serviceBreakdown: serviceBreakdown,
            operationBreakdown: operationBreakdown
        };
    };
    /**
     * Get current health status
     */
    AIPerformanceMonitor.prototype.getHealthStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.enableHealthMonitoring) {
                            throw new AIPerformanceMonitorError('Health monitoring is disabled', 'getHealthStatus');
                        }
                        // Update health status with latest metrics
                        return [4 /*yield*/, this.updateHealthStatus()];
                    case 1:
                        // Update health status with latest metrics
                        _a.sent();
                        return [2 /*return*/, __assign({}, this.healthStatus)];
                }
            });
        });
    };
    /**
     * Get cost tracking information
     */
    AIPerformanceMonitor.prototype.getCostTracking = function () {
        if (!this.config.enableCostTracking) {
            throw new AIPerformanceMonitorError('Cost tracking is disabled', 'getCostTracking');
        }
        return __assign({}, this.costTracking);
    };
    /**
     * Get performance metrics for specific service/operation
     */
    AIPerformanceMonitor.prototype.getPerformanceMetrics = function (service, operation, timeRange) {
        var filteredMetrics = __spreadArray([], this.metrics, true);
        if (service) {
            filteredMetrics = filteredMetrics.filter(function (m) { return m.service === service; });
        }
        if (operation) {
            filteredMetrics = filteredMetrics.filter(function (m) { return m.operation === operation; });
        }
        if (timeRange) {
            filteredMetrics = filteredMetrics.filter(function (m) { return m.timestamp >= timeRange.start && m.timestamp <= timeRange.end; });
        }
        return filteredMetrics;
    };
    /**
     * Set budget alert thresholds
     */
    AIPerformanceMonitor.prototype.setBudgetAlerts = function (monthlyBudget, thresholds) {
        this.config.costTracking.monthlyBudget = monthlyBudget;
        this.config.costTracking.alertThresholds = thresholds;
        // Update budget alerts
        this.updateBudgetAlerts();
        logger_1.logger.info('Budget alerts updated', {
            module: 'AIPerformanceMonitor',
            monthlyBudget: monthlyBudget,
            thresholds: thresholds
        });
    };
    /**
     * Export metrics data
     */
    AIPerformanceMonitor.prototype.exportMetrics = function (format) {
        if (format === void 0) { format = 'json'; }
        if (format === 'json') {
            return JSON.stringify({
                metrics: this.metrics,
                usageAnalytics: this.getUsageAnalytics(),
                healthStatus: this.healthStatus,
                costTracking: this.costTracking,
                exportedAt: new Date()
            }, null, 2);
        }
        // CSV format
        var headers = [
            'timestamp', 'service', 'operation', 'responseTime', 'success',
            'errorType', 'inputSize', 'outputSize', 'cost', 'modelUsed', 'confidence'
        ];
        var csvRows = __spreadArray([
            headers.join(',')
        ], this.metrics.map(function (m) { return [
            m.timestamp.toISOString(),
            m.service,
            m.operation,
            m.responseTime,
            m.success,
            m.errorType || '',
            m.inputSize || '',
            m.outputSize || '',
            m.cost || '',
            m.modelUsed || '',
            m.confidence || ''
        ].join(','); }), true);
        return csvRows.join('\n');
    };
    /**
     * Clear old metrics based on retention policy
     */
    AIPerformanceMonitor.prototype.clearOldMetrics = function () {
        var cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.metricsRetentionDays);
        var originalCount = this.metrics.length;
        this.metrics = this.metrics.filter(function (m) { return m.timestamp >= cutoffDate; });
        var removedCount = originalCount - this.metrics.length;
        if (removedCount > 0) {
            logger_1.logger.info('Cleared old metrics', {
                module: 'AIPerformanceMonitor',
                removedCount: removedCount,
                retentionDays: this.config.metricsRetentionDays
            });
        }
    };
    /**
     * Shutdown monitoring
     */
    AIPerformanceMonitor.prototype.shutdown = function () {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        if (this.metricsCleanupInterval) {
            clearInterval(this.metricsCleanupInterval);
        }
        this.removeAllListeners();
        logger_1.logger.info('AI Performance Monitor shutdown', {
            module: 'AIPerformanceMonitor'
        });
    };
    // Private methods
    AIPerformanceMonitor.prototype.initializeHealthStatus = function () {
        return {
            overall: 'healthy',
            services: {},
            alerts: []
        };
    };
    AIPerformanceMonitor.prototype.initializeCostTracking = function () {
        return {
            totalCost: 0,
            costByService: {},
            costByOperation: {},
            costByTimeframe: {},
            estimatedMonthlyCost: 0,
            costPerRequest: 0,
            budgetAlerts: []
        };
    };
    AIPerformanceMonitor.prototype.startHealthMonitoring = function () {
        var _this = this;
        if (!this.config.enableHealthMonitoring)
            return;
        this.healthCheckInterval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.updateHealthStatus()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.logger.error('Health check failed', {
                            module: 'AIPerformanceMonitor',
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); }, this.config.healthCheckInterval);
    };
    AIPerformanceMonitor.prototype.startMetricsCleanup = function () {
        var _this = this;
        // Clean up old metrics daily
        this.metricsCleanupInterval = setInterval(function () {
            _this.clearOldMetrics();
        }, 24 * 60 * 60 * 1000);
    };
    AIPerformanceMonitor.prototype.updateHealthStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, oneHourAgo, recentMetrics, services, _loop_1, this_1, _i, services_1, service, serviceStatuses;
            return __generator(this, function (_a) {
                now = new Date();
                oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
                recentMetrics = this.metrics.filter(function (m) { return m.timestamp >= oneHourAgo; });
                services = __spreadArray([], new Set(recentMetrics.map(function (m) { return m.service; })), true);
                _loop_1 = function (service) {
                    var serviceMetrics = recentMetrics.filter(function (m) { return m.service === service; });
                    var successfulRequests = serviceMetrics.filter(function (m) { return m.success; }).length;
                    var totalRequests = serviceMetrics.length;
                    var errorRate = totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0;
                    var availability = totalRequests > 0 ? successfulRequests / totalRequests : 1;
                    var averageResponseTime = serviceMetrics.reduce(function (sum, m) { return sum + m.responseTime; }, 0) / totalRequests || 0;
                    var issues = [];
                    var status_1 = 'healthy';
                    if (errorRate > this_1.config.alertThresholds.errorRate) {
                        issues.push("High error rate: ".concat((errorRate * 100).toFixed(1), "%"));
                        status_1 = 'unhealthy';
                    }
                    if (availability < this_1.config.alertThresholds.availability) {
                        issues.push("Low availability: ".concat((availability * 100).toFixed(1), "%"));
                        status_1 = 'unhealthy';
                    }
                    if (averageResponseTime > this_1.config.alertThresholds.responseTime) {
                        issues.push("High response time: ".concat(averageResponseTime.toFixed(0), "ms"));
                        if (status_1 === 'healthy')
                            status_1 = 'degraded';
                    }
                    this_1.healthStatus.services[service] = {
                        status: status_1,
                        lastCheck: now,
                        responseTime: averageResponseTime,
                        errorRate: errorRate,
                        availability: availability,
                        issues: issues
                    };
                };
                this_1 = this;
                for (_i = 0, services_1 = services; _i < services_1.length; _i++) {
                    service = services_1[_i];
                    _loop_1(service);
                }
                serviceStatuses = Object.values(this.healthStatus.services).map(function (s) { return s.status; });
                if (serviceStatuses.some(function (s) { return s === 'unhealthy'; })) {
                    this.healthStatus.overall = 'unhealthy';
                }
                else if (serviceStatuses.some(function (s) { return s === 'degraded'; })) {
                    this.healthStatus.overall = 'degraded';
                }
                else {
                    this.healthStatus.overall = 'healthy';
                }
                return [2 /*return*/];
            });
        });
    };
    AIPerformanceMonitor.prototype.updateCostTracking = function (metrics) {
        if (!metrics.cost)
            return;
        this.costTracking.totalCost += metrics.cost;
        // Update cost by service
        this.costTracking.costByService[metrics.service] =
            (this.costTracking.costByService[metrics.service] || 0) + metrics.cost;
        // Update cost by operation
        this.costTracking.costByOperation[metrics.operation] =
            (this.costTracking.costByOperation[metrics.operation] || 0) + metrics.cost;
        // Update cost by timeframe
        var hour = metrics.timestamp.toISOString().slice(0, 13);
        var day = metrics.timestamp.toISOString().slice(0, 10);
        this.costTracking.costByTimeframe[hour] =
            (this.costTracking.costByTimeframe[hour] || 0) + metrics.cost;
        // Calculate estimated monthly cost
        var recentMetrics = this.metrics.filter(function (m) { return m.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000) && m.cost; });
        var dailyCost = recentMetrics.reduce(function (sum, m) { return sum + (m.cost || 0); }, 0);
        this.costTracking.estimatedMonthlyCost = dailyCost * 30;
        // Update cost per request
        var totalRequests = this.metrics.length;
        this.costTracking.costPerRequest = totalRequests > 0 ? this.costTracking.totalCost / totalRequests : 0;
        // Update budget alerts
        this.updateBudgetAlerts();
    };
    AIPerformanceMonitor.prototype.updateBudgetAlerts = function () {
        if (!this.config.costTracking.enableBudgetAlerts || !this.config.costTracking.monthlyBudget) {
            return;
        }
        var monthlyBudget = this.config.costTracking.monthlyBudget;
        var currentSpend = this.costTracking.estimatedMonthlyCost;
        this.costTracking.budgetAlerts = this.config.costTracking.alertThresholds.map(function (threshold) {
            var thresholdAmount = (threshold / 100) * monthlyBudget;
            var percentage = (currentSpend / monthlyBudget) * 100;
            var triggered = currentSpend >= thresholdAmount;
            return {
                threshold: threshold,
                currentSpend: currentSpend,
                percentage: percentage,
                triggered: triggered
            };
        });
    };
    AIPerformanceMonitor.prototype.checkAlerts = function (metrics) {
        var _a;
        var _this = this;
        var alerts = [];
        // Response time alert
        if (metrics.responseTime > this.config.alertThresholds.responseTime) {
            alerts.push({
                level: 'warning',
                message: "High response time: ".concat(metrics.responseTime, "ms for ").concat(metrics.service, ".").concat(metrics.operation),
                timestamp: new Date(),
                service: metrics.service,
                operation: metrics.operation
            });
        }
        // Error alert
        if (!metrics.success) {
            alerts.push({
                level: 'error',
                message: "Operation failed: ".concat(metrics.service, ".").concat(metrics.operation, " - ").concat(metrics.errorType || 'Unknown error'),
                timestamp: new Date(),
                service: metrics.service,
                operation: metrics.operation
            });
        }
        // Cost alert
        if (metrics.cost && metrics.cost > this.config.alertThresholds.costPerHour / 3600) {
            alerts.push({
                level: 'warning',
                message: "High cost operation: $".concat(metrics.cost.toFixed(4), " for ").concat(metrics.service, ".").concat(metrics.operation),
                timestamp: new Date(),
                service: metrics.service,
                operation: metrics.operation
            });
        }
        // Add alerts to health status
        (_a = this.healthStatus.alerts).push.apply(_a, alerts);
        // Keep only recent alerts (last 24 hours)
        var oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.healthStatus.alerts = this.healthStatus.alerts.filter(function (alert) { return alert.timestamp >= oneDayAgo; });
        // Emit alert events
        alerts.forEach(function (alert) {
            _this.emit('alert', alert);
        });
    };
    AIPerformanceMonitor.prototype.calculateServiceBreakdown = function (metrics) {
        var services = __spreadArray([], new Set(metrics.map(function (m) { return m.service; })), true);
        return services.reduce(function (breakdown, service) {
            var serviceMetrics = metrics.filter(function (m) { return m.service === service; });
            var successfulRequests = serviceMetrics.filter(function (m) { return m.success; }).length;
            breakdown[service] = {
                requests: serviceMetrics.length,
                averageResponseTime: serviceMetrics.reduce(function (sum, m) { return sum + m.responseTime; }, 0) / serviceMetrics.length || 0,
                errorRate: serviceMetrics.length > 0 ? (serviceMetrics.length - successfulRequests) / serviceMetrics.length : 0,
                cost: serviceMetrics.reduce(function (sum, m) { return sum + (m.cost || 0); }, 0)
            };
            return breakdown;
        }, {});
    };
    AIPerformanceMonitor.prototype.calculateOperationBreakdown = function (metrics) {
        var operations = __spreadArray([], new Set(metrics.map(function (m) { return m.operation; })), true);
        return operations.reduce(function (breakdown, operation) {
            var operationMetrics = metrics.filter(function (m) { return m.operation === operation; });
            var successfulRequests = operationMetrics.filter(function (m) { return m.success; }).length;
            breakdown[operation] = {
                requests: operationMetrics.length,
                averageResponseTime: operationMetrics.reduce(function (sum, m) { return sum + m.responseTime; }, 0) / operationMetrics.length || 0,
                errorRate: operationMetrics.length > 0 ? (operationMetrics.length - successfulRequests) / operationMetrics.length : 0,
                cost: operationMetrics.reduce(function (sum, m) { return sum + (m.cost || 0); }, 0)
            };
            return breakdown;
        }, {});
    };
    return AIPerformanceMonitor;
}(events_1.EventEmitter));
exports.AIPerformanceMonitor = AIPerformanceMonitor;
// Export singleton instance
exports.aiPerformanceMonitor = AIPerformanceMonitor.getInstance();
// Export utility functions
exports.aiMonitoringUtils = {
    /**
     * Create performance monitor with custom config
     */
    createMonitor: function (config) {
        return AIPerformanceMonitor.getInstance(config);
    },
    /**
     * Record AI operation with automatic metrics collection
     */
    monitorAIOperation: function (service_1, operation_1, aiOperation_1) {
        return __awaiter(this, arguments, void 0, function (service, operation, aiOperation, options) {
            var startTime, success, errorType, result, confidence, error_2, responseTime, outputSize;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        success = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, aiOperation()];
                    case 2:
                        result = _a.sent();
                        success = true;
                        // Extract confidence if available
                        if (typeof result === 'object' && result !== null && 'confidence' in result) {
                            confidence = result.confidence;
                        }
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _a.sent();
                        errorType = error_2 instanceof Error ? error_2.constructor.name : 'UnknownError';
                        throw error_2;
                    case 4:
                        responseTime = Date.now() - startTime;
                        outputSize = void 0;
                        if (success && result) {
                            try {
                                outputSize = JSON.stringify(result).length;
                            }
                            catch (_b) {
                                // Ignore serialization errors
                            }
                        }
                        exports.aiPerformanceMonitor.recordMetrics({
                            service: service,
                            operation: operation,
                            responseTime: responseTime,
                            success: success,
                            errorType: errorType,
                            inputSize: options.inputSize,
                            outputSize: outputSize,
                            cost: options.costEstimate,
                            modelUsed: options.modelUsed,
                            confidence: confidence
                        });
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Get performance summary for dashboard
     */
    getPerformanceSummary: function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, overview, health, costs, recentAlerts;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            exports.aiPerformanceMonitor.getUsageAnalytics(),
                            exports.aiPerformanceMonitor.getHealthStatus(),
                            Promise.resolve(exports.aiPerformanceMonitor.getCostTracking())
                        ])];
                    case 1:
                        _a = _b.sent(), overview = _a[0], health = _a[1], costs = _a[2];
                        recentAlerts = health.alerts
                            .filter(function (alert) { return alert.timestamp >= new Date(Date.now() - 60 * 60 * 1000); })
                            .sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); })
                            .slice(0, 10);
                        return [2 /*return*/, {
                                overview: overview,
                                health: health,
                                costs: costs,
                                recentAlerts: recentAlerts
                            }];
                }
            });
        });
    }
};
