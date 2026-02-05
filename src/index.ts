/**
 * Main Application Barrel Export
 * 
 * Central export point for the entire application.
 * This provides organized access to all major modules and components.
 * 
 * Usage:
 * import { PropertyCard, useAuth, SearchBar } from '@/src'
 */

// Property Module
export * from './property/components'
export * from './property/hooks'
export * from './property/services'

// Shared Module
export * from './shared/components/ui'
export * from './shared/components/layout'
export * from './shared/components/navigation'
export * from './shared/hooks'
export * from './shared/utils'
export * from './shared/services'

// User Module
export * from './user/components'
export * from './user/hooks'

// Search Module
export * from './search/components'
export * from './search/hooks'

// Auth Module
export * from './auth/components'
export * from './auth/hooks'

// Re-export commonly used types and interfaces
export type { Property } from './property/types'
export type { User } from './user/types'
export type { SearchFilters } from './search/types'