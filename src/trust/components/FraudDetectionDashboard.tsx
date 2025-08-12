import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Clock,
  DollarSign,
  Users,
  FileText,
  Network,
  Brain,
  Zap,
  Filter,
  Download,
  RefreshCw,
  Search,
  Bell
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Alert, AlertDescription, AlertTitle } from '../../shared/components/ui/alert';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Input } from '../../shared/components/ui/input';
import { Progress } from '../../shared/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { useToast } from '../../shared/hooks/use-toast';
import { useFraudDetection } from '../hooks/useFraudDetection';

import { FraudAlertsList } from './FraudAlertsList';
import { MLAnalyticsDisplay } from './MLAnalyticsDisplay';
import { NetworkAnalysisVisualization } from './NetworkAnalysisVisualization';

interface FraudDetectionDashboardProps {
  userId?: string;
  showControls?: boolean;
}

const FRAUD_CATEGORIES = [
  { id: 'property_flipping', name: 'Property Flipping', color: 'bg-red-100 text-red-800' },
  { id: 'mortgage_fraud', name: 'Mortgage Fraud', color: 'bg-orange-100 text-orange-800' },
  { id: 'title_fraud', name: 'Title Fraud', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'money_laundering', name: 'Money Laundering', color: 'bg-purple-100 text-purple-800' },
  { id: 'synthetic_identity', name: 'Synthetic Identity', color: 'bg-blue-100 text-blue-800' },
  { id: 'document_forgery', name: 'Document Forgery', color: 'bg-green-100 text-green-800' }
];

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: TrendingUp },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Eye },
  low: { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Shield }
};

export function FraudDetectionDashboard({ userId, showControls = true }: FraudDetectionDashboardProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  const {
    useFraudDashboard,
    useFraudAlerts,
    useSystemStatus,
    processTransaction,
    isProcessing
  } = useFraudDetection();

  const { 
    data: dashboardData, 
    isLoading: dashboardLoading,
    refetch: refetchDashboard 
  } = useFraudDashboard(userId, { timeRange });

  const alertsQuery = useFraudAlerts({
    ...(severityFilter !== 'all' && { severity: severityFilter }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(searchQuery && { search: searchQuery }),
    limit: 50
  });
  
  const { data: alerts, isLoading: alertsLoading } = alertsQuery;

  const { 
    data: systemStatus,
    isLoading: statusLoading 
  } = useSystemStatus();

  // Real-time updates
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      refetchDashboard();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, refetchDashboard]);

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Fraud detection report is being generated.",
    });
  };

  const handleTestTransaction = async () => {
    try {
      await processTransaction({
        id: `test_${Date.now()}`,
        amount: 1000000,
        propertyId: 'test-property',
        userId: userId || 'test-user',
        paymentMethod: 'cash',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Test Transaction Processed",
        description: "Test transaction has been analyzed for fraud patterns.",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to process test transaction",
        variant: "destructive"
      });
    }
  };

  if (dashboardLoading || statusLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fraud Detection</h1>
          <p className="text-gray-600">
            Real-time fraud monitoring and analysis system
          </p>
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            >
              {isRealTimeEnabled ? (
                <>
                  <Zap className="h-4 w-4 mr-1 text-green-500" />
                  Live
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  Paused
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleTestTransaction} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                'Test Transaction'
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-1" />
              Export Report
            </Button>
          </div>
        )}
      </div>

      {/* System Status Alert */}
      {systemStatus && systemStatus.status !== 'operational' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Status: {systemStatus.status}</AlertTitle>
          <AlertDescription>
            Fraud detection system is experiencing issues. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.totalAlerts || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {dashboardData?.alertsChange > 0 ? '+' : ''}{dashboardData?.alertsChange || 0}% from last period
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.criticalAlerts || 0}
                </p>
                <p className="text-xs text-gray-500">
                  Require immediate attention
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transactions Analyzed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.transactionsAnalyzed || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {dashboardData?.analysisRate || 0}% fraud detection rate
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Losses Prevented</p>
                <p className="text-2xl font-bold text-gray-900">
                  KSh {(dashboardData?.lossesPrevented || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Estimated savings this period
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search alerts, transactions, or patterns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {FRAUD_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Fraud Analysis Dashboard</CardTitle>
          <CardDescription>
            Comprehensive fraud detection and analysis tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alerts">
                Alerts
                {alerts && alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {alerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="network">Network Analysis</TabsTrigger>
              <TabsTrigger value="ml">ML Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Fraud Categories Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fraud Categories</CardTitle>
                    <CardDescription>
                      Distribution of fraud types detected
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {FRAUD_CATEGORIES.map((category) => {
                        const count = dashboardData?.categoryBreakdown?.[category.id] || 0;
                        const percentage = dashboardData?.totalAlerts ? 
                          (count / dashboardData.totalAlerts) * 100 : 0;
                        
                        return (
                          <div key={category.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge className={category.color}>
                                {category.name}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-20">
                                <Progress value={percentage} className="h-2" />
                              </div>
                              <span className="text-sm font-medium w-8 text-right">
                                {count}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detection Trends</CardTitle>
                    <CardDescription>
                      Fraud detection patterns over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Detection Rate</span>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">
                            {dashboardData?.detectionRate || 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">False Positive Rate</span>
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium">
                            {dashboardData?.falsePositiveRate || 0}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Response Time</span>
                        <span className="text-sm font-medium">
                          {dashboardData?.avgResponseTime || 0}ms
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">System Uptime</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">
                            {systemStatus?.uptime || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>
                    Latest fraud detection events and system activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData?.recentActivity?.map((activity: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${SEVERITY_CONFIG[activity.severity as keyof typeof SEVERITY_CONFIG]?.bgColor}`}>
                          {React.createElement(SEVERITY_CONFIG[activity.severity as keyof typeof SEVERITY_CONFIG]?.icon || AlertTriangle, {
                            className: `h-4 w-4 ${SEVERITY_CONFIG[activity.severity as keyof typeof SEVERITY_CONFIG]?.color}`
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
                        <Badge variant="outline" className="text-xs">
                          {activity.category}
                        </Badge>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent fraud activity detected</p>
                        <p className="text-sm">System is monitoring transactions</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts">
              <FraudAlertsList 
                alerts={alerts}
                isLoading={alertsLoading}
                onAlertAction={(action, alert) => {
                  toast({
                    title: "Alert Action",
                    description: `${action} action taken for alert ${alert.id}`,
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="network">
              <NetworkAnalysisVisualization 
                userId={userId}
                timeRange={timeRange}
              />
            </TabsContent>

            <TabsContent value="ml">
              <MLAnalyticsDisplay 
                userId={userId}
                timeRange={timeRange}
              />
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Fraud Detection Reports</CardTitle>
                  <CardDescription>
                    Generate and download comprehensive fraud analysis reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-4">Report generation coming soon</p>
                    <Button variant="outline" onClick={handleExportReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default FraudDetectionDashboard;