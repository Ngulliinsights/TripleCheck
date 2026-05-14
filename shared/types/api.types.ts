/**
 * Domain-specific API types for the property & search layer.
 *
 * Rule: envelope types (ApiResponse, SuccessResponse, PaginatedResponse, etc.)
 * are imported from `api-contracts` — never redefined here.
 *
 * Rule: auth types (User, AuthResult) are imported from `auth.types` — never redefined here.
 */

import type {
  PaginatedResponse,
  SuccessResponse,
  ApiResponse,
} from './api-contracts';

import type { Property } from './property';

// ============================================================================
// PRIMITIVES
// ============================================================================

export type SortField  = 'date' | 'price' | 'relevance' | 'trustScore' | 'landVerification';
export type SortOrder  = 'asc' | 'desc';
export type RiskLevel  = 'low' | 'medium' | 'high' | 'critical';

export type VerificationStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'suspended'
  | 'failed';

// ============================================================================
// SEARCH & FILTERING
// ============================================================================

export interface PropertySearchParams {
  // Required
  query:     string;
  page:      number;
  limit:     number;
  sortBy:    SortField;
  sortOrder: SortOrder;
  // Optional filters
  location?:      string;
  priceMin?:      number;
  priceMax?:      number;
  propertyType?:  string;
  bedrooms?:      number;
  bathrooms?:     number;
  areaMin?:       number;
  areaMax?:       number;
  landVerified?:  boolean;
  landRiskLevel?: RiskLevel;
}

/**
 * Display / URL-serialisation subset of PropertySearchParams.
 * Excludes pagination and sort — those are controlled separately.
 */
export type SearchFilters = Pick<
  PropertySearchParams,
  | 'location'
  | 'priceMin'
  | 'priceMax'
  | 'propertyType'
  | 'bedrooms'
  | 'bathrooms'
  | 'landVerified'
>;

// ============================================================================
// PROPERTY MUTATIONS
// ============================================================================

/** Payload for POST /properties */
export type PropertyCreateParams = Omit<
  Property,
  'id' | 'createdAt' | 'updatedAt' | 'ownerId'
>;

/** Payload for PATCH /properties/:id — all fields optional */
export type PropertyUpdateParams = Partial<PropertyCreateParams>;

// ============================================================================
// PROPERTY RESPONSES
// (aliases of the canonical envelope — no ad-hoc redefinition)
// ============================================================================

/** GET /properties  — paginated list */
export type PropertyListResponse = PaginatedResponse<Property>;

/** GET /properties/:id  — single property */
export type SinglePropertyResponse = SuccessResponse<Property & { cached?: boolean }>;

/** POST /properties  — newly created property */
export type PropertyCreateResponse = SuccessResponse<Property>;

/** PATCH /properties/:id  — updated property */
export type PropertyUpdateResponse = SuccessResponse<Property>;

/** DELETE /properties/:id  — acknowledgement only */
export type PropertyDeleteResponse = SuccessResponse<{ id: string; deleted: true }>;

// ============================================================================
// LAND VERIFICATION
// ============================================================================

export interface VerificationBadge {
  type:        string;
  label:       string;
  color:       string;
  description: string;
}

export interface LandVerificationData {
  sessionId?:       string;
  status:           VerificationStatus;
  overallRiskScore: number;          // 0–100
  riskLevel:        RiskLevel;
  confidence:       number;          // 0–1
  completedLayers:  string[];
  lastUpdated:      string;          // ISO-8601 — always a string across the wire
  badge?:           VerificationBadge;
}

export type LandVerificationResponse = ApiResponse<LandVerificationData>;

// ============================================================================
// LOCATION
// ============================================================================

export interface LocationCoordinates {
  latitude:  number;
  longitude: number;
}

export interface LocationData {
  id:           number;
  name:         string;
  description?: string;
  coordinates?: LocationCoordinates;
}

export type LocationListResponse = SuccessResponse<LocationData[]>;

// ============================================================================
// VALIDATION RESULT  (local, client-side utility — not a server type)
// ============================================================================

/**
 * Discriminated-union result for local validation helpers.
 * Not to be confused with server-side SessionValidationResult (auth.types).
 */
export type ValidationResult<T> =
  | { valid: true;  data: T;      error?: never }
  | { valid: false; data?: never; error: string };

/** Convenience constructors — avoids casting at every call site. */
export const ValidationResult = {
  ok:   <T>(data: T): ValidationResult<T>   => ({ valid: true,  data }),
  fail: <T>(error: string): ValidationResult<T> => ({ valid: false, error }),
} as const;