import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  trustScore: integer("trust_score").notNull().default(0),
  isVerifiedAgent: boolean("is_verified_agent").notNull().default(false)
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  price: integer("price").notNull(),
  imageUrls: text("image_urls").array().notNull(),
  features: json("features").notNull(),
  verificationStatus: text("verification_status").notNull().default('pending'),
  aiVerificationResults: json("ai_verification_results"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Reviews table 
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  ownerId: true,
  title: true, 
  description: true,
  location: true,
  price: true,
  imageUrls: true,
  features: true
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  propertyId: true,
  userId: true,
  rating: true,
  comment: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Feature type
export type PropertyFeatures = {
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  parkingSpaces: number;
  yearBuilt: number;
  amenities: string[];
};
