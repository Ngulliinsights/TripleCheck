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
exports.analyticsKeys = void 0;
exports.useAnalyticsMetrics = useAnalyticsMetrics;
exports.useAnalyticsTimeSeries = useAnalyticsTimeSeries;
exports.useUserAnalytics = useUserAnalytics;
exports.usePropertyAnalytics = usePropertyAnalytics;
exports.useTrackEvent = useTrackEvent;
exports.useEventTracker = useEventTracker;
var react_query_1 = require("@tanstack/react-query");
// Mock API functions - replace with actual API calls
var analyticsApi = {
    getMetrics: function (filter) { return __awaiter(void 0, void 0, void 0, function () {
        var params, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = new URLSearchParams();
                    if (filter === null || filter === void 0 ? void 0 : filter.startDate)
                        params.append('startDate', filter.startDate);
                    if (filter === null || filter === void 0 ? void 0 : filter.endDate)
                        params.append('endDate', filter.endDate);
                    if (filter === null || filter === void 0 ? void 0 : filter.granularity)
                        params.append('granularity', filter.granularity);
                    return [4 /*yield*/, fetch("/api/analytics/metrics?".concat(params))];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch analytics metrics');
                    return [2 /*return*/, response.json()];
            }
        });
    }); },
    getTimeSeries: function (filter) { return __awaiter(void 0, void 0, void 0, function () {
        var params, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = new URLSearchParams();
                    if (filter === null || filter === void 0 ? void 0 : filter.startDate)
                        params.append('startDate', filter.startDate);
                    if (filter === null || filter === void 0 ? void 0 : filter.endDate)
                        params.append('endDate', filter.endDate);
                    if (filter === null || filter === void 0 ? void 0 : filter.granularity)
                        params.append('granularity', filter.granularity);
                    return [4 /*yield*/, fetch("/api/analytics/timeseries?".concat(params))];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch time series data');
                    return [2 /*return*/, response.json()];
            }
        });
    }); },
    getUserAnalytics: function (userId) { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/api/analytics/users/".concat(userId))];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch user analytics');
                    return [2 /*return*/, response.json()];
            }
        });
    }); },
    getPropertyAnalytics: function (propertyId) { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("/api/analytics/properties/".concat(propertyId))];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch property analytics');
                    return [2 /*return*/, response.json()];
            }
        });
    }); },
    trackEvent: function (event) { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('/api/analytics/events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(event),
                    })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to track event');
                    return [2 /*return*/, response.json()];
            }
        });
    }); },
};
// Query keys
exports.analyticsKeys = {
    all: ['analytics'],
    metrics: function (filter) { return __spreadArray(__spreadArray([], exports.analyticsKeys.all, true), ['metrics', filter], false); },
    timeSeries: function (filter) { return __spreadArray(__spreadArray([], exports.analyticsKeys.all, true), ['timeseries', filter], false); },
    userAnalytics: function (userId) { return __spreadArray(__spreadArray([], exports.analyticsKeys.all, true), ['user', userId], false); },
    propertyAnalytics: function (propertyId) { return __spreadArray(__spreadArray([], exports.analyticsKeys.all, true), ['property', propertyId], false); },
};
// Get analytics metrics
function useAnalyticsMetrics(filter) {
    return (0, react_query_1.useQuery)({
        queryKey: exports.analyticsKeys.metrics(filter),
        queryFn: function () { return analyticsApi.getMetrics(filter); },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
// Get time series data
function useAnalyticsTimeSeries(filter) {
    return (0, react_query_1.useQuery)({
        queryKey: exports.analyticsKeys.timeSeries(filter),
        queryFn: function () { return analyticsApi.getTimeSeries(filter); },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
// Get user analytics
function useUserAnalytics(userId) {
    return (0, react_query_1.useQuery)({
        queryKey: exports.analyticsKeys.userAnalytics(userId),
        queryFn: function () { return analyticsApi.getUserAnalytics(userId); },
        enabled: !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}
// Get property analytics
function usePropertyAnalytics(propertyId) {
    return (0, react_query_1.useQuery)({
        queryKey: exports.analyticsKeys.propertyAnalytics(propertyId),
        queryFn: function () { return analyticsApi.getPropertyAnalytics(propertyId); },
        enabled: !!propertyId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}
// Track event mutation
function useTrackEvent() {
    return (0, react_query_1.useMutation)({
        mutationFn: analyticsApi.trackEvent,
        // No need to invalidate queries for event tracking
    });
}
// Custom hook for easy event tracking
function useEventTracker() {
    var trackEventMutation = useTrackEvent();
    var trackEvent = function (name, properties, userId) {
        trackEventMutation.mutate({ name: name, properties: properties, userId: userId });
    };
    return { trackEvent: trackEvent, isTracking: trackEventMutation.isPending };
}
