import { NormalizedProperty, PropertyOwner } from '../types/property';

/**
 * Normalizes property data to ensure consistent structure
 */
export const normalizeProperty = (property: unknown, category: 'residential' | 'commercial' | 'land' = 'residential'): NormalizedProperty => {
  const prop = property as Record<string, any>;
  const result: NormalizedProperty = {
    id: String(prop.id),
    title: prop.title || 'Untitled Property',
    description: prop.description || '',
    price: Number(prop.price) || 0,
    location: typeof prop.location === 'string' ? prop.location : prop.location?.address || 'Location not specified',
    images: prop.images || prop.imageUrls || [],
    verified: prop.verificationStatus === 'verified' || false,
    type: prop.type || category,
    category: category,
    features: {
      bedrooms: prop.bedrooms || prop.features?.bedrooms,
      bathrooms: prop.bathrooms || prop.features?.bathrooms,
      squareFeet: prop.squareFeet || prop.features?.squareFeet,
      area: prop.area || prop.features?.area,
      propertyType: prop.propertyType || prop.features?.propertyType || category,
      ...prop.features,
    },
    status: prop.status || 'available',
    createdAt: prop.createdAt || new Date().toISOString(),
  };

  // Add optional properties only if they have valid values
  if (prop.updatedAt) {
    result.updatedAt = prop.updatedAt;
  }

  if (prop.rating !== undefined) {
    result.rating = prop.rating;
  }

  if (prop.viewCount !== undefined) {
    result.views = prop.viewCount;
  }

  if (prop.trustScore !== undefined) {
    result.trustScore = prop.trustScore;
  }

  if (prop.verificationStatus) {
    result.verificationStatus = prop.verificationStatus;
  }

  if (prop.owner) {
    const owner: PropertyOwner = {
      id: String(prop.owner.id),
      name: prop.owner.name || `${prop.owner.firstName || ''} ${prop.owner.lastName || ''}`.trim() || 'Unknown Owner',
      trustScore: prop.owner.trustScore || 0,
      isVerifiedAgent: prop.owner.isVerifiedAgent || false,
    };

    if (prop.owner.email) {
      owner.email = prop.owner.email;
    }

    if (prop.owner.phone) {
      owner.phone = prop.owner.phone;
    }

    if (prop.owner.profileImageUrl) {
      owner.avatar = prop.owner.profileImageUrl;
    }

    result.owner = owner;
  }

  if (prop.coordinates) {
    result.coordinates = prop.coordinates;
  }

  return result;
};