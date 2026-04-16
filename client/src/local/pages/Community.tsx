import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  ThumbsUp,
  Share2,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  ArrowLeft,
  Users,
  Shield,
} from "lucide-react"
import React, { useState, useCallback, useMemo, memo } from "react"
import { Link } from "react-router-dom"

import FormField from "../components/forms/FormField"
import { Button } from "../components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Textarea } from "../components/ui/textarea"
import { useToast } from "../hooks/use-toast"
import { useDebounce } from "../hooks/useDebounce"
// import { useForm } from "../hooks/useFormValidation"
// ValidationRule is now part of useFormValidation

// Constants
const QUERY_DELAY = 500;
const MUTATION_DELAY = 1000;
const AMOUNT_REGEX = /^[A-Z]{3}\s*[\d,]+$/;
const COMMUNITY_EXPERIENCES_KEY = "community-experiences";
const COMMUNITY_CATEGORIES_KEY = "community-categories";
const FRAUD_TYPE_LAND = "Land Purchase";
const FRAUD_TYPE_PROPERTY_DEV = "Property Development";
const FRAUD_TYPE_RENTAL = "Rental Fraud";

// Types for better TypeScript support
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

interface ExperienceDisplayData extends ShareExperienceData {
  id: number;
  type: string;
  resolved: boolean;
  amount: string;
  datePosted: string;
  author: string;
  preview: string;
  likes: number;
  comments: number;
  views: number;
  tags: string[];
}

const RealEstateFraudCommunity = memo(() => {
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch experiences with React Query
  const { data: experiencesData } = useQuery({
    queryKey: [
      COMMUNITY_EXPERIENCES_KEY,
      selectedCategory,
      debouncedSearchTerm,
    ],
    queryFn: async ({ pageParam: _pageParam = 0 }) => {
      // In a real app, this would be an API call
      const mockData = {
        experiences: [
          {
            id: 1,
            title: "Land Purchase Scam in Kiambu County",
            location: "Kiambu, Kenya",
            type: FRAUD_TYPE_LAND,
            resolved: false,
            amount: "KES 2,500,000",
            datePosted: "2024-07-15",
            author: "Anonymous User",
            preview:
              "I was approached by a &apos;land broker&apos; who showed me what seemed like legitimate title deeds...",
            likes: 23,
            comments: 8,
            views: 156,
            tags: ["title-fraud", "broker-scam", "kiambu"],
          },
          {
            id: 2,
            title: "Fake Developer Project in Lagos",
            location: "Lagos, Nigeria",
            type: FRAUD_TYPE_PROPERTY_DEV,
            resolved: true,
            amount: "₦15,000,000",
            datePosted: "2024-07-10",
            author: "James M.",
            preview:
              "Invested in what appeared to be a legitimate housing development project. Here&apos;s how I got my money back...",
            likes: 45,
            comments: 12,
            views: 289,
            tags: ["developer-fraud", "lagos", "recovered"],
          },
          {
            id: 3,
            title: "Rental Deposit Scam in Nairobi",
            location: "Nairobi, Kenya",
            type: FRAUD_TYPE_RENTAL,
            resolved: false,
            amount: "KES 180,000",
            datePosted: "2024-07-08",
            author: "Sarah K.",
            preview:
              "Paid deposit for an apartment that the &apos;landlord&apos; didn&apos;t actually own...",
            likes: 18,
            comments: 15,
            views: 201,
            tags: ["rental-scam", "nairobi", "fake-landlord"],
          },
        ] as ExperienceDisplayData[],
        hasMore: false,
        total: 3,
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, QUERY_DELAY));
      return mockData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: [COMMUNITY_CATEGORIES_KEY],
    queryFn: async () => {
      // In a real app, this would be an API call
      return [
        { id: "all", name: "All Stories", count: 234 },
        { id: "land", name: FRAUD_TYPE_LAND, count: 89 },
        { id: "rental", name: FRAUD_TYPE_RENTAL, count: 67 },
        { id: "development", name: FRAUD_TYPE_PROPERTY_DEV, count: 45 },
        { id: "investment", name: "Investment Scams", count: 33 },
      ];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Share experience mutation
  const shareExperienceMutation = useMutation({
    mutationFn: async (_data: ShareExperienceData) => {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, MUTATION_DELAY));
      return { success: true, id: Date.now() };
    },
    onSuccess: () => {
      toast({
        title: "Experience Shared",
        description:
          "Thank you for sharing your experience. It will help others stay safe.",
      });
      queryClient.invalidateQueries({ queryKey: [COMMUNITY_EXPERIENCES_KEY] });
      setActiveTab("browse");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share your experience. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Remove infinite scroll since we're using regular useQuery for now
  // In a real implementation, you would use useInfiniteQuery instead

  // Memoized filtered experiences
  const experiences = useMemo(() => {
    return experiencesData?.experiences || [];
  }, [experiencesData]);

  const categories = useMemo(() => {
    return categoriesData || [];
  }, [categoriesData]);

  // Handlers

  const handleShareExperience = useCallback(
    (data: ShareExperienceData) => {
      shareExperienceMutation.mutate(data);
    },
    [shareExperienceMutation]
  );

  const ExperienceCard = ({
    experience,
  }: {
    experience: ExperienceDisplayData;
  }) => (
    <Card className="bg-white/90 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-semibold text-slate-900 group-hover:text-primary transition-colors duration-200">
                {experience.title}
              </h3>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                experience.resolved 
                  ? "bg-green-100 text-green-600" 
                  : "bg-red-100 text-red-600"
              }`}>
                {experience.resolved ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </div>
              {experience.resolved && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  ✨ Success Story
                </span>
              )}
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
            <div className="text-2xl font-bold text-red-600 mb-2">{experience.amount}</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              experience.resolved 
                ? "bg-green-100 text-green-800 border border-green-200" 
                : "bg-red-100 text-red-800 border border-red-200"
            }`}>
              {experience.resolved ? "💰 Recovered" : "⚠️ Ongoing"}
            </div>
          </div>
        </div>

        <p className="text-slate-700 mb-6 leading-relaxed">{experience.preview}</p>

        {/* Persona-specific insights */}
        {experience.resolved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="text-sm text-green-800 font-medium mb-1">💡 What worked:</div>
            <div className="text-sm text-green-700">Quick reporting to DCI + legal action + community support</div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {experience.tags.map((tag: string) => (
            <span key={tag} className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium border border-primary/20">
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
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-primary">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-green-600">
              <MessageSquare className="w-4 h-4 mr-1" />
              Support
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ShareExperienceForm = memo(() => {
    // Form validation rules
    const validationRules = {
      title: {
        required: true,
        minLength: 10,
        maxLength: 200,
      },
      location: {
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      fraudType: {
        required: true,
      },
      amountLost: {
        pattern: AMOUNT_REGEX,
        custom: (value: any) => {
          if (value && typeof value === "string" && value.trim() !== "") {
            const cleanValue = value.replace(/[^\d.]/g, "");
            const numValue = parseFloat(cleanValue);
            if (isNaN(numValue) || numValue < 0) {
              return "Please enter a valid amount (e.g., KES 500,000)";
            }
          }
          return null;
        },
      },
      whatHappened: {
        required: true,
        minLength: 50,
        maxLength: 2000,
      },
      personalVulnerabilities: {
        maxLength: 1000,
      },
      systemicChallenges: {
        maxLength: 1000,
      },
      lessonsLearned: {
        maxLength: 1000,
      },
      resolutionStatus: {
        required: true,
      },
      resolutionDetails: {
        custom: (value: any, formValues: unknown) => {
          const resolutionStatus = (formValues as ShareExperienceData)
            ?.resolutionStatus;
          if (
            resolutionStatus &&
            resolutionStatus !== "unresolved" &&
            (!value || value.toString().trim().length < 10)
          ) {
            return "Please describe how the issue was resolved (minimum 10 characters)";
          }
          return null;
        },
        maxLength: 1000,
      },
    };

    const {
      values: formData,
      touched,
      getFieldProps,
      getFieldError,
      handleSubmit: formHandleSubmit,
      setValue,
    } = useForm({
      initialValues: {
        title: "",
        location: "",
        fraudType: "",
        amountLost: "",
        whatHappened: "",
        personalVulnerabilities: "",
        systemicChallenges: "",
        lessonsLearned: "",
        resolutionStatus: "unresolved",
        resolutionDetails: "",
        anonymous: false,
      },
      validationRules,
      onSubmit: async (formData) => {
        await handleShareExperience(formData as ShareExperienceData);
      },
      validateOnChange: true,
      validateOnBlur: true,
    });

    // Helper function for handling input changes
    const handleInputChange = useCallback(
      (field: string, value: string | boolean) => {
        setValue(field, value);
      },
      [setValue]
    );

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            Share Your Experience
          </CardTitle>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Your story has power. Every experience shared helps build a stronger, safer community.
            </p>
            
            {/* Impact Motivators */}
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">89 People</div>
                <div className="text-sm text-slate-600">Avoided scams after reading stories like yours</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">KES 12M+</div>
                <div className="text-sm text-slate-600">Saved by community warnings</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">24/7</div>
                <div className="text-sm text-slate-600">Your story works around the clock</div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-yellow-800">Your privacy is protected</div>
                  <div className="text-xs text-yellow-700">You can share anonymously, and we never reveal personal details</div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={formHandleSubmit} className="space-y-6" noValidate>
            <FormField
              label="Title"
              required
              placeholder="Brief description of what happened"
              error={getFieldError("title")}
              touched={touched.title}
              {...getFieldProps("title")}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Location"
                required
                placeholder="City, Country"
                error={getFieldError("location")}
                touched={touched.location}
                {...getFieldProps("location")}
              />

              <FormField
                label="Fraud Type"
                type="select"
                required
                options={[
                  { value: "land", label: FRAUD_TYPE_LAND },
                  { value: "rental", label: FRAUD_TYPE_RENTAL },
                  { value: "development", label: FRAUD_TYPE_PROPERTY_DEV },
                  { value: "investment", label: "Investment Scam" },
                  { value: "other", label: "Other" },
                ]}
                error={getFieldError("fraudType")}
                touched={touched.fraudType}
                {...getFieldProps("fraudType")}
              />

              <FormField
                label="Amount Lost"
                placeholder="e.g., KES 500,000"
                error={getFieldError("amountLost")}
                touched={touched.amountLost}
                {...getFieldProps("amountLost")}
              />
            </div>

            <div>
              <label
                htmlFor="what-happened"
                className="block text-sm font-medium mb-2"
              >
                What Happened? *
              </label>
              <Textarea
                id="what-happened"
                value={formData.whatHappened}
                onChange={(e) =>
                  handleInputChange("whatHappened", e.target.value)
                }
                placeholder="Describe the fraud incident in detail..."
                rows={4}
                required
              />
            </div>

            <div>
              <label
                htmlFor="personal-vulnerabilities"
                className="block text-sm font-medium mb-2"
              >
                Personal Vulnerabilities
              </label>
              <Textarea
                id="personal-vulnerabilities"
                value={formData.personalVulnerabilities}
                onChange={(e) =>
                  handleInputChange("personalVulnerabilities", e.target.value)
                }
                placeholder="What made you vulnerable? (e.g., time pressure, lack of verification, trust issues)"
                rows={3}
              />
            </div>

            <div>
              <label
                htmlFor="systemic-challenges"
                className="block text-sm font-medium mb-2"
              >
                Systemic Challenges
              </label>
              <Textarea
                id="systemic-challenges"
                value={formData.systemicChallenges}
                onChange={(e) =>
                  handleInputChange("systemicChallenges", e.target.value)
                }
                placeholder="What systemic issues enabled this fraud? (e.g., poor regulation, inadequate verification systems)"
                rows={3}
              />
            </div>

            <div>
              <label
                htmlFor="lessons-learned"
                className="block text-sm font-medium mb-2"
              >
                Lessons Learned
              </label>
              <Textarea
                id="lessons-learned"
                value={formData.lessonsLearned}
                onChange={(e) =>
                  handleInputChange("lessonsLearned", e.target.value)
                }
                placeholder="What would you do differently? What advice would you give others?"
                rows={3}
              />
            </div>

            <div>
              <div className="block text-sm font-medium mb-2">
                Resolution Status
              </div>
              <div className="space-y-2">
                {[
                  {
                    value: "resolved",
                    label: "Resolved - I recovered my money/got justice",
                  },
                  {
                    value: "partial",
                    label: "Partially resolved - Some recovery/progress made",
                  },
                  {
                    value: "unresolved",
                    label: "Unresolved - No recovery or justice yet",
                  },
                ].map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="radio"
                      id={`resolved-${option.value}`}
                      name="resolved"
                      value={option.value}
                      checked={formData.resolutionStatus === option.value}
                      onChange={(e) =>
                        handleInputChange(
                          "resolutionStatus",
                          e.target.value as
                            | "resolved"
                            | "partial"
                            | "unresolved"
                        )
                      }
                      className="w-4 h-4"
                    />
                    <label
                      htmlFor={`resolved-${option.value}`}
                      className="text-sm"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {formData.resolutionStatus !== "unresolved" && (
              <div>
                <label
                  htmlFor="resolution-details"
                  className="block text-sm font-medium mb-2"
                >
                  How was it resolved?
                </label>
                <Textarea
                  id="resolution-details"
                  value={formData.resolutionDetails}
                  onChange={(e) =>
                    handleInputChange("resolutionDetails", e.target.value)
                  }
                  placeholder="Describe the steps that led to resolution..."
                  rows={3}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.anonymous}
                onChange={(e) =>
                  handleInputChange("anonymous", e.target.checked)
                }
                className="w-4 h-4"
              />
              <label htmlFor="anonymous" className="text-sm">
                Post anonymously (your identity will be hidden)
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={shareExperienceMutation.isPending}
            >
              {shareExperienceMutation.isPending ?
                "Sharing..."
              : "Share Your Experience"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  });

  ShareExperienceForm.displayName = "ShareExperienceForm";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Strategic Breadcrumb */}
        <div className="mb-8">
          <Link
            to="/community-resources"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community & Resources Hub
          </Link>
        </div>

        {/* Persona-Driven Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Community Platform
              </h1>
              <p className="text-primary font-semibold text-lg">
                Powered by TripleCheck
              </p>
            </div>
          </div>

          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Your safe space to share experiences, learn from others, and build connections. 
            Whether you&apos;re seeking support, sharing wisdom, or offering professional guidance - you belong here.
          </p>

          {/* Engagement Motivators */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-green-600 mb-1">89 Cases</div>
              <div className="text-sm text-slate-600">Successfully Resolved</div>
              <div className="text-xs text-green-600 mt-1">💪 Your story could help someone recover their money</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-blue-600 mb-1">234 Stories</div>
              <div className="text-sm text-slate-600">Shared & Verified</div>
              <div className="text-xs text-blue-600 mt-1">🛡️ Real experiences from real people</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-purple-600 mb-1">45+ Experts</div>
              <div className="text-sm text-slate-600">Active in Community</div>
              <div className="text-xs text-purple-600 mt-1">⚖️ Get professional guidance</div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold mb-1">234</div>
                  <div className="text-blue-100 font-medium">
                    Stories Shared
                  </div>
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
                  <div className="text-green-100 font-medium">
                    Cases Resolved
                  </div>
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
                <Users className="w-8 h-8 text-purple-200 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Persona-Driven Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-slate-200">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab("browse")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "browse" ?
                    "bg-primary text-white shadow-md transform scale-105"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Eye className="w-4 h-4" />
                Learn from Others
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">234 stories</span>
              </button>
              <button
                onClick={() => setActiveTab("share")}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "share" ?
                    "bg-primary text-white shadow-md transform scale-105"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Help Others
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Make a difference</span>
              </button>
            </div>
          </div>
        </div>

        {activeTab === "browse" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Enhanced Persona-Driven Sidebar */}
            <div className="lg:w-1/4 space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary" />
                    Find Your Story
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search experiences..."
                      aria-label="Search stories"
                      className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white/50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Browse by Type
                    </h4>
                    <div className="space-y-1">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                            selectedCategory === category.id
                              ? "bg-primary text-white shadow-md"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          <span className="font-medium">{category.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            selectedCategory === category.id
                              ? "bg-white/20 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}>
                            {category.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Success Stories Highlight */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-green-800 mb-2">Success Stories</h4>
                      <p className="text-sm text-green-700 leading-relaxed mb-3">
                        89 people have successfully recovered their money. Learn from their strategies.
                      </p>
                      <button 
                        onClick={() => setSelectedCategory("resolved")}
                        className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full hover:bg-green-300 transition-colors"
                      >
                        View Success Stories →
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Community Impact */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Community Impact</h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      <div><strong>KES 12M+</strong> saved by warnings</div>
                      <div><strong>156 people</strong> avoided scams</div>
                      <div><strong>24/7</strong> peer support</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Safety Reminder */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-800 mb-2">Stay Safe</h4>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        Always verify documents, use licensed professionals, and trust your instincts.
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
                {experiences.map((experience) => (
                  <ExperienceCard key={experience.id} experience={experience} />
                ))}
              </div>

              <div className="text-center mt-8 space-y-6">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Load More Stories
                </button>
                
                {/* Persona-Specific Engagement CTAs */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <Card className="bg-gradient-to-br from-green-50 via-green-50 to-blue-50 border-green-200 shadow-xl">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">
                        Ready to Help Others?
                      </h3>
                      <p className="text-slate-600 mb-4 leading-relaxed">
                        Your experience could prevent someone else from losing their life savings. 
                        Share your story and become part of the solution.
                      </p>
                      <button
                        onClick={() => setActiveTab("share")}
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Share Your Experience
                      </button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-red-200 shadow-xl">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">
                        Need Immediate Help?
                      </h3>
                      <p className="text-slate-600 mb-4 leading-relaxed">
                        If you&apos;re currently dealing with fraud, don&apos;t wait. 
                        Access our emergency response guide with step-by-step actions.
                      </p>
                      <Link
                        to="/fraud-guide"
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Get Emergency Help
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "share" && (
          <div className="max-w-3xl mx-auto">
            <ShareExperienceForm />
          </div>
        )}
      </div>
    </div>
  );
});

RealEstateFraudCommunity.displayName = "RealEstateFraudCommunity";

export default RealEstateFraudCommunity;
