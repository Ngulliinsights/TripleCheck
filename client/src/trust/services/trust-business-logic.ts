import { z } from 'zod';
import { 
  TrustScore, 
  VerificationCheck, 
  TrustScoreAnalysis, 
  VerificationOverview,
  CommunityTrustOverview,
  VerificationStatus
} from '../types/trust.types';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

export const TrustScoreSchema = z.object({
  userId:     z.string().uuid('Invalid user ID'),
  propertyId: z.string().uuid('Invalid property ID').optional(),
  score:      z.number().int().min(0).max(1000),
  factors: z.object({
    documentVerification: z.number().min(0).max(100),
    communityFeedback:    z.number().min(0).max(100),
    transactionHistory:   z.number().min(0).max(100),
    identityVerification: z.number().min(0).max(100),
    propertyVerification: z.number().min(0).max(100).optional(),
  }),
  lastUpdated: z.date(),
});

export const VerificationCheckSchema = z.object({
  type:             z.enum(['document', 'identity', 'property', 'financial']),
  status:           z.enum(['pending', 'verified', 'rejected', 'expired']),
  documentUrl:      z.string().url().optional(),
  verifiedBy:       z.string().uuid().optional(),
  verificationDate: z.date().optional(),
  expiryDate:       z.date().optional(),
  notes:            z.string().max(1000).optional(),
});

export const FraudAlertSchema = z.object({
  userId:      z.string().uuid('Invalid user ID'),
  propertyId:  z.string().uuid('Invalid property ID').optional(),
  alertType:   z.enum(['suspicious_activity', 'fake_documents', 'duplicate_listing', 'payment_fraud']),
  severity:    z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(10).max(1000),
  status:      z.enum(['active', 'investigating', 'resolved', 'false_positive']),
  reportedBy:  z.string().uuid().optional(),
});

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface UserTransaction {
  id:     string;
  date:   string;
  amount: number;
  type:   string;
  status: string;
}

export interface PropertyData {
  duplicateCount:          number;
  priceVariance:           number;
  imageAuthenticityScore:  number;
}

export interface TransactionData {
  unusualPaymentMethods: boolean;
  urgencyIndicators:     number;
}

export interface DocumentData {
  tamperingScore: number;
  expiryDate?:    string;
  [key: string]:  unknown;
}

export interface CommunityReference {
  id:            string;
  verified:      boolean;
  referenceType: string;
}

export interface CommunityReview {
  id:      string;
  rating:  number;
  comment: string;
  date:    string;
}

export interface CommunityEngagement {
  id:   string;
  type: string;
  date: string;
}

export interface ReportedIssue {
  id:       string;
  status:   'active' | 'investigating' | 'resolved' | 'false_positive';
  severity: string;
}

// ─── Internal result types ────────────────────────────────────────────────────

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskAssessment {
  score:           number;
  flags:           string[];
  recommendations: string[];
}

interface TrustLevel {
  min:   number;
  max:   number;
  label: string;
  color: string;
}

// ─── Business logic ───────────────────────────────────────────────────────────

export class TrustBusinessLogic {

  // ── Constants ──────────────────────────────────────────────────────────────

  private static readonly TRUST_WEIGHTS: Record<keyof TrustScore['factors'], number> = {
    documentVerification: 0.25,
    communityFeedback:    0.20,
    transactionHistory:   0.25,
    identityVerification: 0.20,
    propertyVerification: 0.10,
  };

  // Ordered from highest threshold to lowest so the first match wins.
  private static readonly TRUST_LEVELS: readonly TrustLevel[] = [
    { min: 900,  max: 1000, label: 'Premium',    color: 'blue'   },
    { min: 750,  max: 899,  label: 'Trusted',    color: 'green'  },
    { min: 500,  max: 749,  label: 'Verified',   color: 'yellow' },
    { min: 300,  max: 499,  label: 'Basic',      color: 'orange' },
    { min: 0,    max: 299,  label: 'Unverified', color: 'red'    },
  ];

  private static readonly SCORE_THRESHOLDS = {
    UPDATE_MIN_DELTA:  10,
    UPDATE_MAX_DAYS:   7,
    MAX_RECOMMENDATIONS: 5,
  } as const;

  private static readonly RECENT_TRANSACTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

  private static readonly REQUIRED_DOCUMENT_FIELDS: Record<string, string[]> = {
    passport:         ['fullName', 'passportNumber', 'nationality', 'dateOfBirth', 'expiryDate'],
    drivers_license:  ['fullName', 'licenseNumber', 'dateOfBirth', 'address', 'expiryDate'],
    national_id:      ['fullName', 'idNumber', 'dateOfBirth', 'address'],
    utility_bill:     ['fullName', 'address', 'billDate', 'serviceProvider'],
  };

  private static readonly VALID_DOCUMENT_TYPES = new Set(
    Object.keys(TrustBusinessLogic.REQUIRED_DOCUMENT_FIELDS),
  );

  private static readonly VERIFICATION_NEXT_STEP_MAP: Record<VerificationCheck['type'], string> = {
    document:  'Upload government-issued ID and proof of address',
    identity:  'Complete video identity verification',
    property:  'Verify property ownership documents',
    financial: 'Provide financial verification documents',
  };

  // ── Enrichment & Orchestration Helpers ─────────────────────────────────────

  /**
   * Enrich raw trust score data with breakdown and level analysis
   */
  static enrichTrustScore(factors: TrustScore['factors']): TrustScoreAnalysis {
    return this.calculateTrustScore(factors);
  }

  /**
   * Derive status, completion percentage, and next steps from verification checks
   */
  static deriveVerificationOverview(checks: VerificationCheck[]): VerificationOverview {
    const checkTypes: VerificationCheck['type'][] = ['document', 'identity', 'property', 'financial'];
    const completedTypes = new Set(
      checks
        .filter((c) => c.status === 'verified')
        .map((c) => c.type),
    );

    const completionPercentage = Math.round((completedTypes.size / checkTypes.length) * 100);
    const overallStatus: VerificationStatus =
      completedTypes.size === 0
        ? 'pending'
        : completedTypes.size === checkTypes.length
        ? 'complete'
        : 'partial';

    const nextSteps = checkTypes
      .filter((type) => !completedTypes.has(type))
      .map((type) => this.VERIFICATION_NEXT_STEP_MAP[type]);

    return {
      checks,
      overallStatus,
      completionPercentage,
      nextSteps,
    };
  }

  /**
   * Enrich community trust data with insights and aggregated score
   */
  static enrichCommunityTrustData(data: {
    references:          CommunityReference[];
    reviews:             CommunityReview[];
    communityEngagement: CommunityEngagement[];
    reportedIssues?:      ReportedIssue[];
  }): CommunityTrustOverview {
    const result = this.calculateCommunityTrust({
      references:          data.references,
      reviews:             data.reviews,
      communityEngagement: data.communityEngagement,
      reportedIssues:      data.reportedIssues ?? [],
    });

    return {
      score:    result.score,
      factors:  result.factors,
      insights: result.insights,
    };
  }

  // ── Trust scoring ──────────────────────────────────────────────────────────

  static calculateTrustScore(factors: TrustScore['factors']): {
    score:           number;
    level:           string;
    color:           string;
    breakdown:       Record<string, number>;
    recommendations: string[];
  } {
    const breakdown = Object.fromEntries(
      (Object.entries(this.TRUST_WEIGHTS) as Array<[keyof TrustScore['factors'], number]>).map(
        ([factor, weight]) => [factor, (factors[factor] ?? 0) * weight],
      ),
    );

    const score = Math.round(Object.values(breakdown).reduce((sum, v) => sum + v, 0));
    const level = this.getTrustLevel(score);

    return {
      score,
      level:           level.label,
      color:           level.color,
      breakdown,
      recommendations: this.generateTrustRecommendations(factors, score),
    };
  }

  static getTrustLevel(score: number): TrustLevel {
    return (
      this.TRUST_LEVELS.find((l) => score >= l.min && score <= l.max) ??
      this.TRUST_LEVELS[this.TRUST_LEVELS.length - 1]
    );
  }

  static generateTrustRecommendations(
    factors:      TrustScore['factors'],
    currentScore: number,
  ): string[] {
    return [
      ...this.getVerificationRecommendations(factors),
      ...this.getCommunityRecommendations(factors),
      ...this.getScoreBasedRecommendations(currentScore),
    ].slice(0, this.SCORE_THRESHOLDS.MAX_RECOMMENDATIONS);
  }

  private static getVerificationRecommendations(factors: TrustScore['factors']): string[] {
    const recs: string[] = [];

    if (factors.documentVerification < 80) {
      recs.push('Complete document verification to increase trust score');
      if (factors.documentVerification < 50) recs.push('Upload government-issued ID and proof of address');
    }

    if (factors.identityVerification < 80) {
      recs.push('Complete identity verification through video call');
      if (factors.identityVerification < 30) recs.push('Verify your phone number and email address');
    }

    if (factors.propertyVerification != null && factors.propertyVerification < 70) {
      recs.push('Verify property ownership documents');
      if (factors.propertyVerification < 40) recs.push('Schedule property inspection with certified agent');
    }

    return recs;
  }

  private static getCommunityRecommendations(factors: TrustScore['factors']): string[] {
    const recs: string[] = [];

    if (factors.communityFeedback < 70) {
      recs.push('Engage with the community to build positive feedback');
      if (factors.communityFeedback < 40) recs.push('Complete your profile and add references');
    }

    if (factors.transactionHistory < 60) {
      recs.push('Complete more transactions to build history');
      if (factors.transactionHistory < 20) recs.push('Start with smaller transactions to build trust');
    }

    return recs;
  }

  private static getScoreBasedRecommendations(score: number): string[] {
    if (score < 500) return ['Focus on basic verification steps first'];
    if (score < 750) return ['Build community reputation through positive interactions'];
    if (score < 900) return ['Complete advanced verification for premium status'];
    return [];
  }

  // ── Trust score update gate ────────────────────────────────────────────────

  static shouldUpdateTrustScore(
    currentScore: TrustScore,
    newFactors:   Partial<TrustScore['factors']>,
  ): { shouldUpdate: boolean; reason: string; newScore: number } {
    const updatedFactors = { ...currentScore.factors, ...newFactors };
    const { score: newScore } = this.calculateTrustScore(updatedFactors);

    const delta        = Math.abs(newScore - currentScore.score);
    const daysSinceLast = (Date.now() - currentScore.lastUpdated.getTime()) / 86_400_000;

    const significantChange = delta >= this.SCORE_THRESHOLDS.UPDATE_MIN_DELTA;
    const weeklyDue         = daysSinceLast >= this.SCORE_THRESHOLDS.UPDATE_MAX_DAYS;

    const reason = significantChange
      ? `Significant score change: ${delta} points`
      : weeklyDue
      ? 'Regular weekly update'
      : 'No update needed';

    return { shouldUpdate: significantChange || weeklyDue, reason, newScore };
  }

  // ── Fraud detection ────────────────────────────────────────────────────────

  static detectFraudRisk(data: {
    userId:          string;
    propertyId?:     string;
    userHistory:     UserTransaction[];
    propertyData?:   PropertyData;
    transactionData?: TransactionData;
  }): {
    riskLevel:       RiskLevel;
    riskScore:       number;
    flags:           string[];
    recommendations: string[];
  } {
    const assessments = [
      this.analyzeUserRisk(data.userHistory),
      this.analyzePropertyRisk(data.propertyData),
      this.analyzeTransactionRisk(data.transactionData),
    ];

    const riskScore      = assessments.reduce((sum, a) => sum + a.score, 0);
    const flags          = assessments.flatMap((a) => a.flags);
    const recommendations = assessments.flatMap((a) => a.recommendations);

    return { riskLevel: this.calculateRiskLevel(riskScore), riskScore, flags, recommendations };
  }

  private static analyzeUserRisk(userHistory: UserTransaction[]): RiskAssessment {
    const flags:           string[] = [];
    const recommendations: string[] = [];
    let score = 0;

    if (userHistory.length === 0) {
      score += 20;
      flags.push('New user with no transaction history');
      recommendations.push('Require additional verification for new users');
    }

    const cutoff = Date.now() - this.RECENT_TRANSACTION_WINDOW_MS;
    const recentCount = userHistory.filter((t) => new Date(t.date).getTime() > cutoff).length;

    if (recentCount > 10) {
      score += 15;
      flags.push('High transaction frequency in recent period');
      recommendations.push('Monitor user activity closely');
    }

    return { score, flags, recommendations };
  }

  private static analyzePropertyRisk(propertyData?: PropertyData): RiskAssessment {
    if (!propertyData) return { score: 0, flags: [], recommendations: [] };

    const checks: Array<[boolean, number, string, string]> = [
      [
        propertyData.duplicateCount > 0,
        30,
        'Property appears in multiple listings',
        'Verify property ownership documents',
      ],
      [
        propertyData.priceVariance > 50,
        25,
        'Property price significantly differs from market value',
        'Request property valuation report',
      ],
      [
        propertyData.imageAuthenticityScore < 70,
        20,
        'Property images may be manipulated or stolen',
        'Request original property photos with timestamp',
      ],
    ];

    return checks
      .filter(([condition]) => condition)
      .reduce<RiskAssessment>(
        (acc, [, points, flag, rec]) => ({
          score:           acc.score + points,
          flags:           [...acc.flags, flag],
          recommendations: [...acc.recommendations, rec],
        }),
        { score: 0, flags: [], recommendations: [] },
      );
  }

  private static analyzeTransactionRisk(transactionData?: TransactionData): RiskAssessment {
    if (!transactionData) return { score: 0, flags: [], recommendations: [] };

    const checks: Array<[boolean, number, string, string]> = [
      [
        transactionData.unusualPaymentMethods,
        25,
        'Unusual payment methods requested',
        'Verify payment method legitimacy',
      ],
      [
        transactionData.urgencyIndicators > 2,
        20,
        'High-pressure sales tactics detected',
        'Allow cooling-off period for transactions',
      ],
    ];

    return checks
      .filter(([condition]) => condition)
      .reduce<RiskAssessment>(
        (acc, [, points, flag, rec]) => ({
          score:           acc.score + points,
          flags:           [...acc.flags, flag],
          recommendations: [...acc.recommendations, rec],
        }),
        { score: 0, flags: [], recommendations: [] },
      );
  }

  private static calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  // ── Document verification ──────────────────────────────────────────────────

  static verifyDocument(document: {
    type:          string;
    imageUrl:      string;
    extractedData: DocumentData;
  }): {
    isValid:       boolean;
    confidence:    number;
    issues:        string[];
    extractedInfo: DocumentData;
  } {
    const deductions: Array<[boolean, number, string]> = [
      [
        !this.VALID_DOCUMENT_TYPES.has(document.type),
        50,
        'Invalid document type',
      ],
      [
        !document.extractedData || Object.keys(document.extractedData).length === 0,
        30,
        'Unable to extract data from document',
      ],
      [
        document.extractedData.tamperingScore > 30,
        40,
        'Document may have been tampered with',
      ],
      [
        !!document.extractedData.expiryDate &&
          new Date(document.extractedData.expiryDate) < new Date(),
        60,
        'Document has expired',
      ],
    ];

    const missingFields = this.REQUIRED_DOCUMENT_FIELDS[document.type]?.filter(
      (field) => !(field in document.extractedData) || !document.extractedData[field],
    ) ?? [];

    const issues = [
      ...deductions.filter(([condition]) => condition).map(([, , msg]) => msg),
      ...(missingFields.length > 0 ? [`Missing required fields: ${missingFields.join(', ')}`] : []),
    ];

    const confidence = Math.max(
      0,
      100 -
        deductions.filter(([cond]) => cond).reduce((sum, [, pts]) => sum + pts, 0) -
        missingFields.length * 10,
    );

    return {
      isValid:      confidence >= 70 && issues.length === 0,
      confidence,
      issues,
      extractedInfo: document.extractedData,
    };
  }

  // ── Community trust ────────────────────────────────────────────────────────

  static calculateCommunityTrust(data: {
    references:          CommunityReference[];
    reviews:             CommunityReview[];
    communityEngagement: CommunityEngagement[];
    reportedIssues:      ReportedIssue[];
  }): { score: number; factors: Record<string, number>; insights: string[] } {
    const validRefs    = data.references.filter((r) => r.verified);
    const avgRating    = data.reviews.length > 0
      ? data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length
      : 0;
    const activeIssues = data.reportedIssues.filter(
      (i) => i.status === 'active' || i.status === 'investigating',
    );

    const factors: Record<string, number> = {
      references: Math.min(validRefs.length * 15, 60),
      reviews:    Math.round(avgRating * 10),
      engagement: Math.min(data.communityEngagement.length * 5, 30),
      penalties:  -activeIssues.length * 20,
    };

    const insights: string[] = [
      validRefs.length < 2          && 'Add more verified references to improve trust',
      data.reviews.length < 5       && 'Encourage more users to leave reviews',
      data.communityEngagement.length < 3 && 'Participate more in community discussions',
      activeIssues.length > 0       && 'Resolve outstanding reported issues',
    ].filter((s): s is string => typeof s === 'string');

    const score = Math.max(0, Math.min(100, Object.values(factors).reduce((sum, v) => sum + v, 0)));

    return { score, factors, insights };
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  static validateTrustOperation(
    operation: 'create' | 'update' | 'delete',
    data:      Record<string, unknown>,
    userId:    string,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      if (operation === 'create') {
        TrustScoreSchema.parse(data);
      } else if (operation === 'update' && data.factors) {
        TrustScoreSchema.shape.factors.parse(data.factors);
      } else if (operation === 'delete' && (!data.id || !data.userId)) {
        errors.push('ID and user ID required for deletion');
      }

      if (data.userId && data.userId !== userId) {
        errors.push("Unauthorized: Cannot modify another user's trust data");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
      } else {
        errors.push('Validation failed');
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}