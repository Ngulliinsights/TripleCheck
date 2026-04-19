// Property Domain Exports

// ===== TYPES & CONFIG =====
export * from './types'
export * from './config'

// ===== HOOKS =====
// Master unified hooks
export * from './hooks/useProperty'
export * from './hooks/useLandProperty'

// ===== SERVICES =====
export * from './services/property-api'

// ===== CONTEXTS =====
export {
  PropertyProvider,
  usePropertyContext,
  usePropertyState,
  usePropertyActions,
  usePropertyFilters,
  useFavorites,
  usePropertyCompare,
  usePropertyCompareActions,
  usePropertyCompareAnalysis,
  usePropertyCompareState,
  type PropertyFilters
} from './contexts'

// ===== COMPONENTS =====
// Main feature components
export { PropertyMap } from './components/PropertyMap'
export { PropertyReviews } from './components/PropertyReviews'
export { PropertyCard } from './components/PropertyCard'
export { default as EnhancedLandCard } from './components/LandCard'

// ===== UTILITIES =====
export * from './utils'

// ===== PAGES =====
export { default as PropertyDetails } from './pages/PropertyDetails'
export { default as PropertyEdit } from './pages/PropertyEdit'
export { default as PropertyCompare } from './pages/PropertyCompare'
export { default as PropertyPhotos } from './pages/PropertyPhotos'
export { default as PropertyOptimize } from './pages/PropertyOptimize'
export { default as ListProperty } from './pages/ListProperty'