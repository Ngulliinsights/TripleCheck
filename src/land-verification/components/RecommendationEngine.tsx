import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Progress } from '@shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { cn } from '@shared/lib/utils';
import { 
  CheckCircle,
  Clock,
  DollarSign,
  User,
  AlertTriangle,
  Info,
  Target,
  TrendingUp,
  FileText,
  Phone,
  X,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import type { 
  Recommendation,
  RiskFactorWithContext 
} from '@/types/land-verification';

interface RecommendationEngineProps {
  recommendations: Recommendation[];
  riskFactors: RiskFactorWithContext[];
  onImplementAction: (recommendationId: string, actionId: string) => void;
  onDismissRecommendation: (recommendationId: string) => void;
  onRequestExpertHelp: (recommendationId: string) => void;
  className?: string;
}

interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  inProgress: boolean;
  estimatedTime?: string;
  requiredExpertise?: string;
}

export default function RecommendationEngine({
  recommendations,
  riskFactors,
  onImplementAction,
  onDismissRecommendation,
  onRequestExpertHelp,
  className
}: RecommendationEngineProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  const [actionStates, setActionStates] = useState<Record<string, ActionItem[]>>({});

  // Group recommendations by priority and category
  const groupedRecommendations = useMemo(() => {
    const groups = {
      critical: recommendations.filter(r => r.priority === 'critical'),
      high: recommendations.filter(r => r.priority === 'high'),
      medium: recommendations.filter(r => r.priority === 'medium'),
      low: recommendations.filter(r => r.priority === 'low')
    };

    const byCategory = {
      immediate_action: recommendations.filter(r => r.category === 'immediate_action'),
      investigation: recommendations.filter(r => r.category === 'investigation'),
      monitoring: recommendations.filter(r => r.category === 'monitoring'),
      mitigation: recommendations.filter(r => r.category === 'mitigation')
    };

    return { byPriority: groups, byCategory };
  }, [recommendations]);

  // Calculate completion statistics
  const completionStats = useMemo(() => {
    const totalActions = recommendations.reduce((sum, rec) => sum + rec.actionItems.length, 0);
    const completedActions = Object.values(actionStates).reduce((sum, actions) => 
      sum + actions.filter(a => a.completed).length, 0
    );
    const inProgressActions = Object.values(actionStates).reduce((sum, actions) => 
      sum + actions.filter(a => a.inProgress).length, 0
    );

    return {
      total: totalActions,
      completed: completedActions,
      inProgress: inProgressActions,
      completionRate: totalActions > 0 ? (completedActions / totalActions) * 100 : 0
    };
  }, [recommendations, actionStates]);

  const toggleRecommendationExpansion = (recommendationId: string) => {
    setExpandedRecommendations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recommendationId)) {
        newSet.delete(recommendationId);
      } else {
        newSet.add(recommendationId);
        // Initialize action states if not exists
        if (!actionStates[recommendationId]) {
          const recommendation = recommendations.find(r => r.id === recommendationId);
          if (recommendation) {
            setActionStates(prevStates => ({
              ...prevStates,
              [recommendationId]: recommendation.actionItems.map((item, index) => ({
                id: `${recommendationId}-${index}`,
                text: item,
                completed: false,
                inProgress: false
              }))
            }));
          }
        }
      }
      return newSet;
    });
  };

  const updateActionState = (recommendationId: string, actionId: string, updates: Partial<ActionItem>) => {
    setActionStates(prev => ({
      ...prev,
      [recommendationId]: prev[recommendationId]?.map(action => 
        action.id === actionId ? { ...action, ...updates } : action
      ) || []
    }));

    if (updates.completed || updates.inProgress) {
      onImplementAction(recommendationId, actionId);
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'immediate_action': return <AlertTriangle className="h-4 w-4" />;
      case 'investigation': return <FileText className="h-4 w-4" />;
      case 'monitoring': return <Target className="h-4 w-4" />;
      case 'mitigation': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const RecommendationCard = ({ recommendation }: { recommendation: Recommendation }) => {
    const isExpanded = expandedRecommendations.has(recommendation.id);
    const actions = actionStates[recommendation.id] || [];
    const completedActions = actions.filter(a => a.completed).length;
    const progressPercentage = actions.length > 0 ? (completedActions / actions.length) * 100 : 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryIcon(recommendation.category)}
                  <h4 className="font-medium text-sm">{recommendation.title}</h4>
                  <Badge className={cn('text-xs', getPriorityColor(recommendation.priority))}>
                    {recommendation.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{recommendation.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleRecommendationExpansion(recommendation.id)}
              >
                {isExpanded ? <X className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
              </Button>
            </div>

            {/* Quick Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {recommendation.estimatedTimeframe && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recommendation.estimatedTimeframe}
                </div>
              )}
              {recommendation.estimatedCost && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  KES {recommendation.estimatedCost.toLocaleString()}
                </div>
              )}
              {recommendation.expertRequired && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Expert Required
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {actions.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{completedActions}/{actions.length} completed</span>
                </div>
                <Progress value={progressPercentage} className="h-1" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => toggleRecommendationExpansion(recommendation.id)}
              >
                {isExpanded ? 'Collapse' : 'View Actions'}
              </Button>
              {recommendation.expertRequired && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRequestExpertHelp(recommendation.id)}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Get Expert Help
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismissRecommendation(recommendation.id)}
              >
                Dismiss
              </Button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="space-y-4 pt-3 border-t">
                {/* Action Items */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Action Items</h5>
                  <div className="space-y-2">
                    {actions.map(action => (
                      <div key={action.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded">
                        <Checkbox
                          checked={action.completed}
                          onCheckedChange={(checked) => 
                            updateActionState(recommendation.id, action.id, { 
                              completed: !!checked,
                              inProgress: false
                            })
                          }
                        />
                        <div className="flex-1">
                          <p className={cn(
                            'text-sm',
                            action.completed && 'line-through text-muted-foreground'
                          )}>
                            {action.text}
                          </p>
                          {action.estimatedTime && (
                            <p className="text-xs text-muted-foreground">
                              Estimated time: {action.estimatedTime}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {action.inProgress && (
                            <Badge variant="outline" className="text-xs">
                              In Progress
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => 
                              updateActionState(recommendation.id, action.id, { 
                                inProgress: !action.inProgress,
                                completed: false
                              })
                            }
                          >
                            {action.inProgress ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legal Implications */}
                {recommendation.legalImplications && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Legal Considerations:</strong> {recommendation.legalImplications}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Cost Breakdown */}
                {recommendation.estimatedCost && (
                  <div className="bg-muted/50 rounded p-3">
                    <h6 className="text-sm font-medium mb-1">Cost Estimate</h6>
                    <div className="text-lg font-bold">KES {recommendation.estimatedCost.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      This is an estimated cost. Actual costs may vary based on specific circumstances.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const filteredRecommendations = useMemo(() => {
    switch (activeTab) {
      case 'critical':
        return groupedRecommendations.byPriority.critical;
      case 'high':
        return groupedRecommendations.byPriority.high;
      case 'medium':
        return groupedRecommendations.byPriority.medium;
      case 'low':
        return groupedRecommendations.byPriority.low;
      case 'immediate':
        return groupedRecommendations.byCategory.immediate_action;
      case 'investigation':
        return groupedRecommendations.byCategory.investigation;
      case 'monitoring':
        return groupedRecommendations.byCategory.monitoring;
      case 'mitigation':
        return groupedRecommendations.byCategory.mitigation;
      default:
        return recommendations;
    }
  }, [activeTab, recommendations, groupedRecommendations]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommendation Engine
            </CardTitle>
            <CardDescription>
              Actionable recommendations based on risk assessment results
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{recommendations.length} recommendations</Badge>
            <Badge variant="outline">
              {completionStats.completionRate.toFixed(0)}% complete
            </Badge>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completionStats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completionStats.inProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completionStats.total - completionStats.completed - completionStats.inProgress}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
          <Progress value={completionStats.completionRate} className="mt-3 h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="high">High</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="immediate">Immediate</TabsTrigger>
            <TabsTrigger value="investigation">Investigation</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="mitigation">Mitigation</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredRecommendations.length > 0 ? (
              <div className="space-y-4">
                {filteredRecommendations.map(recommendation => (
                  <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Recommendations</h3>
                <p>No recommendations found for the selected category</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Summary Alert */}
        {groupedRecommendations.byPriority.critical.length > 0 && (
          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Critical Actions Required:</strong> You have {groupedRecommendations.byPriority.critical.length} critical 
              recommendations that require immediate attention to mitigate significant risks.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}