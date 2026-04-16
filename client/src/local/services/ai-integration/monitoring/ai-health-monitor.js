"use strict";
/**
 * AI Health Monitor
 *
 * Comprehensive health monitoring system for AI services including
 * service availability, performance thresholds, and automated alerting.
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
exports.aiHealthMonitor = exports.AIHealthMonitor = void 0;
var logger_1 = require("../../../../../server/infrastructure/monitoring/logger");
var base_error_1 = require("../../../error-handling/errors/base-error");
var error_categories_1 = require("../../../error-handling/constants/error-categories");
var ai_metrics_collector_1 = require("./ai-metrics-collector");
var AIHealthMonitorError = /** @class */ (function (_super) {
    __extends(AIHealthMonitorError, _super);
    function AIHealthMonitorError(message, operation, cause) {
        return _super.call(this, 'AI_HEALTH_MONITOR_ERROR', message, 500, error_categories_1.ErrorCategory.SYSTEM, {
            severity: base_error_1.ErrorSeverity.MEDIUM,
            cause: cause,
            details: { operation: operation }
        }) || this;
    }
    return AIHealthMonitorError;
}(base_error_1.AppError));
var AIHealthMonitor = /** @class */ (function () {
    function AIHealthMonitor(config) {
        this.healthChecks = new Map();
        this.alerts = new Map();
        this.consecutiveFailures = new Map();
        this.monitoringInterval = null;
        this.startTime = Date.now();
        this.config = __assign({ enabled: true, checkInterval: 60000, alerting: {
                enabled: true
            }, thresholds: {
                default: {
                    maxResponseTime: 5000,
                    maxErrorRate: 0.1,
                    minSuccessRate: 0.9,
                    maxConsecutiveFailures: 3,
                    healthCheckInterval: 60000,
                    degradedThreshold: 0.05,
                    unhealthyThreshold: 0.15
                },
                services: {}
            }, retentionPeriod: 24 }, config);
        if (this.config.enabled) {
            this.startMonitoring();
        }
        logger_1.logger.info('AI Health Monitor initialized', {
            module: 'AIHealthMonitor',
            config: this.config
        });
    }
    AIHealthMonitor.getInstance = function (config) {
        if (!AIHealthMonitor.instance) {
            AIHealthMonitor.instance = new AIHealthMonitor(config);
        }
        return AIHealthMonitor.instance;
    };
    /**
     * Perform health check for a specific service
     */
    AIHealthMonitor.prototype.checkServiceHealth = function (service) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, thresholds, metrics, status_1, details, responseTime, result, error_1, responseTime, errorMessage, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        thresholds = this.getServiceThresholds(service);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 5]);
                        logger_1.logger.debug('Performing health check', {
                            module: 'AIHealthMonitor',
                            service: service
                        });
                        metrics = ai_metrics_collector_1.aiMetricsCollector.getServiceMetrics(service);
                        status_1 = 'unknown';
                        details = {};
                        if (metrics) {
                            // Determine status based on metrics and thresholds
                            status_1 = this.determineServiceStatus(metrics, thresholds);
                            details = {
                                errorRate: metrics.errorRate,
                                successRate: metrics.successRate,
                                averageResponseTime: metrics.averageResponseTime,
                                totalOperations: metrics.totalOperations,
                                lastUpdated: metrics.lastUpdated
                            };
                        }
                        else {
                            // No metrics available - service might not be used yet
                            status_1 = 'unknown';
                            details = { reason: 'No metrics available' };
                        }
                        responseTime = Date.now() - startTime;
                        result = {
                            service: service,
                            status: status_1,
                            responseTime: responseTime,
                            lastCheck: new Date(),
                            details: details
                        };
                        // Update consecutive failures counter
                        if (status_1 === 'unhealthy') {
                            this.consecutiveFailures.set(service, (this.consecutiveFailures.get(service) || 0) + 1);
                        }
                        else {
                            this.consecutiveFailures.set(service, 0);
                        }
                        // Check for alerts
                        return [4 /*yield*/, this.checkForAlerts(service, result, metrics || undefined)];
                    case 2:
                        // Check for alerts
                        _a.sent();
                        this.healthChecks.set(service, result);
                        logger_1.logger.debug('Health check completed', {
                            module: 'AIHealthMonitor',
                            service: service,
                            status: status_1,
                            responseTime: responseTime,
                            errorRate: details.errorRate
                        });
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        responseTime = Date.now() - startTime;
                        errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
                        result = {
                            service: service,
                            status: 'unhealthy',
                            responseTime: responseTime,
                            lastCheck: new Date(),
                            error: errorMessage,
                            details: { checkFailed: true }
                        };
                        this.consecutiveFailures.set(service, (this.consecutiveFailures.get(service) || 0) + 1);
                        this.healthChecks.set(service, result);
                        // Create critical alert for health check failure
                        return [4 /*yield*/, this.createAlert(service, 'critical', "Health check failed: ".concat(errorMessage), {
                                error: errorMessage,
                                responseTime: responseTime
                            })];
                    case 4:
                        // Create critical alert for health check failure
                        _a.sent();
                        logger_1.logger.error('Health check failed', {
                            module: 'AIHealthMonitor',
                            service: service,
                            error: errorMessage,
                            responseTime: responseTime
                        });
                        return [2 /*return*/, result];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get current system health status
     */
    AIHealthMonitor.prototype.getSystemHealthStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var services, alerts, serviceStatuses, overallStatus, totalServices, healthyServices, degradedServices, unhealthyServices;
            return __generator(this, function (_a) {
                services = Object.fromEntries(this.healthChecks.entries());
                alerts = Array.from(this.alerts.values()).filter(function (alert) { return !alert.resolved; });
                serviceStatuses = Array.from(this.healthChecks.values()).map(function (check) { return check.status; });
                overallStatus = this.calculateOverallStatus(serviceStatuses);
                totalServices = serviceStatuses.length;
                healthyServices = serviceStatuses.filter(function (s) { return s === 'healthy'; }).length;
                degradedServices = serviceStatuses.filter(function (s) { return s === 'degraded'; }).length;
                unhealthyServices = serviceStatuses.filter(function (s) { return s === 'unhealthy'; }).length;
                return [2 /*return*/, {
                        overallStatus: overallStatus,
                        services: services,
                        alerts: alerts,
                        lastUpdate: new Date(),
                        uptime: Date.now() - this.startTime,
                        systemMetrics: {
                            totalServices: totalServices,
                            healthyServices: healthyServices,
                            degradedServices: degradedServices,
                            unhealthyServices: unhealthyServices
                        }
                    }];
            });
        });
    };
    /**
     * Get health history for a service
     */
    AIHealthMonitor.prototype.getServiceHealthHistory = function (service, hours) {
        if (hours === void 0) { hours = 24; }
        // In a real implementation, this would query a database
        // For now, return current status
        var current = this.healthChecks.get(service);
        return current ? [current] : [];
    };
    /**
     * Get active alerts
     */
    AIHealthMonitor.prototype.getActiveAlerts = function () {
        return Array.from(this.alerts.values()).filter(function (alert) { return !alert.resolved; });
    };
    /**
     * Resolve an alert
     */
    AIHealthMonitor.prototype.resolveAlert = function (alertId, resolvedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var alert;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        alert = this.alerts.get(alertId);
                        if (!alert) {
                            throw new AIHealthMonitorError("Alert not found: ".concat(alertId), 'resolveAlert');
                        }
                        alert.resolved = true;
                        alert.resolvedAt = new Date();
                        if (resolvedBy) {
                            alert.metadata = __assign(__assign({}, alert.metadata), { resolvedBy: resolvedBy });
                        }
                        this.alerts.set(alertId, alert);
                        logger_1.logger.info('Alert resolved', {
                            module: 'AIHealthMonitor',
                            alertId: alertId,
                            service: alert.service,
                            resolvedBy: resolvedBy
                        });
                        if (!this.config.alerting.enabled) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.sendAlertNotification(alert, 'resolved')];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a manual alert
     */
    AIHealthMonitor.prototype.createManualAlert = function (service, severity, message, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createAlert(service, severity, message, metadata)];
            });
        });
    };
    /**
     * Update health monitor configuration
     */
    AIHealthMonitor.prototype.updateConfig = function (newConfig) {
        this.config = __assign(__assign({}, this.config), newConfig);
        if (this.config.enabled && !this.monitoringInterval) {
            this.startMonitoring();
        }
        else if (!this.config.enabled && this.monitoringInterval) {
            this.stopMonitoring();
        }
        logger_1.logger.info('Health monitor configuration updated', {
            module: 'AIHealthMonitor',
            config: this.config
        });
    };
    /**
     * Export health data for analysis
     */
    AIHealthMonitor.prototype.exportHealthData = function () {
        return {
            healthChecks: Array.from(this.healthChecks.values()),
            alerts: Array.from(this.alerts.values()),
            systemStatus: this.getSystemHealthStatus(), // Will be resolved
            exportTime: new Date()
        };
    };
    // Private helper methods
    AIHealthMonitor.prototype.startMonitoring = function () {
        var _this = this;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.monitoringInterval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.performScheduledHealthChecks()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }, this.config.checkInterval);
        logger_1.logger.info('Health monitoring started', {
            module: 'AIHealthMonitor',
            interval: this.config.checkInterval
        });
    };
    AIHealthMonitor.prototype.stopMonitoring = function () {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        logger_1.logger.info('Health monitoring stopped', {
            module: 'AIHealthMonitor'
        });
    };
    AIHealthMonitor.prototype.performScheduledHealthChecks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var systemMetrics, services, additionalServices, _i, additionalServices_1, service, healthCheckPromises, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        systemMetrics = ai_metrics_collector_1.aiMetricsCollector.getSystemMetrics();
                        services = Object.keys(systemMetrics.services);
                        additionalServices = ['propertyAnalysis', 'documentProcessing', 'fraudDetection', 'recommendations'];
                        for (_i = 0, additionalServices_1 = additionalServices; _i < additionalServices_1.length; _i++) {
                            service = additionalServices_1[_i];
                            if (!services.includes(service)) {
                                services.push(service);
                            }
                        }
                        healthCheckPromises = services.map(function (service) {
                            return _this.checkServiceHealth(service).catch(function (error) {
                                logger_1.logger.error('Scheduled health check failed', {
                                    module: 'AIHealthMonitor',
                                    service: service,
                                    error: error instanceof Error ? error.message : String(error)
                                });
                            });
                        });
                        return [4 /*yield*/, Promise.all(healthCheckPromises)];
                    case 1:
                        _a.sent();
                        // Clean up old alerts
                        this.cleanupOldAlerts();
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error('Scheduled health checks failed', {
                            module: 'AIHealthMonitor',
                            error: error_2 instanceof Error ? error_2.message : String(error_2)
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AIHealthMonitor.prototype.getServiceThresholds = function (service) {
        var serviceSpecific = this.config.thresholds.services[service] || {};
        return __assign(__assign({}, this.config.thresholds.default), serviceSpecific);
    };
    AIHealthMonitor.prototype.determineServiceStatus = function (metrics, thresholds) {
        // Check for unhealthy conditions
        if (metrics.errorRate > thresholds.unhealthyThreshold ||
            metrics.successRate < thresholds.minSuccessRate ||
            metrics.averageResponseTime > thresholds.maxResponseTime) {
            return 'unhealthy';
        }
        // Check for degraded conditions
        if (metrics.errorRate > thresholds.degradedThreshold ||
            metrics.averageResponseTime > (thresholds.maxResponseTime * 0.8)) {
            return 'degraded';
        }
        return 'healthy';
    };
    AIHealthMonitor.prototype.calculateOverallStatus = function (serviceStatuses) {
        if (serviceStatuses.length === 0)
            return 'healthy';
        var unhealthyCount = serviceStatuses.filter(function (s) { return s === 'unhealthy'; }).length;
        var degradedCount = serviceStatuses.filter(function (s) { return s === 'degraded'; }).length;
        // If any service is unhealthy, system is unhealthy
        if (unhealthyCount > 0)
            return 'unhealthy';
        // If any service is degraded, system is degraded
        if (degradedCount > 0)
            return 'degraded';
        return 'healthy';
    };
    AIHealthMonitor.prototype.checkForAlerts = function (service, healthResult, metrics) {
        return __awaiter(this, void 0, void 0, function () {
            var thresholds, consecutiveFailures;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        thresholds = this.getServiceThresholds(service);
                        consecutiveFailures = this.consecutiveFailures.get(service) || 0;
                        if (!(consecutiveFailures >= thresholds.maxConsecutiveFailures)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.createAlert(service, 'high', "Service has ".concat(consecutiveFailures, " consecutive failures"), { consecutiveFailures: consecutiveFailures, threshold: thresholds.maxConsecutiveFailures })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!metrics) return [3 /*break*/, 8];
                        if (!(metrics.errorRate > thresholds.unhealthyThreshold)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createAlert(service, 'critical', "High error rate: ".concat((metrics.errorRate * 100).toFixed(2), "%"), { errorRate: metrics.errorRate, threshold: thresholds.unhealthyThreshold })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        if (!(metrics.errorRate > thresholds.degradedThreshold)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.createAlert(service, 'medium', "Elevated error rate: ".concat((metrics.errorRate * 100).toFixed(2), "%"), { errorRate: metrics.errorRate, threshold: thresholds.degradedThreshold })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        if (!(metrics.averageResponseTime > thresholds.maxResponseTime)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.createAlert(service, 'high', "Slow response time: ".concat(metrics.averageResponseTime.toFixed(0), "ms"), { responseTime: metrics.averageResponseTime, threshold: thresholds.maxResponseTime })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    AIHealthMonitor.prototype.createAlert = function (service, severity, message, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var alertId, existingAlert, alert;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        alertId = "".concat(service, "_").concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        existingAlert = Array.from(this.alerts.values()).find(function (alert) { return alert.service === service &&
                            alert.message === message &&
                            !alert.resolved &&
                            Date.now() - alert.timestamp.getTime() < 300000; } // 5 minutes
                        );
                        if (existingAlert) {
                            // Don't create duplicate alerts within 5 minutes
                            return [2 /*return*/, existingAlert.id];
                        }
                        alert = {
                            id: alertId,
                            service: service,
                            severity: severity,
                            message: message,
                            timestamp: new Date(),
                            resolved: false,
                            metadata: metadata
                        };
                        this.alerts.set(alertId, alert);
                        logger_1.logger.warn('Health alert created', {
                            module: 'AIHealthMonitor',
                            alertId: alertId,
                            service: service,
                            severity: severity,
                            message: message,
                            metadata: metadata
                        });
                        if (!this.config.alerting.enabled) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.sendAlertNotification(alert, 'created')];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, alertId];
                }
            });
        });
    };
    AIHealthMonitor.prototype.sendAlertNotification = function (alert, action) {
        return __awaiter(this, void 0, void 0, function () {
            var notification;
            return __generator(this, function (_a) {
                try {
                    notification = {
                        alertId: alert.id,
                        service: alert.service,
                        severity: alert.severity,
                        message: alert.message,
                        action: action,
                        timestamp: alert.timestamp,
                        metadata: alert.metadata
                    };
                    // In a real implementation, this would send to configured channels
                    // For now, just log the notification
                    logger_1.logger.info('Alert notification sent', {
                        module: 'AIHealthMonitor',
                        notification: notification
                    });
                    // TODO: Implement actual notification sending
                    // - Webhook
                    // - Email
                    // - Slack
                    // - SMS for critical alerts
                }
                catch (error) {
                    logger_1.logger.error('Failed to send alert notification', {
                        module: 'AIHealthMonitor',
                        alertId: alert.id,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    AIHealthMonitor.prototype.cleanupOldAlerts = function () {
        var cutoffTime = Date.now() - (this.config.retentionPeriod * 60 * 60 * 1000);
        for (var _i = 0, _a = this.alerts.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], alertId = _b[0], alert_1 = _b[1];
            if (alert_1.resolved && alert_1.resolvedAt && alert_1.resolvedAt.getTime() < cutoffTime) {
                this.alerts.delete(alertId);
            }
        }
    };
    /**
     * Cleanup resources
     */
    AIHealthMonitor.prototype.destroy = function () {
        this.stopMonitoring();
        this.healthChecks.clear();
        this.alerts.clear();
        this.consecutiveFailures.clear();
        logger_1.logger.info('AI Health Monitor destroyed', {
            module: 'AIHealthMonitor'
        });
    };
    return AIHealthMonitor;
}());
exports.AIHealthMonitor = AIHealthMonitor;
// Export singleton instance
exports.aiHealthMonitor = AIHealthMonitor.getInstance();
