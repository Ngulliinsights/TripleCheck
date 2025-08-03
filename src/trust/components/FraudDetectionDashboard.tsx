import {
  Shield,
  CheckCircle,
  Clock,
  Activity,
  AlertTriangle,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card";
import { 
  fraudDetectionApi, 
  type BackgroundScan, 
  type FraudReport, 
  type UserStats 
} from "../services/fraudDetectionApi";

interface FraudDetectionDashboardProps {
  readonly userId?: string | undefined;
}

export default function FraudDetectionDashboard({ userId }: FraudDetectionDashboardProps): JSX.Element {
  const [backgroundScans, setBackgroundScans] = useState<BackgroundScan[]>([]);
  const [reports, setReports] = useState<FraudReport[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ propertiesScanned: 0, averageScanTime: 0, cleanRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh active scans every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Use a ref to check current state without causing re-renders
      if (backgroundScans.some(scan => scan.status === "scanning")) {
        refreshActiveScans();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []); // Remove backgroundScans dependency to prevent infinite loop

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [scansData, reportsData, statsData] = await Promise.all([
        fraudDetectionApi.getActiveScans(),
        fraudDetectionApi.getRecentReports(),
        fraudDetectionApi.getUserStats(),
      ]);

      setBackgroundScans(scansData);
      setReports(reportsData);
      setUserStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshActiveScans = async () => {
    try {
      const scansData = await fraudDetectionApi.getActiveScans();
      setBackgroundScans(scansData);
    } catch (err) {
      console.error('Failed to refresh scans:', err);
    }
  };

  const getStatusColor = useCallback(
    (status: FraudReport["status"]): string => {
      const colorMap: Record<FraudReport["status"], string> = {
        safe: "text-green-700 bg-green-50 border-green-200",
        caution: "text-yellow-700 bg-yellow-50 border-yellow-200",
        warning: "text-orange-700 bg-orange-50 border-orange-200",
        blocked: "text-red-700 bg-red-50 border-red-200",
      };
      return colorMap[status];
    },
    []
  );

  const getStatusIcon = useCallback(
    (status: FraudReport["status"]): JSX.Element => {
      const iconMap: Record<
        FraudReport["status"],
        React.ComponentType<{ className?: string | undefined }>
      > = {
        safe: CheckCircle as React.ComponentType<{ className?: string | undefined }>,
        caution: AlertTriangle as React.ComponentType<{ className?: string | undefined }>,
        warning: AlertTriangle as React.ComponentType<{ className?: string | undefined }>,
        blocked: AlertTriangle as React.ComponentType<{ className?: string | undefined }>,
      };
      const IconComponent = iconMap[status];
      return <IconComponent className="w-5 h-5" />;
    },
    []
  );

  const getRiskColor = useCallback(
    (riskLevel: BackgroundScan["riskLevel"]): string => {
      const colorMap: Record<BackgroundScan["riskLevel"], string> = {
        low: "bg-green-500",
        medium: "bg-yellow-500",
        high: "bg-orange-500",
        critical: "bg-red-500",
      };
      return colorMap[riskLevel];
    },
    []
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fraudDetectionApi.refreshScans();
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to refresh:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleViewReport = useCallback(async (reportId: string) => {
    try {
      const reportDetails = await fraudDetectionApi.getReportDetails(reportId);
      // For now, just log the details. In a real app, you'd navigate to a detailed view
      console.log("Report details:", reportDetails);
      // TODO: Navigate to detailed report page or open modal
    } catch (err) {
      console.error('Failed to view report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report details');
    }
  }, []);

  const handleDownloadReport = useCallback(async (reportId: string) => {
    try {
      const blob = await fraudDetectionApi.downloadReport(reportId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fraud-report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download report:', err);
      setError(err instanceof Error ? err.message : 'Failed to download report');
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fraud Detection Dashboard</h1>
            <p className="text-muted-foreground">Loading your security data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fraud Detection Dashboard</h1>
            <p className="text-muted-foreground">Monitor your property scans and security reports</p>
          </div>
          <Button onClick={loadDashboardData} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Dashboard</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={loadDashboardData} variant="destructive">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fraud Detection Dashboard</h1>
          <p className="text-muted-foreground">Monitor your property scans and security reports</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Background Scanning Status */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Active Scans
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4 animate-pulse text-primary" />
            <span>Continuously monitoring properties</span>
          </div>
        </div>

        <div className="grid gap-4">
          {backgroundScans.map((scan) => (
            <Card key={scan.id}>
              <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">
                    Property {scan.propertyId}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Started {scan.startTime}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${getRiskColor(scan.riskLevel)}`}
                  />
                  <span className="text-sm font-medium capitalize">
                    {scan.riskLevel} Risk
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Scanning Progress</span>
                  <span>{scan.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${scan.progress}%` }}
                  />
                </div>
              </div>

              {scan.status === "scanning" && scan.estimatedCompletion && (
                <p className="text-sm text-muted-foreground">
                  Estimated completion: {scan.estimatedCompletion}
                </p>
              )}

              {scan.status === "complete" && (
                <div className="flex items-center gap-2 text-sm text-trust-verified">
                  <CheckCircle className="w-4 h-4" />
                  <span>Scan complete - Report available</span>
                </div>
              )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Reports */}
      <section>
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Recent Property Reports
        </h2>
        <div className="grid gap-6">
          {reports.map((report) => (
            <Card key={report.id} className={getStatusColor(report.status)}>
              <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(report.status)}
                  <div>
                    <h3 className="text-lg font-semibold">{report.title}</h3>
                    <p className="text-sm opacity-75">
                      Property {report.propertyId} • {report.completedAt}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-1">
                    {report.riskScore}
                  </div>
                  <p className="text-xs opacity-75">Risk Score</p>
                </div>
              </div>

              <p className="text-base mb-6">{report.summary}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Key Findings</h4>
                  <ul className="space-y-2">
                    {report.keyFindings.map((finding, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {report.recommendations.map((recommendation, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current mt-2 flex-shrink-0" />
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewReport(report.id)}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Full Report
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport(report.id)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">{userStats.propertiesScanned}</div>
          <h3 className="font-medium text-foreground mb-1">Properties Scanned</h3>
          <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">{userStats.averageScanTime} min</div>
          <h3 className="font-medium text-foreground mb-1">Avg Scan Time</h3>
          <p className="text-sm text-muted-foreground">Your properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">{userStats.cleanRate}%</div>
          <h3 className="font-medium text-foreground mb-1">Clean Rate</h3>
          <p className="text-sm text-muted-foreground">Your portfolio</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}