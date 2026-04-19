import { LandCard } from '../components/LandCard'
import AllPropertiesFiltersComponent from '../components/filters/AllPropertiesFilters'
import CommercialFiltersComponent from '../components/filters/CommercialFilters'
import LandFiltersComponent from '../components/filters/LandFilters'
import { ResidentialFilters as ResidentialFiltersComponent } from '../components/filters/ResidentialFilters'
import { PropertyCard, AdaptivePropertyCard } from '../components/PropertyCard'
import type {
  PropertyTypeConfig,
  ResidentialProperty,
  CommercialProperty,
  LandProperty,
  ResidentialFilters,
  CommercialFilters,
  LandFilters,
  BasePropertyFilters,
  NormalizedProperty,
} from '@shared/types/property'
import {
  residentialPropertyAdapter,
  commercialPropertyAdapter,
  landPropertyAdapter,
} from '../utils/propertyAdapters'
import { fetchMockProperties } from '../../local/utils/mockPropertyApi'

// ---------------------------------------------------------------------------
// Dev logger
// ---------------------------------------------------------------------------

function devLog(label: string, data: object): void {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(label, data)
  }
}

// ---------------------------------------------------------------------------
// Fetch factory
// ---------------------------------------------------------------------------

type PropertyCategory = 'residential' | 'commercial' | 'land'

type AdapterFn<T> = (item: unknown) => T

function createPropertyFetcher<TFilter extends BasePropertyFilters, TItem>(
  emoji: string,
  category: PropertyCategory,
  adapter: AdapterFn<TItem>,
) {
  return async (filters: TFilter, page: number, pageSize: number) => {
    const label = `${emoji} fetch${capitalize(category)}Properties`
    devLog(`${label} called with:`, { filters, page, pageSize })

    const result = await fetchMockProperties({ ...filters, category }, page, pageSize)
    const items = result.items.map(adapter)

    devLog(`${label} result:`, { itemsCount: items.length, totalCount: result.totalCount })

    return {
      items,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    }
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ---------------------------------------------------------------------------
// Property type configurations
// ---------------------------------------------------------------------------

export const residentialConfig: PropertyTypeConfig<ResidentialFilters, NormalizedProperty> = {
  title: 'Residential Properties',
  description: 'Find your perfect home from apartments, houses, and more',
  queryKey: ['properties', 'residential'],
  defaultFilters: {
    query: '',
    location: '',
    priceMin: null,
    priceMax: null,
    verified: false,
    category: 'residential',
    bedrooms: null,
    bathrooms: null,
    propertyType: '',
    amenities: [],
    furnished: false,
    petFriendly: false,
  },
  fetcher: createPropertyFetcher<ResidentialFilters, NormalizedProperty>(
    '🏘️',
    'residential',
    (item) => residentialPropertyAdapter(item as Parameters<typeof residentialPropertyAdapter>[0]),
  ),
  adapter: (item) => residentialPropertyAdapter(item as Parameters<typeof residentialPropertyAdapter>[0]),
  filterComponent: ResidentialFiltersComponent,
  cardComponent: PropertyCard,
}

export const commercialConfig: PropertyTypeConfig<CommercialFilters, NormalizedProperty> = {
  title: 'Commercial Properties',
  description: 'Discover office spaces, retail locations, and investment opportunities',
  queryKey: ['properties', 'commercial'],
  defaultFilters: {
    query: '',
    location: '',
    priceMin: null,
    priceMax: null,
    verified: false,
    category: 'commercial',
    propertyType: '',
    sizeMin: null,
    sizeMax: null,
    yearBuiltMin: null,
    roiMin: null,
    floorsMin: null,
    floorsMax: null,
    parking: false,
    elevator: false,
    airConditioning: false,
    security: false,
    wifi: false,
    generator: false,
  },
  fetcher: createPropertyFetcher<CommercialFilters, NormalizedProperty>(
    '🏢',
    'commercial',
    (item) => commercialPropertyAdapter(item as Parameters<typeof commercialPropertyAdapter>[0]),
  ),
  adapter: (item) => commercialPropertyAdapter(item as Parameters<typeof commercialPropertyAdapter>[0]),
  filterComponent: CommercialFiltersComponent,
  cardComponent: PropertyCard,
}

export const landConfig: PropertyTypeConfig<LandFilters, NormalizedProperty> = {
  title: 'Land Properties',
  description: 'Verified land with comprehensive verification and documentation',
  queryKey: ['properties', 'land'],
  defaultFilters: {
    query: '',
    location: '',
    priceMin: null,
    priceMax: null,
    verified: false,
    category: 'land',
    landType: '',
    sizeMin: null,
    sizeMax: null,
    waterAccess: false,
    roadAccess: false,
    electricityAccess: false,
  },
  fetcher: createPropertyFetcher<LandFilters, NormalizedProperty>(
    '🏞️',
    'land',
    (item) => landPropertyAdapter(item as Parameters<typeof landPropertyAdapter>[0]),
  ),
  adapter: (item) => landPropertyAdapter(item as Parameters<typeof landPropertyAdapter>[0]),
  filterComponent: LandFiltersComponent,
  cardComponent: LandCard,
}

export const allPropertiesConfig: PropertyTypeConfig<BasePropertyFilters, NormalizedProperty> = {
  title: 'All Properties',
  description: 'Browse all verified properties across Kenya',
  queryKey: ['properties', 'all'],
  defaultFilters: {
    query: '',
    location: '',
    priceMin: null,
    priceMax: null,
    verified: false,
    category: null,
  },
  fetcher: async (filters: BasePropertyFilters, page: number, pageSize: number) => {
    devLog('🏠 fetchAllProperties called with:', { filters, page, pageSize })

    const result = await fetchMockProperties(filters, page, pageSize)

    devLog('🏠 fetchAllProperties result:', {
      itemsCount: result.items.length,
      totalCount: result.totalCount,
    })

    return {
      items: result.items.map(item => residentialPropertyAdapter(item as unknown as Parameters<typeof residentialPropertyAdapter>[0])),
      totalCount: result.totalCount,
      totalPages: result.totalPages,
    }
  },
  adapter: (item) => item as NormalizedProperty,
  filterComponent: AllPropertiesFiltersComponent,
  cardComponent: AdaptivePropertyCard,
}

// ---------------------------------------------------------------------------
// Registry & utilities
// ---------------------------------------------------------------------------

export const propertyTypeConfigs = {
  residential: residentialConfig,
  commercial: commercialConfig,
  land: landConfig,
  all: allPropertiesConfig,
} as const

export type PropertyTypeKey = keyof typeof propertyTypeConfigs

export function getPropertyTypeConfig<T extends PropertyTypeKey>(
  type: T,
): (typeof propertyTypeConfigs)[T] {
  const config = propertyTypeConfigs[type]
  if (!config) throw new Error(`Invalid property type: ${type}`)
  return config
}

export function isValidPropertyType(type: string): type is PropertyTypeKey {
  return type in propertyTypeConfigs
}

export function getAvailablePropertyTypes(): PropertyTypeKey[] {
  return Object.keys(propertyTypeConfigs) as PropertyTypeKey[]
}