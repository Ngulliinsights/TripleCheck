import React, { useState, useCallback } from 'react'
import { 
  Shield, 
  Users, 
  Home, 
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Settings,
  Database,
  Activity,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { useToast } from '../hooks/use-toast'

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalProperties: number;
  verifiedProperties: number;
  pendingVerifications: number;
  fraudAlerts: number;
  systemUptime: number;
  serverLoad: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'property_listing' | 'verification' | 'fraud_alert' | 'system_event';
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  user?: string;
}

interface UserManagement {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'agent' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'pending';
  joinDate: Date;
  lastActive: Date;
  trustScore: number;
  propertiesListed: number;
}

// Mock data
const mockStats: SystemStats = {
  totalUsers: 12847,
  activeUsers: 3421,
  totalProperties: 8934,
  verifiedProperties: 7123,
  pendingVerifications: 234,
  fraudAlerts: 12,
  systemUptime: 99.8,
  serverLoad: 67
};

const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'fraud_alert',
    description: 'Suspicious property listing detected in Westlands area',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    severity: 'high',
    user: 'System'
  },
  {
    id: '2',
    type: 'user_registration',
    description: 'New user registration: john.doe@email.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    severity: 'low',
    user: 'john.doe@email.com'
  },
  {
    id: '3',
    type: 'verification',
    description: 'Property verification completed for Karen Villa',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    severity: 'medium',
    user: 'Verification Team'
  },
  {
    id: '4',
    type: 'property_listing',
    description: 'New property listed: Modern Apartment in Kilimani',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    severity: 'low',
    user: 'sarah.wanjiku@email.com'
  }
];

const mockUsers: UserManagement[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    role: 'user',
    status: 'active',
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
    trustScore: 87,
    propertiesListed: 3
  },
  {
    id: '2',
    name: 'Sarah Wanjiku',
    email: 'sarah.wanjiku@email.com',
    role: 'agent',
    status: 'active',
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
    lastActive: new Date(Date.now() - 1000 * 60 * 30),
    trustScore: 94,
    propertiesListed: 15
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@email.com',
    role: 'user',
    status: 'suspended',
    joinDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    trustScore: 23,
    propertiesListed: 1
  }
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'properties' | 'system'>('overview');
  const [stats] = useState<SystemStats>(mockStats);
  const [recentActivity] = useState<RecentActivity[]>(mockRecentActivity);
  const [users, setUsers] = useState<UserManagement[]>(mockUsers);

  const handleUserAction = useCallback((userId: string, action: 'suspend' | 'activate' | 'delete') => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        switch (action) {
          case 'suspend':
            return { ...user, status: 'suspended' as const };
          case 'activate':
            return { ...user, status: 'active' as const };
          case 'delete':
            return user; // In real app, would remove from array
        }
      }
      return user;
    }));

    toast({
      title: 'User action completed',
      description: `User has been ${action}d successfully.`,
    });
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'agent':
        return 'bg-orange-100 text-orange-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Users className="w-4 h-4" />;
      case 'property_listing':
        return <Home className="w-4 h-4" />;
      case 'verification':
        return <CheckCircle className="w-4 h-4" />;
      case 'fraud_alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'system_event':
        return <Settings className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Administrative tools for system management and oversight
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
          >
            Users
          </Button>
          <Button
            variant={activeTab === 'properties' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('properties')}
          >
            Properties
          </Button>
          <Button
            variant={activeTab === 'system' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('system')}
          >
            System
          </Button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                      <div className="text-xs text-green-600">
                        {stats.activeUsers.toLocaleString()} active
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <Home className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.totalProperties.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Properties</div>
                      <div className="text-xs text-green-600">
                        {stats.verifiedProperties.toLocaleString()} verified
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
                      <div className="text-sm text-muted-foreground">Pending Verifications</div>
                      <div className="text-xs text-yellow-600">Requires attention</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.fraudAlerts}</div>
                      <div className="text-sm text-muted-foreground">Active Fraud Alerts</div>
                      <div className="text-xs text-red-600">High priority</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">System Uptime</span>
                      <span className="text-sm text-green-600">{stats.systemUptime}%</span>
                    </div>
                    <Progress value={stats.systemUptime} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Server Load</span>
                      <span className={`text-sm ${stats.serverLoad > 80 ? 'text-red-600' : stats.serverLoad > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {stats.serverLoad}%
                      </span>
                    </div>
                    <Progress value={stats.serverLoad} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">99.9%</div>
                      <div className="text-xs text-green-700">API Uptime</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">1.2s</div>
                      <div className="text-xs text-blue-700">Avg Response</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold">89%</div>
                      <div className="text-xs text-muted-foreground">Verification Rate</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold">4.8</div>
                      <div className="text-xs text-muted-foreground">Avg Trust Score</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold">156</div>
                      <div className="text-xs text-muted-foreground">Daily Signups</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold">2.3k</div>
                      <div className="text-xs text-muted-foreground">Daily Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-3 border rounded-lg">
                      <div className="p-2 bg-muted rounded-full">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.user} • {formatTimeAgo(activity.timestamp)}
                            </p>
                          </div>
                          <Badge className={getSeverityColor(activity.severity)}>
                            {activity.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Trust: {user.trustScore}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.status === 'active' ? (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleUserAction(user.id, 'suspend')}
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleUserAction(user.id, 'activate')}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'properties' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Property Management</h3>
                  <p className="text-muted-foreground">
                    Property management features will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Database Management</div>
                        <div className="text-sm text-muted-foreground">Manage database connections and backups</div>
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">System Settings</div>
                        <div className="text-sm text-muted-foreground">Configure system parameters</div>
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Audit Logs</div>
                        <div className="text-sm text-muted-foreground">View system audit trails</div>
                      </div>
                    </div>
                  </Button>

                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Export Data</div>
                        <div className="text-sm text-muted-foreground">Export system data and reports</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}