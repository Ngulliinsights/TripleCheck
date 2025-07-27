// Land Verification System Type Definitions
// This file contains all TypeScript interfaces and types for the Kenya Land Verification System

import type {
  Property,
  User,
  landVerificationSessions,
  verificationLayers,
  riskFactors,
  governmentDesignations,
  communityFeedback,
  expertAssignments,
  propertyMonitoring,
  monitoringAlerts,
} from '@/shared/schema';

// Create proper types from the table schemas
export type LandVerificationSession = typeof landVerificationSessions.$inferSelect;
export type VerificationLayer = typeof verificationLayers.$inferSelect;
export type RiskFactor = typeof riskFactors.$inferSelect;
export type GovernmentDesignation = typeof governmentDesignations.$inferSelect;
export type CommunityFeedback = typeof communityFeedback.$inferSelect;
export type ExpertAssignment = typeof expertAssignments.$inferSelect;
export type PropertyMonitoring = typeof propertyMonitoring.$inferSelect;
export type MonitoringAlert = typeof monitoringAlerts.$inferSelect;

// Core verification session types
export interface VerificationSessionRequest {
  propertyId: number;
  userId: number;
  estimatedCompletionDate?: Date;
  monitoringEnabled?: boolean;
}

export interface VerificationSessionResponse extends LandVerificationSession {
  property?: Property;
  user?: User;
  verificationLayers?: VerificationLayerWithResults[];
  riskFactors?: RiskFactorWithContext[];
  governmentDesignations?: GovernmentDesignation[];
  communityFeedback?: CommunityFeedback[];
  expertAssignments?: ExpertAssignment[];
  completionPercentage: number;
  estimatedTimeRemaining?: number;
}

// Verification layer types
export interface VerificationLayerWithResults extends VerificationLayer {
  session?: LandVerificationSession;
  expertAssignments?: ExpertAssignment[];
  completionStatus: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progressPercentage: number;
  blockers?: string[];
  nextSteps?: string[];
}

export interface LayerExecutionRequest {
  sessionId: number;
  layerType: 'registry' | 'physical' | 'community' | 'government' | 'legal' | 'expert';
  assignedExpertId?: number;
  estimatedDuration?: number;
  notes?: string;
}

export interface LayerExecutionResult {
  layerId: number;
  status: 'completed' | 'failed' | 'requires_attention';
  results: Record<string, any>;
  duration: number;
  findings: string[];
  recommendations: string[];
  nextActions?: string[];
}

// Risk assessment types
export interface RiskFactorWithContext extends RiskFactor {
  session?: LandVerificationSession;
  relatedFactors?: RiskFactor[];
  mitigationStatus: 'none' | 'planned' | 'in_progress' | 'completed';
  mitigationCost?: number;
  mitigationTimeframe?: string;
}

export interface RiskAssessmentRequest {
  sessionId: number;
  includeProjections?: boolean;
  riskTolerance?: 'low' | 'medium' | 'high';
}

export interface RiskAssessmentResponse {
  sessionId: number;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  riskFactors: RiskFactorWithContext[];
  riskInteractions: RiskInteraction[];
  recommendations: Recommendation[];
  projectedRisk?: ProjectedRisk;
  assessmentDate: Date;
  validUntil: Date;
}

export interface RiskInteraction {
  id: string;
  primaryFactorId: number;
  secondaryFactorId: number;
  interactionType: 'amplifies' | 'mitigates' | 'triggers' | 'compounds';
  impactMultiplier: number;
  description: string;
  confidence: number;
}

export interface Recommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'immediate_action' | 'investigation' | 'monitoring' | 'mitigation';
  title: string;
  description: string;
  actionItems: string[];
  estimatedCost?: number;
  estimatedTimeframe?: string;
  expertRequired?: boolean;
  legalImplications?: string;
}

export interface ProjectedRisk {
  timeframes: {
    '30_days': number;
    '90_days': number;
    '1_year': number;
    '5_years': number;
  };
  scenarios: {
    best_case: number;
    most_likely: number;
    worst_case: number;
  };
  keyDrivers: string[];
}

// Government integration types
export interface RegistrySearchRequest {
  titleNumber?: string;
  propertyLocation: string;
  ownerName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface RegistrySearchResult {
  titleNumber: string;
  currentOwner: OwnerInfo;
  ownershipHistory: OwnershipTransfer[];
  legalInstruments: LegalInstrument[];
  surveyDetails: SurveyDetails;
  restrictions: PropertyRestriction[];
  lastUpdated: Date;
  verificationStatus: 'verified' | 'pending' | 'discrepancy';
  registrySource: string;
}

export interface OwnerInfo {
  name: string;
  idNumber?: string;
  address?: string;
  registrationDate: Date;
  ownershipType: 'individual' | 'company' | 'government' | 'trust';
  ownershipShare?: number; // percentage for joint ownership
}

export interface OwnershipTransfer {
  fromOwner: string;
  toOwner: string;
  transferDate: Date;
  transferType: 'sale' | 'inheritance' | 'gift' | 'court_order' | 'government_acquisition';
  transferValue?: number;
  instrumentNumber: string;
  registrationDate: Date;
  suspiciousIndicators?: string[];
}

export interface LegalInstrument {
  type: 'charge' | 'mortgage' | 'caveat' | 'restriction' | 'easement';
  instrumentNumber: string;
  registrationDate: Date;
  beneficiary: string;
  amount?: number;
  description: string;
  status: 'active' | 'discharged' | 'expired';
  expiryDate?: Date;
}

export interface SurveyDetails {
  surveyPlan: string;
  coordinateSystem: string;
  surveyDate: Date;
  surveyor: string;
  area: number; // in square meters
  boundaries: BoundaryPoint[];
  beacons: SurveyBeacon[];
  accuracy: number; // in meters
}

export interface BoundaryPoint {
  id: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  bearingToNext?: number;
  distanceToNext?: number;
}

export interface SurveyBeacon {
  id: string;
  type: 'concrete' | 'iron' | 'stone' | 'wooden';
  coordinates: {
    lat: number;
    lng: number;
  };
  condition: 'good' | 'damaged' | 'missing' | 'moved';
  lastVerified?: Date;
  notes?: string;
}

export interface PropertyRestriction {
  type: string;
  description: string;
  authority: string;
  effectiveDate: Date;
  expiryDate?: Date;
  compliance: 'compliant' | 'non_compliant' | 'unknown';
}

// Court records types
export interface CourtRecordsSearchRequest {
  propertyId?: number;
  ownerNames: string[];
  location?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface CourtRecord {
  caseNumber: string;
  court: string;
  parties: string[];
  caseType: string;
  status: 'active' | 'settled' | 'dismissed' | 'withdrawn' | 'pending';
  filingDate: Date;
  lastActivity: Date;
  summary: string;
  relevanceScore: number; // 0-100
  riskImplication: string;
  documents?: CourtDocument[];
}

export interface CourtDocument {
  documentType: string;
  filingDate: Date;
  summary: string;
  relevanceToProperty: number; // 0-100
}

// Community intelligence types
export interface CommunityIntelligenceRequest {
  sessionId: number;
  propertyLocation: string;
  propertyType: string;
  interviewTemplates?: boolean;
}

export interface InterviewTemplate {
  id: string;
  targetAudience: 'local_admin' | 'neighbor' | 'community_leader' | 'resident';
  questions: InterviewQuestion[];
  estimatedDuration: number; // in minutes
  safetyConsiderations: string[];
  culturalConsiderations: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'open_ended' | 'yes_no' | 'multiple_choice' | 'rating';
  options?: string[];
  followUpQuestions?: string[];
  sensitivityLevel: 'low' | 'medium' | 'high';
  legalImplications?: string;
}

export interface CommunityFeedbackRequest {
  sessionId: number;
  source: 'local_admin' | 'neighbor' | 'community_leader' | 'resident';
  sourceName?: string;
  sourcePosition?: string;
  contactInfo?: string;
  yearsInArea?: number;
  ownershipHistory?: string;
  knownDisputes?: string[];
  landUsePatterns?: string[];
  recentChanges?: string[];
  concerns?: string[];
  reliability?: number;
  isConfidential?: boolean;
}

export interface CommunityAnalysis {
  sessionId: number;
  feedbackCount: number;
  averageReliability: number;
  consensusLevel: number; // 0-100, how much feedback agrees
  keyFindings: string[];
  conflictingInformation: ConflictingInfo[];
  recommendedActions: string[];
  confidentialityLevel: 'public' | 'restricted' | 'confidential';
}

export interface ConflictingInfo {
  topic: string;
  conflictingAccounts: string[];
  reliabilityScores: number[];
  recommendedResolution: string;
}

// Expert coordination types
export interface ExpertSearchRequest {
  expertType: 'surveyor' | 'lawyer' | 'appraiser' | 'environmental' | 'valuer';
  location: string;
  specialization?: string;
  budget?: {
    min: number;
    max: number;
  };
  timeframe?: string;
  credentials?: string[];
}

export interface ExpertProfile {
  id: string;
  name: string;
  expertType: string;
  credentials: string[];
  specializations: string[];
  location: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
  };
  experience: {
    yearsOfExperience: number;
    relevantCases: number;
    successRate: number;
  };
  availability: {
    available: boolean;
    nextAvailableDate?: Date;
    estimatedDuration?: number;
  };
  pricing: {
    hourlyRate?: number;
    fixedFee?: number;
    currency: string;
  };
  reviews?: ExpertReview[];
  certifications: string[];
}

export interface ExpertReview {
  reviewerId: string;
  rating: number; // 1-5
  comment: string;
  projectType: string;
  completionDate: Date;
  verified: boolean;
}

export interface ExpertAssignmentRequest {
  sessionId: number;
  layerId?: number;
  expertId: string;
  expectedCompletionDate?: Date;
  specialInstructions?: string;
  budget?: number;
}

// Monitoring types
export interface MonitoringConfiguration {
  propertyId: number;
  sessionId?: number;
  monitoringTypes: MonitoringType[];
  frequency: 'daily' | 'weekly' | 'monthly';
  alertThresholds: AlertThreshold[];
  notificationPreferences: NotificationPreference[];
}

export interface MonitoringType {
  type: 'government_changes' | 'legal_disputes' | 'market_changes' | 'ownership_changes';
  enabled: boolean;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
}

export interface AlertThreshold {
  monitoringType: string;
  metric: string;
  threshold: number;
  comparison: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface NotificationPreference {
  alertType: string;
  method: 'email' | 'sms' | 'push' | 'in_app';
  enabled: boolean;
  immediateNotification: boolean;
  digestFrequency?: 'daily' | 'weekly';
}

export interface PropertyUpdate {
  id: string;
  propertyId: number;
  updateType: string;
  source: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  verificationRequired: boolean;
  relatedDocuments?: string[];
  actionRequired?: string[];
}

// API response types
export interface LandVerificationApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ApiError[];
  metadata?: {
    totalCount?: number;
    page?: number;
    limit?: number;
    processingTime?: number;
    cacheHit?: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

// Utility types
export type VerificationStatus = 'not_started' | 'in_progress' | 'completed' | 'suspended' | 'failed';
export type LayerType = 'registry' | 'physical' | 'community' | 'government' | 'legal' | 'expert';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskCategory = 'ownership' | 'government' | 'legal' | 'physical' | 'community';

// Constants
export const VERIFICATION_LAYER_NAMES: Record<LayerType, string> = {
  registry: 'Land Registry Verification',
  physical: 'Physical Ground-Truthing',
  community: 'Community Intelligence',
  government: 'Government Designations',
  legal: 'Legal History Investigation',
  expert: 'Professional Expert Assessment'
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  critical: 'text-red-600 bg-red-50 border-red-200'
};

export const VERIFICATION_STATUS_COLORS: Record<VerificationStatus, string> = {
  not_started: 'text-gray-600 bg-gray-50 border-gray-200',
  in_progress: 'text-blue-600 bg-blue-50 border-blue-200',
  completed: 'text-green-600 bg-green-50 border-green-200',
  suspended: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  failed: 'text-red-600 bg-red-50 border-red-200'
};