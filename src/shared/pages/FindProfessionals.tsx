import {
  Search,
  MapPin,
  Star,
  Shield,
  Users,
  Phone,
  SlidersHorizontal,
  CheckCircle,
  Award,
  Briefcase,
  Clock,
  TrendingUp,
  MessageCircle,
  Eye,
  ArrowRight,
  Building,
  Home,
  Gavel,
  Calculator,
  Camera,
  Target,
} from "lucide-react";
import React, { useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Separator } from "../components/ui/separator";

// Professional types and interfaces
interface Professional {
  id: string;
  name: string;
  title: string;
  company: string;
  specialization: string[];
  location: string;
  county: string;
  rating: number;
  reviewCount: number;
  verificationLevel: "basic" | "verified" | "premium";
  yearsExperience: number;
  completedProjects: number;
  responseTime: string;
  languages: string[];
  profileImage: string;
  bio: string;
  services: string[];
  pricing: {
    type: "hourly" | "project" | "commission";
    range: string;
  };
  availability: "available" | "busy" | "unavailable";
  certifications: string[];
  education: string[];
  achievements: string[];
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  portfolio: {
    totalValue: string;
    recentProjects: number;
    successRate: number;
  };
  isOnline: boolean;
  lastActive: string;
}

interface ProfessionalCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  averageRating: number;
  color: string;
}

// Mock data for professionals (in real app, this would come from API)
const PROFESSIONAL_CATEGORIES: ProfessionalCategory[] = [
  {
    id: "real-estate-agents",
    name: "Real Estate Agents",
    description: "Licensed agents specializing in property sales and purchases",
    icon: <Home className="w-6 h-6" />,
    count: 1247,
    averageRating: 4.6,
    color: "text-blue-500",
  },
  {
    id: "property-lawyers",
    name: "Property Lawyers",
    description: "Legal experts in property law and conveyancing",
    icon: <Gavel className="w-6 h-6" />,
    count: 342,
    averageRating: 4.8,
    color: "text-purple-500",
  },
  {
    id: "surveyors",
    name: "Land Surveyors",
    description: "Professional surveyors for land measurement and mapping",
    icon: <Target className="w-6 h-6" />,
    count: 189,
    averageRating: 4.7,
    color: "text-green-500",
  },
  {
    id: "valuers",
    name: "Property Valuers",
    description: "Certified valuers for accurate property assessments",
    icon: <Calculator className="w-6 h-6" />,
    count: 156,
    averageRating: 4.5,
    color: "text-orange-500",
  },
  {
    id: "property-managers",
    name: "Property Managers",
    description: "Professional property management and maintenance",
    icon: <Building className="w-6 h-6" />,
    count: 298,
    averageRating: 4.4,
    color: "text-indigo-500",
  },
  {
    id: "photographers",
    name: "Property Photographers",
    description: "Professional photography for property marketing",
    icon: <Camera className="w-6 h-6" />,
    count: 87,
    averageRating: 4.6,
    color: "text-pink-500",
  },
];

const SAMPLE_PROFESSIONALS: Professional[] = [
  {
    id: "1",
    name: "Sarah Wanjiku",
    title: "Senior Real Estate Agent",
    company: "Prime Properties Kenya",
    specialization: [
      "Residential Sales",
      "Investment Properties",
      "First-time Buyers",
    ],
    location: "Westlands, Nairobi",
    county: "Nairobi",
    rating: 4.9,
    reviewCount: 127,
    verificationLevel: "premium",
    yearsExperience: 8,
    completedProjects: 245,
    responseTime: "< 2 hours",
    languages: ["English", "Swahili", "Kikuyu"],
    profileImage: "/api/placeholder/150/150",
    bio: "Experienced real estate professional specializing in Nairobi residential properties with a track record of helping over 200 families find their dream homes.",
    services: [
      "Property Sales",
      "Buyer Representation",
      "Market Analysis",
      "Investment Consulting",
    ],
    pricing: {
      type: "commission",
      range: "2.5% - 3.5%",
    },
    availability: "available",
    certifications: [
      "Licensed Real Estate Agent",
      "TripleCheck Verified Professional",
      "Property Investment Specialist",
    ],
    education: [
      "Bachelor of Commerce - University of Nairobi",
      "Real Estate License - Kenya Institute of Surveyors",
    ],
    achievements: [
      "Top Agent 2023",
      "Customer Excellence Award",
      "95% Client Satisfaction Rate",
    ],
    contactInfo: {
      phone: "+254 712 345 678",
      email: "sarah.w@primeproperties.co.ke",
      website: "www.sarahwanjiku.co.ke",
    },
    portfolio: {
      totalValue: "KES 2.8B",
      recentProjects: 23,
      successRate: 95,
    },
    isOnline: true,
    lastActive: "2 minutes ago",
  },
  {
    id: "2",
    name: "David Kimani",
    title: "Property Lawyer",
    company: "Kimani & Associates Advocates",
    specialization: ["Conveyancing", "Property Disputes", "Land Law"],
    location: "CBD, Nairobi",
    county: "Nairobi",
    rating: 4.8,
    reviewCount: 89,
    verificationLevel: "verified",
    yearsExperience: 12,
    completedProjects: 156,
    responseTime: "< 4 hours",
    languages: ["English", "Swahili"],
    profileImage: "/api/placeholder/150/150",
    bio: "Experienced property lawyer with over 12 years specializing in conveyancing and property disputes. Helped resolve complex land ownership issues.",
    services: [
      "Legal Due Diligence",
      "Property Transfers",
      "Contract Review",
      "Dispute Resolution",
    ],
    pricing: {
      type: "hourly",
      range: "KES 8,000 - 15,000/hour",
    },
    availability: "available",
    certifications: [
      "Advocate of the High Court of Kenya",
      "Certified Property Law Specialist",
      "TripleCheck Legal Partner",
    ],
    education: [
      "LLB - University of Nairobi",
      "Diploma in Law - Kenya School of Law",
    ],
    achievements: [
      "Legal Excellence Award 2022",
      "98% Case Success Rate",
      "Property Law Expert",
    ],
    contactInfo: {
      phone: "+254 720 123 456",
      email: "david@kimaniadvocates.co.ke",
      website: "www.kimaniadvocates.co.ke",
    },
    portfolio: {
      totalValue: "KES 5.2B",
      recentProjects: 34,
      successRate: 98,
    },
    isOnline: false,
    lastActive: "1 hour ago",
  },
  {
    id: "3",
    name: "Grace Muthoni",
    title: "Licensed Land Surveyor",
    company: "Precision Survey Solutions",
    specialization: [
      "Cadastral Surveys",
      "Topographic Mapping",
      "Boundary Disputes",
    ],
    location: "Karen, Nairobi",
    county: "Nairobi",
    rating: 4.7,
    reviewCount: 64,
    verificationLevel: "verified",
    yearsExperience: 10,
    completedProjects: 189,
    responseTime: "< 6 hours",
    languages: ["English", "Swahili"],
    profileImage: "/api/placeholder/150/150",
    bio: "Professional land surveyor with expertise in cadastral surveys and boundary determination. Committed to accurate and timely survey services.",
    services: [
      "Land Surveys",
      "Boundary Marking",
      "Topographic Mapping",
      "Survey Reports",
    ],
    pricing: {
      type: "project",
      range: "KES 25,000 - 150,000",
    },
    availability: "busy",
    certifications: [
      "Licensed Land Surveyor",
      "GIS Specialist",
      "TripleCheck Verified Surveyor",
    ],
    education: [
      "BSc Surveying - University of Nairobi",
      "GIS Certificate - ESRI",
    ],
    achievements: [
      "Surveyor of the Year 2021",
      "100% Accuracy Record",
      "Innovation in Surveying Award",
    ],
    contactInfo: {
      phone: "+254 733 987 654",
      email: "grace@precisionsurveysolutions.co.ke",
    },
    portfolio: {
      totalValue: "KES 1.2B",
      recentProjects: 18,
      successRate: 100,
    },
    isOnline: true,
    lastActive: "Just now",
  },
];

const KENYAN_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kiambu",
  "Nakuru",
  "Machakos",
  "Kajiado",
  "Murang'a",
  "Kisumu",
  "Uasin Gishu",
  "Meru",
  "Nyeri",
  "Laikipia",
  "Nyandarua",
  "Kirinyaga",
];

export default function FindProfessionals() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [selectedLocation, setSelectedLocation] = useState(
    searchParams.get("location") || ""
  );
  const [selectedRating, setSelectedRating] = useState(
    searchParams.get("rating") || ""
  );
  const [selectedAvailability, setSelectedAvailability] = useState(
    searchParams.get("availability") || ""
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "rating");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter and search logic
  const filteredProfessionals = useMemo(() => {
    let filtered = SAMPLE_PROFESSIONALS;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (prof) =>
          prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prof.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prof.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prof.specialization.some((spec) =>
            spec.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter((prof) => {
        switch (selectedCategory) {
          case "real-estate-agents":
            return prof.title.toLowerCase().includes("agent");
          case "property-lawyers":
            return prof.title.toLowerCase().includes("lawyer");
          case "surveyors":
            return prof.title.toLowerCase().includes("surveyor");
          default:
            return true;
        }
      });
    }

    // Location filter
    if (selectedLocation && selectedLocation !== "all") {
      filtered = filtered.filter((prof) => prof.county === selectedLocation);
    }

    // Rating filter
    if (selectedRating && selectedRating !== "all") {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter((prof) => prof.rating >= minRating);
    }

    // Availability filter
    if (selectedAvailability && selectedAvailability !== "all") {
      filtered = filtered.filter(
        (prof) => prof.availability === selectedAvailability
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "experience":
          return b.yearsExperience - a.yearsExperience;
        case "projects":
          return b.completedProjects - a.completedProjects;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    searchQuery,
    selectedCategory,
    selectedLocation,
    selectedRating,
    selectedAvailability,
    sortBy,
  ]);

  // Event handlers
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set("search", query);
      } else {
        params.delete("search");
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handleCategorySelect = useCallback(
    (category: string) => {
      setSelectedCategory(category);
      const params = new URLSearchParams(searchParams);
      if (category && category !== "all") {
        params.set("category", category);
      } else {
        params.delete("category");
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  const handleContactProfessional = useCallback(
    (professional: Professional, method: "phone" | "email" | "message") => {
      switch (method) {
        case "phone":
          window.open(`tel:${professional.contactInfo.phone}`);
          break;
        case "email":
          window.open(`mailto:${professional.contactInfo.email}`);
          break;
        case "message":
          navigate(`/inbox?contact=${professional.id}`);
          break;
      }
    },
    [navigate]
  );

  const handleViewProfile = useCallback(
    (professionalId: string) => {
      navigate(`/professionals/${professionalId}`);
    },
    [navigate]
  );

  const getVerificationBadge = (level: Professional["verificationLevel"]) => {
    switch (level) {
      case "premium":
        return (
          <Badge className="bg-gold text-white">
            <Shield className="w-3 h-3 mr-1" />
            Premium Verified
          </Badge>
        );
      case "verified":
        return (
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      default:
        return <Badge variant="outline">Basic</Badge>;
    }
  };

  const getAvailabilityStyle = (availability: Professional["availability"]) => {
    if (availability === "available") return "bg-green-100 text-green-700";
    if (availability === "busy") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getAvailabilityText = (availability: Professional["availability"]) => {
    if (availability === "available") return "Available";
    if (availability === "busy") return "Busy";
    return "Unavailable";
  };

  const getPricingText = (pricing: Professional["pricing"]) => {
    if (pricing.type === "hourly") return "/hour";
    if (pricing.type === "commission") return "commission";
    return "/project";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Professional Network
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Find Verified Real Estate Professionals
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
              Connect with Kenya's most trusted real estate agents, lawyers,
              surveyors, and property experts. All professionals are verified
              and rated by the community.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, company, or specialization..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Categories */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => handleCategorySelect("all")}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              All Professionals ({SAMPLE_PROFESSIONALS.length})
            </Button>
            {PROFESSIONAL_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => handleCategorySelect(category.id)}
                className="flex items-center gap-2"
              >
                {category.icon}
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters Panel */}
      {showFilters && (
        <section className="py-8 bg-background border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={selectedLocation || "all"}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {KENYAN_COUNTIES.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rating">Minimum Rating</Label>
                  <Select
                    value={selectedRating || "all"}
                    onValueChange={setSelectedRating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Rating</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                      <SelectItem value="4.0">4.0+ Stars</SelectItem>
                      <SelectItem value="3.5">3.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <Select
                    value={selectedAvailability || "all"}
                    onValueChange={setSelectedAvailability}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Availability</SelectItem>
                      <SelectItem value="available">Available Now</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="experience">
                        Most Experienced
                      </SelectItem>
                      <SelectItem value="projects">Most Projects</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results Header */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {filteredProfessionals.length} Professional
                  {filteredProfessionals.length !== 1 ? "s" : ""} Found
                </h2>
                <p className="text-muted-foreground">
                  {selectedCategory !== "all" &&
                    `Showing ${PROFESSIONAL_CATEGORIES.find((c) => c.id === selectedCategory)?.name || "professionals"}`}
                  {selectedLocation && ` in ${selectedLocation}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professionals Grid/List */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {filteredProfessionals.length === 0 ?
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  No Professionals Found
                </h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search criteria or browse all
                  professionals.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedLocation("");
                    setSelectedRating("");
                    setSelectedAvailability("");
                    setSearchParams({});
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            : <div
                className={
                  viewMode === "grid" ?
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-6"
                }
              >
                {filteredProfessionals.map((professional) => (
                  <Card
                    key={professional.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage
                                src={professional.profileImage}
                                alt={professional.name}
                              />
                              <AvatarFallback>
                                {professional.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {professional.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {professional.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {professional.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {professional.company}
                            </p>
                          </div>
                        </div>
                        {getVerificationBadge(professional.verificationLevel)}
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {professional.rating}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({professional.reviewCount})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {professional.location}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {professional.bio}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {professional.specialization
                            .slice(0, 2)
                            .map((spec, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {spec}
                              </Badge>
                            ))}
                          {professional.specialization.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{professional.specialization.length - 2} more
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {professional.yearsExperience} years exp.
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {professional.completedProjects} projects
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {professional.responseTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {professional.portfolio.successRate}% success
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <span className="font-medium text-primary">
                              {professional.pricing.range}
                            </span>
                            <span className="text-muted-foreground ml-1">
                              {getPricingText(professional.pricing)}
                            </span>
                          </div>
                          <div
                            className={`text-xs px-2 py-1 rounded-full ${getAvailabilityStyle(professional.availability)}`}
                          >
                            {getAvailabilityText(professional.availability)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewProfile(professional.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleContactProfessional(professional, "message")
                            }
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleContactProfessional(professional, "phone")
                            }
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Why Choose TripleCheck Professionals?
              </h2>
              <p className="text-muted-foreground">
                All professionals in our network are thoroughly vetted and
                continuously monitored.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="w-8 h-8 text-green-500" />,
                  title: "Verified Credentials",
                  description:
                    "All professionals undergo thorough background checks and credential verification",
                  stat: "100% verified",
                },
                {
                  icon: <Star className="w-8 h-8 text-yellow-500" />,
                  title: "Community Rated",
                  description:
                    "Real reviews from verified clients help you make informed decisions",
                  stat: "4.6 avg rating",
                },
                {
                  icon: <Users className="w-8 h-8 text-blue-500" />,
                  title: "Trusted Network",
                  description:
                    "Join thousands of satisfied clients who found their perfect professional match",
                  stat: "2,000+ professionals",
                },
              ].map((item, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground mb-4">
                      {item.description}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-primary border-primary"
                    >
                      {item.stat}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Are You a Real Estate Professional?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join Kenya's most trusted professional network and connect with
              verified clients looking for your expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/solutions/agents")}
                className="px-8 py-3"
              >
                <Shield className="w-5 h-5 mr-2" />
                Join as Professional
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/contact")}
                className="px-8 py-3"
              >
                Learn More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Free profile setup • Verified credentials • Premium features
              available
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
