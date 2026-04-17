import { EventEmitter } from 'events';

import { logger } from '../infrastructure/observability/telemetry';
import { storage } from '../infrastructure/storage/storage';

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface UserTrustScore {
  userId: string;
  overallScore: number;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  factors: TrustFactor[];
  verifications: VerificationStatus[];
  history: TrustScoreChange[];
  lastUpdated: Date;
  nextReviewDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PropertyTrustScore {
  propertyId: number;
  overallScore: number;
  level: 'unverified' | 'basic' | 'verified' | 'premium' | 'certified';
  factors: PropertyTrustFactor[];
  verificationStatus: string;
  ownerTrustScore: number;
  marketAnalysis: MarketTrustAnalysis;
  lastUpdated: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TrustFactor {
  category: string;
  name: string;
  score: number;
  weight: number;
  description: string;
  evidence: string[];
  lastVerified: Date;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface PropertyTrustFactor {
  category: string;
  name: string;
  score: number;
  weight: number;
  description: string;
  evidence: string[];
  lastVerified: Date;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface VerificationStatus {
  type: 'identity' | 'phone' | 'email' | 'address' | 'income' | 'employment' | 'bank_account' | 'government_id';
  status: 'verified' | 'pending' | 'failed' | 'expired';
  verifiedAt?: Date;
  expiresAt?: Date;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  trustBoost: number;
}

export interface TrustScoreChange {
  timestamp: Date;
  previousScore: number;
  newScore: number;
  change: number;
  reason: string;
  action: string;
  details?: unknown;
}

export interface MarketTrustAnalysis {
  priceAccuracy: number;
  marketPosition: 'undervalued' | 'fair' | 'overvalued';
  comparableProperties: number;
  marketTrend: 'rising' | 'stable' | 'declining';
  liquidityScore: number;
  investmentRisk: 'low' | 'medium' | 'high';
}

export interface TrustAnalytics {
  userId: string;
  scoreDistribution: {
    identity: number;
    financial: number;
    behavioral: number;
    social: number;
    transactional: number;
  };
  verificationProgress: {
    completed: number;
    pending: number;
    total: number;
    completionRate: number;
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    recommendations: string[];
  };
  trends: {
    scoreChange30Days: number;
    scoreChange90Days: number;
    averageMonthlyChange: number;
  };
  benchmarks: {
    percentile: number;
    averageForLevel: number;
    nextLevelRequirement: number;
  };
}

export interface SystemTrustStats {
  totalUsers: number;
  averageScore: number;
  scoreDistribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    diamond: number;
  };
  verificationStats: {
    totalVerifications: number;
    verificationRate: number;
    averageVerificationsPerUser: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  trends: {
    averageScoreChange: number;
    newUsersThisMonth: number;
    verificationGrowthRate: number;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCORE_FLOOR = 0;
const SCORE_CEIL  = 1000;
const MAX_HISTORY = 50;
const REVIEW_INTERVAL_DAYS = 30;

// ─── Service ──────────────────────────────────────────────────────────────────

export class TrustScoringService extends EventEmitter {
  private isInitialized = false;

  // Weights for the four active scoring factors. Must sum to 1.0.
  private readonly scoringWeights: Record<string, number> = {
    identity_verification:  0.35,
    financial_verification: 0.30,
    behavioral_history:     0.20,
    transaction_history:    0.15,
  };

  private readonly verificationBoosts: Record<string, number> = {
    government_id: 15,
    bank_account:  12,
    employment:    10,
    address:        8,
    phone:          5,
    email:          3,
    income:        15,
    identity:      20,
  };

  private readonly levelThresholds = {
    diamond:  850,
    platinum: 700,
    gold:     500,
    silver:   300,
    bronze:     0,
  } as const;

  // Action → score delta lookup used by updateUserTrustScore.
  private readonly actionScores: Record<string, number> = {
    successful_transaction:  10,
    failed_transaction:     -15,
    identity_verified:       25,
    document_uploaded:        5,
    property_verified:       20,
    payment_late:           -10,
    dispute_resolved:        15,
    dispute_created:        -20,
    fraud_detected:        -100,
    positive_review:          5,
    negative_review:         -8,
    account_suspended:      -50,
    account_restored:        30,
  };

  constructor() {
    super();
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Trust Scoring Service…');
      await this.loadScoringModels();
      this.validateConfiguration();
      this.isInitialized = true;
      logger.info('Trust Scoring Service initialized successfully');
      this.emit('initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Trust Scoring Service');
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Trust Scoring Service…');
    this.isInitialized = false;
    this.emit('shutdown');
    logger.info('Trust Scoring Service shutdown complete');
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async calculateUserTrustScore(userId: string): Promise<UserTrustScore> {
    this.requireInitialized();

    try {
      logger.info(`Calculating trust score for user: ${userId}`);

      // TODO: replace getUserByUsername with a proper getUserById once storage supports it.
      const user = await storage.getUserByUsername(userId);
      if (!user) throw new Error(`User ${userId} not found`);

      const factors       = await this.calculateUserFactors(userId);
      const overallScore  = this.computeWeightedScore(factors);
      const level         = this.determineTrustLevel(overallScore);
      const verifications = await this.getVerificationStatus(userId);
      const history       = await this.getTrustScoreHistory(userId, 10);
      const riskLevel     = this.determineUserRiskLevel(overallScore);

      const trustScore: UserTrustScore = {
        userId,
        overallScore,
        level,
        factors,
        verifications,
        history,
        lastUpdated:    new Date(),
        nextReviewDate: new Date(Date.now() + REVIEW_INTERVAL_DAYS * 24 * 60 * 60 * 1000),
        riskLevel,
      };

      this.emit('trust_score_calculated', { userId, score: overallScore, level });
      return trustScore;

    } catch (error) {
      logger.error({ error }, `Failed to calculate trust score for user ${userId}`);
      throw error;
    }
  }

  async calculatePropertyTrustScore(propertyId: number): Promise<PropertyTrustScore> {
    this.requireInitialized();

    try {
      logger.info(`Calculating property trust score for property: ${propertyId}`);

      const property = await storage.getProperty(propertyId);
      if (!property) throw new Error(`Property ${propertyId} not found`);

      const factors        = await this.calculatePropertyFactors(propertyId);
      const overallScore   = this.computeWeightedScore(factors);
      const level          = this.determinePropertyTrustLevel(overallScore, property.verificationStatus);
      const ownerTrustScore = await this.getOwnerTrustScore(property.ownerId);
      const marketAnalysis = await this.performMarketTrustAnalysis(property);
      const riskLevel      = this.determinePropertyRiskLevel(overallScore, marketAnalysis);

      const propertyTrustScore: PropertyTrustScore = {
        propertyId,
        overallScore,
        level,
        factors,
        verificationStatus: property.verificationStatus ?? 'unverified',
        ownerTrustScore,
        marketAnalysis,
        lastUpdated: new Date(),
        riskLevel,
      };

      this.emit('property_trust_score_calculated', { propertyId, score: overallScore, level });
      return propertyTrustScore;

    } catch (error) {
      logger.error({ error }, `Failed to calculate property trust score for property ${propertyId}`);
      throw error;
    }
  }

  async updateUserTrustScore(userId: string, action: string, details?: unknown): Promise<UserTrustScore> {
    logger.info(`Updating trust score for user ${userId} due to action: ${action}`);

    const current     = await this.calculateUserTrustScore(userId);
    const delta       = this.actionScores[action] ?? 0;
    const newScore    = Math.max(SCORE_FLOOR, Math.min(SCORE_CEIL, current.overallScore + delta));

    const changeRecord: TrustScoreChange = {
      timestamp:     new Date(),
      previousScore: current.overallScore,
      newScore,
      change:        delta,
      reason:        action,
      action,
      details,
    };

    const updatedHistory = [changeRecord, ...current.history].slice(0, MAX_HISTORY);

    const updated: UserTrustScore = {
      ...current,
      overallScore: newScore,
      level:        this.determineTrustLevel(newScore),
      riskLevel:    this.determineUserRiskLevel(newScore),
      history:      updatedHistory,
      lastUpdated:  new Date(),
    };

    this.emit('trust_score_updated', {
      userId,
      previousScore: changeRecord.previousScore,
      newScore,
      change: delta,
    });

    return updated;
  }

  async processVerification(
    userId: string,
    verificationType: string,
    verificationData: unknown,
  ): Promise<VerificationStatus> {
    logger.info(`Processing ${verificationType} verification for user ${userId}`);

    // TODO: replace with real verification provider call.
    const isSuccessful = Math.random() > 0.2; // stub — 80% success rate

    const result: VerificationStatus = {
      type:              verificationType as VerificationStatus['type'],
      status:            isSuccessful ? 'verified' : 'failed',
      verifiedAt:        isSuccessful ? new Date() : undefined,
      verificationLevel: 'basic',
      trustBoost:        isSuccessful ? (this.verificationBoosts[verificationType] ?? 5) : 0,
    };

    if (isSuccessful) {
      await this.updateUserTrustScore(userId, `${verificationType}_verified`, verificationData);
    }

    this.emit('verification_processed', { userId, verificationType, status: result.status });
    return result;
  }

  async getTrustScoreHistory(
    userId: string,
    limit  = 50,
    offset = 0,
  ): Promise<TrustScoreChange[]> {
    // TODO: fetch from persistent store; stub generates in-memory records.
    const cap   = Math.min(limit + offset, 20); // realistic mock ceiling
    const now   = new Date();
    const all: TrustScoreChange[] = [];

    for (let i = 0; i < cap; i++) {
      const prev = 500 + Math.random() * 400;
      all.push({
        timestamp:     new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
        previousScore: prev,
        newScore:      Math.max(SCORE_FLOOR, Math.min(SCORE_CEIL, prev + (Math.random() * 40 - 20))),
        change:        Math.random() * 40 - 20,
        reason:        (['successful_transaction', 'document_uploaded', 'identity_verified'] as const)[
          Math.floor(Math.random() * 3)
        ],
        action: 'system_update',
      });
    }

    return all.slice(offset, offset + limit);
  }

  async getTrustAnalytics(userId: string): Promise<TrustAnalytics> {
    const { riskLevel } = await this.calculateUserTrustScore(userId);

    return {
      userId,
      scoreDistribution: {
        identity:     85,
        financial:    72,
        behavioral:   90,
        social:       65,
        transactional: 78,
      },
      verificationProgress: {
        completed:      3,
        pending:        2,
        total:          8,
        completionRate: 37.5,
      },
      riskAssessment: {
        level: riskLevel,
        factors:         ['Incomplete financial verification', 'Limited transaction history'],
        recommendations: ['Complete bank account verification', 'Increase platform activity'],
      },
      trends: {
        scoreChange30Days:    25,
        scoreChange90Days:    45,
        averageMonthlyChange: 15,
      },
      benchmarks: {
        percentile:             68,
        averageForLevel:       450,
        nextLevelRequirement:  500,
      },
    };
  }

  async getSystemTrustStats(): Promise<SystemTrustStats> {
    return {
      totalUsers:    15_420,
      averageScore:    542,
      scoreDistribution: {
        bronze:    3_200,
        silver:    5_800,
        gold:      4_200,
        platinum:  1_800,
        diamond:     420,
      },
      verificationStats: {
        totalVerifications:         45_600,
        verificationRate:             0.73,
        averageVerificationsPerUser:  2.96,
      },
      riskDistribution: {
        low:    8_500,
        medium: 5_200,
        high:   1_720,
      },
      trends: {
        averageScoreChange:      12.5,
        newUsersThisMonth:     1_250,
        verificationGrowthRate:  0.15,
      },
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private requireInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('TrustScoringService has not been initialized. Call initialize() first.');
    }
  }

  private async loadScoringModels(): Promise<void> {
    logger.info('Loading trust scoring models…');
    await new Promise<void>((resolve) => setTimeout(resolve, 500)); // TODO: load real ML models
    logger.info('Trust scoring models loaded');
  }

  private validateConfiguration(): void {
    const total = Object.values(this.scoringWeights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(total - 1.0) > 0.01) {
      throw new Error(`Scoring weights must sum to 1.0 — current sum: ${total.toFixed(4)}`);
    }
    logger.info('Trust scoring configuration validated');
  }

  /**
   * Generic weighted-average scorer. Works for both user and property factors,
   * as long as each item carries `score` and `weight` fields.
   */
  private computeWeightedScore(factors: Array<{ score: number; weight: number }>): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const { score, weight } of factors) {
      weightedSum += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  private async calculateUserFactors(userId: string): Promise<TrustFactor[]> {
    return [
      {
        category:     'Identity',
        name:         'Identity Verification',
        score:        await this.calculateIdentityScore(userId),
        weight:       this.scoringWeights['identity_verification']!,
        description:  'Verification of government-issued ID and personal information',
        evidence:     ['Government ID verified', 'Address confirmed'],
        lastVerified: new Date(),
        impact:       'positive',
      },
      {
        category:     'Financial',
        name:         'Financial Verification',
        score:        await this.calculateFinancialScore(userId),
        weight:       this.scoringWeights['financial_verification']!,
        description:  'Bank account and income verification status',
        evidence:     ['Bank account linked', 'Income documents provided'],
        lastVerified: new Date(),
        impact:       'positive',
      },
      {
        category:     'Behavioral',
        name:         'Platform Behavior',
        score:        await this.calculateBehavioralScore(userId),
        weight:       this.scoringWeights['behavioral_history']!,
        description:  'User behavior patterns and platform engagement',
        evidence:     ['Consistent platform usage', 'No policy violations'],
        lastVerified: new Date(),
        impact:       'positive',
      },
      {
        category:     'Transactional',
        name:         'Transaction History',
        score:        await this.calculateTransactionScore(userId),
        weight:       this.scoringWeights['transaction_history']!,
        description:  'History of successful transactions and payments',
        evidence:     ['Successful transactions', 'Timely payments'],
        lastVerified: new Date(),
        impact:       'positive',
      },
    ];
  }

  private async calculatePropertyFactors(propertyId: number): Promise<PropertyTrustFactor[]> {
    return [
      {
        category:     'Documentation',
        name:         'Document Verification',
        score:        await this.calculateDocumentScore(propertyId),
        weight:       0.30,
        description:  'Verification status of property documents',
        evidence:     ['Title deed verified', 'Survey documents authentic'],
        lastVerified: new Date(),
        impact:       'positive',
      },
      {
        category:     'Ownership',
        name:         'Ownership Verification',
        score:        await this.calculateOwnershipScore(propertyId),
        weight:       0.25,
        description:  'Verification of property ownership and title',
        evidence:     ['Owner identity confirmed', 'Title clear'],
        lastVerified: new Date(),
        impact:       'positive',
      },
      {
        category:     'Market',
        name:         'Market Position',
        score:        await this.calculateMarketScore(propertyId),
        weight:       0.20,
        description:  'Property value relative to market conditions',
        evidence:     ['Fair market value', 'Good location'],
        lastVerified: new Date(),
        impact:       'positive',
      },
      {
        category:     'Legal',
        name:         'Legal Compliance',
        score:        await this.calculateLegalScore(propertyId),
        weight:       0.25,
        description:  'Compliance with legal and regulatory requirements',
        evidence:     ['No legal disputes', 'Permits in order'],
        lastVerified: new Date(),
        impact:       'positive',
      },
    ];
  }

  private determineTrustLevel(score: number): UserTrustScore['level'] {
    if (score >= this.levelThresholds.diamond)  return 'diamond';
    if (score >= this.levelThresholds.platinum) return 'platinum';
    if (score >= this.levelThresholds.gold)     return 'gold';
    if (score >= this.levelThresholds.silver)   return 'silver';
    return 'bronze';
  }

  private determinePropertyTrustLevel(
    score: number,
    verificationStatus: string,
  ): PropertyTrustScore['level'] {
    if (score >= 850 && verificationStatus === 'verified') return 'certified';
    if (score >= 700) return 'premium';
    if (score >= 500) return 'verified';
    if (score >= 300) return 'basic';
    return 'unverified';
  }

  private determineUserRiskLevel(score: number): UserTrustScore['riskLevel'] {
    if (score >= 700) return 'low';
    if (score >= 400) return 'medium';
    return 'high';
  }

  private determinePropertyRiskLevel(
    score: number,
    marketAnalysis: MarketTrustAnalysis,
  ): PropertyTrustScore['riskLevel'] {
    if (score >= 700 && marketAnalysis.investmentRisk === 'low')  return 'low';
    if (score >= 400 && marketAnalysis.investmentRisk !== 'high') return 'medium';
    return 'high';
  }

  // ─── Stub calculation methods (replace with real data + ML models) ───────────

  private async calculateIdentityScore(_userId: string):   Promise<number> { return 750 + Math.random() * 200; }
  private async calculateFinancialScore(_userId: string):  Promise<number> { return 650 + Math.random() * 300; }
  private async calculateBehavioralScore(_userId: string): Promise<number> { return 700 + Math.random() * 250; }
  private async calculateTransactionScore(_userId: string):Promise<number> { return 600 + Math.random() * 350; }

  private async calculateDocumentScore(_propertyId: number):  Promise<number> { return 800 + Math.random() * 150; }
  private async calculateOwnershipScore(_propertyId: number): Promise<number> { return 750 + Math.random() * 200; }
  private async calculateMarketScore(_propertyId: number):    Promise<number> { return 700 + Math.random() * 250; }
  private async calculateLegalScore(_propertyId: number):     Promise<number> { return 850 + Math.random() * 100; }

  private async getOwnerTrustScore(_ownerId: number): Promise<number> {
    try {
      return 650 + Math.random() * 300; // TODO: delegate to calculateUserTrustScore
    } catch {
      return 500;
    }
  }

  private async getVerificationStatus(_userId: string): Promise<VerificationStatus[]> {
    return [
      {
        type:              'email',
        status:            'verified',
        verifiedAt:        new Date(),
        verificationLevel: 'basic',
        trustBoost:        this.verificationBoosts['email']!,
      },
      {
        type:              'phone',
        status:            'verified',
        verifiedAt:        new Date(),
        verificationLevel: 'basic',
        trustBoost:        this.verificationBoosts['phone']!,
      },
      {
        type:              'identity',
        status:            'pending',
        verificationLevel: 'enhanced',
        trustBoost:        this.verificationBoosts['identity']!,
      },
    ];
  }

  private async performMarketTrustAnalysis(_property: unknown): Promise<MarketTrustAnalysis> {
    return {
      priceAccuracy:        85 + Math.random() * 15,
      marketPosition:       Math.random() > 0.5 ? 'fair' : 'undervalued',
      comparableProperties: Math.floor(Math.random() * 20) + 5,
      marketTrend:          Math.random() > 0.6 ? 'rising' : 'stable',
      liquidityScore:       70 + Math.random() * 30,
      investmentRisk:       Math.random() > 0.7 ? 'low' : 'medium',
    };
  }
}