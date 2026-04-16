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
exports.usePropertySearch = usePropertySearch;
var react_1 = require("react");
var useDebounce_1 = require("../../local/hooks/useDebounce");
var useSafeQuery_1 = require("../../local/hooks/useSafeQuery");
// Helper function to safely build PropertySearchParams without undefined values
// This ensures we never assign undefined to required properties
var buildSearchParams = function (base, updates) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    // Start with a clean base that satisfies all required properties
    // We ensure each required property has a concrete value, never undefined
    var result = {
        // Required properties - always provide concrete values by using nullish coalescing
        query: (_b = (_a = updates.query) !== null && _a !== void 0 ? _a : base.query) !== null && _b !== void 0 ? _b : "",
        location: (_d = (_c = updates.location) !== null && _c !== void 0 ? _c : base.location) !== null && _d !== void 0 ? _d : "",
        page: (_f = (_e = updates.page) !== null && _e !== void 0 ? _e : base.page) !== null && _f !== void 0 ? _f : 1,
        limit: (_h = (_g = updates.limit) !== null && _g !== void 0 ? _g : base.limit) !== null && _h !== void 0 ? _h : 12,
        sortBy: (_k = (_j = updates.sortBy) !== null && _j !== void 0 ? _j : base.sortBy) !== null && _k !== void 0 ? _k : "relevance",
        sortOrder: (_m = (_l = updates.sortOrder) !== null && _l !== void 0 ? _l : base.sortOrder) !== null && _m !== void 0 ? _m : "desc",
    };
    // Optional properties - only include if they have concrete values from either source
    // This approach satisfies exactOptionalPropertyTypes by never setting properties to undefined
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
// Determines if search criteria (non-pagination) have changed
// This helps us decide when to reset pagination
var hasSearchCriteriaChanged = function (updates) {
    return Object.keys(updates).some(function (key) {
        return key !== "page" &&
            key !== "limit" &&
            updates[key] !== undefined;
    });
};
var DEFAULT_SEARCH_PARAMS = {
    query: "",
    location: "",
    page: 1,
    limit: 12,
    sortBy: "relevance",
    sortOrder: "desc",
};
/**
 * @deprecated This hook is deprecated in favor of the unified useSearch hook from src/search/hooks/useSearch.ts
 * Please migrate to useSearch for better error handling, caching, and enhanced features.
 * Migration guide: Use useSearch() instead of usePropertySearch()
 */
function usePropertySearch() {
    // Add deprecation warning in development
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn("[DEPRECATED] usePropertySearch is deprecated. Please migrate to useConsolidatedPropertySearch for better error handling, enhanced features, and performance.");
    }
    var _a = (0, react_1.useState)(DEFAULT_SEARCH_PARAMS), searchParams = _a[0], setSearchParams = _a[1];
    var _b = (0, react_1.useState)([]), searchHistory = _b[0], setSearchHistory = _b[1];
    var _c = (0, react_1.useState)({
        totalSearches: 0,
        averageResponseTime: 0,
        lastSearchTime: 0,
        popularFilters: {},
    }), metrics = _c[0], setMetrics = _c[1];
    // Performance tracking references
    var searchStartTime = (0, react_1.useRef)(0);
    var searchTimeoutRef = (0, react_1.useRef)();
    // Smart debouncing that adapts based on user behavior
    // Fast typers get shorter delays, slow typers get longer delays to save API calls
    var _d = (0, react_1.useState)(500), adaptiveDelay = _d[0], setAdaptiveDelay = _d[1];
    var lastKeystrokeTime = (0, react_1.useRef)(0);
    var debouncedSearchParams = (0, useDebounce_1.useDebounce)(searchParams, adaptiveDelay);
    // Create a type-safe wrapper for the query parameters
    // This addresses the TypeScript error by ensuring proper typing
    var queryParams = (0, react_1.useMemo)(function () {
        // Convert PropertySearchParams to a Record<string, unknown> format
        // This ensures compatibility with the useSafePropertiesQuery hook
        var params = {};
        // Map each property explicitly to maintain type safety
        // We iterate through entries to avoid dynamic property access security warnings
        var entries = Object.entries(debouncedSearchParams);
        entries.forEach(function (_a) {
            var key = _a[0], value = _a[1];
            if (value !== undefined) {
                params[String(key)] = value;
            }
        });
        return params;
    }, [debouncedSearchParams]);
    var _e = (0, useSafeQuery_1.useSafePropertiesQuery)(queryParams), searchResults = _e.data, isLoading = _e.isLoading, error = _e.error, cancelRequest = _e.cancelRequest;
    // Resolve conflicts between filter combinations (e.g., price ranges, bed/bath counts)
    // This function ensures that user input doesn't create impossible search criteria
    var resolveFilterConflicts = (0, react_1.useCallback)(function (params) {
        var _a;
        var _b;
        var resolved = __assign({}, params);
        // Fix inverted price ranges - swap min/max if they're backwards
        if (resolved.priceMin &&
            resolved.priceMax &&
            resolved.priceMin > resolved.priceMax) {
            _a = [
                resolved.priceMax,
                resolved.priceMin,
            ], resolved.priceMin = _a[0], resolved.priceMax = _a[1];
        }
        // Ensure reasonable bedroom/bathroom counts - negative values don't make sense
        if (resolved.bedrooms !== undefined && resolved.bedrooms < 0) {
            resolved.bedrooms = 0;
        }
        if (resolved.bathrooms !== undefined && resolved.bathrooms < 0) {
            resolved.bathrooms = 0;
        }
        // Clear contradictory location filters to avoid confusion
        if (((_b = resolved.query) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("location:")) &&
            resolved.location) {
            // If query contains location specification, clear separate location field
            resolved.location = "";
        }
        return resolved;
    }, []);
    // Adaptive debounce delay calculation based on typing speed
    // This creates a more responsive search experience by adapting to user behavior
    var updateAdaptiveDelay = (0, react_1.useCallback)(function () {
        var now = Date.now();
        var timeSinceLastKeystroke = now - lastKeystrokeTime.current;
        if (timeSinceLastKeystroke < 200) {
            // Fast typing detected - reduce delay for better responsiveness
            setAdaptiveDelay(300);
        }
        else if (timeSinceLastKeystroke > 1000) {
            // Slow typing detected - increase delay to reduce unnecessary API calls
            setAdaptiveDelay(800);
        }
        else {
            // Normal typing speed - use standard delay
            setAdaptiveDelay(500);
        }
        lastKeystrokeTime.current = now;
    }, []);
    // Simplified search update function with reduced cognitive complexity
    // This is the core function that handles all search parameter updates
    var updateSearch = (0, react_1.useCallback)(function (updates) {
        updateAdaptiveDelay();
        // Cancel any pending requests and timeouts to prevent race conditions
        cancelRequest();
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        setSearchParams(function (prev) {
            // Determine if we need to reset pagination based on search criteria changes
            var shouldResetPage = hasSearchCriteriaChanged(updates) && updates.page === undefined;
            // Build the updated parameters with proper page handling
            var updatesWithPage = shouldResetPage ? __assign(__assign({}, updates), { page: 1 }) : updates;
            // Use our helper function to safely build the new parameters
            var mergedParams = buildSearchParams(prev, updatesWithPage);
            // Apply conflict resolution and return the final parameters
            return resolveFilterConflicts(mergedParams);
        });
        // Track search metrics for performance optimization
        searchStartTime.current = Date.now();
    }, [cancelRequest, updateAdaptiveDelay, resolveFilterConflicts]);
    // Generate secure UUID using modern browser API with proper fallback
    // Using a more robust approach that handles browser compatibility
    var generateId = (0, react_1.useCallback)(function () {
        var _a;
        // Use optional chaining for cleaner, more readable code
        if ((_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID) {
            return globalThis.crypto.randomUUID();
        }
        // Fallback implementation for environments without crypto.randomUUID
        // This generates a UUID v4-compliant string using Math.random
        // Note: This is acceptable for UI component IDs, not security-critical operations
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            // Using Math.random is acceptable here as this is only for UI component IDs, not security tokens
            // eslint-disable-next-line sonarjs/pseudo-random
            var r = (Math.random() * 16) | 0;
            var v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }, []);
    // Helper function to extract search criteria without pagination
    var getSearchCriteriaOnly = (0, react_1.useCallback)(function (searchParams) {
        var page = searchParams.page, limit = searchParams.limit, criteria = __rest(searchParams, ["page", "limit"]);
        return criteria;
    }, []);
    // Helper function to check if search criteria are duplicate
    var isDuplicateSearch = (0, react_1.useCallback)(function (existingParams, newParams) {
        var existingCriteria = getSearchCriteriaOnly(existingParams);
        var newCriteria = getSearchCriteriaOnly(newParams);
        return JSON.stringify(existingCriteria) === JSON.stringify(newCriteria);
    }, [getSearchCriteriaOnly]);
    // Advanced search history management with deduplication and intelligent suggestions
    // This function prevents duplicate entries while preserving useful search history
    var addToHistory = (0, react_1.useCallback)(function (params, resultCount) {
        // Create history entry with proper typing to satisfy exactOptionalPropertyTypes
        var baseEntry = {
            id: generateId(),
            params: __assign({}, params),
            timestamp: Date.now(),
        };
        // Only add resultCount if it's actually defined - this satisfies exact optional types
        var historyEntry = resultCount !== undefined ? __assign(__assign({}, baseEntry), { resultCount: resultCount }) : baseEntry;
        setSearchHistory(function (prev) {
            // Deduplicate based on search criteria (ignoring pagination parameters)
            var isDuplicate = prev.some(function (entry) { return isDuplicateSearch(entry.params, params); });
            if (isDuplicate)
                return prev;
            // Keep only the 20 most recent unique searches for performance
            return __spreadArray([historyEntry], prev, true).slice(0, 20);
        });
    }, [generateId, isDuplicateSearch]);
    // Safe metrics tracking that explicitly handles each property
    // This function explicitly handles each property to avoid security warnings
    var trackFilterUsage = (0, react_1.useCallback)(function (newPopularFilters) {
        var _a, _b;
        // Explicitly check each property to avoid security warnings about dynamic access
        // This approach is more verbose but eliminates all security concerns
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
        if (params.sortOrder && params.sortOrder !== "desc") {
            newPopularFilters.sortOrder = (newPopularFilters.sortOrder || 0) + 1;
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
        if (params.areaMin !== undefined) {
            newPopularFilters.areaMin = (newPopularFilters.areaMin || 0) + 1;
        }
        if (params.areaMax !== undefined) {
            newPopularFilters.areaMax = (newPopularFilters.areaMax || 0) + 1;
        }
    }, [debouncedSearchParams]);
    // Performance metrics tracking with safe property access
    // This useEffect monitors search performance and builds analytics data
    (0, react_1.useEffect)(function () {
        if (!isLoading && searchStartTime.current > 0) {
            var responseTime_1 = Date.now() - searchStartTime.current;
            setMetrics(function (prev) {
                var newTotalSearches = prev.totalSearches + 1;
                // Calculate running average of response times
                var newAverageResponseTime = (prev.averageResponseTime * prev.totalSearches + responseTime_1) /
                    newTotalSearches;
                // Track popular filter usage for analytics using safe property access
                var newPopularFilters = __assign({}, prev.popularFilters);
                trackFilterUsage(newPopularFilters);
                return {
                    totalSearches: newTotalSearches,
                    averageResponseTime: newAverageResponseTime,
                    lastSearchTime: responseTime_1,
                    popularFilters: newPopularFilters,
                };
            });
            // Add successful searches to history for future reference
            if (searchResults && !error) {
                // Extract result count in a type-safe manner
                var resultCount = void 0;
                // Handle the new useSafePropertiesQuery return type (Property[])
                if (Array.isArray(searchResults)) {
                    resultCount = searchResults.length;
                }
                addToHistory(debouncedSearchParams, resultCount);
            }
            // Reset the timing tracker
            searchStartTime.current = 0;
        }
    }, [
        isLoading,
        searchResults,
        error,
        debouncedSearchParams,
        addToHistory,
        trackFilterUsage,
    ]);
    // Intelligent search suggestions based on history and popular patterns
    // This function provides autocomplete-style suggestions to improve user experience
    var getSearchSuggestions = (0, react_1.useCallback)(function (currentInput) {
        if (!currentInput.trim())
            return [];
        var suggestions = new Set();
        var input = currentInput.toLowerCase();
        // Extract suggestions from search history
        searchHistory.forEach(function (entry) {
            var _a, _b;
            // Check query field for matches
            if ((_a = entry.params.query) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(input)) {
                suggestions.add(entry.params.query);
            }
            // Check location field for matches
            if ((_b = entry.params.location) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(input)) {
                suggestions.add(entry.params.location);
            }
        });
        // Add popular search patterns based on usage metrics
        var popularQueries = Object.entries(metrics.popularFilters)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        }) // Sort by popularity (descending)
            .slice(0, 5) // Take top 5 most popular
            .map(function (_a) {
            var key = _a[0];
            return key;
        })
            .filter(function (key) { return key.toLowerCase().includes(input); });
        popularQueries.forEach(function (query) { return suggestions.add(query); });
        // Return up to 8 suggestions to avoid overwhelming the UI
        return Array.from(suggestions).slice(0, 8);
    }, [searchHistory, metrics.popularFilters]);
    // Bulk filter operations for advanced filtering UI components
    // This allows applying multiple filters simultaneously
    var applyFilterSet = (0, react_1.useCallback)(function (filters) {
        updateSearch(__assign(__assign({}, filters), { page: 1 }));
    }, [updateSearch]);
    // Quick filter presets for common search scenarios with safe property access
    // This provides one-click access to popular search configurations
    var applyPreset = (0, react_1.useCallback)(function (preset) {
        // Define presets with explicit typing to avoid dynamic access issues
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
                // This should never happen with the typed parameter, but we handle it for completeness
                return;
        }
        applyFilterSet(presetConfig);
    }, [applyFilterSet]);
    // Enhanced clear function with selective clearing options
    // This provides flexible reset functionality for different use cases
    var clearSearch = (0, react_1.useCallback)(function (options) {
        cancelRequest();
        var clearedParams = __assign({}, DEFAULT_SEARCH_PARAMS);
        // Optionally preserve location if requested
        if ((options === null || options === void 0 ? void 0 : options.keepLocation) && searchParams.location) {
            clearedParams = __assign(__assign({}, clearedParams), { location: searchParams.location });
        }
        // Optionally preserve price range if requested
        if (options === null || options === void 0 ? void 0 : options.keepPriceRange) {
            if (searchParams.priceMin !== undefined) {
                clearedParams = __assign(__assign({}, clearedParams), { priceMin: searchParams.priceMin });
            }
            if (searchParams.priceMax !== undefined) {
                clearedParams = __assign(__assign({}, clearedParams), { priceMax: searchParams.priceMax });
            }
        }
        setSearchParams(clearedParams);
    }, [
        cancelRequest,
        searchParams.location,
        searchParams.priceMin,
        searchParams.priceMax,
    ]);
    // Advanced computed states for complex UI scenarios
    // This determines if any search filters are currently active
    var hasActiveFilters = (0, react_1.useMemo)(function () {
        var query = debouncedSearchParams.query, location = debouncedSearchParams.location, priceMin = debouncedSearchParams.priceMin, priceMax = debouncedSearchParams.priceMax, propertyType = debouncedSearchParams.propertyType, bedrooms = debouncedSearchParams.bedrooms, bathrooms = debouncedSearchParams.bathrooms;
        return !!((query === null || query === void 0 ? void 0 : query.trim()) ||
            (location === null || location === void 0 ? void 0 : location.trim()) ||
            priceMin ||
            priceMax ||
            propertyType ||
            bedrooms ||
            bathrooms);
    }, [debouncedSearchParams]);
    // Determines if current search parameters are likely to return good results
    // This can be used to show search optimization hints to users
    var isSearchOptimal = (0, react_1.useMemo)(function () {
        var _a;
        var hasLocation = !!((_a = debouncedSearchParams.location) === null || _a === void 0 ? void 0 : _a.trim());
        var hasPriceRange = !!(debouncedSearchParams.priceMin || debouncedSearchParams.priceMax);
        var hasPropertyDetails = !!(debouncedSearchParams.bedrooms ||
            debouncedSearchParams.bathrooms ||
            debouncedSearchParams.propertyType);
        return hasLocation && (hasPriceRange || hasPropertyDetails);
    }, [debouncedSearchParams]);
    // Helper functions for common operations
    var goToPage = (0, react_1.useCallback)(function (page) { return updateSearch({ page: page }); }, [updateSearch]);
    var sortBy = (0, react_1.useCallback)(function (sortBy, sortOrder) {
        if (sortOrder === void 0) { sortOrder = "desc"; }
        // Ensure we don't pass undefined values to updateSearch
        if (sortBy != null) {
            updateSearch({ sortBy: sortBy, sortOrder: sortOrder });
        }
    }, [updateSearch]);
    // Reset all filters but keep location for user convenience
    var resetFilters = (0, react_1.useCallback)(function () { return clearSearch({ keepLocation: true }); }, [clearSearch]);
    // Restore a search from history
    var duplicateSearch = (0, react_1.useCallback)(function (historyId) {
        var historyEntry = searchHistory.find(function (entry) { return entry.id === historyId; });
        if (historyEntry) {
            setSearchParams(__assign(__assign({}, historyEntry.params), { page: 1 }));
        }
    }, [searchHistory]);
    return {
        // Core search state
        searchParams: searchParams,
        debouncedSearchParams: debouncedSearchParams,
        searchResults: searchResults,
        isLoading: isLoading,
        error: error,
        // Enhanced actions
        updateSearch: updateSearch,
        clearSearch: clearSearch,
        cancelRequest: cancelRequest,
        applyFilterSet: applyFilterSet,
        applyPreset: applyPreset,
        // Intelligence features
        searchHistory: searchHistory,
        getSearchSuggestions: getSearchSuggestions,
        metrics: metrics,
        // Advanced computed state
        hasActiveFilters: hasActiveFilters,
        isSearchOptimal: isSearchOptimal,
        adaptiveDelay: adaptiveDelay,
        // Utility functions
        goToPage: goToPage,
        sortBy: sortBy,
        resetFilters: resetFilters,
        duplicateSearch: duplicateSearch,
    };
}
