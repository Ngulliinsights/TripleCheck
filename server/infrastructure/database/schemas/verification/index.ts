/**
 * Verification Schemas
 * 
 * Contains schemas related to land verification, expert assignments,
 * and verification workflows.
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
import { users, properties, professionals } from "../core";

// Land verification specific enums
export const landVerificationStatusEnum = pgEnum("land_verification_status", [
    "not_started",
    "in_progress",
    "completed",
    "suspended",
    "failed",
] as const);

export const verificationLayerTypeEnum = pgEnum("verification_layer_type", [
    "registry",
    "physical",
    "community",
    "government",
    "legal",
    "expert",
] as const);

export const riskLevelEnum = pgEnum("risk_level", [
    "low",
    "medium",
    "high",
    "critical",
] as const);

export const riskCategoryEnum = pgEnum("risk_category", [
    "ownership",
    "government",
    "legal",
    "physical",
    "community",
] as const);

export const governmentDesignationTypeEnum = pgEnum(
    "government_designation_type",
    [
        "riparian",
        "road_reserve",
        "utility_corridor",
        "environmental",
        "mineral_rights",
    ] as const
);

export const communityFeedbackSourceEnum = pgEnum("community_feedback_source", [
    "local_admin",
    "neighbor",
    "community_leader",
    "resident",
] as const);

// Land Verification Sessions table
export const landVerificationSessions = pgTable(
    "land_verification_sessions",
    {
        id: serial("id").primaryKey(),
        propertyId: integer("property_id")
            .references(() => properties.id, { onDelete: "cascade" })
            .notNull(),
        userId: integer("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
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
    (table) => [
        index("land_verification_sessions_property_idx").on(table.propertyId),
        index("land_verification_sessions_user_idx").on(table.userId),
        index("land_verification_sessions_status_idx").on(table.status),
        index("land_verification_sessions_risk_level_idx").on(table.riskLevel),
        index("land_verification_sessions_created_at_idx").on(table.createdAt),
        // Composite indexes for common queries
        index("land_verification_sessions_property_status_idx").on(table.propertyId, table.status),
        index("land_verification_sessions_user_status_idx").on(table.userId, table.status),
    ]
);

// Verification Layers table
export const verificationLayers = pgTable(
    "verification_layers",
    {
        id: serial("id").primaryKey(),
        sessionId: integer("session_id")
            .references(() => landVerificationSessions.id, { onDelete: "cascade" })
            .notNull(),
        layerType: verificationLayerTypeEnum("layer_type").notNull(),
        status: landVerificationStatusEnum("status")
            .default("not_started")
            .notNull(),
        startedAt: timestamp("started_at"),
        completedAt: timestamp("completed_at"),
        estimatedDuration: integer("estimated_duration"), // in hours
        actualDuration: integer("actual_duration"), // in hours
        assignedExpertId: integer("assigned_expert_id").references(() => professionals.id),
        results: json("results").$type<Record<string, unknown>>().default({}),
        notes: text("notes"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("verification_layers_session_idx").on(table.sessionId),
        index("verification_layers_layer_type_idx").on(table.layerType),
        index("verification_layers_status_idx").on(table.status),
        index("verification_layers_expert_idx").on(table.assignedExpertId),
        // Composite indexes
        index("verification_layers_session_layer_idx").on(table.sessionId, table.layerType),
        index("verification_layers_session_status_idx").on(table.sessionId, table.status),
        // Unique constraint to prevent duplicate layers per session
        uniqueIndex("verification_layers_session_layer_unique").on(table.sessionId, table.layerType),
    ]
);

// Risk Factors table
export const riskFactors = pgTable(
    "risk_factors",
    {
        id: serial("id").primaryKey(),
        sessionId: integer("session_id")
            .references(() => landVerificationSessions.id, { onDelete: "cascade" })
            .notNull(),
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
    (table) => [
        index("risk_factors_session_idx").on(table.sessionId),
        index("risk_factors_category_idx").on(table.category),
        index("risk_factors_severity_idx").on(table.severity),
        index("risk_factors_source_layer_idx").on(table.sourceLayer),
        index("risk_factors_active_idx").on(table.isActive),
        // Composite indexes
        index("risk_factors_session_category_idx").on(table.sessionId, table.category),
        index("risk_factors_session_severity_idx").on(table.sessionId, table.severity),
    ]
);

// Government Designations table
export const governmentDesignations = pgTable(
    "government_designations",
    {
        id: serial("id").primaryKey(),
        sessionId: integer("session_id")
            .references(() => landVerificationSessions.id, { onDelete: "cascade" })
            .notNull(),
        designationType:
            governmentDesignationTypeEnum("designation_type").notNull(),
        authority: varchar("authority", { length: 255 }).notNull(),
        designation: varchar("designation", { length: 255 }).notNull(),
        restrictions: json("restrictions").$type<string[]>().default([]),
        bufferZone: integer("buffer_zone"), // in meters
        riskLevel: riskLevelEnum("risk_level").notNull(),
        affectedArea: json("affected_area").$type<Record<string, unknown>>(), // GeoJSON or coordinate data
        plannedChanges: json("planned_changes")
            .$type<Record<string, unknown>[]>()
            .default([]),
        lastVerified: timestamp("last_verified").defaultNow().notNull(),
        validUntil: timestamp("valid_until"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("government_designations_session_idx").on(table.sessionId),
        index("government_designations_type_idx").on(table.designationType),
        index("government_designations_authority_idx").on(table.authority),
        index("government_designations_risk_level_idx").on(table.riskLevel),
        index("government_designations_last_verified_idx").on(table.lastVerified),
        index("government_designations_active_idx").on(table.isActive),
        // Composite indexes
        index("government_designations_session_type_idx").on(table.sessionId, table.designationType),
    ]
);

// Community Feedback table
export const communityFeedback = pgTable(
    "community_feedback",
    {
        id: serial("id").primaryKey(),
        sessionId: integer("session_id")
            .references(() => landVerificationSessions.id, { onDelete: "cascade" })
            .notNull(),
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
    (table) => [
        index("community_feedback_session_idx").on(table.sessionId),
        index("community_feedback_source_idx").on(table.source),
        index("community_feedback_reliability_idx").on(table.reliability),
        index("community_feedback_recorded_at_idx").on(table.recordedAt),
        index("community_feedback_confidential_idx").on(table.isConfidential),
    ]
);

// Expert Assignments table
export const expertAssignments = pgTable(
    "expert_assignments",
    {
        id: serial("id").primaryKey(),
        sessionId: integer("session_id")
            .references(() => landVerificationSessions.id, { onDelete: "cascade" })
            .notNull(),
        layerId: integer("layer_id").references(() => verificationLayers.id, {
            onDelete: "cascade",
        }),
        professionalId: integer("professional_id")
            .references(() => professionals.id, { onDelete: "cascade" })
            .notNull(),
        expertType: varchar("expert_type", { length: 50 }).notNull(), // 'surveyor', 'lawyer', 'appraiser'
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
    (table) => [
        index("expert_assignments_session_idx").on(table.sessionId),
        index("expert_assignments_layer_idx").on(table.layerId),
        index("expert_assignments_professional_idx").on(table.professionalId),
        index("expert_assignments_expert_type_idx").on(table.expertType),
        index("expert_assignments_status_idx").on(table.status),
        index("expert_assignments_assigned_at_idx").on(table.assignedAt),
        // Composite indexes
        index("expert_assignments_session_expert_type_idx").on(table.sessionId, table.expertType),
    ]
);

// Define relationships
export const landVerificationSessionsRelations = relations(landVerificationSessions, ({ one, many }) => ({
    property: one(properties, {
        fields: [landVerificationSessions.propertyId],
        references: [properties.id],
    }),
    user: one(users, {
        fields: [landVerificationSessions.userId],
        references: [users.id],
    }),
    layers: many(verificationLayers),
    riskFactors: many(riskFactors),
    governmentDesignations: many(governmentDesignations),
    communityFeedback: many(communityFeedback),
    expertAssignments: many(expertAssignments),
}));

export const verificationLayersRelations = relations(verificationLayers, ({ one, many }) => ({
    session: one(landVerificationSessions, {
        fields: [verificationLayers.sessionId],
        references: [landVerificationSessions.id],
    }),
    assignedExpert: one(professionals, {
        fields: [verificationLayers.assignedExpertId],
        references: [professionals.id],
    }),
    expertAssignments: many(expertAssignments),
}));

export const riskFactorsRelations = relations(riskFactors, ({ one }) => ({
    session: one(landVerificationSessions, {
        fields: [riskFactors.sessionId],
        references: [landVerificationSessions.id],
    }),
}));

export const governmentDesignationsRelations = relations(governmentDesignations, ({ one }) => ({
    session: one(landVerificationSessions, {
        fields: [governmentDesignations.sessionId],
        references: [landVerificationSessions.id],
    }),
}));

export const communityFeedbackRelations = relations(communityFeedback, ({ one }) => ({
    session: one(landVerificationSessions, {
        fields: [communityFeedback.sessionId],
        references: [landVerificationSessions.id],
    }),
}));

export const expertAssignmentsRelations = relations(expertAssignments, ({ one }) => ({
    session: one(landVerificationSessions, {
        fields: [expertAssignments.sessionId],
        references: [landVerificationSessions.id],
    }),
    layer: one(verificationLayers, {
        fields: [expertAssignments.layerId],
        references: [verificationLayers.id],
    }),
    professional: one(professionals, {
        fields: [expertAssignments.professionalId],
        references: [professionals.id],
    }),
}));

// Zod schemas for validation
// Ultra-safe decimal regex pattern - completely linear, no quantifiers that could cause ReDoS
const safeDecimalRegex = /^\d+$|^\d+\.\d+$/;

export const insertLandVerificationSessionSchema = createInsertSchema(landVerificationSessions, {
    overallRiskScore: (schema) => schema.min(0).max(100),
    confidence: (schema) => schema.regex(safeDecimalRegex),
});

export const selectLandVerificationSessionSchema = createSelectSchema(landVerificationSessions);

export const insertVerificationLayerSchema = createInsertSchema(verificationLayers);
export const selectVerificationLayerSchema = createSelectSchema(verificationLayers);

export const insertRiskFactorSchema = createInsertSchema(riskFactors, {
    confidence: (schema) => schema.regex(safeDecimalRegex),
    likelihood: (schema) => schema.regex(safeDecimalRegex),
});

export const selectRiskFactorSchema = createSelectSchema(riskFactors);

export const insertGovernmentDesignationSchema = createInsertSchema(governmentDesignations);
export const selectGovernmentDesignationSchema = createSelectSchema(governmentDesignations);

export const insertCommunityFeedbackSchema = createInsertSchema(communityFeedback, {
    reliability: (schema) => schema.regex(safeDecimalRegex),
});

export const selectCommunityFeedbackSchema = createSelectSchema(communityFeedback);

export const insertExpertAssignmentSchema = createInsertSchema(expertAssignments, {
    cost: (schema) => schema.regex(safeDecimalRegex).optional(),
});

export const selectExpertAssignmentSchema = createSelectSchema(expertAssignments);

export const verificationSchemas = {
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
    selectExpertAssignmentSchema,
};