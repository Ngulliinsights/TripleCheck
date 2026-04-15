/**
 * Trust and Reputation System Schemas
 * 
 * Contains schemas for trust scoring, reputation management,
 * and community-based verification systems.
 */

import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  json,
  pgEnum,
  decimal,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Import core tables for relationships
import { users, properties, transactions } from "../core";

// Trust-related enums
export const trustEventTypeEnum = pgEnum("trust_event_type", [
  "successful_transaction",
  "verified_property",
  "community_endorsement",
  "expert_verification",
  "dispute_resolution",
  "fraud_report",
  "system_penalty",
] as const);

export const trustScoreReasonEnum = pgEnum("trust_score_reason", [
  "initial_registration",
  "transaction_completion",
  "property_verification",
  "community_feedback",
  "expert_endorsement",
  "dispute_filed",
  "fraud_detected",
  "manual_adjustment",
] as const);

export const referenceStatusEnum = pgEnum("reference_status", [
  "pending",
  "approved",
  "rejected",
  "expired",
] as const);

// Trust Scores table - Historical trust score tracking
export const trustScores = pgTable(
  "trust_scores",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    previousScore: integer("previous_score").notNull(), // 0-100
    newScore: integer("new_score").notNull(), // 0-100
    scoreDelta: integer("score_delta").notNull(), // Change amount
    reason: trustScoreReasonEnum("reason").notNull(),
    eventType: trustEventTypeEnum("event_type").notNull(),
    relatedEntityId: integer("related_entity_id"), // Property, transaction, or user ID
    relatedEntityType: varchar("related_entity_type", { length: 50 }), // 'property', 'transaction', 'user'
    description: text("description"),
    evidence: json("evidence").$type<Record<string, any>>().default({}),
    calculatedBy: varchar("calculated_by", { length: 50 }).default("system").notNull(), // 'system', 'admin', 'community'
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("trust_scores_user_idx").on(table.userId),
    reasonIdx: index("trust_scores_reason_idx").on(table.reason),
    eventTypeIdx: index("trust_scores_event_type_idx").on(table.eventType),
    createdAtIdx: index("trust_scores_created_at_idx").on(table.createdAt),
    activeIdx: index("trust_scores_active_idx").on(table.isActive),
    // Composite indexes for common queries
    userReasonIdx: index("trust_scores_user_reason_idx").on(
      table.userId,
      table.reason
    ),
    userDateIdx: index("trust_scores_user_date_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

// Reputation Events table - Events that affect user reputation
export const reputationEvents = pgTable(
  "reputation_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    eventType: trustEventTypeEnum("event_type").notNull(),
    impact: integer("impact").notNull(), // Positive or negative impact value
    severity: varchar("severity", { length: 20 }).default("medium").notNull(), // 'low', 'medium', 'high', 'critical'
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    evidence: json("evidence").$type<string[]>().default([]),
    sourceUserId: integer("source_user_id").references(() => users.id), // Who reported/triggered the event
    relatedPropertyId: integer("related_property_id").references(() => properties.id),
    relatedTransactionId: integer("related_transaction_id").references(() => transactions.id),
    verificationRequired: boolean("verification_required").default(false).notNull(),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: integer("verified_by").references(() => users.id),
    isPublic: boolean("is_public").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    expiresAt: timestamp("expires_at"), // Some events may expire
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("reputation_events_user_idx").on(table.userId),
    eventTypeIdx: index("reputation_events_event_type_idx").on(table.eventType),
    severityIdx: index("reputation_events_severity_idx").on(table.severity),
    sourceUserIdx: index("reputation_events_source_user_idx").on(table.sourceUserId),
    propertyIdx: index("reputation_events_property_idx").on(table.relatedPropertyId),
    transactionIdx: index("reputation_events_transaction_idx").on(table.relatedTransactionId),
    publicIdx: index("reputation_events_public_idx").on(table.isPublic),
    activeIdx: index("reputation_events_active_idx").on(table.isActive),
    createdAtIdx: index("reputation_events_created_at_idx").on(table.createdAt),
    // Composite indexes
    userEventTypeIdx: index("reputation_events_user_event_type_idx").on(
      table.userId,
      table.eventType
    ),
    userPublicIdx: index("reputation_events_user_public_idx").on(
      table.userId,
      table.isPublic
    ),
  })
);

// Community References table - Peer reference system
export const communityReferences = pgTable(
  "community_references",
  {
    id: serial("id").primaryKey(),
    refereeId: integer("referee_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(), // Person being referenced
    referencerId: integer("referencer_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(), // Person giving the reference
    referenceType: varchar("reference_type", { length: 50 }).notNull(), // 'character', 'business', 'property_knowledge'
    rating: integer("rating").notNull(), // 1-5 rating
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    relationshipType: varchar("relationship_type", { length: 100 }), // 'neighbor', 'business_partner', 'client'
    relationshipDuration: integer("relationship_duration"), // Duration in months
    specificSkills: json("specific_skills").$type<string[]>().default([]),
    wouldRecommend: boolean("would_recommend").default(true).notNull(),
    status: referenceStatusEnum("status").default("pending").notNull(),
    verificationNotes: text("verification_notes"),
    verifiedAt: timestamp("verified_at"),
    verifiedBy: integer("verified_by").references(() => users.id),
    isPublic: boolean("is_public").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    expiresAt: timestamp("expires_at"), // References may expire
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    refereeIdx: index("community_references_referee_idx").on(table.refereeId),
    referencerIdx: index("community_references_referencer_idx").on(table.referencerId),
    typeIdx: index("community_references_type_idx").on(table.referenceType),
    ratingIdx: index("community_references_rating_idx").on(table.rating),
    statusIdx: index("community_references_status_idx").on(table.status),
    publicIdx: index("community_references_public_idx").on(table.isPublic),
    activeIdx: index("community_references_active_idx").on(table.isActive),
    createdAtIdx: index("community_references_created_at_idx").on(table.createdAt),
    // Composite indexes
    refereeStatusIdx: index("community_references_referee_status_idx").on(
      table.refereeId,
      table.status
    ),
    refereePublicIdx: index("community_references_referee_public_idx").on(
      table.refereeId,
      table.isPublic
    ),
    // Unique constraint to prevent duplicate references
    uniqueReferenceIdx: uniqueIndex("community_references_unique").on(
      table.refereeId,
      table.referencerId,
      table.referenceType
    ),
  })
);

// Trust Disputes table - Disputes about trust scores or reputation
export const trustDisputes = pgTable(
  "trust_disputes",
  {
    id: serial("id").primaryKey(),
    disputantId: integer("disputant_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(), // Person filing the dispute
    targetUserId: integer("target_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(), // Person being disputed
    disputeType: varchar("dispute_type", { length: 50 }).notNull(), // 'trust_score', 'reputation_event', 'reference'
    relatedEntityId: integer("related_entity_id"), // ID of the disputed item
    relatedEntityType: varchar("related_entity_type", { length: 50 }), // Type of disputed item
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    evidence: json("evidence").$type<string[]>().default([]),
    requestedAction: varchar("requested_action", { length: 100 }).notNull(), // 'score_adjustment', 'event_removal', 'reference_removal'
    status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'investigating', 'resolved', 'rejected'
    priority: varchar("priority", { length: 20 }).default("medium").notNull(), // 'low', 'medium', 'high', 'urgent'
    assignedTo: integer("assigned_to").references(() => users.id), // Admin handling the dispute
    resolution: text("resolution"),
    resolutionAction: varchar("resolution_action", { length: 100 }), // Action taken to resolve
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: integer("resolved_by").references(() => users.id),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    disputantIdx: index("trust_disputes_disputant_idx").on(table.disputantId),
    targetUserIdx: index("trust_disputes_target_user_idx").on(table.targetUserId),
    typeIdx: index("trust_disputes_type_idx").on(table.disputeType),
    statusIdx: index("trust_disputes_status_idx").on(table.status),
    priorityIdx: index("trust_disputes_priority_idx").on(table.priority),
    assignedToIdx: index("trust_disputes_assigned_to_idx").on(table.assignedTo),
    activeIdx: index("trust_disputes_active_idx").on(table.isActive),
    createdAtIdx: index("trust_disputes_created_at_idx").on(table.createdAt),
    // Composite indexes
    statusPriorityIdx: index("trust_disputes_status_priority_idx").on(
      table.status,
      table.priority
    ),
    assignedStatusIdx: index("trust_disputes_assigned_status_idx").on(
      table.assignedTo,
      table.status
    ),
  })
);

// Define relationships
export const trustScoresRelations = relations(trustScores, ({ one }) => ({
  user: one(users, {
    fields: [trustScores.userId],
    references: [users.id],
  }),
}));

export const reputationEventsRelations = relations(reputationEvents, ({ one }) => ({
  user: one(users, {
    fields: [reputationEvents.userId],
    references: [users.id],
  }),
  sourceUser: one(users, {
    fields: [reputationEvents.sourceUserId],
    references: [users.id],
  }),
  relatedProperty: one(properties, {
    fields: [reputationEvents.relatedPropertyId],
    references: [properties.id],
  }),
  relatedTransaction: one(transactions, {
    fields: [reputationEvents.relatedTransactionId],
    references: [transactions.id],
  }),
  verifiedByUser: one(users, {
    fields: [reputationEvents.verifiedBy],
    references: [users.id],
  }),
}));

export const communityReferencesRelations = relations(communityReferences, ({ one }) => ({
  referee: one(users, {
    fields: [communityReferences.refereeId],
    references: [users.id],
  }),
  referencer: one(users, {
    fields: [communityReferences.referencerId],
    references: [users.id],
  }),
  verifiedByUser: one(users, {
    fields: [communityReferences.verifiedBy],
    references: [users.id],
  }),
}));

export const trustDisputesRelations = relations(trustDisputes, ({ one }) => ({
  disputant: one(users, {
    fields: [trustDisputes.disputantId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [trustDisputes.targetUserId],
    references: [users.id],
  }),
  assignedToUser: one(users, {
    fields: [trustDisputes.assignedTo],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [trustDisputes.resolvedBy],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertTrustScoreSchema = createInsertSchema(trustScores, {
  previousScore: (schema) => schema.min(0).max(100),
  newScore: (schema) => schema.min(0).max(100),
  scoreDelta: (schema) => schema.min(-100).max(100),
});

export const selectTrustScoreSchema = createSelectSchema(trustScores);

export const insertReputationEventSchema = createInsertSchema(reputationEvents, {
  impact: (schema) => schema.min(-100).max(100),
  title: (schema) => schema.min(1).max(255),
  description: (schema) => schema.min(1),
});

export const selectReputationEventSchema = createSelectSchema(reputationEvents);

export const insertCommunityReferenceSchema = createInsertSchema(communityReferences, {
  rating: (schema) => schema.min(1).max(5),
  title: (schema) => schema.min(1).max(255),
  description: (schema) => schema.min(1),
  relationshipDuration: (schema) => schema.min(0).optional(),
});

export const selectCommunityReferenceSchema = createSelectSchema(communityReferences);

export const insertTrustDisputeSchema = createInsertSchema(trustDisputes, {
  title: (schema) => schema.min(1).max(255),
  description: (schema) => schema.min(1),
});

export const selectTrustDisputeSchema = createSelectSchema(trustDisputes);

// Export all trust schemas
export const trustSchemas = {
  trustScores,
  reputationEvents,
  communityReferences,
  trustDisputes,
  // Relations
  trustScoresRelations,
  reputationEventsRelations,
  communityReferencesRelations,
  trustDisputesRelations,
  // Validation schemas
  insertTrustScoreSchema,
  selectTrustScoreSchema,
  insertReputationEventSchema,
  selectReputationEventSchema,
  insertCommunityReferenceSchema,
  selectCommunityReferenceSchema,
  insertTrustDisputeSchema,
  selectTrustDisputeSchema,
};