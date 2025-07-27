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
  riskLevel: 'low' | 'medium' | 'high';
  verificationDate: string;
}

// Risk level type
export type RiskLevel = 'low' | 'medium' | 'high';

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