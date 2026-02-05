import {
  Home,
  MapPin,
  FileText,
  Camera,
  Shield,
  CheckCircle,
  DollarSign,
  Eye
} from 'lucide-react'

import {
  BasicDetailsStep,
  LocationStep,
  FeaturesStep,
  ImagesStep,
  DocumentationStep,
  PreviewStep
} from './steps'
import { WizardConfig, WizardStepConfig, PropertyTypeWizardConfig, UnifiedPropertyFormData } from './types'

// Step validation functions
const validateBasicDetails = (data: UnifiedPropertyFormData): boolean => {
  return !!(data.title && data.description && data.propertyType);
};

const validateLocation = (data: UnifiedPropertyFormData): boolean => {
  return !!(data.location.address && data.location.city);
};

const validateFeatures = (data: UnifiedPropertyFormData): boolean => {
  const RESIDENTIAL_TYPES = ['apartment', 'house', 'villa', 'townhouse'];
  const isResidential = data.propertyType && RESIDENTIAL_TYPES.includes(data.propertyType);

  let isValid = data.area > 0 && data.price > 0;

  if (isResidential) {
    isValid = isValid && (data.bedrooms || 0) > 0 && (data.bathrooms || 0) > 0;
  }

  return isValid;
};

const validateImages = (data: UnifiedPropertyFormData): boolean => {
  return (data.images?.length || 0) > 0 || (data.imageUrls?.length || 0) > 0;
};

const validateDocumentation = (_data: UnifiedPropertyFormData): boolean => {
  // Documentation is optional by default
  return true;
};

const validatePreview = (_data: UnifiedPropertyFormData): boolean => {
  return true;
};

// Base step configurations
const baseSteps: WizardStepConfig[] = [
  {
    id: 'basic',
    title: 'Basic Information',
    icon: Home,
    description: 'Property title, type, and description',
    required: true,
    component: BasicDetailsStep,
    validation: validateBasicDetails
  },
  {
    id: 'location',
    title: 'Location Details',
    icon: MapPin,
    description: 'Address and map location',
    required: true,
    component: LocationStep,
    validation: validateLocation
  },
  {
    id: 'features',
    title: 'Property Details',
    icon: FileText,
    description: 'Bedrooms, bathrooms, and amenities',
    required: true,
    component: FeaturesStep,
    validation: validateFeatures
  },
  {
    id: 'images',
    title: 'Photos & Media',
    icon: Camera,
    description: 'Property photos and virtual tour',
    required: true,
    component: ImagesStep,
    validation: validateImages
  },
  {
    id: 'documentation',
    title: 'Documentation',
    icon: Shield,
    description: 'Verification documents and ownership proof',
    required: false,
    component: DocumentationStep,
    validation: validateDocumentation
  },
  {
    id: 'preview',
    title: 'Review & Submit',
    icon: CheckCircle,
    description: 'Review and publish your listing',
    required: true,
    component: PreviewStep,
    validation: validatePreview
  }
];

// Modern step configurations (for PropertyListingWizard compatibility)
const modernSteps: WizardStepConfig[] = [
  {
    id: 'basic',
    title: 'Basic Details',
    icon: Home,
    description: 'Property title, type, and description',
    required: true,
    component: BasicDetailsStep,
    validation: validateBasicDetails
  },
  {
    id: 'location',
    title: 'Location',
    icon: MapPin,
    description: 'Address and map location',
    required: true,
    component: LocationStep,
    validation: validateLocation
  },
  {
    id: 'features',
    title: 'Features',
    icon: FileText,
    description: 'Bedrooms, bathrooms, and amenities',
    required: true,
    component: FeaturesStep,
    validation: validateFeatures
  },
  {
    id: 'images',
    title: 'Images',
    icon: Camera,
    description: 'Property photos and virtual tour',
    required: true,
    component: ImagesStep,
    validation: validateImages
  },
  {
    id: 'pricing',
    title: 'Pricing',
    icon: DollarSign,
    description: 'Price and market insights',
    required: true,
    component: FeaturesStep, // Reuse features step for pricing
    validation: (data) => data.price > 0
  },
  {
    id: 'preview',
    title: 'Preview',
    icon: Eye,
    description: 'Review and publish',
    required: true,
    component: PreviewStep,
    validation: validatePreview
  }
];

// Default configurations for different property types
export const defaultWizardConfigs: PropertyTypeWizardConfig = {
  apartment: {
    title: 'List Your Apartment',
    subtitle: 'Step-by-step guided process to create comprehensive apartment listings',
    steps: baseSteps,
    showDocumentVerification: false,
    showEnhancedUI: true,
    validationMode: 'strict'
  },
  house: {
    title: 'List Your House',
    subtitle: 'Step-by-step guided process to create comprehensive house listings',
    steps: baseSteps,
    showDocumentVerification: false,
    showEnhancedUI: true,
    validationMode: 'strict'
  },
  villa: {
    title: 'List Your Villa',
    subtitle: 'Step-by-step guided process to create comprehensive villa listings',
    steps: baseSteps,
    showDocumentVerification: false,
    showEnhancedUI: true,
    validationMode: 'strict'
  },
  townhouse: {
    title: 'List Your Townhouse',
    subtitle: 'Step-by-step guided process to create comprehensive townhouse listings',
    steps: baseSteps,
    showDocumentVerification: false,
    showEnhancedUI: true,
    validationMode: 'strict'
  },
  land: {
    title: 'List Your Land',
    subtitle: 'Step-by-step guided process to create comprehensive land listings',
    steps: baseSteps, // Land properties can use all steps
    showDocumentVerification: true, // Documentation is especially important for land
    showEnhancedUI: true,
    validationMode: 'strict'
  },
  commercial: {
    title: 'List Your Commercial Property',
    subtitle: 'Step-by-step guided process to create comprehensive commercial listings',
    steps: baseSteps,
    showDocumentVerification: false,
    showEnhancedUI: true,
    validationMode: 'strict'
  },
  office: {
    title: 'List Your Office Space',
    subtitle: 'Step-by-step guided process to create comprehensive office listings',
    steps: baseSteps,
    showDocumentVerification: false,
    showEnhancedUI: true,
    validationMode: 'strict'
  },
  warehouse: {
    title: 'List Your Warehouse',
    subtitle: 'Step-by-step guided process to create comprehensive warehouse listings',
    steps: baseSteps,
    showDocumentVerification: false,
    showEnhancedUI: true,
    validationMode: 'strict'
  }
};

// Modern configuration (PropertyListingWizard style)
export const modernWizardConfig: WizardConfig = {
  title: 'List Your Property',
  subtitle: 'Create a comprehensive listing to attract verified buyers and tenants',
  steps: modernSteps,
  showDocumentVerification: false,
  showEnhancedUI: false,
  validationMode: 'lenient'
};

// Enhanced configuration (PropertyWizard style)
export const enhancedWizardConfig: WizardConfig = {
  title: 'List Your Property',
  subtitle: 'Step-by-step guided process to create comprehensive and verified property listings',
  steps: baseSteps,
  showDocumentVerification: true,
  showEnhancedUI: true,
  validationMode: 'strict'
};

// Utility function to get configuration for property type
export function getWizardConfigForPropertyType(propertyType: keyof PropertyTypeWizardConfig): WizardConfig {
  if (propertyType && Object.prototype.hasOwnProperty.call(defaultWizardConfigs, propertyType)) {
    return defaultWizardConfigs[propertyType];
  }
  return enhancedWizardConfig;
}

// Utility function to merge configurations
export function mergeWizardConfig(base: WizardConfig, overrides: Partial<WizardConfig>): WizardConfig {
  return {
    ...base,
    ...overrides,
    steps: overrides.steps || base.steps
  };
}