/**
 * Core Database Schemas
 * 
 * PROVENANCE:
 * - Initial design focused on property listing and user management
 * - Trust scoring system added in v2 based on community feedback patterns
 * - Known limitation: trustScore assumes linear progression; in practice,
 *   trust building is non-linear and context-dependent
 * 
 * TRADE-OFFS:
 * - Chose property-level foreign keys for direct integration with listing workflow
 * - Used serial IDs for simplicity; UUID migration considered for future distributed needs
 * - Geolocation stored as coordinates only; no spatial indexing yet due to PostGIS dependency
 */

import { relations, sql } from "drizzle-orm";
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
  check,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Centralized helpers for consistent schema patterns
import { checkConstraints } from "../helpers";

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
    // Partial index for active users only (optimizes common queries)
    activeUsersIdx: index("users_active_partial_idx").on(table.trustScore, table.createdAt)
      .where(sql`${table.isActive} = true`),
    // Check constraints for data integrity
    check(
      "users_trust_score_range_check",
      checkConstraints.percentage(table.trustScore, "trust_score")
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
    // Partial index for active properties only (optimizes listing queries)
    activePropertiesIdx: index("properties_active_partial_idx").on(table.price, table.createdAt.desc())
      .where(sql`${table.isActive} = true`),
    // Check constraints for data integrity
    check(
      "properties_price_positive_check",
      checkConstraints.positive(table.price, "price")
    ),
    check(
      "properties_date_range_check",
      checkConstraints.dateAfter(table.availableFrom, table.availableUntil, "date_range")
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
    // Partial index for active verified reviews only
    activeVerifiedReviewsIdx: index("reviews_active_verified_partial_idx").on(table.rating, table.createdAt.desc())
      .where(sql`${table.isActive} = true AND ${table.verified} = true`),
    // Unique constraint to prevent duplicate reviews
    uniqueUserPropertyIdx: uniqueIndex("reviews_user_property_unique").on(
      table.userId,
      table.propertyId
    ),
    // Check constraints for data integrity
    ratingRangeCheck: check(
      "reviews_rating_range_check",
      checkConstraints.range(table.rating, 1, 5, "rating")
    ),
    nonNegativeCountsCheck: check(
      "reviews_non_negative_counts_check",
      sql`${table.helpfulCount} >= 0 AND ${table.reportCount} >= 0`
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
    // Partial index for recent views only (optimizes analytics)
    recentViewsIdx: index("property_views_recent_partial_idx").on(table.viewedAt.desc())
      .where(sql`${table.viewedAt} > NOW() - INTERVAL '30 days'`),
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
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  reviews: many(reviews),
  favorites: many(favorites),
  views: many(propertyViews),
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

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email(),
  username: (schema) => schema.min(3).max(50),
  trustScore: (schema) => schema.min(0).max(100),
});

export const selectUserSchema = createSelectSchema(users);

export const insertPropertySchema = createInsertSchema(properties, {
  title: (schema) => schema.min(1).max(255),
  description: (schema) => schema.min(1),
  price: (schema) => schema.regex(/^\d+(\.\d{1,2})?$/),
  location: (schema) => schema.min(1).max(255),
});

export const selectPropertySchema = createSelectSchema(properties);

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: (schema) => schema.min(1).max(5),
  comment: (schema) => schema.min(1),
});

export const selectReviewSchema = createSelectSchema(reviews);

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
    // Partial index for pending transactions (optimizes workflow queries)
    pendingTransactionsIdx: index("transactions_pending_partial_idx").on(table.transactionDate.desc())
      .where(sql`${table.status} = 'pending'`),
    // Partial index for suspicious transactions (optimizes fraud detection)
    suspiciousTransactionsIdx: index("transactions_suspicious_partial_idx").on(table.fraudScore.desc(), table.transactionDate.desc())
      .where(sql`${table.isSuspicious} = true`),
    // Check constraints for data integrity
    amountPositiveCheck: check(
      "transactions_amount_positive_check",
      checkConstraints.positive(table.amount, "amount")
    ),
    fraudScoreRangeCheck: check(
      "transactions_fraud_score_range_check",
      checkConstraints.percentage(table.fraudScore, "fraud_score")
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
    // Partial index for active statistics only
    activeStatisticsIdx: index("statistics_active_partial_idx").on(table.calculatedAt.desc())
      .where(sql`${table.isActive} = true`),
    // Unique constraint for preventing duplicate metrics
    uniqueMetricIdx: uniqueIndex("statistics_unique_metric").on(
      table.metricType,
      table.metricKey,
      table.periodType,
      table.periodStart,
      table.periodEnd
    ),
    // Check constraints for data integrity
    periodOrderCheck: check(
      "statistics_period_order_check",
      checkConstraints.dateAfter(table.periodStart, table.periodEnd, "period_order")
    ),
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
    availability: json("availability").$type<{
      monday?: { start: string; end: string };
      tuesday?: { start: string; end: string };
      wednesday?: { start: string; end: string };
      thursday?: { start: string; end: string };
      friday?: { start: string; end: string };
      saturday?: { start: string; end: string };
      sunday?: { start: string; end: string };
    }>().default({}),
    verificationStatus: professionalVerificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),
    verificationDocuments: json("verification_documents").$type<string[]>().default([]),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"), // 0.00-5.00
    reviewCount: integer("review_count").default(0).notNull(),
    completedProjects: integer("completed_projects").default(0).notNull(),
    responseTime: integer("response_time").default(24), // in hours
    isActive: boolean("is_active").default(true).notNull(),
    isAvailable: boolean("is_available").default(true).notNull(),
    lastActiveAt: timestamp("last_active_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("professionals_user_idx").on(table.userId),
    emailIdx: uniqueIndex("professionals_email_idx").on(table.email),
    specializationIdx: index("professionals_specialization_idx").on(table.primarySpecialization),
    verificationStatusIdx: index("professionals_verification_status_idx").on(table.verificationStatus),
    ratingIdx: index("professionals_rating_idx").on(table.rating),
    activeIdx: index("professionals_active_idx").on(table.isActive),
    availableIdx: index("professionals_available_idx").on(table.isAvailable),
    serviceAreasIdx: index("professionals_service_areas_idx").using("gin", table.serviceAreas),
    // Composite indexes for common queries
    activeVerifiedIdx: index("professionals_active_verified_idx").on(
      table.isActive,
      table.verificationStatus
    ),
    specializationRatingIdx: index("professionals_specialization_rating_idx").on(
      table.primarySpecialization,
      table.rating
    ),
    // Partial index for active available professionals (optimizes search queries)
    activeAvailableIdx: index("professionals_active_available_partial_idx").on(table.rating.desc(), table.responseTime)
      .where(sql`${table.isActive} = true AND ${table.isAvailable} = true`),
    // Check constraints for data integrity
    ratingRangeCheck: check(
      "professionals_rating_range_check",
      checkConstraints.range(table.rating, 0, 5, "rating")
    ),
    experienceNonNegativeCheck: check(
      "professionals_experience_non_negative_check",
      checkConstraints.nonNegative(table.yearsOfExperience, "experience")
    ),
    responseTimePositiveCheck: check(
      "professionals_response_time_positive_check",
      checkConstraints.positive(table.responseTime, "response_time")
    ),
  })
);

// Define relationships for new tables
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

export const professionalsRelations = relations(professionals, ({ one }) => ({
  user: one(users, {
    fields: [professionals.userId],
    references: [users.id],
  }),
}));

// Zod schemas for new tables
export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: (schema) => schema.regex(/^\d+(\.\d{1,2})?$/),
  fraudScore: (schema) => schema.min(0).max(100),
});

export const selectTransactionSchema = createSelectSchema(transactions);

export const insertProfessionalSchema = createInsertSchema(professionals, {
  email: (schema) => schema.email(),
  yearsOfExperience: (schema) => schema.min(0),
  hourlyRate: (schema) => schema.regex(/^\d+(\.\d{1,2})?$/).optional(),
  projectMinimum: (schema) => schema.regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export const selectProfessionalSchema = createSelectSchema(professionals);

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

export type PropertyView = typeof propertyViews.$inferSelect;
export type NewPropertyView = typeof propertyViews.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Statistic = typeof statistics.$inferSelect;
export type NewStatistic = typeof statistics.$inferInsert;

export type Professional = typeof professionals.$inferSelect;
export type NewProfessional = typeof professionals.$inferInsert;

// Domain-specific type aliases for common queries
export type ActiveProperty = Property & {
  isActive: true;
};

export type ActiveUser = User & {
  isActive: true;
};

export type VerifiedProfessional = Professional & {
  verificationStatus: "verified";
  isActive: true;
};