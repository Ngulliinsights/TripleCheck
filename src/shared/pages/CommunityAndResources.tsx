import { useState, useCallback, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Mail,
  Clock,
  Star,
  Shield,
} from "lucide-react";

import { useDebounce } from "../hooks/useDebounce";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/use-toast";
import { useForm } from "../hooks/useForm";
import { ValidationRule } from "../utils/form-validation";
import FormField from "../components/forms/FormField";

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
  resolutionStatus: 'resolved' | 'partial' | 'unresolved';
  resolutionDetails: string;
  anonymous: boolean;
}

type SectionKey = "emergency" | "channels" | "prevention" | "directory" | "legal" | "digital";

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  priority?: "high" | "medium" | "low";
}

const AccordionSection = memo<AccordionSectionProps>(({
  title,
  children,
  isOpen,
  onToggle,
  icon,
  priority = "medium",
}) => {
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
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          <span className="text-lg font-mono">{isOpen ? "−" : "+"}</span>
        </button>
      </h2>
      {isOpen && (
        <div className="p-6 space-y-6 text-slate-700 bg-white">{children}</div>
      )}
    </div>
  );
});

AccordionSection.displayName = "AccordionSection";

// Community Tab Component
const CommunityTab = memo(() => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: experiencesData } = useQuery({
    queryKey: ['community-experiences', selectedCategory, debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: selectedCategory,
        limit: '10',
        offset: '0',
        sortBy: 'recent'
      });
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const response = await fetch(`/api/community/experiences?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch community experiences');
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['community-categories'],
    queryFn: async () => {
      const response = await fetch('/api/community/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const result = await response.json();
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const shareExperienceMutation = useMutation({
    mutationFn: async (data: ShareExperienceData) => {
      const response = await fetch('/api/community/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to share experience');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Experience Shared",
        description: "Thank you for sharing your experience. It will help others stay safe.",
      });
      queryClient.invalidateQueries({ queryKey: ['community-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['community-categories'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share your experience. Please try again.",
        variant: "destructive",
      });
    },
  });

  const experiences = useMemo(() => experiencesData?.experiences || [], [experiencesData]);
  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  const handleShareExperience = useCallback((data: ShareExperienceData) => {
    shareExperienceMutation.mutate(data);
  }, [shareExperienceMutation]);

  const ExperienceCard = ({ experience }: { experience: any }) => (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-6 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{experience.title}</h3>
            {experience.resolved ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {experience.location}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {experience.datePosted}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {experience.author}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-red-600">{experience.amount}</div>
          <div className={`text-sm px-2 py-1 rounded ${
            experience.resolved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {experience.resolved ? "Resolved" : "Unresolved"}
          </div>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{experience.preview}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {experience.tags.map((tag: string) => (
          <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {experience.views}
          </div>
          <div className="flex items-center gap-1">
            <ThumbsUp className="w-4 h-4" />
            {experience.likes}
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {experience.comments}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-1 hover:text-blue-600">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button type="button" className="flex items-center gap-1 hover:text-red-600">
            <Flag className="w-4 h-4" />
            Report
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="text-2xl font-bold">234</div>
          <div className="text-blue-100">Stories Shared</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="text-2xl font-bold">89</div>
          <div className="text-green-100">Cases Resolved</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg">
          <div className="text-2xl font-bold">KES 45M+</div>
          <div className="text-red-100">Total Reported Losses</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="text-2xl font-bold">12</div>
          <div className="text-purple-100">Countries Covered</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Search & Filter</h3>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stories..."
                  aria-label="Search stories"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Categories</h4>
              <div className="space-y-2">
                {categories.map((category: any) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Safety Reminder</h4>
                <p className="text-xs text-yellow-700 mt-1">
                  Always verify property documents, use licensed professionals, and never make large payments without proper verification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Community Stories</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                aria-label="Sort stories by" 
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
            {experiences.map((experience: any) => (
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
            
            {/* Strategic CTA to full community page */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready to Share Your Experience?
              </h3>
              <p className="text-gray-600 mb-4">
                Join our full community platform to share detailed experiences, connect with others, and access advanced features.
              </p>
              <Link
                to="/community"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Access Full Community Platform
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

CommunityTab.displayName = "CommunityTab";

// Fraud Resources Tab Component
const FraudResourcesTab = memo(() => {
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(["emergency"]));

  const toggleSection = useCallback((section: SectionKey) => {
    setOpenSections(prev => {
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
          <h3 className="font-semibold text-red-800">Critical: Act Within 48 Hours</h3>
        </div>
        <p className="text-red-700 text-sm">
          Time is your most valuable asset in fraud recovery. Quick action dramatically increases your chances of asset recovery and successful prosecution.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Immediate Actions (First 24 Hours)</h4>
          <div className="space-y-3">
            {[
              "Stop all payments immediately. Do not transfer any more money, regardless of pressure or threats from the fraudster.",
              "Document everything comprehensively. Photograph all documents, save all messages, emails, and call logs. Create a chronological timeline of events.",
              "Report to DCI Land Fraud Unit. This should be your first official report. Get an OB number and case reference."
            ].map((action, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div><strong>{action.split('.')[0]}.</strong> {action.split('.').slice(1).join('.')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Protective Measures (24-48 Hours)</h4>
          <div className="space-y-3">
            {[
              "Secure the property legally. Visit the Land Registry to place a caution or restriction on the title. Engage a lawyer to lodge a caveat.",
              "Protect your finances. Contact your bank to flag potentially fraudulent transactions and monitor all accounts.",
              "Begin parallel reporting. File reports with EACC, Ministry of Lands, and other relevant agencies simultaneously."
            ].map((action, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 4}
                </div>
                <div><strong>{action.split('.')[0]}.</strong> {action.split('.').slice(1).join('.')}</div>
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
        <h4 className="font-semibold text-green-800 mb-2">Multi-Channel Strategy</h4>
        <p className="text-green-700 text-sm">
          The most successful fraud victims report to 2-3 agencies simultaneously. This creates pressure from multiple angles and increases the likelihood of asset recovery and prosecution.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold px-3 py-1 rounded bg-green-100 text-green-800">TIER 1: MOST EFFECTIVE</h4>
        <div className="grid gap-4">
          {[
            {
              name: "DCI Land Fraud Unit",
              rating: 5,
              why: "Specialized investigators with prosecutorial powers and asset freezing capabilities",
              contact: "020-7202000, 0800 722 203 (FICHUA)",
              website: "dci.go.ke",
              bestFor: "All types of land and real estate fraud, especially complex schemes"
            },
            {
              name: "Ethics & Anti-Corruption Commission (EACC)",
              rating: 5,
              why: "Handles corruption involving public officials and fraudulent title processing",
              website: "eacc.go.ke/default/report-corruption",
              bestFor: "Cases involving corrupt government officials, land registry fraud"
            }
          ].map((agency, index) => (
            <div key={index} className="border border-slate-200 rounded p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h5 className="font-semibold text-lg">{agency.name}</h5>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-4 w-4 ${star <= agency.rating ? "text-yellow-500 fill-current" : "text-gray-300"}`} />
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
                    <a href={`https://${agency.website}`} className="text-blue-600 hover:underline">
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
        <h4 className="font-semibold text-blue-800 mb-2">Comprehensive Fraud Response Guide</h4>
        <p className="text-blue-700 text-sm">
          This guide provides step-by-step instructions for responding to real estate fraud in Kenya. Each section builds upon the previous one, creating a comprehensive response strategy.
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
              Understanding fraud patterns helps you recognize red flags early. Most real estate fraud succeeds because it exploits normal human emotions like excitement, urgency, and trust.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Pressure for immediate payment",
                "Unusually low prices for prime locations",
                "Cash-only transaction requirements",
                "Reluctance to allow independent verification",
                "Missing or suspicious documentation",
                "Promises of unrealistic returns"
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
              This directory provides direct contact information for all key agencies. Save these contacts to your phone for quick access during an emergency.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm border-collapse border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left border border-slate-300 font-semibold">Entity</th>
                    <th className="p-3 text-left border border-slate-300 font-semibold">Role</th>
                    <th className="p-3 text-left border border-slate-300 font-semibold">Contact Information</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: "DCI – Land Fraud Unit",
                      role: "Investigates complex land scams & fake titles",
                      phone: "020-7202000, 020-3343312",
                      tollfree: "0800 722 203 (FICHUA)",
                      website: "dci.go.ke"
                    },
                    {
                      name: "Ministry of Lands & Physical Planning",
                      role: "Registers & flags fraudulent transactions",
                      website: "ardhisasa.lands.go.ke"
                    }
                  ].map((agency, index) => (
                    <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-3 border border-slate-300 font-medium">{agency.name}</td>
                      <td className="p-3 border border-slate-300">{agency.role}</td>
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
                            <span className="text-green-600 font-medium">{agency.tollfree}</span>
                          </div>
                        )}
                        {agency.website && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <a href={`https://${agency.website}`} className="text-blue-600 hover:underline">
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

      {/* Strategic CTA to comprehensive fraud guide */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 mt-8">
        <div className="flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Immediate Help? Access Our Complete Fraud Response Guide
            </h3>
            <p className="text-gray-600 mb-4">
              If you're currently dealing with fraud, access our comprehensive 48-hour emergency response guide with detailed procedures, complete agency contacts, and step-by-step recovery instructions.
            </p>
            <Link
              to="/fraud-guide"
              className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors inline-flex items-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Access Complete Emergency Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

FraudResourcesTab.displayName = "FraudResourcesTab";

// Main Component
const CommunityAndResources = memo(() => {
  const [activeTab, setActiveTab] = useState("community");

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Community & Fraud Resources Hub
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Your gateway to community experiences and emergency fraud resources. 
          Explore our overview below, then access specialized platforms for deeper engagement and comprehensive emergency guidance.
        </p>
        
        {/* Strategic Navigation Hint */}
        <div className="flex justify-center gap-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
            <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-blue-900 mb-1">Community Platform</h3>
            <p className="text-sm text-blue-700">Share detailed experiences and connect with others</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm">
            <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h3 className="font-semibold text-red-900 mb-1">Emergency Guide</h3>
            <p className="text-sm text-red-700">Comprehensive 48-hour fraud response procedures</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setActiveTab("community")}
          className={`px-6 py-3 rounded-md transition-colors ${
            activeTab === "community"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Community Stories
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("resources")}
          className={`px-6 py-3 rounded-md transition-colors ${
            activeTab === "resources"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Fraud Resources
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "community" && <CommunityTab />}
      {activeTab === "resources" && <FraudResourcesTab />}
    </div>
  );
});

CommunityAndResources.displayName = "CommunityAndResources";

export default CommunityAndResources;