/**
 * Image Gallery Module
 * Barrel export for all gallery components and utilities
 */

export * from "./types";
export * from "./constants";
export * from "./utils";
export * from "./ValidationService";
export * from "./useImageSearch";
export * from "./LazyImage";
export * from "./ImageCard";
export * from "./ImageEngine";
export * from "./SearchInterface";
export * from "./BatchOperationsToolbar";
export * from "./Lightbox";
export * from "./SimpleGallery";
export * from "./AdvancedGallery";
export * from "./ImageShowcase";

// Re-export main component
export { default as ImageGallery } from "./ImageGallery";

// Backward compatibility
export { default as EnterpriseImageGallery } from "./ImageGallery";
