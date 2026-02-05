/**
 * Image Services - Modular Architecture
 * 
 * New modular approach that eliminates duplication while maintaining
 * clear service boundaries and testability.
 * 
 * Migration Guide:
 * - Use ImageServiceOrchestrator for complex workflows
 * - Use individual services for specific operations
 * - Services share common functionality through ImageServiceCore
 */

// Core architecture - these are the foundation services
export { ImageServiceCore, ImageServiceRegistry } from './core/ImageServiceCore'

// Orchestrator for complex workflows - the main coordinator
export {
    DefaultImageServiceOrchestrator,
    getImageServiceOrchestrator,
    createImageServiceOrchestrator
} from './ImageServiceOrchestrator'

// Specialized services - each handles a specific domain
export { PropertyImageUploadService } from './PropertyImageUploadService'
export { PropertyImageValidationService } from './PropertyImageValidationService'
export { PropertyImageWorkflowManager } from './PropertyImageWorkflowManager'
export { ImageMetadataService } from './ImageMetadataService'

// Legacy services (deprecated - use orchestrator instead)
// These remain for backward compatibility during migration
export { PropertyImageUploadCoordinator } from './PropertyImageUploadCoordinator'
export { UnifiedImageServiceFactory } from './UnifiedImageServiceFactory'

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

// Import the required dependencies for our convenience exports
// We need to import these separately to use them in the lazy evaluation functions
import { ImageServiceRegistry } from './core/ImageServiceCore'
import { getImageServiceOrchestrator as getOrchestratorFn } from './ImageServiceOrchestrator'

/**
 * Convenience exports for common use cases
 * 
 * These functions use lazy evaluation to ensure all dependencies are loaded
 * before attempting to use them. This prevents module resolution timing issues.
 */
export const imageServices = {
    /**
     * Get the orchestrator (recommended for most use cases)
     * The orchestrator coordinates between all services and handles complex workflows
     */
    getOrchestrator: () => getOrchestratorFn(),

    /**
     * Get individual services from registry
     * These functions provide direct access to specific services when you need
     * fine-grained control over a particular aspect of image processing
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

// Default export for convenience - provides the same interface as the named export
// This allows both `import imageServices from './images'` and `import { imageServices } from './images'`
export default imageServices;