import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, Star, FileText, Shield, Users } from "lucide-react";
import PropertySearch from "@/components/property-search";
import ListingCard from "@/components/listing-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Extract search query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const query = urlParams.get('search');
    if (query) {
      setSearchQuery(query);
    }
  }, [location]);

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: searchQuery ? ["/api/properties", { q: searchQuery }] : ["/api/properties"]
  });

  // For the demo video modal
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center bg-[url('/hero-bg.webp')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative text-center text-white space-y-6 max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold animate__animated animate__fadeIn">
            Verified. Transparent. Trusted.
          </h1>
          <p className="text-2xl animate__animated animate__fadeIn animate__delay-1s">
            Your trusted partner in real estate verification.
          </p>
          <div className="flex justify-center gap-4 animate__animated animate__fadeIn animate__delay-2s">
            <Button 
              size="lg" 
              className="bg-[#2C5282] hover:bg-[#2C5282]/90 verify-property"
              onClick={() => window.location.href = "/services/basic-checks"}
            >
              Verify Property Now
            </Button>
            <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-[#2C5282]">
                  Watch Demo Video
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How TripleCheck Works</DialogTitle>
                </DialogHeader>
                <div className="aspect-video">
                  <iframe 
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/demo-video"
                    title="TripleCheck Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {searchQuery && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-muted-foreground">
                  {isLoading ? "Searching..." : `Found ${properties?.length || 0} properties`}
                </p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-96 w-full" />
                  ))}
                </div>
              ) : properties && properties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <ListingCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No properties found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search terms or browse all properties below.
                  </p>
                  <Button onClick={() => window.location.href = "/"}>
                    View All Properties
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="w-12 h-12 text-[#2C5282] mb-4" />
                <CardTitle>Real-Time Fraud Detection</CardTitle>
              </CardHeader>
              <CardContent>
                Advanced algorithms to identify and prevent fraudulent activities in real-time.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <FileText className="w-12 h-12 text-[#2C5282] mb-4" />
                <CardTitle>Secure Document Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                Verify ownership and lease agreements to protect yourself from fraudulent listings.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Star className="w-12 h-12 text-[#2C5282] mb-4" />
                <CardTitle>Real Estate Karma Score</CardTitle>
              </CardHeader>
              <CardContent>
                Identify trustworthy landlords and agents based on their track record.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How TripleCheck Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="rounded-full bg-[#2C5282] text-white w-12 h-12 flex items-center justify-center mb-4">1</div>
                <CardTitle>Submit Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                Provide the necessary details of the property you wish to verify through our platform.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="rounded-full bg-[#2C5282] text-white w-12 h-12 flex items-center justify-center mb-4">2</div>
                <CardTitle>System Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                Our advanced system analyzes the provided information using various verification techniques.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="rounded-full bg-[#2C5282] text-white w-12 h-12 flex items-center justify-center mb-4">3</div>
                <CardTitle>Receive Verification Report</CardTitle>
              </CardHeader>
              <CardContent>
                Get a comprehensive report detailing the verification results and property status.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Affordable Pricing Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Plan</CardTitle>
                <div className="text-3xl font-bold">$49/month</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Verification of up to 5 properties
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Basic fraud detection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Email support
                  </li>
                </ul>
                <Button className="w-full mt-6">Get Started</Button>
              </CardContent>
            </Card>
            <Card className="border-[#2C5282]">
              <CardHeader>
                <CardTitle>Pro Plan</CardTitle>
                <div className="text-3xl font-bold">$99/month</div>
                <Badge className="bg-[#2C5282]">Most Popular</Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Verification of up to 20 properties
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Advanced fraud detection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Priority email support
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-[#2C5282]">Get Started</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Enterprise Plan</CardTitle>
                <div className="text-3xl font-bold">Custom Pricing</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Unlimited property verifications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Comprehensive fraud detection
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Dedicated account manager
                  </li>
                </ul>
                <Button variant="outline" className="w-full mt-6">Contact Us</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <Users className="w-12 h-12 text-[#2C5282]" />
                </div>
                <blockquote className="text-center mb-4">
                  "TripleCheck has transformed the way we handle property verifications. The accuracy and reliability are unparalleled."
                </blockquote>
                <div className="text-center">
                  <div className="font-semibold">Harrison Mumari</div>
                  <div className="text-gray-500">Real Estate Agent</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <Users className="w-12 h-12 text-[#2C5282]" />
                </div>
                <blockquote className="text-center mb-4">
                  "As a property buyer, TripleCheck gave me the peace of mind I needed to make informed decisions."
                </blockquote>
                <div className="text-center">
                  <div className="font-semibold">Jackline Kivisi</div>
                  <div className="text-gray-500">Property Buyer</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <Users className="w-12 h-12 text-[#2C5282]" />
                </div>
                <blockquote className="text-center mb-4">
                  "The comprehensive reports provided by TripleCheck are invaluable in my line of work. Highly recommend their services."
                </blockquote>
                <div className="text-center">
                  <div className="font-semibold">Michael Muchiri</div>
                  <div className="text-gray-500">Real Estate Developer</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Latest Blog Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <img 
                src="/blog1.webp" 
                alt="Understanding Blockchain in Real Estate" 
                className="w-full h-48 object-cover"
              />
              <CardHeader>
                <CardTitle>Understanding Blockchain in Real Estate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Explore how blockchain technology is revolutionizing the real estate industry.</p>
                <Button variant="outline">Read More</Button>
              </CardContent>
            </Card>
            <Card>
              <img 
                src="/blog2.webp" 
                alt="Tips for Verifying Property Legitimacy" 
                className="w-full h-48 object-cover"
              />
              <CardHeader>
                <CardTitle>Tips for Verifying Property Legitimacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Learn the essential steps to ensure the legitimacy of a property before purchasing.</p>
                <Button variant="outline">Read More</Button>
              </CardContent>
            </Card>
            <Card>
              <img 
                src="/blog3.webp" 
                alt="The Future of Real Estate Verification" 
                className="w-full h-48 object-cover"
              />
              <CardHeader>
                <CardTitle>The Future of Real Estate Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Discover the latest trends and technologies shaping the future of property verification.</p>
                <Button variant="outline">Read More</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Properties Section - Retaining original functionality */}
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

    </div>
  );
}