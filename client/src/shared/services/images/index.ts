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
// Backward Compatibility Adapters (Removed)
// ============================================================================

// Legacy adapters have been removed. Use ImageServiceOrchestrator directly.
// Migration guide: docs/service-consolidation-plan.md

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