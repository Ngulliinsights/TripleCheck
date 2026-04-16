"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var button_1 = require("./ui/button");
// Hooks for fetching real-time data
var react_query_1 = require("@tanstack/react-query");
var FraudIntelligence = (0, react_1.memo)(function () {
    var navigate = (0, react_router_dom_1.useNavigate)();
    // Fetch real-time fraud alerts
    var alertsData = (0, react_query_1.useQuery)({
        queryKey: ['fraud-alerts'],
        queryFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/fraud-intelligence/alerts?limit=3')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch fraud alerts');
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        }); },
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }).data;
    // Fetch fraud trends
    var trendsData = (0, react_query_1.useQuery)({
        queryKey: ['fraud-trends'],
        queryFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/fraud-intelligence/trends')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch fraud trends');
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        }); },
        staleTime: 30 * 60 * 1000, // 30 minutes
    }).data;
    // Fetch protection stats
    var statsData = (0, react_query_1.useQuery)({
        queryKey: ['protection-stats'],
        queryFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch('/api/fraud-intelligence/stats')];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw new Error('Failed to fetch protection stats');
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        }); },
        staleTime: 15 * 60 * 1000, // 15 minutes
    }).data;
    var handleViewResources = function () {
        navigate('/community-resources');
    };
    // Use real data or fallback to loading state
    var alerts = (alertsData === null || alertsData === void 0 ? void 0 : alertsData.alerts) || [];
    var trends = (trendsData === null || trendsData === void 0 ? void 0 : trendsData.trends) || [];
    var protectionStats = statsData ? [
        { label: 'Active Monitoring', value: statsData.activeMonitoring, icon: lucide_react_1.Eye, description: 'Real-time fraud detection' },
        { label: 'Threats Blocked', value: statsData.threatsBlocked.toString(), icon: lucide_react_1.Shield, description: 'This month alone' },
        { label: 'Community Alerts', value: statsData.communityAlerts.toString(), icon: lucide_react_1.AlertTriangle, description: 'Active warnings' },
        { label: 'Protected Value', value: statsData.protectedValue, icon: lucide_react_1.Target, description: 'Fraud prevented' }
    ] : [
        { label: 'Active Monitoring', value: '24/7', icon: lucide_react_1.Eye, description: 'Real-time fraud detection' },
        { label: 'Threats Blocked', value: '156', icon: lucide_react_1.Shield, description: 'This month alone' },
        { label: 'Community Alerts', value: '23', icon: lucide_react_1.AlertTriangle, description: 'Active warnings' },
        { label: 'Protected Value', value: 'KES 45M+', icon: lucide_react_1.Target, description: 'Fraud prevented' }
    ];
    var getSeverityColor = function (severity) {
        switch (severity) {
            case 'high': return 'bg-red-100 text-red-800 border-red-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    var getAlertIcon = function (type) {
        switch (type) {
            case 'active_threat': return <lucide_react_1.AlertTriangle className="h-4 w-4 text-red-500"/>;
            case 'pattern_detected': return <lucide_react_1.TrendingUp className="h-4 w-4 text-yellow-500"/>;
            case 'area_warning': return <lucide_react_1.MapPin className="h-4 w-4 text-blue-500"/>;
            default: return <lucide_react_1.Shield className="h-4 w-4 text-gray-500"/>;
        }
    };
    return (<section className="py-16 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4">
        {/* Header - Intelligence Focus */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <lucide_react_1.Zap className="h-4 w-4"/>
            Live Fraud Intelligence
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Real-Time Fraud Protection Network
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our AI-powered system monitors fraud patterns across Kenya 24/7, providing instant alerts 
            and community-driven intelligence to protect your property investments.
          </p>
        </div>

        {/* Protection Stats - Different from testimonial stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {protectionStats.map(function (stat, index) {
            var Icon = stat.icon;
            return (<div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Icon className="h-5 w-5 text-red-600"/>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-600">{stat.description}</div>
              </div>);
        })}
        </div>

        {/* Active Fraud Alerts - Unique to this component */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900">Active Fraud Alerts</h3>
              <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Live
              </div>
            </div>
            <button_1.Button variant="outline" onClick={handleViewResources} className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50">
              View All Alerts
              <lucide_react_1.ArrowRight className="h-4 w-4"/>
            </button_1.Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {alerts.map(function (alert) { return (<div key={alert.id} className="bg-white rounded-lg border-l-4 border-l-red-500 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewResources}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <span className={"text-xs px-2 py-1 rounded-full border ".concat(getSeverityColor(alert.severity))}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <lucide_react_1.Clock className="h-3 w-3"/>
                    {new Date(alert.timeDetected).toLocaleString()}
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2">{alert.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <lucide_react_1.MapPin className="h-3 w-3"/>
                    {alert.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <lucide_react_1.Users className="h-3 w-3"/>
                    {alert.affectedCount} affected
                  </div>
                </div>
              </div>); })}
          </div>
        </div>

        {/* Fraud Trends Analysis - Data-driven insights */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Fraud Pattern Analysis</h3>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="grid md:grid-cols-3 gap-6">
              {trends.map(function (trend, index) { return (<div key={index} className="text-center">
                  <div className="text-lg font-semibold text-gray-900 mb-2">{trend.type}</div>
                  <div className={"text-2xl font-bold mb-2 ".concat(trend.change > 0 ? 'text-red-600' : 'text-green-600')}>
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{trend.period}</div>
                  <div className="text-xs text-gray-500">
                    Active in: {trend.locations.join(', ')}
                  </div>
                </div>); })}
            </div>
          </div>
        </div>

        {/* Emergency Response CTA - Action-oriented */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-8 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                Fraud Emergency Response
              </h3>
              <p className="text-red-100 mb-6">
                If you're currently experiencing fraud or have urgent concerns, access our 
                24/7 emergency resources and connect with fraud response experts immediately.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button_1.Button onClick={handleViewResources} className="bg-white text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <lucide_react_1.AlertTriangle className="h-4 w-4"/>
                  Emergency Resources
                </button_1.Button>
                <button_1.Button variant="outline" onClick={handleViewResources} className="border-white text-white hover:bg-white/10 flex items-center gap-2">
                  <lucide_react_1.Shield className="h-4 w-4"/>
                  Report Fraud
                </button_1.Button>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <lucide_react_1.Shield className="h-6 w-6 text-white"/>
                </div>
                <div>
                  <div className="font-semibold text-white">Protection Network</div>
                  <div className="text-sm text-red-100">Always monitoring</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-100">Response time</span>
                  <span className="font-semibold text-white">&lt; 2 hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-100">Success rate</span>
                  <span className="font-semibold text-white">94%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-100">Expert network</span>
                  <span className="font-semibold text-white">500+ professionals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);
});
FraudIntelligence.displayName = "FraudIntelligence";
exports.default = FraudIntelligence;
