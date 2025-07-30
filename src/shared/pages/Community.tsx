import React, { useState, useCallback, useMemo, memo } from "react";
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
  ArrowLeft,
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
// Removed useInfiniteScroll import since we're using regular useQuery
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { useForm } from "../hooks/useForm";
import { ValidationRule } from "../utils/form-validation";
import FormField from "../components/forms/FormField";

// Types for better TypeScript support
interface Experience {
  id: number;
  title: string;
  location: string;
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

interface Category {
  id: string;
  name: string;
  count: number;
}

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

const RealEstateFraudCommunity = memo(() => {
  const [activeTab, setActiveTab] = useState("browse");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch experiences with React Query
  const {
    data: experiencesData,
    isLoading: experiencesLoading,
    error: experiencesError,
  } = useQuery({
    queryKey: ['community-experiences', selectedCategory, debouncedSearchTerm],
    queryFn: async ({ pageParam = 0 }) => {
      // In a real app, this would be an API call
      const mockData = {
        experiences: [
          {
            id: 1,
            title: "Land Purchase Scam in Kiambu County",
            location: "Kiambu, Kenya",
            type: "Land Purchase",
            resolved: false,
            amount: "KES 2,500,000",
            datePosted: "2024-07-15",
            author: "Anonymous User",
            preview:
              "I was approached by a 'land broker' who showed me what seemed like legitimate title deeds...",
            likes: 23,
            comments: 8,
            views: 156,
            tags: ["title-fraud", "broker-scam", "kiambu"],
          },
          {
            id: 2,
            title: "Fake Developer Project in Lagos",
            location: "Lagos, Nigeria",
            type: "Property Development",
            resolved: true,
            amount: "₦15,000,000",
            datePosted: "2024-07-10",
            author: "James M.",
            preview:
              "Invested in what appeared to be a legitimate housing development project. Here's how I got my money back...",
            likes: 45,
            comments: 12,
            views: 289,
            tags: ["developer-fraud", "lagos", "recovered"],
          },
          {
            id: 3,
            title: "Rental Deposit Scam in Nairobi",
            location: "Nairobi, Kenya",
            type: "Rental Fraud",
            resolved: false,
            amount: "KES 180,000",
            datePosted: "2024-07-08",
            author: "Sarah K.",
            preview:
              "Paid deposit for an apartment that the 'landlord' didn't actually own...",
            likes: 18,
            comments: 15,
            views: 201,
            tags: ["rental-scam", "nairobi", "fake-landlord"],
          },
        ],
        hasMore: false,
        total: 3,
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['community-categories'],
    queryFn: async () => {
      // In a real app, this would be an API call
      return [
        { id: "all", name: "All Stories", count: 234 },
        { id: "land", name: "Land Purchase", count: 89 },
        { id: "rental", name: "Rental Fraud", count: 67 },
        { id: "development", name: "Property Development", count: 45 },
        { id: "investment", name: "Investment Scams", count: 33 },
      ];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Share experience mutation
  const shareExperienceMutation = useMutation({
    mutationFn: async (data: ShareExperienceData) => {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, id: Date.now() };
    },
    onSuccess: () => {
      toast({
        title: "Experience Shared",
        description: "Thank you for sharing your experience. It will help others stay safe.",
      });
      queryClient.invalidateQueries({ queryKey: ['community-experiences'] });
      setActiveTab('browse');
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
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleShareExperience = useCallback((data: ShareExperienceData) => {
    shareExperienceMutation.mutate(data);
  }, [shareExperienceMutation]);

  const ExperienceCard = ({ experience }: { experience: any }) => (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-6 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {experience.title}
            </h3>
            {experience.resolved ?
              <CheckCircle className="w-5 h-5 text-green-500" />
            : <XCircle className="w-5 h-5 text-red-500" />}
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
          <div className="text-lg font-bold text-red-600">
            {experience.amount}
          </div>
          <div
            className={`text-sm px-2 py-1 rounded ${experience.resolved ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {experience.resolved ? "Resolved" : "Unresolved"}
          </div>
        </div>
      </div>

      <p className="text-gray-700 mb-4">{experience.preview}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {experience.tags.map((tag: string) => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
          >
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
          <button className="flex items-center gap-1 hover:text-blue-600">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="flex items-center gap-1 hover:text-red-600">
            <Flag className="w-4 h-4" />
            Report
          </button>
        </div>
      </div>
    </div>
  );

  const ShareExperienceForm = memo(() => {
    // Form validation rules
    const validationRules: Record<string, ValidationRule> = {
      title: {
        required: true,
        minLength: 10,
        maxLength: 200
      },
      location: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      fraudType: {
        required: true
      },
      amountLost: {
        pattern: /^[A-Z]{3}\s*[\d,]+(\.\d{2})?$|^\$[\d,]+(\.\d{2})?$/,
        custom: (value) => {
          if (value && typeof value === 'string' && value.trim() !== '') {
            const cleanValue = value.replace(/[^\d.]/g, '');
            const numValue = parseFloat(cleanValue);
            if (isNaN(numValue) || numValue < 0) {
              return 'Please enter a valid amount (e.g., KES 500,000)';
            }
          }
          return null;
        }
      },
      whatHappened: {
        required: true,
        minLength: 50,
        maxLength: 2000
      },
      personalVulnerabilities: {
        maxLength: 1000
      },
      systemicChallenges: {
        maxLength: 1000
      },
      lessonsLearned: {
        maxLength: 1000
      },
      resolutionStatus: {
        required: true
      },
      resolutionDetails: {
        custom: (value, formValues) => {
          const resolutionStatus = (formValues as any)?.resolutionStatus;
          if (resolutionStatus && resolutionStatus !== 'unresolved' && (!value || value.toString().trim().length < 10)) {
            return 'Please describe how the issue was resolved (minimum 10 characters)';
          }
          return null;
        },
        maxLength: 1000
      }
    };

    const {
      values: formData,
      errors,
      touched,
      isValid,
      isSubmitting,
      getFieldProps,
      getFieldError,
      hasFieldError,
      handleSubmit: formHandleSubmit,
      setValue
    } = useForm({
      initialValues: {
        title: '',
        location: '',
        fraudType: '',
        amountLost: '',
        whatHappened: '',
        personalVulnerabilities: '',
        systemicChallenges: '',
        lessonsLearned: '',
        resolutionStatus: 'unresolved',
        resolutionDetails: '',
        anonymous: false
      },
      validationRules,
      onSubmit: async (formData) => {
        await handleShareExperience(formData as ShareExperienceData);
      },
      validateOnChange: true,
      validateOnBlur: true
    });

    // Helper function for handling input changes
    const handleInputChange = useCallback((field: string, value: any) => {
      setValue(field, value);
    }, [setValue]);

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Share Your Experience</CardTitle>
          <p className="text-muted-foreground">
            Help others by sharing your experience. Your story can prevent others from falling victim to similar scams.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={formHandleSubmit} className="space-y-6" noValidate>
            <FormField
              label="Title"
              required
              placeholder="Brief description of what happened"
              error={getFieldError('title')}
              touched={touched.title}
              {...getFieldProps('title')}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Location"
                required
                placeholder="City, Country"
                error={getFieldError('location')}
                touched={touched.location}
                {...getFieldProps('location')}
              />
              
              <FormField
                label="Fraud Type"
                type="select"
                required
                options={[
                  { value: 'land', label: 'Land Purchase' },
                  { value: 'rental', label: 'Rental Fraud' },
                  { value: 'development', label: 'Property Development' },
                  { value: 'investment', label: 'Investment Scam' },
                  { value: 'other', label: 'Other' }
                ]}
                error={getFieldError('fraudType')}
                touched={touched.fraudType}
                {...getFieldProps('fraudType')}
              />
              
              <FormField
                label="Amount Lost"
                placeholder="e.g., KES 500,000"
                error={getFieldError('amountLost')}
                touched={touched.amountLost}
                {...getFieldProps('amountLost')}
              />
            </div>

            <div>
              <label htmlFor="what-happened" className="block text-sm font-medium mb-2">
                What Happened? *
              </label>
              <Textarea
                id="what-happened"
                value={formData.whatHappened}
                onChange={(e) => handleInputChange('whatHappened', e.target.value)}
                placeholder="Describe the fraud incident in detail..."
                rows={4}
                required
              />
            </div>

            <div>
              <label htmlFor="personal-vulnerabilities" className="block text-sm font-medium mb-2">
                Personal Vulnerabilities
              </label>
              <Textarea
                id="personal-vulnerabilities"
                value={formData.personalVulnerabilities}
                onChange={(e) => handleInputChange('personalVulnerabilities', e.target.value)}
                placeholder="What made you vulnerable? (e.g., time pressure, lack of verification, trust issues)"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="systemic-challenges" className="block text-sm font-medium mb-2">
                Systemic Challenges
              </label>
              <Textarea
                id="systemic-challenges"
                value={formData.systemicChallenges}
                onChange={(e) => handleInputChange('systemicChallenges', e.target.value)}
                placeholder="What systemic issues enabled this fraud? (e.g., poor regulation, inadequate verification systems)"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="lessons-learned" className="block text-sm font-medium mb-2">
                Lessons Learned
              </label>
              <Textarea
                id="lessons-learned"
                value={formData.lessonsLearned}
                onChange={(e) => handleInputChange('lessonsLearned', e.target.value)}
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
                  { value: 'resolved', label: 'Resolved - I recovered my money/got justice' },
                  { value: 'partial', label: 'Partially resolved - Some recovery/progress made' },
                  { value: 'unresolved', label: 'Unresolved - No recovery or justice yet' }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`resolved-${option.value}`}
                      name="resolved"
                      value={option.value}
                      checked={formData.resolutionStatus === option.value}
                      onChange={(e) => handleInputChange('resolutionStatus', e.target.value as 'resolved' | 'partial' | 'unresolved')}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`resolved-${option.value}`} className="text-sm">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {formData.resolutionStatus !== 'unresolved' && (
              <div>
                <label htmlFor="resolution-details" className="block text-sm font-medium mb-2">
                  How was it resolved?
                </label>
                <Textarea
                  id="resolution-details"
                  value={formData.resolutionDetails}
                  onChange={(e) => handleInputChange('resolutionDetails', e.target.value)}
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
                onChange={(e) => handleInputChange('anonymous', e.target.checked)}
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
              {shareExperienceMutation.isPending ? 'Sharing...' : 'Share Your Experience'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Strategic Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/community-resources"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community & Resources Hub
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Full Community Platform
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Share detailed experiences, connect with other victims and professionals, and access advanced community features. 
          This is your dedicated space for in-depth community engagement and support.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("browse")}
          className={`px-6 py-3 rounded-md transition-colors ${
            activeTab === "browse" ?
              "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Browse Stories
        </button>
        <button
          onClick={() => setActiveTab("share")}
          className={`px-6 py-3 rounded-md transition-colors ${
            activeTab === "share" ?
              "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Share Experience
        </button>
      </div>

      {activeTab === "browse" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Search & Filter
              </h3>

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
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Categories
                </h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-md transition-colors ${
                        selectedCategory === category.id ?
                          "bg-blue-100 text-blue-700"
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
                  <h4 className="text-sm font-medium text-yellow-800">
                    Safety Reminder
                  </h4>
                  <p className="text-xs text-yellow-700 mt-1">
                    Always verify property documents, use licensed
                    professionals, and never make large payments without proper
                    verification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Community Stories
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select aria-label="Sort stories by" className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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

            <div className="text-center mt-8">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Load More Stories
              </button>
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
  );
});

export default RealEstateFraudCommunity;
