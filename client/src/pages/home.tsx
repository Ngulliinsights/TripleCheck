import { useQuery } from "@tanstack/react-query";
import PropertySearch from "@/components/property-search";
import ListingCard from "@/components/listing-card";
import { Property } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"]
  });

  return (
    <div className="space-y-8">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">
          Verified Real Estate in Kenya
        </h1>
        <p className="text-xl text-muted-foreground">
          Find trustworthy properties with our AI-powered verification system
        </p>
        <PropertySearch />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Featured Properties</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties?.map((property) => (
              <ListingCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-muted p-8 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Why Choose TripleCheck?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">AI-Powered Verification</h3>
            <p className="text-muted-foreground">
              Advanced algorithms ensure property authenticity
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Community Trust</h3>
            <p className="text-muted-foreground">
              Verified reviews from real users
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Secure Transactions</h3>
            <p className="text-muted-foreground">
              Safe and transparent property dealings
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
