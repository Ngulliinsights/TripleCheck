import type { LandProperty } from '../components/PropertyCardShowcase'
import type { NormalizedProperty } from '@shared/types/property'

export function normalizeLandProperty(land: LandProperty): NormalizedProperty {
  const normalizedLocation = typeof land.location === 'string' 
    ? land.location 
    : land.location.address;

  return {
    id: land.id,
    title: land.title,
    description: land.description,
    price: land.price,
    location: normalizedLocation,
    images: land.images || [],
    verified: land.verificationStatus === 'verified',
    type: 'residential',
    category: 'land',
    features: {},
    createdAt: new Date().toISOString(),
    status: 'available', // Default status for new properties
  };
}

export function normalizeProperty(property: any, type?: string): NormalizedProperty {
  // If it's a land property, use the dedicated function
  if (property.location !== undefined && !Array.isArray(property)) {
    return normalizeLandProperty(property);
  }

  // Generic normalization for Property objects
  return {
    id: property.id || '',
    title: property.title || property.name || 'Untitled',
    description: property.description || '',
    price: property.price || 0,
    location: property.location || property.address || '',
    images: property.images || [],
    verified: property.verified || property.verificationStatus === 'verified',
    type: type || 'residential',
    category: 'property',
    features: property.features || {},
    createdAt: property.createdAt || new Date().toISOString(),
    status: property.status || 'available',
  };
}
