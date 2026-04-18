// Property Domain Exports
export * from './types/property.types'
// New consolidated hooks
export * from './hooks/useProperty'

// Legacy hooks (deprecated - use consolidated hooks above)
export * from './hooks/useLandProperty'

// Services - Unified PropertyApi
export * from './services/property-api'

// Contexts - Unified PropertyContext with comparison functionality
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

// Components
export { PropertyMap } from './components/PropertyMap'
export { PropertyReviews } from './components/PropertyReviews'
export { PropertyCard } from '../local/components/property/PropertyCard'
export { default as EnhancedLandCard } from './components/LandCard'

// Utilities
// Image utilities moved to shared/components/images/ for better reusability

// Pages
export { default as PropertyDetails } from './pages/PropertyDetails'
export { default as PropertyEdit } from './pages/PropertyEdit'
export { default as PropertyCompare } from './pages/PropertyCompare'
export { default as PropertyPhotos } from './pages/PropertyPhotos'
export { default as PropertyOptimize } from './pages/PropertyOptimize'
// export { default as PropertyMap } from './pages/PropertyMap' // File doesn't exist
export { default as ListProperty } from './pages/ListProperty'