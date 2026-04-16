"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LandVerificationDashboard;
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var tabs_1 = require("../../local/components/ui/tabs");
var utils_1 = require("../../local/lib/utils");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
function LandVerificationDashboard(_a) {
    var sessions = _a.sessions, onSessionSelect = _a.onSessionSelect, onNewVerification = _a.onNewVerification, _b = _a.loading, loading = _b === void 0 ? false : _b;
    var _c = (0, react_1.useState)('overview'), selectedTab = _c[0], setSelectedTab = _c[1];
    var _d = (0, react_1.useState)({
        totalSessions: 0,
        completedSessions: 0,
        highRiskProperties: 0,
        averageCompletionTime: 0
    }), stats = _d[0], setStats = _d[1];
    (0, react_1.useEffect)(function () {
        // Calculate dashboard statistics
        var totalSessions = sessions.length;
        var completedSessions = sessions.filter(function (s) { return s.status === 'completed'; }).length;
        var highRiskProperties = sessions.filter(function (s) { return s.overallRiskLevel === 'high' || s.overallRiskLevel === 'critical'; }).length;
        var averageCompletionTime = sessions.reduce(function (acc, s) { return acc + (s.estimatedTimeRemaining || 0); }, 0) / totalSessions || 0;
        setStats({
            totalSessions: totalSessions,
            completedSessions: completedSessions,
            highRiskProperties: highRiskProperties,
            averageCompletionTime: averageCompletionTime
        });
    }, [sessions]);
    var getStatusColor = function (status) {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'suspended': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'failed': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };
    var getRiskColor = function (risk) {
        switch (risk) {
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
        }
    };
    var StatCard = function (_a) {
        var title = _a.title, value = _a.value, Icon = _a.icon, trend = _a.trend;
        return (<card_1.Card>
      <card_1.CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (<p className="text-xs text-muted-foreground mt-1">{trend}</p>)}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground"/>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
    };
    var SessionCard = function (_a) {
        var _b, _c;
        var session = _a.session;
        return (<card_1.Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={function () { return onSessionSelect(session.id); }}>
      <card_1.CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <card_1.CardTitle className="text-lg">{((_b = session.property) === null || _b === void 0 ? void 0 : _b.title) || "Property ".concat(session.propertyId)}</card_1.CardTitle>
          <badge_1.Badge className={(0, utils_1.cn)('text-xs', getStatusColor(session.status))}>
            {session.status.replace('_', ' ').toUpperCase()}
          </badge_1.Badge>
        </div>
        <card_1.CardDescription className="flex items-center gap-2">
          <lucide_react_1.MapPin className="h-4 w-4"/>
          {((_c = session.property) === null || _c === void 0 ? void 0 : _c.location) || 'Location not specified'}
        </card_1.CardDescription>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{session.completionPercentage}%</span>
          </div>
          <progress_1.Progress value={session.completionPercentage} className="h-2"/>
          
          <div className="flex items-center justify-between">
            <badge_1.Badge className={(0, utils_1.cn)('text-xs', getRiskColor(session.overallRiskLevel))}>
              {session.overallRiskLevel.toUpperCase()} RISK
            </badge_1.Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <lucide_react_1.Clock className="h-4 w-4"/>
              {session.estimatedTimeRemaining ? "".concat(session.estimatedTimeRemaining, "h remaining") : 'Time TBD'}
            </div>
          </div>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
    };
    if (loading) {
        return (<div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {__spreadArray([], Array(4), true).map(function (_, i) { return (<card_1.Card key={i}>
              <card_1.CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </card_1.CardContent>
            </card_1.Card>); })}
        </div>
      </div>);
    }
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Land Verification Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage property verification sessions across Kenya
          </p>
        </div>
        <button_1.Button onClick={onNewVerification} className="flex items-center gap-2">
          <lucide_react_1.Shield className="h-4 w-4"/>
          New Verification
        </button_1.Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Verifications" value={stats.totalSessions} icon={lucide_react_1.FileText} trend={"".concat(stats.completedSessions, " completed")}/>
        <StatCard title="Completion Rate" value={"".concat(stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0, "%")} icon={lucide_react_1.CheckCircle}/>
        <StatCard title="High Risk Properties" value={stats.highRiskProperties} icon={lucide_react_1.AlertTriangle} trend={stats.highRiskProperties > 0 ? "Requires attention" : "All clear"}/>
        <StatCard title="Avg. Completion Time" value={"".concat(Math.round(stats.averageCompletionTime), "h")} icon={lucide_react_1.TrendingUp}/>
      </div>

      {/* Main Content Tabs */}
      <tabs_1.Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <tabs_1.TabsList className="grid w-full grid-cols-3">
          <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="active">Active Sessions</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="completed">Completed</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="overview" className="space-y-4">
          {sessions.length === 0 ? (<card_1.Card>
              <card_1.CardContent className="p-8 text-center">
                <lucide_react_1.Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                <h3 className="text-lg font-semibold mb-2">No Verification Sessions</h3>
                <p className="text-muted-foreground mb-4">
                  Start your first land verification to secure property transactions
                </p>
                <button_1.Button onClick={onNewVerification}>
                  Start Verification
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.slice(0, 6).map(function (session) { return (<SessionCard key={session.id} session={session}/>); })}
            </div>)}
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions
            .filter(function (s) { return s.status === 'in_progress' || s.status === 'not_started'; })
            .map(function (session) { return (<SessionCard key={session.id} session={session}/>); })}
          </div>
          {sessions.filter(function (s) { return s.status === 'in_progress' || s.status === 'not_started'; }).length === 0 && (<card_1.Card>
              <card_1.CardContent className="p-8 text-center">
                <lucide_react_1.Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                <h3 className="text-lg font-semibold mb-2">No Active Sessions</h3>
                <p className="text-muted-foreground">All verification sessions are completed</p>
              </card_1.CardContent>
            </card_1.Card>)}
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions
            .filter(function (s) { return s.status === 'completed'; })
            .map(function (session) { return (<SessionCard key={session.id} session={session}/>); })}
          </div>
          {sessions.filter(function (s) { return s.status === 'completed'; }).length === 0 && (<card_1.Card>
              <card_1.CardContent className="p-8 text-center">
                <lucide_react_1.CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                <h3 className="text-lg font-semibold mb-2">No Completed Sessions</h3>
                <p className="text-muted-foreground">Completed verifications will appear here</p>
              </card_1.CardContent>
            </card_1.Card>)}
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
}
