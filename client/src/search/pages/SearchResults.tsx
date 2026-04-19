import { MapPin, Search } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

import { CompareBar } from "../../property/components/CompareBar";
import { CompareModal } from "../../property/components/CompareModal";
import { Button } from "../../local/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../local/components/ui/select";
import { Property } from "@shared/types/property";
import ConsolidatedSearch from "../components/ConsolidatedSearch";

// ============================================================================
// Types & Constants
// ============================================================================

type SortOption = "price-asc" | "price-desc" | "newest" | "relevance";

const SORT_OPTIONS = [
  { label: "Most Relevant", value: "relevance" as SortOption },
  { label: "Price: Low to High", value: "price-asc" as SortOption },
  { label: "Price: High to Low", value: "price-desc" as SortOption },
  { label: "Newest First", value: "newest" as SortOption },
] as const;

const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    title: "Modern 3-Bedroom Apartment in Westlands",
    description: "Beautiful modern apartment with city views and premium amenities",
    location: { address: "Westlands, Nairobi", state: "Nairobi", country: "Kenya" },
    price: 150_000,
    verified: true,
    images: ["/assets/apartment-luxury-1.jpg"],
    status: "available",
    verificationStatus: "verified",
    trustScore: 85,
    createdAt: new Date().toISOString(),
    category: "residential",
    type: "apartment",
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parkingSpaces: 2,
      yearBuilt: 2020,
      amenities: ["Swimming Pool", "Gym", "24/7 Security"],
      petFriendly: true,
      furnished: false,
    },
  },
  {
    id: "2",
    title: "Spacious Family Home in Karen",
    description: "Perfect family home with large garden and quiet neighborhood setting",
    location: { address: "Karen, Nairobi", state: "Nairobi", country: "Kenya" },
    price: 280_000,
    verified: true,
    images: ["/assets/house-executive-1.jpg"],
    status: "available",
    verificationStatus: "verified",
    trustScore: 92,
    createdAt: new Date().toISOString(),
    category: "residential",
    type: "house",
    features: {
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2500,
      parkingSpaces: 3,
      yearBuilt: 2018,
      amenities: ["Private Garden", "Gated Community", "Covered Parking"],
      petFriendly: true,
      furnished: false,
    },
  },
];

// ============================================================================
// Component
// ============================================================================

export default function SearchResults(): JSX.Element {
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showCompareModal, setShowCompareModal] = useState(false);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
  }, []);

  const sortedProperties = useMemo(() => {
    const list = [...MOCK_PROPERTIES];
    switch (sortBy) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "newest":
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "relevance":
      default:
        return list;
    }
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 navbar-offset pb-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Search Properties</h1>
          <ConsolidatedSearch
            onResults={(results) => console.log("Search results:", results)}
            onFiltersChange={(filters) => console.log("Filters changed:", filters)}
          />
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Results */}
          <main className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                <p className="text-gray-600">
                  {sortedProperties.length} {sortedProperties.length === 1 ? "property" : "properties"} found
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
                <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortOption)}>
                  <SelectTrigger className="w-44" aria-label="Sort results">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid */}
            {sortedProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedProperties.map((property) => (
                  <Card key={property.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative">
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <MapPin className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{property.location.address}</p>
                      <p className="text-lg font-bold text-gray-900">
                        KES {property.price.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2 text-gray-900">No properties found</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Try adjusting your search filters or criteria to find more properties.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Pagination Placeholder */}
            {sortedProperties.length > 0 && (
              <nav className="flex justify-center mt-8" aria-label="Pagination">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                    1
                  </Button>
                  <Button variant="outline" size="sm">
                    2
                  </Button>
                  <Button variant="outline" size="sm">
                    3
                  </Button>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </div>
              </nav>
            )}
          </main>

          {/* Map Sidebar */}
          <aside className="lg:w-96">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Map View
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Interactive map will display here</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Showing {sortedProperties.length} properties
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* Compare UI */}
      <CompareBar onQuickCompare={() => setShowCompareModal(true)} />
      <CompareModal isOpen={showCompareModal} onClose={() => setShowCompareModal(false)} />
    </div>
  );
}
