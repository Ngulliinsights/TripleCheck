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
exports.usePagination = usePagination;
exports.useResidentialPropertiesQuery = useResidentialPropertiesQuery;
exports.useCommercialPropertiesQuery = useCommercialPropertiesQuery;
exports.useLandPropertiesQuery = useLandPropertiesQuery;
exports.useAllPropertiesQuery = useAllPropertiesQuery;
exports.usePropertySearchQuery = usePropertySearchQuery;
exports.usePaginatedQuery = usePaginatedQuery;
exports.useInfiniteScroll = useInfiniteScroll;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
// ------------------------------------------------------------------
// Main Unified Pagination Hook
// ------------------------------------------------------------------
/**
 * Unified pagination hook that supports multiple modes:
 * - 'paginated': Traditional server-side pagination
 * - 'infinite': Infinite scroll with server-side data
 * - 'client': Client-side pagination for static data
 *
 * This implementation fixes Rules of Hooks violations by always calling all hooks
 * unconditionally, then returning the appropriate result based on mode.
 */
function usePagination(options) {
    var _this = this;
    // Create normalized options for all hook calls to ensure consistency
    var normalizedOptions = (0, react_1.useMemo)(function () {
        if (options.mode === 'client') {
            return {
                client: options,
                server: {
                    mode: 'paginated',
                    queryKey: ['client-fallback'],
                    fetcher: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                        return [2 /*return*/, ({ items: [], totalCount: 0, hasNextPage: false })];
                    }); }); },
                    filters: {},
                    enabled: false, // Disable server hooks for client mode
                }
            };
        }
        else {
            return {
                client: {
                    mode: 'client',
                    items: [],
                    itemsPerPage: 10,
                },
                server: options
            };
        }
    }, [options]);
    // Always call all hooks unconditionally to satisfy Rules of Hooks
    var clientResult = useClientPagination(normalizedOptions.client);
    var serverResult = useServerPagination(normalizedOptions.server);
    var infiniteResult = useInfinitePagination(normalizedOptions.server);
    // Return the appropriate result based on the actual mode
    if (options.mode === 'client') {
        return clientResult;
    }
    if (options.mode === 'infinite') {
        return infiniteResult;
    }
    return serverResult;
}
// ------------------------------------------------------------------
// Server-side Paginated Implementation
// ------------------------------------------------------------------
function useServerPagination(options) {
    var queryKey = options.queryKey, fetcher = options.fetcher, filters = options.filters, _a = options.sortBy, sortBy = _a === void 0 ? '' : _a, _b = options.pageSize, pageSize = _b === void 0 ? 12 : _b, _c = options.enabled, enabled = _c === void 0 ? true : _c, _d = options.staleTime, staleTime = _d === void 0 ? 5 * 60 * 1000 : _d, // Default to 5 minutes
    _e = options.gcTime, // Default to 5 minutes
    gcTime = _e === void 0 ? 10 * 60 * 1000 : _e;
    var _f = (0, react_1.useState)(1), currentPage = _f[0], setCurrentPage = _f[1];
    // Create stable query key to prevent unnecessary re-renders
    var stableQueryKey = (0, react_1.useMemo)(function () { return __spreadArray(__spreadArray([], (Array.isArray(queryKey) ? queryKey : [queryKey]), true), [
        'paginated',
        filters,
        sortBy,
        currentPage,
        pageSize,
    ], false); }, [queryKey, filters, sortBy, currentPage, pageSize]);
    var _g = (0, react_query_1.useQuery)({
        queryKey: stableQueryKey,
        queryFn: function () { return fetcher(filters, currentPage, sortBy); },
        enabled: enabled,
        staleTime: staleTime,
        gcTime: gcTime,
        refetchOnWindowFocus: false,
        retry: function (failureCount, error) {
            // Retry up to 3 times for network errors
            return failureCount < 3 && error.message.includes('fetch');
        },
    }), data = _g.data, error = _g.error, isLoading = _g.isLoading, refetch = _g.refetch, isRefetching = _g.isRefetching;
    // Navigation functions with bounds checking
    var goToPage = (0, react_1.useCallback)(function (page) {
        if (data) {
            var totalPages_1 = Math.ceil(data.totalCount / pageSize);
            var validPage = Math.max(1, Math.min(page, totalPages_1));
            setCurrentPage(validPage);
        }
    }, [data, pageSize]);
    var nextPage = (0, react_1.useCallback)(function () {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);
    var previousPage = (0, react_1.useCallback)(function () {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);
    var resetPage = (0, react_1.useCallback)(function () {
        setCurrentPage(1);
    }, []);
    var totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;
    return {
        data: data === null || data === void 0 ? void 0 : data.items,
        totalCount: (data === null || data === void 0 ? void 0 : data.totalCount) || 0,
        totalPages: totalPages,
        currentPage: currentPage,
        isLoading: isLoading,
        isError: !!error,
        error: error || null,
        isRefetching: isRefetching,
        goToPage: goToPage,
        nextPage: nextPage,
        previousPage: previousPage,
        resetPage: resetPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        refetch: refetch,
    };
}
// ------------------------------------------------------------------
// Infinite Scroll Implementation
// ------------------------------------------------------------------
function useInfinitePagination(options) {
    var _a;
    var queryKey = options.queryKey, fetcher = options.fetcher, filters = options.filters, _b = options.sortBy, sortBy = _b === void 0 ? '' : _b, _c = options.pageSize, pageSize = _c === void 0 ? 12 : _c, _d = options.enabled, enabled = _d === void 0 ? true : _d, _e = options.staleTime, staleTime = _e === void 0 ? 5 * 60 * 1000 : _e, _f = options.gcTime, gcTime = _f === void 0 ? 10 * 60 * 1000 : _f, _g = options.threshold, threshold = _g === void 0 ? 200 : _g, // Distance from bottom to trigger load
    _h = options.rootMargin, // Distance from bottom to trigger load
    rootMargin = _h === void 0 ? '0px 0px 200px 0px' : _h;
    var scrollRef = (0, react_1.useRef)(null);
    var sentinelRef = (0, react_1.useRef)(null);
    var _j = (0, react_1.useState)(false), isNearBottom = _j[0], setIsNearBottom = _j[1];
    // Create stable query key for infinite queries
    var stableQueryKey = (0, react_1.useMemo)(function () { return __spreadArray(__spreadArray([], (Array.isArray(queryKey) ? queryKey : [queryKey]), true), [
        'infinite',
        filters,
        sortBy,
        pageSize,
    ], false); }, [queryKey, filters, sortBy, pageSize]);
    var _k = (0, react_query_1.useInfiniteQuery)({
        queryKey: stableQueryKey,
        queryFn: function (_a) {
            var pageParam = _a.pageParam;
            return fetcher(filters, pageParam, sortBy);
        },
        initialPageParam: 1,
        getNextPageParam: function (lastPage, allPages) {
            // Return next page number if there are more pages
            if (!lastPage.hasNextPage)
                return undefined;
            return allPages.length + 1;
        },
        enabled: enabled,
        staleTime: staleTime,
        gcTime: gcTime,
        refetchOnWindowFocus: false,
        retry: function (failureCount, error) {
            return failureCount < 3 && error.message.includes('fetch');
        },
    }), data = _k.data, error = _k.error, fetchNextPage = _k.fetchNextPage, hasNextPage = _k.hasNextPage, isFetchingNextPage = _k.isFetchingNextPage, isLoading = _k.isLoading, refetch = _k.refetch, isRefetching = _k.isRefetching;
    // Flatten all pages into a single array for easy consumption
    var flatData = (0, react_1.useMemo)(function () {
        return (data === null || data === void 0 ? void 0 : data.pages.flatMap(function (page) { return page.items; })) || [];
    }, [data]);
    var totalCount = ((_a = data === null || data === void 0 ? void 0 : data.pages[0]) === null || _a === void 0 ? void 0 : _a.totalCount) || flatData.length;
    var currentPage = (data === null || data === void 0 ? void 0 : data.pages.length) || 0;
    // Intersection Observer for automatic loading when sentinel comes into view
    (0, react_1.useEffect)(function () {
        if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) {
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            var entry = entries[0];
            if (entry === null || entry === void 0 ? void 0 : entry.isIntersecting) {
                setIsNearBottom(true);
                fetchNextPage();
            }
            else {
                setIsNearBottom(false);
            }
        }, {
            rootMargin: rootMargin,
            threshold: 0.1,
        });
        observer.observe(sentinelRef.current);
        return function () {
            observer.disconnect();
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin]);
    // Manual scroll detection as fallback for containers without sentinel
    (0, react_1.useEffect)(function () {
        var scrollElement = scrollRef.current;
        if (!scrollElement)
            return;
        var handleScroll = function () {
            var scrollTop = scrollElement.scrollTop, scrollHeight = scrollElement.scrollHeight, clientHeight = scrollElement.clientHeight;
            var distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            var nearBottom = distanceFromBottom <= threshold;
            setIsNearBottom(nearBottom);
            // Trigger load more when near bottom
            if (nearBottom && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        };
        scrollElement.addEventListener('scroll', handleScroll, { passive: true });
        return function () {
            scrollElement.removeEventListener('scroll', handleScroll);
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);
    var loadMore = (0, react_1.useCallback)(function () {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
    return {
        data: flatData,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: currentPage,
        isLoading: isLoading,
        isError: !!error,
        error: error || null,
        isFetchingNextPage: isFetchingNextPage,
        isRefetching: isRefetching,
        fetchNextPage: fetchNextPage,
        hasNextPage: hasNextPage !== null && hasNextPage !== void 0 ? hasNextPage : false,
        scrollRef: scrollRef,
        isNearBottom: isNearBottom,
        loadMore: loadMore,
        refetch: refetch,
    };
}
// ------------------------------------------------------------------
// Client-side Pagination Implementation
// ------------------------------------------------------------------
function useClientPagination(options) {
    var _this = this;
    var items = options.items, itemsPerPage = options.itemsPerPage;
    var _a = (0, react_1.useState)(1), currentPage = _a[0], setCurrentPage = _a[1];
    var totalPages = Math.ceil(items.length / itemsPerPage);
    // Calculate the current page items efficiently
    var paginatedItems = (0, react_1.useMemo)(function () {
        var startIndex = (currentPage - 1) * itemsPerPage;
        var endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    }, [items, currentPage, itemsPerPage]);
    var goToPage = (0, react_1.useCallback)(function (page) {
        var validPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(validPage);
    }, [totalPages]);
    var nextPage = (0, react_1.useCallback)(function () {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);
    var previousPage = (0, react_1.useCallback)(function () {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);
    var resetPage = (0, react_1.useCallback)(function () {
        setCurrentPage(1);
    }, []);
    var refetch = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // For client pagination, refetch is a no-op since data is already in memory
            return [2 /*return*/, Promise.resolve()];
        });
    }); }, []);
    return {
        data: items,
        paginatedItems: paginatedItems,
        totalCount: items.length,
        totalPages: totalPages,
        currentPage: currentPage,
        isLoading: false,
        isError: false,
        error: null,
        isRefetching: false,
        goToPage: goToPage,
        nextPage: nextPage,
        previousPage: previousPage,
        resetPage: resetPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        refetch: refetch,
    };
}
/**
 * Compatibility hooks for property-specific pagination
 * These maintain the same API as the old hooks for easier migration
 */
function useResidentialPropertiesQuery(filters, sortBy, options) {
    var _this = this;
    var _a, _b;
    if (sortBy === void 0) { sortBy = 'date'; }
    return usePagination({
        mode: (options === null || options === void 0 ? void 0 : options.mode) || 'paginated',
        queryKey: ['properties', 'residential'],
        fetcher: function (filters, page, sort) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/properties/residential', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filters: filters, page: page, sort: sort, pageSize: (options === null || options === void 0 ? void 0 : options.pageSize) || 12 }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch residential properties: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        filters: filters,
        sortBy: sortBy,
        pageSize: (_a = options === null || options === void 0 ? void 0 : options.pageSize) !== null && _a !== void 0 ? _a : 12,
        enabled: (_b = options === null || options === void 0 ? void 0 : options.enabled) !== null && _b !== void 0 ? _b : true,
    });
}
function useCommercialPropertiesQuery(filters, sortBy, options) {
    var _this = this;
    var _a, _b;
    if (sortBy === void 0) { sortBy = 'date'; }
    return usePagination({
        mode: (options === null || options === void 0 ? void 0 : options.mode) || 'paginated',
        queryKey: ['properties', 'commercial'],
        fetcher: function (filters, page, sort) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/properties/commercial', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filters: filters, page: page, sort: sort, pageSize: (options === null || options === void 0 ? void 0 : options.pageSize) || 12 }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch commercial properties: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        filters: filters,
        sortBy: sortBy,
        pageSize: (_a = options === null || options === void 0 ? void 0 : options.pageSize) !== null && _a !== void 0 ? _a : 12,
        enabled: (_b = options === null || options === void 0 ? void 0 : options.enabled) !== null && _b !== void 0 ? _b : true,
    });
}
function useLandPropertiesQuery(filters, sortBy, options) {
    var _this = this;
    var _a, _b;
    if (sortBy === void 0) { sortBy = 'date'; }
    return usePagination({
        mode: (options === null || options === void 0 ? void 0 : options.mode) || 'paginated',
        queryKey: ['properties', 'land'],
        fetcher: function (filters, page, sort) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/properties/land', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filters: filters, page: page, sort: sort, pageSize: (options === null || options === void 0 ? void 0 : options.pageSize) || 12 }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch land properties: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        filters: filters,
        sortBy: sortBy,
        pageSize: (_a = options === null || options === void 0 ? void 0 : options.pageSize) !== null && _a !== void 0 ? _a : 12,
        enabled: (_b = options === null || options === void 0 ? void 0 : options.enabled) !== null && _b !== void 0 ? _b : true,
    });
}
function useAllPropertiesQuery(filters, sortBy, options) {
    var _this = this;
    var _a, _b;
    if (sortBy === void 0) { sortBy = 'date'; }
    return usePagination({
        mode: (options === null || options === void 0 ? void 0 : options.mode) || 'paginated',
        queryKey: ['properties', 'all'],
        fetcher: function (filters, page, sort) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/properties/all', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filters: filters, page: page, sort: sort, pageSize: (options === null || options === void 0 ? void 0 : options.pageSize) || 12 }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch properties: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        filters: filters,
        sortBy: sortBy,
        pageSize: (_a = options === null || options === void 0 ? void 0 : options.pageSize) !== null && _a !== void 0 ? _a : 12,
        enabled: (_b = options === null || options === void 0 ? void 0 : options.enabled) !== null && _b !== void 0 ? _b : true,
    });
}
function usePropertySearchQuery(searchTerm, filters, options) {
    var _this = this;
    var _a;
    if (filters === void 0) { filters = {}; }
    return usePagination({
        mode: (options === null || options === void 0 ? void 0 : options.mode) || 'paginated',
        queryKey: ['properties', 'search'],
        fetcher: function (combinedFilters, page, sort) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/properties/search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                search: searchTerm,
                                filters: combinedFilters,
                                page: page,
                                sort: sort,
                                pageSize: (options === null || options === void 0 ? void 0 : options.pageSize) || 12,
                            }),
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to search properties: ".concat(response.statusText));
                        }
                        return [2 /*return*/, response.json()];
                }
            });
        }); },
        filters: __assign(__assign({}, filters), { search: searchTerm }),
        sortBy: 'relevance',
        enabled: ((options === null || options === void 0 ? void 0 : options.enabled) !== false) && searchTerm.length > 2,
        pageSize: (_a = options === null || options === void 0 ? void 0 : options.pageSize) !== null && _a !== void 0 ? _a : 12,
    });
}
// ------------------------------------------------------------------
// Compatibility Functions (for migration from old hooks)
// ------------------------------------------------------------------
/**
 * Compatibility function for usePaginatedQuery migration
 * Fixed type issues by making optional properties truly optional
 */
function usePaginatedQuery(options) {
    var _a, _b;
    var result = usePagination({
        mode: 'infinite',
        queryKey: options.queryKey,
        fetcher: options.fetcher,
        filters: options.filters,
        sortBy: options.sortBy,
        pageSize: (_a = options.pageSize) !== null && _a !== void 0 ? _a : 12,
        enabled: (_b = options.enabled) !== null && _b !== void 0 ? _b : true,
        staleTime: options.staleTime,
        gcTime: options.gcTime,
    });
    // Transform to match old API structure
    return {
        data: result.data ? {
            items: result.data,
            totalCount: result.totalCount,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
        } : undefined,
        isLoading: result.isLoading,
        error: result.error,
        fetchNextPage: result.fetchNextPage || (function () { return Promise.resolve(); }),
        hasNextPage: result.hasNextPage || false,
        isFetchingNextPage: result.isFetchingNextPage || false,
        refetch: result.refetch,
        isRefetching: result.isRefetching,
    };
}
/**
 * Compatibility function for useInfiniteScroll migration
 * Fixed type issues and made parameters properly optional
 */
function useInfiniteScroll(options) {
    var _this = this;
    var _a;
    var result = usePagination({
        mode: 'infinite',
        queryKey: options.queryKey,
        fetcher: function (_filters, page, _sort) { return __awaiter(_this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, options.queryFn({ pageParam: page })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                items: response.data,
                                totalCount: response.totalCount || response.data.length,
                                hasNextPage: response.hasNextPage,
                                nextPage: response.nextPage,
                            }];
                }
            });
        }); },
        filters: {},
        enabled: (_a = options.enabled) !== null && _a !== void 0 ? _a : true,
        staleTime: options.staleTime,
        gcTime: options.gcTime,
        threshold: options.threshold,
        rootMargin: options.rootMargin,
    });
    return {
        data: result.data || [],
        flatData: result.data || [],
        totalCount: result.totalCount,
        hasNextPage: result.hasNextPage || false,
        isFetchingNextPage: result.isFetchingNextPage || false,
        fetchNextPage: result.fetchNextPage || (function () { return Promise.resolve(); }),
        scrollRef: result.scrollRef || { current: null },
        isNearBottom: result.isNearBottom || false,
        loadMore: result.loadMore || (function () { }),
        reset: result.refetch,
        isLoading: result.isLoading,
        isError: result.isError,
        error: result.error,
        refetch: result.refetch,
    };
}
exports.default = usePagination;
