import { z } from 'zod';
import { Property, PropertySearchParams } from '../types/property.types';

// Property validation schemas
export const PropertySchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-,.']+$/, 'Title contains invalid characters'),
  
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  
  price: z.number()
    .positive('Price must be positive')
    .min(1000, 'Minimum price is $1,000')
    .max(50000000, 'Maximum price is $50,000,000'),
  
  location: z.object({
    address: z.string().min(10, 'Address must be at least 10 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),
    state: z.string().min(2, 'State must be at least 2 characters'),
    country: z.string().min(2, 'Country must be at least 2 characters'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }),
  
  propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'land']),
  
  bedrooms: z.number()
    .int('Bedrooms must be a whole number')
    .min(0, 'Bedrooms cannot be negative')
    .max(20, 'Maximum 20 bedrooms allowed'),
  
  bathrooms: z.number()
    .min(0, 'Bathrooms cannot be negative')
    .max(20, 'Maximum 20 bathrooms allowed'),
  
  area: z.number()
    .positive('Area must be positive')
    .min(100, 'Minimum area is 100 sq ft')
    .max(100000, 'Maximum area is 100,000 sq ft'),
  
  images: z.array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(20, 'Maximum 20 images allowed'),
  
  amenities: z.array(z.string())
    .max(50, 'Maximum 50 amenities allowed'),
  
  ownerId: z.string().uuid('Invalid owner ID'),
  
  status: z.enum(['active', 'pending', 'sold', 'inactive']).default('pending'),
  
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).default('pending'),
});

export const PropertySearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'land']).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  areaMin: z.number().positive().optional(),
  areaMax: z.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
  sortBy: z.enum(['price', 'date', 'relevance', 'trustScore']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Business logic for property operations
export class PropertyBusinessLogic {
  // Validate property data
  static validateProperty(data: unknown): Property {
    try {
      return PropertySchema.parse(data) as Property;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Property validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  // Validate search parameters
  static validateSearchParams(params: unknown): PropertySearchParams {
    try {
      return PropertySearchSchema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Search validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  // Calculate property score based on various factors
  static calculatePropertyScore(property: Property): number {
    let score = 0;
    
    // Base score from property type
    const typeScores = {
      house: 100,
      condo: 90,
      townhouse: 85,
      apartment: 80,
      land: 70,
    };
    score += typeScores[property.propertyType];

    // Image quality score (more images = higher score)
    score += Math.min(property.images.length * 5, 50);

    // Description quality score
    if (property.description.length > 200) score += 20;
    if (property.description.length > 500) score += 10;

    // Amenities score
    score += Math.min(property.amenities.length * 2, 30);

    // Location score (if coordinates provided)
    if (property.location.coordinates) score += 15;

    // Verification bonus
    if (property.verificationStatus === 'verified') score += 50;

    // Trust score integration
    if (property.trustScore) {
      score += Math.floor(property.trustScore / 10);
    }

    return Math.min(score, 1000); // Cap at 1000
  }

  // Determine if property is featured based on score and other factors
  static isFeaturedProperty(property: Property): boolean {
    const score = this.calculatePropertyScore(property);
    return score >= 800 && 
           property.verificationStatus === 'verified' && 
           property.status === 'active' &&
           property.images.length >= 5;
  }

  // Calculate estimated market value based on similar properties
  static estimateMarketValue(property: Property, similarProperties: Property[]): {
    estimatedValue: number;
    confidence: number;
    factors: string[];
  } {
    if (similarProperties.length === 0) {
      return {
        estimatedValue: property.price,
        confidence: 0,
        factors: ['No similar properties found for comparison'],
      };
    }

    // Calculate price per square foot for similar properties
    const pricePerSqFt = similarProperties
      .filter(p => p.area > 0)
      .map(p => p.price / p.area);

    if (pricePerSqFt.length === 0) {
      return {
        estimatedValue: property.price,
        confidence: 0,
        factors: ['Insufficient area data for comparison'],
      };
    }

    const avgPricePerSqFt = pricePerSqFt.reduce((sum, price) => sum + price, 0) / pricePerSqFt.length;
    const estimatedValue = Math.round(avgPricePerSqFt * property.area);

    // Calculate confidence based on number of similar properties and variance
    const variance = pricePerSqFt.reduce((sum, price) => sum + Math.pow(price - avgPricePerSqFt, 2), 0) / pricePerSqFt.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / avgPricePerSqFt;
    
    let confidence = Math.max(0, 100 - (coefficientOfVariation * 100));
    confidence = Math.min(confidence, similarProperties.length * 10); // More properties = higher confidence

    const factors = [
      `Based on ${similarProperties.length} similar properties`,
      `Average price per sq ft: $${avgPricePerSqFt.toFixed(2)}`,
      `Property area: ${property.area} sq ft`,
    ];

    if (coefficientOfVariation > 0.3) {
      factors.push('High price variance in similar properties');
    }

    return {
      estimatedValue: Math.round(estimatedValue),
      confidence: Math.round(confidence),
      factors,
    };
  }

  // Generate property recommendations based on user preferences
  static generateRecommendations(
    userPreferences: {
      priceRange: { min: number; max: number };
      preferredTypes: Property['propertyType'][];
      minBedrooms: number;
      preferredAmenities: string[];
      location?: string;
    },
    availableProperties: Property[]
  ): Property[] {
    return availableProperties
      .filter(property => {
        // Price filter
        if (property.price < userPreferences.priceRange.min || 
            property.price > userPreferences.priceRange.max) {
          return false;
        }

        // Type filter
        if (userPreferences.preferredTypes.length > 0 && 
            !userPreferences.preferredTypes.includes(property.propertyType)) {
          return false;
        }

        // Bedroom filter
        if (property.bedrooms < userPreferences.minBedrooms) {
          return false;
        }

        // Status filter
        if (property.status !== 'active') {
          return false;
        }

        return true;
      })
      .map(property => ({
        ...property,
        matchScore: this.calculateMatchScore(property, userPreferences),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Top 10 recommendations
  }

  private static calculateMatchScore(
    property: Property, 
    preferences: any
  ): number {
    let score = 0;

    // Amenity matching
    const matchingAmenities = property.amenities.filter(amenity =>
      preferences.preferredAmenities.includes(amenity)
    );
    score += matchingAmenities.length * 10;

    // Location matching (simple string matching for now)
    if (preferences.location && 
        property.location.city.toLowerCase().includes(preferences.location.toLowerCase())) {
      score += 20;
    }

    // Property score bonus
    score += this.calculatePropertyScore(property) / 10;

    // Verification bonus
    if (property.verificationStatus === 'verified') {
      score += 15;
    }

    return score;
  }

  // Validate property ownership
  static validateOwnership(property: Property, userId: string): boolean {
    return property.ownerId === userId;
  }

  // Check if property can be edited
  static canEditProperty(property: Property, userId: string): {
    canEdit: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let canEdit = true;

    // Ownership check
    if (!this.validateOwnership(property, userId)) {
      canEdit = false;
      reasons.push('You are not the owner of this property');
    }

    // Status check
    if (property.status === 'sold') {
      canEdit = false;
      reasons.push('Sold properties cannot be edited');
    }

    // Verification check
    if (property.verificationStatus === 'verified' && property.status === 'active') {
      reasons.push('Verified active properties have limited editing options');
    }

    return { canEdit, reasons };
  }

  // Generate property listing URL
  static generateListingUrl(property: Property): string {
    const slug = property.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    return `/property/${property.id}/${slug}`;
  }
}