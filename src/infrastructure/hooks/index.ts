// Safe effect and state management hooks
export { useSafeEffect } from './useSafeEffect'
export { useSafeState } from './useSafeState'
export { useStableCallback } from './useStableCallback'
export { useCoordinatedState, useCoordinatedMultiState } from './useCoordinatedState'
export { useCleanupManager, useEnhancedCleanupManager } from './useCleanupManager'

// Intersection observer hooks for lazy loading
export { 
  useIntersectionObserver, 
  useLazyImageLoading, 
  useViewportEntry,
  type IntersectionObserverOptions,
  type IntersectionObserverResult
} from './useIntersectionObserver'