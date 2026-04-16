"use strict";
/**
 * Image Services - Modular Architecture
 *
 * RECOMMENDED: Use ImageServiceOrchestrator for all new code.
 * It provides a clean, modern API that coordinates all image services.
 *
 * Migration Guide:
 * - Use ImageServiceOrchestrator for complex workflows
 * - Use individual services for specific operations
 * - Services share common functionality through ImageServiceCore
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageServices = exports.ImageMetadataService = exports.PropertyImageWorkflowManager = exports.PropertyImageValidationService = exports.PropertyImageUploadService = exports.ImageServiceRegistry = exports.ImageServiceCore = exports.createImageServiceOrchestrator = exports.getImageServiceOrchestrator = exports.DefaultImageServiceOrchestrator = void 0;
// ============================================================================
// RECOMMENDED: Modern Orchestrator Pattern
// ============================================================================
// Orchestrator for complex workflows - USE THIS FOR NEW CODE
var ImageServiceOrchestrator_1 = require("./ImageServiceOrchestrator");
Object.defineProperty(exports, "DefaultImageServiceOrchestrator", { enumerable: true, get: function () { return ImageServiceOrchestrator_1.DefaultImageServiceOrchestrator; } });
Object.defineProperty(exports, "getImageServiceOrchestrator", { enumerable: true, get: function () { return ImageServiceOrchestrator_1.getImageServiceOrchestrator; } });
Object.defineProperty(exports, "createImageServiceOrchestrator", { enumerable: true, get: function () { return ImageServiceOrchestrator_1.createImageServiceOrchestrator; } });
// ============================================================================
// Core Architecture
// ============================================================================
// Core architecture - foundation services
var ImageServiceCore_1 = require("./core/ImageServiceCore");
Object.defineProperty(exports, "ImageServiceCore", { enumerable: true, get: function () { return ImageServiceCore_1.ImageServiceCore; } });
Object.defineProperty(exports, "ImageServiceRegistry", { enumerable: true, get: function () { return ImageServiceCore_1.ImageServiceRegistry; } });
// Specialized services - each handles a specific domain
var PropertyImageUploadService_1 = require("./PropertyImageUploadService");
Object.defineProperty(exports, "PropertyImageUploadService", { enumerable: true, get: function () { return PropertyImageUploadService_1.PropertyImageUploadService; } });
var PropertyImageValidationService_1 = require("./PropertyImageValidationService");
Object.defineProperty(exports, "PropertyImageValidationService", { enumerable: true, get: function () { return PropertyImageValidationService_1.PropertyImageValidationService; } });
var PropertyImageWorkflowManager_1 = require("./PropertyImageWorkflowManager");
Object.defineProperty(exports, "PropertyImageWorkflowManager", { enumerable: true, get: function () { return PropertyImageWorkflowManager_1.PropertyImageWorkflowManager; } });
var ImageMetadataService_1 = require("./ImageMetadataService");
Object.defineProperty(exports, "ImageMetadataService", { enumerable: true, get: function () { return ImageMetadataService_1.ImageMetadataService; } });
// ============================================================================
// Backward Compatibility Adapters (Removed)
// ============================================================================
// Legacy adapters have been removed. Use ImageServiceOrchestrator directly.
// Migration guide: docs/service-consolidation-plan.md
// ============================================================================
// Convenience Exports
// ============================================================================
// Import the required dependencies for our convenience exports
var ImageServiceCore_2 = require("./core/ImageServiceCore");
var ImageServiceOrchestrator_2 = require("./ImageServiceOrchestrator");
/**
 * Convenience exports for common use cases
 *
 * RECOMMENDED: Use these helper functions for quick access to services
 */
exports.imageServices = {
    /**
     * Get the orchestrator (RECOMMENDED for most use cases)
     * The orchestrator coordinates between all services and handles complex workflows
     */
    getOrchestrator: function () { return (0, ImageServiceOrchestrator_2.getImageServiceOrchestrator)(); },
    /**
     * Get individual services from registry
     * Use these when you need fine-grained control over specific operations
     */
    getUploadService: function () {
        var registry = ImageServiceCore_2.ImageServiceRegistry.getInstance();
        return registry.get('PropertyImageUploadService');
    },
    getValidationService: function () {
        var registry = ImageServiceCore_2.ImageServiceRegistry.getInstance();
        return registry.get('PropertyImageValidationService');
    },
    getWorkflowService: function () {
        var registry = ImageServiceCore_2.ImageServiceRegistry.getInstance();
        return registry.get('PropertyImageWorkflowManager');
    },
    getMetadataService: function () {
        var registry = ImageServiceCore_2.ImageServiceRegistry.getInstance();
        return registry.get('ImageMetadataService');
    },
    /**
     * Utility function to check if all services are properly registered
     * Useful for debugging and ensuring proper initialization
     */
    checkServiceHealth: function () {
        var registry = ImageServiceCore_2.ImageServiceRegistry.getInstance();
        var requiredServices = [
            'PropertyImageUploadService',
            'PropertyImageValidationService',
            'PropertyImageWorkflowManager',
            'ImageMetadataService'
        ];
        var health = {};
        requiredServices.forEach(function (serviceName) {
            health[serviceName] = registry.has(serviceName);
        });
        return health;
    },
    /**
     * Get all registered service names
     * Helpful for introspection and debugging
     */
    getRegisteredServices: function () {
        var registry = ImageServiceCore_2.ImageServiceRegistry.getInstance();
        return registry.getRegisteredServiceNames();
    }
};
// Default export for convenience
exports.default = exports.imageServices;
