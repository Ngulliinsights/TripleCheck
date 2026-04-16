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
exports.hookPresets = exports.compositePresets = exports.performancePresets = exports.uiInteractionPresets = exports.formValidationPresets = exports.propertyHookPresets = void 0;
exports.getPropertyPreset = getPropertyPreset;
exports.getFormPreset = getFormPreset;
exports.getUIPreset = getUIPreset;
exports.getPerformancePreset = getPerformancePreset;
exports.getCompositePreset = getCompositePreset;
var formValidationConfigs_1 = require("../configs/formValidationConfigs");
var hookConfigs_1 = require("../configs/hookConfigs");
// Property-related presets
exports.propertyHookPresets = {
    // Property listing with search and filters
    propertyListing: (0, hookConfigs_1.createDataFetchingConfig)('paginatedList', {
        name: 'Property Listing',
        description: 'Optimized configuration for property listings with search and filtering',
        endpoint: '/api/properties',
        context: 'property-listing',
        staleTime: 2 * 60 * 1000, // 2 minutes - properties change frequently
        debounceMs: 500, // Good balance for search responsiveness
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
    }),
    // Single property details
    propertyDetails: (0, hookConfigs_1.createDataFetchingConfig)('singleItem', {
        name: 'Property Details',
        description: 'Configuration for fetching detailed property information',
        endpoint: '/api/properties', // Will be extended with ID
        context: 'property-details',
        staleTime: 10 * 60 * 1000, // 10 minutes - details don't change often
        validator: function (data) {
            if (!data || typeof data !== "object")
                return null;
            var property = data;
            return __assign(__assign({}, property), { id: property.id || "", title: property.title || "Untitled Property", description: property.description || "No description available", price: typeof property.price === "number" ? property.price : 0, location: property.location || "", images: Array.isArray(property.images) ? property.images : [] });
        },
    }),
    // Property search with advanced filtering
    propertySearch: (0, hookConfigs_1.createDataFetchingConfig)('searchData', {
        name: 'Property Search',
        description: 'Advanced property search with filtering and sorting',
        endpoint: '/api/properties/search',
        context: 'property-search',
        debounceMs: 800, // Longer debounce for search to reduce API calls
        staleTime: 30 * 1000, // 30 seconds - search results can change quickly
    }),
    // Property favorites
    propertyFavorites: (0, hookConfigs_1.createDataFetchingConfig)('paginatedList', {
        name: 'Property Favorites',
        description: 'User favorite properties with real-time updates',
        endpoint: '/api/properties/favorites',
        context: 'property-favorites',
        staleTime: 1 * 60 * 1000, // 1 minute - favorites can change quickly
        refetchOnWindowFocus: true, // Refetch when user returns to tab
    }),
    // Similar properties
    similarProperties: (0, hookConfigs_1.createDataFetchingConfig)('paginatedList', {
        name: 'Similar Properties',
        description: 'Properties similar to the current one',
        endpoint: '/api/properties/similar', // Will be extended with property ID
        context: 'similar-properties',
        staleTime: 15 * 60 * 1000, // 15 minutes - similarity doesn't change often
        retry: 2, // Fewer retries for non-critical data
    }),
};
// Constants
var FORM_VALIDATION_CATEGORY = 'form-validation';
// Form validation presets
exports.formValidationPresets = {
    // Property listing form
    propertyForm: {
        name: 'Property Form',
        description: 'Complete property listing form with validation',
        category: FORM_VALIDATION_CATEGORY,
        fields: (0, formValidationConfigs_1.createPropertyFormConfig)(),
        globalValidation: function (formData) {
            var _a;
            var typedData = formData;
            // Cross-field validation
            if (typedData.bedrooms > 0 && typedData.bathrooms === 0) {
                return 'Properties with bedrooms should have at least one bathroom';
            }
            if (typedData.price > 50000000 && !((_a = typedData.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('luxury'))) {
                return 'High-value properties should mention luxury features in description';
            }
            return true;
        },
    },
    // User registration form
    userRegistration: {
        name: 'User Registration',
        description: 'User registration form with comprehensive validation',
        category: FORM_VALIDATION_CATEGORY,
        fields: (0, formValidationConfigs_1.createUserRegistrationFormConfig)(),
        globalValidation: function (formData) {
            var _a, _b;
            var typedData = formData;
            // Ensure password and confirm password match (additional check)
            if (typedData.password !== typedData.confirmPassword) {
                return 'Password confirmation does not match';
            }
            // Check if email and phone are from the same region (example business rule)
            if (((_a = typedData.email) === null || _a === void 0 ? void 0 : _a.endsWith('.ke')) && !((_b = typedData.phone) === null || _b === void 0 ? void 0 : _b.startsWith('+254'))) {
                return 'Kenyan email addresses should use Kenyan phone numbers';
            }
            return true;
        },
    },
    // Contact form
    contactForm: {
        name: 'Contact Form',
        description: 'Simple contact form for inquiries',
        category: FORM_VALIDATION_CATEGORY,
        fields: (0, formValidationConfigs_1.createContactFormConfig)(),
    },
    // Profile update form
    profileUpdate: {
        name: 'Profile Update',
        description: 'User profile update form',
        category: FORM_VALIDATION_CATEGORY,
        fields: (0, formValidationConfigs_1.createProfileUpdateFormConfig)(),
    },
};
// UI interaction presets
exports.uiInteractionPresets = {
    // Property search interface
    propertySearchUI: (0, hookConfigs_1.createUIInteractionConfig)('searchInput', {
        name: 'Property Search UI',
        description: 'Optimized for property search interactions',
        debounceMs: 500, // Balance between responsiveness and API calls
        enableKeyboardShortcuts: true, // Enable Ctrl+K for search, etc.
    }),
    // Property map interface
    propertyMapUI: (0, hookConfigs_1.createUIInteractionConfig)('highFrequency', {
        name: 'Property Map UI',
        description: 'High-performance interactions for map interface',
        throttleMs: 100, // Smooth map interactions
        enableTouchGestures: true, // Important for mobile map usage
    }),
    // Property form interface
    propertyFormUI: (0, hookConfigs_1.createUIInteractionConfig)('searchInput', {
        name: 'Property Form UI',
        description: 'Standard form interaction patterns',
        debounceMs: 300, // Quick feedback for form validation
    }),
    // Mobile property browsing
    mobilePropertyUI: (0, hookConfigs_1.createUIInteractionConfig)('mobileInteraction', {
        name: 'Mobile Property UI',
        description: 'Mobile-optimized property browsing',
        enableTouchGestures: true,
        debounceMs: 200, // Faster response on mobile
    }),
};
// Performance monitoring presets
exports.performancePresets = {
    // Property listing performance
    propertyListingPerf: (0, hookConfigs_1.createPerformanceConfig)('production', {
        name: 'Property Listing Performance',
        description: 'Monitor property listing performance',
        trackRenderTime: true,
        trackNetworkRequests: true,
        sampleRate: 0.2, // 20% sampling for high-traffic pages
    }),
    // Property details performance
    propertyDetailsPerf: (0, hookConfigs_1.createPerformanceConfig)('production', {
        name: 'Property Details Performance',
        description: 'Monitor property details page performance',
        trackRenderTime: true,
        trackMemoryUsage: true, // Important for image-heavy pages
        trackNetworkRequests: true,
        sampleRate: 0.5, // Higher sampling for important pages
    }),
    // Search performance
    searchPerformance: (0, hookConfigs_1.createPerformanceConfig)('criticalPath', {
        name: 'Search Performance',
        description: 'Monitor search functionality performance',
        trackRenderTime: true,
        trackNetworkRequests: true,
        sampleRate: 0.8, // High sampling for critical search functionality
    }),
    // Development performance
    developmentPerf: (0, hookConfigs_1.createPerformanceConfig)('development', {
        name: 'Development Performance',
        description: 'Comprehensive performance monitoring for development',
        trackRenderTime: true,
        trackMemoryUsage: true,
        trackNetworkRequests: true,
        sampleRate: 1.0, // Track everything in development
    }),
};
// Composite presets that combine multiple configurations
exports.compositePresets = {
    // Complete property listing page
    propertyListingPage: {
        dataFetching: exports.propertyHookPresets.propertyListing,
        uiInteraction: exports.uiInteractionPresets.propertySearchUI,
        performance: exports.performancePresets.propertyListingPerf,
    },
    // Complete property details page
    propertyDetailsPage: {
        dataFetching: exports.propertyHookPresets.propertyDetails,
        similarProperties: exports.propertyHookPresets.similarProperties,
        uiInteraction: exports.uiInteractionPresets.propertySearchUI,
        performance: exports.performancePresets.propertyDetailsPerf,
    },
    // Complete property form page
    propertyFormPage: {
        formValidation: exports.formValidationPresets.propertyForm,
        uiInteraction: exports.uiInteractionPresets.propertyFormUI,
        performance: exports.performancePresets.developmentPerf,
    },
    // Complete user registration page
    userRegistrationPage: {
        formValidation: exports.formValidationPresets.userRegistration,
        uiInteraction: exports.uiInteractionPresets.propertyFormUI,
        performance: exports.performancePresets.developmentPerf,
    },
};
// Export all presets
exports.hookPresets = {
    property: exports.propertyHookPresets,
    forms: exports.formValidationPresets,
    ui: exports.uiInteractionPresets,
    performance: exports.performancePresets,
    composite: exports.compositePresets,
};
// Helper functions to get presets with safe property access
function getPropertyPreset(key) {
    var presets = exports.propertyHookPresets;
    return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}
function getFormPreset(key) {
    var presets = exports.formValidationPresets;
    return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}
function getUIPreset(key) {
    var presets = exports.uiInteractionPresets;
    return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}
function getPerformancePreset(key) {
    var presets = exports.performancePresets;
    return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}
function getCompositePreset(key) {
    var presets = exports.compositePresets;
    return Object.prototype.hasOwnProperty.call(presets, key) ? presets[String(key)] : null;
}
