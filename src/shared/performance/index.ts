/**
 * Performance Optimization Framework Index
 * Exports all performance-related services, hooks, and components
 */

// Services
export { default as cacheService } from '../services/CacheService';
export { default as performanceService } from '../services/PerformanceService';

// Hooks
export {
  useCache,
  useLazyLoading,
  useDebounce,
  useThrottle,
  usePerformanceMonitoring,
  useExpensiveMemo,
  useVirtualScrolling,
  usePreloader
} from '../hooks/usePerformanceOptimization';

// Components
export {
  LazyImage,
  LazyComponent,
  VirtualizedList,
  LazyRoute,
  InfiniteScroll,
  ProgressiveImage
} from '../components/LazyComponents';

// Types
export type {
  CacheEntry,
  CacheConfig,
  CacheStats
} from '../services/CacheService';

export type {
  PerformanceMetric,
  PerformanceReport,
  ResourceTiming
} from '../services/PerformanceService';