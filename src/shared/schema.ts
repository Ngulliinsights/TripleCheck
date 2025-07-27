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
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums for better type safety and consistency
export const verificationStatusEnum = pgEnum("verification_status", [
  "verified",
  "pending",
  "unverified",
  "draft",
] as const);

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "agent",
  "admin",
] as const);

export const propertyTypeEnum = pgEnum("property_type", [
  "apartment",
  "house",
  "condo",
  "townhouse",
  "studio",
  "commercial",
  "land",
] as const);

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

// Extract property type values for reuse in validation schemas
const PROPERTY_TYPES = [
  "apartment",
  "house",
  "condo",
  "townhouse",
  "studio",
  "commercial",
  "land",
] as const;
export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number];

// Property Features as a structured JSON type with enhanced type safety
export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  parkingSpaces?: number;
  yearBuilt?: number;
  propertyType?: PropertyTypeValue;
  petFriendly?: boolean;
  furnished?: boolean;
  amenities?: string[];
}

// AI Verification Results interface with enhanced structure
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
    marketComparison: number;
    reasonableness: number;
    flags: string[];
  };
  lastVerified?: string;
  verificationId?: string;
}

// Coordinate interface for better type safety
export interface Coordinates {
  lat: number;
  lng: number;
}

// Enhanced users table with better constraints and defaults
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    trustScore: integer("trust_score").default(50).notNull(), // Start at neutral 50, range 0-100
    isVerifiedAgent: boolean("is_verified_agent").default(false).notNull(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    profileImageUrl: varchar("profile_image_url", { length: 500 }),
    bio: text("bio"),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    emailVerifiedAt: timestamp("email_verified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Optimized indexes for better query performance
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
    roleIdx: index("users_role_idx").on(table.role),
    trustScoreIdx: index("users_trust_score_idx").on(table.trustScore),
    activeIdx: index("users_active_idx").on(table.isActive),
    // Composite index for common filtering patterns
    activeRoleIdx: index("users_active_role_idx").on(
      table.isActive,
      table.role
    ),
  })
);

// Enhanced properties table with better data types and constraints
export const properties = pgTable(
  "properties",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(), // Supports up to $9,999,999,999.99
    location: varchar("location", { length: 255 }).notNull(),
    address: text("address"), // Full address separate from location
    coordinates: json("coordinates").$type<Coordinates>(),
    imageUrls: json("image_urls").$type<string[]>().default([]).notNull(),
    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),
    features: json("features").$type<PropertyFeatures>(),
    ownerId: integer("owner_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    aiVerificationResults: json(
      "ai_verification_results"
    ).$type<AIVerificationResults>(),
    viewCount: integer("view_count").default(0).notNull(),
    favoriteCount: integer("favorite_count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    availableFrom: timestamp("available_from"),
    availableUntil: timestamp("available_until"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Comprehensive indexes for common query patterns
    ownerIdx: index("properties_owner_idx").on(table.ownerId),
    statusIdx: index("properties_status_idx").on(table.verificationStatus),
    priceIdx: index("properties_price_idx").on(table.price),
    locationIdx: index("properties_location_idx").on(table.location),
    activeIdx: index("properties_active_idx").on(table.isActive),
    featuredIdx: index("properties_featured_idx").on(table.isFeatured),
    createdAtIdx: index("properties_created_at_idx").on(table.createdAt),
    // Composite indexes for common filtering combinations
    activeStatusIdx: index("properties_active_status_idx").on(
      table.isActive,
      table.verificationStatus
    ),
    activeFeaturedIdx: index("properties_active_featured_idx").on(
      table.isActive,
      table.isFeatured
    ),
    locationPriceIdx: index("properties_location_price_idx").on(
      table.location,
      table.price
    ),
  })
);

// Enhanced reviews table with better constraints
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
      .references(() => properties.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    rating: integer("rating").notNull(), // Will be validated in schema to be 1-5
    comment: text("comment").notNull(),
    verified: boolean("verified").default(false).notNull(),
    helpfulCount: integer("helpful_count").default(0).notNull(),
    reportCount: integer("report_count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Optimized indexes with composite patterns
    propertyIdx: index("reviews_property_idx").on(table.propertyId),
    userIdx: index("reviews_user_idx").on(table.userId),
    ratingIdx: index("reviews_rating_idx").on(table.rating),
    verifiedIdx: index("reviews_verified_idx").on(table.verified),
    activeIdx: index("reviews_active_idx").on(table.isActive),
    createdAtIdx: index("reviews_created_at_idx").on(table.createdAt),
    // Composite indexes for common queries
    propertyActiveIdx: index("reviews_property_active_idx").on(
      table.propertyId,
      table.isActive
    ),
    propertyRatingIdx: index("reviews_property_rating_idx").on(
      table.propertyId,
      table.rating
    ),
    // Unique constraint to prevent duplicate reviews
    uniqueUserPropertyIdx: uniqueIndex("reviews_user_property_unique").on(
      table.userId,
      table.propertyId
    ),
  })
);

// Optimized favorites table
export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    propertyId: integer("property_id")
      .references(() => properties.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("favorites_user_idx").on(table.userId),
    propertyIdx: index("favorites_property_idx").on(table.propertyId),
    // Unique constraint prevents duplicate favorites
    uniqueUserPropertyIdx: uniqueIndex("favorites_user_property_unique").on(
      table.userId,
      table.propertyId
    ),
  })
);

// Enhanced property views table with better tracking capabilities
export const propertyViews = pgTable(
  "property_views",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
      .references(() => properties.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ipAddress: varchar("ip_address", { length: 45 }), // IPv6 support
    userAgent: text("user_agent"),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdx: index("property_views_property_idx").on(table.propertyId),
    userIdx: index("property_views_user_idx").on(table.userId),
    viewedAtIdx: index("property_views_viewed_at_idx").on(table.viewedAt),
    // Composite index for analytics queries
    propertyDateIdx: index("property_views_property_date_idx").on(
      table.propertyId,
      table.viewedAt
    ),
  })
);

// Transaction status enum
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "cancelled",
  "failed",
] as const);

// Transaction type enum
export const transactionTypeEnum = pgEnum("transaction_type", [
  "buy",
  "sell",
  "rent",
  "lease",
] as const);

// Transactions table for property transactions
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    externalId: varchar("external_id", { length: 50 }).unique(), // For imported data
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    propertyId: integer("property_id")
      .references(() => properties.id, { onDelete: "cascade" })
      .notNull(),
    transactionType: transactionTypeEnum("transaction_type").notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    transactionDate: timestamp("transaction_date").notNull(),
    status: transactionStatusEnum("status").default("pending").notNull(),
    otherParties: json("other_parties")
      .$type<
        Array<{
          type: "agent" | "bank" | "buyer" | "seller";
          name: string;
          id: string;
        }>
      >()
      .default([])
      .notNull(),
    isSuspicious: boolean("is_suspicious").default(false).notNull(),
    fraudScore: integer("fraud_score").default(0), // 0-100 fraud risk score
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("transactions_user_idx").on(table.userId),
    propertyIdx: index("transactions_property_idx").on(table.propertyId),
    statusIdx: index("transactions_status_idx").on(table.status),
    typeIdx: index("transactions_type_idx").on(table.transactionType),
    dateIdx: index("transactions_date_idx").on(table.transactionDate),
    suspiciousIdx: index("transactions_suspicious_idx").on(table.isSuspicious),
    fraudScoreIdx: index("transactions_fraud_score_idx").on(table.fraudScore),
    externalIdIdx: index("transactions_external_id_idx").on(table.externalId),
    // Composite indexes for common queries
    userDateIdx: index("transactions_user_date_idx").on(
      table.userId,
      table.transactionDate
    ),
    propertyDateIdx: index("transactions_property_date_idx").on(
      table.propertyId,
      table.transactionDate
    ),
  })
);

// Statistics table for tracking various metrics
export const statistics = pgTable(
  "statistics",
  {
    id: serial("id").primaryKey(),
    metricType: varchar("metric_type", { length: 100 }).notNull(), // e.g., 'property_count', 'user_count', 'transaction_volume'
    metricKey: varchar("metric_key", { length: 100 }).notNull(), // e.g., 'total', 'by_city', 'by_type'
    metricValue: json("metric_value").$type<any>().notNull(), // Flexible JSON for different metric types
    periodType: varchar("period_type", { length: 20 }).default("all_time"), // 'daily', 'weekly', 'monthly', 'yearly', 'all_time'
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => ({
    metricTypeIdx: index("statistics_metric_type_idx").on(table.metricType),
    metricKeyIdx: index("statistics_metric_key_idx").on(table.metricKey),
    periodTypeIdx: index("statistics_period_type_idx").on(table.periodType),
    calculatedAtIdx: index("statistics_calculated_at_idx").on(
      table.calculatedAt
    ),
    activeIdx: index("statistics_active_idx").on(table.isActive),
    // Composite indexes for efficient queries
    typeKeyIdx: index("statistics_type_key_idx").on(
      table.metricType,
      table.metricKey
    ),
    typePeriodIdx: index("statistics_type_period_idx").on(
      table.metricType,
      table.periodType
    ),
    // Unique constraint for preventing duplicate metrics
    uniqueMetricIdx: uniqueIndex("statistics_unique_metric").on(
      table.metricType,
      table.metricKey,
      table.periodType,
      table.periodStart,
      table.periodEnd
    ),
  })
);

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
    sessionId: integer("session_id")
      .references(() => landVerificationSessions.id, { onDelete: "cascade" })
      .notNull(),
    layerId: integer("layer_id").references(() => verificationLayers.id, {
      onDelete: "cascade",
    }),
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

// Expert Profiles table
export const expertProfiles = pgTable(
  "expert_profiles",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    expertType: varchar("expert_type", { length: 50 }).notNull(), // 'surveyor', 'lawyer', 'appraiser'
    credentials: json("credentials").$type<string[]>().default([]),
    specializations: json("specializations").$type<string[]>().default([]),
    location: varchar("location", { length: 255 }).notNull(),
    contactInfo: json("contact_info")
      .$type<{
        email: string;
        phone: string;
        address?: string;
      }>()
      .notNull(),
    experience: json("experience")
      .$type<{
        yearsOfExperience: number;
        completedProjects: number;
        averageRating: number;
        certifications: string[];
      }>()
      .notNull(),
    availability: json("availability")
      .$type<{
        isAvailable: boolean;
        nextAvailableDate?: string;
        workingHours: string;
        preferredRegions: string[];
      }>()
      .notNull(),
    pricing: json("pricing")
      .$type<{
        hourlyRate?: number;
        projectRate?: number;
        currency: string;
      }>()
      .notNull(),
    verificationStatus: varchar("verification_status", { length: 20 })
      .default("pending")
      .notNull(),
    lastActiveDate: timestamp("last_active_date").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    expertTypeIdx: index("expert_profiles_expert_type_idx").on(
      table.expertType
    ),
    locationIdx: index("expert_profiles_location_idx").on(table.location),
    verificationStatusIdx: index("expert_profiles_verification_status_idx").on(
      table.verificationStatus
    ),
    lastActiveIdx: index("expert_profiles_last_active_idx").on(
      table.lastActiveDate
    ),
    // Composite indexes
    typeLocationIdx: index("expert_profiles_type_location_idx").on(
      table.expertType,
      table.location
    ),
    typeVerificationIdx: index("expert_profiles_type_verification_idx").on(
      table.expertType,
      table.verificationStatus
    ),
  })
);

// Expert Reports table
export const expertReports = pgTable(
  "expert_reports",
  {
    id: serial("id").primaryKey(),
    assignmentId: integer("assignment_id")
      .references(() => expertAssignments.id, { onDelete: "cascade" })
      .notNull(),
    expertId: integer("expert_id")
      .references(() => expertProfiles.id, { onDelete: "cascade" })
      .notNull(),
    reportType: varchar("report_type", { length: 100 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary").notNull(),
    findings: json("findings")
      .$type<
        Array<{
          id: string;
          category: string;
          severity: "low" | "medium" | "high" | "critical";
          description: string;
          evidence: string[];
          confidence: number;
          impact: string;
          location?: string;
        }>
      >()
      .default([]),
    recommendations: json("recommendations")
      .$type<
        Array<{
          id: string;
          priority: "low" | "medium" | "high";
          category: string;
          title: string;
          description: string;
          actionItems: string[];
          estimatedCost?: number;
          estimatedTime?: string;
          riskMitigation?: string;
        }>
      >()
      .default([]),
    attachments: json("attachments").$type<string[]>().default([]),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    reviewStatus: varchar("review_status", { length: 20 })
      .default("pending")
      .notNull(),
    qualityScore: integer("quality_score"),
    reviewNotes: text("review_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    assignmentIdx: index("expert_reports_assignment_idx").on(
      table.assignmentId
    ),
    expertIdx: index("expert_reports_expert_idx").on(table.expertId),
    reportTypeIdx: index("expert_reports_report_type_idx").on(table.reportType),
    reviewStatusIdx: index("expert_reports_review_status_idx").on(
      table.reviewStatus
    ),
    submittedAtIdx: index("expert_reports_submitted_at_idx").on(
      table.submittedAt
    ),
    qualityScoreIdx: index("expert_reports_quality_score_idx").on(
      table.qualityScore
    ),
    // Composite indexes
    assignmentStatusIdx: index("expert_reports_assignment_status_idx").on(
      table.assignmentId,
      table.reviewStatus
    ),
    expertTypeIdx: index("expert_reports_expert_type_idx").on(
      table.expertId,
      table.reportType
    ),
  })
);

// Property Monitoring table
export const propertyMonitoring = pgTable(
  "property_monitoring",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id")
      .references(() => properties.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: integer("session_id").references(
      () => landVerificationSessions.id,
      { onDelete: "cascade" }
    ),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    monitoringType: varchar("monitoring_type", { length: 50 }).notNull(), // 'government_changes', 'legal_disputes', 'market_changes'
    frequency: varchar("frequency", { length: 20 })
      .default("monthly")
      .notNull(), // 'daily', 'weekly', 'monthly'
    lastChecked: timestamp("last_checked"),
    nextCheck: timestamp("next_check"),
    alertsGenerated: integer("alerts_generated").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    configuration: json("configuration")
      .$type<Record<string, unknown>>()
      .default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    propertyIdx: index("property_monitoring_property_idx").on(table.propertyId),
    sessionIdx: index("property_monitoring_session_idx").on(table.sessionId),
    userIdx: index("property_monitoring_user_idx").on(table.userId),
    monitoringTypeIdx: index("property_monitoring_type_idx").on(
      table.monitoringType
    ),
    nextCheckIdx: index("property_monitoring_next_check_idx").on(
      table.nextCheck
    ),
    activeIdx: index("property_monitoring_active_idx").on(table.isActive),
    // Composite indexes
    propertyActiveIdx: index("property_monitoring_property_active_idx").on(
      table.propertyId,
      table.isActive
    ),
  })
);

// Monitoring Alerts table
export const monitoringAlerts = pgTable(
  "monitoring_alerts",
  {
    id: serial("id").primaryKey(),
    monitoringId: integer("monitoring_id")
      .references(() => propertyMonitoring.id, { onDelete: "cascade" })
      .notNull(),
    propertyId: integer("property_id")
      .references(() => properties.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    alertType: varchar("alert_type", { length: 50 }).notNull(),
    severity: riskLevelEnum("severity").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    actionRequired: boolean("action_required").default(false).notNull(),
    actionTaken: boolean("action_taken").default(false).notNull(),
    actionNotes: text("action_notes"),
    isRead: boolean("is_read").default(false).notNull(),
    isDismissed: boolean("is_dismissed").default(false).notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    monitoringIdx: index("monitoring_alerts_monitoring_idx").on(
      table.monitoringId
    ),
    propertyIdx: index("monitoring_alerts_property_idx").on(table.propertyId),
    userIdx: index("monitoring_alerts_user_idx").on(table.userId),
    alertTypeIdx: index("monitoring_alerts_alert_type_idx").on(table.alertType),
    severityIdx: index("monitoring_alerts_severity_idx").on(table.severity),
    isReadIdx: index("monitoring_alerts_is_read_idx").on(table.isRead),
    actionRequiredIdx: index("monitoring_alerts_action_required_idx").on(
      table.actionRequired
    ),
    createdAtIdx: index("monitoring_alerts_created_at_idx").on(table.createdAt),
    // Composite indexes
    userUnreadIdx: index("monitoring_alerts_user_unread_idx").on(
      table.userId,
      table.isRead
    ),
    propertyActiveIdx: index("monitoring_alerts_property_active_idx").on(
      table.propertyId,
      table.isDismissed
    ),
  })
);

// Define relationships with consistent naming and proper typing
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  reviews: many(reviews),
  favorites: many(favorites),
  propertyViews: many(propertyViews),
  transactions: many(transactions),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  reviews: many(reviews),
  favorites: many(favorites),
  views: many(propertyViews),
  transactions: many(transactions),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  property: one(properties, {
    fields: [reviews.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [favorites.propertyId],
    references: [properties.id],
  }),
}));

export const propertyViewsRelations = relations(propertyViews, ({ one }) => ({
  property: one(properties, {
    fields: [propertyViews.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [propertyViews.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [transactions.propertyId],
    references: [properties.id],
  }),
}));

// Land verification relationships
export const landVerificationSessionsRelations = relations(
  landVerificationSessions,
  ({ one, many }) => ({
    property: one(properties, {
      fields: [landVerificationSessions.propertyId],
      references: [properties.id],
    }),
    user: one(users, {
      fields: [landVerificationSessions.userId],
      references: [users.id],
    }),
    verificationLayers: many(verificationLayers),
    riskFactors: many(riskFactors),
    governmentDesignations: many(governmentDesignations),
    communityFeedback: many(communityFeedback),
    expertAssignments: many(expertAssignments),
    propertyMonitoring: many(propertyMonitoring),
  })
);

export const verificationLayersRelations = relations(
  verificationLayers,
  ({ one, many }) => ({
    session: one(landVerificationSessions, {
      fields: [verificationLayers.sessionId],
      references: [landVerificationSessions.id],
    }),
    expertAssignments: many(expertAssignments),
  })
);

export const riskFactorsRelations = relations(riskFactors, ({ one }) => ({
  session: one(landVerificationSessions, {
    fields: [riskFactors.sessionId],
    references: [landVerificationSessions.id],
  }),
}));

export const governmentDesignationsRelations = relations(
  governmentDesignations,
  ({ one }) => ({
    session: one(landVerificationSessions, {
      fields: [governmentDesignations.sessionId],
      references: [landVerificationSessions.id],
    }),
  })
);

export const communityFeedbackRelations = relations(
  communityFeedback,
  ({ one }) => ({
    session: one(landVerificationSessions, {
      fields: [communityFeedback.sessionId],
      references: [landVerificationSessions.id],
    }),
  })
);

export const expertAssignmentsRelations = relations(
  expertAssignments,
  ({ one, many }) => ({
    session: one(landVerificationSessions, {
      fields: [expertAssignments.sessionId],
      references: [landVerificationSessions.id],
    }),
    layer: one(verificationLayers, {
      fields: [expertAssignments.layerId],
      references: [verificationLayers.id],
    }),
    reports: many(expertReports),
  })
);

export const expertProfilesRelations = relations(
  expertProfiles,
  ({ many }) => ({
    reports: many(expertReports),
  })
);

export const expertReportsRelations = relations(expertReports, ({ one }) => ({
  assignment: one(expertAssignments, {
    fields: [expertReports.assignmentId],
    references: [expertAssignments.id],
  }),
  expert: one(expertProfiles, {
    fields: [expertReports.expertId],
    references: [expertProfiles.id],
  }),
}));

export const propertyMonitoringRelations = relations(
  propertyMonitoring,
  ({ one, many }) => ({
    property: one(properties, {
      fields: [propertyMonitoring.propertyId],
      references: [properties.id],
    }),
    session: one(landVerificationSessions, {
      fields: [propertyMonitoring.sessionId],
      references: [landVerificationSessions.id],
    }),
    user: one(users, {
      fields: [propertyMonitoring.userId],
      references: [users.id],
    }),
    alerts: many(monitoringAlerts),
  })
);

export const monitoringAlertsRelations = relations(
  monitoringAlerts,
  ({ one }) => ({
    monitoring: one(propertyMonitoring, {
      fields: [monitoringAlerts.monitoringId],
      references: [propertyMonitoring.id],
    }),
    property: one(properties, {
      fields: [monitoringAlerts.propertyId],
      references: [properties.id],
    }),
    user: one(users, {
      fields: [monitoringAlerts.userId],
      references: [users.id],
    }),
  })
);

// Enhanced Zod schemas with comprehensive validation
export const insertUserSchema = createInsertSchema(users, {
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password cannot exceed 255 characters"),
  firstName: z
    .string()
    .max(100, "First name cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "First name can only contain letters, spaces, apostrophes, and hyphens"
    )
    .optional(),
  lastName: z
    .string()
    .max(100, "Last name cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Last name can only contain letters, spaces, apostrophes, and hyphens"
    )
    .optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format")
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),
  trustScore: z
    .number()
    .int("Trust score must be an integer")
    .min(0, "Trust score cannot be below 0")
    .max(100, "Trust score cannot exceed 100")
    .optional(),
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters").optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
  emailVerifiedAt: true,
});

export const insertPropertySchema = createInsertSchema(properties, {
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description cannot exceed 5000 characters")
    .trim(),
  price: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0 && num <= 9999999999.99;
  }, "Price must be a positive number not exceeding $9,999,999,999.99"),
  location: z
    .string()
    .min(1, "Location is required")
    .max(255, "Location cannot exceed 255 characters")
    .trim(),
  address: z
    .string()
    .max(500, "Address cannot exceed 500 characters")
    .trim()
    .optional(),
  imageUrls: z
    .array(z.string().url("Invalid URL format"))
    .max(20, "Cannot have more than 20 images")
    .optional()
    .default([]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  favoriteCount: true,
});

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .min(1, "Comment is required")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulCount: true,
  reportCount: true,
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0 && num <= 9999999999.99;
  }, "Amount must be a positive number not exceeding $9,999,999,999.99"),
  transactionDate: z.date({ message: "Invalid transaction date" }),
  fraudScore: z
    .number()
    .int("Fraud score must be an integer")
    .min(0, "Fraud score cannot be below 0")
    .max(100, "Fraud score cannot exceed 100")
    .optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStatisticSchema = createInsertSchema(statistics, {
  metricType: z
    .string()
    .min(1, "Metric type is required")
    .max(100, "Metric type cannot exceed 100 characters"),
  metricKey: z
    .string()
    .min(1, "Metric key is required")
    .max(100, "Metric key cannot exceed 100 characters"),
  metricValue: z.any(), // Flexible for different metric types
  periodType: z
    .enum(["daily", "weekly", "monthly", "yearly", "all_time"])
    .default("all_time"),
}).omit({
  id: true,
  calculatedAt: true,
});

// Create select schemas for full entity types
export const selectUserSchema = createSelectSchema(users);
export const selectPropertySchema = createSelectSchema(properties);
export const selectReviewSchema = createSelectSchema(reviews);
export const selectTransactionSchema = createSelectSchema(transactions);
export const selectStatisticSchema = createSelectSchema(statistics);

// Enhanced validation schemas for JSON fields
export const PropertyFeaturesSchema = z
  .object({
    bedrooms: z
      .number()
      .int("Bedrooms must be an integer")
      .min(0, "Bedrooms cannot be negative")
      .max(20, "Bedrooms cannot exceed 20")
      .optional(),
    bathrooms: z
      .number()
      .min(0, "Bathrooms cannot be negative")
      .max(20, "Bathrooms cannot exceed 20")
      .optional(),
    squareFeet: z
      .number()
      .int("Square feet must be an integer")
      .min(0, "Square feet cannot be negative")
      .max(50000, "Square feet cannot exceed 50,000")
      .optional(),
    parkingSpaces: z
      .number()
      .int("Parking spaces must be an integer")
      .min(0, "Parking spaces cannot be negative")
      .max(20, "Parking spaces cannot exceed 20")
      .optional(),
    yearBuilt: z
      .number()
      .int("Year built must be an integer")
      .min(1800, "Year built cannot be before 1800")
      .max(
        new Date().getFullYear() + 5,
        "Year built cannot be more than 5 years in the future"
      )
      .optional(),
    propertyType: z.enum(PROPERTY_TYPES).optional(),
    petFriendly: z.boolean().optional(),
    furnished: z.boolean().optional(),
    amenities: z
      .array(
        z.string().max(100, "Amenity name cannot exceed 100 characters").trim()
      )
      .max(50, "Cannot have more than 50 amenities")
      .optional(),
  })
  .strict();

// Enhanced coordinates validation schema
export const CoordinatesSchema = z
  .object({
    lat: z
      .number()
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),
    lng: z
      .number()
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
  })
  .strict();

// Enhanced AI Verification Results validation schema
export const AIVerificationResultsSchema = z
  .object({
    overallScore: z
      .number()
      .min(0, "Overall score must be between 0 and 100")
      .max(100, "Overall score must be between 0 and 100")
      .optional(),
    imageAnalysis: z
      .object({
        authenticity: z
          .number()
          .min(0, "Authenticity score must be between 0 and 100")
          .max(100, "Authenticity score must be between 0 and 100"),
        quality: z
          .number()
          .min(0, "Quality score must be between 0 and 100")
          .max(100, "Quality score must be between 0 and 100"),
        flags: z.array(z.string().max(200, "Flag description too long")),
      })
      .optional(),
    textAnalysis: z
      .object({
        sentiment: z
          .number()
          .min(-1, "Sentiment must be between -1 and 1")
          .max(1, "Sentiment must be between -1 and 1"),
        credibility: z
          .number()
          .min(0, "Credibility score must be between 0 and 100")
          .max(100, "Credibility score must be between 0 and 100"),
        flags: z.array(z.string().max(200, "Flag description too long")),
      })
      .optional(),
    priceAnalysis: z
      .object({
        marketComparison: z
          .number()
          .min(0, "Market comparison score must be between 0 and 100")
          .max(100, "Market comparison score must be between 0 and 100"),
        reasonableness: z
          .number()
          .min(0, "Reasonableness score must be between 0 and 100")
          .max(100, "Reasonableness score must be between 0 and 100"),
        flags: z.array(z.string().max(200, "Flag description too long")),
      })
      .optional(),
    lastVerified: z.string().datetime("Invalid datetime format").optional(),
    verificationId: z.string().uuid("Invalid UUID format").optional(),
  })
  .strict();

// Type-safe validation helper functions with better error handling
export const validatePropertyFeatures = (
  features: unknown
): PropertyFeatures => {
  try {
    return PropertyFeaturesSchema.parse(features) as PropertyFeatures;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid property features: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
};

export const validateCoordinates = (coordinates: unknown): Coordinates => {
  try {
    return CoordinatesSchema.parse(coordinates);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid coordinates: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
};

export const validateAIVerificationResults = (
  results: unknown
): AIVerificationResults => {
  try {
    return AIVerificationResultsSchema.parse(results) as AIVerificationResults;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid AI verification results: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
};

// Export TypeScript types with better naming consistency
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertStatistic = z.infer<typeof insertStatisticSchema>;

export type User = z.infer<typeof selectUserSchema>;
export type Property = z.infer<typeof selectPropertySchema>;
export type Review = z.infer<typeof selectReviewSchema>;
export type Transaction = z.infer<typeof selectTransactionSchema>;
export type Statistic = z.infer<typeof selectStatisticSchema>;

// Enhanced utility types for common query patterns
export type UserWithStats = User & {
  propertyCount?: number;
  reviewCount?: number;
  averageRating?: number;
  totalViews?: number;
  verifiedReviewCount?: number;
};

export type PropertyWithDetails = Property & {
  owner?: User;
  reviewCount?: number;
  averageRating?: number;
  isFavorited?: boolean;
  recentViews?: number;
  isAvailable?: boolean;
};

export type ReviewWithDetails = Review & {
  user?: Pick<
    User,
    | "id"
    | "username"
    | "firstName"
    | "lastName"
    | "profileImageUrl"
    | "trustScore"
  >;
  property?: Pick<Property, "id" | "title" | "location">;
};

// Additional utility types for API responses
export type UserPublic = Omit<User, "password" | "email">;
export type PropertySummary = Pick<
  Property,
  "id" | "title" | "price" | "location" | "imageUrls" | "verificationStatus"
>;

// Constants for validation and business logic
export const VALIDATION_CONSTANTS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  DESCRIPTION_MIN_LENGTH: 10,
  COMMENT_MIN_LENGTH: 1,
  BIO_MAX_LENGTH: 1000,
  MAX_IMAGES_PER_PROPERTY: 20,
  MAX_AMENITIES_PER_PROPERTY: 50,
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_TRUST_SCORE: 0,
  MAX_TRUST_SCORE: 100,
} as const;
