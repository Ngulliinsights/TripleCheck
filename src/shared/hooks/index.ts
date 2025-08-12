/**
 * Shared Hooks Index
 * Exports all shared hooks for property management
 */

// Filter state management hooks
export { default as useFilterState } from './useFilterState';
export {
  useResidentialFilterState,
  useCommercialFilterState,
  useLandFilterState,
} from './useFilterState';

// Data fetching hooks
export { default as usePaginatedQuery } from './usePaginatedQuery';
export {
  useSimplePaginatedQuery,
  useResidentialPropertiesQuery,
  useCommercialPropertiesQuery,
  useLandPropertiesQuery,
  useAllPropertiesQuery,
  usePropertySearchQuery,
} from './usePaginatedQuery';

// Utility hooks (re-export existing ones)
export { useDebounce } from './useDebounce';
export { useInfiniteScroll } from './useInfiniteScroll';
export { useGeolocation } from './useGeolocation';
export { useWebSocket } from './useWebSocket';

// Property-specific hooks
export { useProperty } from '../../property/hooks/useProperty';
export { usePropertySearch } from '../../property/hooks/usePropertySearch';