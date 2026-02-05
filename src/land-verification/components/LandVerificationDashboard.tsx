import { Alert, AlertDescription } from '../../shared/components/ui/alert'
import { Badge } from '../../shared/components/ui/badge'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Progress } from '../../shared/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { cn } from '../../shared/lib/utils'
import { 
  MapPin, 
  FileText, 
  Users, 
  Shield, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Calendar,
  TrendingUp
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import type { 
  VerificationSessionResponse, 
  VerificationLayerWithResults,
  RiskLevel,
  VerificationStatus 
} from '@/types/land-verification'

interface LandVerificationDashboardProps {
  sessions: VerificationSessionResponse[];
  onSessionSelect: (sessionId: number) => void;
  onNewVerification: () => void;
  loading?: boolean;
}

export default function LandVerificationDashboard({
  sessions,
  onSessionSelect,
  onNewVerification,
  loading = false
}: LandVerificationDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    highRiskProperties: 0,
    averageCompletionTime: 0
  });

  useEffect(() => {
    // Calculate dashboard statistics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const highRiskProperties = sessions.filter(s => s.overallRiskLevel === 'high' || s.overallRiskLevel === 'critical').length;
    const averageCompletionTime = sessions.reduce((acc, s) => acc + (s.estimatedTimeRemaining || 0), 0) / totalSessions || 0;

    setStats({
      totalSessions,
      completedSessions,
      highRiskProperties,
      averageCompletionTime
    });
  }, [sessions]);

  const getStatusColor = (status: VerificationStatus): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'suspended': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskColor = (risk: RiskLevel): string => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1">{trend}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  const SessionCard = ({ session }: { session: VerificationSessionResponse }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSessionSelect(session.id)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{session.property?.title || `Property ${session.propertyId}`}</CardTitle>
          <Badge className={cn('text-xs', getStatusColor(session.status))}>
            {session.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {session.property?.location || 'Location not specified'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{session.completionPercentage}%</span>
          </div>
          <Progress value={session.completionPercentage} className="h-2" />
          
          <div className="flex items-center justify-between">
            <Badge className={cn('text-xs', getRiskColor(session.overallRiskLevel))}>
              {session.overallRiskLevel.toUpperCase()} RISK
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {session.estimatedTimeRemaining ? `${session.estimatedTimeRemaining}h remaining` : 'Time TBD'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
          <h1 className="text-3xl font-bold">Land Verification Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage property verification sessions across Kenya
          </p>
        </div>
        <Button onClick={onNewVerification} className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          New Verification
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Verifications"
          value={stats.totalSessions}
          icon={FileText}
          trend={`${stats.completedSessions} completed`}
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%`}
          icon={CheckCircle}
        />
        <StatCard
          title="High Risk Properties"
          value={stats.highRiskProperties}
          icon={AlertTriangle}
          trend={stats.highRiskProperties > 0 ? "Requires attention" : "All clear"}
        />
        <StatCard
          title="Avg. Completion Time"
          value={`${Math.round(stats.averageCompletionTime)}h`}
          icon={TrendingUp}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Sessions</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Verification Sessions</h3>
                <p className="text-muted-foreground mb-4">
                  Start your first land verification to secure property transactions
                </p>
                <Button onClick={onNewVerification}>
                  Start Verification
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.slice(0, 6).map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions
              .filter(s => s.status === 'in_progress' || s.status === 'not_started')
              .map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
          </div>
          {sessions.filter(s => s.status === 'in_progress' || s.status === 'not_started').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Sessions</h3>
                <p className="text-muted-foreground">All verification sessions are completed</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions
              .filter(s => s.status === 'completed')
              .map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
          </div>
          {sessions.filter(s => s.status === 'completed').length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Sessions</h3>
                <p className="text-muted-foreground">Completed verifications will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}