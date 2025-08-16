import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Globe,
  Shield
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useToast } from '../hooks/use-toast';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  threshold: {
    warning: number;
    critical: number;
  };
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
  endpoint: string;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  service?: string;
}

// Mock data
const mockMetrics: SystemMetric[] = [
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

const mockServices: ServiceStatus[] = [
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

const mockAlerts: Alert[] = [
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

export default function SystemMonitoring() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<SystemMetric[]>(mockMetrics);
  const [services, setServices] = useState<ServiceStatus[]>(mockServices);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate data updates
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, metric.value + (Math.random() - 0.5) * 10),
        lastUpdated: new Date()
      })));

      setServices(prev => prev.map(service => ({
        ...service,
        responseTime: Math.max(1, service.responseTime + (Math.random() - 0.5) * 50),
        lastCheck: new Date()
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      lastUpdated: new Date()
    })));

    setServices(prev => prev.map(service => ({
      ...service,
      lastCheck: new Date()
    })));

    setIsRefreshing(false);
    
    toast({
      title: 'Data refreshed',
      description: 'System monitoring data has been updated.',
    });
  }, [toast]);

  const handleResolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
    
    toast({
      title: 'Alert resolved',
      description: 'The alert has been marked as resolved.',
    });
  }, [toast]);

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const healthyServices = services.filter(service => service.status === 'online').length;
  const avgResponseTime = services.reduce((sum, service) => sum + service.responseTime, 0) / services.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Activity className="w-8 h-8 text-green-500" />
                System Monitoring
              </h1>
              <p className="text-muted-foreground">
                Real-time system health and performance monitoring
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`} />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Zap className="w-4 h-4 mr-2" />
                {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Server className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{healthyServices}/{services.length}</div>
                  <div className="text-sm text-muted-foreground">Services Online</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round(avgResponseTime)}ms</div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{activeAlerts.length}</div>
                  <div className="text-sm text-muted-foreground">Active Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">99.8%</div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Metrics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  System Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {metrics.map((metric) => (
                  <div key={metric.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {metric.value.toFixed(1)}{metric.unit}
                        </span>
                        <Badge className={getStatusColor(metric.status)}>
                          {metric.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <Progress 
                      value={metric.unit === '%' ? metric.value : (metric.value / metric.threshold.critical) * 100} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Last updated: {formatTime(metric.lastUpdated)}</span>
                      <span>
                        Warning: {metric.threshold.warning}{metric.unit} | 
                        Critical: {metric.threshold.critical}{metric.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Active Alerts ({activeAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">All Clear!</h3>
                    <p className="text-muted-foreground">No active alerts at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-4 p-3 border rounded-lg">
                        <div className="p-1">
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <Badge variant="outline" className="capitalize">
                              {alert.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(alert.timestamp)}
                              {alert.service && ` • ${alert.service}`}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Services Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Services Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        {service.name === 'Database' ? <Database className="w-4 h-4" /> :
                         service.name === 'Redis Cache' ? <MemoryStick className="w-4 h-4" /> :
                         service.name === 'File Storage' ? <HardDrive className="w-4 h-4" /> :
                         service.name === 'Email Service' ? <Wifi className="w-4 h-4" /> :
                         <Server className="w-4 h-4" />}
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
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export System Report
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Alerts
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  View Detailed Logs
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Server className="w-4 h-4 mr-2" />
                  Service Management
                </Button>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}