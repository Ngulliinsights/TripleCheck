/**
 * Review-related types and interfaces
 */

import { z } from "zod";

// Database review type (based on schema structure)
export interface DatabaseReview {
  id: number;
  propertyId: number;
  userId: number;
  rating: number;
  comment: string;
  title?: string;
  pros?: string[];
  cons?: string[];
  wouldRecommend?: boolean;
  helpfulCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Review input schema for validation
export const insertReviewSchema = z.object({
  propertyId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
  title: z.string().max(200).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  wouldRecommend: z.boolean().optional(),
});

// Review input type for creation
export type NewReviewInput = z.infer<typeof insertReviewSchema>;

// Review with additional metadata
export interface ReviewWithMetadata extends DatabaseReview {
  authorName?: string;
  propertyTitle?: string;
  verificationStatus?: string;
  helpfulVotes?: number;
  reportedCount?: number;
}

// Review creation request
export interface ReviewCreateRequest {
  propertyId: number;
  rating: number;
  comment: string;
  title?: string;
  pros?: string[];
  cons?: string[];
  wouldRecommend?: boolean;
}

// Review update request
export interface ReviewUpdateRequest {
  rating?: number;
  comment?: string;
  title?: string;
  pros?: string[];
  cons?: string[];
  wouldRecommend?: boolean;
}

// Review summary for property listings
export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentReviews: ReviewWithMetadata[];
}

// Review search filters
export interface ReviewSearchFilters {
  propertyId?: number;
  authorId?: number;
  ratingMin?: number;
  ratingMax?: number;
  dateFrom?: string;
  dateTo?: string;
  verified?: boolean;
}

// Review moderation status
export type ReviewModerationStatus = "pending" | "approved" | "rejected" | "flagged";

// Review with moderation info
export interface ReviewWithModeration extends ReviewWithMetadata {
  moderationStatus: ReviewModerationStatus;
  moderatedBy?: number;
  moderatedAt?: string;
  moderationReason?: string;
}