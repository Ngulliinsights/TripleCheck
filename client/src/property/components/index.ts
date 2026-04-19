/**
 * Property Components Barrel Export
 * 
 * Property-related UI components
 * 
 * This file provides a centralized export point for all
 * property components to improve import organization.
 * 
 * Usage:
 * import { ComponentName } from '@property/components'
 */

// Custom exports
export { PropertyMap, PropertyMapEmbedded, PropertyMapPage } from './PropertyMap'

// Standard exports - using named exports
export { CompareBar } from './CompareBar'
export { CompareModal } from './CompareModal'
export { default as EnhancedLandCard, LandCard } from './LandCard'
export { PerformanceTestPanel } from './PerformanceTestPanel'
export { default as PropertyCardShowcase } from './PropertyCardShowcase'
export { PropertyListingWizard } from './PropertyListingWizard'
export { PropertyReviews } from './PropertyReviews'
export { PropertyTestComponent } from './PropertyTestComponent'

// Consolidated from local domain
export { PropertyCard } from './PropertyCard'
export { PropertyListingPage } from './PropertyListingPage'
export { PropertyDataGrid } from './PropertyDataGrid'
export { PropertySkeletonGrid } from './PropertySkeletonGrid'
export { PropertyArchitectureComparison } from './PropertyArchitectureComparison'
export { PhotoManagementButton } from './PhotoManagementButton'

// Shared components for property domain
export { PropertyImageSection } from './shared/PropertyImageSection'
export { PropertyFeatures } from './shared/PropertyFeatures'
export { QuickActionsOverlay } from './shared/QuickActionsOverlay'

// Filters
export { BasePropertyFiltersComponent as BasePropertyFilters } from './filters/BasePropertyFilters'
export { default as AllPropertiesFilters } from './filters/AllPropertiesFilters'
export { ResidentialFilters } from './filters/ResidentialFilters'
export { CommercialFilters } from './filters/CommercialFilters'
export { default as LandFilters } from './filters/LandFilters'
