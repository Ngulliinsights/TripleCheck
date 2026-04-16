/**
 * Centralized Image Types
 * 
 * This file consolidates all image-related types to ensure consistency
 * across the image management system and prevent circular dependencies.
 */

// Export unified types (new consolidated approach)
export * from './unified'

// Legacy types (kept for backward compatibility during migration)
export interface PropertyImage {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'processing' | 'uploaded' | 'error' | 'paused';
  progress?: number;
  uploadSpeed?: number;
  sessionId?: string;
  documentType?: DocumentType;
  landVerificationId?: string;
  metadata?: PropertyImageMetadata;
  validationResult?: ValidationResult;
  documentAuthResult?: DocumentAuthResult;
  fraudDetectionScore?: number;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'requires_review' | 'compliance_hold';
  complianceFlags?: string[];
  regulatoryFlags?: string[];
  virusScanResult?: ScanResult;
  optimizedReference?: string;
  thumbnailReferences?: string[];
  // Additional fields expected by hook
  chunks?: ImageChunk[];
  retryCount?: number;
  tags?: string[];
  aiTags?: AITag[];
  version?: number;
  storageClass?: string;
  auditTrail?: any[];
  assignedTo?: string[];
  collections?: string[];
  usageStats?: {
    views: number;
    downloads: number;
    shares: number;
  };
  startTime?: number;
  endTime?: number;
  isPrimary?: boolean;
}

export interface PropertyImageMetadata {
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  technicalMetadata: TechnicalMetadata;
  geoLocation?: GeoLocation;
  captureDate?: number;
  createdAt: number;
  lastModified: number;
  deviceInfo?: DeviceInfo;
  faces?: number;
  objects?: string[];
  dominantColors?: string[];
  hasTransparency?: boolean;
}

export interface TechnicalMetadata {
  format: string;
  colorSpace: string;
  bitDepth: number;
  compression: string;
  orientation: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface DeviceInfo {
  make: string;
  model: string;
  software: string;
}

export type DocumentType = 
  | 'property_photo'
  | 'title_deed'
  | 'survey_plan'
  | 'valuation_report'
  | 'identification_document'
  | 'other_document';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: PropertyImageMetadata;
  documentAuthResult?: DocumentAuthResult;
  fraudRiskScore?: number;
}

export interface ValidationOptions {
  maxFileSize?: number;
  allowedFormats?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  requireGeoLocation?: boolean;
  requireAspectRatio?: number;
  maxAspectRatioDeviation?: number;
}

export interface DocumentAuthResult {
  isAuthentic: boolean;
  confidence: number;
  documentType: DocumentType;
  anomalies: string[];
  verificationMethod: string;
}

export interface AITag {
  label: string;
  confidence: number;
  source: 'vision' | 'content' | 'metadata';
  timestamp: Date;
}

export interface ScanResult {
  clean: boolean;
  threats: string[];
  scanDate: Date;
  scanDuration: number;
  engine: string;
  signatureVersion: string;
}

export interface ComplianceResult {
  complianceFlags: string[];
  regulatoryFlags: string[];
}

export type ProcessingStep = 
  | 'validation'
  | 'virus_scan'
  | 'metadata_extraction'
  | 'compliance_check'
  | 'document_auth'
  | 'fraud_detection'
  | 'image_optimization'
  | 'thumbnail_generation';

export interface WorkflowStatus {
  imageId: string;
  currentStep: ProcessingStep;
  completedSteps: ProcessingStep[];
  failedSteps: ProcessingStep[];
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress?: number;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface UploadProgress {
  sessionId: string;
  imageId: string;
  progress: number;
  uploadSpeed: number;
  estimatedTimeRemaining?: number;
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  chunksCompleted: number;
  totalChunks: number;
  bytesUploaded: number;
  totalBytes: number;
}

export interface UploadSession {
  id: string;
  imageId: string;
  chunks: ImageChunk[];
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  uploadSpeed: number;
  estimatedTimeRemaining?: number;
  startTime: number;
  endTime?: number;
  error?: string;
  documentType?: DocumentType;
  landVerificationId?: string;
}

export interface ImageChunk {
  id: string;
  index: number;
  data: Blob;
  size: number;
  hash?: string;
  uploaded?: boolean;
  retryCount?: number;
  uploadTime?: number;
}

export interface ImageServiceConfig {
  upload: {
    chunkSize: number;
    maxConcurrentUploads: number;
    maxRetries: number;
    retryDelay: number;
    timeout: number;
  };
  validation: {
    maxFileSize: number;
    allowedFormats: string[];
    requireGeoLocation: boolean;
    documentAuthEnabled: boolean;
    fraudDetectionEnabled: boolean;
  };
  processing: {
    enableAITagging: boolean;
    enableVirusScanning: boolean;
    enableComplianceCheck: boolean;
    thumbnailSizes: number[];
    optimizationQuality: number;
  };
  storage: {
    provider: string;
    bucket?: string;
    region?: string;
    encryption: boolean;
    redundancy: string;
  };
  integrations: {
    documentAuth: {
      enabled: boolean;
      endpoint: string;
      apiKey?: string;
    };
    fraudDetection: {
      enabled: boolean;
      endpoint: string;
      apiKey?: string;
    };
    landVerification: {
      enabled: boolean;
      endpoint: string;
      apiKey?: string;
    };
  };
}

// Error classes
export class ImageProcessingError extends Error {
  constructor(
    message: string,
    public code: string,
    public imageId?: string,
    public step?: ProcessingStep,
    public retryable?: boolean
  ) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

// Constants
export const PROCESSING_STEPS_ORDER: ProcessingStep[] = [
  'validation',
  'virus_scan',
  'metadata_extraction',
  'compliance_check',
  'document_auth',
  'fraud_detection',
  'image_optimization',
  'thumbnail_generation'
];

export const DOCUMENT_VALIDATION_PROFILES: Record<DocumentType, ValidationOptions> = {
  property_photo: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
    minWidth: 800,
    minHeight: 600,
    requireGeoLocation: true,
  },
  title_deed: {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    minWidth: 1200,
    minHeight: 1600,
  },
  survey_plan: {
    maxFileSize: 30 * 1024 * 1024, // 30MB
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'tiff'],
    minWidth: 1500,
    minHeight: 1000,
  },
  valuation_report: {
    maxFileSize: 15 * 1024 * 1024, // 15MB
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
  },
  identification_document: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    minWidth: 600,
    minHeight: 400,
  },
  other_document: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    allowedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'tiff'],
  },
};