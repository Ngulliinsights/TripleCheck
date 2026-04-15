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

// ============================================================================
// RECOMMENDED: Modern Orchestrator Pattern
// ============================================================================

// Orchestrator for complex workflows - USE THIS FOR NEW CODE
export {
    DefaultImageServiceOrchestrator,
    getImageServiceOrchestrator,
    createImageServiceOrchestrator,
    type ImageServiceOrchestrator,
} from './ImageServiceOrchestrator'

// ============================================================================
// Core Architecture
// ============================================================================

// Core architecture - foundation services
export { ImageServiceCore, ImageServiceRegistry } from './core/ImageServiceCore'

// Specialized services - each handles a specific domain
export { PropertyImageUploadService } from './PropertyImageUploadService'
export { PropertyImageValidationService } from './PropertyImageValidationService'
export { PropertyImageWorkflowManager } from './PropertyImageWorkflowManager'
export { ImageMetadataService } from './ImageMetadataService'

// ============================================================================
// DEPRECATED: Legacy Services (DO NOT USE IN NEW CODE)
// ============================================================================

/**
 * @deprecated Use ImageServiceOrchestrator.getUploadService() instead
 * This coordinator will be removed in the next major version.
 * 
 * Migration:
 * ```typescript
 * // Old
 * const coordinator = new PropertyImageUploadCoordinator()
 * 
 * // New
 * const orchestrator = getImageServiceOrchestrator()
 * const uploadService = orchestrator.getUploadService()
 * ```
 */
export { PropertyImageUploadCoordinator } from './PropertyImageUploadCoordinator'

// ============================================================================
// Backward Compatibility Adapters (Temporary)
// ============================================================================

// Legacy service adapters for backward compatibility
// These wrap old interfaces around new implementations
export {
    LegacyPropertyImageUploadCoordinator,
    LegacyPropertyImageValidationService,
    LegacyPropertyImageWorkflowManager,
    LegacyImageMetadataService,
    LegacyUnifiedImageServiceFactory,
    legacyPropertyImageUploadCoordinator,
    legacyPropertyImageValidationService,
    legacyPropertyImageWorkflowManager,
    legacyImageMetadataService,
} from './LegacyServiceAdapter'

// ============================================================================
// Convenience Exports
// ============================================================================

// Import the required dependencies for our convenience exports
import { ImageServiceRegistry } from './core/ImageServiceCore'
import { getImageServiceOrchestrator as getOrchestratorFn } from './ImageServiceOrchestrator'

/**
 * Convenience exports for common use cases
 * 
 * RECOMMENDED: Use these helper functions for quick access to services
 */
export const imageServices = {
    /**
     * Get the orchestrator (RECOMMENDED for most use cases)
     * The orchestrator coordinates between all services and handles complex workflows
     */
    getOrchestrator: () => getOrchestratorFn(),

    /**
     * Get individual services from registry
     * Use these when you need fine-grained control over specific operations
     */
    getUploadService: () => {
        const registry = ImageServiceRegistry.getInstance();
        return registry.get('PropertyImageUploadService');
    },

    getValidationService: () => {
        const registry = ImageServiceRegistry.getInstance();
        return registry.get('PropertyImageValidationService');
    },

    getWorkflowService: () => {
        const registry = ImageServiceRegistry.getInstance();
        return registry.get('PropertyImageWorkflowManager');
    },

    getMetadataService: () => {
        const registry = ImageServiceRegistry.getInstance();
        return registry.get('ImageMetadataService');
    },

    /**
     * Utility function to check if all services are properly registered
     * Useful for debugging and ensuring proper initialization
     */
    checkServiceHealth: () => {
        const registry = ImageServiceRegistry.getInstance();
        const requiredServices = [
            'PropertyImageUploadService',
            'PropertyImageValidationService',
            'PropertyImageWorkflowManager',
            'ImageMetadataService'
        ];

        const health: Record<string, boolean> = {};
        requiredServices.forEach(serviceName => {
            health[serviceName] = registry.has(serviceName);
        });
        return health;
    },

    /**
     * Get all registered service names
     * Helpful for introspection and debugging
     */
    getRegisteredServices: () => {
        const registry = ImageServiceRegistry.getInstance();
        return registry.getRegisteredServiceNames();
    }
};

// Default export for convenience
export default imageServices;