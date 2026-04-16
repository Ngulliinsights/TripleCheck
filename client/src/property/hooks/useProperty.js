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
exports.propertyKeys = void 0;
exports.useProperties = useProperties;
exports.useProperty = useProperty;
exports.useOwnerProperties = useOwnerProperties;
exports.useCreateProperty = useCreateProperty;
exports.useUpdateProperty = useUpdateProperty;
exports.useDeleteProperty = useDeleteProperty;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var queryClient_1 = require("../../infrastructure/api/queryClient");
var useDebounce_1 = require("../../local/hooks/useDebounce");
var useOptimisticMutation_1 = require("../../local/hooks/useOptimisticMutation");
var useSafeQuery_1 = require("../../local/hooks/useSafeQuery");
var property_api_1 = require("../services/property-api");
// Constants to avoid string duplication - addressing sonarjs/no-duplicate-string
var CACHE_KEYS = {
    OWNER_PROPERTIES: "owner-properties",
    PROPERTIES: "properties",
    PROPERTY_DETAIL: "property",
};
var ENDPOINTS = {
    PROPERTIES: "/api/properties",
    PROPERTY_DETAIL: function (id) { return "/api/properties/".concat(id); },
    OWNER_PROPERTIES: function (ownerId) { return "/api/properties/owner/".concat(ownerId); },
};
// Enhanced cache configuration with properly typed retry functions
var CACHE_CONFIG = {
    PROPERTIES_LIST: {
        staleTime: 5 * 60 * 1000, // 5 minutes - frequent updates expected
        gcTime: 10 * 60 * 1000, // 10 minutes - reasonable cleanup time
        retry: 3, // Enhanced error recovery
        retryDelay: function (attemptIndex) {
            return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
        },
    },
    PROPERTY_DETAIL: {
        staleTime: 10 * 60 * 1000, // 10 minutes - more stable data
        gcTime: 30 * 60 * 1000, // 30 minutes - longer retention for detail views
        retry: 2,
        retryDelay: function (attemptIndex) {
            return Math.min(1000 * Math.pow(2, attemptIndex), 10000);
        },
    },
    OWNER_PROPERTIES: {
        staleTime: 5 * 60 * 1000, // 5 minutes - owner data changes frequently
        gcTime: 15 * 60 * 1000, // 15 minutes - moderate retention
        retry: 3,
        retryDelay: function (attemptIndex) {
            return Math.min(1000 * Math.pow(2, attemptIndex), 20000);
        },
    },
};
// Standardized query keys using infrastructure configuration
exports.propertyKeys = queryClient_1.queryKeys.properties;
// Enhanced utility functions for better data validation and transformation
function validateLocationData(location) {
    if (typeof location === "string") {
        // Transform string location to object structure for backward compatibility
        return {
            address: location,
            city: "",
            state: "",
            country: "",
            // Explicitly set coordinates as undefined to satisfy exactOptionalPropertyTypes
            coordinates: undefined,
        };
    }
    if (!location || typeof location !== "object") {
        return {
            address: "",
            city: "",
            state: "",
            country: "",
            coordinates: undefined,
        };
    }
    var loc = location;
    var hasValidCoordinates = loc.coordinates &&
        typeof loc.coordinates === "object" &&
        loc.coordinates != null;
    return {
        address: String(loc.address || ""),
        city: String(loc.city || ""),
        state: String(loc.state || ""),
        country: String(loc.country || ""),
        // Properly handle coordinates to satisfy exactOptionalPropertyTypes
        coordinates: hasValidCoordinates ?
            {
                lat: Number(loc.coordinates.lat) || 0,
                lng: Number(loc.coordinates.lng) || 0,
            }
            : undefined,
    };
}
function createDebugLogger(context) {
    return function (message, data) {
        // Using a more sophisticated logging approach that can be easily toggled
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.debug("[".concat(context, "] ").concat(message), data);
        }
    };
}
// Helper function to extract and validate property data from API response
function extractPropertyFromResponse(data, _id) {
    if (!data || typeof data !== "object") {
        return null;
    }
    var response = data;
    var property = response.data || response;
    if (!property || typeof property !== "object") {
        return null;
    }
    return property;
}
// Helper function to extract core property fields
function extractCorePropertyFields(propertyObj, id, locationData) {
    return {
        id: String(propertyObj.id || id),
        title: String(propertyObj.title || "Untitled Property"),
        price: typeof propertyObj.price === "number" ? propertyObj.price : 0,
        images: Array.isArray(propertyObj.images) ? propertyObj.images : [],
        location: locationData,
        features: propertyObj.features && typeof propertyObj.features === "object" ?
            propertyObj.features
            : {},
    };
}
// Helper function to extract optional property fields
function extractOptionalPropertyFields(propertyObj) {
    return {
        description: propertyObj.description ? String(propertyObj.description) : undefined,
        amenities: Array.isArray(propertyObj.amenities) ? propertyObj.amenities : undefined,
        lastUpdated: propertyObj.lastUpdated ? String(propertyObj.lastUpdated) : undefined,
        viewCount: typeof propertyObj.viewCount === "number" ?
            propertyObj.viewCount
            : undefined,
        bedrooms: typeof propertyObj.bedrooms === "number" ?
            propertyObj.bedrooms
            : undefined,
        bathrooms: typeof propertyObj.bathrooms === "number" ?
            propertyObj.bathrooms
            : undefined,
        size: typeof propertyObj.size === "number" ? propertyObj.size : undefined,
        type: propertyObj.type ? String(propertyObj.type) : undefined,
        status: propertyObj.status ? String(propertyObj.status) : undefined,
        ownerId: propertyObj.ownerId ? String(propertyObj.ownerId) : undefined,
        createdAt: propertyObj.createdAt ? String(propertyObj.createdAt) : undefined,
        updatedAt: propertyObj.updatedAt ? String(propertyObj.updatedAt) : undefined,
    };
}
// Helper function to create validated property response
function createValidatedPropertyResponse(propertyObj, id, locationData) {
    var coreFields = extractCorePropertyFields(propertyObj, id, locationData);
    var optionalFields = extractOptionalPropertyFields(propertyObj);
    return __assign(__assign({}, coreFields), optionalFields);
}
/**
 * Enhanced hook for fetching properties with advanced search and pagination capabilities
 * Features: debouncing, intelligent caching, error recovery, and optimistic loading states
 *
 * @deprecated This hook is deprecated in favor of useUnifiedProperty from useUnifiedProperty.ts
 * Please migrate to useUnifiedProperty().useProperties for better error handling, caching, and performance.
 * Migration guide: Replace useProperties(params) with useUnifiedProperty().useProperties(params)
 */
function useProperties(params) {
    if (params === void 0) { params = {}; }
    var logger = createDebugLogger("useProperties");
    // Add deprecation warning in development
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn("[DEPRECATED] useProperties is deprecated. Please migrate to useUnifiedProperty().useProperties from useUnifiedProperty.ts for better error handling and performance.");
    }
    // Enhanced debouncing with variable delay based on search complexity
    var searchComplexity = Object.keys(params).length;
    var debounceDelay = Math.min(300 + searchComplexity * 50, 800);
    var debouncedParams = (0, useDebounce_1.useDebounce)(params, debounceDelay);
    logger("Fetching properties with params", debouncedParams);
    return (0, useSafeQuery_1.useSafeQuery)(__assign(__assign({ endpoint: ENDPOINTS.PROPERTIES, method: "GET", body: debouncedParams, fallbackData: {
            data: [],
            total: 0,
            page: 1,
            limit: 10,
            hasNext: false,
            hasPrev: false,
        }, validator: function (data) {
            if (!data || typeof data !== "object") {
                logger("Invalid response data structure");
                return null;
            }
            var response = data;
            // Handle the API response format which includes a 'success' field
            var actualData = (response.success ? response.data || response : response);
            var validatedResponse = {
                data: Array.isArray(actualData.data) ? actualData.data : [],
                total: typeof actualData.total === "number" ? actualData.total : 0,
                page: typeof actualData.page === "number" ? actualData.page : 1,
                limit: typeof actualData.limit === "number" ? actualData.limit : 10,
                hasNext: Boolean(actualData.hasNext),
                hasPrev: Boolean(actualData.hasPrev),
            };
            logger("Properties data validated successfully", {
                count: validatedResponse.data.length,
                total: validatedResponse.total,
                success: response.success,
            });
            return validatedResponse;
        }, debounceMs: debounceDelay, deduplicate: true, context: "properties-list", cacheKey: (0, react_1.useMemo)(function () { return "".concat(CACHE_KEYS.PROPERTIES, "-").concat(JSON.stringify(debouncedParams)); }, [debouncedParams]) }, CACHE_CONFIG.PROPERTIES_LIST), { refetchOnWindowFocus: false, refetchOnMount: false, enabled: true }));
}
/**
 * Enhanced hook for fetching detailed property information
 * Features: comprehensive validation, location data transformation, and enhanced caching
 *
 * @deprecated This hook is deprecated in favor of useUnifiedProperty from useUnifiedProperty.ts
 * Please migrate to useUnifiedProperty().usePropertyDetail for better error handling, caching, and performance.
 * Migration guide: Replace useProperty(id) with useUnifiedProperty().usePropertyDetail(id)
 */
function useProperty(id) {
    var logger = createDebugLogger("useProperty");
    // Add deprecation warning in development
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn("[DEPRECATED] useProperty is deprecated. Please migrate to useUnifiedProperty().usePropertyDetail from useUnifiedProperty.ts for better error handling and performance.");
    }
    return (0, useSafeQuery_1.useSafeQuery)(__assign(__assign({ endpoint: ENDPOINTS.PROPERTY_DETAIL(id), method: "GET", fallbackData: null, validator: function (data) {
            var propertyObj = extractPropertyFromResponse(data, id);
            if (!propertyObj) {
                logger("Invalid property data received", { id: id });
                return null;
            }
            var locationData = validateLocationData(propertyObj.location);
            var validatedProperty = createValidatedPropertyResponse(propertyObj, id, locationData);
            logger("Property data validated successfully", {
                id: id,
                title: validatedProperty.title,
            });
            return validatedProperty;
        }, enabled: Boolean(id) && id.length > 0, context: "property-detail", cacheKey: "".concat(CACHE_KEYS.PROPERTY_DETAIL, "-").concat(id) }, CACHE_CONFIG.PROPERTY_DETAIL), { refetchOnWindowFocus: false, refetchOnMount: false }));
}
/**
 * Enhanced hook for fetching owner properties with improved pagination and filtering
 * Features: owner-specific caching strategies and enhanced error handling
 *
 * @deprecated This hook is deprecated in favor of useSafeQuery with custom configuration
 * Please migrate to useSafeQuery with owner-specific endpoint configuration.
 * Migration guide: Use useSafeQuery({ endpoint: `/api/properties/owner/${ownerId}`, ... })
 */
function useOwnerProperties(ownerId, includeTotal) {
    if (includeTotal === void 0) { includeTotal = false; }
    var logger = createDebugLogger("useOwnerProperties");
    // Add deprecation warning in development
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn("[DEPRECATED] useOwnerProperties is deprecated. Please migrate to useSafeQuery with custom configuration for better error handling and performance.");
    }
    return (0, useSafeQuery_1.useSafeQuery)(__assign(__assign({ endpoint: ENDPOINTS.OWNER_PROPERTIES(ownerId), method: "GET", body: includeTotal ? { includeTotal: true } : undefined, fallbackData: { data: [] }, validator: function (data) {
            if (!data || typeof data !== "object") {
                logger("Invalid owner properties data", { ownerId: ownerId });
                return null;
            }
            var response = data;
            // Properly handle the total field to satisfy exactOptionalPropertyTypes
            var total = typeof response.total === "number" ? response.total : undefined;
            var validatedResponse = __assign({ data: Array.isArray(response.data) ? response.data : [] }, (total !== undefined && { total: total }));
            logger("Owner properties validated", {
                ownerId: ownerId,
                count: validatedResponse.data.length,
                total: validatedResponse.total,
            });
            return validatedResponse;
        }, enabled: Boolean(ownerId) && ownerId.length > 0, context: CACHE_KEYS.OWNER_PROPERTIES, cacheKey: "".concat(CACHE_KEYS.OWNER_PROPERTIES, "-").concat(ownerId, "-").concat(includeTotal) }, CACHE_CONFIG.OWNER_PROPERTIES), { refetchOnWindowFocus: false, refetchOnMount: false }));
}
/**
 * Enhanced mutation hook for creating properties with comprehensive optimistic updates
 * Features: enhanced error handling, rollback capabilities, and intelligent cache updates
 */
function useCreateProperty() {
    var queryClient = (0, react_query_1.useQueryClient)();
    var logger = createDebugLogger("useCreateProperty");
    return (0, useOptimisticMutation_1.useOptimisticMutation)({
        mutationFn: function (propertyData) { return property_api_1.propertyApi.createProperty(propertyData); },
        queryKey: [CACHE_KEYS.PROPERTIES, "list"],
        optimisticUpdate: function (oldData, newProperty) {
            var currentData = oldData;
            if (!(currentData === null || currentData === void 0 ? void 0 : currentData.data)) {
                logger("No existing data for optimistic update");
                return currentData;
            }
            // Following sonarjs/prefer-immediate-return by returning directly
            return __assign(__assign({}, currentData), { data: __spreadArray([newProperty], currentData.data, true), total: currentData.total + 1, hasNext: currentData.hasNext ||
                    currentData.data.length >= currentData.limit - 1 });
        },
        onError: function (error, variables, context) {
            logger("Property creation failed", {
                error: error.message,
                propertyTitle: variables === null || variables === void 0 ? void 0 : variables.title,
            });
            // Enhanced error reporting without exposing sensitive information
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.error("Create property mutation failed:", {
                    error: error.message,
                    variables: variables,
                    context: context,
                });
            }
        },
        onSuccess: function (data, variables) {
            // Handle the data properly - extract property from API response
            var property = (data === null || data === void 0 ? void 0 : data.data) ||
                data;
            var propertyId = (property === null || property === void 0 ? void 0 : property.id) || "unknown";
            logger("Property created successfully", {
                propertyId: propertyId,
                title: variables === null || variables === void 0 ? void 0 : variables.title,
            });
        },
        onSettled: function () {
            // Strategic cache invalidation with improved granularity
            queryClient.invalidateQueries({
                queryKey: [CACHE_KEYS.PROPERTIES],
                exact: false,
            });
            // Invalidate owner properties if we know the owner
            var ownerQueries = queryClient.getQueryCache().findAll({
                predicate: function (query) {
                    return Array.isArray(query.queryKey) &&
                        query.queryKey[0] === CACHE_KEYS.OWNER_PROPERTIES;
                },
            });
            ownerQueries.forEach(function (query) {
                queryClient.invalidateQueries({ queryKey: query.queryKey });
            });
            logger("Cache invalidation completed after property creation");
        },
    });
}
/**
 * Enhanced mutation hook for updating properties with granular optimistic updates
 * Features: field-level updates, enhanced rollback, and smart cache synchronization
 */
function useUpdateProperty() {
    var queryClient = (0, react_query_1.useQueryClient)();
    var logger = createDebugLogger("useUpdateProperty");
    return (0, useOptimisticMutation_1.useOptimisticMutation)({
        mutationFn: function (_a) {
            var id = _a.id, updates = _a.updates, userId = _a.userId;
            return property_api_1.propertyApi.updateProperty(id, updates, userId);
        },
        queryKey: [CACHE_KEYS.PROPERTIES, "list"],
        optimisticUpdate: function (oldData, variables) {
            var currentData = oldData;
            if (!(currentData === null || currentData === void 0 ? void 0 : currentData.data))
                return currentData;
            // Following sonarjs/prefer-immediate-return by returning directly
            return __assign(__assign({}, currentData), { data: currentData.data.map(function (property) {
                    if (property.id === variables.id) {
                        var updatedProperty = __assign(__assign({}, property), variables.updates);
                        logger("Applied optimistic update", {
                            propertyId: variables.id,
                            updatedFields: Object.keys(variables.updates),
                        });
                        return updatedProperty;
                    }
                    return property;
                }) });
        },
        onError: function (error, variables, context) {
            logger("Property update failed", {
                error: error.message,
                propertyId: variables === null || variables === void 0 ? void 0 : variables.id,
                updatedFields: (variables === null || variables === void 0 ? void 0 : variables.updates) ? Object.keys(variables.updates) : [],
            });
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.error("Update property mutation failed:", {
                    error: error.message,
                    propertyId: variables === null || variables === void 0 ? void 0 : variables.id,
                    updates: variables === null || variables === void 0 ? void 0 : variables.updates,
                    context: context,
                });
            }
        },
        onSuccess: function (_data, variables) {
            logger("Property updated successfully", {
                propertyId: variables.id,
                updatedFields: Object.keys(variables.updates),
            });
        },
        onSettled: function (data, _error, variables) {
            // Enhanced cache synchronization
            if (data) {
                // Update the specific property detail cache
                queryClient.setQueryData([CACHE_KEYS.PROPERTY_DETAIL, variables.id], data);
                logger("Updated property detail cache", { propertyId: variables.id });
            }
            // Strategic invalidation of related queries
            queryClient.invalidateQueries({
                queryKey: [CACHE_KEYS.PROPERTIES],
                exact: false,
            });
            // Invalidate owner properties cache for the property owner
            queryClient.invalidateQueries({
                queryKey: [CACHE_KEYS.OWNER_PROPERTIES],
                exact: false,
            });
        },
    });
}
/**
 * Enhanced mutation hook for deleting properties with comprehensive cleanup
 * Features: optimistic removal, cascade cleanup, and enhanced error recovery
 */
function useDeleteProperty() {
    var queryClient = (0, react_query_1.useQueryClient)();
    var logger = createDebugLogger("useDeleteProperty");
    return (0, useOptimisticMutation_1.useOptimisticMutation)({
        mutationFn: function (_a) {
            var id = _a.id, userId = _a.userId;
            return property_api_1.propertyApi.deleteProperty(id, userId);
        },
        queryKey: [CACHE_KEYS.PROPERTIES, "list"],
        optimisticUpdate: function (oldData, variables) {
            var currentData = oldData;
            if (!(currentData === null || currentData === void 0 ? void 0 : currentData.data))
                return currentData;
            // Following sonarjs/prefer-immediate-return by returning directly
            return __assign(__assign({}, currentData), { data: currentData.data.filter(function (property) { return property.id !== variables.id; }), total: Math.max(0, currentData.total - 1) });
        },
        onError: function (error, variables, context) {
            logger("Property deletion failed", {
                error: error.message,
                propertyId: variables === null || variables === void 0 ? void 0 : variables.id,
            });
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.error("Delete property mutation failed:", {
                    error: error.message,
                    propertyId: variables === null || variables === void 0 ? void 0 : variables.id,
                    context: context,
                });
            }
        },
        onSuccess: function (_data, variables) {
            logger("Property deleted successfully", { propertyId: variables.id });
        },
        onSettled: function (_data, _error, variables) {
            // Comprehensive cache cleanup
            queryClient.removeQueries({
                queryKey: [CACHE_KEYS.PROPERTY_DETAIL, variables.id],
            });
            // Remove from all related query caches
            queryClient.invalidateQueries({
                queryKey: [CACHE_KEYS.PROPERTIES],
                exact: false,
            });
            queryClient.invalidateQueries({
                queryKey: [CACHE_KEYS.OWNER_PROPERTIES],
                exact: false,
            });
            logger("Completed cache cleanup after property deletion", {
                propertyId: variables.id,
            });
        },
    });
}
