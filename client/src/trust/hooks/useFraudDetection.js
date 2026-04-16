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
exports.useFraudDetection = useFraudDetection;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var unified_api_client_1 = require("../../local/services/unified-api-client");
function useFraudDetection() {
    var _this = this;
    var queryClient = (0, react_query_1.useQueryClient)();
    var _a = (0, react_1.useState)(false), isLoading = _a[0], setIsLoading = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    // Process transaction for fraud analysis
    var processTransactionMutation = (0, react_query_1.useMutation)({
        mutationFn: function (transactionData) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, unified_api_client_1.apiClient.post('/api/fraud-detection/analyze', transactionData)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        onSuccess: function (alerts) {
            queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'alerts'] });
            // Cache individual alerts
            alerts.forEach(function (alert) {
                queryClient.setQueryData(['fraud-detection', 'alert', alert.id], alert);
            });
        },
    });
    // Update alert status
    var updateAlertMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var response;
            var alertId = _b.alertId, updates = _b.updates;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, unified_api_client_1.apiClient.patch("/api/fraud-detection/alerts/".concat(alertId), updates)];
                    case 1:
                        response = _c.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        onSuccess: function (alert) {
            queryClient.setQueryData(['fraud-detection', 'alert', alert.id], alert);
            queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'alerts'] });
            queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'dashboard'] });
        },
    });
    // Create fraud report
    var createReportMutation = (0, react_query_1.useMutation)({
        mutationFn: function (reportData) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, unified_api_client_1.apiClient.post('/api/fraud-detection/reports', reportData)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ['fraud-detection', 'reports'] });
        },
    });
    // Get fraud dashboard data
    var useFraudDashboard = function (userId, options) {
        return (0, react_query_1.useQuery)({
            queryKey: ['fraud-detection', 'dashboard', userId, options === null || options === void 0 ? void 0 : options.timeRange],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var params, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            params = new URLSearchParams();
                            if (userId)
                                params.append('userId', userId);
                            if (options === null || options === void 0 ? void 0 : options.timeRange)
                                params.append('timeRange', options.timeRange);
                            return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/fraud-detection/dashboard?".concat(params))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            refetchInterval: 30000, // Refresh every 30 seconds
        });
    };
    // Get fraud alerts
    var useFraudAlerts = function (filters) {
        return (0, react_query_1.useQuery)({
            queryKey: ['fraud-detection', 'alerts', filters],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var params, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            params = new URLSearchParams();
                            if (filters === null || filters === void 0 ? void 0 : filters.severity)
                                params.append('severity', filters.severity);
                            if (filters === null || filters === void 0 ? void 0 : filters.category)
                                params.append('category', filters.category);
                            if (filters === null || filters === void 0 ? void 0 : filters.status)
                                params.append('status', filters.status);
                            if (filters === null || filters === void 0 ? void 0 : filters.search)
                                params.append('search', filters.search);
                            if (filters === null || filters === void 0 ? void 0 : filters.limit)
                                params.append('limit', filters.limit.toString());
                            if (filters === null || filters === void 0 ? void 0 : filters.offset)
                                params.append('offset', filters.offset.toString());
                            return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/fraud-detection/alerts?".concat(params))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            refetchInterval: 15000, // Refresh every 15 seconds for alerts
        });
    };
    // Get specific fraud alert
    var useFraudAlert = function (alertId) {
        return (0, react_query_1.useQuery)({
            queryKey: ['fraud-detection', 'alert', alertId],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/fraud-detection/alerts/".concat(alertId))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            enabled: !!alertId,
        });
    };
    // Get system status
    var useSystemStatus = function () {
        return (0, react_query_1.useQuery)({
            queryKey: ['fraud-detection', 'system-status'],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, unified_api_client_1.apiClient.get('/api/fraud-detection/system/status')];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
            refetchInterval: 60000, // Refresh every minute
        });
    };
    // Get network analysis
    var useNetworkAnalysis = function (options) {
        return (0, react_query_1.useQuery)({
            queryKey: ['fraud-detection', 'network-analysis', options],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var params, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            params = new URLSearchParams();
                            if (options === null || options === void 0 ? void 0 : options.userId)
                                params.append('userId', options.userId);
                            if (options === null || options === void 0 ? void 0 : options.propertyId)
                                params.append('propertyId', options.propertyId);
                            if (options === null || options === void 0 ? void 0 : options.timeRange)
                                params.append('timeRange', options.timeRange);
                            return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/fraud-detection/network-analysis?".concat(params))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
        });
    };
    // Get ML analytics
    var useMLAnalytics = function (options) {
        return (0, react_query_1.useQuery)({
            queryKey: ['fraud-detection', 'ml-analytics', options === null || options === void 0 ? void 0 : options.timeRange],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var params, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            params = new URLSearchParams();
                            if (options === null || options === void 0 ? void 0 : options.timeRange)
                                params.append('timeRange', options.timeRange);
                            return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/fraud-detection/ml-analytics?".concat(params))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
        });
    };
    // Get fraud reports
    var useFraudReports = function (filters) {
        return (0, react_query_1.useQuery)({
            queryKey: ['fraud-detection', 'reports', filters],
            queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
                var params, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            params = new URLSearchParams();
                            if (filters === null || filters === void 0 ? void 0 : filters.status)
                                params.append('status', filters.status);
                            if (filters === null || filters === void 0 ? void 0 : filters.priority)
                                params.append('priority', filters.priority);
                            if (filters === null || filters === void 0 ? void 0 : filters.limit)
                                params.append('limit', filters.limit.toString());
                            return [4 /*yield*/, unified_api_client_1.apiClient.get("/api/fraud-detection/reports?".concat(params))];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response.data];
                    }
                });
            }); },
        });
    };
    // Wrapper functions for mutations
    var processTransaction = (0, react_1.useCallback)(function (transactionData) { return __awaiter(_this, void 0, void 0, function () {
        var err_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, processTransactionMutation.mutateAsync(transactionData)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_1 = _a.sent();
                    error_1 = err_1 instanceof Error ? err_1 : new Error('Failed to process transaction');
                    setError(error_1);
                    throw error_1;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [processTransactionMutation]);
    var updateAlert = (0, react_1.useCallback)(function (alertId, updates) { return __awaiter(_this, void 0, void 0, function () {
        var err_2, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, updateAlertMutation.mutateAsync({ alertId: alertId, updates: updates })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_2 = _a.sent();
                    error_2 = err_2 instanceof Error ? err_2 : new Error('Failed to update alert');
                    setError(error_2);
                    throw error_2;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [updateAlertMutation]);
    var createReport = (0, react_1.useCallback)(function (reportData) { return __awaiter(_this, void 0, void 0, function () {
        var err_3, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, createReportMutation.mutateAsync(reportData)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_3 = _a.sent();
                    error_3 = err_3 instanceof Error ? err_3 : new Error('Failed to create report');
                    setError(error_3);
                    throw error_3;
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [createReportMutation]);
    // Bulk operations
    var dismissAlerts = (0, react_1.useCallback)(function (alertIds) { return __awaiter(_this, void 0, void 0, function () {
        var promises;
        return __generator(this, function (_a) {
            promises = alertIds.map(function (id) { return updateAlert(id, { status: 'dismissed' }); });
            return [2 /*return*/, Promise.all(promises)];
        });
    }); }, [updateAlert]);
    var escalateAlerts = (0, react_1.useCallback)(function (alertIds) { return __awaiter(_this, void 0, void 0, function () {
        var promises;
        return __generator(this, function (_a) {
            promises = alertIds.map(function (id) { return updateAlert(id, {
                status: 'investigating',
                investigationPriority: 100
            }); });
            return [2 /*return*/, Promise.all(promises)];
        });
    }); }, [updateAlert]);
    var assignAlerts = (0, react_1.useCallback)(function (alertIds, assignee) { return __awaiter(_this, void 0, void 0, function () {
        var promises;
        return __generator(this, function (_a) {
            promises = alertIds.map(function (id) { return updateAlert(id, {
                status: 'investigating',
                assignedTo: assignee
            }); });
            return [2 /*return*/, Promise.all(promises)];
        });
    }); }, [updateAlert]);
    return {
        // Mutation functions
        processTransaction: processTransaction,
        updateAlert: updateAlert,
        createReport: createReport,
        dismissAlerts: dismissAlerts,
        escalateAlerts: escalateAlerts,
        assignAlerts: assignAlerts,
        // Query hooks
        useFraudDashboard: useFraudDashboard,
        useFraudAlerts: useFraudAlerts,
        useFraudAlert: useFraudAlert,
        useSystemStatus: useSystemStatus,
        useNetworkAnalysis: useNetworkAnalysis,
        useMLAnalytics: useMLAnalytics,
        useFraudReports: useFraudReports,
        // State
        isLoading: isLoading ||
            processTransactionMutation.isPending ||
            updateAlertMutation.isPending ||
            createReportMutation.isPending,
        error: error,
        // Mutation states
        isProcessing: processTransactionMutation.isPending,
        isUpdating: updateAlertMutation.isPending,
        isCreatingReport: createReportMutation.isPending,
    };
}
exports.default = useFraudDetection;
