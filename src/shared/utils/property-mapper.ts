import { Property } from '../types/property';

/**
 * Normalizes property data to ensure consistent structure
 */
export const normalizeProperty = (property: any, type: 'residential' | 'commercial' = 'residential'): Property => {
  return {
    id: property.id,
    title: property.title || 'Untitled Property',
    description: property.description || '',
    price: property.price || 0,
    location: property.location || { address: 'Location not specified' },
    images: property.images || property.imageUrls || [],
    type: type,
    features: {
      bedrooms: property.bedrooms || property.features?.bedrooms,
      bathrooms: property.bathrooms || property.features?.bathrooms,
      squareFeet: property.squareFeet || property.features?.squareFeet,
      area: property.area || property.features?.area,
      propertyType: property.propertyType || property.features?.propertyType || type,
      ...property.features,
    },
    status: property.status || 'available',
    verificationStatus: property.verificationStatus || 'pending',
    trustScore: property.trustScore || 0,
    aiVerificationResults: property.aiVerificationResults,
    owner: property.owner,
    viewCount: property.viewCount,
    favoriteCount: property.favoriteCount,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
};