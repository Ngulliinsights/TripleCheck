import React, { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card";
import { Button } from "@shared/components/ui/button";
import { Progress } from "@shared/components/ui/progress";
import { Badge } from "@shared/components/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import {
  Home,
  MapPin,
  Camera,
  DollarSign,
  FileText,
  Eye,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
} from "lucide-react";

// Import step components
import {
  BasicDetailsStep,
  LocationStep,
  FeaturesStep,
  ImagesStep,
  PricingStep,
  PreviewStep,
} from "./wizard-steps";

// Import types
import { Property } from "../types/property.types";
import { propertyApi } from "../services/property-api";

export interface PropertyFormData {
  // Basic Details
  title: string;
  description: string;
  propertyType: Property["propertyType"];

  // Location
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Features
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  customFeatures: string[];

  // Images
  images: File[];
  imageUrls: string[];

  // Pricing
  price: number;
  priceType: "sale" | "rent";
  currency: string;

  // Status
  status: "draft" | "active";
}

interface PropertyListingWizardProps {
  initialData?: Partial<PropertyFormData>;
  onSave?: (data: PropertyFormData) => void;
  onPublish?: (data: PropertyFormData) => void;
  onCancel?: () => void;
}

const WIZARD_STEPS = [
  {
    id: "basic",
    title: "Basic Details",
    icon: Home,
    description: "Property title, type, and description",
  },
  {
    id: "location",
    title: "Location",
    icon: MapPin,
    description: "Address and map location",
  },
  {
    id: "features",
    title: "Features",
    icon: FileText,
    description: "Bedrooms, bathrooms, and amenities",
  },
  {
    id: "images",
    title: "Images",
    icon: Camera,
    description: "Property photos and virtual tour",
  },
  {
    id: "pricing",
    title: "Pricing",
    icon: DollarSign,
    description: "Price and market insights",
  },
  {
    id: "preview",
    title: "Preview",
    icon: Eye,
    description: "Review and publish",
  },
];

export function PropertyListingWizard({
  initialData,
  onSave,
  onPublish,
  onCancel,
}: PropertyListingWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Current step state
  const [currentStep, setCurrentStep] = useState(0);

  // Form data state
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    propertyType: "apartment",
    location: {
      address: "",
      city: "",
      state: "",
      country: "Kenya",
    },
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    amenities: [],
    customFeatures: [],
    images: [],
    imageUrls: [],
    price: 0,
    priceType: "sale",
    currency: "KES",
    status: "draft",
    ...initialData,
  });

  // Validation state
  const [stepValidation, setStepValidation] = useState<Record<string, boolean>>(
    {}
  );

  // Update form data
  const updateFormData = useCallback((updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Validate current step
  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const step = WIZARD_STEPS[stepIndex];
      let isValid = true;

      if (!step) return false;

      switch (step.id) {
        case "basic":
          isValid = !!(
            formData.title &&
            formData.description &&
            formData.propertyType
          );
          break;
        case "location":
          isValid = !!(formData.location.address && formData.location.city);
          break;
        case "features":
          isValid =
            formData.bedrooms > 0 &&
            formData.bathrooms > 0 &&
            formData.area > 0;
          break;
        case "images":
          isValid = formData.images.length > 0 || formData.imageUrls.length > 0;
          break;
        case "pricing":
          isValid = formData.price > 0;
          break;
        case "preview":
          isValid = true;
          break;
        default:
          isValid = true;
      }

      setStepValidation((prev) => ({ ...prev, [step.id]: isValid }));
      return isValid;
    },
    [formData]
  );

  // Navigate to step
  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= WIZARD_STEPS.length) return;

      // Validate current step before moving forward
      if (stepIndex > currentStep && !validateStep(currentStep)) {
        toast({
          title: "Please complete required fields",
          description: "Fill in all required information before proceeding.",
          variant: "destructive",
        });
        return;
      }

      setCurrentStep(stepIndex);
    },
    [currentStep, validateStep, toast]
  );

  // Navigation handlers
  const goNext = useCallback(
    () => goToStep(currentStep + 1),
    [currentStep, goToStep]
  );
  const goPrevious = useCallback(
    () => goToStep(currentStep - 1),
    [currentStep, goToStep]
  );

  // Save as draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const propertyData = {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        location: data.location,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        amenities: data.amenities,
        price: data.price,
        images: data.imageUrls,
        status: "inactive" as const,
        ownerId: "current-user", // TODO: Get from auth context
        verificationStatus: "pending" as const,
      };

      return await propertyApi.createProperty(propertyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Draft saved successfully",
        description: "Your property listing has been saved as a draft.",
      });
      onSave?.(formData);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save draft",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const propertyData = {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        location: data.location,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        area: data.area,
        amenities: data.amenities,
        price: data.price,
        images: data.imageUrls,
        status: "active" as const,
        ownerId: "current-user", // TODO: Get from auth context
        verificationStatus: "pending" as const,
      };

      return await propertyApi.createProperty(propertyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Property published successfully",
        description:
          "Your property listing is now live and pending verification.",
      });
      onPublish?.(formData);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to publish property",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle save draft
  const handleSaveDraft = useCallback(() => {
    saveDraftMutation.mutate(formData);
  }, [formData, saveDraftMutation]);

  // Handle publish
  const handlePublish = useCallback(() => {
    // Validate all steps before publishing
    const allStepsValid = WIZARD_STEPS.every((_, index) => validateStep(index));

    if (!allStepsValid) {
      toast({
        title: "Please complete all required fields",
        description: "All sections must be completed before publishing.",
        variant: "destructive",
      });
      return;
    }

    publishMutation.mutate(formData);
  }, [formData, publishMutation, validateStep, toast]);

  // Calculate progress
  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  // Render current step content
  const renderStepContent = () => {
    const step = WIZARD_STEPS[currentStep];

    if (!step) return <div>Invalid step</div>;

    switch (step.id) {
      case "basic":
        return (
          <BasicDetailsStep
            data={formData}
            onUpdate={updateFormData}
            onValidation={(isValid) =>
              setStepValidation((prev) => ({ ...prev, basic: isValid }))
            }
          />
        );
      case "location":
        return (
          <LocationStep
            data={formData}
            onUpdate={updateFormData}
            onValidation={(isValid) =>
              setStepValidation((prev) => ({ ...prev, location: isValid }))
            }
          />
        );
      case "features":
        return (
          <FeaturesStep
            data={formData}
            onUpdate={updateFormData}
            onValidation={(isValid) =>
              setStepValidation((prev) => ({ ...prev, features: isValid }))
            }
          />
        );
      case "images":
        return (
          <ImagesStep
            data={formData}
            onUpdate={updateFormData}
            onValidation={(isValid) =>
              setStepValidation((prev) => ({ ...prev, images: isValid }))
            }
          />
        );
      case "pricing":
        return (
          <PricingStep
            data={formData}
            onUpdate={updateFormData}
            onValidation={(isValid) =>
              setStepValidation((prev) => ({ ...prev, pricing: isValid }))
            }
          />
        );
      case "preview":
        return (
          <PreviewStep
            data={formData}
            onUpdate={updateFormData}
            onValidation={(isValid) =>
              setStepValidation((prev) => ({ ...prev, preview: isValid }))
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">List Your Property</h1>
        <p className="text-gray-600">
          Create a comprehensive listing to attract verified buyers and tenants
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {WIZARD_STEPS.length}
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
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = stepValidation[step.id];
              const isAccessible = index <= currentStep;

              return (
                <button
                  key={step.id}
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
            {WIZARD_STEPS[currentStep] && React.createElement(WIZARD_STEPS[currentStep].icon, {
              className: "h-5 w-5",
            })}
            {WIZARD_STEPS[currentStep]?.title}
          </CardTitle>
          <p className="text-gray-600">
            {WIZARD_STEPS[currentStep]?.description}
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

              {currentStep < WIZARD_STEPS.length - 1 ?
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
