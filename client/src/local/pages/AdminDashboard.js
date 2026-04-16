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
exports.default = AdminDashboard;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
var badge_1 = require("../components/ui/badge");
var progress_1 = require("../components/ui/progress");
var use_toast_1 = require("../hooks/use-toast");
// Mock data
var mockStats = {
    totalUsers: 12847,
    activeUsers: 3421,
    totalProperties: 8934,
    verifiedProperties: 7123,
    pendingVerifications: 234,
    fraudAlerts: 12,
    systemUptime: 99.8,
    serverLoad: 67
};
var mockRecentActivity = [
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
var mockUsers = [
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
function AdminDashboard() {
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)('overview'), activeTab = _a[0], setActiveTab = _a[1];
    var stats = (0, react_1.useState)(mockStats)[0];
    var recentActivity = (0, react_1.useState)(mockRecentActivity)[0];
    var _b = (0, react_1.useState)(mockUsers), users = _b[0], setUsers = _b[1];
    var handleUserAction = (0, react_1.useCallback)(function (userId, action) {
        setUsers(function (prev) { return prev.map(function (user) {
            if (user.id === userId) {
                switch (action) {
                    case 'suspend':
                        return __assign(__assign({}, user), { status: 'suspended' });
                    case 'activate':
                        return __assign(__assign({}, user), { status: 'active' });
                    case 'delete':
                        return user; // In real app, would remove from array
                }
            }
            return user;
        }); });
        toast({
            title: 'User action completed',
            description: "User has been ".concat(action, "d successfully."),
        });
    }, [toast]);
    var getStatusColor = function (status) {
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
    var getRoleColor = function (role) {
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
    var getSeverityColor = function (severity) {
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
    var getActivityIcon = function (type) {
        switch (type) {
            case 'user_registration':
                return <lucide_react_1.Users className="w-4 h-4"/>;
            case 'property_listing':
                return <lucide_react_1.Home className="w-4 h-4"/>;
            case 'verification':
                return <lucide_react_1.CheckCircle className="w-4 h-4"/>;
            case 'fraud_alert':
                return <lucide_react_1.AlertTriangle className="w-4 h-4"/>;
            case 'system_event':
                return <lucide_react_1.Settings className="w-4 h-4"/>;
            default:
                return <lucide_react_1.Activity className="w-4 h-4"/>;
        }
    };
    var formatTimeAgo = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / (1000 * 60));
        var hours = Math.floor(diff / (1000 * 60 * 60));
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (minutes < 60)
            return "".concat(minutes, "m ago");
        if (hours < 24)
            return "".concat(hours, "h ago");
        return "".concat(days, "d ago");
    };
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Shield className="w-8 h-8 text-red-500"/>
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Administrative tools for system management and oversight
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <button_1.Button variant={activeTab === 'overview' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('overview'); }}>
            Overview
          </button_1.Button>
          <button_1.Button variant={activeTab === 'users' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('users'); }}>
            Users
          </button_1.Button>
          <button_1.Button variant={activeTab === 'properties' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('properties'); }}>
            Properties
          </button_1.Button>
          <button_1.Button variant={activeTab === 'system' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('system'); }}>
            System
          </button_1.Button>
        </div>

        {activeTab === 'overview' && (<div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <card_1.Card>
                <card_1.CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <lucide_react_1.Users className="w-6 h-6 text-blue-600"/>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                      <div className="text-xs text-green-600">
                        {stats.activeUsers.toLocaleString()} active
                      </div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <lucide_react_1.Home className="w-6 h-6 text-green-600"/>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.totalProperties.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Properties</div>
                      <div className="text-xs text-green-600">
                        {stats.verifiedProperties.toLocaleString()} verified
                      </div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <lucide_react_1.Clock className="w-6 h-6 text-yellow-600"/>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
                      <div className="text-sm text-muted-foreground">Pending Verifications</div>
                      <div className="text-xs text-yellow-600">Requires attention</div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <lucide_react_1.AlertTriangle className="w-6 h-6 text-red-600"/>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.fraudAlerts}</div>
                      <div className="text-sm text-muted-foreground">Active Fraud Alerts</div>
                      <div className="text-xs text-red-600">High priority</div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="flex items-center gap-2">
                    <lucide_react_1.Activity className="w-5 h-5"/>
                    System Health
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">System Uptime</span>
                      <span className="text-sm text-green-600">{stats.systemUptime}%</span>
                    </div>
                    <progress_1.Progress value={stats.systemUptime} className="h-2"/>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Server Load</span>
                      <span className={"text-sm ".concat(stats.serverLoad > 80 ? 'text-red-600' : stats.serverLoad > 60 ? 'text-yellow-600' : 'text-green-600')}>
                        {stats.serverLoad}%
                      </span>
                    </div>
                    <progress_1.Progress value={stats.serverLoad} className="h-2"/>
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
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="flex items-center gap-2">
                    <lucide_react_1.BarChart3 className="w-5 h-5"/>
                    Quick Stats
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
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
                </card_1.CardContent>
              </card_1.Card>
            </div>

            {/* Recent Activity */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Activity className="w-5 h-5"/>
                  Recent Activity
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  {recentActivity.map(function (activity) { return (<div key={activity.id} className="flex items-start gap-4 p-3 border rounded-lg">
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
                          <badge_1.Badge className={getSeverityColor(activity.severity)}>
                            {activity.severity}
                          </badge_1.Badge>
                        </div>
                      </div>
                    </div>); })}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>)}

        {activeTab === 'users' && (<div className="space-y-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>User Management</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  {users.map(function (user) { return (<div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <lucide_react_1.Users className="w-5 h-5 text-primary"/>
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <badge_1.Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </badge_1.Badge>
                            <badge_1.Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </badge_1.Badge>
                            <span className="text-xs text-muted-foreground">
                              Trust: {user.trustScore}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button_1.Button size="sm" variant="outline">
                          <lucide_react_1.Eye className="w-4 h-4"/>
                        </button_1.Button>
                        <button_1.Button size="sm" variant="outline">
                          <lucide_react_1.Edit className="w-4 h-4"/>
                        </button_1.Button>
                        {user.status === 'active' ? (<button_1.Button size="sm" variant="destructive" onClick={function () { return handleUserAction(user.id, 'suspend'); }}>
                            Suspend
                          </button_1.Button>) : (<button_1.Button size="sm" variant="default" onClick={function () { return handleUserAction(user.id, 'activate'); }}>
                            Activate
                          </button_1.Button>)}
                      </div>
                    </div>); })}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>)}

        {activeTab === 'properties' && (<div className="space-y-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Property Management</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="text-center py-12">
                  <lucide_react_1.Home className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                  <h3 className="font-semibold mb-2">Property Management</h3>
                  <p className="text-muted-foreground">
                    Property management features will be available here.
                  </p>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>)}

        {activeTab === 'system' && (<div className="space-y-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>System Configuration</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button_1.Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <lucide_react_1.Database className="w-5 h-5"/>
                      <div className="text-left">
                        <div className="font-medium">Database Management</div>
                        <div className="text-sm text-muted-foreground">Manage database connections and backups</div>
                      </div>
                    </div>
                  </button_1.Button>

                  <button_1.Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <lucide_react_1.Settings className="w-5 h-5"/>
                      <div className="text-left">
                        <div className="font-medium">System Settings</div>
                        <div className="text-sm text-muted-foreground">Configure system parameters</div>
                      </div>
                    </div>
                  </button_1.Button>

                  <button_1.Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <lucide_react_1.FileText className="w-5 h-5"/>
                      <div className="text-left">
                        <div className="font-medium">Audit Logs</div>
                        <div className="text-sm text-muted-foreground">View system audit trails</div>
                      </div>
                    </div>
                  </button_1.Button>

                  <button_1.Button variant="outline" className="justify-start h-auto p-4">
                    <div className="flex items-center gap-3">
                      <lucide_react_1.Download className="w-5 h-5"/>
                      <div className="text-left">
                        <div className="font-medium">Export Data</div>
                        <div className="text-sm text-muted-foreground">Export system data and reports</div>
                      </div>
                    </div>
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>)}
      </div>
    </div>);
}
