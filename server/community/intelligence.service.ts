import { eq, and, desc, count, avg, gte, sql } from "drizzle-orm";

import { db } from "../infrastructure/database/connection";
import { properties, users, reviews } from "../infrastructure/database/schemas/consolidated";

export interface CommunityIntelligence {
  propertyId: number;
  communityScore: number;
  reviewCount: number;
  averageRating: number;
  verifiedReviews: number;
  ownerTrustScore: number;
  communityFlags: CommunityFlag[];
  neighborhoodInsights: NeighborhoodInsights;
  riskIndicators: string[];
  lastUpdated: Date;
}

export interface CommunityFlag {
  type: 'positive' | 'negative' | 'warning';
  category: 'ownership' | 'condition' | 'location' | 'pricing' | 'documentation';
  description: string;
  reportedBy: number;
  reportedAt: Date;
  verified: boolean;
}

export interface NeighborhoodInsights {
  averagePrice: number;
  priceRange: [number, number];
  propertyCount: number;
  averageRating: number;
  commonAmenities: string[];
  marketTrend: 'rising' | 'stable' | 'declining';
}

export interface CommunityReport {
  propertyId: number;
  reportType: 'fraud_suspicion' | 'ownership_dispute' | 'condition_issue' | 'pricing_concern';
  description: string;
  evidence?: string[];
  reporterId: number;
  anonymous: boolean;
  severity: 'low' | 'medium' | 'high';
}

export class CommunityIntelligenceService {
  private static readonly DB_CONNECTION_ERROR = 'Database connection not available';
  private static readonly UNKNOWN_ERROR = 'Unknown error';

  /**
   * Get comprehensive community intelligence for a property
   */
  async getCommunityIntelligence(propertyId: number): Promise<CommunityIntelligence> {
    try {
      if (!db) {
        throw new Error(CommunityIntelligenceService.DB_CONNECTION_ERROR);
      }

      // Get property details
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (!property.length) {
        throw new Error('Property not found');
      }

      const [propertyData] = property;

      // Get reviews and ratings
      const reviewData = await this.getReviewAnalysis(propertyId);

      // Get owner trust score
      const ownerData = propertyData?.ownerId ? await db
        .select({ trustScore: users.trustScore })
        .from(users)
        .where(eq(users.id, propertyData.ownerId))
        .limit(1) : [];

      const ownerTrustScore = ownerData[0]?.trustScore || 50;

      // Get community flags
      const communityFlags = await this.getCommunityFlags(propertyId);

      // Get neighborhood insights
      const neighborhoodInsights = await this.getNeighborhoodInsights(propertyData?.location || '');

      // Calculate community score
      const communityScore = this.calculateCommunityScore(
        reviewData,
        ownerTrustScore,
        communityFlags,
        neighborhoodInsights
      );

      // Identify risk indicators
      const riskIndicators = propertyData ? this.identifyRiskIndicators(
        reviewData,
        ownerTrustScore,
        communityFlags,
        propertyData
      ) : [];

      return {
        propertyId,
        communityScore,
        reviewCount: reviewData.reviewCount,
        averageRating: reviewData.averageRating,
        verifiedReviews: reviewData.verifiedReviews,
        ownerTrustScore,
        communityFlags,
        neighborhoodInsights,
        riskIndicators,
        lastUpdated: new Date()
      };

    } catch (error) {
      throw new Error(`Failed to get community intelligence: ${error instanceof Error ? error.message : CommunityIntelligenceService.UNKNOWN_ERROR}`);
    }
  }

  /**
   * Submit community report about a property
   */
  async submitCommunityReport(report: CommunityReport): Promise<{ reportId: string; status: string }> {
    try {
      // Validate report
      await this.validateCommunityReport(report);

      // Store report (in real implementation, would have a community_reports table)
      const [randomValue] = globalThis.crypto.getRandomValues(new Uint32Array(1));
      const reportId = `report_${Date.now()}_${(randomValue ?? 0).toString(36)}`;

      // For now, create a community flag based on the report
      await this.createCommunityFlag(report, reportId);

      // Update property community intelligence
      await this.updateCommunityIntelligence(report.propertyId);

      return {
        reportId,
        status: 'submitted'
      };

    } catch (error) {
      throw new Error(`Failed to submit community report: ${error instanceof Error ? error.message : CommunityIntelligenceService.UNKNOWN_ERROR}`);
    }
  }

  /**
   * Get neighborhood market analysis
   */
  async getNeighborhoodAnalysis(location: string): Promise<{
    insights: NeighborhoodInsights;
    comparableProperties: Array<{
      id: number;
      title: string;
      price: string;
      rating: number;
      distance: string;
    }>;
    marketActivity: {
      newListings: number;
      averageDaysOnMarket: number;
      priceChanges: number;
    };
  }> {
    try {
      const insights = await this.getNeighborhoodInsights(location);
      const comparableProperties = await this.getComparableProperties(location);
      const marketActivity = await this.getMarketActivity(location);

      return {
        insights,
        comparableProperties,
        marketActivity
      };

    } catch (error) {
      throw new Error(`Failed to get neighborhood analysis: ${error instanceof Error ? error.message : CommunityIntelligenceService.UNKNOWN_ERROR}`);
    }
  }

  /**
   * Analyze review data for a property
   */
  private async getReviewAnalysis(propertyId: number): Promise<{
    reviewCount: number;
    averageRating: number;
    verifiedReviews: number;
    recentReviews: number;
    suspiciousPatterns: string[];
  }> {
    if (!db) {
      throw new Error(CommunityIntelligenceService.DB_CONNECTION_ERROR);
    }

    const reviewStats = await db
      .select({
        count: count(),
        avgRating: avg(reviews.rating),
        verifiedCount: sql<number>`COUNT(CASE WHEN ${reviews.verified} = true THEN 1 END)`,
        recentCount: sql<number>`COUNT(CASE WHEN ${reviews.createdAt} >= NOW() - INTERVAL '30 days' THEN 1 END)`
      })
      .from(reviews)
      .where(and(
        eq(reviews.propertyId, propertyId),
        eq(reviews.isActive, true)
      ));

    const [stats] = reviewStats;
    const reviewCount = stats?.count || 0;
    const averageRating = parseFloat(stats?.avgRating || '0');
    const verifiedReviews = stats?.verifiedCount || 0;
    const recentReviews = stats?.recentCount || 0;

    // Detect suspicious review patterns
    const suspiciousPatterns = await this.detectSuspiciousReviewPatterns(propertyId);

    return {
      reviewCount,
      averageRating,
      verifiedReviews,
      recentReviews,
      suspiciousPatterns
    };
  }

  /**
   * Detect suspicious review patterns
   */
  private async detectSuspiciousReviewPatterns(propertyId: number): Promise<string[]> {
    if (!db) return [];

    const patterns: string[] = [];

    // Get all reviews for analysis
    const allReviews = await db
      .select({
        rating: reviews.rating,
        comment: reviews.comment,
        userId: reviews.userId,
        createdAt: reviews.createdAt,
        verified: reviews.verified
      })
      .from(reviews)
      .where(and(
        eq(reviews.propertyId, propertyId),
        eq(reviews.isActive, true)
      ))
      .orderBy(desc(reviews.createdAt));

    if (allReviews.length === 0) return patterns;

    // Check for rating manipulation
    const ratings = allReviews.map(r => r.rating);
    const averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

    if (averageRating > 4.5 && allReviews.length > 5) {
      const lowRatings = ratings.filter(r => r <= 3).length;
      if (lowRatings === 0) {
        patterns.push('Unusually high ratings with no negative feedback');
      }
    }

    // Check for review clustering
    const recentReviews = allReviews.filter(r => {
      const daysDiff = (Date.now() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });

    if (recentReviews.length > 3 && allReviews.length > 5) {
      patterns.push('Multiple reviews submitted within a short timeframe');
    }

    // Check for similar comments
    const comments = allReviews.map(r => r.comment?.toLowerCase() || '');
    const similarComments = this.findSimilarComments(comments);
    if (similarComments.length > 0) {
      patterns.push('Similar or duplicate review comments detected');
    }

    // Check verified vs unverified ratio
    const verifiedCount = allReviews.filter(r => r.verified).length;
    const verifiedRatio = verifiedCount / allReviews.length;

    if (verifiedRatio < 0.3 && allReviews.length > 5) {
      patterns.push('Low ratio of verified reviews');
    }

    return patterns;
  }

  /**
   * Find similar comments in reviews
   */
  private findSimilarComments(comments: string[]): string[] {
    const similar: string[] = [];

    for (let i = 0; i < comments.length; i++) {
      for (let j = i + 1; j < comments.length; j++) {
        const comment1 = comments[i];
        const comment2 = comments[j];
        if (comment1 && comment2) {
          const similarity = this.calculateStringSimilarity(comment1, comment2);
          if (similarity > 0.8) {
            similar.push(`Comments ${i + 1} and ${j + 1} are highly similar`);
          }
        }
      }
    }

    return similar;
  }

  /**
   * Calculate string similarity using simple algorithm
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');

    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);

    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  /**
   * Get community flags for a property
   */
  private async getCommunityFlags(_propertyId: number): Promise<CommunityFlag[]> {
    // In real implementation, would query community_flags table
    // For now, return empty array as we don't have the table yet
    return [];
  }

  /**
   * Get neighborhood insights
   */
  private async getNeighborhoodInsights(location: string): Promise<NeighborhoodInsights> {
    if (!db) {
      throw new Error(CommunityIntelligenceService.DB_CONNECTION_ERROR);
    }

    // Get properties in the same location
    const locationProperties = await db
      .select({
        price: properties.price,
        features: properties.features,
        createdAt: properties.createdAt
      })
      .from(properties)
      .where(and(
        eq(properties.location, location),
        eq(properties.isActive, true)
      ));

    if (locationProperties.length === 0) {
      return {
        averagePrice: 0,
        priceRange: [0, 0],
        propertyCount: 0,
        averageRating: 0,
        commonAmenities: [],
        marketTrend: 'stable'
      };
    }

    // Calculate price statistics
    const prices = locationProperties.map(p => parseFloat(p.price));
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Get average rating for the area
    const areaRating = await this.getAreaAverageRating(location);

    // Extract common amenities
    const commonAmenities = this.extractCommonAmenities(locationProperties);

    // Determine market trend
    const marketTrend = this.calculateMarketTrend(locationProperties);

    return {
      averagePrice: Math.round(averagePrice),
      priceRange: [minPrice, maxPrice],
      propertyCount: locationProperties.length,
      averageRating: areaRating,
      commonAmenities,
      marketTrend
    };
  }

  /**
   * Get average rating for an area
   */
  private async getAreaAverageRating(location: string): Promise<number> {
    if (!db) return 0;

    const areaRatings = await db
      .select({
        avgRating: avg(reviews.rating)
      })
      .from(reviews)
      .innerJoin(properties, eq(properties.id, reviews.propertyId))
      .where(and(
        eq(properties.location, location),
        eq(reviews.isActive, true)
      ));

    return parseFloat(areaRatings[0]?.avgRating || '0');
  }

  /**
   * Extract common amenities from properties
   */
  private extractCommonAmenities(locationProperties: Array<{ features: { amenities?: string[] } | null }>): string[] {
    const amenityCount: Record<string, number> = {};

    locationProperties.forEach(property => {
      if (property.features?.amenities) {
        property.features.amenities.forEach((amenity: string) => {
          const currentCount = amenityCount[amenity] || 0;
          amenityCount[amenity] = currentCount + 1;
        });
      }
    });

    // Return amenities that appear in at least 30% of properties
    const threshold = Math.ceil(locationProperties.length * 0.3);
    return Object.entries(amenityCount)
      .filter(([, count]) => count >= threshold)
      .map(([amenity]) => amenity)
      .slice(0, 5); // Top 5 common amenities
  }

  /**
   * Calculate market trend
   */
  private calculateMarketTrend(locationProperties: Array<{ price: string; createdAt: Date }>): 'rising' | 'stable' | 'declining' {
    if (locationProperties.length < 5) return 'stable';

    // Sort by creation date (create new array to avoid mutation)
    const sortedProperties = [...locationProperties].sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Compare first half vs second half average prices
    const midPoint = Math.floor(sortedProperties.length / 2);
    const firstHalf = sortedProperties.slice(0, midPoint);
    const secondHalf = sortedProperties.slice(midPoint);

    const firstHalfAvg = firstHalf.reduce((sum: number, p) => sum + parseFloat(p.price), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum: number, p) => sum + parseFloat(p.price), 0) / secondHalf.length;

    const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (changePercent > 10) return 'rising';
    if (changePercent < -10) return 'declining';
    return 'stable';
  }

  /**
   * Calculate community score
   */
  private calculateCommunityScore(
    reviewData: {
      reviewCount: number;
      averageRating: number;
      verifiedReviews: number;
      suspiciousPatterns: string[];
    },
    ownerTrustScore: number,
    communityFlags: CommunityFlag[],
    neighborhoodInsights: NeighborhoodInsights
  ): number {
    let score = 50; // Base score

    // Review-based scoring
    if (reviewData.reviewCount > 0) {
      score += (reviewData.averageRating - 3) * 10; // -20 to +20 based on rating
      score += Math.min(reviewData.verifiedReviews * 5, 20); // Up to +20 for verified reviews
      score -= reviewData.suspiciousPatterns.length * 10; // -10 per suspicious pattern
    }

    // Owner trust score influence
    score += (ownerTrustScore - 50) * 0.3; // -15 to +15 based on owner trust

    // Community flags influence
    const negativeFlags = communityFlags.filter(f => f.type === 'negative').length;
    const positiveFlags = communityFlags.filter(f => f.type === 'positive').length;
    score -= negativeFlags * 15;
    score += positiveFlags * 10;

    // Neighborhood influence
    if (neighborhoodInsights.averageRating > 0) {
      score += (neighborhoodInsights.averageRating - 3) * 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Identify risk indicators
   */
  private identifyRiskIndicators(
    reviewData: {
      reviewCount: number;
      averageRating: number;
      verifiedReviews: number;
      suspiciousPatterns: string[];
    },
    ownerTrustScore: number,
    communityFlags: CommunityFlag[],
    propertyData: {
      imageUrls?: string[];
      description: string;
    }
  ): string[] {
    const indicators: string[] = [];

    // Review-based indicators
    if (reviewData.suspiciousPatterns.length > 0) {
      indicators.push('Suspicious review patterns detected');
    }

    if (reviewData.reviewCount > 0 && reviewData.verifiedReviews === 0) {
      indicators.push('No verified reviews available');
    }

    if (reviewData.averageRating < 2.5) {
      indicators.push('Below average community rating');
    }

    // Owner-based indicators
    if (ownerTrustScore < 30) {
      indicators.push('Owner has low trust score');
    }

    // Property-based indicators
    if (!propertyData.imageUrls || propertyData.imageUrls.length === 0) {
      indicators.push('No property images available');
    }

    if (propertyData.description.length < 100) {
      indicators.push('Limited property description');
    }

    // Community flag indicators
    const highSeverityFlags = communityFlags.filter(f => f.type === 'negative');
    if (highSeverityFlags.length > 0) {
      indicators.push('Community has raised concerns about this property');
    }

    return indicators;
  }

  /**
   * Get comparable properties in the area
   */
  private async getComparableProperties(location: string): Promise<Array<{
    id: number;
    title: string;
    price: string;
    rating: number;
    distance: string;
  }>> {
    if (!db) return [];

    const comparableProperties = await db
      .select({
        id: properties.id,
        title: properties.title,
        price: properties.price,
        avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`
      })
      .from(properties)
      .leftJoin(reviews, eq(properties.id, reviews.propertyId))
      .where(and(
        eq(properties.location, location),
        eq(properties.isActive, true)
      ))
      .groupBy(properties.id, properties.title, properties.price)
      .limit(5);

    return comparableProperties.map(comp => ({
      id: comp.id,
      title: comp.title,
      price: comp.price,
      rating: comp.avgRating || 0,
      distance: '< 1km' // Would calculate actual distance in real implementation
    }));
  }

  /**
   * Get market activity data
   */
  private async getMarketActivity(location: string): Promise<{
    newListings: number;
    averageDaysOnMarket: number;
    priceChanges: number;
  }> {
    if (!db) {
      return {
        newListings: 0,
        averageDaysOnMarket: 0,
        priceChanges: 0
      };
    }

    // Get new listings in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newListings = await db
      .select({ count: count() })
      .from(properties)
      .where(and(
        eq(properties.location, location),
        gte(properties.createdAt, thirtyDaysAgo)
      ));

    return {
      newListings: newListings[0]?.count || 0,
      averageDaysOnMarket: 45, // Would calculate from actual data
      priceChanges: 3 // Would track price change history
    };
  }

  /**
   * Validate community report
   */
  private async validateCommunityReport(report: CommunityReport): Promise<void> {
    if (!report.description || report.description.length < 20) {
      throw new Error('Report description must be at least 20 characters');
    }

    if (!report.propertyId || report.propertyId <= 0) {
      throw new Error('Valid property ID is required');
    }

    if (!report.reporterId || report.reporterId <= 0) {
      throw new Error('Valid reporter ID is required');
    }

    // Check if property exists
    if (!db) {
      throw new Error(CommunityIntelligenceService.DB_CONNECTION_ERROR);
    }

    const property = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.id, report.propertyId))
      .limit(1);

    if (!property.length) {
      throw new Error('Property not found');
    }
  }

  /**
   * Create community flag from report
   */
  private async createCommunityFlag(report: CommunityReport, _reportId: string): Promise<void> {
    // In real implementation, would store in community_flags table
    // For now, we'll just acknowledge the report parameters
    void report.propertyId; // Acknowledge parameter usage
  }

  /**
   * Update community intelligence after new report
   */
  private async updateCommunityIntelligence(_propertyId: number): Promise<void> {
    // In real implementation, would recalculate and cache community intelligence
    // For now, this is a placeholder
  }
}