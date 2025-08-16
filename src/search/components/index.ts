/**
 * Search Components Index
 * Consolidated exports with deprecation notices
 */

// New consolidated component (recommended)
export { default as ConsolidatedSearch } from './ConsolidatedSearch';

// Legacy components (deprecated - use ConsolidatedSearch instead)
export { default as SearchBar } from './SearchBar';
export { default as SearchFilters } from './SearchFilters';

// Re-export for backward compatibility
export { ConsolidatedSearch as UnifiedSearch };

/**
 * Migration Guide:
 * 
 * OLD:
 * import { SearchBar, SearchFilters } from './components';
 * 
 * NEW:
 * import { ConsolidatedSearch } from './components';
 * 
 * The ConsolidatedSearch component combines the functionality of:
 * - SearchBar: Basic search input and quick filters
 * - SearchFilters: Advanced filtering options
 * - Search state management and results handling
 * 
 * Benefits:
 * - Eliminates code duplication
 * - Unified state management
 * - Better performance through reduced re-renders
 * - Consistent UI/UX across search interfaces
 */