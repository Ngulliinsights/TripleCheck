import { useSafePropertiesQuery } from "@shared/hooks/useSafeQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  TrendingUp, 
  Eye, 
  Search, 
  Target,
  Lightbulb,
  BarChart3,
  Edit,
  Wand2,
  MessageSquare,
  Clock,
  Home,
  Users,
  Award,
  Sparkles
} from "lucide-react";
import { useState, useCallback } from "react";

import { apiRequest } from "../../infrastructure/api/queryClient";
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card";
import { Input } from "../../shared/components/ui/input";
import { Label } from "../../shared/components/ui/label";
import { Progress } from "../../shared/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../shared/components/ui/tabs";
import { Textarea } from "../../shared/components/ui/textarea";
import { useToast } from "../../shared/hooks/use-toast";
import { Property } from "../../shared/schema";


interface OptimizationSuggestion {
  id: string;
  type: 'title' | 'description' | 'pricing' | 'photos' | 'features' | 'keywords';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue?: string;
  impact: string;
  effort: 'easy' | 'medium' | 'hard';
  estimatedImprovement: number;
}

interface PropertyAnalytics {
  views: number;
  inquiries: number;
  conversionRate: number;
  averageTimeOnPage: number;
  searchRanking: number;
  competitorComparison: {
    averagePrice: number;
    averageViews: number;
    yourPosition: number;
  };
}

export default function PropertyOptimizePage() {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [activeTab, setActiveTab] = useState("analysis");
  const [optimizingProperty, setOptimizingProperty] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's properties with enhanced safety
  const { data: properties, isLoading, hasValidData } = useSafePropertiesQuery(
    undefined,
    {
      context: 'property-optimize',
      staleTime: 5 * 60 * 1000
  });

  // Mock analytics data
  const mockAnalytics: PropertyAnalytics = {
    views: 1247,
    inquiries: 23,
    conversionRate: 1.8,
    averageTimeOnPage: 145,
    searchRanking: 7,
    competitorComparison: {
      averagePrice: 95000,
      averageViews: 890,
      yourPosition: 3
    }
  };

  // Mock optimization suggestions
  const mockSuggestions: OptimizationSuggestion[] = [
    {
      id: "1",
      type: "title",
      priority: "high",
      title: "Optimize Property Title",
      description: "Your title could be more descriptive and include key search terms",
      currentValue: "Modern Apartment in Westlands",
      suggestedValue: "Luxury 2BR Modern Apartment in Westlands - Prime Location, Gym & Pool",
      impact: "Could increase search visibility by 40%",
      effort: "easy",
      estimatedImprovement: 40
    },
    {
      id: "2",
      type: "pricing",
      priority: "high",
      title: "Price Positioning",
      description: "Your property is priced 12% above market average for similar properties",
      currentValue: "KES 85,000",
      suggestedValue: "KES 78,000 - 82,000",
      impact: "Could increase inquiries by 60%",
      effort: "easy",
      estimatedImprovement: 60
    },
    {
      id: "3",
      type: "description",
      priority: "medium",
      title: "Enhance Description",
      description: "Add more details about amenities, neighborhood, and unique features",
      impact: "Could improve conversion rate by 25%",
      effort: "medium",
      estimatedImprovement: 25
    },
    {
      id: "4",
      type: "photos",
      priority: "medium",
      title: "Add More Photos",
      description: "Properties with 8+ photos get 3x more inquiries",
      currentValue: "4 photos",
      suggestedValue: "8-12 photos including exterior, all rooms, and amenities",
      impact: "Could triple your inquiries",
      effort: "medium",
      estimatedImprovement: 200
    },
    {
      id: "5",
      type: "keywords",
      priority: "low",
      title: "SEO Keywords",
      description: "Include trending search terms in your listing",
      suggestedValue: "Add: 'furnished', 'parking', 'security', 'modern kitchen'",
      impact: "Could improve search ranking by 15%",
      effort: "easy",
      estimatedImprovement: 15
    }
  ];

  const optimizeMutation = useMutation({
    mutationFn: async (data: { propertyId: string; suggestions: string[] }) => {
      // Mock API call
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 3000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Property optimized successfully",
        description: "Your property listing has been updated with AI suggestions",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      setOptimizingProperty(false);
    },
  });

  const handleOptimize = useCallback((suggestionIds: string[]) => {
    if (!selectedProperty) return;
    
    setOptimizingProperty(true);
    optimizeMutation.mutate({
      propertyId: selectedProperty,
      suggestions: suggestionIds
    });
  }, [selectedProperty, optimizeMutation]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'easy':
        return <Badge variant="default" className="bg-green-500">Easy</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'hard':
        return <Badge variant="destructive">Hard</Badge>;
      default:
        return null;
    }
  };

  const selectedPropertyData = properties?.find(p => p.id.toString() === selectedProperty);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            Property Optimization
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Use AI-powered insights to optimize your property listings for maximum visibility, 
            engagement, and conversion rates.
          </p>
        </div>

        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Property to Optimize</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading properties...</p>
                </div>
              ) : properties && properties.length > 0 ? (
                properties.map((property) => (
                  <Card 
                    key={property.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProperty === property.id.toString() ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedProperty(property.id.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {(Array.isArray(property.imageUrls) && property.imageUrls[0]) || (Array.isArray(property.images) && property.images[0]) ? (
                          <img 
                            src={(Array.isArray(property.imageUrls) && property.imageUrls[0]) || (Array.isArray(property.images) && property.images[0]) || ''} 
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium mb-1">{property.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {typeof property.location === 'string' ? property.location : (property.location as any)?.address || 'Location not specified'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">
                          KES {property.price.toLocaleString()}
                        </span>
                        <Badge variant="outline">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Optimize
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No properties found</h3>
                  <p className="text-muted-foreground">
                    You need to list a property before you can optimize it.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedProperty && selectedPropertyData && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analysis">Performance Analysis</TabsTrigger>
              <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
              <TabsTrigger value="optimize">Quick Optimize</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Total Views</span>
                    </div>
                    <div className="text-2xl font-bold">{mockAnalytics.views.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Inquiries</span>
                    </div>
                    <div className="text-2xl font-bold">{mockAnalytics.inquiries}</div>
                    <p className="text-xs text-muted-foreground">{mockAnalytics.conversionRate}% conversion rate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Avg. Time</span>
                    </div>
                    <div className="text-2xl font-bold">{mockAnalytics.averageTimeOnPage}s</div>
                    <p className="text-xs text-muted-foreground">Time on page</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Search Rank</span>
                    </div>
                    <div className="text-2xl font-bold">#{mockAnalytics.searchRanking}</div>
                    <p className="text-xs text-muted-foreground">In search results</p>
                  </CardContent>
                </Card>
              </div>

              {/* Competitive Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Competitive Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        KES {mockAnalytics.competitorComparison.averagePrice.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Market Average Price</p>
                      <p className="text-xs text-blue-600 mt-1">
                        You're {((selectedPropertyData.price / mockAnalytics.competitorComparison.averagePrice - 1) * 100).toFixed(0)}% above average
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {mockAnalytics.competitorComparison.averageViews.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Average Views</p>
                      <p className="text-xs text-green-600 mt-1">
                        You're {((mockAnalytics.views / mockAnalytics.competitorComparison.averageViews - 1) * 100).toFixed(0)}% above average
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        #{mockAnalytics.competitorComparison.yourPosition}
                      </div>
                      <p className="text-sm text-muted-foreground">Your Position</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        In similar properties
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    AI-Powered Optimization Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockSuggestions.map((suggestion) => (
                      <div 
                        key={suggestion.id}
                        className={`p-4 rounded-lg border-l-4 ${getPriorityColor(suggestion.priority)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{suggestion.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.priority} priority
                            </Badge>
                            {getEffortBadge(suggestion.effort)}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">
                              +{suggestion.estimatedImprovement}%
                            </div>
                            <div className="text-xs text-muted-foreground">improvement</div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                        
                        {suggestion.currentValue && (
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Current: </span>
                              <span className="text-muted-foreground">{suggestion.currentValue}</span>
                            </div>
                            {suggestion.suggestedValue && (
                              <div>
                                <span className="font-medium">Suggested: </span>
                                <span className="text-green-600">{suggestion.suggestedValue}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{suggestion.impact}</span>
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="optimize" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Quick Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <Target className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">AI-Powered Optimization</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Let our AI automatically optimize your property listing based on market data, 
                      competitor analysis, and proven best practices.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <TrendingUp className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <h4 className="font-medium mb-1">Increase Visibility</h4>
                      <p className="text-sm text-muted-foreground">Optimize for search algorithms</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Users className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <h4 className="font-medium mb-1">Boost Engagement</h4>
                      <p className="text-sm text-muted-foreground">Improve title and description</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Award className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                      <h4 className="font-medium mb-1">Competitive Edge</h4>
                      <p className="text-sm text-muted-foreground">Beat similar listings</p>
                    </div>
                  </div>

                  {optimizingProperty && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Optimizing your property...</p>
                      </div>
                      <Progress value={66} className="h-2" />
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Button 
                      size="lg" 
                      onClick={() => handleOptimize(mockSuggestions.map(s => s.id))}
                      disabled={optimizingProperty}
                      className="px-8"
                    >
                      {optimizingProperty ? (
                        <>Optimizing...</>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Optimize Property Now
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>This will automatically apply high-priority optimizations to your listing.</p>
                    <p>You can review and modify changes afterwards.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}