"use strict";
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
exports.createEnhancedQueryClient = exports.cachePerformanceMonitor = exports.backgroundSync = exports.cacheWarmingStrategies = exports.cacheInvalidationStrategies = exports.createQueryPersister = exports.createQueryClient = void 0;
var react_query_1 = require("@tanstack/react-query");
// Query client with advanced caching strategies and infinite query prevention
var createQueryClient = function () {
    var queryClient = new react_query_1.QueryClient({
        defaultOptions: {
            queries: {
                // Stale time based on data type - increased to reduce refetching
                staleTime: 1000 * 60 * 10, // 10 minutes default (increased from 5)
                gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
                // Retry strategy
                retry: function (failureCount, error) {
                    // Don't retry on 4xx errors (client errors)
                    if ((error === null || error === void 0 ? void 0 : error.status) >= 400 && (error === null || error === void 0 ? void 0 : error.status) < 500) {
                        return false;
                    }
                    // Retry up to 2 times for other errors (reduced from 3)
                    return failureCount < 2;
                },
                // Progressive retry delay
                retryDelay: function (attemptIndex) { return Math.min(1000 * Math.pow(2, attemptIndex), 30000); },
                // Network mode for offline support
                networkMode: 'offlineFirst',
                // Refetch strategies - more conservative to prevent infinite queries
                refetchOnWindowFocus: false,
                refetchOnReconnect: false, // Changed from 'always' to false
                refetchOnMount: false, // Changed from true to false
                refetchInterval: false, // Ensure no automatic refetching
                refetchIntervalInBackground: false,
            },
            mutations: {
                // Mutation retry strategy
                retry: function (failureCount, error) {
                    // Don't retry mutations on client errors
                    if ((error === null || error === void 0 ? void 0 : error.status) >= 400 && (error === null || error === void 0 ? void 0 : error.status) < 500) {
                        return false;
                    }
                    return failureCount < 1; // Reduced from 2 to 1
                },
                // Network mode for mutations
                networkMode: 'online',
            },
        },
    });
    // Add query cache event listeners for debugging infinite queries
    if (process.env.NODE_ENV === 'development') {
        var queryCache_1 = queryClient.getQueryCache();
        queryCache_1.subscribe(function (event) {
            if (event.type === 'added') {
                var activeQueries = queryCache_1.getAll().filter(function (q) { return q.state.fetchStatus === 'fetching'; });
                if (activeQueries.length > 10) {
                    console.warn("[QueryClient] High number of active queries detected: ".concat(activeQueries.length));
                    console.log('Active queries:', activeQueries.map(function (q) { return q.queryKey; }));
                }
            }
        });
    }
    return queryClient;
};
exports.createQueryClient = createQueryClient;
// Persistence configuration (disabled - requires additional packages)
var createQueryPersister = function () {
    console.warn('Query persistence is disabled - install @tanstack/react-query-persist-client-core and @tanstack/query-sync-storage-persister to enable');
    return null;
};
exports.createQueryPersister = createQueryPersister;
// Cache invalidation strategies
exports.cacheInvalidationStrategies = {
    // Invalidate user-related data
    invalidateUserData: function (queryClient, userId) {
        queryClient.invalidateQueries({ queryKey: ['users', userId] });
        queryClient.invalidateQueries({ queryKey: ['users', userId, 'notifications'] });
        queryClient.invalidateQueries({ queryKey: ['analytics', 'user', userId] });
    },
    // Invalidate property-related data
    invalidatePropertyData: function (queryClient, propertyId) {
        if (propertyId) {
            queryClient.invalidateQueries({ queryKey: ['properties', 'detail', propertyId] });
            queryClient.invalidateQueries({ queryKey: ['analytics', 'property', propertyId] });
        }
        queryClient.invalidateQueries({ queryKey: ['properties', 'list'] });
    },
    // Invalidate trust-related data
    invalidateTrustData: function (queryClient, userId) {
        queryClient.invalidateQueries({ queryKey: ['trust', 'scores', userId] });
        queryClient.invalidateQueries({ queryKey: ['fraud', 'alerts'] });
    },
    // Invalidate communication data
    invalidateMessageData: function (queryClient, userId) {
        queryClient.invalidateQueries({ queryKey: ['messages', 'list', userId] });
        queryClient.invalidateQueries({ queryKey: ['messages', 'threads', userId] });
    },
    // Global cache refresh
    refreshAllData: function (queryClient) {
        queryClient.invalidateQueries();
    },
};
// Cache warming strategies
exports.cacheWarmingStrategies = {
    // Warm up user data after login
    warmUserData: function (queryClient, userId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Prefetch user profile
            queryClient.prefetchQuery({
                queryKey: ['users', userId],
                queryFn: function () { return fetch("/api/users/".concat(userId)).then(function (res) { return res.json(); }); },
                staleTime: 1000 * 60 * 10, // 10 minutes
            });
            // Prefetch user notifications
            queryClient.prefetchQuery({
                queryKey: ['users', userId, 'notifications'],
                queryFn: function () { return fetch("/api/users/".concat(userId, "/notifications")).then(function (res) { return res.json(); }); },
                staleTime: 1000 * 60 * 2, // 2 minutes
            });
            return [2 /*return*/];
        });
    }); },
    // Warm up property data for search results
    warmPropertyData: function (queryClient, propertyIds) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            propertyIds.forEach(function (id) {
                queryClient.prefetchQuery({
                    queryKey: ['properties', 'detail', id],
                    queryFn: function () { return fetch("/api/properties/".concat(id)).then(function (res) { return res.json(); }); },
                    staleTime: 1000 * 60 * 15, // 15 minutes
                });
            });
            return [2 /*return*/];
        });
    }); },
    // Warm up analytics data
    warmAnalyticsData: function (queryClient) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            queryClient.prefetchQuery({
                queryKey: ['analytics', 'metrics'],
                queryFn: function () { return fetch('/api/analytics/metrics').then(function (res) { return res.json(); }); },
                staleTime: 1000 * 60 * 10, // 10 minutes
            });
            return [2 /*return*/];
        });
    }); },
};
// Background sync for offline support
exports.backgroundSync = {
    // Sync pending mutations when online
    syncPendingMutations: function (queryClient) { return __awaiter(void 0, void 0, void 0, function () {
        var mutationCache, pendingMutations, _i, pendingMutations_1, mutation, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mutationCache = queryClient.getMutationCache();
                    pendingMutations = mutationCache.getAll().filter(function (mutation) { return mutation.state.status === 'pending'; });
                    _i = 0, pendingMutations_1 = pendingMutations;
                    _a.label = 1;
                case 1:
                    if (!(_i < pendingMutations_1.length)) return [3 /*break*/, 6];
                    mutation = pendingMutations_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, mutation.execute(mutation.state.variables)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Failed to sync mutation:', error_1);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    }); },
    // Refresh stale data in background
    refreshStaleData: function (queryClient) { return __awaiter(void 0, void 0, void 0, function () {
        var queryCache, staleQueries, _i, staleQueries_1, query, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryCache = queryClient.getQueryCache();
                    staleQueries = queryCache.getAll().filter(function (query) { return query.isStale() && query.state.data; });
                    _i = 0, staleQueries_1 = staleQueries;
                    _a.label = 1;
                case 1:
                    if (!(_i < staleQueries_1.length)) return [3 /*break*/, 6];
                    query = staleQueries_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, query.fetch()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.error('Failed to refresh stale query:', error_2);
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    }); },
};
// Performance monitoring
exports.cachePerformanceMonitor = {
    // Monitor cache hit rates
    getCacheStats: function (queryClient) {
        var queryCache = queryClient.getQueryCache();
        var queries = queryCache.getAll();
        var stats = {
            totalQueries: queries.length,
            cachedQueries: queries.filter(function (q) { return q.state.data; }).length,
            staleQueries: queries.filter(function (q) { return q.isStale(); }).length,
            errorQueries: queries.filter(function (q) { return q.state.error; }).length,
            loadingQueries: queries.filter(function (q) { return q.state.fetchStatus === 'fetching'; }).length,
        };
        return __assign(__assign({}, stats), { cacheHitRate: stats.totalQueries > 0 ? (stats.cachedQueries / stats.totalQueries) * 100 : 0 });
    },
    // Log cache performance
    logCachePerformance: function (queryClient) {
        var stats = exports.cachePerformanceMonitor.getCacheStats(queryClient);
        console.log('Cache Performance Stats:', stats);
        return stats;
    },
};
// Backward compatibility
exports.createEnhancedQueryClient = exports.createQueryClient;
