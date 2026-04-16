"use strict";
// Dashboard.tsx - Merged: Rich Features + Performance Optimizations
// Combines full feature set with React.memo, immutable data, and optimized callbacks
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../../local/components/index");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var tabs_1 = require("../../local/components/ui/tabs");
var useMemoryOptimization_1 = require("../../local/hooks/useMemoryOptimization");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var date_utils_1 = require("../../local/utils/date-utils");
/* ---------- OPTIMIZED MOCK DATA ---------- */
var USER_DATA = Object.freeze({
    id: "usr-123",
    name: "John Doe",
    email: "john.doe@example.com",
    membershipTier: "premium",
    trustScore: 4.8,
    joinDate: "2024-01-15",
});
var PROPERTIES_DATA = Object.freeze([
    Object.freeze({
        id: 1,
        title: "Modern 3-Bedroom Apartment",
        location: "Westlands, Nairobi",
        price: 150000,
        image: "/assets/apartment-luxury-1.jpg",
        status: "verified",
    }),
    Object.freeze({
        id: 2,
        title: "Villa in Karen",
        location: "Karen, Nairobi",
        price: 350000,
        image: "/placeholder-2.jpg",
        status: "pending",
    }),
    Object.freeze({
        id: 3,
        title: "Office Space CBD",
        location: "Nairobi CBD",
        price: 200000,
        image: "/placeholder-3.jpg",
        status: "draft",
    }),
]);
var RECENT_ACTIVITY = Object.freeze([
    Object.freeze({
        id: "a1",
        type: "verification",
        title: "Property verified successfully",
        description: "Modern Apartment in Westlands",
        time: "2h ago",
        status: "success",
    }),
    Object.freeze({
        id: "a2",
        type: "message",
        title: "New message received",
        description: "From Sarah Johnson about Karen House",
        time: "5h ago",
        status: "info",
    }),
    Object.freeze({
        id: "a3",
        type: "save",
        title: "Property saved to favorites",
        description: "Luxury Villa in Runda",
        time: "1d ago",
        status: "info",
    }),
]);
// Dynamic stats based on actual data
var getStatsData = function (properties) {
    return Object.freeze([
        Object.freeze({
            title: "Properties Verified",
            value: properties.filter(function (p) { return p.status === "verified"; }).length,
            icon: lucide_react_1.Shield,
            color: "text-green-600",
            bg: "bg-green-100",
        }),
        Object.freeze({
            title: "Saved Properties",
            value: properties.length,
            icon: lucide_react_1.Heart,
            color: "text-red-600",
            bg: "bg-red-100",
        }),
        Object.freeze({
            title: "Property Views",
            value: 156, // This would come from analytics in real app
            icon: lucide_react_1.Eye,
            color: "text-blue-600",
            bg: "bg-blue-100",
        }),
        Object.freeze({
            title: "Messages",
            value: RECENT_ACTIVITY.filter(function (a) { return a.type === "message"; }).length,
            icon: lucide_react_1.MessageSquare,
            color: "text-purple-600",
            bg: "bg-purple-100",
        }),
    ]);
};
/* ---------- OPTIMIZED SUB-COMPONENTS ---------- */
var StatCard = react_1.default.memo(function (_a) {
    var title = _a.title, value = _a.value, Icon = _a.icon, color = _a.color, bg = _a.bg, onClick = _a.onClick;
    var handleKeyDown = (0, react_1.useCallback)(function (event) {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onClick();
        }
    }, [onClick]);
    var handleClick = (0, react_1.useCallback)(function () {
        onClick === null || onClick === void 0 ? void 0 : onClick();
    }, [onClick]);
    return (<card_1.Card className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={handleClick} onKeyDown={onClick ? handleKeyDown : undefined} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} aria-label={onClick ? "View ".concat(title) : undefined}>
        <card_1.CardContent className="flex items-center p-4">
          <div className={"p-2 rounded-lg ".concat(bg)}>
            <Icon className={"w-5 h-5 ".concat(color)}/>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
});
StatCard.displayName = "StatCard";
var PropertyCard = react_1.default.memo(function (_a) {
    var property = _a.property, onNavigate = _a.onNavigate;
    var handleViewDetails = (0, react_1.useCallback)(function () {
        onNavigate("/property/".concat(property.id));
    }, [property.id, onNavigate]);
    var getBadgeVariant = (0, react_1.useCallback)(function (status) {
        switch (status) {
            case "verified":
                return "default";
            case "pending":
                return "secondary";
            case "draft":
                return "outline";
            default:
                return "secondary";
        }
    }, []);
    return (<div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <img src={property.image || "/placeholder.jpg"} alt={property.title} className="w-full h-40 object-cover" loading="lazy"/>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold line-clamp-2">{property.title}</h3>
          <badge_1.Badge variant={getBadgeVariant(property.status)}>
            {property.status}
          </badge_1.Badge>
        </div>
        <p className="text-sm text-gray-600 mb-2">{property.location}</p>
        <p className="text-lg font-bold text-blue-600 mb-3">
          KES {property.price.toLocaleString()}
        </p>
        <button_1.Button size="sm" className="w-full" onClick={handleViewDetails}>
          View Details
        </button_1.Button>
      </div>
    </div>);
});
PropertyCard.displayName = "PropertyCard";
var ActivityRow = react_1.default.memo(function (_a) {
    var type = _a.type, title = _a.title, description = _a.description, time = _a.time, status = _a.status, onClick = _a.onClick;
    var iconMap = (0, react_1.useMemo)(function () { return ({
        verification: <lucide_react_1.Shield className="w-4 h-4 text-green-600"/>,
        message: <lucide_react_1.MessageSquare className="w-4 h-4 text-blue-600"/>,
        save: <lucide_react_1.Heart className="w-4 h-4 text-red-600"/>,
    }); }, []);
    var bgMap = (0, react_1.useMemo)(function () { return ({
        success: "bg-green-100",
        info: "bg-blue-100",
    }); }, []);
    var handleKeyDown = (0, react_1.useCallback)(function (event) {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onClick();
        }
    }, [onClick]);
    var handleClick = (0, react_1.useCallback)(function () {
        onClick === null || onClick === void 0 ? void 0 : onClick();
    }, [onClick]);
    // Safe access to prevent object injection
    var getIcon = (0, react_1.useCallback)(function (activityType) {
        switch (activityType) {
            case "verification":
                return iconMap.verification;
            case "message":
                return iconMap.message;
            case "save":
                return iconMap.save;
            default:
                return iconMap.verification;
        }
    }, [iconMap]);
    var getBgClass = (0, react_1.useCallback)(function (activityStatus) {
        switch (activityStatus) {
            case "success":
                return bgMap.success;
            case "info":
                return bgMap.info;
            default:
                return bgMap.info;
        }
    }, [bgMap]);
    return (<div className={"flex items-start space-x-3 p-3 rounded-lg bg-gray-50 ".concat(onClick ? "cursor-pointer hover:bg-gray-100 transition-colors" : "")} onClick={handleClick} onKeyDown={onClick ? handleKeyDown : undefined} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} aria-label={onClick ? "View ".concat(title) : undefined}>
        <div className={"p-2 rounded-full ".concat(getBgClass(status))}>
          {getIcon(type)}
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          <p className="text-xs text-gray-500 mt-1">{time}</p>
        </div>
      </div>);
});
ActivityRow.displayName = "ActivityRow";
/* ---------- VIRTUALIZED PROPERTY GRID ---------- */
var VirtualizedPropertyGrid = function (_a) {
    var _b;
    var properties = _a.properties, onNavigate = _a.onNavigate;
    var containerRef = (0, react_1.useRef)(null);
    var _c = (0, react_1.useState)(400), containerHeight = _c[0], setContainerHeight = _c[1];
    react_1.default.useEffect(function () {
        var updateHeight = function () {
            if (containerRef.current) {
                var rect = containerRef.current.getBoundingClientRect();
                var availableHeight = window.innerHeight - rect.top - 100;
                setContainerHeight(Math.max(300, Math.min(600, availableHeight)));
            }
        };
        updateHeight();
        window.addEventListener("resize", updateHeight);
        return function () { return window.removeEventListener("resize", updateHeight); };
    }, []);
    var gridProps = (0, useMemoryOptimization_1.usePropertyGridVirtualization)(properties, ((_b = containerRef.current) === null || _b === void 0 ? void 0 : _b.clientWidth) || 1200, containerHeight, 350, // card width
    280 // card height
    );
    var renderPropertyItem = (0, react_1.useCallback)(function (property, _index, style) {
        return (<div style={style} className="p-2">
          <PropertyCard key={property.id} property={property} onNavigate={onNavigate}/>
        </div>);
    }, [onNavigate]);
    return (<div ref={containerRef} className="w-full">
      <index_1.GridVirtualizedList {...gridProps} renderItem={renderPropertyItem}/>
    </div>);
};
/* ---------- MAIN DASHBOARD ---------- */
var DashboardPage = function () {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)("all"), filter = _a[0], setFilter = _a[1];
    // Memoized stats calculation
    var stats = (0, react_1.useMemo)(function () { return getStatsData(PROPERTIES_DATA); }, []);
    // Memoized filtered properties
    var filteredProperties = (0, react_1.useMemo)(function () {
        return filter === "all" ? PROPERTIES_DATA : (PROPERTIES_DATA.filter(function (p) { return p.status === filter; }));
    }, [filter]);
    // Memoized navigation handlers
    var handleNavigate = (0, react_1.useCallback)(function (path) {
        navigate(path);
    }, [navigate]);
    var handleFilterChange = (0, react_1.useCallback)(function (newFilter) {
        setFilter(newFilter);
    }, []);
    var handleStatClick = (0, react_1.useCallback)(function (title) {
        if (title === "Messages") {
            navigate("/inbox");
        }
    }, [navigate]);
    var handleActivityClick = (0, react_1.useCallback)(function (type) {
        if (type === "message") {
            navigate("/inbox");
        }
    }, [navigate]);
    return (<div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 navbar-offset pb-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {USER_DATA.name}!
              </h1>
              <p className="text-gray-600">
                {USER_DATA.membershipTier.charAt(0).toUpperCase() +
            USER_DATA.membershipTier.slice(1)}{" "}
                Member since {(0, date_utils_1.formatDate)(USER_DATA.joinDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button_1.Button variant="outline" onClick={function () { return handleNavigate("/notifications"); }}>
                <lucide_react_1.Bell className="w-4 h-4 mr-2"/>
                Notifications
              </button_1.Button>
              <button_1.Button variant="outline" onClick={function () { return handleNavigate("/settings"); }}>
                <lucide_react_1.Settings className="w-4 h-4 mr-2"/>
                Settings
              </button_1.Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map(function (stat) { return (<StatCard key={stat.title} {...stat} onClick={stat.title === "Messages" ?
                function () { return handleStatClick(stat.title); }
                : undefined}/>); })}
        </section>

        {/* Main Content */}
        <tabs_1.Tabs defaultValue="overview" className="w-full">
          <tabs_1.TabsList>
            <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="properties">My Properties</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="analytics">Analytics</tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value="overview" className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <card_1.Card className="lg:col-span-2">
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.TrendingUp className="w-5 h-5"/>
                  Recent Activity
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                {RECENT_ACTIVITY.map(function (activity) { return (<ActivityRow key={activity.id} {...activity} onClick={activity.type === "message" ?
                function () { return handleActivityClick(activity.type); }
                : undefined}/>); })}
                <button_1.Button variant="outline" className="w-full" onClick={function () { return handleNavigate("/activity"); }}>
                  View All Activity
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>

            {/* Quick Actions */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Quick Actions</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-2">
                <button_1.Button variant="outline" className="w-full justify-start" onClick={function () { return handleNavigate("/list-property"); }}>
                  <lucide_react_1.Home className="w-4 h-4 mr-2"/>
                  List New Property
                </button_1.Button>
                <button_1.Button variant="outline" className="w-full justify-start" onClick={function () { return handleNavigate("/property/photos"); }}>
                  <lucide_react_1.Camera className="w-4 h-4 mr-2"/>
                  Manage Property Photos
                </button_1.Button>
                <button_1.Button variant="outline" className="w-full justify-start" onClick={function () { return handleNavigate("/trust/basic-checks"); }}>
                  <lucide_react_1.Shield className="w-4 h-4 mr-2"/>
                  Verify Property
                </button_1.Button>
                <button_1.Button variant="outline" className="w-full justify-start" onClick={function () { return handleNavigate("/inbox"); }}>
                  <lucide_react_1.MessageSquare className="w-4 h-4 mr-2"/>
                  View All Messages
                </button_1.Button>
                <button_1.Button variant="outline" className="w-full justify-start" onClick={function () { return handleNavigate("/properties"); }}>
                  <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                  Browse Properties
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="properties" className="mt-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>My Properties</card_1.CardTitle>
                <div className="flex gap-2">
                  {["all", "verified", "pending", "draft"].map(function (f) { return (<button_1.Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={function () { return handleFilterChange(f); }}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button_1.Button>); })}
                </div>
              </card_1.CardHeader>
              <card_1.CardContent>
                {filteredProperties.length ?
            <VirtualizedPropertyGrid properties={filteredProperties} onNavigate={handleNavigate}/>
            : <div className="text-center py-12 text-gray-500">
                    <lucide_react_1.Home className="h-12 w-12 mx-auto text-gray-400 mb-4"/>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No properties found
                    </h3>
                    <p className="text-gray-600">
                      {filter === "all" ?
                    "You haven't added any properties yet."
                    : "No ".concat(filter, " properties found.")}
                    </p>
                  </div>}
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="analytics" className="mt-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Analytics</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <p className="text-gray-600">
                  Advanced charts & insights coming soon.
                </p>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </div>
    </div>);
};
exports.default = react_1.default.memo(DashboardPage);
