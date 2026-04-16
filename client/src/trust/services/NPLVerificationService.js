"use strict";
/**
 * NPL Verification Service
 *
 * Provides specialized verification workflow for bank NPL (Non-Performing Loan) recovery.
 * Handles collateral assessment, title chain audits, and recovery recommendations.
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
exports.nplVerificationService = exports.NPLVerificationService = void 0;
// ============================================================================
// NPL Verification Service
// ============================================================================
var NPLVerificationService = /** @class */ (function () {
    function NPLVerificationService() {
        this.apiBaseUrl = '/api/npl';
    }
    // ============================================================================
    // Collateral Valuation
    // ============================================================================
    /**
     * Assess current market value of collateral property
     */
    NPLVerificationService.prototype.assessCollateralValue = function (propertyId, loanDetails) {
        return __awaiter(this, void 0, void 0, function () {
            var marketValue, comparables, ltvRatio, daysSinceLoan, valuationConfidence, marketTrend, recommendations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetchMarketValue(propertyId)];
                    case 1:
                        marketValue = _a.sent();
                        return [4 /*yield*/, this.fetchComparableProperties(propertyId)];
                    case 2:
                        comparables = _a.sent();
                        ltvRatio = (loanDetails.outstandingBalance / marketValue) * 100;
                        daysSinceLoan = Math.floor((Date.now() - loanDetails.loanOriginDate.getTime()) / (1000 * 60 * 60 * 24));
                        valuationConfidence = this.calculateValuationConfidence(comparables.length, daysSinceLoan);
                        marketTrend = this.analyzeMarketTrend(comparables);
                        recommendations = this.generateValuationRecommendations(ltvRatio, marketTrend, valuationConfidence);
                        return [2 /*return*/, {
                                currentMarketValue: marketValue,
                                loanToValueRatio: ltvRatio,
                                valuationConfidence: valuationConfidence,
                                comparableProperties: comparables,
                                marketTrend: marketTrend,
                                recommendations: recommendations,
                            }];
                }
            });
        });
    };
    // ============================================================================
    // Title Chain Audit
    // ============================================================================
    /**
     * Perform deep historical ownership verification
     * Key for detecting fraudulent transfers (e.g., Mwangi vs Mount Pleasant case)
     */
    NPLVerificationService.prototype.auditTitleChain = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var digitalHistory, physicalHistory, gaps, fraudIndicators, chainIntegrity, registryConsistency;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetchDigitalOwnershipHistory(propertyId)];
                    case 1:
                        digitalHistory = _a.sent();
                        return [4 /*yield*/, this.fetchPhysicalOwnershipHistory(propertyId)];
                    case 2:
                        physicalHistory = _a.sent();
                        gaps = this.identifyTitleGaps(digitalHistory, physicalHistory);
                        fraudIndicators = this.detectFraudIndicators(digitalHistory, physicalHistory);
                        chainIntegrity = 'valid';
                        if (gaps.length > 0) {
                            chainIntegrity = gaps.some(function (g) { return g.severity === 'critical'; }) ? 'broken' : 'suspicious';
                        }
                        registryConsistency = this.checkRegistryConsistency(digitalHistory, physicalHistory);
                        return [2 /*return*/, {
                                ownershipHistory: this.mergeOwnershipHistories(digitalHistory, physicalHistory),
                                chainIntegrity: chainIntegrity,
                                gaps: gaps,
                                fraudIndicators: fraudIndicators,
                                registryConsistency: registryConsistency,
                            }];
                }
            });
        });
    };
    // ============================================================================
    // Recovery Recommendation Engine
    // ============================================================================
    /**
     * Generate AI-powered recovery recommendation
     */
    NPLVerificationService.prototype.generateRecoveryRecommendation = function (nplProperty, marketConditions, riskAssessment) {
        return __awaiter(this, void 0, void 0, function () {
            var recoveryRate, action, timeToRecovery, risks, alternatives;
            return __generator(this, function (_a) {
                recoveryRate = this.estimateRecoveryRate(nplProperty, marketConditions, riskAssessment);
                action = this.determineOptimalAction(nplProperty, recoveryRate, riskAssessment);
                timeToRecovery = this.estimateTimeToRecovery(action, marketConditions);
                risks = this.identifyRecoveryRisks(nplProperty, action, riskAssessment);
                alternatives = this.generateAlternativeActions(nplProperty, action, marketConditions);
                return [2 /*return*/, {
                        action: action,
                        estimatedRecoveryAmount: nplProperty.outstandingBalance * (recoveryRate / 100),
                        estimatedRecoveryRate: recoveryRate,
                        confidence: this.calculateRecommendationConfidence(riskAssessment),
                        rationale: this.generateRationale(action, nplProperty, marketConditions),
                        timeToRecovery: timeToRecovery,
                        marketConditions: marketConditions,
                        risks: risks,
                        alternativeActions: alternatives,
                    }];
            });
        });
    };
    /**
     * Determine optimal recovery action based on multiple factors
     */
    NPLVerificationService.prototype.determineOptimalAction = function (property, recoveryRate, riskAssessment) {
        // Critical risk factors
        if (riskAssessment.registryRisk.level === 'critical') {
            return 'legal_action'; // Registry issues require legal resolution
        }
        if (riskAssessment.titleRisk.level === 'critical') {
            return 'legal_action';
        }
        // Recovery rate-based decisions
        if (recoveryRate < 20) {
            return 'write_off';
        }
        if (recoveryRate < 40) {
            return property.daysInDefault > 365 ? 'auction' : 'hold';
        }
        if (recoveryRate < 60) {
            return property.daysInDefault > 180 ? 'sell_marketed' : 'restructure_loan';
        }
        if (recoveryRate < 80) {
            return 'sell_marketed';
        }
        // High recovery potential
        return 'sell_immediate';
    };
    // ============================================================================
    // Bulk Operations
    // ============================================================================
    /**
     * Process bulk NPL property upload from CSV
     */
    NPLVerificationService.prototype.processBulkUpload = function (bankId, records) {
        return __awaiter(this, void 0, void 0, function () {
            var uploadId, errors, processedCount, i, row, validated, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        uploadId = "upload_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        errors = [];
                        processedCount = 0;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < records.length)) return [3 /*break*/, 6];
                        row = records[i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        validated = this.validateImportRow(row, i + 2);
                        if (validated.errors.length > 0) {
                            errors.push.apply(errors, validated.errors);
                            return [3 /*break*/, 5];
                        }
                        // Create NPL property record
                        return [4 /*yield*/, this.createNPLProperty(bankId, validated.data)];
                    case 3:
                        // Create NPL property record
                        _a.sent();
                        processedCount++;
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        errors.push({
                            rowNumber: i + 2,
                            field: 'general',
                            error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                            rawValue: JSON.stringify(row),
                        });
                        return [3 /*break*/, 5];
                    case 5:
                        i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, {
                            uploadId: uploadId,
                            bankId: bankId,
                            fileName: 'bulk_upload.csv',
                            uploadedAt: new Date(),
                            totalRecords: records.length,
                            processedRecords: processedCount,
                            failedRecords: errors.length,
                            status: errors.length === 0 ? 'completed' : (processedCount > 0 ? 'completed' : 'failed'),
                            errors: errors,
                        }];
                }
            });
        });
    };
    // ============================================================================
    // Portfolio Analytics
    // ============================================================================
    /**
     * Generate portfolio summary for bank dashboard
     */
    NPLVerificationService.prototype.generatePortfolioSummary = function (properties) {
        return __awaiter(this, void 0, void 0, function () {
            var totalOutstandingBalance, totalEstimatedRecovery, _i, properties_1, prop, byStatus, byPriority, propertiesWithRegistryIssues;
            return __generator(this, function (_a) {
                totalOutstandingBalance = properties.reduce(function (sum, p) { return sum + p.outstandingBalance; }, 0);
                totalEstimatedRecovery = 0;
                for (_i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                    prop = properties_1[_i];
                    if (prop.recoveryRecommendation) {
                        totalEstimatedRecovery += prop.recoveryRecommendation.estimatedRecoveryAmount;
                    }
                }
                byStatus = this.groupBy(properties, 'verificationStatus');
                byPriority = this.groupBy(properties, 'verificationPriority');
                propertiesWithRegistryIssues = properties.filter(function (p) {
                    var _a, _b;
                    return ((_a = p.riskAssessment) === null || _a === void 0 ? void 0 : _a.registryRisk.level) === 'critical' ||
                        ((_b = p.riskAssessment) === null || _b === void 0 ? void 0 : _b.registryRisk.level) === 'high';
                }).length;
                return [2 /*return*/, {
                        totalProperties: properties.length,
                        totalOutstandingBalance: totalOutstandingBalance,
                        totalEstimatedRecovery: totalEstimatedRecovery,
                        averageRecoveryRate: totalOutstandingBalance > 0
                            ? (totalEstimatedRecovery / totalOutstandingBalance) * 100
                            : 0,
                        byStatus: this.countByKey(byStatus),
                        byPriority: this.countByKey(byPriority),
                        byRiskLevel: this.countRiskLevels(properties),
                        propertiesWithRegistryIssues: propertiesWithRegistryIssues,
                    }];
            });
        });
    };
    // ============================================================================
    // Private Helper Methods
    // ============================================================================
    NPLVerificationService.prototype.fetchMarketValue = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Simulated - would call valuation API
                return [2 /*return*/, 15000000]; // KES 15M
            });
        });
    };
    NPLVerificationService.prototype.fetchComparableProperties = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Simulated - would fetch from property database
                return [2 /*return*/, [
                        { propertyId: 'comp_1', soldPrice: 14500000, soldDate: new Date('2025-11-15'), distanceKm: 0.5 },
                        { propertyId: 'comp_2', soldPrice: 16000000, soldDate: new Date('2025-10-20'), distanceKm: 1.2 },
                    ]];
            });
        });
    };
    NPLVerificationService.prototype.calculateValuationConfidence = function (comparableCount, daysSinceLoan) {
        var confidence = 50;
        confidence += Math.min(comparableCount * 10, 30);
        confidence += daysSinceLoan < 180 ? 10 : 0;
        return Math.min(confidence, 95);
    };
    NPLVerificationService.prototype.analyzeMarketTrend = function (comparables) {
        if (comparables.length < 2)
            return 'stable';
        // Simplified trend analysis
        return 'stable';
    };
    NPLVerificationService.prototype.generateValuationRecommendations = function (ltvRatio, marketTrend, confidence) {
        var recommendations = [];
        if (ltvRatio > 100) {
            recommendations.push('Property is underwater - consider restructuring or write-off');
        }
        if (marketTrend === 'declining') {
            recommendations.push('Market is declining - expedite sale to preserve value');
        }
        if (confidence < 70) {
            recommendations.push('Low confidence in valuation - recommend physical inspection');
        }
        return recommendations;
    };
    NPLVerificationService.prototype.fetchDigitalOwnershipHistory = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    NPLVerificationService.prototype.fetchPhysicalOwnershipHistory = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, []];
            });
        });
    };
    NPLVerificationService.prototype.identifyTitleGaps = function (digital, physical) {
        return [];
    };
    NPLVerificationService.prototype.detectFraudIndicators = function (digital, physical) {
        return [];
    };
    NPLVerificationService.prototype.checkRegistryConsistency = function (digital, physical) {
        return 'unknown';
    };
    NPLVerificationService.prototype.mergeOwnershipHistories = function (digital, physical) {
        return __spreadArray(__spreadArray([], digital, true), physical, true);
    };
    NPLVerificationService.prototype.estimateRecoveryRate = function (property, market, risk) {
        var baseRate = 70;
        // Adjust for market conditions
        if (market.trend === 'declining')
            baseRate -= 15;
        if (market.trend === 'rising')
            baseRate += 10;
        // Adjust for risk
        if (risk.overallRiskLevel === 'critical')
            baseRate -= 30;
        if (risk.overallRiskLevel === 'high')
            baseRate -= 20;
        // Adjust for registry issues
        if (risk.registryRisk.level === 'critical')
            baseRate -= 25;
        return Math.max(baseRate, 10);
    };
    NPLVerificationService.prototype.calculateRecommendationConfidence = function (risk) {
        var confidence = 85;
        if (risk.overallRiskLevel === 'critical')
            confidence -= 30;
        if (risk.overallRiskLevel === 'high')
            confidence -= 15;
        return Math.max(confidence, 40);
    };
    NPLVerificationService.prototype.generateRationale = function (action, property, market) {
        var rationales = {
            sell_immediate: "Quick sale recommended due to ".concat(market.trend, " market and ").concat(property.daysInDefault, " days in default."),
            sell_marketed: "Full marketing campaign recommended to maximize recovery in a ".concat(market.demandLevel, " demand market."),
            restructure_loan: "Loan restructuring may preserve relationship and recover more than forced sale.",
            write_off: "Property value unlikely to recover loan balance. Write-off minimizes further losses.",
            hold: "Market conditions suggest waiting for improvement before sale.",
            legal_action: "Title or registry issues require legal resolution before recovery action.",
            auction: "Auction recommended to accelerate recovery after extended default period.",
        };
        return rationales[action];
    };
    NPLVerificationService.prototype.estimateTimeToRecovery = function (action, market) {
        var estimates = {
            sell_immediate: { min: 1, max: 3, likely: 2 },
            sell_marketed: { min: 3, max: 9, likely: 6 },
            restructure_loan: { min: 6, max: 24, likely: 12 },
            write_off: { min: 1, max: 3, likely: 1 },
            hold: { min: 12, max: 36, likely: 18 },
            legal_action: { min: 12, max: 48, likely: 24 },
            auction: { min: 2, max: 6, likely: 3 },
        };
        var est = estimates[action];
        return {
            minMonths: est.min,
            maxMonths: est.max,
            mostLikelyMonths: est.likely,
            factors: ["Market demand: ".concat(market.demandLevel), "Market trend: ".concat(market.trend)],
        };
    };
    NPLVerificationService.prototype.identifyRecoveryRisks = function (property, action, risk) {
        var risks = [];
        if (risk.registryRisk.level !== 'low') {
            risks.push({
                type: 'registry_mismatch',
                severity: risk.registryRisk.level === 'critical' ? 'high' : 'medium',
                description: 'Physical and digital registry records may not match',
                mitigationStrategy: 'Obtain blockchain-anchored proof before proceeding',
            });
        }
        return risks;
    };
    NPLVerificationService.prototype.generateAlternativeActions = function (property, primaryAction, market) {
        return [];
    };
    NPLVerificationService.prototype.validateImportRow = function (row, rowNumber) {
        var errors = [];
        if (!row.loan_id) {
            errors.push({ rowNumber: rowNumber, field: 'loan_id', error: 'Loan ID is required', rawValue: '' });
        }
        if (!row.outstanding_balance || row.outstanding_balance <= 0) {
            errors.push({
                rowNumber: rowNumber,
                field: 'outstanding_balance',
                error: 'Outstanding balance must be positive',
                rawValue: String(row.outstanding_balance),
            });
        }
        return { data: row, errors: errors };
    };
    NPLVerificationService.prototype.createNPLProperty = function (bankId, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    NPLVerificationService.prototype.groupBy = function (items, key) {
        return items.reduce(function (acc, item) {
            var k = String(item[key]);
            if (!acc[k])
                acc[k] = [];
            acc[k].push(item);
            return acc;
        }, {});
    };
    NPLVerificationService.prototype.countByKey = function (grouped) {
        return Object.entries(grouped).reduce(function (acc, _a) {
            var key = _a[0], items = _a[1];
            acc[key] = items.length;
            return acc;
        }, {});
    };
    NPLVerificationService.prototype.countRiskLevels = function (properties) {
        return properties.reduce(function (acc, p) {
            var _a;
            var level = ((_a = p.riskAssessment) === null || _a === void 0 ? void 0 : _a.overallRiskLevel) || 'unknown';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
    };
    return NPLVerificationService;
}());
exports.NPLVerificationService = NPLVerificationService;
// Export singleton instance
exports.nplVerificationService = new NPLVerificationService();
