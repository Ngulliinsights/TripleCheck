/**
 * Health Dashboard Component
 * Displays system health status and performance metrics
 */

import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Server, 
  Wifi, 
  WifiOff,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Progress } from '../../shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { useSystemHealth, usePerformanceMetrics, useConnectionMonitoring } from '../../shared/hooks/useHealthMonitoring';

interface HealthStatusProps {
  status: 'healthy' | 'degraded' | 'unhealthy';
  className?: string;
}

const HealthStatus: React.FC<HealthStatusProps> = ({ status, className = '' }) => {
  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Healthy',
      badgeVariant: 'default' as const
    },
    degraded: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      label: 'Degraded',
      badgeVariant: 'secondary' as const
    },
    unhealthy: {
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Unhealthy',
      badgeVariant: 'destructive' as const
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`p-1 rounded-full ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <Badge variant={config.badgeVariant}>{config.label}</Badge>
    </div>
  );
};

interface ServiceCardProps {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  name,
  status,
  responseTime,
  lastCheck,
  error
}) => {
  const formatResponseTime = (time: number) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const formatLastCheck = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium capitalize">{name}</CardTitle>
          <HealthStatus status={status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Response Time</span>
            <span className="font-medium">{formatResponseTime(responseTime)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Last Check</span>
            <span className="font-medium">{formatLastCheck(lastCheck)}</span>
          </div>
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  change,
  unit,
  icon: Icon
}) => {
  const formatChange = (change: number) => {
    const isPositive = change > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <TrendIcon className="w-3 h-3" />
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
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
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const HealthDashboard: React.FC = () => {
  const { health, isMonitoring, startMonitoring, stopMonitoring, performHealthCheck } = useSystemHealth();
  const { getAllMetrics, refreshMetrics } = usePerformanceMetrics();
  const { isOnline, connectionQuality } = useConnectionMonitoring();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await performHealthCheck();
      await refreshMetrics();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const allMetrics = getAllMetrics();
  const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
  const totalFailures = allMetrics.reduce((sum, m) => sum + m.failedRequests, 0);
  const avgResponseTime = allMetrics.length > 0 
    ? allMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / allMetrics.length 
    : 0;
  const overallSuccessRate = totalRequests > 0 ? ((totalRequests - totalFailures) / totalRequests) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health Dashboard</h1>
          <p className="text-gray-600">Monitor system health and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm text-gray-600">
              {isOnline ? `Connection: ${connectionQuality}` : 'Offline'}
            </span>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? 'outline' : 'default'}
            size="sm"
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {health && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Overview
              </CardTitle>
              <HealthStatus status={health.overall} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricsCard
                title="Uptime"
                value={formatUptime(health.uptime)}
                icon={Clock}
              />
              <MetricsCard
                title="Success Rate"
                value={overallSuccessRate.toFixed(1)}
                unit="%"
                icon={CheckCircle}
              />
              <MetricsCard
                title="Avg Response"
                value={avgResponseTime.toFixed(0)}
                unit="ms"
                icon={Activity}
              />
              <MetricsCard
                title="Total Requests"
                value={totalRequests.toLocaleString()}
                icon={BarChart3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {health ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(health.services).map(([name, service]) => (
                <ServiceCard
                  key={name}
                  name={name}
                  status={service.status}
                  responseTime={service.responseTime}
                  lastCheck={service.timestamp}
                  error={service.error}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Server className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No health data available</p>
                  <Button onClick={handleRefresh} size="sm" className="mt-2">
                    Start Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {allMetrics.map((metric) => (
              <Card key={metric.endpoint}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    {metric.endpoint.split('/').pop() || 'Unknown'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <div className="flex items-center gap-2">
                        <Progress value={metric.successRate} className="flex-1" />
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
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No active alerts</p>
                <p className="text-sm text-gray-500 mt-1">
                  Alerts will appear here when system issues are detected
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};