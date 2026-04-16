"use strict";
/**
 * Shared Services Index
 *
 * Centralized exports for all shared services in the African Property Trust platform.
 * This provides a single entry point for importing services across the application.
 *
 * Design Philosophy:
 * - Single source of truth for all service imports
 * - Clean separation between service exports and service instances
 * - Integrated error handling and monitoring across all services
 * - Graceful initialization and shutdown patterns
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
exports.ServiceIntegration = exports.performanceMonitor = exports.performanceMonitoringService = exports.securityMonitor = exports.securityMonitoringService = exports.auditLogger = exports.auditTrailService = exports.apiClient = void 0;
// Import each service only once to avoid duplicate identifier errors
var unified_api_client_1 = require("./unified-api-client");
var performance_monitoring_service_1 = require("./performance-monitoring-service");
var security_monitoring_service_1 = require("./security-monitoring-service");
var audit_trail_service_1 = require("./audit-trail-service");
// ============================================================================
// CORE EXPORTS - Module Re-exports
// ============================================================================
// These exports allow other modules to import everything from the service modules
// Example: import { ApiResponse, ApiClient } from '@shared/services'
__exportStar(require("./unified-api-client"), exports);
__exportStar(require("./audit-trail-service"), exports);
__exportStar(require("./security-monitoring-service"), exports);
__exportStar(require("./performance-monitoring-service"), exports);
// ============================================================================
// SERVICE INSTANCE EXPORTS - Singleton References
// ============================================================================
// These exports provide direct access to the configured service instances
// Example: import { apiClient, performanceMonitor } from '@shared/services'
var unified_api_client_2 = require("./unified-api-client");
Object.defineProperty(exports, "apiClient", { enumerable: true, get: function () { return unified_api_client_2.apiClient; } });
var audit_trail_service_2 = require("./audit-trail-service");
Object.defineProperty(exports, "auditTrailService", { enumerable: true, get: function () { return audit_trail_service_2.auditTrailService; } });
Object.defineProperty(exports, "auditLogger", { enumerable: true, get: function () { return audit_trail_service_2.auditLogger; } });
var security_monitoring_service_2 = require("./security-monitoring-service");
Object.defineProperty(exports, "securityMonitoringService", { enumerable: true, get: function () { return security_monitoring_service_2.securityMonitoringService; } });
Object.defineProperty(exports, "securityMonitor", { enumerable: true, get: function () { return security_monitoring_service_2.securityMonitor; } });
var performance_monitoring_service_2 = require("./performance-monitoring-service");
Object.defineProperty(exports, "performanceMonitoringService", { enumerable: true, get: function () { return performance_monitoring_service_2.performanceMonitoringService; } });
Object.defineProperty(exports, "performanceMonitor", { enumerable: true, get: function () { return performance_monitoring_service_2.performanceMonitor; } });
// export { errorHandler } from "@server/infrastructure/error-handling" // Module doesn't exist
// ============================================================================
// SERVICE INTEGRATION CLASS
// ============================================================================
var ServiceIntegration = /** @class */ (function () {
    function ServiceIntegration() {
    }
    /**
     * Initialize all services with proper integration
     * Uses singleton pattern to prevent multiple initializations
     */
    ServiceIntegration.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Prevent multiple simultaneous initializations
                if (this.initializationPromise) {
                    return [2 /*return*/, this.initializationPromise];
                }
                if (this.isInitialized) {
                    console.log('🔄 Services already initialized, skipping...');
                    return [2 /*return*/];
                }
                console.log('🚀 Initializing African Property Trust services...');
                this.initializationPromise = this.performInitialization();
                return [2 /*return*/, this.initializationPromise];
            });
        });
    };
    /**
     * Internal initialization method that does the actual work
     */
    ServiceIntegration.performInitialization = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // Set up service event listeners for cross-service integration
                    this.setupServiceIntegration();
                    // Initialize performance monitoring with a startup metric
                    // This helps us track how long the entire system takes to boot up
                    performance_monitoring_service_1.performanceMonitor.recordMetric('service_initialization', Date.now(), 'timestamp');
                    // Mark initialization as complete
                    this.isInitialized = true;
                    console.log('✅ All services initialized successfully');
                }
                catch (error) {
                    console.error('❌ Service initialization failed:', error);
                    // Use proper error handling for initialization failures
                    // This ensures that startup errors are properly logged and can be monitored
                    console.error('Service initialization failed:', error, {
                        component: 'ServiceIntegration',
                        action: 'initialize',
                        severity: 'critical' // Startup failures are always critical
                    });
                    // Reset initialization state so it can be retried
                    this.isInitialized = false;
                    this.initializationPromise = null;
                    throw error; // Re-throw so callers know initialization failed
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Set up cross-service integration and event handling
     * This creates a web of communication between services so they can work together
     */
    ServiceIntegration.setupServiceIntegration = function () {
        var _this = this;
        // Security monitoring alerts trigger audit logging
        // When security threats are detected, we want a permanent audit record
        security_monitoring_service_1.securityMonitoringService.on('threatDetected', function (threat) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, audit_trail_service_1.auditLogger.suspiciousActivity("Security threat detected: ".concat(threat.type), {
                            threatId: threat.id,
                            riskScore: threat.riskScore,
                            indicators: threat.indicators.length
                        }, {
                            userId: threat.metadata.userId,
                            sessionId: threat.metadata.sessionId,
                            ipAddress: threat.metadata.ipAddress,
                            userAgent: threat.metadata.userAgent,
                            roles: [],
                            permissions: [],
                            isAuthenticated: !!threat.metadata.userId
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        // High-risk security events trigger error handling
        // This escalates serious security issues to the error handling system
        security_monitoring_service_1.securityMonitoringService.on('highRiskEvent', function (threat) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.error('High-risk security event:', threat.description, {
                    component: 'SecurityMonitoring',
                    action: 'threat_detection',
                    severity: 'high',
                    additionalData: {
                        threatId: threat.id,
                        threatType: threat.type,
                        riskScore: threat.riskScore
                    }
                });
                return [2 /*return*/];
            });
        }); });
        // Performance alerts trigger audit logging for high-severity issues
        // This helps with compliance and troubleshooting performance problems
        performance_monitoring_service_1.performanceMonitoringService.on('alert', function (alert) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(alert.severity === 'high' || alert.severity === 'critical')) return [3 /*break*/, 2];
                        return [4 /*yield*/, audit_trail_service_1.auditLogger.dataRead('performance_alert', 1, {
                                userId: alert.context.userId,
                                sessionId: alert.context.sessionId,
                                roles: [],
                                permissions: [],
                                isAuthenticated: !!alert.context.userId
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); });
        // Error handling service integration
        // Log when critical errors occur, but avoid infinite loops
        // errorHandler.on('criticalError', async (error: any) => {
        //   console.warn('Critical error detected:', error.id);
        //   // Note: We don't re-log to audit trail here to prevent circular logging
        //   // The error handler should already be logging to appropriate destinations
        // });
        // Audit trail service monitors for compliance violations
        // This helps identify patterns that might indicate compliance issues
        audit_trail_service_1.auditTrailService.on('complianceViolation', function (event) {
            console.warn('Compliance violation detected:', {
                eventId: event.id,
                flags: event.complianceFlags,
                userId: event.userId,
                timestamp: new Date().toISOString()
            });
        });
    };
    /**
     * Get overall system health status
     * This provides a comprehensive view of how all services are performing
     */
    ServiceIntegration.getSystemHealth = function () {
        var lastChecked = new Date().toISOString();
        try {
            // Gather metrics from each service
            var securityMetrics = security_monitoring_service_1.securityMonitor.getMetrics();
            var performanceMetrics = performance_monitoring_service_1.performanceMonitor.getCurrentMetrics();
            // const errorAnalytics = errorHandler.getAnalytics();
            // Evaluate each service's health based on specific criteria
            var services = {
                api: this.isInitialized ? 'up' : 'down',
                security: securityMetrics.securityScore > 70 ? 'up' :
                    securityMetrics.securityScore > 40 ? 'degraded' : 'down',
                performance: performanceMetrics.coreWebVitals.lcp ?
                    (performanceMetrics.coreWebVitals.lcp < 4000 ? 'up' :
                        performanceMetrics.coreWebVitals.lcp < 8000 ? 'degraded' : 'down') :
                    'up',
                audit: 'up', // Audit service is typically always available
                errorHandling: errorAnalytics.totalErrors < 100 ? 'up' :
                    errorAnalytics.totalErrors < 500 ? 'degraded' : 'down'
            };
            // Calculate overall system status based on individual service health
            var serviceStatuses = Object.values(services);
            var degradedServices = serviceStatuses.filter(function (s) { return s === 'degraded'; }).length;
            var downServices = serviceStatuses.filter(function (s) { return s === 'down'; }).length;
            var status_1 = 'healthy';
            if (downServices > 0) {
                status_1 = 'critical'; // Any service down makes the system critical
            }
            else if (degradedServices > 1) {
                status_1 = 'critical'; // Multiple degraded services indicate critical issues
            }
            else if (degradedServices > 0) {
                status_1 = 'degraded'; // Single degraded service means system is degraded
            }
            // Calculate performance score based on multiple factors
            var performanceScore = Math.max(0, Math.min(100, 100 - (degradedServices * 20) - (downServices * 40)));
            return {
                status: status_1,
                services: services,
                metrics: {
                    securityScore: securityMetrics.securityScore,
                    performanceScore: performanceScore,
                    errorRate: Math.min(1, errorAnalytics.totalErrors / 1000), // Cap at 100% error rate
                    uptime: downServices === 0 ? 99.9 : Math.max(0, 99.9 - (downServices * 10))
                },
                lastChecked: lastChecked
            };
        }
        catch (error) {
            // If we can't determine system health, assume the worst
            console.error('Failed to determine system health:', error);
            return {
                status: 'critical',
                services: {
                    api: 'down',
                    security: 'down',
                    performance: 'down',
                    audit: 'down',
                    errorHandling: 'down'
                },
                metrics: {
                    securityScore: 0,
                    performanceScore: 0,
                    errorRate: 1,
                    uptime: 0
                },
                lastChecked: lastChecked
            };
        }
    };
    /**
     * Shutdown all services gracefully
     * This ensures proper cleanup when the application is shutting down
     */
    ServiceIntegration.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.isInitialized) {
                    console.log('🔄 Services not initialized, skipping shutdown...');
                    return [2 /*return*/];
                }
                console.log('🛑 Shutting down services...');
                try {
                    // Clean up performance monitoring resources
                    // This prevents memory leaks and ensures clean shutdown
                    performance_monitoring_service_1.performanceMonitoringService.destroy();
                    // Clean up API client cache to free memory
                    unified_api_client_1.apiClient.clearCache();
                    // Mark as no longer initialized
                    this.isInitialized = false;
                    this.initializationPromise = null;
                    console.log('✅ All services shut down successfully');
                }
                catch (error) {
                    console.error('❌ Error during service shutdown:', error);
                    // Don't re-throw shutdown errors - we're already shutting down
                }
                return [2 /*return*/];
            });
        });
    };
    Object.defineProperty(ServiceIntegration, "initialized", {
        /**
         * Get initialization status
         */
        get: function () {
            return this.isInitialized;
        },
        enumerable: false,
        configurable: true
    });
    ServiceIntegration.isInitialized = false;
    ServiceIntegration.initializationPromise = null;
    return ServiceIntegration;
}());
exports.ServiceIntegration = ServiceIntegration;
// ============================================================================
// AUTO-INITIALIZATION LOGIC
// ============================================================================
// This section automatically initializes services when the module is imported
// The logic differs between browser and Node.js environments
if (typeof window !== 'undefined') {
    // Browser environment - wait for DOM to be ready
    // This ensures that any DOM-dependent services have the proper environment
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            ServiceIntegration.initialize().catch(console.error);
        });
    }
    else {
        // DOM is already ready, initialize immediately
        ServiceIntegration.initialize().catch(console.error);
    }
}
else {
    // Node.js environment - initialize immediately
    // Server-side services don't need to wait for DOM events
    ServiceIntegration.initialize().catch(console.error);
}
