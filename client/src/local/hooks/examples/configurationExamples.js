"use strict";
/**
 * Examples of how to use configuration-based hooks
 * These examples demonstrate the power and flexibility of the new configuration system
 */
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
exports.configurationExamples = exports.usePropertyInquiryForm = exports.useCustomPropertySearch = void 0;
exports.usePropertyListingWithPreset = usePropertyListingWithPreset;
exports.usePropertyDetailsPage = usePropertyDetailsPage;
exports.useAdaptivePropertySearch = useAdaptivePropertySearch;
exports.usePropertySearchABTest = usePropertySearchABTest;
exports.useEnvironmentAwarePropertyFetching = useEnvironmentAwarePropertyFetching;
exports.useExtendedPropertyForm = useExtendedPropertyForm;
var index_1 = require("../index");
// Example 1: Using preset configurations
function usePropertyListingWithPreset(searchParams) {
    var config = (0, index_1.getPropertyPreset)('propertyListing');
    return (0, index_1.useConfigurableHook)(config, searchParams);
}
// Example 2: Creating a custom data fetching hook with configuration
var customPropertySearchConfig = (0, index_1.createDataFetchingConfig)('searchData', {
    name: 'Custom Property Search',
    description: 'Customized property search with specific business rules',
    endpoint: '/api/properties/advanced-search',
    debounceMs: 1000, // Longer debounce for complex searches
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    validator: function (data) {
        if (!Array.isArray(data))
            return [];
        // Custom validation logic for advanced search results
        return data.filter(function (item) {
            if (!item || typeof item !== "object")
                return false;
            var obj = item;
            // Additional validation for advanced search
            return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                obj.id != null &&
                typeof obj.title === "string" &&
                obj.title.length > 0 &&
                typeof obj.price === "number" &&
                obj.price > 0 &&
                Array.isArray(obj.images) &&
                obj.images.length > 0 // Advanced search requires images
            );
        });
    },
});
exports.useCustomPropertySearch = (0, index_1.createDataFetchingHook)(customPropertySearchConfig);
// Example 3: Creating a specialized form validation hook
var propertyInquiryFormConfig = {
    name: 'Property Inquiry Form',
    description: 'Form for inquiring about a specific property',
    category: 'form-validation',
    fields: {
        propertyId: {
            initialValue: '',
            rules: {
                required: 'Property ID is required',
            },
        },
        inquirerName: {
            initialValue: '',
            rules: {
                required: 'Your name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
            },
            validateOnBlur: true,
        },
        inquirerEmail: {
            initialValue: '',
            rules: {
                required: 'Email is required',
                email: 'Please enter a valid email address',
            },
            validateOnBlur: true,
        },
        inquirerPhone: {
            initialValue: '',
            rules: {
                pattern: {
                    value: /^(\+254|0)[17]\d{8}$/,
                    message: 'Please enter a valid Kenyan phone number',
                },
            },
            validateOnBlur: true,
        },
        inquiryType: {
            initialValue: 'viewing',
            rules: {
                required: 'Please select inquiry type',
                custom: function (value) {
                    var validTypes = ['viewing', 'purchase', 'rent', 'information'];
                    return validTypes.includes(value) || 'Please select a valid inquiry type';
                },
            },
        },
        message: {
            initialValue: '',
            rules: {
                required: 'Please provide your inquiry details',
                minLength: { value: 20, message: 'Please provide more details (at least 20 characters)' },
                maxLength: { value: 1000, message: 'Message is too long (maximum 1000 characters)' },
            },
            validateOnBlur: true,
        },
        preferredContactTime: {
            initialValue: 'anytime',
            rules: {
                custom: function (value) {
                    var validTimes = ['morning', 'afternoon', 'evening', 'anytime'];
                    return validTimes.includes(value) || 'Please select a valid contact time';
                },
            },
        },
    },
    globalValidation: function (formData) {
        // Business rule: Purchase inquiries require phone number
        if (formData.inquiryType === 'purchase' && !formData.inquirerPhone) {
            return 'Phone number is required for purchase inquiries';
        }
        // Business rule: Viewing requests should specify preferred time
        if (formData.inquiryType === 'viewing' && formData.preferredContactTime === 'anytime') {
            return 'Please specify your preferred contact time for viewing requests';
        }
        return true;
    },
};
exports.usePropertyInquiryForm = (0, index_1.createFormValidationHook)(propertyInquiryFormConfig);
// Example 4: Composing multiple hooks for a complete page
function usePropertyDetailsPage(propertyId) {
    var configs = {
        propertyDetails: (0, index_1.getPropertyPreset)('propertyDetails'),
        similarProperties: (0, index_1.getPropertyPreset)('similarProperties'),
        inquiryForm: propertyInquiryFormConfig,
    };
    var args = {
        propertyDetails: { id: propertyId },
        similarProperties: { excludeId: propertyId, limit: 4 },
        inquiryForm: { propertyId: propertyId },
    };
    return (0, index_1.useComposedHooks)(configs, args);
}
// Example 5: Dynamic configuration based on user preferences
function useAdaptivePropertySearch(userPreferences) {
    var baseConfig = (0, index_1.getPropertyPreset)('propertySearch');
    // Adapt configuration based on user preferences
    var adaptedConfig = __assign(__assign({}, baseConfig), { 
        // Adjust debounce based on search speed preference
        debounceMs: (userPreferences === null || userPreferences === void 0 ? void 0 : userPreferences.searchSpeed) === 'fast' ? 300 : 800, 
        // Adjust cache strategy
        staleTime: (userPreferences === null || userPreferences === void 0 ? void 0 : userPreferences.cacheStrategy) === 'aggressive' ?
            5 * 60 * 1000 : // 5 minutes for aggressive caching
            30 * 1000, 
        // Adjust validation based on data quality preference
        validator: (userPreferences === null || userPreferences === void 0 ? void 0 : userPreferences.dataQuality) === 'detailed' ?
            function (data) {
                if (!Array.isArray(data))
                    return [];
                return data.filter(function (item) {
                    if (!item || typeof item !== "object")
                        return false;
                    var obj = item;
                    // Detailed validation requires more fields
                    return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                        obj.id != null &&
                        typeof obj.title === "string" &&
                        obj.title.length > 0 &&
                        typeof obj.description === "string" &&
                        obj.description.length > 50 && // Detailed requires longer descriptions
                        typeof obj.price === "number" &&
                        obj.price > 0 &&
                        Array.isArray(obj.images) &&
                        obj.images.length > 2 // Detailed requires multiple images
                    );
                });
            } :
            baseConfig.validator });
    return (0, index_1.useConfigurableHook)(adaptedConfig);
}
// Example 6: A/B testing with different configurations
function usePropertySearchABTest(variant, searchParams) {
    var configA = (0, index_1.createDataFetchingConfig)('searchData', {
        name: 'Property Search Variant A',
        description: 'Conservative search configuration',
        endpoint: '/api/properties/search',
        debounceMs: 800,
        staleTime: 2 * 60 * 1000,
        retry: 3,
    });
    var configB = (0, index_1.createDataFetchingConfig)('searchData', {
        name: 'Property Search Variant B',
        description: 'Aggressive search configuration',
        endpoint: '/api/properties/search',
        debounceMs: 400,
        staleTime: 30 * 1000,
        retry: 5,
        refetchOnWindowFocus: true,
    });
    var config = variant === 'A' ? configA : configB;
    return (0, index_1.useConfigurableHook)(config, searchParams);
}
// Example 7: Environment-specific configurations
function useEnvironmentAwarePropertyFetching(endpoint, params) {
    var isDevelopment = process.env.NODE_ENV === 'development';
    var isProduction = process.env.NODE_ENV === 'production';
    var config = (0, index_1.createDataFetchingConfig)('paginatedList', {
        name: 'Environment Aware Property Fetching',
        description: 'Configuration that adapts to the current environment',
        endpoint: endpoint,
        // Development: More aggressive caching and detailed logging
        staleTime: isDevelopment ? 10 * 60 * 1000 : 2 * 60 * 1000,
        retry: isDevelopment ? 1 : 3, // Fail fast in development
        debounceMs: isDevelopment ? 200 : 500, // Faster feedback in development
        // Production: More conservative settings
        gcTime: isProduction ? 30 * 60 * 1000 : 5 * 60 * 1000,
        refetchOnWindowFocus: !isProduction, // Only refetch on focus in development
        // Custom validator with environment-specific behavior
        validator: function (data) {
            if (!Array.isArray(data))
                return [];
            var properties = data.filter(function (item) {
                if (!item || typeof item !== "object")
                    return false;
                var obj = item;
                return ((typeof obj.id === "string" || typeof obj.id === "number") &&
                    obj.id != null &&
                    typeof obj.title === "string" &&
                    obj.title.length > 0);
            });
            // In development, log validation results
            if (isDevelopment) {
                console.log("[Property Fetching] Validated ".concat(properties.length, " properties from ").concat(data.length, " items"));
            }
            return properties;
        },
    });
    return (0, index_1.useConfigurableHook)(config, params);
}
// Example 8: Configuration inheritance and extension
function useExtendedPropertyForm(baseFormType, customFields) {
    var baseConfig = (0, index_1.getFormPreset)('propertyForm');
    // Extend base configuration with type-specific fields
    var typeSpecificFields = {
        rental: {
            leaseDuration: {
                initialValue: '12',
                rules: {
                    required: 'Lease duration is required',
                    custom: function (value) {
                        var months = parseInt(value);
                        return (months >= 1 && months <= 60) || 'Lease duration must be between 1 and 60 months';
                    },
                },
            },
            securityDeposit: {
                initialValue: '',
                rules: {
                    required: 'Security deposit amount is required',
                    custom: function (value) {
                        var amount = Number(value);
                        return (!isNaN(amount) && amount > 0) || 'Security deposit must be a positive number';
                    },
                },
            },
        },
        commercial: {
            businessType: {
                initialValue: '',
                rules: {
                    required: 'Intended business type is required',
                    minLength: { value: 5, message: 'Please provide more details about the business type' },
                },
            },
            parkingSpaces: {
                initialValue: 0,
                rules: {
                    required: 'Number of parking spaces is required',
                    min: { value: 0, message: 'Parking spaces cannot be negative' },
                },
            },
        },
    };
    var extendedConfig = __assign(__assign({}, baseConfig), { fields: __assign(__assign(__assign({}, baseConfig.fields), (typeSpecificFields[baseFormType] || {})), customFields) });
    return (0, index_1.useConfigurableHook)(extendedConfig);
}
// Export all examples for documentation and testing
exports.configurationExamples = {
    usePropertyListingWithPreset: usePropertyListingWithPreset,
    useCustomPropertySearch: exports.useCustomPropertySearch,
    usePropertyInquiryForm: exports.usePropertyInquiryForm,
    usePropertyDetailsPage: usePropertyDetailsPage,
    useAdaptivePropertySearch: useAdaptivePropertySearch,
    usePropertySearchABTest: usePropertySearchABTest,
    useEnvironmentAwarePropertyFetching: useEnvironmentAwarePropertyFetching,
    useExtendedPropertyForm: useExtendedPropertyForm,
};
