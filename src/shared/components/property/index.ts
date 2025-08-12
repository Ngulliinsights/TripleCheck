/**
 * Shared Property Components Index
 * Exports all shared property-related components and utilities
 */

// Core property components
export { default as PropertyDataGrid } from './PropertyDataGrid';
export { default as PropertySkeletonGrid } from './PropertySkeletonGrid';
export { default as PhotoManagementButton } from './PhotoManagementButton';

// Specialized skeleton components
export {
  ResidentialPropertySkeleton,
  CommercialPropertySkeleton,
  LandPropertySkeleton,
  PropertyDetailsSkeleton,
} from './PropertySkeletonGrid';

// Enhanced photo management components
export {
  EnhancedPhotoManagementButton,
  CompactPhotoManagementButton,
  LandPhotoManagementButton,
  ResidentialPhotoManagementButton,
  CommercialPhotoManagementButton,
} from './PhotoManagementButton';

// Filter components
export * from './filters';

// Re-export types for convenience
export type { NormalizedProperty } from '../../utils/property-mapper';