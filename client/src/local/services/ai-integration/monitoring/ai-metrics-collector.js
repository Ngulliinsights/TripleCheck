"use strict";
/**
 * AI Metrics Collector
 *
 * Comprehensive metrics collection system for AI services including
 * performance monitoring, usage analytics, and cost tracking.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiMetricsCollector = exports.AIMetricsCollector = void 0;
var logger_1 = require("../../../../../server/infrastructure/monitoring/logger");
var base_error_1 = require("../../../error-handling/errors/base-error");
var error_categories_1 = require("../../../error-handling/constants/error-categories");
var AIMetricsCollectorError = /** @class */ (function (_super) {
    __extends(AIMetricsCollectorError, _super);
    function AIMetricsCollectorError(message, operation, cause) {
        return _super.call(this, 'AI_METRICS_COLLECTOR_ERROR', message, 500, error_categories_1.ErrorCategory.SYSTEM, {
            severity: base_error_1.ErrorSeverity.MEDIUM,
            cause: cause,
            details: { operation: operation }
        }) || this;
    }
    return AIMetricsCollectorError;
}(base_error_1.AppError));
var AIMetricsCollector = /** @class */ (function () {
    function AIMetricsCollector() {
        this.operations = new Map();
        this.serviceMetrics = new Map();
        this.systemStartTime = Date.now();
        this.metricsHistory = [];
        this.maxHistorySize = 10000;
        this.metricsUpdateInterval = null;
        this.startMetricsCollection();
        logger_1.logger.info('AI Metrics Collector initialized', {
            module: 'AIMetricsCollector',
            maxHistorySize: this.maxHistorySize
        });
    }
    AIMetricsCollector.getInstance = function () {
        if (!AIMetricsCollector.instance) {
            AIMetricsCollector.instance = new AIMetricsCollector();
        }
        return AIMetricsCollector.instance;
    };
    /**
     * Start tracking an AI operation
     */
    AIMetricsCollector.prototype.startOperation = function (service, operation, metadata) {
        var operationId = "".concat(service, "_").concat(operation, "_").concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        var operationMetrics = {
            operationId: operationId,
            service: service,
            operation: operation,
            startTime: Date.now(),
            success: false,
            metadata: metadata
        };
        this.operations.set(operationId, operationMetrics);
        logger_1.logger.debug('AI operation started', {
            module: 'AIMetricsCollector',
            operationId: operationId,
            service: service,
            operation: operation
        });
        return operationId;
    };
    /**
     * Complete an AI operation with success
     */
    AIMetricsCollector.prototype.completeOperation = function (operationId, result) {
        if (result === void 0) { result = {}; }
        var operation = this.operations.get(operationId);
        if (!operation) {
            logger_1.logger.warn('Attempted to complete unknown operation', {
                module: 'AIMetricsCollector',
                operationId: operationId
            });
            return;
        }
        var endTime = Date.now();
        var updatedOperation = __assign(__assign(__assign(__assign({}, operation), { endTime: endTime, duration: endTime - operation.startTime, success: true }), result), { metadata: __assign(__assign({}, operation.metadata), result.metadata) });
        this.operations.set(operationId, updatedOperation);
        this.addToHistory(updatedOperation);
        this.updateServiceMetrics(updatedOperation);
        logger_1.logger.debug('AI operation completed successfully', {
            module: 'AIMetricsCollector',
            operationId: operationId,
            service: operation.service,
            operation: operation.operation,
            duration: updatedOperation.duration,
            tokensUsed: result.tokensUsed,
            cost: result.cost
        });
    };
    /**
     * Fail an AI operation with error
     */
    AIMetricsCollector.prototype.failOperation = function (operationId, error, details) {
        if (details === void 0) { details = {}; }
        var operation = this.operations.get(operationId);
        if (!operation) {
            logger_1.logger.warn('Attempted to fail unknown operation', {
                module: 'AIMetricsCollector',
                operationId: operationId
            });
            return;
        }
        var endTime = Date.now();
        var updatedOperation = __assign(__assign(__assign(__assign({}, operation), { endTime: endTime, duration: endTime - operation.startTime, success: false, error: error }), details), { metadata: __assign(__assign({}, operation.metadata), details.metadata) });
        this.operations.set(operationId, updatedOperation);
        this.addToHistory(updatedOperation);
        this.updateServiceMetrics(updatedOperation);
        logger_1.logger.error('AI operation failed', {
            module: 'AIMetricsCollector',
            operationId: operationId,
            service: operation.service,
            operation: operation.operation,
            duration: updatedOperation.duration,
            error: error,
            retryCount: details.retryCount
        });
    };
    /**
     * Get metrics for a specific service
     */
    AIMetricsCollector.prototype.getServiceMetrics = function (service) {
        return this.serviceMetrics.get(service) || null;
    };
    /**
     * Get system-wide metrics
     */
    AIMetricsCollector.prototype.getSystemMetrics = function () {
        var services = Object.fromEntries(this.serviceMetrics.entries());
        var allOperations = Array.from(this.operations.values()).concat(this.metricsHistory);
        var totalOperations = allOperations.length;
        var successfulOperations = allOperations.filter(function (op) { return op.success; }).length;
        var failedOperations = totalOperations - successfulOperations;
        var responseTimes = allOperations
            .filter(function (op) { return op.duration !== undefined; })
            .map(function (op) { return op.duration; });
        var averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce(function (sum, time) { return sum + time; }, 0) / responseTimes.length
            : 0;
        var totalTokensUsed = allOperations
            .filter(function (op) { return op.tokensUsed !== undefined; })
            .reduce(function (sum, op) { return sum + (op.tokensUsed || 0); }, 0);
        var totalCost = allOperations
            .filter(function (op) { return op.cost !== undefined; })
            .reduce(function (sum, op) { return sum + (op.cost || 0); }, 0);
        var servicesStatus = {};
        for (var _i = 0, _a = this.serviceMetrics.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], serviceName = _b[0], metrics = _b[1];
            if (metrics.errorRate > 0.2) {
                servicesStatus[serviceName] = 'unhealthy';
            }
            else if (metrics.errorRate > 0.1) {
                servicesStatus[serviceName] = 'degraded';
            }
            else {
                servicesStatus[serviceName] = 'healthy';
            }
        }
        return {
            totalOperations: totalOperations,
            totalSuccessfulOperations: successfulOperations,
            totalFailedOperations: failedOperations,
            overallErrorRate: totalOperations > 0 ? failedOperations / totalOperations : 0,
            overallSuccessRate: totalOperations > 0 ? successfulOperations / totalOperations : 0,
            totalTokensUsed: totalTokensUsed,
            totalCost: totalCost,
            averageResponseTime: averageResponseTime,
            systemUptime: Date.now() - this.systemStartTime,
            servicesStatus: servicesStatus,
            lastMetricsUpdate: new Date(),
            services: services
        };
    };
    /**
     * Get cost breakdown by service and operation
     */
    AIMetricsCollector.prototype.getCostBreakdown = function (timeRange) {
        var operations = timeRange
            ? this.getOperationsInTimeRange(timeRange.start, timeRange.end)
            : Array.from(this.operations.values()).concat(this.metricsHistory);
        var breakdown = new Map();
        for (var _i = 0, operations_1 = operations; _i < operations_1.length; _i++) {
            var op = operations_1[_i];
            if (op.cost === undefined)
                continue;
            var key = "".concat(op.service, ":").concat(op.operation);
            if (!breakdown.has(key)) {
                breakdown.set(key, {
                    service: op.service,
                    operation: op.operation,
                    operations: []
                });
            }
            breakdown.get(key).operations.push(op);
        }
        return Array.from(breakdown.values()).map(function (_a) {
            var service = _a.service, operation = _a.operation, operations = _a.operations;
            var totalCost = operations.reduce(function (sum, op) { return sum + (op.cost || 0); }, 0);
            var tokensUsed = operations.reduce(function (sum, op) { return sum + (op.tokensUsed || 0); }, 0);
            return {
                service: service,
                operation: operation,
                totalCost: totalCost,
                operationCount: operations.length,
                averageCostPerOperation: operations.length > 0 ? totalCost / operations.length : 0,
                tokensUsed: tokensUsed,
                costPerToken: tokensUsed > 0 ? totalCost / tokensUsed : 0,
                timeRange: timeRange || {
                    start: new Date(Math.min.apply(Math, operations.map(function (op) { return op.startTime; }))),
                    end: new Date(Math.max.apply(Math, operations.map(function (op) { return op.endTime || op.startTime; })))
                }
            };
        }).sort(function (a, b) { return b.totalCost - a.totalCost; });
    };
    /**
     * Get usage analytics
     */
    AIMetricsCollector.prototype.getUsageAnalytics = function (days) {
        if (days === void 0) { days = 7; }
        var endDate = new Date();
        var startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
        var operations = this.getOperationsInTimeRange(startDate, endDate);
        // Daily usage
        var dailyUsage = this.calculateDailyUsage(operations, days);
        // Hourly usage (last 24 hours)
        var hourlyUsage = this.calculateHourlyUsage(operations);
        // Service usage
        var serviceUsage = this.calculateServiceUsage(operations);
        // Top operations
        var topOperations = this.calculateTopOperations(operations);
        // Error analysis
        var errorAnalysis = this.calculateErrorAnalysis(operations);
        return {
            dailyUsage: dailyUsage,
            hourlyUsage: hourlyUsage,
            serviceUsage: serviceUsage,
            topOperations: topOperations,
            errorAnalysis: errorAnalysis
        };
    };
    /**
     * Clear old metrics to prevent memory leaks
     */
    AIMetricsCollector.prototype.clearOldMetrics = function (olderThanHours) {
        if (olderThanHours === void 0) { olderThanHours = 24; }
        var cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
        // Clear old operations
        for (var _i = 0, _a = this.operations.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], operationId = _b[0], operation = _b[1];
            if (operation.startTime < cutoffTime) {
                this.operations.delete(operationId);
            }
        }
        // Clear old history
        this.metricsHistory = this.metricsHistory.filter(function (op) { return op.startTime >= cutoffTime; });
        logger_1.logger.info('Cleared old AI metrics', {
            module: 'AIMetricsCollector',
            cutoffTime: new Date(cutoffTime),
            remainingOperations: this.operations.size,
            remainingHistory: this.metricsHistory.length
        });
    };
    /**
     * Export metrics for external analysis
     */
    AIMetricsCollector.prototype.exportMetrics = function (format) {
        if (format === void 0) { format = 'json'; }
        var systemMetrics = this.getSystemMetrics();
        var usageAnalytics = this.getUsageAnalytics();
        var costBreakdown = this.getCostBreakdown();
        var exportData = {
            timestamp: new Date().toISOString(),
            systemMetrics: systemMetrics,
            usageAnalytics: usageAnalytics,
            costBreakdown: costBreakdown,
            rawOperations: this.metricsHistory.slice(-1000) // Last 1000 operations
        };
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        }
        else {
            // Convert to CSV format
            return this.convertToCSV(exportData);
        }
    };
    // Private helper methods
    AIMetricsCollector.prototype.startMetricsCollection = function () {
        var _this = this;
        // Update service metrics every 30 seconds
        this.metricsUpdateInterval = setInterval(function () {
            _this.updateAllServiceMetrics();
            _this.clearOldMetrics();
        }, 30000);
    };
    AIMetricsCollector.prototype.addToHistory = function (operation) {
        this.metricsHistory.push(operation);
        // Keep history size manageable
        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
        }
    };
    AIMetricsCollector.prototype.updateServiceMetrics = function (operation) {
        var service = operation.service;
        var metrics = this.serviceMetrics.get(service);
        if (!metrics) {
            metrics = {
                service: service,
                totalOperations: 0,
                successfulOperations: 0,
                failedOperations: 0,
                averageResponseTime: 0,
                medianResponseTime: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0,
                errorRate: 0,
                successRate: 0,
                totalTokensUsed: 0,
                totalCost: 0,
                cacheHitRate: 0,
                averageRetryCount: 0,
                lastUpdated: new Date(),
                operationBreakdown: {}
            };
        }
        // Update basic counters
        metrics.totalOperations++;
        if (operation.success) {
            metrics.successfulOperations++;
        }
        else {
            metrics.failedOperations++;
        }
        // Update rates
        metrics.errorRate = metrics.failedOperations / metrics.totalOperations;
        metrics.successRate = metrics.successfulOperations / metrics.totalOperations;
        // Update operation breakdown
        var opKey = operation.operation;
        if (!metrics.operationBreakdown[opKey]) {
            metrics.operationBreakdown[opKey] = {
                count: 0,
                averageTime: 0,
                errorRate: 0,
                totalCost: 0
            };
        }
        var opBreakdown = metrics.operationBreakdown[opKey];
        opBreakdown.count++;
        if (operation.duration) {
            opBreakdown.averageTime = (opBreakdown.averageTime + operation.duration) / 2;
        }
        if (operation.cost) {
            opBreakdown.totalCost += operation.cost;
        }
        opBreakdown.errorRate = operation.success ? opBreakdown.errorRate :
            (opBreakdown.errorRate + 1) / opBreakdown.count;
        // Update aggregated metrics
        if (operation.duration) {
            metrics.averageResponseTime = (metrics.averageResponseTime + operation.duration) / 2;
        }
        if (operation.tokensUsed) {
            metrics.totalTokensUsed += operation.tokensUsed;
        }
        if (operation.cost) {
            metrics.totalCost += operation.cost;
        }
        metrics.lastUpdated = new Date();
        this.serviceMetrics.set(service, metrics);
    };
    AIMetricsCollector.prototype.updateAllServiceMetrics = function () {
        var _loop_1 = function (serviceName, metrics) {
            var serviceOperations = this_1.metricsHistory
                .filter(function (op) { return op.service === serviceName && op.duration !== undefined; })
                .map(function (op) { return op.duration; })
                .sort(function (a, b) { return a - b; });
            if (serviceOperations.length > 0) {
                metrics.medianResponseTime = this_1.calculatePercentile(serviceOperations, 50);
                metrics.p95ResponseTime = this_1.calculatePercentile(serviceOperations, 95);
                metrics.p99ResponseTime = this_1.calculatePercentile(serviceOperations, 99);
            }
            // Calculate cache hit rate
            var serviceOps = this_1.metricsHistory.filter(function (op) { return op.service === serviceName; });
            var cacheHits = serviceOps.filter(function (op) { return op.cacheHit; }).length;
            metrics.cacheHitRate = serviceOps.length > 0 ? cacheHits / serviceOps.length : 0;
            // Calculate average retry count
            var retriedOps = serviceOps.filter(function (op) { return op.retryCount !== undefined; });
            metrics.averageRetryCount = retriedOps.length > 0
                ? retriedOps.reduce(function (sum, op) { return sum + (op.retryCount || 0); }, 0) / retriedOps.length
                : 0;
        };
        var this_1 = this;
        // Recalculate percentiles and other complex metrics
        for (var _i = 0, _a = this.serviceMetrics.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], serviceName = _b[0], metrics = _b[1];
            _loop_1(serviceName, metrics);
        }
    };
    AIMetricsCollector.prototype.calculatePercentile = function (sortedArray, percentile) {
        var index = (percentile / 100) * (sortedArray.length - 1);
        var lower = Math.floor(index);
        var upper = Math.ceil(index);
        if (lower === upper) {
            return sortedArray[lower];
        }
        return sortedArray[lower] + (sortedArray[upper] - sortedArray[lower]) * (index - lower);
    };
    AIMetricsCollector.prototype.getOperationsInTimeRange = function (start, end) {
        var startTime = start.getTime();
        var endTime = end.getTime();
        return Array.from(this.operations.values())
            .concat(this.metricsHistory)
            .filter(function (op) { return op.startTime >= startTime && op.startTime <= endTime; });
    };
    AIMetricsCollector.prototype.calculateDailyUsage = function (operations, days) {
        var dailyData = new Map();
        // Initialize all days
        for (var i = 0; i < days; i++) {
            var date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
            var dateStr = date.toISOString().split('T')[0];
            dailyData.set(dateStr, { operations: 0, cost: 0, tokensUsed: 0, errors: 0 });
        }
        // Aggregate operations by day
        for (var _i = 0, operations_2 = operations; _i < operations_2.length; _i++) {
            var op = operations_2[_i];
            var date = new Date(op.startTime).toISOString().split('T')[0];
            var dayData = dailyData.get(date);
            if (dayData) {
                dayData.operations++;
                dayData.cost += op.cost || 0;
                dayData.tokensUsed += op.tokensUsed || 0;
                if (!op.success)
                    dayData.errors++;
            }
        }
        return Array.from(dailyData.entries()).map(function (_a) {
            var date = _a[0], data = _a[1];
            return ({
                date: date,
                operations: data.operations,
                cost: data.cost,
                tokensUsed: data.tokensUsed,
                errorRate: data.operations > 0 ? data.errors / data.operations : 0
            });
        }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    };
    AIMetricsCollector.prototype.calculateHourlyUsage = function (operations) {
        var hourlyData = new Map();
        // Initialize all hours
        for (var i = 0; i < 24; i++) {
            hourlyData.set(i, { operations: 0, totalTime: 0 });
        }
        // Aggregate operations by hour
        var last24Hours = Date.now() - (24 * 60 * 60 * 1000);
        for (var _i = 0, operations_3 = operations; _i < operations_3.length; _i++) {
            var op = operations_3[_i];
            if (op.startTime >= last24Hours) {
                var hour = new Date(op.startTime).getHours();
                var hourData = hourlyData.get(hour);
                hourData.operations++;
                hourData.totalTime += op.duration || 0;
            }
        }
        return Array.from(hourlyData.entries()).map(function (_a) {
            var hour = _a[0], data = _a[1];
            return ({
                hour: hour,
                operations: data.operations,
                averageResponseTime: data.operations > 0 ? data.totalTime / data.operations : 0
            });
        });
    };
    AIMetricsCollector.prototype.calculateServiceUsage = function (operations) {
        var serviceData = new Map();
        for (var _i = 0, operations_4 = operations; _i < operations_4.length; _i++) {
            var op = operations_4[_i];
            if (!serviceData.has(op.service)) {
                serviceData.set(op.service, { operations: 0, cost: 0 });
            }
            var data = serviceData.get(op.service);
            data.operations++;
            data.cost += op.cost || 0;
        }
        var totalOperations = operations.length;
        return Array.from(serviceData.entries()).map(function (_a) {
            var service = _a[0], data = _a[1];
            return ({
                service: service,
                percentage: totalOperations > 0 ? (data.operations / totalOperations) * 100 : 0,
                operations: data.operations,
                cost: data.cost
            });
        }).sort(function (a, b) { return b.operations - a.operations; });
    };
    AIMetricsCollector.prototype.calculateTopOperations = function (operations) {
        var operationData = new Map();
        for (var _i = 0, operations_5 = operations; _i < operations_5.length; _i++) {
            var op = operations_5[_i];
            var key = "".concat(op.service, ":").concat(op.operation);
            if (!operationData.has(key)) {
                operationData.set(key, {
                    service: op.service,
                    operation: op.operation,
                    count: 0,
                    totalTime: 0
                });
            }
            var data = operationData.get(key);
            data.count++;
            data.totalTime += op.duration || 0;
        }
        return Array.from(operationData.values())
            .map(function (data) { return ({
            operation: data.operation,
            service: data.service,
            count: data.count,
            totalTime: data.totalTime,
            averageTime: data.count > 0 ? data.totalTime / data.count : 0
        }); })
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, 10);
    };
    AIMetricsCollector.prototype.calculateErrorAnalysis = function (operations) {
        var errorData = new Map();
        for (var _i = 0, operations_6 = operations; _i < operations_6.length; _i++) {
            var op = operations_6[_i];
            if (!op.success && op.error) {
                if (!errorData.has(op.error)) {
                    errorData.set(op.error, {
                        error: op.error,
                        count: 0,
                        services: new Set(),
                        lastOccurrence: new Date(op.startTime)
                    });
                }
                var data = errorData.get(op.error);
                data.count++;
                data.services.add(op.service);
                if (op.startTime > data.lastOccurrence.getTime()) {
                    data.lastOccurrence = new Date(op.startTime);
                }
            }
        }
        return Array.from(errorData.values())
            .map(function (data) { return ({
            error: data.error,
            count: data.count,
            services: Array.from(data.services),
            lastOccurrence: data.lastOccurrence
        }); })
            .sort(function (a, b) { return b.count - a.count; });
    };
    AIMetricsCollector.prototype.convertToCSV = function (data) {
        // Simple CSV conversion for metrics export
        var lines = ['timestamp,service,operation,success,duration,cost,tokensUsed'];
        for (var _i = 0, _a = data.rawOperations; _i < _a.length; _i++) {
            var op = _a[_i];
            lines.push([
                new Date(op.startTime).toISOString(),
                op.service,
                op.operation,
                op.success,
                op.duration || '',
                op.cost || '',
                op.tokensUsed || ''
            ].join(','));
        }
        return lines.join('\n');
    };
    /**
     * Cleanup resources
     */
    AIMetricsCollector.prototype.destroy = function () {
        if (this.metricsUpdateInterval) {
            clearInterval(this.metricsUpdateInterval);
            this.metricsUpdateInterval = null;
        }
        this.operations.clear();
        this.serviceMetrics.clear();
        this.metricsHistory = [];
        logger_1.logger.info('AI Metrics Collector destroyed', {
            module: 'AIMetricsCollector'
        });
    };
    return AIMetricsCollector;
}());
exports.AIMetricsCollector = AIMetricsCollector;
// Export singleton instance
exports.aiMetricsCollector = AIMetricsCollector.getInstance();
