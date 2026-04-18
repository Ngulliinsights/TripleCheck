import { Home, Bed, Bath, Star, Heart, PawPrint } from "lucide-react"
import React, { useCallback } from "react"

import type { ResidentialFilters } from '@shared/types/property'
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Label } from "../../ui/label"

import { BasePropertyFiltersComponent } from "./BasePropertyFilters"

interface ResidentialFiltersProps {
  readonly filters: ResidentialFilters;
  readonly onChange: (filters: ResidentialFilters) => void;
  readonly onReset: () => void;
  readonly errors?: Record<string, string>;
}

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: "🏢" },
  { value: "house", label: "House", icon: "🏠" },
  { value: "duplex", label: "Duplex", icon: "🏘️" },
  { value: "penthouse", label: "Penthouse", icon: "🏙️" },
  { value: "studio", label: "Studio", icon: "🏠" },
  { value: "townhouse", label: "Townhouse", icon: "🏘️" },
  { value: "villa", label: "Villa", icon: "🏛️" },
];

const POPULAR_AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Parking",
  "Security",
  "Garden",
  "Balcony",
  "Elevator",
  "Generator",
  "Water Tank",
  "Internet",
  "Air Conditioning",
  "Fireplace",
];

/**
 * Residential property filters component
 * Extends base filters with residential-specific options
 */
export function ResidentialFiltersComponent({
  filters,
  onChange,
  onReset,
  errors = {},
}: ResidentialFiltersProps): React.ReactElement {
  const updateFilter = useCallback(
    <K extends keyof ResidentialFilters>(
      key: K,
      value: ResidentialFilters[K]
    ) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  const toggleAmenity = useCallback(
    (amenity: string) => {
      const currentAmenities = filters.amenities || [];
      const newAmenities =
        currentAmenities.includes(amenity) ?
          currentAmenities.filter((a) => a !== amenity)
        : [...currentAmenities, amenity];
      updateFilter("amenities", newAmenities);
    },
    [filters.amenities, updateFilter]
  );

  const clearAmenities = useCallback(() => {
    updateFilter("amenities", []);
  }, [updateFilter]);

  return (
    <div className="space-y-6">
      {/* Base Filters */}
      <BasePropertyFiltersComponent
        filters={filters}
        onChange={(baseFilters) =>
          onChange({ ...filters, ...baseFilters, category: "residential" })
        }
        onReset={onReset}
        errors={errors}
      />

      {/* Residential-Specific Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Residential Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Property Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={
                    filters.propertyType === type.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    updateFilter(
                      "propertyType",
                      filters.propertyType === type.value ? "" : type.value
                    )
                  }
                  className="justify-start"
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Bedrooms and Bathrooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bedrooms */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Bed className="w-4 h-4" />
                Minimum Bedrooms
              </Label>
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <Button
                    key={num}
                    variant={filters.bedrooms === num ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      updateFilter(
                        "bedrooms",
                        filters.bedrooms === num ? null : num
                      )
                    }
                    className="aspect-square"
                  >
                    {num}
                  </Button>
                ))}
              </div>
              {filters.bedrooms && (
                <p className="text-sm text-muted-foreground">
                  Showing properties with {filters.bedrooms}+ bedrooms
                </p>
              )}
            </div>

            {/* Bathrooms */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Bath className="w-4 h-4" />
                Minimum Bathrooms
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Button
                    key={num}
                    variant={filters.bathrooms === num ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      updateFilter(
                        "bathrooms",
                        filters.bathrooms === num ? null : num
                      )
                    }
                    className="aspect-square"
                  >
                    {num}
                  </Button>
                ))}
              </div>
              {filters.bathrooms && (
                <p className="text-sm text-muted-foreground">
                  Showing properties with {filters.bathrooms}+ bathrooms
                </p>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Amenities
              </Label>
              {filters.amenities && filters.amenities.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAmenities}
                  className="text-muted-foreground"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {POPULAR_AMENITIES.map((amenity) => {
                const isSelected =
                  filters.amenities?.includes(amenity) || false;
                return (
                  <Button
                    key={amenity}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleAmenity(amenity)}
                    className="justify-start text-xs"
                  >
                    {amenity}
                  </Button>
                );
              })}
            </div>
            {filters.amenities && filters.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {filters.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Additional Preferences
            </Label>
            <div className="space-y-3">
              {/* Furnished */}
              <div className="flex items-center space-x-2">
                <input
                  id="furnished"
                  type="checkbox"
                  checked={filters.furnished === true}
                  onChange={(e) =>
                    updateFilter(
                      "furnished",
                      e.target.checked ? true : undefined
                    )
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Furnished properties only"
                  title="Furnished properties only"
                />
                <Label
                  htmlFor="furnished"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Heart className="w-4 h-4" />
                  Furnished properties only
                </Label>
              </div>

              {/* Pet Friendly */}
              <div className="flex items-center space-x-2">
                <input
                  id="pet-friendly"
                  type="checkbox"
                  checked={filters.petFriendly === true}
                  onChange={(e) =>
                    updateFilter(
                      "petFriendly",
                      e.target.checked ? true : undefined
                    )
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Pet-friendly properties only"
                  title="Pet-friendly properties only"
                />
                <Label
                  htmlFor="pet-friendly"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <PawPrint className="w-4 h-4" />
                  Pet-friendly properties only
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export as default for lazy loading
export default ResidentialFiltersComponent;

// Also export with the original name for backward compatibility
export { ResidentialFiltersComponent as ResidentialFilters };
