"use strict";
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
exports.trustApi = void 0;
var trust_business_logic_1 = require("./trust-business-logic");
var queryClient_1 = require("@/infrastructure/api/queryClient");
var API_BASE = '/api/trust';
// Enhanced trust API with business logic integration
exports.trustApi = {
    // Get comprehensive trust score with analysis
    getTrustScore: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var data, analysis, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "".concat(API_BASE, "/score/").concat(userId), undefined, {
                            headers: {
                                'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                            },
                            requestOptions: {
                                key: "trust-score:".concat(userId),
                                priority: 'high',
                                cancelPrevious: true
                            }
                        })];
                case 1:
                    data = _a.sent();
                    if (data.data) {
                        analysis = trust_business_logic_1.TrustBusinessLogic.calculateTrustScore(data.data.trustScore.factors);
                        data.data.analysis = analysis;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_1 = _a.sent();
                    throw new Error('Failed to fetch trust score');
                case 3: return [2 /*return*/];
            }
        });
    }); },
    // Update trust score with validation
    updateTrustScore: function (userId, factors) { return __awaiter(void 0, void 0, void 0, function () {
        var currentScoreResponse, currentScore, updateCheck, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.trustApi.getTrustScore(userId)];
                case 1:
                    currentScoreResponse = _a.sent();
                    currentScore = currentScoreResponse.data.trustScore;
                    updateCheck = trust_business_logic_1.TrustBusinessLogic.shouldUpdateTrustScore(currentScore, factors);
                    if (!updateCheck.shouldUpdate) {
                        return [2 /*return*/, {
                                success: true,
                                data: currentScore,
                                message: updateCheck.reason,
                            }];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, queryClient_1.apiRequest)('PATCH', "".concat(API_BASE, "/score/").concat(userId), { factors: factors }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                            },
                            requestOptions: {
                                key: "update-trust-score:".concat(userId),
                                priority: 'high',
                                cancelPrevious: true
                            }
                        })];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_2 = _a.sent();
                    throw new Error('Failed to update trust score');
                case 5: return [2 /*return*/];
            }
        });
    }); },
    // Submit document for verification
    submitDocumentVerification: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var formData, response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    formData.append('type', data.type);
                    data.files.forEach(function (file, index) {
                        formData.append("document_".concat(index), file);
                    });
                    if (data.metadata) {
                        formData.append('metadata', JSON.stringify(data.metadata));
                    }
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/verification/submit"), {
                            method: 'POST',
                            headers: {
                                'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                            },
                            body: formData,
                        })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to submit verification');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Get verification status
    getVerificationStatus: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData, data, checks, totalChecks, completedChecks, completionPercentage, overallStatus, nextSteps_1, checkTypes, completedTypes_1, pendingTypes;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/verification/").concat(userId), {
                        headers: {
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                    })];
                case 1:
                    response = _b.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _b.sent();
                    throw new Error(errorData.message || 'Failed to fetch verification status');
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _b.sent();
                    if ((_a = data.data) === null || _a === void 0 ? void 0 : _a.checks) {
                        checks = data.data.checks;
                        totalChecks = 4;
                        completedChecks = checks.filter(function (check) {
                            return check.status === 'verified';
                        }).length;
                        completionPercentage = Math.round((completedChecks / totalChecks) * 100);
                        overallStatus = void 0;
                        if (completedChecks === 0) {
                            overallStatus = 'pending';
                        }
                        else if (completedChecks === totalChecks) {
                            overallStatus = 'complete';
                        }
                        else {
                            overallStatus = 'partial';
                        }
                        nextSteps_1 = [];
                        checkTypes = ['document', 'identity', 'property', 'financial'];
                        completedTypes_1 = checks
                            .filter(function (check) { return check.status === 'verified'; })
                            .map(function (check) { return check.type; });
                        pendingTypes = checkTypes.filter(function (type) { return !completedTypes_1.includes(type); });
                        pendingTypes.forEach(function (type) {
                            switch (type) {
                                case 'document':
                                    nextSteps_1.push('Upload government-issued ID and proof of address');
                                    break;
                                case 'identity':
                                    nextSteps_1.push('Complete video identity verification');
                                    break;
                                case 'property':
                                    nextSteps_1.push('Verify property ownership documents');
                                    break;
                                case 'financial':
                                    nextSteps_1.push('Provide financial verification documents');
                                    break;
                            }
                        });
                        data.data.completionPercentage = completionPercentage;
                        data.data.overallStatus = overallStatus;
                        data.data.nextSteps = nextSteps_1;
                    }
                    return [2 /*return*/, data];
            }
        });
    }); },
    // Report fraud or suspicious activity
    reportFraud: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var formData, response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formData = new FormData();
                    formData.append('alertType', data.alertType);
                    formData.append('description', data.description);
                    if (data.userId)
                        formData.append('userId', data.userId);
                    if (data.propertyId)
                        formData.append('propertyId', data.propertyId);
                    if (data.evidence) {
                        data.evidence.forEach(function (file, index) {
                            formData.append("evidence_".concat(index), file);
                        });
                    }
                    return [4 /*yield*/, fetch("".concat(API_BASE, "/fraud/report"), {
                            method: 'POST',
                            headers: {
                                'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                            },
                            body: formData,
                        })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to report fraud');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Get fraud alerts for user or property
    getFraudAlerts: function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (params) {
            var searchParams, response, errorData;
            if (params === void 0) { params = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        searchParams = new URLSearchParams();
                        Object.entries(params).forEach(function (_a) {
                            var key = _a[0], value = _a[1];
                            if (value)
                                searchParams.append(key, value);
                        });
                        return [4 /*yield*/, fetch("".concat(API_BASE, "/fraud/alerts?").concat(searchParams), {
                                headers: {
                                    'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                    case 2:
                        errorData = _a.sent();
                        throw new Error(errorData.message || 'Failed to fetch fraud alerts');
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        });
    },
    // Perform fraud risk assessment
    performFraudAssessment: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/fraud/assess"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                        body: JSON.stringify(data),
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to perform fraud assessment');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Get community trust data
    getCommunityTrust: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData, data, communityTrust;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/community/").concat(userId), {
                        headers: {
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to fetch community trust');
                case 3: return [4 /*yield*/, response.json()];
                case 4:
                    data = _a.sent();
                    if (data.data) {
                        communityTrust = trust_business_logic_1.TrustBusinessLogic.calculateCommunityTrust({
                            references: data.data.references || [],
                            reviews: data.data.reviews || [],
                            communityEngagement: data.data.communityEngagement || [],
                            reportedIssues: data.data.reportedIssues || [],
                        });
                        data.data.score = communityTrust.score;
                        data.data.factors = communityTrust.factors;
                        data.data.insights = communityTrust.insights;
                    }
                    return [2 /*return*/, data];
            }
        });
    }); },
    // Add community reference
    addCommunityReference: function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/community/reference"), {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                        body: JSON.stringify(data),
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to add community reference');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Request trust score recalculation
    recalculateTrustScore: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/score/").concat(userId, "/recalculate"), {
                        method: 'POST',
                        headers: {
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to recalculate trust score');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
    // Get trust insights and analytics
    getTrustInsights: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, errorData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/insights/").concat(userId), {
                        headers: {
                            'Authorization': "Bearer ".concat(localStorage.getItem('auth_token')),
                        },
                    })];
                case 1:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json().catch(function () { return ({}); })];
                case 2:
                    errorData = _a.sent();
                    throw new Error(errorData.message || 'Failed to fetch trust insights');
                case 3: return [2 /*return*/, response.json()];
            }
        });
    }); },
};
