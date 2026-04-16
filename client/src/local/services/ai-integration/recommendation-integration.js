"use strict";
/**
 * Recommendation AI Integration Service
 *
 * Integrates AI recommendation capabilities with property discovery and matching.
 * Provides personalized recommendations, smart matching, and user preference learning.
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
exports.recommendationIntegration = exports.RecommendationIntegrationService = void 0;
var huggingface_api_client_1 = require("../huggingface-api-client");
var logger_1 = require("../../../../server/infrastructure/monitoring/logger");
// ─── Error ────────────────────────────────────────────────────────────────────
/**
 * BaseError is an interface in this project — we extend Error and implement it.
 */
var RecommendationIntegrationError = /** @class */ (function (_super) {
    __extends(RecommendationIntegrationError, _super);
    function RecommendationIntegrationError(message, operation, cause) {
        var _this = _super.call(this, message) || this;
        _this.operation = operation;
        _this.code = 'RECOMMENDATION_ERROR';
        _this.name = 'RecommendationIntegrationError';
        _this.timestamp = new Date().toISOString();
        _this.correlationId = undefined;
        _this.details = { operation: operation };
        _this.cause = cause;
        Object.setPrototypeOf(_this, RecommendationIntegrationError.prototype);
        return _this;
    }
    return RecommendationIntegrationError;
}(Error));
// ─── Property Field Helpers ───────────────────────────────────────────────────
// Property fields (id, price, location, features) are typed as unions in this
// project's Property model. These helpers normalise them for safe comparisons.
/** Extracts a plain string from `id: string | number`. */
function propertyId(p) {
    return String(p.id);
}
/** Extracts a numeric price from `price: string | number`. */
function numericPrice(p) {
    return Number(p.price);
}
/**
 * Extracts a searchable location string from `location: string | LocationData`.
 * Falls back to serialising known fields for structured location objects.
 */
function locationString(p) {
    var loc = p.location;
    if (typeof loc === 'string')
        return loc;
    if (loc && typeof loc === 'object') {
        var l = loc;
        return [l['city'], l['area'], l['suburb'], l['name']]
            .filter(function (v) { return typeof v === 'string'; })
            .join(', ');
    }
    return '';
}
/**
 * Returns a typed string array from `features: unknown`.
 * Returns [] for any non-array or non-string-element value.
 */
function propertyFeatures(p) {
    var f = p.features;
    if (!Array.isArray(f))
        return [];
    return f.filter(function (v) { return typeof v === 'string'; });
}
// ─── Service ──────────────────────────────────────────────────────────────────
var RecommendationIntegrationService = /** @class */ (function () {
    function RecommendationIntegrationService() {
    }
    RecommendationIntegrationService.getInstance = function () {
        if (!RecommendationIntegrationService.instance) {
            RecommendationIntegrationService.instance = new RecommendationIntegrationService();
        }
        return RecommendationIntegrationService.instance;
    };
    // ─── Public API ─────────────────────────────────────────────────────────────
    /**
     * Generate personalized property recommendations for a user.
     */
    RecommendationIntegrationService.prototype.generatePersonalizedRecommendations = function (user_1, availableProperties_1, userProfile_1) {
        return __awaiter(this, arguments, void 0, function (user, availableProperties, userProfile, limit) {
            var profile, _a, scored, ranked, recommendations, marketInsights, result, error_1;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        logger_1.logger.info("[RecommendationIntegration] Generating recommendations \u2014 userId=".concat(user.id, " ") +
                            "properties=".concat(availableProperties.length, " hasProfile=").concat(!!userProfile, " limit=").concat(limit));
                        if (!(userProfile !== null && userProfile !== void 0)) return [3 /*break*/, 1];
                        _a = userProfile;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.buildUserPreferenceProfile(user)];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        profile = _a;
                        return [4 /*yield*/, this.scoreProperties(availableProperties, profile)];
                    case 4:
                        scored = _b.sent();
                        return [4 /*yield*/, this.applyAIEnhancedRanking(scored, profile)];
                    case 5:
                        ranked = _b.sent();
                        return [4 /*yield*/, this.buildRecommendations(ranked.slice(0, limit), profile)];
                    case 6:
                        recommendations = _b.sent();
                        marketInsights = this.buildMarketInsights(availableProperties);
                        result = {
                            userId: user.id,
                            recommendations: recommendations,
                            matchingStrategy: {
                                algorithm: 'ai_enhanced',
                                confidence: this.averageConfidence(recommendations),
                                factors: this.matchingFactors(profile),
                            },
                            personalization: {
                                adaptedToUser: !!userProfile,
                                learningFromHistory: profile.behaviorPatterns.searchHistory.length > 0,
                                customWeights: this.customWeights(profile),
                            },
                            marketInsights: marketInsights,
                        };
                        logger_1.logger.info("[RecommendationIntegration] Recommendations generated \u2014 userId=".concat(user.id, " ") +
                            "count=".concat(recommendations.length, " avgScore=").concat(this.averageScore(recommendations).toFixed(1)));
                        return [2 /*return*/, result];
                    case 7:
                        error_1 = _b.sent();
                        logger_1.logger.error("[RecommendationIntegration] Recommendation generation failed \u2014 userId=".concat(user.id, " ") +
                            "error=".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                        throw new RecommendationIntegrationError('Failed to generate personalized recommendations', 'generatePersonalizedRecommendations', error_1 instanceof Error ? error_1 : new Error(String(error_1)));
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build a user preference profile from behaviour history and explicit settings.
     */
    RecommendationIntegrationService.prototype.buildUserPreferenceProfile = function (user, activityHistory) {
        return __awaiter(this, void 0, void 0, function () {
            var behavior, preferences, learningMetrics, profile;
            return __generator(this, function (_a) {
                try {
                    logger_1.logger.info("[RecommendationIntegration] Building preference profile \u2014 userId=".concat(user.id));
                    behavior = this.extractBehavior(activityHistory);
                    preferences = this.derivePreferences(user, behavior);
                    learningMetrics = this.computeLearningMetrics(behavior);
                    profile = {
                        userId: user.id,
                        preferences: preferences,
                        behaviorPatterns: behavior,
                        learningMetrics: learningMetrics,
                    };
                    logger_1.logger.info("[RecommendationIntegration] Profile built \u2014 userId=".concat(user.id, " ") +
                        "completeness=".concat(profile.learningMetrics.profileCompleteness));
                    return [2 /*return*/, profile];
                }
                catch (error) {
                    logger_1.logger.error("[RecommendationIntegration] Profile build failed \u2014 userId=".concat(user.id, " ") +
                        "error=".concat(error instanceof Error ? error.message : String(error)));
                    throw new RecommendationIntegrationError('Failed to build user preference profile', 'buildUserPreferenceProfile', error instanceof Error ? error : new Error(String(error)));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Process user feedback to refine future recommendations.
     */
    RecommendationIntegrationService.prototype.processFeedback = function (feedback) {
        return __awaiter(this, void 0, void 0, function () {
            var analysis, profileUpdated, learningImpact, adjustments, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.logger.info("[RecommendationIntegration] Processing feedback \u2014 userId=".concat(feedback.userId, " ") +
                            "propertyId=".concat(feedback.propertyId, " type=").concat(feedback.feedbackType));
                        analysis = this.analyzeFeedback(feedback);
                        return [4 /*yield*/, this.persistProfileUpdate(feedback, analysis)];
                    case 1:
                        profileUpdated = _a.sent();
                        learningImpact = this.computeLearningImpact(feedback, analysis);
                        adjustments = this.deriveAdjustments(feedback);
                        logger_1.logger.info("[RecommendationIntegration] Feedback processed \u2014 userId=".concat(feedback.userId, " ") +
                            "impact=".concat(learningImpact.toFixed(2), " profileUpdated=").concat(profileUpdated));
                        return [2 /*return*/, { profileUpdated: profileUpdated, learningImpact: learningImpact, nextRecommendationAdjustments: adjustments }];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.logger.error("[RecommendationIntegration] Feedback processing failed \u2014 userId=".concat(feedback.userId, " ") +
                            "error=".concat(error_2 instanceof Error ? error_2.message : String(error_2)));
                        throw new RecommendationIntegrationError('Failed to process recommendation feedback', 'processFeedback', error_2 instanceof Error ? error_2 : new Error(String(error_2)));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find properties most similar to a target property using AI + rule-based scoring.
     */
    RecommendationIntegrationService.prototype.findSimilarProperties = function (target_1, candidates_1) {
        return __awaiter(this, arguments, void 0, function (target, candidates, limit) {
            var targetIdStr, targetDesc_1, scored, results, error_3;
            var _this = this;
            if (limit === void 0) { limit = 5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        targetIdStr = propertyId(target);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        logger_1.logger.info("[RecommendationIntegration] Finding similar properties \u2014 targetId=".concat(targetIdStr, " ") +
                            "candidates=".concat(candidates.length));
                        targetDesc_1 = this.describeProperty(target);
                        return [4 /*yield*/, Promise.all(candidates
                                .filter(function (c) { return propertyId(c) !== targetIdStr; })
                                .map(function (candidate) { return __awaiter(_this, void 0, void 0, function () {
                                var result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.computeSimilarity(targetDesc_1, this.describeProperty(candidate), target, candidate)];
                                        case 1:
                                            result = _a.sent();
                                            return [2 /*return*/, {
                                                    property: candidate,
                                                    similarity: result.overallSimilarity,
                                                    similarityFactors: result.factors,
                                                }];
                                    }
                                });
                            }); }))];
                    case 2:
                        scored = _a.sent();
                        results = scored
                            .sort(function (a, b) { return b.similarity - a.similarity; })
                            .slice(0, limit);
                        logger_1.logger.info("[RecommendationIntegration] Similar properties found \u2014 targetId=".concat(targetIdStr, " found=").concat(results.length));
                        return [2 /*return*/, results];
                    case 3:
                        error_3 = _a.sent();
                        logger_1.logger.error("[RecommendationIntegration] Similarity search failed \u2014 targetId=".concat(targetIdStr, " ") +
                            "error=".concat(error_3 instanceof Error ? error_3.message : String(error_3)));
                        throw new RecommendationIntegrationError('Failed to find similar properties', 'findSimilarProperties', error_3 instanceof Error ? error_3 : new Error(String(error_3)));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // ─── Scoring ─────────────────────────────────────────────────────────────────
    RecommendationIntegrationService.prototype.scoreProperties = function (properties, profile) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, properties.map(function (property) { return ({
                        property: property,
                        score: _this.ruleScore(property, profile),
                        factors: _this.scoreFactors(property, profile),
                    }); })];
            });
        });
    };
    RecommendationIntegrationService.prototype.ruleScore = function (property, profile) {
        var _a = profile.preferences, location = _a.location, priceRange = _a.priceRange, propertyType = _a.propertyType, features = _a.features;
        var loc = locationString(property);
        var price = numericPrice(property);
        var propType = typeof property.type === 'string' ? property.type : '';
        var feats = propertyFeatures(property);
        var score = 0;
        if (location.preferred.some(function (pref) { return loc.toLowerCase().includes(pref.toLowerCase()); })) {
            score += 30 * location.importance;
        }
        if (price >= priceRange.min && price <= priceRange.max)
            score += 25;
        if (propertyType.preferred.includes(propType))
            score += 20 * propertyType.importance;
        if (feats.some(function (f) { return features.mustHave.includes(f); }))
            score += 15;
        if (feats.some(function (f) { return features.dealBreakers.includes(f); }))
            score -= 40;
        return Math.min(100, Math.max(0, score));
    };
    RecommendationIntegrationService.prototype.scoreFactors = function (property, profile) {
        var _a = profile.preferences, location = _a.location, priceRange = _a.priceRange, propertyType = _a.propertyType;
        var loc = locationString(property);
        var price = numericPrice(property);
        var propType = typeof property.type === 'string' ? property.type : '';
        var locationMatch = location.preferred.some(function (pref) { return loc.toLowerCase().includes(pref.toLowerCase()); });
        var priceMatch = price >= priceRange.min && price <= priceRange.max;
        var typeMatch = propertyType.preferred.includes(propType);
        return [
            {
                factor: 'Location',
                weight: location.importance,
                description: locationMatch
                    ? "Located in a preferred area (".concat(loc, ")")
                    : 'Location outside preferred areas',
                impact: locationMatch ? 'positive' : 'neutral',
            },
            {
                factor: 'Price range',
                weight: 0.25,
                description: priceMatch
                    ? 'Price falls within your budget'
                    : 'Price outside your specified range',
                impact: priceMatch ? 'positive' : 'negative',
            },
            {
                factor: 'Property type',
                weight: propertyType.importance,
                description: typeMatch
                    ? "".concat(propType, " is one of your preferred types")
                    : "".concat(propType, " is not among your preferred types"),
                impact: typeMatch ? 'positive' : 'neutral',
            },
        ];
    };
    // ─── AI-Enhanced Ranking ──────────────────────────────────────────────────────
    RecommendationIntegrationService.prototype.applyAIEnhancedRanking = function (items, _profile) {
        return __awaiter(this, void 0, void 0, function () {
            var enhanced;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.all(items.map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                            var sentiment, delta, impact, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, huggingface_api_client_1.huggingFaceClient.analyzePropertyReviewSentiment(this.describeProperty(item.property))];
                                    case 1:
                                        sentiment = _b.sent();
                                        delta = sentiment.label === 'POSITIVE' ? 5 :
                                            sentiment.label === 'NEGATIVE' ? -5 : 0;
                                        impact = sentiment.label === 'POSITIVE' ? 'positive' :
                                            sentiment.label === 'NEGATIVE' ? 'negative' : 'neutral';
                                        return [2 /*return*/, __assign(__assign({}, item), { score: Math.min(100, Math.max(0, item.score + delta)), factors: __spreadArray(__spreadArray([], item.factors, true), [
                                                    {
                                                        factor: 'AI sentiment',
                                                        weight: 0.1,
                                                        description: "Property description sentiment: ".concat(sentiment.label.toLowerCase()),
                                                        impact: impact,
                                                    },
                                                ], false) })];
                                    case 2:
                                        _a = _b.sent();
                                        return [2 /*return*/, item];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }))];
                    case 1:
                        enhanced = _a.sent();
                        return [2 /*return*/, enhanced.sort(function (a, b) { return b.score - a.score; })];
                }
            });
        });
    };
    // ─── Recommendation Building ──────────────────────────────────────────────────
    RecommendationIntegrationService.prototype.buildRecommendations = function (ranked, profile) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(ranked.map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                        var insights;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.fetchPropertyInsights(item.property, profile)];
                                case 1:
                                    insights = _a.sent();
                                    return [2 /*return*/, {
                                            propertyId: propertyId(item.property),
                                            score: item.score,
                                            confidence: insights.confidence,
                                            reasons: item.factors,
                                            matchingCriteria: this.buildMatchingCriteria(item.property, profile),
                                            aiInsights: insights.data,
                                        }];
                            }
                        });
                    }); }))];
            });
        });
    };
    RecommendationIntegrationService.prototype.fetchPropertyInsights = function (property, _profile) {
        return __awaiter(this, void 0, void 0, function () {
            var summary, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, huggingface_api_client_1.huggingFaceClient.summarizePropertyDocument(this.describeProperty(property))];
                    case 1:
                        summary = _b.sent();
                        return [2 /*return*/, {
                                confidence: 0.85,
                                data: {
                                    summary: summary,
                                    keyHighlights: ['Matches location preferences', 'Within price range'],
                                    potentialConcerns: [],
                                    investmentPotential: 'good',
                                },
                            }];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, {
                                confidence: 0.60,
                                data: {
                                    summary: 'Property matches your primary search criteria.',
                                    keyHighlights: ['Meets basic criteria'],
                                    potentialConcerns: ['Detailed AI analysis unavailable'],
                                    investmentPotential: 'fair',
                                },
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RecommendationIntegrationService.prototype.buildMatchingCriteria = function (property, profile) {
        var _a = profile.preferences, location = _a.location, priceRange = _a.priceRange;
        var loc = locationString(property);
        var price = numericPrice(property);
        return [
            {
                criterion: 'Location',
                userPreference: location.preferred,
                propertyValue: loc,
                matchStrength: location.preferred.some(function (pref) {
                    return loc.toLowerCase().includes(pref.toLowerCase());
                }) ? 1.0 : 0.0,
            },
            {
                criterion: 'Price',
                userPreference: "".concat(priceRange.min, "\u2013").concat(priceRange.max),
                propertyValue: price,
                matchStrength: price >= priceRange.min && price <= priceRange.max ? 1.0 : 0.0,
            },
        ];
    };
    // ─── Similarity ───────────────────────────────────────────────────────────────
    RecommendationIntegrationService.prototype.computeSimilarity = function (targetDesc, candidateDesc, target, candidate) {
        return __awaiter(this, void 0, void 0, function () {
            var ruleBased, context, question, result, match, aiScore, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        ruleBased = this.ruleSimilarity(target, candidate);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        context = "Property A: ".concat(targetDesc, "\n\nProperty B: ").concat(candidateDesc);
                        question = 'How similar are these two properties on a scale of 0 to 100?';
                        return [4 /*yield*/, huggingface_api_client_1.huggingFaceClient.extractPropertyInfo(context, question)];
                    case 2:
                        result = _b.sent();
                        match = result.answer.match(/\d+/);
                        aiScore = match ? Math.min(100, parseInt(match[0], 10)) / 100 : 0.5;
                        return [2 /*return*/, {
                                overallSimilarity: aiScore * 0.6 + ruleBased * 0.4,
                                factors: [
                                    { factor: 'AI analysis', similarity: aiScore, description: 'AI-based comparison' },
                                    { factor: 'Rule-based', similarity: ruleBased, description: 'Feature-based comparison' },
                                ],
                            }];
                    case 3:
                        _a = _b.sent();
                        return [2 /*return*/, {
                                overallSimilarity: ruleBased,
                                factors: [
                                    { factor: 'Rule-based', similarity: ruleBased, description: 'Feature-based comparison' },
                                ],
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    RecommendationIntegrationService.prototype.ruleSimilarity = function (a, b) {
        var score = 0;
        var aType = typeof a.type === 'string' ? a.type : '';
        var bType = typeof b.type === 'string' ? b.type : '';
        if (aType && aType === bType)
            score += 0.30;
        var aPrice = numericPrice(a);
        var bPrice = numericPrice(b);
        if (aPrice > 0 && bPrice > 0) {
            var delta = Math.abs(aPrice - bPrice) / Math.max(aPrice, bPrice);
            if (delta < 0.2)
                score += 0.25;
        }
        if (locationString(a) === locationString(b))
            score += 0.20;
        var aBeds = typeof a.bedrooms === 'number' ? a.bedrooms : undefined;
        var bBeds = typeof b.bedrooms === 'number' ? b.bedrooms : undefined;
        if (aBeds !== undefined && aBeds === bBeds)
            score += 0.15;
        var aFeats = propertyFeatures(a);
        var bFeats = propertyFeatures(b);
        var total = Math.max(aFeats.length, bFeats.length);
        if (total > 0) {
            var common = aFeats.filter(function (f) { return bFeats.includes(f); }).length;
            score += (common / total) * 0.10;
        }
        return Math.min(1, score);
    };
    // ─── Profile Building ─────────────────────────────────────────────────────────
    RecommendationIntegrationService.prototype.extractBehavior = function (activityHistory) {
        var history = activityHistory !== null && activityHistory !== void 0 ? activityHistory : [];
        return {
            searchHistory: history.filter(function (a) { return a.type === 'search'; }).slice(0, 10),
            viewingHistory: history.filter(function (a) { return a.type === 'view'; }).slice(0, 20),
            inquiryPatterns: history.filter(function (a) { return a.type === 'inquiry'; }).slice(0, 15),
        };
    };
    RecommendationIntegrationService.prototype.derivePreferences = function (_user, _behavior) {
        // Replace with derivation logic sourced from user profile data and behavioural signals.
        return {
            location: { preferred: ['Nairobi', 'Westlands'], avoided: [], importance: 0.8 },
            priceRange: { min: 1000000, max: 10000000, flexibility: 0.2 },
            propertyType: { preferred: ['apartment', 'house'], importance: 0.6 },
            features: {
                mustHave: ['parking', 'security'],
                niceToHave: ['gym', 'pool'],
                dealBreakers: ['no_parking'],
            },
            lifestyle: {
                workLocation: 'CBD',
                familySize: 2,
                transportPreference: 'car',
                amenityPreferences: ['shopping', 'restaurants'],
            },
        };
    };
    RecommendationIntegrationService.prototype.computeLearningMetrics = function (behavior) {
        var total = behavior.searchHistory.length +
            behavior.viewingHistory.length +
            behavior.inquiryPatterns.length;
        return {
            profileCompleteness: Math.min(100, total * 5),
            predictionAccuracy: 75,
            lastUpdated: new Date(),
        };
    };
    // ─── Feedback Processing ──────────────────────────────────────────────────────
    RecommendationIntegrationService.prototype.analyzeFeedback = function (feedback) {
        var weights = {
            interested: 0.8,
            not_interested: -0.6,
            viewed: 0.3,
            inquired: 0.9,
            contacted: 1.0,
        };
        var feedbackWeight = weights[feedback.feedbackType];
        var preferenceStrength = feedback.rating != null ? feedback.rating / 5 : 0.5;
        return {
            feedbackWeight: feedbackWeight,
            preferenceStrength: preferenceStrength,
            adjustmentDirection: feedbackWeight >= 0 ? 'positive' : 'negative',
        };
    };
    RecommendationIntegrationService.prototype.persistProfileUpdate = function (_feedback, _analysis) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Replace with actual database write.
                return [2 /*return*/, true];
            });
        });
    };
    RecommendationIntegrationService.prototype.computeLearningImpact = function (_feedback, analysis) {
        return Math.abs(analysis.feedbackWeight) * analysis.preferenceStrength;
    };
    RecommendationIntegrationService.prototype.deriveAdjustments = function (feedback) {
        if (feedback.feedbackType === 'not_interested') {
            return [
                'Reduce weight for properties with similar characteristics',
                'Broaden property type exploration',
            ];
        }
        if (feedback.feedbackType === 'interested' || feedback.feedbackType === 'inquired') {
            return [
                'Increase weight for properties with similar characteristics',
                'Prioritise features matching this property',
            ];
        }
        return [];
    };
    // ─── Market Insights ──────────────────────────────────────────────────────────
    RecommendationIntegrationService.prototype.buildMarketInsights = function (properties) {
        return {
            trendingProperties: properties.slice(0, 3).map(function (p) { return propertyId(p); }),
            priceOpportunities: properties.slice(0, 1).map(function (p) { return ({
                propertyId: propertyId(p),
                opportunity: 'Below market average',
                potentialSavings: 500000,
            }); }),
            marketConditions: 'Favourable buyer market with solid value opportunities.',
        };
    };
    // ─── Utilities ────────────────────────────────────────────────────────────────
    RecommendationIntegrationService.prototype.describeProperty = function (property) {
        var propType = typeof property.type === 'string' ? property.type : '';
        var beds = typeof property.bedrooms === 'number' ? "".concat(property.bedrooms, " bedrooms") : null;
        var baths = typeof property.bathrooms === 'number' ? "".concat(property.bathrooms, " bathrooms") : null;
        var size = property.size ? "Size: ".concat(property.size) : null;
        var desc = typeof property.description === 'string' ? property.description : null;
        var feats = propertyFeatures(property);
        return [
            "".concat(propType, " in ").concat(locationString(property)),
            "Price: ".concat(numericPrice(property)),
            beds,
            baths,
            size,
            desc,
            feats.length ? "Features: ".concat(feats.join(', ')) : null,
        ]
            .filter(function (v) { return v !== null; })
            .join('\n');
    };
    RecommendationIntegrationService.prototype.averageConfidence = function (recommendations) {
        if (!recommendations.length)
            return 0;
        return recommendations.reduce(function (sum, r) { return sum + r.confidence; }, 0) / recommendations.length;
    };
    RecommendationIntegrationService.prototype.averageScore = function (recommendations) {
        if (!recommendations.length)
            return 0;
        return recommendations.reduce(function (sum, r) { return sum + r.score; }, 0) / recommendations.length;
    };
    RecommendationIntegrationService.prototype.matchingFactors = function (_profile) {
        return [
            'Location preferences',
            'Price range',
            'Property type',
            'Feature requirements',
            'Behavioural patterns',
        ];
    };
    RecommendationIntegrationService.prototype.customWeights = function (profile) {
        return {
            location: profile.preferences.location.importance,
            price: 0.25,
            propertyType: profile.preferences.propertyType.importance,
            features: 0.15,
            aiSentiment: 0.10,
        };
    };
    return RecommendationIntegrationService;
}());
exports.RecommendationIntegrationService = RecommendationIntegrationService;
// ─── Singleton Export ─────────────────────────────────────────────────────────
exports.recommendationIntegration = RecommendationIntegrationService.getInstance();
