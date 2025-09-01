import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

import {
  InsertUser,
  professionals,
  properties,
  Property,
  reviews,
  transactions,
  User,
  users,
} from '../../src/shared/schema';
import { CacheService } from '../../core/src/cache'
import { db } from '../infrastructure/database/connection';
import { RequestDeduplicator } from '../infrastructure/deduplication/RequestDeduplicator';
import { TrustScoringService } from '../trust/TrustScoringService';

/**
 * Interface for trust score calculation request
 */
export interface TrustScoreRequest {
  userId: number;
  context?: {
    propertyId?: number;
    transactionType?: string;
    amount?: number;
    riskFactors?: string[];
  };
  includeBreakdown?: boolean;
}

/**
 * Interface for trust score response
 */
export interface TrustScoreResponse {
  userId: number;
  trustScore: number;
  trustLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  lastUpdated: Date;
  breakdown?: {
    profileCompleteness: number;
    verificationStatus: number;
    transactionHistory: number;
    communityFeedback: number;
    fraudRiskLevel: number;
    platformActivity: number;
  };
  restrictions?: {
    maxTransactionAmount?: number;
    requiresEscrow?: boolean;
    requiresVerification?: boolean;
    limitedFeatures?: string[];
  };
  recommendations?: string[];
}

/**
 * Interface for fraud detection request
 */
export interface FraudDetectionRequest {
  userId: number;
  activityType: 'property_listing' | 'transaction' | 'communication' | 'profile_update';
  activityData: Record<string, any>;
  riskFactors?: string[];
}

/**
 * Interface for fraud detection response
 */
export interface FraudDetectionResponse {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  flags: string[];
  recommendations: string[];
  requiresReview: boolean;
  trustScoreImpact: number;
}

/**
 * Interface for trust-based access control
 */
export interface AccessControlRequest {
  userId: number;
  resource: string;
  action: string;
  context?: Record<string, any>;
}

/**
 * Interface for access control response
 */
export interface AccessControlResponse {
  allowed: boolean;
  reason?: string;
  requiredTrustLevel?: string;
  currentTrustLevel: string;
  restrictions?: string[];
  upgradeActions?: string[];
}

/**
 * Interface for trust score update request
 */
export interface TrustScoreUpdateRequest {
  userId: number;
  action: 'positive' | 'negative' | 'neutral';
  category: 'verification' | 'transaction' | 'community' | 'fraud' | 'system';
  impact: number; // -100 to +100
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for bulk trust operations
 */
export interface BulkTrustOperation {
  operations: TrustScoreUpdateRequest[];
  batchId?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Trust Integration Service
 * Coordinates trust scoring, fraud detection, and access control across the platform
 */
export class TrustIntegrationService {
  private cache: CacheService;
  private deduplicator: RequestDeduplicator;
  private trustScoringService: TrustScoringService;

  // Trust level thresholds
  private readonly TRUST_THRESHOLDS = {
    VERY_LOW: 0,
    LOW: 20,
    MEDIUM: 40,
    HIGH: 70,
    VERY_HIGH: 90,
  };

  // Transaction limits based on trust levels
  private readonly TRANSACTION_LIMITS = {
    very_low: { maxAmount: 50000, requiresEscrow: true, requiresVerification: true },
    low: { maxAmount: 200000, requiresEscrow: true, requiresVerification: true },
    medium: { maxAmount: 1000000, requiresEscrow: false, requiresVerification: true },
    high: { maxAmount: 5000000, requiresEscrow: false, requiresVerification: false },
    very_high: { maxAmount: Infinity, requiresEscrow: false, requiresVerification: false },
  };

  constructor(cache?: CacheService) {
    this.cache = cache || new CacheService();
    this.deduplicator = RequestDeduplicator.getInstance({}, this.cache);
    this.trustScoringService = new TrustScoringService();
  }

  /**
   * Initialize the trust integration service
   */
  async initialize(): Promise<void> {
    await this.trustScoringService.initialize();
  }

  // Trust Score Management

  /**
   * Calculate comprehensive trust score for a user
   */
  async calculateTrustScore(request: TrustScoreRequest): Promise<TrustScoreResponse> {
    const cacheKey = `trust-score-${request.userId}-${JSON.stringify(request.context || {})}`;
    
    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        // Get user data
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, request.userId))
          .limit(1);

        if (!user) {
          throw new Error('User not found');
        }

        // Calculate base trust score using existing service
        const baseTrustScore = await this.trustScoringService.calculateUserTrustScore(request.userId.toString());

        // Calculate breakdown if requested
        let breakdown;
        if (request.includeBreakdown) {
          breakdown = await this.calculateTrustBreakdown(request.userId, user);
        }

        // Determine trust level
        const trustLevel = this.getTrustLevel(user.trustScore || 50);

        // Get restrictions based on trust level
        const restrictions = this.getTrustRestrictions(trustLevel, request.context);

        // Generate recommendations
        const recommendations = await this.generateTrustRecommendations(user, breakdown);

        const response: TrustScoreResponse = {
          userId: request.userId,
          trustScore: user.trustScore || 50,
          trustLevel,
          lastUpdated: user.updatedAt || new Date(),
          breakdown,
          restrictions,
          recommendations,
        };

        // Cache for 5 minutes
        await this.cache.set(cacheKey, response, { ttl: 300 });

        return response;
      },
      300000 // 5 minutes TTL
    );
  }

  /**
   * Update user trust score
   */
  async updateTrustScore(request: TrustScoreUpdateRequest): Promise<TrustScoreResponse> {
    // Get current user data
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, request.userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    // Calculate new trust score
    const currentScore = user.trustScore || 50;
    const impactMultiplier = this.getImpactMultiplier(request.category, request.action);
    const scoreChange = request.impact * impactMultiplier;
    const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));

    // Update user trust score
    await db
      .update(users)
      .set({
        trustScore: newScore,
        updatedAt: new Date(),
      })
      .where(eq(users.id, request.userId));

    // Log trust score change
    await this.logTrustScoreChange(request.userId, currentScore, newScore, request);

    // Clear related caches
    await this.clearTrustCaches(request.userId);

    // Return updated trust score
    return this.calculateTrustScore({ userId: request.userId, includeBreakdown: true });
  }

  /**
   * Process bulk trust score updates
   */
  async processBulkTrustUpdates(operation: BulkTrustOperation): Promise<{
    processed: number;
    failed: number;
    results: { userId: number; success: boolean; error?: string }[];
  }> {
    const results: { userId: number; success: boolean; error?: string }[] = [];
    let processed = 0;
    let failed = 0;

    // Process operations in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < operation.operations.length; i += batchSize) {
      const batch = operation.operations.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (op) => {
          try {
            await this.updateTrustScore(op);
            results.push({ userId: op.userId, success: true });
            processed++;
          } catch (error) {
            results.push({ 
              userId: op.userId, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            failed++;
          }
        })
      );
    }

    return { processed, failed, results };
  }

  // Fraud Detection

  /**
   * Detect potential fraud in user activities
   */
  async detectFraud(request: FraudDetectionRequest): Promise<FraudDetectionResponse> {
    const cacheKey = `fraud-detection-${request.userId}-${request.activityType}-${Date.now()}`;
    
    return this.deduplicator.handleIdempotentRequest(
      cacheKey,
      async () => {
        // Get user trust score
        const trustScore = await this.calculateTrustScore({ userId: request.userId });

        // Analyze activity for fraud indicators
        const fraudIndicators = await this.analyzeFraudIndicators(request);

        // Calculate risk score
        const riskScore = this.calculateRiskScore(fraudIndicators, trustScore.trustScore);

        // Determine risk level
        const riskLevel = this.getRiskLevel(riskScore);

        // Generate flags and recommendations
        const flags = this.generateFraudFlags(fraudIndicators);
        const recommendations = this.generateFraudRecommendations(riskLevel, flags);

        // Determine if manual review is required
        const requiresReview = riskLevel === 'high' || riskLevel === 'critical' || 
                              flags.some(flag => flag.includes('suspicious'));

        // Calculate trust score impact
        const trustScoreImpact = this.calculateTrustScoreImpact(riskLevel, flags);

        const response: FraudDetectionResponse = {
          riskLevel,
          riskScore,
          flags,
          recommendations,
          requiresReview,
          trustScoreImpact,
        };

        // If significant fraud risk, update trust score
        if (trustScoreImpact < -5) {
          await this.updateTrustScore({
            userId: request.userId,
            action: 'negative',
            category: 'fraud',
            impact: trustScoreImpact,
            reason: `Fraud detection: ${flags.join(', ')}`,
            metadata: { activityType: request.activityType, riskScore },
          });
        }

        return response;
      },
      60000 // 1 minute TTL
    );
  }

  // Access Control

  /**
   * Check if user has access to a resource based on trust level
   */
  async checkAccess(request: AccessControlRequest): Promise<AccessControlResponse> {
    const cacheKey = `access-control-${request.userId}-${request.resource}-${request.action}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as AccessControlResponse;
    }

    // Get user trust score
    const trustScore = await this.calculateTrustScore({ userId: request.userId });

    // Check resource-specific access rules
    const accessRules = this.getAccessRules(request.resource, request.action);
    const requiredTrustLevel = accessRules.minTrustLevel;

    // Determine if access is allowed
    const allowed = this.isTrustLevelSufficient(trustScore.trustLevel, requiredTrustLevel);

    // Generate restrictions and upgrade actions
    const restrictions = allowed ? [] : accessRules.restrictions || [];
    const upgradeActions = allowed ? [] : this.generateUpgradeActions(trustScore.trustLevel, requiredTrustLevel);

    const response: AccessControlResponse = {
      allowed,
      reason: allowed ? undefined : `Insufficient trust level. Required: ${requiredTrustLevel}, Current: ${trustScore.trustLevel}`,
      requiredTrustLevel,
      currentTrustLevel: trustScore.trustLevel,
      restrictions,
      upgradeActions,
    };

    // Cache for 2 minutes
    await this.cache.set(cacheKey, response, { ttl: 120 });

    return response;
  }

  /**
   * Get trust-based transaction limits for a user
   */
  async getTransactionLimits(userId: number): Promise<{
    maxAmount: number;
    requiresEscrow: boolean;
    requiresVerification: boolean;
    dailyLimit: number;
    monthlyLimit: number;
  }> {
    const trustScore = await this.calculateTrustScore({ userId });
    const baseLimits = this.TRANSACTION_LIMITS[trustScore.trustLevel];

    // Calculate daily and monthly limits based on trust level
    const dailyMultiplier = trustScore.trustLevel === 'very_high' ? 1 : 
                           trustScore.trustLevel === 'high' ? 0.5 : 
                           trustScore.trustLevel === 'medium' ? 0.3 : 0.1;

    const monthlyMultiplier = trustScore.trustLevel === 'very_high' ? 1 : 
                             trustScore.trustLevel === 'high' ? 0.8 : 
                             trustScore.trustLevel === 'medium' ? 0.6 : 0.3;

    return {
      maxAmount: baseLimits.maxAmount,
      requiresEscrow: baseLimits.requiresEscrow,
      requiresVerification: baseLimits.requiresVerification,
      dailyLimit: Math.floor(baseLimits.maxAmount * dailyMultiplier),
      monthlyLimit: Math.floor(baseLimits.maxAmount * monthlyMultiplier),
    };
  }

  // Analytics and Reporting

  /**
   * Get trust analytics for a user
   */
  async getTrustAnalytics(userId: number): Promise<{
    currentScore: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    history: { date: Date; score: number; reason?: string }[];
    benchmarks: {
      platformAverage: number;
      userPercentile: number;
      similarUsers: number;
    };
    improvementAreas: string[];
  }> {
    const cacheKey = `trust-analytics-${userId}`;
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as any;
    }

    // Get current trust score
    const trustScore = await this.calculateTrustScore({ userId, includeBreakdown: true });

    // Get trust score history (would need to implement trust score history table)
    const history = await this.getTrustScoreHistory(userId);

    // Calculate trend
    const trend = this.calculateTrustTrend(history);

    // Get platform benchmarks
    const benchmarks = await this.getTrustBenchmarks(userId, trustScore.trustScore);

    // Generate improvement areas
    const improvementAreas = this.generateImprovementAreas(trustScore.breakdown);

    const analytics = {
      currentScore: trustScore.trustScore,
      trend,
      history,
      benchmarks,
      improvementAreas,
    };

    // Cache for 10 minutes
    await this.cache.set(cacheKey, analytics, { ttl: 600 });

    return analytics;
  }

  // Private helper methods

  private async calculateTrustBreakdown(userId: number, user: User): Promise<TrustScoreResponse['breakdown']> {
    // Profile completeness (0-100)
    const profileCompleteness = this.calculateProfileCompleteness(user);

    // Verification status (0-100)
    const verificationStatus = user.isVerifiedAgent ? 100 : 50;

    // Transaction history (0-100)
    const transactionHistory = await this.calculateTransactionHistoryScore(userId);

    // Community feedback (0-100)
    const communityFeedback = await this.calculateCommunityFeedbackScore(userId);

    // Fraud risk level (0-100, inverted - lower risk = higher score)
    const fraudRiskLevel = await this.calculateFraudRiskScore(userId);

    // Platform activity (0-100)
    const platformActivity = await this.calculatePlatformActivityScore(userId);

    return {
      profileCompleteness,
      verificationStatus,
      transactionHistory,
      communityFeedback,
      fraudRiskLevel,
      platformActivity,
    };
  }

  private calculateProfileCompleteness(user: User): number {
    let score = 0;
    const fields = [
      user.firstName, user.lastName, user.email, user.username,
      user.bio, user.profileImageUrl
    ];
    
    fields.forEach(field => {
      if (field && field.trim().length > 0) score += 16.67; // 100/6 fields
    });

    return Math.round(score);
  }

  private async calculateTransactionHistoryScore(userId: number): Promise<number> {
    const [result] = await db
      .select({
        count: sql<number>`count(*)`,
        avgAmount: sql<number>`avg(${transactions.amount}::numeric)`,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const transactionCount = result?.count || 0;
    const avgAmount = result?.avgAmount || 0;

    // Score based on transaction count and average amount
    const countScore = Math.min(transactionCount * 5, 50); // Max 50 points for count
    const amountScore = Math.min(avgAmount / 10000, 50); // Max 50 points for amount

    return Math.round(countScore + amountScore);
  }

  private async calculateCommunityFeedbackScore(userId: number): Promise<number> {
    // Check if user is a professional
    const [professional] = await db
      .select()
      .from(professionals)
      .where(eq(professionals.userId, userId))
      .limit(1);

    if (professional) {
      // Use professional's average rating
      return Math.round((parseFloat(professional.averageRating) || 0) * 20); // Convert 5-star to 100-point scale
    }

    // For regular users, check property reviews they've received
    const [result] = await db
      .select({
        avgRating: sql<number>`avg(${reviews.rating})`,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .innerJoin(properties, eq(reviews.propertyId, properties.id))
      .where(eq(properties.ownerId, userId));

    const avgRating = result?.avgRating || 3; // Default to neutral
    const reviewCount = result?.count || 0;

    // Score based on average rating and review count
    const ratingScore = avgRating * 20; // Convert 5-star to 100-point scale
    const countBonus = Math.min(reviewCount * 2, 20); // Bonus for having reviews

    return Math.round(ratingScore + countBonus);
  }

  private async calculateFraudRiskScore(userId: number): Promise<number> {
    // This would integrate with fraud detection systems
    // For now, return a base score that can be adjusted by fraud detection
    return 80; // Assume low risk by default
  }

  private async calculatePlatformActivityScore(userId: number): Promise<number> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return 0;

    // Calculate based on account age and activity
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const daysOld = accountAge / (1000 * 60 * 60 * 24);

    // Score based on account age (max 50 points)
    const ageScore = Math.min(daysOld / 30, 50); // 1 point per day, max 50

    // Score based on last activity (max 50 points)
    const lastActivity = user.updatedAt ? new Date(user.updatedAt).getTime() : user.createdAt.getTime();
    const daysSinceActivity = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
    const activityScore = Math.max(0, 50 - daysSinceActivity); // Lose 1 point per day of inactivity

    return Math.round(ageScore + activityScore);
  }

  private getTrustLevel(score: number): TrustScoreResponse['trustLevel'] {
    if (score >= this.TRUST_THRESHOLDS.VERY_HIGH) return 'very_high';
    if (score >= this.TRUST_THRESHOLDS.HIGH) return 'high';
    if (score >= this.TRUST_THRESHOLDS.MEDIUM) return 'medium';
    if (score >= this.TRUST_THRESHOLDS.LOW) return 'low';
    return 'very_low';
  }

  private getTrustRestrictions(
    trustLevel: TrustScoreResponse['trustLevel'],
    context?: TrustScoreRequest['context']
  ): TrustScoreResponse['restrictions'] {
    const limits = this.TRANSACTION_LIMITS[trustLevel];
    
    return {
      maxTransactionAmount: limits.maxAmount,
      requiresEscrow: limits.requiresEscrow,
      requiresVerification: limits.requiresVerification,
      limitedFeatures: this.getLimitedFeatures(trustLevel),
    };
  }

  private getLimitedFeatures(trustLevel: TrustScoreResponse['trustLevel']): string[] {
    const features: string[] = [];
    
    if (trustLevel === 'very_low' || trustLevel === 'low') {
      features.push('bulk_messaging', 'premium_listings', 'direct_contact');
    }
    
    if (trustLevel === 'very_low') {
      features.push('property_listing', 'professional_services');
    }

    return features;
  }

  private async generateTrustRecommendations(
    user: User,
    breakdown?: TrustScoreResponse['breakdown']
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (!breakdown) return recommendations;

    if (breakdown.profileCompleteness < 80) {
      recommendations.push('Complete your profile with all required information');
    }

    if (breakdown.verificationStatus < 100) {
      recommendations.push('Verify your identity to increase trust score');
    }

    if (breakdown.transactionHistory < 50) {
      recommendations.push('Complete more transactions to build transaction history');
    }

    if (breakdown.communityFeedback < 70) {
      recommendations.push('Encourage satisfied clients to leave reviews');
    }

    if (breakdown.platformActivity < 60) {
      recommendations.push('Stay active on the platform to maintain trust score');
    }

    return recommendations;
  }

  private getImpactMultiplier(category: string, action: string): number {
    const multipliers = {
      verification: { positive: 1.5, negative: 2.0, neutral: 1.0 },
      transaction: { positive: 1.2, negative: 1.5, neutral: 1.0 },
      community: { positive: 1.0, negative: 1.3, neutral: 1.0 },
      fraud: { positive: 0.5, negative: 3.0, neutral: 1.0 },
      system: { positive: 0.8, negative: 1.0, neutral: 1.0 },
    };

    return multipliers[category as keyof typeof multipliers]?.[action as keyof typeof multipliers.verification] || 1.0;
  }

  private async logTrustScoreChange(
    userId: number,
    oldScore: number,
    newScore: number,
    request: TrustScoreUpdateRequest
  ): Promise<void> {
    // This would log to a trust_score_history table
    // For now, we'll just clear caches
    await this.clearTrustCaches(userId);
  }

  private async clearTrustCaches(userId: number): Promise<void> {
    const patterns = [
      `trust-score-${userId}-*`,
      `trust-analytics-${userId}`,
      `access-control-${userId}-*`,
    ];

    await Promise.all(patterns.map(pattern => this.cache.delete(pattern)));
  }

  private async analyzeFraudIndicators(request: FraudDetectionRequest): Promise<string[]> {
    const indicators: string[] = [];

    // Analyze based on activity type
    switch (request.activityType) {
      case 'property_listing':
        if (request.activityData.price && request.activityData.price < 100000) {
          indicators.push('unusually_low_price');
        }
        break;
      case 'transaction':
        if (request.activityData.amount && request.activityData.amount > 10000000) {
          indicators.push('high_value_transaction');
        }
        break;
      case 'communication':
        if (request.activityData.messageCount && request.activityData.messageCount > 100) {
          indicators.push('excessive_messaging');
        }
        break;
    }

    return indicators;
  }

  private calculateRiskScore(indicators: string[], trustScore: number): number {
    let riskScore = 0;

    // Base risk from trust score (inverted)
    riskScore += (100 - trustScore) * 0.5;

    // Add risk from indicators
    indicators.forEach(indicator => {
      switch (indicator) {
        case 'unusually_low_price':
          riskScore += 20;
          break;
        case 'high_value_transaction':
          riskScore += 15;
          break;
        case 'excessive_messaging':
          riskScore += 10;
          break;
        default:
          riskScore += 5;
      }
    });

    return Math.min(100, riskScore);
  }

  private getRiskLevel(riskScore: number): FraudDetectionResponse['riskLevel'] {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private generateFraudFlags(indicators: string[]): string[] {
    return indicators.map(indicator => {
      switch (indicator) {
        case 'unusually_low_price':
          return 'Property price significantly below market value';
        case 'high_value_transaction':
          return 'Transaction amount exceeds normal limits';
        case 'excessive_messaging':
          return 'Unusual messaging patterns detected';
        default:
          return `Suspicious activity: ${indicator}`;
      }
    });
  }

  private generateFraudRecommendations(riskLevel: string, flags: string[]): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Manual review required before proceeding');
      recommendations.push('Additional verification may be needed');
    }

    if (flags.some(flag => flag.includes('price'))) {
      recommendations.push('Verify property valuation with independent assessment');
    }

    if (flags.some(flag => flag.includes('transaction'))) {
      recommendations.push('Use escrow service for high-value transactions');
    }

    return recommendations;
  }

  private calculateTrustScoreImpact(riskLevel: string, flags: string[]): number {
    let impact = 0;

    switch (riskLevel) {
      case 'critical':
        impact = -20;
        break;
      case 'high':
        impact = -10;
        break;
      case 'medium':
        impact = -5;
        break;
      case 'low':
        impact = 0;
        break;
    }

    // Additional impact from specific flags
    flags.forEach(flag => {
      if (flag.includes('suspicious')) {
        impact -= 5;
      }
    });

    return impact;
  }

  private getAccessRules(resource: string, action: string): {
    minTrustLevel: string;
    restrictions?: string[];
  } {
    const rules = {
      'property_listing': {
        create: { minTrustLevel: 'medium', restrictions: ['verification_required'] },
        update: { minTrustLevel: 'low' },
        delete: { minTrustLevel: 'low' },
      },
      'messaging': {
        send: { minTrustLevel: 'low' },
        bulk_send: { minTrustLevel: 'high' },
      },
      'transactions': {
        initiate: { minTrustLevel: 'medium' },
        high_value: { minTrustLevel: 'high' },
      },
      'professional_services': {
        register: { minTrustLevel: 'high', restrictions: ['verification_required'] },
        update: { minTrustLevel: 'medium' },
      },
    };

    return rules[resource as keyof typeof rules]?.[action as keyof typeof rules.property_listing] || 
           { minTrustLevel: 'low' };
  }

  private isTrustLevelSufficient(current: string, required: string): boolean {
    const levels = ['very_low', 'low', 'medium', 'high', 'very_high'];
    const currentIndex = levels.indexOf(current);
    const requiredIndex = levels.indexOf(required);
    
    return currentIndex >= requiredIndex;
  }

  private generateUpgradeActions(current: string, required: string): string[] {
    const actions: string[] = [];

    if (current === 'very_low' || current === 'low') {
      actions.push('Complete profile verification');
      actions.push('Add profile photo and detailed bio');
    }

    if (current === 'low' || current === 'medium') {
      actions.push('Complete successful transactions');
      actions.push('Maintain active platform presence');
    }

    if (required === 'high' || required === 'very_high') {
      actions.push('Build positive community feedback');
      actions.push('Maintain consistent platform activity');
    }

    return actions;
  }

  private async getTrustScoreHistory(userId: number): Promise<{ date: Date; score: number; reason?: string }[]> {
    // This would query a trust_score_history table
    // For now, return mock data
    return [
      { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), score: 45, reason: 'Profile created' },
      { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), score: 55, reason: 'Profile completed' },
      { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), score: 65, reason: 'First transaction' },
    ];
  }

  private calculateTrustTrend(history: { date: Date; score: number }[]): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 2) return 'stable';

    const recent = history.slice(-3);
    const trend = recent[recent.length - 1].score - recent[0].score;

    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  }

  private async getTrustBenchmarks(userId: number, userScore: number): Promise<{
    platformAverage: number;
    userPercentile: number;
    similarUsers: number;
  }> {
    // Get platform average
    const [avgResult] = await db
      .select({
        avg: sql<number>`avg(${users.trustScore})`,
      })
      .from(users)
      .where(sql`${users.trustScore} IS NOT NULL`);

    const platformAverage = avgResult?.avg || 50;

    // Calculate user percentile
    const [percentileResult] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(lte(users.trustScore, userScore));

    const [totalResult] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(sql`${users.trustScore} IS NOT NULL`);

    const userPercentile = totalResult?.count ? 
      Math.round((percentileResult?.count || 0) / totalResult.count * 100) : 50;

    // Count similar users (within 10 points)
    const [similarResult] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(
        and(
          gte(users.trustScore, userScore - 10),
          lte(users.trustScore, userScore + 10)
        )
      );

    return {
      platformAverage: Math.round(platformAverage),
      userPercentile,
      similarUsers: similarResult?.count || 0,
    };
  }

  private generateImprovementAreas(breakdown?: TrustScoreResponse['breakdown']): string[] {
    if (!breakdown) return [];

    const areas: string[] = [];
    const threshold = 70;

    if (breakdown.profileCompleteness < threshold) {
      areas.push('Profile Completeness');
    }
    if (breakdown.verificationStatus < threshold) {
      areas.push('Identity Verification');
    }
    if (breakdown.transactionHistory < threshold) {
      areas.push('Transaction History');
    }
    if (breakdown.communityFeedback < threshold) {
      areas.push('Community Feedback');
    }
    if (breakdown.platformActivity < threshold) {
      areas.push('Platform Activity');
    }

    return areas;
  }

  /**
   * Get service statistics
   */
  getStats(): {
    cacheSize: number;
    deduplicationStats: any;
  } {
    return {
      cacheSize: 0, // Would need to implement cache size tracking
      deduplicationStats: this.deduplicator.getStats(),
    };
  }
}

/**
 * Default instance for easy access
 */
export const trustIntegrationService = new TrustIntegrationService();