import {
  Building2,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Grid,
  List,
} from "lucide-react";
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Property } from "../../shared/types/property";
import { CompareBar } from "../components/CompareBar";
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

interface PropertyTypeConfig {
  value: string;
  label: string;
  icon: typeof Building2;
}

type SortOption =
  | "price-desc"
  | "price-asc"
  | "roi-desc"
  | "size-desc"
  | "rating-desc";
type ViewMode = "grid" | "list";

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
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("price-desc");
  const [searchQuery, setSearchQuery] = useState("");

  const commercialProperties: CommercialProperty[] = useMemo(
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

  const propertyTypes: PropertyTypeConfig[] = useMemo(
    () => [
      { value: "all", label: "All Types", icon: Building2 },
      { value: "office", label: "Office", icon: Building2 },
      { value: "retail", label: "Retail", icon: Building2 },
      { value: "warehouse", label: "Warehouse", icon: Building2 },
      { value: "industrial", label: "Industrial", icon: Building2 },
      { value: "mixed-use", label: "Mixed Use", icon: Building2 },
    ],
    []
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value);
    },
    []
  );

  const handleFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterType(event.target.value);
    },
    []
  );

  const handleSortChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSortBy(event.target.value as SortOption);
    },
    []
  );

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handlePropertyClick = useCallback(
    (property: CommercialProperty) => {
      // Check if this is a land property and navigate to the appropriate route
      const propertyType = property.type || property.propertyType;
      const isLandProperty = propertyType === 'land' || 
                            property.title?.toLowerCase().includes('land') ||
                            property.description?.toLowerCase().includes('land');
      
      if (isLandProperty) {
        navigate(`/land/${property.id}`);
      } else {
        // Navigate to property details page using React Router
        navigate(`/property/${property.id}`);
      }
    },
    [navigate]
  );

  const filteredProperties = useMemo(() => {
    return commercialProperties.filter((property) => {
      const matchesType = filterType === "all" || property.type === filterType;
      const matchesSearch =
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [commercialProperties, filterType, searchQuery]);

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

        {/* Enhanced Filters and Search */}
        <div className="container mx-auto px-4 py-8">
          <div className="shadow-sm backdrop-blur-sm bg-card/80 border border-muted/60 rounded-lg p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Search commercial properties"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={filterType}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Filter by property type"
                >
                  {propertyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Sort properties by"
                >
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="roi-desc">ROI: High to Low</option>
                  <option value="size-desc">Size: Large to Small</option>
                  <option value="rating-desc">Rating: High to Low</option>
                </select>

                {/* View Mode Toggle */}
                <div
                  className="flex bg-muted rounded-md p-1"
                  role="group"
                  aria-label="View mode selection"
                >
                  <button
                    type="button"
                    onClick={() => handleViewModeChange("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-background shadow-sm" : ""}`}
                    aria-label="Grid view"
                    aria-pressed={viewMode === "grid" ? "true" : "false"}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange("list")}
                    className={`p-2 rounded ${viewMode === "list" ? "bg-background shadow-sm" : ""}`}
                    aria-label="List view"
                    aria-pressed={viewMode === "list" ? "true" : "false"}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              Showing {filteredProperties.length} commercial properties
            </p>
          </div>

          {/* Enhanced Properties Grid/List with Animations */}
          <div
            className={
              viewMode === "grid" ?
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }
          >
            {filteredProperties.map((property, idx) => (
              <div
                key={property.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${idx * 75}ms` }}
              >
                <ListingCard
                  property={adaptCommercialPropertyToProperty(property)}
                  className={
                    viewMode === "list"
                      ? "flex flex-row max-w-none"
                      : "group rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  }
                  onClick={() => handlePropertyClick(property)}
                />
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button
              type="button"
              className="bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-medium hover:bg-secondary-hover transition-colors"
            >
              Load More Properties
            </button>
          </div>
        </div>

        {/* Compare Bar */}
        <CompareBar />
      </div>
    </CompareProvider>
  );
}
