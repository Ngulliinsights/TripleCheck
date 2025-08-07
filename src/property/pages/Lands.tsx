import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  FileCheck,
  MapPin,
  Search,
  Shield,
  SlidersHorizontal,
  TreePine,
  Users,
  Zap,
} from "lucide-react";
import React, { useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { GridVirtualizedList } from "../../shared/components";
// Using basic img tag for simple image display
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
} from "../../shared/components/ui/card";
import { Input } from "../../shared/components/ui/input";
import { Skeleton } from "../../shared/components/ui/skeleton";
import { usePropertyGridVirtualization } from "../../shared/hooks/useVirtualizationHelpers";
import { Property } from "../../shared/types/property";

// Types for land listings extending the base Property interface
interface LandListing extends Omit<Property, "features" | "status"> {
  readonly size: string;
  readonly verificationStatus:
    | "verified"
    | "pending"
    | "unverified"
    | "flagged";
  readonly trustScore: number;
  readonly landType:
    | "agricultural"
    | "residential"
    | "commercial"
    | "industrial";
  readonly titleDeedStatus: "available" | "pending" | "missing";
  readonly lastVerified?: string;
  readonly riskLevel: "low" | "medium" | "high";
  readonly landFeatures?: {
    soilType?: string;
    waterAccess?: boolean;
    roadAccess?: boolean;
    electricityAccess?: boolean;
    zoning?: string;
    developmentPotential?: string;
  };
}

interface LandFilters {
  query: string;
  location: string;
  landType: string;
  priceMin: number | null;
  priceMax: number | null;
  verificationStatus: string;
  trustScoreMin: number | null;
}

// Mock data for land listings - only verified and safe properties
const mockLandListings: readonly LandListing[] = [
  {
    id: "1",
    title: "5-Acre Agricultural Land in Kiambu",
    description:
      "Prime agricultural land with fertile soil, perfect for farming or development. Located in the heart of Kiambu County with excellent access to Nairobi markets.",
    location: "Kiambu County",
    price: 12000000,
    size: "5 acres",
    images: ["/assets/Land/federico-respini-sYffw0LNr7s-unsplash.jpg"],
    verificationStatus: "verified",
    trustScore: 95,
    landType: "agricultural",
    titleDeedStatus: "available",
    lastVerified: "2024-01-15",
    riskLevel: "low",
    landFeatures: {
      soilType: "Fertile loam",
      waterAccess: true,
      roadAccess: true,
      electricityAccess: true,
      zoning: "Agricultural",
      developmentPotential: "High",
    },
  },
  {
    id: "2",
    title: "2-Acre Residential Plot in Nakuru",
    description:
      "Well-located residential plot with access to utilities and good road network. Perfect for building your dream home with scenic views of the Rift Valley.",
    location: "Nakuru County",
    price: 8500000,
    size: "2 acres",
    images: ["/assets/Land/gautier-pfeiffer-WPapb9IqRKw-unsplash.jpg"],
    verificationStatus: "verified",
    trustScore: 89,
    landType: "residential",
    titleDeedStatus: "available",
    lastVerified: "2024-01-18",
    riskLevel: "low",
    landFeatures: {
      waterAccess: true,
      roadAccess: true,
      electricityAccess: true,
      zoning: "Residential",
      developmentPotential: "High",
    },
  },
  {
    id: "3",
    title: "10-Acre Commercial Land in Mombasa",
    description:
      "Strategic commercial land near the port with high development potential. Ideal for warehousing, logistics, or industrial development projects.",
    location: "Mombasa County",
    price: 45000000,
    size: "10 acres",
    images: ["/assets/Land/julian-ebert-zSflp4Mq_l0-unsplash.jpg"],
    verificationStatus: "verified",
    trustScore: 92,
    landType: "commercial",
    titleDeedStatus: "available",
    lastVerified: "2024-01-20",
    riskLevel: "low",
    landFeatures: {
      waterAccess: true,
      roadAccess: true,
      electricityAccess: true,
      zoning: "Commercial",
      developmentPotential: "Very High",
    },
  },
  {
    id: "4",
    title: "3-Acre Industrial Plot in Machakos",
    description:
      "Well-positioned industrial land with excellent connectivity to major highways. Suitable for manufacturing, processing, or distribution facilities.",
    location: "Machakos County",
    price: 18000000,
    size: "3 acres",
    images: ["/assets/Land/bogdan-pasca-XpyDh3PY2lA-unsplash.jpg"],
    verificationStatus: "pending",
    trustScore: 85,
    landType: "industrial",
    titleDeedStatus: "pending",
    riskLevel: "low",
    landFeatures: {
      soilType: "Clay loam",
      waterAccess: true,
      roadAccess: true,
      electricityAccess: true,
      zoning: "Industrial",
      developmentPotential: "High",
    },
  },
] as const;

// Verification status configurations
const VERIFICATION_STATUS_CONFIG = {
  verified: {
    label: "Verified",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Fully verified and safe to purchase",
  },
  pending: {
    label: "Verification Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    description: "Verification in progress",
  },
  unverified: {
    label: "Unverified",
    color: "bg-gray-100 text-gray-800",
    icon: Eye,
    description: "Not yet verified",
  },
  flagged: {
    label: "Flagged",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
    description: "Potential issues detected",
  },
} as const;

// Risk level configurations
const RISK_LEVEL_CONFIG = {
  low: { color: "text-green-600", label: "Low Risk" },
  medium: { color: "text-yellow-600", label: "Medium Risk" },
  high: { color: "text-red-600", label: "High Risk" },
} as const;

// Mock API function
const fetchLandListings = async (
  filters: LandFilters
): Promise<LandListing[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  let filteredListings = [...mockLandListings];

  if (filters.query) {
    const query = filters.query.toLowerCase();
    filteredListings = filteredListings.filter(
      (land) =>
        land.title.toLowerCase().includes(query) ||
        land.description.toLowerCase().includes(query) ||
        land.location.toLowerCase().includes(query)
    );
  }

  if (filters.location) {
    filteredListings = filteredListings.filter((land) =>
      land.location.toLowerCase().includes(filters.location.toLowerCase())
    );
  }

  if (filters.landType) {
    filteredListings = filteredListings.filter(
      (land) => land.landType === filters.landType
    );
  }

  if (filters.verificationStatus) {
    filteredListings = filteredListings.filter(
      (land) => land.verificationStatus === filters.verificationStatus
    );
  }

  if (filters.trustScoreMin !== null) {
    filteredListings = filteredListings.filter(
      (land) => land.trustScore >= (filters.trustScoreMin ?? 0)
    );
  }

  return filteredListings;
};

// Land card component
const LandCard: React.FC<{
  land: LandListing;
  onVerify: (id: string) => void;
  onViewDetails: (id: string) => void;
}> = ({ land, onVerify, onViewDetails }) => {
  const statusConfig = VERIFICATION_STATUS_CONFIG[land.verificationStatus];
  const riskConfig = RISK_LEVEL_CONFIG[land.riskLevel];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 md:hover:scale-[1.02] border-border w-full max-w-xs sm:max-w-sm mx-auto h-full flex flex-col">
      <div 
        className="relative overflow-hidden cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          onViewDetails(land.id);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onViewDetails(land.id);
          }
        }}
        aria-label={`View details for ${land.title}`}
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={land.images[0] || '/placeholder-land.jpg'}
            alt={land.title}
            landType={land.landType}
            useLandPlaceholder={true}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="absolute top-2 left-2">
          <Badge className={`${statusConfig.color} text-xs`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">{statusConfig.label}</span>
            <span className="sm:hidden">{statusConfig.label.split(' ')[0]}</span>
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-xs">
            Trust: {land.trustScore}%
          </Badge>
        </div>
        {/* Hover overlay for better UX */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Eye className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
        </div>
      </div>

      <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 
            className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 flex-1 cursor-pointer hover:text-primary transition-colors"
            onClick={(e) => {
              e.preventDefault();
              onViewDetails(land.id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onViewDetails(land.id);
              }
            }}
          >
            {land.title}
          </h3>
          <span className={`text-xs font-medium ml-2 ${riskConfig.color} hidden sm:inline`}>
            {riskConfig.label}
          </span>
          <span className={`text-xs font-medium ml-2 ${riskConfig.color} sm:hidden`}>
            {riskConfig.label.split(' ')[0]}
          </span>
        </div>

        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {land.description}
        </p>

        <div className="flex items-center text-muted-foreground text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{land.location}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-medium text-foreground">{land.size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium text-foreground capitalize">{land.landType}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <div className="text-lg sm:text-xl font-bold text-primary">
            KSh {land.price.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            Title:{" "}
            <span className="capitalize font-medium text-foreground">
              {land.titleDeedStatus}
            </span>
          </div>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs sm:text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onVerify(land.id);
            }}
          >
            <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Verify</span>
            <span className="sm:hidden">✓</span>
          </Button>
          <Button 
            size="sm" 
            className="flex-1 text-xs sm:text-sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(land.id);
            }}
          >
            <span className="hidden sm:inline">Details</span>
            <span className="sm:hidden">View</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
          </Button>
        </div>

        {land.lastVerified && (
          <div className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            Last verified: {new Date(land.lastVerified).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Simple responsive grid without virtualization for better mobile experience
const ResponsiveLandGrid: React.FC<{
  lands: LandListing[];
  onVerify: (id: string) => void;
  onViewDetails: (id: string) => void;
}> = ({ lands, onVerify, onViewDetails }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 px-2 sm:px-0 auto-rows-fr">
      {lands.map((land, index) => (
        <div
          key={land.id}
          className="animate-fadeInUp flex justify-center h-full"
          style={{ animationDelay: `${index * 75}ms` }}
        >
          <LandCard
            land={land}
            onVerify={onVerify}
            onViewDetails={onViewDetails}
          />
        </div>
      ))}
    </div>
  );
};

export default function Lands(): JSX.Element {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<LandFilters>({
    query: "",
    location: "",
    landType: "",
    priceMin: null,
    priceMax: null,
    verificationStatus: "",
    trustScoreMin: null,
  });

  const [showFilters, setShowFilters] = useState(false);

  const {
    data: landListings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["land-listings", filters],
    queryFn: () => fetchLandListings(filters),
    staleTime: 5 * 60 * 1000,
  });

  const handleFilterChange = useCallback(
    <K extends keyof LandFilters>(key: K, value: LandFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleVerifyLand = useCallback(
    (landId: string) => {
      navigate(`/land-verification/new?landId=${landId}`);
    },
    [navigate]
  );

  const handleViewLandDetails = useCallback(
    (landId: string) => {
      navigate(`/land/${landId}`);
    },
    [navigate]
  );

  const handleStartVerification = useCallback(() => {
    navigate("/land-verification/new");
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setFilters({
      query: "",
      location: "",
      landType: "",
      priceMin: null,
      priceMax: null,
      verificationStatus: "",
      trustScoreMin: null,
    });
  }, []);

  const verificationStats = useMemo(() => {
    if (!landListings) return { verified: 0, pending: 0, total: 0 };

    return {
      verified: landListings.filter(
        (land) => land.verificationStatus === "verified"
      ).length,
      pending: landListings.filter(
        (land) => land.verificationStatus === "pending"
      ).length,
      total: landListings.length,
    };
  }, [landListings]);

  // Render content based on state to avoid nested ternary operations
  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Error Loading Listings
          </h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Unable to load land listings. Please try again later."}
          </p>
          <Button variant="outline">
            Try Again
          </Button>
        </div>
      );
    }

    if (landListings && landListings.length === 0) {
      return (
        <div className="text-center py-12">
          <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            No land found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search terms
          </p>
          <Button onClick={clearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      );
    }

    return (
      <ResponsiveLandGrid
        lands={landListings}
        onVerify={handleVerifyLand}
        onViewDetails={handleViewLandDetails}
      />
    );
  };

  return (
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
              <TreePine className="w-12 h-12 text-secondary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Verified Land Listings
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground mb-8">
            Browse authenticated land listings with comprehensive verification and community intelligence.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" /> Verified Properties
            </div>
            <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium">
              <FileCheck className="w-4 h-4" /> Title Deed Verified
            </div>
            <div className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium">
              <Users className="w-4 h-4" /> Community Verified
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Stats */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {verificationStats.verified}
                </div>
                <div className="text-sm text-muted-foreground">Verified Lands</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {verificationStats.pending}
                </div>
                <div className="text-sm text-muted-foreground">Pending Verification</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <TreePine className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {verificationStats.total}
                </div>
                <div className="text-sm text-muted-foreground">Total Listings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Search and Filters */}
        <Card className="mb-6 border-muted/60 shadow-sm backdrop-blur-sm bg-card/80">
          <CardContent className="p-6">
            {/* Main Search Bar */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search land listings, locations, or keywords..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange("query", e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Land Type Quick Filters */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Land Types</h4>
              <div className="flex flex-wrap gap-2">
                {["agricultural", "residential", "commercial", "industrial"].map((type) => (
                  <Badge
                    key={type}
                    variant={filters.landType === type ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() =>
                      handleFilterChange(
                        "landType",
                        filters.landType === type ? "" : type
                      )
                    }
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Popular Counties Quick Filters */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Popular Counties
              </h4>
              <div className="flex flex-wrap gap-2">
                {["Nairobi", "Kiambu", "Nakuru", "Mombasa", "Kisumu", "Machakos"].map((county) => (
                  <Badge
                    key={county}
                    variant={filters.location === county ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() =>
                      handleFilterChange(
                        "location",
                        filters.location === county ? "" : county
                      )
                    }
                  >
                    {county}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Advanced Filters (Collapsible) */}
            {showFilters && (
              <div className="border-t pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Price Range */}
                  <div>
                    <label htmlFor="min-price" className="text-sm font-medium mb-1 block">
                      Min Price (KSH)
                    </label>
                    <Input
                      id="min-price"
                      type="number"
                      placeholder="0"
                      value={filters.priceMin ?? ""}
                      onChange={(e) =>
                        handleFilterChange("priceMin", e.target.value === "" ? null : Number(e.target.value))
                      }
                      min="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="max-price" className="text-sm font-medium mb-1 block">
                      Max Price (KSH)
                    </label>
                    <Input
                      id="max-price"
                      type="number"
                      placeholder="No limit"
                      value={filters.priceMax ?? ""}
                      onChange={(e) =>
                        handleFilterChange("priceMax", e.target.value === "" ? null : Number(e.target.value))
                      }
                      min="0"
                    />
                  </div>

                  {/* Verification Status */}
                  <div>
                    <label htmlFor="verification-status" className="text-sm font-medium mb-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Verification Status
                    </label>
                    <select
                      id="verification-status"
                      value={filters.verificationStatus}
                      onChange={(e) =>
                        handleFilterChange("verificationStatus", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      aria-label="Filter by verification status"
                    >
                      <option value="">All Status</option>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="unverified">Unverified</option>
                    </select>
                  </div>

                  {/* Trust Score */}
                  <div>
                    <label htmlFor="trust-score" className="text-sm font-medium mb-1 block">
                      Min Trust Score
                    </label>
                    <select
                      id="trust-score"
                      value={filters.trustScoreMin?.toString() || ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "trustScoreMin",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      aria-label="Filter by minimum trust score"
                    >
                      <option value="">Any Score</option>
                      <option value="90">90%+ Trust Score</option>
                      <option value="80">80%+ Trust Score</option>
                      <option value="70">70%+ Trust Score</option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <Button variant="ghost" onClick={clearFilters} size="sm">
                    Clear All Filters
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {landListings?.length || 0} lands found
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Available Land ({isLoading ? "..." : landListings?.length || 0})
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleStartVerification}
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Start Verification
                </Button>
              </div>
            </div>

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
            : renderContent()
            }
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Need Land Verification Services?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Our comprehensive verification system combines government records,
              expert assessments, and community intelligence to ensure your land
              purchase is secure and legitimate.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleStartVerification}
                className="px-8"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Verification
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/land-verification")}
              >
                <Eye className="w-5 h-5 mr-2" />
                View Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
