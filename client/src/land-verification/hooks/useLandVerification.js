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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLandVerification = useLandVerification;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var unified_api_client_1 = require("../../local/services/unified-api-client");
function useLandVerification() {
    var _this = this;
    var queryClient = (0, react_query_1.useQueryClient)();
    var _a = (0, react_1.useState)(false), isLoading = _a[0], setIsLoading = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    // Initiate verification session
    var initiateVerificationMutation = (0, react_query_1.useMutation)({
        mutationFn: function (request) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, unified_api_client_1.apiClient.post('/api/land-verification/sessions', request)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        onSuccess: function (session) {
            queryClient.invalidateQueries({ queryKey: ['land-verification', 'sessions'] });
            queryClient.setQueryData(['land-verification', 'session', session.id], session);
        },
    });
    // Execute verification layer
    var executeLayerMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var response;
            var sessionId = _b.sessionId, layerType = _b.layerType;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, unified_api_client_1.apiClient.post("/api/land-verification/sessions/".concat(sessionId, "/layers/").concat(layerType, "/execute"))];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        onSuccess: function (results, _a) {
            var sessionId = _a.sessionId;
            queryClient.invalidateQueries({ queryKey: ['land-verification', 'session', sessionId] });
            queryClient.invalidateQueries({ queryKey: ['land-verification', 'status', sessionId] });
        },
    });
    // Generate risk assessment
    var generateRiskAssessmentMutation = (0, react_query_1.useMutation)({
        mutationFn: function (sessionId) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, unified_api_client_1.apiClient.post("/api/land-verification/sessions/".concat(sessionId, "/risk-assessment"))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        onSuccess: function (assessment) {
            queryClient.setQueryData(['land-verification', 'risk-assessment', assessment.sessionId], assessment);
            queryClient.invalidateQueries({ queryKey: ['land-verification', 'session', assessment.sessionId] });
        },
    });
    // Assign expert
    var assignExpertMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var response;
            var sessionId = _b.sessionId, expertType = _b.expertType, layerId = _b.layerId;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, unified_api_client_1.apiClient.post("/api/land-verification/sessions/".concat(sessionId, "/experts"), {
                            expertType: expertType,
                            layerId: layerId
                        })];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        onSuccess: function (assignment) {
            queryClient.invalidateQueries({ queryKey: ['land-verification', 'session', assignment.sessionId] });
            queryClient.invalidateQueries({ queryKey: ['land-verification', 'experts', assignment.sessionId] });
        },
    });
    // Schedule monitoring
    var scheduleMonitoringMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var response;
            var propertyId = _b.propertyId, config = _b.config;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, unified_api_client_1.apiClient.post("/api/land-verification/properties/".concat(propertyId, "/monitoring"), config)];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
    });
    // Get verification session
    var useVerificationSession = function (sessionId) {
        return (0, react_query_1.useQuery)({
            queryKey: ['land-verification', 'session', sessionId],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/land-verification/sessions/".concat(sessionId))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            enabled: !!sessionId,
        });
    };
    // Get verification status
    var useVerificationStatus = function (sessionId, options) {
        return (0, react_query_1.useQuery)({
            queryKey: ['land-verification', 'status', sessionId],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/land-verification/sessions/".concat(sessionId, "/status"))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            enabled: !!sessionId,
            refetchInterval: (options === null || options === void 0 ? void 0 : options.refetchInterval) || 5000, // Poll every 5 seconds
        });
    };
    // Get risk assessment
    var useRiskAssessment = function (sessionId) {
        return (0, react_query_1.useQuery)({
            queryKey: ['land-verification', 'risk-assessment', sessionId],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/land-verification/sessions/".concat(sessionId, "/risk-assessment"))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            enabled: !!sessionId,
        });
    };
    // Get expert assignments
    var useExpertAssignments = function (sessionId) {
        return (0, react_query_1.useQuery)({
            queryKey: ['land-verification', 'experts', sessionId],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/land-verification/sessions/".concat(sessionId, "/experts"))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            enabled: !!sessionId,
        });
    };
    // Get user's verification sessions
    var useUserVerificationSessions = function (userId) {
        return (0, react_query_1.useQuery)({
            queryKey: ['land-verification', 'sessions', 'user', userId],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/land-verification/sessions?userId=".concat(userId))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            enabled: !!userId,
        });
    };
    // Get property verification history
    var usePropertyVerificationHistory = function (propertyId) {
        return (0, react_query_1.useQuery)({
            queryKey: ['land-verification', 'sessions', 'property', propertyId],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/land-verification/sessions?propertyId=".concat(propertyId))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            enabled: !!propertyId,
        });
    };
    // Wrapper functions for mutations
    var initiateVerification = (0, react_1.useCallback)(function (request) { return __awaiter(_this, void 0, void 0, function () {
        var err_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, initiateVerificationMutation.mutateAsync(request)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_1 = _a.sent();
                    error_1 = err_1 instanceof Error ? err_1 : new Error('Failed to initiate verification');
                    setError(error_1);
                    throw error_1;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [initiateVerificationMutation]);
    var executeLayer = (0, react_1.useCallback)(function (sessionId, layerType) { return __awaiter(_this, void 0, void 0, function () {
        var err_2, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, executeLayerMutation.mutateAsync({ sessionId: sessionId, layerType: layerType })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_2 = _a.sent();
                    error_2 = err_2 instanceof Error ? err_2 : new Error('Failed to execute layer');
                    setError(error_2);
                    throw error_2;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [executeLayerMutation]);
    var generateRiskAssessment = (0, react_1.useCallback)(function (sessionId) { return __awaiter(_this, void 0, void 0, function () {
        var err_3, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, generateRiskAssessmentMutation.mutateAsync(sessionId)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_3 = _a.sent();
                    error_3 = err_3 instanceof Error ? err_3 : new Error('Failed to generate risk assessment');
                    setError(error_3);
                    throw error_3;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [generateRiskAssessmentMutation]);
    var assignExpert = (0, react_1.useCallback)(function (sessionId, expertType, layerId) { return __awaiter(_this, void 0, void 0, function () {
        var err_4, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, assignExpertMutation.mutateAsync({ sessionId: sessionId, expertType: expertType, layerId: layerId })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_4 = _a.sent();
                    error_4 = err_4 instanceof Error ? err_4 : new Error('Failed to assign expert');
                    setError(error_4);
                    throw error_4;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [assignExpertMutation]);
    var scheduleMonitoring = (0, react_1.useCallback)(function (propertyId, config) { return __awaiter(_this, void 0, void 0, function () {
        var err_5, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, scheduleMonitoringMutation.mutateAsync({ propertyId: propertyId, config: config })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_5 = _a.sent();
                    error_5 = err_5 instanceof Error ? err_5 : new Error('Failed to schedule monitoring');
                    setError(error_5);
                    throw error_5;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [scheduleMonitoringMutation]);
    return {
        // Mutation functions
        initiateVerification: initiateVerification,
        executeLayer: executeLayer,
        generateRiskAssessment: generateRiskAssessment,
        assignExpert: assignExpert,
        scheduleMonitoring: scheduleMonitoring,
        // Query hooks
        useVerificationSession: useVerificationSession,
        useVerificationStatus: useVerificationStatus,
        useRiskAssessment: useRiskAssessment,
        useExpertAssignments: useExpertAssignments,
        useUserVerificationSessions: useUserVerificationSessions,
        usePropertyVerificationHistory: usePropertyVerificationHistory,
        // State
        isLoading: isLoading ||
            initiateVerificationMutation.isPending ||
            executeLayerMutation.isPending ||
            generateRiskAssessmentMutation.isPending ||
            assignExpertMutation.isPending ||
            scheduleMonitoringMutation.isPending,
        error: error,
        // Mutation states
        isInitiating: initiateVerificationMutation.isPending,
        isExecutingLayer: executeLayerMutation.isPending,
        isGeneratingAssessment: generateRiskAssessmentMutation.isPending,
        isAssigningExpert: assignExpertMutation.isPending,
        isSchedulingMonitoring: scheduleMonitoringMutation.isPending,
    };
}
exports.default = useLandVerification;
