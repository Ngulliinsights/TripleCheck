import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with enhanced verification fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  idNumber: text("id_number"), // National ID
  kraPinNumber: text("kra_pin"),
  phoneNumber: text("phone_number"),
  agentLicenseNumber: text("agent_license_number"),
  licenseExpiryDate: timestamp("license_expiry_date"),
  verificationStatus: text("verification_status").notNull().default('pending'),
  verificationDocuments: json("verification_documents"),
  trustScore: integer("trust_score").notNull().default(0),
  isVerifiedAgent: boolean("is_verified_agent").notNull().default(false),
  preferredLanguage: text("preferred_language").notNull().default('en') // en or sw
});

// Properties table with enhanced verification tracking
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  title: text("title").notNull(),
  titleSwahili: text("title_swahili"),
  description: text("description").notNull(),
  descriptionSwahili: text("description_swahili"),
  location: text("location").notNull(),
  price: integer("price").notNull(),
  imageUrls: text("image_urls").array().notNull(),
  features: json("features").notNull(),
  propertyType: text("property_type").notNull(), // residential, commercial, land
  landReferenceNumber: text("land_reference_number"),
  titleDeedNumber: text("title_deed_number"),
  plotNumber: text("plot_number"),
  verificationStatus: text("verification_status").notNull().default('pending'),
  verificationDocuments: json("verification_documents"), // Store documents metadata
  aiVerificationResults: json("ai_verification_results"),
  surveyorVerification: json("surveyor_verification"),
  landRegistryVerification: json("land_registry_verification"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Payment records table for M-Pesa transactions
export const paymentRecords = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  mpesaTransactionId: text("mpesa_transaction_id"),
  mpesaPhoneNumber: text("mpesa_phone_number"),
  paymentStatus: text("payment_status").notNull(),
  paymentType: text("payment_type").notNull(), // deposit, full_payment, verification_fee
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Reviews table with enhanced verification
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  userId: integer("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  commentSwahili: text("comment_swahili"),
  isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
  transactionId: integer("transaction_id"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Community posts table with language support
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleSwahili: text("title_swahili"),
  content: text("content").notNull(),
  contentSwahili: text("content_swahili"),
  location: text("location").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(), // fraud, scam, success_story
  verificationStatus: text("verification_status").notNull().default('pending'),
  evidenceDocuments: json("evidence_documents"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Legal resources table with language support
export const legalResources = pgTable("legal_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleSwahili: text("title_swahili"),
  description: text("description").notNull(),
  descriptionSwahili: text("description_swahili"),
  category: text("category").notNull(), // constitutional, statutory, reporting
  link: text("link"),
  content: text("content").notNull(),
  contentSwahili: text("content_swahili"),
  jurisdiction: text("jurisdiction").notNull(), // national, county
  documentTemplates: json("document_templates"), // Standard forms and templates
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  idNumber: true,
  kraPinNumber: true,
  phoneNumber: true,
  preferredLanguage: true
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  ownerId: true,
  title: true,
  description: true,
  location: true,
  price: true,
  imageUrls: true,
  features: true,
  propertyType: true,
  landReferenceNumber: true,
  titleDeedNumber: true,
  plotNumber: true
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  propertyId: true,
  userId: true,
  rating: true,
  comment: true
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).pick({
  title: true,
  content: true,
  location: true,
  isAnonymous: true,
  userId: true,
  category: true
});

export const insertLegalResourceSchema = createInsertSchema(legalResources).pick({
  title: true,
  description: true,
  category: true,
  link: true,
  content: true,
  jurisdiction: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type PaymentRecord = typeof paymentRecords.$inferSelect;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

export type LegalResource = typeof legalResources.$inferSelect;
export type InsertLegalResource = z.infer<typeof insertLegalResourceSchema>;

// Feature type with enhanced African real estate context
export type PropertyFeatures = {
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  parkingSpaces: number;
  yearBuilt: number;
  amenities: string[];
  waterSource: string; // borehole, county_water, water_tank
  powerBackup: boolean; // generator/solar availability
  security: string[]; // gated, security_guard, electric_fence
  nearbyFacilities: string[]; // schools, hospitals, shopping_centers
};

// Document verification type
export type VerificationDocuments = {
  nationalId?: {
    fileUrl: string;
    verificationStatus: string;
    verifiedAt?: string;
  };
  kraPinCertificate?: {
    fileUrl: string;
    verificationStatus: string;
    verifiedAt?: string;
  };
  titleDeed?: {
    fileUrl: string;
    verificationStatus: string;
    verifiedAt?: string;
  };
  landRates?: {
    fileUrl: string;
    verificationStatus: string;
    verifiedAt?: string;
  };
  agentLicense?: {
    fileUrl: string;
    verificationStatus: string;
    expiryDate: string;
    verifiedAt?: string;
  };
};