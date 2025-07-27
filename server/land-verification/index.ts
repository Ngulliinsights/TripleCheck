// Land Verification Service - Main Exports
export { LandVerificationService } from './LandVerificationService';
export { DocumentIntegration } from './DocumentIntegration';
export { LandVerificationServiceFactory } from './ServiceFactory';
export { CommunityIntelligenceService } from './CommunityIntelligenceService';
export { ExpertCoordinationService } from './ExpertCoordinationService';
export { MonitoringService } from './MonitoringService';

// Type exports
export type {
  VerificationSession,
  VerificationLayer,
  LayerResult,
  ExpertAssignment,
  MonitoringConfig,
  VerificationRequest,
  VerificationStatus,
  RiskAssessment,
  RiskFactor,
  RiskInteraction,
  Recommendation
} from './LandVerificationService';

export type {
  LandDocumentVerificationRequest,
  LandDocumentVerificationResult,
  LandSpecificCheck
} from './DocumentIntegration';

export type {
  LandVerificationServiceConfig
} from './ServiceFactory';

export type {
  InterviewTemplate,
  InterviewSection,
  InterviewQuestion,
  CommunityFeedback,
  CommunityAnalysis,
  KeyFinding,
  RiskIndicator,
  ValidationResult,
  Discrepancy,
  Corroboration
} from './CommunityIntelligenceService';

export type {
  Expert,
  ExpertSelectionCriteria,
  ExpertAssignmentRequest,
  ExpertAssignmentResult,
  ExpertReport,
  ExpertFinding,
  ExpertRecommendation,
  ConflictResolution
} from './ExpertCoordinationService';

export type {
  MonitoringSession,
  MonitoringAlert,
  MonitoringType,
  GovernmentChange,
  LegalDispute,
  RegulatoryUpdate
} from './MonitoringService';