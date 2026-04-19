/**
 * CommunityInsights / FraudIntelligence
 *
 * Fixes applied:
 * - Moved `useQuery` import to the top (was after component body — a hoisting smell)
 * - Replaced all `any` types with proper interfaces
 * - `handleViewResources` stabilised with useCallback (was recreated every render)
 * - Protection-stats fallback extracted as a constant so it isn't reconstructed on every render
 * - Minor: formatted timestamp with a locale-aware helper instead of inline `new Date()`
 */

import {
  Shield,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  MapPin,
  Clock,
  Users,
  Target,
  Zap,
  Eye,
} from "lucide-react";
import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { type LucideIcon } from "lucide-react";

import { Button } from "./ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FraudAlert {
  id: string;
  type: "active_threat" | "pattern_detected" | "area_warning";
  severity: "high" | "medium" | "low";
  title: string;
  location: string;
  timeDetected: string;
  affectedCount: number;
  description: string;
}

interface FraudTrend {
  type: string;
  change: number;
  period: string;
  locations: string[];
}

interface ProtectionStat {
  label: string;
  value: string;
  icon: LucideIcon;
  description: string;
}

interface AlertsApiResponse  { data: { alerts: FraudAlert[] } }
interface TrendsApiResponse  { data: { trends: FraudTrend[] } }
interface StatsApiResponse   {
  data: {
    activeMonitoring: string;
    threatsBlocked: number;
    communityAlerts: number;
    protectedValue: string;
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<FraudAlert["severity"], string> = {
  high:   "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low:    "bg-blue-100 text-blue-800 border-blue-200",
};

const FALLBACK_STATS: ProtectionStat[] = [
  { label: "Active Monitoring",  value: "24/7",    icon: Eye,           description: "Real-time fraud detection" },
  { label: "Threats Blocked",    value: "156",     icon: Shield,        description: "This month alone"         },
  { label: "Community Alerts",   value: "23",      icon: AlertTriangle, description: "Active warnings"          },
  { label: "Protected Value",    value: "KES 45M+",icon: Target,        description: "Fraud prevented"          },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAlertTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getAlertIcon(type: FraudAlert["type"]) {
  switch (type) {
    case "active_threat":    return <AlertTriangle className="h-4 w-4 text-red-500"    aria-hidden="true" />;
    case "pattern_detected": return <TrendingUp    className="h-4 w-4 text-yellow-500" aria-hidden="true" />;
    case "area_warning":     return <MapPin        className="h-4 w-4 text-blue-500"   aria-hidden="true" />;
    default:                 return <Shield        className="h-4 w-4 text-gray-500"   aria-hidden="true" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FraudIntelligence = memo(() => {
  const navigate = useNavigate();

  // Stable navigation callback — no deps because navigate is stable
  const handleViewResources = useCallback(() => {
    navigate("/community-resources");
  }, [navigate]);

  // ── Data fetching ────────────────────────────────────────────────────────

  const { data: alertsData } = useQuery<AlertsApiResponse>({
    queryKey: ["fraud-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/fraud-intelligence/alerts?limit=3");
      if (!res.ok) throw new Error("Failed to fetch fraud alerts");
      return res.json() as Promise<AlertsApiResponse>;
    },
    staleTime: 2  * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: trendsData } = useQuery<TrendsApiResponse>({
    queryKey: ["fraud-trends"],
    queryFn: async () => {
      const res = await fetch("/api/fraud-intelligence/trends");
      if (!res.ok) throw new Error("Failed to fetch fraud trends");
      return res.json() as Promise<TrendsApiResponse>;
    },
    staleTime: 30 * 60 * 1000,
  });

  const { data: statsData } = useQuery<StatsApiResponse>({
    queryKey: ["protection-stats"],
    queryFn: async () => {
      const res = await fetch("/api/fraud-intelligence/stats");
      if (!res.ok) throw new Error("Failed to fetch protection stats");
      return res.json() as Promise<StatsApiResponse>;
    },
    staleTime: 15 * 60 * 1000,
  });

  // ── Derived data ─────────────────────────────────────────────────────────

  const alerts: FraudAlert[] = alertsData?.data.alerts ?? [];
  const trends: FraudTrend[] = trendsData?.data.trends ?? [];

  const protectionStats: ProtectionStat[] = statsData
    ? [
        { label: "Active Monitoring",  value: statsData.data.activeMonitoring,              icon: Eye,           description: "Real-time fraud detection" },
        { label: "Threats Blocked",    value: String(statsData.data.threatsBlocked),         icon: Shield,        description: "This month alone"         },
        { label: "Community Alerts",   value: String(statsData.data.communityAlerts),        icon: AlertTriangle, description: "Active warnings"          },
        { label: "Protected Value",    value: statsData.data.protectedValue,                 icon: Target,        description: "Fraud prevented"          },
      ]
    : FALLBACK_STATS;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <section className="py-16 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Live Fraud Intelligence
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Real-Time Fraud Protection Network
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our AI-powered system monitors fraud patterns across Kenya 24/7, providing
            instant alerts and community-driven intelligence to protect your property
            investments.
          </p>
        </div>

        {/* Protection stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {protectionStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Icon className="h-5 w-5 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-600">{stat.description}</div>
              </div>
            );
          })}
        </div>

        {/* Active alerts */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-gray-900">Active Fraud Alerts</h3>
              <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
                Live
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleViewResources}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              View All Alerts
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {alerts.length === 0 ? (
            <p className="text-gray-500 text-sm">No active alerts at this time.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  className="bg-white rounded-lg border-l-4 border-l-red-500 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left w-full"
                  onClick={handleViewResources}
                  aria-label={`View details for alert: ${alert.title}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.type)}
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${SEVERITY_STYLES[alert.severity]}`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <time dateTime={alert.timeDetected}>
                        {formatAlertTime(alert.timeDetected)}
                      </time>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2">{alert.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{alert.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {alert.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      {alert.affectedCount} affected
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fraud trends */}
        {trends.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Fraud Pattern Analysis</h3>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="grid md:grid-cols-3 gap-6">
                {trends.map((trend, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-2">{trend.type}</div>
                    <div
                      className={`text-2xl font-bold mb-2 ${
                        trend.change > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {trend.change > 0 ? "+" : ""}{trend.change}%
                    </div>
                    <div className="text-sm text-gray-600 mb-3">{trend.period}</div>
                    <div className="text-xs text-gray-500">
                      Active in: {trend.locations.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Emergency CTA */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-8 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Fraud Emergency Response</h3>
              <p className="text-red-100 mb-6">
                If you're currently experiencing fraud or have urgent concerns, access our
                24/7 emergency resources and connect with fraud response experts immediately.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleViewResources}
                  className="bg-white text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Emergency Resources
                </Button>
                <Button
                  variant="outline"
                  onClick={handleViewResources}
                  className="border-white text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  Report Fraud
                </Button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-semibold text-white">Protection Network</div>
                  <div className="text-sm text-red-100">Always monitoring</div>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                {[
                  { term: "Response time",   detail: "< 2 hours"          },
                  { term: "Success rate",    detail: "94%"                 },
                  { term: "Expert network",  detail: "500+ professionals"  },
                ].map(({ term, detail }) => (
                  <div key={term} className="flex justify-between">
                    <dt className="text-red-100">{term}</dt>
                    <dd className="font-semibold text-white">{detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
});

FraudIntelligence.displayName = "FraudIntelligence";
export default FraudIntelligence;