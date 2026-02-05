import React, { useState, useCallback, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Home,
  Save,
  Send
} from 'lucide-react'

import { Badge } from '../../../shared/components/ui/badge'
import { Button } from '../../../shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/components/ui/card'
import { Progress } from '../../../shared/components/ui/progress'
import { useToast } from '../../../shared/hooks/use-toast'

import { propertyApi } from '../../services/property-api'
import {
  UnifiedPropertyWizardProps,
  UnifiedPropertyFormData,
  WizardConfig
} from './types'
import {
  enhancedWizardConfig,
  modernWizardConfig,
  getWizardConfigForPropertyType,
  mergeWizardConfig
} from './config'

export function UnifiedPropertyWizard({
  config,
  initialData,
  onSave,
  onPublish,
  onCancel,
  mode = 'create'
}: UnifiedPropertyWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine wizard configuration
  const wizardConfig = useMemo((): WizardConfig => {
    if (config) {
      // If partial config provided, merge with enhanced config
      return mergeWizardConfig(enhancedWizardConfig, config);
    }
    
    // If initial data has property type, use type-specific config
    if (initialData?.propertyType) {
      return getWizardConfigForPropertyType(initialData.propertyType);
    }
    
    // Default to enhanced config
    return enhancedWizardConfig;
  }, [config, initialData?.propertyType]);

  // Current step state (0-based index)
  const [currentStep, setCurrentStep] = useState(0);

  // Form data state
  const [formData, setFormData] = useState<UnifiedPropertyFormData>({
    title: '',
    description: '',
    propertyType: 'apartment',
    location: {
      address: '',
      city: '',
      state: '',
      county: '',
      country: 'Kenya',
    },
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    amenities: [],
    features: [],
    customFeatures: [],
    images: [],
    imageUrls: [],
    documents: [],
    price: 0,
    priceType: 'sale',
    currency: 'KES',
    titleDeed: null,
    surveyPlan: null,
    ownershipProof: null,
    status: 'draft',
    ...initialData,
  });

  // Validation state
  const [stepValidation, setStepValidation] = useState<Record<string, boolean>>({});

  // Update form data
  const updateFormData = useCallback((updates: Partial<UnifiedPropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Validate current step
  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const step = wizardConfig.steps[stepIndex];
      if (!step) return false;

      const isValid = step.validation(formData);
      setStepValidation((prev) => ({ ...prev, [step.id]: isValid }));
      return isValid;
    },
    [formData, wizardConfig.steps]
  );

  // Navigate to step
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= wizardConfig.steps.length) return;

      // Validate current step before moving forward (strict mode only)
      if (wizardConfig.validationMode === 'strict' && stepIndex > currentStep && !validateStep(currentStep)) {
        toast({
          title: 'Please complete required fields',
          description: 'Fill in all required information before proceeding.',
          variant: 'destructive',
        });
        return;
      }

      setCurrentStep(stepIndex);
    },
    [currentStep, validateStep, wizardConfig.validationMode, wizardConfig.steps.length, toast]
  );

  // Navigation handlers
  const goNext = useCallback(() => goToStep(currentStep + 1), [currentStep, goToStep]);
  const goPrevious = useCallback(() => goToStep(currentStep - 1), [currentStep, goToStep]);

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: UnifiedPropertyFormData) => {
      const propertyData = {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        location: data.location,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        area: data.area,
        amenities: data.amenities,
        price: data.price,
        images: data.imageUrls,
        status: 'inactive' as const,
        ownerId: 'current-user', // TODO: Get from auth context
        verificationStatus: 'pending' as const,
      };

      return await propertyApi.createProperty(propertyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: 'Draft saved successfully',
        description: 'Your property listing has been saved as a draft.',
      });
      onSave?.(formData);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save draft',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (data: UnifiedPropertyFormData) => {
      const propertyData = {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        location: data.location,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
        area: data.area,
        amenities: data.amenities,
        price: data.price,
        images: data.imageUrls,
        status: 'active' as const,
        ownerId: 'current-user', // TODO: Get from auth context
        verificationStatus: 'pending' as const,
      };

      return await propertyApi.createProperty(propertyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: 'Property published successfully',
        description: 'Your property listing is now live and pending verification.',
      });
      onPublish?.(formData);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to publish property',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  // Handle save draft
  const handleSaveDraft = useCallback(() => {
    saveDraftMutation.mutate(formData);
  }, [formData, saveDraftMutation]);

  // Handle publish
  const handlePublish = useCallback(() => {
    // Validate all required steps before publishing
    const requiredSteps = wizardConfig.steps.filter(step => step.required);
    const allRequiredStepsValid = requiredSteps.every((step, index) => {
      const stepIndex = wizardConfig.steps.findIndex(s => s.id === step.id);
      return validateStep(stepIndex);
    });

    if (!allRequiredStepsValid) {
      toast({
        title: 'Please complete all required fields',
        description: 'All required sections must be completed before publishing.',
        variant: 'destructive',
      });
      return;
    }

    publishMutation.mutate(formData);
  }, [formData, publishMutation, validateStep, wizardConfig.steps, toast]);

  // Calculate progress
  const progress = ((currentStep + 1) / wizardConfig.steps.length) * 100;

  // Get current step data
  const currentStepData = wizardConfig.steps[currentStep];

  // Render current step content
  const renderStepContent = () => {
    if (!currentStepData) return <div>Invalid step</div>;

    const StepComponent = currentStepData.component;
    return (
      <StepComponent
        data={formData}
        onUpdate={updateFormData}
        onValidation={(isValid) =>
          setStepValidation((prev) => ({ ...prev, [currentStepData.id]: isValid }))
        }
        propertyType={formData.propertyType}
      />
    );
  };

  // Enhanced UI rendering (PropertyWizard style)
  if (wizardConfig.showEnhancedUI) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Home className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {wizardConfig.title}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {wizardConfig.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  Step {currentStep + 1} of {wizardConfig.steps.length}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Navigation */}
            <div className="flex items-center justify-between mb-8 overflow-x-auto">
              {wizardConfig.steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isAccessible = index <= currentStep;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center ${index < wizardConfig.steps.length - 1 ? 'flex-1' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => isAccessible && goToStep(index)}
                        disabled={!isAccessible}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isActive ? 'border-primary bg-primary text-primary-foreground'
                          : isCompleted ? 'border-green-500 bg-green-500 text-white'
                          : 'border-muted-foreground bg-background text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <IconComponent className="w-5 h-5" />
                        )}
                      </button>
                      <span className={`text-xs mt-2 text-center ${
                        isActive ? 'text-primary font-medium'
                        : isCompleted ? 'text-green-600'
                        : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < wizardConfig.steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-500' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentStepData && React.createElement(currentStepData.icon, { className: "w-5 h-5" })}
                  {currentStepData?.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={goPrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === wizardConfig.steps.length - 1 ? (
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {publishMutation.isPending ? 'Publishing...' : 'Submit Listing'}
                </Button>
              ) : (
                <Button onClick={goNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modern UI rendering (PropertyListingWizard style)
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{wizardConfig.title}</h1>
        <p className="text-gray-600">{wizardConfig.subtitle}</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {wizardConfig.steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {wizardConfig.steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = stepValidation[step.id];
              const isAccessible = index <= currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => isAccessible && goToStep(index)}
                  disabled={!isAccessible}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                    ${
                      isActive ? "bg-blue-50 border-blue-200 text-blue-700"
                      : isCompleted ?
                        "bg-green-50 border-green-200 text-green-700"
                      : isAccessible ?
                        "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                  {isCompleted && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
                    >
                      ✓
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStepData && React.createElement(currentStepData.icon, {
              className: "h-5 w-5",
            })}
            {currentStepData?.title}
          </CardTitle>
          <p className="text-gray-600">
            {currentStepData?.description}
          </p>
        </CardHeader>
        <CardContent>{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={goPrevious}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}

              {onCancel && (
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
              </Button>

              {currentStep < wizardConfig.steps.length - 1 ?
                <Button onClick={goNext} className="flex items-center gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              : <Button
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {publishMutation.isPending ?
                    "Publishing..."
                  : "Publish Property"}
                </Button>
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}