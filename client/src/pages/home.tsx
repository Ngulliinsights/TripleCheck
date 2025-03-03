import { useQuery } from "@tanstack/react-query";
import PropertySearch from "@/components/property-search";
import ListingCard from "@/components/listing-card";
import { Property } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Shield, Building2, Users, FileCheck } from "lucide-react";

export default function HomePage() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"]
  });

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-16 px-4 bg-muted/50 rounded-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">
          Verified Real Estate in Kenya
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Make confident property decisions with our AI-powered verification system and community trust network
        </p>
        <PropertySearch />
        <div className="pt-4 flex justify-center gap-4">
          <Button size="lg" className="font-semibold">
            Find Verified Properties
          </Button>
          <Button size="lg" variant="outline" className="font-semibold">
            List Your Property
          </Button>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">AI-Powered Verification</h3>
          <p className="text-muted-foreground">
            Advanced algorithms verify property authenticity and ownership records
          </p>
        </div>
        <div className="text-center space-y-3">
          <Users className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Community Trust Network</h3>
          <p className="text-muted-foreground">
            Real experiences and insights from verified property buyers
          </p>
        </div>
        <div className="text-center space-y-3">
          <FileCheck className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Legal Protection</h3>
          <p className="text-muted-foreground">
            Access to legal resources and reporting tools for safer transactions
          </p>
        </div>
      </section>

      {/* Featured Properties */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Featured Properties</h2>
          <Button variant="outline">View All</Button>
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
      </section>

      {/* Enterprise Section */}
      <section className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">TripleCheck for Enterprises</h2>
            <p className="text-lg opacity-90">
              Empower your real estate agency with our advanced verification tools and trust-building platform
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span>Automated property verification</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Enhanced trust badges</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>Client management tools</span>
              </li>
            </ul>
            <Button size="lg" variant="secondary" className="mt-4">
              Learn More
            </Button>
          </div>
          <div className="hidden md:block">
            {/* Enterprise illustration or screenshot would go here */}
            <div className="aspect-video bg-primary-foreground/10 rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  );
}