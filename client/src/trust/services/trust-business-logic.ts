import { z } from 'zod'

import { TrustScore } from '../types/trust.types'

// Trust validation schemas
export const TrustScoreSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  propertyId: z.string().uuid('Invalid property ID').optional(),
  score: z.number().int().min(0).max(1000),
  factors: z.object({
    documentVerification: z.number().min(0).max(100),
    communityFeedback: z.number().min(0).max(100),
    transactionHistory: z.number().min(0).max(100),
    identityVerification: z.number().min(0).max(100),
    propertyVerification: z.number().min(0).max(100).optional(),
  }),
  lastUpdated: z.date(),
});

export const VerificationCheckSchema = z.object({
  type: z.enum(['document', 'identity', 'property', 'financial']),
  status: z.enum(['pending', 'verified', 'rejected', 'expired']),
  documentUrl: z.string().url().optional(),
  verifiedBy: z.string().uuid().optional(),
  verificationDate: z.date().optional(),
  expiryDate: z.date().optional(),
  notes: z.string().max(1000).optional(),
});

export const FraudAlertSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  propertyId: z.string().uuid('Invalid property ID').optional(),
  alertType: z.enum(['suspicious_activity', 'fake_documents', 'duplicate_listing', 'payment_fraud']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(10).max(1000),
  status: z.enum(['active', 'investigating', 'resolved', 'false_positive']),
  reportedBy: z.string().uuid().optional(),
});

// Type definitions for better type safety
interface UserTransaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  status: string;
}

interface PropertyData {
  duplicateCount: number;
  priceVariance: number;
  imageAuthenticityScore: number;
}

interface TransactionData {
  unusualPaymentMethods: boolean;
  urgencyIndicators: number;
}

interface DocumentData {
  tamperingScore: number;
  expiryDate?: string;
  [key: string]: unknown;
}

interface CommunityReference {
  id: string;
  verified: boolean;
  referenceType: string;
}

interface CommunityReview {
  id: string;
  rating: number;
  comment: string;
  date: string;
}

interface CommunityEngagement {
  id: string;
  type: string;
  date: string;
}

interface ReportedIssue {
  id: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  severity: string;
}

// Trust business logic implementation
export class TrustBusinessLogic {
  // Trust score calculation weights
  private static readonly TRUST_WEIGHTS = {
    documentVerification: 0.25,
    communityFeedback: 0.20,
    transactionHistory: 0.25,
    identityVerification: 0.20,
    propertyVerification: 0.10,
  };

  // Trust level thresholds
  private static readonly TRUST_LEVELS = {
    UNVERIFIED: { min: 0, max: 299, label: 'Unverified', color: 'red' },
    BASIC: { min: 300, max: 499, label: 'Basic', color: 'orange' },
    VERIFIED: { min: 500, max: 749, label: 'Verified', color: 'yellow' },
    TRUSTED: { min: 750, max: 899, label: 'Trusted', color: 'green' },
    PREMIUM: { min: 900, max: 1000, label: 'Premium', color: 'blue' },
  };

  // Calculate comprehensive trust score
  static calculateTrustScore(factors: TrustScore['factors']): {
    score: number;
    level: string;
    color: string;
    breakdown: Record<string, number>;
    recommendations: string[];
  } {
    // Calculate weighted score
    let totalScore = 0;
    const breakdown: Record<string, number> = {};

    (Object.entries(this.TRUST_WEIGHTS) as Array<[keyof typeof factors, number]>).forEach(([factor, weight]) => {
      const factorScore = factors[factor] || 0;
      const weightedScore = factorScore * weight;
      totalScore += weightedScore;
      breakdown[factor] = weightedScore;
    });

    const finalScore = Math.round(totalScore);

    // Determine trust level
    const level = this.getTrustLevel(finalScore);

    // Generate recommendations
    const recommendations = this.generateTrustRecommendations(factors, finalScore);

    return {
      score: finalScore,
      level: level.label,
      color: level.color,
      breakdown,
      recommendations,
    };
  }

  // Get trust level based on score
  static getTrustLevel(score: number) {
    for (const level of Object.values(this.TRUST_LEVELS)) {
      if (score >= level.min && score <= level.max) {
        return level;
      }
    }
    return this.TRUST_LEVELS.UNVERIFIED;
  }

  // Generate personalized trust improvement recommendations
  static generateTrustRecommendations(factors: TrustScore['factors'], currentScore: number): string[] {
    const recommendations: string[] = [];

    // Add verification recommendations
    recommendations.push(...this.getVerificationRecommendations(factors));
    
    // Add community recommendations
    recommendations.push(...this.getCommunityRecommendations(factors));
    
    // Add overall score recommendations
    recommendations.push(...this.getScoreBasedRecommendations(currentScore));

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private static getVerificationRecommendations(factors: TrustScore['factors']): string[] {
    const recommendations: string[] = [];

    if (factors.documentVerification < 80) {
      recommendations.push('Complete document verification to increase trust score');
      if (factors.documentVerification < 50) {
        recommendations.push('Upload government-issued ID and proof of address');
      }
    }

    if (factors.identityVerification < 80) {
      recommendations.push('Complete identity verification through video call');
      if (factors.identityVerification < 30) {
        recommendations.push('Verify your phone number and email address');
      }
    }

    if (factors.propertyVerification && factors.propertyVerification < 70) {
      recommendations.push('Verify property ownership documents');
      if (factors.propertyVerification < 40) {
        recommendations.push('Schedule property inspection with certified agent');
      }
    }

    return recommendations;
  }

  private static getCommunityRecommendations(factors: TrustScore['factors']): string[] {
    const recommendations: string[] = [];

    if (factors.communityFeedback < 70) {
      recommendations.push('Engage with the community to build positive feedback');
      if (factors.communityFeedback < 40) {
        recommendations.push('Complete your profile and add references');
      }
    }

    if (factors.transactionHistory < 60) {
      recommendations.push('Complete more transactions to build history');
      if (factors.transactionHistory < 20) {
        recommendations.push('Start with smaller transactions to build trust');
      }
    }

    return recommendations;
  }

  private static getScoreBasedRecommendations(currentScore: number): string[] {
    if (currentScore < 500) {
      return ['Focus on basic verification steps first'];
    } else if (currentScore < 750) {
      return ['Build community reputation through positive interactions'];
    } else if (currentScore < 900) {
      return ['Complete advanced verification for premium status'];
    }
    return [];
  }

  // Fraud detection algorithm
  static detectFraudRisk(data: {
    userId: string;
    propertyId?: string;
    userHistory: UserTransaction[];
    propertyData?: PropertyData;
    transactionData?: TransactionData;
  }): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    flags: string[];
    recommendations: string[];
  } {
    let riskScore = 0;
    const flags: string[] = [];
    const recommendations: string[] = [];

    // Analyze different risk factors
    const userRisk = this.analyzeUserRisk(data.userHistory);
    const propertyRisk = this.analyzePropertyRisk(data.propertyData);
    const transactionRisk = this.analyzeTransactionRisk(data.transactionData);

    // Combine risk assessments
    riskScore += userRisk.score;
    flags.push(...userRisk.flags);
    recommendations.push(...userRisk.recommendations);

    riskScore += propertyRisk.score;
    flags.push(...propertyRisk.flags);
    recommendations.push(...propertyRisk.recommendations);

    riskScore += transactionRisk.score;
    flags.push(...transactionRisk.flags);
    recommendations.push(...transactionRisk.recommendations);

    return {
      riskLevel: this.calculateRiskLevel(riskScore),
      riskScore,
      flags,
      recommendations,
    };
  }

  private static analyzeUserRisk(userHistory: UserTransaction[]): {
    score: number;
    flags: string[];
    recommendations: string[];
  } {
    let score = 0;
    const flags: string[] = [];
    const recommendations: string[] = [];

    if (userHistory.length === 0) {
      score += 20;
      flags.push('New user with no transaction history');
      recommendations.push('Require additional verification for new users');
    }

    const recentTransactions = userHistory.filter(
      (transaction) =>
        new Date(transaction.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentTransactions.length > 10) {
      score += 15;
      flags.push('High transaction frequency in recent period');
      recommendations.push('Monitor user activity closely');
    }

    return { score, flags, recommendations };
  }

  private static analyzePropertyRisk(propertyData?: PropertyData): {
    score: number;
    flags: string[];
    recommendations: string[];
  } {
    let score = 0;
    const flags: string[] = [];
    const recommendations: string[] = [];

    if (!propertyData) return { score, flags, recommendations };

    if (propertyData.duplicateCount > 0) {
      score += 30;
      flags.push('Property appears in multiple listings');
      recommendations.push('Verify property ownership documents');
    }

    if (propertyData.priceVariance > 50) {
      score += 25;
      flags.push('Property price significantly differs from market value');
      recommendations.push('Request property valuation report');
    }

    if (propertyData.imageAuthenticityScore < 70) {
      score += 20;
      flags.push('Property images may be manipulated or stolen');
      recommendations.push('Request original property photos with timestamp');
    }

    return { score, flags, recommendations };
  }

  private static analyzeTransactionRisk(transactionData?: TransactionData): {
    score: number;
    flags: string[];
    recommendations: string[];
  } {
    let score = 0;
    const flags: string[] = [];
    const recommendations: string[] = [];

    if (!transactionData) return { score, flags, recommendations };

    if (transactionData.unusualPaymentMethods) {
      score += 25;
      flags.push('Unusual payment methods requested');
      recommendations.push('Verify payment method legitimacy');
    }

    if (transactionData.urgencyIndicators > 2) {
      score += 20;
      flags.push('High-pressure sales tactics detected');
      recommendations.push('Allow cooling-off period for transactions');
    }

    return { score, flags, recommendations };
  }

  private static calculateRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  // Document verification logic
  static verifyDocument(document: {
    type: string;
    imageUrl: string;
    extractedData: DocumentData;
  }): {
    isValid: boolean;
    confidence: number;
    issues: string[];
    extractedInfo: DocumentData;
  } {
    const issues: string[] = [];
    let confidence = 100;

    // Basic document type validation
    const validDocumentTypes = ['passport', 'drivers_license', 'national_id', 'utility_bill'];
    if (!validDocumentTypes.includes(document.type)) {
      issues.push('Invalid document type');
      confidence -= 50;
    }

    // Check extracted data quality
    if (!document.extractedData || Object.keys(document.extractedData).length === 0) {
      issues.push('Unable to extract data from document');
      confidence -= 30;
    }

    // Validate required fields based on document type
    const requiredFields = this.getRequiredFieldsForDocument(document.type);
    const missingFields = requiredFields.filter(
      field => !(field in document.extractedData) || !document.extractedData[field]
    );

    if (missingFields.length > 0) {
      issues.push(`Missing required fields: ${missingFields.join(', ')}`);
      confidence -= missingFields.length * 10;
    }

    // Check for document tampering indicators
    if (document.extractedData.tamperingScore > 30) {
      issues.push('Document may have been tampered with');
      confidence -= 40;
    }

    // Check document expiry
    if (document.extractedData.expiryDate) {
      const expiryDate = new Date(document.extractedData.expiryDate);
      if (expiryDate < new Date()) {
        issues.push('Document has expired');
        confidence -= 60;
      }
    }

    const isValid = confidence >= 70 && issues.length === 0;

    return {
      isValid,
      confidence: Math.max(0, confidence),
      issues,
      extractedInfo: document.extractedData,
    };
  }

  // Get required fields for document type
  private static getRequiredFieldsForDocument(documentType: string): string[] {
    const fieldMap: Record<string, string[]> = {
      passport: ['fullName', 'passportNumber', 'nationality', 'dateOfBirth', 'expiryDate'],
      drivers_license: ['fullName', 'licenseNumber', 'dateOfBirth', 'address', 'expiryDate'],
      national_id: ['fullName', 'idNumber', 'dateOfBirth', 'address'],
      utility_bill: ['fullName', 'address', 'billDate', 'serviceProvider'],
    };

    return fieldMap[documentType] ?? [];
  }

  // Community trust scoring
  static calculateCommunityTrust(data: {
    references: CommunityReference[];
    reviews: CommunityReview[];
    communityEngagement: CommunityEngagement[];
    reportedIssues: ReportedIssue[];
  }): {
    score: number;
    factors: Record<string, number>;
    insights: string[];
  } {
    let score = 0;
    const factors: Record<string, number> = {};
    const insights: string[] = [];

    // Reference scoring
    const validReferences = data.references.filter(ref => ref.verified);
    factors.references = Math.min(validReferences.length * 15, 60);
    score += factors.references;

    if (validReferences.length < 2) {
      insights.push('Add more verified references to improve trust');
    }

    // Review scoring
    const avgRating = data.reviews.length > 0
      ? data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length
      : 0;
    factors.reviews = Math.round(avgRating * 10);
    score += factors.reviews;

    if (data.reviews.length < 5) {
      insights.push('Encourage more users to leave reviews');
    }

    // Community engagement scoring
    factors.engagement = Math.min(data.communityEngagement.length * 5, 30);
    score += factors.engagement;

    if (data.communityEngagement.length < 3) {
      insights.push('Participate more in community discussions');
    }

    // Penalty for reported issues
    const activePenalties = data.reportedIssues.filter(
      (issue) => issue.status === 'active' || issue.status === 'investigating'
    );
    factors.penalties = -activePenalties.length * 20;
    score += factors.penalties;

    if (activePenalties.length > 0) {
      insights.push('Resolve outstanding reported issues');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      insights,
    };
  }

  // Trust score update logic
  static shouldUpdateTrustScore(
    currentScore: TrustScore,
    newFactors: Partial<TrustScore['factors']>
  ): {
    shouldUpdate: boolean;
    reason: string;
    newScore: number;
  } {
    const updatedFactors = { ...currentScore.factors, ...newFactors };
    const newCalculation = this.calculateTrustScore(updatedFactors);

    const scoreDifference = Math.abs(newCalculation.score - currentScore.score);
    const timeSinceLastUpdate = Date.now() - currentScore.lastUpdated.getTime();
    const daysSinceUpdate = timeSinceLastUpdate / (1000 * 60 * 60 * 24);

    // Update if significant score change or enough time has passed
    const shouldUpdate = scoreDifference >= 10 || daysSinceUpdate >= 7;

    let reason = '';
    if (scoreDifference >= 10) {
      reason = `Significant score change: ${scoreDifference} points`;
    } else if (daysSinceUpdate >= 7) {
      reason = 'Regular weekly update';
    } else {
      reason = 'No update needed';
    }

    return {
      shouldUpdate,
      reason,
      newScore: newCalculation.score,
    };
  }

  // Validate trust operations
  static validateTrustOperation(
    operation: 'create' | 'update' | 'delete',
    data: Record<string, unknown>,
    userId: string
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      switch (operation) {
        case 'create':
          TrustScoreSchema.parse(data);
          break;
        case 'update':
          // Partial validation for updates
          if (data.factors) {
            TrustScoreSchema.shape.factors.parse(data.factors);
          }
          break;
        case 'delete':
          if (!data.id || !data.userId) {
            errors.push('ID and user ID required for deletion');
          }
          break;
      }

      // Check user authorization
      if (data.userId && data.userId !== userId) {
        errors.push('Unauthorized: Cannot modify another user\'s trust data');
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(err => `${err.path.join('.')}: ${err.message}`));
      } else {
        errors.push('Validation failed');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}