/**
 * Image Components Index
 * Simplified exports with single source of truth
 */

// Component exports
export { default as ImageGallery } from './ImageGallery'
export { default as PropertyImageGallery } from './ImageGallery' // Alias for backward compatibility
export { default as PropertyImageVault } from './PropertyImageVault'

// Unified utilities and services
export { ImageUtils } from '../../utils/images/unified-utils'
export { UnifiedImageServiceFactory } from '../../services/images/UnifiedImageServiceFactory'

// Type exports
export type {
  UnifiedImage,
  CreateImageInput,
  ImageUpdate,
  ImageStatus,
  ApprovalStatus,
  DocumentType,
  WorkflowStatus,
} from '../../types/images/unified'

export type {
  PropertyImage,
  ProcessingStep,
  PropertyImageMetadata,
  ValidationResult,
  UploadProgress,
} from '../../types/images'

// Component-specific types
export type {
  BaseImage,
  GalleryImage,
  Props as ImageGalleryProps,
} from './ImageGallery'

// Preset configurations for common use cases
export const IMAGE_COMPONENT_PRESETS = {
  SIMPLE_VIEWER: {
    enableSearch: false,
    enableFullscreen: true,
    enableCollaboration: false,
    enableValidation: false,
    enableWatermark: false,
    userRole: 'viewer' as const,
    showImageCounter: true,
  },

  PROPERTY_GALLERY: {
    enableSearch: true,
    enableFullscreen: true,
    enableCollaboration: false,
    enableValidation: false,
    enableWatermark: false,
    userRole: 'viewer' as const,
    showImageCounter: true,
  },

  ENTERPRISE_GALLERY: {
    enableSearch: true,
    enableFullscreen: true,
    enableCollaboration: true,
    enableValidation: true,
    enableWatermark: true,
    userRole: 'editor' as const,
    showImageCounter: true,
  },
} as const;

// Service exports
export { PropertyImageUploadCoordinator } from '../../services/images/PropertyImageUploadCoordinator'
export { PropertyImageValidationService } from '../../services/images/PropertyImageValidationService'
export { PropertyImageWorkflowManager } from '../../services/images/PropertyImageWorkflowManager'
export { ImageMetadataService } from '../../services/images/ImageMetadataService'

// Hook exports
export { usePropertyImageUpload } from '../../hooks/images/usePropertyImageUpload'