import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Badge } from '@shared/components/ui/badge';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { 
  BarChart3, 
  Settings, 
  Calculator,
  Target,
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw,
  Save,
  Share
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

import RiskProfileVisualization from './RiskProfileVisualization';
import RiskAssessmentDisplay from './RiskAssessmentDisplay';
import ScenarioModelingTool from './ScenarioModelingTool';
import RiskFactorAnalysis from './RiskFactorAnalysis';
import RiskWeightingControls from './RiskWeightingControls';
import RecommendationEngine from './RecommendationEngine';

import type { 
  RiskAssessmentResponse,
  RiskFactorWithContext,
  RiskInteraction,
  Recommendation,
  RiskLevel 
} from '@/types/land-verification';

interface RiskManagementInterfaceProps {
  sessionId: number;
  riskAssessment: RiskAssessmentResponse;
  onUpdateRiskWeights: (weights: Record<string, number>) => Promise<void>;
  onRecalculateRisk: () => Promise<void>;
  onExportReport: (format: 'pdf' | 'excel' | 'json') => Promise<void>;
  onSaveConfiguration: (config: RiskConfiguration) => Promise<void>;
  onShareAnalysis: () => Promise<void>;
  className?: string;
}

interface RiskConfiguration {
  weights: Record<string, number>;
  thresholds: Record<string, number>;
  preferences: {
    riskTolerance: 'low' | 'medium' | 'high';
    analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    autoRefresh: boolean;
    alertsEnabled: boolean;
  };
}

export default function RiskManagementInterface({
  sessionId,
  riskAssessment,
  onUpdateRiskWeights,
  onRecalculateRisk,
  onExportReport,
  onSaveConfiguration,
  onShareAnalysis,
  className
}: RiskManagementInterfaceProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [configuration, setConfiguration] = useState<RiskConfiguration>({
    weights: {
      ownership: 0.3,
      government: 0.25,
      legal: 0.2,
      physical: 0.15,
      community: 0.1
    },
    thresholds: {
      critical: 80,
      high: 60,
      medium: 40,
      low: 0
    },
    preferences: {
      riskTolerance: 'medium',
      analysisDepth: 'detailed',
      autoRefresh: false,
      alertsEnabled: true
    }
  });

  const calculateRiskTrend = (factors: RiskFactorWithContext[]): 'increasing' | 'stable' | 'decreasing' => {
    // This would typically analyze historical data
    // For now, return a mock trend based on current factors
    const highRiskFactors = factors.filter(f => f.severity === 'critical' || f.severity === 'high').length;
    const totalFactors = factors.length;
    
    if (totalFactors === 0) return 'stable';
    
    const highRiskRatio = highRiskFactors / totalFactors;
    if (highRiskRatio > 0.5) return 'increasing';
    if (highRiskRatio < 0.2) return 'decreasing';
    return 'stable';
  };

  // Calculate derived metrics
  const riskMetrics = useMemo(() => {
    const factors = riskAssessment.riskFactors;
    const criticalCount = factors.filter(f => f.severity === 'critical').length;
    const highCount = factors.filter(f => f.severity === 'high').length;
    const mediumCount = factors.filter(f => f.severity === 'medium').length;
    const lowCount = factors.filter(f => f.severity === 'low').length;
    
    const totalFactors = factors.length;
    const averageImpact = totalFactors > 0 
      ? factors.reduce((sum, f) => sum + f.impact, 0) / totalFactors 
      : 0;
    
    const riskTrend = calculateRiskTrend(factors);
    
    return {
      totalFactors,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      averageImpact,
      riskTrend,
      interactionCount: riskAssessment.riskInteractions.length,
      recommendationCount: riskAssessment.recommendations.length
    };
  }, [riskAssessment]);

  const handleRecalculateRisk = useCallback(async () => {
    setIsRecalculating(true);
    try {
      await onRecalculateRisk();
    } finally {
      setIsRecalculating(false);
    }
  }, [onRecalculateRisk]);

  const handleUpdateWeights = useCallback(async (weights: Record<string, number>) => {
    setConfiguration(prev => ({ ...prev, weights }));
    await onUpdateRiskWeights(weights);
  }, [onUpdateRiskWeights]);

  const handleSaveConfiguration = useCallback(async () => {
    await onSaveConfiguration(configuration);
  }, [configuration, onSaveConfiguration]);

  const handleExportReport = useCallback(async (format: 'pdf' | 'excel' | 'json') => {
    await onExportReport(format);
  }, [onExportReport]);

  const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing':
        return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Risk Management Dashboard
              </CardTitle>
              <CardDescription>
                Comprehensive risk analysis and scenario modeling for property verification
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRecalculateRisk}
                disabled={isRecalculating}
              >
                <RefreshCw className={cn('h-4 w-4', isRecalculating && 'animate-spin')} />
                {isRecalculating ? 'Updating...' : 'Refresh'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveConfiguration}>
                <Save className="h-4 w-4" />
                Save Config
              </Button>
              <Button variant="outline" size="sm" onClick={onShareAnalysis}>
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Risk Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{riskAssessment.overallRiskScore}/100</div>
                <div className="text-sm text-muted-foreground">Overall Risk</div>
                <Badge className={cn('mt-1 text-xs', getRiskLevelColor(riskAssessment.riskLevel))}>
                  {riskAssessment.riskLevel.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{riskMetrics.totalFactors}</div>
                <div className="text-sm text-muted-foreground">Risk Factors</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getTrendIcon(riskMetrics.riskTrend)}
                  <span className="text-xs capitalize">{riskMetrics.riskTrend}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{Math.round(riskAssessment.confidence * 100)}%</div>
                <div className="text-sm text-muted-foreground">Confidence</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {riskMetrics.interactionCount} interactions
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{riskMetrics.recommendationCount}</div>
                <div className="text-sm text-muted-foreground">Actions</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {riskAssessment.recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length} urgent
                </div>
              </CardContent>
            </Card>
          </div>
        </CardHeader>
      </Card>

      {/* Critical Alerts */}
      {riskAssessment.riskLevel === 'critical' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Risk Detected:</strong> This property has critical risk factors that require immediate attention. 
            Review the detailed analysis and take recommended actions before proceeding.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Interface Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Factor Analysis</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RiskAssessmentDisplay
            assessment={riskAssessment}
            onRefresh={handleRecalculateRisk}
            onExportReport={() => handleExportReport('pdf')}
            onViewDetails={(factorId) => {
              // Handle factor detail view
              console.log('View factor details:', factorId);
            }}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RiskFactorAnalysis
                riskFactors={riskAssessment.riskFactors}
                riskInteractions={riskAssessment.riskInteractions}
                onFactorUpdate={(factorId, updates) => {
                  // Handle factor updates
                  console.log('Update factor:', factorId, updates);
                }}
              />
            </div>
            <div>
              <RiskWeightingControls
                currentWeights={configuration.weights}
                onWeightsChange={handleUpdateWeights}
                onResetWeights={() => {
                  const defaultWeights = {
                    ownership: 0.3,
                    government: 0.25,
                    legal: 0.2,
                    physical: 0.15,
                    community: 0.1
                  };
                  handleUpdateWeights(defaultWeights);
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-6">
          <RiskProfileVisualization
            riskFactors={riskAssessment.riskFactors}
            riskInteractions={riskAssessment.riskInteractions}
            onUpdateWeights={handleUpdateWeights}
            onRecalculateRisk={handleRecalculateRisk}
            onExportAnalysis={() => handleExportReport('excel')}
          />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <ScenarioModelingTool
            baselineRiskFactors={riskAssessment.riskFactors}
            onRunScenario={async (scenario) => {
              // Mock scenario execution
              return {
                scenarioId: scenario.id,
                projectedRiskScore: riskAssessment.overallRiskScore + Math.random() * 20 - 10,
                impactAnalysis: {
                  riskChange: Math.random() * 30 - 15,
                  affectedFactors: scenario.modifications.length,
                  confidenceLevel: 0.8
                },
                recommendations: [
                  {
                    id: 'rec-1',
                    priority: 'high' as const,
                    category: 'mitigation' as const,
                    title: 'Scenario-based recommendation',
                    description: 'Based on the scenario analysis, consider this action',
                    actionItems: ['Action 1', 'Action 2'],
                    estimatedCost: 50000,
                    estimatedTimeframe: '2-4 weeks'
                  }
                ]
              };
            }}
            onSaveScenario={(scenario) => {
              console.log('Save scenario:', scenario);
            }}
          />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <RecommendationEngine
            recommendations={riskAssessment.recommendations}
            riskFactors={riskAssessment.riskFactors}
            onImplementAction={(recommendationId, actionId) => {
              console.log('Implement action:', recommendationId, actionId);
            }}
            onDismissRecommendation={(recommendationId) => {
              console.log('Dismiss recommendation:', recommendationId);
            }}
            onRequestExpertHelp={(recommendationId) => {
              console.log('Request expert help:', recommendationId);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export & Reporting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExportReport('pdf')}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF Report
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExportReport('excel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel Analysis
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExportReport('json')}
            >
              <Download className="h-4 w-4 mr-2" />
              Raw Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}