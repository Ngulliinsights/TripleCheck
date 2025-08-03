import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Progress } from '@shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { cn } from '@shared/lib/utils';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import React, { useState } from 'react';

import type { 
  RiskAssessmentResponse,
  RiskFactorWithContext,
  RiskInteraction,
  Recommendation,
  RiskLevel 
} from '@/types/land-verification';

interface RiskAssessmentDisplayProps {
  assessment: RiskAssessmentResponse;
  onRefresh: () => void;
  onExportReport: () => void;
  onViewDetails: (factorId: number) => void;
  className?: string;
}

export default function RiskAssessmentDisplay({
  assessment,
  onRefresh,
  onExportReport,
  onViewDetails,
  className
}: RiskAssessmentDisplayProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  const getRiskColor = (risk: RiskLevel): string => {
    switch (risk) {
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

  const getRiskIcon = (risk: RiskLevel) => {
    switch (risk) {
      case 'low':
        return <Shield className="h-5 w-5 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const RiskFactorCard = ({ factor }: { factor: RiskFactorWithContext }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewDetails(factor.id)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm">{factor.category}</h4>
          <Badge className={cn('text-xs', getRiskColor(factor.severity as RiskLevel))}>
            {factor.severity.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{factor.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Impact:</span>
            <Progress value={factor.impact * 10} className="h-1 w-16" />
            <span className="text-xs font-medium">{factor.impact}/10</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            View
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RecommendationCard = ({ recommendation }: { recommendation: Recommendation }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm">{recommendation.title}</h4>
          <Badge className={cn('text-xs', getPriorityColor(recommendation.priority))}>
            {recommendation.priority.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
        
        {recommendation.actionItems.length > 0 && (
          <div className="mb-3">
            <h5 className="text-xs font-medium mb-1">Action Items:</h5>
            <ul className="text-xs text-muted-foreground space-y-1">
              {recommendation.actionItems.slice(0, 3).map((item, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-blue-600">•</span>
                  {item}
                </li>
              ))}
              {recommendation.actionItems.length > 3 && (
                <li className="text-blue-600">+{recommendation.actionItems.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {recommendation.estimatedTimeframe && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {recommendation.estimatedTimeframe}
            </div>
          )}
          {recommendation.estimatedCost && (
            <div>KES {recommendation.estimatedCost.toLocaleString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const InteractionCard = ({ interaction }: { interaction: RiskInteraction }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm capitalize">{interaction.interactionType}</h4>
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
        <p className="text-sm text-muted-foreground mb-2">{interaction.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Confidence:</span>
          <div className="flex items-center gap-2">
            <Progress value={interaction.confidence * 100} className="h-1 w-16" />
            <span className="text-xs font-medium">{Math.round(interaction.confidence * 100)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getRiskIcon(assessment.riskLevel)}
            <div>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                Last updated: {new Date(assessment.assessmentDate).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onExportReport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Overall Risk Score */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">{assessment.overallRiskScore}/100</div>
            <div className="text-sm text-muted-foreground">Risk Score</div>
          </div>
          <div className="text-center">
            <Badge className={cn('text-sm', getRiskColor(assessment.riskLevel))}>
              {assessment.riskLevel.toUpperCase()}
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">Risk Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(assessment.confidence * 100)}%</div>
            <div className="text-sm text-muted-foreground">Confidence</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="factors">Risk Factors</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
            <TabsTrigger value="recommendations">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {assessment.riskLevel === 'critical' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This property has critical risk factors that require immediate attention.
                  Review recommendations and take action before proceeding.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Top Risk Factors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {assessment.riskFactors
                    .sort((a, b) => b.impact - a.impact)
                    .slice(0, 3)
                    .map((factor) => (
                      <div key={factor.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{factor.category}</span>
                        <Badge className={cn('text-xs', getRiskColor(factor.severity as RiskLevel))}>
                          {factor.severity}
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Priority Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {assessment.recommendations
                    .filter(r => r.priority === 'critical' || r.priority === 'high')
                    .slice(0, 3)
                    .map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{rec.title}</span>
                        <Badge className={cn('text-xs', getPriorityColor(rec.priority))}>
                          {rec.priority}
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>

            {assessment.projectedRisk && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Risk Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(assessment.projectedRisk.timeframes).map(([period, risk]) => (
                      <div key={period} className="text-center">
                        <div className="text-lg font-semibold">{risk}/100</div>
                        <div className="text-xs text-muted-foreground">
                          {period.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="factors" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.riskFactors.map((factor) => (
                <RiskFactorCard key={factor.id} factor={factor} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.riskInteractions.map((interaction) => (
                <InteractionCard key={interaction.id} interaction={interaction} />
              ))}
            </div>
            {assessment.riskInteractions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No risk interactions detected</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessment.recommendations.map((recommendation) => (
                <RecommendationCard key={recommendation.id} recommendation={recommendation} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}