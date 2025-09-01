/**
 * Property AI Enhancement Component
 * 
 * Displays AI-powered enhancements for property listings including
 * valuation, risk assessment, fraud detection, and market insights.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import { 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Brain, 
  RefreshCw, 
  Eye,
  DollarSign,
  BarChart3,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { usePropertyAI } from '../../hooks/useAIIntegration';
import { Property } from '../../types/property';
import { formatCurrency } from '../../utils/format';

interface PropertyAIEnhancementProps {
  property: Property;
  showFullAnalysis?: boolean;
  enableAutoRefresh?: boolean;
  className?: string;
}

export function PropertyAIEnhancement({ 
  property, 
  showFullAnalysis = true,
  enableAutoRefresh = false,
  className = '' 
}: PropertyAIEnhancementProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data, isLoading, error, refresh } = usePropertyAI(property, {
    enableValuation: true,
    enableRiskAssessment: true,
    enableFraudDetection: true,
    enableInsights: true,
    autoRefresh: enableAutoRefresh,
    refreshInterval: 300000 // 5 minutes
  });

  if (isLoading) {
    return <PropertyAIEnhancementSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load AI analysis. Please try again.
          <Button variant="outline" size="sm" onClick={refresh} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const enhancement = data.enhancement;
  const valuation = data.valuation;
  const riskAssessment = data.riskAssessment;
  const fraudAnalysis = data.fraudAnalysis;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI Enhancement Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Property Analysis
          </CardTitle>
          <div className="flex items-center space-x-2">
            {data.trustScoreAdjustment && (
              <Badge variant={data.trustScoreAdjustment.adjustment >= 0 ? 'default' : 'destructive'}>
                Trust Score: {data.trustScoreAdjustment.adjustedScore}
                {data.trustScoreAdjustment.adjustment !== 0 && (
                  <span className="ml-1">
                    ({data.trustScoreAdjustment.adjustment > 0 ? '+' : ''}{data.trustScoreAdjustment.adjustment})
                  </span>
                )}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Valuation Summary */}
            {valuation && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI Valuation</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(valuation.estimatedValue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Confidence: {Math.round(valuation.confidence * 100)}%
                  </p>
                </div>
              </div>
            )}

            {/* Risk Assessment Summary */}
            {riskAssessment && (
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  riskAssessment.overallRisk === 'low' ? 'bg-green-100' :
                  riskAssessment.overallRisk === 'medium' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <Shield className={`h-5 w-5 ${
                    riskAssessment.overallRisk === 'low' ? 'text-green-600' :
                    riskAssessment.overallRisk === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Risk Level</p>
                  <p className={`text-lg font-bold capitalize ${
                    riskAssessment.overallRisk === 'low' ? 'text-green-600' :
                    riskAssessment.overallRisk === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {riskAssessment.overallRisk}
                  </p>
                  <p className="text-xs text-gray-500">
                    Score: {riskAssessment.riskScore}/100
                  </p>
                </div>
              </div>
            )}

            {/* Fraud Detection Summary */}
            {fraudAnalysis && (
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  fraudAnalysis.riskLevel === 'low' ? 'bg-green-100' :
                  fraudAnalysis.riskLevel === 'medium' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <Eye className={`h-5 w-5 ${
                    fraudAnalysis.riskLevel === 'low' ? 'text-green-600' :
                    fraudAnalysis.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium">Fraud Risk</p>
                  <p className={`text-lg font-bold capitalize ${
                    fraudAnalysis.riskLevel === 'low' ? 'text-green-600' :
                    fraudAnalysis.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {fraudAnalysis.riskLevel}
                  </p>
                  <p className="text-xs text-gray-500">
                    Confidence: {Math.round(fraudAnalysis.confidence * 100)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      {showFullAnalysis && (
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="valuation">Valuation</TabsTrigger>
                <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
                <TabsTrigger value="insights">Market Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="p-6">
                <AIOverviewTab 
                  enhancement={enhancement}
                  valuation={valuation}
                  riskAssessment={riskAssessment}
                  fraudAnalysis={fraudAnalysis}
                />
              </TabsContent>

              <TabsContent value="valuation" className="p-6">
                <AIValuationTab valuation={valuation} />
              </TabsContent>

              <TabsContent value="risk" className="p-6">
                <AIRiskTab 
                  riskAssessment={riskAssessment}
                  fraudAnalysis={fraudAnalysis}
                />
              </TabsContent>

              <TabsContent value="insights" className="p-6">
                <AIInsightsTab 
                  insights={data.enhancement?.aiEnhancements?.marketInsights}
                  recommendations={enhancement?.aiEnhancements?.recommendations}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Overview Tab Component
function AIOverviewTab({ enhancement, valuation, riskAssessment, fraudAnalysis }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">AI Analysis Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {valuation && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Value</span>
                  <span className="font-semibold">{formatCurrency(valuation.estimatedValue)}</span>
                </div>
              )}
              {riskAssessment && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Risk Score</span>
                  <span className="font-semibold">{riskAssessment.riskScore}/100</span>
                </div>
              )}
              {fraudAnalysis && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fraud Risk</span>
                  <Badge variant={fraudAnalysis.riskLevel === 'low' ? 'default' : 'destructive'}>
                    {fraudAnalysis.riskLevel}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {enhancement?.aiEnhancements?.recommendations ? (
                <div className="space-y-2">
                  <p className="text-sm text-blue-600 font-medium">
                    {enhancement.aiEnhancements.recommendations.pricingOptimization}
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {enhancement.aiEnhancements.recommendations.marketingTips?.slice(0, 3).map((tip: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recommendations available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Valuation Tab Component
function AIValuationTab({ valuation }: any) {
  if (!valuation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Valuation data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Property Valuation Analysis</h3>
        
        {/* Valuation Summary */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(valuation.estimatedValue)}
              </p>
              <p className="text-sm text-gray-600">
                Confidence: {Math.round(valuation.confidence * 100)}%
              </p>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Range: {formatCurrency(valuation.valueRange.min)}</span>
              <span>{formatCurrency(valuation.valueRange.max)}</span>
            </div>
            <Progress 
              value={50} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Valuation Factors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valuation Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {valuation.factors?.map((factor: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      factor.impact === 'positive' ? 'bg-green-500' :
                      factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium">{factor.factor}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">
                      Weight: {Math.round(factor.weight * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Comparison */}
        {valuation.marketComparison && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Market Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Average Price</p>
                  <p className="font-semibold">{formatCurrency(valuation.marketComparison.averagePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price/Sqft</p>
                  <p className="font-semibold">{formatCurrency(valuation.marketComparison.pricePerSqft)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Market Trend</p>
                  <Badge variant={valuation.marketComparison.marketTrend === 'rising' ? 'default' : 'secondary'}>
                    {valuation.marketComparison.marketTrend}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Risk Analysis Tab Component
function AIRiskTab({ riskAssessment, fraudAnalysis }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Risk Analysis</h3>
        
        {/* Risk Assessment */}
        {riskAssessment && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Overall Risk Level</span>
                <Badge variant={riskAssessment.overallRisk === 'low' ? 'default' : 'destructive'}>
                  {riskAssessment.overallRisk.toUpperCase()}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {riskAssessment.riskFactors?.map((factor: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{factor.risk}</span>
                      <Badge variant={factor.severity === 'low' ? 'default' : 'destructive'}>
                        {factor.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{factor.mitigation}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>Likelihood: {Math.round(factor.likelihood * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fraud Analysis */}
        {fraudAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Fraud Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Fraud Risk Level</span>
                <Badge variant={fraudAnalysis.riskLevel === 'low' ? 'default' : 'destructive'}>
                  {fraudAnalysis.riskLevel.toUpperCase()}
                </Badge>
              </div>
              
              {fraudAnalysis.detectedPatterns?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Detected Patterns:</p>
                  {fraudAnalysis.detectedPatterns.map((pattern: any, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{pattern.pattern}</p>
                        <p className="text-xs text-gray-600">{pattern.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">No fraud indicators detected</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Market Insights Tab Component
function AIInsightsTab({ insights, recommendations }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Market Insights & Recommendations</h3>
        
        {/* Market Position */}
        {insights && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Market Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{insights.marketPosition}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Key Strengths</p>
                  <ul className="space-y-1">
                    {insights.keyStrengths?.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Areas of Concern</p>
                  <ul className="space-y-1">
                    {insights.areasOfConcern?.map((concern: string, index: number) => (
                      <li key={index} className="flex items-start text-sm">
                        <Info className="h-3 w-3 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendations */}
        {recommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Pricing Optimization</p>
                  <p className="text-sm text-blue-600">{recommendations.pricingOptimization}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Marketing Tips</p>
                  <ul className="space-y-1">
                    {recommendations.marketingTips?.map((tip: string, index: number) => (
                      <li key={index} className="flex items-start text-sm">
                        <TrendingUp className="h-3 w-3 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Risk Mitigation</p>
                  <ul className="space-y-1">
                    {recommendations.riskMitigation?.map((action: string, index: number) => (
                      <li key={index} className="flex items-start text-sm">
                        <Shield className="h-3 w-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Loading Skeleton Component
function PropertyAIEnhancementSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}