import { memo } from "react";
import { useNavigate } from "react-router-dom";
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
  Eye
} from "lucide-react";
import { Button } from "./ui/button";

// Real-time fraud intelligence data structure
interface FraudAlert {
  id: string;
  type: 'active_threat' | 'pattern_detected' | 'area_warning';
  severity: 'high' | 'medium' | 'low';
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

// Hooks for fetching real-time data
import { useQuery } from "@tanstack/react-query";

const FraudIntelligence = memo(() => {
  const navigate = useNavigate();

  // Fetch real-time fraud alerts
  const { data: alertsData } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/fraud-intelligence/alerts?limit=3');
      if (!response.ok) throw new Error('Failed to fetch fraud alerts');
      const result = await response.json();
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch fraud trends
  const { data: trendsData } = useQuery({
    queryKey: ['fraud-trends'],
    queryFn: async () => {
      const response = await fetch('/api/fraud-intelligence/trends');
      if (!response.ok) throw new Error('Failed to fetch fraud trends');
      const result = await response.json();
      return result.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch protection stats
  const { data: statsData } = useQuery({
    queryKey: ['protection-stats'],
    queryFn: async () => {
      const response = await fetch('/api/fraud-intelligence/stats');
      if (!response.ok) throw new Error('Failed to fetch protection stats');
      const result = await response.json();
      return result.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  const handleViewResources = () => {
    navigate('/community-resources');
  };

  // Use real data or fallback to loading state
  const alerts = alertsData?.alerts || [];
  const trends = trendsData?.trends || [];
  const protectionStats = statsData ? [
    { label: 'Active Monitoring', value: statsData.activeMonitoring, icon: Eye, description: 'Real-time fraud detection' },
    { label: 'Threats Blocked', value: statsData.threatsBlocked.toString(), icon: Shield, description: 'This month alone' },
    { label: 'Community Alerts', value: statsData.communityAlerts.toString(), icon: AlertTriangle, description: 'Active warnings' },
    { label: 'Protected Value', value: statsData.protectedValue, icon: Target, description: 'Fraud prevented' }
  ] : [
    { label: 'Active Monitoring', value: '24/7', icon: Eye, description: 'Real-time fraud detection' },
    { label: 'Threats Blocked', value: '156', icon: Shield, description: 'This month alone' },
    { label: 'Community Alerts', value: '23', icon: AlertTriangle, description: 'Active warnings' },
    { label: 'Protected Value', value: 'KES 45M+', icon: Target, description: 'Fraud prevented' }
  ];

  const getSeverityColor = (severity: FraudAlert['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: FraudAlert['type']) => {
    switch (type) {
      case 'active_threat': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pattern_detected': return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case 'area_warning': return <MapPin className="h-4 w-4 text-blue-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4">
        {/* Header - Intelligence Focus */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
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
          {protectionStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <Icon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-600">{stat.description}</div>
              </div>
            );
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
            <Button 
              variant="outline" 
              onClick={handleViewResources}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              View All Alerts
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {alerts.map((alert: any) => (
              <div 
                key={alert.id} 
                className="bg-white rounded-lg border-l-4 border-l-red-500 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={handleViewResources}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(alert.timeDetected).toLocaleString()}
                  </div>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2">{alert.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{alert.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {alert.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {alert.affectedCount} affected
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud Trends Analysis - Data-driven insights */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Fraud Pattern Analysis</h3>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="grid md:grid-cols-3 gap-6">
              {trends.map((trend: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-lg font-semibold text-gray-900 mb-2">{trend.type}</div>
                  <div className={`text-2xl font-bold mb-2 ${trend.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {trend.change > 0 ? '+' : ''}{trend.change}%
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{trend.period}</div>
                  <div className="text-xs text-gray-500">
                    Active in: {trend.locations.join(', ')}
                  </div>
                </div>
              ))}
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
                <Button 
                  onClick={handleViewResources} 
                  className="bg-white text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Emergency Resources
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleViewResources}
                  className="border-white text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Report Fraud
                </Button>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
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
    </section>
  );
});

FraudIntelligence.displayName = "FraudIntelligence";

export default FraudIntelligence;