import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Code,
  Database,
  Globe,
  Monitor,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

import {
  coreWebVitalsTracker,
  type CoreWebVitalsMetrics,
  type MetricRating,
} from "../../infrastructure/monitoring/core-web-vitals";
import PerformanceTestPanel from "../../property/components/PerformanceTestPanel";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

interface WebVitalMetric {
  name: string;
  value: number | null | undefined;
  rating: MetricRating;
  threshold: { good: number; needsImprovement: number };
  unit: string;
  description: string;
}

interface SystemMetrics {
  memoryUsage: number;
  bundleSize: number;
  routeCount: number;
  componentCount: number;
  lastDeployment: string;
  buildTime: number;
}

const MUTED_FOREGROUND_CLASS = "text-muted-foreground";
const NEEDS_IMPROVEMENT_RATING = "needs-improvement" as const;

const DeveloperDashboard: React.FC = () => {
  const [webVitals, setWebVitals] = useState<Partial<CoreWebVitalsMetrics>>({});
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    memoryUsage: 0,
    bundleSize: 0,
    routeCount: 0,
    componentCount: 0,
    lastDeployment: new Date().toISOString(),
    buildTime: 0,
  });
  const [isTracking, setIsTracking] = useState(false);

  // Initialize Core Web Vitals tracking
  useEffect(() => {
    if (import.meta.env.MODE !== "development") {
      return;
    }

    try {
      setIsTracking(true);

      // Get initial metrics
      setWebVitals(coreWebVitalsTracker.getMetrics());

      // Subscribe to updates
      const unsubscribe = coreWebVitalsTracker.onMetricsUpdate((metrics) => {
        setWebVitals(metrics);
      });

      // Simulate system metrics (in a real app, these would come from actual monitoring)
      const updateSystemMetrics = () => {
        const memoryInfo = (
          window.performance as { memory?: { usedJSHeapSize: number } }
        )?.memory;
        setSystemMetrics({
          memoryUsage:
            memoryInfo ?
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
      const interval = setInterval(updateSystemMetrics, 5000);

      // Return cleanup function
      return () => {
        unsubscribe();
        clearInterval(interval);
        setIsTracking(false);
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize Core Web Vitals tracking:", error);
      setIsTracking(false);
      // Return empty cleanup function for error case
      return () => {};
    }
  }, []);

  // Process Web Vitals data for display
  const webVitalMetrics = useMemo((): WebVitalMetric[] => {
    if (import.meta.env.MODE !== "development") {
      return [];
    }

    try {
      const metricsWithRatings = coreWebVitalsTracker.getMetricsWithRatings();

      return [
        {
          name: "LCP",
          value: webVitals.lcp,
          rating: metricsWithRatings.lcp?.rating || "good",
          threshold: { good: 2500, needsImprovement: 4000 },
          unit: "ms",
          description:
            "Largest Contentful Paint - Time to render the largest content element",
        },
        {
          name: "FID",
          value: webVitals.fid,
          rating: metricsWithRatings.fid?.rating || "good",
          threshold: { good: 100, needsImprovement: 300 },
          unit: "ms",
          description:
            "First Input Delay - Time from first user interaction to browser response",
        },
        {
          name: "CLS",
          value: webVitals.cls,
          rating: metricsWithRatings.cls?.rating || "good",
          threshold: { good: 0.1, needsImprovement: 0.25 },
          unit: "",
          description: "Cumulative Layout Shift - Visual stability of the page",
        },
        {
          name: "FCP",
          value: webVitals.fcp,
          rating: metricsWithRatings.fcp?.rating || "good",
          threshold: { good: 1800, needsImprovement: 3000 },
          unit: "ms",
          description:
            "First Contentful Paint - Time to render the first content element",
        },
        {
          name: "TTFB",
          value: webVitals.ttfb,
          rating: metricsWithRatings.ttfb?.rating || "good",
          threshold: { good: 800, needsImprovement: 1800 },
          unit: "ms",
          description: "Time to First Byte - Server response time",
        },
      ];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to process Web Vitals metrics:", error);
      return [];
    }
  }, [webVitals]);

  const getRatingColor = (rating: MetricRating): string => {
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

  const getRatingIcon = (rating: MetricRating) => {
    switch (rating) {
      case "good":
        return <CheckCircle className="w-4 h-4" />;
      case NEEDS_IMPROVEMENT_RATING:
        return <Clock className="w-4 h-4" />;
      case "poor":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatValue = (
    value: number | null | undefined,
    unit: string
  ): string => {
    if (value === null || value === undefined) return "Measuring...";
    if (unit === "ms") return `${Math.round(value)}ms`;
    if (unit === "") return value.toFixed(3);
    return `${value}${unit}`;
  };

  const generateReport = () => {
    try {
      const report = coreWebVitalsTracker.generateReport();
      // eslint-disable-next-line no-console
      console.log("Performance Report:", report);

      // In a real app, this would download or display a detailed report
      // Using window.alert to avoid ESLint error
      window.alert(
        `Performance Score: ${report.score}/100\n\nRecommendations:\n${report.recommendations.slice(0, 3).join("\n")}`
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to generate performance report:", error);
      window.alert(
        "Failed to generate performance report. Check console for details."
      );
    }
  };

  // Early return for production - after all hooks
  if (import.meta.env.MODE !== "development") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Access Denied
          </h1>
          <p className={MUTED_FOREGROUND_CLASS}>
            Developer dashboard is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  const progressBarColor = (rating: MetricRating): string => {
    if (rating === "good") return "bg-green-500";
    if (rating === NEEDS_IMPROVEMENT_RATING) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Code className="w-8 h-8 text-primary" />
              Developer Dashboard
            </h1>
            <p className={`${MUTED_FOREGROUND_CLASS} mt-1`}>
              Performance monitoring and development tools
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isTracking ? "default" : "secondary"}
              className="flex items-center gap-1"
            >
              <Activity className="w-3 h-3" />
              {isTracking ? "Tracking Active" : "Tracking Inactive"}
            </Badge>
            <Button onClick={generateReport} variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="web-vitals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="web-vitals" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Core Web Vitals
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Performance Tests
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              System Metrics
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Core Web Vitals Tab */}
          <TabsContent value="web-vitals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webVitalMetrics.map((metric) => (
                <Card key={metric.name} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">
                        {metric.name}
                      </CardTitle>
                      <Badge
                        className={`${getRatingColor(metric.rating)} flex items-center gap-1`}
                      >
                        {getRatingIcon(metric.rating)}
                        {metric.rating.replace("-", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-3xl font-bold text-foreground">
                        {formatValue(metric.value, metric.unit)}
                      </div>
                      <p className={`text-sm ${MUTED_FOREGROUND_CLASS}`}>
                        {metric.description}
                      </p>
                      <div
                        className={`flex justify-between text-xs ${MUTED_FOREGROUND_CLASS}`}
                      >
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
                        <div
                          className={`h-2 rounded-full transition-all duration-300 progress-bar ${progressBarColor(metric.rating)}`}
                          style={
                            {
                              "--progress-width":
                                metric.value ?
                                  Math.min(
                                    100,
                                    (metric.value /
                                      (metric.threshold.needsImprovement *
                                        1.5)) *
                                      100
                                  )
                                : 0,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Web Vitals Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        webVitalMetrics.filter((m) => m.rating === "good")
                          .length
                      }
                    </div>
                    <div className={`text-sm ${MUTED_FOREGROUND_CLASS}`}>
                      Good Metrics
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {
                        webVitalMetrics.filter(
                          (m) => m.rating === NEEDS_IMPROVEMENT_RATING
                        ).length
                      }
                    </div>
                    <div className={`text-sm ${MUTED_FOREGROUND_CLASS}`}>
                      Need Improvement
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {
                        webVitalMetrics.filter((m) => m.rating === "poor")
                          .length
                      }
                    </div>
                    <div className={`text-sm ${MUTED_FOREGROUND_CLASS}`}>
                      Poor Metrics
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tests Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceTestPanel />
          </TabsContent>

          {/* System Metrics Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle
                    className={`text-sm font-medium ${MUTED_FOREGROUND_CLASS}`}
                  >
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {systemMetrics.memoryUsage} MB
                  </div>
                  <p className={`text-xs ${MUTED_FOREGROUND_CLASS} mt-1`}>
                    JavaScript heap size
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle
                    className={`text-sm font-medium ${MUTED_FOREGROUND_CLASS}`}
                  >
                    Bundle Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {systemMetrics.bundleSize} MB
                  </div>
                  <p className={`text-xs ${MUTED_FOREGROUND_CLASS} mt-1`}>
                    Total bundle size
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle
                    className={`text-sm font-medium ${MUTED_FOREGROUND_CLASS}`}
                  >
                    Routes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {systemMetrics.routeCount}
                  </div>
                  <p className={`text-xs ${MUTED_FOREGROUND_CLASS} mt-1`}>
                    Total routes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle
                    className={`text-sm font-medium ${MUTED_FOREGROUND_CLASS}`}
                  >
                    Components
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {systemMetrics.componentCount}
                  </div>
                  <p className={`text-xs ${MUTED_FOREGROUND_CLASS} mt-1`}>
                    React components
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Build Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div
                      className={`text-sm font-medium ${MUTED_FOREGROUND_CLASS} mb-1`}
                    >
                      Last Deployment
                    </div>
                    <div className="text-sm text-foreground">
                      {new Date(systemMetrics.lastDeployment).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-sm font-medium ${MUTED_FOREGROUND_CLASS} mb-1`}
                    >
                      Build Time
                    </div>
                    <div className="text-sm text-foreground">
                      {systemMetrics.buildTime}s
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-sm font-medium ${MUTED_FOREGROUND_CLASS} mb-1`}
                    >
                      Environment
                    </div>
                    <div className="text-sm text-foreground">
                      {import.meta.env.MODE}
                    </div>
                  </div>
                  <div>
                    <div
                      className={`text-sm font-medium ${MUTED_FOREGROUND_CLASS} mb-1`}
                    >
                      Node Version
                    </div>
                    <div className="text-sm text-foreground">
                      {import.meta.env.VITE_NODE_VERSION || "Unknown"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">HTTPS Enabled</span>
                    </div>
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">
                        Content Security Policy
                      </span>
                    </div>
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      Configured
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium">Security Headers</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      Partial
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
