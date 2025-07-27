// Export all shared hooks here

// Safe Effect and State Management Hooks
export { useSafeEffect, useSafeState, useStableCallback } from '../../infrastructure/hooks';

// Core Performance Hooks
export { 
  useSafeQuery,
  useSafePropertiesQuery,
  useSafePropertyQuery,
  useSafeUserQuery,
  useSafeTrustScoreQuery,
  useSafeMessagesQuery
} from './useSafeQuery';
export { useOptimisticMutation } from './useOptimisticMutation';
export { 
  useComponentTracking,
  useTrackedQuery,
  useTrackedMutation,
  useInteractionTracking,
  useTrackedEffect,
  useOperationDebug
} from './useOperationTracking';
export { useInfiniteScroll } from './useInfiniteScroll';
export { 
  useDebounce, 
  useDebouncedCallback,
  useDebounceSimple
} from './useDebounce';
export { useVirtualization } from './useVirtualization';

// Real-time Features
export { useWebSocket } from './useWebSocket';
export { usePolling } from './usePolling';

// Business Logic
export { useRecentPosts, useBlogPost, useBlogPosts } from './useCMS';
export { useFormValidation } from './useFormValidation';
export { useGeolocation } from './useGeolocation';
export { useFileUpload } from './useFileUpload';

// Re-export specific domain hooks for convenience
export {
  useInfinitePropertyScroll,
  useInfiniteMessageScroll,
  useInfiniteSearchScroll,
} from './useInfiniteScroll';

// Note: Specific debounced functions can be created using useDebouncedCallback

export {
  usePropertyListVirtualization,
  useMessageListVirtualization,
  useGridVirtualization,
  usePropertyGridVirtualization,
} from './useVirtualization';

export {
  useMessagingWebSocket,
  usePropertyUpdatesWebSocket,
  useNotificationsWebSocket,
} from './useWebSocket';

export {
  usePropertyUpdatesPolling,
  useMessagePolling,
  useNotificationsPolling,
  useTrustScorePolling,
  useSystemHealthPolling,
} from './usePolling';

export {
  usePropertyFormValidation,
  useUserRegistrationValidation,
} from './useFormValidation';

export {
  usePropertyLocation,
  useLocationBasedSearch,
  useGeocoding,
} from './useGeolocation';

export {
  usePropertyImageUpload,
  useDocumentUpload,
  useAvatarUpload,
} from './useFileUpload';