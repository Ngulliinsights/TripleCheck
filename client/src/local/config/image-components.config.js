"use strict";
/**
 * Unified Image Components Configuration
 * Centralizes all image component settings and eliminates scattered configurations
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
exports.imageComponentConfig = exports.configPresets = exports.enterpriseImageConfig = exports.propertyImageConfig = exports.defaultImageComponentConfig = void 0;
exports.getConfigForContext = getConfigForContext;
exports.mergeConfig = mergeConfig;
// Default configuration
exports.defaultImageComponentConfig = {
    gallery: {
        defaultViewMode: 'grid',
        enabledFeatures: {
            search: true,
            fullscreen: true,
            collaboration: false,
            watermark: false,
            validation: false,
        },
        performance: {
            lazyLoading: true,
            virtualization: true,
            preloadCount: 2,
        },
        ui: {
            showImageCounter: true,
            showThumbnails: true,
            wrapInCard: false,
        },
    },
    vault: {
        upload: {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxFiles: 20,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            chunkSize: 1024 * 1024, // 1MB chunks
        },
        workflow: {
            enableWorkflowProgress: true,
            enableAuditLogging: true,
            maxConcurrentUploads: 3,
        },
        features: {
            allowReorder: true,
            allowAnnotation: true,
            allowPrimaryFlag: true,
        },
    },
    viewer: {
        navigation: {
            allowNavigation: true,
            showThumbnails: true,
            enableFullscreen: true,
        },
        ui: {
            showImageCounter: true,
            showCaptions: true,
        },
        performance: {
            lazyLoading: true,
            preloadAdjacent: true,
        },
    },
    property: {
        defaultDocumentType: 'property_photo',
        allowedDocumentTypes: [
            'property_photo',
            'title_deed',
            'survey_plan',
            'valuation_report',
            'identification_document',
            'other_document',
        ],
        userRole: 'viewer',
        features: {
            enableSearch: false,
            enableCollaboration: false,
            enableWatermark: false,
        },
    },
};
// Property-specific configuration overrides
exports.propertyImageConfig = {
    gallery: __assign(__assign({}, exports.defaultImageComponentConfig.gallery), { enabledFeatures: __assign(__assign({}, exports.defaultImageComponentConfig.gallery.enabledFeatures), { search: false, collaboration: false, watermark: false }) }),
    property: __assign(__assign({}, exports.defaultImageComponentConfig.property), { userRole: 'viewer' }),
};
// Enterprise configuration overrides
exports.enterpriseImageConfig = {
    gallery: __assign(__assign({}, exports.defaultImageComponentConfig.gallery), { enabledFeatures: {
            search: true,
            fullscreen: true,
            collaboration: true,
            watermark: true,
            validation: true,
        } }),
    vault: __assign(__assign({}, exports.defaultImageComponentConfig.vault), { workflow: __assign(__assign({}, exports.defaultImageComponentConfig.vault.workflow), { enableAuditLogging: true }) }),
};
// Configuration presets for different use cases
exports.configPresets = {
    default: exports.defaultImageComponentConfig,
    property: __assign(__assign({}, exports.defaultImageComponentConfig), exports.propertyImageConfig),
    enterprise: __assign(__assign({}, exports.defaultImageComponentConfig), exports.enterpriseImageConfig),
    simple: __assign(__assign({}, exports.defaultImageComponentConfig), { gallery: __assign(__assign({}, exports.defaultImageComponentConfig.gallery), { enabledFeatures: {
                search: false,
                fullscreen: true,
                collaboration: false,
                watermark: false,
                validation: false,
            } }), viewer: __assign(__assign({}, exports.defaultImageComponentConfig.viewer), { navigation: {
                allowNavigation: true,
                showThumbnails: false,
                enableFullscreen: false,
            } }) }),
};
// Utility functions for configuration
function getConfigForContext(context) {
    return exports.configPresets[context];
}
function mergeConfig(base, overrides) {
    return {
        gallery: __assign(__assign({}, base.gallery), overrides.gallery),
        vault: __assign(__assign({}, base.vault), overrides.vault),
        viewer: __assign(__assign({}, base.viewer), overrides.viewer),
        property: __assign(__assign({}, base.property), overrides.property),
    };
}
// Export the main configuration (now imports from unified config)
var image_system_config_1 = require("./image-system.config");
exports.imageComponentConfig = image_system_config_1.imageComponentConfig;
