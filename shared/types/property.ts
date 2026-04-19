// Legacy Property interface - maintained for backward compatibility
export interface Property {
  id: number | string; // Allow both for API compatibility
  title: string;
  description: string;
  location: string | LocationData;
  address?: string | null | undefined; // Optional since not always present in API
  price: string | number; // Allow both for API compatibility
  coordinates?: Coordinates | null | undefined; // Optional since not always present in API
  imageUrls?: string[] | undefined; // Optional, API uses 'images'
  images?: string[] | undefined; // API field name
  verificationStatus?:
  | "verified"
  | "pending"
  | "unverified"
  | "draft"
  | undefined;
  features?: PropertyFeatures | null | undefined;
  ownerId?: string | undefined;
  aiVerificationResults?: AIVerificationResults | null | undefined;
  viewCount?: number | undefined;
  favoriteCount?: number | undefined;
  isActive?: boolean | undefined;
  isFeatured?: boolean | undefined;
  availableFrom?: Date | string | null | undefined;
  availableUntil?: Date | string | null | undefined;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  // Extended properties for frontend use
  landVerification?: LandVerificationStatus | undefined;
  trustScore?: number | undefined;
  owner?:
  | {
    id: string;
    username: string;
    email: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    trustScore: number;
    isVerifiedAgent: boolean;
  }
  | undefined;
  // Additional fields that might be present in API responses
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  size?: number | undefined;
  area?: number | undefined;
  type?: string | undefined;
  propertyType?: string | undefined;
  status?: string | undefined;
  amenities?: string[] | undefined;
}

// Enhanced normalized property interface for new architecture
export interface NormalizedProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  verified: boolean;
  type: string;
  category: "residential" | "commercial" | "land";
  features: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  status: "available" | "under-offer" | "sold" | "rented" | "pending";
  rating?: number;
  views?: number;
  trustScore?: number;
  verificationStatus?: "verified" | "pending" | "unverified" | "flagged";
  owner?: PropertyOwner;
  coordinates?: Coordinates;
}

// Property owner interface
export interface PropertyOwner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  trustScore: number;
  isVerifiedAgent: boolean;
  avatar?: string;
}

// Property-specific interfaces extending NormalizedProperty
export interface ResidentialProperty extends NormalizedProperty {
  category: "residential";
  type:
  | "apartment"
  | "house"
  | "duplex"
  | "penthouse"
  | "studio"
  | "townhouse"
  | "villa";
  features: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    parkingSpaces?: number;
    yearBuilt?: number;
    amenities?: string[];
    furnished?: boolean;
    petFriendly?: boolean;
    balcony?: boolean;
    garden?: boolean;
    [key: string]: any;
  };
}

export interface CommercialProperty extends NormalizedProperty {
  category: "commercial";
  type: "office" | "retail" | "warehouse" | "industrial" | "mixed-use";
  features: {
    size: number; // in square feet
    yearBuilt: number;
    occupancyRate?: number;
    roi?: number;
    parkingSpaces?: number;
    floors?: number;
    elevators?: number;
    airConditioning?: boolean;
    security?: boolean;
    loadingDock?: boolean;
    [key: string]: any;
  };
}

export interface LandProperty extends NormalizedProperty {
  category: "land";
  type: "agricultural" | "residential" | "commercial" | "industrial";
  features: {
    size: string; // e.g., "2.5 acres", "1000 sqm"
    soilType?: string;
    waterAccess?: boolean;
    roadAccess?: boolean;
    electricityAccess?: boolean;
    zoning?: string;
    developmentPotential?: string;
    titleDeedStatus?: "available" | "pending" | "missing";
    topography?: string;
    drainage?: string;
    [key: string]: any;
  };
}

export interface LocationData {
  address: string;
  city?: string | undefined;
  state: string;
  country: string;
  coordinates?: Coordinates | undefined;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PropertyFeatures {
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  squareFeet?: number | undefined;
  parkingSpaces?: number | undefined;
  yearBuilt?: number | undefined;
  amenities?: string[] | undefined;
  propertyType?: string | undefined;
  petFriendly?: boolean | undefined;
  furnished?: boolean | undefined;
  // Allow additional dynamic properties from API
  [key: string]: unknown;
}

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

export interface LandVerificationStatus {
  sessionId?: string | undefined;
  status: "not_started" | "in_progress" | "completed" | "suspended" | "failed";
  overallRiskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: number;
  completedLayers: string[];
  lastUpdated: Date;
  badge?: LandVerificationBadge | undefined;
}

export interface LandVerificationBadge {
  type: "verified" | "in_progress" | "high_risk" | "expert_required";
  label: string;
  color: "green" | "blue" | "red" | "orange";
  description: string;
}

// Filter interfaces for different property types
export type PropertySearchFilters = BasePropertyFilters;

export interface BasePropertyFilters {
  query: string;
  location: string;
  priceMin: number | null;
  priceMax: number | null;
  verified: boolean;
  category?: "residential" | "commercial" | "land" | null;
}

export interface ResidentialFilters extends Omit<BasePropertyFilters, 'category'> {
  category: "residential";
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string;
  amenities: string[];
  furnished?: boolean;
  petFriendly?: boolean;
}

export interface CommercialFilters extends Omit<BasePropertyFilters, 'category'> {
  category: "commercial";
  propertyType: string;
  sizeMin: number | null;
  sizeMax: number | null;
  yearBuiltMin: number | null;
  roiMin: number | null;
  // Commercial-specific properties
  commercialType: string;
  businessZone: string;
  areaMin: string;
  areaMax: string;
  floorsMin: string;
  floorsMax: string;
  // Amenities
  parking: boolean;
  elevator: boolean;
  airConditioning: boolean;
  security: boolean;
  wifi: boolean;
  generator: boolean;
}

export interface LandFilters extends BasePropertyFilters {
  category: "land";
  landType: string;
  sizeMin: string;
  sizeMax: string;
  waterAccess: boolean;
  roadAccess: boolean;
  electricityAccess: boolean;
}

// Configuration interfaces for property type system
export interface PropertyTypeConfig<
  TFilters extends BasePropertyFilters,
  TProperty,
> {
  title: string;
  description: string;
  queryKey: string[];
  defaultFilters: TFilters;
  fetcher: (
    filters: TFilters,
    page: number,
    pageSize: number
  ) => Promise<{
    items: TProperty[];
    totalCount: number;
    totalPages: number;
  }>;
  adapter: (item: TProperty) => NormalizedProperty;
  filterComponent: React.ComponentType<{
    filters: TFilters;
    onChange: (filters: TFilters) => void;
    onReset: () => void;
    errors?: Record<string, string>;
  }>;
  cardComponent: React.ComponentType<{
    property: NormalizedProperty;
    onClick?: (property: NormalizedProperty) => void;
    className?: string;
  }>;
}

// View and sort options
export type ViewMode = "grid" | "list";
export type SortOption =
  | "newest"
  | "oldest"
  | "price-low"
  | "price-high"
  | "rating"
  | "views";

// Property adapter utility type
export type PropertyAdapter<T> = (item: T) => NormalizedProperty;

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Property search and pagination types
export interface PropertySearchParams {
  filters: BasePropertyFilters;
  page: number;
  pageSize: number;
  sortBy: SortOption;
}

export interface PropertySearchResponse<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Raw Land Property interface - used as input for normalization
export interface RawLandProperty {
  id: string;
  title: string;
  description: string;
  location: string | { address: string };
  price: number;
  originalPrice?: number;
  size: string;
  images: string[];
  verificationStatus: "verified" | "pending" | "unverified" | "flagged";
  trustScore: number;
  landType: "agricultural" | "residential" | "commercial" | "industrial";
  titleDeedStatus: "available" | "pending" | "missing";
  lastVerified?: string;
  riskLevel: "low" | "medium" | "high";
  features?: {
    soilType?: string;
    waterAccess?: boolean;
    roadAccess?: boolean;
    electricityAccess?: boolean;
    zoning?: string;
    developmentPotential?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
  };
  dateAdded?: Date;
  viewCount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  type?: "commercial" | "residential";
}
