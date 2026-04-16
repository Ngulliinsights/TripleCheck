/**
 * Search Module Index
 * Consolidated exports for the search functionality
 */

// Components
export { default as ConsolidatedSearch } from './components/ConsolidatedSearch'
export { default as SearchResults } from './pages/SearchResults'

// Legacy components (deprecated)
export { default as SearchBar } from './components/SearchBar'
export { default as SearchFilters } from './components/SearchFilters'

// Hooks
export { useSearch } from './hooks/useSearch'

// Types (re-exported from shared)
export type {
  PropertySearchFilters,
  SearchOptions,
  SearchResult,
  SearchSuggestion,
  LocationSuggestion,
  SearchBarFilters,
  SortOption
} from '../local/types/search'

// Services
export { searchService } from '../local/services/SearchService'

/**
 * Recommended Usage:
 * 
 * For new implementations:
 * import { ConsolidatedSearch, useSearch } from '@/search'
 * 
 * For search results pages:
 * import { SearchResults } from '@/search'
 * 
 * For custom search implementations:
 * import { useSearch, searchService } from '@/search'
 * import type { PropertySearchFilters } from '@/search'
 */