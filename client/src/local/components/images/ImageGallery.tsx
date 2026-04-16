/**
 * Image Gallery - Main Export
 * 
 * This file now re-exports from the refactored modular gallery system.
 * The monolithic implementation has been split into maintainable modules:
 * 
 * - gallery/types.ts - Type definitions
 * - gallery/constants.ts - Configuration constants  
 * - gallery/utils.ts - Utility functions
 * - gallery/ValidationService.ts - Image validation logic
 * - gallery/useImageSearch.ts - Search and filtering hook
 * - gallery/LazyImage.tsx - Lazy loading component
 * - gallery/ImageGallery.tsx - Main component
 * - gallery/SimpleGallery.tsx - Basic gallery view
 * - gallery/AdvancedGallery.tsx - Feature-rich gallery view
 * 
 * For implementation details, see the gallery/ subdirectory.
 */

export * from "./gallery";
export { default } from "./gallery/ImageGallery";

// Backward compatibility
export { default as ImageGallery } from "./gallery/ImageGallery";
