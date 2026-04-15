/**
 * Consolidated Database Schemas Export
 * 
 * Single point of import for all database schemas across all domains.
 * This replaces the fragmented schema imports from multiple locations.
 */

// Core schemas (users, properties, reviews, etc.)
export * from './core';

// Domain-specific schemas
export * from './verification';
export * from './trust';
export * from './fraud';
export * from './communication';
export * from './analytics';

// Re-export core tables for convenience
export { 
  users, 
  properties, 
  reviews, 
  favorites, 
  propertyViews, 
  transactions, 
  statistics,
  professionals,
  // Relations
  usersRelations,
  propertiesRelations,
  reviewsRelations,
  favoritesRelations,
  propertyViewsRelations,
  transactionsRelations,
  professionalsRelations,
  // Schemas
  insertUserSchema,
  selectUserSchema,
  insertPropertySchema,
  selectPropertySchema,
  insertReviewSchema,
  selectReviewSchema,
  insertTransactionSchema,
  selectTransactionSchema,
  insertProfessionalSchema,
  selectProfessionalSchema
} from './core';

// Re-export verification tables for convenience
export {
  landVerificationSessions,
  verificationLayers,
  riskFactors,
  governmentDesignations,
  communityFeedback,
  expertAssignments,
  // Relations
  landVerificationSessionsRelations,
  verificationLayersRelations,
  riskFactorsRelations,
  governmentDesignationsRelations,
  communityFeedbackRelations,
  expertAssignmentsRelations,
  // Schemas
  insertLandVerificationSessionSchema,
  selectLandVerificationSessionSchema,
  insertVerificationLayerSchema,
  selectVerificationLayerSchema,
  insertRiskFactorSchema,
  selectRiskFactorSchema,
  insertGovernmentDesignationSchema,
  selectGovernmentDesignationSchema,
  insertCommunityFeedbackSchema,
  selectCommunityFeedbackSchema,
  insertExpertAssignmentSchema,
  selectExpertAssignmentSchema
} from './verification';

// Re-export trust tables for convenience
export {
  trustScores,
  reputationEvents,
  communityReferences,
  trustDisputes,
  // Relations
  trustScoresRelations,
  reputationEventsRelations,
  communityReferencesRelations,
  trustDisputesRelations,
  // Schemas
  insertTrustScoreSchema,
  selectTrustScoreSchema,
  insertReputationEventSchema,
  selectReputationEventSchema,
  insertCommunityReferenceSchema,
  selectCommunityReferenceSchema,
  insertTrustDisputeSchema,
  selectTrustDisputeSchema
} from './trust';

// Re-export fraud tables for convenience
export {
  fraudAlerts,
  fraudCases,
  fraudPatterns,
  complianceReports,
  // Relations
  fraudAlertsRelations,
  fraudCasesRelations,
  fraudPatternsRelations,
  complianceReportsRelations,
  // Schemas
  insertFraudAlertSchema,
  selectFraudAlertSchema,
  insertFraudCaseSchema,
  selectFraudCaseSchema,
  insertFraudPatternSchema,
  selectFraudPatternSchema,
  insertComplianceReportSchema,
  selectComplianceReportSchema
} from './fraud';

// Re-export communication tables for convenience
export {
  communicationChannels,
  messages,
  notifications,
  messageThreads,
  // Relations
  communicationChannelsRelations,
  messagesRelations,
  notificationsRelations,
  messageThreadsRelations,
  // Schemas
  insertCommunicationChannelSchema,
  selectCommunicationChannelSchema,
  insertMessageSchema,
  selectMessageSchema,
  insertNotificationSchema,
  selectNotificationSchema,
  insertMessageThreadSchema,
  selectMessageThreadSchema
} from './communication';

// Re-export analytics tables for convenience
export {
  analyticsEvents,
  analyticsMetrics,
  // Relations
  analyticsEventsRelations,
  // Schemas
  insertAnalyticsEventSchema,
  selectAnalyticsEventSchema,
  insertAnalyticsMetricSchema,
  selectAnalyticsMetricSchema
} from './analytics';

// Import core tables first
import {
  users,
  properties,
  reviews,
  favorites,
  propertyViews,
  transactions,
  statistics,
  professionals,
  // Relations
  usersRelations,
  propertiesRelations,
  reviewsRelations,
  favoritesRelations,
  propertyViewsRelations,
  transactionsRelations,
  professionalsRelations,
  // Validation schemas
  insertUserSchema,
  selectUserSchema,
  insertPropertySchema,
  selectPropertySchema,
  insertReviewSchema,
  selectReviewSchema,
  insertTransactionSchema,
  selectTransactionSchema,
  insertProfessionalSchema,
  selectProfessionalSchema,
} from './core';

// Import verification tables
import {
  landVerificationSessions,
  verificationLayers,
  riskFactors,
  governmentDesignations,
  communityFeedback,
  expertAssignments,
} from './verification';

// Import trust tables
import {
  trustScores,
  reputationEvents,
  communityReferences,
  trustDisputes,
} from './trust';

// Import fraud tables
import {
  fraudAlerts,
  fraudCases,
  fraudPatterns,
  complianceReports,
} from './fraud';

// Import communication tables
import {
  communicationChannels,
  messages,
  notifications,
  messageThreads,
} from './communication';

// Import analytics tables
import {
  analyticsEvents,
  analyticsMetrics,
} from './analytics';

// Export all schemas as a single object for easy access
export const allSchemas = {
  // Core tables
  users,
  properties,
  reviews,
  favorites,
  propertyViews,
  transactions,
  statistics,
  professionals,
  
  // Verification tables
  landVerificationSessions,
  verificationLayers,
  riskFactors,
  governmentDesignations,
  communityFeedback,
  expertAssignments,
  
  // Trust tables
  trustScores,
  reputationEvents,
  communityReferences,
  trustDisputes,
  
  // Fraud tables
  fraudAlerts,
  fraudCases,
  fraudPatterns,
  complianceReports,
  
  // Communication tables
  communicationChannels,
  messages,
  notifications,
  messageThreads,
  
  // Analytics tables
  analyticsEvents,
  analyticsMetrics,
};

// Export all relations as a single object
export const allRelations = {
  // Core relations
  usersRelations,
  propertiesRelations,
  reviewsRelations,
  favoritesRelations,
  propertyViewsRelations,
  transactionsRelations,
  professionalsRelations,
  
  // TODO: Import and add other relations when needed
  // Verification relations
  // landVerificationSessionsRelations,
  // verificationLayersRelations,
  // riskFactorsRelations,
  // governmentDesignationsRelations,
  // communityFeedbackRelations,
  // expertAssignmentsRelations,
  
  // Trust relations
  // trustScoresRelations,
  // reputationEventsRelations,
  // communityReferencesRelations,
  // trustDisputesRelations,
  
  // Fraud relations
  // fraudAlertsRelations,
  // fraudCasesRelations,
  // fraudPatternsRelations,
  // complianceReportsRelations,
  
  // Communication relations
  // communicationChannelsRelations,
  // messagesRelations,
  // notificationsRelations,
  // messageThreadsRelations,
  
  // Analytics relations
  // analyticsEventsRelations,
  // businessReportsRelations,
  // auditLogsRelations,
};

// Export all validation schemas
export const allValidationSchemas = {
  // Core validation schemas
  insertUserSchema,
  selectUserSchema,
  insertPropertySchema,
  selectPropertySchema,
  insertReviewSchema,
  selectReviewSchema,
  insertTransactionSchema,
  selectTransactionSchema,
  insertProfessionalSchema,
  selectProfessionalSchema,
  
  // TODO: Add other validation schemas when needed
  // Verification validation schemas
  // insertLandVerificationSessionSchema,
  // selectLandVerificationSessionSchema,
  // insertVerificationLayerSchema,
  // selectVerificationLayerSchema,
  // insertRiskFactorSchema,
  // selectRiskFactorSchema,
  // insertGovernmentDesignationSchema,
  // selectGovernmentDesignationSchema,
  // insertCommunityFeedbackSchema,
  // selectCommunityFeedbackSchema,
  // insertExpertAssignmentSchema,
  // selectExpertAssignmentSchema,
  
  // Trust validation schemas
  // insertTrustScoreSchema,
  // selectTrustScoreSchema,
  // insertReputationEventSchema,
  // selectReputationEventSchema,
  // insertCommunityReferenceSchema,
  // selectCommunityReferenceSchema,
  // insertTrustDisputeSchema,
  // selectTrustDisputeSchema,
  
  // Fraud validation schemas
  // insertFraudAlertSchema,
  // selectFraudAlertSchema,
  // insertFraudCaseSchema,
  // selectFraudCaseSchema,
  // insertFraudPatternSchema,
  // selectFraudPatternSchema,
  // insertComplianceReportSchema,
  // selectComplianceReportSchema,
  
  // Communication validation schemas
  // insertCommunicationChannelSchema,
  // selectCommunicationChannelSchema,
  // insertMessageSchema,
  // selectMessageSchema,
  // insertNotificationSchema,
  // selectNotificationSchema,
  // insertMessageThreadSchema,
  // selectMessageThreadSchema,
  
  // Analytics validation schemas
  // insertAnalyticsEventSchema,
  // selectAnalyticsEventSchema,
  // insertPerformanceMetricSchema,
  // selectPerformanceMetricSchema,
  // insertBusinessReportSchema,
  // selectBusinessReportSchema,
  // insertAuditLogSchema,
  // selectAuditLogSchema,
};

// Table names for migration and validation purposes
export const tableNames = [
  // Core tables
  'users',
  'properties',
  'reviews',
  'favorites',
  'property_views',
  'transactions',
  'statistics',
  'professionals',
  // Verification tables
  'land_verification_sessions',
  'verification_layers',
  'risk_factors',
  'government_designations',
  'community_feedback',
  'expert_assignments',
  // Trust tables
  'trust_scores',
  'reputation_events',
  'community_references',
  'trust_disputes',
  // Fraud tables
  'fraud_alerts',
  'fraud_cases',
  'fraud_patterns',
  'compliance_reports',
  // Communication tables
  'communication_channels',
  'messages',
  'notifications',
  'message_threads',
  // Analytics tables
  'analytics_events',
  'performance_metrics',
  'business_reports',
  'audit_logs',
] as const;

export type TableName = typeof tableNames[number];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * AI Verification Results Type
 */
export interface AIVerificationResults {
  overallScore?: number;
  imageAnalysis?: {
    authenticity: number;
    quality: number;
    flags: string[];
  };
  textAnalysis?: {
    sentiment: number;
    credibility: number;
    flags: string[];
  };
  priceAnalysis?: {
    fairness: number;
    marketComparison: number;
    reasonableness?: number;
    flags: string[];
  };
  lastVerified?: string;
  verificationId?: string;
  [key: string]: unknown;
}

/**
 * Validates AI verification results structure
 */
export function validateAIVerificationResults(results: unknown): AIVerificationResults | null {
  if (!results || typeof results !== 'object') {
    return null;
  }

  const data = results as Record<string, unknown>;
  
  // Basic validation - ensure it has the expected structure
  const validated: AIVerificationResults = {};
  
  if (typeof data.overallScore === 'number') {
    validated.overallScore = data.overallScore;
  }
  
  if (data.imageAnalysis && typeof data.imageAnalysis === 'object') {
    const imageAnalysis = data.imageAnalysis as Record<string, unknown>;
    validated.imageAnalysis = {
      authenticity: typeof imageAnalysis.authenticity === 'number' ? imageAnalysis.authenticity : 0,
      quality: typeof imageAnalysis.quality === 'number' ? imageAnalysis.quality : 0,
      flags: Array.isArray(imageAnalysis.flags) ? imageAnalysis.flags.filter(f => typeof f === 'string') : []
    };
  }
  
  if (data.textAnalysis && typeof data.textAnalysis === 'object') {
    const textAnalysis = data.textAnalysis as Record<string, unknown>;
    validated.textAnalysis = {
      sentiment: typeof textAnalysis.sentiment === 'number' ? textAnalysis.sentiment : 0,
      credibility: typeof textAnalysis.credibility === 'number' ? textAnalysis.credibility : 0,
      flags: Array.isArray(textAnalysis.flags) ? textAnalysis.flags.filter(f => typeof f === 'string') : []
    };
  }
  
  if (data.priceAnalysis && typeof data.priceAnalysis === 'object') {
    const priceAnalysis = data.priceAnalysis as Record<string, unknown>;
    validated.priceAnalysis = {
      fairness: typeof priceAnalysis.fairness === 'number' ? priceAnalysis.fairness : 0,
      marketComparison: typeof priceAnalysis.marketComparison === 'number' ? priceAnalysis.marketComparison : 0,
      reasonableness: typeof priceAnalysis.reasonableness === 'number' ? priceAnalysis.reasonableness : 0,
      flags: Array.isArray(priceAnalysis.flags) ? priceAnalysis.flags.filter(f => typeof f === 'string') : []
    };
  }
  
  if (typeof data.lastVerified === 'string') {
    validated.lastVerified = data.lastVerified;
  }
  
  if (typeof data.verificationId === 'string') {
    validated.verificationId = data.verificationId;
  }
  
  return validated;
}

// ============================================================================
// TEMPORARY STUB EXPORTS FOR MISSING TABLES
// ============================================================================

// These tables need to be properly defined in the appropriate schema files
// For now, creating stub exports to prevent build errors

export const communityExperiences = null as any; // TODO: Define proper schema
export const experienceComments = null as any; // TODO: Define proper schema
export const experienceInteractions = null as any; // TODO: Define proper schema
export const professionalReviews = null as any; // TODO: Define proper schema
export const contentReports = null as any; // TODO: Define proper schema
export const fraudSubscriptions = null as any; // TODO: Define proper schema