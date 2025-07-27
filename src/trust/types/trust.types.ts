import { BaseEntity } from '@/shared/types';

export interface TrustScore extends BaseEntity {
  userId: string;
  propertyId?: string;
  score: number;
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