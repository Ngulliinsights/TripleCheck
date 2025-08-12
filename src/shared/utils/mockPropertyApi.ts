import type { Property, BasePropertyFilters } from '../types/property';

// Mock property data for demonstration
const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern 3-Bedroom Apartment in Westlands',
    description: 'Beautiful modern apartment with stunning city views and premium amenities. Features spacious rooms, modern kitchen, and excellent security.',
    location: 'Westlands, Nairobi',
    price: 15000000,
    images: [
      '/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg',
      '/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg',
    ],
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parkingSpaces: 1,
      yearBuilt: 2020,
      amenities: ['Swimming Pool', 'Gym', '24/7 Security', 'Elevator'],
      propertyType: 'apartment',
      petFriendly: false,
      furnished: true,
    },
    verificationStatus: 'verified',
    type: 'apartment',
    createdAt: '2024-01-15T10:00:00Z',
    trustScore: 85,
    viewCount: 245,
  },
  {
    id: '2',
    title: 'Luxury Villa in Karen',
    description: 'Spacious family home with beautiful gardens and modern fixtures. Perfect for families seeking comfort and elegance.',
    location: 'Karen, Nairobi',
    price: 45000000,
    images: [
      '/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg',
      '/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg',
    ],
    features: {
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 3500,
      parkingSpaces: 3,
      yearBuilt: 2018,
      amenities: ['Swimming Pool', 'Garden', 'Staff Quarters', 'Generator'],
      propertyType: 'house',
      petFriendly: true,
      furnished: false,
    },
    verificationStatus: 'verified',
    type: 'house',
    createdAt: '2024-01-10T14:30:00Z',
    trustScore: 92,
    viewCount: 189,
  },
  {
    id: '3',
    title: 'Prime Commercial Land in Kilifi',
    description: 'Excellent investment opportunity with beach access and development potential.',
    location: 'Kilifi, Coast',
    price: 25000000,
    images: [
      '/assets/Land/bogdan-pasca-XpyDh3PY2lA-unsplash.jpg',
    ],
    features: {
      size: '2.5 acres',
      waterAccess: true,
      roadAccess: true,
      electricityAccess: false,
      zoning: 'commercial',
      developmentPotential: 'high',
      titleDeedStatus: 'available',
    },
    verificationStatus: 'verified',
    type: 'land',
    createdAt: '2024-01-08T09:15:00Z',
    trustScore: 78,
    viewCount: 156,
  },
  {
    id: '4',
    title: 'Modern Office Space in CBD',
    description: 'Premium office space in the heart of Nairobi CBD with excellent connectivity.',
    location: 'CBD, Nairobi',
    price: 35000000,
    images: [
      '/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg',
    ],
    features: {
      size: 2500,
      yearBuilt: 2019,
      floors: 3,
      elevators: 2,
      airConditioning: true,
      security: true,
      parkingSpaces: 15,
    },
    verificationStatus: 'verified',
    type: 'office',
    createdAt: '2024-01-05T16:45:00Z',
    trustScore: 88,
    viewCount: 203,
  },
];

// Mock API function that simulates server response
export async function fetchMockProperties(
  filters: BasePropertyFilters,
  page: number = 1,
  pageSize: number = 12
): Promise<{
  items: Property[];
  totalCount: number;
  totalPages: number;
}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Filter properties based on criteria
  let filteredProperties = MOCK_PROPERTIES;

  // Apply query filter
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filteredProperties = filteredProperties.filter(property =>
      property.title.toLowerCase().includes(query) ||
      property.description.toLowerCase().includes(query) ||
      (typeof property.location === 'string' ? property.location : property.location.address)
        .toLowerCase().includes(query)
    );
  }

  // Apply location filter
  if (filters.location) {
    const location = filters.location.toLowerCase();
    filteredProperties = filteredProperties.filter(property =>
      (typeof property.location === 'string' ? property.location : property.location.address)
        .toLowerCase().includes(location)
    );
  }

  // Apply price filters
  if (filters.priceMin !== null) {
    filteredProperties = filteredProperties.filter(property => {
      const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
      return price >= filters.priceMin!;
    });
  }

  if (filters.priceMax !== null) {
    filteredProperties = filteredProperties.filter(property => {
      const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
      return price <= filters.priceMax!;
    });
  }

  // Apply verification filter
  if (filters.verified) {
    filteredProperties = filteredProperties.filter(property =>
      property.verificationStatus === 'verified'
    );
  }

  // Apply category filter
  if (filters.category) {
    filteredProperties = filteredProperties.filter(property => {
      const type = property.type || property.propertyType || '';
      switch (filters.category) {
        case 'residential':
          return ['apartment', 'house', 'villa', 'duplex', 'penthouse'].includes(type);
        case 'commercial':
          return ['office', 'retail', 'warehouse', 'industrial'].includes(type);
        case 'land':
          return type === 'land';
        default:
          return true;
      }
    });
  }

  // Calculate pagination
  const totalCount = filteredProperties.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  return {
    items: paginatedProperties,
    totalCount,
    totalPages,
  };
}

// Enhanced mock data generator for testing
export function generateMockProperties(count: number): Property[] {
  const properties: Property[] = [];
  const locations = ['Westlands', 'Karen', 'Kilimani', 'CBD', 'Kileleshwa', 'Lavington'];
  const propertyTypes = ['apartment', 'house', 'office', 'land'];
  
  for (let i = 0; i < count; i++) {
    const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    
    properties.push({
      id: `mock-${i + 1}`,
      title: `${type === 'land' ? 'Prime Land' : 'Modern Property'} in ${location}`,
      description: `Beautiful ${type} with excellent features and great location.`,
      location: `${location}, Nairobi`,
      price: Math.floor(Math.random() * 50000000) + 5000000,
      images: [`/assets/placeholder-${type}.jpg`],
      features: {
        bedrooms: type === 'apartment' || type === 'house' ? Math.floor(Math.random() * 5) + 1 : undefined,
        bathrooms: type === 'apartment' || type === 'house' ? Math.floor(Math.random() * 3) + 1 : undefined,
        squareFeet: type !== 'land' ? Math.floor(Math.random() * 3000) + 500 : undefined,
        size: type === 'land' ? `${Math.floor(Math.random() * 5) + 1} acres` : undefined,
        propertyType: type,
      },
      verificationStatus: Math.random() > 0.2 ? 'verified' : 'pending',
      type,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      trustScore: Math.floor(Math.random() * 40) + 60,
      viewCount: Math.floor(Math.random() * 500) + 10,
    });
  }
  
  return properties;
}