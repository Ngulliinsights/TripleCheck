/**
 * Fraud Detection System Schemas
 * 
 * Contains schemas for fraud detection, case management,
 * and compliance reporting.
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

// Fraud-related enums
export const fraudAlertStatusEnum = pgEnum("fraud_alert_status", [
    "active",
    "investigating",
    "resolved",
    "false_positive",
    "dismissed",
] as const);

export const fraudSeverityEnum = pgEnum("fraud_severity", [
    "low",
    "medium",
    "high",
    "critical",
] as const);

export const fraudCategoryEnum = pgEnum("fraud_category", [
    "identity_theft",
    "document_forgery",
    "price_manipulation",
    "fake_property",
    "payment_fraud",
    "impersonation",
    "data_manipulation",
] as const);

export const investigationStatusEnum = pgEnum("investigation_status", [
    "pending",
    "active",
    "suspended",
    "completed",
    "closed",
] as const);

export const complianceStatusEnum = pgEnum("compliance_status", [
    "compliant",
    "non_compliant",
    "under_review",
    "exempted",
] as const);

// Fraud Alerts table - Real-time fraud detection
export const fraudAlerts = pgTable(
    "fraud_alerts",
    {
        id: serial("id").primaryKey(),
        alertId: varchar("alert_id", { length: 50 }).unique().notNull(), // Unique alert identifier
        userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
        propertyId: integer("property_id").references(() => properties.id, { onDelete: "set null" }),
        transactionId: integer("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
        category: fraudCategoryEnum("category").notNull(),
        severity: fraudSeverityEnum("severity").notNull(),
        status: fraudAlertStatusEnum("status").default("active").notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description").notNull(),
        riskScore: integer("risk_score").notNull(), // 0-100 risk score
        confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.00-1.00
        detectionMethod: varchar("detection_method", { length: 100 }).notNull(), // 'ml_model', 'rule_based', 'manual', 'community_report'
        detectionRules: json("detection_rules").$type<string[]>().default([]),
        evidence: json("evidence").$type<Record<string, unknown>>().default({}),
        affectedEntities: json("affected_entities").$type<Array<{
            type: string;
            id: number;
            impact: string;
        }>>().default([]),
        investigationRequired: boolean("investigation_required").default(true).notNull(),
        assignedInvestigator: integer("assigned_investigator").references(() => users.id),
        assignedAt: timestamp("assigned_at"),
        resolvedAt: timestamp("resolved_at"),
        resolutionNotes: text("resolution_notes"),
        falsePositiveReason: text("false_positive_reason"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("fraud_alerts_alert_id_idx").on(table.alertId),
        index("fraud_alerts_user_idx").on(table.userId),
        index("fraud_alerts_property_idx").on(table.propertyId),
        index("fraud_alerts_transaction_idx").on(table.transactionId),
        index("fraud_alerts_category_idx").on(table.category),
        index("fraud_alerts_severity_idx").on(table.severity),
        index("fraud_alerts_status_idx").on(table.status),
        index("fraud_alerts_risk_score_idx").on(table.riskScore),
        index("fraud_alerts_investigator_idx").on(table.assignedInvestigator),
        index("fraud_alerts_active_idx").on(table.isActive),
        index("fraud_alerts_created_at_idx").on(table.createdAt),
        // Composite indexes
        index("fraud_alerts_status_severity_idx").on(table.status, table.severity),
        index("fraud_alerts_category_severity_idx").on(table.category, table.severity),
    ]
);

// Fraud Cases table - Investigation case management
export const fraudCases = pgTable(
    "fraud_cases",
    {
        id: serial("id").primaryKey(),
        caseNumber: varchar("case_number", { length: 50 }).unique().notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description").notNull(),
        category: fraudCategoryEnum("category").notNull(),
        severity: fraudSeverityEnum("severity").notNull(),
        status: investigationStatusEnum("status").default("pending").notNull(),
        priority: varchar("priority", { length: 20 }).default("medium").notNull(), // 'low', 'medium', 'high', 'urgent'
        primaryInvestigator: integer("primary_investigator")
            .references(() => users.id, { onDelete: "set null" })
            .notNull(),
        secondaryInvestigators: json("secondary_investigators").$type<number[]>().default([]),
        suspectedUsers: json("suspected_users").$type<number[]>().default([]),
        affectedUsers: json("affected_users").$type<number[]>().default([]),
        relatedProperties: json("related_properties").$type<number[]>().default([]),
        relatedTransactions: json("related_transactions").$type<number[]>().default([]),
        relatedAlerts: json("related_alerts").$type<number[]>().default([]),
        evidence: json("evidence").$type<Array<{
            type: string;
            description: string;
            url?: string;
            collectedAt: string;
            collectedBy: number;
        }>>().default([]),
        timeline: json("timeline").$type<Array<{
            timestamp: string;
            event: string;
            description: string;
            userId: number;
        }>>().default([]),
        estimatedLoss: decimal("estimated_loss", { precision: 12, scale: 2 }),
        actualLoss: decimal("actual_loss", { precision: 12, scale: 2 }),
        recoveredAmount: decimal("recovered_amount", { precision: 12, scale: 2 }),
        legalAction: boolean("legal_action").default(false).notNull(),
        legalActionDetails: text("legal_action_details"),
        complianceReported: boolean("compliance_reported").default(false).notNull(),
        reportedToAuthorities: json("reported_to_authorities").$type<Array<{
            authority: string;
            reportDate: string;
            referenceNumber: string;
        }>>().default([]),
        openedAt: timestamp("opened_at").defaultNow().notNull(),
        closedAt: timestamp("closed_at"),
        resolution: text("resolution"),
        resolutionCategory: varchar("resolution_category", { length: 50 }), // 'confirmed_fraud', 'false_positive', 'insufficient_evidence'
        preventiveMeasures: json("preventive_measures").$type<string[]>().default([]),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("fraud_cases_case_number_idx").on(table.caseNumber),
        index("fraud_cases_category_idx").on(table.category),
        index("fraud_cases_severity_idx").on(table.severity),
        index("fraud_cases_status_idx").on(table.status),
        index("fraud_cases_priority_idx").on(table.priority),
        index("fraud_cases_investigator_idx").on(table.primaryInvestigator),
        index("fraud_cases_opened_at_idx").on(table.openedAt),
        index("fraud_cases_active_idx").on(table.isActive),
        // Composite indexes
        index("fraud_cases_status_priority_idx").on(table.status, table.priority),
        index("fraud_cases_category_severity_idx").on(table.category, table.severity),
    ]
);

// Fraud Patterns table - ML pattern recognition
export const fraudPatterns = pgTable(
    "fraud_patterns",
    {
        id: serial("id").primaryKey(),
        patternId: varchar("pattern_id", { length: 50 }).unique().notNull(),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description").notNull(),
        category: fraudCategoryEnum("category").notNull(),
        patternType: varchar("pattern_type", { length: 50 }).notNull(), // 'behavioral', 'transactional', 'network', 'temporal'
        detectionRules: json("detection_rules").$type<Record<string, unknown>>().notNull(),
        mlModelId: varchar("ml_model_id", { length: 100 }),
        confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.00-1.00
        accuracy: decimal("accuracy", { precision: 3, scale: 2 }), // Historical accuracy
        falsePositiveRate: decimal("false_positive_rate", { precision: 3, scale: 2 }),
        detectionCount: integer("detection_count").default(0).notNull(),
        confirmedFraudCount: integer("confirmed_fraud_count").default(0).notNull(),
        falsePositiveCount: integer("false_positive_count").default(0).notNull(),
        lastTriggered: timestamp("last_triggered"),
        isActive: boolean("is_active").default(true).notNull(),
        createdBy: integer("created_by").references(() => users.id),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("fraud_patterns_pattern_id_idx").on(table.patternId),
        index("fraud_patterns_category_idx").on(table.category),
        index("fraud_patterns_type_idx").on(table.patternType),
        index("fraud_patterns_confidence_idx").on(table.confidence),
        index("fraud_patterns_active_idx").on(table.isActive),
        index("fraud_patterns_last_triggered_idx").on(table.lastTriggered),
        index("fraud_patterns_created_by_idx").on(table.createdBy),
    ]
);

// Compliance Reports table - Regulatory reporting
export const complianceReports = pgTable(
    "compliance_reports",
    {
        id: serial("id").primaryKey(),
        reportId: varchar("report_id", { length: 50 }).unique().notNull(),
        reportType: varchar("report_type", { length: 100 }).notNull(), // 'suspicious_activity', 'fraud_incident', 'quarterly_summary'
        regulatoryBody: varchar("regulatory_body", { length: 255 }).notNull(), // 'CBK', 'FRC', 'DCI'
        reportingPeriod: varchar("reporting_period", { length: 50 }).notNull(),
        periodStart: timestamp("period_start").notNull(),
        periodEnd: timestamp("period_end").notNull(),
        status: complianceStatusEnum("status").default("under_review").notNull(),
        summary: text("summary").notNull(),
        totalIncidents: integer("total_incidents").default(0).notNull(),
        confirmedFraud: integer("confirmed_fraud").default(0).notNull(),
        falsePositives: integer("false_positives").default(0).notNull(),
        totalLoss: decimal("total_loss", { precision: 12, scale: 2 }),
        recoveredAmount: decimal("recovered_amount", { precision: 12, scale: 2 }),
        affectedUsers: integer("affected_users").default(0).notNull(),
        preventiveMeasures: json("preventive_measures").$type<string[]>().default([]),
        recommendations: json("recommendations").$type<string[]>().default([]),
        attachments: json("attachments").$type<string[]>().default([]),
        submittedBy: integer("submitted_by")
            .references(() => users.id, { onDelete: "set null" })
            .notNull(),
        reviewedBy: integer("reviewed_by").references(() => users.id),
        approvedBy: integer("approved_by").references(() => users.id),
        submittedAt: timestamp("submitted_at"),
        reviewedAt: timestamp("reviewed_at"),
        approvedAt: timestamp("approved_at"),
        dueDate: timestamp("due_date").notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("compliance_reports_report_id_idx").on(table.reportId),
        index("compliance_reports_type_idx").on(table.reportType),
        index("compliance_reports_body_idx").on(table.regulatoryBody),
        index("compliance_reports_status_idx").on(table.status),
        index("compliance_reports_period_idx").on(table.reportingPeriod),
        index("compliance_reports_submitted_by_idx").on(table.submittedBy),
        index("compliance_reports_due_date_idx").on(table.dueDate),
        index("compliance_reports_active_idx").on(table.isActive),
        // Composite indexes
        index("compliance_reports_status_due_date_idx").on(table.status, table.dueDate),
        index("compliance_reports_body_period_idx").on(table.regulatoryBody, table.reportingPeriod),
    ]
);

// Define relationships
export const fraudAlertsRelations = relations(fraudAlerts, ({ one }) => ({
    user: one(users, {
        fields: [fraudAlerts.userId],
        references: [users.id],
    }),
    property: one(properties, {
        fields: [fraudAlerts.propertyId],
        references: [properties.id],
    }),
    transaction: one(transactions, {
        fields: [fraudAlerts.transactionId],
        references: [transactions.id],
    }),
    assignedInvestigator: one(users, {
        fields: [fraudAlerts.assignedInvestigator],
        references: [users.id],
    }),
}));

export const fraudCasesRelations = relations(fraudCases, ({ one }) => ({
    primaryInvestigator: one(users, {
        fields: [fraudCases.primaryInvestigator],
        references: [users.id],
    }),
}));

export const fraudPatternsRelations = relations(fraudPatterns, ({ one }) => ({
    createdBy: one(users, {
        fields: [fraudPatterns.createdBy],
        references: [users.id],
    }),
}));

export const complianceReportsRelations = relations(complianceReports, ({ one }) => ({
    submittedBy: one(users, {
        fields: [complianceReports.submittedBy],
        references: [users.id],
    }),
    reviewedBy: one(users, {
        fields: [complianceReports.reviewedBy],
        references: [users.id],
    }),
    approvedBy: one(users, {
        fields: [complianceReports.approvedBy],
        references: [users.id],
    }),
}));

// Ultra-safe decimal regex pattern - completely linear, no quantifiers that could cause ReDoS
const safeDecimalRegex = /^\d+$|^\d+\.\d+$/;

// Zod schemas for validation
export const insertFraudAlertSchema = createInsertSchema(fraudAlerts, {
    alertId: z.string().min(1).max(50),
    title: z.string().min(1).max(255),
    description: z.string().min(1),
    riskScore: z.number().min(0).max(100),
    confidence: z.string().regex(safeDecimalRegex),
});

export const selectFraudAlertSchema = createSelectSchema(fraudAlerts);

export const insertFraudCaseSchema = createInsertSchema(fraudCases, {
    caseNumber: z.string().min(1).max(50),
    title: z.string().min(1).max(255),
    description: z.string().min(1),
});

export const selectFraudCaseSchema = createSelectSchema(fraudCases);

export const insertFraudPatternSchema = createInsertSchema(fraudPatterns, {
    patternId: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
    description: z.string().min(1),
    confidence: z.string().regex(safeDecimalRegex),
});

export const selectFraudPatternSchema = createSelectSchema(fraudPatterns);

export const insertComplianceReportSchema = createInsertSchema(complianceReports, {
    reportId: z.string().min(1).max(50),
    reportType: z.string().min(1).max(100),
    regulatoryBody: z.string().min(1).max(255),
    summary: z.string().min(1),
});

export const selectComplianceReportSchema = createSelectSchema(complianceReports);

// Export all fraud schemas
export const fraudSchemas = {
    fraudAlerts,
    fraudCases,
    fraudPatterns,
    complianceReports,
    // Relations
    fraudAlertsRelations,
    fraudCasesRelations,
    fraudPatternsRelations,
    complianceReportsRelations,
    // Validation schemas
    insertFraudAlertSchema,
    selectFraudAlertSchema,
    insertFraudCaseSchema,
    selectFraudCaseSchema,
    insertFraudPatternSchema,
    selectFraudPatternSchema,
    insertComplianceReportSchema,
    selectComplianceReportSchema,
};