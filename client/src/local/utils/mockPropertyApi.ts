import type { Property, BasePropertyFilters } from '@shared/types/property'

// Enhanced seeded random number generator for consistent, predictable results
class SeededRandom {
  private seed: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
  }

  /**
   * Generate a pseudorandom number between 0 and 1
   * Uses a simple linear congruential generator for predictability
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Select random element from array with proper type safety
   * Returns undefined if array is empty to maintain type safety
   */
  choice<T>(array: T[]): T | undefined {
    if (array.length === 0) {
      return undefined;
    }
    return array[this.nextInt(0, array.length)];
  }

  /**
   * Select random element from array with guarantee of non-empty array
   * Use this when you're certain the array has elements
   */
  safeChoice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot select from empty array');
    }
    const index = this.nextInt(0, array.length);
    const result = array[index];
    if (result === undefined) {
      throw new Error(`Array access failed at index ${index}`);
    }
    return result;
  }

  /**
   * Public method to reset seed for testing scenarios
   */
  setSeed(newSeed: number): void {
    this.seed = newSeed;
  }
}

// Create instance for consistent mock data generation
const random = new SeededRandom();

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

/**
 * Safely extracts location string from property location field
 * Handles both string and object location formats with proper type safety
 */
function getLocationString(location: string | { address: string } | unknown): string {
  if (typeof location === 'string') {
    return location;
  }
  // Use optional chaining and type guard for safer object access
  if (location && typeof location === 'object' && 'address' in location) {
    const locationObj = location as { address: string };
    return locationObj.address;
  }
  return '';
}

/**
 * Safely converts price to number for comparison operations
 * Handles both string and number price formats with validation
 */
function getPriceAsNumber(price: string | number): number {
  if (typeof price === 'number') {
    return price;
  }
  const parsed = parseFloat(price);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Determines property category based on type
 * Provides consistent categorization logic with fallback handling
 */
function getPropertyCategory(property: Property): string {
  const type = property.type || property.propertyType || '';
  
  if (['apartment', 'house', 'villa', 'duplex', 'penthouse'].includes(type)) {
    return 'residential';
  }
  if (['office', 'retail', 'warehouse', 'industrial'].includes(type)) {
    return 'commercial';
  }
  if (type === 'land') {
    return 'land';
  }
  
  return 'other';
}

/**
 * Mock API function that simulates server response with enhanced filtering
 * Provides consistent pagination and filtering capabilities with proper null handling
 */
export async function fetchMockProperties(
  filters: BasePropertyFilters,
  page: number = 1,
  pageSize: number = 12
): Promise<{
  items: Property[];
  totalCount: number;
  totalPages: number;
}> {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("📊 fetchMockProperties called with:", { filters, page, pageSize });
    // eslint-disable-next-line no-console
    console.log("📊 Available mock properties:", MOCK_PROPERTIES.length);
  }
  
  // Simulate realistic network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Start with all properties and apply filters progressively
  let filteredProperties = [...MOCK_PROPERTIES];

  // Apply text-based query filter across multiple fields
  if (filters.query?.trim()) {
    const query = filters.query.toLowerCase().trim();
    filteredProperties = filteredProperties.filter(property => {
      const searchableText = [
        property.title,
        property.description,
        getLocationString(property.location)
      ].join(' ').toLowerCase();
      
      return searchableText.includes(query);
    });
  }

  // Apply location-specific filtering
  if (filters.location?.trim()) {
    const location = filters.location.toLowerCase().trim();
    filteredProperties = filteredProperties.filter(property => {
      const propertyLocation = getLocationString(property.location).toLowerCase();
      return propertyLocation.includes(location);
    });
  }

  // Apply minimum price filter with safe number conversion
  // Use != for null/undefined check as recommended by ESLint
  if (filters.priceMin != null) {
    filteredProperties = filteredProperties.filter(property => {
      const price = getPriceAsNumber(property.price);
      return price >= (filters.priceMin ?? 0);
    });
  }

  // Apply maximum price filter with safe number conversion
  if (filters.priceMax != null) {
    filteredProperties = filteredProperties.filter(property => {
      const price = getPriceAsNumber(property.price);
      return price <= (filters.priceMax ?? Infinity);
    });
  }

  // Filter by verification status when requested
  if (filters.verified === true) {
    filteredProperties = filteredProperties.filter(property =>
      property.verificationStatus === 'verified'
    );
  }

  // Apply category-based filtering with enhanced logic
  if (filters.category?.trim()) {
    const targetCategory = filters.category.toLowerCase().trim();
    filteredProperties = filteredProperties.filter(property => {
      const propertyCategory = getPropertyCategory(property);
      return propertyCategory === targetCategory;
    });
  }

  // Calculate pagination metrics
  const totalCount = filteredProperties.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.max(1, Math.min(page, totalPages));
  
  // Apply pagination with bounds checking
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  const result = {
    items: paginatedProperties,
    totalCount,
    totalPages,
  };

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("📊 fetchMockProperties returning:", { 
      itemsCount: result.items.length, 
      totalCount: result.totalCount, 
      totalPages: result.totalPages,
      currentPage 
    });
  }

  return result;
}

/**
 * Enhanced mock data generator with consistent, reproducible results
 * Generates realistic property data for testing and development
 */
export function generateMockProperties(count: number): Property[] {
  // Reset random generator for consistent results
  const generator = new SeededRandom(42); // Fixed seed for reproducibility
  
  // Expanded location data for more variety
  const locations = [
    'Westlands', 'Karen', 'Kilimani', 'CBD', 
    'Kileleshwa', 'Lavington', 'Runda', 'Muthaiga'
  ];
  
  // Property types with associated metadata
  const propertyTypeData = [
    { type: 'apartment', category: 'residential', basePrice: 8000000 },
    { type: 'house', category: 'residential', basePrice: 20000000 },
    { type: 'office', category: 'commercial', basePrice: 15000000 },
    { type: 'land', category: 'land', basePrice: 10000000 }
  ];

  const properties: Property[] = [];
  
  for (let i = 0; i < count; i++) {
    // Select property type and location using seeded randomization
    const typeData = generator.safeChoice(propertyTypeData);
    const location = generator.safeChoice(locations);
    
    // Generate realistic price variation (±50% of base price)
    const priceVariation = generator.nextInt(-50, 51) / 100;
    const finalPrice = Math.round(typeData.basePrice * (1 + priceVariation));
    
    // Create property object with all required fields
    const property: Property = {
      id: `mock-${i + 1}`,
      title: `${typeData.type === 'land' ? 'Prime Land' : 'Modern Property'} in ${location}`,
      description: `Beautiful ${typeData.type} with excellent features and great location. Perfect for ${typeData.category === 'residential' ? 'families' : 'business'}.`,
      location: `${location}, Nairobi`,
      price: finalPrice,
      images: [`/assets/placeholder-${typeData.type}.jpg`],
      features: {
        // Add residential-specific features
        ...(typeData.category === 'residential' && {
          bedrooms: generator.nextInt(1, 6),
          bathrooms: generator.nextInt(1, 4),
          squareFeet: generator.nextInt(500, 3500),
        }),
        // Add land-specific features
        ...(typeData.type === 'land' && {
          size: `${generator.nextInt(1, 6)} acres`,
        }),
        // Add commercial-specific features
        ...(typeData.category === 'commercial' && {
          squareFeet: generator.nextInt(1000, 5000),
          parkingSpaces: generator.nextInt(5, 25),
        }),
        propertyType: typeData.type,
      },
      verificationStatus: generator.next() > 0.2 ? 'verified' : 'pending',
      type: typeData.type,
      createdAt: new Date(
        Date.now() - generator.nextInt(0, 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
      trustScore: generator.nextInt(60, 101),
      viewCount: generator.nextInt(10, 501),
    };
    
    properties.push(property);
  }
  
  return properties;
}

/**
 * Mock API function to fetch a single property by ID
 * Simulates server response for individual property details
 */
export async function fetchMockProperty(id: string): Promise<Property | null> {
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏠 fetchMockProperty called with ID:", id);
  }
  
  // Simulate realistic network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Find property in mock data
  const property = MOCK_PROPERTIES.find(p => p.id === id);
  
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log("🏠 fetchMockProperty result:", property ? "Found" : "Not found");
  }

  return property || null;
}

/**
 * Utility function to reset the random generator seed
 * Useful for testing scenarios requiring specific data patterns
 */
export function resetMockDataSeed(seed: number = 12345): void {
  random.setSeed(seed);
}