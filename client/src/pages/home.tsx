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
      {/* Hero Section - matching index.html style */}
      <section 
        className="relative py-24 px-4 bg-[url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"
        style={{ height: '100vh' }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative max-w-2xl mx-auto text-center text-white space-y-6">
          <h1 className="text-4xl md:text-[4.5rem] font-light text-white mb-5 shadow-text">
            Verified. Transparent. Trusted.
          </h1>
          <p className="text-2xl mb-8 text-white/90 shadow-text">
            Your trusted partner in real estate verification
          </p>
          <PropertySearch />
          <div className="pt-8 flex justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-[#008080] hover:bg-[#006666] text-white border-none font-medium"
            >
              Verify Property Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent text-white border-white hover:bg-white/20"
            >
              Watch Demo Video
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section with hover effects */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-center text-3xl font-semibold mb-12 text-[#ff6f61]">Our Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card transition-transform hover:scale-105 p-8 rounded-lg shadow-sm border text-center">
              <Shield className="h-12 w-12 text-[#ff6f61] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-3">AI-Powered Verification</h3>
              <p className="text-gray-600">
                Advanced algorithms verify property authenticity and ownership records
              </p>
            </div>
            <div className="card transition-transform hover:scale-105 p-8 rounded-lg shadow-sm border text-center">
              <Users className="h-12 w-12 text-[#ff6f61] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-3">Community Trust Network</h3>
              <p className="text-gray-600">
                Real experiences and insights from verified property buyers
              </p>
            </div>
            <div className="card transition-transform hover:scale-105 p-8 rounded-lg shadow-sm border text-center">
              <FileCheck className="h-12 w-12 text-[#ff6f61] mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-3">Legal Protection</h3>
              <p className="text-gray-600">
                Access to legal resources and reporting tools for safer transactions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-semibold text-[#ff6f61]">Featured Properties</h2>
            <Button variant="outline" className="border-[#008080] text-[#008080] hover:bg-[#008080] hover:text-white">
              View All
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {properties?.map((property) => (
                <ListingCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-16 bg-[#008080] text-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">TripleCheck for Enterprises</h2>
              <p className="text-lg opacity-90">
                Empower your real estate agency with our advanced verification tools and trust-building platform
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <Building2 className="h-6 w-6" />
                  <span>Automated property verification</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="h-6 w-6" />
                  <span>Enhanced trust badges</span>
                </li>
                <li className="flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  <span>Client management tools</span>
                </li>
              </ul>
              <Button 
                size="lg" 
                className="mt-6 bg-white text-[#008080] hover:bg-white/90"
              >
                Learn More
              </Button>
            </div>
            <div className="hidden md:block">
              <div className="aspect-video bg-white/10 rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = `
.shadow-text {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.card {
  transition: transform 0.3s ease;
}

.card:hover {
  transform: scale(1.05);
}
`;