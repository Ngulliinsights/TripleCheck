import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useLocation } from "wouter";
import { Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, Star, FileText, Shield, Users, ArrowRight, Play, LucideIcon } from "lucide-react";
import PropertySearch from "@/components/property-search";
import ListingCard from "@/components/listing-card";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { images } from "@/config/images";
import { Testimonials } from "@/components/testimonials";
import { NewsBlog } from "@/components/news-blog";

// Enhanced type definitions with better constraints
interface PricingPlan {
  readonly id: string;
  readonly name: string;
  readonly price: string;
  readonly features: readonly string[];
  readonly isPopular: boolean;
  readonly buttonVariant: 'default' | 'outline';
  readonly buttonClass?: string;
  readonly buttonText?: string;
}

interface Feature {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly color: string;
}

interface WorkflowStep {
  readonly step: number;
  readonly title: string;
  readonly description: string;
}

interface PropertyGridProps {
  properties: Property[] | undefined;
  isLoading: boolean;
  error?: Error | null;
}

interface FeatureCardProps extends Feature {}

interface StepCardProps extends WorkflowStep {}

interface PricingCardProps {
  plan: PricingPlan;
}

// Optimized constants with readonly arrays for better performance
const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: '$49/month',
    features: [
      'Verification of up to 5 properties',
      'Basic fraud detection',
      'Email support'
    ] as const,
    isPopular: false,
    buttonVariant: 'default'
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: '$99/month',
    features: [
      'Verification of up to 20 properties',
      'Advanced fraud detection',
      'Priority email support'
    ] as const,
    isPopular: true,
    buttonVariant: 'default',
    buttonClass: 'bg-[#2C5282] hover:bg-[#1A365D]'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 'Custom Pricing',
    features: [
      'Unlimited property verifications',
      'Comprehensive fraud detection',
      'Dedicated account manager'
    ] as const,
    isPopular: false,
    buttonVariant: 'outline',
    buttonText: 'Contact Us'
  }
] as const;

const FEATURES: readonly Feature[] = [
  {
    icon: Shield,
    title: 'Real-Time Fraud Detection',
    description: 'Advanced algorithms to identify and prevent fraudulent activities in real-time.',
    color: '#2C5282'
  },
  {
    icon: FileText,
    title: 'Secure Document Authentication',
    description: 'Verify ownership and lease agreements to protect yourself from fraudulent listings.',
    color: '#2C5282'
  },
  {
    icon: Star,
    title: 'Real Estate Karma Score',
    description: 'Identify trustworthy landlords and agents based on their track record.',
    color: '#2C5282'
  }
] as const;

const HOW_IT_WORKS_STEPS: readonly WorkflowStep[] = [
  {
    step: 1,
    title: 'Submit Property Details',
    description: 'Provide the necessary details of the property you wish to verify through our platform.'
  },
  {
    step: 2,
    title: 'System Analysis',
    description: 'Our advanced system analyzes the provided information using various verification techniques.'
  },
  {
    step: 3,
    title: 'Receive Verification Report',
    description: 'Get a comprehensive report detailing the verification results and property status.'
  }
] as const;

// Memoized components with enhanced performance optimizations
const FeatureCard = memo<FeatureCardProps>(({ icon: Icon, title, description, color }) => (
  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 group">
    <CardHeader>
      <Icon 
        className="w-12 h-12 mb-4 transition-transform duration-300 group-hover:scale-110" 
        style={{ color }} 
        aria-hidden="true"
      />
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </CardContent>
  </Card>
));

FeatureCard.displayName = 'FeatureCard';

const StepCard = memo<StepCardProps>(({ step, title, description }) => (
  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 group">
    <CardHeader>
      <div className="rounded-full bg-[#2C5282] text-white w-12 h-12 flex items-center justify-center mb-4 font-semibold transition-colors duration-300 group-hover:bg-[#1A365D]">
        {step}
      </div>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </CardContent>
  </Card>
));

StepCard.displayName = 'StepCard';

const PricingCard = memo<PricingCardProps>(({ plan }) => (
  <Card className={`h-full ${plan.isPopular ? 'border-[#2C5282] border-2 shadow-xl' : ''} hover:shadow-lg transition-all duration-300 hover:scale-105 group`}>
    <CardHeader>
      <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
      <div className="text-3xl font-bold text-[#2C5282] transition-colors duration-300 group-hover:text-[#1A365D]">
        {plan.price}
      </div>
      {plan.isPopular && (
        <Badge className="bg-[#2C5282] hover:bg-[#1A365D] transition-colors duration-300">
          Most Popular
        </Badge>
      )}
    </CardHeader>
    <CardContent className="flex flex-col h-full">
      <ul className="space-y-3 flex-grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm text-muted-foreground leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>
      <Button 
        variant={plan.buttonVariant} 
        className={`w-full mt-6 transition-all duration-300 ${plan.buttonClass || 'hover:scale-105'}`}
        aria-label={`Select ${plan.name}`}
      >
        {plan.buttonText || 'Get Started'}
        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
      </Button>
    </CardContent>
  </Card>
));

PricingCard.displayName = 'PricingCard';

// Enhanced loading skeleton component
const PropertySkeleton = memo(() => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-48 w-full rounded-lg bg-gray-200" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4 bg-gray-200" />
      <Skeleton className="h-4 w-1/2 bg-gray-200" />
      <Skeleton className="h-6 w-1/3 bg-gray-200" />
    </div>
  </div>
));

PropertySkeleton.displayName = 'PropertySkeleton';

// Optimized PropertyGrid with better error handling
const PropertyGrid = memo<PropertyGridProps>(({ properties, isLoading, error }) => {
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleViewAll = useCallback(() => {
    window.location.href = "/";
  }, []);

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Properties</h3>
          <p className="text-red-600 mb-4">
            There was an error loading the properties. Please try again.
          </p>
          <Button onClick={handleRetry} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <PropertySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
          <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" aria-hidden="true" />
          <h3 className="text-xl font-medium mb-2">No properties found</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Try adjusting your search terms or browse all properties below.
          </p>
          <Button onClick={handleViewAll} className="hover:scale-105 transition-transform duration-200">
            View All Properties
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <ListingCard key={property.id} property={property} />
      ))}
    </div>
  );
});

PropertyGrid.displayName = 'PropertyGrid';

// Enhanced smooth scroll utility
const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    const headerHeight = 80; // Adjust based on your header height
    const elementPosition = element.offsetTop - headerHeight;
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    });
  }
};

export default function HomePage() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Memoized URL parameter extraction with better error handling
  const urlSearchQuery = useMemo(() => {
    try {
      const searchParams = location.split('?')[1];
      if (!searchParams) return '';
      
      const urlParams = new URLSearchParams(searchParams);
      return urlParams.get('search') || '';
    } catch (error) {
      console.warn('Error parsing URL parameters:', error);
      return '';
    }
  }, [location]);

  // Optimized effect for URL search query synchronization
  useEffect(() => {
    if (urlSearchQuery && urlSearchQuery !== searchQuery) {
      setSearchQuery(urlSearchQuery);
    }
  }, [urlSearchQuery, searchQuery]);

  // Optimized query configuration with better error handling
  const queryConfig = useMemo(() => ({
    queryKey: searchQuery ? ["/api/properties", { q: searchQuery }] : ["/api/properties"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }), [searchQuery]);

  // Enhanced React Query with better error handling
  const { data: properties, isLoading, error } = useQuery<Property[]>(queryConfig);

  // Optimized navigation callbacks with better performance
  const handleExploreProperties = useCallback(() => {
    smoothScrollTo('featured-properties');
  }, []);

  const handleLearnMore = useCallback(() => {
    smoothScrollTo('features');
  }, []);

  const openDemoVideo = useCallback(() => {
    window.open('https://www.youtube.com/embed/IjhSHyfQpaQ', '_blank', 'noopener,noreferrer');
  }, []);

  // Memoized search results count
  const searchResultsCount = useMemo(() => {
    return properties?.length || 0;
  }, [properties]);

  // Error boundary fallback
  if (error && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Something went wrong</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              We're having trouble loading the page. Please check your connection and try again.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="hover:scale-105 transition-transform duration-200"
            >
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section with better accessibility */}
      <section className="relative h-screen flex items-center" role="banner">
        <OptimizedImage
          webpSrc={images.hero.webp}
          fallbackSrc={images.hero.jpg}
          alt="African Property Trust - Verified Real Estate Platform"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-light mb-6 leading-tight animate-fade-in">
              Verified.Transparent.Trusted
            </h1>
            <p className="text-lg md:text-2xl mb-8 max-w-2xl mx-auto leading-relaxed animate-slide-in">
              Your Trusted Partner in Real Estate Verification 
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in">
              <Button
                size="lg"
                className="bg-customSecondary hover:bg-customSecondaryHover text-white px-8 py-3 transition-all duration-300 hover:scale-105"
                onClick={handleExploreProperties}
                aria-label="Explore verified properties"
              >
                Explore Properties
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-customSecondary px-8 py-3 transition-all duration-300 hover:scale-105"
                onClick={openDemoVideo}
                aria-label="Watch demo video"
              >
                Learn More
                <Play className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Search Results Section */}
      {searchQuery && (
        <section className="py-16 bg-gray-50" role="region" aria-label="Search Results">
          <div className="container mx-auto px-4">
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2">
                  Search Results for "{searchQuery}"
                </h2>
                <p className="text-muted-foreground text-lg">
                  {isLoading ? "Searching..." : `Found ${searchResultsCount} properties`}
                </p>
              </div>
              <PropertyGrid properties={properties} isLoading={isLoading} error={error} />
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Features Section */}
      <section id="features" className="py-16 bg-white" role="region" aria-label="Key Features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Key Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Advanced technology and comprehensive verification processes to ensure your real estate transactions are secure
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced How It Works Section */}
      <section className="py-16 bg-gray-50" role="region" aria-label="How It Works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How TripleCheck Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Our streamlined verification process ensures thorough property validation in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <StepCard key={index} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section className="py-16 bg-white" role="region" aria-label="Pricing Plans">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Affordable Pricing Plans</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Choose the plan that fits your needs and budget. All plans include our core verification features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-16 bg-gray-50" role="region" aria-label="Customer Testimonials">
        <Testimonials />
      </section>

      {/* Enhanced News & Blog Section */}
      <section className="py-16 bg-white" role="region" aria-label="News and Blog">
        <NewsBlog />
      </section>

      {/* Enhanced Featured Properties Section */}
      <section id="featured-properties" className="py-16 bg-gray-50" role="region" aria-label="Featured Properties">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Properties</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Discover verified properties from trusted landlords and agents
            </p>
          </div>
          <PropertyGrid properties={properties} isLoading={isLoading} error={error} />
        </div>
      </section>
    </div>
  );
}