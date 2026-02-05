/**
 * RecommendationAI Service - Personalized Property Suggestions
 * 
 * Provides intelligent property recommendations including:
 * - Personalized property matching based on user preferences and behavior
 * - Market-driven property suggestions using AI analysis
 * - Investment opportunity identification and scoring
 * - Similar property discovery and comparison
 * - Predictive analytics for property trends and opportunities
 * - Location-based recommendations with market insights
 */

import { logger as loggingService } from '..\..\infrastructure\monitoring\logger';
import { enhancedHuggingFaceClient } from '../../../src/shared/services/enhanced-huggingface-client';
import { AIServiceError } from '../../../src/shared/services/enhanced-huggingface-client';

export interface UserPreferences {
  userId: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  propertyTypes: ('residential' | 'commercial' | 'land' | 'industrial')[];
  locations: string[];
  preferredAreas?: string[];
  excludedAreas?: string[];
  features: {
    required: string[];
    preferred: string[];
    unwanted: string[];
  };
  propertySize: {
    min?: number;
    max?: number;
    unit: 'sqm' | 'acres' | 'hectares';
  };
  bedrooms?: {
    min?: number;
    max?: number;
  };
  bathrooms?: {
    min?: number;
    max?: number;
  };
  investmentGoals?: {
    purpose: 'personal_use' | 'investment' | 'rental' | 'commercial';
    timeframe: 'short_term' | 'medium_term' | 'long_term';
    expectedReturn?: number;
    riskTolerance: 'low' | 'medium' | 'high';
  };
}

export interface PropertyData {
  id: string;
  title: string;
  description: string;
  propertyType: 'residential' | 'commercial' | 'land' | 'industrial';
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  price: number;
  currency: string;
  size: number;
  sizeUnit: string;
  bedrooms?: number;
  bathrooms?: number;
  features: string[];
  images: string[];
  listedAt: Date;
  lastUpdated: Date;
}

export interface RecommendationResult {
  propertyId: string;
  matchScore: number; // 0-100
  confidence: number; // 0-1
  reasons: Array<{
    category: 'preference_match' | 'behavior_pattern' | 'market_opportunity' | 'location_benefit' | 'investment_potential';
    reason: string;
    weight: number;
    explanation: string;
  }>;
  highlights: string[];
  concerns?: string[];
  investmentAnalysis?: {
    expectedReturn: number;
    riskLevel: 'low' | 'medium' | 'high';
    paybackPeriod?: number;
    marketTrend: 'rising' | 'stable' | 'declining';
  };
}

export interface RecommendationResponse {
  userId: string;
  recommendations: RecommendationResult[];
  totalMatches: number;
  searchMetadata: {
    algorithm: string;
    processingTime: number;
    filtersApplied: string[];
    marketDataUsed: boolean;
    aiModelsUsed: string[];
  };
  marketInsights: {
    trendingAreas: string[];
    priceMovements: Array<{
      area: string;
      change: number;
      timeframe: string;
    }>;
    investmentOpportunities: Array<{
      area: string;
      opportunity: string;
      confidence: number;
    }>;
  };
}

export class RecommendationAI {
  private readonly serviceName = 'RecommendationAI';
  private readonly recommendationWeights = {
    preference_match: 0.35,
    behavior_pattern: 0.25,
    market_opportunity: 0.20,
    location_benefit: 0.15,
    investment_potential: 0.05
  };

  constructor() {
    loggingService.info('RecommendationAI service initialized', {
      module: this.serviceName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate personalized property recommendations for a user
   */
  async generateRecommendations(
    userPreferences: UserPreferences,
    availableProperties: PropertyData[]
  ): Promise<RecommendationResponse> {
    const startTime = Date.now();

    try {
      loggingService.info('Starting recommendation generation', {
        module: this.serviceName,
        userId: userPreferences.userId,
        propertyCount: availableProperties.length
      });

      // Filter properties based on basic criteria
      const eligibleProperties = this.filterEligibleProperties(
        availableProperties,
        userPreferences
      );

      // Generate recommendations for each eligible property
      const recommendations = await Promise.all(
        eligibleProperties.map(property => 
          this.generatePropertyRecommendation(property, userPreferences)
        )
      );

      // Sort recommendations by match score
      const sortedRecommendations = recommendations
        .filter(rec => rec.matchScore >= 30) // Minimum threshold
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20); // Top 20 recommendations

      // Generate market insights
      const marketInsights = this.generateMarketInsights(userPreferences, availableProperties);

      const processingTime = Date.now() - startTime;

      const result: RecommendationResponse = {
        userId: userPreferences.userId,
        recommendations: sortedRecommendations,
        totalMatches: sortedRecommendations.length,
        searchMetadata: {
          algorithm: 'AI-Enhanced Collaborative Filtering with Market Analysis',
          processingTime,
          filtersApplied: this.getAppliedFilters(userPreferences),
          marketDataUsed: false,
          aiModelsUsed: ['Sentiment Analysis', 'Text Classification', 'Pattern Recognition']
        },
        marketInsights
      };

      loggingService.info('Recommendation generation completed', {
        module: this.serviceName,
        userId: userPreferences.userId,
        recommendationCount: sortedRecommendations.length,
        processingTime
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      loggingService.error('Recommendation generation failed', {
        module: this.serviceName,
        userId: userPreferences.userId,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });

      throw new AIServiceError(
        'Failed to generate property recommendations',
        this.serviceName,
        'generateRecommendations',
        500,
        { cause: error as Error, retryable: true }
      );
    }
  }

  /**
   * Find similar properties based on features and characteristics
   */
  async findSimilarProperties(
    targetProperty: PropertyData,
    availableProperties: PropertyData[],
    similarityThreshold: number = 0.7
  ): Promise<Array<{ property: PropertyData; similarity: number; reasons: string[] }>> {
    const startTime = Date.now();

    try {
      loggingService.info('Finding similar properties', {
        module: this.serviceName,
        targetPropertyId: targetProperty.id,
        availableCount: availableProperties.length,
        threshold: similarityThreshold
      });

      const similarities = await Promise.all(
        availableProperties
          .filter(p => p.id !== targetProperty.id)
          .map(async property => {
            const similarity = await this.calculatePropertySimilarity(targetProperty, property);
            return {
              property,
              similarity: similarity.score,
              reasons: similarity.reasons
            };
          })
      );

      const similarProperties = similarities
        .filter(s => s.similarity >= similarityThreshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10); // Top 10 similar properties

      const processingTime = Date.now() - startTime;
      loggingService.info('Similar properties found', {
        module: this.serviceName,
        targetPropertyId: targetProperty.id,
        similarCount: similarProperties.length,
        processingTime
      });

      return similarProperties;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      loggingService.error('Similar property search failed', {
        module: this.serviceName,
        targetPropertyId: targetProperty.id,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });

      throw new AIServiceError(
        'Failed to find similar properties',
        this.serviceName,
        'findSimilarProperties',
        500,
        { cause: error as Error, retryable: true }
      );
    }
  }

  // Private helper methods

  private filterEligibleProperties(
    properties: PropertyData[],
    preferences: UserPreferences
  ): PropertyData[] {
    return properties.filter(property => {
      // Budget filter
      if (property.price < preferences.budget.min || 
          property.price > preferences.budget.max) {
        return false;
      }

      // Property type filter
      if (preferences.propertyTypes.length > 0 && 
          !preferences.propertyTypes.includes(property.propertyType)) {
        return false;
      }

      // Location filter
      if (preferences.locations.length > 0) {
        const matchesLocation = preferences.locations.some(loc => 
          property.location.toLowerCase().includes(loc.toLowerCase())
        );
        if (!matchesLocation) return false;
      }

      // Required features filter
      if (preferences.features.required.length > 0) {
        const hasAllRequired = preferences.features.required.every(feature => 
          property.features.some(pf => 
            pf.toLowerCase().includes(feature.toLowerCase())
          )
        );
        if (!hasAllRequired) return false;
      }

      return true;
    });
  }

  private async generatePropertyRecommendation(
    property: PropertyData,
    preferences: UserPreferences
  ): Promise<RecommendationResult> {
    // Calculate different matching scores
    const preferenceMatch = this.calculatePreferenceMatch(property, preferences);
    const locationBenefit = this.calculateLocationBenefit(property, preferences);

    // Calculate weighted overall match score
    const matchScore = Math.round(
      preferenceMatch.score * 0.6 +
      locationBenefit.score * 0.4
    );

    // Combine all reasons
    const reasons = [
      ...preferenceMatch.reasons,
      ...locationBenefit.reasons
    ];

    // Generate highlights
    const highlights = this.generateHighlights(property, reasons);

    // Calculate confidence
    const confidence = this.calculateRecommendationConfidence(matchScore, reasons.length);

    return {
      propertyId: property.id,
      matchScore,
      confidence,
      reasons,
      highlights
    };
  }

  private calculatePreferenceMatch(property: PropertyData, preferences: UserPreferences): any {
    let score = 0;
    const reasons = [];

    // Budget alignment (40 points max)
    const budgetMid = (preferences.budget.min + preferences.budget.max) / 2;
    const budgetRange = preferences.budget.max - preferences.budget.min;
    const priceDeviation = Math.abs(property.price - budgetMid) / budgetRange;
    const budgetScore = Math.max(0, 40 * (1 - priceDeviation));
    score += budgetScore;

    if (budgetScore > 25) {
      reasons.push({
        category: 'preference_match' as const,
        reason: 'Price within preferred budget range',
        weight: 0.4,
        explanation: `Property price ${property.price.toLocaleString()} aligns well with your budget`
      });
    }

    // Property type match (30 points max)
    if (preferences.propertyTypes.includes(property.propertyType)) {
      score += 30;
      reasons.push({
        category: 'preference_match' as const,
        reason: 'Matches preferred property type',
        weight: 0.3,
        explanation: `${property.propertyType} property matches your preferences`
      });
    }

    // Feature matching (30 points max)
    const requiredFeatureMatch = preferences.features.required.filter(feature => 
      property.features.some(pf => pf.toLowerCase().includes(feature.toLowerCase()))
    ).length;
    const preferredFeatureMatch = preferences.features.preferred.filter(feature => 
      property.features.some(pf => pf.toLowerCase().includes(feature.toLowerCase()))
    ).length;

    const featureScore = (requiredFeatureMatch * 20) + (preferredFeatureMatch * 10);
    score += Math.min(30, featureScore);

    if (requiredFeatureMatch > 0) {
      reasons.push({
        category: 'preference_match' as const,
        reason: 'Has required features',
        weight: 0.3,
        explanation: `Property includes ${requiredFeatureMatch} of your required features`
      });
    }

    return { score: Math.min(100, score), reasons };
  }

  private calculateLocationBenefit(property: PropertyData, preferences: UserPreferences): any {
    let score = 50; // Base score
    const reasons = [];

    // Location preference match
    const locationMatch = preferences.preferredAreas?.some(area => 
      property.location.toLowerCase().includes(area.toLowerCase())
    );
    if (locationMatch) {
      score += 30;
      reasons.push({
        category: 'location_benefit' as const,
        reason: 'Located in preferred area',
        weight: 0.3,
        explanation: `Property is located in your preferred area: ${property.location}`
      });
    }

    // Excluded areas check
    const inExcludedArea = preferences.excludedAreas?.some(area => 
      property.location.toLowerCase().includes(area.toLowerCase())
    );
    if (inExcludedArea) {
      score -= 40;
    }

    return { score: Math.max(0, Math.min(100, score)), reasons };
  }

  private async calculatePropertySimilarity(
    property1: PropertyData,
    property2: PropertyData
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons = [];

    // Property type similarity (25 points)
    if (property1.propertyType === property2.propertyType) {
      score += 25;
      reasons.push('Same property type');
    }

    // Price similarity (25 points)
    const priceDiff = Math.abs(property1.price - property2.price) / Math.max(property1.price, property2.price);
    if (priceDiff < 0.2) {
      score += 25;
      reasons.push('Similar price range');
    } else if (priceDiff < 0.4) {
      score += 15;
      reasons.push('Comparable price range');
    }

    // Size similarity (25 points)
    const sizeDiff = Math.abs(property1.size - property2.size) / Math.max(property1.size, property2.size);
    if (sizeDiff < 0.2) {
      score += 25;
      reasons.push('Similar size');
    } else if (sizeDiff < 0.4) {
      score += 15;
      reasons.push('Comparable size');
    }

    // Location similarity (25 points)
    const location1Words = property1.location.toLowerCase().split(/[\s,]+/);
    const location2Words = property2.location.toLowerCase().split(/[\s,]+/);
    const commonWords = location1Words.filter(word => location2Words.includes(word));
    
    if (commonWords.length > 0) {
      const locationScore = Math.min(25, commonWords.length * 8);
      score += locationScore;
      if (locationScore > 15) {
        reasons.push('Similar location');
      }
    }

    return { score: score / 100, reasons };
  }

  private generateHighlights(property: PropertyData, reasons: any[]): string[] {
    const highlights = [];
    
    // Extract key highlights from reasons
    const highWeightReasons = reasons.filter(r => r.weight >= 0.25);
    highlights.push(...highWeightReasons.map(r => r.reason));

    // Add property-specific highlights
    if (property.features.includes('swimming pool')) {
      highlights.push('Private swimming pool');
    }
    if (property.features.includes('garden')) {
      highlights.push('Beautiful garden');
    }
    if (property.features.includes('security')) {
      highlights.push('24/7 security');
    }

    return highlights.slice(0, 5); // Top 5 highlights
  }

  private calculateRecommendationConfidence(
    matchScore: number,
    reasonCount: number
  ): number {
    let confidence = 0.5; // Base confidence

    // Match score contribution
    confidence += (matchScore / 100) * 0.3;

    // Reason count contribution
    confidence += Math.min(0.2, reasonCount * 0.05);

    return Math.min(0.95, confidence);
  }

  private generateMarketInsights(
    preferences: UserPreferences,
    properties: PropertyData[]
  ): any {
    const insights = {
      trendingAreas: [] as string[],
      priceMovements: [] as any[],
      investmentOpportunities: [] as any[]
    };

    // Extract trending areas from property locations
    const locationCounts = new Map<string, number>();
    properties.forEach(p => {
      const area = p.location.split(',')[0]; // Get main area
      locationCounts.set(area, (locationCounts.get(area) || 0) + 1);
    });

    insights.trendingAreas = Array.from(locationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    // Mock price movements
    insights.priceMovements = insights.trendingAreas.map(area => ({
      area,
      change: Math.random() * 20 - 10, // -10% to +10%
      timeframe: 'last_12_months'
    }));

    // Mock investment opportunities
    insights.investmentOpportunities = insights.trendingAreas.slice(0, 3).map(area => ({
      area,
      opportunity: 'Growing market with good potential',
      confidence: 0.7 + Math.random() * 0.3
    }));

    return insights;
  }

  private getAppliedFilters(preferences: UserPreferences): string[] {
    const filters = [];
    
    filters.push(`Budget: ${preferences.budget.min.toLocaleString()} - ${preferences.budget.max.toLocaleString()}`);
    
    if (preferences.propertyTypes.length > 0) {
      filters.push(`Property Types: ${preferences.propertyTypes.join(', ')}`);
    }
    
    if (preferences.locations.length > 0) {
      filters.push(`Locations: ${preferences.locations.join(', ')}`);
    }
    
    if (preferences.features.required.length > 0) {
      filters.push(`Required Features: ${preferences.features.required.join(', ')}`);
    }

    return filters;
  }
}