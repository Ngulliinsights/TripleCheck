/**
 * Land Verification Schema
 * 
 * Database schema definitions for the land verification system.
 * This includes verification sessions, layers, risk factors, and related tables.
 */

import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  decimal,
  json,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { 
  landVerificationStatusEnum,
  verificationLayerTypeEnum,
  riskLevelEnum,
  riskCategoryEnum,
  governmentDesignationTypeEnum,
  communityFeedbackSourceEnum,
} from "@server/infrastructure/database/schemas/core";

// Land Verification Sessions table
export const landVerificationSessions = pgTable(
  "land_verification_sessions",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull(), // Will reference properties.id
    userId: integer("user_id").notNull(), // Will reference users.id
    status: landVerificationStatusEnum("status")
      .default("not_started")
      .notNull(),
    currentLayer: verificationLayerTypeEnum("current_layer"),
    overallRiskScore: integer("overall_risk_score").default(0), // 0-100
    riskLevel: riskLevelEnum("risk_level").default("low").notNull(),
    confidence: decimal("confidence", { precision: 3, scale: 2 }).default(
      "0.00"
    ), // 0.00-1.00
    estimatedCompletionDate: timestamp("estimated_completion_date"),
    actualCompletionDate: timestamp("actual_completion_date"),
    monitoringEnabled: boolean("monitoring_enabled").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdx: index("land_verification_sessions_property_idx").on(
      table.propertyId
    ),
    userIdx: index("land_verification_sessions_user_idx").on(table.userId),
    statusIdx: index("land_verification_sessions_status_idx").on(table.status),
    riskLevelIdx: index("land_verification_sessions_risk_level_idx").on(
      table.riskLevel
    ),
    createdAtIdx: index("land_verification_sessions_created_at_idx").on(
      table.createdAt
    ),
    // Composite indexes for common queries
    propertyStatusIdx: index(
      "land_verification_sessions_property_status_idx"
    ).on(table.propertyId, table.status),
    userStatusIdx: index("land_verification_sessions_user_status_idx").on(
      table.userId,
      table.status
    ),
  })
);

// Verification Layers table
export const verificationLayers = pgTable(
  "verification_layers",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").notNull(), // Will reference landVerificationSessions.id
    layerType: verificationLayerTypeEnum("layer_type").notNull(),
    status: landVerificationStatusEnum("status")
      .default("not_started")
      .notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    estimatedDuration: integer("estimated_duration"), // in hours
    actualDuration: integer("actual_duration"), // in hours
    assignedExpertId: integer("assigned_expert_id"),
    results: json("results").$type<Record<string, any>>().default({}),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("verification_layers_session_idx").on(table.sessionId),
    layerTypeIdx: index("verification_layers_layer_type_idx").on(
      table.layerType
    ),
    statusIdx: index("verification_layers_status_idx").on(table.status),
    expertIdx: index("verification_layers_expert_idx").on(
      table.assignedExpertId
    ),
    // Composite indexes
    sessionLayerIdx: index("verification_layers_session_layer_idx").on(
      table.sessionId,
      table.layerType
    ),
    sessionStatusIdx: index("verification_layers_session_status_idx").on(
      table.sessionId,
      table.status
    ),
    // Unique constraint to prevent duplicate layers per session
    uniqueSessionLayerIdx: uniqueIndex(
      "verification_layers_session_layer_unique"
    ).on(table.sessionId, table.layerType),
  })
);

// Risk Factors table
export const riskFactors = pgTable(
  "risk_factors",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").notNull(), // Will reference landVerificationSessions.id
    category: riskCategoryEnum("category").notNull(),
    severity: riskLevelEnum("severity").notNull(),
    confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.00-1.00
    description: text("description").notNull(),
    evidence: json("evidence").$type<string[]>().default([]),
    impact: text("impact").notNull(),
    likelihood: decimal("likelihood", { precision: 3, scale: 2 }).notNull(), // 0.00-1.00
    mitigation: json("mitigation").$type<string[]>().default([]),
    sourceLayer: verificationLayerTypeEnum("source_layer").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("risk_factors_session_idx").on(table.sessionId),
    categoryIdx: index("risk_factors_category_idx").on(table.category),
    severityIdx: index("risk_factors_severity_idx").on(table.severity),
    sourceLayerIdx: index("risk_factors_source_layer_idx").on(
      table.sourceLayer
    ),
    activeIdx: index("risk_factors_active_idx").on(table.isActive),
    // Composite indexes
    sessionCategoryIdx: index("risk_factors_session_category_idx").on(
      table.sessionId,
      table.category
    ),
    sessionSeverityIdx: index("risk_factors_session_severity_idx").on(
      table.sessionId,
      table.severity
    ),
  })
);

// Government Designations table
export const governmentDesignations = pgTable(
  "government_designations",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").notNull(), // Will reference landVerificationSessions.id
    designationType:
      governmentDesignationTypeEnum("designation_type").notNull(),
    authority: varchar("authority", { length: 255 }).notNull(),
    designation: varchar("designation", { length: 255 }).notNull(),
    restrictions: json("restrictions").$type<string[]>().default([]),
    bufferZone: integer("buffer_zone"), // in meters
    riskLevel: riskLevelEnum("risk_level").notNull(),
    affectedArea: json("affected_area").$type<Record<string, any>>(), // GeoJSON or coordinate data
    plannedChanges: json("planned_changes")
      .$type<Record<string, any>[]>()
      .default([]),
    lastVerified: timestamp("last_verified").defaultNow().notNull(),
    validUntil: timestamp("valid_until"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("government_designations_session_idx").on(
      table.sessionId
    ),
    designationTypeIdx: index("government_designations_type_idx").on(
      table.designationType
    ),
    authorityIdx: index("government_designations_authority_idx").on(
      table.authority
    ),
    riskLevelIdx: index("government_designations_risk_level_idx").on(
      table.riskLevel
    ),
    lastVerifiedIdx: index("government_designations_last_verified_idx").on(
      table.lastVerified
    ),
    activeIdx: index("government_designations_active_idx").on(table.isActive),
    // Composite indexes
    sessionTypeIdx: index("government_designations_session_type_idx").on(
      table.sessionId,
      table.designationType
    ),
  })
);

// Community Feedback table
export const communityFeedback = pgTable(
  "community_feedback",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").notNull(), // Will reference landVerificationSessions.id
    source: communityFeedbackSourceEnum("source").notNull(),
    sourceName: varchar("source_name", { length: 255 }),
    sourcePosition: varchar("source_position", { length: 255 }),
    contactInfo: varchar("contact_info", { length: 255 }), // Encrypted
    yearsInArea: integer("years_in_area"),
    ownershipHistory: text("ownership_history"),
    knownDisputes: json("known_disputes").$type<string[]>().default([]),
    landUsePatterns: json("land_use_patterns").$type<string[]>().default([]),
    recentChanges: json("recent_changes").$type<string[]>().default([]),
    concerns: json("concerns").$type<string[]>().default([]),
    reliability: decimal("reliability", { precision: 3, scale: 2 }).default(
      "0.50"
    ), // 0.00-1.00
    verifiedBy: varchar("verified_by", { length: 255 }),
    isConfidential: boolean("is_confidential").default(false).notNull(),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("community_feedback_session_idx").on(table.sessionId),
    sourceIdx: index("community_feedback_source_idx").on(table.source),
    reliabilityIdx: index("community_feedback_reliability_idx").on(
      table.reliability
    ),
    recordedAtIdx: index("community_feedback_recorded_at_idx").on(
      table.recordedAt
    ),
    confidentialIdx: index("community_feedback_confidential_idx").on(
      table.isConfidential
    ),
  })
);

// Expert Assignments table
export const expertAssignments = pgTable(
  "expert_assignments",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").notNull(), // Will reference landVerificationSessions.id
    layerId: integer("layer_id"), // Will reference verificationLayers.id
    expertType: varchar("expert_type", { length: 50 }).notNull(), // 'surveyor', 'lawyer', 'appraiser'
    expertName: varchar("expert_name", { length: 255 }).notNull(),
    expertCredentials: varchar("expert_credentials", { length: 500 }),
    contactInfo: varchar("contact_info", { length: 255 }),
    specialization: varchar("specialization", { length: 255 }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    expectedCompletionDate: timestamp("expected_completion_date"),
    actualCompletionDate: timestamp("actual_completion_date"),
    status: varchar("status", { length: 50 }).default("assigned").notNull(),
    reportUrl: varchar("report_url", { length: 500 }),
    cost: decimal("cost", { precision: 10, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("expert_assignments_session_idx").on(table.sessionId),
    layerIdx: index("expert_assignments_layer_idx").on(table.layerId),
    expertTypeIdx: index("expert_assignments_expert_type_idx").on(
      table.expertType
    ),
    statusIdx: index("expert_assignments_status_idx").on(table.status),
    assignedAtIdx: index("expert_assignments_assigned_at_idx").on(
      table.assignedAt
    ),
    // Composite indexes
    sessionExpertTypeIdx: index(
      "expert_assignments_session_expert_type_idx"
    ).on(table.sessionId, table.expertType),
  })
);