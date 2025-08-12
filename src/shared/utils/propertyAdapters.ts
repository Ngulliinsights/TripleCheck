import type { 
  Property, 
  NormalizedProperty, 
  ResidentialProperty, 
  CommercialProperty, 
  LandProperty,
  PropertyAdapter 
} from '../types/property';

/**
 * Utility functions to convert legacy Property objects to normalized format
 * These adapters ensure type safety and consistent data structure across the application
 */

// Helper function to normalize location
function normalizeLocation(location: string | { address: string }): string {
  return typeof location === 'string' ? location : location.address;
}

// Helper function to normalize price
function normalizePrice(price: string | number): number {
  if (typeof price === 'number') return price;
  const parsed = parseFloat(price.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to normalize images
function normalizeImages(property: Property): string[] {
  return property.images || property.imageUrls || [];
}

// Helper function to determine property category
function determineCategory(property: Property): 'residential' | 'commercial' | 'land' {
  const type = property.type || property.propertyType || '';
  const title = property.title.toLowerCase();
  const description = property.description.toLowerCase();
  
  // Check for land indicators
  if (type.toLowerCase().includes('land') || 
      title.includes('land') || 
      title.includes('acre') || 
      description.includes('land')) {
    return 'land';
  }
  
  // Check for commercial indicators
  if (['office', 'retail', 'warehouse', 'industrial', 'commercial'].includes(type.toLowerCase()) ||
      title.includes('office') || 
      title.includes('commercial') || 
      title.includes('retail')) {
    return 'commercial';
  }
  
  // Default to residential
  return 'residential';
}

// Base adapter for converting Property to NormalizedProperty
export const basePropertyAdapter: PropertyAdapter<Property> = (property: Property): NormalizedProperty => {
  return {
    id: String(property.id),
    title: property.title,
    description: property.description,
    price: normalizePrice(property.price),
    location: normalizeLocation(property.location),
    images: normalizeImages(property),
    verified: property.verificationStatus === 'verified',
    type: property.type || property.propertyType || 'unknown',
    category: determineCategory(property),
    features: property.features || {},
    createdAt: property.createdAt ? new Date(property.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: property.updatedAt ? new Date(property.updatedAt).toISOString() : undefined,
    status: (property.status as any) || 'available',
    rating: property.aiVerificationResults?.overallScore,
    views: property.viewCount,
    trustScore: property.trustScore,
    verificationStatus: property.verificationStatus === 'draft' ? 'pending' : property.verificationStatus,
    owner: property.owner ? {
      id: property.owner.id,
      name: `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() || property.owner.username,
      email: property.owner.email,
      trustScore: property.owner.trustScore,
      isVerifiedAgent: property.owner.isVerifiedAgent,
    } : undefined,
    coordinates: property.coordinates,
  };
};

// Residential property adapter
export const residentialPropertyAdapter: PropertyAdapter<Property> = (property: Property): ResidentialProperty => {
  const base = basePropertyAdapter(property);
  
  return {
    ...base,
    category: 'residential',
    type: (property.type as ResidentialProperty['type']) || 'apartment',
    features: {
      bedrooms: property.bedrooms || property.features?.bedrooms || 0,
      bathrooms: property.bathrooms || property.features?.bathrooms || 0,
      squareFeet: property.size || property.features?.squareFeet || 0,
      parkingSpaces: property.features?.parkingSpaces,
      yearBuilt: property.features?.yearBuilt,
      amenities: property.amenities || property.features?.amenities || [],
      furnished: property.features?.furnished,
      petFriendly: property.features?.petFriendly,
      ...property.features,
    },
  };
};

// Commercial property adapter
export const commercialPropertyAdapter: PropertyAdapter<Property> = (property: Property): CommercialProperty => {
  const base = basePropertyAdapter(property);
  
  return {
    ...base,
    category: 'commercial',
    type: (property.type as CommercialProperty['type']) || 'office',
    features: {
      size: property.size || property.area || property.features?.squareFeet || 0,
      yearBuilt: property.features?.yearBuilt || new Date().getFullYear(),
      occupancyRate: property.features?.occupancyRate,
      roi: property.features?.roi,
      parkingSpaces: property.features?.parkingSpaces,
      floors: property.features?.floors,
      elevators: property.features?.elevators,
      airConditioning: property.features?.airConditioning,
      security: property.features?.security,
      loadingDock: property.features?.loadingDock,
      ...property.features,
    },
  };
};

// Land property adapter
export const landPropertyAdapter: PropertyAdapter<Property> = (property: Property): LandProperty => {
  const base = basePropertyAdapter(property);
  
  return {
    ...base,
    category: 'land',
    type: (property.type as LandProperty['type']) || 'residential',
    features: {
      size: property.features?.size || `${property.size || property.area || 0} sqm`,
      soilType: property.features?.soilType,
      waterAccess: property.features?.waterAccess,
      roadAccess: property.features?.roadAccess,
      electricityAccess: property.features?.electricityAccess,
      zoning: property.features?.zoning,
      developmentPotential: property.features?.developmentPotential,
      titleDeedStatus: property.features?.titleDeedStatus || 'available',
      topography: property.features?.topography,
      drainage: property.features?.drainage,
      ...property.features,
    },
  };
};

// Adaptive adapter that chooses the right adapter based on property category
export const adaptivePropertyAdapter: PropertyAdapter<Property> = (property: Property): NormalizedProperty => {
  const category = determineCategory(property);
  
  switch (category) {
    case 'residential':
      return residentialPropertyAdapter(property);
    case 'commercial':
      return commercialPropertyAdapter(property);
    case 'land':
      return landPropertyAdapter(property);
    default:
      return basePropertyAdapter(property);
  }
};

// Batch adapter for converting arrays of properties
export function adaptProperties<T>(
  properties: Property[], 
  adapter: PropertyAdapter<Property> = adaptivePropertyAdapter
): T[] {
  return properties.map(adapter) as T[];
}

// Type guard functions for property categories
export function isResidentialProperty(property: NormalizedProperty): property is ResidentialProperty {
  return property.category === 'residential';
}

export function isCommercialProperty(property: NormalizedProperty): property is CommercialProperty {
  return property.category === 'commercial';
}

export function isLandProperty(property: NormalizedProperty): property is LandProperty {
  return property.category === 'land';
}

// Validation function for normalized properties
export function validateNormalizedProperty(property: any): property is NormalizedProperty {
  return (
    typeof property === 'object' &&
    property !== null &&
    typeof property.id === 'string' &&
    typeof property.title === 'string' &&
    typeof property.description === 'string' &&
    typeof property.price === 'number' &&
    typeof property.location === 'string' &&
    Array.isArray(property.images) &&
    typeof property.verified === 'boolean' &&
    typeof property.type === 'string' &&
    ['residential', 'commercial', 'land'].includes(property.category) &&
    typeof property.features === 'object' &&
    typeof property.createdAt === 'string'
  );
}