/**
 * Property Image Validation Service - Refactored
 * 
 * Focused service that handles only validation operations.
 * Uses shared core to eliminate duplication while maintaining clear boundaries.
 */

import { ImageServiceCore, ImageServiceRegistry } from './core/ImageServiceCore'
import type {
  ValidationResult,
  ValidationOptions,
  PropertyImageMetadata,
  DocumentType,
  DocumentAuthResult,
  ImageServiceConfig,
} from '../../types/images'
import { DOCUMENT_VALIDATION_PROFILES } from '../../types/images'
import { ImageUtils } from '../../utils/images/unified-utils'

export interface IPropertyImageValidationService {
  validateFile(file: File, options?: ValidationOptions, documentType?: DocumentType): Promise<ValidationResult>;
  validateUrl(url: string, options?: ValidationOptions): Promise<ValidationResult>;
  validateBatch(files: File[], options?: ValidationOptions, onProgress?: (completed: number, total: number) => void): Promise<{ [fileName: string]: ValidationResult }>;
  getValidationProfile(documentType: DocumentType): ValidationOptions;
}

export interface ValidationDependencies {
  documentAuthService?: {
    authenticateDocument: (file: File, documentType: DocumentType) => Promise<DocumentAuthResult>;
  };
  fraudDetectionService?: {
    analyzeFraudRisk: (file: File, metadata: PropertyImageMetadata) => Promise<number>;
  };
  geoLocationService?: {
    validateLocation: (latitude: number, longitude: number, expectedRegion?: string) => Promise<boolean>;
  };
}

export class PropertyImageValidationService extends ImageServiceCore implements IPropertyImageValidationService {
  readonly serviceName = 'PropertyImageValidationService';
  readonly version = '2.0.0';

  constructor(
    private dependencies: ValidationDependencies = {},
    config?: ImageServiceConfig
  ) {
    super(config, ImageServiceRegistry.getInstance().getAuditService());
  }

  async validateFile(
    file: File,
    options?: ValidationOptions,
    documentType?: DocumentType
  ): Promise<ValidationResult> {
    const validationOptions = options || this.getValidationProfile(documentType || 'other_document');
    
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      await this.logEvent('validation_started', {
        fileName: file.name,
        fileSize: file.size,
        documentType: documentType || 'unknown',
      });

      // Use shared validation helpers
      if (!this.validateFileSize(file.size)) {
        result.isValid = false;
        result.errors.push(
          `File size (${ImageUtils.formatFileSize(file.size)}) exceeds maximum allowed size (${ImageUtils.formatFileSize(this.config.validation.maxFileSize)})`
        );
      }

      if (!this.validateFileFormat(file.name)) {
        result.isValid = false;
        result.errors.push(
          `File format '${ImageUtils.getFileExtension(file.name)}' is not allowed. Allowed formats: ${this.config.validation.allowedFormats.join(', ')}`
        );
      }

      // MIME type validation
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
        result.isValid = false;
        result.errors.push('File is not a valid image or PDF document');
        return result;
      }

      // Extract metadata using shared helper
      const metadata = await this.extractImageMetadata(file);
      result.metadata = metadata;

      // Perform advanced validations
      await this.performAdvancedValidations(file, metadata, result, documentType);

      await this.logEvent('validation_completed', {
        fileName: file.name,
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        documentType: documentType || 'unknown',
      });

      return result;
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      await this.logEvent('validation_error', {
        fileName: file.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        documentType: documentType || 'unknown',
      });

      return result;
    }
  }

  async validateUrl(url: string, options?: ValidationOptions): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!url) {
      result.isValid = false;
      result.errors.push('No URL provided');
      return result;
    }

    try {
      new URL(url);
    } catch {
      result.isValid = false;
      result.errors.push('Invalid URL format');
      return result;
    }

    // URL validation implementation would go here
    return result;
  }

  async validateBatch(
    files: File[],
    options?: ValidationOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ [fileName: string]: ValidationResult }> {
    const results: { [fileName: string]: ValidationResult } = {};
    const progressTracker = { completed: 0 };

    // Process files with concurrency limit
    const concurrencyLimit = 3;
    const batches: File[][] = [];

    for (let i = 0; i < files.length; i += concurrencyLimit) {
      batches.push(files.slice(i, i + concurrencyLimit));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.validateFile(file, options);
          results[file.name] = result;
        } catch (error) {
          results[file.name] = {
            isValid: false,
            errors: [error instanceof Error ? error.message : 'Validation failed'],
            warnings: [],
          };
        }

        progressTracker.completed++;
        onProgress?.(progressTracker.completed, files.length);
      });

      await Promise.all(batchPromises);
    }

    return results;
  }

  getValidationProfile(documentType: DocumentType): ValidationOptions {
    const profile = DOCUMENT_VALIDATION_PROFILES[documentType as keyof typeof DOCUMENT_VALIDATION_PROFILES];
    return profile || DOCUMENT_VALIDATION_PROFILES.other_document;
  }

  // Private methods
  private async extractImageMetadata(file: File): Promise<PropertyImageMetadata> {
    // Use shared basic metadata extraction
    const basicMetadata = await this.extractBasicMetadata(file);
    
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('application/pdf')) {
        resolve({
          ...basicMetadata,
          technicalMetadata: {
            format: 'pdf',
            colorSpace: 'sRGB',
            bitDepth: 24,
            compression: 'PDF',
            orientation: 1,
          },
        } as PropertyImageMetadata);
        return;
      }

      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        reject(new Error('Image metadata extraction not supported in this environment'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const metadata: PropertyImageMetadata = {
            ...basicMetadata,
            dimensions: {
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
            technicalMetadata: {
              format: ImageUtils.getFileExtension(file.name).toLowerCase(),
              colorSpace: 'sRGB',
              bitDepth: 24,
              compression: 'JPEG',
              orientation: 1,
            },
          } as PropertyImageMetadata;

          resolve(metadata);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image - file may be corrupted'));
      };

      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 5000);
    });
  }

  private async performAdvancedValidations(
    file: File,
    metadata: PropertyImageMetadata,
    result: ValidationResult,
    documentType?: DocumentType
  ): Promise<void> {
    // Document authentication
    if (
      this.config.validation.documentAuthEnabled &&
      this.dependencies.documentAuthService &&
      documentType &&
      documentType !== 'property_photo'
    ) {
      try {
        const authResult = await this.dependencies.documentAuthService.authenticateDocument(file, documentType);
        result.documentAuthResult = authResult;

        if (!authResult.isAuthentic) {
          result.isValid = false;
          result.errors.push(`Document authentication failed: ${authResult.anomalies.join(', ')}`);
        } else if (authResult.confidence < 0.8) {
          result.warnings.push(`Document authentication confidence is low (${Math.round(authResult.confidence * 100)}%)`);
        }
      } catch (error) {
        result.warnings.push(`Document authentication service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Fraud detection
    if (
      this.config.validation.fraudDetectionEnabled &&
      this.dependencies.fraudDetectionService
    ) {
      try {
        const fraudScore = await this.dependencies.fraudDetectionService.analyzeFraudRisk(file, metadata);
        result.fraudRiskScore = fraudScore;

        if (fraudScore > 0.8) {
          result.isValid = false;
          result.errors.push(`High fraud risk detected (score: ${Math.round(fraudScore * 100)}%)`);
        } else if (fraudScore > 0.5) {
          result.warnings.push(`Moderate fraud risk detected (score: ${Math.round(fraudScore * 100)}%)`);
        }
      } catch (error) {
        result.warnings.push(`Fraud detection service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}

// Register service in the registry
export const propertyImageValidationService = ImageServiceRegistry.getInstance().register(
  new PropertyImageValidationService()
);

export default PropertyImageValidationService;