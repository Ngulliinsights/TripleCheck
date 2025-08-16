import React, { memo } from "react";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import { Badge } from "../../ui/badge";
import { cn } from "../../../lib/utils";
import type { NormalizedProperty } from "../../../types/property";

export interface PropertyFeaturesProps {
  property: NormalizedProperty;
  locationString: string;
  variant?: "standard" | "land" | "compact";
  className?: string;
}

/**
 * Shared PropertyFeatures component
 * Displays property features in a consistent format
 * Used by both PropertyCard and EnhancedLandCard components
 */
export const PropertyFeatures = memo<PropertyFeaturesProps>(
  ({ property, locationString, variant = "standard", className }) => {
    const features = property.features;

    if (variant === "land") {
      return (
        <div className={cn("space-y-3", className)}>
          {/* Location */}
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
            <span className="text-sm line-clamp-1 font-medium">
              {locationString}
            </span>
          </div>

          {/* Land Features Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium text-foreground">
                {features?.size || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium text-foreground capitalize">
                {property.type || property.category}
              </span>
            </div>
            {features?.bedrooms && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center">
                  <Bed className="w-3 h-3 mr-1" />
                  Beds:
                </span>
                <span className="font-medium text-foreground">
                  {features.bedrooms}
                </span>
              </div>
            )}
            {features?.bathrooms && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center">
                  <Bath className="w-3 h-3 mr-1" />
                  Baths:
                </span>
                <span className="font-medium text-foreground">
                  {features.bathrooms}
                </span>
              </div>
            )}
          </div>

          {/* Land Access Features */}
          {features && (
            <div className="flex flex-wrap gap-2">
              {features.waterAccess && (
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700"
                >
                  💧 Water Access
                </Badge>
              )}
              {features.roadAccess && (
                <Badge
                  variant="outline"
                  className="text-xs bg-gray-50 text-gray-700"
                >
                  🛣️ Road Access
                </Badge>
              )}
              {features.electricityAccess && (
                <Badge
                  variant="outline"
                  className="text-xs bg-yellow-50 text-yellow-700"
                >
                  ⚡ Electricity
                </Badge>
              )}
            </div>
          )}
        </div>
      );
    }

    if (variant === "compact") {
      return (
        <div className={cn("space-y-2", className)}>
          {/* Location */}
          <div className="flex items-start text-gray-600">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
            <span className="text-sm leading-relaxed">{locationString}</span>
          </div>

          {/* Compact Features */}
          {features && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {features.bedrooms && (
                <div
                  className="flex items-center"
                  title={`${features.bedrooms} bedroom${features.bedrooms !== 1 ? "s" : ""}`}
                >
                  <Bed className="w-4 h-4 mr-1.5 text-gray-500" />
                  <span>{features.bedrooms}</span>
                </div>
              )}
              {features.bathrooms && (
                <div
                  className="flex items-center"
                  title={`${features.bathrooms} bathroom${features.bathrooms !== 1 ? "s" : ""}`}
                >
                  <Bath className="w-4 h-4 mr-1.5 text-gray-500" />
                  <span>{features.bathrooms}</span>
                </div>
              )}
              {features.squareFeet && (
                <div
                  className="flex items-center"
                  title={`${features.squareFeet} square feet`}
                >
                  <Square className="w-4 h-4 mr-1.5 text-gray-500" />
                  <span>{features.squareFeet} sq ft</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Standard variant
    return (
      <div className={cn("space-y-3", className)}>
        {/* Location */}
        <div className="flex items-start text-gray-600">
          <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
          <span className="text-sm leading-relaxed">{locationString}</span>
        </div>

        {/* Property features */}
        {features && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {features.bedrooms && (
              <div
                className="flex items-center"
                title={`${features.bedrooms} bedroom${features.bedrooms !== 1 ? "s" : ""}`}
              >
                <Bed className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>{features.bedrooms}</span>
              </div>
            )}
            {features.bathrooms && (
              <div
                className="flex items-center"
                title={`${features.bathrooms} bathroom${features.bathrooms !== 1 ? "s" : ""}`}
              >
                <Bath className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>{features.bathrooms}</span>
              </div>
            )}
            {features.squareFeet && (
              <div
                className="flex items-center"
                title={`${features.squareFeet} square feet`}
              >
                <Square className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>{features.squareFeet} sq ft</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PropertyFeatures.displayName = "PropertyFeatures";

export default PropertyFeatures;