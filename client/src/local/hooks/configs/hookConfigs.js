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
exports.hookConfigRegistry = exports.commonPerformanceConfigs = exports.commonUIInteractionConfigs = exports.commonDataFetchingConfigs = void 0;
exports.getDataFetchingConfig = getDataFetchingConfig;
exports.getUIInteractionConfig = getUIInteractionConfig;
exports.getPerformanceConfig = getPerformanceConfig;
exports.createDataFetchingConfig = createDataFetchingConfig;
exports.createUIInteractionConfig = createUIInteractionConfig;
exports.createPerformanceConfig = createPerformanceConfig;
exports.validateHookConfig = validateHookConfig;
exports.mergeConfigurations = mergeConfigurations;
// Configuration presets for common use cases
exports.commonDataFetchingConfigs = {
    // API list fetching with pagination
    paginatedList: {
        name: 'Paginated List',
        description: 'Standard configuration for paginated list data fetching',
        category: 'data-fetching',
        endpoint: '', // To be overridden
        method: 'GET',
        fallbackData: { data: [], total: 0, page: 1, hasNext: false, hasPrev: false },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 3,
        debounceMs: 500,
        deduplicate: true,
        validator: function (data) {
            if (!data || typeof data !== 'object') {
                return { data: [], total: 0, page: 1, hasNext: false, hasPrev: false };
            }
            var response = data;
            return {
                data: Array.isArray(response.data) ? response.data : [],
                total: typeof response.total === 'number' ? response.total : 0,
                page: typeof response.page === 'number' ? response.page : 1,
                hasNext: Boolean(response.hasNext),
                hasPrev: Boolean(response.hasPrev),
            };
        },
    },
    // Single item fetching
    singleItem: {
        name: 'Single Item',
        description: 'Configuration for fetching a single item by ID',
        category: 'data-fetching',
        endpoint: '', // To be overridden
        method: 'GET',
        fallbackData: null,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
        retry: 2,
        deduplicate: true,
        validator: function (data) { return data || null; },
    },
    // Real-time data fetching
    realTime: {
        name: 'Real-time Data',
        description: 'Configuration for frequently updated data',
        category: 'data-fetching',
        endpoint: '', // To be overridden
        method: 'GET',
        fallbackData: null,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 2 * 60 * 1000, // 2 minutes
        retry: 5,
        debounceMs: 200,
        deduplicate: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    },
    // Search/filter data fetching
    searchData: {
        name: 'Search Data',
        description: 'Configuration for search and filter operations',
        category: 'data-fetching',
        endpoint: '', // To be overridden
        method: 'GET',
        fallbackData: { results: [], total: 0, query: '' },
        staleTime: 1 * 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: 3,
        debounceMs: 800, // Longer debounce for search
        deduplicate: true,
        validator: function (data) {
            if (!data || typeof data !== 'object') {
                return { results: [], total: 0, query: '' };
            }
            var response = data;
            return {
                results: Array.isArray(response.results) ? response.results : [],
                total: typeof response.total === 'number' ? response.total : 0,
                query: typeof response.query === 'string' ? response.query : '',
            };
        },
    },
};
exports.commonUIInteractionConfigs = {
    // Standard user interaction
    standardInteraction: {
        name: 'Standard Interaction',
        description: 'Default configuration for user interactions',
        category: 'ui-interaction',
        debounceMs: 300,
        enableKeyboardShortcuts: true,
        enableTouchGestures: false,
    },
    // Search input interaction
    searchInput: {
        name: 'Search Input',
        description: 'Configuration for search input interactions',
        category: 'ui-interaction',
        debounceMs: 500,
        enableKeyboardShortcuts: true,
        enableTouchGestures: false,
    },
    // Mobile-optimized interaction
    mobileInteraction: {
        name: 'Mobile Interaction',
        description: 'Configuration optimized for mobile devices',
        category: 'ui-interaction',
        debounceMs: 200,
        throttleMs: 100,
        enableKeyboardShortcuts: false,
        enableTouchGestures: true,
    },
    // High-frequency interaction (like sliders, drag & drop)
    highFrequency: {
        name: 'High Frequency',
        description: 'Configuration for high-frequency interactions',
        category: 'ui-interaction',
        throttleMs: 16, // ~60fps
        enableKeyboardShortcuts: true,
        enableTouchGestures: true,
    },
};
exports.commonPerformanceConfigs = {
    // Development monitoring
    development: {
        name: 'Development Monitoring',
        description: 'Comprehensive monitoring for development environment',
        category: 'performance',
        trackRenderTime: true,
        trackMemoryUsage: true,
        trackNetworkRequests: true,
        sampleRate: 1.0, // Track everything in development
    },
    // Production monitoring
    production: {
        name: 'Production Monitoring',
        description: 'Lightweight monitoring for production environment',
        category: 'performance',
        trackRenderTime: true,
        trackMemoryUsage: false,
        trackNetworkRequests: true,
        sampleRate: 0.1, // Sample 10% in production
    },
    // Critical path monitoring
    criticalPath: {
        name: 'Critical Path',
        description: 'Monitoring for critical user paths',
        category: 'performance',
        trackRenderTime: true,
        trackMemoryUsage: true,
        trackNetworkRequests: true,
        sampleRate: 0.5, // Sample 50% for critical paths
    },
};
// Configuration registry
exports.hookConfigRegistry = {
    dataFetching: exports.commonDataFetchingConfigs,
    uiInteraction: exports.commonUIInteractionConfigs,
    performance: exports.commonPerformanceConfigs,
};
// Helper functions to get configurations
function getDataFetchingConfig(key) {
    return exports.commonDataFetchingConfigs[key];
}
function getUIInteractionConfig(key) {
    return exports.commonUIInteractionConfigs[key];
}
function getPerformanceConfig(key) {
    return exports.commonPerformanceConfigs[key];
}
// Factory function to create custom configurations
function createDataFetchingConfig(baseConfig, overrides) {
    var base = getDataFetchingConfig(baseConfig);
    return __assign(__assign({}, base), overrides);
}
function createUIInteractionConfig(baseConfig, overrides) {
    var base = getUIInteractionConfig(baseConfig);
    return __assign(__assign({}, base), overrides);
}
function createPerformanceConfig(baseConfig, overrides) {
    var base = getPerformanceConfig(baseConfig);
    return __assign(__assign({}, base), overrides);
}
// Configuration validation helpers
function validateHookConfig(config) {
    var errors = [];
    if (!config.name || config.name.trim().length === 0) {
        errors.push('Configuration name is required');
    }
    if (!config.description || config.description.trim().length === 0) {
        errors.push('Configuration description is required');
    }
    if (config.category === 'data-fetching') {
        var dataConfig = config;
        if (!dataConfig.endpoint || dataConfig.endpoint.trim().length === 0) {
            errors.push('Data fetching configuration requires an endpoint');
        }
        if (dataConfig.fallbackData === undefined) {
            errors.push('Data fetching configuration requires fallback data');
        }
    }
    if (config.category === 'form-validation') {
        var formConfig = config;
        if (!formConfig.fields || Object.keys(formConfig.fields).length === 0) {
            errors.push('Form validation configuration requires field definitions');
        }
    }
    if (config.category === 'performance') {
        var perfConfig = config;
        if (perfConfig.sampleRate !== undefined && (perfConfig.sampleRate < 0 || perfConfig.sampleRate > 1)) {
            errors.push('Performance configuration sample rate must be between 0 and 1');
        }
    }
    return errors;
}
// Configuration merger for combining multiple configurations
function mergeConfigurations(base) {
    var overrides = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        overrides[_i - 1] = arguments[_i];
    }
    return overrides.reduce(function (merged, override) { return (__assign(__assign({}, merged), override)); }, base);
}
