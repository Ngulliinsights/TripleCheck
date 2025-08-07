import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Grid,
  List,
  SlidersHorizontal,
  MapPin,
  Shield,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  DollarSign,
  BarChart3,
} from "lucide-react";
import React, { useState, useMemo, useCallback, useRef } from "react";
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

interface CommercialProperty {
  id: string;
  title: string;
  type: "office" | "retail" | "warehouse" | "industrial" | "mixed-use";
  location: string;
  price: number;
  size: number;
  yearBuilt: number;
  occupancyRate: number;
  roi: number;
  images: string[];
  features: string[];
  description: string;
  status: "available" | "under-offer" | "sold";
  verified: boolean;
  rating: number;
  views: number;
}

interface CommercialFilters {
  query: string;
  location: string;
  propertyType: string;
  priceMin: number | null;
  priceMax: number | null;
  sizeMin: number | null;
  sizeMax: number | null;
  roiMin: number | null;
  verified: boolean;
  status: string;
}

interface PropertyTypeConfig {
  value: string;
  label: string;
  icon: typeof Building2;
}

type SortOption =
  | "newest"
  | "price-desc"
  | "price-asc"
  | "roi-desc"
  | "size-desc"
  | "rating-desc";
type ViewMode = "grid" | "list";

// ------------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------------
const ERROR_CANCELLED = "Request was cancelled";
const ERROR_GENERIC = "Failed to fetch properties. Please try again.";
const QUERY_KEY = "commercial-properties";
const ITEMS_PER_PAGE = 12;
const DEBOUNCE_DELAY = 300;

const DEFAULT_FILTERS: CommercialFilters = {
  query: "",
  location: "",
  propertyType: "",
  priceMin: null,
  priceMax: null,
  sizeMin: null,
  sizeMax: null,
  roiMin: null,
  verified: false,
  status: "",
};

const COMMERCIAL_TYPES = [
  { value: "office", label: "Office", count: "45+" },
  { value: "retail", label: "Retail", count: "32+" },
  { value: "warehouse", label: "Warehouse", count: "28+" },
  { value: "industrial", label: "Industrial", count: "15+" },
  { value: "mixed-use", label: "Mixed Use", count: "12+" },
] as const;

const POPULAR_AREAS = [
  "Westlands",
  "Upper Hill",
  "Karen",
  "Kilimani",
  "Industrial Area",
  "Embakasi",
  "CBD",
  "Parklands",
] as const;

// ------------------------------------------------------------------
// API
// ------------------------------------------------------------------
interface FetchResult {
  properties: CommercialProperty[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const fetchCommercialProperties = async (
  filters: CommercialFilters,
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

  let data = [...MOCK_COMMERCIAL_PROPERTIES];

  // Apply filters
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
  if (filters.sizeMin !== null)
    data = data.filter((p) => p.size >= (filters.sizeMin ?? 0));
  if (filters.sizeMax !== null)
    data = data.filter((p) => p.size <= (filters.sizeMax ?? Infinity));
  if (filters.roiMin !== null)
    data = data.filter((p) => p.roi >= (filters.roiMin ?? 0));
  if (filters.verified) data = data.filter((p) => p.verified);
  if (filters.status && filters.status !== "all")
    data = data.filter((p) => p.status === filters.status);

  // Apply sorting
  switch (sortBy) {
    case "price-asc":
      data.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      data.sort((a, b) => b.price - a.price);
      break;
    case "roi-desc":
      data.sort((a, b) => b.roi - a.roi);
      break;
    case "size-desc":
      data.sort((a, b) => b.size - a.size);
      break;
    case "rating-desc":
      data.sort((a, b) => b.rating - a.rating);
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



// Adapter function to convert CommercialProperty to Property interface
const adaptCommercialPropertyToProperty = (
  commercialProperty: CommercialProperty
): Property => ({
  id: commercialProperty.id,
  title: commercialProperty.title,
  description: commercialProperty.description,
  location: commercialProperty.location,
  price: commercialProperty.price,
  images: commercialProperty.images,
  features: {
    bedrooms: 0, // Commercial properties don't have bedrooms
    bathrooms: 0, // Commercial properties don't have bathrooms
    squareFeet: commercialProperty.size,
    parkingSpaces: 0,
    yearBuilt: commercialProperty.yearBuilt,
    amenities: commercialProperty.features,
    propertyType: commercialProperty.type,
    petFriendly: false,
    furnished: false,
  },
  status: commercialProperty.verified ? "verified" : "pending",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function CommercialProperties() {
  const { trackApiCall } = useComponentPerformance("CommercialProperties");
  const navigate = useNavigate();

  // State
  const [filters, setFilters] = useState<CommercialFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const debouncedFilters = useDebounce(filters, DEBOUNCE_DELAY);

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, debouncedFilters, page, sortBy],
    queryFn: ({ signal }) => {
      trackApiCall(debouncedFilters);
      return fetchCommercialProperties(debouncedFilters, page, sortBy, signal);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (c, e) => e?.message !== ERROR_CANCELLED && c < 2,
  });

  const MOCK_COMMERCIAL_PROPERTIES: CommercialProperty[] = useMemo(
    () => [
      {
        id: "COM-001",
        title: "Premium Office Complex - Westlands",
        type: "office",
        location: "Westlands, Nairobi",
        price: 180000000,
        size: 2500,
        yearBuilt: 2019,
        occupancyRate: 95,
        roi: 12.5,
        images: [
          "/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg",
          "/assets/Commercial/benjamin-cheng-wTZAqLPcTKk-unsplash (1).jpg",
          "/assets/Commercial/isai-sanchez-MLIUd81AX1o-unsplash.jpg",
        ],
        features: [
          "24/7 Security",
          "Backup Generator",
          "Parking Space",
          "Conference Rooms",
          "High-Speed Internet",
        ],
        description:
          "Modern office complex in the heart of Westlands with premium amenities and excellent connectivity.",
        status: "available",
        verified: true,
        rating: 4.8,
        views: 1247,
      },
      {
        id: "COM-002",
        title: "Shopping Mall - Sarit Centre Area",
        type: "retail",
        location: "Westlands, Nairobi",
        price: 250000000,
        size: 5000,
        yearBuilt: 2020,
        occupancyRate: 88,
        roi: 15.2,
        images: [
          "/assets/Commercial/kc-shum-OKdd71f5Oq8-unsplash (1).jpg",
          "/assets/Commercial/nikita-pishchugin-y2lZI81BGk0-unsplash.jpg",
          "/assets/Commercial/nir-himi--i87qT8TJ34-unsplash.jpg",
        ],
        features: [
          "Food Court",
          "Ample Parking",
          "Central AC",
          "Escalators",
          "Security Systems",
        ],
        description:
          "Prime retail space in bustling Westlands with high foot traffic and established tenant base.",
        status: "available",
        verified: true,
        rating: 4.6,
        views: 892,
      },
      {
        id: "COM-003",
        title: "Industrial Warehouse - Mombasa Road",
        type: "warehouse",
        location: "Industrial Area, Nairobi",
        price: 95000000,
        size: 8000,
        yearBuilt: 2018,
        occupancyRate: 100,
        roi: 18.7,
        images: [
          "/assets/Commercial/omar-elsharawy-lTqU2v0OKH4-unsplash.jpg",
          "/assets/Commercial/patrick-tomasso-gMes5dNykus-unsplash.jpg",
          "/assets/Commercial/pawel-czerwinski-3-Q4hnx60WM-unsplash.jpg",
        ],
        features: [
          "Loading Docks",
          "High Ceiling",
          "Fire Safety",
          "Security Fence",
          "Office Space",
        ],
        description:
          "Strategic warehouse location on Mombasa Road with excellent logistics connectivity to the port.",
        status: "under-offer",
        verified: true,
        rating: 4.4,
        views: 634,
      },
      {
        id: "COM-004",
        title: "Mixed-Use Development - Karen",
        type: "mixed-use",
        location: "Karen, Nairobi",
        price: 450000000,
        size: 12000,
        yearBuilt: 2021,
        occupancyRate: 92,
        roi: 14.8,
        images: [
          "/assets/Commercial/roman-fxTYHz1RG10-unsplash.jpg",
          "/assets/Commercial/the-prototype-45-GefVF-TA-unsplash.jpg",
          "/assets/Commercial/uran-wang-xsZ47_FLdpo-unsplash.jpg",
        ],
        features: [
          "Retail Ground Floor",
          "Office Spaces",
          "Residential Units",
          "Gym",
          "Restaurant",
        ],
        description:
          "Premium mixed-use development combining retail, office, and residential spaces in upscale Karen.",
        status: "available",
        verified: true,
        rating: 4.9,
        views: 1856,
      },
      {
        id: "COM-005",
        title: "Corporate Headquarters - Upper Hill",
        type: "office",
        location: "Upper Hill, Nairobi",
        price: 320000000,
        size: 4200,
        yearBuilt: 2020,
        occupancyRate: 98,
        roi: 13.8,
        images: [
          "/assets/Commercial/willian-justen-de-vasconcellos-DY6g9FgXwbY-unsplash.jpg",
          "/assets/Commercial/zhiqiang-wang-9anoZ1zUr40-unsplash.jpg",
          "/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg",
        ],
        features: [
          "Executive Floors",
          "Boardrooms",
          "Cafeteria",
          "Fitness Center",
          "Rooftop Terrace",
        ],
        description:
          "Premium corporate headquarters building in Upper Hill financial district with state-of-the-art facilities.",
        status: "available",
        verified: true,
        rating: 4.7,
        views: 2134,
      },
      {
        id: "COM-006",
        title: "Retail Plaza - Kilimani",
        type: "retail",
        location: "Kilimani, Nairobi",
        price: 195000000,
        size: 3500,
        yearBuilt: 2019,
        occupancyRate: 85,
        roi: 16.4,
        images: [
          "/assets/Commercial/benjamin-cheng-wTZAqLPcTKk-unsplash (1).jpg",
          "/assets/Commercial/isai-sanchez-MLIUd81AX1o-unsplash.jpg",
        ],
        features: [
          "Ground Floor Retail",
          "Restaurant Space",
          "Ample Parking",
          "Modern Design",
          "High Visibility",
        ],
        description:
          "Modern retail plaza in vibrant Kilimani with excellent foot traffic and diverse tenant mix.",
        status: "available",
        verified: true,
        rating: 4.5,
        views: 1456,
      },
      {
        id: "COM-007",
        title: "Logistics Hub - Embakasi",
        type: "industrial",
        location: "Embakasi, Nairobi",
        price: 125000000,
        size: 10000,
        yearBuilt: 2018,
        occupancyRate: 100,
        roi: 19.2,
        images: [
          "/assets/Commercial/kc-shum-OKdd71f5Oq8-unsplash (1).jpg",
          "/assets/Commercial/nikita-pishchugin-y2lZI81BGk0-unsplash.jpg",
        ],
        features: [
          "Multiple Loading Bays",
          "Cold Storage",
          "Office Block",
          "Security Systems",
          "Rail Access",
        ],
        description:
          "Strategic logistics and distribution hub near JKIA with excellent transport connectivity.",
        status: "available",
        verified: true,
        rating: 4.6,
        views: 987,
      },
      {
        id: "COM-008",
        title: "Tech Park - Karen",
        type: "mixed-use",
        location: "Karen, Nairobi",
        price: 380000000,
        size: 8500,
        yearBuilt: 2021,
        occupancyRate: 90,
        roi: 15.6,
        images: [
          "/assets/Commercial/nir-himi--i87qT8TJ34-unsplash.jpg",
          "/assets/Commercial/omar-elsharawy-lTqU2v0OKH4-unsplash.jpg",
        ],
        features: [
          "Co-working Spaces",
          "Innovation Labs",
          "Conference Center",
          "Cafeteria",
          "Green Building",
        ],
        description:
          "Modern technology park designed for startups and tech companies with collaborative spaces.",
        status: "available",
        verified: true,
        rating: 4.8,
        views: 2567,
      },
    ],
    []
  );

  // ----------------------------------------------------------------
  // Handlers (memoized)
  // ----------------------------------------------------------------
  const handleFilterChange = useCallback(
    <K extends keyof CommercialFilters>(
      key: K,
      value: CommercialFilters[K]
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
    (key: "priceMin" | "priceMax" | "sizeMin" | "sizeMax" | "roiMin", v: string) => {
      const n = v === "" ? null : Number(v);
      if (n !== null && (Number.isNaN(n) || n < 0)) return;

      const safeFilters = { ...filters };
      switch (key) {
        case "priceMin":
          safeFilters.priceMin = n;
          break;
        case "priceMax":
          safeFilters.priceMax = n;
          break;
        case "sizeMin":
          safeFilters.sizeMin = n;
          break;
        case "sizeMax":
          safeFilters.sizeMax = n;
          break;
        case "roiMin":
          safeFilters.roiMin = n;
          break;
      }
      setFilters(safeFilters);
      setPage(1);
    },
    [filters]
  );

  const handleViewMode = useCallback((m: ViewMode) => setViewMode(m), []);

  const handlePropertyClick = useCallback(
    (property: CommercialProperty) => {
      navigate(`/property/${property.id}`);
    },
    [navigate]
  );

  // ----------------------------------------------------------------
  // Memoized UI helpers
  // ----------------------------------------------------------------
  const typeBadges = useMemo(
    () =>
      COMMERCIAL_TYPES.map((t) => (
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

  // Virtualized Commercial List Component
  const VirtualizedCommercialList = ({ properties, viewMode, onPropertyClick }: {
    properties: CommercialProperty[];
    viewMode: "grid" | "list";
    onPropertyClick: (property: CommercialProperty) => void;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(600);

    // Update container height based on viewport
    React.useEffect(() => {
      const updateHeight = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const availableHeight = window.innerHeight - rect.top - 100;
          setContainerHeight(Math.max(400, availableHeight));
        }
      };

      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const renderCommercialItem = useCallback((property: CommercialProperty, index: number, style: React.CSSProperties) => {
      const adaptedProperty = adaptCommercialPropertyToProperty(property);
      
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
      const gridProps = usePropertyGridVirtualization(
        properties,
        containerRef.current?.clientWidth || 1200,
        containerHeight,
        350, // card width
        400  // card height
      );

      return (
        <div ref={containerRef} className="w-full">
          <GridVirtualizedList
            {...gridProps}
            renderItem={renderCommercialItem}
          />
        </div>
      );
    }

    // List view
    const listProps = usePropertyListVirtualization(
      properties,
      containerHeight,
      200 // list item height
    );

    return (
      <div ref={containerRef} className="w-full">
        <EnterpriseVirtualizedList
          {...listProps}
          renderItem={renderCommercialItem}
        />
      </div>
    );
  };

  // ----------------------------------------------------------------
  // Render helpers
  // ----------------------------------------------------------------
  const renderPropertiesContent = () => {
    if (!data?.properties.length) {
      return (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
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
        <VirtualizedCommercialList
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

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  if (error) {
    return (
      <Card>
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
      <div className="min-h-screen bg-background">
        {/* Enhanced Hero Section */}
        <div className="relative isolate overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-20"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239ca3af' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="container mx-auto px-4 py-20 md:py-28 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-secondary/20 rounded-full">
                <Building2 className="w-12 h-12 text-secondary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              Commercial Properties
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
              Discover premium commercial real estate opportunities across Kenya's prime business locations.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" /> High ROI Properties
              </div>
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium">
                <Users className="w-4 h-4" /> Verified Tenants
              </div>
              <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium">
                <Calendar className="w-4 h-4" /> Ready to Move
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Enhanced Filters Card */}
          <Card className="mb-6 border-muted/60 shadow-sm backdrop-blur-sm bg-card/80">
            <CardContent className="p-6">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search commercial properties, locations, or keywords…"
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
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {(
                        [
                          "priceMin",
                          "priceMax",
                          "sizeMin",
                          "sizeMax",
                          "roiMin",
                        ] as const
                      ).map((k) => (
                        <div key={k}>
                          <label
                            htmlFor={k}
                            className="text-sm font-medium mb-1 block"
                          >
                            {k === "priceMin" && (
                              <>
                                <DollarSign className="inline w-3 h-3" /> Min Price (KSH)
                              </>
                            )}
                            {k === "priceMax" && (
                              <>
                                <DollarSign className="inline w-3 h-3" /> Max Price (KSH)
                              </>
                            )}
                            {k === "sizeMin" && "Min Size (sqft)"}
                            {k === "sizeMax" && "Max Size (sqft)"}
                            {k === "roiMin" && (
                              <>
                                <BarChart3 className="inline w-3 h-3" /> Min ROI (%)
                              </>
                            )}
                          </label>
                          <Input
                            id={k}
                            type="number"
                            placeholder={
                              k.includes("price") ? "0"
                              : k.includes("size") ? "0"
                              : k.includes("roi") ? "0"
                              : "Any"
                            }
                            value={
                              k === "priceMin" ? (filters.priceMin ?? "")
                              : k === "priceMax" ?
                                (filters.priceMax ?? "")
                              : k === "sizeMin" ?
                                (filters.sizeMin ?? "")
                              : k === "sizeMax" ?
                                (filters.sizeMax ?? "")
                              : k === "roiMin" ?
                                (filters.roiMin ?? "")
                              : ""
                            }
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
                          checked={filters.verified}
                          onChange={(e) =>
                            handleFilterChange("verified", e.target.checked)
                          }
                          className="rounded"
                        />
                        <Shield className="w-3 h-3" /> Verified Only
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Status:</label>
                        <select
                          value={filters.status}
                          onChange={(e) =>
                            handleFilterChange("status", e.target.value)
                          }
                          className="px-2 py-1 border border-input rounded text-sm"
                        >
                          <option value="">All</option>
                          <option value="available">Available</option>
                          <option value="under-offer">Under Offer</option>
                          <option value="sold">Sold</option>
                        </select>
                      </div>
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
                  Commercial Properties{" "}
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
                    <option value="price-desc">Price: High to Low</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="roi-desc">ROI: High to Low</option>
                    <option value="size-desc">Size: Large to Small</option>
                    <option value="rating-desc">Rating: High to Low</option>
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
}
