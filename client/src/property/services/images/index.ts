/**
 * Property Image Services - Central Export Index
 *
 * All image processing services for the property domain.
 * These are the canonical locations - local imports are maintained
 * for backward compatibility but should migrate to property domain over time.
 */

// Core service registry and base class
export { ImageServiceCore } from '../../local/services/images/core/ImageServiceCore'
export { ImageServiceRegistry } from '../../local/services/images/core/ImageServiceCore'

// Core services (unified implementations)
export { PropertyImageUploadService, propertyImageUploadService } from './PropertyImageUploadService'
export { PropertyImageValidationService, propertyImageValidationService } from './PropertyImageValidationService'
export {
  PropertyImageWorkflowManager,
  propertyImageWorkflowManager,
} from './PropertyImageWorkflowManager'
export {
  getImageServiceOrchestrator,
  resetImageServiceOrchestrator,
  createImageServiceOrchestrator,
} from './ImageServiceOrchestrator'
export type { DefaultImageServiceOrchestrator } from './ImageServiceOrchestrator'

// Configuration
export { IMAGE_SERVICE_CONFIG } from '../../local/config/image-system.config'

// Types
export * from '../../local/types/images'

// Utilities
export { ImageUtils } from '../../local/utils/images/unified-utils'
