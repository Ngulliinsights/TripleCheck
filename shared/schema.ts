import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced enum-like constants for better type safety
export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
} as const;

export type VerificationStatus = typeof VERIFICATION_STATUS[keyof typeof VERIFICATION_STATUS];

// Users table - enhanced with better constraints
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  trustScore: integer("trust_score").notNull().default(0),
  isVerifiedAgent: boolean("is_verified_agent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Properties table - with refined structure
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  price: integer("price").notNull(),
  imageUrls: text("image_urls").array().notNull(),
  features: json("features").notNull().$type<PropertyFeatures>(), // Enhanced type casting
  verificationStatus: text("verification_status").notNull().default(VERIFICATION_STATUS.PENDING),
  aiVerificationResults: json("ai_verification_results").$type<AIVerificationResults>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Reviews table - with rating constraints
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Enhanced feature types with better validation
export const PropertyFeaturesSchema = z.object({
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().min(0).max(20),
  squareFeet: z.number().int().min(1).max(100000),
  parkingSpaces: z.number().int().min(0).max(20),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5),
  amenities: z.array(z.string().trim().min(1)).default([]),
  propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'studio']).optional(),
  petFriendly: z.boolean().default(false),
  furnished: z.boolean().default(false)
});

export type PropertyFeatures = z.infer<typeof PropertyFeaturesSchema>;

// AI Verification Results type for better structure
export const AIVerificationResultsSchema = z.object({
  imageAnalysis: z.object({
    qualityScore: z.number().min(0).max(100),
    authenticityScore: z.number().min(0).max(100),
    flaggedIssues: z.array(z.string()).default([])
  }).optional(),
  descriptionAnalysis: z.object({
    accuracyScore: z.number().min(0).max(100),
    completenessScore: z.number().min(0).max(100),
    suggestedImprovements: z.array(z.string()).default([])
  }).optional(),
  overallScore: z.number().min(0).max(100),
  verificationTimestamp: z.string().datetime(),
  aiModel: z.string().optional()
});

export type AIVerificationResults = z.infer<typeof AIVerificationResultsSchema>;

// Enhanced insert schemas with better validation
export const insertUserSchema = createInsertSchema(users, {
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  trustScore: z.number().int().min(0).max(1000).default(0),
  isVerifiedAgent: z.boolean().default(false)
}).pick({
  username: true,
  password: true
});

export const insertPropertySchema = createInsertSchema(properties, {
  title: z.string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must be less than 2000 characters"),
  location: z.string()
    .min(5, "Location must be at least 5 characters")
    .max(100, "Location must be less than 100 characters"),
  price: z.number().int().min(1, "Price must be greater than 0"),
  imageUrls: z.array(z.string().url("Must be a valid URL")).min(1, "At least one image is required"),
  features: PropertyFeaturesSchema,
  verificationStatus: z.enum([VERIFICATION_STATUS.PENDING, VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED])
    .default(VERIFICATION_STATUS.PENDING)
}).pick({
  ownerId: true,
  title: true,
  description: true,
  location: true,
  price: true,
  imageUrls: true,
  features: true
});

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z.string()
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment must be less than 1000 characters")
}).pick({
  propertyId: true,
  userId: true,
  rating: true,
  comment: true
});

// Enhanced select schemas for complete type safety
export const selectUserSchema = createSelectSchema(users);
export const selectPropertySchema = createSelectSchema(properties);
export const selectReviewSchema = createSelectSchema(reviews);

// Refined type exports with better inference
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type SelectProperty = z.infer<typeof selectPropertySchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type SelectReview = z.infer<typeof selectReviewSchema>;

// Utility types for enhanced type safety in queries
export type PropertyWithOwner = Property & {
  owner: User;
};

export type PropertyWithReviews = Property & {
  reviews: Review[];
  averageRating?: number;
  reviewCount?: number;
};

// Query result types for common operations
export type PropertySearchResult = Pick<Property, 'id' | 'title' | 'location' | 'price' | 'imageUrls'> & {
  averageRating?: number;
  reviewCount?: number;
};

// Update schemas for partial updates
export const updateUserSchema = insertUserSchema.partial();
export const updatePropertySchema = insertPropertySchema.partial();
export const updateReviewSchema = insertReviewSchema.partial();

export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdateProperty = z.infer<typeof updatePropertySchema>;
export type UpdateReview = z.infer<typeof updateReviewSchema>;

// Runtime validation helpers
export const validatePropertyFeatures = (features: unknown): PropertyFeatures => {
  return PropertyFeaturesSchema.parse(features);
};

export const validateAIVerificationResults = (results: unknown): AIVerificationResults => {
  return AIVerificationResultsSchema.parse(results);
};

export const isValidVerificationStatus = (status: string): status is VerificationStatus => {
  return Object.values(VERIFICATION_STATUS).includes(status as VerificationStatus);
};