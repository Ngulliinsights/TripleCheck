/**
 * Navigation Components Barrel Export
 * 
 * Navigation and routing components
 * 
 * This file provides a centralized export point for all
 * navigation components to improve import organization.
 * 
 * Usage:
 * import { ComponentName } from '@shared/components/navigation'
 */

// Standard named exports
export { BreadcrumbNavigation } from './BreadcrumbNavigation'
export { ContextualSidebar } from './ContextualSidebar'
export { Navigation, Navigation as EnhancedNavigation } from './Navigation' // Named export with backward compatibility
export { default as MobileNav } from './MobileNav'
// export { default as NavigationDebug } from './NavigationDebug' // File doesn't exist
export { default as NavigationErrorBoundary } from './NavigationErrorBoundary'
export { default as NavigationSearch } from './NavigationSearch'
export { default as SafeNavigation } from './SafeNavigation'
