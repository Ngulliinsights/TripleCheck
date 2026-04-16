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
exports.useDocumentAuthentication = useDocumentAuthentication;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var unified_api_client_1 = require("../../local/services/unified-api-client");
function useDocumentAuthentication() {
    var _this = this;
    var queryClient = (0, react_query_1.useQueryClient)();
    var _a = (0, react_1.useState)(false), isLoading = _a[0], setIsLoading = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    // Upload and verify document
    var verifyDocumentMutation = (0, react_query_1.useMutation)({
        mutationFn: function (file) { return __awaiter(_this, void 0, void 0, function () {
            var formData, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formData = new FormData();
                        formData.append('document', file);
                        formData.append('filename', file.name);
                        formData.append('mimeType', file.type);
                        formData.append('size', file.size.toString());
                        formData.append('uploadedAt', new Date().toISOString());
                        return [4 /*yield*/, unified_api_client_1.apiClient.post('/api/document-auth/verify', formData, {
                                headers: {
                                    'Content-Type': 'multipart/form-data',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        onSuccess: function (result) {
            queryClient.setQueryData(['document-auth', 'result', result.documentId], result);
            queryClient.invalidateQueries({ queryKey: ['document-auth', 'stats'] });
        },
    });
    // Get verification result
    var useVerificationResult = function (documentId) {
        return (0, react_query_1.useQuery)({
            queryKey: ['document-auth', 'result', documentId],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/document-auth/results/".concat(documentId))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            enabled: !!documentId,
        });
    };
    // Get processing status
    var useProcessingStatus = function (documentId) {
        return (0, react_query_1.useQuery)({
            queryKey: ['document-auth', 'status', documentId],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/document-auth/status/".concat(documentId))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data.status];
                    }
                });
            }); },
            enabled: !!documentId,
            refetchInterval: function (data) { return data === 'processing' ? 2000 : false; }, // Poll every 2 seconds while processing
        });
    };
    // Get system statistics
    var useSystemStats = function () {
        return (0, react_query_1.useQuery)({
            queryKey: ['document-auth', 'stats'],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get('/api/document-auth/stats')];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            refetchInterval: 30000, // Refresh every 30 seconds
        });
    };
    // Get user's document history
    var useDocumentHistory = function (userId, options) {
        return (0, react_query_1.useQuery)({
            queryKey: ['document-auth', 'history', userId, options],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var params, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            params = new URLSearchParams();
                            if (options === null || options === void 0 ? void 0 : options.limit)
                                params.append('limit', options.limit.toString());
                            if (options === null || options === void 0 ? void 0 : options.offset)
                                params.append('offset', options.offset.toString());
                            return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/document-auth/history/".concat(userId, "?").concat(params))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            enabled: !!userId,
        });
    };
    // Get recent verifications
    var useRecentVerifications = function (limit) {
        if (limit === void 0) { limit = 10; }
        return (0, react_query_1.useQuery)({
            queryKey: ['document-auth', 'recent', limit],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/document-auth/recent?limit=".concat(limit))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
        });
    };
    // Clear old results
    var clearOldResultsMutation = (0, react_query_1.useMutation)({
        mutationFn: function (olderThan) { return __awaiter(_this, void 0, void 0, function () {
            var params, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = olderThan ? "?olderThan=".concat(olderThan.toISOString()) : '';
                        return [4 /*yield*/, unified_api_client_1.apiClient.delete("/api/document-auth/results".concat(params))];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.cleared];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['document-auth'] });
        },
    });
    // Wrapper functions for mutations
    var verifyDocument = (0, react_1.useCallback)(function (file) { return __awaiter(_this, void 0, void 0, function () {
        var err_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, verifyDocumentMutation.mutateAsync(file)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_1 = _a.sent();
                    error_1 = err_1 instanceof Error ? err_1 : new Error('Failed to verify document');
                    setError(error_1);
                    throw error_1;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [verifyDocumentMutation]);
    var clearOldResults = (0, react_1.useCallback)(function (olderThan) { return __awaiter(_this, void 0, void 0, function () {
        var err_2, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, clearOldResultsMutation.mutateAsync(olderThan)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_2 = _a.sent();
                    error_2 = err_2 instanceof Error ? err_2 : new Error('Failed to clear old results');
                    setError(error_2);
                    throw error_2;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [clearOldResultsMutation]);
    // Utility functions
    var getDocumentTypeIcon = function (documentType) {
        switch (documentType) {
            case 'title_deed':
                return '📜';
            case 'sale_agreement':
                return '📋';
            case 'survey_plan':
                return '🗺️';
            case 'compliance_certificate':
                return '✅';
            default:
                return '📄';
        }
    };
    var getStatusColor = function (status) {
        switch (status) {
            case 'authentic':
                return 'text-green-600';
            case 'suspicious':
                return 'text-yellow-600';
            case 'forged':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };
    var getStatusBadgeVariant = function (status) {
        switch (status) {
            case 'authentic':
                return 'default';
            case 'suspicious':
                return 'secondary';
            case 'forged':
                return 'destructive';
            default:
                return 'outline';
        }
    };
    var getSeverityColor = function (severity) {
        switch (severity) {
            case 'low':
                return 'text-blue-600';
            case 'medium':
                return 'text-yellow-600';
            case 'high':
                return 'text-orange-600';
            case 'critical':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return "".concat(parseFloat((bytes / Math.pow(k, i)).toFixed(2)), " ").concat(sizes[i]);
    };
    var formatProcessingTime = function (ms) {
        if (ms < 1000)
            return "".concat(ms, "ms");
        if (ms < 60000)
            return "".concat((ms / 1000).toFixed(1), "s");
        return "".concat((ms / 60000).toFixed(1), "m");
    };
    return {
        // Mutation functions
        verifyDocument: verifyDocument,
        clearOldResults: clearOldResults,
        // Query hooks
        useVerificationResult: useVerificationResult,
        useProcessingStatus: useProcessingStatus,
        useSystemStats: useSystemStats,
        useDocumentHistory: useDocumentHistory,
        useRecentVerifications: useRecentVerifications,
        // State
        isLoading: isLoading || verifyDocumentMutation.isPending || clearOldResultsMutation.isPending,
        error: error,
        // Mutation states
        isVerifying: verifyDocumentMutation.isPending,
        isClearing: clearOldResultsMutation.isPending,
        // Utility functions
        getDocumentTypeIcon: getDocumentTypeIcon,
        getStatusColor: getStatusColor,
        getStatusBadgeVariant: getStatusBadgeVariant,
        getSeverityColor: getSeverityColor,
        formatFileSize: formatFileSize,
        formatProcessingTime: formatProcessingTime,
    };
}
exports.default = useDocumentAuthentication;
