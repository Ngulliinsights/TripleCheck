"use strict";
/**
 * Monitoring Module Index
 * Exports all monitoring-related components and services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApiResponseTimeMonitoring = exports.useConnectionMonitoring = exports.usePerformanceMetrics = exports.useEndpointHealth = exports.useSystemHealth = exports.healthCheckService = exports.MonitoringPage = exports.HealthDashboard = void 0;
// Components
var HealthDashboard_1 = require("./components/HealthDashboard");
Object.defineProperty(exports, "HealthDashboard", { enumerable: true, get: function () { return HealthDashboard_1.HealthDashboard; } });
// Pages
var MonitoringPage_1 = require("./pages/MonitoringPage");
Object.defineProperty(exports, "MonitoringPage", { enumerable: true, get: function () { return MonitoringPage_1.MonitoringPage; } });
// Services
var HealthCheckService_1 = require("../local/services/HealthCheckService");
Object.defineProperty(exports, "healthCheckService", { enumerable: true, get: function () { return HealthCheckService_1.default; } });
// Hooks
var useHealthMonitoring_1 = require("../local/hooks/useHealthMonitoring");
Object.defineProperty(exports, "useSystemHealth", { enumerable: true, get: function () { return useHealthMonitoring_1.useSystemHealth; } });
Object.defineProperty(exports, "useEndpointHealth", { enumerable: true, get: function () { return useHealthMonitoring_1.useEndpointHealth; } });
Object.defineProperty(exports, "usePerformanceMetrics", { enumerable: true, get: function () { return useHealthMonitoring_1.usePerformanceMetrics; } });
Object.defineProperty(exports, "useConnectionMonitoring", { enumerable: true, get: function () { return useHealthMonitoring_1.useConnectionMonitoring; } });
Object.defineProperty(exports, "useApiResponseTimeMonitoring", { enumerable: true, get: function () { return useHealthMonitoring_1.useApiResponseTimeMonitoring; } });
