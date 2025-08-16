/**
 * Shared Hooks Index
 * Exports all shared hooks for property management
 */

// Hook consolidation utilities
export {
  showDeprecationWarning,
  createCompatibilityWrapper,
  hookRegistry,
  checkDeprecatedHookUsage,
  type DeprecationOptions,
  type HookRegistryEntry,
} from './utils/deprecation';

export {
  migrationMappings,
  getMigrationMapping,
  analyzeProject,
  formConfigPresets,
  getFormConfigPreset,
  type MigrationMapping,
  type MigrationReport,
} from './utils/migration';

export {
  initHookConsolidation,
  useDevWarning,
} from './utils/init';

// Core hooks
export { 
  useFormValidation,
  useForm
} from './useFormValidation';
export { 
  useSafeQuery, 
  useSafePropertiesQuery, 
  useSafePropertyQuery, 
  useSafeOwnerPropertiesQuery,
  useSafePropertyActionsQuery,
  useSafePropertySearchQuery,
  useSafeUserQuery,
  useSafeTrustScoreQuery,
  useSafeMessagesQuery
} from './useSafeQuery';

// Configuration-based hooks
export {
  useConfigurableHook,
  createDataFetchingHook,
  createFormValidationHook,
  createUIInteractionHook,
  createPerformanceHook,
  useMultiConfigHook,
  useComposedHooks,
  usePresetConfiguration,
  useConfigurationTester
} from './useConfigurableHook';

// Configuration modules
export * from './configs/formValidationConfigs';
export * from './configs/hookConfigs';
export * from './presets/commonHookPresets';

// UI hooks
export { useAccessibility, useKeyboardNavigation, SkipLink } from './useAccessibility';
export { useFileUpload } from './useFileUpload';

// Performance hooks
export { 
  useComponentPerformance, 
  withPerformanceMonitor 
} from './useComponentPerformance';
export {
  useVirtualization,
  useLazyImage,
  useMemorySafeState,
  useDebouncedState,
  useIntersectionObserver,
  useMemoryMonitor,
  useOptimizedArray,
  useCleanup,
} from './useMemoryOptimization';

// Filter state management hooks
export { default as useFilterState } from './useFilterState';
export {
  useResidentialFilterState,
  useCommercialFilterState,
  useLandFilterState,
} from './useFilterState';

// Unified pagination hooks
export { 
  usePagination,
  useResidentialPropertiesQuery,
  useCommercialPropertiesQuery,
  useLandPropertiesQuery,
  useAllPropertiesQuery,
  usePropertySearchQuery,
} from './usePagination';

// Utility hooks
export { useDebounce } from './useDebounce';
export { useGeolocation } from './useGeolocation';
export { useWebSocket } from './useWebSocket';

// Property card shared hooks
export { 
  useImageGallery,
  type UseImageGalleryOptions,
  type UseImageGalleryReturn,
  type GalleryImage
} from './useImageGallery';
export { 
  usePropertyCardActions,
  type PropertyActionCallbacks,
  type UsePropertyCardActionsReturn
} from './usePropertyCardActions';
export { 
  usePropertyFormatting,
  type FormattedPrice,
  type UsePropertyFormattingReturn
} from './usePropertyFormatting';
export { 
  usePropertyCompareActions,
  type UsePropertyCompareActionsOptions,
  type UsePropertyCompareActionsReturn
} from './usePropertyCompareActions';
export { 
  usePropertyCardState,
  type UsePropertyCardStateReturn
} from './usePropertyCardState';

// Property-specific hooks (deprecated - use useSafeQuery instead)
// export { usePropertySearch } from './usePropertySearch';