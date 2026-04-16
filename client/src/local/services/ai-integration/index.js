"use strict";
/**
 * AI Integration Services - Main Export File
 *
 * Exports all AI integration services and utilities for easy importing
 * throughout the application.
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
exports.aiTypeGuards = exports.AIAnalysisTimeoutError = exports.AIServiceUnavailableError = exports.AIIntegrationError = exports.AI_INTEGRATION_CONSTANTS = exports.aiIntegrationUtils = exports.cleanupAIMonitoring = exports.exportAllMonitoringData = exports.quickAIHealthCheck = exports.getAISystemStatus = exports.initializeAIMonitoring = exports.aiPerformanceDashboard = exports.aiHealthMonitor = exports.aiMetricsCollector = exports.RecommendationIntegrationService = exports.recommendationIntegration = exports.FraudDetectionIntegrationService = exports.fraudDetectionIntegration = exports.DocumentProcessingIntegrationService = exports.documentProcessingIntegration = exports.PropertyAnalysisIntegrationService = exports.propertyAnalysisIntegration = exports.AIIntegrationOrchestrator = exports.aiIntegrationOrchestrator = void 0;
// Main orchestrator
var ai_integration_orchestrator_1 = require("./ai-integration-orchestrator");
Object.defineProperty(exports, "aiIntegrationOrchestrator", { enumerable: true, get: function () { return ai_integration_orchestrator_1.aiIntegrationOrchestrator; } });
Object.defineProperty(exports, "AIIntegrationOrchestrator", { enumerable: true, get: function () { return ai_integration_orchestrator_1.AIIntegrationOrchestrator; } });
// Property analysis integration
var property_analysis_integration_1 = require("./property-analysis-integration");
Object.defineProperty(exports, "propertyAnalysisIntegration", { enumerable: true, get: function () { return property_analysis_integration_1.propertyAnalysisIntegration; } });
Object.defineProperty(exports, "PropertyAnalysisIntegrationService", { enumerable: true, get: function () { return property_analysis_integration_1.PropertyAnalysisIntegrationService; } });
// Document processing integration
var document_processing_integration_1 = require("./document-processing-integration");
Object.defineProperty(exports, "documentProcessingIntegration", { enumerable: true, get: function () { return document_processing_integration_1.documentProcessingIntegration; } });
Object.defineProperty(exports, "DocumentProcessingIntegrationService", { enumerable: true, get: function () { return document_processing_integration_1.DocumentProcessingIntegrationService; } });
// Fraud detection integration
var fraud_detection_integration_1 = require("./fraud-detection-integration");
Object.defineProperty(exports, "fraudDetectionIntegration", { enumerable: true, get: function () { return fraud_detection_integration_1.fraudDetectionIntegration; } });
Object.defineProperty(exports, "FraudDetectionIntegrationService", { enumerable: true, get: function () { return fraud_detection_integration_1.FraudDetectionIntegrationService; } });
// Recommendation integration
var recommendation_integration_1 = require("./recommendation-integration");
Object.defineProperty(exports, "recommendationIntegration", { enumerable: true, get: function () { return recommendation_integration_1.recommendationIntegration; } });
Object.defineProperty(exports, "RecommendationIntegrationService", { enumerable: true, get: function () { return recommendation_integration_1.RecommendationIntegrationService; } });
// Monitoring and testing suite
var monitoring_1 = require("./monitoring");
// Metrics Collection
Object.defineProperty(exports, "aiMetricsCollector", { enumerable: true, get: function () { return monitoring_1.aiMetricsCollector; } });
// Health Monitoring
Object.defineProperty(exports, "aiHealthMonitor", { enumerable: true, get: function () { return monitoring_1.aiHealthMonitor; } });
// Performance Dashboard
Object.defineProperty(exports, "aiPerformanceDashboard", { enumerable: true, get: function () { return monitoring_1.aiPerformanceDashboard; } });
// Testing Suite - Commented out as files don't exist yet
// AITestSuite,
// aiTestUtils,
// type AITestConfig,
// type AITestResult,
// type AITestSuiteReport,
// Comprehensive Test Runner - Commented out as files don't exist yet
// ComprehensiveAITestRunner,
// type ComprehensiveTestConfig,
// type ComprehensiveTestReport,
// Utility Functions
Object.defineProperty(exports, "initializeAIMonitoring", { enumerable: true, get: function () { return monitoring_1.initializeAIMonitoring; } });
Object.defineProperty(exports, "getAISystemStatus", { enumerable: true, get: function () { return monitoring_1.getAISystemStatus; } });
Object.defineProperty(exports, "quickAIHealthCheck", { enumerable: true, get: function () { return monitoring_1.quickAIHealthCheck; } });
Object.defineProperty(exports, "exportAllMonitoringData", { enumerable: true, get: function () { return monitoring_1.exportAllMonitoringData; } });
Object.defineProperty(exports, "cleanupAIMonitoring", { enumerable: true, get: function () { return monitoring_1.cleanupAIMonitoring; } });
// Utility functions for AI integration
exports.aiIntegrationUtils = {
    /**
     * Check if AI services are available and healthy
     */
    checkAIHealth: function () {
        return __awaiter(this, void 0, void 0, function () {
            var health, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, aiIntegrationOrchestrator.getHealthStatus()];
                    case 1:
                        health = _a.sent();
                        return [2 /*return*/, health.status === 'healthy'];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Get AI integration metrics summary
     */
    getMetricsSummary: function () {
        return __awaiter(this, void 0, void 0, function () {
            var metrics, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, aiIntegrationOrchestrator.getMetrics()];
                    case 1:
                        metrics = _a.sent();
                        return [2 /*return*/, {
                                totalOperations: metrics.overall.totalAIOperations,
                                errorRate: metrics.overall.errorRate,
                                averageResponseTime: metrics.overall.averageResponseTime,
                                servicesStatus: {
                                    propertyAnalysis: metrics.propertyAnalysis.errorRate < 0.1,
                                    documentProcessing: metrics.documentProcessing.authenticityRate > 0.8,
                                    fraudDetection: metrics.fraudDetection.falsePositiveRate < 0.2,
                                    recommendations: metrics.recommendations.userEngagementRate > 0.3
                                }
                            }];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Format AI confidence score for display
     */
    formatConfidence: function (confidence) {
        var percentage = Math.round(confidence * 100);
        if (percentage >= 90)
            return "".concat(percentage, "% (Very High)");
        if (percentage >= 70)
            return "".concat(percentage, "% (High)");
        if (percentage >= 50)
            return "".concat(percentage, "% (Medium)");
        return "".concat(percentage, "% (Low)");
    },
    /**
     * Get risk level color for UI display
     */
    getRiskLevelColor: function (riskLevel) {
        var colors = {
            low: 'text-green-600',
            medium: 'text-yellow-600',
            high: 'text-orange-600',
            critical: 'text-red-600'
        };
        return colors[riskLevel] || 'text-gray-600';
    },
    /**
     * Get risk level badge variant
     */
    getRiskLevelVariant: function (riskLevel) {
        if (riskLevel === 'low')
            return 'default';
        if (riskLevel === 'medium')
            return 'secondary';
        return 'destructive';
    },
    /**
     * Calculate overall AI score from multiple analyses
     */
    calculateOverallAIScore: function (analyses) {
        var totalScore = 0;
        var weights = 0;
        if (analyses.valuation) {
            totalScore += analyses.valuation.confidence * 100 * 0.3;
            weights += 0.3;
        }
        if (analyses.riskAssessment) {
            totalScore += (100 - analyses.riskAssessment.riskScore) * 0.3;
            weights += 0.3;
        }
        if (analyses.fraudAnalysis) {
            var fraudScore = (100 - analyses.fraudAnalysis.riskScore) * analyses.fraudAnalysis.confidence;
            totalScore += fraudScore * 0.4;
            weights += 0.4;
        }
        return weights > 0 ? Math.round(totalScore / weights) : 50;
    },
    /**
     * Generate AI insights summary
     */
    generateInsightsSummary: function (analyses) {
        var _a, _b, _c, _d;
        var insights = [];
        if (((_a = analyses.valuation) === null || _a === void 0 ? void 0 : _a.confidence) > 0.8) {
            insights.push('High-confidence AI valuation available');
        }
        if (((_b = analyses.riskAssessment) === null || _b === void 0 ? void 0 : _b.overallRisk) === 'low') {
            insights.push('Low risk investment opportunity');
        }
        if (((_c = analyses.fraudAnalysis) === null || _c === void 0 ? void 0 : _c.riskLevel) === 'low') {
            insights.push('No fraud indicators detected');
        }
        if (((_d = analyses.marketInsights) === null || _d === void 0 ? void 0 : _d.investmentPotential) === 'excellent') {
            insights.push('Excellent investment potential identified');
        }
        return insights.length > 0
            ? insights.join('. ') + '.'
            : 'AI analysis completed with standard results.';
    }
};
// Constants for AI integration
exports.AI_INTEGRATION_CONSTANTS = {
    // Confidence thresholds
    CONFIDENCE_THRESHOLDS: {
        HIGH: 0.8,
        MEDIUM: 0.6,
        LOW: 0.4
    },
    // Risk score thresholds
    RISK_SCORE_THRESHOLDS: {
        LOW: 30,
        MEDIUM: 60,
        HIGH: 80
    },
    // Cache TTL values (in seconds)
    CACHE_TTL: {
        PROPERTY_ANALYSIS: 3600, // 1 hour
        DOCUMENT_PROCESSING: 7200, // 2 hours
        FRAUD_DETECTION: 1800, // 30 minutes
        RECOMMENDATIONS: 900 // 15 minutes
    },
    // Batch processing limits
    BATCH_LIMITS: {
        PROPERTIES: 50,
        DOCUMENTS: 20,
        USERS: 100
    },
    // API timeouts (in milliseconds)
    TIMEOUTS: {
        PROPERTY_ANALYSIS: 30000,
        DOCUMENT_PROCESSING: 60000,
        FRAUD_DETECTION: 45000,
        RECOMMENDATIONS: 20000
    }
};
// Error types for AI integration
var AIIntegrationError = /** @class */ (function (_super) {
    __extends(AIIntegrationError, _super);
    function AIIntegrationError(message, service, operation, cause) {
        var _this = _super.call(this, message) || this;
        _this.service = service;
        _this.operation = operation;
        _this.cause = cause;
        _this.name = 'AIIntegrationError';
        return _this;
    }
    return AIIntegrationError;
}(Error));
exports.AIIntegrationError = AIIntegrationError;
var AIServiceUnavailableError = /** @class */ (function (_super) {
    __extends(AIServiceUnavailableError, _super);
    function AIServiceUnavailableError(service, operation) {
        var _this = _super.call(this, "AI service ".concat(service, " is currently unavailable"), service, operation) || this;
        _this.name = 'AIServiceUnavailableError';
        return _this;
    }
    return AIServiceUnavailableError;
}(AIIntegrationError));
exports.AIServiceUnavailableError = AIServiceUnavailableError;
var AIAnalysisTimeoutError = /** @class */ (function (_super) {
    __extends(AIAnalysisTimeoutError, _super);
    function AIAnalysisTimeoutError(service, operation, timeout) {
        var _this = _super.call(this, "AI analysis timed out after ".concat(timeout, "ms"), service, operation) || this;
        _this.name = 'AIAnalysisTimeoutError';
        return _this;
    }
    return AIAnalysisTimeoutError;
}(AIIntegrationError));
exports.AIAnalysisTimeoutError = AIAnalysisTimeoutError;
// Type guards for AI integration
exports.aiTypeGuards = {
    isPropertyValuationResult: function (obj) {
        return obj &&
            typeof obj.estimatedValue === 'number' &&
            typeof obj.confidence === 'number' &&
            obj.valueRange &&
            Array.isArray(obj.factors);
    },
    isPropertyRiskAssessment: function (obj) {
        return obj &&
            ['low', 'medium', 'high'].includes(obj.overallRisk) &&
            typeof obj.riskScore === 'number' &&
            Array.isArray(obj.riskFactors);
    },
    isFraudDetectionResult: function (obj) {
        return obj &&
            ['low', 'medium', 'high', 'critical'].includes(obj.riskLevel) &&
            typeof obj.riskScore === 'number' &&
            typeof obj.confidence === 'number';
    },
    isPropertyRecommendation: function (obj) {
        return obj &&
            typeof obj.propertyId === 'string' &&
            typeof obj.score === 'number' &&
            typeof obj.confidence === 'number' &&
            Array.isArray(obj.reasons);
    }
};
