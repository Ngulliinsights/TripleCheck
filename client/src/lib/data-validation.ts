import { z } from "zod";

// Safe data parsing utilities
export function safeParseJSON<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  
  try {
    const parsed = JSON.parse(jsonString);
    return parsed ?? fallback;
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

// Property data validation with fallbacks
export const PropertyDataSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  location: z.string().min(1).max(100),
  price: z.number().int().min(0),
  imageUrls: z.array(z.string().url()).min(1),
  features: z.object({
    bedrooms: z.number().int().min(0).max(20).default(0),
    bathrooms: z.number().min(0).max(20).default(0),
    squareFeet: z.number().int().min(1).max(100000).default(1000),
    parkingSpaces: z.number().int().min(0).max(20).default(0),
    yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),
    amenities: z.array(z.string()).default([]),
    propertyType: z.enum(['apartment', 'house', 'condo', 'townhouse', 'studio']).optional(),
    petFriendly: z.boolean().default(false),
    furnished: z.boolean().default(false)
  }).default({}),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).default('pending'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export type SafePropertyData = z.infer<typeof PropertyDataSchema>;

// User data validation
export const UserDataSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1).max(30),
  trustScore: z.number().int().min(0).max(1000).default(0),
  isVerifiedAgent: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export type SafeUserData = z.infer<typeof UserDataSchema>;

// Review data validation
export const ReviewDataSchema = z.object({
  id: z.number().int().positive(),
  propertyId: z.number().int().positive(),
  userId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export type SafeReviewData = z.infer<typeof ReviewDataSchema>;

// Safe data parsing functions
export function safeParseProperty(data: unknown): SafePropertyData | null {
  try {
    return PropertyDataSchema.parse(data);
  } catch (error) {
    console.warn('Invalid property data:', error);
    return null;
  }
}

export function safeParseUser(data: unknown): SafeUserData | null {
  try {
    return UserDataSchema.parse(data);
  } catch (error) {
    console.warn('Invalid user data:', error);
    return null;
  }
}

export function safeParseReview(data: unknown): SafeReviewData | null {
  try {
    return ReviewDataSchema.parse(data);
  } catch (error) {
    console.warn('Invalid review data:', error);
    return null;
  }
}

// Array parsing with filtering of invalid items
export function safeParsePropertyArray(data: unknown[]): SafePropertyData[] {
  if (!Array.isArray(data)) return [];
  
  return data
    .map(item => safeParseProperty(item))
    .filter((item): item is SafePropertyData => item !== null);
}

export function safeParseUserArray(data: unknown[]): SafeUserData[] {
  if (!Array.isArray(data)) return [];
  
  return data
    .map(item => safeParseUser(item))
    .filter((item): item is SafeUserData => item !== null);
}

export function safeParseReviewArray(data: unknown[]): SafeReviewData[] {
  if (!Array.isArray(data)) return [];
  
  return data
    .map(item => safeParseReview(item))
    .filter((item): item is SafeReviewData => item !== null);
}

// Image URL validation and fallback
export function validateImageUrl(url: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    return '/placeholder-property.jpg'; // Fallback image
  }
}

export function validateImageUrls(urls: string[]): string[] {
  if (!Array.isArray(urls) || urls.length === 0) {
    return ['/placeholder-property.jpg'];
  }
  
  const validUrls = urls.map(validateImageUrl);
  return validUrls.length > 0 ? validUrls : ['/placeholder-property.jpg'];
}

// Price formatting with safety
export function formatPrice(price: number | string | null | undefined): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (typeof numPrice !== 'number' || isNaN(numPrice) || numPrice < 0) {
    return 'Price on request';
  }
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice);
}

// Safe string truncation
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text || typeof text !== 'string') return '';
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
}

// Date formatting with fallback
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Date not available';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return new Intl.DateTimeFormat('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return 'Date not available';
  }
}

// Rating calculation with safety
export function calculateAverageRating(reviews: SafeReviewData[]): number {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;
  
  const validRatings = reviews
    .map(review => review.rating)
    .filter(rating => typeof rating === 'number' && rating >= 1 && rating <= 5);
  
  if (validRatings.length === 0) return 0;
  
  const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / validRatings.length) * 10) / 10; // Round to 1 decimal
}