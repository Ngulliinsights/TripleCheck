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
exports.propertyQueryConfigs = exports.similarPropertiesConfig = exports.propertyFavoritesConfig = exports.propertySearchConfig = exports.ownerPropertiesConfig = exports.propertyDetailConfig = exports.propertyListConfig = void 0;
exports.getPropertyQueryConfig = getPropertyQueryConfig;
exports.createPropertyQuery = createPropertyQuery;
// Configuration for property listings with search
exports.propertyListConfig = {
    name: 'Property List',
    description: 'Standard configuration for property listings with search and filtering',
    endpoint: '/api/properties',
    method: 'GET',
    fallbackData: [],
    staleTime: 2 * 60 * 1000, // 2 minutes - frequent updates expected
    gcTime: 5 * 60 * 1000, // 5 minutes - reasonable cleanup time
    retry: 3,
    debounceMs: 500,
    deduplicate: true,
    context: 'properties',
    validator: function (data) {
        if (!Array.isArray(data)) {
            // Handle API response format that might wrap data
            if (data && typeof data === "object" && "data" in data) {
                var wrappedData = data.data;
                if (Array.isArray(wrappedData)) {
                    return wrappedData.filter(function (item) {
                        if (!item || typeof item !== "object")
                            return false;
                        var obj = item;
                        return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                            obj.id != null &&
                            typeof obj.title === "string" &&
                            obj.title.length > 0 &&
                            typeof obj.description === "string" &&
                            obj.description.length > 0);
                    });
                }
            }
            return [];
        }
        return data.filter(function (item) {
            if (!item || typeof item !== "object")
                return false;
            var obj = item;
            return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                obj.id != null &&
                typeof obj.title === "string" &&
                obj.title.length > 0 &&
                typeof obj.description === "string" &&
                obj.description.length > 0);
        });
    },
};
// Configuration for single property details
exports.propertyDetailConfig = {
    name: 'Property Detail',
    description: 'Configuration for fetching detailed property information',
    fallbackData: null,
    staleTime: 10 * 60 * 1000, // 10 minutes - more stable data
    gcTime: 30 * 60 * 1000, // 30 minutes - longer retention for detail views
    retry: 2,
    deduplicate: true,
    context: 'property',
    validator: function (data) {
        if (!data || typeof data !== "object")
            return null;
        var property = data;
        return __assign(__assign({}, property), { id: property.id || "", title: property.title || "Untitled Property", description: property.description || "No description available", price: typeof property.price === "number" ? property.price : 0, location: property.location || "", images: Array.isArray(property.images) ? property.images : [] });
    },
};
// Configuration for owner properties
exports.ownerPropertiesConfig = {
    name: 'Owner Properties',
    description: 'Configuration for fetching properties owned by a specific user',
    fallbackData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes - owner data changes frequently
    gcTime: 15 * 60 * 1000, // 15 minutes - moderate retention
    retry: 3,
    deduplicate: true,
    context: 'owner-properties',
    validator: function (data) {
        if (!Array.isArray(data)) {
            // Handle API response format that might wrap data
            if (data && typeof data === "object" && "data" in data) {
                var wrappedData = data.data;
                if (Array.isArray(wrappedData)) {
                    return wrappedData.filter(function (item) {
                        if (!item || typeof item !== "object")
                            return false;
                        var obj = item;
                        return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                            obj.id != null &&
                            typeof obj.title === "string" &&
                            obj.title.length > 0);
                    });
                }
            }
            return [];
        }
        return data.filter(function (item) {
            if (!item || typeof item !== "object")
                return false;
            var obj = item;
            return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                obj.id != null &&
                typeof obj.title === "string" &&
                obj.title.length > 0);
        });
    },
};
// Configuration for property search with enhanced filtering
exports.propertySearchConfig = {
    name: 'Property Search',
    description: 'Configuration for advanced property search with pagination',
    endpoint: '/api/properties/search',
    method: 'GET',
    fallbackData: { data: [], total: 0, hasNext: false, hasPrev: false },
    staleTime: 30000, // 30 seconds - search results can change frequently
    gcTime: 2 * 60 * 1000, // 2 minutes - shorter cache for search results
    retry: 3,
    debounceMs: 500,
    deduplicate: true,
    context: 'property-search',
    validator: function (data) {
        if (!data || typeof data !== "object") {
            return { data: [], total: 0, hasNext: false, hasPrev: false };
        }
        var response = data;
        var actualData = (response.success ? response.data || response : response);
        return {
            data: Array.isArray(actualData.data) ? actualData.data.filter(function (item) {
                if (!item || typeof item !== "object")
                    return false;
                var obj = item;
                return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                    obj.id != null &&
                    typeof obj.title === "string" &&
                    obj.title.length > 0);
            }) : [],
            total: typeof actualData.total === "number" ? actualData.total : 0,
            hasNext: Boolean(actualData.hasNext),
            hasPrev: Boolean(actualData.hasPrev),
        };
    },
};
// Configuration for property favorites
exports.propertyFavoritesConfig = {
    name: 'Property Favorites',
    description: 'Configuration for fetching user favorite properties',
    endpoint: '/api/properties/favorites',
    method: 'GET',
    fallbackData: [],
    staleTime: 1 * 60 * 1000, // 1 minute - favorites can change quickly
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    deduplicate: true,
    context: 'property-favorites',
    validator: function (data) {
        if (!Array.isArray(data)) {
            if (data && typeof data === "object" && "data" in data) {
                var wrappedData = data.data;
                if (Array.isArray(wrappedData)) {
                    return wrappedData.filter(function (item) {
                        if (!item || typeof item !== "object")
                            return false;
                        var obj = item;
                        return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                            obj.id != null &&
                            typeof obj.title === "string" &&
                            obj.title.length > 0);
                    });
                }
            }
            return [];
        }
        return data.filter(function (item) {
            if (!item || typeof item !== "object")
                return false;
            var obj = item;
            return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                obj.id != null &&
                typeof obj.title === "string" &&
                obj.title.length > 0);
        });
    },
};
// Configuration for similar properties
exports.similarPropertiesConfig = {
    name: 'Similar Properties',
    description: 'Configuration for fetching properties similar to a given property',
    fallbackData: [],
    staleTime: 15 * 60 * 1000, // 15 minutes - similar properties don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    deduplicate: true,
    context: 'similar-properties',
    validator: function (data) {
        if (!Array.isArray(data)) {
            if (data && typeof data === "object" && "data" in data) {
                var wrappedData = data.data;
                if (Array.isArray(wrappedData)) {
                    return wrappedData.filter(function (item) {
                        if (!item || typeof item !== "object")
                            return false;
                        var obj = item;
                        return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                            obj.id != null &&
                            typeof obj.title === "string" &&
                            obj.title.length > 0);
                    });
                }
            }
            return [];
        }
        return data.filter(function (item) {
            if (!item || typeof item !== "object")
                return false;
            var obj = item;
            return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                obj.id != null &&
                typeof obj.title === "string" &&
                obj.title.length > 0);
        });
    },
};
// Export all configurations as a registry
exports.propertyQueryConfigs = {
    propertyList: exports.propertyListConfig,
    propertyDetail: exports.propertyDetailConfig,
    ownerProperties: exports.ownerPropertiesConfig,
    propertySearch: exports.propertySearchConfig,
    propertyFavorites: exports.propertyFavoritesConfig,
    similarProperties: exports.similarPropertiesConfig,
};
// Helper function to get configuration by key
function getPropertyQueryConfig(key) {
    return exports.propertyQueryConfigs[key];
}
// Helper function to create a configured useSafeQuery call
function createPropertyQuery(configKey, overrides) {
    var config = getPropertyQueryConfig(configKey);
    return __assign(__assign({}, config), overrides);
}
