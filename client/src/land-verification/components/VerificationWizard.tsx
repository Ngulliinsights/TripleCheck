import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, Clock, MapPin, FileText, Users, Shield, Gavel } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '../../local/components/ui/badge'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Progress } from '../../local/components/ui/progress'
import { Separator } from '../../local/components/ui/separator'
import { useToast } from '../../local/hooks/use-toast'
import { useLandVerification } from '../hooks/useLandVerification'

import { CommunityInterviewTemplate } from './CommunityInterviewTemplate'
import { ExpertCoordinationInterface } from './ExpertCoordinationInterface'
import { RiskAssessmentDisplay } from './RiskAssessmentDisplay'
import { VerificationProgressTracker } from './VerificationProgressTracker'

interface VerificationWizardProps {
  propertyId: string;
  userId: string;
  onComplete?: (sessionId: string) => void;
  onCancel?: () => void;
}

interface VerificationLayer {
  id: string;
  type: 'registry' | 'physical' | 'community' | 'government' | 'legal' | 'expert';
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  estimatedDuration: number;
  required: boolean;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
}

const VERIFICATION_LAYERS: VerificationLayer[] = [
  {
    id: 'registry',
    type: 'registry',
    name: 'Land Registry Verification',
    description: 'Verify ownership records and title deed authenticity',
    icon: FileText,
    estimatedDuration: 4,
    required: true,
    status: 'not_started'
  },
  {
    id: 'physical',
    type: 'physical',
    name: 'Physical Verification',
    description: 'On-ground verification of boundaries and property condition',
    icon: MapPin,
    estimatedDuration: 8,
    required: true,
    status: 'not_started'
  },
  {
    id: 'community',
    type: 'community',
    name: 'Community Intelligence',
    description: 'Gather local knowledge and community feedback',
    icon: Users,
    estimatedDuration: 6,
    required: true,
    status: 'not_started'
  },
  {
    id: 'government',
    type: 'government',
    name: 'Government Compliance',
    description: 'Verify compliance with government regulations',
    icon: Shield,
    estimatedDuration: 12,
    required: true,
    status: 'not_started'
  },
  {
    id: 'legal',
    type: 'legal',
    name: 'Legal Assessment',
    description: 'Legal review of documents and ownership chain',
    icon: Gavel,
    estimatedDuration: 16,
    required: false,
    status: 'not_started'
  },
  {
    id: 'expert',
    type: 'expert',
    name: 'Expert Review',
    description: 'Professional surveyor and legal expert assessment',
    icon: CheckCircle,
    estimatedDuration: 24,
    required: false,
    status: 'not_started'
  }
];

export function VerificationWizard({ propertyId, userId, onComplete, onCancel }: VerificationWizardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [verificationSession, setVerificationSession] = useState<any>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [layers, setLayers] = useState(VERIFICATION_LAYERS);

  const {
    initiateVerification,
    executeLayer,
    getVerificationStatus,
    generateRiskAssessment,
    isLoading,
    error
  } = useLandVerification();

  useEffect(() => {
    // Pre-select required layers
    const requiredLayers = layers.filter(layer => layer.required).map(layer => layer.id);
    setSelectedLayers(requiredLayers);
  }, [layers]);

  const handleLayerToggle = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer?.required) return; // Can't deselect required layers

    setSelectedLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const handleInitiateVerification = async () => {
    if (selectedLayers.length === 0) {
      toast({
        title: "No Layers Selected",
        description: "Please select at least one verification layer to proceed.",
        variant: "destructive"
      });
      return;
    }

    setIsInitiating(true);
    try {
      const session = await initiateVerification({
        propertyId,
        userId,
        requestedLayers: selectedLayers as any[],
        priority: 'high',
        notes: 'Initiated through verification wizard'
      });

      setVerificationSession(session);
      setCurrentStep(1);
      
      toast({
        title: "Verification Initiated",
        description: `Verification session ${session.id} has been created successfully.`,
      });
    } catch (error) {
      toast({
        title: "Initiation Failed",
        description: error instanceof Error ? error.message : "Failed to initiate verification",
        variant: "destructive"
      });
    } finally {
      setIsInitiating(false);
    }
  };

  const handleExecuteLayer = async (layerType: string) => {
    if (!verificationSession) return;

    try {
      const results = await executeLayer(verificationSession.id, layerType as any);
      
      // Update layer status
      setLayers(prev => prev.map(layer => 
        layer.type === layerType 
          ? { ...layer, status: 'completed' as const }
          : layer
      ));

      toast({
        title: "Layer Completed",
        description: `${layerType} verification layer has been completed with ${results.length} results.`,
      });
    } catch (error) {
      // Update layer status to failed
      setLayers(prev => prev.map(layer => 
        layer.type === layerType 
          ? { ...layer, status: 'failed' as const }
          : layer
      ));

      toast({
        title: "Layer Failed",
        description: error instanceof Error ? error.message : `Failed to execute ${layerType} layer`,
        variant: "destructive"
      });
    }
  };

  const handleGenerateRiskAssessment = async () => {
    if (!verificationSession) return;

    try {
      const riskAssessment = await generateRiskAssessment(verificationSession.id);
      setCurrentStep(3);
      
      toast({
        title: "Risk Assessment Generated",
        description: `Risk assessment completed with ${riskAssessment.riskLevel} risk level.`,
      });
    } catch (error) {
      toast({
        title: "Assessment Failed",
        description: error instanceof Error ? error.message : "Failed to generate risk assessment",
        variant: "destructive"
      });
    }
  };

  const calculateProgress = () => {
    const completedLayers = layers.filter(layer => 
      selectedLayers.includes(layer.id) && layer.status === 'completed'
    ).length;
    const totalLayers = selectedLayers.length;
    return totalLayers > 0 ? (completedLayers / totalLayers) * 100 : 0;
  };

  const getTotalEstimatedTime = () => {
    return layers
      .filter(layer => selectedLayers.includes(layer.id))
      .reduce((total, layer) => total + layer.estimatedDuration, 0);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configure Land Verification
              </h2>
              <p className="text-gray-600">
                Select the verification layers you want to include in your comprehensive land verification process.
              </p>
            </div>

            <div className="grid gap-4">
              {layers.map((layer) => {
                const Icon = layer.icon;
                const isSelected = selectedLayers.includes(layer.id);
                const isRequired = layer.required;

                return (
                  <Card 
                    key={layer.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    } ${isRequired ? 'border-orange-200' : ''}`}
                    onClick={() => handleLayerToggle(layer.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {layer.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {isRequired && (
                                <Badge variant="secondary" className="text-xs">
                                  Required
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {layer.estimatedDuration}h
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {layer.description}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Selected Layers: {selectedLayers.length}
                </span>
                <span className="font-medium text-gray-700">
                  Estimated Time: {getTotalEstimatedTime()} hours
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleInitiateVerification}
                disabled={selectedLayers.length === 0 || isInitiating}
                className="min-w-[120px]"
              >
                {isInitiating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Initiating...
                  </>
                ) : (
                  'Start Verification'
                )}
              </Button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification in Progress
              </h2>
              <p className="text-gray-600">
                Your land verification is now running. Monitor the progress of each layer below.
              </p>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Overall Progress</h3>
                <span className="text-sm text-gray-600">
                  {Math.round(calculateProgress())}% Complete
                </span>
              </div>
              <Progress value={calculateProgress()} className="mb-2" />
            </div>

            {verificationSession && (
              <VerificationProgressTracker 
                sessionId={verificationSession.id}
                onLayerComplete={(layerType) => {
                  setLayers(prev => prev.map(layer => 
                    layer.type === layerType 
                      ? { ...layer, status: 'completed' as const }
                      : layer
                  ));
                }}
              />
            )}

            <div className="grid gap-4">
              {layers
                .filter(layer => selectedLayers.includes(layer.id))
                .map((layer) => {
                  const Icon = layer.icon;
                  
                  return (
                    <Card key={layer.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              layer.status === 'completed' ? 'bg-green-100 text-green-600' :
                              layer.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                              layer.status === 'failed' ? 'bg-red-100 text-red-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {layer.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {layer.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={
                                layer.status === 'completed' ? 'default' :
                                layer.status === 'in_progress' ? 'secondary' :
                                layer.status === 'failed' ? 'destructive' :
                                'outline'
                              }
                            >
                              {layer.status === 'not_started' ? 'Pending' :
                               layer.status === 'in_progress' ? 'Running' :
                               layer.status === 'completed' ? 'Complete' :
                               'Failed'}
                            </Badge>
                            
                            {layer.status === 'not_started' && (
                              <Button
                                size="sm"
                                onClick={() => handleExecuteLayer(layer.type)}
                                disabled={isLoading}
                              >
                                Start
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                Back to Configuration
              </Button>
              <Button 
                onClick={handleGenerateRiskAssessment}
                disabled={calculateProgress() < 100}
              >
                Generate Risk Assessment
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <ExpertCoordinationInterface 
              sessionId={verificationSession?.id}
              onExpertAssigned={(assignment) => {
                toast({
                  title: "Expert Assigned",
                  description: `${assignment.expertType} has been assigned to your verification.`,
                });
              }}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Complete
              </h2>
              <p className="text-gray-600">
                Your land verification has been completed. Review the risk assessment below.
              </p>
            </div>

            {verificationSession && (
              <RiskAssessmentDisplay 
                sessionId={verificationSession.id}
                onRecommendationAction={(action) => {
                  toast({
                    title: "Action Taken",
                    description: `${action} has been initiated.`,
                  });
                }}
              />
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                View Progress
              </Button>
              <Button 
                onClick={() => {
                  if (onComplete && verificationSession) {
                    onComplete(verificationSession.id);
                  }
                }}
              >
                Complete Verification
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verification Error
          </h3>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default VerificationWizard;