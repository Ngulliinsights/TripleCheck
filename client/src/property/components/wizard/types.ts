import { LucideIcon } from 'lucide-react'
import { Property } from '../../types/property.types'

// Unified form data interface
export interface UnifiedPropertyFormData {
  // Basic Details
  title: string;
  description: string;
  propertyType: Property["propertyType"];

  // Location
  location: {
    address: string;
    city: string;
    state: string;
    county: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Features (conditional based on property type)
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  size?: string; // For backward compatibility
  amenities: string[];
  features: string[]; // For backward compatibility
  customFeatures: string[];

  // Images & Media
  images: File[];
  imageUrls: string[];
  documents: File[];

  // Pricing
  price: number;
  priceString?: string; // For backward compatibility
  priceType: "sale" | "rent";
  currency: string;

  // Verification Documents (for enhanced verification)
  titleDeed: File | null;
  surveyPlan: File | null;
  ownershipProof: File | null;

  // Status
  status: "draft" | "active";
}

// Step configuration interface
export interface WizardStepConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  required: boolean;
  component: React.ComponentType<WizardStepProps>;
  validation: (data: UnifiedPropertyFormData) => boolean;
  propertyTypes?: Property["propertyType"][]; // If specified, only show for these types
}

// Step component props interface
export interface WizardStepProps {
  data: UnifiedPropertyFormData;
  onUpdate: (updates: Partial<UnifiedPropertyFormData>) => void;
  onValidation?: (isValid: boolean) => void;
  propertyType: Property["propertyType"];
}

// Wizard configuration interface
export interface WizardConfig {
  title: string;
  subtitle: string;
  steps: WizardStepConfig[];
  showDocumentVerification: boolean;
  showEnhancedUI: boolean;
  validationMode: 'strict' | 'lenient';
}

// Wizard props interface
export interface UnifiedPropertyWizardProps {
  config?: Partial<WizardConfig>;
  initialData?: Partial<UnifiedPropertyFormData>;
  onSave?: (data: UnifiedPropertyFormData) => void;
  onPublish?: (data: UnifiedPropertyFormData) => void;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

// Property type specific configurations
export type PropertyTypeWizardConfig = {
  [K in Property["propertyType"]]: WizardConfig;
};