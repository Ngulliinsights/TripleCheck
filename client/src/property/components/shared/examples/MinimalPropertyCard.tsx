import React, { memo } from "react"
import { Card, CardContent } from "../../../ui/card"
import { cn } from "../../../../lib/utils"
import type { NormalizedProperty } from '@shared/types/property'
import {
  useImageGallery,
  usePropertyCardActions,
  usePropertyFormatting,
  usePropertyCardState,
} from "../../../../hooks"
import { PropertyImageSection, PropertyFeatures } from "../"

interface MinimalPropertyCardProps {
  property: NormalizedProperty;
  className?: string;
  onClick?: (property: NormalizedProperty) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
}

/**
 * Minimal example showing how to use shared hooks and components
 * This demonstrates the power of the refactored architecture
 */
export const MinimalPropertyCard = memo<MinimalPropertyCardProps>(
  ({ property, className, onClick, onSave, onShare }) => {
    // All the complex logic is now handled by shared hooks
    const gallery = useImageGallery({
      property,
      images: property.images || [],
    });

    const actions = usePropertyCardActions(property, {
      onSave,
      onShare,
      onViewDetails: () => onClick?.(property),
    });

    const { formattedPrice, locationString, displayTitle } = 
      usePropertyFormatting(property);

    const { isHovered, handleMouseEnter, handleMouseLeave } = 
      usePropertyCardState();

    return (
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg",
          className
        )}
        onClick={actions.handleCardClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Shared image section handles all the complexity */}
        <PropertyImageSection
          property={property}
          gallery={gallery}
          actions={actions}
          isHovered={isHovered}
          showQuickActions={true}
          isInWishlist={false}
          isInCompare={false}
          canAddMore={true}
          onCompareClick={() => {}} // Simplified for this example
        />

        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg line-clamp-2">
            {displayTitle}
          </h3>

          {/* Shared features component handles display logic */}
          <PropertyFeatures
            property={property}
            locationString={locationString}
            variant="compact"
          />

          <div className="text-xl font-bold text-primary">
            {formattedPrice.primary}
          </div>
        </CardContent>
      </Card>
    );
  }
);

MinimalPropertyCard.displayName = "MinimalPropertyCard";

export default MinimalPropertyCard;