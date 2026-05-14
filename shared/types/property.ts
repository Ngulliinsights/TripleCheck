/**
 * Property Domain Types
 *
 * Sections:
 *   1. Primitives & union types
 *   2. Supporting models (location, owner, verification)
 *   3. Feature shapes (per category)
 *   4. Core property — discriminated union
 *   5. Cross-category utilities  (pure runtime helpers at bottom of section)
 *   6. AI verification
 *   7. Filters — discriminated union
 *   8. Search & pagination
 *   9. Configuration (framework-agnostic)
 *  10. API boundary types (raw wire shapes)
 *
 * Rule: `Property` is the canonical domain type — a discriminated union on
 * `category`. Narrow with `if (p.category === 'residential')` to access
 * category-specific fields without casting.
 *
 * Numeric-scale convention (two systems in use — do not mix):
 *   • 0–1   fraction  →  confidence, occupancyRate, roi expressed as ratio
 *   • 0–100 score     →  trustScore, overallRiskScore, AI scores
 *   Each field is annotated at its declaration site.
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

export type ViewMode   = 'grid' | 'list';
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
  /** 0–100 */
  trustScore:      number;
  isVerifiedAgent: boolean;
}

/**
 * Owner shape used in normalised/UI contexts where a legacy `name` string
 * may be present instead of (or alongside) `firstName`/`lastName`.
 */
export interface NormalizedOwner extends PropertyOwner {
  /** Pre-joined display name from legacy API responses. */
  name?: string;
}

export interface LandVerificationBadge {
  type:        'verified' | 'in_progress' | 'high_risk' | 'expert_required';
  label:       string;
  color:       'green' | 'blue' | 'red' | 'orange';
  description: string;
}

export interface LandVerificationStatus {
  sessionId?:      string;
  status:          VerificationSessionStatus;
  /** 0–100 */
  overallRiskScore: number;
  riskLevel:        RiskLevel;
  /** 0–1 fraction */
  confidence:       number;
  completedLayers:  readonly string[];
  /** ISO-8601 */
  lastUpdated:      string;
  badge?:           LandVerificationBadge;
}

// ============================================================================
// 3. FEATURE SHAPES  (per category)
// ============================================================================

export interface ResidentialFeatures {
  bedrooms:       number;
  bathrooms:      number;
  squareFeet:     number;
  parkingSpaces?: number;
  yearBuilt?:     number;
  amenities?:     readonly string[];
  furnished?:     boolean;
  petFriendly?:   boolean;
  balcony?:       boolean;
  garden?:        boolean;
}

export interface CommercialFeatures {
  squareFeet:       number;
  yearBuilt:        number;
  /** 0–1 fraction */
  occupancyRate?:   number;
  /** 0–1 fraction */
  roi?:             number;
  parkingSpaces?:   number;
  floors?:          number;
  elevators?:       number;
  airConditioning?: boolean;
  security?:        boolean;
  loadingDock?:     boolean;
  amenities?:       readonly string[];
}

export interface LandFeatures {
  sizeValue:             number;
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
}

export type PropertyFeatures = ResidentialFeatures | CommercialFeatures | LandFeatures;

// ============================================================================
// 4. CORE PROPERTY — DISCRIMINATED UNION
// ============================================================================

/**
 * Shared fields across all property categories.
 * Not exported — consumers use the `Property` discriminated union.
 *
 * `verified` is a convenience boolean derived from
 * `verificationStatus === 'verified'`. Keep the two in sync when mutating.
 *
 * `coordinates` is intentional denormalisation of `location.coordinates` for
 * performance-sensitive list rendering that bypasses the nested lookup.
 */
interface BaseProperty {
  id:                 string;
  title:              string;
  description:        string;
  price:              number;
  location:           LocationData;
  images:             readonly string[];
  status:             PropertyStatus;
  verificationStatus: VerificationStatus;
  /**
   * Convenience flag — always equal to `verificationStatus === 'verified'`.
   * Do not use as the source of truth; prefer `verificationStatus` for logic.
   */
  verified:           boolean;
  /** 0–100 */
  trustScore:         number;
  /** ISO-8601 */
  createdAt:          string;
  /** ISO-8601 */
  updatedAt?:         string;
  owner?:             PropertyOwner;
  /**
   * Denormalised shortcut for `location.coordinates`.
   * Prefer `location.coordinates` when building new features.
   */
  coordinates?:       Coordinates;
  aiVerification?:    AIVerificationResults;
  viewCount?:         number;
  favoriteCount?:     number;
  isActive?:          boolean;
  isFeatured?:        boolean;
  /** ISO-8601 */
  availableFrom?:     string;
  /** ISO-8601 */
  availableUntil?:    string;
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
  category:          'land';
  type:              LandType;
  features:          LandFeatures;
  /** Land-specific verification session — absent on residential/commercial. */
  landVerification?: LandVerificationStatus;
}

/**
 * Canonical property type. Discriminant: `category`.
 * Narrow with `property.category === 'residential'` to access
 * category-specific `type`, `features`, and (for land) `landVerification`
 * without casting.
 */
export type Property = ResidentialProperty | CommercialProperty | LandProperty;

/** Extract the property variant for a given category. */
export type PropertyByCategory<C extends PropertyCategory> = Extract<Property, { category: C }>;

// ============================================================================
// 5. CROSS-CATEGORY UTILITIES
// ============================================================================

/**
 * Fields meaningful across all categories for list views and comparisons.
 * Derived from the union — no casting required.
 */
export interface ComparablePropertyFields {
  id:                 string;
  title:              string;
  price:              number;
  category:           PropertyCategory;
  status:             PropertyStatus;
  verificationStatus: VerificationStatus;
  verified:           boolean;
  /** 0–100 */
  trustScore:         number;
  location:           LocationData;
  images:             readonly string[];
  /** ISO-8601 */
  createdAt:          string;
  viewCount?:         number;
  favoriteCount?:     number;
  isFeatured?:        boolean;
  owner?:             PropertyOwner;
  coordinates?:       Coordinates;
}

// ── Runtime helper ────────────────────────────────────────────────────────────

/** Flatten a `Property` to its comparable fields for list rendering. */
export function toComparableFields(p: Property): ComparablePropertyFields {
  return {
    id:                 p.id,
    title:              p.title,
    price:              p.price,
    category:           p.category,
    status:             p.status,
    verificationStatus: p.verificationStatus,
    verified:           p.verified,
    trustScore:         p.trustScore,
    location:           p.location,
    images:             p.images,
    createdAt:          p.createdAt,
    viewCount:          p.viewCount,
    favoriteCount:      p.favoriteCount,
    isFeatured:         p.isFeatured,
    owner:              p.owner,
    coordinates:        p.coordinates,
  };
}

// ============================================================================
// 6. AI VERIFICATION
// ============================================================================

/** Base shape for a single AI analysis pass. */
export interface AnalysisResult {
  /** 0–100 */
  score: number;
  flags: readonly string[];
}

export interface AIVerificationResults {
  /** 0–100 overall composite score */
  overallScore?:   number;
  imageAnalysis?:  AnalysisResult & { /** 0–100 */ quality: number };
  textAnalysis?:   AnalysisResult & { /** 0–1 positive sentiment */ sentiment: number };
  priceAnalysis?:  AnalysisResult & {
    /** 0–100 deviation from market median */ marketComparison: number;
    /** 0–100 price reasonableness score  */ reasonableness:   number;
  };
  /** ISO-8601 */
  lastVerified?:   string;
  verificationId?: string;
}

// ============================================================================
// 7. FILTERS — DISCRIMINATED UNION
// ============================================================================

export interface BasePropertyFilters {
  query:    string;
  location: string;
  priceMin: number | null;
  priceMax: number | null;
  verified: boolean;
  /**
   * `null` means "all categories" (used by `PropertySearchParams`).
   * Narrowed to a literal in each concrete filter subtype.
   */
  category: PropertyCategory | null;
}

export interface ResidentialFilters extends BasePropertyFilters {
  category:     'residential';
  bedrooms:     number | null;
  bathrooms:    number | null;
  propertyType: string;
  amenities:    readonly string[];
  furnished?:   boolean;
  petFriendly?: boolean;
}

export interface CommercialFilters extends BasePropertyFilters {
  category:        'commercial';
  propertyType:    string;
  /** sqft */
  sizeMin:         number | null;
  /** sqft */
  sizeMax:         number | null;
  yearBuiltMin:    number | null;
  roiMin:          number | null;
  floorsMin:       number | null;
  floorsMax:       number | null;
  parking:         boolean;
  elevator:        boolean;
  airConditioning: boolean;
  security:        boolean;
  wifi:            boolean;
  generator:       boolean;
}

export interface LandFilters extends BasePropertyFilters {
  category:          'land';
  landType:          string;
  /** sqm */
  sizeMin:           number | null;
  /** sqm */
  sizeMax:           number | null;
  waterAccess:       boolean;
  roadAccess:        boolean;
  electricityAccess: boolean;
  titleDeedStatus:   TitleDeedStatus | null;
}

/**
 * Canonical filter type — discriminant: `category`.
 * Use `BasePropertyFilters` for category-agnostic filter state (e.g. in
 * `PropertySearchParams`).
 */
export type PropertyFilters = ResidentialFilters | CommercialFilters | LandFilters;

// ============================================================================
// 8. SEARCH & PAGINATION
// ============================================================================

export interface PropertySearchParams {
  filters:  BasePropertyFilters;
  page:     number;
  pageSize: number;
  sortBy:   SortOption;
}

export interface PropertySearchResponse<T = Property> {
  items:            readonly T[];
  totalCount:       number;
  totalPages:       number;
  currentPage?:     number;
  hasNextPage?:     boolean;
  hasPreviousPage?: boolean;
}

// ============================================================================
// 9. CONFIGURATION  (framework-agnostic — no framework imports)
// ============================================================================

/**
 * `filterComponent` and `cardComponent` are typed as `unknown` here and cast
 * at the framework layer (e.g. `React.ComponentType<...>`). This keeps the
 * domain layer free of framework imports.
 */
export interface PropertyTypeConfig<
  TFilters  extends BasePropertyFilters,
  TProperty extends Property = Property,
> {
  title:           string;
  description:     string;
  queryKey:        readonly string[];
  defaultFilters:  TFilters;
  fetcher: (
    filters:  TFilters,
    page:     number,
    pageSize: number,
  ) => Promise<PropertySearchResponse<TProperty>>;
  adapter:          PropertyAdapter<unknown, TProperty>;
  filterComponent?: unknown;
  cardComponent?:   unknown;
}

export type PropertyAdapter<TRaw, TProperty extends Property = Property> =
  (raw: TRaw) => TProperty;

// ============================================================================
// 10. API BOUNDARY TYPES  (raw wire shapes — normalise before use)
// ============================================================================

/**
 * Raw property record as returned by the API before normalisation.
 * Pass through a `PropertyAdapter` to produce the typed `Property` union.
 * Loose types are intentional — they reflect real API inconsistencies.
 */
export interface ApiPropertyRecord {
  id:                  number | string;
  title:               string;
  description:         string;
  price:               string | number;
  location:            string | { address: string; city?: string; state?: string; country?: string };
  address?:            string | null;
  images?:             string[];
  /** @deprecated Use `images` */
  imageUrls?:          string[];
  category?:           PropertyCategory;
  type?:               string;
  /** @deprecated Use `type` */
  propertyType?:       string;
  status?:             string;
  verificationStatus?: VerificationStatus;
  /** 0–100 */
  trustScore?:         number;
  bedrooms?:           number;
  bathrooms?:          number;
  squareFeet?:         number;
  /** @deprecated Use `squareFeet` */
  area?:               number;
  /** @deprecated May be a freeform string such as "2.5 acres" — parse carefully */
  size?:               number | string;
  ownerId?:            string;
  coordinates?:        Coordinates | null;
  isActive?:           boolean;
  isFeatured?:         boolean;
  /** ISO-8601 or Date */
  availableFrom?:      string | Date | null;
  /** ISO-8601 or Date */
  availableUntil?:     string | Date | null;
  /** ISO-8601 or Date */
  createdAt?:          string | Date;
  /** ISO-8601 or Date */
  updatedAt?:          string | Date;
}

/**
 * Flattened, client-ready shape after adapters have normalised API data.
 * Used by UI components that don't need the full `Property` discriminated
 * union. Prefer `Property` for business logic; prefer this for rendering.
 */
export interface NormalizedProperty {
  id:                  string;
  title:               string;
  description:         string;
  price:               number;
  location:            LocationData;
  images:              readonly string[];
  verified:            boolean;
  type:                string;
  category:            PropertyCategory;
  features:            PropertyFeatures;
  status:              PropertyStatus;
  /** ISO-8601 */
  createdAt:           string;
  /** ISO-8601 */
  updatedAt?:          string;
  /** 0–100 */
  trustScore?:         number;
  verificationStatus?: VerificationStatus;
  owner?:              NormalizedOwner;
  coordinates?:        Coordinates;
  viewCount?:          number;
  favoriteCount?:      number;
  isFeatured?:         boolean;
  landVerification?:   LandVerificationStatus;
  aiVerification?:     AIVerificationResults;
}