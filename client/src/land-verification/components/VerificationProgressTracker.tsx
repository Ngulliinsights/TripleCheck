import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Play, 
  Pause,
  FileText,
  MapPin,
  Users,
  Shield,
  Gavel,
  Award
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { Badge } from '../../local/components/ui/badge'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Progress } from '../../local/components/ui/progress'
import { Separator } from '../../local/components/ui/separator'
import { useToast } from '../../local/hooks/use-toast'
import { useLandVerification } from '../hooks/useLandVerification'

interface VerificationProgressTrackerProps {
  sessionId: string;
  onLayerComplete?: (layerType: string) => void;
  onSessionComplete?: () => void;
  showControls?: boolean;
}

const LAYER_ICONS = {
  registry: FileText,
  physical: MapPin,
  community: Users,
  government: Shield,
  legal: Gavel,
  expert: Award,
};

const LAYER_NAMES = {
  registry: 'Land Registry',
  physical: 'Physical Verification',
  community: 'Community Intelligence',
  government: 'Government Compliance',
  legal: 'Legal Assessment',
  expert: 'Expert Review',
};

export function VerificationProgressTracker({ 
  sessionId, 
  onLayerComplete, 
  onSessionComplete,
  showControls = false 
}: VerificationProgressTrackerProps) {
  const { toast } = useToast();
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const {
    useVerificationStatus,
    useVerificationSession,
    executeLayer,
    isExecutingLayer
  } = useLandVerification();

  const { 
    data: status, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus
  } = useVerificationStatus(sessionId, {
    refetchInterval: isRealTimeEnabled ? 3000 : undefined
  });

  const { 
    data: session, 
    isLoading: sessionLoading 
  } = useVerificationSession(sessionId);

  useEffect(() => {
    if (status?.lastUpdated) {
      const updateTime = new Date(status.lastUpdated);
      if (updateTime > lastUpdate) {
        setLastUpdate(updateTime);
      }
    }
  }, [status?.lastUpdated, lastUpdate]);

  useEffect(() => {
    if (status?.status === 'completed' && onSessionComplete) {
      onSessionComplete();
    }
  }, [status?.status, onSessionComplete]);

  const handleExecuteLayer = async (layerType: string) => {
    try {
      await executeLayer(sessionId, layerType);
      if (onLayerComplete) {
        onLayerComplete(layerType);
      }
      toast({
        title: "Layer Started",
        description: `${LAYER_NAMES[layerType as keyof typeof LAYER_NAMES]} verification has been initiated.`,
      });
    } catch (error) {
      toast({
        title: "Failed to Start Layer",
        description: error instanceof Error ? error.message : "Failed to start verification layer",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (layerStatus: string) => {
    switch (layerStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'suspended':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (layerStatus: string) => {
    switch (layerStatus) {
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 border-blue-200';
      case 'failed':
        return 'bg-red-100 border-red-200';
      case 'suspended':
        return 'bg-yellow-100 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeRemaining = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else {
      return `${Math.round(hours / 24)} days`;
    }
  };

  if (statusLoading || sessionLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-5 w-5 animate-spin" />
            <span>Loading verification status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (statusError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Status
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to retrieve verification progress. Please try again.
            </p>
            <Button onClick={() => refetchStatus()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status || !session) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No verification data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = status.progress.totalLayers > 0 
    ? (status.progress.completedLayers / status.progress.totalLayers) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Verification Progress</CardTitle>
              <CardDescription>
                Session {sessionId} • {status.progress.completedLayers} of {status.progress.totalLayers} layers complete
              </CardDescription>
            </div>
            {showControls && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                >
                  {isRealTimeEnabled ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause Updates
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Resume Updates
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchStatus()}
                >
                  Refresh
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Overall Progress
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">Status</div>
                <Badge 
                  variant={
                    status.status === 'completed' ? 'default' :
                    status.status === 'in_progress' ? 'secondary' :
                    status.status === 'failed' ? 'destructive' :
                    'outline'
                  }
                  className="mt-1"
                >
                  {status.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              
              <div>
                <div className="font-medium text-gray-900">Current Layer</div>
                <div className="text-gray-600 mt-1">
                  {status.progress.currentLayer 
                    ? LAYER_NAMES[status.progress.currentLayer as keyof typeof LAYER_NAMES]
                    : 'None'
                  }
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-900">Time Remaining</div>
                <div className="text-gray-600 mt-1">
                  {status.progress.estimatedTimeRemaining 
                    ? formatTimeRemaining(status.progress.estimatedTimeRemaining)
                    : 'Unknown'
                  }
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-900">Last Updated</div>
                <div className="text-gray-600 mt-1">
                  {new Date(status.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {status.riskAssessment && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Risk Assessment Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Risk Level</div>
                      <Badge 
                        variant={
                          status.riskAssessment.riskLevel === 'low' ? 'default' :
                          status.riskAssessment.riskLevel === 'medium' ? 'secondary' :
                          status.riskAssessment.riskLevel === 'high' ? 'destructive' :
                          'destructive'
                        }
                        className="mt-1"
                      >
                        {status.riskAssessment.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Risk Score</div>
                      <div className="text-gray-900 mt-1 font-mono">
                        {status.riskAssessment.overallScore}/100
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Confidence</div>
                      <div className="text-gray-900 mt-1">
                        {Math.round(status.riskAssessment.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                  {status.riskAssessment.majorRisks.length > 0 && (
                    <div className="mt-3">
                      <div className="font-medium text-gray-700 mb-1">Major Risk Factors</div>
                      <div className="flex flex-wrap gap-1">
                        {status.riskAssessment.majorRisks.slice(0, 3).map((risk, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {risk}
                          </Badge>
                        ))}
                        {status.riskAssessment.majorRisks.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{status.riskAssessment.majorRisks.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Layer Progress Cards */}
      <div className="grid gap-4">
        <AnimatePresence>
          {session.completedLayers?.map((layer: any, index: number) => {
            const Icon = LAYER_ICONS[layer.type as keyof typeof LAYER_ICONS] || FileText;
            const layerName = LAYER_NAMES[layer.type as keyof typeof LAYER_NAMES] || layer.type;
            
            return (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={getStatusColor(layer.status)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-white">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {layerName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {layer.status === 'completed' && layer.completedAt && (
                              `Completed ${new Date(layer.completedAt).toLocaleString()}`
                            )}
                            {layer.status === 'in_progress' && layer.startedAt && (
                              `Started ${new Date(layer.startedAt).toLocaleString()}`
                            )}
                            {layer.status === 'not_started' && (
                              'Waiting to start'
                            )}
                            {layer.status === 'failed' && (
                              'Failed - requires attention'
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(layer.status)}
                        
                        {layer.status === 'not_started' && showControls && (
                          <Button
                            size="sm"
                            onClick={() => handleExecuteLayer(layer.type)}
                            disabled={isExecutingLayer}
                          >
                            {isExecutingLayer ? (
                              <>
                                <Clock className="h-4 w-4 mr-1 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </>
                            )}
                          </Button>
                        )}
                        
                        {layer.results && layer.results.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {layer.results.length} results
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {layer.results && layer.results.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">
                          Latest Results:
                        </div>
                        <div className="space-y-1">
                          {layer.results.slice(0, 2).map((result: any, resultIndex: number) => (
                            <div key={resultIndex} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700">{result.description}</span>
                              <Badge 
                                variant={
                                  result.status === 'pass' ? 'default' :
                                  result.status === 'warning' ? 'secondary' :
                                  'destructive'
                                }
                                className="text-xs"
                              >
                                {result.status}
                              </Badge>
                            </div>
                          ))}
                          {layer.results.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{layer.results.length - 2} more results
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default VerificationProgressTracker;