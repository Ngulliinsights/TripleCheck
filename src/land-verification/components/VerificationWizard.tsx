import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Progress } from '@shared/components/ui/progress';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Badge } from '@shared/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  FileText, 
  Users, 
  Building,
  Scale,
  UserCheck,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import type { 
  VerificationSessionRequest,
  LayerType,
  Property 
} from '@/types/land-verification';

interface VerificationWizardProps {
  property?: Property;
  onComplete: (request: VerificationSessionRequest) => void;
  onCancel: () => void;
  className?: string;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'property',
    title: 'Property Selection',
    description: 'Select or confirm the property to verify',
    icon: Building,
    required: true
  },
  {
    id: 'documents',
    title: 'Document Upload',
    description: 'Upload property documents for verification',
    icon: FileText,
    required: true
  },
  {
    id: 'location',
    title: 'Location Details',
    description: 'Provide GPS coordinates and boundary information',
    icon: MapPin,
    required: true
  },
  {
    id: 'layers',
    title: 'Verification Layers',
    description: 'Select verification methods to perform',
    icon: CheckCircle,
    required: true
  },
  {
    id: 'community',
    title: 'Community Intelligence',
    description: 'Configure community feedback collection',
    icon: Users,
    required: false
  },
  {
    id: 'experts',
    title: 'Expert Assignment',
    description: 'Request professional expert involvement',
    icon: UserCheck,
    required: false
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review your verification request',
    icon: Scale,
    required: true
  }
];

const VERIFICATION_LAYERS: { id: LayerType; name: string; description: string; estimatedTime: string; cost: string }[] = [
  {
    id: 'registry',
    name: 'Land Registry Verification',
    description: 'Verify ownership records and title deed authenticity',
    estimatedTime: '2-3 days',
    cost: 'KES 5,000'
  },
  {
    id: 'physical',
    name: 'Physical Ground-Truthing',
    description: 'On-site verification of property boundaries and features',
    estimatedTime: '3-5 days',
    cost: 'KES 15,000'
  },
  {
    id: 'government',
    name: 'Government Designations',
    description: 'Check for government restrictions and designations',
    estimatedTime: '1-2 days',
    cost: 'KES 3,000'
  },
  {
    id: 'legal',
    name: 'Legal History Investigation',
    description: 'Search court records and legal disputes',
    estimatedTime: '2-4 days',
    cost: 'KES 8,000'
  },
  {
    id: 'community',
    name: 'Community Intelligence',
    description: 'Gather feedback from local community members',
    estimatedTime: '3-7 days',
    cost: 'KES 10,000'
  },
  {
    id: 'expert',
    name: 'Professional Expert Assessment',
    description: 'Independent assessment by qualified professionals',
    estimatedTime: '5-10 days',
    cost: 'KES 25,000'
  }
];

export default function VerificationWizard({
  property,
  onComplete,
  onCancel,
  className
}: VerificationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    propertyId: property?.id || null,
    selectedLayers: ['registry', 'government'] as LayerType[],
    documents: [],
    coordinates: { lat: '', lng: '' },
    boundaryPoints: [],
    communityConfig: {
      enabled: false,
      targetAudiences: [],
      confidentialityLevel: 'public'
    },
    expertConfig: {
      enabled: false,
      expertTypes: [],
      budget: 50000
    },
    priority: 'medium',
    notes: '',
    estimatedCompletionDate: '',
    monitoringEnabled: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepData = WIZARD_STEPS[currentStep];
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const validateStep = (stepId: string): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepId) {
      case 'property':
        if (!formData.propertyId) {
          newErrors.propertyId = 'Please select a property';
        }
        break;
      case 'documents':
        if (formData.documents.length === 0) {
          newErrors.documents = 'Please upload at least one document';
        }
        break;
      case 'location':
        if (!formData.coordinates.lat || !formData.coordinates.lng) {
          newErrors.coordinates = 'Please provide GPS coordinates';
        }
        break;
      case 'layers':
        if (formData.selectedLayers.length === 0) {
          newErrors.selectedLayers = 'Please select at least one verification layer';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStepData.id)) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep('review')) return;

    setIsSubmitting(true);
    try {
      const request: VerificationSessionRequest = {
        propertyId: formData.propertyId,
        userId: 1, // This would come from auth context
        estimatedCompletionDate: formData.estimatedCompletionDate ? new Date(formData.estimatedCompletionDate) : undefined,
        monitoringEnabled: formData.monitoringEnabled
      };

      await onComplete(request);
    } catch (error) {
      console.error('Error submitting verification request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'property':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="property">Property</Label>
              {property ? (
                <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">{property.title}</h4>
                  <p className="text-sm text-muted-foreground">{property.location}</p>
                  <p className="text-sm text-muted-foreground">KES {property.price.toLocaleString()}</p>
                </div>
              ) : (
                <Select onValueChange={(value) => updateFormData('propertyId', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Sample Property 1</SelectItem>
                    <SelectItem value="2">Sample Property 2</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {errors.propertyId && (
                <p className="text-sm text-red-600 mt-1">{errors.propertyId}</p>
              )}
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-4">
            <div>
              <Label>Required Documents</Label>
              <div className="mt-2 space-y-2">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop files here, or click to browse
                  </p>
                  <Button variant="outline" size="sm">
                    Choose Files
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Supported formats: PDF, JPG, PNG. Max size: 10MB per file.
                </div>
              </div>
              {errors.documents && (
                <p className="text-sm text-red-600 mt-1">{errors.documents}</p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Document Checklist</h4>
              <div className="space-y-2">
                {[
                  'Title Deed',
                  'Survey Plan',
                  'Land Control Board Consent',
                  'Property Tax Records',
                  'Previous Sale Agreements'
                ].map((doc, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox id={`doc-${index}`} />
                    <Label htmlFor={`doc-${index}`} className="text-sm">{doc}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  placeholder="-1.2921"
                  value={formData.coordinates.lat}
                  onChange={(e) => updateFormData('coordinates', { ...formData.coordinates, lat: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  placeholder="36.8219"
                  value={formData.coordinates.lng}
                  onChange={(e) => updateFormData('coordinates', { ...formData.coordinates, lng: e.target.value })}
                />
              </div>
            </div>
            {errors.coordinates && (
              <p className="text-sm text-red-600">{errors.coordinates}</p>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                GPS coordinates help verify the exact location of your property. 
                You can find these using Google Maps or a GPS device.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Boundary Information (Optional)</Label>
              <Textarea
                placeholder="Describe property boundaries, landmarks, or reference points..."
                value={formData.boundaryDescription || ''}
                onChange={(e) => updateFormData('boundaryDescription', e.target.value)}
              />
            </div>
          </div>
        );

      case 'layers':
        return (
          <div className="space-y-4">
            <div>
              <Label>Select Verification Methods</Label>
              <div className="mt-2 space-y-3">
                {VERIFICATION_LAYERS.map((layer) => (
                  <div key={layer.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={layer.id}
                        checked={formData.selectedLayers.includes(layer.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFormData('selectedLayers', [...formData.selectedLayers, layer.id]);
                          } else {
                            updateFormData('selectedLayers', formData.selectedLayers.filter(l => l !== layer.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <Label htmlFor={layer.id} className="font-medium">{layer.name}</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{layer.estimatedTime}</Badge>
                            <Badge variant="outline" className="text-xs">{layer.cost}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{layer.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.selectedLayers && (
                <p className="text-sm text-red-600 mt-1">{errors.selectedLayers}</p>
              )}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Estimated Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Cost:</span>
                  <span className="font-medium ml-2">
                    KES {VERIFICATION_LAYERS
                      .filter(l => formData.selectedLayers.includes(l.id))
                      .reduce((sum, l) => sum + parseInt(l.cost.replace(/[^\d]/g, '')), 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Time:</span>
                  <span className="font-medium ml-2">5-14 days</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'community':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="community-enabled"
                checked={formData.communityConfig.enabled}
                onCheckedChange={(checked) => 
                  updateFormData('communityConfig', { ...formData.communityConfig, enabled: checked })
                }
              />
              <Label htmlFor="community-enabled" className="font-medium">
                Enable Community Intelligence Collection
              </Label>
            </div>

            {formData.communityConfig.enabled && (
              <div className="space-y-4 pl-6">
                <div>
                  <Label>Target Audiences</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      { id: 'neighbors', label: 'Neighboring Property Owners' },
                      { id: 'local_admin', label: 'Local Administration' },
                      { id: 'community_leaders', label: 'Community Leaders' },
                      { id: 'residents', label: 'Long-term Residents' }
                    ].map((audience) => (
                      <div key={audience.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={audience.id}
                          checked={formData.communityConfig.targetAudiences.includes(audience.id)}
                          onCheckedChange={(checked) => {
                            const audiences = checked
                              ? [...formData.communityConfig.targetAudiences, audience.id]
                              : formData.communityConfig.targetAudiences.filter(a => a !== audience.id);
                            updateFormData('communityConfig', { 
                              ...formData.communityConfig, 
                              targetAudiences: audiences 
                            });
                          }}
                        />
                        <Label htmlFor={audience.id} className="text-sm">{audience.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="confidentiality">Confidentiality Level</Label>
                  <Select
                    value={formData.communityConfig.confidentialityLevel}
                    onValueChange={(value) => 
                      updateFormData('communityConfig', { 
                        ...formData.communityConfig, 
                        confidentialityLevel: value 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Names can be disclosed</SelectItem>
                      <SelectItem value="restricted">Restricted - Limited disclosure</SelectItem>
                      <SelectItem value="confidential">Confidential - Anonymous only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        );

      case 'experts':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="experts-enabled"
                checked={formData.expertConfig.enabled}
                onCheckedChange={(checked) => 
                  updateFormData('expertConfig', { ...formData.expertConfig, enabled: checked })
                }
              />
              <Label htmlFor="experts-enabled" className="font-medium">
                Request Professional Expert Involvement
              </Label>
            </div>

            {formData.expertConfig.enabled && (
              <div className="space-y-4 pl-6">
                <div>
                  <Label>Expert Types Needed</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      { id: 'surveyor', label: 'Licensed Surveyor' },
                      { id: 'lawyer', label: 'Property Lawyer' },
                      { id: 'appraiser', label: 'Property Appraiser' },
                      { id: 'environmental', label: 'Environmental Expert' }
                    ].map((expert) => (
                      <div key={expert.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={expert.id}
                          checked={formData.expertConfig.expertTypes.includes(expert.id)}
                          onCheckedChange={(checked) => {
                            const types = checked
                              ? [...formData.expertConfig.expertTypes, expert.id]
                              : formData.expertConfig.expertTypes.filter(t => t !== expert.id);
                            updateFormData('expertConfig', { 
                              ...formData.expertConfig, 
                              expertTypes: types 
                            });
                          }}
                        />
                        <Label htmlFor={expert.id} className="text-sm">{expert.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="expert-budget">Expert Budget (KES)</Label>
                  <Input
                    id="expert-budget"
                    type="number"
                    value={formData.expertConfig.budget}
                    onChange={(e) => 
                      updateFormData('expertConfig', { 
                        ...formData.expertConfig, 
                        budget: parseInt(e.target.value) || 0 
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Verification Request Summary</h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Property</Label>
                    <p className="font-medium">{property?.title || 'Selected Property'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Priority</Label>
                    <Badge variant="outline">{formData.priority.toUpperCase()}</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Selected Verification Layers</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {formData.selectedLayers.map((layerId) => {
                      const layer = VERIFICATION_LAYERS.find(l => l.id === layerId);
                      return (
                        <Badge key={layerId} variant="secondary">
                          {layer?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Community Intelligence</Label>
                    <p className="font-medium">
                      {formData.communityConfig.enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Expert Involvement</Label>
                    <p className="font-medium">
                      {formData.expertConfig.enabled ? 'Requested' : 'Not Requested'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Estimated Cost</Label>
                  <p className="text-lg font-bold">
                    KES {VERIFICATION_LAYERS
                      .filter(l => formData.selectedLayers.includes(l.id))
                      .reduce((sum, l) => sum + parseInt(l.cost.replace(/[^\d]/g, '')), 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="final-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="final-notes"
                placeholder="Any additional instructions or requirements..."
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Land Verification Wizard</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {WIZARD_STEPS.length}: {currentStepData.title}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <currentStepData.icon className="h-5 w-5 text-primary" />
            <span className="font-medium">{currentStepData.title}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentStepData.required && (
              <Badge variant="outline" className="text-xs">Required</Badge>
            )}
          </div>
        </div>

        <p className="text-muted-foreground">{currentStepData.description}</p>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentStep === WIZARD_STEPS.length - 1 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}