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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSearch = useSearch;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var SearchService_1 = require("../../local/services/SearchService");
var search_1 = require("../../local/types/search");
// Query keys are now imported from unified types
function useSearch(_a) {
    var _b;
    var _c = _a === void 0 ? {} : _a, _d = _c.initialFilters, initialFilters = _d === void 0 ? {} : _d, _e = _c.initialOptions, initialOptions = _e === void 0 ? { page: 1, limit: 20, sortBy: 'relevance', sortOrder: 'desc' } : _e, _f = _c.autoSearch, autoSearch = _f === void 0 ? false : _f, _g = _c.debounceMs, debounceMs = _g === void 0 ? 300 : _g;
    var queryClient = (0, react_query_1.useQueryClient)();
    var _h = (0, react_1.useState)(initialFilters), filters = _h[0], setFilters = _h[1];
    var _j = (0, react_1.useState)(initialOptions), options = _j[0], setOptions = _j[1];
    var _k = (0, react_1.useState)(autoSearch), isSearchActive = _k[0], setIsSearchActive = _k[1];
    var _l = (0, react_1.useState)(filters), debouncedFilters = _l[0], setDebouncedFilters = _l[1];
    // Debounce filters to avoid too many API calls
    (0, react_1.useEffect)(function () {
        var timer = setTimeout(function () {
            setDebouncedFilters(filters);
        }, debounceMs);
        return function () { return clearTimeout(timer); };
    }, [filters, debounceMs]);
    // Search results query
    var _m = (0, react_query_1.useQuery)({
        queryKey: search_1.searchKeys.results(debouncedFilters, options),
        queryFn: function () { return SearchService_1.searchService.searchProperties(debouncedFilters, options); },
        enabled: isSearchActive && Object.keys(debouncedFilters).some(function (key) { return debouncedFilters[key]; }),
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    }), searchResults = _m.data, isLoading = _m.isLoading, error = _m.error, refetch = _m.refetch, isFetching = _m.isFetching;
    // Suggestions query
    var _o = (0, react_query_1.useQuery)({
        queryKey: search_1.searchKeys.suggestions(filters.query || ''),
        queryFn: function () { return SearchService_1.searchService.getSuggestions(filters.query || ''); },
        enabled: Boolean(filters.query && filters.query.length >= 2),
        staleTime: 5 * 60 * 1000, // 5 minutes
    }), suggestions = _o.data, isLoadingSuggestions = _o.isLoading;
    // Location suggestions query
    var _p = (0, react_query_1.useQuery)({
        queryKey: search_1.searchKeys.locations(filters.location || ''),
        queryFn: function () { return SearchService_1.searchService.getLocationSuggestions(filters.location || ''); },
        enabled: Boolean(filters.location && filters.location.length >= 2),
        staleTime: 10 * 60 * 1000, // 10 minutes
    }), locationSuggestions = _p.data, isLoadingLocations = _p.isLoading;
    // Popular searches query
    var popularSearches = (0, react_query_1.useQuery)({
        queryKey: search_1.searchKeys.popular(),
        queryFn: function () { return SearchService_1.searchService.getPopularSearches(); },
        staleTime: 60 * 60 * 1000, // 1 hour
    }).data;
    // Search facets query
    var _q = (0, react_query_1.useQuery)({
        queryKey: search_1.searchKeys.facets(debouncedFilters),
        queryFn: function () { return SearchService_1.searchService.getSearchFacets(debouncedFilters); },
        enabled: isSearchActive,
        staleTime: 5 * 60 * 1000, // 5 minutes
    }), facets = _q.data, isLoadingFacets = _q.isLoading;
    // Update filter
    var updateFilter = (0, react_1.useCallback)(function (key, value) {
        setFilters(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    // Update multiple filters
    var updateFilters = (0, react_1.useCallback)(function (newFilters) {
        setFilters(function (prev) { return (__assign(__assign({}, prev), newFilters)); });
    }, []);
    // Clear filters
    var clearFilters = (0, react_1.useCallback)(function () {
        setFilters({});
        setOptions(initialOptions);
    }, [initialOptions]);
    // Update options
    var updateOptions = (0, react_1.useCallback)(function (newOptions) {
        setOptions(function (prev) { return (__assign(__assign({}, prev), newOptions)); });
    }, []);
    // Perform search
    var search = (0, react_1.useCallback)(function () {
        setIsSearchActive(true);
        // Save search for analytics
        if (searchResults) {
            SearchService_1.searchService.saveSearch(debouncedFilters, searchResults.total);
        }
    }, [debouncedFilters, searchResults]);
    // Reset search
    var resetSearch = (0, react_1.useCallback)(function () {
        setIsSearchActive(false);
        clearFilters();
    }, [clearFilters]);
    // Load more results (pagination)
    var loadMore = (0, react_1.useCallback)(function () {
        if (searchResults === null || searchResults === void 0 ? void 0 : searchResults.hasMore) {
            updateOptions({ page: (options.page || 1) + 1 });
        }
    }, [searchResults === null || searchResults === void 0 ? void 0 : searchResults.hasMore, options.page, updateOptions]);
    // Validate current filters
    var validation = (0, react_1.useMemo)(function () {
        return SearchService_1.searchService.validateFilters(filters);
    }, [filters]);
    // Check if search has results
    var hasResults = (0, react_1.useMemo)(function () {
        var _a;
        return Boolean((_a = searchResults === null || searchResults === void 0 ? void 0 : searchResults.items) === null || _a === void 0 ? void 0 : _a.length);
    }, [(_b = searchResults === null || searchResults === void 0 ? void 0 : searchResults.items) === null || _b === void 0 ? void 0 : _b.length]);
    // Check if search is empty
    var isEmpty = (0, react_1.useMemo)(function () {
        return isSearchActive && !isLoading && !hasResults;
    }, [isSearchActive, isLoading, hasResults]);
    // Get active filter count
    var activeFilterCount = (0, react_1.useMemo)(function () {
        return Object.values(filters).filter(function (value) {
            return value !== undefined && value !== null && value !== '' &&
                (!Array.isArray(value) || value.length > 0);
        }).length;
    }, [filters]);
    // Clear cache
    var clearCache = (0, react_1.useCallback)(function () {
        SearchService_1.searchService.clearCache();
        queryClient.invalidateQueries({ queryKey: search_1.searchKeys.all });
    }, [queryClient]);
    return {
        // Data
        searchResults: searchResults,
        suggestions: suggestions,
        locationSuggestions: locationSuggestions,
        popularSearches: popularSearches,
        facets: facets,
        // State
        filters: filters,
        options: options,
        isSearchActive: isSearchActive,
        validation: validation,
        hasResults: hasResults,
        isEmpty: isEmpty,
        activeFilterCount: activeFilterCount,
        // Loading states
        isLoading: isLoading,
        isFetching: isFetching,
        isLoadingSuggestions: isLoadingSuggestions,
        isLoadingLocations: isLoadingLocations,
        isLoadingFacets: isLoadingFacets,
        // Error
        error: error,
        // Actions
        updateFilter: updateFilter,
        updateFilters: updateFilters,
        clearFilters: clearFilters,
        updateOptions: updateOptions,
        search: search,
        resetSearch: resetSearch,
        loadMore: loadMore,
        refetch: refetch,
        clearCache: clearCache,
    };
}
