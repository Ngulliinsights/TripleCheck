import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ThumbsUp,
  Flag,
  Share2,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  Phone,
  Globe,
  Star,
  Shield,
  Users,
} from "lucide-react"
import { useState, useCallback, useMemo, memo } from "react"
import { Link } from "react-router-dom"

import { Button } from "../components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { useToast } from "../hooks/use-toast"
import { useDebounce } from "../hooks/useDebounce"
// ValidationRule is now part of useFormValidation

// Types
interface ShareExperienceData {
  title: string;
  location: string;
  fraudType: string;
  amountLost: string;
  whatHappened: string;
  personalVulnerabilities: string;
  systemicChallenges: string;
  lessonsLearned: string;
  resolutionStatus: "resolved" | "partial" | "unresolved";
  resolutionDetails: string;
  anonymous: boolean;
}

interface Experience {
  id: string;
  title: string;
  location: string;
  datePosted: string;
  author: string;
  amount: string;
  resolved: boolean;
  preview: string;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

type SectionKey =
  | "emergency"
  | "channels"
  | "prevention"
  | "directory"
  | "legal"
  | "digital";

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  priority?: "high" | "medium" | "low";
}

const AccordionSection = memo<AccordionSectionProps>(
  ({ title, children, isOpen, onToggle, icon, priority = "medium" }) => {
    const priorityColors = {
      high: "bg-red-50 border-red-200 hover:bg-red-100",
      medium: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      low: "bg-slate-50 border-slate-200 hover:bg-slate-100",
    };

    return (
      <div className={`border rounded-lg ${priorityColors[priority]}`}>
        <h2 className="m-0">
          <button
            type="button"
            onClick={onToggle}
            className={`w-full flex justify-between items-center p-4 text-left font-semibold text-slate-800 transition-colors ${priorityColors[priority]}`}
            aria-expanded={isOpen ? 'true' : 'false'}
          >
            <span className="flex items-center gap-2">
              {icon}
              {title}
            </span>
            <span className="text-lg font-mono">{isOpen ? "−" : "+"}</span>
          </button>
        </h2>
        {isOpen && (
          <div className="p-6 space-y-6 text-slate-700 bg-white">
            {children}
          </div>
        )}
      </div>
    );
  }
);

AccordionSection.displayName = "AccordionSection";

// Community Tab Component
const CommunityTab = memo(() => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: experiencesData } = useQuery({
    queryKey: ["community-experiences", selectedCategory, debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: selectedCategory,
        limit: "10",
        offset: "0",
        sortBy: "recent",
      });

      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      const response = await fetch(`/api/community/experiences?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch community experiences");
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["community-categories"],
    queryFn: async () => {
      const response = await fetch("/api/community/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const result = await response.json();
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const shareExperienceMutation = useMutation({
    mutationFn: async (data: ShareExperienceData) => {
      const response = await fetch("/api/community/experiences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to share experience");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Experience Shared",
        description:
          "Thank you for sharing your experience. It will help others stay safe.",
      });
      queryClient.invalidateQueries({ queryKey: ["community-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["community-categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to share your experience. Please try again.",
        variant: "destructive",
      });
    },
  });

  const experiences = useMemo(
    () => experiencesData?.experiences || [],
    [experiencesData]
  );
  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  const ExperienceCard = ({ experience }: { experience: Experience }) => (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-semibold text-slate-900 group-hover:text-primary transition-colors duration-200">
                {experience.title}
              </h3>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  experience.resolved ?
                    "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
                }`}
              >
                {experience.resolved ?
                  <CheckCircle className="w-4 h-4" />
                : <XCircle className="w-4 h-4" />}
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{experience.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{experience.datePosted}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{experience.author}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {experience.amount}
            </div>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                experience.resolved ?
                  "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {experience.resolved ? "Resolved" : "Unresolved"}
            </div>
          </div>
        </div>

        <p className="text-slate-700 mb-6 leading-relaxed">
          {experience.preview}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {experience.tags.map((tag: string) => (
            <span
              key={tag}
              className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium border border-primary/20"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2 hover:text-slate-700 transition-colors">
              <Eye className="w-4 h-4" />
              <span className="font-medium">{experience.views}</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-700 transition-colors">
              <ThumbsUp className="w-4 h-4" />
              <span className="font-medium">{experience.likes}</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-700 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="font-medium">{experience.comments}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-primary"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-red-600"
            >
              <Flag className="w-4 h-4 mr-1" />
              Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Enhanced Stats with TripleCheck styling */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">234</div>
                <div className="text-blue-100 font-medium">Stories Shared</div>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-200 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">89</div>
                <div className="text-green-100 font-medium">Cases Resolved</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">KES 45M+</div>
                <div className="text-red-100 font-medium">
                  Total Reported Losses
                </div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">12</div>
                <div className="text-purple-100 font-medium">
                  Countries Covered
                </div>
              </div>
              <Globe className="w-8 h-8 text-purple-200 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Enhanced Sidebar */}
        <div className="lg:w-1/4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search stories..."
                  aria-label="Search stories"
                  className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categories
                </h4>
                <div className="space-y-1">
                  {categories.map((category: Category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                        selectedCategory === category.id ?
                          "bg-primary text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="font-medium">{category.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          selectedCategory === category.id ?
                            "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-800 mb-2">
                    Safety Reminder
                  </h4>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Always verify property documents, use licensed
                    professionals, and never make large payments without proper
                    verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Community Stories
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                aria-label="Sort stories by"
                title="Sort stories by"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Most Recent</option>
                <option>Most Liked</option>
                <option>Most Commented</option>
                <option>Highest Amount</option>
              </select>
            </div>
          </div>

          <div>
            {experiences.map((experience: Experience) => (
              <ExperienceCard key={experience.id} experience={experience} />
            ))}
          </div>

          <div className="text-center mt-8 space-y-4">
            <button
              type="button"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Load More Stories
            </button>

            {/* Enhanced Strategic CTA to full community page */}
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-xl mt-8">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Ready to Share Your Experience?
                </h3>
                <p className="text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                  Join our full community platform to share detailed
                  experiences, connect with others, and access advanced features
                  including expert consultations and personalized fraud
                  prevention guidance.
                </p>
                <Link
                  to="/community"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <MessageSquare className="w-5 h-5" />
                  Access Full Community Platform
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

CommunityTab.displayName = "CommunityTab";

// Fraud Resources Tab Component
const FraudResourcesTab = memo(() => {
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set(["emergency"])
  );

  const toggleSection = useCallback((section: SectionKey) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  const EmergencySection = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-red-800">
            Critical: Act Within 48 Hours
          </h3>
        </div>
        <p className="text-red-700 text-sm">
          Time is your most valuable asset in fraud recovery. Quick action
          dramatically increases your chances of asset recovery and successful
          prosecution.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">
            Immediate Actions (First 24 Hours)
          </h4>
          <div className="space-y-3">
            {[
              "Stop all payments immediately. Do not transfer any more money, regardless of pressure or threats from the fraudster.",
              "Document everything comprehensively. Photograph all documents, save all messages, emails, and call logs. Create a chronological timeline of events.",
              "Report to DCI Land Fraud Unit. This should be your first official report. Get an OB number and case reference.",
            ].map((action, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <strong>{action.split(".")[0]}.</strong>{" "}
                  {action.split(".").slice(1).join(".")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-lg">
            Protective Measures (24-48 Hours)
          </h4>
          <div className="space-y-3">
            {[
              "Secure the property legally. Visit the Land Registry to place a caution or restriction on the title. Engage a lawyer to lodge a caveat.",
              "Protect your finances. Contact your bank to flag potentially fraudulent transactions and monitor all accounts.",
              "Begin parallel reporting. File reports with EACC, Ministry of Lands, and other relevant agencies simultaneously.",
            ].map((action, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 4}
                </div>
                <div>
                  <strong>{action.split(".")[0]}.</strong>{" "}
                  {action.split(".").slice(1).join(".")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ReportingChannelsSection = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 p-4 rounded">
        <h4 className="font-semibold text-green-800 mb-2">
          Multi-Channel Strategy
        </h4>
        <p className="text-green-700 text-sm">
          The most successful fraud victims report to 2-3 agencies
          simultaneously. This creates pressure from multiple angles and
          increases the likelihood of asset recovery and prosecution.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold px-3 py-1 rounded bg-green-100 text-green-800">
          TIER 1: MOST EFFECTIVE
        </h4>
        <div className="grid gap-4">
          {[
            {
              name: "DCI Land Fraud Unit",
              rating: 5,
              why: "Specialized investigators with prosecutorial powers and asset freezing capabilities",
              contact: "020-7202000, 0800 722 203 (FICHUA)",
              website: "dci.go.ke",
              bestFor:
                "All types of land and real estate fraud, especially complex schemes",
            },
            {
              name: "Ethics & Anti-Corruption Commission (EACC)",
              rating: 5,
              why: "Handles corruption involving public officials and fraudulent title processing",
              website: "eacc.go.ke/default/report-corruption",
              bestFor:
                "Cases involving corrupt government officials, land registry fraud",
            },
          ].map((agency, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <h5 className="font-semibold text-lg">{agency.name}</h5>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= agency.rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600">{agency.why}</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {agency.contact && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>{agency.contact}</span>
                  </div>
                )}
                {agency.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-slate-500" />
                    <a
                      href={`https://${agency.website}`}
                      className="text-blue-600 hover:underline"
                    >
                      {agency.website}
                    </a>
                  </div>
                )}
              </div>
              {agency.bestFor && (
                <div className="bg-slate-50 p-2 rounded text-sm">
                  <strong>Best for:</strong> {agency.bestFor}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">
          Comprehensive Fraud Response Guide
        </h4>
        <p className="text-blue-700 text-sm">
          This guide provides step-by-step instructions for responding to real
          estate fraud in Kenya. Each section builds upon the previous one,
          creating a comprehensive response strategy.
        </p>
      </div>

      <div className="space-y-4">
        <AccordionSection
          title="Emergency Actions (First 48 Hours)"
          isOpen={openSections.has("emergency")}
          onToggle={() => toggleSection("emergency")}
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          priority="high"
        >
          <EmergencySection />
        </AccordionSection>

        <AccordionSection
          title="Reporting Channels & Agencies"
          isOpen={openSections.has("channels")}
          onToggle={() => toggleSection("channels")}
          icon={<Phone className="h-5 w-5 text-blue-500" />}
          priority="high"
        >
          <ReportingChannelsSection />
        </AccordionSection>

        <AccordionSection
          title="Prevention & Red Flags"
          isOpen={openSections.has("prevention")}
          onToggle={() => toggleSection("prevention")}
          icon={<Shield className="h-5 w-5 text-green-500" />}
          priority="medium"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              Understanding fraud patterns helps you recognize red flags early.
              Most real estate fraud succeeds because it exploits normal human
              emotions like excitement, urgency, and trust.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Pressure for immediate payment",
                "Unusually low prices for prime locations",
                "Cash-only transaction requirements",
                "Reluctance to allow independent verification",
                "Missing or suspicious documentation",
                "Promises of unrealistic returns",
              ].map((flag, index) => (
                <div key={index} className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">{flag}</span>
                </div>
              ))}
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title="Contact Directory"
          isOpen={openSections.has("directory")}
          onToggle={() => toggleSection("directory")}
          icon={<Globe className="h-5 w-5 text-slate-500" />}
          priority="low"
        >
          <div className="space-y-4">
            <p className="text-slate-600">
              This directory provides direct contact information for all key
              agencies. Save these contacts to your phone for quick access
              during an emergency.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm border-collapse border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left border border-slate-300 font-semibold">
                      Entity
                    </th>
                    <th className="p-3 text-left border border-slate-300 font-semibold">
                      Role
                    </th>
                    <th className="p-3 text-left border border-slate-300 font-semibold">
                      Contact Information
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "DCI – Land Fraud Unit",
                      role: "Investigates complex land scams & fake titles",
                      phone: "020-7202000, 020-3343312",
                      tollfree: "0800 722 203 (FICHUA)",
                      website: "dci.go.ke",
                    },
                    {
                      name: "Ministry of Lands & Physical Planning",
                      role: "Registers & flags fraudulent transactions",
                      website: "ardhisasa.lands.go.ke",
                    },
                  ].map((agency, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="p-3 border border-slate-300 font-medium">
                        {agency.name}
                      </td>
                      <td className="p-3 border border-slate-300">
                        {agency.role}
                      </td>
                      <td className="p-3 border border-slate-300 space-y-1">
                        {agency.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{agency.phone}</span>
                          </div>
                        )}
                        {agency.tollfree && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-green-600" />
                            <span className="text-green-600 font-medium">
                              {agency.tollfree}
                            </span>
                          </div>
                        )}
                        {agency.website && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <a
                              href={`https://${agency.website}`}
                              className="text-blue-600 hover:underline"
                            >
                              {agency.website}
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* Enhanced Strategic CTA to comprehensive fraud guide */}
      <Card className="bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-red-200 shadow-xl mt-8">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Need Immediate Help? Access Our Complete Fraud Response Guide
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                If you&apos;re currently dealing with fraud, access our
                comprehensive 48-hour emergency response guide with detailed
                procedures, complete agency contacts, and step-by-step recovery
                instructions developed by legal experts and fraud investigators.
              </p>
              <Link
                to="/fraud-guide"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Shield className="w-5 h-5" />
                Access Complete Emergency Guide
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

FraudResourcesTab.displayName = "FraudResourcesTab";

// Main Component
const CommunityAndResources = memo(() => {
  const [activeTab, setActiveTab] = useState("community");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-12">
        {/* Persona-Driven Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                Community & Resources Hub
              </h1>
              <p className="text-primary font-medium">Powered by TripleCheck</p>
            </div>
          </div>

          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Whether you&apos;re dealing with fraud right now, researching before
            investing, or want to help others - we have the right resources for
            your situation.
          </p>

          {/* Persona-Based Quick Access Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 max-w-6xl mx-auto">
            <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  I&apos;m Being Scammed
                </h3>
                <p className="text-red-700 text-sm">
                  Get immediate help and emergency contacts
                </p>
                <div className="mt-3 text-xs text-red-600 font-medium">
                  ⚡ URGENT - Act within 48 hours
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  I&apos;m Researching
                </h3>
                <p className="text-blue-700 text-sm">
                  Prevention guides and red flag checklists
                </p>
                <div className="mt-3 text-xs text-blue-600 font-medium">
                  📋 Smart due diligence
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  I Want to Help
                </h3>
                <p className="text-green-700 text-sm">
                  Share experiences and support others
                </p>
                <div className="mt-3 text-xs text-green-600 font-medium">
                  🤝 Build community
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-purple-900 mb-2">
                  I&apos;m a Professional
                </h3>
                <p className="text-purple-700 text-sm">
                  Connect with clients and share expertise
                </p>
                <div className="mt-3 text-xs text-purple-600 font-medium">
                  ⚖️ Expert network
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Persona-Driven Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-6xl mx-auto">
          <Link to="/fraud-guide" className="group">
            <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Emergency Help
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  48-hour fraud response guide
                </p>
                <div className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                  ⚡ URGENT
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card
            className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group"
            onClick={() => setActiveTab("resources")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                Prevention Guide
              </h3>
              <p className="text-blue-700 text-sm mb-3">
                Red flags & due diligence
              </p>
              <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                📋 Research
              </div>
            </CardContent>
          </Card>

          <Link to="/community" className="group">
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  Share & Connect
                </h3>
                <p className="text-green-700 text-sm mb-3">
                  Full community platform
                </p>
                <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                  🤝 Community
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card
            className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group"
            onClick={() => setActiveTab("community")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-purple-900 mb-2">
                Expert Network
              </h3>
              <p className="text-purple-700 text-sm mb-3">
                Connect with professionals
              </p>
              <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                ⚖️ Experts
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-slate-200">
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab("community")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "community" ?
                    "bg-primary text-white shadow-md transform scale-105"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Community Stories
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  234
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("resources")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "resources" ?
                    "bg-primary text-white shadow-md transform scale-105"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Shield className="w-4 h-4" />
                Fraud Resources
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  Emergency
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === "community" && <CommunityTab />}
          {activeTab === "resources" && <FraudResourcesTab />}
        </div>
      </div>
    </div>
  );
});

CommunityAndResources.displayName = "CommunityAndResources";

export default CommunityAndResources;
