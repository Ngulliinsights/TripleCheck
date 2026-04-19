/**
 * Property Domain Types
 *
 * Sections:
 *   1. Primitives & union types
 *   2. Supporting models (location, owner, verification)
 *   3. Feature shapes (per category)
 *   4. Core property — discriminated union
 *   5. AI verification
 *   6. Filters — discriminated union
 *   7. Search & pagination
 *   8. Configuration (framework-agnostic)
 *   9. API boundary type (raw wire shape)
 *
 * Rule: `Property` is the canonical domain type — a discriminated union on
 * `category`. Narrow with `if (p.category === 'residential')` to access
 * category-specific fields without casting.
 */

// ============================================================================
// 1. PRIMITIVES & UNION TYPES
// ============================================================================

export type PropertyCategory = 'residential' | 'commercial' | 'land';

export type PropertyStatus = 'available' | 'under-offer' | 'sold' | 'rented' | 'pending';

export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'flagged' | 'draft';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type VerificationSessionStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'suspended'
  | 'failed';

export type ResidentialType =
  | 'apartment'
  | 'house'
  | 'duplex'
  | 'penthouse'
  | 'studio'
  | 'townhouse'
  | 'villa';

export type CommercialType = 'office' | 'retail' | 'warehouse' | 'industrial' | 'mixed-use';

export type LandType = 'agricultural' | 'residential' | 'commercial' | 'industrial';

export type TitleDeedStatus = 'available' | 'pending' | 'missing';

export type ViewMode  = 'grid' | 'list';
export type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'rating' | 'views';

// ============================================================================
// 2. SUPPORTING MODELS
// ============================================================================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  address:      string;
  city?:        string;
  state:        string;
  country:      string;
  coordinates?: Coordinates;
}

export interface PropertyOwner {
  id:              string;
  firstName:       string;
  lastName:        string;
  email?:          string;
  phone?:          string;
  avatar?:         string;
  trustScore:      number;
  isVerifiedAgent: boolean;
}

// ── Land verification ─────────────────────────────────────────────────────────

export interface LandVerificationBadge {
  type:        'verified' | 'in_progress' | 'high_risk' | 'expert_required';
  label:       string;
  color:       'green' | 'blue' | 'red' | 'orange';
  description: string;
}

export interface LandVerificationStatus {
  sessionId?:       string;
  status:           VerificationSessionStatus;
  overallRiskScore: number;             // 0–100
  riskLevel:        RiskLevel;
  confidence:       number;             // 0–1
  completedLayers:  string[];
  lastUpdated:      string;             // ISO-8601 — safe across JSON boundary
  badge?:           LandVerificationBadge;
}

// ============================================================================
// 3. FEATURE SHAPES  (per category — no index signatures)
// ============================================================================

export interface ResidentialFeatures {
  bedrooms:       number;
  bathrooms:      number;
  squareFeet:     number;
  parkingSpaces?: number;
  yearBuilt?:     number;
  amenities?:     string[];
  furnished?:     boolean;
  petFriendly?:   boolean;
  balcony?:       boolean;
  garden?:        boolean;
}

export interface CommercialFeatures {
  squareFeet:      number;
  yearBuilt:       number;
  occupancyRate?:  number;   // 0–1
  roi?:            number;   // percentage
  parkingSpaces?:  number;
  floors?:         number;
  elevators?:      number;
  airConditioning?: boolean;
  security?:       boolean;
  loadingDock?:    boolean;
  
  // Strategic optional fields for unified comparisons
  bedrooms?:       number;
  bathrooms?:      number;
  amenities?:      string[];
}

export interface LandFeatures {
  sizeValue:             number;      // numeric — pair with sizeUnit
  sizeUnit:              'sqm' | 'acres' | 'hectares';
  soilType?:             string;
  waterAccess?:          boolean;
  roadAccess?:           boolean;
  electricityAccess?:    boolean;
  zoning?:               string;
  developmentPotential?: string;
  titleDeedStatus?:      TitleDeedStatus;
  topography?:           string;
  drainage?:             string;

  // Strategic optional fields for unified comparisons
  bedrooms?:             number;
  bathrooms?:            number;
  squareFeet?:           number;
  parkingSpaces?:        number;
  yearBuilt?:            number;
  amenities?:            string[];
}

// ============================================================================
// 4. CORE PROPERTY — DISCRIMINATED UNION
// ============================================================================

/**
 * Fields shared across all property categories.
 * Internal — consumers should use the `Property` union, not `BaseProperty` directly.
 */
interface BaseProperty {
  id:                   string;
  title:                string;
  description:          string;
  price:                number;
  location:             LocationData;
  images:               string[];
  status:               PropertyStatus;
  verificationStatus:   VerificationStatus;
  verified:             boolean;
  trustScore:           number;
  owner?:               PropertyOwner;
  coordinates?:         Coordinates;
  landVerification?:    LandVerificationStatus;
  aiVerification?:      AIVerificationResults;
  viewCount?:           number;
  favoriteCount?:       number;
  isActive?:            boolean;
  isFeatured?:          boolean;
  availableFrom?:       string;   // ISO-8601
  availableUntil?:      string;   // Dates & metadata
  createdAt:            string;
  updatedAt?:           string;

  // Strategic Features (added for comparisons and cross-category consistency)
  bedrooms?:            number;
  bathrooms?:           number;
  area?:                number;
  size?:                number;
  squareFeet?:          number;
  parkingSpaces?:       number;
  yearBuilt?:           number;
  amenities?:           string[];
}

export interface ResidentialProperty extends BaseProperty {
  category: 'residential';
  type:     ResidentialType;
  features: ResidentialFeatures;
}

export interface CommercialProperty extends BaseProperty {
  category: 'commercial';
  type:     CommercialType;
  features: CommercialFeatures;
}

export interface LandProperty extends BaseProperty {
  category: 'land';
  type:     LandType;
  features: LandFeatures;
}

/**
 * Canonical property type.
 * Discriminant: `category` — narrow with `property.category === 'residential'`
 * to access category-specific `type` and `features` without casting.
 */
export type Property = ResidentialProperty | CommercialProperty | LandProperty;

/** Utility: extract the property subtype for a given category. */
export type PropertyByCategory<C extends PropertyCategory> = Extract<Property, { category: C }>;

// ============================================================================
// 5. AI VERIFICATION
// ============================================================================

interface AnalysisResult {
  score: number;    // 0–1
  flags: string[];
}

export interface AIVerificationResults {
  overallScore?:   number;  // 0–1
  imageAnalysis?:  AnalysisResult & { quality: number };
  textAnalysis?:   AnalysisResult & { sentiment: number };
  priceAnalysis?:  AnalysisResult & { marketComparison: number; reasonableness: number };
  lastVerified?:   string;  // ISO-8601
  verificationId?: string;
}

// ============================================================================
// 6. FILTERS — DISCRIMINATED UNION
// ============================================================================

export interface BasePropertyFilters {
  query:    string;
  location: string;
  priceMin: number | null;
  priceMax: number | null;
  verified: boolean;
  category: PropertyCategory | null;
}

export interface ResidentialFilters extends BasePropertyFilters {
  category:     'residential';
  bedrooms:     number | null;
  bathrooms:    number | null;
  propertyType: string;
  amenities:    string[];
  furnished?:   boolean;
  petFriendly?: boolean;
}

export interface CommercialFilters extends BasePropertyFilters {
  category:       'commercial';
  propertyType:   string;
  sizeMin:        number | null;  // sqft
  sizeMax:        number | null;
  yearBuiltMin:   number | null;
  roiMin:         number | null;
  floorsMin:      number | null;
  floorsMax:      number | null;
  // Amenity toggles
  parking:        boolean;
  elevator:       boolean;
  airConditioning: boolean;
  security:       boolean;
  wifi:           boolean;
  generator:      boolean;
}

export interface LandFilters extends BasePropertyFilters {
  category:          'land';
  landType:          string;
  sizeMin:           number | null;  // sqm
  sizeMax:           number | null;
  waterAccess:       boolean;
  roadAccess:        boolean;
  electricityAccess: boolean;
}

/**
 * Canonical filter type — discriminant: `category`.
 * Omit `category` for the base (unfiltered-by-category) case.
 */
export type PropertyFilters = ResidentialFilters | CommercialFilters | LandFilters;

// ============================================================================
// 7. SEARCH & PAGINATION
// ============================================================================

export interface PropertySearchParams {
  filters:  BasePropertyFilters;
  page:     number;
  pageSize: number;
  sortBy:   SortOption;
}

export interface PropertySearchResponse<T = Property> {
  items:           T[];
  totalCount:      number;
  totalPages:      number;
  currentPage?:    number;
  hasNextPage?:    boolean;
  hasPreviousPage?: boolean;
}

// ============================================================================
// 8. CONFIGURATION  (framework-agnostic — no React imports)
// ============================================================================

export interface PropertyTypeConfig<
  TFilters extends BasePropertyFilters,
  TProperty = Property,
> {
  title:          string;
  description:    string;
  queryKey:       string[];
  defaultFilters: TFilters;
  fetcher: (
    filters:  TFilters,
    page:     number,
    pageSize: number,
  ) => Promise<PropertySearchResponse<TProperty>>;
  adapter: (raw: unknown) => TProperty;
  /** Framework-specific filter component reference. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterComponent?: any;
  /** Framework-specific card component reference. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cardComponent?: any;
}

export type PropertyAdapter<TRaw, TProperty extends Property = Property> =
  (raw: TRaw) => TProperty;

// ============================================================================
// 9. API BOUNDARY TYPE  (raw wire shape — normalise before use)
// ============================================================================

/**
 * Raw property record as returned by the API before normalisation.
 * Do not use this type inside application logic — pass it through an adapter
 * that produces the typed `Property` discriminated union.
 *
 * Loose types here are intentional: they reflect real API inconsistencies
 * that adapters are responsible for resolving.
 */
export interface ApiPropertyRecord {
  id:                 number | string;
  title:              string;
  description:        string;
  price:              string | number;
  location:           string | { address: string; city?: string; state?: string; country?: string };
  address?:           string | null;
  images?:            string[];
  imageUrls?:         string[];          // legacy field name — prefer `images`
  category?:          PropertyCategory;
  type?:              string;
  propertyType?:      string;            // legacy field name — prefer `type`
  status?:            string;
  verificationStatus?: VerificationStatus;
  trustScore?:        number;
  bedrooms?:          number;
  bathrooms?:         number;
  squareFeet?:        number;
  area?:              number;            // legacy field name — prefer `squareFeet`
  size?:              number | string;   // legacy: may be "2.5 acres"
  ownerId?:           string;
  coordinates?:       Coordinates | null;
  isActive?:          boolean;
  isFeatured?:        boolean;
  availableFrom?:     string | Date | null;
  availableUntil?:    string | Date | null;
  createdAt?:         string | Date;
  updatedAt?:         string | Date;
}

// ============================================================================
// 10. NORMALISED PROPERTY  (flat, client-friendly shape)
// ============================================================================

/**
 * Flattened property type used on the client after adapters have normalised
 * the raw API data.  Unlike the discriminated `Property` union this is a
 * single interface with optional fields, making it simpler for UI components.
 */
export interface NormalizedProperty {
  id:                  string;
  title:               string;
  description:         string;
  price:               number;
  location:            string | LocationData;       // normalised to plain string or LocationData if needed
  images:              string[];
  verified:            boolean;
  type:                string;
  category:            PropertyCategory;
  features:            ResidentialFeatures | CommercialFeatures | LandFeatures | Record<string, unknown>; // populated by adapters
  createdAt:           string;                      // ISO-8601
  status:              PropertyStatus;
  updatedAt?:          string;
  rating?:             number;
  views?:              number;
  viewCount?:          number;
  trustScore?:         number;
  verificationStatus?: VerificationStatus;
  owner?:              PropertyOwner & { name?: string };
  coordinates?:        Coordinates;
  favoriteCount?:      number;
  landVerification?:   LandVerificationStatus;
  isFeatured?:         boolean;
}

// ============================================================================
// 11. RAW LAND PROPERTY  (pre-normalisation shape from legacy endpoints)
// ============================================================================

/**
 * Shape returned by legacy land-property endpoints before normalisation.
 * Pass through `normalizeRawLandProperty` to produce a `NormalizedProperty`.
 */
export interface RawLandProperty {
  id:                  string | number;
  title:               string;
  description:         string;
  price:               string | number;
  location:            string | { address: string; city?: string; state?: string; country?: string };
  images?:             string[];
  imageUrls?:          string[];
  verificationStatus?: string;
  features?:           Record<string, unknown>;
  dateAdded?:          string | Date;
  createdAt?:          string | Date;
  status?:             string;
  type?:               string;
  category?:           string;
  coordinates?:        Coordinates;
  trustScore?:         number;
}