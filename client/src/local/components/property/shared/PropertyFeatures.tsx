import React, { memo } from 'react'
import { Bed, Bath, Square, MapPin } from 'lucide-react'
import { Badge } from '../../ui/badge'
import { cn } from '../../../lib/utils'
import type { NormalizedProperty } from '@shared/types/property'

export interface PropertyFeaturesProps {
  property: NormalizedProperty
  locationString: string
  variant?: 'standard' | 'land' | 'compact'
  className?: string
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function LocationRow({ locationString }: { locationString: string }) {
  return (
    <div className="flex items-start text-gray-600">
      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
      <span className="text-sm leading-relaxed">{locationString}</span>
    </div>
  )
}

interface FeaturePillsProps {
  bedrooms?: number | null
  bathrooms?: number | null
  squareFeet?: number | null
}

/** Horizontal row of bed / bath / area chips — used by standard & compact variants. */
function FeaturePills({ bedrooms, bathrooms, squareFeet }: FeaturePillsProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      {bedrooms != null && (
        <div className="flex items-center" title={`${bedrooms} bedroom${bedrooms !== 1 ? 's' : ''}`}>
          <Bed className="w-4 h-4 mr-1.5 text-gray-500" />
          <span>{bedrooms}</span>
        </div>
      )}
      {bathrooms != null && (
        <div className="flex items-center" title={`${bathrooms} bathroom${bathrooms !== 1 ? 's' : ''}`}>
          <Bath className="w-4 h-4 mr-1.5 text-gray-500" />
          <span>{bathrooms}</span>
        </div>
      )}
      {squareFeet != null && (
        <div className="flex items-center" title={`${squareFeet} square feet`}>
          <Square className="w-4 h-4 mr-1.5 text-gray-500" />
          <span>{squareFeet} sq ft</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Land variant
// ---------------------------------------------------------------------------

function LandFeatures({
  property,
  locationString,
  className,
}: Pick<PropertyFeaturesProps, 'property' | 'locationString' | 'className'>) {
  const features = property.features

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center text-muted-foreground">
        <MapPin className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
        <span className="text-sm line-clamp-1 font-medium">{locationString}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Size:</span>
          <span className="font-medium text-foreground">{features?.size ?? 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type:</span>
          <span className="font-medium text-foreground capitalize">
            {property.type ?? property.category}
          </span>
        </div>
        {features?.bedrooms != null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center">
              <Bed className="w-3 h-3 mr-1" />
              Beds:
            </span>
            <span className="font-medium text-foreground">{features.bedrooms}</span>
          </div>
        )}
        {features?.bathrooms != null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center">
              <Bath className="w-3 h-3 mr-1" />
              Baths:
            </span>
            <span className="font-medium text-foreground">{features.bathrooms}</span>
          </div>
        )}
      </div>

      {features && (
        <div className="flex flex-wrap gap-2">
          {features.waterAccess && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              💧 Water Access
            </Badge>
          )}
          {features.roadAccess && (
            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700">
              🛣️ Road Access
            </Badge>
          )}
          {features.electricityAccess && (
            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
              ⚡ Electricity
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Shared PropertyFeatures component.
 * Renders property features in a consistent format across PropertyCard and EnhancedLandCard.
 */
export const PropertyFeatures = memo<PropertyFeaturesProps>(
  ({ property, locationString, variant = 'standard', className }) => {
    if (variant === 'land') {
      return (
        <LandFeatures property={property} locationString={locationString} className={className} />
      )
    }

    // 'standard' and 'compact' share the same layout — compact simply omits no extra data,
    // so a single implementation covers both.  The distinction is purely semantic for callers.
    const features = property.features

    return (
      <div className={cn('space-y-2', className)}>
        <LocationRow locationString={locationString} />
        {features && (
          <FeaturePills
            bedrooms={features.bedrooms}
            bathrooms={features.bathrooms}
            squareFeet={features.squareFeet}
          />
        )}
      </div>
    )
  },
)

PropertyFeatures.displayName = 'PropertyFeatures'

export default PropertyFeatures