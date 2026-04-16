"use strict";
/**
 * AI Performance Dashboard
 *
 * Real-time dashboard for monitoring AI service performance, costs, and health status.
 * Provides comprehensive insights and alerting for AI operations.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiPerformanceDashboard = exports.AIPerformanceDashboard = void 0;
var logger_1 = require("../../../../../server/infrastructure/monitoring/logger");
var base_error_1 = require("../../../error-handling/errors/base-error");
var error_categories_1 = require("../../../error-handling/constants/error-categories");
var ai_metrics_collector_1 = require("./ai-metrics-collector");
var ai_health_monitor_1 = require("./ai-health-monitor");
var AIPerformanceDashboardError = /** @class */ (function (_super) {
    __extends(AIPerformanceDashboardError, _super);
    function AIPerformanceDashboardError(message, operation, cause) {
        return _super.call(this, 'AI_PERFORMANCE_DASHBOARD_ERROR', message, 500, error_categories_1.ErrorCategory.SYSTEM, {
            severity: base_error_1.ErrorSeverity.MEDIUM,
            cause: cause,
            details: { operation: operation }
        }) || this;
    }
    return AIPerformanceDashboardError;
}(base_error_1.AppError));
var AIPerformanceDashboard = /** @class */ (function () {
    function AIPerformanceDashboard(config) {
        this.metricsHistory = [];
        this.recommendations = new Map();
        this.updateInterval = null;
        this.config = __assign({ refreshInterval: 30000, retentionPeriod: 24, alertThresholds: {
                responseTime: 5000, // 5 seconds
                errorRate: 0.1, // 10%
                costIncrease: 0.5, // 50% increase
                usageSpike: 2.0 // 200% of normal
            }, insights: {
                trendAnalysisPeriod: 3600000, // 1 hour
                anomalyDetectionSensitivity: 2.0, // 2 standard deviations
                recommendationEngine: true
            } }, config);
        this.startDashboardUpdates();
        logger_1.logger.info('AI Performance Dashboard initialized', {
            module: 'AIPerformanceDashboard',
            config: this.config
        });
    }
    AIPerformanceDashboard.getInstance = function (config) {
        if (!AIPerformanceDashboard.instance) {
            AIPerformanceDashboard.instance = new AIPerformanceDashboard(config);
        }
        return AIPerformanceDashboard.instance;
    };
    /**
     * Get current dashboard metrics
     */
    AIPerformanceDashboard.prototype.getCurrentMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, systemHealth, systemMetrics, usageAnalytics, costBreakdown, performanceInsights, alerts, recommendations, dashboardMetrics, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                ai_health_monitor_1.aiHealthMonitor.getSystemHealthStatus(),
                                Promise.resolve(ai_metrics_collector_1.aiMetricsCollector.getSystemMetrics()),
                                Promise.resolve(ai_metrics_collector_1.aiMetricsCollector.getUsageAnalytics(7)),
                                Promise.resolve(ai_metrics_collector_1.aiMetricsCollector.getCostBreakdown())
                            ])];
                    case 1:
                        _a = _b.sent(), systemHealth = _a[0], systemMetrics = _a[1], usageAnalytics = _a[2], costBreakdown = _a[3];
                        performanceInsights = this.generatePerformanceInsights(systemMetrics, usageAnalytics);
                        alerts = ai_health_monitor_1.aiHealthMonitor.getActiveAlerts();
                        recommendations = this.generateRecommendations(systemMetrics, usageAnalytics, performanceInsights);
                        dashboardMetrics = {
                            timestamp: new Date(),
                            systemHealth: systemHealth,
                            systemMetrics: systemMetrics,
                            usageAnalytics: usageAnalytics,
                            costBreakdown: costBreakdown,
                            performanceInsights: performanceInsights,
                            alerts: alerts,
                            recommendations: recommendations
                        };
                        // Store in history
                        this.addToHistory(dashboardMetrics);
                        return [2 /*return*/, dashboardMetrics];
                    case 2:
                        error_1 = _b.sent();
                        logger_1.logger.error('Failed to get current dashboard metrics', {
                            module: 'AIPerformanceDashboard',
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        });
                        throw new AIPerformanceDashboardError('Failed to get current dashboard metrics', 'getCurrentMetrics', error_1 instanceof Error ? error_1 : new Error(String(error_1)));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get dashboard metrics history
     */
    AIPerformanceDashboard.prototype.getMetricsHistory = function (hours) {
        if (hours === void 0) { hours = 24; }
        var cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        return this.metricsHistory.filter(function (metrics) { return metrics.timestamp.getTime() >= cutoffTime; });
    };
    /**
     * Get performance trends over time
     */
    AIPerformanceDashboard.prototype.getPerformanceTrends = function (hours) {
        if (hours === void 0) { hours = 24; }
        var history = this.getMetricsHistory(hours);
        return {
            responseTime: history.map(function (h) { return ({
                timestamp: h.timestamp,
                value: h.systemMetrics.averageResponseTime
            }); }),
            errorRate: history.map(function (h) { return ({
                timestamp: h.timestamp,
                value: h.systemMetrics.overallErrorRate
            }); }),
            cost: history.map(function (h) { return ({
                timestamp: h.timestamp,
                value: h.systemMetrics.totalCost
            }); }),
            usage: history.map(function (h) { return ({
                timestamp: h.timestamp,
                value: h.systemMetrics.totalOperations
            }); })
        };
    };
    /**
     * Get service-specific performance data
     */
    AIPerformanceDashboard.prototype.getServicePerformance = function (service) {
        var systemMetrics = ai_metrics_collector_1.aiMetricsCollector.getSystemMetrics();
        var serviceMetrics = systemMetrics.services[service];
        var serviceRecommendations = Array.from(this.recommendations.values())
            .filter(function (rec) { return rec.description.toLowerCase().includes(service.toLowerCase()); });
        var history = this.getMetricsHistory(24);
        var serviceTrends = {
            responseTime: history.map(function (h) {
                var _a;
                return ({
                    timestamp: h.timestamp,
                    value: ((_a = h.systemMetrics.services[service]) === null || _a === void 0 ? void 0 : _a.averageResponseTime) || 0
                });
            }),
            errorRate: history.map(function (h) {
                var _a;
                return ({
                    timestamp: h.timestamp,
                    value: ((_a = h.systemMetrics.services[service]) === null || _a === void 0 ? void 0 : _a.errorRate) || 0
                });
            })
        };
        return {
            currentMetrics: serviceMetrics,
            trends: serviceTrends,
            recommendations: serviceRecommendations
        };
    };
    /**
     * Get cost analysis and projections
     */
    AIPerformanceDashboard.prototype.getCostAnalysis = function () {
        var costBreakdown = ai_metrics_collector_1.aiMetricsCollector.getCostBreakdown();
        var history = this.getMetricsHistory(168); // 7 days
        // Simple cost projection based on recent trends
        var recentCosts = history.slice(-24).map(function (h) { return h.systemMetrics.totalCost; }); // Last 24 hours
        var averageHourlyCost = recentCosts.length > 0
            ? recentCosts.reduce(function (sum, cost) { return sum + cost; }, 0) / recentCosts.length
            : 0;
        var projections = [
            {
                period: 'Next 24 hours',
                projectedCost: averageHourlyCost * 24,
                confidence: 0.8
            },
            {
                period: 'Next 7 days',
                projectedCost: averageHourlyCost * 24 * 7,
                confidence: 0.6
            },
            {
                period: 'Next 30 days',
                projectedCost: averageHourlyCost * 24 * 30,
                confidence: 0.4
            }
        ];
        var optimizations = [
            {
                description: 'Implement intelligent caching to reduce API calls',
                potentialSavings: averageHourlyCost * 24 * 0.3, // 30% savings
                implementationEffort: 'Medium'
            },
            {
                description: 'Optimize batch processing for document analysis',
                potentialSavings: averageHourlyCost * 24 * 0.2, // 20% savings
                implementationEffort: 'Low'
            },
            {
                description: 'Use smaller models for simple operations',
                potentialSavings: averageHourlyCost * 24 * 0.15, // 15% savings
                implementationEffort: 'High'
            }
        ];
        return {
            currentCosts: costBreakdown,
            projections: projections,
            optimizations: optimizations
        };
    };
    /**
     * Export dashboard data for reporting
     */
    AIPerformanceDashboard.prototype.exportDashboardData = function (format) {
        if (format === void 0) { format = 'json'; }
        var currentMetrics = this.getCurrentMetrics();
        var history = this.getMetricsHistory(24);
        var trends = this.getPerformanceTrends(24);
        var costAnalysis = this.getCostAnalysis();
        var exportData = {
            exportTimestamp: new Date().toISOString(),
            currentMetrics: currentMetrics,
            history: history,
            trends: trends,
            costAnalysis: costAnalysis,
            summary: {
                totalMetricsPoints: history.length,
                timeRange: {
                    start: history.length > 0 ? history[0].timestamp : new Date(),
                    end: history.length > 0 ? history[history.length - 1].timestamp : new Date()
                }
            }
        };
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        }
        else {
            return this.convertDashboardDataToCSV(exportData);
        }
    };
    // Private helper methods
    AIPerformanceDashboard.prototype.startDashboardUpdates = function () {
        var _this = this;
        this.updateInterval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getCurrentMetrics()];
                    case 1:
                        _a.sent();
                        this.cleanupOldMetrics();
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('Dashboard update failed', {
                            module: 'AIPerformanceDashboard',
                            error: error_2 instanceof Error ? error_2.message : String(error_2)
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); }, this.config.refreshInterval);
    };
    AIPerformanceDashboard.prototype.addToHistory = function (metrics) {
        this.metricsHistory.push(metrics);
        // Keep history size manageable
        var maxHistorySize = Math.ceil((this.config.retentionPeriod * 60 * 60 * 1000) / this.config.refreshInterval);
        if (this.metricsHistory.length > maxHistorySize) {
            this.metricsHistory = this.metricsHistory.slice(-maxHistorySize);
        }
    };
    AIPerformanceDashboard.prototype.generatePerformanceInsights = function (systemMetrics, usageAnalytics) {
        var history = this.getMetricsHistory(this.config.insights.trendAnalysisPeriod / (60 * 60 * 1000));
        // Analyze trends
        var trends = this.analyzeTrends(history);
        // Identify bottlenecks
        var bottlenecks = this.identifyBottlenecks(systemMetrics, usageAnalytics);
        // Generate optimizations
        var optimizations = this.generateOptimizations(systemMetrics, usageAnalytics, trends);
        // Detect anomalies
        var anomalies = this.detectAnomalies(systemMetrics, history);
        return {
            trends: trends,
            bottlenecks: bottlenecks,
            optimizations: optimizations,
            anomalies: anomalies
        };
    };
    AIPerformanceDashboard.prototype.analyzeTrends = function (history) {
        if (history.length < 2) {
            return {
                responseTimetrend: 'stable',
                errorRateTrend: 'stable',
                costTrend: 'stable',
                usageTrend: 'stable'
            };
        }
        var recent = history.slice(-Math.min(10, history.length));
        var older = history.slice(0, Math.min(10, history.length));
        var recentAvgResponseTime = recent.reduce(function (sum, h) { return sum + h.systemMetrics.averageResponseTime; }, 0) / recent.length;
        var olderAvgResponseTime = older.reduce(function (sum, h) { return sum + h.systemMetrics.averageResponseTime; }, 0) / older.length;
        var recentAvgErrorRate = recent.reduce(function (sum, h) { return sum + h.systemMetrics.overallErrorRate; }, 0) / recent.length;
        var olderAvgErrorRate = older.reduce(function (sum, h) { return sum + h.systemMetrics.overallErrorRate; }, 0) / older.length;
        var recentAvgCost = recent.reduce(function (sum, h) { return sum + h.systemMetrics.totalCost; }, 0) / recent.length;
        var olderAvgCost = older.reduce(function (sum, h) { return sum + h.systemMetrics.totalCost; }, 0) / older.length;
        var recentAvgUsage = recent.reduce(function (sum, h) { return sum + h.systemMetrics.totalOperations; }, 0) / recent.length;
        var olderAvgUsage = older.reduce(function (sum, h) { return sum + h.systemMetrics.totalOperations; }, 0) / older.length;
        return {
            responseTimetrend: this.determineTrend(recentAvgResponseTime, olderAvgResponseTime),
            errorRateTrend: this.determineTrend(recentAvgErrorRate, olderAvgErrorRate, true), // Lower is better
            costTrend: this.determineCostTrend(recentAvgCost, olderAvgCost),
            usageTrend: this.determineCostTrend(recentAvgUsage, olderAvgUsage)
        };
    };
    AIPerformanceDashboard.prototype.determineTrend = function (recent, older, lowerIsBetter) {
        if (lowerIsBetter === void 0) { lowerIsBetter = false; }
        var changePercent = older > 0 ? (recent - older) / older : 0;
        var threshold = 0.1; // 10% change threshold
        if (Math.abs(changePercent) < threshold) {
            return 'stable';
        }
        if (lowerIsBetter) {
            return changePercent < 0 ? 'improving' : 'degrading';
        }
        else {
            return changePercent > 0 ? 'improving' : 'degrading';
        }
    };
    AIPerformanceDashboard.prototype.determineCostTrend = function (recent, older) {
        var changePercent = older > 0 ? (recent - older) / older : 0;
        var threshold = 0.1; // 10% change threshold
        if (Math.abs(changePercent) < threshold) {
            return 'stable';
        }
        return changePercent > 0 ? 'increasing' : 'decreasing';
    };
    AIPerformanceDashboard.prototype.identifyBottlenecks = function (systemMetrics, usageAnalytics) {
        var _this = this;
        var bottlenecks = [];
        // Check for slow services
        Object.entries(systemMetrics.services).forEach(function (_a) {
            var service = _a[0], metrics = _a[1];
            if (metrics.averageResponseTime > _this.config.alertThresholds.responseTime) {
                bottlenecks.push({
                    service: service,
                    operation: 'general',
                    issue: "High response time: ".concat(metrics.averageResponseTime.toFixed(0), "ms"),
                    severity: metrics.averageResponseTime > _this.config.alertThresholds.responseTime * 2 ? 'high' : 'medium',
                    impact: 'User experience degradation'
                });
            }
            if (metrics.errorRate > _this.config.alertThresholds.errorRate) {
                bottlenecks.push({
                    service: service,
                    operation: 'general',
                    issue: "High error rate: ".concat((metrics.errorRate * 100).toFixed(1), "%"),
                    severity: metrics.errorRate > _this.config.alertThresholds.errorRate * 2 ? 'high' : 'medium',
                    impact: 'Service reliability issues'
                });
            }
        });
        // Check for expensive operations
        usageAnalytics.topOperations.forEach(function (op) {
            if (op.averageTime > _this.config.alertThresholds.responseTime) {
                bottlenecks.push({
                    service: op.service,
                    operation: op.operation,
                    issue: "Slow operation: ".concat(op.averageTime.toFixed(0), "ms average"),
                    severity: 'medium',
                    impact: 'Performance bottleneck'
                });
            }
        });
        return bottlenecks;
    };
    AIPerformanceDashboard.prototype.generateOptimizations = function (systemMetrics, usageAnalytics, trends) {
        var optimizations = [];
        // Performance optimizations
        if (trends.responseTimetrend === 'degrading') {
            optimizations.push({
                type: 'performance',
                description: 'Implement response time optimization strategies',
                estimatedImpact: '20-30% response time improvement',
                priority: 'high'
            });
        }
        // Cost optimizations
        if (trends.costTrend === 'increasing') {
            optimizations.push({
                type: 'cost',
                description: 'Optimize AI model usage and implement intelligent caching',
                estimatedImpact: '15-25% cost reduction',
                priority: 'medium'
            });
        }
        // Reliability optimizations
        if (systemMetrics.overallErrorRate > 0.05) {
            optimizations.push({
                type: 'reliability',
                description: 'Enhance error handling and retry mechanisms',
                estimatedImpact: '50% error rate reduction',
                priority: 'high'
            });
        }
        // Cache optimization
        var lowCacheHitServices = Object.entries(systemMetrics.services)
            .filter(function (_a) {
            var _ = _a[0], metrics = _a[1];
            return metrics.cacheHitRate < 0.5;
        });
        if (lowCacheHitServices.length > 0) {
            optimizations.push({
                type: 'performance',
                description: "Improve caching strategy for ".concat(lowCacheHitServices.map(function (_a) {
                    var name = _a[0];
                    return name;
                }).join(', ')),
                estimatedImpact: '30-40% response time improvement',
                priority: 'medium'
            });
        }
        return optimizations;
    };
    AIPerformanceDashboard.prototype.detectAnomalies = function (systemMetrics, history) {
        var anomalies = [];
        if (history.length < 10) {
            return anomalies; // Need sufficient history for anomaly detection
        }
        // Analyze response time anomalies
        var responseTimes = history.map(function (h) { return h.systemMetrics.averageResponseTime; });
        var avgResponseTime = responseTimes.reduce(function (sum, time) { return sum + time; }, 0) / responseTimes.length;
        var stdDevResponseTime = Math.sqrt(responseTimes.reduce(function (sum, time) { return sum + Math.pow(time - avgResponseTime, 2); }, 0) / responseTimes.length);
        if (Math.abs(systemMetrics.averageResponseTime - avgResponseTime) >
            stdDevResponseTime * this.config.insights.anomalyDetectionSensitivity) {
            anomalies.push({
                service: 'system',
                metric: 'averageResponseTime',
                currentValue: systemMetrics.averageResponseTime,
                expectedValue: avgResponseTime,
                deviation: Math.abs(systemMetrics.averageResponseTime - avgResponseTime) / stdDevResponseTime,
                timestamp: new Date()
            });
        }
        // Analyze error rate anomalies
        var errorRates = history.map(function (h) { return h.systemMetrics.overallErrorRate; });
        var avgErrorRate = errorRates.reduce(function (sum, rate) { return sum + rate; }, 0) / errorRates.length;
        var stdDevErrorRate = Math.sqrt(errorRates.reduce(function (sum, rate) { return sum + Math.pow(rate - avgErrorRate, 2); }, 0) / errorRates.length);
        if (Math.abs(systemMetrics.overallErrorRate - avgErrorRate) >
            stdDevErrorRate * this.config.insights.anomalyDetectionSensitivity) {
            anomalies.push({
                service: 'system',
                metric: 'errorRate',
                currentValue: systemMetrics.overallErrorRate,
                expectedValue: avgErrorRate,
                deviation: Math.abs(systemMetrics.overallErrorRate - avgErrorRate) / stdDevErrorRate,
                timestamp: new Date()
            });
        }
        return anomalies;
    };
    AIPerformanceDashboard.prototype.generateRecommendations = function (systemMetrics, usageAnalytics, insights) {
        var _this = this;
        if (!this.config.insights.recommendationEngine) {
            return [];
        }
        var recommendations = [];
        // Performance recommendations
        if (insights.trends.responseTimetrend === 'degrading') {
            recommendations.push({
                id: "perf_".concat(Date.now()),
                type: 'performance',
                priority: 'high',
                title: 'Response Time Degradation Detected',
                description: 'System response times are trending upward. Immediate optimization needed.',
                actionItems: [
                    'Review and optimize slow operations',
                    'Implement or improve caching strategies',
                    'Consider scaling resources',
                    'Analyze and fix performance bottlenecks'
                ],
                estimatedImpact: '20-30% response time improvement',
                implementationEffort: 'medium',
                createdAt: new Date()
            });
        }
        // Cost recommendations
        if (systemMetrics.totalCost > 100) { // Arbitrary threshold
            recommendations.push({
                id: "cost_".concat(Date.now()),
                type: 'cost',
                priority: 'medium',
                title: 'Cost Optimization Opportunity',
                description: 'AI service costs are significant. Consider optimization strategies.',
                actionItems: [
                    'Implement intelligent caching to reduce API calls',
                    'Optimize model selection for different use cases',
                    'Review and eliminate unnecessary operations',
                    'Consider batch processing for bulk operations'
                ],
                estimatedImpact: '15-25% cost reduction',
                implementationEffort: 'medium',
                createdAt: new Date()
            });
        }
        // Reliability recommendations
        if (systemMetrics.overallErrorRate > 0.05) {
            recommendations.push({
                id: "rel_".concat(Date.now()),
                type: 'reliability',
                priority: 'high',
                title: 'High Error Rate Detected',
                description: 'System error rate is above acceptable threshold. Reliability improvements needed.',
                actionItems: [
                    'Enhance error handling and retry logic',
                    'Implement circuit breaker patterns',
                    'Add comprehensive monitoring and alerting',
                    'Review and fix common error patterns'
                ],
                estimatedImpact: '50% error rate reduction',
                implementationEffort: 'high',
                createdAt: new Date()
            });
        }
        // Store recommendations
        recommendations.forEach(function (rec) {
            _this.recommendations.set(rec.id, rec);
        });
        return recommendations;
    };
    AIPerformanceDashboard.prototype.convertDashboardDataToCSV = function (data) {
        var lines = ['timestamp,service,metric,value'];
        // Add system metrics over time
        if (data.history) {
            data.history.forEach(function (point) {
                lines.push("".concat(point.timestamp.toISOString(), ",system,responseTime,").concat(point.systemMetrics.averageResponseTime));
                lines.push("".concat(point.timestamp.toISOString(), ",system,errorRate,").concat(point.systemMetrics.overallErrorRate));
                lines.push("".concat(point.timestamp.toISOString(), ",system,totalCost,").concat(point.systemMetrics.totalCost));
                lines.push("".concat(point.timestamp.toISOString(), ",system,totalOperations,").concat(point.systemMetrics.totalOperations));
            });
        }
        return lines.join('\n');
    };
    AIPerformanceDashboard.prototype.cleanupOldMetrics = function () {
        var cutoffTime = Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000);
        this.metricsHistory = this.metricsHistory.filter(function (metrics) { return metrics.timestamp.getTime() >= cutoffTime; });
        // Cleanup old recommendations
        for (var _i = 0, _a = this.recommendations.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], rec = _b[1];
            if (rec.createdAt.getTime() < cutoffTime) {
                this.recommendations.delete(id);
            }
        }
    };
    /**
     * Cleanup resources
     */
    AIPerformanceDashboard.prototype.destroy = function () {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.metricsHistory = [];
        this.recommendations.clear();
        logger_1.logger.info('AI Performance Dashboard destroyed', {
            module: 'AIPerformanceDashboard'
        });
    };
    return AIPerformanceDashboard;
}());
exports.AIPerformanceDashboard = AIPerformanceDashboard;
// Export singleton instance
exports.aiPerformanceDashboard = AIPerformanceDashboard.getInstance();
