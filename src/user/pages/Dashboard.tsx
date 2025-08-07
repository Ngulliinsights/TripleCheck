// Dashboard.tsx - Merged: Rich Features + Performance Optimizations
// Combines full feature set with React.memo, immutable data, and optimized callbacks

import { GridVirtualizedList } from "@shared/components";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@shared/components/ui/tabs";
import { usePropertyGridVirtualization } from "@shared/hooks/useVirtualizationHelpers";
import {
  Bell,
  Settings,
  Home,
  Eye,
  Heart,
  MessageSquare,
  Shield,
  TrendingUp,
  Camera,
} from "lucide-react";
import React, { useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";


import { formatDate } from "../../shared/utils/date-utils";

/* ---------- TYPES ---------- */
type MembershipTier = "basic" | "premium" | "enterprise";

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly membershipTier: MembershipTier;
  readonly trustScore: number;
  readonly joinDate: string;
}

interface Property {
  readonly id: number;
  readonly title: string;
  readonly location: string;
  readonly price: number;
  readonly image?: string;
  readonly status: "verified" | "pending" | "draft";
}

interface ActivityItem {
  readonly id: string;
  readonly type: "verification" | "message" | "save";
  readonly title: string;
  readonly description: string;
  readonly time: string;
  readonly status: "success" | "info";
}

interface StatItem {
  readonly title: string;
  readonly value: number;
  readonly icon: React.ComponentType<any>;
  readonly color: string;
  readonly bg: string;
}

/* ---------- OPTIMIZED MOCK DATA ---------- */
const USER_DATA: User = Object.freeze({
  id: "usr-123",
  name: "John Doe",
  email: "john.doe@example.com",
  membershipTier: "premium",
  trustScore: 4.8,
  joinDate: "2024-01-15",
});

const PROPERTIES_DATA: readonly Property[] = Object.freeze([
  Object.freeze({
    id: 1,
    title: "Modern 3-Bedroom Apartment",
    location: "Westlands, Nairobi",
    price: 150_000,
    image: "/assets/apartment-luxury-1.jpg",
    status: "verified" as const,
  }),
  Object.freeze({
    id: 2,
    title: "Villa in Karen",
    location: "Karen, Nairobi",
    price: 350_000,
    image: "/placeholder-2.jpg",
    status: "pending" as const,
  }),
  Object.freeze({
    id: 3,
    title: "Office Space CBD",
    location: "Nairobi CBD",
    price: 200_000,
    image: "/placeholder-3.jpg",
    status: "draft" as const,
  }),
]);

const RECENT_ACTIVITY: readonly ActivityItem[] = Object.freeze([
  Object.freeze({
    id: "a1",
    type: "verification" as const,
    title: "Property verified successfully",
    description: "Modern Apartment in Westlands",
    time: "2h ago",
    status: "success" as const,
  }),
  Object.freeze({
    id: "a2",
    type: "message" as const,
    title: "New message received",
    description: "From Sarah Johnson about Karen House",
    time: "5h ago",
    status: "info" as const,
  }),
  Object.freeze({
    id: "a3",
    type: "save" as const,
    title: "Property saved to favorites",
    description: "Luxury Villa in Runda",
    time: "1d ago",
    status: "info" as const,
  }),
]);

// Dynamic stats based on actual data
const getStatsData = (properties: readonly Property[]): readonly StatItem[] => Object.freeze([
  Object.freeze({
    title: "Properties Verified",
    value: properties.filter(p => p.status === "verified").length,
    icon: Shield,
    color: "text-green-600",
    bg: "bg-green-100",
  }),
  Object.freeze({
    title: "Saved Properties",
    value: properties.length,
    icon: Heart,
    color: "text-red-600",
    bg: "bg-red-100",
  }),
  Object.freeze({
    title: "Property Views",
    value: 156, // This would come from analytics in real app
    icon: Eye,
    color: "text-blue-600",
    bg: "bg-blue-100",
  }),
  Object.freeze({
    title: "Messages",
    value: RECENT_ACTIVITY.filter(a => a.type === "message").length,
    icon: MessageSquare,
    color: "text-purple-600",
    bg: "bg-purple-100",
  }),
]);

/* ---------- OPTIMIZED SUB-COMPONENTS ---------- */
const StatCard = React.memo<StatItem & { onClick?: () => void }>(
  ({ title, value, icon: Icon, color, bg, onClick }) => {
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (onClick && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onClick();
      }
    }, [onClick]);

    const handleClick = useCallback(() => {
      onClick?.();
    }, [onClick]);

    return (
      <Card
        className={
          onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""
        }
        onClick={handleClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `View ${title}` : undefined}
      >
        <CardContent className="flex items-center p-4">
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
);
StatCard.displayName = 'StatCard';

const PropertyCard = React.memo<{
  property: Property;
  onNavigate: (path: string) => void;
}>(({ property, onNavigate }) => {
  const handleViewDetails = useCallback(() => {
    onNavigate(`/property/${property.id}`);
  }, [property.id, onNavigate]);

  const getBadgeVariant = useCallback((status: Property['status']) => {
    switch (status) {
      case "verified": return "default";
      case "pending": return "secondary";
      case "draft": return "outline";
      default: return "secondary";
    }
  }, []);

  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <img
        src={property.image || "/placeholder.jpg"}
        alt={property.title}
        className="w-full h-40 object-cover"
        loading="lazy"
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold line-clamp-2">{property.title}</h3>
          <Badge variant={getBadgeVariant(property.status)}>
            {property.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-2">{property.location}</p>
        <p className="text-lg font-bold text-blue-600 mb-3">
          KES {property.price.toLocaleString()}
        </p>
        <Button
          size="sm"
          className="w-full"
          onClick={handleViewDetails}
        >
          View Details
        </Button>
      </div>
    </div>
  );
});
PropertyCard.displayName = 'PropertyCard';

const ActivityRow = React.memo<ActivityItem & { onClick?: () => void }>(
  ({ type, title, description, time, status, onClick }) => {
    const iconMap = useMemo(() => ({
      verification: <Shield className="w-4 h-4 text-green-600" />,
      message: <MessageSquare className="w-4 h-4 text-blue-600" />,
      save: <Heart className="w-4 h-4 text-red-600" />,
    }), []);

    const bgMap = useMemo(() => ({
      success: "bg-green-100",
      info: "bg-blue-100",
    }), []);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (onClick && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onClick();
      }
    }, [onClick]);

    const handleClick = useCallback(() => {
      onClick?.();
    }, [onClick]);

    // Safe access to prevent object injection
    const getIcon = useCallback((activityType: ActivityItem["type"]) => {
      const validTypes = ["verification", "message", "save"] as const;
      return validTypes.includes(activityType) ?
          iconMap[activityType]
        : iconMap.verification;
    }, [iconMap]);

    const getBgClass = useCallback((activityStatus: ActivityItem["status"]) => {
      const validStatuses = ["success", "info"] as const;
      return validStatuses.includes(activityStatus) ?
          bgMap[activityStatus]
        : bgMap.info;
    }, [bgMap]);

    return (
      <div
        className={`flex items-start space-x-3 p-3 rounded-lg bg-gray-50 ${
          onClick ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""
        }`}
        onClick={handleClick}
        onKeyDown={onClick ? handleKeyDown : undefined}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? `View ${title}` : undefined}
      >
        <div className={`p-2 rounded-full ${getBgClass(status)}`}>
          {getIcon(type)}
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          <p className="text-xs text-gray-500 mt-1">{time}</p>
        </div>
      </div>
    );
  }
);
ActivityRow.displayName = 'ActivityRow';

/* ---------- VIRTUALIZED PROPERTY GRID ---------- */
const VirtualizedPropertyGrid: React.FC<{
  properties: any[];
  onNavigate: (path: string) => void;
}> = ({ properties, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100;
        setContainerHeight(Math.max(300, Math.min(600, availableHeight)));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const gridProps = usePropertyGridVirtualization(
    properties,
    containerRef.current?.clientWidth || 1200,
    containerHeight,
    350, // card width
    280  // card height
  );

  const renderPropertyItem = useCallback((property: any, index: number, style: React.CSSProperties) => {
    return (
      <div style={style} className="p-2">
        <PropertyCard
          key={property.id}
          property={property}
          onNavigate={onNavigate}
        />
      </div>
    );
  }, [onNavigate]);

  return (
    <div ref={containerRef} className="w-full">
      <GridVirtualizedList
        {...gridProps}
        renderItem={renderPropertyItem}
      />
    </div>
  );
};

/* ---------- MAIN DASHBOARD ---------- */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<
    "all" | "verified" | "pending" | "draft"
  >("all");

  // Memoized stats calculation
  const stats = useMemo(() => getStatsData(PROPERTIES_DATA), []);

  // Memoized filtered properties
  const filteredProperties = useMemo(() => {
    return filter === "all" ? 
      PROPERTIES_DATA : 
      PROPERTIES_DATA.filter((p) => p.status === filter);
  }, [filter]);

  // Memoized navigation handlers
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleFilterChange = useCallback((newFilter: typeof filter) => {
    setFilter(newFilter);
  }, []);

  const handleStatClick = useCallback((title: string) => {
    if (title === "Messages") {
      navigate("/inbox");
    }
  }, [navigate]);

  const handleActivityClick = useCallback((type: ActivityItem["type"]) => {
    if (type === "message") {
      navigate("/inbox");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 navbar-offset pb-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {USER_DATA.name}!</h1>
              <p className="text-gray-600">
                {USER_DATA.membershipTier.charAt(0).toUpperCase() +
                  USER_DATA.membershipTier.slice(1)}{" "}
                Member since {formatDate(USER_DATA.joinDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => handleNavigate("/notifications")}>
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" onClick={() => handleNavigate("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              {...stat}
              onClick={
                stat.title === "Messages" ? () => handleStatClick(stat.title) : undefined
              }
            />
          ))}
        </section>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {RECENT_ACTIVITY.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    {...activity}
                    onClick={
                      activity.type === "message" ?
                        () => handleActivityClick(activity.type)
                      : undefined
                    }
                  />
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleNavigate("/activity")}
                >
                  View All Activity
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigate("/services/list-property")}
                >
                  <Home className="w-4 h-4 mr-2" />
                  List New Property
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigate("/property/photos")}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Manage Property Photos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigate("/services/basic-checks")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Property
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigate("/inbox")}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View All Messages
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleNavigate("/properties")}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Browse Properties
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Properties</CardTitle>
                <div className="flex gap-2">
                  {(["all", "verified", "pending", "draft"] as const).map(
                    (f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={filter === f ? "default" : "outline"}
                        onClick={() => handleFilterChange(f)}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {filteredProperties.length ?
                  <VirtualizedPropertyGrid
                    properties={filteredProperties}
                    onNavigate={handleNavigate}
                  />
                : <div className="text-center py-12 text-gray-500">
                    <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No properties found
                    </h3>
                    <p className="text-gray-600">
                      {filter === "all" 
                        ? "You haven't added any properties yet."
                        : `No ${filter} properties found.`
                      }
                    </p>
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Advanced charts & insights coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default React.memo(DashboardPage);
