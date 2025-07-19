import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Property } from "@shared/schema";
import ListingCard from "@/components/listing-card";
import {
  Plus,
  Home,
  Shield,
  Star,
  Eye,
  MessageSquare,
  BarChart3,
  Clock,
  CheckCircle,
  Edit,
  Filter,
  Search,
  Bell,
  User,
  Heart,
  TrendingUp,
  AlertCircle,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Activity,
  Target,
  Zap,
  Award,
  Users,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";

// Enhanced type definitions with better semantic structure
interface DashboardStats {
  totalProperties: number;
  verifiedProperties: number;
  totalViews: number;
  totalInquiries: number;
  trustScore: number;
  pendingVerifications: number;
  verificationRate: number;
  avgResponseTime: number;
  monthlyGrowth: number;
  activeListings: number;
  completionRate: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  joinDate: string;
  membershipTier: "basic" | "premium" | "enterprise";
}

interface ActivityItem {
  id: string;
  type: "success" | "info" | "warning" | "inquiry" | "verification";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  timestamp: string;
  actionRequired?: boolean;
  priority: "low" | "medium" | "high";
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant: "primary" | "secondary" | "success" | "info";
  disabled?: boolean;
}

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<
    "overview" | "properties" | "analytics" | "insights"
  >("overview");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "verified" | "pending" | "draft"
  >("all");

  // Enhanced queries with better error handling and caching strategy
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes cache for user data
  });

  const { data: properties, isLoading: isLoadingProperties } = useQuery<
    Property[]
  >({
    queryKey: ["/api/properties"],
    select: (data) => (Array.isArray(data) ? data : []),
    staleTime: 2 * 60 * 1000, // 2 minutes cache for properties
    // Remove authentication requirement to allow demo access
  });

  // Enhanced computed values with more sophisticated analytics
  const computedData = useMemo(() => {
    const safeProperties = Array.isArray(properties) ? properties : [];
    const verified = safeProperties.filter(
      (p) => p.verificationStatus === "verified"
    );
    const pending = safeProperties.filter(
      (p) => p.verificationStatus === "pending"
    );
    const draft = safeProperties.filter(
      (p) => p.verificationStatus === "draft"
    );
    const active = safeProperties.filter(
      (p) => p.verificationStatus === "verified"
    ); // Use verified as active

    const totalProps = safeProperties.length;
    const verifiedCount = verified.length;
    const verificationRate =
      totalProps > 0 ? Math.round((verifiedCount / totalProps) * 100) : 0;
    const completionRate =
      totalProps > 0 ? Math.round((active.length / totalProps) * 100) : 0;

    // Simulated analytics - in real app, this would come from API
    const monthlyGrowth = Math.round(
      ((totalProps - totalProps * 0.85) / (totalProps * 0.85)) * 100
    );
    const avgResponseTime = 1.5; // hours

    const dashboardStats: DashboardStats = {
      totalProperties: totalProps,
      verifiedProperties: verifiedCount,
      totalViews: 12450,
      totalInquiries: 89,
      trustScore: Math.min(85 + verificationRate * 0.1, 100),
      pendingVerifications: pending.length,
      verificationRate,
      avgResponseTime,
      monthlyGrowth: monthlyGrowth > 0 ? monthlyGrowth : 12,
      activeListings: active.length,
      completionRate,
    };

    return {
      verifiedProperties: verified,
      pendingProperties: pending,
      draftProperties: draft,
      activeProperties: active,
      dashboardStats,
      filteredProperties:
        filterStatus === "all" ? safeProperties
        : filterStatus === "verified" ? verified
        : filterStatus === "pending" ? pending
        : draft,
    };
  }, [properties, filterStatus]);

  // Enhanced activity data with more realistic scenarios
  const recentActivity = useMemo<ActivityItem[]>(
    () => [
      {
        id: "1",
        type: "success",
        icon: CheckCircle,
        title: "Property Verified",
        description:
          "Modern Apartment in Westlands completed verification process",
        timestamp: "2 hours ago",
        actionRequired: false,
        priority: "low",
      },
      {
        id: "2",
        type: "inquiry",
        icon: MessageSquare,
        title: "High-Priority Inquiry",
        description:
          "Premium client interested in Karen property - respond within 1 hour",
        timestamp: "3 hours ago",
        actionRequired: true,
        priority: "high",
      },
      {
        id: "3",
        type: "verification",
        icon: Shield,
        title: "Verification Documents Needed",
        description: "Runda Villa requires additional ownership documents",
        timestamp: "5 hours ago",
        actionRequired: true,
        priority: "medium",
      },
      {
        id: "4",
        type: "info",
        icon: Eye,
        title: "Property Views Spike",
        description: "Your Kileleshwa listing received 47 views today",
        timestamp: "8 hours ago",
        actionRequired: false,
        priority: "low",
      },
      {
        id: "5",
        type: "warning",
        icon: Clock,
        title: "Listing Expiring Soon",
        description: "Langata property listing expires in 5 days",
        timestamp: "1 day ago",
        actionRequired: true,
        priority: "medium",
      },
    ],
    []
  );

  // Strategic navigation handlers with analytics tracking
  const handleListProperty = useCallback(() => {
    // In real app, track this action
    setLocation("/services/list-property");
  }, [setLocation]);

  const handleVerifyProperty = useCallback(() => {
    setLocation("/services/basic-checks");
  }, [setLocation]);

  const handleViewProperty = useCallback(
    (propertyId: number) => {
      setLocation(`/property/${propertyId}`);
    },
    [setLocation]
  );

  const handleEditProperty = useCallback(
    (propertyId: number) => {
      setLocation(`/property/${propertyId}/edit`);
    },
    [setLocation]
  );

  // Enhanced quick actions with strategic positioning
  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        id: "list-property",
        title: "List New Property",
        description: "Add a new property to your portfolio",
        icon: Plus,
        onClick: handleListProperty,
        variant: "primary",
      },
      {
        id: "verify-property",
        title: "Verify Properties",
        description: "Complete verification for pending listings",
        icon: Shield,
        onClick: handleVerifyProperty,
        variant: "success",
        disabled: computedData.pendingProperties.length === 0,
      },
      {
        id: "respond-inquiries",
        title: "Respond to Inquiries",
        description: "Answer questions from potential buyers",
        icon: MessageSquare,
        onClick: () => setLocation("/inbox"),
        variant: "info",
      },
      {
        id: "view-analytics",
        title: "View Reports",
        description: "Analyze your property performance",
        icon: BarChart3,
        onClick: () => setActiveTab("analytics"),
        variant: "secondary",
      },
    ],
    [
      handleListProperty,
      handleVerifyProperty,
      computedData.pendingProperties.length,
      setLocation,
    ]
  );

  // Enhanced stats card with better visual hierarchy
  const StatsCard = ({
    title,
    value,
    description,
    icon: Icon,
    trend,
    trendDirection = "up",
    clickable = false,
    onClick,
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: string;
    trendDirection?: "up" | "down" | "neutral";
    clickable?: boolean;
    onClick?: () => void;
  }) => (
    <Card
      className={`hover:shadow-lg transition-all duration-300 hover:scale-[1.02] ${
        clickable ? "cursor-pointer hover:bg-accent/5" : ""
      }`}
      onClick={clickable ? onClick : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <div
              className={`flex items-center gap-1 ${
                trendDirection === "up" ? "text-green-600"
                : trendDirection === "down" ? "text-red-600"
                : "text-yellow-600"
              }`}
            >
              <TrendingUp
                className={`w-3 h-3 ${trendDirection === "down" ? "rotate-180" : ""}`}
              />
              {trend}
            </div>
          )}
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  );

  // Enhanced loading state with better UX
  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // Show demo data when not logged in
  const displayUser = user || {
    id: "demo",
    username: "Demo User",
    email: "demo@triplecheck.com",
    membershipTier: "basic" as const,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Strategic header with user context and key actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              Welcome back, {displayUser.username}!
            </h1>
            <Badge variant="secondary" className="px-2 py-1">
              {displayUser.membershipTier.charAt(0).toUpperCase() +
                displayUser.membershipTier.slice(1)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Manage your properties, track performance, and grow your real estate
            portfolio
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" className="relative">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
            {computedData.dashboardStats.pendingVerifications > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">
                  {computedData.dashboardStats.pendingVerifications}
                </span>
              </div>
            )}
          </Button>
          <Button onClick={handleListProperty} className="gap-2">
            <Plus className="w-4 h-4" />
            List Property
          </Button>
        </div>
      </div>

      {/* Enhanced key metrics with strategic insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Properties"
          value={computedData.dashboardStats.totalProperties}
          description={`${computedData.dashboardStats.activeListings} active listings`}
          icon={Home}
          trend={`+${computedData.dashboardStats.monthlyGrowth}%`}
          trendDirection="up"
        />
        <StatsCard
          title="Verification Rate"
          value={`${computedData.dashboardStats.verificationRate}%`}
          description={`${computedData.dashboardStats.verifiedProperties} verified`}
          icon={Shield}
          trend={
            computedData.dashboardStats.verificationRate > 80 ?
              "Excellent"
            : "Good"
          }
          trendDirection={
            computedData.dashboardStats.verificationRate > 80 ? "up" : "neutral"
          }
        />
        <StatsCard
          title="Trust Score"
          value={Math.round(computedData.dashboardStats.trustScore)}
          description="Based on verification & activity"
          icon={Award}
          trend={
            computedData.dashboardStats.trustScore > 85 ? "Premium" : "Good"
          }
          trendDirection={
            computedData.dashboardStats.trustScore > 85 ? "up" : "neutral"
          }
        />
        <StatsCard
          title="Total Views"
          value={computedData.dashboardStats.totalViews.toLocaleString()}
          description={`${computedData.dashboardStats.totalInquiries} inquiries`}
          icon={Eye}
          trend="+12%"
          trendDirection="up"
          clickable
          onClick={() => setActiveTab("analytics")}
        />
      </div>

      {/* Enhanced progress indicators for key metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5" />
              Portfolio Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verification Progress</span>
                <span className="font-medium">
                  {computedData.dashboardStats.verificationRate}%
                </span>
              </div>
              <Progress
                value={computedData.dashboardStats.verificationRate}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Listing Completion</span>
                <span className="font-medium">
                  {computedData.dashboardStats.completionRate}%
                </span>
              </div>
              <Progress
                value={computedData.dashboardStats.completionRate}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5" />
              Recent Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Avg. Response Time
              </span>
              <span className="font-medium text-green-600">
                {computedData.dashboardStats.avgResponseTime}h
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Monthly Growth
              </span>
              <span className="font-medium text-blue-600">
                +{computedData.dashboardStats.monthlyGrowth}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trust Score</span>
              <span className="font-medium text-yellow-600">
                {Math.round(computedData.dashboardStats.trustScore)}/100
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced main content with strategic tab organization */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(
            value as "overview" | "properties" | "analytics" | "insights"
          )
        }
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Strategic quick actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant={
                        action.variant === "primary" ? "default" : "outline"
                      }
                      className={`h-auto p-4 flex-col items-start text-left hover:scale-[1.02] transition-all ${
                        action.disabled ? "opacity-50 cursor-not-allowed" : ""
                      } ${
                        action.variant === "success" ?
                          "hover:bg-green-50 border-green-200"
                        : action.variant === "info" ?
                          "hover:bg-blue-50 border-blue-200"
                        : action.variant === "secondary" ? "hover:bg-gray-50"
                        : ""
                      }`}
                      onClick={action.onClick}
                      disabled={action.disabled}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <action.icon className="w-5 h-5" />
                        <span className="font-medium">{action.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {action.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced activity feed with priorities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-accent/5 border-l-2 ${
                        activity.priority === "high" ?
                          "border-red-500 bg-red-50/50"
                        : activity.priority === "medium" ?
                          "border-yellow-500 bg-yellow-50/50"
                        : "border-green-500 bg-green-50/50"
                      }`}
                    >
                      <activity.icon
                        className={`w-4 h-4 mt-0.5 ${
                          activity.priority === "high" ? "text-red-600"
                          : activity.priority === "medium" ? "text-yellow-600"
                          : "text-green-600"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {activity.title}
                          </p>
                          {activity.actionRequired && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-1 py-0"
                            >
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Your Properties ({computedData.filteredProperties.length})
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  {(["all", "verified", "pending", "draft"] as const).map(
                    (status) => (
                      <Button
                        key={status}
                        variant={
                          filterStatus === status ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setFilterStatus(status)}
                        className="text-xs"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status !== "all" && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {status === "verified" ?
                              computedData.verifiedProperties.length
                            : status === "pending" ?
                              computedData.pendingProperties.length
                            : computedData.draftProperties.length}
                          </Badge>
                        )}
                      </Button>
                    )
                  )}
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingProperties ?
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              : computedData.filteredProperties.length > 0 ?
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {computedData.filteredProperties.map((property) => (
                    <div key={property.id} className="relative group">
                      <ListingCard property={property} />
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleViewProperty(property.id)}
                          className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-sm"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditProperty(property.id)}
                          className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-sm"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              : <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <Home className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {filterStatus === "all" ?
                      "No properties listed yet"
                    : `No ${filterStatus} properties found`}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {filterStatus === "all" ?
                      "Start building your real estate portfolio by listing your first property."
                    : `Try adjusting your filter or list a new property to get started.`
                    }
                  </p>
                  <Button
                    onClick={handleListProperty}
                    size="lg"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    List Your First Property
                  </Button>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Property Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      label: "Total Views",
                      value:
                        computedData.dashboardStats.totalViews.toLocaleString(),
                      color: "text-blue-600",
                    },
                    {
                      label: "Monthly Inquiries",
                      value: computedData.dashboardStats.totalInquiries,
                      color: "text-green-600",
                    },
                    {
                      label: "Active Listings",
                      value: computedData.dashboardStats.activeListings,
                      color: "text-purple-600",
                    },
                    {
                      label: "Avg. Response Time",
                      value: `${computedData.dashboardStats.avgResponseTime}h`,
                      color: "text-orange-600",
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="flex justify-between items-center p-3 hover:bg-accent/5 rounded-lg transition-colors"
                    >
                      <span className="font-medium">{metric.label}</span>
                      <span className={`font-bold ${metric.color}`}>
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Trust & Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Trust Score</span>
                      <span className="font-medium">
                        {Math.round(computedData.dashboardStats.trustScore)}/100
                      </span>
                    </div>
                    <Progress
                      value={computedData.dashboardStats.trustScore}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {computedData.dashboardStats.verifiedProperties}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Verified
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {computedData.dashboardStats.pendingVerifications}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pending
                      </div>
                    </div>
                  </div>

                  {computedData.dashboardStats.pendingVerifications > 0 && (
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleVerifyProperty}
                        className="w-full"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Complete Verifications
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Strong Growth
                      </span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Your portfolio has grown by{" "}
                      {computedData.dashboardStats.monthlyGrowth}% this month.
                      Keep up the excellent work!
                    </p>
                  </div>

                  {computedData.dashboardStats.verificationRate < 80 && (
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-900">
                          Verification Opportunity
                        </span>
                      </div>
                      <p className="text-sm text-yellow-800">
                        Verifying more properties can increase your trust score
                        and attract more buyers.
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">
                        Quick Response
                      </span>
                    </div>
                    <p className="text-sm text-green-800">
                      Your {computedData.dashboardStats.avgResponseTime}h
                      response time is excellent! This helps build trust with
                      potential buyers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      title: "Complete Property Verification",
                      description:
                        "Verify remaining properties to boost trust score",
                      action: "Verify Now",
                      priority: "high",
                      disabled:
                        computedData.dashboardStats.pendingVerifications === 0,
                      onClick: handleVerifyProperty,
                    },
                    {
                      title: "Add High-Quality Photos",
                      description:
                        "Properties with more photos get 3x more views",
                      action: "Update Photos",
                      priority: "medium",
                      onClick: () => setLocation("/properties/photos"),
                    },
                    {
                      title: "Respond to Inquiries",
                      description:
                        "Quick responses lead to more successful deals",
                      action: "View Inbox",
                      priority: "high",
                      onClick: () => setLocation("/inbox"),
                    },
                    {
                      title: "Optimize Property Titles",
                      description:
                        "Better titles can increase search visibility",
                      action: "Optimize",
                      priority: "low",
                      onClick: () => setLocation("/properties/optimize"),
                    },
                  ].map((recommendation, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                        recommendation.priority === "high" ?
                          "border-red-200 bg-red-50"
                        : recommendation.priority === "medium" ?
                          "border-yellow-200 bg-yellow-50"
                        : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {recommendation.title}
                            </span>
                            <Badge
                              variant={
                                recommendation.priority === "high" ?
                                  "destructive"
                                : "secondary"
                              }
                              className="text-xs"
                            >
                              {recommendation.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {recommendation.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={recommendation.onClick}
                          disabled={recommendation.disabled}
                          className="ml-3"
                        >
                          {recommendation.action}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
