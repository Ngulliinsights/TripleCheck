import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Property, PropertyFeatures } from "@shared/schema";
import VerificationBadge from "@/components/verification-badge";
import TrustScore from "@/components/trust-score";
import PropertyReviews from "@/components/property-reviews";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyPageProps {
  id: string;
}

export default function PropertyPage({ id }: PropertyPageProps) {
  const propertyId = id;

  const { data: property, isLoading: isLoadingProperty } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !!propertyId
  });



  if (isLoadingProperty) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!property) {
    return <div>Property not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={property.imageUrls[0]}
            alt={property.title}
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <VerificationBadge status={property.verificationStatus} />
          </div>
          <p className="text-2xl font-semibold">
            KES {property.price.toLocaleString()}
          </p>
          <p className="text-muted-foreground">{property.location}</p>
          <TrustScore score={75} /> {/* Mock trust score */}
          <p>{property.description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Property Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="font-medium">Bedrooms</p>
              <p className="text-muted-foreground">
                {(property.features as PropertyFeatures)?.bedrooms || 'N/A'}
              </p>
            </div>
            <div>
              <p className="font-medium">Bathrooms</p>
              <p className="text-muted-foreground">
                {(property.features as PropertyFeatures)?.bathrooms || 'N/A'}
              </p>
            </div>
            <div>
              <p className="font-medium">Square Feet</p>
              <p className="text-muted-foreground">
                {(property.features as PropertyFeatures)?.squareFeet?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div>
              <p className="font-medium">Year Built</p>
              <p className="text-muted-foreground">
                {(property.features as PropertyFeatures)?.yearBuilt || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PropertyReviews propertyId={Number(propertyId)} />
    </div>
  );
}
