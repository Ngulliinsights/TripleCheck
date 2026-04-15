import { LandCard } from '../../property/components/LandCard'
import AllPropertiesFiltersComponent from '../components/property/filters/AllPropertiesFilters'
import CommercialFiltersComponent from '../components/property/filters/CommercialFilters'
import LandFiltersComponent from '../components/property/filters/LandFilters'
import { ResidentialFilters as ResidentialFiltersComponent } from '../components/property/filters/ResidentialFilters'
import { PropertyCard, AdaptivePropertyCard } from '../components/property/PropertyCard'
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
} from '../types/property'
// Mock properties functionality moved to property module
import {
  residentialPropertyAdapter,
  commercialPropertyAdapter,
  landPropertyAdapter
} from '../utils/propertyAdapters'
import { fetchMockProperties } from '../utils/mockPropertyApi'

// Simple fetcher functions
async function fetchResidentialProperties(
  filters: ResidentialFilters,
  page: number,
  pageSize: number
) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏘️ fetchResidentialProperties called with:", { filters, page, pageSize });
  }
  const result = await fetchMockProperties({ ...filters, category: 'residential' }, page, pageSize);
  const items = result.items.map(item => residentialPropertyAdapter(item) as ResidentialProperty);
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏘️ fetchResidentialProperties result:", { itemsCount: items.length, totalCount: result.totalCount });
  }
  return {
    items,
    totalCount: result.totalCount,
    totalPages: result.totalPages,
  };
}

async function fetchCommercialProperties(
  filters: CommercialFilters,
  page: number,
  pageSize: number
) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏢 fetchCommercialProperties called with:", { filters, page, pageSize });
  }
  const result = await fetchMockProperties({ ...filters, category: 'commercial' }, page, pageSize);
  const items = result.items.map(item => commercialPropertyAdapter(item) as CommercialProperty);
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏢 fetchCommercialProperties result:", { itemsCount: items.length, totalCount: result.totalCount });
  }
  return {
    items,
    totalCount: result.totalCount,
    totalPages: result.totalPages,
  };
}

async function fetchLandProperties(
  filters: LandFilters,
  page: number,
  pageSize: number
) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏞️ fetchLandProperties called with:", { filters, page, pageSize });
  }
  const result = await fetchMockProperties({ ...filters, category: 'land' }, page, pageSize);
  const items = result.items.map(item => landPropertyAdapter(item) as LandProperty);
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏞️ fetchLandProperties result:", { itemsCount: items.length, totalCount: result.totalCount });
  }
  return {
    items,
    totalCount: result.totalCount,
    totalPages: result.totalPages,
  };
}

async function fetchAllProperties(
  filters: BasePropertyFilters,
  page: number,
  pageSize: number
) {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏠 fetchAllProperties called with:", { filters, page, pageSize });
  }
  const result = await fetchMockProperties(filters, page, pageSize);
  const items = result.items.map(item => residentialPropertyAdapter(item));
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏠 fetchAllProperties result:", { itemsCount: items.length, totalCount: result.totalCount });
  }
  return {
    items,
    totalCount: result.totalCount,
    totalPages: result.totalPages,
  };
}

// Simple adapter functions
const residentialAdapter = (item: ResidentialProperty): NormalizedProperty => {
  return residentialPropertyAdapter(item as unknown as Parameters<typeof residentialPropertyAdapter>[0]);
};

const commercialAdapter = (item: CommercialProperty): NormalizedProperty => {
  return commercialPropertyAdapter(item as unknown as Parameters<typeof commercialPropertyAdapter>[0]);
};

const landAdapter = (item: LandProperty): NormalizedProperty => {
  return landPropertyAdapter(item as unknown as Parameters<typeof landPropertyAdapter>[0]);
};

// Property type configurations
export const residentialConfig: PropertyTypeConfig<ResidentialFilters, ResidentialProperty> = {
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
  fetcher: fetchResidentialProperties,
  adapter: residentialAdapter,
  filterComponent: ResidentialFiltersComponent,
  cardComponent: PropertyCard,
};

export const commercialConfig: PropertyTypeConfig<CommercialFilters, CommercialProperty> = {
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
    commercialType: '',
    businessZone: '',
    areaMin: '',
    areaMax: '',
    floorsMin: '',
    floorsMax: '',
    parking: false,
    elevator: false,
    airConditioning: false,
    security: false,
    wifi: false,
    generator: false,
  },
  fetcher: fetchCommercialProperties,
  adapter: commercialAdapter,
  filterComponent: CommercialFiltersComponent,
  cardComponent: PropertyCard,
};

export const landConfig: PropertyTypeConfig<LandFilters, LandProperty> = {
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
    sizeMin: '',
    sizeMax: '',
    waterAccess: false,
    roadAccess: false,
    electricityAccess: false,
  },
  fetcher: fetchLandProperties,
  adapter: landAdapter,
  filterComponent: LandFiltersComponent,
  cardComponent: EnhancedLandCard,
};

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
  fetcher: fetchAllProperties,
  adapter: (item: NormalizedProperty) => item,
  filterComponent: AllPropertiesFiltersComponent,
  cardComponent: AdaptivePropertyCard,
};

// Configuration registry
export const propertyTypeConfigs = {
  residential: residentialConfig,
  commercial: commercialConfig,
  land: landConfig,
  all: allPropertiesConfig,
} as const;

export type PropertyTypeKey = keyof typeof propertyTypeConfigs;

// Utility functions
export function getPropertyTypeConfig<T extends PropertyTypeKey>(type: T): typeof propertyTypeConfigs[T] {
  switch (type) {
    case 'residential':
      return propertyTypeConfigs.residential as typeof propertyTypeConfigs[T];
    case 'commercial':
      return propertyTypeConfigs.commercial as typeof propertyTypeConfigs[T];
    case 'land':
      return propertyTypeConfigs.land as typeof propertyTypeConfigs[T];
    case 'all':
      return propertyTypeConfigs.all as typeof propertyTypeConfigs[T];
    default:
      throw new Error(`Invalid property type: ${type}`);
  }
}

export function isValidPropertyType(type: string): type is PropertyTypeKey {
  return ['residential', 'commercial', 'land', 'all'].includes(type as PropertyTypeKey);
}

export function getAvailablePropertyTypes(): PropertyTypeKey[] {
  return ['residential', 'commercial', 'land', 'all'];
}