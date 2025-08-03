import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Home,
  Building,
  TreePine,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import React, { useState, useCallback, useMemo, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";

import { CompareBar } from "../../property/components/CompareBar";
import { CompareModal } from "../../property/components/CompareModal";
import { CompareProvider } from "../../property/contexts/CompareContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { useDebounce } from "../hooks/useDebounce";
import { Property } from "../types/property";

// Lazy load the ListingCard for better performance
const ListingCard = lazy(() => import("../../property/components/ListingCard"));

// Enhanced type definitions for better type safety
interface PropertyCategory {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ComponentType<any>;
  readonly href: string;
  readonly count: string;
  readonly color: string;
  readonly bgColor: string;
}

// Removed unused PriceRange interface

interface SearchFilters {
  query: string;
  location: string;
  propertyType: string;
  priceMin: number | null;
  priceMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  verified: boolean;
}

// Improved constant definitions with proper typing
const PROPERTY_CATEGORIES: readonly PropertyCategory[] = [
  {
    id: "all",
    title: "All Properties",
    description: "Browse all verified properties",
    icon: Home,
    href: "/properties",
    count: "2,500+",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "residential",
    title: "Residential",
    description: "Houses, apartments, and condos",
    icon: Home,
    href: "/properties/residential",
    count: "1,800+",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "commercial",
    title: "Commercial",
    description: "Office spaces and retail properties",
    icon: Building,
    href: "/properties/commercial",
    count: "450+",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "land",
    title: "Land",
    description: "Verified land with comprehensive verification",
    icon: TreePine,
    href: "/properties/land",
    count: "250+",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
] as const;

const POPULAR_LOCATIONS: readonly string[] = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Malindi",
  "Kitale",
] as const;

// Removed unused PRICE_RANGES constant

// Remove local useDebounce implementation since we're importing it

// Enhanced mock API function with better error handling
const fetchProperties = async (filters: SearchFilters): Promise<Property[]> => {
  try {
    // Simulate realistic API delay with fixed range for testing
    await new Promise((resolve) => setTimeout(resolve, 800)); // Fixed delay for consistent testing

    // Mock data with real images from public/assets/Residential only - 4 properties
    const mockProperties: Property[] = [
      {
        id: 1,
        title: "Modern 3-Bedroom Apartment in Westlands",
        description:
          "Beautiful modern apartment with stunning city views and premium amenities. Features spacious rooms, modern kitchen, and excellent security.",
        location: "Westlands, Nairobi",
        price: "15000000",
        images: [
          "/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg",
          "/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg",
          "/assets/Residential/caroline-badran-aaONSK4BKxc-unsplash.jpg",
        ],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 1,
          yearBuilt: 2020,
          amenities: ["Swimming Pool", "Gym", "24/7 Security", "Elevator"],
          propertyType: "Apartment",
          petFriendly: false,
          furnished: true,
        },
        status: "verified",
      },
      {
        id: 2,
        title: "Luxury Villa in Karen",
        description:
          "Spacious family home with beautiful gardens and modern fixtures. Perfect for families seeking comfort and elegance.",
        location: "Karen, Nairobi",
        price: "45000000",
        images: [
          "/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg",
          "/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg",
          "/assets/Residential/luke-van-zyl-koH7IVuwRLw-unsplash.jpg",
        ],
        features: {
          bedrooms: 5,
          bathrooms: 4,
          squareFeet: 3500,
          parkingSpaces: 3,
          yearBuilt: 2018,
          amenities: ["Swimming Pool", "Garden", "Staff Quarters", "Generator"],
          propertyType: "House",
          petFriendly: true,
          furnished: false,
        },
        status: "verified",
      },
      {
        id: 3,
        title: "Elegant Penthouse in Kilimani",
        description:
          "Stunning penthouse with panoramic city views and luxury finishes. Features premium amenities and modern design.",
        location: "Kilimani, Nairobi",
        price: "32000000",
        images: [
          "/assets/Residential/joel-filipe-RFDP7_80v5A-unsplash.jpg",
          "/assets/Residential/krzysztof-hepner-V7Q0Oh3Az-c-unsplash.jpg",
          "/assets/Residential/sebastien-lavalaye-gNY6RsMIsPo-unsplash.jpg",
        ],
        features: {
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 2800,
          parkingSpaces: 2,
          yearBuilt: 2019,
          amenities: ["Rooftop Terrace", "Gym", "Concierge", "Wine Cellar"],
          propertyType: "Apartment",
          petFriendly: true,
          furnished: true,
        },
        status: "verified",
      },
      {
        id: 4,
        title: "Cozy Family Home in Kileleshwa",
        description:
          "Perfect family home with modern amenities and great location. Ideal for young families starting their journey.",
        location: "Kileleshwa, Nairobi",
        price: "18500000",
        images: [
          "/assets/Residential/jason-briscoe-AQl-J19ocWE-unsplash.jpg",
          "/assets/Residential/rebecca-chandler-z6Yn9hhlrJw-unsplash.jpg",
          "/assets/Residential/terrah-holly-pmhdkgRCbtE-unsplash.jpg",
        ],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1450,
          parkingSpaces: 2,
          yearBuilt: 2021,
          amenities: [
            "Garden",
            "Security",
            "Backup Generator",
            "Modern Kitchen",
          ],
          propertyType: "House",
          petFriendly: true,
          furnished: false,
        },
        status: "verified",
      },
    ];

    // Apply filters to mock data for demonstration
    let filteredProperties = mockProperties;

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.title.toLowerCase().includes(query) ||
          property.description.toLowerCase().includes(query) ||
          (typeof property.location === "string" ?
            property.location
          : property.location.address || ""
          )
            .toLowerCase()
            .includes(query)
      );
    }

    if (filters.location) {
      filteredProperties = filteredProperties.filter((property) =>
        (typeof property.location === "string" ?
          property.location
        : property.location.address || ""
        )
          .toLowerCase()
          .includes(filters.location.toLowerCase())
      );
    }

    if (filters.propertyType) {
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.features?.propertyType?.toLowerCase() ===
          filters.propertyType.toLowerCase()
      );
    }

    if (filters.bedrooms) {
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.features?.bedrooms &&
          property.features.bedrooms >= (filters.bedrooms || 0)
      );
    }

    if (filters.bathrooms) {
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.features?.bathrooms &&
          property.features.bathrooms >= (filters.bathrooms || 0)
      );
    }

    if (filters.verified) {
      filteredProperties = filteredProperties.filter(
        (property) => property.verificationStatus === "verified"
      );
    }

    return filteredProperties;
  } catch (error) {
    // Log error in development mode only
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Error fetching properties:", error);
    }
    
    // Return mock data as fallback instead of throwing error
    const mockProperties: Property[] = [
      {
        id: 1,
        title: "Modern 3-Bedroom Apartment in Westlands",
        description:
          "Beautiful modern apartment with stunning city views and premium amenities. Features spacious rooms, modern kitchen, and excellent security.",
        location: "Westlands, Nairobi",
        price: "15000000",
        images: [
          "/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg",
          "/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg",
          "/assets/Residential/caroline-badran-aaONSK4BKxc-unsplash.jpg",
        ],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1200,
          parkingSpaces: 1,
          yearBuilt: 2020,
          amenities: ["Swimming Pool", "Gym", "24/7 Security", "Elevator"],
          propertyType: "Apartment",
          petFriendly: false,
          furnished: true,
        },
        status: "verified",
      },
      {
        id: 2,
        title: "Luxury Villa in Karen",
        description:
          "Spacious family home with beautiful gardens and modern fixtures. Perfect for families seeking comfort and elegance.",
        location: "Karen, Nairobi",
        price: "45000000",
        images: [
          "/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg",
          "/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg",
          "/assets/Residential/luke-van-zyl-koH7IVuwRLw-unsplash.jpg",
        ],
        features: {
          bedrooms: 5,
          bathrooms: 4,
          squareFeet: 3500,
          parkingSpaces: 3,
          yearBuilt: 2018,
          amenities: ["Swimming Pool", "Garden", "Staff Quarters", "Generator"],
          propertyType: "House",
          petFriendly: true,
          furnished: false,
        },
        status: "verified",
      },
      {
        id: 3,
        title: "Elegant Penthouse in Kilimani",
        description:
          "Stunning penthouse with panoramic city views and luxury finishes. Features premium amenities and modern design.",
        location: "Kilimani, Nairobi",
        price: "32000000",
        images: [
          "/assets/Residential/joel-filipe-RFDP7_80v5A-unsplash.jpg",
          "/assets/Residential/krzysztof-hepner-V7Q0Oh3Az-c-unsplash.jpg",
          "/assets/Residential/sebastien-lavalaye-gNY6RsMIsPo-unsplash.jpg",
        ],
        features: {
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 2800,
          parkingSpaces: 2,
          yearBuilt: 2019,
          amenities: ["Rooftop Terrace", "Gym", "Concierge", "Wine Cellar"],
          propertyType: "Apartment",
          petFriendly: true,
          furnished: true,
        },
        status: "verified",
      },
      {
        id: 4,
        title: "Cozy Family Home in Kileleshwa",
        description:
          "Perfect family home with modern amenities and great location. Ideal for young families starting their journey.",
        location: "Kileleshwa, Nairobi",
        price: "18500000",
        images: [
          "/assets/Residential/jason-briscoe-AQl-J19ocWE-unsplash.jpg",
          "/assets/Residential/rebecca-chandler-z6Yn9hhlrJw-unsplash.jpg",
          "/assets/Residential/terrah-holly-pmhdkgRCbtE-unsplash.jpg",
        ],
        features: {
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1450,
          parkingSpaces: 2,
          yearBuilt: 2021,
          amenities: [
            "Garden",
            "Security",
            "Backup Generator",
            "Modern Kitchen",
          ],
          propertyType: "House",
          petFriendly: true,
          furnished: false,
        },
        status: "verified",
      },
    ];
    
    // Apply the same filters to fallback data
    let filteredProperties = mockProperties;

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.title.toLowerCase().includes(query) ||
          property.description.toLowerCase().includes(query) ||
          (typeof property.location === 'string' ? property.location : property.location.address || '').toLowerCase().includes(query)
      );
    }

    if (filters.location) {
      filteredProperties = filteredProperties.filter((property) =>
        (typeof property.location === 'string' ? property.location : property.location.address || '').toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.propertyType) {
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.features?.propertyType?.toLowerCase() ===
          filters.propertyType.toLowerCase()
      );
    }

    if (filters.bedrooms) {
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.features?.bedrooms &&
          property.features.bedrooms >= (filters.bedrooms || 0)
      );
    }

    if (filters.bathrooms) {
      filteredProperties = filteredProperties.filter(
        (property) =>
          property.features?.bathrooms &&
          property.features.bathrooms >= (filters.bathrooms || 0)
      );
    }

    if (filters.verified) {
      filteredProperties = filteredProperties.filter(
        (property) => property.verificationStatus === "verified"
      );
    }

    return filteredProperties;
  }
};

// Properties content component that uses the compare context
function PropertiesContent(): JSX.Element {
  const navigate = useNavigate();

  // State management with proper typing
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    location: "",
    propertyType: "",
    priceMin: null,
    priceMax: null,
    bedrooms: null,
    bathrooms: null,
    verified: false,
  });

  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  // Debounce search query to reduce API calls
  const debouncedFilters = useDebounce(filters, 500);

  // Memoize the property query to prevent unnecessary re-renders
  const {
    data: properties,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["properties", debouncedFilters],
    queryFn: () => fetchProperties(debouncedFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Optimized event handlers with useCallback to prevent unnecessary re-renders
  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Force immediate search by bypassing debounce
      refetch();
    },
    [refetch]
  );

  const handleFilterChange = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      query: "",
      location: "",
      propertyType: "",
      priceMin: null,
      priceMax: null,
      bedrooms: null,
      bathrooms: null,
      verified: false,
    });
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleShowCompareModal = useCallback(() => {
    setShowCompareModal(true);
  }, []);

  const handleCloseCompareModal = useCallback(() => {
    setShowCompareModal(false);
  }, []);

  // Memoize category navigation handler
  const handleCategoryClick = useCallback(
    (href: string) => {
      navigate(href);
    },
    [navigate]
  );

  // Handle property card click to navigate to details
  const handlePropertyClick = useCallback(
    (property: Property) => {
      // Check if this is a land property and navigate to the appropriate route
      const propertyType =
        property.type ||
        property.propertyType ||
        property.features?.propertyType;
      const isLandProperty =
        propertyType === "land" ||
        property.title?.toLowerCase().includes("land") ||
        property.description?.toLowerCase().includes("land");

      if (isLandProperty) {
        navigate(`/land/${property.id}`);
      } else {
        navigate(`/property/${property.id}`);
      }
    },
    [navigate]
  );

  // Memoize loading skeleton count
  const skeletonItems = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({ id: i })),
    []
  );

  // Memoize property count display
  const propertyCountText = useMemo(() => {
    if (isLoading) return "Loading...";
    const count = properties?.length || 0;
    return `${count} ${count === 1 ? "property" : "properties"}`;
  }, [isLoading, properties?.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 py-20 md:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239ca3af' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
              Find Your Perfect
              <span className="text-primary"> Verified Property</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Browse thousands of verified properties across Kenya. Every
              listing is authenticated and fraud-checked.
            </p>
          </div>

          {/* Enhanced Search Bar with better accessibility */}
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 border-muted/60 shadow-sm backdrop-blur-sm bg-card/80">
              <form onSubmit={handleSearch} className="space-y-4" role="search">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      aria-hidden="true"
                    />
                    <Input
                      type="text"
                      placeholder="Search properties..."
                      value={filters.query}
                      onChange={(e) =>
                        handleFilterChange("query", e.target.value)
                      }
                      className="pl-10"
                      aria-label="Search properties"
                    />
                  </div>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                      aria-hidden="true"
                    />
                    <select
                      value={filters.location}
                      onChange={(e) =>
                        handleFilterChange("location", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Select location"
                    >
                      <option value="">All Locations</option>
                      {POPULAR_LOCATIONS.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {isLoading ? "Searching..." : "Search"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleFilters}
                      aria-label={showFilters ? "Hide filters" : "Show filters"}
                      aria-expanded={showFilters}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Enhanced Advanced Filters with better accessibility */}
                {showFilters && (
                  <div
                    className="border-t pt-4 mt-4"
                    role="region"
                    aria-label="Advanced filters"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <select
                        value={filters.propertyType}
                        onChange={(e) =>
                          handleFilterChange("propertyType", e.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Property type"
                      >
                        <option value="">Property Type</option>
                        <option value="apartment">Apartment</option>
                        <option value="house">House</option>
                        <option value="commercial">Commercial</option>
                        <option value="land">Land</option>
                      </select>

                      <select
                        value={filters.bedrooms?.toString() || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "bedrooms",
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Minimum bedrooms"
                      >
                        <option value="">Bedrooms</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                        <option value="5">5+</option>
                      </select>

                      <select
                        value={filters.bathrooms?.toString() || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "bathrooms",
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Minimum bathrooms"
                      >
                        <option value="">Bathrooms</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                      </select>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="verified-filter"
                          checked={filters.verified}
                          onChange={(e) =>
                            handleFilterChange("verified", e.target.checked)
                          }
                          className="mr-2 rounded focus:ring-2 focus:ring-blue-500"
                          aria-describedby="verified-filter-description"
                        />
                        <label htmlFor="verified-filter" className="text-sm">
                          Verified Only
                        </label>
                        <span
                          id="verified-filter-description"
                          className="sr-only"
                        >
                          Show only verified properties
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-600" aria-live="polite">
                        {propertyCountText}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Property Categories with improved interaction */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find the perfect property type for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROPERTY_CATEGORIES.map((category) => (
              <Card
                key={category.id}
                className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500"
                onClick={() => handleCategoryClick(category.href)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCategoryClick(category.href);
                  }
                }}
                aria-label={`Browse ${category.title} - ${category.description}`}
              >
                <CardHeader className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${category.bgColor} mx-auto mb-4`}
                  >
                    <category.icon
                      className={`w-8 h-8 ${category.color}`}
                      aria-hidden="true"
                    />
                  </div>
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <p className="text-gray-600">{category.description}</p>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {category.count}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Browse {category.title}
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Property Listings with enhanced error handling */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-600" aria-live="polite">
                {propertyCountText}
              </span>
            </div>
          </div>

          {/* Improved Loading State */}
          {isLoading && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              role="status"
              aria-label="Loading properties"
            >
              {skeletonItems.map((item) => (
                <div key={item.id} className="space-y-4 animate-pulse">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading properties...</span>
            </div>
          )}

          {/* Enhanced Error State */}
          {error && (
            <div className="text-center py-12" role="alert">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  Unable to Load Properties
                </h3>
                <p className="text-red-600 mb-4">
                  {error instanceof Error ?
                    error.message
                  : "There was an error loading the properties. Please try again."
                  }
                </p>
                <Button onClick={() => refetch()} disabled={isLoading}>
                  {isLoading ? "Retrying..." : "Try Again"}
                </Button>
              </div>
            </div>
          )}

          {/* Properties Grid with better empty state */}
          {!isLoading && !error && properties && (
            <>
              {properties.length > 0 ?
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Suspense
                    fallback={
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }, (_, i) => (
                          <div key={i} className="space-y-4 animate-pulse">
                            <Skeleton className="aspect-[16/10] rounded-2xl" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-3/4 rounded-md" />
                              <Skeleton className="h-4 w-1/2 rounded-md" />
                              <Skeleton className="h-6 w-1/3 rounded-md" />
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  >
                    {properties.map((property, idx) => (
                      <div
                        key={property.id}
                        className="animate-fadeInUp"
                        style={{ animationDelay: `${idx * 75}ms` }}
                      >
                        <ListingCard
                          property={property}
                          className="group rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                          onClick={handlePropertyClick}
                        />
                      </div>
                    ))}
                  </Suspense>
                </div>
              : <div className="text-center py-12">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                    <Search
                      className="w-16 h-16 mx-auto text-gray-400 mb-4"
                      aria-hidden="true"
                    />
                    <h3 className="text-xl font-medium mb-2">
                      No Properties Found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your search criteria or browse all
                      properties.
                    </p>
                    <Button onClick={clearFilters}>Clear Filters</Button>
                  </div>
                </div>
              }
            </>
          )}
        </div>
      </section>

      {/* CTA Section with improved design and accessibility */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Can't Find What You're Looking For?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Let us help you find the perfect property or list your own with
              our comprehensive verification services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate("/services/list-property")}
              >
                List Your Property
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => navigate("/contact")}
              >
                Contact Agent
              </Button>
            </div>

            {/* Additional trust indicators */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Verified Properties
                  </h3>
                  <p className="text-sm text-gray-600">
                    Every listing is thoroughly authenticated
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Fraud Protection
                  </h3>
                  <p className="text-sm text-gray-600">
                    Advanced fraud detection and prevention
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Expert Support
                  </h3>
                  <p className="text-sm text-gray-600">
                    Professional guidance throughout your journey
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Compare Bar */}
      <CompareBar onQuickCompare={handleShowCompareModal} />

      {/* Compare Modal */}
      <CompareModal
        isOpen={showCompareModal}
        onClose={handleCloseCompareModal}
      />
    </div>
  );
}

// Main component wrapper with CompareProvider
export default function Properties(): JSX.Element {
  return (
    <CompareProvider>
      <PropertiesContent />
    </CompareProvider>
  );
}
