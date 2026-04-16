"use strict";
/**
 * Image Components Index
 * Simplified exports with single source of truth
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePropertyImageUpload = exports.ImageMetadataService = exports.PropertyImageWorkflowManager = exports.PropertyImageValidationService = exports.IMAGE_COMPONENT_PRESETS = exports.ImageUtils = exports.PropertyImageVault = exports.PropertyImageGallery = exports.ImageGallery = void 0;
// Component exports
var ImageGallery_1 = require("./ImageGallery");
Object.defineProperty(exports, "ImageGallery", { enumerable: true, get: function () { return ImageGallery_1.default; } });
var ImageGallery_2 = require("./ImageGallery"); // Alias for backward compatibility
Object.defineProperty(exports, "PropertyImageGallery", { enumerable: true, get: function () { return ImageGallery_2.default; } });
var PropertyImageVault_1 = require("./PropertyImageVault");
Object.defineProperty(exports, "PropertyImageVault", { enumerable: true, get: function () { return PropertyImageVault_1.default; } });
// Unified utilities and services
var unified_utils_1 = require("../../utils/images/unified-utils");
Object.defineProperty(exports, "ImageUtils", { enumerable: true, get: function () { return unified_utils_1.ImageUtils; } });
// Preset configurations for common use cases
exports.IMAGE_COMPONENT_PRESETS = {
    SIMPLE_VIEWER: {
        enableSearch: false,
        enableFullscreen: true,
        enableCollaboration: false,
        enableValidation: false,
        enableWatermark: false,
        userRole: 'viewer',
        showImageCounter: true,
    },
    PROPERTY_GALLERY: {
        enableSearch: true,
        enableFullscreen: true,
        enableCollaboration: false,
        enableValidation: false,
        enableWatermark: false,
        userRole: 'viewer',
        showImageCounter: true,
    },
    ENTERPRISE_GALLERY: {
        enableSearch: true,
        enableFullscreen: true,
        enableCollaboration: true,
        enableValidation: true,
        enableWatermark: true,
        userRole: 'editor',
        showImageCounter: true,
    },
};
// Service exports
// export { PropertyImageUploadCoordinator } from '../../services/images/PropertyImageUploadCoordinator' // File doesn't exist
var PropertyImageValidationService_1 = require("../../services/images/PropertyImageValidationService");
Object.defineProperty(exports, "PropertyImageValidationService", { enumerable: true, get: function () { return PropertyImageValidationService_1.PropertyImageValidationService; } });
var PropertyImageWorkflowManager_1 = require("../../services/images/PropertyImageWorkflowManager");
Object.defineProperty(exports, "PropertyImageWorkflowManager", { enumerable: true, get: function () { return PropertyImageWorkflowManager_1.PropertyImageWorkflowManager; } });
var ImageMetadataService_1 = require("../../services/images/ImageMetadataService");
Object.defineProperty(exports, "ImageMetadataService", { enumerable: true, get: function () { return ImageMetadataService_1.ImageMetadataService; } });
// Hook exports
var usePropertyImageUpload_1 = require("../../hooks/images/usePropertyImageUpload");
Object.defineProperty(exports, "usePropertyImageUpload", { enumerable: true, get: function () { return usePropertyImageUpload_1.usePropertyImageUpload; } });
