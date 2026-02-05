/**
 * Verification and fraud detection related types and interfaces
 */

import type { NewPropertyInput, DatabaseProperty } from "./property.types";

// Image analysis result interface
export interface ImageAnalysis {
  qualityScore: number;
  authenticityScore: number;
  flaggedIssues: string[];
}

// Description analysis result interface
export interface DescriptionAnalysis {
  sentiment: number;
  keywordFlags: string[];
  qualityScore: number;
}

// Complete fraud detection result interface
export interface CompleteFraudDetectionResult {
  isSuspicious: boolean;
  suspiciousScore: number;
  overallScore: number;
  verificationTimestamp: string;
  imageAnalysis?: ImageAnalysis;
  descriptionAnalysis?: DescriptionAnalysis;
  aiModel?: string;
}

// Enhanced verification result interface
export interface VerificationResult {
  documentAuthenticity: "verified" | "suspicious" | "pending";
  ownershipVerified: boolean;
  riskScore: number;
  verifiedAt: string;
  error?: string;
  overallScore: number;
  verificationTimestamp: string;
  fraudDetection?: CompleteFraudDetectionResult;
  imageAnalysis?: ImageAnalysis;
  descriptionAnalysis?: DescriptionAnalysis;
  aiModel?: string;
}

// AI verification results interface (aligned with actual data structure)
export interface AIVerificationResults {
  documentAuthenticity?: "verified" | "suspicious" | "pending";
  ownershipVerified?: boolean;
  riskScore?: number;
  verifiedAt?: string;
  overallScore: number;
  verificationTimestamp: string;
  fraudDetection?: CompleteFraudDetectionResult;
  imageAnalysis?: ImageAnalysis;
  descriptionAnalysis?: DescriptionAnalysis;
  aiModel?: string;
}

// Minimal AI fraud detection result (from ai-routes)
export interface AIFraudDetectionResult {
  isSuspicious: boolean;
  suspiciousScore: number;
  overallScore?: number;
  verificationTimestamp?: string;
  imageAnalysis?: ImageAnalysis;
  descriptionAnalysis?: DescriptionAnalysis;
  aiModel?: string;
}

// Comprehensive fraud detection result
export interface ComprehensiveFraudDetectionResult {
  isSuspicious: boolean;
  riskLevel: "low" | "medium" | "high";
  suspiciousScore: number;
  reasons: string[];
  fraudPatterns: {
    priceAnomaly: number;
    documentInconsistency: number;
    ownershipRisk: number;
    marketDeviation: number;
  };
  alertsGenerated: number;
  detectionTimestamp: string;
}

// Verification status constants type
export type VerificationStatus = "pending" | "verified" | "suspicious" | "failed";

// Risk level type
export type RiskLevel = "low" | "medium" | "high" | "critical";

// Fraud detection input type
export type FraudDetectionInput = NewPropertyInput | DatabaseProperty;