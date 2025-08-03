import { MapPin, Bed, Bath, Square, Camera, Plus, Check } from 'lucide-react';
import React from 'react';

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
  const isInCompare = isSelected(property.id);
  
  // Extract features once to avoid repeated property access
  const { bedrooms, bathrooms, squareFeet, propertyType } = property.features || {};
  
  // Enhanced price formatting with safety from deleted component
  const formattedPrice = React.useMemo(
    () => formatPriceWithFallback(property.price),
    [property.price]
  );

  // Enhanced image source handling with loading state and stable references
  const [imageLoaded, setImageLoaded] = React.useState(false);
  
  // Stable image source to prevent unnecessary re-renders
  const imageSrc = React.useMemo(() => {
    const imageUrls = property.images;
    const primaryImage = imageUrls?.[0];
    
    // Return the primary image if it exists, otherwise use inline SVG placeholder
    if (primaryImage) {
      return primaryImage;
    }
    
    // Inline SVG placeholder to avoid any network requests
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%23f3f4f6'/%3E%3Ctext x='200' y='112.5' text-anchor='middle' dy='.3em' fill='%23374151' font-family='Arial, sans-serif' font-size='16'%3EProperty%3C/text%3E%3C/svg%3E";
  }, [property.images]);
  
  // Reset image loaded state when property ID changes (not just image src)
  React.useEffect(() => {
    setImageLoaded(false);
  }, [property.id]);

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
        removeFromCompare(property.id);
      } else if (canAddMore) {
        addToCompare(property);
      }
    },
    [isInCompare, canAddMore, addToCompare, removeFromCompare, property]
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

  // Enhanced image error handling - prevents cascade failures
  const handleImageError = React.useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      const target = event.currentTarget;
      const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect width='400' height='225' fill='%23f3f4f6'/%3E%3Ctext x='200' y='112.5' text-anchor='middle' dy='.3em' fill='%23374151' font-family='Arial, sans-serif' font-size='16'%3EProperty%3C/text%3E%3C/svg%3E";
      
      // Only set fallback if we're not already using an SVG
      if (!target.src.includes('data:image/svg+xml')) {
        target.src = fallbackSvg;
      }
      
      setImageLoaded(true); // Consider error state as "loaded" to prevent flickering
    },
    []
  );
  
  // Handle successful image load
  const handleImageLoad = React.useCallback(() => {
    setImageLoaded(true);
  }, []);
  
  // Preload image to reduce flickering - using standard Image constructor
  React.useEffect(() => {
    if (imageSrc && !imageSrc.includes('data:image/svg+xml')) {
      const img = new Image(); // Use Image constructor instead of HTMLImageElement
      img.onload = () => setImageLoaded(true);
      img.onerror = () => {
        setImageLoaded(true);
      };
      img.src = imageSrc;
    } else {
      // SVG images load immediately
      setImageLoaded(true);
    }
  }, [imageSrc]);

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
      {/* Image container with improved accessibility and loading states */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        )}
        
        <img
          src={imageSrc}
          alt={`${property.title} property`} // Simplified alt text to avoid redundancy
          className={`
            w-full h-full object-cover transition-all duration-300
            ${isInteractive ? 'group-hover:scale-110' : ''}
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          loading="lazy"
          onError={handleImageError}
          onLoad={handleImageLoad}
          // Add image dimensions for better performance
          width={400}
          height={225}
          // Prevent dragging to reduce flickering
          draggable={false}
          // Stable key based on property ID to prevent unnecessary re-renders
          key={`${property.id}-${imageSrc}`}
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

// Set display name for React DevTools
ListingCard.displayName = 'ListingCard';

export default ListingCard;