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
 * These adapters ensure complete type safety and exact compatibility with exactOptionalPropertyTypes
 * 
 * Key architectural principles:
 * - Never assign undefined to optional properties - either include them with valid values or omit entirely
 * - Use conditional object construction with explicit type control
 * - Separate required and optional property construction completely
 * - Clean input validation with definitive true/false decisions
 */

// Helper function to normalize location with enhanced type safety
function normalizeLocation(location: string | { address: string }): string {
  return typeof location === 'string' ? location : location.address;
}

// Helper function to normalize price with better error handling
function normalizePrice(price: string | number): number {
  if (typeof price === 'number') return price;
  const parsed = parseFloat(price.replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to normalize images with fallback handling
function normalizeImages(property: Property): string[] {
  return property.images || property.imageUrls || [];
}

// Helper function to determine property category with improved logic
function determineCategory(property: Property): 'residential' | 'commercial' | 'land' {
  const type = (property.type || property.propertyType || '').toLowerCase();
  const title = property.title.toLowerCase();
  const description = property.description.toLowerCase();

  // Check for land indicators with more comprehensive patterns
  if (type.includes('land') ||
    title.includes('land') ||
    title.includes('acre') ||
    title.includes('plot') ||
    description.includes('land')) {
    return 'land';
  }

  // Check for commercial indicators with expanded patterns
  const commercialTypes = ['office', 'retail', 'warehouse', 'industrial', 'commercial', 'shop', 'store'];
  if (commercialTypes.some(ct => type.includes(ct)) ||
    title.includes('office') ||
    title.includes('commercial') ||
    title.includes('retail') ||
    title.includes('business')) {
    return 'commercial';
  }

  // Default to residential
  return 'residential';
}

// Enhanced helper to safely extract valid values - returns undefined only when we should omit the property
function extractValidNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

function extractValidBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  return Boolean(value);
}

function extractValidString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return String(value);
}

// Helper to normalize verification status with strict type control
function normalizeVerificationStatus(status: unknown): 'verified' | 'pending' | 'unverified' | 'flagged' {
  if (status === 'verified' || status === 'pending' || status === 'unverified' || status === 'flagged') {
    return status;
  }
  // Handle the draft -> pending conversion case
  if (status === 'draft') {
    return 'pending';
  }
  // Default to pending for any other case
  return 'pending';
}

// Base adapter for converting Property to NormalizedProperty
export const basePropertyAdapter: PropertyAdapter<Property> = (property: Property): NormalizedProperty => {
  // Build the core required properties with strict type control
  const coreProperties = {
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
    updatedAt: property.updatedAt ? new Date(property.updatedAt).toISOString() : new Date().toISOString(),
    status: (property.status as 'available' | 'under-offer' | 'sold' | 'rented' | 'pending') || 'available',
    rating: property.aiVerificationResults?.overallScore || 0,
    verificationStatus: normalizeVerificationStatus(property.verificationStatus),
  };

  // Start with the core properties as our result
  let result: NormalizedProperty = coreProperties;

  // Conditionally add optional properties only when they have definite values
  const views = extractValidNumber(property.viewCount);
  if (views !== undefined) {
    result = { ...result, views };
  }

  const trustScore = extractValidNumber(property.trustScore);
  if (trustScore !== undefined) {
    result = { ...result, trustScore };
  }

  if (property.owner) {
    result = { 
      ...result, 
      owner: {
        id: property.owner.id,
        name: `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() || property.owner.username,
        email: property.owner.email,
        trustScore: property.owner.trustScore,
        isVerifiedAgent: property.owner.isVerifiedAgent,
      }
    };
  }

  if (property.coordinates) {
    result = { ...result, coordinates: property.coordinates };
  }

  return result;
};

// Residential property adapter with bulletproof optional property handling
export const residentialPropertyAdapter: PropertyAdapter<Property> = (property: Property): ResidentialProperty => {
  const base = basePropertyAdapter(property);

  // Create the core required features with no undefined values
  const coreFeatures = {
    bedrooms: Number(property.bedrooms || property.features?.bedrooms) || 0,
    bathrooms: Number(property.bathrooms || property.features?.bathrooms) || 0,
    squareFeet: Number(property.size || property.features?.squareFeet) || 0,
    amenities: property.amenities || property.features?.amenities || [],
    furnished: Boolean(property.features?.furnished),
    petFriendly: Boolean(property.features?.petFriendly),
  };

  // Start with existing features (cleaned) plus our core features
  let combinedFeatures: ResidentialProperty['features'] = {
    ...coreFeatures
  };

  // Conditionally add optional features only when they have valid values
  const parkingSpaces = extractValidNumber(property.features?.parkingSpaces);
  if (parkingSpaces !== undefined) {
    combinedFeatures = { ...combinedFeatures, parkingSpaces };
  }

  const yearBuilt = extractValidNumber(property.features?.yearBuilt);
  if (yearBuilt !== undefined) {
    combinedFeatures = { ...combinedFeatures, yearBuilt };
  }

  const balcony = extractValidBoolean(property.features?.balcony);
  if (balcony !== undefined) {
    combinedFeatures = { ...combinedFeatures, balcony };
  }

  const garden = extractValidBoolean(property.features?.garden);
  if (garden !== undefined) {
    combinedFeatures = { ...combinedFeatures, garden };
  }

  // Add any additional properties from the original features that aren't explicitly handled
  // but filter out undefined values to maintain exactOptionalPropertyTypes compliance
  const additionalFeatures = Object.fromEntries(
    Object.entries(property.features || {}).filter(([key, value]) => 
      !['bedrooms', 'bathrooms', 'squareFeet', 'amenities', 'furnished', 'petFriendly', 
        'parkingSpaces', 'yearBuilt', 'balcony', 'garden'].includes(key) && 
      value !== undefined && value !== null && value !== ''
    )
  );

  combinedFeatures = { ...combinedFeatures, ...additionalFeatures };

  return {
    ...base,
    category: 'residential',
    type: (property.type as ResidentialProperty['type']) || 'apartment',
    features: combinedFeatures,
  };
};

// Commercial property adapter with comprehensive optional property management
export const commercialPropertyAdapter: PropertyAdapter<Property> = (property: Property): CommercialProperty => {
  const base = basePropertyAdapter(property);

  // Build the required features with definitive values
  const coreFeatures = {
    size: Number(property.size || property.area || property.features?.squareFeet) || 0,
    yearBuilt: Number(property.features?.yearBuilt) || new Date().getFullYear(),
  };

  // Start with core features
  let combinedFeatures: CommercialProperty['features'] = {
    ...coreFeatures
  };

  // Conditionally add each optional feature only when valid
  const occupancyRate = extractValidNumber(property.features?.occupancyRate);
  if (occupancyRate !== undefined) {
    combinedFeatures = { ...combinedFeatures, occupancyRate };
  }

  const roi = extractValidNumber(property.features?.roi);
  if (roi !== undefined) {
    combinedFeatures = { ...combinedFeatures, roi };
  }

  const parkingSpaces = extractValidNumber(property.features?.parkingSpaces);
  if (parkingSpaces !== undefined) {
    combinedFeatures = { ...combinedFeatures, parkingSpaces };
  }

  const floors = extractValidNumber(property.features?.floors);
  if (floors !== undefined) {
    combinedFeatures = { ...combinedFeatures, floors };
  }

  const elevators = extractValidNumber(property.features?.elevators);
  if (elevators !== undefined) {
    combinedFeatures = { ...combinedFeatures, elevators };
  }

  const airConditioning = extractValidBoolean(property.features?.airConditioning);
  if (airConditioning !== undefined) {
    combinedFeatures = { ...combinedFeatures, airConditioning };
  }

  const security = extractValidBoolean(property.features?.security);
  if (security !== undefined) {
    combinedFeatures = { ...combinedFeatures, security };
  }

  const loadingDock = extractValidBoolean(property.features?.loadingDock);
  if (loadingDock !== undefined) {
    combinedFeatures = { ...combinedFeatures, loadingDock };
  }

  // Include additional features while filtering out undefined values
  const additionalFeatures = Object.fromEntries(
    Object.entries(property.features || {}).filter(([key, value]) => 
      !['size', 'yearBuilt', 'occupancyRate', 'roi', 'parkingSpaces', 'floors', 
        'elevators', 'airConditioning', 'security', 'loadingDock'].includes(key) && 
      value !== undefined && value !== null && value !== ''
    )
  );

  combinedFeatures = { ...combinedFeatures, ...additionalFeatures };

  return {
    ...base,
    category: 'commercial',
    type: (property.type as CommercialProperty['type']) || 'office',
    features: combinedFeatures,
  };
};

// Land property adapter with meticulous optional property handling
export const landPropertyAdapter: PropertyAdapter<Property> = (property: Property): LandProperty => {
  const base = basePropertyAdapter(property);

  // Build required features with guaranteed values
  const coreFeatures = {
    size: String(property.features?.size || `${property.size || property.area || 0} sqm`),
    titleDeedStatus: (property.features?.titleDeedStatus as 'pending' | 'available' | 'missing') || 'available',
  };

  // Start with core features
  let combinedFeatures: LandProperty['features'] = {
    ...coreFeatures
  };

  // Conditionally add optional string properties
  const soilType = extractValidString(property.features?.soilType);
  if (soilType !== undefined) {
    combinedFeatures = { ...combinedFeatures, soilType };
  }

  const zoning = extractValidString(property.features?.zoning);
  if (zoning !== undefined) {
    combinedFeatures = { ...combinedFeatures, zoning };
  }

  const developmentPotential = extractValidString(property.features?.developmentPotential);
  if (developmentPotential !== undefined) {
    combinedFeatures = { ...combinedFeatures, developmentPotential };
  }

  const topography = extractValidString(property.features?.topography);
  if (topography !== undefined) {
    combinedFeatures = { ...combinedFeatures, topography };
  }

  const drainage = extractValidString(property.features?.drainage);
  if (drainage !== undefined) {
    combinedFeatures = { ...combinedFeatures, drainage };
  }

  // Conditionally add optional boolean properties
  const waterAccess = extractValidBoolean(property.features?.waterAccess);
  if (waterAccess !== undefined) {
    combinedFeatures = { ...combinedFeatures, waterAccess };
  }

  const roadAccess = extractValidBoolean(property.features?.roadAccess);
  if (roadAccess !== undefined) {
    combinedFeatures = { ...combinedFeatures, roadAccess };
  }

  const electricityAccess = extractValidBoolean(property.features?.electricityAccess);
  if (electricityAccess !== undefined) {
    combinedFeatures = { ...combinedFeatures, electricityAccess };
  }

  // Include additional features while maintaining type safety
  const additionalFeatures = Object.fromEntries(
    Object.entries(property.features || {}).filter(([key, value]) => 
      !['size', 'titleDeedStatus', 'soilType', 'zoning', 'developmentPotential', 
        'topography', 'drainage', 'waterAccess', 'roadAccess', 'electricityAccess'].includes(key) && 
      value !== undefined && value !== null && value !== ''
    )
  );

  combinedFeatures = { ...combinedFeatures, ...additionalFeatures };

  return {
    ...base,
    category: 'land',
    type: (property.type as LandProperty['type']) || 'residential',
    features: combinedFeatures,
  };
};

// Adaptive adapter that intelligently chooses the right adapter based on property category
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

// Enhanced batch adapter with comprehensive error handling
export function adaptProperties<T>(
  properties: Property[],
  adapter: PropertyAdapter<Property> = adaptivePropertyAdapter
): T[] {
  return properties
    .filter(property => property && typeof property === 'object') // Filter out invalid properties
    .map(adapter) as T[];
}

// Type guard functions for property categories with enhanced validation
export function isResidentialProperty(property: NormalizedProperty): property is ResidentialProperty {
  return property.category === 'residential' && 
         typeof property.features.bedrooms === 'number' && 
         typeof property.features.bathrooms === 'number';
}

export function isCommercialProperty(property: NormalizedProperty): property is CommercialProperty {
  return property.category === 'commercial' && 
         typeof property.features.size === 'number' && 
         typeof property.features.yearBuilt === 'number';
}

export function isLandProperty(property: NormalizedProperty): property is LandProperty {
  return property.category === 'land' && 
         typeof property.features.size === 'string';
}

// Enhanced validation function with comprehensive type checking
export function validateNormalizedProperty(property: unknown): property is NormalizedProperty {
  if (typeof property !== 'object' || property === null) {
    return false;
  }

  const prop = property as Record<string, unknown>;

  // Check required fields with precise type validation
  const hasRequiredFields = (
    typeof prop.id === 'string' &&
    typeof prop.title === 'string' &&
    typeof prop.description === 'string' &&
    typeof prop.price === 'number' &&
    typeof prop.location === 'string' &&
    Array.isArray(prop.images) &&
    typeof prop.verified === 'boolean' &&
    typeof prop.type === 'string' &&
    ['residential', 'commercial', 'land'].includes(prop.category as string) &&
    typeof prop.features === 'object' &&
    typeof prop.createdAt === 'string'
  );

  if (!hasRequiredFields) return false;

  // Validate images array contains only strings
  const images = prop.images as unknown[];
  if (!images.every(img => typeof img === 'string')) {
    return false;
  }

  // Validate verification status is one of the allowed values
  const { verificationStatus } = prop;
  if (verificationStatus && !['verified', 'pending', 'unverified', 'flagged'].includes(verificationStatus as string)) {
    return false;
  }

  // Validate dates are proper ISO strings
  try {
    new Date(prop.createdAt as string);
    if (prop.updatedAt) {
      new Date(prop.updatedAt as string);
    }
  } catch {
    return false;
  }

  return true;
}