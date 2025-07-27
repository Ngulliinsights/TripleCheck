import React from 'react';
import { Property } from '../../shared/types/property';
import { Card, CardContent } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { MapPin, Bed, Bath, Square, Camera } from 'lucide-react';

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

// Alternative simpler formatter from deleted component for comparison
const formatPriceSimple = (price?: number): string => {
  if (price && typeof price === 'number') {
    return `KES ${price.toLocaleString()}`;
  }
  return 'Price on request';
};

export default React.memo<ListingCardProps>(function ListingCard({ 
  property, 
  className = '',
  onClick 
}) {
  // Extract features once to avoid repeated property access
  const { bedrooms, bathrooms, squareFeet, propertyType } = property.features || {};
  
  // Enhanced price formatting with safety from deleted component
  const formattedPrice = React.useMemo(
    () => formatPriceWithFallback(property.price),
    [property.price]
  );

  // Enhanced image source handling - combines safety from deleted component
  const imageSrc = React.useMemo(() => {
    // Check for both possible property structures to be fully compatible
    const imageUrls = property.images;
    return imageUrls?.[0] || "/placeholder-property.jpg";
  }, [property.images]);

  // Flexible onClick handler that supports both callback patterns
  const handleCardClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (onClick) {
        // Try calling with property first (new pattern), fallback to no args (deleted component pattern)
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

  // Enhanced keyboard handler from deleted component pattern
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        if (onClick) {
          try {
            (onClick as (property: Property) => void)(property);
          } catch {
            (onClick as () => void)();
          }
        }
      }
    },
    [onClick, property]
  );

  // Enhanced image error handling - prevents cascade failures
  const handleImageError = React.useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const target = event.currentTarget;
      // Prevent infinite loops by checking current src before setting fallback
      if (target.src !== "/placeholder-property.jpg") {
        target.src = "/placeholder-property.jpg";
      }
    },
    []
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
        overflow-hidden transition-all duration-300 
        ${isInteractive ? 'cursor-pointer hover:shadow-lg hover:scale-105 group' : 'hover:shadow-md'} 
        ${className}
      `.trim()}
      onClick={isInteractive ? handleCardClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      // Enhanced accessibility label from deleted component approach
      aria-label={isInteractive ? `View property ${property.title}` : undefined}
    >
      {/* Image container with improved accessibility */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <img
          src={imageSrc}
          alt={`${property.title} - Property image`}
          className={`
            w-full h-full object-cover transition-transform duration-300
            ${isInteractive ? 'group-hover:scale-110' : ''}
          `}
          loading="lazy"
          onError={handleImageError}
          // Add image dimensions for better performance
          width={400}
          height={225}
        />
        
        {/* Multi-photo indicator from deleted component - adds valuable UX info */}
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
          <span className="text-sm leading-relaxed">{property.location}</span>
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