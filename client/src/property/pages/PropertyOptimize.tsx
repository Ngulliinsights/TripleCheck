import React, { useState, useCallback, useMemo } from "react"
import {
  TrendingUp,
  Target,
  Camera,
  FileText,
  DollarSign,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Eye,
  Share2,
  Zap,
  Award,
  Users,
  Clock,
  type LucideIcon,
} from "lucide-react"

import { Button } from "../../local/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../local/components/ui/card"
import { Badge } from "../../local/components/ui/badge"
import { Progress } from "../../local/components/ui/progress"
import { useToast } from "../../local/hooks/use-toast"

// Enhanced type definitions with better TypeScript safety
interface OptimizationScore {
  overall: number;
  categories: {
    photos: number;
    description: number;
    pricing: number;
    location: number;
    features: number;
  };
}

interface Recommendation {
  id: string;
  category: "photos" | "description" | "pricing" | "location" | "features";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  effort: "easy" | "medium" | "hard";
  completed: boolean;
}

// Updated interface using LucideIcon type for better compatibility
interface MarketInsight {
  type: "price" | "demand" | "competition" | "trend";
  title: string;
  value: string;
  change: number;
  description: string;
  icon: LucideIcon; // This resolves the TypeScript error
}

// Type-safe constants with proper typing
const categoryIcons: Record<Recommendation["category"], LucideIcon> = {
  photos: Camera,
  description: FileText,
  pricing: DollarSign,
  location: MapPin,
  features: Star,
} as const;

const priorityColors: Record<Recommendation["priority"], string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
} as const;

const effortLabels: Record<Recommendation["effort"], string> = {
  easy: "Quick Fix",
  medium: "Some Work",
  hard: "Major Update",
} as const;

// Mock data with proper typing
const mockScore: OptimizationScore = {
  overall: 72,
  categories: {
    photos: 85,
    description: 60,
    pricing: 75,
    location: 90,
    features: 65,
  },
};

const mockRecommendations: Recommendation[] = [
  {
    id: "1",
    category: "photos",
    priority: "high",
    title: "Add more high-quality photos",
    description:
      "Properties with 10+ photos get 40% more views. You currently have 6 photos.",
    impact: "+40% more views",
    effort: "easy",
    completed: false,
  },
  {
    id: "2",
    category: "description",
    priority: "high",
    title: "Improve property description",
    description:
      "Your description is missing key details about amenities and neighborhood features.",
    impact: "+25% engagement",
    effort: "easy",
    completed: false,
  },
  {
    id: "3",
    category: "pricing",
    priority: "medium",
    title: "Consider price adjustment",
    description:
      "Your property is priced 8% above similar properties in the area.",
    impact: "+30% inquiries",
    effort: "easy",
    completed: false,
  },
  {
    id: "4",
    category: "features",
    priority: "medium",
    title: "Highlight unique features",
    description:
      "Emphasize your property's unique selling points like the garden view and modern kitchen.",
    impact: "+15% interest",
    effort: "easy",
    completed: false,
  },
  {
    id: "5",
    category: "location",
    priority: "low",
    title: "Add neighborhood information",
    description:
      "Include details about nearby schools, shopping centers, and transport links.",
    impact: "+10% relevance",
    effort: "medium",
    completed: true,
  },
];

const mockInsights: MarketInsight[] = [
  {
    type: "price",
    title: "Average Price",
    value: "KES 18.5M",
    change: 5.2,
    description: "Similar properties in your area",
    icon: DollarSign,
  },
  {
    type: "demand",
    title: "Market Demand",
    value: "High",
    change: 12.3,
    description: "Properties like yours are in high demand",
    icon: TrendingUp,
  },
  {
    type: "competition",
    title: "Competition",
    value: "23 listings",
    change: -8.1,
    description: "Similar properties currently listed",
    icon: Target,
  },
  {
    type: "trend",
    title: "Price Trend",
    value: "+3.2%",
    change: 3.2,
    description: "Price change in the last 3 months",
    icon: BarChart3,
  },
];

export default function PropertyOptimize() {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState(mockRecommendations);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Optimized filtering with proper memoization
  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === "all") return recommendations;
    return recommendations.filter((rec) => rec.category === selectedCategory);
  }, [recommendations, selectedCategory]);

  // Enhanced completion tracking with derived state
  const completionStats = useMemo(() => {
    const completedCount = recommendations.filter((rec) => rec.completed).length;
    const totalCount = recommendations.length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    return { completedCount, totalCount, completionRate };
  }, [recommendations]);

  // Optimized recommendation completion handler with better UX feedback
  const handleCompleteRecommendation = useCallback(
    (id: string) => {
      setRecommendations((prev) =>
        prev.map((rec) =>
          rec.id === id ? { ...rec, completed: !rec.completed } : rec
        )
      );

      const recommendation = recommendations.find((rec) => rec.id === id);
      if (recommendation) {
        toast({
          title: recommendation.completed
            ? "Recommendation unmarked"
            : "Recommendation completed!",
          description: recommendation.completed
            ? "You can always mark it as complete again later."
            : "Great job! This should help improve your listing performance.",
        });
      }
    },
    [recommendations, toast]
  );

  // Enhanced utility functions for better code organization
  const getScoreColor = useCallback((score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  }, []);

  const getScoreBgColor = useCallback((score: number): string => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  }, []);

  // Helper function to get performance level description
  const getPerformanceDescription = useCallback((score: number): { title: string; description: string } => {
    if (score >= 90) {
      return {
        title: "Excellent Performance",
        description: "Your listing is performing exceptionally well! Keep up the great work and maintain your current standards."
      };
    }
    if (score >= 80) {
      return {
        title: "Very Good Performance", 
        description: "Your listing is performing very well. A few small improvements could make it even better."
      };
    }
    if (score >= 70) {
      return {
        title: "Good Performance",
        description: "Your listing is performing well, but there's room for improvement. Complete the recommendations below to boost your score."
      };
    }
    if (score >= 60) {
      return {
        title: "Fair Performance",
        description: "Your listing has potential but needs some attention. Focus on the high-priority recommendations first."
      };
    }
    return {
      title: "Needs Improvement",
      description: "Your listing needs significant improvements to compete effectively. Start with the high-priority recommendations."
    };
  }, []);

  const performanceInfo = useMemo(() => getPerformanceDescription(mockScore.overall), [getPerformanceDescription]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced header with better visual hierarchy */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            Property Optimization
          </h1>
          <p className="text-muted-foreground">
            Improve your listing performance with AI-powered recommendations and real-time market insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content with enhanced layout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Overall Score Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Optimization Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div
                      className={`w-24 h-24 rounded-full flex items-center justify-center ${getScoreBgColor(mockScore.overall)}`}
                    >
                      <span
                        className={`text-3xl font-bold ${getScoreColor(mockScore.overall)}`}
                      >
                        {mockScore.overall}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {performanceInfo.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {performanceInfo.description}
                    </p>
                  </div>
                </div>

                {/* Enhanced Category Breakdown with better accessibility */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium">Category Breakdown</h4>
                  {Object.entries(mockScore.categories).map(
                    ([category, score]) => {
                      const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
                      return (
                        <div key={category} className="flex items-center gap-4">
                          <div className="flex items-center gap-2 w-32">
                            <IconComponent className="w-4 h-4" />
                            <span className="text-sm font-medium capitalize">
                              {category}
                            </span>
                          </div>
                          <div className="flex-1">
                            <Progress 
                              value={score} 
                              className="h-2" 
                              aria-label={`${category} score: ${score} out of 100`}
                            />
                          </div>
                          <span
                            className={`text-sm font-semibold w-8 ${getScoreColor(score)}`}
                          >
                            {score}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Recommendations Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Recommendations
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {completionStats.completedCount}/{completionStats.totalCount} completed
                    </span>
                    <Progress value={completionStats.completionRate} className="w-20 h-2" />
                  </div>
                </div>

                {/* Enhanced Category Filter */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedCategory("all")}
                  >
                    All ({recommendations.length})
                  </Button>
                  {Object.entries(categoryIcons).map(([category, IconComponent]) => {
                    const categoryCount = recommendations.filter(rec => rec.category === category).length;
                    return (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="capitalize"
                      >
                        <IconComponent className="w-4 h-4 mr-1" />
                        {category} ({categoryCount})
                      </Button>
                    );
                  })}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRecommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recommendations found for the selected category.</p>
                    </div>
                  ) : (
                    filteredRecommendations.map((recommendation) => {
                      const IconComponent = categoryIcons[recommendation.category];
                      return (
                        <div
                          key={recommendation.id}
                          className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                            recommendation.completed
                              ? "bg-green-50 border-green-200"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-2 rounded-full ${
                                recommendation.completed ? "bg-green-100" : "bg-gray-100"
                              }`}
                            >
                              {recommendation.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <IconComponent className="w-5 h-5 text-gray-600" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3
                                  className={`font-semibold ${
                                    recommendation.completed
                                      ? "text-green-800 line-through"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {recommendation.title}
                                </h3>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge
                                    className={priorityColors[recommendation.priority]}
                                  >
                                    {recommendation.priority}
                                  </Badge>
                                  <Badge variant="outline">
                                    {effortLabels[recommendation.effort]}
                                  </Badge>
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground mb-3">
                                {recommendation.description}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-green-600 font-medium">
                                    {recommendation.impact}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {effortLabels[recommendation.effort]} required
                                  </span>
                                </div>

                                <Button
                                  size="sm"
                                  variant={recommendation.completed ? "outline" : "default"}
                                  onClick={() =>
                                    handleCompleteRecommendation(recommendation.id)
                                  }
                                >
                                  {recommendation.completed
                                    ? "Mark Incomplete"
                                    : "Mark Complete"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Enhanced Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Views</span>
                  </div>
                  <span className="font-semibold">1,247</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Inquiries</span>
                  </div>
                  <span className="font-semibold">23</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Shares</span>
                  </div>
                  <span className="font-semibold">8</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Avg. Time on Page</span>
                  </div>
                  <span className="font-semibold">2m 34s</span>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Market Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockInsights.map((insight, index) => {
                  const IconComponent = insight.icon;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {insight.title}
                          </span>
                          <span className="font-semibold">{insight.value}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {insight.description}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              insight.change > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {insight.change > 0 ? "+" : ""}
                            {insight.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Enhanced Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload More Photos
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Edit Description
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Adjust Pricing
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Listing
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Pro Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Best Time to Post:</strong> Properties posted on
                    Tuesday-Thursday get 25% more views.
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Photo Tip:</strong> Include photos of the
                    neighborhood and nearby amenities to increase interest.
                  </p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>Response Time:</strong> Responding to inquiries
                    within 1 hour increases conversion by 60%.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}