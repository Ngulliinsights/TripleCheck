// src/pages/Dashboard.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Bell, Settings, Home, Eye, Heart, MessageSquare, Shield, TrendingUp } from 'lucide-react';
import { formatDate } from '../../shared/utils/date-utils';

/* ---------- TYPES ---------- */
type MembershipTier = 'basic' | 'premium' | 'enterprise';

interface User {
  id: string;
  name: string;
  email: string;
  membershipTier: MembershipTier;
  trustScore: number;
  joinDate: string;
}

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  image?: string;
  status: 'verified' | 'pending' | 'draft';
}

interface ActivityItem {
  id: string;
  type: 'verification' | 'message' | 'save';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'info';
}

/* ---------- MOCK DATA ---------- */
const user: User = {
  id: 'usr-123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  membershipTier: 'premium',
  trustScore: 4.8,
  joinDate: '2024-01-15',
};

const properties: Property[] = [
  {
    id: 1,
    title: 'Modern 3-Bedroom Apartment',
    location: 'Westlands, Nairobi',
    price: 150_000,
    image: '/assets/apartment-luxury-1.jpg',
    status: 'verified',
  },
  {
    id: 2,
    title: 'Villa in Karen',
    location: 'Karen, Nairobi',
    price: 350_000,
    image: '/placeholder-2.jpg',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Office Space CBD',
    location: 'Nairobi CBD',
    price: 200_000,
    image: '/placeholder-3.jpg',
    status: 'draft',
  },
];

const recentActivity: ActivityItem[] = [
  {
    id: 'a1',
    type: 'verification',
    title: 'Property verified successfully',
    description: 'Modern Apartment in Westlands',
    time: '2h ago',
    status: 'success',
  },
  {
    id: 'a2',
    type: 'message',
    title: 'New message received',
    description: 'From Sarah Johnson about Karen House',
    time: '5h ago',
    status: 'info',
  },
  {
    id: 'a3',
    type: 'save',
    title: 'Property saved to favorites',
    description: 'Luxury Villa in Runda',
    time: '1d ago',
    status: 'info',
  },
];

const stats = [
  { title: 'Properties Verified', value: 23, icon: Shield, color: 'text-green-600', bg: 'bg-green-100' },
  { title: 'Saved Properties', value: 12, icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
  { title: 'Property Views', value: 156, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100' },
  { title: 'Messages', value: 8, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
];

/* ---------- SUB-COMPONENTS ---------- */
const StatCard: React.FC<typeof stats[0]> = ({ title, value, icon: Icon, color, bg }) => (
  <Card>
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

const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const navigate = useNavigate();
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <img
        src={property.image || '/placeholder.jpg'}
        alt={property.title}
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold">{property.title}</h3>
          <Badge variant={property.status === 'verified' ? 'default' : 'secondary'}>
            {property.status}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-2">{property.location}</p>
        <p className="text-lg font-bold text-blue-600 mb-3">KES {property.price.toLocaleString()}</p>
        <Button
          size="sm"
          className="w-full"
          onClick={() => navigate(`/property/${property.id}`)}
        >
          View Details
        </Button>
      </div>
    </div>
  );
};

const ActivityRow: React.FC<ActivityItem> = ({ type, title, description, time, status }) => {
  const iconMap = {
    verification: <Shield className="w-4 h-4 text-green-600" />,
    message: <MessageSquare className="w-4 h-4 text-blue-600" />,
    save: <Heart className="w-4 h-4 text-red-600" />,
  };
  const bgMap = {
    success: 'bg-green-100',
    info: 'bg-blue-100',
  };
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
      <div className={`p-2 rounded-full ${bgMap[status]}`}>{iconMap[type]}</div>
      <div className="flex-1">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
};

/* ---------- MAIN DASHBOARD ---------- */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'draft'>('all');

  const filtered = useMemo(
    () => {
      if (!properties || !Array.isArray(properties)) return [];
      
      return filter === 'all'
        ? properties
        : properties.filter((p) => p && p.status === filter);
    },
    [properties, filter]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
              <p className="text-gray-600">
                {user.membershipTier.charAt(0).toUpperCase() + user.membershipTier.slice(1)} Member since{' '}
                {formatDate(user.joinDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s) => (
            <StatCard key={s.title} {...s} />
          ))}
        </section>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((a) => (
                  <ActivityRow key={a.id} {...a} />
                ))}
                <Button variant="outline" className="w-full">
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
                  onClick={() => navigate('/services/list-property')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  List New Property
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/services/basic-checks')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Property
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Messages
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Properties</CardTitle>
                <div className="flex gap-2">
                  {(['all', 'verified', 'pending', 'draft'] as const).map((f) => (
                    <Button
                      key={f}
                      size="sm"
                      variant={filter === f ? 'default' : 'outline'}
                      onClick={() => setFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {filtered.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((p) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No properties found for this filter.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Advanced charts & insights coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}