import { Request, Response } from 'express';
import { z } from 'zod';

// Validation schemas
const searchFiltersSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  propertyType: z.string().optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  areaMin: z.number().min(0).optional(),
  areaMax: z.number().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  verificationStatus: z.array(z.string()).optional(),
  furnished: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  parkingSpaces: z.number().min(0).optional(),
});

const searchOptionsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['relevance', 'price', 'date', 'size', 'trust_score']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Mock data generators
const generateMockProperties = (count: number, filters: any) => {
  const properties = [];
  
  for (let i = 0; i < count; i++) {
    const property = {
      id: `prop-${Date.now()}-${i}`,
      title: `${['Modern', 'Luxury', 'Spacious', 'Beautiful', 'Elegant'][i % 5]} ${['Apartment', 'House', 'Villa', 'Townhouse'][i % 4]} in ${['Westlands', 'Karen', 'Kilimani', 'Lavington'][i % 4]}`,
      description: `A beautiful property with modern amenities and great location.`,
      price: Math.floor(Math.random() * 50000000) + 1000000, // 1M - 50M KES
      location: ['Westlands, Nairobi', 'Karen, Nairobi', 'Kilimani, Nairobi', 'Lavington, Nairobi'][i % 4],
      type: ['apartment', 'house', 'villa', 'townhouse'][i % 4],
      bedrooms: Math.floor(Math.random() * 5) + 1,
      bathrooms: Math.floor(Math.random() * 4) + 1,
      area: Math.floor(Math.random() * 3000) + 500,
      images: [`/assets/property-${i % 10 + 1}.jpg`],
      amenities: ['parking', 'security', 'gym', 'pool'].slice(0, Math.floor(Math.random() * 4) + 1),
      verificationStatus: ['verified', 'pending', 'unverified'][i % 3],
      furnished: Math.random() > 0.5,
      petFriendly: Math.random() > 0.7,
      parkingSpaces: Math.floor(Math.random() * 3),
      trustScore: Math.floor(Math.random() * 100) + 1,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    properties.push(property);
  }
  
  return properties;
};

const generateSearchFacets = (properties: any[]) => {
  const facets = {
    propertyTypes: [] as Array<{ value: string; label: string; count: number }>,
    locations: [] as Array<{ value: string; label: string; count: number }>,
    priceRanges: [] as Array<{ min: number; max: number; count: number }>,
    amenities: [] as Array<{ value: string; label: string; count: number }>,
  };

  // Count property types
  const typeCount: Record<string, number> = {};
  const locationCount: Record<string, number> = {};
  const amenityCount: Record<string, number> = {};

  properties.forEach(property => {
    // Count types
    typeCount[property.type] = (typeCount[property.type] || 0) + 1;
    
    // Count locations
    const location = property.location.split(',')[0];
    locationCount[location] = (locationCount[location] || 0) + 1;
    
    // Count amenities
    property.amenities.forEach((amenity: string) => {
      amenityCount[amenity] = (amenityCount[amenity] || 0) + 1;
    });
  });

  // Convert to facet format
  Object.entries(typeCount).forEach(([type, count]) => {
    facets.propertyTypes.push({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count
    });
  });

  Object.entries(locationCount).forEach(([location, count]) => {
    facets.locations.push({
      value: location.toLowerCase(),
      label: location,
      count
    });
  });

  Object.entries(amenityCount).forEach(([amenity, count]) => {
    facets.amenities.push({
      value: amenity,
      label: amenity.charAt(0).toUpperCase() + amenity.slice(1),
      count
    });
  });

  // Price ranges
  const priceRanges = [
    { min: 0, max: 1000000, count: 0 },
    { min: 1000000, max: 5000000, count: 0 },
    { min: 5000000, max: 10000000, count: 0 },
    { min: 10000000, max: 50000000, count: 0 },
    { min: 50000000, max: Infinity, count: 0 },
  ];

  properties.forEach(property => {
    const range = priceRanges.find(r => property.price >= r.min && property.price < r.max);
    if (range) range.count++;
  });

  facets.priceRanges = priceRanges;

  return facets;
};

/**
 * Search properties with filters and pagination
 * GET /api/search/properties
 */
export const searchProperties = async (req: Request, res: Response) => {
  try {
    // Parse and validate query parameters
    const filters = searchFiltersSchema.parse({
      query: req.query.query,
      location: req.query.location,
      propertyType: req.query.propertyType,
      priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
      bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
      bathrooms: req.query.bathrooms ? Number(req.query.bathrooms) : undefined,
      areaMin: req.query.areaMin ? Number(req.query.areaMin) : undefined,
      areaMax: req.query.areaMax ? Number(req.query.areaMax) : undefined,
      amenities: req.query.amenities ? (Array.isArray(req.query.amenities) ? req.query.amenities : [req.query.amenities]) : undefined,
      verificationStatus: req.query.verificationStatus ? (Array.isArray(req.query.verificationStatus) ? req.query.verificationStatus : [req.query.verificationStatus]) : undefined,
      furnished: req.query.furnished ? req.query.furnished === 'true' : undefined,
      petFriendly: req.query.petFriendly ? req.query.petFriendly === 'true' : undefined,
      parkingSpaces: req.query.parkingSpaces ? Number(req.query.parkingSpaces) : undefined,
    });

    const options = searchOptionsSchema.parse({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    });

    // Generate mock properties (in real implementation, this would query the database)
    let allProperties = generateMockProperties(100, filters);

    // Apply filters
    if (filters.query) {
      const query = filters.query.toLowerCase();
      allProperties = allProperties.filter(property =>
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query)
      );
    }

    if (filters.location) {
      const location = filters.location.toLowerCase();
      allProperties = allProperties.filter(property =>
        property.location.toLowerCase().includes(location)
      );
    }

    if (filters.propertyType) {
      allProperties = allProperties.filter(property =>
        property.type === filters.propertyType
      );
    }

    if (filters.priceMin) {
      allProperties = allProperties.filter(property =>
        property.price >= filters.priceMin!
      );
    }

    if (filters.priceMax) {
      allProperties = allProperties.filter(property =>
        property.price <= filters.priceMax!
      );
    }

    if (filters.bedrooms) {
      allProperties = allProperties.filter(property =>
        property.bedrooms >= filters.bedrooms!
      );
    }

    if (filters.bathrooms) {
      allProperties = allProperties.filter(property =>
        property.bathrooms >= filters.bathrooms!
      );
    }

    if (filters.amenities && filters.amenities.length > 0) {
      allProperties = allProperties.filter(property =>
        filters.amenities!.every(amenity => property.amenities.includes(amenity))
      );
    }

    if (filters.verificationStatus && filters.verificationStatus.length > 0) {
      allProperties = allProperties.filter(property =>
        filters.verificationStatus!.includes(property.verificationStatus)
      );
    }

    if (filters.furnished !== undefined) {
      allProperties = allProperties.filter(property =>
        property.furnished === filters.furnished
      );
    }

    if (filters.petFriendly !== undefined) {
      allProperties = allProperties.filter(property =>
        property.petFriendly === filters.petFriendly
      );
    }

    if (filters.parkingSpaces !== undefined) {
      allProperties = allProperties.filter(property =>
        property.parkingSpaces >= filters.parkingSpaces!
      );
    }

    // Apply sorting
    switch (options.sortBy) {
      case 'price':
        allProperties.sort((a, b) => 
          options.sortOrder === 'asc' ? a.price - b.price : b.price - a.price
        );
        break;
      case 'date':
        allProperties.sort((a, b) => 
          options.sortOrder === 'asc' 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'size':
        allProperties.sort((a, b) => 
          options.sortOrder === 'asc' ? a.area - b.area : b.area - a.area
        );
        break;
      case 'trust_score':
        allProperties.sort((a, b) => 
          options.sortOrder === 'asc' ? a.trustScore - b.trustScore : b.trustScore - a.trustScore
        );
        break;
      default:
        // Relevance sorting (mock implementation)
        allProperties.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          
          if (filters.query) {
            const query = filters.query.toLowerCase();
            if (a.title.toLowerCase().includes(query)) scoreA += 10;
            if (b.title.toLowerCase().includes(query)) scoreB += 10;
            if (a.description.toLowerCase().includes(query)) scoreA += 5;
            if (b.description.toLowerCase().includes(query)) scoreB += 5;
          }
          
          return scoreB - scoreA;
        });
    }

    // Apply pagination
    const total = allProperties.length;
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    const paginatedProperties = allProperties.slice(startIndex, endIndex);

    // Generate facets
    const facets = generateSearchFacets(allProperties);

    const result = {
      properties: paginatedProperties,
      total,
      page: options.page,
      limit: options.limit,
      hasMore: endIndex < total,
      facets,
    };

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        errors: error.errors.reduce((acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>)
      });
    }

    console.error('Search properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed. Please try again.'
    });
  }
};

/**
 * Get search suggestions
 * GET /api/search/suggestions
 */
export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    // Mock suggestions based on query
    const mockSuggestions = [
      { text: 'Apartments in Westlands', type: 'query', count: 45 },
      { text: 'Houses in Karen', type: 'query', count: 32 },
      { text: 'Commercial properties CBD', type: 'query', count: 18 },
      { text: 'Luxury villas Runda', type: 'query', count: 12 },
      { text: 'Townhouses Lavington', type: 'query', count: 28 },
      { text: 'Land for sale Kiambu', type: 'query', count: 67 },
      { text: 'Verified properties', type: 'query', count: 156 },
      { text: 'Furnished apartments', type: 'query', count: 89 },
    ];

    const filteredSuggestions = mockSuggestions
      .filter(suggestion => 
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8);

    res.json({
      success: true,
      data: { suggestions: filteredSuggestions }
    });

  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions'
    });
  }
};

/**
 * Get location suggestions
 * GET /api/search/locations
 */
export const getLocationSuggestions = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: { locations: [] }
      });
    }

    // Mock location suggestions
    const mockLocations = [
      { name: 'Westlands', type: 'neighborhood', coordinates: [-1.2676, 36.8108] },
      { name: 'Karen', type: 'neighborhood', coordinates: [-1.3197, 36.6859] },
      { name: 'Kilimani', type: 'neighborhood', coordinates: [-1.2921, 36.7872] },
      { name: 'Lavington', type: 'neighborhood', coordinates: [-1.2833, 36.7667] },
      { name: 'Runda', type: 'neighborhood', coordinates: [-1.2167, 36.7833] },
      { name: 'Nairobi CBD', type: 'city', coordinates: [-1.2921, 36.8219] },
      { name: 'Mombasa', type: 'city', coordinates: [-4.0435, 39.6682] },
      { name: 'Nakuru', type: 'city', coordinates: [-0.3031, 36.0800] },
      { name: 'Kisumu', type: 'city', coordinates: [-0.1022, 34.7617] },
      { name: 'Eldoret', type: 'city', coordinates: [0.5143, 35.2698] },
    ];

    const filteredLocations = mockLocations
      .filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 10);

    res.json({
      success: true,
      data: { locations: filteredLocations }
    });

  } catch (error) {
    console.error('Get location suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location suggestions'
    });
  }
};

/**
 * Get popular searches
 * GET /api/search/popular
 */
export const getPopularSearches = async (req: Request, res: Response) => {
  try {
    const popularSearches = [
      'Apartments in Nairobi',
      'Houses in Karen',
      'Commercial properties CBD',
      'Land for sale Kiambu',
      'Verified properties',
      'Luxury villas',
      'Furnished apartments',
      'Properties under 10M',
      'Townhouses Lavington',
      'Investment properties'
    ];

    res.json({
      success: true,
      data: { searches: popularSearches }
    });

  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular searches'
    });
  }
};

/**
 * Get search facets
 * GET /api/search/facets
 */
export const getSearchFacets = async (req: Request, res: Response) => {
  try {
    // Parse filters (same as search)
    const filters = searchFiltersSchema.parse({
      query: req.query.query,
      location: req.query.location,
      propertyType: req.query.propertyType,
      // ... other filters
    });

    // Generate mock properties and facets
    const properties = generateMockProperties(100, filters);
    const facets = generateSearchFacets(properties);

    res.json({
      success: true,
      data: { facets }
    });

  } catch (error) {
    console.error('Get search facets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search facets'
    });
  }
};

/**
 * Save search for analytics
 * POST /api/search/save
 */
export const saveSearch = async (req: Request, res: Response) => {
  try {
    const { filters, resultCount, timestamp } = req.body;

    // In a real implementation, this would save to database for analytics
    console.log('Search saved:', { filters, resultCount, timestamp });

    res.json({
      success: true,
      message: 'Search saved successfully'
    });

  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save search'
    });
  }
};