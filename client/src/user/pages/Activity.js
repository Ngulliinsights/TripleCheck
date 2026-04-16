"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Activity;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var badge_1 = require("../../local/components/ui/badge");
var tabs_1 = require("../../local/components/ui/tabs");
// Mock activity data
var mockActivities = [
    {
        id: '1',
        type: 'view',
        title: 'Viewed Property',
        description: 'You viewed a 3-bedroom apartment in Westlands',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        metadata: {
            propertyId: 'prop-1',
            propertyTitle: '3BR Apartment in Westlands',
            location: 'Westlands, Nairobi',
            price: 8500000
        }
    },
    {
        id: '2',
        type: 'favorite',
        title: 'Added to Favorites',
        description: 'You added a villa in Karen to your favorites',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        metadata: {
            propertyId: 'prop-2',
            propertyTitle: '4BR Villa in Karen',
            location: 'Karen, Nairobi',
            price: 25000000
        }
    },
    {
        id: '3',
        type: 'inquiry',
        title: 'Sent Inquiry',
        description: 'You sent an inquiry about a commercial property in CBD',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        metadata: {
            propertyId: 'prop-3',
            propertyTitle: 'Office Space in CBD',
            location: 'CBD, Nairobi',
            price: 15000000,
            inquiryType: 'viewing_request'
        }
    },
    {
        id: '4',
        type: 'search',
        title: 'Property Search',
        description: 'You searched for properties in Kilimani',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        metadata: {
            searchQuery: 'apartments in Kilimani under 10M',
            location: 'Kilimani, Nairobi'
        }
    },
    {
        id: '5',
        type: 'verification',
        title: 'Property Verification',
        description: 'You requested verification for a land parcel in Kiambu',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        metadata: {
            propertyId: 'land-1',
            propertyTitle: '2-Acre Plot in Kiambu',
            location: 'Kiambu County'
        }
    },
    {
        id: '6',
        type: 'listing',
        title: 'Listed Property',
        description: 'You listed a new property for sale',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        metadata: {
            propertyId: 'my-prop-1',
            propertyTitle: '2BR Apartment in Parklands',
            location: 'Parklands, Nairobi',
            price: 6500000
        }
    },
    {
        id: '7',
        type: 'view',
        title: 'Viewed Property',
        description: 'You viewed a townhouse in Lavington',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        metadata: {
            propertyId: 'prop-4',
            propertyTitle: '3BR Townhouse in Lavington',
            location: 'Lavington, Nairobi',
            price: 18000000
        }
    },
    {
        id: '8',
        type: 'search',
        title: 'Property Search',
        description: 'You searched for commercial properties',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
        metadata: {
            searchQuery: 'commercial properties CBD',
            location: 'CBD, Nairobi'
        }
    }
];
var getActivityIcon = function (type) {
    switch (type) {
        case 'view': return lucide_react_1.Eye;
        case 'favorite': return lucide_react_1.Heart;
        case 'inquiry': return lucide_react_1.MessageSquare;
        case 'search': return lucide_react_1.Search;
        case 'verification': return lucide_react_1.Shield;
        case 'listing': return lucide_react_1.Home;
        default: return lucide_react_1.Activity;
    }
};
var getActivityColor = function (type) {
    switch (type) {
        case 'view': return 'text-blue-500';
        case 'favorite': return 'text-red-500';
        case 'inquiry': return 'text-green-500';
        case 'search': return 'text-purple-500';
        case 'verification': return 'text-orange-500';
        case 'listing': return 'text-indigo-500';
        default: return 'text-gray-500';
    }
};
var getActivityBadgeVariant = function (type) {
    switch (type) {
        case 'view': return 'secondary';
        case 'favorite': return 'destructive';
        case 'inquiry': return 'default';
        case 'search': return 'outline';
        case 'verification': return 'secondary';
        case 'listing': return 'default';
        default: return 'secondary';
    }
};
function Activity() {
    var _a = (0, react_1.useState)('all'), filter = _a[0], setFilter = _a[1];
    var _b = (0, react_1.useState)('all'), timeFilter = _b[0], setTimeFilter = _b[1];
    // Filter activities
    var filteredActivities = (0, react_1.useMemo)(function () {
        var filtered = mockActivities;
        // Filter by type
        if (filter !== 'all') {
            filtered = filtered.filter(function (activity) { return activity.type === filter; });
        }
        // Filter by time
        if (timeFilter !== 'all') {
            var now = new Date();
            var cutoff_1 = new Date();
            switch (timeFilter) {
                case 'today':
                    cutoff_1.setHours(0, 0, 0, 0);
                    break;
                case 'week':
                    cutoff_1.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    cutoff_1.setMonth(now.getMonth() - 1);
                    break;
            }
            filtered = filtered.filter(function (activity) { return activity.timestamp >= cutoff_1; });
        }
        return filtered.sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); });
    }, [filter, timeFilter]);
    // Activity stats
    var stats = (0, react_1.useMemo)(function () {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var thisWeek = new Date();
        thisWeek.setDate(today.getDate() - 7);
        return {
            total: mockActivities.length,
            today: mockActivities.filter(function (a) { return a.timestamp >= today; }).length,
            thisWeek: mockActivities.filter(function (a) { return a.timestamp >= thisWeek; }).length,
            byType: {
                views: mockActivities.filter(function (a) { return a.type === 'view'; }).length,
                favorites: mockActivities.filter(function (a) { return a.type === 'favorite'; }).length,
                inquiries: mockActivities.filter(function (a) { return a.type === 'inquiry'; }).length,
                searches: mockActivities.filter(function (a) { return a.type === 'search'; }).length,
            }
        };
    }, []);
    var formatTime = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / (1000 * 60));
        var hours = Math.floor(diff / (1000 * 60 * 60));
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (minutes < 60)
            return "".concat(minutes, "m ago");
        if (hours < 24)
            return "".concat(hours, "h ago");
        if (days < 7)
            return "".concat(days, "d ago");
        return date.toLocaleDateString();
    };
    var formatPrice = function (price) {
        return "KES ".concat(price.toLocaleString());
    };
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Activity className="w-8 h-8"/>
            Activity Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your property browsing, searches, and interactions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <card_1.Card>
            <card_1.CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Activity</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <lucide_react_1.TrendingUp className="w-8 h-8 text-blue-500"/>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <lucide_react_1.Calendar className="w-8 h-8 text-green-500"/>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                </div>
                <lucide_react_1.Clock className="w-8 h-8 text-purple-500"/>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Property Views</p>
                  <p className="text-2xl font-bold">{stats.byType.views}</p>
                </div>
                <lucide_react_1.Eye className="w-8 h-8 text-orange-500"/>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Filters */}
        <card_1.Card className="mb-8">
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Filter className="w-5 h-5"/>
              Filter Activities
            </card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <tabs_1.Tabs value={filter} onValueChange={function (value) { return setFilter(value); }}>
              <tabs_1.TabsList className="grid w-full grid-cols-7">
                <tabs_1.TabsTrigger value="all">All</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="view">Views</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="favorite">Favorites</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="inquiry">Inquiries</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="search">Searches</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="verification">Verification</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="listing">Listings</tabs_1.TabsTrigger>
              </tabs_1.TabsList>
            </tabs_1.Tabs>

            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm font-medium">Time Period:</span>
              {['all', 'today', 'week', 'month'].map(function (period) { return (<button_1.Button key={period} variant={timeFilter === period ? 'default' : 'ghost'} size="sm" onClick={function () { return setTimeFilter(period); }} className="capitalize">
                  {period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : period}
                </button_1.Button>); })}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Activity List */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Recent Activity</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            {filteredActivities.length === 0 ? (<div className="text-center py-12">
                <lucide_react_1.Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                <h3 className="font-semibold mb-2">No activity found</h3>
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No activity to show for the selected time period.' : "No ".concat(filter, " activity found.")}
                </p>
              </div>) : (<div className="space-y-4">
                {filteredActivities.map(function (activity) {
                var IconComponent = getActivityIcon(activity.type);
                var iconColor = getActivityColor(activity.type);
                return (<div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={"p-2 rounded-full bg-muted ".concat(iconColor)}>
                        <IconComponent className="w-5 h-5"/>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{activity.title}</h3>
                            <badge_1.Badge variant={getActivityBadgeVariant(activity.type)} className="capitalize">
                              {activity.type}
                            </badge_1.Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {activity.description}
                        </p>

                        {activity.metadata && (<div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {activity.metadata.propertyTitle && (<span className="flex items-center gap-1">
                                <lucide_react_1.Home className="w-3 h-3"/>
                                {activity.metadata.propertyTitle}
                              </span>)}
                            {activity.metadata.location && (<span className="flex items-center gap-1">
                                <lucide_react_1.MapPin className="w-3 h-3"/>
                                {activity.metadata.location}
                              </span>)}
                            {activity.metadata.price && (<span className="font-medium text-primary">
                                {formatPrice(activity.metadata.price)}
                              </span>)}
                            {activity.metadata.searchQuery && (<span className="flex items-center gap-1">
                                <lucide_react_1.Search className="w-3 h-3"/>
                                "{activity.metadata.searchQuery}"
                              </span>)}
                            {activity.metadata.inquiryType && (<span className="flex items-center gap-1">
                                <lucide_react_1.User className="w-3 h-3"/>
                                {activity.metadata.inquiryType.replace('_', ' ')}
                              </span>)}
                          </div>)}
                      </div>
                    </div>);
            })}
              </div>)}
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
