import { Property } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import VerificationBadge from "./verification-badge";
import { MapPin, Home } from "lucide-react";

interface ListingCardProps {
  property: Property;
}

export default function ListingCard({ property }: ListingCardProps) {
  // Safe property access with fallbacks
  const imageUrl = property.imageUrls?.[0] || '/placeholder-property.jpg';
  const features = property.features || {};
  const bedrooms = (features as any)?.bedrooms || 0;
  const squareFeet = (features as any)?.squareFeet || 0;
  const amenities = (features as any)?.amenities || [];
  const price = property.price || 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/property/${property.id}`}>
        <img
          src={imageUrl}
          alt={property.title || 'Property image'}
          className="w-full h-48 object-cover cursor-pointer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-property.jpg';
          }}
        />
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link href={`/property/${property.id}`}>
            <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
              {property.title || 'Untitled Property'}
            </h3>
          </Link>
          <VerificationBadge status={property.verificationStatus} />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{property.location || 'Location not specified'}</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          {bedrooms > 0 && (
            <div className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="text-sm">{bedrooms} beds</span>
            </div>
          )}
          {squareFeet > 0 && (
            <div className="text-sm">{squareFeet.toLocaleString()} sq ft</div>
          )}
        </div>
        <p className="font-semibold text-lg">
          {price > 0 ? `KES ${price.toLocaleString()}` : 'Price on request'}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {amenities.slice(0, 3).map((amenity: string, index: number) => (
            <Badge key={`${amenity}-${index}`} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{amenities.length - 3} more
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
