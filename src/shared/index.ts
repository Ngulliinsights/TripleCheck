// Shared Exports
export * from './types';
export * from './utils/error-handling';

// UI Components
export * from './components/ui/button';
export * from './components/ui/card';
export * from './components/ui/input';
export * from './components/ui/badge';
export * from './components/ui/avatar';
export * from './components/ui/dialog';
export * from './components/ui/alert';
export * from './components/ui/skeleton';
export * from './components/ui/separator';
export * from './components/ui/label';
export { LoadingSkeleton } from './components/ui/loading-skeleton';
export * from './components/ui/loading-states';
// Image components - refactored architecture
export { default as PropertyImageVault } from './components/images/PropertyImageVault';
export { default as ImageGallery } from './components/images/ImageGallery';
export { default as PropertyImageGallery } from './components/images/ImageGallery';
export { PropertyImageValidationService } from './services/images/PropertyImageValidationService';
export { PropertyImageUploadService } from './services/images/PropertyImageUploadService';
// Legacy export for backward compatibility
export { PropertyImageUploadCoordinator } from './services/images/PropertyImageUploadCoordinator';
export { PropertyImageWorkflowManager } from './services/images/PropertyImageWorkflowManager';
export { Logo } from './components/ui/logo';

// Navigation Components
export { MobileNav } from './components/navigation/MobileNav';
export { EnhancedNavigation } from './components/navigation/EnhancedNavigation';

// Other Shared Components
export { NewsBlog } from './components/NewsBlog';
export { EnhancedTestimonials as Testimonials } from './components/Testimonials';
export { ServiceCategories } from './components/ServiceCategories';
export { TrustIndicators } from './components/TrustIndicators';
export { DemoLoginHelper } from './components/DemoLoginHelper';
export { QueryErrorBoundary } from './components/QueryErrorBoundary';
export { EnterpriseVirtualizedList, GridVirtualizedList } from './components/VirtualizedList';
export { Pagination } from './components/Pagination';

// Hooks
export { useDebounce } from './hooks/useDebounce';
export { 
  useComponentPerformance, 
  withPerformanceMonitor 
} from './hooks/useComponentPerformance';
export { usePropertyListVirtualization, usePropertyGridVirtualization } from './hooks/useMemoryOptimization';
export { usePageSpacing, useNavigationSpacing } from './hooks/useNavigationSpacing';
export { useSafePropertiesQuery, useSafeQuery } from './hooks/useSafeQuery';

// Property Management Hooks
export * from './hooks/useFilterState';
export * from './hooks/usePagination';

// Property Components
export * from './components/property';
export { PropertyDataGrid } from './components/property/PropertyDataGrid';
export { PropertySkeletonGrid, PropertyDetailsSkeleton } from './components/property/PropertySkeletonGrid';
export { ResidentialFilters, ResidentialFiltersComponent } from './components/property/filters/ResidentialFilters';
export { BasePropertyFiltersComponent as BasePropertyFilters } from './components/property/filters/BasePropertyFilters';
export { EnhancedPhotoManagementButton } from './components/property/PhotoManagementButton';

// Property Utilities
export * from './utils/property-mapper';
export { normalizeProperty } from './utils/property-mapper';


// Shared Pages
export { default as Home } from './pages/Home';
export { default as Features } from './pages/Features';
export { default as Pricing } from './pages/Pricing';
export { default as Resources } from './pages/Resources';
export { default as OurStory } from './pages/OurStory';
export { default as Partners } from './pages/Partners';
export { default as PressMedia } from './pages/PressMedia';
export { default as Blog } from './pages/Blog';
export { default as NotFound } from './pages/NotFound';