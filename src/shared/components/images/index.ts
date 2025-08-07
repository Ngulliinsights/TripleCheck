/**
 * Image Components Index
 * Exports all image-related components
 */

export { default as PropertyImageVault } from './PropertyImageVault';
export { default as ImageGallery } from './ImageGallery';

// Re-export types for convenience
export type {
  PropertyImage,
  DocumentType,
  ProcessingStep,
  PropertyImageMetadata,
  ValidationResult,
  WorkflowStatus,
  UploadProgress,
} from '../../types/images';