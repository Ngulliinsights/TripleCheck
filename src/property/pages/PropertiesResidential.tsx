import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  startTransition,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import { Button } from "../../shared/components/ui/button";
import { Badge } from "../../shared/components/ui/badge";
import { Input } from "../../shared/components/ui/input";
import {
  Search,
  MapPin,
  Home,
  Bed,
  Bath,
  Shield,
  SlidersHorizontal,
  Heart,
  Share2,
  Grid,
  List,
  Wifi,
  Zap,
} from "lucide-react";
import { Skeleton } from "../../shared/components/ui/skeleton";
import ListingCard from "../components/ListingCard";
import { usePerformanceMonitor } from "../utils/performanceMonitor";
import PerformanceTestPanel from "../components/PerformanceTestPanel";

import { Property } from "../../shared/types/property";

// Enhanced property interface for residential properties
interface ResidentialProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  type:
    | "apartment"
    | "house"
    | "duplex"
    | "penthouse"
    | "studio"
    | "townhouse"
    | "villa";
  bedrooms: number;
  bathrooms: number;
  size: number;
  parking: number;
  yearBuilt: number;
  features: string[];
  amenities: string[];
  status: "for-sale" | "for-rent" | "sold" | "rented";
  verified: boolean;
  rating: number;
  views: number;
  furnished: boolean;
  petFriendly: boolean;
}

// Enhanced filter interface with better type safety
interface ResidentialFilters {
  readonly query: string;
  readonly location: string;
  readonly propertyType: string;
  readonly priceMin: number | null;
  readonly priceMax: number | null;
  readonly bedrooms: number | null;
  readonly bathrooms: number | null;
  readonly furnished: boolean | null;
  readonly parking: boolean;
  readonly verified: boolean;
}

// Sort options type
type SortOption = "newest" | "price-asc" | "price-desc" | "rating" | "views";

// Adapter function to convert ResidentialProperty to Property interface
const adaptResidentialPropertyToProperty = (
  residentialProperty: ResidentialProperty
): Property => ({
  id: residentialProperty.id,
  title: residentialProperty.title,
  description: residentialProperty.description,
  location: residentialProperty.location,
  price: residentialProperty.price,
  images: residentialProperty.images,
  features: {
    bedrooms: residentialProperty.bedrooms,
    bathrooms: residentialProperty.bathrooms,
    squareFeet: residentialProperty.size,
    parkingSpaces: residentialProperty.parking,
    yearBuilt: residentialProperty.yearBuilt,
    amenities: residentialProperty.amenities,
    propertyType: residentialProperty.type,
    petFriendly: residentialProperty.petFriendly,
    furnished: residentialProperty.furnished,
  },
  status: residentialProperty.verified ? "verified" : "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

type ViewMode = "grid" | "list";

// Constants moved outside component to prevent recreation on each render
const RESIDENTIAL_TYPES = [
  { value: "apartment", label: "Apartments", count: "1,200+" },
  { value: "house", label: "Houses", count: "450+" },
  { value: "villa", label: "Villas", count: "120+" },
  { value: "townhouse", label: "Townhouses", count: "80+" },
  { value: "penthouse", label: "Penthouses", count: "25+" },
] as const;

const POPULAR_AREAS = [
  "Westlands",
  "Karen",
  "Kilimani",
  "Lavington",
  "Runda",
  "Kileleshwa",
  "South B",
  "South C",
  "Parklands",
  "Upperhill",
  "Riverside",
  "Gigiri",
] as const;

// Default filters constant to prevent recreation
const DEFAULT_FILTERS: ResidentialFilters = {
  query: "",
  location: "",
  propertyType: "",
  priceMin: null,
  priceMax: null,
  bedrooms: null,
  bathrooms: null,
  furnished: null,
  parking: false,
  verified: false,
};

// Enhanced mock data with comprehensive residential properties
const MOCK_PROPERTIES: ResidentialProperty[] = [
  {
    id: "RES-001",
    title: "Luxury 3-Bedroom Apartment - Kilimani",
    description:
      "Stunning luxury apartment with breathtaking city views in the heart of Kilimani.",
    type: "apartment",
    location: "Kilimani, Nairobi",
    price: 18000000,
    bedrooms: 3,
    bathrooms: 3,
    size: 180,
    parking: 2,
    yearBuilt: 2020,
    images: ["/assets/apartment-luxury-1.jpg"],
    features: [
      "City View",
      "Balcony",
      "Walk-in Closet",
      "En-suite Bathrooms",
      "Modern Kitchen",
    ],
    amenities: [
      "Swimming Pool",
      "Gym",
      "24/7 Security",
      "Backup Generator",
      "Elevator",
    ],
    status: "for-sale",
    verified: true,
    rating: 4.9,
    views: 2341,
    furnished: true,
    petFriendly: false,
  },
  {
    id: "RES-002",
    title: "Modern 4-Bedroom Duplex - Karen",
    description:
      "Contemporary duplex in a serene gated community with excellent facilities.",
    type: "duplex",
    location: "Karen, Nairobi",
    price: 25000000,
    bedrooms: 4,
    bathrooms: 4,
    size: 280,
    parking: 3,
    yearBuilt: 2019,
    images: ["/assets/duplex-modern-1.jpg"],
    features: [
      "Master Suite",
      "Guest Room",
      "Study Room",
      "Spacious Living Area",
      "Modern Fixtures",
    ],
    amenities: [
      "Private Garden",
      "Security",
      "Backup Power",
      "Water Treatment",
      "Parking",
    ],
    status: "for-sale",
    verified: true,
    rating: 4.7,
    views: 1876,
    furnished: false,
    petFriendly: true,
  },
  {
    id: "RES-003",
    title: "Cozy 2-Bedroom Apartment - Westlands",
    description:
      "Perfect apartment for young professionals in the business district.",
    type: "apartment",
    location: "Westlands, Nairobi",
    price: 750000,
    bedrooms: 2,
    bathrooms: 2,
    size: 120,
    parking: 1,
    yearBuilt: 2018,
    images: ["/assets/apartment-cozy-1.jpg"],
    features: [
      "City View",
      "Open Plan",
      "Modern Kitchen",
      "Air Conditioning",
      "Fitted Wardrobes",
    ],
    amenities: ["Gym", "Security", "Elevator", "Backup Generator", "Parking"],
    status: "for-rent",
    verified: true,
    rating: 4.5,
    views: 1234,
    furnished: true,
    petFriendly: false,
  },
  {
    id: "RES-004",
    title: "Executive 5-Bedroom House - Runda",
    description:
      "Exclusive executive home in prestigious Runda with premium amenities.",
    type: "house",
    location: "Runda, Nairobi",
    price: 95000000,
    bedrooms: 5,
    bathrooms: 6,
    size: 450,
    parking: 4,
    yearBuilt: 2021,
    images: ["/assets/house-executive-1.jpg"],
    features: [
      "Master Suite",
      "Guest Rooms",
      "Home Office",
      "Entertainment Room",
      "Wine Cellar",
    ],
    amenities: [
      "Private Pool",
      "Garden",
      "Security",
      "Generator",
      "Staff Quarters",
    ],
    status: "for-sale",
    verified: true,
    rating: 5.0,
    views: 3456,
    furnished: true,
    petFriendly: true,
  },
  {
    id: "RES-005",
    title: "Stylish Studio Apartment - Kileleshwa",
    description:
      "Compact and efficient studio perfect for singles or young couples.",
    type: "studio",
    location: "Kileleshwa, Nairobi",
    price: 380000,
    bedrooms: 1,
    bathrooms: 1,
    size: 45,
    parking: 1,
    yearBuilt: 2020,
    images: ["/assets/studio-stylish-1.jpg"],
    features: [
      "Open Plan",
      "Modern Fixtures",
      "Kitchenette",
      "Large Windows",
      "Storage Space",
    ],
    amenities: [
      "Security",
      "Backup Power",
      "Water Supply",
      "Parking",
      "Laundry",
    ],
    status: "for-rent",
    verified: true,
    rating: 4.3,
    views: 892,
    furnished: true,
    petFriendly: false,
  },
  {
    id: "RES-006",
    title: "Elegant 3-Bedroom Penthouse - Upper Hill",
    description:
      "Ultra-luxury penthouse with stunning city views in Upper Hill.",
    type: "penthouse",
    location: "Upper Hill, Nairobi",
    price: 60000000,
    bedrooms: 3,
    bathrooms: 4,
    size: 320,
    parking: 3,
    yearBuilt: 2022,
    images: ["/assets/penthouse-elegant-1.jpg"],
    features: [
      "Panoramic Views",
      "Private Terrace",
      "Jacuzzi",
      "Smart Home",
      "Premium Finishes",
    ],
    amenities: ["Concierge", "Spa", "Gym", "Pool", "Valet Parking"],
    status: "for-sale",
    verified: true,
    rating: 4.8,
    views: 2789,
    furnished: true,
    petFriendly: true,
  },
];

// Optimized API function with better error handling and typing
const fetchResidentialProperties = async (
  filters: ResidentialFilters,
  signal?: AbortSignal
): Promise<ResidentialProperty[]> => {
  // Check for cancellation before starting
  if (signal?.aborted) {
    throw new Error("Request was cancelled");
  }

  // Simulate network delay with cancellation support
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, 1000);

    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(timeout);
        reject(new Error("Request was cancelled"));
      });
    }
  });

  // Check for cancellation after delay
  if (signal?.aborted) {
    throw new Error("Request was cancelled");
  }

  try {
    // In a real implementation, this would make an actual API call
    // For now, return filtered mock data based on the filters
    let filteredProperties = [...MOCK_PROPERTIES];

    // Apply comprehensive filtering logic
    if (filters.query) {
      const queryLower = filters.query.toLowerCase();
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.title.toLowerCase().includes(queryLower) ||
          property.description.toLowerCase().includes(queryLower) ||
          property.location.toLowerCase().includes(queryLower)
      );
    }

    if (filters.location) {
      filteredProperties = filteredProperties.filter((property) =>
        property.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.propertyType) {
      filteredProperties = filteredProperties.filter(
        (property) => property.type === filters.propertyType
      );
    }

    if (filters.bedrooms !== null) {
      filteredProperties = filteredProperties.filter(
        (property) => property.bedrooms >= filters.bedrooms!
      );
    }

    if (filters.bathrooms !== null) {
      filteredProperties = filteredProperties.filter(
        (property) => property.bathrooms >= filters.bathrooms!
      );
    }

    if (filters.priceMin !== null) {
      filteredProperties = filteredProperties.filter(
        (property) => property.price >= filters.priceMin!
      );
    }

    if (filters.priceMax !== null) {
      filteredProperties = filteredProperties.filter(
        (property) => property.price <= filters.priceMax!
      );
    }

    if (filters.furnished !== null) {
      filteredProperties = filteredProperties.filter(
        (property) => property.furnished === filters.furnished
      );
    }

    if (filters.parking) {
      filteredProperties = filteredProperties.filter(
        (property) => property.parking > 0
      );
    }

    if (filters.verified) {
      filteredProperties = filteredProperties.filter(
        (property) => property.verified
      );
    }

    return filteredProperties;
  } catch (error) {
    throw new Error("Failed to fetch properties. Please try again.");
  }
};

// Main component with proper TypeScript interfaces
interface ResidentialPropertiesProps {
  className?: string;
}

const ResidentialProperties: React.FC<ResidentialPropertiesProps> = ({
  className,
}) => {
  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor("ResidentialProperties");

  // State management with proper typing
  const [filters, setFilters] = useState<ResidentialFilters>(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] =
    useState<ResidentialFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track renders for performance monitoring
  useEffect(() => {
    performanceMonitor.trackRender();
  });

  // Debounce filters to prevent excessive API calls
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters]);

  // Memoized query key to prevent unnecessary re-renders
  const queryKey = useMemo(
    () => ["residential-properties", JSON.stringify(debouncedFilters)],
    [debouncedFilters]
  );

  // React Query for data fetching with proper error handling and race condition protection
  const {
    data: rawProperties = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      // Track API call for performance monitoring
      performanceMonitor.trackApiCall(debouncedFilters);

      // Use React Query's built-in signal for proper cancellation
      return fetchResidentialProperties(debouncedFilters, signal);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: false, // Prevent refetch on component mount if data exists
    retry: (failureCount, error) => {
      // Don't retry if request was cancelled
      if (error?.message === "Request was cancelled") {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // No manual cleanup needed - React Query handles cancellation automatically

  // Memoized sorted properties
  const properties = useMemo(() => {
    const sorted = [...rawProperties];

    switch (sortBy) {
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "views":
        return sorted.sort((a, b) => b.views - a.views);
      case "newest":
      default:
        return sorted.sort((a, b) => b.yearBuilt - a.yearBuilt);
    }
  }, [rawProperties, sortBy]);

  // Optimized filter update function using useCallback
  const updateFilter = useCallback(
    <K extends keyof ResidentialFilters>(
      key: K,
      value: ResidentialFilters[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Memoized filter reset function
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Memoized toggle function for filters visibility
  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  // View mode toggle function
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Property click handler - avoid full page reload
  const handlePropertyClick = useCallback((property: ResidentialProperty) => {
    // TODO: Navigate to property details page using React Router
    // For now, we'll use console.log to avoid page reload performance issues
    console.log("Navigate to property:", property.id);
    // window.location.href = `/properties/${property.id}`;
  }, []);

  // Memoized property type options for better performance
  const propertyTypeOptions = useMemo(
    () =>
      RESIDENTIAL_TYPES.map((type) => (
        <Badge
          key={type.value}
          variant={filters.propertyType === type.value ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() =>
            updateFilter(
              "propertyType",
              filters.propertyType === type.value ? "" : type.value
            )
          }
        >
          {type.label} ({type.count})
        </Badge>
      )),
    [filters.propertyType, updateFilter]
  );

  // Memoized popular areas for better performance
  const popularAreaOptions = useMemo(
    () =>
      POPULAR_AREAS.map((area) => (
        <Badge
          key={area}
          variant={filters.location === area ? "default" : "outline"}
          className="cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() =>
            updateFilter("location", filters.location === area ? "" : area)
          }
        >
          {area}
        </Badge>
      )),
    [filters.location, updateFilter]
  );

  // Handle number input changes with proper type checking
  const handleNumberInput = useCallback(
    (
      key: "priceMin" | "priceMax" | "bedrooms" | "bathrooms",
      value: string
    ) => {
      const numValue = value === "" ? null : Number(value);
      if (numValue !== null && (isNaN(numValue) || numValue < 0)) return;
      updateFilter(key, numValue);
    },
    [updateFilter]
  );

  // Error handling component
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error instanceof Error ?
                error.message
              : "Failed to load properties"}
            </p>
            <Button onClick={() => void refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${className || ""}`}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-secondary/10 via-primary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-secondary/10 rounded-full">
                <Home className="w-12 h-12 text-secondary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Residential Properties
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Find your perfect home from our curated collection of residential
              properties. From cozy apartments to luxury penthouses across
              Kenya&apos;s prime locations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-medium">
                  Verified Properties
                </span>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                <Wifi className="w-5 h-5 text-blue-600" />
                <span className="text-blue-600 font-medium">
                  Modern Amenities
                </span>
              </div>
              <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full">
                <Zap className="w-5 h-5 text-purple-600" />
                <span className="text-purple-600 font-medium">
                  Move-in Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Development Performance Monitor - Only show in development */}
        {import.meta.env.MODE === "development" && (
          <PerformanceTestPanel className="mb-6" />
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Main Search Bar */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties, locations, or keywords..."
                  value={filters.query}
                  onChange={(e) => updateFilter("query", e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={toggleFilters}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Property Type Quick Filters */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Property Types</h4>
              <div className="flex flex-wrap gap-2">{propertyTypeOptions}</div>
            </div>

            {/* Popular Areas Quick Filters */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Popular Areas
              </h4>
              <div className="flex flex-wrap gap-2">{popularAreaOptions}</div>
            </div>

            {/* Advanced Filters (Collapsible) */}
            {showFilters && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Min Price (KSH)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.priceMin ?? ""}
                      onChange={(e) =>
                        handleNumberInput("priceMin", e.target.value)
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Max Price (KSH)
                    </label>
                    <Input
                      type="number"
                      placeholder="No limit"
                      value={filters.priceMax ?? ""}
                      onChange={(e) =>
                        handleNumberInput("priceMax", e.target.value)
                      }
                      min="0"
                    />
                  </div>

                  {/* Bedrooms & Bathrooms */}
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Bed className="h-3 w-3" />
                      Min Bedrooms
                    </label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={filters.bedrooms ?? ""}
                      onChange={(e) =>
                        handleNumberInput("bedrooms", e.target.value)
                      }
                      min="0"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Bath className="h-3 w-3" />
                      Min Bathrooms
                    </label>
                    <Input
                      type="number"
                      placeholder="Any"
                      value={filters.bathrooms ?? ""}
                      onChange={(e) =>
                        handleNumberInput("bathrooms", e.target.value)
                      }
                      min="0"
                      max="10"
                    />
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.furnished === true}
                      onChange={(e) =>
                        updateFilter(
                          "furnished",
                          e.target.checked ? true : null
                        )
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Furnished Only</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.parking}
                      onChange={(e) =>
                        updateFilter("parking", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Parking Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.verified}
                      onChange={(e) =>
                        updateFilter("verified", e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Verified Only
                    </span>
                  </label>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <Button variant="ghost" onClick={resetFilters} size="sm">
                    Clear All Filters
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {properties.length} properties found
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Available Properties ({isLoading ? "..." : properties.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-1 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Sort properties by"
                  title="Sort properties by"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="views">Most Viewed</option>
                </select>

                {/* View Mode Toggle */}
                <div className="flex bg-muted rounded-md p-1 mr-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("grid")}
                    className="px-3"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("list")}
                    className="px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ?
              // Loading skeleton
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            : properties.length === 0 ?
              // No results state
              <div className="text-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No properties found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={resetFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
              // Property grid/list
            : <div
                className={
                  viewMode === "grid" ?
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
                }
              >
                {properties.map((property) => (
                  <ListingCard
                    key={property.id}
                    property={adaptResidentialPropertyToProperty(property)}
                    className={
                      viewMode === "list" ? "flex flex-row max-w-none" : ""
                    }
                    onClick={() => handlePropertyClick(property)}
                  />
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResidentialProperties;
