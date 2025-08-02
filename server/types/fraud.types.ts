/**
 * Fraud detection and analysis types
 */

// Fraud analysis result interface
export interface FraudAnalysis {
  isSuspicious: boolean;
  suspiciousScore: number;
  fraudPatterns?: {
    priceAnomaly?: number;
    documentInconsistency?: number;
    ownershipRisk?: number;
    marketDeviation?: number;
  };
  reasons: string[];
  riskLevel: RiskLevel;
  verificationDate: string;
}

// Risk level type (imported from verification.types.ts to avoid duplication)
import type { RiskLevel } from './verification.types';

// Fraud pattern types
export interface FraudPatterns {
  priceAnomaly?: number;
  documentInconsistency?: number;
  ownershipRisk?: number;
  marketDeviation?: number;
}

// Fraud detection result
export interface FraudDetectionResult {
  propertyId: number;
  analysis: FraudAnalysis;
  timestamp: Date;
  confidence: number;
  modelVersion: string;
}

// Fraud alert interface
export interface FraudAlert {
  id: string;
  propertyId: number;
  alertType: 'high_risk' | 'suspicious_pattern' | 'document_issue' | 'price_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: FraudAnalysis;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: number;
}