import { BaseEntity } from '@/shared/types';

export interface TrustScore extends BaseEntity {
  userId: string;
  propertyId?: string;
  score: number;
  value: number; // Alias for score for backward compatibility
  factors: {
    documentVerification: number;
    communityFeedback: number;
    transactionHistory: number;
    identityVerification: number;
    propertyVerification?: number;
  };
  lastUpdated: Date;
}

export interface VerificationCheck extends BaseEntity {
  type: 'document' | 'identity' | 'property' | 'financial';
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  documentUrl?: string;
  verifiedBy?: string;
  verificationDate?: Date;
  expiryDate?: Date;
  notes?: string;
}

export interface FraudAlert extends BaseEntity {
  userId: string;
  propertyId?: string;
  alertType: 'suspicious_activity' | 'fake_documents' | 'duplicate_listing' | 'payment_fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  reportedBy?: string;
}

export interface DocumentVerificationResult extends BaseEntity {
  documentId: string;
  userId: string;
  verificationStatus: 'verified' | 'rejected' | 'pending';
  confidence: number;
  checks: {
    authenticity: { score: number };
    integrity: boolean;
    metadata: boolean;
  };
  authenticity?: { score: number };
  completeness?: { score: number };
  consistency?: { score: number };
  communityValidation?: { score: number };
  expertVerification?: { score: number };
  issues?: string[];
  verifiedAt?: Date;
}

export interface CommunityFeedback extends BaseEntity {
  userId: string;
  propertyId?: string;
  rating: number;
  comment?: string;
  category: 'property' | 'transaction' | 'user' | 'document';
  verified: boolean;
  helpful: number;
  reportCount: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}