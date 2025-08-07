/**
 * DEPRECATED: This file is deprecated and will be removed in a future version.
 * Please import from the consolidated database schemas instead:
 * 
 * import { users, properties, reviews } from '@server/infrastructure/database/schemas/core';
 * 
 * This file now re-exports from the new consolidated location for backward compatibility.
 */

// Re-export everything from the consolidated schemas
export * from './schema-compat';

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

// Professional specialization enum
export const professionalSpecializationEnum = pgEnum("professional_specialization", [
  "land_surveying",
  "property_law",
  "real_estate_appraisal",
  "construction_inspection",
  "environmental_assessment",
  "title_verification",
  "boundary_disputes",
  "zoning_compliance",
  "mortgage_processing",
  "property_management",
] as const);

// Extract professional specialization values for reuse in validation schemas
const PROFESSIONAL_SPECIALIZATIONS = [
  "land_surveying",
  "property_law",
  "real_estate_appraisal",
  "construction_inspection",
  "environmental_assessment",
  "title_verification",
  "boundary_disputes",
  "zoning_compliance",
  "mortgage_processing",
  "property_management",
] as const;
export type ProfessionalSpecializationValue = (typeof PROFESSIONAL_SPECIALIZATIONS)[number];

// Professional verification status enum
export const professionalVerificationStatusEnum = pgEnum("professional_verification_status", [
  "pending",
  "verified",
  "suspended",
  "rejected",
] as const);

// Professionals table - Main professional directory
export const professionals = pgTable(
  "professionals",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    businessName: varchar("business_name", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }).notNull(),
    alternatePhone: varchar("alternate_phone", { length: 20 }),
    businessAddress: text("business_address").notNull(),
    serviceAreas: json("service_areas").$type<string[]>().default([]).notNull(),
    primarySpecialization: professionalSpecializationEnum("primary_specialization").notNull(),
    secondarySpecializations: json("secondary_specializations").$type<string[]>().default([]),
    yearsOfExperience: integer("years_of_experience").notNull(),
    licenseNumber: varchar("license_number", { length: 100 }),
    licenseExpiryDate: timestamp("license_expiry_date"),
    certifications: json("certifications").$type<Array<{
      name: string;
      issuingBody: string;
      issueDate: string;
      expiryDate?: string;
      certificateNumber?: string;
    }>>().default([]),
    education: json("education").$type<Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string;
      graduationYear: number;
    }>>().default([]),
    profileImageUrl: varchar("profile_image_url", { length: 500 }),
    bio: text("bio"),
    website: varchar("website", { length: 255 }),
    socialMedia: json("social_media").$type<{
      linkedin?: string;
      twitter?: string;
      facebook?: string;
    }>().default({}),
    hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
    projectMinimum: decimal("project_minimum", { precision: 8, scale: 2 }),
    currency: varchar("currency", { length: 3 }).default("KES").notNull(),
    paymentTerms: text("payment_terms"),
    isAvailable: boolean("is_available").default(true).notNull(),
    nextAvailableDate: timestamp("next_available_date"),
    workingHours: json("working_hours").$type<{
      monday?: { start: string; end: string };
      tuesday?: { start: string; end: string };
      wednesday?: { start: string; end: string };
      thursday?: { start: string; end: string };
      friday?: { start: string; end: string };
      saturday?: { start: string; end: string };
      sunday?: { start: string; end: string };
    }>().default({}),
    emergencyAvailable: boolean("emergency_available").default(false).notNull(),
    verificationStatus: professionalVerificationStatusEnum("verification_status").default("pending").notNull(),
    verificationDocuments: json("verification_documents").$type<Array<{
      type: string;
      url: string;
      uploadedAt: string;
      verified: boolean;
    }>>().default([]),
    trustScore: integer("trust_score").default(50).notNull(),
    completedProjects: integer("completed_projects").default(0).notNull(),
    averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0.00"),
    totalReviews: integer("total_reviews").default(0).notNull(),
    responseTime: integer("response_time").default(24), // hours
    completionRate: decimal("completion_rate", { precision: 3, scale: 2 }).default("1.00"),
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("professionals_user_idx").on(table.userId),
    emailIdx: uniqueIndex("professionals_email_idx").on(table.email),
    primarySpecializationIdx: index("professionals_primary_specialization_idx").on(table.primarySpecialization),
    verificationStatusIdx: index("professionals_verification_status_idx").on(table.verificationStatus),
    isAvailableIdx: index("professionals_is_available_idx").on(table.isAvailable),
    trustScoreIdx: index("professionals_trust_score_idx").on(table.trustScore),
    averageRatingIdx: index("professionals_average_rating_idx").on(table.averageRating),
    isActiveIdx: index("professionals_is_active_idx").on(table.isActive),
    isFeaturedIdx: index("professionals_is_featured_idx").on(table.isFeatured),
    lastActiveIdx: index("professionals_last_active_idx").on(table.lastActiveAt),
    // Composite indexes for common queries
    activeVerifiedIdx: index("professionals_active_verified_idx").on(table.isActive, table.verificationStatus),
    specializationLocationIdx: index("professionals_specialization_location_idx").on(table.primarySpecialization),
    availableRatingIdx: index("professionals_available_rating_idx").on(table.isAvailable, table.averageRating),
  })
);

// Professional Reviews table
export const professionalReviews = pgTable(
  "professional_reviews",
  {
    id: serial("id").primaryKey(),
    professionalId: integer("professional_id").references(() => professionals.id, { onDelete: "cascade" }).notNull(),
    reviewerId: integer("reviewer_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    projectId: integer("project_id"), // Optional reference to specific project
    rating: integer("rating").notNull(), // 1-5 stars
    title: varchar("title", { length: 255 }),
    comment: text("comment").notNull(),
    serviceType: varchar("service_type", { length: 100 }),
    projectValue: decimal("project_value", { precision: 10, scale: 2 }),
    timelinessRating: integer("timeliness_rating"), // 1-5
    communicationRating: integer("communication_rating"), // 1-5
    qualityRating: integer("quality_rating"), // 1-5
    valueRating: integer("value_rating"), // 1-5
    wouldRecommend: boolean("would_recommend").default(true).notNull(),
    isVerifiedClient: boolean("is_verified_client").default(false).notNull(),
    helpfulCount: integer("helpful_count").default(0).notNull(),
    reportCount: integer("report_count").default(0).notNull(),
    professionalResponse: text("professional_response"),
    professionalResponseAt: timestamp("professional_response_at"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    professionalIdx: index("professional_reviews_professional_idx").on(table.professionalId),
    reviewerIdx: index("professional_reviews_reviewer_idx").on(table.reviewerId),
    ratingIdx: index("professional_reviews_rating_idx").on(table.rating),
    verifiedClientIdx: index("professional_reviews_verified_client_idx").on(table.isVerifiedClient),
    isActiveIdx: index("professional_reviews_is_active_idx").on(table.isActive),
    createdAtIdx: index("professional_reviews_created_at_idx").on(table.createdAt),
    // Composite indexes
    professionalActiveIdx: index("professional_reviews_professional_active_idx").on(table.professionalId, table.isActive),
    professionalRatingIdx: index("professional_reviews_professional_rating_idx").on(table.professionalId, table.rating),
    // Unique constraint to prevent duplicate reviews
    uniqueReviewerProfessionalIdx: uniqueIndex("professional_reviews_reviewer_professional_unique").on(
      table.reviewerId,
      table.professionalId
    ),
  })
);

// Professional Specializations junction table
export const professionalSpecializations = pgTable(
  "professional_specializations",
  {
    id: serial("id").primaryKey(),
    professionalId: integer("professional_id").references(() => professionals.id, { onDelete: "cascade" }).notNull(),
    specialization: professionalSpecializationEnum("specialization").notNull(),
    proficiencyLevel: integer("proficiency_level").default(3).notNull(), // 1-5 scale
    yearsOfExperience: integer("years_of_experience").default(0).notNull(),
    certificationRequired: boolean("certification_required").default(false).notNull(),
    certificationUrl: varchar("certification_url", { length: 500 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    professionalIdx: index("professional_specializations_professional_idx").on(table.professionalId),
    specializationIdx: index("professional_specializations_specialization_idx").on(table.specialization),
    proficiencyIdx: index("professional_specializations_proficiency_idx").on(table.proficiencyLevel),
    isActiveIdx: index("professional_specializations_is_active_idx").on(table.isActive),
    // Composite indexes
    professionalSpecializationIdx: index("professional_specializations_professional_specialization_idx").on(
      table.professionalId,
      table.specialization
    ),
    // Unique constraint
    uniqueProfessionalSpecializationIdx: uniqueIndex("professional_specializations_unique").on(
      table.professionalId,
      table.specialization
    ),
  })
);

// Professional Certifications table
export const professionalCertifications = pgTable(
  "professional_certifications",
  {
    id: serial("id").primaryKey(),
    professionalId: integer("professional_id").references(() => professionals.id, { onDelete: "cascade" }).notNull(),
    certificationName: varchar("certification_name", { length: 255 }).notNull(),
    issuingOrganization: varchar("issuing_organization", { length: 255 }).notNull(),
    certificateNumber: varchar("certificate_number", { length: 100 }),
    issueDate: timestamp("issue_date").notNull(),
    expiryDate: timestamp("expiry_date"),
    isLifetime: boolean("is_lifetime").default(false).notNull(),
    verificationUrl: varchar("verification_url", { length: 500 }),
    documentUrl: varchar("document_url", { length: 500 }),
    isVerified: boolean("is_verified").default(false).notNull(),
    verifiedBy: varchar("verified_by", { length: 255 }),
    verifiedAt: timestamp("verified_at"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    professionalIdx: index("professional_certifications_professional_idx").on(table.professionalId),
    issuingOrgIdx: index("professional_certifications_issuing_org_idx").on(table.issuingOrganization),
    isVerifiedIdx: index("professional_certifications_is_verified_idx").on(table.isVerified),
    expiryDateIdx: index("professional_certifications_expiry_date_idx").on(table.expiryDate),
    isActiveIdx: index("professional_certifications_is_active_idx").on(table.isActive),
    // Composite indexes
    professionalVerifiedIdx: index("professional_certifications_professional_verified_idx").on(
      table.professionalId,
      table.isVerified
    ),
  })
);

// Expert Profiles table (keeping existing for backward compatibility)
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
  professionalProfile: many(professionals),
  professionalReviews: many(professionalReviews),
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

// Fraud Intelligence Tables
export const fraudAlerts = pgTable(
  "fraud_alerts",
  {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
    type: varchar("type", { length: 50 }).notNull(), // 'active_threat', 'pattern_detected', 'area_warning'
    severity: varchar("severity", { length: 20 }).notNull(), // 'high', 'medium', 'low'
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    location: varchar("location", { length: 100 }).notNull(),
    affectedCount: integer("affected_count").notNull().default(0),
    timeDetected: timestamp("time_detected").notNull().defaultNow(),
    status: varchar("status", { length: 20 }).notNull().default('active'), // 'active', 'resolved', 'investigating'
    evidence: text("evidence"), // JSON array of evidence
    recommendations: text("recommendations"), // JSON array of recommendations
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    typeIdx: index("fraud_alerts_type_idx").on(table.type),
    severityIdx: index("fraud_alerts_severity_idx").on(table.severity),
    locationIdx: index("fraud_alerts_location_idx").on(table.location),
    statusIdx: index("fraud_alerts_status_idx").on(table.status),
    timeIdx: index("fraud_alerts_time_idx").on(table.timeDetected),
  })
);

export const fraudTrends = pgTable(
  "fraud_trends",
  {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
    fraudType: varchar("fraud_type", { length: 50 }).notNull(),
    location: varchar("location", { length: 100 }).notNull(),
    period: varchar("period", { length: 20 }).notNull(), // 'week', 'month', 'quarter', 'year'
    caseCount: integer("case_count").notNull().default(0),
    averageAmount: decimal("average_amount", { precision: 15, scale: 2 }),
    changePercentage: decimal("change_percentage", { precision: 5, scale: 2 }),
    calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  },
  (table) => ({
    typeIdx: index("fraud_trends_type_idx").on(table.fraudType),
    locationIdx: index("fraud_trends_location_idx").on(table.location),
    periodIdx: index("fraud_trends_period_idx").on(table.period),
    calculatedIdx: index("fraud_trends_calculated_idx").on(table.calculatedAt),
  })
);

export const fraudSubscriptions = pgTable(
  "fraud_subscriptions",
  {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    locations: text("locations").notNull(), // JSON array
    alertTypes: text("alert_types").notNull(), // JSON array
    severity: text("severity").notNull(), // JSON array
    notificationMethods: text("notification_methods").notNull(), // JSON array
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("fraud_subscriptions_user_idx").on(table.userId),
    activeIdx: index("fraud_subscriptions_active_idx").on(table.active),
  })
);

// Community Resources Tables
export const communityExperiences = pgTable(
  "community_experiences",
  {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
    title: varchar("title", { length: 200 }).notNull(),
    location: varchar("location", { length: 100 }).notNull(),
    fraudType: varchar("fraud_type", { length: 50 }).notNull(),
    amountLost: varchar("amount_lost", { length: 50 }),
    whatHappened: text("what_happened").notNull(),
    personalVulnerabilities: text("personal_vulnerabilities"),
    systemicChallenges: text("systemic_challenges"),
    lessonsLearned: text("lessons_learned"),
    resolutionStatus: varchar("resolution_status", { length: 20 }).notNull(), // 'resolved', 'partial', 'unresolved'
    resolutionDetails: text("resolution_details"),
    anonymous: boolean("anonymous").notNull().default(false),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    datePosted: timestamp("date_posted").notNull().defaultNow(),
    likes: integer("likes").notNull().default(0),
    comments: integer("comments").notNull().default(0),
    views: integer("views").notNull().default(0),
    helpful: integer("helpful").notNull().default(0),
    tags: text("tags"), // JSON array
    status: varchar("status", { length: 20 }).notNull().default('active'), // 'active', 'hidden', 'removed'
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("community_experiences_user_idx").on(table.userId),
    fraudTypeIdx: index("community_experiences_fraud_type_idx").on(table.fraudType),
    locationIdx: index("community_experiences_location_idx").on(table.location),
    resolutionIdx: index("community_experiences_resolution_idx").on(table.resolutionStatus),
    dateIdx: index("community_experiences_date_idx").on(table.datePosted),
    statusIdx: index("community_experiences_status_idx").on(table.status),
  })
);

export const experienceComments = pgTable(
  "experience_comments",
  {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
    experienceId: varchar("experience_id", { length: 255 }).notNull().references(() => communityExperiences.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    anonymous: boolean("anonymous").notNull().default(false),
    likes: integer("likes").notNull().default(0),
    status: varchar("status", { length: 20 }).notNull().default('active'), // 'active', 'hidden', 'removed'
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    experienceIdx: index("experience_comments_experience_idx").on(table.experienceId),
    userIdx: index("experience_comments_user_idx").on(table.userId),
    createdIdx: index("experience_comments_created_idx").on(table.createdAt),
    statusIdx: index("experience_comments_status_idx").on(table.status),
  })
);

export const experienceInteractions = pgTable(
  "experience_interactions",
  {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    experienceId: varchar("experience_id", { length: 255 }).notNull().references(() => communityExperiences.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // 'like', 'helpful'
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userExperienceIdx: index("experience_interactions_user_experience_idx").on(table.userId, table.experienceId),
    typeIdx: index("experience_interactions_type_idx").on(table.type),
    uniqueInteraction: uniqueIndex("unique_user_experience_interaction").on(table.userId, table.experienceId, table.type),
  })
);

export const contentReports = pgTable(
  "content_reports",
  {
    id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
    contentId: varchar("content_id", { length: 255 }).notNull(),
    contentType: varchar("content_type", { length: 20 }).notNull(), // 'experience', 'comment'
    reason: varchar("reason", { length: 50 }).notNull(),
    details: text("details"),
    reporterId: integer("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'reviewed', 'resolved', 'dismissed'
    reviewedBy: integer("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (table) => ({
    contentIdx: index("content_reports_content_idx").on(table.contentId, table.contentType),
    reporterIdx: index("content_reports_reporter_idx").on(table.reporterId),
    statusIdx: index("content_reports_status_idx").on(table.status),
    timestampIdx: index("content_reports_timestamp_idx").on(table.timestamp),
  })
);

// Analytics tables for event tracking and metrics collection
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    eventName: varchar("event_name", { length: 200 }).notNull(),
    userId: integer("user_id"),
    sessionId: varchar("session_id", { length: 100 }),
    propertyId: integer("property_id"),
    professionalId: integer("professional_id"),
    eventData: json("event_data"),
    metadata: json("metadata"),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 45 }),
    referrer: text("referrer"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    eventTypeIdx: index("analytics_events_event_type_idx").on(table.eventType),
    userIdx: index("analytics_events_user_idx").on(table.userId),
    sessionIdx: index("analytics_events_session_idx").on(table.sessionId),
    propertyIdx: index("analytics_events_property_idx").on(table.propertyId),
    timestampIdx: index("analytics_events_timestamp_idx").on(table.timestamp),
    eventNameIdx: index("analytics_events_event_name_idx").on(table.eventName),
  })
);

export const analyticsMetrics = pgTable(
  "analytics_metrics",
  {
    id: serial("id").primaryKey(),
    metricName: varchar("metric_name", { length: 200 }).notNull(),
    metricType: varchar("metric_type", { length: 50 }).notNull(), // counter, gauge, histogram
    value: decimal("value", { precision: 15, scale: 4 }).notNull(),
    dimensions: json("dimensions"), // key-value pairs for grouping
    tags: json("tags"), // additional metadata
    aggregationPeriod: varchar("aggregation_period", { length: 20 }), // hourly, daily, weekly, monthly
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    metricNameIdx: index("analytics_metrics_metric_name_idx").on(table.metricName),
    metricTypeIdx: index("analytics_metrics_metric_type_idx").on(table.metricType),
    periodIdx: index("analytics_metrics_period_idx").on(table.periodStart, table.periodEnd),
    aggregationIdx: index("analytics_metrics_aggregation_idx").on(table.aggregationPeriod),
    dimensionsIdx: index("analytics_metrics_dimensions_idx").using("gin", table.dimensions),
  })
);

export const performanceMetrics = pgTable(
  "performance_metrics",
  {
    id: serial("id").primaryKey(),
    metricType: varchar("metric_type", { length: 50 }).notNull(), // page_load, api_response, bundle_size
    metricName: varchar("metric_name", { length: 200 }).notNull(),
    value: decimal("value", { precision: 10, scale: 3 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull(), // ms, bytes, score
    url: text("url"),
    userAgent: text("user_agent"),
    userId: integer("user_id"),
    sessionId: varchar("session_id", { length: 100 }),
    deviceType: varchar("device_type", { length: 20 }), // desktop, mobile, tablet
    connectionType: varchar("connection_type", { length: 20 }), // 4g, wifi, slow-2g
    additionalData: json("additional_data"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    metricTypeIdx: index("performance_metrics_metric_type_idx").on(table.metricType),
    metricNameIdx: index("performance_metrics_metric_name_idx").on(table.metricName),
    userIdx: index("performance_metrics_user_idx").on(table.userId),
    timestampIdx: index("performance_metrics_timestamp_idx").on(table.timestamp),
    urlIdx: index("performance_metrics_url_idx").on(table.url),
  })
);

// Relations for new tables
export const fraudAlertsRelations = relations(fraudAlerts, ({ many }) => ({
  subscriptions: many(fraudSubscriptions),
}));

export const fraudSubscriptionsRelations = relations(fraudSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [fraudSubscriptions.userId],
    references: [users.id],
  }),
}));

export const communityExperiencesRelations = relations(communityExperiences, ({ one, many }) => ({
  user: one(users, {
    fields: [communityExperiences.userId],
    references: [users.id],
  }),
  comments: many(experienceComments),
  interactions: many(experienceInteractions),
}));

export const experienceCommentsRelations = relations(experienceComments, ({ one }) => ({
  experience: one(communityExperiences, {
    fields: [experienceComments.experienceId],
    references: [communityExperiences.id],
  }),
  user: one(users, {
    fields: [experienceComments.userId],
    references: [users.id],
  }),
}));

export const experienceInteractionsRelations = relations(experienceInteractions, ({ one }) => ({
  user: one(users, {
    fields: [experienceInteractions.userId],
    references: [users.id],
  }),
  experience: one(communityExperiences, {
    fields: [experienceInteractions.experienceId],
    references: [communityExperiences.id],
  }),
}));

export const contentReportsRelations = relations(contentReports, ({ one }) => ({
  reporter: one(users, {
    fields: [contentReports.reporterId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [contentReports.reviewedBy],
    references: [users.id],
  }),
}));

// Professional Directory Relations
export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  user: one(users, {
    fields: [professionals.userId],
    references: [users.id],
  }),
  reviews: many(professionalReviews),
  specializations: many(professionalSpecializations),
  certifications: many(professionalCertifications),
}));

export const professionalReviewsRelations = relations(professionalReviews, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalReviews.professionalId],
    references: [professionals.id],
  }),
  reviewer: one(users, {
    fields: [professionalReviews.reviewerId],
    references: [users.id],
  }),
}));

export const professionalSpecializationsRelations = relations(professionalSpecializations, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalSpecializations.professionalId],
    references: [professionals.id],
  }),
}));

export const professionalCertificationsRelations = relations(professionalCertifications, ({ one }) => ({
  professional: one(professionals, {
    fields: [professionalCertifications.professionalId],
    references: [professionals.id],
  }),
}));

// Analytics relations
export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [analyticsEvents.propertyId],
    references: [properties.id],
  }),
  professional: one(professionals, {
    fields: [analyticsEvents.professionalId],
    references: [professionals.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  user: one(users, {
    fields: [performanceMetrics.userId],
    references: [users.id],
  }),
}));

// Communication and Messaging System Tables

// Message threads table - manages conversation threads between users
export const messageThreads = pgTable(
  "message_threads",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 200 }),
    participants: json("participants").$type<number[]>().notNull(), // Array of user IDs
    threadType: varchar("thread_type", { length: 50 }).default("direct").notNull(), // direct, group, support
    isActive: boolean("is_active").default(true).notNull(),
    lastMessageAt: timestamp("last_message_at"),
    lastMessageId: integer("last_message_id"),
    metadata: json("metadata").$type<{
      propertyId?: number;
      professionalId?: number;
      verificationSessionId?: string;
      tags?: string[];
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    participantsIdx: index("message_threads_participants_idx").using("gin", table.participants),
    threadTypeIdx: index("message_threads_thread_type_idx").on(table.threadType),
    isActiveIdx: index("message_threads_is_active_idx").on(table.isActive),
    lastMessageIdx: index("message_threads_last_message_idx").on(table.lastMessageAt),
    metadataIdx: index("message_threads_metadata_idx").using("gin", table.metadata),
  })
);

// Messages table - stores individual messages within threads
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    threadId: integer("thread_id").notNull().references(() => messageThreads.id, { onDelete: "cascade" }),
    senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    messageType: varchar("message_type", { length: 50 }).default("text").notNull(), // text, image, file, system
    attachments: json("attachments").$type<{
      id: string;
      name: string;
      type: string;
      size: number;
      url: string;
    }[]>(),
    replyToId: integer("reply_to_id").references(() => messages.id),
    isEdited: boolean("is_edited").default(false).notNull(),
    editedAt: timestamp("edited_at"),
    deliveryStatus: varchar("delivery_status", { length: 20 }).default("sent").notNull(), // sent, delivered, read
    readBy: json("read_by").$type<{
      userId: number;
      readAt: string;
    }[]>().default([]),
    metadata: json("metadata").$type<{
      mentions?: number[];
      reactions?: { emoji: string; users: number[] }[];
      priority?: "low" | "normal" | "high" | "urgent";
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    threadIdx: index("messages_thread_idx").on(table.threadId),
    senderIdx: index("messages_sender_idx").on(table.senderId),
    messageTypeIdx: index("messages_message_type_idx").on(table.messageType),
    deliveryStatusIdx: index("messages_delivery_status_idx").on(table.deliveryStatus),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
    replyToIdx: index("messages_reply_to_idx").on(table.replyToId),
    readByIdx: index("messages_read_by_idx").using("gin", table.readBy),
    // Composite indexes for common queries
    threadCreatedIdx: index("messages_thread_created_idx").on(table.threadId, table.createdAt),
    senderThreadIdx: index("messages_sender_thread_idx").on(table.senderId, table.threadId),
  })
);

// Notifications table - manages all types of notifications
export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // message, property_update, verification_complete, etc.
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    actionUrl: varchar("action_url", { length: 500 }),
    channels: json("channels").$type<{
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      inApp?: boolean;
    }>().default({ inApp: true }),
    priority: varchar("priority", { length: 20 }).default("normal").notNull(), // low, normal, high, urgent
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at"),
    deliveryStatus: json("delivery_status").$type<{
      email?: "pending" | "sent" | "delivered" | "failed";
      sms?: "pending" | "sent" | "delivered" | "failed";
      push?: "pending" | "sent" | "delivered" | "failed";
      inApp?: "pending" | "sent" | "delivered" | "failed";
    }>(),
    metadata: json("metadata").$type<{
      messageId?: number;
      propertyId?: number;
      professionalId?: number;
      verificationSessionId?: string;
      relatedUserId?: number;
    }>(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("notifications_user_idx").on(table.userId),
    typeIdx: index("notifications_type_idx").on(table.type),
    priorityIdx: index("notifications_priority_idx").on(table.priority),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    expiresAtIdx: index("notifications_expires_at_idx").on(table.expiresAt),
    channelsIdx: index("notifications_channels_idx").using("gin", table.channels),
    metadataIdx: index("notifications_metadata_idx").using("gin", table.metadata),
    // Composite indexes for common queries
    userUnreadIdx: index("notifications_user_unread_idx").on(table.userId, table.isRead),
    userTypeIdx: index("notifications_user_type_idx").on(table.userId, table.type),
    priorityCreatedIdx: index("notifications_priority_created_idx").on(table.priority, table.createdAt),
  })
);

// User notification preferences table
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    notificationType: varchar("notification_type", { length: 50 }).notNull(),
    channels: json("channels").$type<{
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      inApp?: boolean;
    }>().default({ inApp: true }),
    frequency: varchar("frequency", { length: 20 }).default("immediate").notNull(), // immediate, hourly, daily, weekly, never
    quietHours: json("quiet_hours").$type<{
      enabled: boolean;
      startTime: string; // HH:MM format
      endTime: string; // HH:MM format
      timezone: string;
    }>(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("notification_preferences_user_idx").on(table.userId),
    typeIdx: index("notification_preferences_type_idx").on(table.notificationType),
    isActiveIdx: index("notification_preferences_is_active_idx").on(table.isActive),
    // Unique constraint to prevent duplicate preferences
    userTypeUnique: uniqueIndex("notification_preferences_user_type_unique").on(
      table.userId,
      table.notificationType
    ),
  })
);

// Communication Relations
export const messageThreadsRelations = relations(messageThreads, ({ many, one }) => ({
  messages: many(messages),
  lastMessage: one(messages, {
    fields: [messageThreads.lastMessageId],
    references: [messages.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  thread: one(messageThreads, {
    fields: [messages.threadId],
    references: [messageThreads.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
  }),
  replies: many(messages),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Communication TypeScript types
export type MessageThread = typeof messageThreads.$inferSelect;
export type InsertMessageThread = typeof messageThreads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

// Communication validation schemas
export const insertMessageThreadSchema = createInsertSchema(messageThreads, {
  title: z.string().min(1).max(200).optional(),
  participants: z.array(z.number().positive()).min(2).max(50),
  threadType: z.enum(["direct", "group", "support"]).default("direct"),
});

export const insertMessageSchema = createInsertSchema(messages, {
  content: z.string().min(1).max(10000),
  messageType: z.enum(["text", "image", "file", "system"]).default("text"),
  deliveryStatus: z.enum(["sent", "delivered", "read"]).default("sent"),
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  type: z.string().min(1).max(50),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences, {
  notificationType: z.string().min(1).max(50),
  frequency: z.enum(["immediate", "hourly", "daily", "weekly", "never"]).default("immediate"),
});

// Communication constants
export const COMMUNICATION_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 10000,
  MAX_THREAD_PARTICIPANTS: 50,
  MAX_ATTACHMENTS_PER_MESSAGE: 10,
  MAX_ATTACHMENT_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_ATTACHMENT_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  NOTIFICATION_TYPES: {
    MESSAGE: 'message',
    PROPERTY_UPDATE: 'property_update',
    VERIFICATION_COMPLETE: 'verification_complete',
    REVIEW_RECEIVED: 'review_received',
    PROFESSIONAL_ASSIGNED: 'professional_assigned',
    FRAUD_ALERT: 'fraud_alert',
    SYSTEM_ANNOUNCEMENT: 'system_announcement',
  },
  MESSAGE_DELIVERY_STATUS: {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read',
  },
  NOTIFICATION_PRIORITIES: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
  },
} as const;