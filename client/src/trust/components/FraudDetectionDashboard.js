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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.FraudDetectionDashboard = FraudDetectionDashboard;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var progress_1 = require("../../local/components/ui/progress");
var select_1 = require("../../local/components/ui/select");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
var useFraudDetection_1 = require("../hooks/useFraudDetection");
var FraudAlertsList_1 = require("./FraudAlertsList");
var MLAnalyticsDisplay_1 = require("./MLAnalyticsDisplay");
var NetworkAnalysisVisualization_1 = require("./NetworkAnalysisVisualization");
var FRAUD_CATEGORIES = [
    { id: 'property_flipping', name: 'Property Flipping', color: 'bg-red-100 text-red-800' },
    { id: 'mortgage_fraud', name: 'Mortgage Fraud', color: 'bg-orange-100 text-orange-800' },
    { id: 'title_fraud', name: 'Title Fraud', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'money_laundering', name: 'Money Laundering', color: 'bg-purple-100 text-purple-800' },
    { id: 'synthetic_identity', name: 'Synthetic Identity', color: 'bg-blue-100 text-blue-800' },
    { id: 'document_forgery', name: 'Document Forgery', color: 'bg-green-100 text-green-800' }
];
var SEVERITY_CONFIG = {
    critical: { color: 'text-red-600', bgColor: 'bg-red-50', icon: lucide_react_1.AlertTriangle },
    high: { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: lucide_react_1.TrendingUp },
    medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: lucide_react_1.Eye },
    low: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: lucide_react_1.Shield }
};
function FraudDetectionDashboard(_a) {
    var _this = this;
    var _b;
    var userId = _a.userId, _c = _a.showControls, showControls = _c === void 0 ? true : _c;
    var toast = (0, use_toast_1.useToast)().toast;
    var _d = (0, react_1.useState)('overview'), selectedTab = _d[0], setSelectedTab = _d[1];
    var _e = (0, react_1.useState)('7d'), timeRange = _e[0], setTimeRange = _e[1];
    var _f = (0, react_1.useState)('all'), severityFilter = _f[0], setSeverityFilter = _f[1];
    var _g = (0, react_1.useState)('all'), categoryFilter = _g[0], setCategoryFilter = _g[1];
    var _h = (0, react_1.useState)(''), searchQuery = _h[0], setSearchQuery = _h[1];
    var _j = (0, react_1.useState)(true), isRealTimeEnabled = _j[0], setIsRealTimeEnabled = _j[1];
    var _k = (0, useFraudDetection_1.useFraudDetection)(), useFraudDashboard = _k.useFraudDashboard, useFraudAlerts = _k.useFraudAlerts, useSystemStatus = _k.useSystemStatus, processTransaction = _k.processTransaction, isProcessing = _k.isProcessing;
    var _l = useFraudDashboard(userId, { timeRange: timeRange }), dashboardData = _l.data, dashboardLoading = _l.isLoading, refetchDashboard = _l.refetch;
    var alertsQuery = useFraudAlerts(__assign(__assign(__assign(__assign({}, (severityFilter !== 'all' && { severity: severityFilter })), (categoryFilter !== 'all' && { category: categoryFilter })), (searchQuery && { search: searchQuery })), { limit: 50 }));
    var alerts = alertsQuery.data, alertsLoading = alertsQuery.isLoading;
    var _m = useSystemStatus(), systemStatus = _m.data, statusLoading = _m.isLoading;
    // Real-time updates
    (0, react_1.useEffect)(function () {
        if (!isRealTimeEnabled)
            return;
        var interval = setInterval(function () {
            refetchDashboard();
        }, 30000); // Refresh every 30 seconds
        return function () { return clearInterval(interval); };
    }, [isRealTimeEnabled, refetchDashboard]);
    var handleExportReport = function () {
        toast({
            title: "Export Started",
            description: "Fraud detection report is being generated.",
        });
    };
    var handleTestTransaction = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, processTransaction({
                            id: "test_".concat(Date.now()),
                            amount: 1000000,
                            propertyId: 'test-property',
                            userId: userId || 'test-user',
                            paymentMethod: 'cash',
                            timestamp: new Date().toISOString()
                        })];
                case 1:
                    _a.sent();
                    toast({
                        title: "Test Transaction Processed",
                        description: "Test transaction has been analyzed for fraud patterns.",
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    toast({
                        title: "Test Failed",
                        description: error_1 instanceof Error ? error_1.message : "Failed to process test transaction",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    if (dashboardLoading || statusLoading) {
        return (<div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {__spreadArray([], Array(4), true).map(function (_, i) { return (<card_1.Card key={i}>
              <card_1.CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Fraud Detection</h1>
          <p className="text-gray-600">
            Real-time fraud monitoring and analysis system
          </p>
        </div>
        
        {showControls && (<div className="flex items-center space-x-2">
            <button_1.Button variant="outline" size="sm" onClick={function () { return setIsRealTimeEnabled(!isRealTimeEnabled); }}>
              {isRealTimeEnabled ? (<>
                  <lucide_react_1.Zap className="h-4 w-4 mr-1 text-green-500"/>
                  Live
                </>) : (<>
                  <lucide_react_1.Clock className="h-4 w-4 mr-1"/>
                  Paused
                </>)}
            </button_1.Button>
            <button_1.Button variant="outline" size="sm" onClick={handleTestTransaction} disabled={isProcessing}>
              {isProcessing ? (<>
                  <lucide_react_1.RefreshCw className="h-4 w-4 mr-1 animate-spin"/>
                  Processing...
                </>) : ('Test Transaction')}
            </button_1.Button>
            <button_1.Button variant="outline" size="sm" onClick={handleExportReport}>
              <lucide_react_1.Download className="h-4 w-4 mr-1"/>
              Export Report
            </button_1.Button>
          </div>)}
      </div>

      {/* System Status Alert */}
      {systemStatus && systemStatus.status !== 'operational' && (<alert_1.Alert variant="destructive">
          <lucide_react_1.AlertTriangle className="h-4 w-4"/>
          <alert_1.AlertTitle>System Status: {systemStatus.status}</alert_1.AlertTitle>
          <alert_1.AlertDescription>
            Fraud detection system is experiencing issues. Some features may be limited.
          </alert_1.AlertDescription>
        </alert_1.Alert>)}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.totalAlerts) || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {(dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.alertsChange) > 0 ? '+' : ''}{(dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.alertsChange) || 0}% from last period
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <lucide_react_1.AlertTriangle className="h-6 w-6 text-red-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.criticalAlerts) || 0}
                </p>
                <p className="text-xs text-gray-500">
                  Require immediate attention
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <lucide_react_1.Shield className="h-6 w-6 text-orange-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.transactionsAnalyzed) || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {(dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.analysisRate) || 0}% fraud detection rate
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <lucide_react_1.Brain className="h-6 w-6 text-blue-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Losses Prevented</p>
                <p className="text-2xl font-bold text-gray-900">
                  KSh {((dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.lossesPrevented) || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Estimated savings this period
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <lucide_react_1.DollarSign className="h-6 w-6 text-green-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Filters */}
      <card_1.Card>
        <card_1.CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <input_1.Input placeholder="Search alerts, transactions, or patterns..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="pl-10"/>
              </div>
            </div>
            
            <select_1.Select value={timeRange} onValueChange={setTimeRange}>
              <select_1.SelectTrigger className="w-32">
                <select_1.SelectValue />
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="1d">Last 24h</select_1.SelectItem>
                <select_1.SelectItem value="7d">Last 7 days</select_1.SelectItem>
                <select_1.SelectItem value="30d">Last 30 days</select_1.SelectItem>
                <select_1.SelectItem value="90d">Last 90 days</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>

            <select_1.Select value={severityFilter} onValueChange={setSeverityFilter}>
              <select_1.SelectTrigger className="w-32">
                <select_1.SelectValue />
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">All Severity</select_1.SelectItem>
                <select_1.SelectItem value="critical">Critical</select_1.SelectItem>
                <select_1.SelectItem value="high">High</select_1.SelectItem>
                <select_1.SelectItem value="medium">Medium</select_1.SelectItem>
                <select_1.SelectItem value="low">Low</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>

            <select_1.Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <select_1.SelectTrigger className="w-40">
                <select_1.SelectValue />
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">All Categories</select_1.SelectItem>
                {FRAUD_CATEGORIES.map(function (category) { return (<select_1.SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </select_1.SelectItem>); })}
              </select_1.SelectContent>
            </select_1.Select>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Main Content Tabs */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Fraud Analysis Dashboard</card_1.CardTitle>
          <card_1.CardDescription>
            Comprehensive fraud detection and analysis tools
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <tabs_1.Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <tabs_1.TabsList className="grid w-full grid-cols-5">
              <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="alerts">
                Alerts
                {alerts && alerts.length > 0 && (<badge_1.Badge variant="destructive" className="ml-2 text-xs">
                    {alerts.length}
                  </badge_1.Badge>)}
              </tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="network">Network Analysis</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="ml">ML Analytics</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="reports">Reports</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="overview" className="space-y-6">
              {/* Fraud Categories Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">Fraud Categories</card_1.CardTitle>
                    <card_1.CardDescription>
                      Distribution of fraud types detected
                    </card_1.CardDescription>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="space-y-3">
                      {FRAUD_CATEGORIES.map(function (category) {
            var _a;
            var count = ((_a = dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.categoryBreakdown) === null || _a === void 0 ? void 0 : _a[category.id]) || 0;
            var percentage = (dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.totalAlerts) ?
                (count / dashboardData.totalAlerts) * 100 : 0;
            return (<div key={category.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <badge_1.Badge className={category.color}>
                                {category.name}
                              </badge_1.Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-20">
                                <progress_1.Progress value={percentage} className="h-2"/>
                              </div>
                              <span className="text-sm font-medium w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>);
        })}
                    </div>
                  </card_1.CardContent>
                </card_1.Card>

                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">Detection Trends</card_1.CardTitle>
                    <card_1.CardDescription>
                      Fraud detection patterns over time
                    </card_1.CardDescription>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Detection Rate</span>
                        <div className="flex items-center space-x-2">
                          <lucide_react_1.TrendingUp className="h-4 w-4 text-green-500"/>
                          <span className="text-sm font-medium">
                            {(dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.detectionRate) || 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">False Positive Rate</span>
                        <div className="flex items-center space-x-2">
                          <lucide_react_1.TrendingDown className="h-4 w-4 text-red-500"/>
                          <span className="text-sm font-medium">
                            {(dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.falsePositiveRate) || 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Response Time</span>
                        <span className="text-sm font-medium">
                          {(dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.avgResponseTime) || 0}ms
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">System Uptime</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">
                            {(systemStatus === null || systemStatus === void 0 ? void 0 : systemStatus.uptime) || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>
              </div>

              {/* Recent Activity */}
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Recent Activity</card_1.CardTitle>
                  <card_1.CardDescription>
                    Latest fraud detection events and system activities
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-3">
                    {((_b = dashboardData === null || dashboardData === void 0 ? void 0 : dashboardData.recentActivity) === null || _b === void 0 ? void 0 : _b.map(function (activity, index) {
            var _a, _b, _c;
            return (<div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={"p-2 rounded-full ".concat((_a = SEVERITY_CONFIG[activity.severity]) === null || _a === void 0 ? void 0 : _a.bgColor)}>
                          {react_1.default.createElement(((_b = SEVERITY_CONFIG[activity.severity]) === null || _b === void 0 ? void 0 : _b.icon) || lucide_react_1.AlertTriangle, {
                    className: "h-4 w-4 ".concat((_c = SEVERITY_CONFIG[activity.severity]) === null || _c === void 0 ? void 0 : _c.color)
                })}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <badge_1.Badge variant="outline" className="text-xs">
                          {activity.category}
                        </badge_1.Badge>
                      </div>);
        })) || (<div className="text-center py-8 text-gray-500">
                        <lucide_react_1.Shield className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                        <p>No recent fraud activity detected</p>
                        <p className="text-sm">System is monitoring transactions</p>
                      </div>)}
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="alerts">
              <FraudAlertsList_1.FraudAlertsList alerts={alerts} isLoading={alertsLoading} onAlertAction={function (action, alert) {
            toast({
                title: "Alert Action",
                description: "".concat(action, " action taken for alert ").concat(alert.id),
            });
        }}/>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="network">
              <NetworkAnalysisVisualization_1.NetworkAnalysisVisualization userId={userId} timeRange={timeRange}/>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="ml">
              <MLAnalyticsDisplay_1.MLAnalyticsDisplay userId={userId} timeRange={timeRange}/>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="reports">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Fraud Detection Reports</card_1.CardTitle>
                  <card_1.CardDescription>
                    Generate and download comprehensive fraud analysis reports
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-center py-8">
                    <lucide_react_1.FileText className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                    <p className="text-gray-500 mb-4">Report generation coming soon</p>
                    <button_1.Button variant="outline" onClick={handleExportReport}>
                      <lucide_react_1.Download className="h-4 w-4 mr-2"/>
                      Generate Report
                    </button_1.Button>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
exports.default = FraudDetectionDashboard;
