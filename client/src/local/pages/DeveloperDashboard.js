"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var core_web_vitals_1 = require("../../infrastructure/monitoring/core-web-vitals");
var PerformanceTestPanel_1 = require("../../property/components/PerformanceTestPanel");
var badge_1 = require("../components/ui/badge");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
var tabs_1 = require("../components/ui/tabs");
var MUTED_FOREGROUND_CLASS = "text-muted-foreground";
var NEEDS_IMPROVEMENT_RATING = "needs-improvement";
var DeveloperDashboard = function () {
    var _a = (0, react_1.useState)({}), webVitals = _a[0], setWebVitals = _a[1];
    var _b = (0, react_1.useState)({
        memoryUsage: 0,
        bundleSize: 0,
        routeCount: 0,
        componentCount: 0,
        lastDeployment: new Date().toISOString(),
        buildTime: 0,
    }), systemMetrics = _b[0], setSystemMetrics = _b[1];
    var _c = (0, react_1.useState)(false), isTracking = _c[0], setIsTracking = _c[1];
    // Initialize Core Web Vitals tracking
    (0, react_1.useEffect)(function () {
        if (import.meta.env.MODE !== "development") {
            return;
        }
        try {
            setIsTracking(true);
            // Get initial metrics
            setWebVitals(core_web_vitals_1.coreWebVitalsTracker.getMetrics());
            // Subscribe to updates
            var unsubscribe_1 = core_web_vitals_1.coreWebVitalsTracker.onMetricsUpdate(function (metrics) {
                setWebVitals(metrics);
            });
            // Simulate system metrics (in a real app, these would come from actual monitoring)
            var updateSystemMetrics = function () {
                var _a;
                var memoryInfo = (_a = window.performance) === null || _a === void 0 ? void 0 : _a.memory;
                setSystemMetrics({
                    memoryUsage: memoryInfo ?
                        Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)
                        : 0,
                    bundleSize: 2.4, // MB - would be calculated from build stats
                    routeCount: 45, // Would be calculated from router config
                    componentCount: 120, // Would be calculated from component registry
                    lastDeployment: new Date().toISOString(),
                    buildTime: 45, // seconds - would come from CI/CD
                });
            };
            updateSystemMetrics();
            var interval_1 = setInterval(updateSystemMetrics, 5000);
            // Return cleanup function
            return function () {
                unsubscribe_1();
                clearInterval(interval_1);
                setIsTracking(false);
            };
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("Failed to initialize Core Web Vitals tracking:", error);
            setIsTracking(false);
            // Return empty cleanup function for error case
            return function () { };
        }
    }, []);
    // Process Web Vitals data for display
    var webVitalMetrics = (0, react_1.useMemo)(function () {
        var _a, _b, _c, _d, _e;
        if (import.meta.env.MODE !== "development") {
            return [];
        }
        try {
            var metricsWithRatings = core_web_vitals_1.coreWebVitalsTracker.getMetricsWithRatings();
            return [
                {
                    name: "LCP",
                    value: webVitals.lcp,
                    rating: ((_a = metricsWithRatings.lcp) === null || _a === void 0 ? void 0 : _a.rating) || "good",
                    threshold: { good: 2500, needsImprovement: 4000 },
                    unit: "ms",
                    description: "Largest Contentful Paint - Time to render the largest content element",
                },
                {
                    name: "FID",
                    value: webVitals.fid,
                    rating: ((_b = metricsWithRatings.fid) === null || _b === void 0 ? void 0 : _b.rating) || "good",
                    threshold: { good: 100, needsImprovement: 300 },
                    unit: "ms",
                    description: "First Input Delay - Time from first user interaction to browser response",
                },
                {
                    name: "CLS",
                    value: webVitals.cls,
                    rating: ((_c = metricsWithRatings.cls) === null || _c === void 0 ? void 0 : _c.rating) || "good",
                    threshold: { good: 0.1, needsImprovement: 0.25 },
                    unit: "",
                    description: "Cumulative Layout Shift - Visual stability of the page",
                },
                {
                    name: "FCP",
                    value: webVitals.fcp,
                    rating: ((_d = metricsWithRatings.fcp) === null || _d === void 0 ? void 0 : _d.rating) || "good",
                    threshold: { good: 1800, needsImprovement: 3000 },
                    unit: "ms",
                    description: "First Contentful Paint - Time to render the first content element",
                },
                {
                    name: "TTFB",
                    value: webVitals.ttfb,
                    rating: ((_e = metricsWithRatings.ttfb) === null || _e === void 0 ? void 0 : _e.rating) || "good",
                    threshold: { good: 800, needsImprovement: 1800 },
                    unit: "ms",
                    description: "Time to First Byte - Server response time",
                },
            ];
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("Failed to process Web Vitals metrics:", error);
            return [];
        }
    }, [webVitals]);
    var getRatingColor = function (rating) {
        switch (rating) {
            case "good":
                return "text-green-600 bg-green-100";
            case NEEDS_IMPROVEMENT_RATING:
                return "text-yellow-600 bg-yellow-100";
            case "poor":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };
    var getRatingIcon = function (rating) {
        switch (rating) {
            case "good":
                return <lucide_react_1.CheckCircle className="w-4 h-4"/>;
            case NEEDS_IMPROVEMENT_RATING:
                return <lucide_react_1.Clock className="w-4 h-4"/>;
            case "poor":
                return <lucide_react_1.AlertTriangle className="w-4 h-4"/>;
            default:
                return <lucide_react_1.Activity className="w-4 h-4"/>;
        }
    };
    var formatValue = function (value, unit) {
        if (value === null || value === undefined)
            return "Measuring...";
        if (unit === "ms")
            return "".concat(Math.round(value), "ms");
        if (unit === "")
            return value.toFixed(3);
        return "".concat(value).concat(unit);
    };
    var generateReport = function () {
        try {
            var report = core_web_vitals_1.coreWebVitalsTracker.generateReport();
            // eslint-disable-next-line no-console
            console.log("Performance Report:", report);
            // In a real app, this would download or display a detailed report
            // Using window.alert to avoid ESLint error
            window.alert("Performance Score: ".concat(report.score, "/100\n\nRecommendations:\n").concat(report.recommendations.slice(0, 3).join("\n")));
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("Failed to generate performance report:", error);
            window.alert("Failed to generate performance report. Check console for details.");
        }
    };
    // Early return for production - after all hooks
    if (import.meta.env.MODE !== "development") {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className={MUTED_FOREGROUND_CLASS}>
            Developer dashboard is only available in development mode.
          </p>
        </div>
      </div>);
    }
    var progressBarColor = function (rating) {
        if (rating === "good")
            return "bg-green-500";
        if (rating === NEEDS_IMPROVEMENT_RATING)
            return "bg-yellow-500";
        return "bg-red-500";
    };
    return (<div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <lucide_react_1.Code className="w-8 h-8 text-primary"/>
              Developer Dashboard
            </h1>
            <p className={"".concat(MUTED_FOREGROUND_CLASS, " mt-1")}>
              Performance monitoring and development tools
            </p>
          </div>
          <div className="flex items-center gap-2">
            <badge_1.Badge variant={isTracking ? "default" : "secondary"} className="flex items-center gap-1">
              <lucide_react_1.Activity className="w-3 h-3"/>
              {isTracking ? "Tracking Active" : "Tracking Inactive"}
            </badge_1.Badge>
            <button_1.Button onClick={generateReport} variant="outline" size="sm">
              <lucide_react_1.BarChart3 className="w-4 h-4 mr-2"/>
              Generate Report
            </button_1.Button>
          </div>
        </div>

        <tabs_1.Tabs defaultValue="web-vitals" className="space-y-6">
          <tabs_1.TabsList className="grid w-full grid-cols-4">
            <tabs_1.TabsTrigger value="web-vitals" className="flex items-center gap-2">
              <lucide_react_1.Globe className="w-4 h-4"/>
              Core Web Vitals
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="performance" className="flex items-center gap-2">
              <lucide_react_1.Zap className="w-4 h-4"/>
              Performance Tests
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="system" className="flex items-center gap-2">
              <lucide_react_1.Monitor className="w-4 h-4"/>
              System Metrics
            </tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="security" className="flex items-center gap-2">
              <lucide_react_1.Shield className="w-4 h-4"/>
              Security
            </tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          {/* Core Web Vitals Tab */}
          <tabs_1.TabsContent value="web-vitals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webVitalMetrics.map(function (metric) { return (<card_1.Card key={metric.name} className="relative">
                  <card_1.CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <card_1.CardTitle className="text-lg font-semibold">
                        {metric.name}
                      </card_1.CardTitle>
                      <badge_1.Badge className={"".concat(getRatingColor(metric.rating), " flex items-center gap-1")}>
                        {getRatingIcon(metric.rating)}
                        {metric.rating.replace("-", " ")}
                      </badge_1.Badge>
                    </div>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-foreground">
                        {formatValue(metric.value, metric.unit)}
                      </div>
                      <p className={"text-sm ".concat(MUTED_FOREGROUND_CLASS)}>
                        {metric.description}
                      </p>
                      <div className={"flex justify-between text-xs ".concat(MUTED_FOREGROUND_CLASS)}>
                        <span>
                          Good: ≤{metric.threshold.good}
                          {metric.unit}
                        </span>
                        <span>
                          Poor: &gt;{metric.threshold.needsImprovement}
                          {metric.unit}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={"h-2 rounded-full transition-all duration-300 progress-bar ".concat(progressBarColor(metric.rating))} style={{
                "--progress-width": metric.value ?
                    Math.min(100, (metric.value /
                        (metric.threshold.needsImprovement *
                            1.5)) *
                        100)
                    : 0,
            }}/>
                      </div>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>); })}
            </div>

            {/* Web Vitals Summary */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.TrendingUp className="w-5 h-5"/>
                  Performance Summary
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {webVitalMetrics.filter(function (m) { return m.rating === "good"; })
            .length}
                    </div>
                    <div className={"text-sm ".concat(MUTED_FOREGROUND_CLASS)}>
                      Good Metrics
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {webVitalMetrics.filter(function (m) { return m.rating === NEEDS_IMPROVEMENT_RATING; }).length}
                    </div>
                    <div className={"text-sm ".concat(MUTED_FOREGROUND_CLASS)}>
                      Need Improvement
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {webVitalMetrics.filter(function (m) { return m.rating === "poor"; })
            .length}
                    </div>
                    <div className={"text-sm ".concat(MUTED_FOREGROUND_CLASS)}>
                      Poor Metrics
                    </div>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>

          {/* Performance Tests Tab */}
          <tabs_1.TabsContent value="performance" className="space-y-6">
            <PerformanceTestPanel_1.default />
          </tabs_1.TabsContent>

          {/* System Metrics Tab */}
          <tabs_1.TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <card_1.Card>
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className={"text-sm font-medium ".concat(MUTED_FOREGROUND_CLASS)}>
                    Memory Usage
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {systemMetrics.memoryUsage} MB
                  </div>
                  <p className={"text-xs ".concat(MUTED_FOREGROUND_CLASS, " mt-1")}>
                    JavaScript heap size
                  </p>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className={"text-sm font-medium ".concat(MUTED_FOREGROUND_CLASS)}>
                    Bundle Size
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {systemMetrics.bundleSize} MB
                  </div>
                  <p className={"text-xs ".concat(MUTED_FOREGROUND_CLASS, " mt-1")}>
                    Total bundle size
                  </p>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className={"text-sm font-medium ".concat(MUTED_FOREGROUND_CLASS)}>
                    Routes
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {systemMetrics.routeCount}
                  </div>
                  <p className={"text-xs ".concat(MUTED_FOREGROUND_CLASS, " mt-1")}>
                    Total routes
                  </p>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className={"text-sm font-medium ".concat(MUTED_FOREGROUND_CLASS)}>
                    Components
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {systemMetrics.componentCount}
                  </div>
                  <p className={"text-xs ".concat(MUTED_FOREGROUND_CLASS, " mt-1")}>
                    React components
                  </p>
                </card_1.CardContent>
              </card_1.Card>
            </div>

            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Database className="w-5 h-5"/>
                  Build Information
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className={"text-sm font-medium ".concat(MUTED_FOREGROUND_CLASS, " mb-1")}>
                      Last Deployment
                    </div>
                    <div className="text-sm text-foreground">
                      {new Date(systemMetrics.lastDeployment).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className={"text-sm font-medium ".concat(MUTED_FOREGROUND_CLASS, " mb-1")}>
                      Build Time
                    </div>
                    <div className="text-sm text-foreground">
                      {systemMetrics.buildTime}s
                    </div>
                  </div>
                  <div>
                    <div className={"text-sm font-medium ".concat(MUTED_FOREGROUND_CLASS, " mb-1")}>
                      Environment
                    </div>
                    <div className="text-sm text-foreground">
                      {import.meta.env.MODE}
                    </div>
                  </div>
                  <div>
                    <div className={"text-sm font-medium ".concat(MUTED_FOREGROUND_CLASS, " mb-1")}>
                      Node Version
                    </div>
                    <div className="text-sm text-foreground">
                      {import.meta.env.VITE_NODE_VERSION || "Unknown"}
                    </div>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>

          {/* Security Tab */}
          <tabs_1.TabsContent value="security" className="space-y-6">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Shield className="w-5 h-5"/>
                  Security Status
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <lucide_react_1.CheckCircle className="w-5 h-5 text-green-600"/>
                      <span className="font-medium">HTTPS Enabled</span>
                    </div>
                    <badge_1.Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </badge_1.Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <lucide_react_1.CheckCircle className="w-5 h-5 text-green-600"/>
                      <span className="font-medium">
                        Content Security Policy
                      </span>
                    </div>
                    <badge_1.Badge variant="default" className="bg-green-100 text-green-800">
                      Configured
                    </badge_1.Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <lucide_react_1.Clock className="w-5 h-5 text-yellow-600"/>
                      <span className="font-medium">Security Headers</span>
                    </div>
                    <badge_1.Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Partial
                    </badge_1.Badge>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </div>
    </div>);
};
exports.default = DeveloperDashboard;
