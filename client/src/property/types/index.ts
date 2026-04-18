// Property domain specific types
export * from '@shared/types/property'

export interface PropertyDocument {
  id: string;
  propertyId: string;
  documentType: 'title_deed' | 'survey_plan' | 'sale_agreement' | 'id_copy' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationResults?: DocumentVerificationResult | undefined;
}

export interface DocumentVerificationStatus {
  status: 'pending' | 'verified' | 'rejected';
  confidence?: number | undefined;
  findings?: string[] | undefined;
  verifiedAt?: Date | undefined;
}

export interface DocumentVerificationResult {
  id: string;
  documentId: string;
  status: 'verified' | 'pending' | 'failed' | 'suspicious';
  confidence: number;
  findings: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface PropertySearchFilters {
  query?: string | undefined;
  location?: string | undefined;
  priceMin?: number | undefined;
  priceMax?: number | undefined;
  propertyType?: string | undefined;
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  landVerified?: boolean | undefined;
  landRiskLevel?: 'low' | 'medium' | 'high' | 'critical' | undefined;
}

export interface PropertyListingData {
  title: string;
  description: string;
  price: number;
  location: string;
  propertyType: string;
  bedrooms?: number | undefined;
  bathrooms?: number | undefined;
  squareFeet?: number | undefined;
  amenities?: string[] | undefined;
  images?: string[] | undefined;
}

export interface LandFeatures {
  size: number; // in acres or square meters
  topography: "flat" | "hilly" | "mountainous" | "valley";
  soilType?: string | undefined;
  waterAccess?: boolean | undefined;
  roadAccess?: boolean | undefined;
  utilities?: string[] | undefined;
  zoning?: string | undefined;
  developmentPotential?: string | undefined;
}
