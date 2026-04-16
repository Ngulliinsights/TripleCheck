"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PropertyOptimize;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var badge_1 = require("../../local/components/ui/badge");
var progress_1 = require("../../local/components/ui/progress");
var use_toast_1 = require("../../local/hooks/use-toast");
// Type-safe constants with proper typing
var categoryIcons = {
    photos: lucide_react_1.Camera,
    description: lucide_react_1.FileText,
    pricing: lucide_react_1.DollarSign,
    location: lucide_react_1.MapPin,
    features: lucide_react_1.Star,
};
var priorityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
};
var effortLabels = {
    easy: "Quick Fix",
    medium: "Some Work",
    hard: "Major Update",
};
// Mock data with proper typing
var mockScore = {
    overall: 72,
    categories: {
        photos: 85,
        description: 60,
        pricing: 75,
        location: 90,
        features: 65,
    },
};
var mockRecommendations = [
    {
        id: "1",
        category: "photos",
        priority: "high",
        title: "Add more high-quality photos",
        description: "Properties with 10+ photos get 40% more views. You currently have 6 photos.",
        impact: "+40% more views",
        effort: "easy",
        completed: false,
    },
    {
        id: "2",
        category: "description",
        priority: "high",
        title: "Improve property description",
        description: "Your description is missing key details about amenities and neighborhood features.",
        impact: "+25% engagement",
        effort: "easy",
        completed: false,
    },
    {
        id: "3",
        category: "pricing",
        priority: "medium",
        title: "Consider price adjustment",
        description: "Your property is priced 8% above similar properties in the area.",
        impact: "+30% inquiries",
        effort: "easy",
        completed: false,
    },
    {
        id: "4",
        category: "features",
        priority: "medium",
        title: "Highlight unique features",
        description: "Emphasize your property's unique selling points like the garden view and modern kitchen.",
        impact: "+15% interest",
        effort: "easy",
        completed: false,
    },
    {
        id: "5",
        category: "location",
        priority: "low",
        title: "Add neighborhood information",
        description: "Include details about nearby schools, shopping centers, and transport links.",
        impact: "+10% relevance",
        effort: "medium",
        completed: true,
    },
];
var mockInsights = [
    {
        type: "price",
        title: "Average Price",
        value: "KES 18.5M",
        change: 5.2,
        description: "Similar properties in your area",
        icon: lucide_react_1.DollarSign,
    },
    {
        type: "demand",
        title: "Market Demand",
        value: "High",
        change: 12.3,
        description: "Properties like yours are in high demand",
        icon: lucide_react_1.TrendingUp,
    },
    {
        type: "competition",
        title: "Competition",
        value: "23 listings",
        change: -8.1,
        description: "Similar properties currently listed",
        icon: lucide_react_1.Target,
    },
    {
        type: "trend",
        title: "Price Trend",
        value: "+3.2%",
        change: 3.2,
        description: "Price change in the last 3 months",
        icon: lucide_react_1.BarChart3,
    },
];
function PropertyOptimize() {
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(mockRecommendations), recommendations = _a[0], setRecommendations = _a[1];
    var _b = (0, react_1.useState)("all"), selectedCategory = _b[0], setSelectedCategory = _b[1];
    // Optimized filtering with proper memoization
    var filteredRecommendations = (0, react_1.useMemo)(function () {
        if (selectedCategory === "all")
            return recommendations;
        return recommendations.filter(function (rec) { return rec.category === selectedCategory; });
    }, [recommendations, selectedCategory]);
    // Enhanced completion tracking with derived state
    var completionStats = (0, react_1.useMemo)(function () {
        var completedCount = recommendations.filter(function (rec) { return rec.completed; }).length;
        var totalCount = recommendations.length;
        var completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return { completedCount: completedCount, totalCount: totalCount, completionRate: completionRate };
    }, [recommendations]);
    // Optimized recommendation completion handler with better UX feedback
    var handleCompleteRecommendation = (0, react_1.useCallback)(function (id) {
        setRecommendations(function (prev) {
            return prev.map(function (rec) {
                return rec.id === id ? __assign(__assign({}, rec), { completed: !rec.completed }) : rec;
            });
        });
        var recommendation = recommendations.find(function (rec) { return rec.id === id; });
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
    }, [recommendations, toast]);
    // Enhanced utility functions for better code organization
    var getScoreColor = (0, react_1.useCallback)(function (score) {
        if (score >= 80)
            return "text-green-600";
        if (score >= 60)
            return "text-yellow-600";
        return "text-red-600";
    }, []);
    var getScoreBgColor = (0, react_1.useCallback)(function (score) {
        if (score >= 80)
            return "bg-green-100";
        if (score >= 60)
            return "bg-yellow-100";
        return "bg-red-100";
    }, []);
    // Helper function to get performance level description
    var getPerformanceDescription = (0, react_1.useCallback)(function (score) {
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
    var performanceInfo = (0, react_1.useMemo)(function () { return getPerformanceDescription(mockScore.overall); }, [getPerformanceDescription]);
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced header with better visual hierarchy */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Zap className="w-8 h-8 text-yellow-500"/>
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
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Award className="w-5 h-5"/>
                  Optimization Score
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className={"w-24 h-24 rounded-full flex items-center justify-center ".concat(getScoreBgColor(mockScore.overall))}>
                      <span className={"text-3xl font-bold ".concat(getScoreColor(mockScore.overall))}>
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
                  {Object.entries(mockScore.categories).map(function (_a) {
            var category = _a[0], score = _a[1];
            var IconComponent = categoryIcons[category];
            return (<div key={category} className="flex items-center gap-4">
                          <div className="flex items-center gap-2 w-32">
                            <IconComponent className="w-4 h-4"/>
                            <span className="text-sm font-medium capitalize">
                              {category}
                            </span>
                          </div>
                          <div className="flex-1">
                            <progress_1.Progress value={score} className="h-2" aria-label={"".concat(category, " score: ").concat(score, " out of 100")}/>
                          </div>
                          <span className={"text-sm font-semibold w-8 ".concat(getScoreColor(score))}>
                            {score}
                          </span>
                        </div>);
        })}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Enhanced Recommendations Section */}
            <card_1.Card>
              <card_1.CardHeader>
                <div className="flex items-center justify-between">
                  <card_1.CardTitle className="flex items-center gap-2">
                    <lucide_react_1.Lightbulb className="w-5 h-5"/>
                    Recommendations
                  </card_1.CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {completionStats.completedCount}/{completionStats.totalCount} completed
                    </span>
                    <progress_1.Progress value={completionStats.completionRate} className="w-20 h-2"/>
                  </div>
                </div>

                {/* Enhanced Category Filter */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button_1.Button variant={selectedCategory === "all" ? "default" : "ghost"} size="sm" onClick={function () { return setSelectedCategory("all"); }}>
                    All ({recommendations.length})
                  </button_1.Button>
                  {Object.entries(categoryIcons).map(function (_a) {
            var category = _a[0], IconComponent = _a[1];
            var categoryCount = recommendations.filter(function (rec) { return rec.category === category; }).length;
            return (<button_1.Button key={category} variant={selectedCategory === category ? "default" : "ghost"} size="sm" onClick={function () { return setSelectedCategory(category); }} className="capitalize">
                        <IconComponent className="w-4 h-4 mr-1"/>
                        {category} ({categoryCount})
                      </button_1.Button>);
        })}
                </div>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  {filteredRecommendations.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
                      <lucide_react_1.Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                      <p>No recommendations found for the selected category.</p>
                    </div>) : (filteredRecommendations.map(function (recommendation) {
            var IconComponent = categoryIcons[recommendation.category];
            return (<div key={recommendation.id} className={"p-4 rounded-lg border transition-all hover:shadow-md ".concat(recommendation.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-white border-gray-200")}>
                          <div className="flex items-start gap-4">
                            <div className={"p-2 rounded-full ".concat(recommendation.completed ? "bg-green-100" : "bg-gray-100")}>
                              {recommendation.completed ? (<lucide_react_1.CheckCircle className="w-5 h-5 text-green-600"/>) : (<IconComponent className="w-5 h-5 text-gray-600"/>)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className={"font-semibold ".concat(recommendation.completed
                    ? "text-green-800 line-through"
                    : "text-gray-900")}>
                                  {recommendation.title}
                                </h3>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <badge_1.Badge className={priorityColors[recommendation.priority]}>
                                    {recommendation.priority}
                                  </badge_1.Badge>
                                  <badge_1.Badge variant="outline">
                                    {effortLabels[recommendation.effort]}
                                  </badge_1.Badge>
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

                                <button_1.Button size="sm" variant={recommendation.completed ? "outline" : "default"} onClick={function () {
                    return handleCompleteRecommendation(recommendation.id);
                }}>
                                  {recommendation.completed
                    ? "Mark Incomplete"
                    : "Mark Complete"}
                                </button_1.Button>
                              </div>
                            </div>
                          </div>
                        </div>);
        }))}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Enhanced Performance Stats */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.BarChart3 className="w-5 h-5"/>
                  Performance Stats
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.Eye className="w-4 h-4 text-blue-500"/>
                    <span className="text-sm">Views</span>
                  </div>
                  <span className="font-semibold">1,247</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.Users className="w-4 h-4 text-green-500"/>
                    <span className="text-sm">Inquiries</span>
                  </div>
                  <span className="font-semibold">23</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.Share2 className="w-4 h-4 text-purple-500"/>
                    <span className="text-sm">Shares</span>
                  </div>
                  <span className="font-semibold">8</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.Clock className="w-4 h-4 text-orange-500"/>
                    <span className="text-sm">Avg. Time on Page</span>
                  </div>
                  <span className="font-semibold">2m 34s</span>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Enhanced Market Insights */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.TrendingUp className="w-5 h-5"/>
                  Market Insights
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                {mockInsights.map(function (insight, index) {
            var IconComponent = insight.icon;
            return (<div key={index} className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        <IconComponent className="w-4 h-4"/>
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
                          <span className={"text-xs font-medium ".concat(insight.change > 0
                    ? "text-green-600"
                    : "text-red-600")}>
                            {insight.change > 0 ? "+" : ""}
                            {insight.change}%
                          </span>
                        </div>
                      </div>
                    </div>);
        })}
              </card_1.CardContent>
            </card_1.Card>

            {/* Enhanced Quick Actions */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Quick Actions</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-2">
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Camera className="w-4 h-4 mr-2"/>
                  Upload More Photos
                </button_1.Button>

                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.FileText className="w-4 h-4 mr-2"/>
                  Edit Description
                </button_1.Button>

                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.DollarSign className="w-4 h-4 mr-2"/>
                  Adjust Pricing
                </button_1.Button>

                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                  Preview Listing
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>

            {/* Enhanced Pro Tips */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Lightbulb className="w-5 h-5"/>
                  Pro Tips
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-3">
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
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>
    </div>);
}
