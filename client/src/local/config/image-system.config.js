"use strict";
/**
 * Unified Image System Configuration
 * Consolidates image-service.config.ts and image-components.config.ts
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
exports.isTest = exports.isProduction = exports.isDevelopment = exports.configPresets = exports.imageComponentConfig = exports.imageServiceConfig = exports.imageSystemConfig = void 0;
exports.getConfigForContext = getConfigForContext;
exports.validateImageSystemConfig = validateImageSystemConfig;
// Environment detection
var getEnvVar = function (key, defaultValue) {
    var _a;
    if (typeof window !== 'undefined') {
        return ((_a = window.__VITE_ENV__) === null || _a === void 0 ? void 0 : _a[key]) || defaultValue;
    }
    return process.env[key] || defaultValue;
};
var MODE = getEnvVar('MODE', 'development');
var isDevelopment = MODE === "development";
exports.isDevelopment = isDevelopment;
var isProduction = MODE === "production";
exports.isProduction = isProduction;
var isTest = MODE === "test";
exports.isTest = isTest;
// Base configuration
var baseConfig = {
    service: {
        upload: {
            chunkSize: 1024 * 1024, // 1MB chunks
            maxConcurrentUploads: 3,
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 30000,
        },
        validation: {
            maxFileSize: 100 * 1024 * 1024, // 100MB
            allowedFormats: ["jpg", "jpeg", "png", "webp", "pdf", "tiff", "heic", "avif"],
            requireGeoLocation: false,
            documentAuthEnabled: true,
            fraudDetectionEnabled: true,
        },
        processing: {
            enableAITagging: true,
            enableVirusScanning: true,
            enableComplianceCheck: true,
            thumbnailSizes: [150, 300, 600, 1200],
            optimizationQuality: 85,
        },
        storage: {
            provider: "local",
            encryption: true,
            redundancy: "single",
        },
        integrations: {
            documentAuth: {
                enabled: true,
                endpoint: "/api/v1/document-auth/authenticate",
            },
            fraudDetection: {
                enabled: true,
                endpoint: "/api/v1/fraud-detection/analyze",
            },
            landVerification: {
                enabled: true,
                endpoint: "/api/v1/land-verification/verify",
            },
        },
    },
    components: {
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
                chunkSize: 1024 * 1024,
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
    },
};
// Environment-specific overrides
var environmentConfigs = {
    development: {
        service: {
            upload: {
                maxConcurrentUploads: 2,
                timeout: 60000,
            },
            validation: {
                maxFileSize: 50 * 1024 * 1024,
                documentAuthEnabled: false,
                fraudDetectionEnabled: false,
            },
            processing: {
                enableVirusScanning: false,
                enableComplianceCheck: false,
                optimizationQuality: 70,
            },
            storage: {
                encryption: false,
            },
            integrations: {
                documentAuth: { enabled: false },
                fraudDetection: { enabled: false },
                landVerification: { enabled: false },
            },
        },
    },
    production: {
        service: {
            upload: {
                chunkSize: 2 * 1024 * 1024,
                maxConcurrentUploads: 5,
                timeout: 120000,
            },
            validation: {
                maxFileSize: 200 * 1024 * 1024,
                requireGeoLocation: true,
            },
            processing: {
                optimizationQuality: 90,
            },
            storage: {
                provider: getEnvVar('VITE_STORAGE_PROVIDER') || "aws",
                bucket: getEnvVar('VITE_STORAGE_BUCKET'),
                region: getEnvVar('VITE_STORAGE_REGION'),
                redundancy: "multi-region",
            },
            integrations: {
                documentAuth: {
                    endpoint: getEnvVar('VITE_DOCUMENT_AUTH_ENDPOINT') || "/api/v1/document-auth/authenticate",
                    apiKey: getEnvVar('VITE_DOCUMENT_AUTH_API_KEY'),
                },
                fraudDetection: {
                    endpoint: getEnvVar('VITE_FRAUD_DETECTION_ENDPOINT') || "/api/v1/fraud-detection/analyze",
                    apiKey: getEnvVar('VITE_FRAUD_DETECTION_API_KEY'),
                },
                landVerification: {
                    endpoint: getEnvVar('VITE_LAND_VERIFICATION_ENDPOINT') || "/api/v1/land-verification/verify",
                    apiKey: getEnvVar('VITE_LAND_VERIFICATION_API_KEY'),
                },
            },
        },
    },
    test: {
        service: {
            upload: {
                chunkSize: 512 * 1024,
                maxConcurrentUploads: 1,
                maxRetries: 1,
                retryDelay: 100,
                timeout: 5000,
            },
            validation: {
                maxFileSize: 10 * 1024 * 1024,
                documentAuthEnabled: false,
                fraudDetectionEnabled: false,
            },
            processing: {
                enableAITagging: false,
                enableVirusScanning: false,
                enableComplianceCheck: false,
                thumbnailSizes: [150],
                optimizationQuality: 50,
            },
            storage: {
                encryption: false,
            },
            integrations: {
                documentAuth: { enabled: false },
                fraudDetection: { enabled: false },
                landVerification: { enabled: false },
            },
        },
    },
};
// Deep merge function
function deepMerge(target, source) {
    var result = __assign({}, target);
    for (var key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        }
        else {
            result[key] = source[key];
        }
    }
    return result;
}
// Create final configuration
function createImageSystemConfig() {
    var envOverrides = {};
    if (isDevelopment) {
        envOverrides = environmentConfigs.development;
    }
    else if (isProduction) {
        envOverrides = environmentConfigs.production;
    }
    else if (isTest) {
        envOverrides = environmentConfigs.test;
    }
    return deepMerge(baseConfig, envOverrides);
}
// Export the unified configuration
exports.imageSystemConfig = createImageSystemConfig();
// Backward compatibility exports
exports.imageServiceConfig = exports.imageSystemConfig.service;
exports.imageComponentConfig = exports.imageSystemConfig.components;
// Configuration presets
exports.configPresets = {
    default: exports.imageSystemConfig.components,
    property: deepMerge(exports.imageSystemConfig.components, {
        gallery: {
            enabledFeatures: {
                search: false,
                collaboration: false,
                watermark: false,
            },
        },
        property: {
            userRole: 'viewer',
        },
    }),
    enterprise: deepMerge(exports.imageSystemConfig.components, {
        gallery: {
            enabledFeatures: {
                search: true,
                fullscreen: true,
                collaboration: true,
                watermark: true,
                validation: true,
            },
        },
        vault: {
            workflow: {
                enableAuditLogging: true,
            },
        },
    }),
    simple: deepMerge(exports.imageSystemConfig.components, {
        gallery: {
            enabledFeatures: {
                search: false,
                fullscreen: true,
                collaboration: false,
                watermark: false,
                validation: false,
            },
        },
        viewer: {
            navigation: {
                showThumbnails: false,
                enableFullscreen: false,
            },
        },
    }),
};
// Utility functions
function getConfigForContext(context) {
    return exports.configPresets[context];
}
function validateImageSystemConfig(config) {
    var errors = [];
    // Validate service configuration
    if (config.service.upload.chunkSize <= 0) {
        errors.push("Upload chunk size must be greater than 0");
    }
    if (config.service.validation.maxFileSize <= 0) {
        errors.push("Max file size must be greater than 0");
    }
    if (config.service.validation.allowedFormats.length === 0) {
        errors.push("At least one file format must be allowed");
    }
    // Validate component configuration
    if (config.components.vault.upload.maxFiles <= 0) {
        errors.push("Max files must be greater than 0");
    }
    return errors;
}
