/**
 * Core Database Schemas
 * 
 * Contains the main entities: users, properties, reviews, favorites, etc.
 * This is moved from src/shared/schema.ts to the consolidated database directory.
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

// Define relationships with consistent naming and proper typing
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  reviews: many(reviews),
  favorites: many(favorites),
  propertyViews: many(propertyViews),
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
  email: z.string().email(),
  username: z.string().min(3).max(50),
  trustScore: z.number().min(0).max(100),
});

export const selectUserSchema = createSelectSchema(users);

export const insertPropertySchema = createInsertSchema(properties, {
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  location: z.string().min(1).max(255),
});

export const selectPropertySchema = createSelectSchema(properties);

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
});

export const selectReviewSchema = createSelectSchema(reviews);