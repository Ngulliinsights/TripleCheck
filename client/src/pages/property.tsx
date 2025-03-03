import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Property, Review } from "@shared/schema";
import VerificationBadge from "@/components/verification-badge";
import TrustScore from "@/components/trust-score";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyPage() {
  const [, params] = useRoute("/property/:id");
  const propertyId = params?.id;

  const { data: property, isLoading: isLoadingProperty } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: !!propertyId
  });

  const { data: reviews, isLoading: isLoadingReviews } = useQuery<Review[]>({
    queryKey: [`/api/properties/${propertyId}/reviews`],
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
                {(property.features as any).bedrooms}
              </p>
            </div>
            <div>
              <p className="font-medium">Bathrooms</p>
              <p className="text-muted-foreground">
                {(property.features as any).bathrooms}
              </p>
            </div>
            <div>
              <p className="font-medium">Square Feet</p>
              <p className="text-muted-foreground">
                {(property.features as any).squareFeet}
              </p>
            </div>
            <div>
              <p className="font-medium">Year Built</p>
              <p className="text-muted-foreground">
                {(property.features as any).yearBuilt}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
        {isLoadingReviews ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews?.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <p className="font-medium">Rating: {review.rating}/5</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p>{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
