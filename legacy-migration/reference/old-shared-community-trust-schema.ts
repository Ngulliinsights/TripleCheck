import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// COMMUNITY TRUST SCHEMA - NEW PRIMARY VERIFICATION SYSTEM
// ============================================================================

// Trust Levels - Progressive trust building
export const TRUST_LEVELS = {
  NEWCOMER: 'newcomer',      // Just joined, phone verified
  COMMUNITY: 'community',    // Community references verified
  VERIFIED: 'verified',      // Multiple successful transactions
  PREMIUM: 'premium',        // High-value transactions, agent endorsed
  CHAMPION: 'champion'       // Top-tier, community leader
} as const;

export type TrustLevel = typeof TRUST_LEVELS[keyof typeof TRUST_LEVELS];

// Community References - Core trust building mechanism
export const communityReferences = pgTable("community_references", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  referenceType: text("reference_type").notNull(), // 'neighbor', 'church_member', 'colleague', 'family', 'business_partner'
  referenceName: text("reference_name").notNull(),
  referencePhone: text("reference_phone").notNull(),
  relationship: text("relationship").notNull(),
  yearsKnown: integer("years_known").notNull(),
  trustRating: integer("trust_rating").notNull(), // 1-10 scale
  verificationStatus: text("verification_status").notNull().default('pending'), // 'pending', 'verified', 'rejected'
  verifiedAt: timestamp("verified_at"),
  verificationMethod: text("verification_method"), // 'phone_call', 'sms', 'in_person'
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Social Connections - Network-based trust
export const socialConnections = pgTable("social_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  connectedUserId: integer("connected_user_id").notNull(),
  connectionType: text("connection_type").notNull(), // 'mutual_reference', 'transaction_partner', 'community_member'
  connectionStrength: integer("connection_strength").notNull(), // 1-10 scale
  mutualConnections: integer("mutual_connections").notNull().default(0),
  endorsements: json("endorsements").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Behavioral Patterns - AI analyzes these instead of documents
export const behaviorPatterns = pgTable("behavior_patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  responseTimeAvg: integer("response_time_avg").notNull(), // Average response time in minutes
  profileCompleteness: integer("profile_completeness").notNull(), // 0-100%
  communicationQuality: integer("communication_quality").notNull(), // 1-10 AI-scored
  consistencyScore: integer("consistency_score").notNull(), // 1-10 how consistent their info is
  activityLevel: integer("activity_level").notNull(), // 1-10 how active on platform
  transactionHistory: integer("transaction_history").notNull().default(0),
  cancellationRate: decimal("cancellation_rate", { precision: 5, scale: 2 }).notNull().default('0.00'),
  positiveInteractions: integer("positive_interactions").notNull().default(0),
  flaggedInteractions: integer("flagged_interactions").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Community Endorsements - Local leaders vouch for users
export const communityEndorsements = pgTable("community_endorsements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  endorserType: text("endorser_type").notNull(), // 'church_leader', 'local_chief', 'business_association', 'womens_group', 'youth_group'
  endorserName: text("endorser_name").notNull(),
  endorserTitle: text("endorser_title").notNull(),
  endorserContact: text("endorser_contact").notNull(),
  endorsementLevel: integer("endorsement_level").notNull(), // 1-10 scale
  endorsementReason: text("endorsement_reason").notNull(),
  verificationStatus: text("verification_status").notNull().default('pending'),
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"), // Endorsements can expire
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Location Trust - Area-based reputation
export const locationTrust = pgTable("location_trust", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  area: text("area").notNull(),
  city: text("city").notNull(),
  yearsInArea: integer("years_in_area").notNull(),
  localKnowledge: integer("local_knowledge").notNull(), // 1-10 AI-scored based on area descriptions
  neighborhoodReputation: integer("neighborhood_reputation").notNull(), // 1-10 based on community feedback
  physicalPresence: boolean("physical_presence").notNull().default(false), // Have they met other users in person?
  localBusinessOwner: boolean("local_business_owner").notNull().default(false),
  communityInvolvement: integer("community_involvement").notNull().default(0), // 1-10 scale
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Trust Score Calculation - AI-driven composite score
export const trustScores = pgTable("trust_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  overallScore: integer("overall_score").notNull(), // 0-1000 composite score
  trustLevel: text("trust_level").notNull(), // TRUST_LEVELS enum
  communityScore: integer("community_score").notNull(), // Based on references
  behaviorScore: integer("behavior_score").notNull(), // Based on platform behavior
  socialScore: integer("social_score").notNull(), // Based on connections
  locationScore: integer("location_score").notNull(), // Based on area reputation
  endorsementScore: integer("endorsement_score").notNull(), // Based on community leaders
  transactionScore: integer("transaction_score").notNull(), // Based on successful transactions
  riskLevel: text("risk_level").notNull(), // 'very_low', 'low', 'medium', 'high', 'very_high'
  maxTransactionValue: integer("max_transaction_value").notNull(), // KES amount they can transact
  lastCalculatedAt: timestamp("last_calculated_at").notNull().defaultNow(),
  calculationVersion: text("calculation_version").notNull().default('1.0'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Physical Verification Requests - SECONDARY verification for high-value transactions
export const physicalVerificationRequests = pgTable("physical_verification_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(), // Who requested verification
  targetUserId: integer("target_user_id").notNull(), // Who needs to be verified
  propertyId: integer("property_id"), // Related property if applicable
  transactionValue: integer("transaction_value").notNull(),
  verificationType: text("verification_type").notNull(), // 'in_person_meeting', 'agent_verification', 'document_check'
  requestReason: text("request_reason").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'accepted', 'completed', 'rejected'
  meetingLocation: text("meeting_location"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  verificationResults: json("verification_results").$type<{
    documentsVerified: boolean;
    identityConfirmed: boolean;
    propertyOwnershipConfirmed: boolean;
    verifierNotes: string;
    riskAssessment: 'low' | 'medium' | 'high';
  }>(),
  verifierId: integer("verifier_id"), // Agent or user who performed verification
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Transaction Trust Events - Track trust-building events
export const transactionTrustEvents = pgTable("transaction_trust_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  eventType: text("event_type").notNull(), // 'successful_transaction', 'positive_review', 'reference_verified', 'endorsement_received'
  eventValue: integer("event_value").notNull(), // Impact on trust score
  relatedId: integer("related_id"), // ID of related record (transaction, review, etc.)
  description: text("description").notNull(),
  trustImpact: integer("trust_impact").notNull(), // +/- points to trust score
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const CommunityReferenceSchema = z.object({
  referenceType: z.enum(['neighbor', 'church_member', 'colleague', 'family', 'business_partner']),
  referenceName: z.string().min(2).max(100),
  referencePhone: z.string().regex(/^\+254[0-9]{9}$/, "Must be valid Kenyan phone number"),
  relationship: z.string().min(5).max(200),
  yearsKnown: z.number().int().min(0).max(50),
  trustRating: z.number().int().min(1).max(10)
});

export const BehaviorPatternSchema = z.object({
  responseTimeAvg: z.number().int().min(0),
  profileCompleteness: z.number().int().min(0).max(100),
  communicationQuality: z.number().int().min(1).max(10),
  consistencyScore: z.number().int().min(1).max(10),
  activityLevel: z.number().int().min(1).max(10)
});

export const CommunityEndorsementSchema = z.object({
  endorserType: z.enum(['church_leader', 'local_chief', 'business_association', 'womens_group', 'youth_group']),
  endorserName: z.string().min(2).max(100),
  endorserTitle: z.string().min(2).max(100),
  endorserContact: z.string().min(10).max(50),
  endorsementLevel: z.number().int().min(1).max(10),
  endorsementReason: z.string().min(10).max(500)
});

export const PhysicalVerificationRequestSchema = z.object({
  targetUserId: z.number().int().positive(),
  transactionValue: z.number().int().positive(),
  verificationType: z.enum(['in_person_meeting', 'agent_verification', 'document_check']),
  requestReason: z.string().min(10).max(500),
  meetingLocation: z.string().min(5).max(200).optional()
});

// ============================================================================
// INSERT SCHEMAS
// ============================================================================

export const insertCommunityReferenceSchema = createInsertSchema(communityReferences, {
  referenceName: z.string().min(2).max(100),
  referencePhone: z.string().regex(/^\+254[0-9]{9}$/),
  relationship: z.string().min(5).max(200),
  yearsKnown: z.number().int().min(0).max(50),
  trustRating: z.number().int().min(1).max(10)
}).pick({
  userId: true,
  referenceType: true,
  referenceName: true,
  referencePhone: true,
  relationship: true,
  yearsKnown: true,
  trustRating: true,
  notes: true
});

export const insertBehaviorPatternSchema = createInsertSchema(behaviorPatterns).pick({
  userId: true,
  responseTimeAvg: true,
  profileCompleteness: true,
  communicationQuality: true,
  consistencyScore: true,
  activityLevel: true,
  transactionHistory: true,
  cancellationRate: true,
  positiveInteractions: true,
  flaggedInteractions: true
});

export const insertCommunityEndorsementSchema = createInsertSchema(communityEndorsements).pick({
  userId: true,
  endorserType: true,
  endorserName: true,
  endorserTitle: true,
  endorserContact: true,
  endorsementLevel: true,
  endorsementReason: true
});

export const insertPhysicalVerificationRequestSchema = createInsertSchema(physicalVerificationRequests).pick({
  requesterId: true,
  targetUserId: true,
  propertyId: true,
  transactionValue: true,
  verificationType: true,
  requestReason: true,
  meetingLocation: true,
  scheduledAt: true
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CommunityReference = typeof communityReferences.$inferSelect;
export type InsertCommunityReference = z.infer<typeof insertCommunityReferenceSchema>;

export type SocialConnection = typeof socialConnections.$inferSelect;
export type BehaviorPattern = typeof behaviorPatterns.$inferSelect;
export type InsertBehaviorPattern = z.infer<typeof insertBehaviorPatternSchema>;

export type CommunityEndorsement = typeof communityEndorsements.$inferSelect;
export type InsertCommunityEndorsement = z.infer<typeof insertCommunityEndorsementSchema>;

export type LocationTrust = typeof locationTrust.$inferSelect;
export type TrustScore = typeof trustScores.$inferSelect;

export type PhysicalVerificationRequest = typeof physicalVerificationRequests.$inferSelect;
export type InsertPhysicalVerificationRequest = z.infer<typeof insertPhysicalVerificationRequestSchema>;

export type TransactionTrustEvent = typeof transactionTrustEvents.$inferSelect;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getTrustLevelRequirements = (level: TrustLevel) => {
  const requirements = {
    [TRUST_LEVELS.NEWCOMER]: {
      minScore: 0,
      maxTransactionValue: 50000, // KES 50K
      requirements: ['phone_verified', 'profile_complete']
    },
    [TRUST_LEVELS.COMMUNITY]: {
      minScore: 200,
      maxTransactionValue: 200000, // KES 200K
      requirements: ['community_references_2+', 'behavior_score_6+']
    },
    [TRUST_LEVELS.VERIFIED]: {
      minScore: 400,
      maxTransactionValue: 500000, // KES 500K
      requirements: ['successful_transactions_5+', 'social_connections_10+']
    },
    [TRUST_LEVELS.PREMIUM]: {
      minScore: 700,
      maxTransactionValue: 2000000, // KES 2M
      requirements: ['community_endorsement', 'location_trust_8+', 'behavior_score_8+']
    },
    [TRUST_LEVELS.CHAMPION]: {
      minScore: 900,
      maxTransactionValue: 10000000, // KES 10M
      requirements: ['multiple_endorsements', 'transaction_history_50+', 'zero_flags']
    }
  };
  
  return requirements[level];
};

export const calculateTrustScore = (
  communityScore: number,
  behaviorScore: number,
  socialScore: number,
  locationScore: number,
  endorsementScore: number,
  transactionScore: number
): number => {
  // Weighted calculation - community trust is most important
  const weights = {
    community: 0.3,    // 30% - Most important
    behavior: 0.25,    // 25% - How they act on platform
    social: 0.2,       // 20% - Network connections
    location: 0.1,     // 10% - Area reputation
    endorsement: 0.1,  // 10% - Leader endorsements
    transaction: 0.05  // 5% - Transaction history
  };
  
  return Math.round(
    (communityScore * weights.community +
     behaviorScore * weights.behavior +
     socialScore * weights.social +
     locationScore * weights.location +
     endorsementScore * weights.endorsement +
     transactionScore * weights.transaction) * 10
  );
};

export const getTrustLevelFromScore = (score: number): TrustLevel => {
  if (score >= 900) return TRUST_LEVELS.CHAMPION;
  if (score >= 700) return TRUST_LEVELS.PREMIUM;
  if (score >= 400) return TRUST_LEVELS.VERIFIED;
  if (score >= 200) return TRUST_LEVELS.COMMUNITY;
  return TRUST_LEVELS.NEWCOMER;
};