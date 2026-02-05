import type { LandProperty } from '../components/PropertyCardShowcase'
import type { NormalizedProperty } from '../../shared/types/property'

export function normalizeLandProperty(land: LandProperty): NormalizedProperty {
  const normalizedLocation = typeof land.location === 'string' 
    ? land.location 
    : land.location.address;

  return {
    ...land,
    location: normalizedLocation,
    verified: land.verificationStatus === 'verified',
    category: 'land',
    createdAt: new Date().toISOString(),
    status: land.verificationStatus === 'flagged' ? 'pending' : 'available',
    type: 'residential', // Default to residential, can be adjusted based on your needs
    features: [] // Initialize with empty array, can be populated with land-specific features if needed
  };
}
