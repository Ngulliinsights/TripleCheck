/**
 * Search Hooks Index
 * Consolidated exports with migration guidance
 */

// Primary search hook (recommended)
export { useSearch } from './useSearch';

// Legacy property search hook (deprecated)
export { usePropertySearch } from '../../property/hooks/usePropertySearch';
export { useConsolidatedPropertySearch } from '../../property/hooks/useConsolidatedPropertySearch';

/**
 * Migration Guide:
 * 
 * DEPRECATED HOOKS:
 * - usePropertySearch() -> Use useSearch() instead
 * - useConsolidatedPropertySearch() -> Use useSearch() instead
 * 
 * The useSearch() hook provides:
 * - Unified search functionality for all property types
 * - Better TypeScript support with consolidated types
 * - Improved performance with optimized caching
 * - Consistent API across all search use cases
 * 
 * Example migration:
 * 
 * OLD:
 * const { properties, filters, updateFilter } = usePropertySearch();
 * 
 * NEW:
 * const { searchResults, filters, updateFilter } = useSearch();
 * const properties = searchResults?.items || [];
 */

// Development warning for deprecated hooks
if (process.env.NODE_ENV === 'development') {
  console.warn(`
    🚨 DEPRECATION NOTICE: Search Hook Consolidation
    
    The following hooks are deprecated and will be removed in a future version:
    - usePropertySearch
    - useConsolidatedPropertySearch
    
    Please migrate to useSearch() for all search functionality.
    See migration guide in src/search/hooks/index.ts
  `);
}