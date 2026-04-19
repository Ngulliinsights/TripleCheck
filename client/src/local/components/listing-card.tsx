import { Property } from "../"
import { Card, CardContent, CardFooter } from "./ui/card"
import { Badge } from "./ui/badge"
import { Link } from "wouter"
import VerificationBadge from "./CommunityInsights"
import { MapPin, Home, Square } from "../index"
import { memo } from "react"

// Type-safe interface for property features to eliminate 'any' usage
interface PropertyFeatures {
  bedrooms?: number;
  squareFeet?: number;
  amenities?: string[];
}

// Enhanced interface with better type safety
interface ListingCardProps {
  property: Property & {
    features: PropertyFeatures;
  };
}

// Memoized component to prevent unnecessary re-renders when props haven't changed
const ListingCard = memo(function ListingCard({ property }: ListingCardProps) {
  // Extract features with proper type safety and fallback values
  const { bedrooms = 0, squareFeet = 0, amenities = [] } = property.features;
  
  // Safely get the first image with fallback
  const primaryImage = property.imageUrls?.[0] || '/placeholder-property.jpg';
  
  // Format price with proper locale formatting for Kenyan currency
  const formattedPrice = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0
  }).format(property.price);

  // Limit amenities display to prevent layout overflow
  const displayAmenities = amenities.slice(0, 3);

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-xl border-0 shadow-md">
      {/* Main property link wrapping the image section */}
      <Link href={`/property/${property.id}`} className="block">
        <div className="relative overflow-hidden">
          <img
            src={primaryImage}
            alt={`${property.title} - Property listing image`}
            className="w-full h-56 object-cover cursor-pointer transform group-hover:scale-110 transition-transform duration-500"
            loading="lazy" // Optimize loading for better performance
            onError={(e) => {
              // Fallback image handling
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-property.jpg';
            }}
          />
          
          {/* Verification badge positioned absolutely */}
          <div className="absolute top-4 right-4 z-10">
            <VerificationBadge status={property.verificationStatus} />
          </div>
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-24 pointer-events-none" />
        </div>
      </Link>

      <CardContent className="p-5">
        <div className="space-y-3">
          {/* Property title with improved accessibility */}
          <Link href={`/property/${property.id}`} className="block">
            <h3 className="text-xl font-semibold hover:text-primary cursor-pointer transition-colors line-clamp-2 leading-tight">
              {property.title}
            </h3>
          </Link>
          
          {/* Location display with improved spacing */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm font-medium truncate">{property.location}</span>
          </div>
          
          {/* Property details and price section */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              {/* Bedrooms info with conditional rendering */}
              {bedrooms > 0 && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Home className="h-4 w-4 text-primary/80 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {bedrooms} {bedrooms === 1 ? 'bed' : 'beds'}
                  </span>
                </div>
              )}
              
              {/* Square footage with conditional rendering */}
              {squareFeet > 0 && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Square className="h-4 w-4 text-primary/80 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {squareFeet.toLocaleString()} sq ft
                  </span>
                </div>
              )}
            </div>
            
            {/* Price with improved formatting */}
            <p className="font-semibold text-lg text-primary whitespace-nowrap ml-4">
              {formattedPrice}
            </p>
          </div>
        </div>
      </CardContent>

      {/* Amenities footer with conditional rendering */}
      {displayAmenities.length > 0 && (
        <CardFooter className="px-5 py-4 bg-gray-50 border-t">
          <div className="flex flex-wrap gap-2">
            {displayAmenities.map((amenity) => (
              <Badge 
                key={amenity} 
                variant="secondary" 
                className="text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-0"
              >
                {amenity}
              </Badge>
            ))}
            
            {/* Show indicator if there are more amenities */}
            {amenities.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs text-gray-500 border-gray-300"
              >
                +{amenities.length - 3} more
              </Badge>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
});

export default ListingCard;