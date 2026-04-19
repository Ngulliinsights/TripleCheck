/**
 * Domain-specific API types for the property & search layer.
 *
 * Rule: envelope types (ApiResponse, SuccessResponse, PaginatedResponse, etc.)
 * are imported from `api-contracts` — never redefined here.
 *
 * Auth types (User, AuthResult) are imported from `auth.types` — never redefined here.
 */

import type { PaginatedResponse, SuccessResponse, ApiResponse } from './api-contracts';
import type { Property }                           from './property';

export type { PaginatedResponse, SuccessResponse, ApiResponse, Property };

// ============================================================================
// SEARCH & FILTERING
// ============================================================================

export type SortField = 'date' | 'price' | 'relevance' | 'trustScore' | 'landVerification';
export type SortOrder = 'asc' | 'desc';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PropertySearchParams {
  query:        string;
  page:         number;
  limit:        number;
  sortBy:       SortField;
  sortOrder:    SortOrder;
  // Filters — all optional, no need for explicit `| undefined`
  location?:         string;
  priceMin?:         number;
  priceMax?:         number;
  propertyType?:     string;
  bedrooms?:         number;
  bathrooms?:        number;
  areaMin?:          number;
  areaMax?:          number;
  landVerified?:     boolean;
  landRiskLevel?:    RiskLevel;
}

/** Subset of PropertySearchParams used for display / URL serialisation. */
export interface SearchFilters
  extends Pick<
    PropertySearchParams,
    | 'location'
    | 'priceMin'
    | 'priceMax'
    | 'propertyType'
    | 'bedrooms'
    | 'bathrooms'
    | 'landVerified'
  > {}

// ============================================================================
// PROPERTY API RESPONSES
// (aliases of the canonical envelope — avoids ad-hoc duplication)
// ============================================================================

/** GET /properties  — paginated list */
export type PropertyListResponse = PaginatedResponse<Property>;

/** GET /properties/:id  — single property, with optional cache flag */
export type SinglePropertyResponse = SuccessResponse<Property & { cached?: boolean }>;

// ============================================================================
// LAND VERIFICATION
// ============================================================================

export type VerificationStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'suspended'
  | 'failed';

export interface VerificationBadge {
  type:        string;
  label:       string;
  color:       string;
  description: string;
}

export interface LandVerificationData {
  sessionId?:       string;
  status:           VerificationStatus;
  overallRiskScore: number;
  riskLevel:        RiskLevel;
  confidence:       number;          // 0–1
  completedLayers:  string[];
  lastUpdated:      string | Date;   // prefer ISO-8601 string across the wire
  badge?:           VerificationBadge;
}

// ============================================================================
// LOCATION
// ============================================================================

export interface LocationData {
  id:          number;
  name:        string;
  description?: string;
  coordinates?: {
    latitude:  number;
    longitude: number;
  };
}

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Lightweight result type for local validation utilities.
 * Not to be confused with server SessionValidationResult (auth.types).
 */
export type ValidationResult<T> =
  | { valid: true;  data: T;      error?: never }
  | { valid: false; data?: never; error: string };