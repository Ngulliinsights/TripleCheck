"use strict";
/**
 * Health Dashboard Component
 * Displays system health status and performance metrics
 */
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
exports.HealthDashboard = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var card_1 = require("../../local/components/ui/card");
var button_1 = require("../../local/components/ui/button");
var badge_1 = require("../../local/components/ui/badge");
var progress_1 = require("../../local/components/ui/progress");
var tabs_1 = require("../../local/components/ui/tabs");
var useHealthMonitoring_1 = require("../../local/hooks/useHealthMonitoring");
var HealthStatus = function (_a) {
    var status = _a.status, _b = _a.className, className = _b === void 0 ? '' : _b;
    var statusConfig = {
        healthy: {
            icon: lucide_react_1.CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            label: 'Healthy',
            badgeVariant: 'default'
        },
        degraded: {
            icon: lucide_react_1.AlertTriangle,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
            label: 'Degraded',
            badgeVariant: 'secondary'
        },
        unhealthy: {
            icon: lucide_react_1.AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            label: 'Unhealthy',
            badgeVariant: 'destructive'
        }
    };
    var config = statusConfig[status];
    var Icon = config.icon;
    return (<div className={"flex items-center gap-2 ".concat(className)}>
      <div className={"p-1 rounded-full ".concat(config.bgColor)}>
        <Icon className={"w-4 h-4 ".concat(config.color)}/>
      </div>
      <badge_1.Badge variant={config.badgeVariant}>{config.label}</badge_1.Badge>
    </div>);
};
var ServiceCard = function (_a) {
    var name = _a.name, status = _a.status, responseTime = _a.responseTime, lastCheck = _a.lastCheck, error = _a.error;
    var formatResponseTime = function (time) {
        if (time < 1000)
            return "".concat(time, "ms");
        return "".concat((time / 1000).toFixed(2), "s");
    };
    var formatLastCheck = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / 60000);
        if (minutes < 1)
            return 'Just now';
        if (minutes < 60)
            return "".concat(minutes, "m ago");
        var hours = Math.floor(minutes / 60);
        if (hours < 24)
            return "".concat(hours, "h ago");
        var days = Math.floor(hours / 24);
        return "".concat(days, "d ago");
    };
    return (<card_1.Card>
      <card_1.CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <card_1.CardTitle className="text-sm font-medium capitalize">{name}</card_1.CardTitle>
          <HealthStatus status={status}/>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Response Time</span>
            <span className="font-medium">{formatResponseTime(responseTime)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last Check</span>
            <span className="font-medium">{formatLastCheck(lastCheck)}</span>
          </div>
          {error && (<div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>)}
        </div>
      </card_1.CardContent>
    </card_1.Card>);
};
var MetricsCard = function (_a) {
    var title = _a.title, value = _a.value, change = _a.change, unit = _a.unit, Icon = _a.icon;
    var formatChange = function (change) {
        var isPositive = change > 0;
        var TrendIcon = isPositive ? lucide_react_1.TrendingUp : lucide_react_1.TrendingDown;
        var colorClass = isPositive ? 'text-green-600' : 'text-red-600';
        return (<div className={"flex items-center gap-1 text-xs ".concat(colorClass)}>
        <TrendIcon className="w-3 h-3"/>
        {Math.abs(change).toFixed(1)}%
      </div>);
    };
    return (<card_1.Card>
      <card_1.CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">
              {value}
              {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
            </p>
            {change !== undefined && formatChange(change)}
          </div>
          <div className="p-2 bg-blue-100 rounded-full">
            <Icon className="w-5 h-5 text-blue-600"/>
          </div>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
};
var HealthDashboard = function () {
    var _a = (0, useHealthMonitoring_1.useSystemHealth)(), health = _a.health, isMonitoring = _a.isMonitoring, startMonitoring = _a.startMonitoring, stopMonitoring = _a.stopMonitoring, performHealthCheck = _a.performHealthCheck;
    var _b = (0, useHealthMonitoring_1.usePerformanceMetrics)(), getAllMetrics = _b.getAllMetrics, refreshMetrics = _b.refreshMetrics;
    var _c = (0, useHealthMonitoring_1.useConnectionMonitoring)(), isOnline = _c.isOnline, connectionQuality = _c.connectionQuality;
    var _d = (0, react_1.useState)(false), isRefreshing = _d[0], setIsRefreshing = _d[1];
    var handleRefresh = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsRefreshing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 4, 5]);
                    return [4 /*yield*/, performHealthCheck()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, refreshMetrics()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    setIsRefreshing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var formatUptime = function (uptime) {
        var seconds = Math.floor(uptime / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        if (days > 0)
            return "".concat(days, "d ").concat(hours % 24, "h");
        if (hours > 0)
            return "".concat(hours, "h ").concat(minutes % 60, "m");
        if (minutes > 0)
            return "".concat(minutes, "m ").concat(seconds % 60, "s");
        return "".concat(seconds, "s");
    };
    var allMetrics = getAllMetrics();
    var totalRequests = allMetrics.reduce(function (sum, m) { return sum + m.totalRequests; }, 0);
    var totalFailures = allMetrics.reduce(function (sum, m) { return sum + m.failedRequests; }, 0);
    var avgResponseTime = allMetrics.length > 0
        ? allMetrics.reduce(function (sum, m) { return sum + m.averageResponseTime; }, 0) / allMetrics.length
        : 0;
    var overallSuccessRate = totalRequests > 0 ? ((totalRequests - totalFailures) / totalRequests) * 100 : 100;
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health Dashboard</h1>
          <p className="text-gray-600">Monitor system health and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {isOnline ? (<lucide_react_1.Wifi className="w-4 h-4 text-green-600"/>) : (<lucide_react_1.WifiOff className="w-4 h-4 text-red-600"/>)}
            <span className="text-sm text-gray-600">
              {isOnline ? "Connection: ".concat(connectionQuality) : 'Offline'}
            </span>
          </div>
          <button_1.Button onClick={handleRefresh} disabled={isRefreshing} size="sm">
            <lucide_react_1.RefreshCw className={"w-4 h-4 mr-2 ".concat(isRefreshing ? 'animate-spin' : '')}/>
            Refresh
          </button_1.Button>
          <button_1.Button onClick={isMonitoring ? stopMonitoring : startMonitoring} variant={isMonitoring ? 'outline' : 'default'} size="sm">
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button_1.Button>
        </div>
      </div>

      {/* Overall Status */}
      {health && (<card_1.Card>
          <card_1.CardHeader>
            <div className="flex items-center justify-between">
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Activity className="w-5 h-5"/>
                System Overview
              </card_1.CardTitle>
              <HealthStatus status={health.overall}/>
            </div>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricsCard title="Uptime" value={formatUptime(health.uptime)} icon={lucide_react_1.Clock}/>
              <MetricsCard title="Success Rate" value={overallSuccessRate.toFixed(1)} unit="%" icon={lucide_react_1.CheckCircle}/>
              <MetricsCard title="Avg Response" value={avgResponseTime.toFixed(0)} unit="ms" icon={lucide_react_1.Activity}/>
              <MetricsCard title="Total Requests" value={totalRequests.toLocaleString()} icon={lucide_react_1.BarChart3}/>
            </div>
          </card_1.CardContent>
        </card_1.Card>)}

      <tabs_1.Tabs defaultValue="services" className="space-y-4">
        <tabs_1.TabsList>
          <tabs_1.TabsTrigger value="services">Services</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="performance">Performance</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="alerts">Alerts</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="services" className="space-y-4">
          {health ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(health.services).map(function (_a) {
                var name = _a[0], service = _a[1];
                return (<ServiceCard key={name} name={name} status={service.status} responseTime={service.responseTime} lastCheck={service.timestamp} error={service.error}/>);
            })}
            </div>) : (<card_1.Card>
              <card_1.CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <lucide_react_1.Server className="w-8 h-8 text-gray-400 mx-auto mb-2"/>
                  <p className="text-gray-600">No health data available</p>
                  <button_1.Button onClick={handleRefresh} size="sm" className="mt-2">
                    Start Health Check
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>)}
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allMetrics.map(function (metric) { return (<card_1.Card key={metric.endpoint}>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg capitalize">
                    {metric.endpoint.split('/').pop() || 'Unknown'}
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <div className="flex items-center gap-2">
                        <progress_1.Progress value={metric.successRate} className="flex-1"/>
                        <span className="text-sm font-medium">{metric.successRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg Response Time</p>
                      <p className="text-lg font-semibold">{metric.averageResponseTime.toFixed(0)}ms</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Requests</p>
                      <p className="font-medium">{metric.totalRequests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Failed Requests</p>
                      <p className="font-medium text-red-600">{metric.failedRequests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last Hour</p>
                      <p className="font-medium">{metric.lastHour.requests} requests</p>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="alerts" className="space-y-4">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>System Alerts</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-center py-8">
                <lucide_react_1.AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2"/>
                <p className="text-gray-600">No active alerts</p>
                <p className="text-sm text-gray-500 mt-1">
                  Alerts will appear here when system issues are detected
                </p>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
};
exports.HealthDashboard = HealthDashboard;
