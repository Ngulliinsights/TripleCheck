import { Property, UserPreference, PropertyInteraction } from "@shared/schema";
import { storage } from "../storage";

interface PropertyScore {
  propertyId: number;
  score: number;
}

export class RecommendationService {
  private readonly LOCATION_WEIGHT = 0.4;
  private readonly PRICE_WEIGHT = 0.3;
  private readonly AMENITIES_WEIGHT = 0.2;
  private readonly INTERACTION_WEIGHT = 0.1;

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  // Calculate location score based on user preferences
  private async calculateLocationScore(property: Property, userPreferences: UserPreference): Promise<number> {
    if (!property.latitude || !property.longitude || !userPreferences.preferredLocations?.length) {
      return 0;
    }

    // Find the minimum distance to any preferred location
    const distances = userPreferences.preferredLocations.map(loc => {
      const [lat, lon] = loc.split(',').map(Number);
      return this.calculateDistance(
        Number(property.latitude),
        Number(property.longitude),
        lat,
        lon
      );
    });

    const minDistance = Math.min(...distances);
    // Convert distance to score (closer = higher score)
    return Math.max(0, 1 - (minDistance / 10)); // Normalize to 10km radius
  }

  // Calculate price match score
  private calculatePriceScore(property: Property, userPreferences: UserPreference): number {
    const priceRange = userPreferences.priceRange as { min: number; max: number };
    if (!priceRange) return 0;

    if (property.price >= priceRange.min && property.price <= priceRange.max) {
      return 1;
    }
    
    // Calculate how far outside the range the price is
    const minDiff = Math.abs(property.price - priceRange.min);
    const maxDiff = Math.abs(property.price - priceRange.max);
    const nearestBoundary = Math.min(minDiff, maxDiff);
    const rangeSize = priceRange.max - priceRange.min;
    
    return Math.max(0, 1 - (nearestBoundary / rangeSize));
  }

  // Calculate amenities match score
  private calculateAmenitiesScore(property: Property, userPreferences: UserPreference): number {
    if (!userPreferences.amenities?.length) return 0;
    
    const propertyAmenities = (property.features as any).amenities || [];
    const matchingAmenities = userPreferences.amenities.filter(
      amenity => propertyAmenities.includes(amenity)
    );
    
    return matchingAmenities.length / userPreferences.amenities.length;
  }

  // Calculate interaction score based on user history
  private async calculateInteractionScore(propertyId: number, userId: number): Promise<number> {
    const interactions = await storage.getPropertyInteractions(propertyId, userId);
    if (!interactions?.length) return 0;

    const weights = {
      view: 0.2,
      save: 0.4,
      inquire: 0.4
    };

    return interactions.reduce((score, interaction) => {
      return score + (weights[interaction.interactionType as keyof typeof weights] || 0);
    }, 0);
  }

  // Get property recommendations for a user
  async getRecommendations(userId: number, limit: number = 10): Promise<Property[]> {
    const userPreferences = await storage.getUserPreferences(userId);
    if (!userPreferences) {
      return [];
    }

    const properties = await storage.getProperties();
    const scoredProperties: PropertyScore[] = await Promise.all(
      properties.map(async (property) => {
        const locationScore = await this.calculateLocationScore(property, userPreferences);
        const priceScore = this.calculatePriceScore(property, userPreferences);
        const amenitiesScore = this.calculateAmenitiesScore(property, userPreferences);
        const interactionScore = await this.calculateInteractionScore(property.id, userId);

        const totalScore = 
          locationScore * this.LOCATION_WEIGHT +
          priceScore * this.PRICE_WEIGHT +
          amenitiesScore * this.AMENITIES_WEIGHT +
          interactionScore * this.INTERACTION_WEIGHT;

        return {
          propertyId: property.id,
          score: totalScore
        };
      })
    );

    // Sort by score and get top recommendations
    const topPropertyIds = scoredProperties
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(sp => sp.propertyId);

    // Fetch full property details for recommendations
    const recommendations = await Promise.all(
      topPropertyIds.map(id => storage.getProperty(id))
    );

    return recommendations.filter((p): p is Property => p !== undefined);
  }
}

export const recommendationService = new RecommendationService();
