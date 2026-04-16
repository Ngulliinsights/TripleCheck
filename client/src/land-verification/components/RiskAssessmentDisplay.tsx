import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  ExternalLink,
  Download,
  Share2
} from 'lucide-react'
import React, { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '../../local/components/ui/alert'
import { Badge } from '../../local/components/ui/badge'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Progress } from '../../local/components/ui/progress'
import { Separator } from '../../local/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../local/components/ui/tabs'
import { useToast } from '../../local/hooks/use-toast'
import { useLandVerification, RiskAssessment, RiskFactor, Recommendation } from '../hooks/useLandVerification'

interface RiskAssessmentDisplayProps {
  sessionId: string;
  onRecommendationAction?: (action: string) => void;
  showActions?: boolean;
}

const RISK_LEVEL_CONFIG = {
  low: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: Shield,
    description: 'Low risk - Property appears safe for transaction'
  },
  medium: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: Info,
    description: 'Medium risk - Some concerns identified, proceed with caution'
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: AlertTriangle,
    description: 'High risk - Significant issues found, expert review recommended'
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    description: 'Critical risk - Do not proceed without resolving major issues'
  }
};

const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

export function RiskAssessmentDisplay({ 
  sessionId, 
  onRecommendationAction,
  showActions = true 
}: RiskAssessmentDisplayProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedRiskFactor, setExpandedRiskFactor] = useState<string | null>(null);

  const { useRiskAssessment } = useLandVerification();
  const { data: assessment, isLoading, error } = useRiskAssessment(sessionId);

  const handleRecommendationAction = (action: string, recommendation: Recommendation) => {
    if (onRecommendationAction) {
      onRecommendationAction(action);
    }
    
    toast({
      title: "Action Initiated",
      description: `${action} for "${recommendation.title}" has been started.`,
    });
  };

  const handleExportReport = () => {
    // In a real implementation, this would generate and download a PDF report
    toast({
      title: "Report Export",
      description: "Risk assessment report is being generated and will be downloaded shortly.",
    });
  };

  const handleShareReport = () => {
    // In a real implementation, this would open a share dialog
    toast({
      title: "Share Report",
      description: "Share link has been copied to clipboard.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-5 w-5 animate-spin" />
            <span>Loading risk assessment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Risk Assessment
            </h3>
            <p className="text-gray-600">
              Unable to retrieve risk assessment data. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No risk assessment available yet. Complete verification layers to generate assessment.
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskConfig = RISK_LEVEL_CONFIG[assessment.riskLevel];
  const RiskIcon = riskConfig.icon;

  return (
    <div className="space-y-6">
      {/* Risk Overview Card */}
      <Card className={`${riskConfig.bgColor} ${riskConfig.borderColor} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full bg-white ${riskConfig.color}`}>
                <RiskIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className={`text-xl ${riskConfig.color}`}>
                  {assessment.riskLevel.toUpperCase()} RISK
                </CardTitle>
                <CardDescription className="text-gray-700">
                  {riskConfig.description}
                </CardDescription>
              </div>
            </div>
            {showActions && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleShareReport}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportReport}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assessment.overallRiskScore}
              </div>
              <div className="text-sm text-gray-600">Risk Score</div>
              <div className="text-xs text-gray-500">out of 100</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(assessment.confidence * 100)}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
              <div className="text-xs text-gray-500">assessment accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assessment.riskFactors.length}
              </div>
              <div className="text-sm text-gray-600">Risk Factors</div>
              <div className="text-xs text-gray-500">identified issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assessment.recommendations.length}
              </div>
              <div className="text-sm text-gray-600">Recommendations</div>
              <div className="text-xs text-gray-500">action items</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Risk Analysis</CardTitle>
          <CardDescription>
            Comprehensive breakdown of risk factors and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="risks">Risk Factors</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                {/* Risk Score Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assessment.riskFactors.map((factor) => (
                        <div key={factor.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={SEVERITY_COLORS[factor.severity]}>
                              {factor.severity}
                            </Badge>
                            <span className="text-sm font-medium">{factor.category}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24">
                              <Progress value={factor.impact} className="h-2" />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {factor.impact}/100
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Assessment Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assessment Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Assessment Date</div>
                        <div className="text-gray-900">
                          {new Date(assessment.assessmentDate).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Valid Until</div>
                        <div className="text-gray-900">
                          {new Date(assessment.validUntil).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Session ID</div>
                        <div className="text-gray-900 font-mono text-xs">
                          {assessment.sessionId}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Assessment ID</div>
                        <div className="text-gray-900 font-mono text-xs">
                          {assessment.id}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              <div className="space-y-4">
                {assessment.riskFactors.map((factor) => (
                  <Card key={factor.id} className="cursor-pointer" onClick={() => 
                    setExpandedRiskFactor(expandedRiskFactor === factor.id ? null : factor.id)
                  }>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={SEVERITY_COLORS[factor.severity]}>
                              {factor.severity}
                            </Badge>
                            <h4 className="font-semibold text-gray-900">
                              {factor.category}
                            </h4>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            {factor.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Impact: {factor.impact}/100</span>
                            <span>Likelihood: {factor.likelihood}/100</span>
                            <span>Confidence: {Math.round(factor.confidence * 100)}%</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {factor.impact > 70 && <TrendingUp className="h-4 w-4 text-red-500" />}
                          {factor.impact < 30 && <TrendingDown className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedRiskFactor === factor.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 pt-4 border-t border-gray-200"
                          >
                            <div className="space-y-3">
                              {factor.evidence.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Evidence</h5>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    {factor.evidence.map((evidence, index) => (
                                      <li key={index}>{evidence}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {factor.mitigation && (
                                <div>
                                  <h5 className="font-medium text-gray-900 mb-2">Mitigation</h5>
                                  <p className="text-sm text-gray-600">{factor.mitigation}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-4">
                {assessment.recommendations.map((recommendation) => (
                  <Card key={recommendation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={PRIORITY_COLORS[recommendation.priority]}>
                              {recommendation.priority}
                            </Badge>
                            <h4 className="font-semibold text-gray-900">
                              {recommendation.title}
                            </h4>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {recommendation.description}
                          </p>
                        </div>
                      </div>

                      {recommendation.actionItems.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Action Items</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {recommendation.actionItems.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {recommendation.estimatedCost && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>Est. Cost: ${recommendation.estimatedCost.toLocaleString()}</span>
                            </div>
                          )}
                          {recommendation.estimatedTime && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Est. Time: {recommendation.estimatedTime} hours</span>
                            </div>
                          )}
                        </div>

                        {showActions && (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRecommendationAction('Schedule', recommendation)}
                            >
                              Schedule
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRecommendationAction('Implement', recommendation)}
                            >
                              Implement
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Summary */}
      {showActions && assessment.recommendations.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Next Steps</AlertTitle>
          <AlertDescription>
            Based on this risk assessment, we recommend addressing{' '}
            <strong>{assessment.recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').length}</strong>{' '}
            high-priority items before proceeding with the transaction.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default RiskAssessmentDisplay;