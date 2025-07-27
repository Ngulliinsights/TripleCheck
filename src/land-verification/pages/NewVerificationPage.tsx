import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { VerificationWizard, CommunityInterviewTemplate } from '../components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { ArrowLeft, CheckCircle, Info } from 'lucide-react';
import type { 
  VerificationSessionRequest,
  InterviewTemplate,
  CommunityIntelligenceRequest,
  Property 
} from '@/types/land-verification';

export default function NewVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentStep, setCurrentStep] = useState<'wizard' | 'community' | 'confirmation'>('wizard');
  const [verificationRequest, setVerificationRequest] = useState<VerificationSessionRequest | null>(null);
  const [communityTemplates, setCommunityTemplates] = useState<InterviewTemplate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock property data - in real app this would come from API
  React.useEffect(() => {
    if (propertyId) {
      // Fetch property details
      setSelectedProperty({
        id: parseInt(propertyId),
        title: 'Sample Property in Nairobi',
        location: 'Westlands, Nairobi',
        price: 15000000,
        description: 'Modern 3-bedroom apartment',
        imageUrls: [],
        ownerId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }, [propertyId]);

  const handleWizardComplete = async (request: VerificationSessionRequest) => {
    setVerificationRequest(request);
    
    // If community intelligence is enabled, show community template step
    // For now, we'll skip directly to confirmation
    setCurrentStep('confirmation');
  };

  const handleWizardCancel = () => {
    navigate('/land-verification');
  };

  const handleGenerateTemplate = async (request: CommunityIntelligenceRequest): Promise<InterviewTemplate[]> => {
    try {
      const response = await fetch('/api/land-verification/community/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to generate interview templates');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error generating templates:', error);
      toast.error('Failed to generate interview templates');
      return [];
    }
  };

  const handleSaveTemplate = (template: InterviewTemplate) => {
    setCommunityTemplates(prev => {
      const existing = prev.find(t => t.id === template.id);
      if (existing) {
        return prev.map(t => t.id === template.id ? template : t);
      }
      return [...prev, template];
    });
    toast.success('Template saved successfully');
  };

  const handlePreviewTemplate = (template: InterviewTemplate) => {
    // Open template preview in a modal or new window
    console.log('Preview template:', template);
    toast.info('Template preview functionality would open here');
  };

  const handleFinalSubmit = async () => {
    if (!verificationRequest) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/land-verification/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...verificationRequest,
          communityTemplates: communityTemplates.length > 0 ? communityTemplates : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create verification session');
      }

      const data = await response.json();
      toast.success('Verification session created successfully');
      navigate(`/land-verification/sessions/${data.data.id}`);
    } catch (error) {
      console.error('Error creating verification session:', error);
      toast.error('Failed to create verification session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'wizard':
        return (
          <VerificationWizard
            property={selectedProperty || undefined}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        );

      case 'community':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Community Interview Setup</h2>
                <p className="text-muted-foreground">
                  Configure interview templates for community intelligence gathering
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('wizard')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Wizard
                </Button>
                <Button onClick={() => setCurrentStep('confirmation')}>
                  Continue to Review
                </Button>
              </div>
            </div>

            <CommunityInterviewTemplate
              sessionId={0} // Will be set after session creation
              propertyLocation={selectedProperty?.location || ''}
              propertyType="residential" // This would be determined from property data
              onGenerateTemplate={handleGenerateTemplate}
              onSaveTemplate={handleSaveTemplate}
              onPreviewTemplate={handlePreviewTemplate}
            />
          </div>
        );

      case 'confirmation':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Review & Confirm</h2>
                <p className="text-muted-foreground">
                  Review your verification request before submitting
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('wizard')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Wizard
                </Button>
                <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Session...' : 'Create Verification Session'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProperty ? (
                      <div className="space-y-2">
                        <h4 className="font-medium">{selectedProperty.title}</h4>
                        <p className="text-sm text-muted-foreground">{selectedProperty.location}</p>
                        <p className="text-sm">KES {selectedProperty.price.toLocaleString()}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No property selected</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Verification Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {verificationRequest ? (
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-2">Monitoring</h5>
                          <p className="text-sm text-muted-foreground">
                            {verificationRequest.monitoringEnabled ? 'Enabled' : 'Disabled'}
                          </p>
                        </div>
                        
                        {verificationRequest.estimatedCompletionDate && (
                          <div>
                            <h5 className="font-medium mb-2">Expected Completion</h5>
                            <p className="text-sm text-muted-foreground">
                              {verificationRequest.estimatedCompletionDate.toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No verification configuration</p>
                    )}
                  </CardContent>
                </Card>

                {communityTemplates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Community Interview Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {communityTemplates.map(template => (
                          <div key={template.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div>
                              <span className="font-medium capitalize">
                                {template.targetAudience.replace('_', ' ')}
                              </span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({template.questions.length} questions)
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handlePreviewTemplate(template)}>
                              Preview
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Once submitted, your verification session will begin processing. 
                    You'll receive updates as each verification layer completes.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">What Happens Next?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Session Created</p>
                        <p className="text-xs text-muted-foreground">
                          Your verification session will be initialized
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Verification Begins</p>
                        <p className="text-xs text-muted-foreground">
                          Selected verification layers will start processing
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Progress Updates</p>
                        <p className="text-xs text-muted-foreground">
                          You'll receive notifications as work completes
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">4</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Final Report</p>
                        <p className="text-xs text-muted-foreground">
                          Comprehensive verification report delivered
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {renderStepContent()}
    </div>
  );
}