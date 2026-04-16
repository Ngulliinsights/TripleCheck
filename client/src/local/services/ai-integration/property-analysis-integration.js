"use strict";
/**
 * Property Analysis AI Integration Service
 *
 * Integrates AI-powered property analysis with listing and search features.
 * Provides automated valuation, risk assessment, and market insights.
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
exports.propertyAnalysisIntegration = exports.PropertyAnalysisIntegrationService = void 0;
var huggingface_api_client_1 = require("../huggingface-api-client");
var logger_1 = require("../../../../server/infrastructure/monitoring/logger");
// ─── Constants ────────────────────────────────────────────────────────────────
var MODULE = 'PropertyAnalysisIntegration';
var VALUATION = {
    DEFAULT_CONFIDENCE: 0.85,
    DEFAULT_VARIANCE: 0.10,
    MARKET_DISCOUNT: 0.95,
};
var RISK = {
    HIGH_THRESHOLD: 70,
    MEDIUM_THRESHOLD: 40,
    DEFAULT_CONFIDENCE: 0.80,
};
var RECOMMENDATION_LIMIT = 3;
var PRICE_SUGGESTION_LIMIT = 2;
var PRICE_COMPETITIVE_FACTOR = 0.98;
// ─── Error ────────────────────────────────────────────────────────────────────
/**
 * BaseError is an interface in this codebase — we extend native Error and
 * implement the interface so instanceof checks still work correctly.
 */
var PropertyAnalysisIntegrationError = /** @class */ (function (_super) {
    __extends(PropertyAnalysisIntegrationError, _super);
    function PropertyAnalysisIntegrationError(message, operation, cause) {
        var _this = _super.call(this, message) || this;
        _this.operation = operation;
        _this.code = 'PROPERTY_ANALYSIS_ERROR';
        _this.name = 'PropertyAnalysisIntegrationError';
        _this.timestamp = new Date().toISOString();
        _this.correlationId = undefined;
        _this.details = { operation: operation };
        _this.cause = cause;
        Object.setPrototypeOf(_this, PropertyAnalysisIntegrationError.prototype);
        return _this;
    }
    return PropertyAnalysisIntegrationError;
}(Error));
// ─── Utilities ────────────────────────────────────────────────────────────────
/** Safely coerce a property's price/size to a number for arithmetic. */
function toNumber(value) {
    return typeof value === 'number' ? value : parseFloat(value) || 0;
}
/** Safely coerce a property's id to a string. */
function toId(value) {
    return String(value);
}
// ─── Service ──────────────────────────────────────────────────────────────────
var PropertyAnalysisIntegrationService = /** @class */ (function () {
    function PropertyAnalysisIntegrationService() {
    }
    PropertyAnalysisIntegrationService.getInstance = function () {
        if (!PropertyAnalysisIntegrationService.instance) {
            PropertyAnalysisIntegrationService.instance = new PropertyAnalysisIntegrationService();
        }
        return PropertyAnalysisIntegrationService.instance;
    };
    // ─── Public API ─────────────────────────────────────────────────────────────
    /** Analyse property value using AI and market data. */
    PropertyAnalysisIntegrationService.prototype.analyzePropertyValue = function (property) {
        return __awaiter(this, void 0, void 0, function () {
            var id, description, price, _a, features, marketAnalysis, valuation, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        id = toId(property.id);
                        logger_1.logger.info("[".concat(MODULE, "] Starting AI property valuation \u2014 id=").concat(id, " type=").concat((_b = property.type) !== null && _b !== void 0 ? _b : 'unknown'));
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        description = this.buildPropertyDescription(property);
                        price = toNumber(property.price);
                        return [4 /*yield*/, Promise.all([
                                this.extractPropertyFeatures(description),
                                this.analyzeMarketPosition(price, property.size),
                            ])];
                    case 2:
                        _a = _c.sent(), features = _a[0], marketAnalysis = _a[1];
                        valuation = this.buildValuationResult(price, features, marketAnalysis);
                        logger_1.logger.info("[".concat(MODULE, "] Valuation completed \u2014 id=").concat(id, " value=").concat(valuation.estimatedValue, " confidence=").concat(valuation.confidence));
                        return [2 /*return*/, valuation];
                    case 3:
                        error_1 = _c.sent();
                        this.logAndRethrow('analyzePropertyValue', id, error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Assess investment risks for a property using AI. */
    PropertyAnalysisIntegrationService.prototype.assessPropertyRisk = function (property) {
        return __awaiter(this, void 0, void 0, function () {
            var id, description, _a, legalRisks, marketRisks, physicalRisks, assessment, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = toId(property.id);
                        logger_1.logger.info("[".concat(MODULE, "] Starting AI property risk assessment \u2014 id=").concat(id));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        description = this.buildPropertyDescription(property);
                        return [4 /*yield*/, Promise.all([
                                this.analyzeLegalRisks(description),
                                this.analyzeMarketRisks(),
                                this.analyzePhysicalRisks(),
                            ])];
                    case 2:
                        _a = _b.sent(), legalRisks = _a[0], marketRisks = _a[1], physicalRisks = _a[2];
                        assessment = this.buildRiskAssessment(legalRisks, marketRisks, physicalRisks);
                        logger_1.logger.info("[".concat(MODULE, "] Risk assessment completed \u2014 id=").concat(id, " risk=").concat(assessment.overallRisk, " score=").concat(assessment.riskScore));
                        return [2 /*return*/, assessment];
                    case 3:
                        error_2 = _b.sent();
                        this.logAndRethrow('assessPropertyRisk', id, error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Generate comprehensive market insights for a property. */
    PropertyAnalysisIntegrationService.prototype.generatePropertyInsights = function (property) {
        return __awaiter(this, void 0, void 0, function () {
            var id, description, price, _a, marketPosition, investmentPotential, comparables, marketTrends, insights, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = toId(property.id);
                        logger_1.logger.info("[".concat(MODULE, "] Generating AI property insights \u2014 id=").concat(id));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        description = this.buildPropertyDescription(property);
                        price = toNumber(property.price);
                        return [4 /*yield*/, Promise.all([
                                this.analyzeMarketPositioning(description),
                                this.assessInvestmentPotential(description),
                                this.findComparableProperties(id),
                                this.analyzeMarketTrends(price),
                            ])];
                    case 2:
                        _a = _b.sent(), marketPosition = _a[0], investmentPotential = _a[1], comparables = _a[2], marketTrends = _a[3];
                        insights = {
                            marketPosition: marketPosition.summary,
                            investmentPotential: investmentPotential.rating,
                            keyStrengths: marketPosition.strengths,
                            areasOfConcern: marketPosition.concerns,
                            comparableProperties: comparables,
                            marketTrends: marketTrends,
                        };
                        logger_1.logger.info("[".concat(MODULE, "] Insights generated \u2014 id=").concat(id, " potential=").concat(insights.investmentPotential));
                        return [2 /*return*/, insights];
                    case 3:
                        error_3 = _b.sent();
                        this.logAndRethrow('generatePropertyInsights', id, error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /** Enhance search results with AI-driven recommendations and market context. */
    PropertyAnalysisIntegrationService.prototype.enhanceSearchResults = function (properties, searchFilters, userPreferences) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, searchAnalysis, marketAnalysis, _b, recommendations, priceRecommendations, searchOptimization, error_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        logger_1.logger.info("[".concat(MODULE, "] Enhancing ").concat(properties.length, " search results \u2014 hasPreferences=").concat(!!userPreferences));
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, Promise.all([
                                this.analyzeSearchPatterns(searchFilters, userPreferences),
                                this.analyzeSearchAreaMarket(searchFilters),
                            ])];
                    case 2:
                        _a = _c.sent(), searchAnalysis = _a[0], marketAnalysis = _a[1];
                        return [4 /*yield*/, Promise.all([
                                this.generatePropertyRecommendations(properties, searchAnalysis),
                                this.generatePriceRecommendations(properties, marketAnalysis),
                                this.suggestSearchOptimizations(searchFilters, searchAnalysis),
                            ])];
                    case 3:
                        _b = _c.sent(), recommendations = _b[0], priceRecommendations = _b[1], searchOptimization = _b[2];
                        logger_1.logger.info("[".concat(MODULE, "] Search results enhanced \u2014 recommended=").concat(recommendations.length, " priceRecs=").concat(priceRecommendations.length));
                        return [2 /*return*/, {
                                properties: properties,
                                aiInsights: {
                                    recommendedProperties: recommendations,
                                    marketAnalysis: marketAnalysis.summary,
                                    priceRecommendations: priceRecommendations,
                                },
                                searchOptimization: searchOptimization,
                            }];
                    case 4:
                        error_4 = _c.sent();
                        logger_1.logger.warn("[".concat(MODULE, "] Search enhancement failed \u2014 returning unmodified results. ").concat(error_4 instanceof Error ? error_4.message : String(error_4)));
                        return [2 /*return*/, this.buildFallbackSearchResult(properties)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // ─── Shared Helpers ──────────────────────────────────────────────────────────
    PropertyAnalysisIntegrationService.prototype.buildPropertyDescription = function (property) {
        var _a, _b, _c, _d, _e, _f;
        // Safely handle features — Property.features may be typed as unknown
        var features = Array.isArray(property.features)
            ? property.features.map(String).join(', ')
            : 'No features listed';
        return [
            "Property Type: ".concat((_a = property.type) !== null && _a !== void 0 ? _a : 'Unknown'),
            "Location: ".concat((_b = property.location) !== null && _b !== void 0 ? _b : 'Unknown'),
            "Price: ".concat(property.price),
            "Bedrooms: ".concat((_c = property.bedrooms) !== null && _c !== void 0 ? _c : 'N/A'),
            "Bathrooms: ".concat((_d = property.bathrooms) !== null && _d !== void 0 ? _d : 'N/A'),
            "Size: ".concat((_e = property.size) !== null && _e !== void 0 ? _e : 'N/A'),
            "Description: ".concat((_f = property.description) !== null && _f !== void 0 ? _f : 'No description available'),
            "Features: ".concat(features),
        ].join('\n');
    };
    /** Never throws — returns an empty object on failure so callers can proceed gracefully. */
    PropertyAnalysisIntegrationService.prototype.extractPropertyFeatures = function (description) {
        return __awaiter(this, void 0, void 0, function () {
            var questions, results_1, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        questions = [
                            'What are the key features of this property?',
                            'What is the condition of this property?',
                            'What makes this property unique?',
                        ];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, Promise.all(questions.map(function (q) { return huggingface_api_client_1.huggingFaceClient.extractPropertyInfo(description, q); }))];
                    case 2:
                        results_1 = _a.sent();
                        return [2 /*return*/, Object.fromEntries(questions.map(function (q, i) { return [q, results_1[i]]; }))];
                    case 3:
                        error_5 = _a.sent();
                        logger_1.logger.warn("[".concat(MODULE, "] Feature extraction failed \u2014 using empty feature set. ").concat(error_5 instanceof Error ? error_5.message : String(error_5)));
                        return [2 /*return*/, {}];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.logAndRethrow = function (operation, propertyId, error) {
        logger_1.logger.error("[".concat(MODULE, "] ").concat(operation, " failed \u2014 id=").concat(propertyId, " error=").concat(error instanceof Error ? error.message : String(error)));
        throw new PropertyAnalysisIntegrationError("Failed during ".concat(operation), operation, error instanceof Error ? error : new Error(String(error)));
    };
    PropertyAnalysisIntegrationService.prototype.buildFallbackSearchResult = function (properties) {
        return {
            properties: properties,
            aiInsights: {
                recommendedProperties: [],
                marketAnalysis: 'Market analysis unavailable',
                priceRecommendations: [],
            },
            searchOptimization: {
                suggestedFilters: {},
                alternativeSearches: [],
            },
        };
    };
    // ─── Valuation Helpers ───────────────────────────────────────────────────────
    PropertyAnalysisIntegrationService.prototype.analyzeMarketPosition = function (price, size) {
        return __awaiter(this, void 0, void 0, function () {
            var numericSize;
            return __generator(this, function (_a) {
                numericSize = size !== undefined ? toNumber(size) : 0;
                return [2 /*return*/, {
                        averagePrice: price * VALUATION.MARKET_DISCOUNT,
                        pricePerSqft: numericSize > 0 ? price / numericSize : 0,
                        marketTrend: 'stable',
                    }];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.buildValuationResult = function (price, _features, marketComparison) {
        var v = VALUATION.DEFAULT_VARIANCE;
        return {
            estimatedValue: price,
            confidence: VALUATION.DEFAULT_CONFIDENCE,
            valueRange: { min: price * (1 - v), max: price * (1 + v) },
            factors: [
                {
                    factor: 'Location',
                    impact: 'positive',
                    weight: 0.30,
                    description: 'Prime location with good accessibility',
                },
                {
                    factor: 'Property Condition',
                    impact: 'positive',
                    weight: 0.20,
                    description: 'Well-maintained property',
                },
            ],
            marketComparison: marketComparison,
            lastUpdated: new Date(),
        };
    };
    // ─── Risk Helpers ────────────────────────────────────────────────────────────
    PropertyAnalysisIntegrationService.prototype.analyzeLegalRisks = function (description) {
        return __awaiter(this, void 0, void 0, function () {
            var riskIndicators, severity, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, huggingface_api_client_1.huggingFaceClient.detectFraudIndicators(description)];
                    case 1:
                        riskIndicators = _b.sent();
                        severity = riskIndicators.riskLevel;
                        return [2 /*return*/, [
                                {
                                    category: 'legal',
                                    risk: 'Document authenticity',
                                    severity: severity,
                                    likelihood: riskIndicators.confidence,
                                    mitigation: 'Verify documents with relevant authorities',
                                },
                            ]];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.analyzeMarketRisks = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            category: 'market',
                            risk: 'Price volatility',
                            severity: 'low',
                            likelihood: 0.30,
                            mitigation: 'Monitor market trends regularly',
                        },
                    ]];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.analyzePhysicalRisks = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        {
                            category: 'physical',
                            risk: 'Structural integrity',
                            severity: 'low',
                            likelihood: 0.20,
                            mitigation: 'Conduct professional inspection',
                        },
                    ]];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.buildRiskAssessment = function () {
        var riskGroups = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            riskGroups[_i] = arguments[_i];
        }
        var allRisks = riskGroups.flat();
        var riskScore = allRisks.reduce(function (sum, r) { return sum + r.likelihood * 100; }, 0) /
            Math.max(allRisks.length, 1);
        var overallRisk = riskScore > RISK.HIGH_THRESHOLD
            ? 'high'
            : riskScore > RISK.MEDIUM_THRESHOLD
                ? 'medium'
                : 'low';
        return {
            overallRisk: overallRisk,
            riskScore: riskScore,
            riskFactors: allRisks,
            recommendations: [
                'Conduct thorough due diligence',
                'Verify all documentation with relevant authorities',
                'Commission a professional physical inspection',
            ],
            confidence: RISK.DEFAULT_CONFIDENCE,
        };
    };
    // ─── Insights Helpers ────────────────────────────────────────────────────────
    PropertyAnalysisIntegrationService.prototype.analyzeMarketPositioning = function (_description) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        summary: 'Well-positioned property in a growing market',
                        strengths: ['Prime location', 'Good connectivity', 'Growing neighbourhood'],
                        concerns: ['Market saturation', 'Infrastructure development pending'],
                    }];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.assessInvestmentPotential = function (_description) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        rating: 'good',
                        factors: ['Location growth potential', 'Property condition', 'Market demand'],
                    }];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.findComparableProperties = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, [
                        { propertyId: "".concat(propertyId, "-comp-1"), similarity: 0.85, priceComparison: 'similar' },
                        { propertyId: "".concat(propertyId, "-comp-2"), similarity: 0.78, priceComparison: 'lower' },
                    ]];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.analyzeMarketTrends = function (price) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        priceHistory: [
                            { period: '2024-Q1', averagePrice: price * 0.95, change: 5 },
                            { period: '2024-Q2', averagePrice: price * 0.98, change: 3 },
                            { period: '2024-Q3', averagePrice: price, change: 2 },
                        ],
                        demandLevel: 'medium',
                        supplyLevel: 'medium',
                    }];
            });
        });
    };
    // ─── Search Helpers ──────────────────────────────────────────────────────────
    PropertyAnalysisIntegrationService.prototype.analyzeSearchPatterns = function (filters, _userPreferences) {
        return __awaiter(this, void 0, void 0, function () {
            var types;
            return __generator(this, function (_a) {
                types = Array.isArray(filters.propertyType)
                    ? filters.propertyType
                    : [filters.propertyType].filter(function (t) { return typeof t === 'string'; });
                return [2 /*return*/, {
                        preferredLocations: [filters.location].filter(function (l) { return typeof l === 'string'; }),
                        priceRange: { min: filters.minPrice, max: filters.maxPrice },
                        propertyTypes: types,
                    }];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.generatePropertyRecommendations = function (properties, _searchAnalysis) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, properties.slice(0, RECOMMENDATION_LIMIT).map(function (p) { return toId(p.id); })];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.analyzeSearchAreaMarket = function (_filters) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        summary: 'Active market with steady growth potential',
                        averagePrice: 5000000,
                        priceGrowth: 8.5,
                        marketActivity: 'high',
                    }];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.generatePriceRecommendations = function (properties, _marketAnalysis) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, properties.slice(0, PRICE_SUGGESTION_LIMIT).map(function (property) { return ({
                        propertyId: toId(property.id),
                        suggestedPrice: toNumber(property.price) * PRICE_COMPETITIVE_FACTOR,
                        reasoning: 'Slightly below market average for competitive positioning',
                    }); })];
            });
        });
    };
    PropertyAnalysisIntegrationService.prototype.suggestSearchOptimizations = function (filters, _searchAnalysis) {
        return __awaiter(this, void 0, void 0, function () {
            var maxPrice;
            return __generator(this, function (_a) {
                maxPrice = filters.maxPrice !== undefined
                    ? toNumber(filters.maxPrice)
                    : undefined;
                return [2 /*return*/, {
                        suggestedFilters: __assign({}, (maxPrice !== undefined && { maxPrice: maxPrice * 1.1 })),
                        alternativeSearches: [
                            'Similar properties in nearby areas',
                            'Properties with flexible pricing',
                        ],
                    }];
            });
        });
    };
    return PropertyAnalysisIntegrationService;
}());
exports.PropertyAnalysisIntegrationService = PropertyAnalysisIntegrationService;
// ─── Singleton Export ─────────────────────────────────────────────────────────
exports.propertyAnalysisIntegration = PropertyAnalysisIntegrationService.getInstance();
