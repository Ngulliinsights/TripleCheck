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
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/property/${property.id}`}>
        <img
          src={property.imageUrls[0]}
          alt={property.title}
          className="w-full h-48 object-cover cursor-pointer"
        />
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link href={`/property/${property.id}`}>
            <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
              {property.title}
            </h3>
          </Link>
          <VerificationBadge status={property.verificationStatus} />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{property.location}</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span className="text-sm">
              {(property.features as any).bedrooms} beds
            </span>
          </div>
          <div className="text-sm">
            {(property.features as any).squareFeet} sq ft
          </div>
        </div>
        <p className="font-semibold text-lg">
          KES {property.price.toLocaleString()}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {(property.features as any).amenities.slice(0, 3).map((amenity: string) => (
            <Badge key={amenity} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
