// Community Trust Schema
export interface TrustMetrics {
  verificationScore: number;
  communityRating: number;
  transactionHistory: number;
  responseTime: number;
  profileCompleteness: number;
}

export interface TrustScore {
  overall: number;
  metrics: TrustMetrics;
  level: TrustLevel;
  lastUpdated: Date;
}

export enum TrustLevel {
  NEWCOMER = 'newcomer',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export interface TrustLevelRequirements {
  minScore: number;
  requirements: Array<{
    metric: keyof TrustMetrics;
    minValue: number;
    description: string;
  }>;
  benefits: string[];
  maxTransactionValue?: number;
}

// Additional interfaces for community trust service
export interface BehaviorPattern {
  id: string;
  userId: number;
  pattern: string;
  frequency: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  responseTimeAvg: number;
  profileCompleteness: number;
  communicationQuality: number;
  consistencyScore: number;
  activityLevel: number;
}

export interface CommunityReference {
  id: string;
  refereeId: number;
  referrerId: number;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  timestamp: Date;
}

export interface SocialConnection {
  id: string;
  userId: number;
  connectedUserId: number;
  connectionType: 'friend' | 'colleague' | 'neighbor';
  strength: number;
  timestamp: Date;
}

export interface LocationTrust {
  id: string;
  userId: number;
  location: string;
  area: string;
  city: string;
  trustScore: number;
  verificationCount: number;
  lastVerified: Date;
  yearsInArea: number;
  localKnowledge: number;
  neighborhoodReputation: number;
  physicalPresence: boolean;
  localBusinessOwner: boolean;
  communityInvolvement: number;
}

export interface CommunityEndorsement {
  id: string;
  endorseeId: number;
  endorserId: number;
  type: 'skill' | 'character' | 'reliability';
  message: string;
  timestamp: Date;
}

// Trust calculation functions
export function calculateTrustScore(metrics: TrustMetrics): number {
  const weights = {
    verificationScore: 0.3,
    communityRating: 0.25,
    transactionHistory: 0.2,
    responseTime: 0.15,
    profileCompleteness: 0.1
  };

  return Math.round(
    metrics.verificationScore * weights.verificationScore +
    metrics.communityRating * weights.communityRating +
    metrics.transactionHistory * weights.transactionHistory +
    metrics.responseTime * weights.responseTime +
    metrics.profileCompleteness * weights.profileCompleteness
  );
}

export function getTrustLevelFromScore(score: number): TrustLevel {
  if (score >= 90) return TrustLevel.PLATINUM;
  if (score >= 75) return TrustLevel.GOLD;
  if (score >= 60) return TrustLevel.SILVER;
  if (score >= 40) return TrustLevel.BRONZE;
  return TrustLevel.NEWCOMER;
}

export function getTrustLevelRequirements(level: TrustLevel): TrustLevelRequirements {
  const requirements: Record<TrustLevel, TrustLevelRequirements> = {
    [TrustLevel.NEWCOMER]: {
      minScore: 0,
      requirements: [
        { metric: 'profileCompleteness', minValue: 50, description: 'Complete at least 50% of profile' }
      ],
      benefits: ['Basic platform access', 'Limited property listings']
    },
    [TrustLevel.BRONZE]: {
      minScore: 40,
      requirements: [
        { metric: 'verificationScore', minValue: 30, description: 'Basic identity verification' },
        { metric: 'profileCompleteness', minValue: 70, description: 'Complete at least 70% of profile' }
      ],
      benefits: ['Increased listing visibility', 'Basic trust badge', 'Customer support priority']
    },
    [TrustLevel.SILVER]: {
      minScore: 60,
      requirements: [
        { metric: 'verificationScore', minValue: 60, description: 'Enhanced verification' },
        { metric: 'communityRating', minValue: 4.0, description: 'Maintain 4+ star rating' },
        { metric: 'transactionHistory', minValue: 5, description: 'Complete 5+ successful transactions' }
      ],
      benefits: ['Premium listing features', 'Silver trust badge', 'Priority customer support', 'Reduced fees']
    },
    [TrustLevel.GOLD]: {
      minScore: 75,
      requirements: [
        { metric: 'verificationScore', minValue: 80, description: 'Full verification including documents' },
        { metric: 'communityRating', minValue: 4.5, description: 'Maintain 4.5+ star rating' },
        { metric: 'transactionHistory', minValue: 15, description: 'Complete 15+ successful transactions' },
        { metric: 'responseTime', minValue: 80, description: 'Respond within 2 hours 80% of the time' }
      ],
      benefits: ['Gold trust badge', 'Featured listings', 'Advanced analytics', 'Dedicated account manager']
    },
    [TrustLevel.PLATINUM]: {
      minScore: 90,
      requirements: [
        { metric: 'verificationScore', minValue: 95, description: 'Complete verification with background check' },
        { metric: 'communityRating', minValue: 4.8, description: 'Maintain 4.8+ star rating' },
        { metric: 'transactionHistory', minValue: 50, description: 'Complete 50+ successful transactions' },
        { metric: 'responseTime', minValue: 90, description: 'Respond within 1 hour 90% of the time' },
        { metric: 'profileCompleteness', minValue: 100, description: 'Complete profile with all details' }
      ],
      benefits: ['Platinum trust badge', 'Top listing placement', 'White-glove service', 'Revenue sharing program']
    }
  };

  return requirements[level];
}