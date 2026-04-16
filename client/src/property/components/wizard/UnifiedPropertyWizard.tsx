import React, { useState, useCallback, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle, Home, Save, Send } from 'lucide-react'

import { Badge } from '../../../local/components/ui/badge'
import { Button } from '../../../local/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../local/components/ui/card'
import { Progress } from '../../../local/components/ui/progress'
import { useToast } from '../../../local/hooks/use-toast'

import { propertyApi } from '../../services/property-api'
import type { UnifiedPropertyWizardProps, UnifiedPropertyFormData, WizardConfig } from './types'
import {
  enhancedWizardConfig,
  getWizardConfigForPropertyType,
  mergeWizardConfig,
} from './config'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds the API payload from form data. Centralises the shape in one place. */
function buildPropertyPayload(
  data: UnifiedPropertyFormData,
  status: 'active' | 'inactive',
) {
  return {
    title: data.title,
    description: data.description,
    propertyType: data.propertyType,
    location: data.location,
    bedrooms: data.bedrooms ?? 0,
    bathrooms: data.bathrooms ?? 0,
    area: data.area,
    amenities: data.amenities,
    price: data.price,
    images: data.imageUrls,
    status,
    // TODO: replace with value from auth context (e.g. useAuth().user.id)
    ownerId: 'current-user',
    verificationStatus: 'pending' as const,
  }
}

const DEFAULT_FORM_DATA: UnifiedPropertyFormData = {
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
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UnifiedPropertyWizard({
  config,
  initialData,
  onSave,
  onPublish,
  onCancel,
  mode = 'create',
}: UnifiedPropertyWizardProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Resolve wizard configuration once
  const wizardConfig = useMemo((): WizardConfig => {
    if (config) return mergeWizardConfig(enhancedWizardConfig, config)
    if (initialData?.propertyType) return getWizardConfigForPropertyType(initialData.propertyType)
    return enhancedWizardConfig
  }, [config, initialData?.propertyType])

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<UnifiedPropertyFormData>({
    ...DEFAULT_FORM_DATA,
    ...initialData,
  })
  const [stepValidation, setStepValidation] = useState<Record<string, boolean>>({})

  // ------------------------------------------------------------------
  // Form helpers
  // ------------------------------------------------------------------

  const updateFormData = useCallback((updates: Partial<UnifiedPropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const step = wizardConfig.steps[stepIndex]
      if (!step) return false
      const isValid = step.validation(formData)
      setStepValidation((prev) => ({ ...prev, [step.id]: isValid }))
      return isValid
    },
    [formData, wizardConfig.steps],
  )

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= wizardConfig.steps.length) return

      if (wizardConfig.validationMode === 'strict' && stepIndex > currentStep) {
        if (!validateStep(currentStep)) {
          toast({
            title: 'Please complete required fields',
            description: 'Fill in all required information before proceeding.',
            variant: 'destructive',
          })
          return
        }
      }

      setCurrentStep(stepIndex)
    },
    [currentStep, validateStep, wizardConfig.validationMode, wizardConfig.steps.length, toast],
  )

  const goNext = useCallback(() => goToStep(currentStep + 1), [currentStep, goToStep])
  const goPrevious = useCallback(() => goToStep(currentStep - 1), [currentStep, goToStep])

  // ------------------------------------------------------------------
  // Mutations — share the same API call, differ only in `status`
  // ------------------------------------------------------------------

  const invalidateProperties = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['/api/properties'] }),
    [queryClient],
  )

  const saveDraftMutation = useMutation({
    mutationFn: (data: UnifiedPropertyFormData) =>
      propertyApi.createProperty(buildPropertyPayload(data, 'inactive')),
    onSuccess: () => {
      invalidateProperties()
      toast({ title: 'Draft saved successfully', description: 'Your property has been saved as a draft.' })
      onSave?.(formData)
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save draft', description: error.message || 'Please try again later.', variant: 'destructive' })
    },
  })

  const publishMutation = useMutation({
    mutationFn: (data: UnifiedPropertyFormData) =>
      propertyApi.createProperty(buildPropertyPayload(data, 'active')),
    onSuccess: () => {
      invalidateProperties()
      toast({ title: 'Property published', description: 'Your listing is live and pending verification.' })
      onPublish?.(formData)
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to publish', description: error.message || 'Please try again later.', variant: 'destructive' })
    },
  })

  // ------------------------------------------------------------------
  // Action handlers
  // ------------------------------------------------------------------

  const handleSaveDraft = useCallback(() => {
    saveDraftMutation.mutate(formData)
  }, [formData, saveDraftMutation])

  const handlePublish = useCallback(() => {
    const allRequiredValid = wizardConfig.steps
      .filter((step) => step.required)
      .every((step) => {
        const idx = wizardConfig.steps.findIndex((s) => s.id === step.id)
        return validateStep(idx)
      })

    if (!allRequiredValid) {
      toast({
        title: 'Please complete all required fields',
        description: 'All required sections must be completed before publishing.',
        variant: 'destructive',
      })
      return
    }

    publishMutation.mutate(formData)
  }, [formData, publishMutation, validateStep, wizardConfig.steps, toast])

  // ------------------------------------------------------------------
  // Derived values
  // ------------------------------------------------------------------

  const progress = ((currentStep + 1) / wizardConfig.steps.length) * 100
  const currentStepData = wizardConfig.steps[currentStep]

  const stepContent = useMemo(() => {
    if (!currentStepData) return <p>Invalid step</p>
    const StepComponent = currentStepData.component
    return (
      <StepComponent
        data={formData}
        onUpdate={updateFormData}
        onValidation={(isValid: boolean) =>
          setStepValidation((prev) => ({ ...prev, [currentStepData.id]: isValid }))
        }
        propertyType={formData.propertyType}
      />
    )
  }, [currentStepData, formData, updateFormData])

  // ------------------------------------------------------------------
  // Shared sub-renders
  // ------------------------------------------------------------------

  const progressBar = (
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">
        Step {currentStep + 1} of {wizardConfig.steps.length}
      </span>
      <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
    </div>
  )

  // ------------------------------------------------------------------
  // Enhanced UI (PropertyWizard style)
  // ------------------------------------------------------------------

  if (wizardConfig.showEnhancedUI) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero header */}
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
              <Home className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {wizardConfig.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">{wizardConfig.subtitle}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Progress */}
            <div>
              {progressBar}
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Navigation */}
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {wizardConfig.steps.map((step, index) => {
                const IconComponent = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep
                const isAccessible = index <= currentStep

                return (
                  <div
                    key={step.id}
                    className={`flex items-center ${index < wizardConfig.steps.length - 1 ? 'flex-1' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => isAccessible && goToStep(index)}
                        disabled={!isAccessible}
                        className={[
                          'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : isCompleted
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-muted-foreground bg-background text-muted-foreground',
                        ].join(' ')}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <IconComponent className="w-5 h-5" />
                        )}
                      </button>
                      <span
                        className={[
                          'text-xs mt-2 text-center',
                          isActive
                            ? 'text-primary font-medium'
                            : isCompleted
                              ? 'text-green-600'
                              : 'text-muted-foreground',
                        ].join(' ')}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < wizardConfig.steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Step Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentStepData && React.createElement(currentStepData.icon, { className: 'w-5 h-5' })}
                  {currentStepData?.title}
                </CardTitle>
              </CardHeader>
              <CardContent>{stepContent}</CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={goPrevious} disabled={currentStep === 0}>
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
                  {publishMutation.isPending ? 'Publishing…' : 'Submit Listing'}
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
    )
  }

  // ------------------------------------------------------------------
  // Modern UI (PropertyListingWizard style)
  // ------------------------------------------------------------------

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{wizardConfig.title}</h1>
        <p className="text-gray-600">{wizardConfig.subtitle}</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6 space-y-3">
          {progressBar}
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Step pills */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {wizardConfig.steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = Boolean(stepValidation[step.id])
              const isAccessible = index <= currentStep

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => isAccessible && goToStep(index)}
                  disabled={!isAccessible}
                  className={[
                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                    isActive
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : isCompleted
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : isAccessible
                          ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                  {isCompleted && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      ✓
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStepData && React.createElement(currentStepData.icon, { className: 'h-5 w-5' })}
            {currentStepData?.title}
          </CardTitle>
          {currentStepData?.description && (
            <p className="text-gray-600">{currentStepData.description}</p>
          )}
        </CardHeader>
        <CardContent>{stepContent}</CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={goPrevious} className="flex items-center gap-2">
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
                {saveDraftMutation.isPending ? 'Saving…' : 'Save Draft'}
              </Button>

              {currentStep < wizardConfig.steps.length - 1 ? (
                <Button onClick={goNext} className="flex items-center gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handlePublish}
                  disabled={publishMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {publishMutation.isPending ? 'Publishing…' : 'Publish Property'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}