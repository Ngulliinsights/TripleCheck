import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Home, 
  Shield, 
  MessageSquare,
  Eye,
  DollarSign
} from 'lucide-react'
import React from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

import { Badge } from '../../local/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card'

interface AnalyticsData {
  totalUsers: number;
  totalProperties: number;
  totalVerifications: number;
  totalMessages: number;
  userGrowth: number;
  propertyGrowth: number;
  verificationRate: number;
  responseRate: number;
  monthlyData: Array<{
    month: string;
    users: number;
    properties: number;
    verifications: number;
  }>;
  propertyTypes: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  trustScoreDistribution: Array<{
    range: string;
    count: number;
  }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  isLoading?: boolean;
}

export function AnalyticsDashboard({ data, isLoading = false }: AnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend 
  }: {
    title: string;
    value: string | number;
    change: number;
    icon: React.ElementType;
    trend: 'up' | 'down';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(change)}%
          </span>
          <span className="ml-1">from last month</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={data.totalUsers.toLocaleString()}
          change={data.userGrowth}
          icon={Users}
          trend={data.userGrowth >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Total Properties"
          value={data.totalProperties.toLocaleString()}
          change={data.propertyGrowth}
          icon={Home}
          trend={data.propertyGrowth >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Verifications"
          value={data.totalVerifications.toLocaleString()}
          change={data.verificationRate}
          icon={Shield}
          trend={data.verificationRate >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Messages"
          value={data.totalMessages.toLocaleString()}
          change={data.responseRate}
          icon={MessageSquare}
          trend={data.responseRate >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Users"
                />
                <Line 
                  type="monotone" 
                  dataKey="properties" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Properties"
                />
                <Line 
                  type="monotone" 
                  dataKey="verifications" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Verifications"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Property Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Property Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.propertyTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.propertyTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trust Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Trust Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.trustScoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}