import { z } from 'zod'

import { Property, PropertySearchParams } from '../types/property.types'

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
  query: z.string().default(''),
  location: z.string().optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'land']).optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  areaMin: z.number().positive().optional(),
  areaMax: z.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
  landVerified: z.boolean().optional(),
  landRiskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(12),
  sortBy: z.enum(['price', 'date', 'relevance', 'trustScore', 'landVerification']).default('relevance'),
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
      const parsed = PropertySearchSchema.parse(params);
      // Type assertion to ensure compatibility with PropertySearchParams
      return parsed as PropertySearchParams;
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
    if (property.propertyType) {
      score += typeScores[property.propertyType as keyof typeof typeScores] || 0;
    }

    // Image quality score (more images = higher score)
    if (property.images) {
      score += Math.min(property.images.length * 5, 50);
    }

    // Description quality score
    if (property.description && property.description.length > 200) score += 20;
    if (property.description && property.description.length > 500) score += 10;

    // Amenities score
    if (property.amenities) {
      score += Math.min(property.amenities.length * 2, 30);
    }

    // Location score (if coordinates provided)
    if (typeof property.location === 'object' && property.location.coordinates) score += 15;

    // Verification bonus
    if (property.verificationStatus === 'verified') score += 50;

    // Land verification integration
    if (property.landVerification) {
      score += this.calculateLandVerificationScore(property.landVerification);
    }

    // Trust score integration
    if (property.trustScore) {
      score += Math.floor(property.trustScore / 10);
    }

    return Math.min(score, 1000); // Cap at 1000
  }

  // Calculate land verification contribution to property score
  static calculateLandVerificationScore(landVerification: Property['landVerification']): number {
    if (!landVerification) return 0;

    let score = 0;

    // Base score for having land verification
    score += 20;

    // Status-based scoring
    switch (landVerification.status) {
      case 'completed':
        score += 60;
        break;
      case 'in_progress':
        score += 30;
        break;
      case 'suspended':
        score += 10;
        break;
      case 'failed':
        score -= 20;
        break;
      default:
        break;
    }

    // Risk level adjustment
    switch (landVerification.riskLevel) {
      case 'low':
        score += 40;
        break;
      case 'medium':
        score += 20;
        break;
      case 'high':
        score -= 10;
        break;
      case 'critical':
        score -= 30;
        break;
    }

    // Confidence bonus
    score += Math.floor(landVerification.confidence * 20);

    // Completed layers bonus
    score += landVerification.completedLayers.length * 5;

    return Math.max(0, score);
  }

  // Generate land verification badge based on status
  static generateLandVerificationBadge(landVerification: Property['landVerification']): Record<string, unknown> | undefined {
    if (!landVerification) return undefined;

    switch (landVerification.status) {
      case 'completed':
        if (landVerification.riskLevel === 'low') {
          return {
            type: 'verified',
            label: 'Land Verified',
            color: 'green',
            description: 'Property has completed comprehensive land verification with low risk'
          };
        } else if (landVerification.riskLevel === 'medium') {
          return {
            type: 'verified',
            label: 'Land Verified - Medium Risk',
            color: 'blue',
            description: 'Property has completed land verification with medium risk factors identified'
          };
        } else {
          return {
            type: 'high_risk',
            label: 'High Risk Property',
            color: 'red',
            description: 'Property has completed verification but significant risks were identified'
          };
        }
      case 'in_progress':
        return {
          type: 'in_progress',
          label: 'Verification In Progress',
          color: 'blue',
          description: 'Land verification is currently underway'
        };
      case 'suspended':
      case 'failed':
        return {
          type: 'expert_required',
          label: 'Expert Review Required',
          color: 'orange',
          description: 'Land verification requires expert attention'
        };
      default:
        return undefined;
    }
  }

  // Determine if property is featured based on score and other factors
  static isFeaturedProperty(property: Property): boolean {
    const score = this.calculatePropertyScore(property);
    const hasBasicRequirements = property.verificationStatus === 'verified' && 
                                property.isActive === true &&
                                (property.images || property.imageUrls || []).length >= 5;
    
    // Enhanced requirements for land properties
    if (property.features?.propertyType === 'land') {
      return score >= 850 && 
             hasBasicRequirements &&
             property.landVerification?.status === 'completed' &&
             property.landVerification?.riskLevel === 'low';
    }
    
    // Standard requirements for other property types
    return score >= 800 && hasBasicRequirements;
  }

  // Calculate estimated market value based on similar properties
  static estimateMarketValue(property: Property, similarProperties: Property[]): {
    estimatedValue: number;
    confidence: number;
    factors: string[];
  } {
    if (similarProperties.length === 0) {
      return {
        estimatedValue: typeof property.price === 'string' ? parseInt(property.price, 10) : property.price,
        confidence: 0,
        factors: ['No similar properties found for comparison'],
      };
    }

    // Calculate price per square foot for similar properties
    const pricePerSqFt = similarProperties
      .filter(p => (p.area || p.features?.squareFeet || 0) > 0)
      .map(p => {
        const price = typeof p.price === 'string' ? parseInt(p.price, 10) : p.price;
        const area = p.area || p.features?.squareFeet || 1;
        return price / area;
      });

    if (pricePerSqFt.length === 0) {
      return {
        estimatedValue: typeof property.price === 'string' ? parseInt(property.price, 10) : property.price,
        confidence: 0,
        factors: ['Insufficient area data for comparison'],
      };
    }

    const avgPricePerSqFt = pricePerSqFt.reduce((sum, price) => sum + price, 0) / pricePerSqFt.length;
    const propertyArea = property.area || property.features?.squareFeet || 1;
    const estimatedValue = Math.round(avgPricePerSqFt * propertyArea);

    // Calculate confidence based on number of similar properties and variance
    const variance = pricePerSqFt.reduce((sum, price) => sum + Math.pow(price - avgPricePerSqFt, 2), 0) / pricePerSqFt.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / avgPricePerSqFt;
    
    let confidence = Math.max(0, 100 - (coefficientOfVariation * 100));
    confidence = Math.min(confidence, similarProperties.length * 10); // More properties = higher confidence

    const factors = [
      `Based on ${similarProperties.length} similar properties`,
      `Average price per sq ft: $${avgPricePerSqFt.toFixed(2)}`,
      `Property area: ${propertyArea} sq ft`,
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
      preferredTypes: string[];
      minBedrooms: number;
      preferredAmenities: string[];
      location?: string;
    },
    availableProperties: Property[]
  ): Property[] {
    return availableProperties
      .filter(property => {
        // Price filter
        const price = typeof property.price === 'string' ? parseInt(property.price, 10) : property.price;
        if (price < userPreferences.priceRange.min || 
            price > userPreferences.priceRange.max) {
          return false;
        }

        // Type filter
        if (userPreferences.preferredTypes.length > 0 && 
            !userPreferences.preferredTypes.includes(property.features?.propertyType || '')) {
          return false;
        }

        // Bedroom filter
        if ((property.features?.bedrooms || 0) < userPreferences.minBedrooms) {
          return false;
        }

        // Status filter
        return property.isActive === true;
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
    preferences: Record<string, unknown>
  ): number {
    let score = 0;

    // Amenity matching
    const preferredAmenities = Array.isArray(preferences.preferredAmenities) ? preferences.preferredAmenities : [];
    const matchingAmenities = (property.features?.amenities || []).filter((amenity: string) =>
      preferredAmenities.includes(amenity)
    );
    score += matchingAmenities.length * 10;

    // Location matching (simple string matching for now)
    const preferredLocation = typeof preferences.location === 'string' ? preferences.location : '';
    if (preferredLocation && 
        (typeof property.location === 'string' ? property.location : (property.location as { city?: string })?.city || '').toLowerCase().includes(preferredLocation.toLowerCase())) {
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
    if (property.verificationStatus === 'unverified') {
      canEdit = false;
      reasons.push('Unverified properties have limited editing capabilities');
    }

    // Verification check
    if (property.verificationStatus === 'verified' && property.isActive === true) {
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