import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Home, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertySearchProps {
  onSearch: (query: string) => void;
}

export default function PropertySearch({ onSearch }: PropertySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");

  // Memoized search handler to prevent unnecessary re-renders
  const handleSearch = useCallback(() => {
    // Filter out empty values and create a more structured search query
    const searchParams = [
      searchQuery.trim(),
      location.trim(),
      propertyType,
      priceRange
    ].filter(param => param !== "");

    // Join with spaces for natural language search
    const finalQuery = searchParams.join(' ');
    
    // Only call onSearch if we have something to search for
    if (finalQuery) {
      onSearch(finalQuery);
    }
  }, [searchQuery, location, propertyType, priceRange, onSearch]);

  // Handle Enter key press for better user experience
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear all search filters
  const handleClear = () => {
    setSearchQuery("");
    setLocation("");
    setPropertyType("");
    setPriceRange("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-4">
        {/* Main search input with icon */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search properties (e.g., 3 bedroom house, luxury apartment...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 h-12 text-lg"
          />
        </div>

        {/* Filter row with enhanced styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Input
              placeholder="Location (city, neighborhood, zip)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>

          {/* Property type selector */}
          <div className="relative">
            <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="loft">Loft</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price range selector */}
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-100k">Under $100,000</SelectItem>
                <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
                <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
                <SelectItem value="500k-750k">$500,000 - $750,000</SelectItem>
                <SelectItem value="750k-1m">$750,000 - $1,000,000</SelectItem>
                <SelectItem value="1m-2m">$1,000,000 - $2,000,000</SelectItem>
                <SelectItem value="over-2m">Over $2,000,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={handleSearch}
            className="flex-1 h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700"
          >
            <Search className="mr-2 h-4 w-4" />
            Search Properties
          </Button>
          <Button 
            onClick={handleClear}
            variant="outline"
            className="px-6 h-12"
          >
            Clear
          </Button>
        </div>

        {/* Search preview (shows what will be searched) */}
        {(searchQuery || location || propertyType || priceRange) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Search terms:</span>{" "}
              {[searchQuery, location, propertyType, priceRange]
                .filter(Boolean)
                .join(" • ") || "No search terms entered"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}