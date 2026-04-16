import { useState, useMemo } from 'react'
import { 
  Activity as ActivityIcon, 
  Eye, 
  Heart, 
  MessageSquare, 
  Search, 
  Home, 
  Shield, 
  Calendar,
  Filter,
  Clock,
  TrendingUp,
  MapPin,
  User
} from 'lucide-react'

import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Badge } from '../../shared/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'

interface ActivityItem {
  id: string;
  type: 'view' | 'favorite' | 'inquiry' | 'search' | 'verification' | 'listing';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: {
    propertyId?: string;
    propertyTitle?: string;
    location?: string;
    price?: number;
    searchQuery?: string;
    inquiryType?: string;
  };
}

// Mock activity data
const mockActivities: ActivityItem[] = [
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

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'view': return Eye;
    case 'favorite': return Heart;
    case 'inquiry': return MessageSquare;
    case 'search': return Search;
    case 'verification': return Shield;
    case 'listing': return Home;
    default: return ActivityIcon;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
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

const getActivityBadgeVariant = (type: ActivityItem['type']) => {
  switch (type) {
    case 'view': return 'secondary' as const;
    case 'favorite': return 'destructive' as const;
    case 'inquiry': return 'default' as const;
    case 'search': return 'outline' as const;
    case 'verification': return 'secondary' as const;
    case 'listing': return 'default' as const;
    default: return 'secondary' as const;
  }
};

export default function Activity() {
  const [filter, setFilter] = useState<'all' | ActivityItem['type']>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = mockActivities;

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(activity => activity.type === filter);
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (timeFilter) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(activity => activity.timestamp >= cutoff);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [filter, timeFilter]);

  // Activity stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(today.getDate() - 7);

    return {
      total: mockActivities.length,
      today: mockActivities.filter(a => a.timestamp >= today).length,
      thisWeek: mockActivities.filter(a => a.timestamp >= thisWeek).length,
      byType: {
        views: mockActivities.filter(a => a.type === 'view').length,
        favorites: mockActivities.filter(a => a.type === 'favorite').length,
        inquiries: mockActivities.filter(a => a.type === 'inquiry').length,
        searches: mockActivities.filter(a => a.type === 'search').length,
      }
    };
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatPrice = (price: number) => {
    return `KES ${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ActivityIcon className="w-8 h-8" />
            Activity Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your property browsing, searches, and interactions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Activity</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{stats.today}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Property Views</p>
                  <p className="text-2xl font-bold">{stats.byType.views}</p>
                </div>
                <Eye className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={filter} onValueChange={(value: string) => setFilter(value as typeof filter)}>
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="view">Views</TabsTrigger>
                <TabsTrigger value="favorite">Favorites</TabsTrigger>
                <TabsTrigger value="inquiry">Inquiries</TabsTrigger>
                <TabsTrigger value="search">Searches</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="listing">Listings</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm font-medium">Time Period:</span>
              {(['all', 'today', 'week', 'month'] as const).map((period) => (
                <Button
                  key={period}
                  variant={timeFilter === period ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeFilter(period)}
                  className="capitalize"
                >
                  {period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : period}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <ActivityIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No activity found</h3>
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No activity to show for the selected time period.' : `No ${filter} activity found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  const iconColor = getActivityColor(activity.type);

                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{activity.title}</h3>
                            <Badge variant={getActivityBadgeVariant(activity.type)} className="capitalize">
                              {activity.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {activity.description}
                        </p>

                        {activity.metadata && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {activity.metadata.propertyTitle && (
                              <span className="flex items-center gap-1">
                                <Home className="w-3 h-3" />
                                {activity.metadata.propertyTitle}
                              </span>
                            )}
                            {activity.metadata.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.metadata.location}
                              </span>
                            )}
                            {activity.metadata.price && (
                              <span className="font-medium text-primary">
                                {formatPrice(activity.metadata.price)}
                              </span>
                            )}
                            {activity.metadata.searchQuery && (
                              <span className="flex items-center gap-1">
                                <Search className="w-3 h-3" />
                                "{activity.metadata.searchQuery}"
                              </span>
                            )}
                            {activity.metadata.inquiryType && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {activity.metadata.inquiryType.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}