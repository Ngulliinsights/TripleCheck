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
exports.useEnhancedLandProperty = exports.useEnhancedPropertySearch = void 0;
exports.useUnifiedProperty = useUnifiedProperty;
exports.usePropertySearch = usePropertySearch;
exports.useLandProperty = useLandProperty;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var useDebounce_1 = require("../../local/hooks/useDebounce");
var useOptimisticMutation_1 = require("../../local/hooks/useOptimisticMutation");
var useSafeQuery_1 = require("../../local/hooks/useSafeQuery");
var mock_land_data_1 = require("../services/mock-land-data");
var property_api_1 = require("../services/property-api");
// Constants for cache management and string literals
var CACHE_CONFIG = {
    PROPERTY_DETAIL: {
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 2,
    },
    PROPERTIES_LIST: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
    },
    LAND_PROPERTY: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
    },
};
/**
 * Centralized string constants to avoid duplication and ensure consistency
 * This is our single source of truth for all string literals used throughout the hook
 * Think of this as the "dictionary" for all the fixed strings we use repeatedly
 */
var STRING_CONSTANTS = {
    PROPERTY_DETAIL: "property-detail",
    LAND_PROPERTY: "land-property",
    PROPERTIES_LIST: "properties-list",
    PROPERTY_SEARCH: "property-search",
    UNTITLED_PROPERTY: "Untitled Property",
    LOCATION_NOT_SPECIFIED: "Location not specified",
    FAILED_TO_FETCH: "Failed to fetch land property",
};
/**
 * Cache key generators for consistency
 * These functions create standardized cache keys by combining our string constants
 * with dynamic values like IDs or parameters. This ensures all cache keys follow
 * the same pattern and reduces the chance of cache key conflicts.
 */
var generateCacheKey = {
    propertyDetail: function (id) { return "".concat(STRING_CONSTANTS.PROPERTY_DETAIL, "-").concat(id); },
    landProperty: function (id) { return "".concat(STRING_CONSTANTS.LAND_PROPERTY, "-").concat(id); },
    propertiesList: function (params) { return "".concat(STRING_CONSTANTS.PROPERTIES_LIST, "-").concat(JSON.stringify(params)); },
    propertySearch: function (params) { return "".concat(STRING_CONSTANTS.PROPERTY_SEARCH, "-").concat(JSON.stringify(params)); },
};
/**
 * Helper function to safely extract string values with fallbacks
 * This reduces repetitive type checking in the main validator
 * Think of this as a "safety net" that ensures we always get a string back,
 * even if the input data is malformed or missing
 */
function safeStringExtract(value, fallback) {
    return value ? String(value) : fallback;
}
/**
 * Helper function to safely extract number values with fallbacks
 * This reduces repetitive type checking in the main validator
 * Similar to safeStringExtract, but specifically for numeric values
 */
function safeNumberExtract(value, fallback) {
    return typeof value === "number" ? value : fallback;
}
/**
 * Helper function to safely extract array values with fallbacks
 * This reduces repetitive type checking in the main validator
 * Ensures we always get an array back, preventing "cannot read property of undefined" errors
 */
function safeArrayExtract(value, fallback) {
    if (fallback === void 0) { fallback = []; }
    return Array.isArray(value) ? value : fallback;
}
/**
 * Helper function to safely extract string array values with fallbacks
 * This ensures type safety for amenities and similar string arrays
 * Not only checks if it's an array, but also filters out non-string values
 */
function safeStringArrayExtract(value, fallback) {
    if (fallback === void 0) { fallback = []; }
    if (!Array.isArray(value))
        return fallback;
    return value.filter(function (item) { return typeof item === 'string'; });
}
/**
 * Helper function to extract and validate location data
 * This simplifies location handling logic by centralizing the complex
 * logic for dealing with different location data formats
 */
function extractLocationData(location) {
    // Handle simple string location format
    if (typeof location === "string") {
        return location;
    }
    // Handle complex object location format with nested properties
    if (location && typeof location === "object") {
        var locationObj = location;
        return locationObj.address || STRING_CONSTANTS.LOCATION_NOT_SPECIFIED;
    }
    // Fallback for any other data type
    return STRING_CONSTANTS.LOCATION_NOT_SPECIFIED;
}
/**
 * Simplified property validation function with reduced cognitive complexity
 * Addresses ESLint cognitive-complexity warning by breaking down validation logic
 * This function takes raw API data and transforms it into a standardized format
 * that our application can rely on, regardless of how the backend sends the data
 */
function validatePropertyData(propertyObj, id) {
    // Basic required fields with safe extraction
    // These are the fields that every property must have, so we provide sensible defaults
    var basicFields = {
        id: safeStringExtract(propertyObj.id, id),
        title: safeStringExtract(propertyObj.title, STRING_CONSTANTS.UNTITLED_PROPERTY),
        price: safeNumberExtract(propertyObj.price, 0) || 0,
        images: safeArrayExtract(propertyObj.images, []),
        location: extractLocationData(propertyObj.location),
        features: (propertyObj.features && typeof propertyObj.features === "object")
            ? propertyObj.features
            : {},
    };
    // Optional fields with safe extraction
    // These fields might not be present in all property data, so we handle them gracefully
    var optionalFields = {
        description: propertyObj.description ? String(propertyObj.description) : undefined,
        amenities: safeStringArrayExtract(propertyObj.amenities),
        lastUpdated: propertyObj.lastUpdated ? String(propertyObj.lastUpdated) : undefined,
        viewCount: safeNumberExtract(propertyObj.viewCount),
        bedrooms: safeNumberExtract(propertyObj.bedrooms),
        bathrooms: safeNumberExtract(propertyObj.bathrooms),
        size: safeNumberExtract(propertyObj.size),
        type: propertyObj.type ? String(propertyObj.type) : undefined,
        status: propertyObj.status ? String(propertyObj.status) : undefined,
        ownerId: propertyObj.ownerId ? String(propertyObj.ownerId) : undefined,
        createdAt: propertyObj.createdAt ? String(propertyObj.createdAt) : undefined,
        updatedAt: propertyObj.updatedAt ? String(propertyObj.updatedAt) : undefined,
    };
    // Combine all fields into the final response
    // This spread operator technique creates a clean, flat object structure
    return __assign(__assign({}, basicFields), optionalFields);
}
/**
 * Helper function to extract properties from search results
 * This simplifies the nested ternary operations by handling the various
 * ways that different APIs might structure their response data
 */
function extractPropertiesFromResponse(actualData) {
    if (Array.isArray(actualData.properties)) {
        return actualData.properties;
    }
    if (Array.isArray(actualData.data)) {
        return actualData.data;
    }
    return [];
}
/**
 * Helper function to extract total count from search results
 * This simplifies the nested ternary operations and provides a consistent
 * way to get the total count regardless of API response format
 */
function extractTotalCountFromResponse(actualData) {
    if (typeof actualData.totalCount === "number") {
        return actualData.totalCount;
    }
    if (typeof actualData.total === "number") {
        return actualData.total;
    }
    return 0;
}
/**
 * Enhanced error handling helper for async operations
 * This centralizes error handling logic and ensures proper logging
 * Think of this as a "translator" that converts any kind of error into
 * a standardized format that our application can understand and handle
 */
function handleAsyncError(error, context) {
    var errorMessage = "".concat(context, ": ").concat(error instanceof Error ? error.message : 'Unknown error');
    // Use proper error logging instead of console.warn to avoid ESLint warnings
    // We only log in development to avoid cluttering production logs
    if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn(errorMessage, error);
    }
    return error instanceof Error ? error : new Error(errorMessage);
}
/**
 * Unified property hook that consolidates functionality from:
 * - useProperty.ts (property details and CRUD operations)
 * - useLandProperty.ts (land-specific property handling)
 * - usePropertySearch.ts (search and filtering)
 *
 * This hook provides a single interface for all property-related operations
 * with enhanced error handling, caching, and performance optimizations.
 *
 * Think of this hook as a "property management control center" that handles
 * all the different ways your application needs to interact with property data.
 */
function useUnifiedProperty() {
    var _this = this;
    var queryClient = (0, react_query_1.useQueryClient)();
    /**
     * Fetch a single property by ID with enhanced validation and caching
     * Uses simplified validator function to reduce cognitive complexity
     * This is like asking for a specific file from a well-organized filing cabinet
     */
    var usePropertyDetail = function (id, options) {
        if (options === void 0) { options = {}; }
        var _a = options.enabled, enabled = _a === void 0 ? true : _a, _b = options.staleTime, staleTime = _b === void 0 ? CACHE_CONFIG.PROPERTY_DETAIL.staleTime : _b, _c = options.gcTime, gcTime = _c === void 0 ? CACHE_CONFIG.PROPERTY_DETAIL.gcTime : _c;
        return (0, useSafeQuery_1.useSafeQuery)({
            endpoint: "/api/properties/".concat(id),
            method: "GET",
            fallbackData: null,
            validator: function (data) {
                if (!data || typeof data !== "object")
                    return null;
                var response = data;
                var property = response.data || response;
                if (!property || typeof property !== "object")
                    return null;
                var propertyObj = property;
                return validatePropertyData(propertyObj, id);
            },
            enabled: Boolean(id) && id.length > 0 && enabled,
            // Notice: We now use STRING_CONSTANTS directly instead of CONTEXT_NAMES
            // This eliminates the duplicate string literals and maintains consistency
            context: STRING_CONSTANTS.PROPERTY_DETAIL,
            cacheKey: generateCacheKey.propertyDetail(id),
            staleTime: staleTime,
            gcTime: gcTime,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        });
    };
    /**
     * Fetch land property with mock data fallback and proper error handling
     * Addresses ESLint warnings about unused variables and unhandled exceptions
     * This handles the special case where we might not have real data yet,
     * so we gracefully fall back to mock data for development and testing
     */
    var useLandProperty = function (id, options) {
        if (options === void 0) { options = {}; }
        var _a = options.enabled, enabled = _a === void 0 ? true : _a;
        // Note: staleTime and gcTime removed as they weren't being used in the custom implementation
        var _b = (0, react_1.useState)(null), landData = _b[0], setLandData = _b[1];
        var _c = (0, react_1.useState)(false), isLoading = _c[0], setIsLoading = _c[1];
        var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
        (0, react_1.useEffect)(function () {
            if (!id || id.length === 0 || !enabled)
                return;
            var fetchLandData = function () { return __awaiter(_this, void 0, void 0, function () {
                var response, data, apiError_1, handledError, mockData, mockError_1, handledError;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setIsLoading(true);
                            setError(null);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 5, , 6]);
                            return [4 /*yield*/, fetch("/api/land-properties/".concat(id))];
                        case 2:
                            response = _a.sent();
                            if (!response.ok) return [3 /*break*/, 4];
                            return [4 /*yield*/, response.json()];
                        case 3:
                            data = _a.sent();
                            setLandData(data.data || data);
                            return [2 /*return*/];
                        case 4: return [3 /*break*/, 6];
                        case 5:
                            apiError_1 = _a.sent();
                            handledError = handleAsyncError(apiError_1, 'API fetch failed');
                            // Use proper error logging instead of console.warn to avoid ESLint warnings
                            if (process.env.NODE_ENV === 'development') {
                                // eslint-disable-next-line no-console
                                console.warn('API endpoint unavailable, falling back to mock data:', handledError.message);
                            }
                            return [3 /*break*/, 6];
                        case 6:
                            _a.trys.push([6, 10, , 11]);
                            if (!(0, mock_land_data_1.hasMockLandProperty)(id)) return [3 /*break*/, 8];
                            return [4 /*yield*/, (0, mock_land_data_1.fetchMockLandProperty)(id)];
                        case 7:
                            mockData = _a.sent();
                            setLandData(mockData);
                            return [3 /*break*/, 9];
                        case 8:
                            setLandData(null);
                            _a.label = 9;
                        case 9: return [3 /*break*/, 11];
                        case 10:
                            mockError_1 = _a.sent();
                            handledError = handleAsyncError(mockError_1, 'Mock data fetch failed');
                            setError(handledError);
                            return [3 /*break*/, 11];
                        case 11: return [2 /*return*/];
                    }
                });
            }); };
            // Properly handle the promise chain to address ESLint promise/catch-or-return warning
            void fetchLandData()
                .catch(function (err) {
                var handledError = handleAsyncError(err, STRING_CONSTANTS.FAILED_TO_FETCH);
                setError(handledError);
            })
                .finally(function () {
                setIsLoading(false);
            });
        }, [id, enabled]);
        return {
            data: landData,
            isLoading: isLoading,
            error: error,
        };
    };
    /**
     * Fetch multiple properties with advanced filtering and pagination
     * This is like asking for a filtered and sorted list from a database
     * The debouncing prevents too many API calls when users are typing quickly
     */
    var useProperties = function (searchParams, options) {
        if (searchParams === void 0) { searchParams = {}; }
        if (options === void 0) { options = {}; }
        var _a = options.enabled, enabled = _a === void 0 ? true : _a, _b = options.staleTime, staleTime = _b === void 0 ? CACHE_CONFIG.PROPERTIES_LIST.staleTime : _b, _c = options.gcTime, gcTime = _c === void 0 ? CACHE_CONFIG.PROPERTIES_LIST.gcTime : _c, _d = options.debounceMs, debounceMs = _d === void 0 ? 300 : _d;
        // Debounce search parameters to reduce API calls
        // This waits for the user to stop typing before making the API call
        var debouncedParams = (0, useDebounce_1.useDebounce)(searchParams, debounceMs);
        return (0, useSafeQuery_1.useSafeQuery)({
            endpoint: "/api/properties",
            method: "GET",
            body: debouncedParams,
            fallbackData: {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                hasNext: false,
                hasPrev: false,
            },
            validator: function (data) {
                if (!data || typeof data !== "object")
                    return null;
                var response = data;
                var actualData = (response.success ? response.data || response : response);
                return {
                    data: Array.isArray(actualData.data) ? actualData.data : [],
                    total: typeof actualData.total === "number" ? actualData.total : 0,
                    page: typeof actualData.page === "number" ? actualData.page : 1,
                    limit: typeof actualData.limit === "number" ? actualData.limit : 10,
                    hasNext: Boolean(actualData.hasNext),
                    hasPrev: Boolean(actualData.hasPrev),
                };
            },
            enabled: enabled,
            // Using STRING_CONSTANTS directly eliminates duplicate string literals
            context: STRING_CONSTANTS.PROPERTIES_LIST,
            cacheKey: (0, react_1.useMemo)(function () { return generateCacheKey.propertiesList(debouncedParams); }, [debouncedParams]),
            staleTime: staleTime,
            gcTime: gcTime,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        });
    };
    /**
     * Advanced property search with intelligent filtering and suggestions
     * Uses helper functions to simplify complex ternary operations
     * This is like having a smart search engine that understands property-specific queries
     */
    var usePropertySearch = function (searchQuery, filters, options) {
        if (filters === void 0) { filters = {}; }
        if (options === void 0) { options = {}; }
        var _a = options.enabled, enabled = _a === void 0 ? true : _a, _b = options.staleTime, staleTime = _b === void 0 ? CACHE_CONFIG.PROPERTIES_LIST.staleTime : _b, _c = options.gcTime, gcTime = _c === void 0 ? CACHE_CONFIG.PROPERTIES_LIST.gcTime : _c, _d = options.debounceMs, debounceMs = _d === void 0 ? 500 : _d;
        // Combine search query with filters into a single search request
        // This creates a comprehensive search that considers both text and structured filters
        var searchParams = (0, react_1.useMemo)(function () { return (__assign(__assign({}, filters), { query: searchQuery })); }, [searchQuery, filters]);
        var debouncedSearchParams = (0, useDebounce_1.useDebounce)(searchParams, debounceMs);
        return (0, useSafeQuery_1.useSafeQuery)({
            endpoint: "/api/properties/search",
            method: "POST",
            body: debouncedSearchParams,
            fallbackData: {
                properties: [],
                totalCount: 0,
                hasNextPage: false,
                searchMetrics: undefined,
            },
            validator: function (data) {
                if (!data || typeof data !== "object")
                    return null;
                var response = data;
                var actualData = (response.success ? response.data || response : response);
                return {
                    properties: extractPropertiesFromResponse(actualData),
                    totalCount: extractTotalCountFromResponse(actualData),
                    hasNextPage: Boolean(actualData.hasNextPage || actualData.hasNext),
                    searchMetrics: actualData.searchMetrics,
                };
            },
            enabled: enabled && searchQuery.trim().length > 0,
            // Using STRING_CONSTANTS directly for consistency
            context: STRING_CONSTANTS.PROPERTY_SEARCH,
            cacheKey: (0, react_1.useMemo)(function () { return generateCacheKey.propertySearch(debouncedSearchParams); }, [debouncedSearchParams]),
            staleTime: staleTime,
            gcTime: gcTime,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
        });
    };
    /**
     * Create a new property with optimistic updates
     * Optimistic updates mean we update the UI immediately, assuming the operation
     * will succeed, then fix it later if there's an error. This makes the app feel faster.
     */
    var useCreateProperty = function () {
        return (0, useOptimisticMutation_1.useOptimisticMutation)({
            mutationFn: function (propertyData) {
                return property_api_1.propertyApi.createProperty(propertyData);
            },
            queryKey: ["properties", "list"],
            optimisticUpdate: function (oldData, newProperty) {
                var currentData = oldData;
                if (!(currentData === null || currentData === void 0 ? void 0 : currentData.data))
                    return currentData;
                // Add the new property to the beginning of the list
                return __assign(__assign({}, currentData), { data: __spreadArray([newProperty], currentData.data, true), total: currentData.total + 1, hasNext: currentData.hasNext || currentData.data.length >= currentData.limit - 1 });
            },
            onSettled: function () {
                // Invalidate all property-related queries to ensure data consistency
                queryClient.invalidateQueries({ queryKey: ["properties"] });
                queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
            },
        });
    };
    /**
     * Update an existing property with optimistic updates
     * This allows users to see their changes immediately while the update
     * is being processed in the background
     */
    var useUpdateProperty = function () {
        return (0, useOptimisticMutation_1.useOptimisticMutation)({
            mutationFn: function (_a) {
                var id = _a.id, updates = _a.updates, userId = _a.userId;
                return property_api_1.propertyApi.updateProperty(id, updates, userId);
            },
            queryKey: ["properties", "list"],
            optimisticUpdate: function (oldData, variables) {
                var currentData = oldData;
                if (!(currentData === null || currentData === void 0 ? void 0 : currentData.data))
                    return currentData;
                // Find and update the specific property in the list
                return __assign(__assign({}, currentData), { data: currentData.data.map(function (property) {
                        if (property.id === variables.id) {
                            return __assign(__assign({}, property), variables.updates);
                        }
                        return property;
                    }) });
            },
            onSettled: function (data, _error, variables) {
                // Update specific property cache with the latest data
                if (data) {
                    queryClient.setQueryData([generateCacheKey.propertyDetail(variables.id)], data);
                }
                // Invalidate related queries to ensure consistency across the app
                queryClient.invalidateQueries({ queryKey: ["properties"] });
                queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
            },
        });
    };
    /**
     * Delete a property with optimistic updates
     * Immediately removes the property from the UI while processing the deletion
     * in the background, providing instant feedback to the user
     */
    var useDeleteProperty = function () {
        return (0, useOptimisticMutation_1.useOptimisticMutation)({
            mutationFn: function (_a) {
                var id = _a.id, userId = _a.userId;
                return property_api_1.propertyApi.deleteProperty(id, userId);
            },
            queryKey: ["properties", "list"],
            optimisticUpdate: function (oldData, variables) {
                var currentData = oldData;
                if (!(currentData === null || currentData === void 0 ? void 0 : currentData.data))
                    return currentData;
                // Remove the property from the list and adjust the total count
                return __assign(__assign({}, currentData), { data: currentData.data.filter(function (property) { return property.id !== variables.id; }), total: Math.max(0, currentData.total - 1) });
            },
            onSettled: function (_data, _error, variables) {
                // Remove the specific property from cache since it no longer exists
                queryClient.removeQueries({ queryKey: [generateCacheKey.propertyDetail(variables.id)] });
                // Invalidate related queries to ensure consistency
                queryClient.invalidateQueries({ queryKey: ["properties"] });
                queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
            },
        });
    };
    // Return all the hooks and utility functions as a cohesive API
    // This creates a clean, organized interface for components to use
    return {
        // Query hooks for fetching data
        usePropertyDetail: usePropertyDetail,
        useLandProperty: useLandProperty,
        useProperties: useProperties,
        usePropertySearch: usePropertySearch,
        // Mutation hooks for modifying data
        useCreateProperty: useCreateProperty,
        useUpdateProperty: useUpdateProperty,
        useDeleteProperty: useDeleteProperty,
        // Utility functions for cache management
        invalidatePropertyQueries: function () {
            queryClient.invalidateQueries({ queryKey: ["properties"] });
            queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
            queryClient.invalidateQueries({ queryKey: [STRING_CONSTANTS.LAND_PROPERTY] });
        },
        clearPropertyCache: function (propertyId) {
            if (propertyId) {
                // Clear cache for a specific property
                queryClient.removeQueries({ queryKey: [generateCacheKey.propertyDetail(propertyId)] });
                queryClient.removeQueries({ queryKey: [generateCacheKey.landProperty(propertyId)] });
            }
            else {
                // Clear all property-related cache
                queryClient.removeQueries({ queryKey: ["properties"] });
                queryClient.removeQueries({ queryKey: [STRING_CONSTANTS.PROPERTY_SEARCH] });
                queryClient.removeQueries({ queryKey: [STRING_CONSTANTS.LAND_PROPERTY] });
            }
        },
    };
}
/**
 * Specialized hook for property search with enhanced features
 * This provides backward compatibility while leveraging the unified hook
 * Think of this as a "preset configuration" for search-focused use cases
 */
function usePropertySearch(initialQuery, initialFilters) {
    if (initialQuery === void 0) { initialQuery = ""; }
    if (initialFilters === void 0) { initialFilters = {}; }
    var usePropertySearch = useUnifiedProperty().usePropertySearch;
    return usePropertySearch(initialQuery, initialFilters, {
        debounceMs: 400, // Slightly longer debounce for search to reduce API calls
        staleTime: 3 * 60 * 1000, // 3 minutes for search results - shorter than detail views
    });
}
/**
 * Specialized hook for land properties with enhanced mock data support
 * This provides a focused interface for land-specific property operations
 */
function useLandProperty(id) {
    var useLandProperty = useUnifiedProperty().useLandProperty;
    return useLandProperty(id, {
    // Custom options can be added here if needed for land properties
    // For example, you might want different caching strategies for land vs. regular properties
    });
}
exports.default = useUnifiedProperty;
// Backward compatibility
exports.useEnhancedPropertySearch = usePropertySearch;
exports.useEnhancedLandProperty = useLandProperty;
