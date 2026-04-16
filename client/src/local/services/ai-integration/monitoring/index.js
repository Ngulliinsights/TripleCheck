"use strict";
/**
 * AI Monitoring and Testing Suite
 *
 * Comprehensive monitoring, testing, and analytics system for AI services.
 * Provides metrics collection, health monitoring, performance dashboards,
 * and comprehensive testing capabilities.
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
exports.aiPerformanceDashboard = exports.AIPerformanceDashboard = exports.aiHealthMonitor = exports.AIHealthMonitor = exports.aiMetricsCollector = exports.AIMetricsCollector = void 0;
exports.initializeAIMonitoring = initializeAIMonitoring;
exports.getAISystemStatus = getAISystemStatus;
exports.quickAIHealthCheck = quickAIHealthCheck;
exports.exportAllMonitoringData = exportAllMonitoringData;
exports.cleanupAIMonitoring = cleanupAIMonitoring;
// Import types and instances for use in this file
var ai_metrics_collector_1 = require("./ai-metrics-collector");
Object.defineProperty(exports, "AIMetricsCollector", { enumerable: true, get: function () { return ai_metrics_collector_1.AIMetricsCollector; } });
Object.defineProperty(exports, "aiMetricsCollector", { enumerable: true, get: function () { return ai_metrics_collector_1.aiMetricsCollector; } });
var ai_health_monitor_1 = require("./ai-health-monitor");
Object.defineProperty(exports, "AIHealthMonitor", { enumerable: true, get: function () { return ai_health_monitor_1.AIHealthMonitor; } });
Object.defineProperty(exports, "aiHealthMonitor", { enumerable: true, get: function () { return ai_health_monitor_1.aiHealthMonitor; } });
var ai_performance_dashboard_1 = require("./ai-performance-dashboard");
Object.defineProperty(exports, "AIPerformanceDashboard", { enumerable: true, get: function () { return ai_performance_dashboard_1.AIPerformanceDashboard; } });
Object.defineProperty(exports, "aiPerformanceDashboard", { enumerable: true, get: function () { return ai_performance_dashboard_1.aiPerformanceDashboard; } });
// Testing Suite
// export {
//   AITestSuite,
//   aiTestUtils,
//   type AITestConfig,
//   type AITestResult,
//   type AITestSuiteReport
// } from '../__tests__/ai-test-suite' // File doesn't exist
// Comprehensive Test Runner
// export {
//   ComprehensiveAITestRunner,
//   type ComprehensiveTestConfig,
//   type ComprehensiveTestReport
// } from '../__tests__/comprehensive-ai-test-runner' // File doesn't exist
/**
 * Initialize all monitoring systems
 */
function initializeAIMonitoring(config) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, metrics, _c, health, _d, dashboard, systems;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _a = config || {}, _b = _a.metrics, metrics = _b === void 0 ? true : _b, _c = _a.health, health = _c === void 0 ? true : _c, _d = _a.dashboard, dashboard = _d === void 0 ? true : _d;
                    systems = {
                        metricsCollector: ai_metrics_collector_1.aiMetricsCollector,
                        healthMonitor: ai_health_monitor_1.aiHealthMonitor,
                        performanceDashboard: ai_performance_dashboard_1.aiPerformanceDashboard
                    };
                    if (!health) return [3 /*break*/, 2];
                    // Perform initial health checks
                    return [4 /*yield*/, ai_health_monitor_1.aiHealthMonitor.getSystemHealthStatus()];
                case 1:
                    // Perform initial health checks
                    _e.sent();
                    _e.label = 2;
                case 2:
                    if (!dashboard) return [3 /*break*/, 4];
                    // Get initial dashboard metrics
                    return [4 /*yield*/, ai_performance_dashboard_1.aiPerformanceDashboard.getCurrentMetrics()];
                case 3:
                    // Get initial dashboard metrics
                    _e.sent();
                    _e.label = 4;
                case 4: return [2 /*return*/, systems];
            }
        });
    });
}
/**
 * Get comprehensive AI system status
 */
function getAISystemStatus() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, health, metrics, dashboard;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        ai_health_monitor_1.aiHealthMonitor.getSystemHealthStatus(),
                        Promise.resolve(ai_metrics_collector_1.aiMetricsCollector.getSystemMetrics()),
                        ai_performance_dashboard_1.aiPerformanceDashboard.getCurrentMetrics()
                    ])];
                case 1:
                    _a = _b.sent(), health = _a[0], metrics = _a[1], dashboard = _a[2];
                    return [2 /*return*/, {
                            health: health,
                            metrics: metrics,
                            dashboard: dashboard,
                            timestamp: new Date()
                        }];
            }
        });
    });
}
/**
 * Run quick AI system health check
 */
function quickAIHealthCheck() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, healthStatus, systemMetrics, healthy, issues, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            ai_health_monitor_1.aiHealthMonitor.getSystemHealthStatus(),
                            Promise.resolve(ai_metrics_collector_1.aiMetricsCollector.getSystemMetrics())
                        ])];
                case 1:
                    _a = _b.sent(), healthStatus = _a[0], systemMetrics = _a[1];
                    healthy = healthStatus.overallStatus === 'healthy';
                    issues = [];
                    if (healthStatus.overallStatus !== 'healthy') {
                        issues.push("System status: ".concat(healthStatus.overallStatus));
                    }
                    if (healthStatus.alerts.length > 0) {
                        issues.push("".concat(healthStatus.alerts.length, " active alerts"));
                    }
                    if (systemMetrics.overallErrorRate > 0.1) {
                        issues.push("High error rate: ".concat((systemMetrics.overallErrorRate * 100).toFixed(1), "%"));
                    }
                    return [2 /*return*/, {
                            healthy: healthy,
                            issues: issues,
                            summary: {
                                services: Object.keys(systemMetrics.services).length,
                                healthyServices: Object.values(systemMetrics.servicesStatus).filter(function (s) { return s === 'healthy'; }).length,
                                alerts: healthStatus.alerts.length,
                                uptime: healthStatus.uptime
                            }
                        }];
                case 2:
                    error_1 = _b.sent();
                    return [2 /*return*/, {
                            healthy: false,
                            issues: ["Health check failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1))],
                            summary: {
                                services: 0,
                                healthyServices: 0,
                                alerts: 0,
                                uptime: 0
                            }
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Export all monitoring data for analysis
 */
function exportAllMonitoringData(format) {
    if (format === void 0) { format = 'json'; }
    var timestamp = new Date().toISOString();
    return {
        metrics: ai_metrics_collector_1.aiMetricsCollector.exportMetrics(format),
        dashboard: ai_performance_dashboard_1.aiPerformanceDashboard.exportDashboardData(format),
        health: JSON.stringify(ai_health_monitor_1.aiHealthMonitor.exportHealthData(), null, 2),
        timestamp: timestamp
    };
}
/**
 * Cleanup all monitoring systems
 */
function cleanupAIMonitoring() {
    ai_metrics_collector_1.aiMetricsCollector.destroy();
    ai_health_monitor_1.aiHealthMonitor.destroy();
    ai_performance_dashboard_1.aiPerformanceDashboard.destroy();
}
