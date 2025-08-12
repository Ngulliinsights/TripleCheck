import React from 'react';

import type { 
  PropertyTypeConfig, 
  ResidentialProperty, 
  CommercialProperty, 
  LandProperty,
  ResidentialFilters,
  CommercialFilters,
  LandFilters,
  BasePropertyFilters,
  NormalizedProperty
} from '../types/property';
import { fetchMockProperties } from '../utils/mockPropertyApi';
import { 
  residentialPropertyAdapter, 
  commercialPropertyAdapter, 
  landPropertyAdapter,
  adaptivePropertyAdapter 
} from '../utils/propertyAdapters';

// Lazy load filter components
const ResidentialFilters = React.lazy(() => import('../components/property/filters/ResidentialFilters'));
const CommercialFilters = React.lazy(() => import('../components/property/filters/CommercialFilters'));
const LandFilters = React.lazy(() => import('../components/property/filters/LandFilters'));
const AllPropertiesFilters = React.lazy(() => import('../components/property/filters/AllPropertiesFilters'));

// Lazy load card components
const ResidentialPropertyCard = React.lazy(() => import('../../property/components/ListingCard'));
const CommercialPropertyCard = React.lazy(() => import('../../property/components/ListingCard'));
const LandPropertyCard = React.lazy(() => import('../../property/components/EnhancedLandCard'));
const AdaptivePropertyCard = React.lazy(() => import('../components/property/AdaptivePropertyCard'));


// Mock API fetcher functions (using mock data for demonstration)
async function fetchResidentialProperties(filters: ResidentialFilters, page: number, pageSize: number) {
  // Filter for residential properties only
  const residentialFilters = { ...filters, category: 'residential' as const };
  return fetchMockProperties(residentialFilters, page, pageSize);
}

async function fetchCommercialProperties(filters: CommercialFilters, page: number, pageSize: number) {
  // Filter for commercial properties only
  const commercialFilters = { ...filters, category: 'commercial' as const };
  return fetchMockProperties(commercialFilters, page, pageSize);
}

async function fetchLandProperties(filters: LandFilters, page: number, pageSize: number) {
  // Filter for land properties only
  const landFilters = { ...filters, category: 'land' as const };
  return fetchMockProperties(landFilters, page, pageSize);
}

async function fetchAllProperties(filters: BasePropertyFilters, page: number, pageSize: number) {
  // Fetch all property types
  return fetchMockProperties(filters, page, pageSize);
}

// Residential Properties Configuration
export const residentialPropertiesConfig: PropertyTypeConfig<ResidentialFilters, ResidentialProperty> = {
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
    furnished: undefined,
    petFriendly: undefined,
  },
  fetcher: fetchResidentialProperties,
  adapter: residentialPropertyAdapter,
  filterComponent: ResidentialFilters,
  cardComponent: ResidentialPropertyCard,
};

// Commercial Properties Configuration
export const commercialPropertiesConfig: PropertyTypeConfig<CommercialFilters, CommercialProperty> = {
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
  },
  fetcher: fetchCommercialProperties,
  adapter: commercialPropertyAdapter,
  filterComponent: CommercialFilters,
  cardComponent: CommercialPropertyCard,
};

// Land Properties Configuration
export const landPropertiesConfig: PropertyTypeConfig<LandFilters, LandProperty> = {
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
  adapter: landPropertyAdapter,
  filterComponent: LandFilters,
  cardComponent: LandPropertyCard,
};

// All Properties Configuration (mixed)
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
  adapter: adaptivePropertyAdapter,
  filterComponent: AllPropertiesFilters,
  cardComponent: AdaptivePropertyCard,
};

// Configuration registry for easy access
export const propertyTypeConfigs = {
  residential: residentialPropertiesConfig,
  commercial: commercialPropertiesConfig,
  land: landPropertiesConfig,
  all: allPropertiesConfig,
} as const;

// Helper function to get configuration by type
export function getPropertyTypeConfig(type: keyof typeof propertyTypeConfigs) {
  return propertyTypeConfigs[type];
}

// Helper function to get all available property types
export function getAvailablePropertyTypes() {
  return Object.keys(propertyTypeConfigs) as (keyof typeof propertyTypeConfigs)[];
}