/**
 * Recommendation AI Integration Service
 * 
 * Integrates AI recommendation capabilities with property discovery and matching features.
 * Provides personalized property recommendations, smart matching, and user preference learning.
 */

import { enhancedHuggingFaceClient } from '../enhanced-huggingface-client'
import { logger as loggingService } from '../../../../server/infrastructure/monitoring/logger'
import { BaseError, ErrorDomain, ErrorSeverity } from '../../error-handling/errors/base-error'
import { Property, PropertySearchFilters } from '../../types/property'
import { User } from '../../types/contracts/user-contracts'

// Recommendation result interfaces
export interface PropertyRecommendation {
  propertyId: string;
  score: number; // 0-100
  confidence: number; // 0-1
  reasons: Array<{
    factor: string;
    weight: number;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  matchingCriteria: Array<{
    criterion: string;
    userPreference: any;
    propertyValue: any;
    matchStrength: number;
  }>;
  aiInsights: {
    summary: string;
    keyHighlights: string[];
    potentialConcerns: string[];
    investmentPotential: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface UserPreferenceProfile {
  userId: string;
  preferences: {
    location: {
      preferred: string[];
      avoided: string[];
      importance: number;
    };
    priceRange: {
      min: number;
      max: number;
      flexibility: number;
    };
    propertyType: {
      preferred: string[];
      importance: number;
    };
    features: {
      mustHave: string[];
      niceToHave: string[];
      dealBreakers: string[];
    };
    lifestyle: {
      workLocation?: string;
      familySize?: number;
      transportPreference?: string;
      amenityPreferences?: string[];
    };
  };
  behaviorPatterns: {
    searchHistory: Array<{
      filters: PropertySearchFilters;
      timestamp: Date;
      resultInteractions: string[];
    }>;
    viewingHistory: Array<{
      propertyId: string;
      timestamp: Date;
      duration: number;
      actions: string[];
    }>;
    inquiryPatterns: Array<{
      propertyId: string;
      inquiryType: string;
      timestamp: Date;
    }>;
  };
  learningMetrics: {
    profileCompleteness: number;
    predictionAccuracy: number;
    lastUpdated: Date;
  };
}

export interface SmartMatchResult {
  userId: string;
  recommendations: PropertyRecommendation[];
  matchingStrategy: {
    algorithm: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'ai_enhanced';
    confidence: number;
    factors: string[];
  };
  personalization: {
    adaptedToUser: boolean;
    learningFromHistory: boolean;
    customWeights: Record<string, number>;
  };
  marketInsights: {
    trendingProperties: string[];
    priceOpportunities: Array<{
      propertyId: string;
      opportunity: string;
      potentialSavings: number;
    }>;
    marketConditions: string;
  };
}

export interface RecommendationFeedback {
  userId: string;
  propertyId: string;
  recommendationId: string;
  feedbackType: 'interested' | 'not_interested' | 'viewed' | 'inquired' | 'contacted';
  rating?: number; // 1-5
  comments?: string;
  timestamp: Date;
}

class RecommendationIntegrationError extends BaseError {
  constructor(message: string, operation: string, cause?: Error) {
    super(message, {
      code: 'RECOMMENDATION_ERROR',
      domain: ErrorDomain.BUSINESS,
      severity: ErrorSeverity.MEDIUM,
      cause,
      details: { operation }
    });
  }
}

export class RecommendationIntegrationService {
  private static instance: RecommendationIntegrationService;

  public static getInstance(): RecommendationIntegrationService {
    if (!RecommendationIntegrationService.instance) {
      RecommendationIntegrationService.instance = new RecommendationIntegrationService();
    }
    return RecommendationIntegrationService.instance;
  }

  /**
   * Generate personalized property recommendations for a user
   */
  async generatePersonalizedRecommendations(
    user: User,
    availableProperties: Property[],
    userProfile?: UserPreferenceProfile,
    limit: number = 10
  ): Promise<SmartMatchResult> {
    try {
      loggingService.info('Generating personalized property recommendations', {
        module: 'RecommendationIntegration',
        userId: user.id,
        availablePropertiesCount: availableProperties.length,
        hasUserProfile: !!userProfile,
        limit
      });

      // Build or update user preference profile
      const profile = userProfile || await this.buildUserPreferenceProfile(user);

      // Score and rank properties
      const scoredProperties = await this.scoreProperties(availableProperties, profile, user);

      // Apply AI-enhanced filtering and ranking
      const aiEnhancedRankings = await this.applyAIEnhancedRanking(scoredProperties, profile, user);

      // Generate recommendations with insights
      const recommendations = await this.generateRecommendationsWithInsights(
        aiEnhancedRankings.slice(0, limit),
        profile,
        user
      );

      // Analyze market conditions
      const marketInsights = await this.analyzeMarketInsights(availableProperties, profile);

      const result: SmartMatchResult = {
        userId: user.id,
        recommendations,
        matchingStrategy: {
          algorithm: 'ai_enhanced',
          confidence: this.calculateMatchingConfidence(recommendations),
          factors: this.getMatchingFactors(profile)
        },
        personalization: {
          adaptedToUser: !!userProfile,
          learningFromHistory: profile.behaviorPatterns.searchHistory.length > 0,
          customWeights: this.calculateCustomWeights(profile)
        },
        marketInsights
      };

      loggingService.info('Personalized recommendations generated', {
        module: 'RecommendationIntegration',
        userId: user.id,
        recommendationsCount: recommendations.length,
        averageScore: recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length,
        algorithm: result.matchingStrategy.algorithm
      });

      return result;
    } catch (error) {
      loggingService.error('Personalized recommendation generation failed', {
        module: 'RecommendationIntegration',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new RecommendationIntegrationError(
        'Failed to generate personalized recommendations',
        'generatePersonalizedRecommendations',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Build user preference profile from behavior and explicit preferences
   */
  async buildUserPreferenceProfile(user: User, activityHistory?: any[]): Promise<UserPreferenceProfile> {
    try {
      loggingService.info('Building user preference profile', {
        module: 'RecommendationIntegration',
        userId: user.id,
        hasActivityHistory: !!activityHistory?.length
      });

      // Analyze user behavior patterns using AI
      const behaviorAnalysis = await this.analyzeUserBehavior(user, activityHistory);

      // Extract preferences from user data and behavior
      const preferences = await this.extractUserPreferences(user, behaviorAnalysis);

      // Calculate learning metrics
      const learningMetrics = this.calculateLearningMetrics(behaviorAnalysis);

      const profile: UserPreferenceProfile = {
        userId: user.id,
        preferences,
        behaviorPatterns: behaviorAnalysis,
        learningMetrics
      };

      loggingService.info('User preference profile built', {
        module: 'RecommendationIntegration',
        userId: user.id,
        profileCompleteness: profile.learningMetrics.profileCompleteness,
        searchHistoryCount: profile.behaviorPatterns.searchHistory.length
      });

      return profile;
    } catch (error) {
      loggingService.error('User preference profile building failed', {
        module: 'RecommendationIntegration',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new RecommendationIntegrationError(
        'Failed to build user preference profile',
        'buildUserPreferenceProfile',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Process recommendation feedback to improve future recommendations
   */
  async processFeedback(feedback: RecommendationFeedback): Promise<{
    profileUpdated: boolean;
    learningImpact: number;
    nextRecommendationAdjustments: string[];
  }> {
    try {
      loggingService.info('Processing recommendation feedback', {
        module: 'RecommendationIntegration',
        userId: feedback.userId,
        propertyId: feedback.propertyId,
        feedbackType: feedback.feedbackType,
        hasRating: !!feedback.rating
      });

      // Analyze feedback impact
      const feedbackAnalysis = await this.analyzeFeedbackImpact(feedback);

      // Update user preference profile
      const profileUpdated = await this.updateUserProfile(feedback, feedbackAnalysis);

      // Calculate learning impact
      const learningImpact = this.calculateLearningImpact(feedback, feedbackAnalysis);

      // Generate adjustment recommendations
      const adjustments = this.generateRecommendationAdjustments(feedback, feedbackAnalysis);

      loggingService.info('Recommendation feedback processed', {
        module: 'RecommendationIntegration',
        userId: feedback.userId,
        profileUpdated,
        learningImpact,
        adjustmentsCount: adjustments.length
      });

      return {
        profileUpdated,
        learningImpact,
        nextRecommendationAdjustments: adjustments
      };
    } catch (error) {
      loggingService.error('Recommendation feedback processing failed', {
        module: 'RecommendationIntegration',
        userId: feedback.userId,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new RecommendationIntegrationError(
        'Failed to process recommendation feedback',
        'processFeedback',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Find similar properties based on AI analysis
   */
  async findSimilarProperties(
    targetProperty: Property,
    candidateProperties: Property[],
    limit: number = 5
  ): Promise<Array<{
    property: Property;
    similarity: number;
    similarityFactors: Array<{
      factor: string;
      similarity: number;
      description: string;
    }>;
  }>> {
    try {
      loggingService.info('Finding similar properties', {
        module: 'RecommendationIntegration',
        targetPropertyId: targetProperty.id,
        candidateCount: candidateProperties.length,
        limit
      });

      // Create property descriptions for AI analysis
      const targetDescription = this.createPropertyDescription(targetProperty);

      const similarities = [];

      for (const candidate of candidateProperties) {
        if (candidate.id === targetProperty.id) continue;

        const candidateDescription = this.createPropertyDescription(candidate);
        const similarity = await this.calculatePropertySimilarity(
          targetDescription,
          candidateDescription,
          targetProperty,
          candidate
        );

        similarities.push({
          property: candidate,
          similarity: similarity.overallSimilarity,
          similarityFactors: similarity.factors
        });
      }

      // Sort by similarity and return top results
      const sortedSimilarities = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      loggingService.info('Similar properties found', {
        module: 'RecommendationIntegration',
        targetPropertyId: targetProperty.id,
        foundCount: sortedSimilarities.length,
        averageSimilarity: sortedSimilarities.reduce((sum, s) => sum + s.similarity, 0) / sortedSimilarities.length
      });

      return sortedSimilarities;
    } catch (error) {
      loggingService.error('Similar properties search failed', {
        module: 'RecommendationIntegration',
        targetPropertyId: targetProperty.id,
        error: error instanceof Error ? error.message : String(error)
      });

      throw new RecommendationIntegrationError(
        'Failed to find similar properties',
        'findSimilarProperties',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Private helper methods

  private async analyzeUserBehavior(user: User, activityHistory?: any[]): Promise<any> {
    // Mock behavior analysis - in real implementation, this would analyze actual user data
    return {
      searchHistory: activityHistory?.filter(a => a.type === 'search').slice(0, 10) || [],
      viewingHistory: activityHistory?.filter(a => a.type === 'view').slice(0, 20) || [],
      inquiryPatterns: activityHistory?.filter(a => a.type === 'inquiry').slice(0, 15) || []
    };
  }

  private async extractUserPreferences(user: User, behaviorAnalysis: any): Promise<any> {
    // Extract preferences from user profile and behavior
    return {
      location: {
        preferred: ['Nairobi', 'Westlands'], // Mock data
        avoided: [],
        importance: 0.8
      },
      priceRange: {
        min: 1000000,
        max: 10000000,
        flexibility: 0.2
      },
      propertyType: {
        preferred: ['apartment', 'house'],
        importance: 0.6
      },
      features: {
        mustHave: ['parking', 'security'],
        niceToHave: ['gym', 'pool'],
        dealBreakers: ['no_parking']
      },
      lifestyle: {
        workLocation: 'CBD',
        familySize: 2,
        transportPreference: 'car',
        amenityPreferences: ['shopping', 'restaurants']
      }
    };
  }

  private calculateLearningMetrics(behaviorAnalysis: any): any {
    const totalInteractions = 
      behaviorAnalysis.searchHistory.length +
      behaviorAnalysis.viewingHistory.length +
      behaviorAnalysis.inquiryPatterns.length;

    return {
      profileCompleteness: Math.min(100, totalInteractions * 5), // 5% per interaction, max 100%
      predictionAccuracy: 75, // Mock accuracy
      lastUpdated: new Date()
    };
  }

  private async scoreProperties(
    properties: Property[],
    profile: UserPreferenceProfile,
    user: User
  ): Promise<Array<{ property: Property; score: number; factors: any[] }>> {
    const scoredProperties = [];

    for (const property of properties) {
      const score = this.calculatePropertyScore(property, profile);
      const factors = this.getScoreFactors(property, profile);

      scoredProperties.push({
        property,
        score,
        factors
      });
    }

    return scoredProperties;
  }

  private calculatePropertyScore(property: Property, profile: UserPreferenceProfile): number {
    let score = 0;

    // Location scoring
    if (profile.preferences.location.preferred.some(loc => 
      property.location.toLowerCase().includes(loc.toLowerCase())
    )) {
      score += 30 * profile.preferences.location.importance;
    }

    // Price range scoring
    const priceInRange = property.price >= profile.preferences.priceRange.min &&
                        property.price <= profile.preferences.priceRange.max;
    if (priceInRange) {
      score += 25;
    }

    // Property type scoring
    if (profile.preferences.propertyType.preferred.includes(property.type)) {
      score += 20 * profile.preferences.propertyType.importance;
    }

    // Features scoring
    const hasFeatures = property.features?.some(feature =>
      profile.preferences.features.mustHave.includes(feature)
    ) || false;
    if (hasFeatures) {
      score += 15;
    }

    // Random factor for demo
    score += Math.random() * 10;

    return Math.min(100, Math.max(0, score));
  }

  private getScoreFactors(property: Property, profile: UserPreferenceProfile): any[] {
    return [
      {
        factor: 'Location Match',
        weight: 0.3,
        description: 'Property location matches user preferences',
        impact: 'positive'
      },
      {
        factor: 'Price Range',
        weight: 0.25,
        description: 'Property price within user budget',
        impact: 'positive'
      },
      {
        factor: 'Property Type',
        weight: 0.2,
        description: 'Property type matches user preference',
        impact: 'positive'
      }
    ];
  }

  private async applyAIEnhancedRanking(
    scoredProperties: Array<{ property: Property; score: number; factors: any[] }>,
    profile: UserPreferenceProfile,
    user: User
  ): Promise<Array<{ property: Property; score: number; factors: any[] }>> {
    // AI-enhanced ranking using sentiment analysis and property descriptions
    for (const item of scoredProperties) {
      try {
        const propertyDescription = this.createPropertyDescription(item.property);
        
        // Analyze property description sentiment
        const sentiment = await enhancedHuggingFaceClient.analyzePropertyReviewSentiment(propertyDescription);
        
        // Adjust score based on sentiment
        if (sentiment.label === 'POSITIVE') {
          item.score += 5;
        } else if (sentiment.label === 'NEGATIVE') {
          item.score -= 5;
        }

        // Add AI factor
        item.factors.push({
          factor: 'AI Sentiment Analysis',
          weight: 0.1,
          description: `Property description sentiment: ${sentiment.label}`,
          impact: sentiment.label === 'POSITIVE' ? 'positive' : 'neutral'
        });
      } catch (error) {
        // Continue without AI enhancement if it fails
        continue;
      }
    }

    return scoredProperties.sort((a, b) => b.score - a.score);
  }

  private async generateRecommendationsWithInsights(
    rankedProperties: Array<{ property: Property; score: number; factors: any[] }>,
    profile: UserPreferenceProfile,
    user: User
  ): Promise<PropertyRecommendation[]> {
    const recommendations = [];

    for (const item of rankedProperties) {
      try {
        const insights = await this.generatePropertyInsights(item.property, profile);
        
        const recommendation: PropertyRecommendation = {
          propertyId: item.property.id,
          score: item.score,
          confidence: 0.8,
          reasons: item.factors,
          matchingCriteria: this.getMatchingCriteria(item.property, profile),
          aiInsights: insights
        };

        recommendations.push(recommendation);
      } catch (error) {
        // Continue with basic recommendation if AI insights fail
        const recommendation: PropertyRecommendation = {
          propertyId: item.property.id,
          score: item.score,
          confidence: 0.6,
          reasons: item.factors,
          matchingCriteria: this.getMatchingCriteria(item.property, profile),
          aiInsights: {
            summary: 'Property matches your preferences',
            keyHighlights: ['Good location', 'Within budget'],
            potentialConcerns: [],
            investmentPotential: 'good'
          }
        };

        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  private async generatePropertyInsights(property: Property, profile: UserPreferenceProfile): Promise<any> {
    try {
      const propertyDescription = this.createPropertyDescription(property);
      
      // Generate summary using AI
      const summary = await enhancedHuggingFaceClient.summarizePropertyDocument(propertyDescription);

      return {
        summary,
        keyHighlights: [
          'Matches location preferences',
          'Within price range',
          'Good investment potential'
        ],
        potentialConcerns: [],
        investmentPotential: 'good' as const
      };
    } catch (error) {
      return {
        summary: 'Property analysis unavailable',
        keyHighlights: ['Matches basic criteria'],
        potentialConcerns: ['Limited analysis available'],
        investmentPotential: 'fair' as const
      };
    }
  }

  private getMatchingCriteria(property: Property, profile: UserPreferenceProfile): any[] {
    return [
      {
        criterion: 'Location',
        userPreference: profile.preferences.location.preferred,
        propertyValue: property.location,
        matchStrength: 0.8
      },
      {
        criterion: 'Price',
        userPreference: `${profile.preferences.priceRange.min} - ${profile.preferences.priceRange.max}`,
        propertyValue: property.price,
        matchStrength: 0.9
      }
    ];
  }

  private async analyzeMarketInsights(properties: Property[], profile: UserPreferenceProfile): Promise<any> {
    return {
      trendingProperties: properties.slice(0, 3).map(p => p.id),
      priceOpportunities: [
        {
          propertyId: properties[0]?.id || 'prop-1',
          opportunity: 'Below market average',
          potentialSavings: 500000
        }
      ],
      marketConditions: 'Favorable buyer market with good opportunities'
    };
  }

  private calculateMatchingConfidence(recommendations: PropertyRecommendation[]): number {
    if (recommendations.length === 0) return 0;
    
    const avgConfidence = recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;
    return avgConfidence;
  }

  private getMatchingFactors(profile: UserPreferenceProfile): string[] {
    return [
      'Location preferences',
      'Price range',
      'Property type',
      'Feature requirements',
      'Behavioral patterns'
    ];
  }

  private calculateCustomWeights(profile: UserPreferenceProfile): Record<string, number> {
    return {
      location: profile.preferences.location.importance,
      price: 0.25,
      propertyType: profile.preferences.propertyType.importance,
      features: 0.15,
      aiSentiment: 0.1
    };
  }

  private createPropertyDescription(property: Property): string {
    return `
      ${property.type} in ${property.location}
      Price: ${property.price}
      ${property.bedrooms ? `${property.bedrooms} bedrooms` : ''}
      ${property.bathrooms ? `${property.bathrooms} bathrooms` : ''}
      ${property.size ? `Size: ${property.size}` : ''}
      ${property.description || ''}
      Features: ${property.features?.join(', ') || 'None listed'}
    `.trim();
  }

  private async calculatePropertySimilarity(
    targetDescription: string,
    candidateDescription: string,
    targetProperty: Property,
    candidateProperty: Property
  ): Promise<{ overallSimilarity: number; factors: any[] }> {
    try {
      // Use AI to analyze similarity
      const question = `How similar are these two properties? Rate from 0 to 100.`;
      const context = `Property 1: ${targetDescription}\n\nProperty 2: ${candidateDescription}`;
      
      const result = await enhancedHuggingFaceClient.extractPropertyInfo(context, question);
      
      // Parse similarity score from AI response
      const similarityMatch = result.answer.match(/(\d+)/);
      const aiSimilarity = similarityMatch ? parseInt(similarityMatch[1]) / 100 : 0.5;

      // Calculate rule-based similarity
      const ruleSimilarity = this.calculateRuleBasedSimilarity(targetProperty, candidateProperty);

      // Combine AI and rule-based similarity
      const overallSimilarity = (aiSimilarity * 0.6 + ruleSimilarity * 0.4);

      return {
        overallSimilarity,
        factors: [
          {
            factor: 'AI Analysis',
            similarity: aiSimilarity,
            description: 'AI-based property comparison'
          },
          {
            factor: 'Rule-based',
            similarity: ruleSimilarity,
            description: 'Feature-based comparison'
          }
        ]
      };
    } catch (error) {
      // Fallback to rule-based similarity
      const ruleSimilarity = this.calculateRuleBasedSimilarity(targetProperty, candidateProperty);
      
      return {
        overallSimilarity: ruleSimilarity,
        factors: [
          {
            factor: 'Rule-based',
            similarity: ruleSimilarity,
            description: 'Feature-based comparison'
          }
        ]
      };
    }
  }

  private calculateRuleBasedSimilarity(property1: Property, property2: Property): number {
    let similarity = 0;
    let factors = 0;

    // Type similarity
    if (property1.type === property2.type) {
      similarity += 0.3;
    }
    factors++;

    // Price similarity (within 20%)
    const priceDiff = Math.abs(property1.price - property2.price) / Math.max(property1.price, property2.price);
    if (priceDiff < 0.2) {
      similarity += 0.25;
    }
    factors++;

    // Location similarity (simple string comparison)
    if (property1.location === property2.location) {
      similarity += 0.2;
    }
    factors++;

    // Bedrooms similarity
    if (property1.bedrooms === property2.bedrooms) {
      similarity += 0.15;
    }
    factors++;

    // Features similarity
    const commonFeatures = property1.features?.filter(f => 
      property2.features?.includes(f)
    ).length || 0;
    const totalFeatures = Math.max(
      property1.features?.length || 0,
      property2.features?.length || 0
    );
    if (totalFeatures > 0) {
      similarity += (commonFeatures / totalFeatures) * 0.1;
    }
    factors++;

    return similarity;
  }

  private async analyzeFeedbackImpact(feedback: RecommendationFeedback): Promise<any> {
    // Analyze how feedback should impact future recommendations
    return {
      preferenceStrength: feedback.rating ? feedback.rating / 5 : 0.5,
      feedbackWeight: this.getFeedbackWeight(feedback.feedbackType),
      adjustmentDirection: feedback.feedbackType === 'interested' ? 'positive' : 'negative'
    };
  }

  private getFeedbackWeight(feedbackType: string): number {
    const weights = {
      'interested': 0.8,
      'not_interested': -0.6,
      'viewed': 0.3,
      'inquired': 0.9,
      'contacted': 1.0
    };
    return weights[feedbackType] || 0.1;
  }

  private async updateUserProfile(feedback: RecommendationFeedback, analysis: any): Promise<boolean> {
    // Mock profile update - in real implementation, this would update the database
    return true;
  }

  private calculateLearningImpact(feedback: RecommendationFeedback, analysis: any): number {
    return Math.abs(analysis.feedbackWeight) * analysis.preferenceStrength;
  }

  private generateRecommendationAdjustments(feedback: RecommendationFeedback, analysis: any): string[] {
    const adjustments = [];

    if (feedback.feedbackType === 'not_interested') {
      adjustments.push('Reduce weight for similar properties');
      adjustments.push('Explore different property types');
    } else if (feedback.feedbackType === 'interested' || feedback.feedbackType === 'inquired') {
      adjustments.push('Increase weight for similar properties');
      adjustments.push('Prioritize properties with similar features');
    }

    return adjustments;
  }
}

// Export singleton instance
export const recommendationIntegration = RecommendationIntegrationService.getInstance();