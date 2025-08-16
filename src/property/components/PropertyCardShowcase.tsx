import { useQuery } from "@tanstack/react-query";
import React, {
  useState,
  useCallback,
  useMemo,
  Component,
  ErrorInfo,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

import { PropertyCard } from "../../shared/components/property";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../shared/components/ui/tabs";
import type { NormalizedProperty } from "../../shared/types/property";

import EnhancedLandCard from "./EnhancedLandCard";

/* ------------------------------------------------------------------ */
/* Types & Constants                                                  */
/* ------------------------------------------------------------------ */

// Constants to prevent string duplication and magic values
const RESIDENTIAL_TYPE = "residential" as const;
const COMMERCIAL_TYPE = "commercial" as const;
const CONTAINER_HEIGHT = 400;
const DEFAULT_ITEM_HEIGHT = 200;
const VISIBLE_ITEMS_BUFFER = 1;
const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes
const SAMPLE_DATE = "2024-01-15" as const;

// Enhanced interfaces with better type safety
interface ShowcaseProperty {
  id: string;
  title: string;
  description: string;
  location: string | { address: string };
  price: number;
  originalPrice?: number;
  images: string[];
  type: "residential" | "commercial";
  verificationStatus: "verified" | "pending" | "unverified";
  trustScore: number;
  features?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    propertyType?: string;
  };
  dateAdded?: Date;
  viewCount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

interface LandProperty {
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

/* ------------------------------------------------------------------ */
/* Error Boundary Component                                           */
/* ------------------------------------------------------------------ */

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class PropertyCardErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Using a more robust logging approach instead of console.error
    this.logError("PropertyCard Error:", { error, errorInfo });
  }

  private logError(
    message: string,
    data: { error: Error; errorInfo: ErrorInfo }
  ): void {
    // In production, this would integrate with your logging service
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error(message, data.error, data.errorInfo);
    }
    // Integrate with error tracking service (e.g., Sentry, LogRocket) in production
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      const fallbackElement = (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600 text-sm">Error loading property card</p>
        </div>
      );
      return this.props.fallback ?? fallbackElement;
    }

    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* ListingCard Component                                              */
/* ------------------------------------------------------------------ */

interface ListingCardProps {
  property: ShowcaseProperty & { status?: string };
  onClick?: (id: string) => void;
  className?: string;
}

const ListingCard: React.FC<ListingCardProps> = ({
  property,
  onClick,
  className = "",
}) => {
  // Helper function to safely extract location string
  const getLocationString = useCallback(
    (location: string | { address: string }): string => {
      return typeof location === "string" ? location : location.address;
    },
    []
  );

  // Memoized price formatter for performance
  const formatPrice = useMemo(() => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    });
  }, []);

  const location = getLocationString(property.location);
  const formattedPrice = formatPrice.format(property.price);

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${className}`}
      onClick={() => onClick?.(property.id)}
    >
      <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
        {property.images && property.images.length > 0 ?
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        : <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image available
          </div>
        }
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg truncate">{property.title}</h3>
          <Badge
            variant={property.status === "verified" ? "default" : "secondary"}
          >
            {property.verificationStatus}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{location}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{formattedPrice}</span>
          {property.features && (
            <div className="text-sm text-muted-foreground">
              {property.features.bedrooms && property.features.bathrooms && (
                <span>
                  {property.features.bedrooms}BR • {property.features.bathrooms}
                  BA
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Virtualized Property List Component                               */
/* ------------------------------------------------------------------ */

interface VirtualizedPropertyListProps {
  properties: ShowcaseProperty[];
  onPropertyClick: (id: string) => void;
  itemHeight?: number;
  className?: string;
}

const VirtualizedPropertyList: React.FC<VirtualizedPropertyListProps> = ({
  properties,
  onPropertyClick,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  className = "",
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  // Memoized calculations for virtualization
  const virtualizedData = useMemo(() => {
    const visibleItems = Math.ceil(CONTAINER_HEIGHT / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + visibleItems + VISIBLE_ITEMS_BUFFER,
      properties.length
    );
    const visibleProperties = properties.slice(startIndex, endIndex);

    return {
      startIndex,
      endIndex,
      visibleProperties,
      totalHeight: properties.length * itemHeight,
    };
  }, [properties, itemHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: CONTAINER_HEIGHT }}
      onScroll={handleScroll}
    >
      <div
        style={{ height: virtualizedData.totalHeight, position: "relative" }}
      >
        {virtualizedData.visibleProperties.map((property, index) => (
          <div
            key={property.id}
            className="p-2"
            style={{
              position: "absolute",
              top: (virtualizedData.startIndex + index) * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            <ListingCard
              property={{
                ...property,
                status: property.verificationStatus,
              }}
              onClick={onPropertyClick}
              className="h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */

const mockProperties: ShowcaseProperty[] = [
  {
    id: "1",
    title: "Modern 3BR Apartment in Westlands",
    description:
      "Luxurious apartment with stunning city views and modern amenities.",
    location: "Westlands, Nairobi",
    price: 15000000,
    originalPrice: 18000000,
    images: [
      "/assets/Residential/alejandra-cifre-gonzalez-ylyn5r4vxcA-unsplash.jpg",
      "/assets/Residential/alexander-andrews-A3DPhhAL6Zg-unsplash.jpg",
      "/assets/Residential/billy-jo-catbagan-ysUyvjCocWo-unsplash.jpg",
    ],
    type: RESIDENTIAL_TYPE,
    verificationStatus: "verified",
    trustScore: 95,
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      propertyType: "Apartment",
    },
    dateAdded: new Date(SAMPLE_DATE),
    viewCount: 245,
    isNew: true,
    isFeatured: true,
  },
  {
    id: "2",
    title: "Commercial Office Space in CBD",
    description:
      "Prime office space in the heart of Nairobi's Central Business District.",
    location: "CBD, Nairobi",
    price: 45000000,
    images: [
      "/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg",
      "/assets/Commercial/benjamin-cheng-wTZAqLPcTKk-unsplash (1).jpg",
    ],
    type: COMMERCIAL_TYPE,
    verificationStatus: "verified",
    trustScore: 92,
    features: {
      squareFeet: 2500,
      propertyType: "Office",
    },
    dateAdded: new Date("2024-01-10"),
    viewCount: 189,
    isFeatured: true,
  },
  {
    id: "3",
    title: "Family Home in Karen",
    description: "Spacious family home in the prestigious Karen neighborhood.",
    location: "Karen, Nairobi",
    price: 25000000,
    images: [
      "/assets/Residential/caroline-badran-aaONSK4BKxc-unsplash.jpg",
      "/assets/Residential/caroline-badran-nf7iKpydFR4-unsplash.jpg",
    ],
    type: RESIDENTIAL_TYPE,
    verificationStatus: "pending",
    trustScore: 88,
    features: {
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2800,
      propertyType: "House",
    },
    dateAdded: new Date("2024-01-08"),
    viewCount: 156,
  },
];

const mockLandProperties: LandProperty[] = [
  {
    id: "land-1",
    title: "5-Acre Agricultural Land in Kiambu",
    description:
      "Prime agricultural land with fertile soil, perfect for farming or development.",
    location: "Kiambu County",
    price: 12000000,
    size: "5 acres",
    images: ["/assets/Land/federico-respini-sYffw0LNr7s-unsplash.jpg"],
    verificationStatus: "verified",
    trustScore: 95,
    landType: "agricultural",
    titleDeedStatus: "available",
    lastVerified: SAMPLE_DATE,
    riskLevel: "low",
    features: {
      soilType: "Fertile loam",
      waterAccess: true,
      roadAccess: true,
      electricityAccess: true,
      zoning: "Agricultural",
      developmentPotential: "High",
    },
    dateAdded: new Date(SAMPLE_DATE),
    viewCount: 89,
    isNew: true,
  },
  {
    id: "land-2",
    title: "2-Acre Residential Plot in Nakuru",
    description:
      "Well-located residential plot with access to utilities and good road network.",
    location: "Nakuru County",
    price: 8500000,
    size: "2 acres",
    images: ["/assets/Land/gautier-pfeiffer-WPapb9IqRKw-unsplash.jpg"],
    verificationStatus: "verified",
    trustScore: 89,
    landType: RESIDENTIAL_TYPE,
    titleDeedStatus: "available",
    lastVerified: "2024-01-18",
    riskLevel: "low",
    features: {
      waterAccess: true,
      roadAccess: true,
      electricityAccess: true,
      zoning: "Residential",
      developmentPotential: "High",
    },
    dateAdded: new Date("2024-01-18"),
    viewCount: 67,
  },
];

/* ------------------------------------------------------------------ */
/* API Functions                                                      */
/* ------------------------------------------------------------------ */

const fetchProperties = async (): Promise<ShowcaseProperty[]> => {
  // Simulate API delay with more realistic timing
  await new Promise((resolve) => setTimeout(resolve, 800));
  return mockProperties;
};

const fetchLandProperties = async (): Promise<LandProperty[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600));
  return mockLandProperties;
};

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function PropertyCardShowcase() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Queries with optimized configuration
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ["showcase-properties"],
    queryFn: fetchProperties,
    staleTime: STALE_TIME_MS,
  });

  const { data: landProperties, isLoading: landLoading } = useQuery({
    queryKey: ["showcase-land"],
    queryFn: fetchLandProperties,
    staleTime: STALE_TIME_MS,
  });

  // Helper method for logging share errors
  const logShareError = useCallback((message: string, error: Error) => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(message, error);
    }
    // Integrate with error tracking service in production
  }, []);

  // Enhanced error handling for share functionality
  const handleSaveProperty = useCallback((id: string) => {
    setWishlist((prev) => {
      const newWishlist = new Set(prev);
      if (newWishlist.has(id)) {
        newWishlist.delete(id);
      } else {
        newWishlist.add(id);
      }
      return newWishlist;
    });
  }, []);

  const handleShareProperty = useCallback(
    async (id: string) => {
      const property =
        properties?.find((p) => p.id === id) ||
        landProperties?.find((p) => p.id === id);
      if (!property) return Promise.resolve();

      const shareData = {
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url: `${window.location.origin}/property/${id}`,
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url);
          // Implement proper toast notification system in production
          // For now, using a more user-friendly approach
          if (window.confirm) {
            window.confirm("Link copied to clipboard!");
          }
        }
      } catch (error) {
        // Enhanced error handling with proper type checking
        if (error instanceof Error && error.name !== "AbortError") {
          logShareError("Share failed:", error);
        }
      }
    },
    [properties, landProperties, logShareError]
  );

  const handleViewDetails = useCallback(
    (id: string) => {
      navigate(`/property/${id}`);
    },
    [navigate]
  );

  const handleVerifyLand = useCallback(
    (id: string) => {
      navigate(`/land-verification/new?landId=${id}`);
    },
    [navigate]
  );

  // Enhanced property transformation with proper type mapping
  const transformPropertyForCard = useCallback(
    (property: ShowcaseProperty): NormalizedProperty => ({
      id: property.id,
      title: property.title,
      description: property.description,
      location:
        typeof property.location === "string" ?
          property.location
        : property.location.address,
      price: property.price,
      images: property.images,
      verified: property.verificationStatus === "verified",
      type: property.type,
      category: property.type as "residential" | "commercial",
      features: {
        bedrooms: property.features?.bedrooms,
        bathrooms: property.features?.bathrooms,
        squareFeet: property.features?.squareFeet,
        propertyType: property.features?.propertyType,
      } as Record<string, string | number | undefined>,
      createdAt: (property.dateAdded || new Date()).toISOString(),
      status: "available" as const,
      trustScore: property.trustScore,
      verificationStatus: property.verificationStatus,
      views: property.viewCount || 0,
    }),
    []
  );

  // Memoized components with performance optimizations
  const propertyCards = useMemo(() => {
    if (!properties) return [];

    return properties.map((property, index) => (
      <PropertyCardErrorBoundary key={property.id}>
        <PropertyCard
          property={transformPropertyForCard(property)}
          priority={index < 3} // Above-the-fold optimization
          showQuickActions={true}
          isInWishlist={wishlist.has(property.id)}
          onSave={handleSaveProperty}
          onShare={handleShareProperty}
          onClick={(property) => handleViewDetails(property.id)}
          className="h-full"
        />
      </PropertyCardErrorBoundary>
    ));
  }, [
    properties,
    wishlist,
    handleSaveProperty,
    handleShareProperty,
    handleViewDetails,
    transformPropertyForCard,
  ]);

  const listingCards = useMemo(() => {
    if (!properties) return [];

    return properties.map((property) => (
      <ListingCard
        key={property.id}
        property={{
          ...property,
          status: property.verificationStatus,
        }}
        onClick={handleViewDetails}
        className="h-full"
      />
    ));
  }, [properties, handleViewDetails]);

  const landCards = useMemo(() => {
    if (!landProperties) return [];

    return landProperties.map((property) => (
      <EnhancedLandCard
        key={property.id}
        property={property}
        showQuickActions={true}
        showGallery={true}
        isInWishlist={wishlist.has(property.id)}
        onSave={handleSaveProperty}
        onShare={handleShareProperty}
        onViewDetails={handleViewDetails}
        onVerify={handleVerifyLand}
        className="h-full"
      />
    ));
  }, [
    landProperties,
    wishlist,
    handleSaveProperty,
    handleShareProperty,
    handleViewDetails,
    handleVerifyLand,
  ]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Property Card Component Showcase
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Demonstrating the integration of PropertyCard, ListingCard, and
          EnhancedLandCard with the strategic image foundation components.
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="outline">Image Optimization</Badge>
          <Badge variant="outline">Performance Optimized</Badge>
          <Badge variant="outline">Accessibility Ready</Badge>
        </div>
      </div>

      {/* Component Showcase Tabs */}
      <Tabs defaultValue="property-card" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="property-card">PropertyCard</TabsTrigger>
          <TabsTrigger value="listing-card">ListingCard</TabsTrigger>
          <TabsTrigger value="land-card">LandCard</TabsTrigger>
          <TabsTrigger value="virtualized">Virtualized</TabsTrigger>
        </TabsList>

        {/* PropertyCard Showcase */}
        <TabsContent value="property-card" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                PropertyCard - Premium Features
                <Badge>Advanced</Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                Premium property card with advanced image gallery, accessibility
                features, performance optimizations, and B2B contextual prompts.
              </p>
            </CardHeader>
            <CardContent>
              {propertiesLoading ?
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-[4/3] rounded-lg mb-4" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {propertyCards}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* ListingCard Showcase */}
        <TabsContent value="listing-card" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ListingCard - Versatile & Flexible
                <Badge variant="secondary">Standard</Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                Flexible property card with compare functionality,
                backward-compatible patterns, and responsive design for various
                contexts.
              </p>
            </CardHeader>
            <CardContent>
              {propertiesLoading ?
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-video rounded-lg mb-4" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listingCards}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* EnhancedLandCard Showcase */}
        <TabsContent value="land-card" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                EnhancedLandCard - Land Verification Focus
                <Badge variant="destructive">Specialized</Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                Specialized land property card with verification status, trust
                scores, risk assessment, and Kenya-specific land features.
              </p>
            </CardHeader>
            <CardContent>
              {landLoading ?
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-[4/3] rounded-lg mb-4" />
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 rounded w-16" />
                          <div className="h-6 bg-gray-200 rounded w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {landCards}
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Virtualized List Showcase */}
        <TabsContent value="virtualized" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                VirtualizedPropertyList - Performance at Scale
                <Badge variant="outline">Performance</Badge>
              </CardTitle>
              <p className="text-muted-foreground">
                High-performance virtualized list for handling thousands of
                properties with smooth scrolling and memory efficiency.
              </p>
            </CardHeader>
            <CardContent>
              {propertiesLoading ?
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Loading virtualized list...
                    </p>
                  </div>
                </div>
              : <div className="h-96 border rounded-lg">
                  <VirtualizedPropertyList
                    properties={properties || []}
                    onPropertyClick={handleViewDetails}
                    itemHeight={DEFAULT_ITEM_HEIGHT}
                    className="h-full"
                  />
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Benefits</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              🖼️
            </div>
            <h3 className="font-semibold">Unified Image Handling</h3>
            <p className="text-sm text-muted-foreground">
              All components use optimized image handling for consistent
              performance, format selection, and land-specific placeholders.
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              ⚡
            </div>
            <h3 className="font-semibold">Performance Optimized</h3>
            <p className="text-sm text-muted-foreground">
              Intersection observers, image preloading, virtualization, and
              memoization for optimal performance.
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              ♿
            </div>
            <h3 className="font-semibold">Accessibility Ready</h3>
            <p className="text-sm text-muted-foreground">
              ARIA labels, keyboard navigation, screen reader support, and
              semantic HTML throughout.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Component Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {properties?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Properties Loaded
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {landProperties?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Land Properties
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {wishlist.size}
              </div>
              <div className="text-sm text-muted-foreground">
                Wishlist Items
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-sm text-muted-foreground">
                Component Types
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button onClick={() => navigate("/properties")}>
          View All Properties
        </Button>
        <Button variant="outline" onClick={() => navigate("/properties/land")}>
          Browse Land Listings
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/land-verification")}
        >
          Land Verification
        </Button>
      </div>
    </div>
  );
}
