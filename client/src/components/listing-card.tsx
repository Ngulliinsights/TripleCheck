import { Property } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import VerificationBadge from "./verification-badge";
import { MapPin, Home, Droplet, Zap, Shield } from "lucide-react";

interface ListingCardProps {
  property: Property;
  language?: 'en' | 'sw';
}

export default function ListingCard({ property, language = 'en' }: ListingCardProps) {
  const title = language === 'en' ? property.title : property.titleSwahili || property.title;
  const description = language === 'en' ? property.description : property.descriptionSwahili || property.description;
  const features = property.features as any;

  // Format price in KES with comma separators
  const formattedPrice = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(property.price);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/property/${property.id}`}>
        <div className="relative">
          <img
            src={property.imageUrls[0]}
            alt={title}
            className="w-full h-48 object-cover cursor-pointer"
          />
          <VerificationBadge 
            status={property.verificationStatus} 
            className="absolute top-2 right-2"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="mb-2">
          <Link href={`/property/${property.id}`}>
            <h3 className="text-lg font-semibold hover:text-[#ff6f61] cursor-pointer">
              {title}
            </h3>
          </Link>
        </div>
        <div className="flex items-center gap-1 text-gray-600 mb-2">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{property.location}</span>
        </div>
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span>{features.bedrooms} beds</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplet className="h-4 w-4" />
            <span>{features.waterSource}</span>
          </div>
          {features.powerBackup && (
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4" />
              <span>Power Backup</span>
            </div>
          )}
          {features.security?.length > 0 && (
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>{features.security[0]}</span>
            </div>
          )}
        </div>
        <p className="font-semibold text-lg text-[#008080]">
          {formattedPrice}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {features.amenities?.slice(0, 3).map((amenity: string) => (
            <Badge 
              key={amenity} 
              variant="secondary" 
              className="text-xs bg-[#008080]/10 text-[#008080]"
            >
              {amenity}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}