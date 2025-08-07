/* The mock-data export is intentionally static for development purposes. */

// PropertiesResidential.tsx – Final Unified & Optimized
// ---------------------------------------------------
// • Pagination, debounced filters, React-Query caching
// • Rich hero, skeleton loaders, grid/list view, compare context
// • 100 % strict TypeScript + ESLint clean
import { useQuery } from "@tanstack/react-query";
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
import React, { useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { EnterpriseVirtualizedList, GridVirtualizedList } from "../../shared/components";
import { Pagination } from "../../shared/components/Pagination";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import { Input } from "../../shared/components/ui/input";
import { Skeleton } from "../../shared/components/ui/skeleton";
import { useComponentPerformance } from "../../shared/hooks/useComponentPerformance";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { usePropertyListVirtualization, usePropertyGridVirtualization } from "../../shared/hooks/useVirtualizationHelpers";
import { Property } from "../../shared/types/property";
import { CompareBar } from "../components/CompareBar";
import { CompareModal } from "../components/CompareModal";
import ListingCard from "../components/ListingCard";
import { CompareProvider } from "../contexts/CompareContext";

// ------------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------------
const ERROR_CANCELLED = "Request was cancelled";
const ERROR_GENERIC = "Failed to fetch properties. Please try again.";
const QUERY_KEY = "residential-properties";
const ITEMS_PER_PAGE = 12;
const DEBOUNCE_DELAY = 300;

const SWIMMING_POOL = "Swimming Pool";
const SECURITY_24_7 = "24/7 Security";
const BACKUP_GENERATOR = "Backup Generator";

// ------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------
type ResidentialPropertyType =
  | "apartment"
  | "house"
  | "duplex"
  | "penthouse"
  | "studio"
  | "townhouse"
  | "villa";

interface ResidentialProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  type: ResidentialPropertyType;
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

interface ResidentialFilters {
  query: string;
  location: string;
  propertyType: string;
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  furnished: boolean | null;
  parking: boolean;
  verified: boolean;
}

type SortOption = "newest" | "price-asc" | "price-desc" | "rating" | "views";
type ViewMode = "grid" | "list";

// ------------------------------------------------------------------
// STATIC DATA (unchanged)
// ------------------------------------------------------------------
export const MOCK_PROPERTIES: ResidentialProperty[] = [
  {
    id: "RES-001",
    title: "Luxury 3-Bedroom Apartment - Kilimani",
    description:
      "Stunning luxury apartment with breathtaking city views in the heart of Kilimani.",
    type: "apartment",
    location: "Kilimani, Nairobi",
    price: 18_000_000,
    bedrooms: 3,
    bathrooms: 3,
    size: 180,
    parking: 2,
    yearBuilt: 2020,
    images: [
      "/assets/Residential/alejandra-cifre-gonzalez-ylyn5r4vxcA-unsplash.jpg",
    ],
    features: [
      "City View",
      "Balcony",
      "Walk-in Closet",
      "En-suite Bathrooms",
      "Modern Kitchen",
    ],
    amenities: [
      SWIMMING_POOL,
      "Gym",
      SECURITY_24_7,
      BACKUP_GENERATOR,
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
    price: 25_000_000,
    bedrooms: 4,
    bathrooms: 4,
    size: 280,
    parking: 3,
    yearBuilt: 2019,
    images: ["/assets/Residential/billy-jo-catbagan-ysUyvjCocWo-unsplash.jpg"],
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
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `RES-${String(i + 3).padStart(3, "0")}`,
    title: `Property ${i + 3} - ${["Westlands", "Karen", "Kilimani", "Lavington"][i % 4]}`,
    description: `Beautiful residential property with modern amenities in ${["Westlands", "Karen", "Kilimani", "Lavington"][i % 4]}.`,
    type: ["apartment", "house", "villa", "townhouse"][
      i % 4
    ] as ResidentialPropertyType,
    location: `${["Westlands", "Karen", "Kilimani", "Lavington"][i % 4]}, Nairobi`,
    price: 10_000_000 + i * 1_000_000,
    bedrooms: (i % 4) + 1,
    bathrooms: (i % 3) + 1,
    size: 100 + i * 10,
    parking: (i % 3) + 1,
    yearBuilt: 2018 + (i % 5),
    images: [
      [
        "/assets/Residential/caroline-badran-aaONSK4BKxc-unsplash.jpg",
        "/assets/Residential/caroline-badran-nf7iKpydFR4-unsplash.jpg",
        "/assets/Residential/caroline-badran-OZIdKtn8pKs-unsplash.jpg",
        "/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg",
        "/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg",
        "/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg",
        "/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg",
        "/assets/Residential/jason-briscoe-AQl-J19ocWE-unsplash.jpg",
        "/assets/Residential/joel-filipe-RFDP7_80v5A-unsplash.jpg",
        "/assets/Residential/krzysztof-hepner-V7Q0Oh3Az-c-unsplash.jpg",
        "/assets/Residential/luke-van-zyl-koH7IVuwRLw-unsplash.jpg",
        "/assets/Residential/michael-oxendine-GHCVUtBECuY-unsplash (1).jpg",
        "/assets/Residential/rebecca-chandler-z6Yn9hhlrJw-unsplash.jpg",
        "/assets/Residential/sebastien-lavalaye-gNY6RsMIsPo-unsplash.jpg",
        "/assets/Residential/terrah-holly-pmhdkgRCbtE-unsplash.jpg",
        "/assets/Residential/webaliser-_TPTXZd9mOo-unsplash.jpg",
      ][i % 16] || "/assets/Residential/caroline-badran-aaONSK4BKxc-unsplash.jpg",
    ],
    features: ["Modern Kitchen", "Balcony"],
    amenities: ["Security", "Parking"],
    status: i % 2 === 0 ? ("for-sale" as const) : ("for-rent" as const),
    verified: i % 3 === 0,
    rating: 3.5 + (i % 3) * 0.5,
    views: 50 + i * 10,
    furnished: i % 2 === 0,
    petFriendly: i % 3 === 0,
  })),
];

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

// ------------------------------------------------------------------
// API
// ------------------------------------------------------------------
interface FetchResult {
  properties: ResidentialProperty[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const fetchResidentialProperties = async (
  filters: ResidentialFilters,
  page: number,
  sortBy: SortOption,
  signal?: AbortSignal
): Promise<FetchResult> => {
  if (signal?.aborted) throw new Error(ERROR_CANCELLED);

  await new Promise((resolve, reject) => {
    const t = setTimeout(resolve, 500);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error(ERROR_CANCELLED));
    });
  });

  let data = [...MOCK_PROPERTIES];

  // filters
  if (filters.query) {
    const q = filters.query.toLowerCase();
    data = data.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    );
  }
  if (filters.location)
    data = data.filter((p) =>
      p.location.toLowerCase().includes(filters.location.toLowerCase())
    );
  if (filters.propertyType && filters.propertyType !== "all")
    data = data.filter((p) => p.type === filters.propertyType);
  if (filters.priceMin !== null)
    data = data.filter((p) => p.price >= (filters.priceMin ?? 0));
  if (filters.priceMax !== null)
    data = data.filter((p) => p.price <= (filters.priceMax ?? Infinity));
  if (filters.bedrooms !== null)
    data = data.filter((p) => p.bedrooms >= (filters.bedrooms ?? 0));
  if (filters.bathrooms !== null)
    data = data.filter((p) => p.bathrooms >= (filters.bathrooms ?? 0));
  if (filters.verified) data = data.filter((p) => p.verified);
  if (filters.furnished !== null)
    data = data.filter((p) => p.furnished === filters.furnished);
  if (filters.parking) data = data.filter((p) => p.parking > 0);

  // sort
  switch (sortBy) {
    case "price-asc":
      data.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      data.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      data.sort((a, b) => b.rating - a.rating);
      break;
    case "views":
      data.sort((a, b) => b.views - a.views);
      break;
    case "newest":
    default:
      data.sort((a, b) => b.yearBuilt - a.yearBuilt);
      break;
  }

  const totalCount = data.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE; // Convert to 0-indexed for slicing
  const end = start + ITEMS_PER_PAGE;
  const properties = data.slice(start, end);

  return {
    properties,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: end < totalCount,
    hasPreviousPage: page > 1, // 1-indexed comparison
  };
};

// ------------------------------------------------------------------
// UTILS
// ------------------------------------------------------------------
const adaptResidentialPropertyToProperty = (
  p: ResidentialProperty
): Property => ({
  id: p.id,
  title: p.title,
  description: p.description,
  location: p.location,
  price: p.price,
  images: p.images,
  features: {
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    squareFeet: p.size,
    parkingSpaces: p.parking,
    yearBuilt: p.yearBuilt,
    amenities: p.amenities,
    propertyType: p.type,
    petFriendly: p.petFriendly,
    furnished: p.furnished,
  },
  status: p.verified ? "verified" : "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// ------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------
interface ResidentialPropertiesProps {
  className?: string;
}
const ResidentialProperties: React.FC<ResidentialPropertiesProps> = ({
  className,
}) => {
  const { trackApiCall } = useComponentPerformance("ResidentialProperties");
  const navigate = useNavigate();

  // state
  const [filters, setFilters] = useState<ResidentialFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const debouncedFilters = useDebounce(filters, DEBOUNCE_DELAY);

  // query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, debouncedFilters, page, sortBy],
    queryFn: ({ signal }) => {
      trackApiCall(debouncedFilters);
      return fetchResidentialProperties(debouncedFilters, page, sortBy, signal);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (c, e) => e?.message !== ERROR_CANCELLED && c < 2,
  });

  // ----------------------------------------------------------------
  // handlers (memoized)
  // ----------------------------------------------------------------
  const handleFilterChange = useCallback(
    <K extends keyof ResidentialFilters>(
      key: K,
      value: ResidentialFilters[K]
    ) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);
  const toggleFilters = useCallback(() => setShowFilters((prev) => !prev), []);
  const handleNumber = useCallback(
    (key: "priceMin" | "priceMax" | "bedrooms" | "bathrooms", v: string) => {
      const n = v === "" ? null : Number(v);
      if (n !== null && (Number.isNaN(n) || n < 0)) return;

      // Safe object update without dynamic property access
      const safeFilters = { ...filters };
      switch (key) {
        case "priceMin":
          safeFilters.priceMin = n;
          break;
        case "priceMax":
          safeFilters.priceMax = n;
          break;
        case "bedrooms":
          safeFilters.bedrooms = n;
          break;
        case "bathrooms":
          safeFilters.bathrooms = n;
          break;
      }
      setFilters(safeFilters);
      setPage(1);
    },
    [filters]
  );
  const handleViewMode = useCallback((m: ViewMode) => setViewMode(m), []);
  const handlePropertyClick = useCallback(
    (p: ResidentialProperty) => navigate(`/property/${p.id}`),
    [navigate]
  );

  // ----------------------------------------------------------------
  // memoized UI helpers
  // ----------------------------------------------------------------
  const typeBadges = useMemo(
    () =>
      RESIDENTIAL_TYPES.map((t) => (
        <Badge
          key={t.value}
          variant={filters.propertyType === t.value ? "default" : "outline"}
          className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:bg-primary/10"
          onClick={() =>
            handleFilterChange(
              "propertyType",
              filters.propertyType === t.value ? "" : t.value
            )
          }
        >
          {t.label} ({t.count})
        </Badge>
      )),
    [filters.propertyType, handleFilterChange]
  );

  const areaBadges = useMemo(
    () =>
      POPULAR_AREAS.map((a) => (
        <Badge
          key={a}
          variant={filters.location === a ? "default" : "outline"}
          className="cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:bg-primary/10"
          onClick={() =>
            handleFilterChange("location", filters.location === a ? "" : a)
          }
        >
          {a}
        </Badge>
      )),
    [filters.location, handleFilterChange]
  );

  // ----------------------------------------------------------------
  // render helpers
  // ----------------------------------------------------------------
  const renderPropertiesContent = () => {
    if (!data?.properties.length) {
      return (
        <div className="text-center py-12">
          <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No properties found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters.
          </p>
          <Button onClick={resetFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="mb-4 text-sm text-gray-600">
          Showing {data.properties.length} of {data.totalCount} properties
          {data.totalPages > 1 && ` (Page ${page} of ${data.totalPages})`}
        </div>
        <VirtualizedPropertyList
          properties={data.properties}
          viewMode={viewMode}
          onPropertyClick={handlePropertyClick}
        />
        <Pagination
          currentPage={page}
          totalPages={data.totalPages}
          onPageChange={setPage}
          showPageInfo={true}
          className="mt-8"
        />
      </>
    );
  };

  // Virtualized Property List Component
  const VirtualizedPropertyList = ({ properties, viewMode, onPropertyClick }: {
    properties: ResidentialProperty[];
    viewMode: "grid" | "list";
    onPropertyClick: (property: ResidentialProperty) => void;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(600);

    // Always call hooks at the top level
    const gridProps = usePropertyGridVirtualization(
      properties,
      containerRef.current?.clientWidth || 1200,
      containerHeight,
      350, // card width
      400  // card height
    );

    const listProps = usePropertyListVirtualization(
      properties,
      containerHeight,
      200 // list item height
    );

    // Update container height based on viewport
    React.useEffect(() => {
      const updateHeight = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const availableHeight = window.innerHeight - rect.top - 100; // Leave space for pagination
          setContainerHeight(Math.max(400, availableHeight));
        }
      };

      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const renderPropertyItem = useCallback((property: ResidentialProperty, index: number, style: React.CSSProperties) => {
      const adaptedProperty = adaptResidentialPropertyToProperty(property);
      
      return (
        <div style={style} className="p-2">
          <div className={`animate-fadeInUp animate-delay-${Math.min(index, 12)}`}>
            <ListingCard
              property={adaptedProperty}
              className={
                viewMode === "list" 
                  ? "flex flex-row max-w-none"
                  : "group rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              }
              onClick={() => onPropertyClick(property)}
            />
          </div>
        </div>
      );
    }, [viewMode, onPropertyClick]);

    if (viewMode === "grid") {
      return (
        <div ref={containerRef} className="w-full">
          <GridVirtualizedList
            {...gridProps}
            renderItem={renderPropertyItem}
          />
        </div>
      );
    }

    // List view
    return (
      <div ref={containerRef} className="w-full">
        <EnterpriseVirtualizedList
          {...listProps}
          renderItem={renderPropertyItem}
        />
      </div>
    );
  };

  // ----------------------------------------------------------------
  // render
  // ----------------------------------------------------------------
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : ERROR_GENERIC}
          </p>
          <Button onClick={() => void refetch()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <CompareProvider>
      <div className={`min-h-screen bg-background ${className || ""}`}>
        {/* Hero */}
        <div className="relative isolate overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-20 bg-dot-pattern"
          />
          <div className="container mx-auto px-4 py-20 md:py-28 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-secondary/20 rounded-full">
                <Home className="w-12 h-12 text-secondary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              Residential Properties
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Find your perfect home from our curated collection across
              Kenya&apos;s prime locations.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" /> Verified Properties
              </div>
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium">
                <Wifi className="w-4 h-4" /> Modern Amenities
              </div>
              <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" /> Move-in Ready
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Filters Card */}
          <Card className="mb-6 border-muted/60 shadow-sm backdrop-blur-sm bg-card/80">
            <CardContent className="p-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search properties, locations, or keywords…"
                    value={filters.query}
                    onChange={(e) =>
                      handleFilterChange("query", e.target.value)
                    }
                    className="pl-10 rounded-full"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={toggleFilters}
                  className="flex items-center gap-2 rounded-full"
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </Button>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Property Types</h3>
                <div className="flex flex-wrap gap-2">{typeBadges}</div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Popular Areas
                </h3>
                <div className="flex flex-wrap gap-2">{areaBadges}</div>
              </div>

              {/* Expandable Advanced Filters */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  showFilters ?
                    "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t mt-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {(
                        [
                          "priceMin",
                          "priceMax",
                          "bedrooms",
                          "bathrooms",
                        ] as const
                      ).map((k) => (
                        <div key={k}>
                          <label
                            htmlFor={k}
                            className="text-sm font-medium mb-1 block"
                          >
                            {k === "priceMin" && "Min Price (KSH)"}
                            {k === "priceMax" && "Max Price (KSH)"}
                            {k === "bedrooms" && (
                              <>
                                Min <Bed className="inline w-3 h-3" /> Bedrooms
                              </>
                            )}
                            {k === "bathrooms" && (
                              <>
                                Min <Bath className="inline w-3 h-3" />{" "}
                                Bathrooms
                              </>
                            )}
                          </label>
                          <Input
                            id={k}
                            type="number"
                            placeholder={k.includes("price") ? "0" : "Any"}
                            value={(() => {
                              if (k === "priceMin") return filters.priceMin ?? "";
                              if (k === "priceMax") return filters.priceMax ?? "";
                              if (k === "bedrooms") return filters.bedrooms ?? "";
                              if (k === "bathrooms") return filters.bathrooms ?? "";
                              return "";
                            })()}
                            onChange={(e) => handleNumber(k, e.target.value)}
                            min={0}
                            className="rounded-md"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={filters.furnished === true}
                          onChange={(e) =>
                            handleFilterChange(
                              "furnished",
                              e.target.checked ? true : null
                            )
                          }
                          className="rounded"
                        />
                        Furnished Only
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={filters.parking}
                          onChange={(e) =>
                            handleFilterChange("parking", e.target.checked)
                          }
                          className="rounded"
                        />
                        Parking Required
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={filters.verified}
                          onChange={(e) =>
                            handleFilterChange("verified", e.target.checked)
                          }
                          className="rounded"
                        />
                        <Shield className="w-3 h-3" /> Verified Only
                      </label>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                      <Button variant="ghost" onClick={resetFilters} size="sm">
                        Clear All Filters
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {data?.totalCount ?? 0} properties found
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Available Properties{" "}
                  {isLoading ? "…" : `(${data?.properties.length ?? 0})`}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-1 border border-input rounded-full bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    aria-label="Sort properties by"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price ↑</option>
                    <option value="price-desc">Price ↓</option>
                    <option value="rating">Highest Rated</option>
                    <option value="views">Most Viewed</option>
                  </select>

                  <div className="flex bg-muted rounded-full p-1">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleViewMode("grid")}
                      className="px-3"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleViewMode("list")}
                      className="px-3"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ?
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3">
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
              : renderPropertiesContent()}
            </CardContent>
          </Card>
        </div>

        <CompareBar onQuickCompare={() => setShowCompareModal(true)} />
        <CompareModal
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
        />
      </div>
    </CompareProvider>
  );
};

export default ResidentialProperties;
