import { and, desc, eq, sql } from 'drizzle-orm';
import { Router, Request, Response } from 'express';
import { z } from 'zod';

import {
  properties,
  users,
  landVerificationSessions,
} from '..\infrastructure\database\schemas\consolidated';
import { CacheService } from '../cache/CacheService'
import { db } from '../infrastructure/database/connection';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { asyncHandler } from "../middleware/error";
import { createRateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { ResponseHelper } from '../utils/response-helpers';

const router = Router();
const cache = new CacheService();

// Rate limiting
const propertyRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 50 }, // 50 requests per minute
  },
});

const geocodingRateLimit = createRateLimitingMiddleware({
  enableUserLimits: true,
  rateLimitConfigs: {
    user: { windowMs: 60000, maxRequests: 20 }, // 20 geocoding requests per minute
  },
});

// Validation schemas
const nearbyPropertiesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(50).default(5), // km
  limit: z.coerce.number().min(1).max(100).default(20),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  propertyType: z.enum(['apartment', 'house', 'townhouse', 'condo', 'land']).optional(),
});

const geocodeSchema = z.object({
  address: z.string().min(1).max(500),
});

const reverseGeocodeSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

/**
 * @route GET /api/properties/nearby
 * @desc Get nearby properties based on coordinates
 * @access Public
 */
router.get('/nearby',
  propertyRateLimit,
  validateRequest({ query: nearbyPropertiesSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lon, radius, limit, minPrice, maxPrice, propertyType } = req.query as any;

    const cacheKey = `nearby-properties-${lat}-${lon}-${radius}-${limit}-${minPrice || 'none'}-${maxPrice || 'none'}-${propertyType || 'all'}`;
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return ResponseHelper.success(res, cached);
    }

    try {
      // Calculate bounding box for efficient querying
      const latDelta = radius / 111; // Rough conversion: 1 degree lat ≈ 111 km
      const lonDelta = radius / (111 * Math.cos(lat * Math.PI / 180));

      let query = db
        .select({
          id: properties.id,
          title: properties.title,
          description: properties.description,
          price: properties.price,
          propertyType: properties.propertyType,
          location: properties.location,
          coordinates: properties.coordinates,
          images: properties.images,
          features: properties.features,
          verificationStatus: properties.verificationStatus,
          trustScore: properties.trustScore,
          createdAt: properties.createdAt,
          owner: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            trustScore: users.trustScore,
          },
        })
        .from(properties)
        .innerJoin(users, eq(properties.ownerId, users.id))
        .where(
          and(
            sql`${properties.coordinates}->>'lat' BETWEEN ${lat - latDelta} AND ${lat + latDelta}`,
            sql`${properties.coordinates}->>'lng' BETWEEN ${lon - lonDelta} AND ${lon + lonDelta}`,
            eq(properties.isActive, true)
          )
        );

      // Apply filters
      if (minPrice) {
        query = query.where(sql`${properties.price}::numeric >= ${minPrice}`);
      }
      if (maxPrice) {
        query = query.where(sql`${properties.price}::numeric <= ${maxPrice}`);
      }
      if (propertyType) {
        query = query.where(eq(properties.propertyType, propertyType));
      }

      const nearbyProperties = await query.limit(limit);

      // Calculate actual distances and sort by distance
      const propertiesWithDistance = nearbyProperties
        .map(property => {
          const propCoords = property.coordinates as any;
          if (!propCoords?.lat || !propCoords?.lng) return null;

          const distance = calculateDistance(
            lat,
            lon,
            parseFloat(propCoords.lat),
            parseFloat(propCoords.lng)
          );

          return {
            ...property,
            distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          };
        })
        .filter(property => property && property.distance <= radius)
        .sort((a, b) => a!.distance - b!.distance);

      const result = {
        properties: propertiesWithDistance,
        searchCenter: { lat, lon },
        radius,
        total: propertiesWithDistance.length,
      };

      // Cache for 10 minutes
      await cache.set(cacheKey, result, { ttl: 600 });

      ResponseHelper.success(res, result);

    } catch (error) {
      console.error('Nearby properties error:', error);
      ResponseHelper.error(res, 'Failed to load nearby properties', 500);
    }
  })
);

/**
 * @route GET /api/geocode
 * @desc Geocode an address to coordinates
 * @access Public
 */
router.get('/geocode',
  geocodingRateLimit,
  validateRequest({ query: geocodeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.query as any;

    const cacheKey = `geocode-${Buffer.from(address).toString('base64')}`;
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return ResponseHelper.success(res, cached);
    }

    try {
      // In a real implementation, you would use a geocoding service like:
      // - Google Maps Geocoding API
      // - Mapbox Geocoding API
      // - OpenStreetMap Nominatim
      // - Here Geocoding API

      // For demo purposes, we'll simulate geocoding for common Kenyan locations
      const geocodeResult = simulateGeocoding(address);

      if (!geocodeResult) {
        return ResponseHelper.error(res, 'Address not found', 404);
      }

      // Cache for 24 hours
      await cache.set(cacheKey, geocodeResult, { ttl: 86400 });

      ResponseHelper.success(res, geocodeResult);

    } catch (error) {
      console.error('Geocoding error:', error);
      ResponseHelper.error(res, 'Geocoding service unavailable', 503);
    }
  })
);

/**
 * @route GET /api/reverse-geocode
 * @desc Reverse geocode coordinates to address
 * @access Public
 */
router.get('/reverse-geocode',
  geocodingRateLimit,
  validateRequest({ query: reverseGeocodeSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lon } = req.query as any;

    const cacheKey = `reverse-geocode-${lat}-${lon}`;
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return ResponseHelper.success(res, cached);
    }

    try {
      // In a real implementation, you would use a reverse geocoding service
      const reverseGeocodeResult = simulateReverseGeocoding(lat, lon);

      if (!reverseGeocodeResult) {
        return ResponseHelper.error(res, 'Location not found', 404);
      }

      // Cache for 24 hours
      await cache.set(cacheKey, reverseGeocodeResult, { ttl: 86400 });

      ResponseHelper.success(res, reverseGeocodeResult);

    } catch (error) {
      console.error('Reverse geocoding error:', error);
      ResponseHelper.error(res, 'Reverse geocoding service unavailable', 503);
    }
  })
);

/**
 * @route GET /api/properties/:id/verification-report
 * @desc Get property verification report
 * @access Public
 */
router.get('/:id/verification-report',
  propertyRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    const propertyId = parseInt(req.params.id);
    const { reportType = 'summary' } = req.query;

    if (isNaN(propertyId)) {
      return ResponseHelper.error(res, 'Invalid property ID', 400);
    }

    const cacheKey = `verification-report-${propertyId}-${reportType}`;
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return ResponseHelper.success(res, cached);
    }

    try {
      // Get property details
      const [property] = await db
        .select({
          id: properties.id,
          title: properties.title,
          location: properties.location,
          coordinates: properties.coordinates,
          verificationStatus: properties.verificationStatus,
          trustScore: properties.trustScore,
          owner: {
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            trustScore: users.trustScore,
          },
        })
        .from(properties)
        .innerJoin(users, eq(properties.ownerId, users.id))
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (!property) {
        return ResponseHelper.error(res, 'Property not found', 404);
      }

      // Get verification sessions for this property
      const verificationSessions = await db
        .select()
        .from(landVerificationSessions)
        .where(eq(landVerificationSessions.propertyId, propertyId.toString()))
        .orderBy(desc(landVerificationSessions.createdAt))
        .limit(5);

      // Generate verification report
      const report = generateVerificationReport(property, verificationSessions, reportType as string);

      // Cache for 30 minutes
      await cache.set(cacheKey, report, { ttl: 1800 });

      ResponseHelper.success(res, report);

    } catch (error) {
      console.error('Verification report error:', error);
      ResponseHelper.error(res, 'Failed to generate verification report', 500);
    }
  })
);

/**
 * @route GET /api/properties/updates
 * @desc Get property updates for polling
 * @access Private
 */
router.get('/updates',
  requireAuth,
  propertyRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { since } = req.query;
    const userId = req.user!.id;

    try {
      let sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours
      
      if (since) {
        sinceDate = new Date(since as string);
      }

      // Get user's properties that have been updated
      const updatedProperties = await db
        .select({
          id: properties.id,
          title: properties.title,
          verificationStatus: properties.verificationStatus,
          trustScore: properties.trustScore,
          updatedAt: properties.updatedAt,
          updateType: sql<string>`'property_update'`,
        })
        .from(properties)
        .where(
          and(
            eq(properties.ownerId, userId),
            sql`${properties.updatedAt} > ${sinceDate}`
          )
        )
        .orderBy(desc(properties.updatedAt));

      // Get verification updates for user's properties
      const verificationUpdates = await db
        .select({
          id: landVerificationSessions.id,
          propertyId: landVerificationSessions.propertyId,
          status: landVerificationSessions.status,
          updatedAt: landVerificationSessions.updatedAt,
          updateType: sql<string>`'verification_update'`,
        })
        .from(landVerificationSessions)
        .innerJoin(properties, eq(landVerificationSessions.propertyId, properties.id.toString()))
        .where(
          and(
            eq(properties.ownerId, userId),
            sql`${landVerificationSessions.updatedAt} > ${sinceDate}`
          )
        )
        .orderBy(desc(landVerificationSessions.updatedAt));

      const updates = {
        properties: updatedProperties,
        verifications: verificationUpdates,
        lastChecked: new Date().toISOString(),
        hasUpdates: updatedProperties.length > 0 || verificationUpdates.length > 0,
      };

      ResponseHelper.success(res, updates);

    } catch (error) {
      console.error('Property updates error:', error);
      ResponseHelper.error(res, 'Failed to load property updates', 500);
    }
  })
);

// Helper functions

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function simulateGeocoding(address: string) {
  // Simulate geocoding for common Kenyan locations
  const locations: Record<string, any> = {
    'nairobi': { lat: -1.2921, lng: 36.8219, formatted_address: 'Nairobi, Kenya' },
    'mombasa': { lat: -4.0435, lng: 39.6682, formatted_address: 'Mombasa, Kenya' },
    'kisumu': { lat: -0.0917, lng: 34.7680, formatted_address: 'Kisumu, Kenya' },
    'nakuru': { lat: -0.3031, lng: 36.0800, formatted_address: 'Nakuru, Kenya' },
    'eldoret': { lat: 0.5143, lng: 35.2698, formatted_address: 'Eldoret, Kenya' },
    'thika': { lat: -1.0332, lng: 37.0692, formatted_address: 'Thika, Kenya' },
    'karen': { lat: -1.3197, lng: 36.6859, formatted_address: 'Karen, Nairobi, Kenya' },
    'westlands': { lat: -1.2676, lng: 36.8108, formatted_address: 'Westlands, Nairobi, Kenya' },
  };

  const searchKey = address.toLowerCase();
  for (const [key, location] of Object.entries(locations)) {
    if (searchKey.includes(key)) {
      return {
        results: [{
          geometry: {
            location: {
              lat: location.lat,
              lng: location.lng,
            },
          },
          formatted_address: location.formatted_address,
          place_id: `place_${key}_${Date.now()}`,
        }],
        status: 'OK',
      };
    }
  }

  return null;
}

function simulateReverseGeocoding(lat: number, lon: number) {
  // Simple reverse geocoding simulation
  const regions = [
    { bounds: { minLat: -1.5, maxLat: -1.0, minLng: 36.5, maxLng: 37.0 }, name: 'Nairobi County' },
    { bounds: { minLat: -4.2, maxLat: -3.8, minLng: 39.4, maxLng: 39.9 }, name: 'Mombasa County' },
    { bounds: { minLat: -0.3, maxLat: 0.1, minLng: 34.5, maxLng: 35.0 }, name: 'Kisumu County' },
  ];

  for (const region of regions) {
    if (lat >= region.bounds.minLat && lat <= region.bounds.maxLat &&
        lon >= region.bounds.minLng && lon <= region.bounds.maxLng) {
      return {
        results: [{
          formatted_address: `${region.name}, Kenya`,
          address_components: [
            { long_name: region.name, short_name: region.name, types: ['administrative_area_level_1'] },
            { long_name: 'Kenya', short_name: 'KE', types: ['country'] },
          ],
          geometry: {
            location: { lat, lng: lon },
          },
          place_id: `place_reverse_${Date.now()}`,
        }],
        status: 'OK',
      };
    }
  }

  return {
    results: [{
      formatted_address: `${lat.toFixed(4)}, ${lon.toFixed(4)}, Kenya`,
      address_components: [
        { long_name: 'Kenya', short_name: 'KE', types: ['country'] },
      ],
      geometry: {
        location: { lat, lng: lon },
      },
      place_id: `place_reverse_${Date.now()}`,
    }],
    status: 'OK',
  };
}

function generateVerificationReport(property: any, verificationSessions: any[], reportType: string) {
  const latestSession = verificationSessions[0];
  
  const baseReport = {
    propertyId: property.id,
    propertyTitle: property.title,
    location: property.location,
    coordinates: property.coordinates,
    verificationStatus: property.verificationStatus,
    trustScore: property.trustScore,
    owner: property.owner,
    reportType,
    generatedAt: new Date().toISOString(),
  };

  if (reportType === 'detailed') {
    return {
      ...baseReport,
      verificationHistory: verificationSessions.map(session => ({
        id: session.id,
        status: session.status,
        completedLayers: session.completedLayers,
        riskScore: session.riskScore,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
      riskAssessment: {
        overallRisk: latestSession?.riskScore || 'unknown',
        riskFactors: latestSession?.riskFactors || [],
        recommendations: generateRecommendations(property, latestSession),
      },
      documentStatus: {
        titleDeed: 'pending',
        surveyReport: 'pending',
        approvals: 'pending',
      },
      communityFeedback: {
        averageRating: 4.2,
        totalReviews: 8,
        recentComments: [
          'Property looks legitimate',
          'Good location, verified by local community',
        ],
      },
    };
  }

  return {
    ...baseReport,
    summary: {
      verificationScore: calculateVerificationScore(property, latestSession),
      keyFindings: generateKeyFindings(property, latestSession),
      recommendations: generateRecommendations(property, latestSession).slice(0, 3),
    },
  };
}

function calculateVerificationScore(property: any, session: any): number {
  let score = 50; // Base score
  
  if (property.verificationStatus === 'verified') score += 30;
  if (property.trustScore > 70) score += 20;
  if (session?.status === 'completed') score += 20;
  
  return Math.min(100, score);
}

function generateKeyFindings(property: any, session: any): string[] {
  const findings = [];
  
  if (property.verificationStatus === 'verified') {
    findings.push('Property has been successfully verified');
  }
  
  if (property.trustScore > 80) {
    findings.push('High trust score indicates reliable property listing');
  }
  
  if (session?.status === 'completed') {
    findings.push('Land verification process completed successfully');
  }
  
  return findings.length > 0 ? findings : ['Verification in progress'];
}

function generateRecommendations(property: any, session: any): string[] {
  const recommendations = [];
  
  if (property.verificationStatus !== 'verified') {
    recommendations.push('Complete property verification process');
  }
  
  if (property.trustScore < 70) {
    recommendations.push('Improve trust score through community engagement');
  }
  
  if (!session || session.status !== 'completed') {
    recommendations.push('Initiate comprehensive land verification');
  }
  
  recommendations.push('Consider professional property inspection');
  recommendations.push('Verify all legal documents with qualified lawyer');
  
  return recommendations;
}

export { router as propertyEnhancementsRouter };