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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SystemMonitoring;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
var badge_1 = require("../components/ui/badge");
var progress_1 = require("../components/ui/progress");
var use_toast_1 = require("../hooks/use-toast");
// Mock data
var mockMetrics = [
    {
        id: 'cpu',
        name: 'CPU Usage',
        value: 67,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        lastUpdated: new Date(),
        threshold: { warning: 70, critical: 85 }
    },
    {
        id: 'memory',
        name: 'Memory Usage',
        value: 78,
        unit: '%',
        status: 'warning',
        trend: 'up',
        lastUpdated: new Date(),
        threshold: { warning: 75, critical: 90 }
    },
    {
        id: 'disk',
        name: 'Disk Usage',
        value: 45,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        lastUpdated: new Date(),
        threshold: { warning: 80, critical: 95 }
    },
    {
        id: 'network',
        name: 'Network I/O',
        value: 234,
        unit: 'MB/s',
        status: 'healthy',
        trend: 'down',
        lastUpdated: new Date(),
        threshold: { warning: 500, critical: 800 }
    }
];
var mockServices = [
    {
        id: 'api',
        name: 'API Server',
        status: 'online',
        uptime: 99.8,
        responseTime: 145,
        lastCheck: new Date(Date.now() - 1000 * 30),
        endpoint: '/api/health'
    },
    {
        id: 'database',
        name: 'Database',
        status: 'online',
        uptime: 99.9,
        responseTime: 23,
        lastCheck: new Date(Date.now() - 1000 * 45),
        endpoint: '/db/health'
    },
    {
        id: 'redis',
        name: 'Redis Cache',
        status: 'online',
        uptime: 99.7,
        responseTime: 8,
        lastCheck: new Date(Date.now() - 1000 * 20),
        endpoint: '/cache/health'
    },
    {
        id: 'storage',
        name: 'File Storage',
        status: 'degraded',
        uptime: 98.2,
        responseTime: 567,
        lastCheck: new Date(Date.now() - 1000 * 60),
        endpoint: '/storage/health'
    },
    {
        id: 'email',
        name: 'Email Service',
        status: 'online',
        uptime: 99.5,
        responseTime: 234,
        lastCheck: new Date(Date.now() - 1000 * 15),
        endpoint: '/email/health'
    }
];
var mockAlerts = [
    {
        id: '1',
        type: 'warning',
        title: 'High Memory Usage',
        message: 'Memory usage has exceeded 75% threshold',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        resolved: false,
        service: 'api'
    },
    {
        id: '2',
        type: 'info',
        title: 'Scheduled Maintenance',
        message: 'Database maintenance completed successfully',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        resolved: true,
        service: 'database'
    },
    {
        id: '3',
        type: 'error',
        title: 'Storage Performance Degraded',
        message: 'File storage response time increased significantly',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        resolved: false,
        service: 'storage'
    }
];
function SystemMonitoring() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(mockMetrics), metrics = _a[0], setMetrics = _a[1];
    var _b = (0, react_1.useState)(mockServices), services = _b[0], setServices = _b[1];
    var _c = (0, react_1.useState)(mockAlerts), alerts = _c[0], setAlerts = _c[1];
    var _d = (0, react_1.useState)(false), isRefreshing = _d[0], setIsRefreshing = _d[1];
    var _e = (0, react_1.useState)(true), autoRefresh = _e[0], setAutoRefresh = _e[1];
    // Auto-refresh data every 30 seconds
    (0, react_1.useEffect)(function () {
        if (!autoRefresh)
            return;
        var interval = setInterval(function () {
            // Simulate data updates
            setMetrics(function (prev) { return prev.map(function (metric) { return (__assign(__assign({}, metric), { value: Math.max(0, metric.value + (Math.random() - 0.5) * 10), lastUpdated: new Date() })); }); });
            setServices(function (prev) { return prev.map(function (service) { return (__assign(__assign({}, service), { responseTime: Math.max(1, service.responseTime + (Math.random() - 0.5) * 50), lastCheck: new Date() })); }); });
        }, 30000);
        return function () { return clearInterval(interval); };
    }, [autoRefresh]);
    var handleRefresh = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsRefreshing(true);
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    // Simulate API call
                    _a.sent();
                    setMetrics(function (prev) { return prev.map(function (metric) { return (__assign(__assign({}, metric), { lastUpdated: new Date() })); }); });
                    setServices(function (prev) { return prev.map(function (service) { return (__assign(__assign({}, service), { lastCheck: new Date() })); }); });
                    setIsRefreshing(false);
                    toast({
                        title: 'Data refreshed',
                        description: 'System monitoring data has been updated.',
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [toast]);
    var handleResolveAlert = (0, react_1.useCallback)(function (alertId) {
        setAlerts(function (prev) { return prev.map(function (alert) {
            return alert.id === alertId ? __assign(__assign({}, alert), { resolved: true }) : alert;
        }); });
        toast({
            title: 'Alert resolved',
            description: 'The alert has been marked as resolved.',
        });
    }, [toast]);
    var getStatusColor = function (status) {
        switch (status) {
            case 'online':
            case 'healthy':
                return 'bg-green-100 text-green-800';
            case 'warning':
            case 'degraded':
                return 'bg-yellow-100 text-yellow-800';
            case 'critical':
            case 'offline':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'online':
            case 'healthy':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>;
            case 'warning':
            case 'degraded':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-yellow-500"/>;
            case 'critical':
            case 'offline':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-500"/>;
            default:
                return <lucide_react_1.Clock className="w-4 h-4 text-gray-500"/>;
        }
    };
    var getTrendIcon = function (trend) {
        switch (trend) {
            case 'up':
                return <lucide_react_1.TrendingUp className="w-4 h-4 text-red-500"/>;
            case 'down':
                return <lucide_react_1.TrendingDown className="w-4 h-4 text-green-500"/>;
            default:
                return <lucide_react_1.Activity className="w-4 h-4 text-gray-500"/>;
        }
    };
    var getAlertIcon = function (type) {
        switch (type) {
            case 'error':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-500"/>;
            case 'warning':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-yellow-500"/>;
            case 'info':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-blue-500"/>;
            default:
                return <lucide_react_1.Activity className="w-4 h-4"/>;
        }
    };
    var formatTime = function (date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };
    var formatTimeAgo = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / (1000 * 60));
        var hours = Math.floor(diff / (1000 * 60 * 60));
        if (minutes < 60)
            return "".concat(minutes, "m ago");
        return "".concat(hours, "h ago");
    };
    var activeAlerts = alerts.filter(function (alert) { return !alert.resolved; });
    var healthyServices = services.filter(function (service) { return service.status === 'online'; }).length;
    var avgResponseTime = services.reduce(function (sum, service) { return sum + service.responseTime; }, 0) / services.length;
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <lucide_react_1.Activity className="w-8 h-8 text-green-500"/>
                System Monitoring
              </h1>
              <p className="text-muted-foreground">
                Real-time system health and performance monitoring
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={"w-2 h-2 rounded-full ".concat(autoRefresh ? 'bg-green-500' : 'bg-gray-400')}/>
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </div>
              
              <button_1.Button variant="outline" size="sm" onClick={function () { return setAutoRefresh(!autoRefresh); }}>
                <lucide_react_1.Zap className="w-4 h-4 mr-2"/>
                {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
              </button_1.Button>
              
              <button_1.Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <lucide_react_1.RefreshCw className={"w-4 h-4 mr-2 ".concat(isRefreshing ? 'animate-spin' : '')}/>
                Refresh
              </button_1.Button>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <card_1.Card>
            <card_1.CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <lucide_react_1.Server className="w-6 h-6 text-green-600"/>
                </div>
                <div>
                  <div className="text-2xl font-bold">{healthyServices}/{services.length}</div>
                  <div className="text-sm text-muted-foreground">Services Online</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <lucide_react_1.Globe className="w-6 h-6 text-blue-600"/>
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(avgResponseTime)}ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <lucide_react_1.AlertTriangle className="w-6 h-6 text-yellow-600"/>
                </div>
                <div>
                  <div className="text-2xl font-bold">{activeAlerts.length}</div>
                  <div className="text-sm text-muted-foreground">Active Alerts</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <lucide_react_1.Shield className="w-6 h-6 text-purple-600"/>
                </div>
                <div>
                  <div className="text-2xl font-bold">99.8%</div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Metrics */}
          <div className="space-y-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Cpu className="w-5 h-5"/>
                  System Metrics
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-6">
                {metrics.map(function (metric) { return (<div key={metric.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {metric.value.toFixed(1)}{metric.unit}
                        </span>
                        <badge_1.Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </badge_1.Badge>
                      </div>
                    </div>
                    
                    <progress_1.Progress value={metric.unit === '%' ? metric.value : (metric.value / metric.threshold.critical) * 100} className="h-2"/>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Last updated: {formatTime(metric.lastUpdated)}</span>
                      <span>
                        Warning: {metric.threshold.warning}{metric.unit} | 
                        Critical: {metric.threshold.critical}{metric.unit}
                      </span>
                    </div>
                  </div>); })}
              </card_1.CardContent>
            </card_1.Card>

            {/* Active Alerts */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.AlertTriangle className="w-5 h-5"/>
                  Active Alerts ({activeAlerts.length})
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                {activeAlerts.length === 0 ? (<div className="text-center py-8">
                    <lucide_react_1.CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4"/>
                    <h3 className="font-semibold mb-2">All Clear!</h3>
                    <p className="text-muted-foreground">No active alerts at this time.</p>
                  </div>) : (<div className="space-y-4">
                    {activeAlerts.map(function (alert) { return (<div key={alert.id} className="flex items-start gap-4 p-3 border rounded-lg">
                        <div className="p-1">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <badge_1.Badge variant="outline" className="capitalize">
                              {alert.type}
                            </badge_1.Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(alert.timestamp)}
                              {alert.service && " \u2022 ".concat(alert.service)}
                            </span>
                            <button_1.Button size="sm" variant="outline" onClick={function () { return handleResolveAlert(alert.id); }}>
                              Resolve
                            </button_1.Button>
                          </div>
                        </div>
                      </div>); })}
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Services Status */}
          <div className="space-y-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Server className="w-5 h-5"/>
                  Services Status
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                {services.map(function (service) { return (<div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        {service.name === 'Database' ? <lucide_react_1.Database className="w-4 h-4"/> :
                service.name === 'Redis Cache' ? <lucide_react_1.MemoryStick className="w-4 h-4"/> :
                    service.name === 'File Storage' ? <lucide_react_1.HardDrive className="w-4 h-4"/> :
                        service.name === 'Email Service' ? <lucide_react_1.Wifi className="w-4 h-4"/> :
                            <lucide_react_1.Server className="w-4 h-4"/>}
                      </div>
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.uptime}% uptime • {service.responseTime}ms response
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(service.status)}
                      <badge_1.Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </badge_1.Badge>
                    </div>
                  </div>); })}
              </card_1.CardContent>
            </card_1.Card>

            {/* Quick Actions */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Quick Actions</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-2">
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Download className="w-4 h-4 mr-2"/>
                  Export System Report
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Settings className="w-4 h-4 mr-2"/>
                  Configure Alerts
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Activity className="w-4 h-4 mr-2"/>
                  View Detailed Logs
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Server className="w-4 h-4 mr-2"/>
                  Service Management
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>

            {/* System Information */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>System Information</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Server Time:</span>
                  <span className="font-medium">{formatTime(new Date())}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="font-medium">Production</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-medium">v2.1.4</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Last Deployment:</span>
                  <span className="font-medium">2 days ago</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Next Maintenance:</span>
                  <span className="font-medium">Sunday 2:00 AM</span>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>
    </div>);
}
