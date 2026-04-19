/**
 * Image Services - Modular Architecture (Generic Shared)
 * 
 * Contains generic image service foundations that are not bound to any domain.
 */

// ============================================================================
// Core Architecture
// ============================================================================

// Core architecture - foundation services
export { ImageServiceCore, ImageServiceRegistry } from './core/ImageServiceCore'

// Specialized services - domain-agnostic generic services
export { ImageMetadataService } from './ImageMetadataService'

// Note: PropertyImageUploadService, PropertyImageValidationService, 
// PropertyImageWorkflowManager, and ImageServiceOrchestrator
// have been successfully migrated to the `property/services/images` domain.