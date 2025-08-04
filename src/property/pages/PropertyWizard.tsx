import { 
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  DollarSign,
  FileText,
  Home, 
  MapPin, 
  Shield,
  Upload,
  type LucideProps,
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Progress } from '../../shared/components/ui/progress';
import { Textarea } from '../../shared/components/ui/textarea';

interface PropertyData {
  // Basic Info
  title: string;
  description: string;
  propertyType: string;
  
  // Location
  address: string;
  city: string;
  county: string;
  coordinates?: { lat: number; lng: number };
  
  // Details
  price: string;
  size: string;
  bedrooms?: string;
  bathrooms?: string;
  features: string[];
  
  // Media
  images: File[];
  documents: File[];
  
  // Verification
  titleDeed: File | null;
  surveyPlan: File | null;
  ownershipProof: File | null;
}

// Using the correct Lucide React type to resolve TypeScript compatibility issues
interface Step {
  id: number;
  title: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

const STEPS: Step[] = [
  { id: 1, title: 'Basic Information', icon: Home },
  { id: 2, title: 'Location Details', icon: MapPin },
  { id: 3, title: 'Property Details', icon: FileText },
  { id: 4, title: 'Photos & Media', icon: Camera },
  { id: 5, title: 'Documentation', icon: Shield },
  { id: 6, title: 'Review & Submit', icon: CheckCircle }
];

const PROPERTY_TYPES = [
  { value: '', label: 'Select property type' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' }
];

const COUNTIES = [
  { value: '', label: 'Select county' },
  { value: 'nairobi', label: 'Nairobi' },
  { value: 'kiambu', label: 'Kiambu' },
  { value: 'machakos', label: 'Machakos' },
  { value: 'kajiado', label: 'Kajiado' },
  { value: 'mombasa', label: 'Mombasa' },
  { value: 'nakuru', label: 'Nakuru' },
  { value: 'kisumu', label: 'Kisumu' }
];

const RESIDENTIAL_TYPES = ['apartment', 'house', 'villa', 'townhouse'];

const PROPERTY_FEATURES = [
  'Swimming Pool', 'Gym', 'Parking', 'Garden', 'Balcony',
  'Security', 'Generator', 'Water Supply', 'Internet', 'Furnished'
];

export default function PropertyWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyData, setPropertyData] = useState<PropertyData>({
    title: '',
    description: '',
    propertyType: '',
    address: '',
    city: '',
    county: '',
    price: '',
    size: '',
    bedrooms: '',
    bathrooms: '',
    features: [],
    images: [],
    documents: [],
    titleDeed: null,
    surveyPlan: null,
    ownershipProof: null
  });

  // Memoized update function to prevent unnecessary re-renders
  const updatePropertyData = useCallback((updates: Partial<PropertyData>) => {
    setPropertyData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Separate methods for adding and removing features to address ESLint selector parameter rule
  const addFeature = useCallback((feature: string) => {
    updatePropertyData({
      features: [...propertyData.features, feature]
    });
  }, [propertyData.features, updatePropertyData]);

  const removeFeature = useCallback((feature: string) => {
    updatePropertyData({
      features: propertyData.features.filter(f => f !== feature)
    });
  }, [propertyData.features, updatePropertyData]);

  // Handler that determines which action to take based on checkbox state
  const handleFeatureChange = useCallback((feature: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      addFeature(feature);
    } else {
      removeFeature(feature);
    }
  }, [addFeature, removeFeature]);

  const progress = (currentStep / STEPS.length) * 100;

  // Helper function to determine step status for cleaner conditional logic
  const getStepStatus = (stepId: number) => {
    if (currentStep === stepId) return 'active';
    if (currentStep > stepId) return 'completed';
    return 'pending';
  };

  // Step content renderers extracted to separate functions for better organization
  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Property Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Modern 3-Bedroom Apartment in Westlands"
          value={propertyData.title}
          onChange={(e) => updatePropertyData({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe your property in detail..."
          rows={4}
          value={propertyData.description}
          onChange={(e) => updatePropertyData({ description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="propertyType">Property Type *</Label>
        <select
          id="propertyType"
          title="Select the type of property you are listing"
          value={propertyData.propertyType}
          onChange={(e) => updatePropertyData({ propertyType: e.target.value })}
          className="w-full p-2 border border-input rounded-md bg-background"
        >
          {PROPERTY_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderLocationStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="address">Street Address *</Label>
        <Input
          id="address"
          placeholder="e.g., 123 Westlands Avenue"
          value={propertyData.address}
          onChange={(e) => updatePropertyData({ address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="e.g., Nairobi"
            value={propertyData.city}
            onChange={(e) => updatePropertyData({ city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="county">County *</Label>
          <select
            id="county"
            title="Select the county where your property is located"
            value={propertyData.county}
            onChange={(e) => updatePropertyData({ county: e.target.value })}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            {COUNTIES.map(county => (
              <option key={county.value} value={county.value}>
                {county.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Location on Map</h4>
        <div className="h-48 bg-background border rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Interactive map will be displayed here
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              Set Location on Map
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPropertyDetailsStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="price">Price (KSH) *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="price"
            type="number"
            placeholder="e.g., 15000000"
            value={propertyData.price}
            onChange={(e) => updatePropertyData({ price: e.target.value })}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="size">Size *</Label>
        <Input
          id="size"
          placeholder="e.g., 150 sqm or 2 acres"
          value={propertyData.size}
          onChange={(e) => updatePropertyData({ size: e.target.value })}
        />
      </div>

      {RESIDENTIAL_TYPES.includes(propertyData.propertyType) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              placeholder="e.g., 3"
              value={propertyData.bedrooms}
              onChange={(e) => updatePropertyData({ bedrooms: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              placeholder="e.g., 2"
              value={propertyData.bathrooms}
              onChange={(e) => updatePropertyData({ bathrooms: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Features & Amenities</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PROPERTY_FEATURES.map((feature) => (
            <label key={feature} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={propertyData.features.includes(feature)}
                onChange={(e) => handleFeatureChange(feature, e)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{feature}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMediaStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium">Property Photos *</h4>
        <p className="text-sm text-muted-foreground">
          Upload high-quality photos of your property. The first photo will be used as the main image.
        </p>
        
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            Drag and drop photos here, or click to browse
          </p>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Choose Photos
          </Button>
        </div>

        {propertyData.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {propertyData.images.map((image, index) => (
              <div key={index} className="relative">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                {index === 0 && (
                  <Badge className="absolute top-2 left-2 text-xs">Main</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Additional Media</h4>
        <p className="text-sm text-muted-foreground">
          Upload videos, floor plans, or other relevant documents.
        </p>
        
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload Files
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDocumentationStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Document Verification</h4>
        <p className="text-sm text-blue-800">
          Upload the required documents to verify your property ownership and enable faster verification.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="titleDeed">Title Deed *</Label>
          <div className="border border-input rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm">Upload title deed document</span>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="surveyPlan">Survey Plan</Label>
          <div className="border border-input rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm">Upload survey plan (optional)</span>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownershipProof">Proof of Ownership</Label>
          <div className="border border-input rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm">Additional ownership documents</span>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Verification Benefits</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Faster property verification process</li>
          <li>• Higher trust score and credibility</li>
          <li>• Priority listing in search results</li>
          <li>• Access to premium features</li>
        </ul>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Review Your Listing</h3>
        <p className="text-muted-foreground">
          Please review all information before submitting your property listing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Basic Information</h4>
              <p className="text-sm text-muted-foreground">Title: {propertyData.title}</p>
              <p className="text-sm text-muted-foreground">Type: {propertyData.propertyType}</p>
              <p className="text-sm text-muted-foreground">Price: KSH {propertyData.price}</p>
            </div>
            <div>
              <h4 className="font-medium">Location</h4>
              <p className="text-sm text-muted-foreground">{propertyData.address}</p>
              <p className="text-sm text-muted-foreground">{propertyData.city}, {propertyData.county}</p>
            </div>
          </div>

          {propertyData.features.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <div className="flex flex-wrap gap-2">
                {propertyData.features.map((feature) => (
                  <Badge key={feature} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Next Steps</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Your listing will be reviewed within 24 hours</li>
          <li>• You&apos;ll receive email updates on the verification status</li>
          <li>• Once approved, your property will be live on the platform</li>
        </ul>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderBasicInfoStep();
      case 2: return renderLocationStep();
      case 3: return renderPropertyDetailsStep();
      case 4: return renderMediaStep();
      case 5: return renderDocumentationStep();
      case 6: return renderReviewStep();
      default: return null;
    }
  };

  // Safe access to current step with guaranteed non-undefined result
  const getCurrentStepData = (): Step => {
    const stepData = STEPS.find(step => step.id === currentStep);
    // This ensures we always return a valid Step object, preventing undefined access
    return stepData || STEPS[0]!;
  };

  const currentStepData = getCurrentStepData();

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
              List Your Property
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Step-by-step guided process to create comprehensive and verified property listings.
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
                Step {currentStep} of {STEPS.length}
              </h2>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between mb-8 overflow-x-auto">
            {STEPS.map((step, index) => {
              const IconComponent = step.icon;
              const stepStatus = getStepStatus(step.id);
              
              // Extract step styling logic for clarity
              const getStepClasses = () => {
                switch (stepStatus) {
                  case 'active':
                    return 'border-primary bg-primary text-primary-foreground';
                  case 'completed':
                    return 'border-green-500 bg-green-500 text-white';
                  default:
                    return 'border-muted-foreground bg-background text-muted-foreground';
                }
              };

              const getTextClasses = () => {
                switch (stepStatus) {
                  case 'active':
                    return 'text-primary font-medium';
                  case 'completed':
                    return 'text-green-600';
                  default:
                    return 'text-muted-foreground';
                }
              };
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${getStepClasses()}`}>
                      {stepStatus === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <IconComponent className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center ${getTextClasses()}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      stepStatus === 'completed' ? 'bg-green-500' : 'bg-muted'
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
                {React.createElement(currentStepData.icon, { className: "w-5 h-5" })}
                {currentStepData.title}
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
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === STEPS.length ? (
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Listing
              </Button>
            ) : (
              <Button onClick={nextStep}>
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