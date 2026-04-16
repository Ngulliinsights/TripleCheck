"use strict";
/**
 * AI Integration React Hooks
 *
 * React hooks that provide easy access to AI integration services
 * for use in components throughout the application.
 */
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
exports.aiQueryKeys = void 0;
exports.usePropertyAI = usePropertyAI;
exports.useSearchAI = useSearchAI;
exports.useDocumentAI = useDocumentAI;
exports.useFraudDetectionAI = useFraudDetectionAI;
exports.useAIMetrics = useAIMetrics;
exports.useRecommendationFeedback = useRecommendationFeedback;
exports.useAIIntegrationState = useAIIntegrationState;
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var ai_integration_orchestrator_1 = require("../services/ai-integration/ai-integration-orchestrator");
var property_analysis_integration_1 = require("../services/ai-integration/property-analysis-integration");
var document_processing_integration_1 = require("../services/ai-integration/document-processing-integration");
var fraud_detection_integration_1 = require("../services/ai-integration/fraud-detection-integration");
var recommendation_integration_1 = require("../services/ai-integration/recommendation-integration");
// Fallback logging service implementation
var createLoggingService = function () { return ({
    info: function (message, metadata) {
        console.log("[INFO] ".concat(message), metadata || '');
    },
    error: function (message, metadata) {
        console.error("[ERROR] ".concat(message), metadata || '');
    },
    warn: function (message, metadata) {
        console.warn("[WARN] ".concat(message), metadata || '');
    },
    debug: function (message, metadata) {
        console.debug("[DEBUG] ".concat(message), metadata || '');
    }
}); };
// Try to import the logging service, fallback to our implementation
var loggingService;
try {
    // Attempt the original import
    var importedLogger = require('../../../core/src/logging').loggingService;
    loggingService = importedLogger;
}
catch (error) {
    // Use fallback if import fails
    loggingService = createLoggingService();
}
// Query keys for React Query - Fixed to handle string conversion properly
exports.aiQueryKeys = {
    propertyEnhancement: function (propertyId) { return ['ai', 'property', 'enhancement', String(propertyId)]; },
    propertyValuation: function (propertyId) { return ['ai', 'property', 'valuation', String(propertyId)]; },
    propertyRisk: function (propertyId) { return ['ai', 'property', 'risk', String(propertyId)]; },
    propertyFraud: function (propertyId) { return ['ai', 'property', 'fraud', String(propertyId)]; },
    searchEnhancement: function (filters, userId) {
        return ['ai', 'search', 'enhancement', JSON.stringify(filters), userId || ''];
    },
    userRecommendations: function (userId) { return ['ai', 'user', 'recommendations', userId]; },
    documentProcessing: function (documentId) { return ['ai', 'document', 'processing', documentId]; },
    userFraud: function (userId) { return ['ai', 'user', 'fraud', userId]; },
    aiMetrics: function () { return ['ai', 'metrics']; },
    aiHealth: function () { return ['ai', 'health']; }
};
/**
 * Hook for AI-enhanced property analysis
 *
 * This hook provides comprehensive AI analysis for individual properties,
 * including valuation, risk assessment, and fraud detection capabilities.
 */
function usePropertyAI(property, options) {
    if (options === void 0) { options = {}; }
    var _a = options.enableValuation, enableValuation = _a === void 0 ? true : _a, _b = options.enableRiskAssessment, enableRiskAssessment = _b === void 0 ? true : _b, _c = options.enableFraudDetection, enableFraudDetection = _c === void 0 ? true : _c, _d = options.enableInsights, enableInsights = _d === void 0 ? true : _d, _e = options.autoRefresh, autoRefresh = _e === void 0 ? false : _e, _f = options.refreshInterval // 5 minutes
    , refreshInterval = _f === void 0 ? 300000 : _f // 5 minutes
    ;
    // Convert property.id to string to ensure consistency
    var propertyId = String(property.id);
    // Property enhancement query - coordinates multiple AI analyses
    var enhancementQuery = (0, react_query_1.useQuery)({
        queryKey: exports.aiQueryKeys.propertyEnhancement(propertyId),
        queryFn: function () { return ai_integration_orchestrator_1.aiIntegrationOrchestrator.enhancePropertyListing(property); },
        enabled: !!(property.id && (enableValuation || enableRiskAssessment || enableFraudDetection || enableInsights)),
        refetchInterval: autoRefresh ? refreshInterval : false,
        staleTime: 300000, // 5 minutes
        retry: 2,
        retryDelay: function (attemptIndex) { return Math.min(1000 * Math.pow(2, attemptIndex), 30000); }
    });
    // Individual analysis queries for more granular control
    var valuationQuery = (0, react_query_1.useQuery)({
        queryKey: exports.aiQueryKeys.propertyValuation(propertyId),
        queryFn: function () { return property_analysis_integration_1.propertyAnalysisIntegration.analyzePropertyValue(property); },
        enabled: enableValuation && !!property.id,
        staleTime: 600000 // 10 minutes - valuations change less frequently
    });
    var riskQuery = (0, react_query_1.useQuery)({
        queryKey: exports.aiQueryKeys.propertyRisk(propertyId),
        queryFn: function () { return property_analysis_integration_1.propertyAnalysisIntegration.assessPropertyRisk(property); },
        enabled: enableRiskAssessment && !!property.id,
        staleTime: 600000 // 10 minutes
    });
    var fraudQuery = (0, react_query_1.useQuery)({
        queryKey: exports.aiQueryKeys.propertyFraud(propertyId),
        queryFn: function () { return fraud_detection_integration_1.fraudDetectionIntegration.analyzePropertyFraud(property); },
        enabled: enableFraudDetection && !!property.id,
        staleTime: 300000 // 5 minutes - fraud patterns can change more quickly
    });
    // Computed loading and error states
    var isLoading = enhancementQuery.isLoading || valuationQuery.isLoading || riskQuery.isLoading || fraudQuery.isLoading;
    var hasError = enhancementQuery.error || valuationQuery.error || riskQuery.error || fraudQuery.error;
    // Memoized combined AI data to prevent unnecessary re-renders
    var aiData = (0, react_1.useMemo)(function () {
        var _a;
        return ({
            enhancement: enhancementQuery.data,
            valuation: valuationQuery.data,
            riskAssessment: riskQuery.data,
            fraudAnalysis: fraudQuery.data,
            trustScoreAdjustment: (_a = enhancementQuery.data) === null || _a === void 0 ? void 0 : _a.trustScoreAdjustment
        });
    }, [enhancementQuery.data, valuationQuery.data, riskQuery.data, fraudQuery.data]);
    // Refresh function to manually trigger all enabled queries
    var refresh = (0, react_1.useCallback)(function () {
        enhancementQuery.refetch();
        if (enableValuation)
            valuationQuery.refetch();
        if (enableRiskAssessment)
            riskQuery.refetch();
        if (enableFraudDetection)
            fraudQuery.refetch();
    }, [enhancementQuery, valuationQuery, riskQuery, fraudQuery, enableValuation, enableRiskAssessment, enableFraudDetection]);
    return {
        data: aiData,
        isLoading: isLoading,
        error: hasError,
        refresh: refresh,
        queries: {
            enhancement: enhancementQuery,
            valuation: valuationQuery,
            risk: riskQuery,
            fraud: fraudQuery
        }
    };
}
/**
 * Hook for AI-enhanced search results
 *
 * Provides intelligent search result enhancement including personalization,
 * market insights, and optimization suggestions.
 */
function useSearchAI(properties, searchFilters, user, options) {
    if (options === void 0) { options = {}; }
    var _a = options.enablePersonalization, enablePersonalization = _a === void 0 ? true : _a, _b = options.enableMarketInsights, enableMarketInsights = _b === void 0 ? true : _b, _c = options.enableOptimizations, enableOptimizations = _c === void 0 ? true : _c, _d = options.maxRecommendations, maxRecommendations = _d === void 0 ? 10 : _d;
    // Enhanced search results query
    var searchEnhancementQuery = (0, react_query_1.useQuery)({
        queryKey: exports.aiQueryKeys.searchEnhancement(searchFilters, user === null || user === void 0 ? void 0 : user.id),
        queryFn: function () { return ai_integration_orchestrator_1.aiIntegrationOrchestrator.enhanceSearchResults(properties, searchFilters, user); },
        enabled: properties.length > 0,
        staleTime: 180000, // 3 minutes - search results can change frequently
        retry: 1
    });
    // Personalized recommendations query
    var userRecommendationsQuery = (0, react_query_1.useQuery)({
        queryKey: exports.aiQueryKeys.userRecommendations((user === null || user === void 0 ? void 0 : user.id) || ''),
        queryFn: function () { return recommendation_integration_1.recommendationIntegration.generatePersonalizedRecommendations(user, properties, undefined, maxRecommendations); },
        enabled: enablePersonalization && !!(user === null || user === void 0 ? void 0 : user.id) && properties.length > 0,
        staleTime: 300000 // 5 minutes
    });
    // Combined enhanced data with fallbacks
    var enhancedData = (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e, _f;
        return ({
            enhancedResults: ((_a = searchEnhancementQuery.data) === null || _a === void 0 ? void 0 : _a.enhancedResults) || [],
            personalizedRecommendations: ((_b = userRecommendationsQuery.data) === null || _b === void 0 ? void 0 : _b.recommendations) ||
                ((_c = searchEnhancementQuery.data) === null || _c === void 0 ? void 0 : _c.personalizedRecommendations) || [],
            marketInsights: (_d = searchEnhancementQuery.data) === null || _d === void 0 ? void 0 : _d.marketInsights,
            searchOptimizations: (_e = searchEnhancementQuery.data) === null || _e === void 0 ? void 0 : _e.searchOptimizations,
            matchingStrategy: (_f = userRecommendationsQuery.data) === null || _f === void 0 ? void 0 : _f.matchingStrategy
        });
    }, [searchEnhancementQuery.data, userRecommendationsQuery.data]);
    return {
        data: enhancedData,
        isLoading: searchEnhancementQuery.isLoading || userRecommendationsQuery.isLoading,
        error: searchEnhancementQuery.error || userRecommendationsQuery.error,
        refresh: function () {
            searchEnhancementQuery.refetch();
            if (user)
                userRecommendationsQuery.refetch();
        },
        queries: {
            searchEnhancement: searchEnhancementQuery,
            userRecommendations: userRecommendationsQuery
        }
    };
}
/**
 * Hook for AI document processing
 *
 * Handles document analysis including authenticity verification,
 * completeness checking, and consistency analysis.
 */
function useDocumentAI(options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    var _a = options.enableAuthenticity, enableAuthenticity = _a === void 0 ? true : _a, _b = options.enableCompleteness, enableCompleteness = _b === void 0 ? true : _b, _c = options.enableConsistency, enableConsistency = _c === void 0 ? true : _c, sessionId = options.sessionId;
    var queryClient = (0, react_query_1.useQueryClient)();
    // Document processing mutation
    var processDocumentMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var documentBuffer = _b.documentBuffer, documentType = _b.documentType, docSessionId = _b.sessionId;
            return __generator(this, function (_c) {
                return [2 /*return*/, document_processing_integration_1.documentProcessingIntegration.processDocument(documentBuffer, documentType, docSessionId)];
            });
        }); },
        onSuccess: function (data, variables) {
            // Cache the result for future reference
            queryClient.setQueryData(exports.aiQueryKeys.documentProcessing(data.documentId), data);
            loggingService.info('Document processing completed', {
                module: 'useDocumentAI',
                documentId: data.documentId,
                processingStatus: data.processingStatus
            });
        },
        onError: function (error) {
            loggingService.error('Document processing failed', {
                module: 'useDocumentAI',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // Land verification workflow mutation
    var processLandVerificationMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var documents = _b.documents, workflowSessionId = _b.sessionId;
            return __generator(this, function (_c) {
                return [2 /*return*/, document_processing_integration_1.documentProcessingIntegration.processLandVerificationDocuments(documents, workflowSessionId)];
            });
        }); },
        onSuccess: function (data) {
            loggingService.info('Land verification workflow completed', {
                module: 'useDocumentAI',
                sessionId: data.sessionId,
                overallStatus: data.overallStatus
            });
        }
    });
    return {
        processDocument: processDocumentMutation.mutate,
        processDocumentAsync: processDocumentMutation.mutateAsync,
        processLandVerification: processLandVerificationMutation.mutate,
        processLandVerificationAsync: processLandVerificationMutation.mutateAsync,
        isProcessing: processDocumentMutation.isPending || processLandVerificationMutation.isPending,
        error: processDocumentMutation.error || processLandVerificationMutation.error,
        mutations: {
            processDocument: processDocumentMutation,
            processLandVerification: processLandVerificationMutation
        }
    };
}
/**
 * Hook for AI fraud detection
 *
 * Provides comprehensive fraud analysis for users, properties,
 * and network-based fraud patterns.
 */
function useFraudDetectionAI(user) {
    var userFraudQuery = (0, react_query_1.useQuery)({
        queryKey: exports.aiQueryKeys.userFraud((user === null || user === void 0 ? void 0 : user.id) || ''),
        queryFn: function () { return fraud_detection_integration_1.fraudDetectionIntegration.analyzeUserFraud(user); },
        enabled: !!(user === null || user === void 0 ? void 0 : user.id),
        staleTime: 600000, // 10 minutes
        retry: 1
    });
    var analyzePropertyFraudMutation = (0, react_query_1.useMutation)({
        mutationFn: function (property) { return fraud_detection_integration_1.fraudDetectionIntegration.analyzePropertyFraud(property); },
        onSuccess: function (data) {
            loggingService.info('Property fraud analysis completed', {
                module: 'useFraudDetectionAI',
                propertyId: data.propertyId,
                riskLevel: data.riskLevel
            });
        }
    });
    var analyzeNetworkFraudMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_a) {
            var users = _a.users, properties = _a.properties, connections = _a.connections;
            return fraud_detection_integration_1.fraudDetectionIntegration.analyzeNetworkFraud(__spreadArray(__spreadArray([], users.map(function (u) { return ({ id: String(u.id), type: 'user', data: u }); }), true), properties.map(function (p) { return ({ id: String(p.id), type: 'property', data: p }); }), true), connections);
        }
    });
    return {
        userFraudData: userFraudQuery.data,
        isLoadingUserFraud: userFraudQuery.isLoading,
        userFraudError: userFraudQuery.error,
        analyzePropertyFraud: analyzePropertyFraudMutation.mutate,
        analyzePropertyFraudAsync: analyzePropertyFraudMutation.mutateAsync,
        analyzeNetworkFraud: analyzeNetworkFraudMutation.mutate,
        analyzeNetworkFraudAsync: analyzeNetworkFraudMutation.mutateAsync,
        isAnalyzing: analyzePropertyFraudMutation.isPending || analyzeNetworkFraudMutation.isPending,
        analysisError: analyzePropertyFraudMutation.error || analyzeNetworkFraudMutation.error,
        refreshUserFraud: userFraudQuery.refetch
    };
}
/**
 * Hook for AI system monitoring and metrics
 *
 * Provides real-time monitoring of AI system health and performance metrics.
 */
function useAIMetrics() {
    var metricsQuery = (0, react_query_1.useQuery)({
        queryKey: exports.aiQueryKeys.aiMetrics(),
        queryFn: function () { return ai_integration_orchestrator_1.aiIntegrationOrchestrator.getMetrics(); },
        refetchInterval: 30000, // 30 seconds - frequent updates for monitoring
        staleTime: 15000 // 15 seconds
    });
    var healthQuery = (0, react_query_1.useQuery)({
        queryKey: exports.aiQueryKeys.aiHealth(),
        queryFn: function () { return ai_integration_orchestrator_1.aiIntegrationOrchestrator.getHealthStatus(); },
        refetchInterval: 60000, // 1 minute
        staleTime: 30000 // 30 seconds
    });
    return {
        metrics: metricsQuery.data,
        health: healthQuery.data,
        isLoading: metricsQuery.isLoading || healthQuery.isLoading,
        error: metricsQuery.error || healthQuery.error,
        refresh: function () {
            metricsQuery.refetch();
            healthQuery.refetch();
        }
    };
}
/**
 * Hook for recommendation feedback processing
 *
 * Handles user feedback on AI recommendations to improve future suggestions.
 */
function useRecommendationFeedback() {
    var _this = this;
    var queryClient = (0, react_query_1.useQueryClient)();
    var submitFeedbackMutation = (0, react_query_1.useMutation)({
        mutationFn: function (feedback) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, recommendation_integration_1.recommendationIntegration.processFeedback(__assign(__assign({}, feedback), { timestamp: new Date() }))];
            });
        }); },
        onSuccess: function (data, variables) {
            // Invalidate user recommendations to trigger refresh with new learning
            queryClient.invalidateQueries({
                queryKey: exports.aiQueryKeys.userRecommendations(variables.userId)
            });
            loggingService.info('Recommendation feedback processed', {
                module: 'useRecommendationFeedback',
                userId: variables.userId,
                feedbackType: variables.feedbackType,
                learningImpact: data.learningImpact
            });
        }
    });
    return {
        submitFeedback: submitFeedbackMutation.mutate,
        submitFeedbackAsync: submitFeedbackMutation.mutateAsync,
        isSubmitting: submitFeedbackMutation.isPending,
        error: submitFeedbackMutation.error,
        lastResult: submitFeedbackMutation.data
    };
}
/**
 * Custom hook for managing AI integration state
 *
 * Provides centralized state management for AI feature toggles and preferences.
 */
function useAIIntegrationState() {
    var _a = (0, react_1.useState)(true), isEnabled = _a[0], setIsEnabled = _a[1];
    var _b = (0, react_1.useState)({
        enablePropertyAnalysis: true,
        enableDocumentProcessing: true,
        enableFraudDetection: true,
        enableRecommendations: true,
        autoRefresh: false
    }), preferences = _b[0], setPreferences = _b[1];
    var toggleAI = (0, react_1.useCallback)(function () {
        setIsEnabled(function (prev) { return !prev; });
    }, []);
    var updatePreferences = (0, react_1.useCallback)(function (newPreferences) {
        setPreferences(function (prev) { return (__assign(__assign({}, prev), newPreferences)); });
    }, []);
    return {
        isEnabled: isEnabled,
        preferences: preferences,
        toggleAI: toggleAI,
        updatePreferences: updatePreferences,
        setIsEnabled: setIsEnabled,
        setPreferences: setPreferences
    };
}
