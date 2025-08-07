/**
 * Core Database Schema
 * 
 * Consolidated database schema definitions for the TripleCheck system.
 * This file contains all core table definitions, enums, and types.
 */

import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
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

// Enhanced Zod schemas with comprehensive validation
export const insertUserSchema = createInsertSchema(users, {
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password cannot exceed 255 characters"),
  trustScore: z
    .number()
    .int("Trust score must be a whole number")
    .min(0, "Trust score cannot be negative")
    .max(100, "Trust score cannot exceed 100"),
  firstName: z
    .string()
    .max(100, "First name cannot exceed 100 characters")
    .optional(),
  lastName: z
    .string()
    .max(100, "Last name cannot exceed 100 characters")
    .optional(),
  phone: z
    .string()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional(),
  bio: z
    .string()
    .max(1000, "Bio cannot exceed 1000 characters")
    .optional(),
});

export const insertPropertySchema = createInsertSchema(properties, {
  title: z
    .string()
    .min(5, "Property title must be at least 5 characters")
    .max(255, "Property title cannot exceed 255 characters"),
  description: z
    .string()
    .min(20, "Property description must be at least 20 characters")
    .max(5000, "Property description cannot exceed 5000 characters"),
  price: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Price must be a positive number"),
  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(255, "Location cannot exceed 255 characters"),
  address: z
    .string()
    .max(500, "Address cannot exceed 500 characters")
    .optional(),
});

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .min(10, "Review comment must be at least 10 characters")
    .max(2000, "Review comment cannot exceed 2000 characters"),
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  transactionDate: z
    .date()
    .max(new Date(), "Transaction date cannot be in the future"),
  fraudScore: z
    .number()
    .int("Fraud score must be a whole number")
    .min(0, "Fraud score cannot be negative")
    .max(100, "Fraud score cannot exceed 100"),
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
  periodType: z
    .enum(["daily", "weekly", "monthly", "yearly", "all_time"])
    .default("all_time"),
});

// Create select schemas for full entity types
export const selectUserSchema = createSelectSchema(users);
export const selectPropertySchema = createSelectSchema(properties);
export const selectReviewSchema = createSelectSchema(reviews);
export const selectTransactionSchema = createSelectSchema(transactions);
export const selectStatisticSchema = createSelectSchema(statistics);

// Export types for use throughout the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Statistic = typeof statistics.$inferSelect;
export type NewStatistic = typeof statistics.$inferInsert;