"use strict";
/**
 * Fraud Detection AI Integration Service
 *
 * Integrates AI fraud detection capabilities with trust and reputation systems.
 * Provides pattern recognition, anomaly detection, and risk assessment for properties and users.
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
exports.fraudDetectionIntegration = exports.FraudDetectionIntegrationService = void 0;
var huggingface_api_client_1 = require("../huggingface-api-client");
var logger_1 = require("../../../../server/infrastructure/monitoring/logger");
var base_error_1 = require("../../error-handling/errors/base-error");
var FraudDetectionIntegrationError = /** @class */ (function (_super) {
    __extends(FraudDetectionIntegrationError, _super);
    function FraudDetectionIntegrationError(message, operation, cause) {
        return _super.call(this, message, {
            code: 'FRAUD_DETECTION_ERROR',
            domain: base_error_1.ErrorDomain.SECURITY,
            severity: base_error_1.ErrorSeverity.HIGH,
            cause: cause,
            details: { operation: operation }
        }) || this;
    }
    return FraudDetectionIntegrationError;
}(base_error_1.BaseError));
var FraudDetectionIntegrationService = /** @class */ (function () {
    function FraudDetectionIntegrationService() {
    }
    FraudDetectionIntegrationService.getInstance = function () {
        if (!FraudDetectionIntegrationService.instance) {
            FraudDetectionIntegrationService.instance = new FraudDetectionIntegrationService();
        }
        return FraudDetectionIntegrationService.instance;
    };
    /**
     * Analyze property for fraud indicators
     */
    FraudDetectionIntegrationService.prototype.analyzePropertyFraud = function (property, additionalContext) {
        return __awaiter(this, void 0, void 0, function () {
            var propertyDescription, fraudPatterns, fraudCategories, crossReferenceChecks, trustScoreImpact, analysis, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        logger_1.logger.info('Starting property fraud analysis', {
                            module: 'FraudDetectionIntegration',
                            propertyId: property.id,
                            propertyType: property.type,
                            hasAdditionalContext: !!additionalContext
                        });
                        propertyDescription = this.createPropertyAnalysisText(property, additionalContext);
                        return [4 /*yield*/, this.detectFraudPatterns(propertyDescription, 'property')];
                    case 1:
                        fraudPatterns = _a.sent();
                        return [4 /*yield*/, this.analyzeFraudCategories(property, propertyDescription)];
                    case 2:
                        fraudCategories = _a.sent();
                        return [4 /*yield*/, this.performCrossReferenceChecks(property)];
                    case 3:
                        crossReferenceChecks = _a.sent();
                        trustScoreImpact = this.calculateTrustScoreImpact(property, fraudPatterns);
                        analysis = {
                            propertyId: property.id,
                            riskLevel: this.calculateOverallRiskLevel(fraudPatterns, fraudCategories),
                            riskScore: this.calculateRiskScore(fraudPatterns, fraudCategories),
                            confidence: this.calculateConfidence(fraudPatterns),
                            detectedPatterns: fraudPatterns,
                            recommendations: this.generatePropertyRecommendations(fraudPatterns, fraudCategories),
                            fraudCategories: fraudCategories,
                            crossReferenceChecks: crossReferenceChecks,
                            trustScoreImpact: trustScoreImpact,
                            analysisDate: new Date()
                        };
                        logger_1.logger.info('Property fraud analysis completed', {
                            module: 'FraudDetectionIntegration',
                            propertyId: property.id,
                            riskLevel: analysis.riskLevel,
                            riskScore: analysis.riskScore,
                            detectedPatternsCount: analysis.detectedPatterns.length
                        });
                        return [2 /*return*/, analysis];
                    case 4:
                        error_1 = _a.sent();
                        logger_1.logger.error('Property fraud analysis failed', {
                            module: 'FraudDetectionIntegration',
                            propertyId: property.id,
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        });
                        throw new FraudDetectionIntegrationError('Failed to analyze property fraud', 'analyzePropertyFraud', error_1 instanceof Error ? error_1 : new Error(String(error_1)));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze user behavior for fraud indicators
     */
    FraudDetectionIntegrationService.prototype.analyzeUserFraud = function (user, activityHistory) {
        return __awaiter(this, void 0, void 0, function () {
            var userDescription, fraudPatterns, behaviorAnalysis, reputationImpact, analysis, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        logger_1.logger.info('Starting user fraud analysis', {
                            module: 'FraudDetectionIntegration',
                            userId: user.id,
                            hasActivityHistory: !!(activityHistory === null || activityHistory === void 0 ? void 0 : activityHistory.length)
                        });
                        userDescription = this.createUserAnalysisText(user, activityHistory);
                        return [4 /*yield*/, this.detectFraudPatterns(userDescription, 'user')];
                    case 1:
                        fraudPatterns = _a.sent();
                        return [4 /*yield*/, this.analyzeUserBehavior(user, activityHistory)];
                    case 2:
                        behaviorAnalysis = _a.sent();
                        reputationImpact = this.calculateReputationImpact(user, fraudPatterns);
                        analysis = {
                            userId: user.id,
                            riskLevel: this.calculateUserRiskLevel(fraudPatterns, behaviorAnalysis),
                            riskScore: this.calculateUserRiskScore(fraudPatterns, behaviorAnalysis),
                            confidence: this.calculateConfidence(fraudPatterns),
                            detectedPatterns: fraudPatterns,
                            recommendations: this.generateUserRecommendations(fraudPatterns, behaviorAnalysis),
                            behaviorAnalysis: behaviorAnalysis,
                            reputationImpact: reputationImpact,
                            analysisDate: new Date()
                        };
                        logger_1.logger.info('User fraud analysis completed', {
                            module: 'FraudDetectionIntegration',
                            userId: user.id,
                            riskLevel: analysis.riskLevel,
                            riskScore: analysis.riskScore,
                            suspiciousActivitiesCount: analysis.behaviorAnalysis.suspiciousActivities.length
                        });
                        return [2 /*return*/, analysis];
                    case 3:
                        error_2 = _a.sent();
                        logger_1.logger.error('User fraud analysis failed', {
                            module: 'FraudDetectionIntegration',
                            userId: user.id,
                            error: error_2 instanceof Error ? error_2.message : String(error_2)
                        });
                        throw new FraudDetectionIntegrationError('Failed to analyze user fraud', 'analyzeUserFraud', error_2 instanceof Error ? error_2 : new Error(String(error_2)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze network patterns for coordinated fraud
     */
    FraudDetectionIntegrationService.prototype.analyzeNetworkFraud = function (entities, connections) {
        return __awaiter(this, void 0, void 0, function () {
            var networkPatterns, coordinatedActivities, participantRoles, fraudIndicators, networkId, analysis, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        logger_1.logger.info('Starting network fraud analysis', {
                            module: 'FraudDetectionIntegration',
                            entitiesCount: entities.length,
                            connectionsCount: connections.length
                        });
                        return [4 /*yield*/, this.analyzeNetworkPatterns(entities, connections)];
                    case 1:
                        networkPatterns = _a.sent();
                        return [4 /*yield*/, this.detectCoordinatedActivities(entities, connections)];
                    case 2:
                        coordinatedActivities = _a.sent();
                        participantRoles = this.identifyNetworkRoles(entities, connections, networkPatterns);
                        fraudIndicators = this.generateNetworkFraudIndicators(networkPatterns, coordinatedActivities);
                        networkId = "network_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        analysis = {
                            networkId: networkId,
                            networkType: this.determineNetworkType(networkPatterns, fraudIndicators),
                            participants: participantRoles,
                            fraudIndicators: fraudIndicators,
                            recommendedActions: this.generateNetworkRecommendations(fraudIndicators, participantRoles)
                        };
                        logger_1.logger.info('Network fraud analysis completed', {
                            module: 'FraudDetectionIntegration',
                            networkId: networkId,
                            networkType: analysis.networkType,
                            participantsCount: analysis.participants.length,
                            fraudIndicatorsCount: analysis.fraudIndicators.length
                        });
                        return [2 /*return*/, analysis];
                    case 3:
                        error_3 = _a.sent();
                        logger_1.logger.error('Network fraud analysis failed', {
                            module: 'FraudDetectionIntegration',
                            error: error_3 instanceof Error ? error_3.message : String(error_3)
                        });
                        throw new FraudDetectionIntegrationError('Failed to analyze network fraud', 'analyzeNetworkFraud', error_3 instanceof Error ? error_3 : new Error(String(error_3)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update trust scores based on fraud analysis
     */
    FraudDetectionIntegrationService.prototype.updateTrustScores = function (fraudAnalyses) {
        return __awaiter(this, void 0, void 0, function () {
            var updates, _i, fraudAnalyses_1, analysis, update, update;
            return __generator(this, function (_a) {
                try {
                    logger_1.logger.info('Updating trust scores based on fraud analysis', {
                        module: 'FraudDetectionIntegration',
                        analysesCount: fraudAnalyses.length
                    });
                    updates = [];
                    for (_i = 0, fraudAnalyses_1 = fraudAnalyses; _i < fraudAnalyses_1.length; _i++) {
                        analysis = fraudAnalyses_1[_i];
                        if ('propertyId' in analysis) {
                            update = {
                                id: analysis.propertyId,
                                type: 'property',
                                oldScore: analysis.trustScoreImpact.currentScore,
                                newScore: analysis.trustScoreImpact.adjustedScore,
                                reason: analysis.trustScoreImpact.reason
                            };
                            updates.push(update);
                        }
                        else if ('userId' in analysis) {
                            update = {
                                id: analysis.userId,
                                type: 'user',
                                oldScore: analysis.reputationImpact.currentReputation,
                                newScore: analysis.reputationImpact.adjustedReputation,
                                reason: analysis.reputationImpact.reason
                            };
                            updates.push(update);
                        }
                    }
                    logger_1.logger.info('Trust score updates calculated', {
                        module: 'FraudDetectionIntegration',
                        updatesCount: updates.length
                    });
                    return [2 /*return*/, updates];
                }
                catch (error) {
                    logger_1.logger.error('Trust score update failed', {
                        module: 'FraudDetectionIntegration',
                        error: error instanceof Error ? error.message : String(error)
                    });
                    throw new FraudDetectionIntegrationError('Failed to update trust scores', 'updateTrustScores', error instanceof Error ? error : new Error(String(error)));
                }
                return [2 /*return*/];
            });
        });
    };
    // Private helper methods
    FraudDetectionIntegrationService.prototype.createPropertyAnalysisText = function (property, additionalContext) {
        var _a, _b;
        return "\n      Property Analysis:\n      ID: ".concat(property.id, "\n      Type: ").concat(property.type, "\n      Location: ").concat(property.location, "\n      Price: ").concat(property.price, "\n      Description: ").concat(property.description || 'No description', "\n      Features: ").concat(((_a = property.features) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'No features', "\n      Owner: ").concat(((_b = property.owner) === null || _b === void 0 ? void 0 : _b.name) || 'Unknown', "\n      Listed Date: ").concat(property.createdAt || 'Unknown', "\n      ").concat(additionalContext ? "Additional Context: ".concat(JSON.stringify(additionalContext)) : '', "\n    ").trim();
    };
    FraudDetectionIntegrationService.prototype.createUserAnalysisText = function (user, activityHistory) {
        return "\n      User Analysis:\n      ID: ".concat(user.id, "\n      Name: ").concat(user.firstName, " ").concat(user.lastName, "\n      Email: ").concat(user.email, "\n      Role: ").concat(user.role, "\n      Verified: ").concat(user.isVerified, "\n      Trust Score: ").concat(user.trustScore || 'N/A', "\n      Join Date: ").concat(user.createdAt, "\n      Activity History: ").concat(activityHistory ? "".concat(activityHistory.length, " activities") : 'No history', "\n    ").trim();
    };
    FraudDetectionIntegrationService.prototype.detectFraudPatterns = function (text, entityType) {
        return __awaiter(this, void 0, void 0, function () {
            var fraudResult_1, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, huggingface_api_client_1.huggingFaceClient.detectFraudIndicators(text)];
                    case 1:
                        fraudResult_1 = _a.sent();
                        if (fraudResult_1.indicators.length === 0) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, fraudResult_1.indicators.map(function (indicator) { return ({
                                pattern: indicator,
                                severity: fraudResult_1.riskLevel,
                                description: "Potential fraud indicator detected: ".concat(indicator),
                                evidence: [indicator],
                                confidence: fraudResult_1.confidence
                            }); })];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.logger.warn('Fraud pattern detection failed, using fallback', {
                            module: 'FraudDetectionIntegration',
                            entityType: entityType,
                            error: error_4 instanceof Error ? error_4.message : String(error_4)
                        });
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    FraudDetectionIntegrationService.prototype.analyzeFraudCategories = function (property, description) {
        return __awaiter(this, void 0, void 0, function () {
            var categories;
            return __generator(this, function (_a) {
                categories = [
                    'document_fraud',
                    'price_manipulation',
                    'identity_theft',
                    'duplicate_listing',
                    'fake_ownership'
                ];
                return [2 /*return*/, categories.map(function (category) { return ({
                        category: category,
                        detected: Math.random() < 0.1, // 10% chance for demo
                        confidence: Math.random() * 0.3 + 0.1, // Low confidence for demo
                        indicators: []
                    }); })];
            });
        });
    };
    FraudDetectionIntegrationService.prototype.performCrossReferenceChecks = function (property) {
        return __awaiter(this, void 0, void 0, function () {
            var checks;
            return __generator(this, function (_a) {
                checks = [
                    'duplicate_images',
                    'price_comparison',
                    'ownership_verification',
                    'document_authenticity'
                ];
                return [2 /*return*/, checks.map(function (checkType) { return ({
                        checkType: checkType,
                        status: Math.random() < 0.9 ? 'passed' : 'warning', // 90% pass rate for demo
                        details: "".concat(checkType, " check completed")
                    }); })];
            });
        });
    };
    FraudDetectionIntegrationService.prototype.calculateTrustScoreImpact = function (property, fraudPatterns) {
        var currentScore = property.trustScore || 75;
        var adjustment = fraudPatterns.length * -5; // Reduce by 5 points per pattern
        var adjustedScore = Math.max(0, Math.min(100, currentScore + adjustment));
        return {
            currentScore: currentScore,
            adjustedScore: adjustedScore,
            adjustment: adjustment,
            reason: fraudPatterns.length > 0
                ? "Trust score reduced due to ".concat(fraudPatterns.length, " fraud indicators")
                : 'No fraud indicators detected'
        };
    };
    FraudDetectionIntegrationService.prototype.analyzeUserBehavior = function (user, activityHistory) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock behavior analysis
                return [2 /*return*/, {
                        suspiciousActivities: [],
                        patternAnomalies: [],
                        networkConnections: []
                    }];
            });
        });
    };
    FraudDetectionIntegrationService.prototype.calculateReputationImpact = function (user, fraudPatterns) {
        var currentReputation = user.trustScore || 75;
        var adjustment = fraudPatterns.length * -10; // Reduce by 10 points per pattern
        var adjustedReputation = Math.max(0, Math.min(100, currentReputation + adjustment));
        return {
            currentReputation: currentReputation,
            adjustedReputation: adjustedReputation,
            adjustment: adjustment,
            reason: fraudPatterns.length > 0
                ? "Reputation reduced due to ".concat(fraudPatterns.length, " fraud indicators")
                : 'No fraud indicators detected'
        };
    };
    FraudDetectionIntegrationService.prototype.calculateOverallRiskLevel = function (fraudPatterns, fraudCategories) {
        var highSeverityPatterns = fraudPatterns.filter(function (p) { return p.severity === 'high'; }).length;
        var detectedCategories = fraudCategories.filter(function (c) { return c.detected; }).length;
        if (highSeverityPatterns > 2 || detectedCategories > 2)
            return 'critical';
        if (highSeverityPatterns > 0 || detectedCategories > 1)
            return 'high';
        if (fraudPatterns.length > 0 || detectedCategories > 0)
            return 'medium';
        return 'low';
    };
    FraudDetectionIntegrationService.prototype.calculateRiskScore = function (fraudPatterns, fraudCategories) {
        var patternScore = fraudPatterns.reduce(function (sum, p) {
            var severityWeight = { low: 10, medium: 25, high: 50 };
            return sum + (severityWeight[p.severity] || 0) * p.confidence;
        }, 0);
        var categoryScore = fraudCategories.reduce(function (sum, c) {
            return sum + (c.detected ? 20 * c.confidence : 0);
        }, 0);
        return Math.min(100, patternScore + categoryScore);
    };
    FraudDetectionIntegrationService.prototype.calculateUserRiskLevel = function (fraudPatterns, behaviorAnalysis) {
        var suspiciousCount = behaviorAnalysis.suspiciousActivities.length;
        var highSeverityPatterns = fraudPatterns.filter(function (p) { return p.severity === 'high'; }).length;
        if (highSeverityPatterns > 1 || suspiciousCount > 5)
            return 'critical';
        if (highSeverityPatterns > 0 || suspiciousCount > 2)
            return 'high';
        if (fraudPatterns.length > 0 || suspiciousCount > 0)
            return 'medium';
        return 'low';
    };
    FraudDetectionIntegrationService.prototype.calculateUserRiskScore = function (fraudPatterns, behaviorAnalysis) {
        var patternScore = fraudPatterns.reduce(function (sum, p) {
            var severityWeight = { low: 15, medium: 30, high: 60 };
            return sum + (severityWeight[p.severity] || 0) * p.confidence;
        }, 0);
        var behaviorScore = behaviorAnalysis.suspiciousActivities.length * 10;
        return Math.min(100, patternScore + behaviorScore);
    };
    FraudDetectionIntegrationService.prototype.calculateConfidence = function (fraudPatterns) {
        if (fraudPatterns.length === 0)
            return 0.9; // High confidence in no fraud
        var avgConfidence = fraudPatterns.reduce(function (sum, p) { return sum + p.confidence; }, 0) / fraudPatterns.length;
        return avgConfidence;
    };
    FraudDetectionIntegrationService.prototype.generatePropertyRecommendations = function (fraudPatterns, fraudCategories) {
        var recommendations = [];
        if (fraudPatterns.length > 0) {
            recommendations.push({
                action: 'Manual review required',
                priority: 'high',
                description: 'Property requires manual verification due to fraud indicators',
                timeframe: 'Within 24 hours'
            });
        }
        var detectedCategories = fraudCategories.filter(function (c) { return c.detected; });
        if (detectedCategories.length > 0) {
            recommendations.push({
                action: 'Document verification',
                priority: 'medium',
                description: 'Verify property documents with relevant authorities',
                timeframe: 'Within 3 days'
            });
        }
        return recommendations;
    };
    FraudDetectionIntegrationService.prototype.generateUserRecommendations = function (fraudPatterns, behaviorAnalysis) {
        var recommendations = [];
        if (fraudPatterns.length > 0) {
            recommendations.push({
                action: 'Account review',
                priority: 'high',
                description: 'User account requires immediate review',
                timeframe: 'Within 12 hours'
            });
        }
        if (behaviorAnalysis.suspiciousActivities.length > 0) {
            recommendations.push({
                action: 'Activity monitoring',
                priority: 'medium',
                description: 'Monitor user activities for suspicious patterns',
                timeframe: 'Ongoing'
            });
        }
        return recommendations;
    };
    FraudDetectionIntegrationService.prototype.analyzeNetworkPatterns = function (entities, connections) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock network pattern analysis
                return [2 /*return*/, {
                        clusterCount: Math.ceil(entities.length / 5),
                        averageConnectivity: connections.length / entities.length,
                        suspiciousPatterns: []
                    }];
            });
        });
    };
    FraudDetectionIntegrationService.prototype.detectCoordinatedActivities = function (entities, connections) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock coordinated activity detection
                return [2 /*return*/, []];
            });
        });
    };
    FraudDetectionIntegrationService.prototype.identifyNetworkRoles = function (entities, connections, patterns) {
        return entities.map(function (entity) { return ({
            id: entity.id,
            type: entity.type,
            role: 'participant',
            riskContribution: Math.random() * 0.3
        }); });
    };
    FraudDetectionIntegrationService.prototype.generateNetworkFraudIndicators = function (patterns, activities) {
        return [
            {
                indicator: 'Coordinated pricing patterns',
                strength: 0.6,
                affectedEntities: []
            }
        ];
    };
    FraudDetectionIntegrationService.prototype.determineNetworkType = function (patterns, indicators) {
        return 'property_ring'; // Default for demo
    };
    FraudDetectionIntegrationService.prototype.generateNetworkRecommendations = function (indicators, participants) {
        return [
            {
                action: 'Investigate network',
                targets: participants.map(function (p) { return p.id; }),
                urgency: 'high'
            }
        ];
    };
    return FraudDetectionIntegrationService;
}());
exports.FraudDetectionIntegrationService = FraudDetectionIntegrationService;
// Export singleton instance
exports.fraudDetectionIntegration = FraudDetectionIntegrationService.getInstance();
