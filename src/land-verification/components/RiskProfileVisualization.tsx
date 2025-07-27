import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { Slider } from '@shared/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Progress } from '@shared/components/ui/progress';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Shield,
  Target,
  Settings,
  RefreshCw,
  Download
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { 
  RiskFactorWithContext,
  RiskLevel,
  RiskCategory,
  RiskInteraction 
} from '@/types/land-verification';

interface RiskProfileVisualizationProps {
  riskFactors: RiskFactorWithContext[];
  riskInteractions: RiskInteraction[];
  onUpdateWeights: (weights: Record<string, number>) => void;
  onRecalculateRisk: () => void;
  onExportAnalysis: () => void;
  className?: string;
}

interface RiskWeight {
  category: RiskCategory;
  weight: number;
  adjustable: boolean;
}

const DEFAULT_RISK_WEIGHTS: RiskWeight[] = [
  { category: 'ownership', weight: 0.3, adjustable: true },
  { category: 'government', weight: 0.25, adjustable: true },
  { category: 'legal', weight: 0.2, adjustable: true },
  { category: 'physical', weight: 0.15, adjustable: true },
  { category: 'community', weight: 0.1, adjustable: true }
];

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444'
};

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  ownership: '#3b82f6',
  government: '#8b5cf6',
  legal: '#ef4444',
  physical: '#10b981',
  community: '#f59e0b'
};

export default function RiskProfileVisualization({
  riskFactors,
  riskInteractions,
  onUpdateWeights,
  onRecalculateRisk,
  onExportAnalysis,
  className
}: RiskProfileVisualizationProps) {
  const [riskWeights, setRiskWeights] = useState<RiskWeight[]>(DEFAULT_RISK_WEIGHTS);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'current' | '30d' | '90d' | '1y'>('current');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'trends'>('overview');

  // Calculate risk distribution by category
  const riskDistribution = useMemo(() => {
    const distribution: Record<RiskCategory, { count: number; totalImpact: number; avgSeverity: number }> = {
      ownership: { count: 0, totalImpact: 0, avgSeverity: 0 },
      government: { count: 0, totalImpact: 0, avgSeverity: 0 },
      legal: { count: 0, totalImpact: 0, avgSeverity: 0 },
      physical: { count: 0, totalImpact: 0, avgSeverity: 0 },
      community: { count: 0, totalImpact: 0, avgSeverity: 0 }
    };

    riskFactors.forEach(factor => {
      const category = factor.category as RiskCategory;
      if (distribution[category]) {
        distribution[category].count++;
        distribution[category].totalImpact += factor.impact;
      }
    });

    // Calculate averages
    Object.keys(distribution).forEach(key => {
      const category = key as RiskCategory;
      if (distribution[category].count > 0) {
        distribution[category].avgSeverity = distribution[category].totalImpact / distribution[category].count;
      }
    });

    return distribution;
  }, [riskFactors]);

  // Calculate weighted risk score
  const weightedRiskScore = useMemo(() => {
    let totalScore = 0;
    let totalWeight = 0;

    riskWeights.forEach(weight => {
      const categoryData = riskDistribution[weight.category];
      if (categoryData.count > 0) {
        totalScore += categoryData.avgSeverity * weight.weight;
        totalWeight += weight.weight;
      }
    });

    return totalWeight > 0 ? (totalScore / totalWeight) * 10 : 0; // Scale to 0-100
  }, [riskDistribution, riskWeights]);

  const handleWeightChange = (category: RiskCategory, newWeight: number) => {
    const updatedWeights = riskWeights.map(w => 
      w.category === category ? { ...w, weight: newWeight / 100 } : w
    );
    setRiskWeights(updatedWeights);
    
    const weightMap = updatedWeights.reduce((acc, w) => {
      acc[w.category] = w.weight;
      return acc;
    }, {} as Record<string, number>);
    
    onUpdateWeights(weightMap);
  };

  const resetWeights = () => {
    setRiskWeights(DEFAULT_RISK_WEIGHTS);
    const weightMap = DEFAULT_RISK_WEIGHTS.reduce((acc, w) => {
      acc[w.category] = w.weight;
      return acc;
    }, {} as Record<string, number>);
    onUpdateWeights(weightMap);
  };

  const getRiskLevel = (score: number): RiskLevel => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const RiskGauge = ({ score, size = 120 }: { score: number; size?: number }) => {
    const riskLevel = getRiskLevel(score);
    const circumference = 2 * Math.PI * (size / 2 - 10);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 10}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 10}
            stroke={RISK_COLORS[riskLevel]}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(score)}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {riskLevel}
          </span>
        </div>
      </div>
    );
  };

  const CategoryChart = () => (
    <div className="space-y-4">
      {Object.entries(riskDistribution).map(([category, data]) => {
        const categoryKey = category as RiskCategory;
        const weight = riskWeights.find(w => w.category === categoryKey)?.weight || 0;
        const weightedScore = data.avgSeverity * weight * 100;
        
        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[categoryKey] }}
                />
                <span className="font-medium capitalize">{category}</span>
                <Badge variant="outline" className="text-xs">
                  {data.count} factors
                </Badge>
              </div>
              <span className="text-sm font-medium">
                {Math.round(weightedScore)}/100
              </span>
            </div>
            <Progress 
              value={weightedScore} 
              className="h-2"
              style={{ 
                '--progress-background': CATEGORY_COLORS[categoryKey] 
              } as React.CSSProperties}
            />
          </div>
        );
      })}
    </div>
  );

  const WeightControls = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Risk Category Weights</h4>
        <Button variant="outline" size="sm" onClick={resetWeights}>
          Reset to Default
        </Button>
      </div>
      
      {riskWeights.map(weight => (
        <div key={weight.category} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium capitalize">{weight.category}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(weight.weight * 100)}%
            </span>
          </div>
          <Slider
            value={[weight.weight * 100]}
            onValueChange={([value]) => handleWeightChange(weight.category, value)}
            max={100}
            step={5}
            disabled={!weight.adjustable}
            className="w-full"
          />
        </div>
      ))}
      
      <div className="text-xs text-muted-foreground">
        Total weight: {Math.round(riskWeights.reduce((sum, w) => sum + w.weight, 0) * 100)}%
      </div>
    </div>
  );

  const InteractionMatrix = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Risk Interactions</h4>
      {riskInteractions.length > 0 ? (
        <div className="space-y-3">
          {riskInteractions.map(interaction => (
            <Card key={interaction.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="capitalize">
                    {interaction.interactionType}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {interaction.impactMultiplier > 1 ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-sm font-medium">
                      {interaction.impactMultiplier.toFixed(1)}x
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {interaction.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <div className="flex items-center gap-2">
                    <Progress value={interaction.confidence * 100} className="h-1 w-16" />
                    <span className="text-xs">
                      {Math.round(interaction.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No risk interactions detected</p>
        </div>
      )}
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Risk Profile Analysis</CardTitle>
            <CardDescription>
              Interactive visualization and analysis of property risk factors
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe as any}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onRecalculateRisk}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onExportAnalysis}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={viewMode} onValueChange={setViewMode as any}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
            <TabsTrigger value="trends">Risk Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Gauge */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Overall Risk Score</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <RiskGauge score={weightedRiskScore} />
                </CardContent>
              </Card>

              {/* Risk Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Risk by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryChart />
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Risk Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {riskFactors.filter(f => f.severity === 'critical' || f.severity === 'high').length}
                      </div>
                      <div className="text-xs text-muted-foreground">High Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {riskFactors.filter(f => f.severity === 'medium').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Medium Risk</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {riskFactors.filter(f => f.severity === 'low').length}
                    </div>
                    <div className="text-xs text-muted-foreground">Low Risk</div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold">{riskInteractions.length}</div>
                      <div className="text-xs text-muted-foreground">Risk Interactions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Weight Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WeightControls />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Risk Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InteractionMatrix />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Factor Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskFactors.map(factor => (
                    <div key={factor.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{factor.category}</span>
                          <Badge 
                            className={cn('text-xs', 
                              factor.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              factor.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              factor.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            )}
                          >
                            {factor.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{factor.impact}/10</div>
                        <div className="text-xs text-muted-foreground">Impact</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Risk Trend Analysis</h3>
              <p className="mb-4">
                Historical risk trend analysis would be displayed here with interactive charts
              </p>
              <div className="text-sm">
                Features would include:
                <ul className="mt-2 space-y-1">
                  <li>• Risk score evolution over time</li>
                  <li>• Category-specific trend analysis</li>
                  <li>• Predictive risk modeling</li>
                  <li>• Comparative analysis with similar properties</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}