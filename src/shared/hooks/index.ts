// Export all shared hooks here

// Core Performance Hooks
export { useSafeQuery } from './useSafeQuery';
export { useOptimisticMutation } from './useOptimisticMutation';
export { useInfiniteScroll } from './useInfiniteScroll';
export { 
  useDebounce, 
  useDebouncedCallback,
  useDebouncedValue, 
  useDebouncedValueSimple,
  useDebouncedSearch 
} from './useDebounce';
export { useVirtualization } from './useVirtualization';

// Real-time Features
export { useWebSocket } from './useWebSocket';
export { usePolling } from './usePolling';

// Business Logic
export { useFormValidation } from './useFormValidation';
export { useGeolocation } from './useGeolocation';
export { useFileUpload } from './useFileUpload';

// Re-export specific domain hooks for convenience
export {
  useInfinitePropertyScroll,
  useInfiniteMessageScroll,
  useInfiniteSearchScroll,
} from './useInfiniteScroll';

export {
  useDebouncedPropertySearch,
  useDebouncedUserSearch,
  useDebouncedApiCall,
} from './useDebounce';

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