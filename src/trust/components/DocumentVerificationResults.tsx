import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  XCircle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Share2,
  Info,
  ChevronDown,
  ChevronRight,
  Hash,
  Calendar,
  User,
  Settings,
  Image,
  Signature,
  FileCheck
} from 'lucide-react'
import React, { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '../../shared/components/ui/alert'
import { Badge } from '../../shared/components/ui/badge'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Progress } from '../../shared/components/ui/progress'
import { Separator } from '../../shared/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { useToast } from '../../shared/hooks/use-toast'
import { useDocumentAuthentication, DocumentVerificationResult, VerificationCheck, RiskFactor } from '../hooks/useDocumentAuthentication'

interface DocumentVerificationResultsProps {
  documentId: string;
  onRecommendationAction?: (action: string, recommendation: string) => void;
  showActions?: boolean;
}

const CHECK_TYPE_ICONS = {
  metadata: Settings,
  visual: Image,
  signature: Signature,
  content: FileText,
  format: FileCheck
};

const CHECK_TYPE_NAMES = {
  metadata: 'Metadata Analysis',
  visual: 'Visual Analysis',
  signature: 'Signature Verification',
  content: 'Content Analysis',
  format: 'Format Validation'
};

const STATUS_CONFIG = {
  authentic: {
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Document appears authentic and can be trusted'
  },
  suspicious: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    icon: AlertTriangle,
    description: 'Document has suspicious elements requiring further review'
  },
  forged: {
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    badgeColor: 'bg-red-100 text-red-800',
    icon: XCircle,
    description: 'Document appears to be forged or heavily tampered'
  }
};

export function DocumentVerificationResults({ 
  documentId, 
  onRecommendationAction,
  showActions = true 
}: DocumentVerificationResultsProps) {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);
  const [expandedRiskFactor, setExpandedRiskFactor] = useState<string | null>(null);

  const {
    useVerificationResult,
    useProcessingStatus,
    getDocumentTypeIcon,
    formatFileSize,
    formatProcessingTime
  } = useDocumentAuthentication();

  const { data: result, isLoading, error } = useVerificationResult(documentId);
  const { data: status } = useProcessingStatus(documentId);

  const handleExportReport = () => {
    toast({
      title: "Export Started",
      description: "Document verification report is being generated.",
    });
  };

  const handleShareReport = () => {
    toast({
      title: "Share Report",
      description: "Share link has been copied to clipboard.",
    });
  };

  const handleRecommendationAction = (action: string, recommendation: string) => {
    if (onRecommendationAction) {
      onRecommendationAction(action, recommendation);
    }
    
    toast({
      title: "Action Initiated",
      description: `${action} for recommendation has been started.`,
    });
  };

  if (isLoading || status === 'processing') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-5 w-5 animate-spin" />
            <span>Processing document verification...</span>
          </div>
          <div className="mt-4">
            <Progress value={undefined} className="h-2" />
            <p className="text-sm text-gray-500 mt-2 text-center">
              This may take a few moments depending on document complexity
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || status === 'not_found') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Verification Failed
            </h3>
            <p className="text-gray-600">
              {error?.message || 'Document verification could not be completed. Please try again.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No verification results available
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[result.status];
  const StatusIcon = statusConfig.icon;

  const groupedChecks = result.checks.reduce((groups, check) => {
    if (!groups[check.type]) {
      groups[check.type] = [];
    }
    groups[check.type].push(check);
    return groups;
  }, {} as Record<string, VerificationCheck[]>);

  return (
    <div className="space-y-6">
      {/* Overall Result */}
      <Card className={`${statusConfig.bgColor} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full bg-white ${statusConfig.color}`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className={`text-xl ${statusConfig.color}`}>
                  {result.status.toUpperCase()}
                </CardTitle>
                <CardDescription className="text-gray-700">
                  {statusConfig.description}
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
                {result.overallScore}
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className="text-xs text-gray-500">out of 100</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(result.confidence * 100)}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
              <div className="text-xs text-gray-500">assessment accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {result.checks.length}
              </div>
              <div className="text-sm text-gray-600">Checks Performed</div>
              <div className="text-xs text-gray-500">verification tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatProcessingTime(result.processingTime)}
              </div>
              <div className="text-sm text-gray-600">Processing Time</div>
              <div className="text-xs text-gray-500">analysis duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Verification Analysis</CardTitle>
          <CardDescription>
            Comprehensive breakdown of document verification results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="checks">Verification Checks</TabsTrigger>
              <TabsTrigger value="risks">Risk Factors</TabsTrigger>
              <TabsTrigger value="metadata">Document Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Document Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>{getDocumentTypeIcon(result.landSpecificData?.documentType)}</span>
                    <span>Document Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Document ID</div>
                      <div className="text-gray-900 font-mono text-xs">{result.documentId}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Processed At</div>
                      <div className="text-gray-900">{new Date(result.processedAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">File Size</div>
                      <div className="text-gray-900">{formatFileSize(result.metadata.fileSize)}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Document Hash</div>
                      <div className="text-gray-900 font-mono text-xs">{result.metadata.hash.slice(0, 16)}...</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Land-Specific Data */}
              {result.landSpecificData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Land Document Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.landSpecificData.propertyDetails && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Property Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {result.landSpecificData.propertyDetails.plotNumber && (
                              <div>
                                <span className="text-gray-600">Plot Number:</span>
                                <span className="ml-2 font-medium">{result.landSpecificData.propertyDetails.plotNumber}</span>
                              </div>
                            )}
                            {result.landSpecificData.propertyDetails.location && (
                              <div>
                                <span className="text-gray-600">Location:</span>
                                <span className="ml-2 font-medium">{result.landSpecificData.propertyDetails.location}</span>
                              </div>
                            )}
                            {result.landSpecificData.propertyDetails.size && (
                              <div>
                                <span className="text-gray-600">Size:</span>
                                <span className="ml-2 font-medium">{result.landSpecificData.propertyDetails.size}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {result.landSpecificData.verificationMarkers && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Security Features</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(result.landSpecificData.verificationMarkers).map(([feature, present]) => (
                              <div key={feature} className="flex items-center space-x-2">
                                {present ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-sm">
                                  {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(groupedChecks).map(([type, checks]) => {
                      const Icon = CHECK_TYPE_ICONS[type as keyof typeof CHECK_TYPE_ICONS];
                      const passedChecks = checks.filter(c => c.status === 'pass').length;
                      const totalChecks = checks.length;
                      const successRate = (passedChecks / totalChecks) * 100;
                      
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium">
                              {CHECK_TYPE_NAMES[type as keyof typeof CHECK_TYPE_NAMES]}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20">
                              <Progress value={successRate} className="h-2" />
                            </div>
                            <span className="text-sm text-gray-600 w-16 text-right">
                              {passedChecks}/{totalChecks} passed
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="checks" className="space-y-4">
              <div className="space-y-4">
                {Object.entries(groupedChecks).map(([type, checks]) => {
                  const Icon = CHECK_TYPE_ICONS[type as keyof typeof CHECK_TYPE_ICONS];
                  
                  return (
                    <Card key={type}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Icon className="h-5 w-5" />
                          <span>{CHECK_TYPE_NAMES[type as keyof typeof CHECK_TYPE_NAMES]}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {checks.map((check) => (
                            <Card 
                              key={check.name}
                              className={`cursor-pointer transition-all duration-200 ${
                                expandedCheck === check.name ? 'ring-2 ring-blue-500' : ''
                              }`}
                              onClick={() => setExpandedCheck(expandedCheck === check.name ? null : check.name)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Badge 
                                        variant={
                                          check.status === 'pass' ? 'default' :
                                          check.status === 'warning' ? 'secondary' :
                                          'destructive'
                                        }
                                      >
                                        {check.status.toUpperCase()}
                                      </Badge>
                                      <h4 className="font-semibold text-gray-900">{check.name}</h4>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{check.description}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <span>Score: {check.score}/100</span>
                                      <span>Confidence: {Math.round(check.confidence * 100)}%</span>
                                      <span>Time: {formatProcessingTime(check.processingTime)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-900">{check.score}</div>
                                      <div className="text-xs text-gray-500">score</div>
                                    </div>
                                    {expandedCheck === check.name ? (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {expandedCheck === check.name && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="mt-4 pt-4 border-t border-gray-200"
                                    >
                                      <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Details</h5>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                          {check.details.map((detail, index) => (
                                            <li key={index}>{detail}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="risks" className="space-y-4">
              <div className="space-y-4">
                {result.riskFactors.length > 0 ? (
                  result.riskFactors.map((riskFactor) => (
                    <Card 
                      key={riskFactor.category}
                      className={`cursor-pointer transition-all duration-200 ${
                        expandedRiskFactor === riskFactor.category ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setExpandedRiskFactor(expandedRiskFactor === riskFactor.category ? null : riskFactor.category)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge 
                                variant={
                                  riskFactor.severity === 'critical' ? 'destructive' :
                                  riskFactor.severity === 'high' ? 'destructive' :
                                  riskFactor.severity === 'medium' ? 'secondary' :
                                  'outline'
                                }
                              >
                                {riskFactor.severity.toUpperCase()}
                              </Badge>
                              <h4 className="font-semibold text-gray-900">{riskFactor.category}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{riskFactor.description}</p>
                            <div className="text-xs text-gray-500">
                              Confidence: {Math.round(riskFactor.confidence * 100)}%
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {expandedRiskFactor === riskFactor.category ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedRiskFactor === riskFactor.category && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Evidence</h5>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                  {riskFactor.evidence.map((evidence, index) => (
                                    <li key={index}>{evidence}</li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Risk Factors Identified
                      </h3>
                      <p className="text-gray-600">
                        The document verification process did not identify any significant risk factors.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {result.metadata.creationDate && (
                      <div>
                        <div className="font-medium text-gray-700">Creation Date</div>
                        <div className="text-gray-900">{new Date(result.metadata.creationDate).toLocaleString()}</div>
                      </div>
                    )}
                    {result.metadata.modificationDate && (
                      <div>
                        <div className="font-medium text-gray-700">Last Modified</div>
                        <div className="text-gray-900">{new Date(result.metadata.modificationDate).toLocaleString()}</div>
                      </div>
                    )}
                    {result.metadata.author && (
                      <div>
                        <div className="font-medium text-gray-700">Author</div>
                        <div className="text-gray-900">{result.metadata.author}</div>
                      </div>
                    )}
                    {result.metadata.software && (
                      <div>
                        <div className="font-medium text-gray-700">Created With</div>
                        <div className="text-gray-900">{result.metadata.software}</div>
                      </div>
                    )}
                    {result.metadata.pageCount && (
                      <div>
                        <div className="font-medium text-gray-700">Page Count</div>
                        <div className="text-gray-900">{result.metadata.pageCount}</div>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-700">File Size</div>
                      <div className="text-gray-900">{formatFileSize(result.metadata.fileSize)}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Digital Signature</div>
                      <div className="text-gray-900">
                        {result.metadata.digitalSignature ? (
                          <Badge variant="default">Present</Badge>
                        ) : (
                          <Badge variant="outline">Not Found</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Document Hash</div>
                      <div className="text-gray-900 font-mono text-xs break-all">{result.metadata.hash}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Suggested actions based on the verification results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <Alert key={index}>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{recommendation}</span>
                    {showActions && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRecommendationAction('Implement', recommendation)}
                      >
                        Take Action
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DocumentVerificationResults;