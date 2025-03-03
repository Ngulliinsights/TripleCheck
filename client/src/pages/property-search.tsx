import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, SlidersHorizontal } from "lucide-react";
import PropertySearch from "@/components/property-search";
import ListingCard from "@/components/listing-card";

export default function PropertySearchPage() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties']
  });

  return (
    <div className="space-y-8">
      <div className="bg-[#008080] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Find Your Perfect Property</h1>
          <PropertySearch className="max-w-2xl" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#ff6f61]" />
            <h2 className="text-xl font-semibold">Available Properties</h2>
          </div>
          <Button variant="outline" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

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
      </div>
    </div>
  );
}