import type { LandProperty } from '../components/PropertyCardShowcase'
import type { NormalizedProperty } from '../../local/types/property'

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
