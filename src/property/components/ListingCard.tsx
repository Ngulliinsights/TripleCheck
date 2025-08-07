import { MapPin, Bed, Bath, Square, Camera, Plus, Check, Eye } from 'lucide-react';
import React, { useState } from 'react';

import ImageGallery from '../../shared/components/images/ImageGallery';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent } from '../../shared/components/ui/card';
import { Property } from '../../shared/types/property';
import { useCompare } from '../contexts/CompareContext';

interface ListingCardProps {
  property: Property;
  className?: string;
  // Enhanced onClick to be backwards compatible with both patterns
  onClick?: (() => void) | ((property: Property) => void);
}

// Enhanced price formatter with fallback - combines safety from deleted component
const formatPriceWithFallback = (price?: number): string => {
  if (price && typeof price === 'number') {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }
  return 'Price on request';
};

// Named export component with explicit display name for React DevTools
const ListingCard = React.memo<ListingCardProps>(({ 
  property, 
  className = '',
  onClick 
}) => {
  // Compare functionality
  const { addToCompare, removeFromCompare, isSelected, canAddMore } = useCompare();
  const propertyId = String(property.id);
  const isInCompare = isSelected(propertyId);
  
  // Extract features once to avoid repeated property access
  const { bedrooms, bathrooms, squareFeet, propertyType } = property.features || {};
  
  // Enhanced price formatting with safety from deleted component
  const formattedPrice = React.useMemo(() => {
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price;
    return formatPriceWithFallback(price);
  }, [property.price]);

  // Simplified image source using basic img tag
  const imageSrc = React.useMemo(() => {
    const imageUrls = property.images;
    return imageUrls?.[0] || '/placeholder-property.jpg';
  }, [property.images]);
  
  // Determine land type for proper placeholder
  const landType = React.useMemo(() => {
    const type = property.features?.propertyType?.toLowerCase();
    if (type === 'land' || property.title?.toLowerCase().includes('land')) {
      return 'agricultural' as const;
    }
    if (type === 'commercial') return 'commercial' as const;
    if (type === 'industrial') return 'industrial' as const;
    return 'residential' as const;
  }, [property.features?.propertyType, property.title]);

  // Flexible onClick handler that supports both callback patterns
  const handleCardClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (onClick) {
        // Try calling with property first (new pattern), fallback to no args (old pattern)
        try {
          (onClick as (property: Property) => void)(property);
        } catch {
          // Fallback to simple onClick pattern from deleted component
          (onClick as () => void)();
        }
      }
    },
    [onClick, property]
  );

  // Compare button handler
  const handleCompareClick = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent card click
      if (isInCompare) {
        removeFromCompare(propertyId);
      } else if (canAddMore) {
        // Convert Property to CompareProperty for comparison
        const compareProperty = {
          id: propertyId,
          title: property.title,
          price: typeof property.price === 'string' ? parseFloat(property.price) : (property.price || 0),
          location: typeof property.location === 'string' 
            ? property.location 
            : property.location?.address || 'Location not specified',
          description: property.description,
          images: property.images || [],
          features: property.features,
          verificationStatus: property.verificationStatus,
          trustScore: property.trustScore,
          type: property.type === 'commercial' ? 'commercial' as const : 'residential' as const,
          aiVerificationResults: property.aiVerificationResults
        };
        addToCompare(compareProperty);
      }
    },
    [isInCompare, canAddMore, addToCompare, removeFromCompare, property, propertyId]
  );

  // Enhanced keyboard handler for accessibility
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        try {
          (onClick as (property: Property) => void)(property);
        } catch {
          (onClick as () => void)();
        }
      }
    },
    [onClick, property]
  );

  // Determine if card should be interactive
  const isInteractive = Boolean(onClick);

  // Calculate image count for display - borrowed from deleted component
  const imageCount = React.useMemo(() => {
    const imageUrls = property.images;
    return imageUrls?.length || 0;
  }, [property.images]);

  return (
    <Card 
      className={`
        glass-property-card overflow-hidden transition-all duration-300 
        ${isInteractive ? 'cursor-pointer group' : ''} 
        ${className}
      `.trim()}
      onClick={isInteractive ? handleCardClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      // Enhanced accessibility label
      aria-label={isInteractive ? `View property ${property.title}` : undefined}
    >
      {/* Image container using basic img tag */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={imageSrc}
          alt={`${property.title} property`}
          width={400}
          height={225}
          className={`
            w-full h-full object-cover transition-all duration-300
            ${isInteractive ? 'group-hover:scale-110' : ''}
          `}
          loading="lazy"
          landType={landType}
          priority={false}
        />
        
        {/* Multi-photo indicator - adds valuable UX info */}
        {imageCount > 1 && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1.5 rounded-md flex items-center gap-1 shadow-sm">
            <Camera className="w-3 h-3" aria-hidden="true" />
            <span>{imageCount}</span>
          </div>
        )}
        
        {/* Status badge with coral accent for featured properties */}
        {property.status === 'verified' && (
          <Badge 
            className="absolute top-3 right-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-sm"
            aria-label="Verified property"
          >
            Verified
          </Badge>
        )}
        
        {/* Compare button */}
        <Button
          size="sm"
          variant={isInCompare ? "default" : "outline"}
          className={`absolute bottom-2 right-2 h-8 w-8 p-0 shadow-sm ${
            !canAddMore && !isInCompare ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleCompareClick}
          disabled={!canAddMore && !isInCompare}
          title={isInCompare ? 'Remove from comparison' : 'Add to comparison'}
        >
          {isInCompare ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <CardContent className="p-4 space-y-3">
        {/* Property title with coral hover state */}
        <h3 className={`
          font-semibold text-lg leading-tight line-clamp-2
          ${isInteractive ? 'group-hover:text-secondary transition-colors' : ''}
        `}>
          {property.title}
        </h3>
        
        {/* Location with improved layout */}
        <div className="flex items-start text-gray-600">
          <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
          <span className="text-sm leading-relaxed">
            {typeof property.location === 'string' 
              ? property.location 
              : property.location?.address || 'Location not specified'
            }
          </span>
        </div>

        {/* Property features with conditional rendering */}
        {(bedrooms || bathrooms || squareFeet) && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {bedrooms && (
              <div className="flex items-center" title={`${bedrooms} bedroom${bedrooms !== 1 ? 's' : ''}`}>
                <Bed className="w-4 h-4 mr-1.5 text-gray-500" aria-hidden="true" />
                <span>{bedrooms}</span>
              </div>
            )}
            {bathrooms && (
              <div className="flex items-center" title={`${bathrooms} bathroom${bathrooms !== 1 ? 's' : ''}`}>
                <Bath className="w-4 h-4 mr-1.5 text-gray-500" aria-hidden="true" />
                <span>{bathrooms}</span>
              </div>
            )}
            {squareFeet && (
              <div className="flex items-center" title={`${squareFeet} square feet`}>
                <Square className="w-4 h-4 mr-1.5 text-gray-500" aria-hidden="true" />
                <span>{squareFeet} sq ft</span>
              </div>
            )}
          </div>
        )}

        {/* Price and property type with coral accent */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xl font-bold text-secondary" aria-label={`Price: ${formattedPrice}`}>
            {formattedPrice}
          </p>
          {propertyType && (
            <Badge 
              variant="outline" 
              className="text-xs font-medium"
              title={`Property type: ${propertyType}`}
            >
              {propertyType}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// Set display name for React DevTools
ListingCard.displayName = 'ListingCard';

export default ListingCard;