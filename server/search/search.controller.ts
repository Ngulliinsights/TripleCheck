import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

// Validation schemas
const searchFiltersSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  propertyType: z.enum(['residential', 'commercial', 'land', 'all']).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  minSize: z.number().min(0).optional(),
  maxSize: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
});

const searchOptionsSchema = z.object({
  sortBy: z.enum(['price', 'date', 'size', 'relevance']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  includeNearby: z.boolean().default(false),
  radius: z.number().min(1).max(100).default(10),
});

// Mock property data generator
const generateMockProperties = (count: number, filters: any) => {
  const propertyTypes = ['apartment', 'house', 'condo', 'townhouse', 'villa'];
  const locations = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos'];
  const amenities = ['parking', 'gym', 'pool', 'security', 'garden', 'balcony', 'elevator'];
  
  return Array.from({ length: count }, (_, index) => {
    const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const bedrooms = Math.floor(Math.random() * 5) + 1;
    const bathrooms = Math.floor(Math.random() * 3) + 1;
    const size = Math.floor(Math.random() * 200) + 50;
    const price = Math.floor(Math.random() * 50000000) + 1000000;
    
    return {
      id: `prop-${Date.now()}-${index}`,
      title: `${bedrooms}BR ${propertyType.charAt(0).toUpperCase() + propertyType.slice(1)} in ${location}`,
      description: `Beautiful ${bedrooms}-bedroom ${propertyType} with modern amenities and great location.`,
      price,
      location: {
        address: `${Math.floor(Math.random() * 999) + 1} ${location} Street`,
        city: location,
        state: 'Kenya',
        country: 'Kenya',
        coordinates: {
          lat: -1.2921 + (Math.random() - 0.5) * 2,
          lng: 36.8219 + (Math.random() - 0.5) * 2,
        },
      },
      propertyType,
      bedrooms,
      bathrooms,
      size,
      amenities: amenities.slice(0, Math.floor(Math.random() * 4) + 2),
      features: ['modern', 'spacious', 'well-lit'],
      imageUrls: [
        `/assets/properties/property-${(index % 10) + 1}.jpg`,
      ],
      verified: Math.random() > 0.3,
      listedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      agent: {
        id: `agent-${Math.floor(Math.random() * 100)}`,
        name: `Agent ${Math.floor(Math.random() * 100)}`,
        phone: '+254700000000',
        email: 'agent@example.com',
      },
      status: 'active',
    };
  });
};

// Apply filters to properties
const applyFilters = (properties: any[], filters: any) => {
  return properties.filter(property => {
    // Query filter (search in title and description)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const searchText = `${property.title} ${property.description} ${property.location.city}`.toLowerCase();
      if (!searchText.includes(query)) return false;
    }

    // Location filter
    if (filters.location) {
      const location = filters.location.toLowerCase();
      const propertyLocation = `${property.location.address} ${property.location.city}`.toLowerCase();
      if (!propertyLocation.includes(location)) return false;
    }

    // Property type filter
    if (filters.propertyType && filters.propertyType !== 'all') {
      if (property.propertyType !== filters.propertyType) return false;
    }

    // Price range filter
    if (filters.minPrice && property.price < filters.minPrice) return false;
    if (filters.maxPrice && property.price > filters.maxPrice) return false;

    // Bedrooms filter
    if (filters.bedrooms && property.bedrooms < filters.bedrooms) return false;

    // Bathrooms filter
    if (filters.bathrooms && property.bathrooms < filters.bathrooms) return false;

    // Size filter
    if (filters.minSize && property.size < filters.minSize) return false;
    if (filters.maxSize && property.size > filters.maxSize) return false;

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every((amenity: string) =>
        property.amenities.includes(amenity)
      );
      if (!hasAllAmenities) return false;
    }

    // Verified filter
    if (filters.verified !== undefined && property.verified !== filters.verified) return false;

    return true;
  });
};

// Apply sorting to properties
const applySorting = (properties: any[], sortBy: string, sortOrder: string) => {
  return properties.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'date':
        comparison = new Date(a.listedDate).getTime() - new Date(b.listedDate).getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'relevance':
      default:
        // For relevance, we could implement a scoring system
        // For now, just sort by a combination of factors
        const aScore = (a.verified ? 10 : 0) + (a.amenities.length * 2);
        const bScore = (b.verified ? 10 : 0) + (b.amenities.length * 2);
        comparison = bScore - aScore;
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

/**
 * Search properties with advanced filtering
 * GET /api/search/properties
 */
router.get('/properties', async (req: Request, res: Response) => {
  try {
    // Parse and validate query parameters
    const filters = searchFiltersSchema.parse({
      query: req.query.query,
      location: req.query.location,
      propertyType: req.query.propertyType,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
      bathrooms: req.query.bathrooms ? Number(req.query.bathrooms) : undefined,
      minSize: req.query.minSize ? Number(req.query.minSize) : undefined,
      maxSize: req.query.maxSize ? Number(req.query.maxSize) : undefined,
      amenities: req.query['amenities[]'] ? 
        Array.isArray(req.query['amenities[]']) ? req.query['amenities[]'] : [req.query['amenities[]']] 
        : undefined,
      verified: req.query.verified ? req.query.verified === 'true' : undefined,
    });

    const options = searchOptionsSchema.parse({
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      includeNearby: req.query.includeNearby === 'true',
      radius: req.query.radius ? Number(req.query.radius) : undefined,
    });

    // Generate mock properties (in real implementation, this would query the database)
    const allProperties = generateMockProperties(200, filters);
    
    // Apply filters
    const filteredProperties = applyFilters(allProperties, filters);
    
    // Apply sorting
    const sortedProperties = applySorting(filteredProperties, options.sortBy, options.sortOrder);
    
    // Apply pagination
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    const paginatedProperties = sortedProperties.slice(startIndex, endIndex);
    
    // Generate search suggestions based on query
    const suggestions = filters.query ? [
      `${filters.query} apartments`,
      `${filters.query} houses`,
      `${filters.query} condos`,
      `${filters.query} in Nairobi`,
      `${filters.query} under 10M`,
    ] : [];

    // Generate facets for filtering UI
    const facets = {
      propertyTypes: [
        { type: 'apartment', count: Math.floor(Math.random() * 50) + 10 },
        { type: 'house', count: Math.floor(Math.random() * 40) + 8 },
        { type: 'condo', count: Math.floor(Math.random() * 30) + 5 },
        { type: 'townhouse', count: Math.floor(Math.random() * 20) + 3 },
      ],
      priceRanges: [
        { range: '0-5M', count: Math.floor(Math.random() * 30) + 10 },
        { range: '5M-10M', count: Math.floor(Math.random() * 25) + 8 },
        { range: '10M-20M', count: Math.floor(Math.random() * 20) + 5 },
        { range: '20M+', count: Math.floor(Math.random() * 15) + 3 },
      ],
      locations: [
        { location: 'Nairobi', count: Math.floor(Math.random() * 60) + 20 },
        { location: 'Mombasa', count: Math.floor(Math.random() * 30) + 10 },
        { location: 'Kisumu', count: Math.floor(Math.random() * 20) + 5 },
      ],
      amenities: [
        { amenity: 'parking', count: Math.floor(Math.random() * 80) + 30 },
        { amenity: 'gym', count: Math.floor(Math.random() * 40) + 15 },
        { amenity: 'pool', count: Math.floor(Math.random() * 30) + 10 },
        { amenity: 'security', count: Math.floor(Math.random() * 70) + 25 },
      ],
    };

    const result = {
      properties: paginatedProperties,
      total: filteredProperties.length,
      page: options.page,
      limit: options.limit,
      hasMore: endIndex < filteredProperties.length,
      filters,
      suggestions,
      facets,
    };

    res.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        errors: error.errors,
      });
    }

    console.error('Property search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed. Please try again.',
    });
  }
});

/**
 * Get search suggestions
 * GET /api/search/suggestions
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const query = q.toLowerCase();
    
    // Generate contextual suggestions
    const suggestions = [
      { text: `${q} apartments`, type: 'property_type', count: Math.floor(Math.random() * 50) + 10 },
      { text: `${q} houses`, type: 'property_type', count: Math.floor(Math.random() * 40) + 8 },
      { text: `${q} in Nairobi`, type: 'location', count: Math.floor(Math.random() * 60) + 20 },
      { text: `${q} in Mombasa`, type: 'location', count: Math.floor(Math.random() * 30) + 10 },
      { text: `${q} with parking`, type: 'amenity', count: Math.floor(Math.random() * 45) + 15 },
      { text: `${q} under 10M`, type: 'query', count: Math.floor(Math.random() * 35) + 12 },
    ];

    res.json({ suggestions });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
    });
  }
});

/**
 * Get location suggestions
 * GET /api/search/locations
 */
router.get('/locations', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ locations: [] });
    }

    const query = q.toLowerCase();
    const allLocations = [
      'Nairobi CBD', 'Westlands', 'Karen', 'Lavington', 'Kilimani', 'Parklands',
      'Mombasa', 'Diani', 'Nyali', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
      'Machakos', 'Kiambu', 'Ruiru', 'Kikuyu', 'Limuru', 'Tigoni'
    ];

    const matchingLocations = allLocations
      .filter(location => location.toLowerCase().includes(query))
      .slice(0, 10);

    res.json({ locations: matchingLocations });

  } catch (error) {
    console.error('Location suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location suggestions',
    });
  }
});

/**
 * Get popular searches
 * GET /api/search/popular
 */
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const popularSearches = [
      'apartments in Nairobi',
      'houses in Karen',
      'condos in Westlands',
      'properties under 10M',
      'verified properties',
      'houses with parking',
      'apartments in Kilimani',
      'commercial properties CBD',
      'land in Kiambu',
      'villas in Mombasa',
    ];

    res.json({ searches: popularSearches });

  } catch (error) {
    console.error('Popular searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular searches',
    });
  }
});

/**
 * Get search facets for building filter UI
 * GET /api/search/facets
 */
router.get('/facets', async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would analyze the current search results
    // and return actual counts for each facet
    const facets = {
      propertyTypes: [
        { type: 'apartment', count: Math.floor(Math.random() * 50) + 10 },
        { type: 'house', count: Math.floor(Math.random() * 40) + 8 },
        { type: 'condo', count: Math.floor(Math.random() * 30) + 5 },
        { type: 'townhouse', count: Math.floor(Math.random() * 20) + 3 },
        { type: 'villa', count: Math.floor(Math.random() * 15) + 2 },
      ],
      priceRanges: [
        { range: '0-2M', count: Math.floor(Math.random() * 25) + 8 },
        { range: '2M-5M', count: Math.floor(Math.random() * 30) + 10 },
        { range: '5M-10M', count: Math.floor(Math.random() * 25) + 8 },
        { range: '10M-20M', count: Math.floor(Math.random() * 20) + 5 },
        { range: '20M-50M', count: Math.floor(Math.random() * 15) + 3 },
        { range: '50M+', count: Math.floor(Math.random() * 10) + 2 },
      ],
      locations: [
        { location: 'Nairobi', count: Math.floor(Math.random() * 60) + 20 },
        { location: 'Westlands', count: Math.floor(Math.random() * 35) + 12 },
        { location: 'Karen', count: Math.floor(Math.random() * 30) + 10 },
        { location: 'Kilimani', count: Math.floor(Math.random() * 28) + 9 },
        { location: 'Lavington', count: Math.floor(Math.random() * 25) + 8 },
        { location: 'Mombasa', count: Math.floor(Math.random() * 30) + 10 },
      ],
      amenities: [
        { amenity: 'parking', count: Math.floor(Math.random() * 80) + 30 },
        { amenity: 'security', count: Math.floor(Math.random() * 70) + 25 },
        { amenity: 'gym', count: Math.floor(Math.random() * 40) + 15 },
        { amenity: 'pool', count: Math.floor(Math.random() * 30) + 10 },
        { amenity: 'garden', count: Math.floor(Math.random() * 35) + 12 },
        { amenity: 'balcony', count: Math.floor(Math.random() * 45) + 18 },
        { amenity: 'elevator', count: Math.floor(Math.random() * 25) + 8 },
      ],
    };

    res.json(facets);

  } catch (error) {
    console.error('Search facets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search facets',
    });
  }
});

/**
 * Save search analytics
 * POST /api/search/analytics
 */
router.post('/analytics', async (req: Request, res: Response) => {
  try {
    const { filters, resultCount, timestamp } = req.body;
    
    // In a real implementation, this would save to analytics database
    console.log('Search analytics:', {
      filters,
      resultCount,
      timestamp,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save search analytics',
    });
  }
});

// General search endpoint (legacy support)
router.get('/', (req, res) => {
  res.redirect('/api/search/properties?' + new URLSearchParams(req.query as any).toString());
});

export { router as searchRouter };