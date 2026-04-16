"use strict";
/**
 * Alerting Service
 * Manages system alerts and notifications for monitoring
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
exports.alertingService = void 0;
var AlertingService = /** @class */ (function () {
    function AlertingService() {
        this.alerts = [];
        this.alertRules = [];
        this.alertCallbacks = new Map();
        // Default alert rules
        this.defaultRules = [
            {
                name: 'High Response Time',
                condition: 'response_time > threshold',
                threshold: 5000, // 5 seconds
                severity: 'high',
                enabled: true,
                cooldownMs: 300000 // 5 minutes
            },
            {
                name: 'Service Unhealthy',
                condition: 'health_status == unhealthy',
                threshold: 1,
                severity: 'critical',
                enabled: true,
                cooldownMs: 60000 // 1 minute
            },
            {
                name: 'Low Success Rate',
                condition: 'success_rate < threshold',
                threshold: 95, // 95%
                severity: 'medium',
                enabled: true,
                cooldownMs: 600000 // 10 minutes
            },
            {
                name: 'High Error Rate',
                condition: 'error_rate > threshold',
                threshold: 5, // 5%
                severity: 'high',
                enabled: true,
                cooldownMs: 300000 // 5 minutes
            }
        ];
        this.initializeDefaultRules();
    }
    AlertingService.getInstance = function () {
        if (!AlertingService.instance) {
            AlertingService.instance = new AlertingService();
        }
        return AlertingService.instance;
    };
    AlertingService.prototype.initializeDefaultRules = function () {
        var _this = this;
        this.defaultRules.forEach(function (rule) {
            _this.addAlertRule(__assign(__assign({}, rule), { id: "rule_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)) }));
        });
    };
    /**
     * Create a new alert
     */
    AlertingService.prototype.createAlert = function (type, severity, title, message, source, metadata) {
        var alert = {
            id: "alert_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
            type: type,
            severity: severity,
            title: title,
            message: message,
            source: source,
            timestamp: new Date(),
            resolved: false,
            metadata: metadata
        };
        this.alerts.push(alert);
        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts = this.alerts.slice(-1000);
        }
        // Notify callbacks
        this.alertCallbacks.forEach(function (callback) {
            try {
                callback(alert);
            }
            catch (error) {
                console.error('Error in alert callback:', error);
            }
        });
        // Log alert
        console.warn("[ALERT] ".concat(severity.toUpperCase(), ": ").concat(title, " - ").concat(message), {
            source: source,
            metadata: metadata
        });
        return alert.id;
    };
    /**
     * Resolve an alert
     */
    AlertingService.prototype.resolveAlert = function (alertId) {
        var alert = this.alerts.find(function (a) { return a.id === alertId; });
        if (alert && !alert.resolved) {
            alert.resolved = true;
            alert.resolvedAt = new Date();
            return true;
        }
        return false;
    };
    /**
     * Get all alerts
     */
    AlertingService.prototype.getAlerts = function (filter) {
        var filteredAlerts = __spreadArray([], this.alerts, true);
        if (filter === null || filter === void 0 ? void 0 : filter.type) {
            filteredAlerts = filteredAlerts.filter(function (a) { return a.type === filter.type; });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.severity) {
            filteredAlerts = filteredAlerts.filter(function (a) { return a.severity === filter.severity; });
        }
        if ((filter === null || filter === void 0 ? void 0 : filter.resolved) !== undefined) {
            filteredAlerts = filteredAlerts.filter(function (a) { return a.resolved === filter.resolved; });
        }
        if (filter === null || filter === void 0 ? void 0 : filter.source) {
            filteredAlerts = filteredAlerts.filter(function (a) { return a.source === filter.source; });
        }
        return filteredAlerts.sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); });
    };
    /**
     * Get active (unresolved) alerts
     */
    AlertingService.prototype.getActiveAlerts = function () {
        return this.getAlerts({ resolved: false });
    };
    /**
     * Get alert counts by severity
     */
    AlertingService.prototype.getAlertCounts = function () {
        var activeAlerts = this.getActiveAlerts();
        return {
            low: activeAlerts.filter(function (a) { return a.severity === 'low'; }).length,
            medium: activeAlerts.filter(function (a) { return a.severity === 'medium'; }).length,
            high: activeAlerts.filter(function (a) { return a.severity === 'high'; }).length,
            critical: activeAlerts.filter(function (a) { return a.severity === 'critical'; }).length
        };
    };
    /**
     * Add alert rule
     */
    AlertingService.prototype.addAlertRule = function (rule) {
        this.alertRules.push(rule);
    };
    /**
     * Remove alert rule
     */
    AlertingService.prototype.removeAlertRule = function (ruleId) {
        var index = this.alertRules.findIndex(function (r) { return r.id === ruleId; });
        if (index > -1) {
            this.alertRules.splice(index, 1);
            return true;
        }
        return false;
    };
    /**
     * Update alert rule
     */
    AlertingService.prototype.updateAlertRule = function (ruleId, updates) {
        var rule = this.alertRules.find(function (r) { return r.id === ruleId; });
        if (rule) {
            Object.assign(rule, updates);
            return true;
        }
        return false;
    };
    /**
     * Get all alert rules
     */
    AlertingService.prototype.getAlertRules = function () {
        return __spreadArray([], this.alertRules, true);
    };
    /**
     * Evaluate alert rules against metrics
     */
    AlertingService.prototype.evaluateRules = function (metrics) {
        var _this = this;
        var now = new Date();
        this.alertRules.forEach(function (rule) {
            if (!rule.enabled)
                return;
            // Check cooldown
            if (rule.lastTriggered) {
                var timeSinceLastTrigger = now.getTime() - rule.lastTriggered.getTime();
                if (timeSinceLastTrigger < rule.cooldownMs) {
                    return;
                }
            }
            var shouldTrigger = false;
            var alertTitle = '';
            var alertMessage = '';
            // Evaluate conditions
            switch (rule.condition) {
                case 'response_time > threshold':
                    shouldTrigger = metrics.responseTime > rule.threshold;
                    if (shouldTrigger) {
                        alertTitle = "High Response Time - ".concat(metrics.endpoint);
                        alertMessage = "Response time (".concat(metrics.responseTime, "ms) exceeds threshold (").concat(rule.threshold, "ms)");
                    }
                    break;
                case 'health_status == unhealthy':
                    shouldTrigger = metrics.healthStatus === 'unhealthy';
                    if (shouldTrigger) {
                        alertTitle = "Service Unhealthy - ".concat(metrics.endpoint);
                        alertMessage = "Service health status is unhealthy";
                    }
                    break;
                case 'success_rate < threshold':
                    shouldTrigger = metrics.successRate < rule.threshold;
                    if (shouldTrigger) {
                        alertTitle = "Low Success Rate - ".concat(metrics.endpoint);
                        alertMessage = "Success rate (".concat(metrics.successRate.toFixed(1), "%) is below threshold (").concat(rule.threshold, "%)");
                    }
                    break;
                case 'error_rate > threshold':
                    shouldTrigger = metrics.errorRate > rule.threshold;
                    if (shouldTrigger) {
                        alertTitle = "High Error Rate - ".concat(metrics.endpoint);
                        alertMessage = "Error rate (".concat(metrics.errorRate.toFixed(1), "%) exceeds threshold (").concat(rule.threshold, "%)");
                    }
                    break;
            }
            if (shouldTrigger) {
                _this.createAlert(rule.severity === 'critical' ? 'error' : 'warning', rule.severity, alertTitle, alertMessage, "monitoring.".concat(metrics.endpoint), {
                    rule: rule.name,
                    ruleId: rule.id,
                    metrics: metrics
                });
                rule.lastTriggered = now;
            }
        });
    };
    /**
     * Subscribe to alert notifications
     */
    AlertingService.prototype.onAlert = function (id, callback) {
        this.alertCallbacks.set(id, callback);
    };
    /**
     * Unsubscribe from alert notifications
     */
    AlertingService.prototype.offAlert = function (id) {
        this.alertCallbacks.delete(id);
    };
    /**
     * Clear all alerts
     */
    AlertingService.prototype.clearAlerts = function () {
        this.alerts = [];
    };
    /**
     * Clear resolved alerts older than specified time
     */
    AlertingService.prototype.clearOldAlerts = function (olderThanMs) {
        if (olderThanMs === void 0) { olderThanMs = 7 * 24 * 60 * 60 * 1000; }
        var cutoffTime = new Date(Date.now() - olderThanMs);
        this.alerts = this.alerts.filter(function (alert) {
            return !alert.resolved || alert.timestamp > cutoffTime;
        });
    };
    return AlertingService;
}());
exports.alertingService = AlertingService.getInstance();
exports.default = exports.alertingService;
