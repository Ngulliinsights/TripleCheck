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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.useConsolidatedPropertySearch = useConsolidatedPropertySearch;
var react_1 = require("react");
var useDebounce_1 = require("../../local/hooks/useDebounce");
var useSafeQuery_1 = require("../../local/hooks/useSafeQuery");
var DEFAULT_SEARCH_PARAMS = {
    query: "",
    location: "",
    page: 1,
    limit: 12,
    sortBy: "relevance",
    sortOrder: "desc",
};
// Helper function to safely build PropertySearchParams
var buildSearchParams = function (base, updates) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    var result = {
        query: (_b = (_a = updates.query) !== null && _a !== void 0 ? _a : base.query) !== null && _b !== void 0 ? _b : "",
        location: (_d = (_c = updates.location) !== null && _c !== void 0 ? _c : base.location) !== null && _d !== void 0 ? _d : "",
        page: (_f = (_e = updates.page) !== null && _e !== void 0 ? _e : base.page) !== null && _f !== void 0 ? _f : 1,
        limit: (_h = (_g = updates.limit) !== null && _g !== void 0 ? _g : base.limit) !== null && _h !== void 0 ? _h : 12,
        sortBy: (_k = (_j = updates.sortBy) !== null && _j !== void 0 ? _j : base.sortBy) !== null && _k !== void 0 ? _k : "relevance",
        sortOrder: (_m = (_l = updates.sortOrder) !== null && _l !== void 0 ? _l : base.sortOrder) !== null && _m !== void 0 ? _m : "desc",
    };
    // Optional properties - only include if they have concrete values
    if (updates.priceMin !== undefined) {
        result.priceMin = updates.priceMin;
    }
    else if (base.priceMin !== undefined) {
        result.priceMin = base.priceMin;
    }
    if (updates.priceMax !== undefined) {
        result.priceMax = updates.priceMax;
    }
    else if (base.priceMax !== undefined) {
        result.priceMax = base.priceMax;
    }
    if (updates.propertyType !== undefined) {
        result.propertyType = updates.propertyType;
    }
    else if (base.propertyType !== undefined) {
        result.propertyType = base.propertyType;
    }
    if (updates.bedrooms !== undefined) {
        result.bedrooms = updates.bedrooms;
    }
    else if (base.bedrooms !== undefined) {
        result.bedrooms = base.bedrooms;
    }
    if (updates.bathrooms !== undefined) {
        result.bathrooms = updates.bathrooms;
    }
    else if (base.bathrooms !== undefined) {
        result.bathrooms = base.bathrooms;
    }
    if (updates.areaMin !== undefined) {
        result.areaMin = updates.areaMin;
    }
    else if (base.areaMin !== undefined) {
        result.areaMin = base.areaMin;
    }
    if (updates.areaMax !== undefined) {
        result.areaMax = updates.areaMax;
    }
    else if (base.areaMax !== undefined) {
        result.areaMax = base.areaMax;
    }
    return result;
};
// Check if search criteria (non-pagination) have changed
var hasSearchCriteriaChanged = function (updates) {
    return Object.keys(updates).some(function (key) { return key !== "page" && key !== "limit" &&
        updates[key] !== undefined; });
};
// Generate secure UUID for history entries
var generateId = function () {
    var _a;
    if ((_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
/**
 * @deprecated This hook is deprecated in favor of the unified useSearch hook from src/search/hooks/useSearch.ts
 * Please migrate to useSearch for better error handling, caching, and enhanced features.
 * Migration guide: Use useSearch() instead of useConsolidatedPropertySearch()
 *
 * Consolidated property search hook that combines functionality from:
 * - usePropertySearch.ts (search and filtering)
 * - Enhanced with intelligent suggestions, metrics, and history
 */
function useConsolidatedPropertySearch(initialParams, options) {
    if (initialParams === void 0) { initialParams = {}; }
    if (options === void 0) { options = {}; }
    var _a = options.debounceMs, debounceMs = _a === void 0 ? 500 : _a, _b = options.maxHistoryEntries, maxHistoryEntries = _b === void 0 ? 20 : _b, _c = options.enableSuggestions, enableSuggestions = _c === void 0 ? true : _c, _d = options.enableMetrics, enableMetrics = _d === void 0 ? true : _d, _e = options.adaptiveDebounce, adaptiveDebounce = _e === void 0 ? true : _e;
    // Core search state
    var _f = (0, react_1.useState)(__assign(__assign({}, DEFAULT_SEARCH_PARAMS), initialParams)), searchParams = _f[0], setSearchParams = _f[1];
    // Advanced features state
    var _g = (0, react_1.useState)([]), searchHistory = _g[0], setSearchHistory = _g[1];
    var _h = (0, react_1.useState)({
        totalSearches: 0,
        averageResponseTime: 0,
        lastSearchTime: 0,
        popularFilters: {},
    }), metrics = _h[0], setMetrics = _h[1];
    // Performance tracking
    var searchStartTime = (0, react_1.useRef)(0);
    var lastKeystrokeTime = (0, react_1.useRef)(0);
    var _j = (0, react_1.useState)(debounceMs), adaptiveDelay = _j[0], setAdaptiveDelay = _j[1];
    // Adaptive debouncing based on typing speed
    var updateAdaptiveDelay = (0, react_1.useCallback)(function () {
        if (!adaptiveDebounce)
            return;
        var now = Date.now();
        var timeSinceLastKeystroke = now - lastKeystrokeTime.current;
        if (timeSinceLastKeystroke < 200) {
            setAdaptiveDelay(300); // Fast typing - reduce delay
        }
        else if (timeSinceLastKeystroke > 1000) {
            setAdaptiveDelay(800); // Slow typing - increase delay
        }
        else {
            setAdaptiveDelay(500); // Normal typing speed
        }
        lastKeystrokeTime.current = now;
    }, [adaptiveDebounce]);
    var debouncedSearchParams = (0, useDebounce_1.useDebounce)(searchParams, adaptiveDelay);
    // Convert to query parameters for API call
    var queryParams = (0, react_1.useMemo)(function () {
        var params = {};
        var entries = Object.entries(debouncedSearchParams);
        entries.forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (value !== undefined) {
                params[String(key)] = value;
            }
        });
        return params;
    }, [debouncedSearchParams]);
    // Use the safe properties query for actual data fetching
    var _k = (0, useSafeQuery_1.useSafePropertiesQuery)(queryParams), searchResults = _k.data, isLoading = _k.isLoading, error = _k.error, cancelRequest = _k.cancelRequest;
    // Resolve filter conflicts
    var resolveFilterConflicts = (0, react_1.useCallback)(function (params) {
        var _a;
        var _b;
        var resolved = __assign({}, params);
        // Fix inverted price ranges
        if (resolved.priceMin && resolved.priceMax && resolved.priceMin > resolved.priceMax) {
            _a = [resolved.priceMax, resolved.priceMin], resolved.priceMin = _a[0], resolved.priceMax = _a[1];
        }
        // Ensure reasonable bedroom/bathroom counts
        if (resolved.bedrooms !== undefined && resolved.bedrooms < 0) {
            resolved.bedrooms = 0;
        }
        if (resolved.bathrooms !== undefined && resolved.bathrooms < 0) {
            resolved.bathrooms = 0;
        }
        // Clear contradictory location filters
        if (((_b = resolved.query) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("location:")) && resolved.location) {
            resolved.location = "";
        }
        return resolved;
    }, []);
    // Main search update function
    var updateSearch = (0, react_1.useCallback)(function (updates) {
        updateAdaptiveDelay();
        cancelRequest();
        setSearchParams(function (prev) {
            var shouldResetPage = hasSearchCriteriaChanged(updates) && updates.page === undefined;
            var updatesWithPage = shouldResetPage ? __assign(__assign({}, updates), { page: 1 }) : updates;
            var mergedParams = buildSearchParams(prev, updatesWithPage);
            return resolveFilterConflicts(mergedParams);
        });
        searchStartTime.current = Date.now();
    }, [cancelRequest, updateAdaptiveDelay, resolveFilterConflicts]);
    // Add search to history
    var addToHistory = (0, react_1.useCallback)(function (params, resultCount) {
        if (!enableMetrics)
            return;
        var baseEntry = {
            id: generateId(),
            params: __assign({}, params),
            timestamp: Date.now(),
        };
        var historyEntry = resultCount !== undefined ? __assign(__assign({}, baseEntry), { resultCount: resultCount }) : baseEntry;
        setSearchHistory(function (prev) {
            // Deduplicate based on search criteria
            var isDuplicate = prev.some(function (entry) {
                var _a = entry.params, page = _a.page, limit = _a.limit, existingCriteria = __rest(_a, ["page", "limit"]);
                var newPage = params.page, newLimit = params.limit, newCriteria = __rest(params, ["page", "limit"]);
                return JSON.stringify(existingCriteria) === JSON.stringify(newCriteria);
            });
            if (isDuplicate)
                return prev;
            return __spreadArray([historyEntry], prev, true).slice(0, maxHistoryEntries);
        });
    }, [enableMetrics, maxHistoryEntries]);
    // Track filter usage for metrics
    var trackFilterUsage = (0, react_1.useCallback)(function (newPopularFilters) {
        var _a, _b;
        if (!enableMetrics)
            return;
        var params = debouncedSearchParams;
        if ((_a = params.query) === null || _a === void 0 ? void 0 : _a.trim()) {
            newPopularFilters.query = (newPopularFilters.query || 0) + 1;
        }
        if ((_b = params.location) === null || _b === void 0 ? void 0 : _b.trim()) {
            newPopularFilters.location = (newPopularFilters.location || 0) + 1;
        }
        if (params.sortBy && params.sortBy !== "relevance") {
            newPopularFilters.sortBy = (newPopularFilters.sortBy || 0) + 1;
        }
        if (params.priceMin !== undefined) {
            newPopularFilters.priceMin = (newPopularFilters.priceMin || 0) + 1;
        }
        if (params.priceMax !== undefined) {
            newPopularFilters.priceMax = (newPopularFilters.priceMax || 0) + 1;
        }
        if (params.propertyType) {
            newPopularFilters.propertyType = (newPopularFilters.propertyType || 0) + 1;
        }
        if (params.bedrooms !== undefined) {
            newPopularFilters.bedrooms = (newPopularFilters.bedrooms || 0) + 1;
        }
        if (params.bathrooms !== undefined) {
            newPopularFilters.bathrooms = (newPopularFilters.bathrooms || 0) + 1;
        }
    }, [debouncedSearchParams, enableMetrics]);
    // Update metrics when search completes
    (0, react_1.useEffect)(function () {
        if (!enableMetrics || !searchStartTime.current || isLoading)
            return;
        var responseTime = Date.now() - searchStartTime.current;
        setMetrics(function (prev) {
            var newTotalSearches = prev.totalSearches + 1;
            var newAverageResponseTime = (prev.averageResponseTime * prev.totalSearches + responseTime) / newTotalSearches;
            var newPopularFilters = __assign({}, prev.popularFilters);
            trackFilterUsage(newPopularFilters);
            return {
                totalSearches: newTotalSearches,
                averageResponseTime: newAverageResponseTime,
                lastSearchTime: responseTime,
                popularFilters: newPopularFilters,
            };
        });
        // Add to history if successful
        if (searchResults && !error) {
            var resultCount = Array.isArray(searchResults) ? searchResults.length : 0;
            addToHistory(debouncedSearchParams, resultCount);
        }
        searchStartTime.current = 0;
    }, [isLoading, searchResults, error, debouncedSearchParams, addToHistory, trackFilterUsage, enableMetrics]);
    // Generate search suggestions
    var searchSuggestions = (0, react_1.useMemo)(function () {
        var _a;
        if (!enableSuggestions)
            return [];
        var suggestions = [];
        var currentInput = ((_a = searchParams.query) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
        if (!currentInput.trim())
            return suggestions;
        // Extract suggestions from search history
        searchHistory.forEach(function (entry) {
            var _a, _b;
            if ((_a = entry.params.query) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(currentInput)) {
                var suggestion = {
                    text: entry.params.query,
                    type: 'query',
                };
                if (entry.resultCount !== undefined) {
                    suggestion.count = entry.resultCount;
                }
                suggestions.push(suggestion);
            }
            if ((_b = entry.params.location) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(currentInput)) {
                var suggestion = {
                    text: entry.params.location,
                    type: 'location',
                };
                if (entry.resultCount !== undefined) {
                    suggestion.count = entry.resultCount;
                }
                suggestions.push(suggestion);
            }
        });
        // Add popular patterns
        Object.entries(metrics.popularFilters)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 5)
            .forEach(function (_a) {
            var key = _a[0], count = _a[1];
            if (key.toLowerCase().includes(currentInput)) {
                suggestions.push({
                    text: key,
                    type: 'property',
                    count: count,
                });
            }
        });
        // Deduplicate and limit
        var uniqueSuggestions = suggestions
            .filter(function (suggestion, index, self) {
            return self.findIndex(function (s) { return s.text === suggestion.text; }) === index;
        })
            .slice(0, 8);
        return uniqueSuggestions;
    }, [enableSuggestions, searchParams.query, searchHistory, metrics.popularFilters]);
    // Computed states
    var hasActiveFilters = (0, react_1.useMemo)(function () {
        var query = debouncedSearchParams.query, location = debouncedSearchParams.location, priceMin = debouncedSearchParams.priceMin, priceMax = debouncedSearchParams.priceMax, propertyType = debouncedSearchParams.propertyType, bedrooms = debouncedSearchParams.bedrooms, bathrooms = debouncedSearchParams.bathrooms;
        return !!((query === null || query === void 0 ? void 0 : query.trim()) || (location === null || location === void 0 ? void 0 : location.trim()) || priceMin || priceMax || propertyType || bedrooms || bathrooms);
    }, [debouncedSearchParams]);
    var isSearchOptimal = (0, react_1.useMemo)(function () {
        var _a;
        var hasLocation = !!((_a = debouncedSearchParams.location) === null || _a === void 0 ? void 0 : _a.trim());
        var hasPriceRange = !!(debouncedSearchParams.priceMin || debouncedSearchParams.priceMax);
        var hasPropertyDetails = !!(debouncedSearchParams.bedrooms || debouncedSearchParams.bathrooms || debouncedSearchParams.propertyType);
        return hasLocation && (hasPriceRange || hasPropertyDetails);
    }, [debouncedSearchParams]);
    // Action functions
    var clearSearch = (0, react_1.useCallback)(function (options) {
        cancelRequest();
        var clearedParams = __assign({}, DEFAULT_SEARCH_PARAMS);
        if ((options === null || options === void 0 ? void 0 : options.keepLocation) && searchParams.location) {
            clearedParams = __assign(__assign({}, clearedParams), { location: searchParams.location });
        }
        if (options === null || options === void 0 ? void 0 : options.keepPriceRange) {
            if (searchParams.priceMin !== undefined) {
                clearedParams = __assign(__assign({}, clearedParams), { priceMin: searchParams.priceMin });
            }
            if (searchParams.priceMax !== undefined) {
                clearedParams = __assign(__assign({}, clearedParams), { priceMax: searchParams.priceMax });
            }
        }
        setSearchParams(clearedParams);
    }, [cancelRequest, searchParams.location, searchParams.priceMin, searchParams.priceMax]);
    var resetFilters = (0, react_1.useCallback)(function () { return clearSearch({ keepLocation: true }); }, [clearSearch]);
    var goToPage = (0, react_1.useCallback)(function (page) { return updateSearch({ page: page }); }, [updateSearch]);
    var sortBy = (0, react_1.useCallback)(function (sortBy, sortOrder) {
        if (sortOrder === void 0) { sortOrder = "desc"; }
        if (sortBy != null) {
            updateSearch({ sortBy: sortBy, sortOrder: sortOrder });
        }
    }, [updateSearch]);
    var applyFilterSet = (0, react_1.useCallback)(function (filters) {
        updateSearch(__assign(__assign({}, filters), { page: 1 }));
    }, [updateSearch]);
    var applyPreset = (0, react_1.useCallback)(function (preset) {
        var presetConfig;
        switch (preset) {
            case "luxury":
                presetConfig = {
                    priceMin: 500000,
                    bedrooms: 3,
                    bathrooms: 2,
                    sortBy: "price",
                    sortOrder: "desc",
                };
                break;
            case "budget":
                presetConfig = {
                    priceMax: 200000,
                    sortBy: "price",
                    sortOrder: "asc",
                };
                break;
            case "family":
                presetConfig = {
                    bedrooms: 3,
                    bathrooms: 2,
                    propertyType: "house",
                };
                break;
            case "studio":
                presetConfig = {
                    bedrooms: 0,
                    bathrooms: 1,
                    propertyType: "apartment",
                };
                break;
            default:
                return;
        }
        applyFilterSet(presetConfig);
    }, [applyFilterSet]);
    var duplicateSearch = (0, react_1.useCallback)(function (historyId) {
        var historyEntry = searchHistory.find(function (entry) { return entry.id === historyId; });
        if (historyEntry) {
            setSearchParams(__assign(__assign({}, historyEntry.params), { page: 1 }));
        }
    }, [searchHistory]);
    // Extract properties and metadata from search results
    var properties = (0, react_1.useMemo)(function () {
        return Array.isArray(searchResults) ? searchResults : [];
    }, [searchResults]);
    var totalCount = (0, react_1.useMemo)(function () {
        return properties.length;
    }, [properties]);
    var hasNextPage = (0, react_1.useMemo)(function () {
        return searchParams.page * searchParams.limit < totalCount;
    }, [searchParams.page, searchParams.limit, totalCount]);
    return {
        // Data
        properties: properties,
        totalCount: totalCount,
        hasNextPage: hasNextPage,
        isLoading: isLoading,
        error: error || null,
        // Search state
        searchParams: searchParams,
        debouncedSearchParams: debouncedSearchParams,
        // Actions
        updateSearch: updateSearch,
        clearSearch: clearSearch,
        resetFilters: resetFilters,
        goToPage: goToPage,
        sortBy: sortBy,
        // Advanced features
        searchHistory: searchHistory,
        searchSuggestions: searchSuggestions,
        metrics: metrics,
        hasActiveFilters: hasActiveFilters,
        isSearchOptimal: isSearchOptimal,
        // Utility functions
        applyFilterSet: applyFilterSet,
        applyPreset: applyPreset,
        duplicateSearch: duplicateSearch,
    };
}
exports.default = useConsolidatedPropertySearch;
