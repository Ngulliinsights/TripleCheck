// Shared Exports
export * from './types'
export * from './error-handling'

// UI Components
export * from './components/ui/button'
export * from './components/ui/card'
export * from './components/ui/input'
export * from './components/ui/badge'
export * from './components/ui/avatar'
export * from './components/ui/dialog'
export * from './components/ui/alert'
export * from './components/ui/skeleton'
export * from './components/ui/separator'
export * from './components/ui/label'
export { LoadingSkeleton } from './components/ui/loading-skeleton'
export * from './components/ui/loading-states'
// Image components - refactored architecture
export { ImageGallery, PropertyImageGallery } from './components/images'
export { Logo } from './components/ui/logo'

// Navigation Components
export { MobileNav } from './components/navigation/MobileNav'
export { Navigation } from './components/navigation/Navigation'
export { Navigation as EnhancedNavigation } from './components/navigation/Navigation' // Backward compatibility

// Other Shared Components
export { NewsBlog } from './components/NewsBlog'
export { Testimonials } from './components/Testimonials'
export { Testimonials as EnhancedTestimonials } from './components/Testimonials' // Backward compatibility
export { ServiceCategories } from './components/ServiceCategories'
export { TrustIndicators } from './components/TrustIndicators'
export { DemoLoginHelper } from './components/DemoLoginHelper'
export { QueryErrorBoundary } from './components/QueryErrorBoundary'
export { EnterpriseVirtualizedList, GridVirtualizedList } from './components/VirtualizedList'
export { Pagination } from './components/Pagination'

// Hooks
export { useDebounce } from './hooks/useDebounce'
export { 
  useComponentPerformance, 
  withPerformanceMonitor 
} from './hooks/useComponentPerformance'
export { usePropertyListVirtualization, usePropertyGridVirtualization } from './hooks/useMemoryOptimization'
export { usePageSpacing, useNavigationSpacing } from './hooks/useNavigationSpacing'
export { useSafePropertiesQuery, useSafeQuery } from './hooks/useSafeQuery'

// Property Management Hooks
export * from './hooks/useFilterState'
export * from './hooks/usePagination'

// Property Components - moved to property domain
// Import from property domain instead
export { PropertyCard } from '../property/components/PropertyCard'
export { PropertyListingPage } from '../property/components/PropertyListingPage'
export { PropertyImageSection, QuickActionsOverlay } from '../property/components/shared'
export { PropertyDataGrid } from '../property/components/PropertyDataGrid'
export { PropertySkeletonGrid } from '../property/components/PropertySkeletonGrid'

// Property Utilities - moved to property domain
// Property adapters and mappers should be imported from property domain


// Shared Pages
export { default as Home } from './pages/Home'
export { default as Features } from './pages/Features'
export { default as Pricing } from './pages/Pricing'
export { default as Resources } from './pages/Resources'
export { default as OurStory } from './pages/OurStory'
export { default as Partners } from './pages/Partners'
export { default as PressMedia } from './pages/PressMedia'
export { default as Blog } from './pages/Blog'
export { default as NotFound } from './pages/NotFound'