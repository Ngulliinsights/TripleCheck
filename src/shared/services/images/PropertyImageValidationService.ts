/**
 * Property Image Validation Service
 * Context-sensitive validation aligned with property verification domain
 * Integrates with document-auth and fraud-detection services
 */

import type {
  ValidationResult,
  ValidationOptions,
  PropertyImageMetadata,
  DocumentType,
  DocumentAuthResult,
  ImageServiceConfig,
} from '../../types/images';
import { DOCUMENT_VALIDATION_PROFILES } from '../../types/images';
import { imageServiceConfig } from '../../config/image-service.config';
import { getFileExtension, formatFileSize } from '../../utils/images/formatters';

const UNKNOWN_ERROR = 'Unknown error';

export interface IPropertyImageValidationService {
  validateFile(file: File, options?: ValidationOptions, documentType?: DocumentType): Promise<ValidationResult>;
  validateUrl(url: string, options?: ValidationOptions): Promise<ValidationResult>;
  validateBatch(files: File[], options?: ValidationOptions, onProgress?: (completed: number, total: number) => void): Promise<{ [fileName: string]: ValidationResult }>;
  getValidationProfile(documentType: DocumentType): ValidationOptions;
}

export interface PropertyValidationDependencies {
  documentAuthService?: {
    authenticateDocument: (file: File, documentType: DocumentType) => Promise<DocumentAuthResult>;
  } | undefined;
  fraudDetectionService?: {
    analyzeFraudRisk: (file: File, metadata: PropertyImageMetadata) => Promise<number>;
  } | undefined;
  geoLocationService?: {
    validateLocation: (latitude: number, longitude: number, expectedRegion?: string) => Promise<boolean>;
  } | undefined;
  auditService?: {
    logValidationEvent: (event: string, metadata: Record<string, unknown>) => Promise<void>;
  } | undefined;
}

export class PropertyImageValidationService implements IPropertyImageValidationService {
  private config: ImageServiceConfig;

  constructor(
    private dependencies: PropertyValidationDependencies = {},
    config?: ImageServiceConfig
  ) {
    this.config = config || imageServiceConfig;
  }

  async validateFile(
    file: File,
    options?: ValidationOptions,
    documentType?: DocumentType
  ): Promise<ValidationResult> {
    return this.performValidation(file, options, documentType);
  }

  private async performValidation(
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
      // Log validation start
      if (this.dependencies.auditService) {
        await this.dependencies.auditService.logValidationEvent('validation_started', {
          fileName: file.name,
          fileSize: file.size,
          documentType: documentType || 'unknown',
        });
      }

      // Basic file validation
      if (!file) {
        result.isValid = false;
        result.errors.push('No file provided');
        return result;
      }

      // File size validation
      if (validationOptions.maxFileSize && file.size > validationOptions.maxFileSize) {
        result.isValid = false;
        result.errors.push(
          `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(validationOptions.maxFileSize)})`
        );
      }

      // File type validation
      const fileExtension = getFileExtension(file.name).toLowerCase();
      if (validationOptions.allowedFormats && !validationOptions.allowedFormats.includes(fileExtension)) {
        result.isValid = false;
        result.errors.push(
          `File format '${fileExtension}' is not allowed. Allowed formats: ${validationOptions.allowedFormats.join(', ')}`
        );
      }

      // MIME type validation
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
        result.isValid = false;
        result.errors.push('File is not a valid image or PDF document');
        return result;
      }

      // Extract metadata for further validation
      const metadata = await this.extractImageMetadata(file);
      result.metadata = metadata;

      // Dimension validation (for images only)
      if (file.type.startsWith('image/')) {
        this.validateDimensions(metadata, validationOptions, result);
        this.validateAspectRatio(metadata, validationOptions, result);
      }

      // Geo-location validation for property photos
      if (validationOptions.requireGeoLocation && documentType === 'property_photo') {
        this.validateGeoLocation(metadata, result);
      }

      // Document authentication (if enabled and service available)
      await this.performDocumentAuthentication(file, documentType, result);

      // Fraud detection analysis (if enabled and service available)
      await this.performFraudDetection(file, metadata, result);

      // Performance and quality warnings
      this.addPerformanceWarnings(file, metadata, result);

      // Log validation completion
      if (this.dependencies.auditService) {
        await this.dependencies.auditService.logValidationEvent('validation_completed', {
          fileName: file.name,
          isValid: result.isValid,
          errorCount: result.errors.length,
          warningCount: result.warnings.length,
          documentType: documentType || 'unknown',
          fraudRiskScore: result.fraudRiskScore || 0,
        });
      }

      return result;

    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Validation failed: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`
      );

      // Log validation error
      if (this.dependencies.auditService) {
        await this.dependencies.auditService.logValidationEvent('validation_error', {
          fileName: file.name,
          error: error instanceof Error ? error.message : UNKNOWN_ERROR,
          documentType: documentType || 'unknown',
        });
      }

      return result;
    }
  }

  private async performDocumentAuthentication(
    file: File,
    documentType: DocumentType | undefined,
    result: ValidationResult
  ): Promise<void> {
    if (this.config.validation.documentAuthEnabled && 
        this.dependencies.documentAuthService && 
        documentType && 
        documentType !== 'property_photo') {
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.warnings.push(`Document authentication service unavailable: ${errorMessage}`);
      }
    }
  }

  private async performFraudDetection(
    file: File,
    metadata: PropertyImageMetadata,
    result: ValidationResult
  ): Promise<void> {
    if (this.config.validation.fraudDetectionEnabled && this.dependencies.fraudDetectionService) {
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.warnings.push(`Fraud detection service unavailable: ${errorMessage}`);
      }
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

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      result.isValid = false;
      result.errors.push('Invalid URL format');
      return result;
    }

    return new Promise((resolve) => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        result.isValid = false;
        result.errors.push('URL validation not supported in this environment');
        resolve(result);
        return;
      }

      const img = new Image();
      const timeoutId = setTimeout(() => {
        result.isValid = false;
        result.errors.push('Image loading timeout');
        resolve(result);
      }, 10000); // 10 second timeout

      img.onload = () => {
        clearTimeout(timeoutId);
        
        const metadata: PropertyImageMetadata = {
          fileSize: 0, // Unknown for URLs
          dimensions: {
            width: img.naturalWidth,
            height: img.naturalHeight,
          },
          technicalMetadata: {
            format: getFileExtension(url).toLowerCase(),
            colorSpace: 'sRGB',
            bitDepth: 24,
            compression: 'JPEG',
            orientation: 1,
          },
          createdAt: Date.now(),
          lastModified: Date.now(),
        };

        result.metadata = metadata;

        // Validate dimensions if options provided
        if (options) {
          this.validateDimensions(metadata, options, result);
          this.validateAspectRatio(metadata, options, result);
        }

        resolve(result);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        result.isValid = false;
        result.errors.push('Failed to load image from URL');
        resolve(result);
      };

      img.src = url;
    });
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
    const profile = DOCUMENT_VALIDATION_PROFILES[documentType];
    return profile || DOCUMENT_VALIDATION_PROFILES.other_document;
  }

  // Set dependencies (for dependency injection)
  setDocumentAuthService(service: PropertyValidationDependencies['documentAuthService']): void {
    this.dependencies.documentAuthService = service;
  }

  setFraudDetectionService(service: PropertyValidationDependencies['fraudDetectionService']): void {
    this.dependencies.fraudDetectionService = service;
  }

  setGeoLocationService(service: PropertyValidationDependencies['geoLocationService']): void {
    this.dependencies.geoLocationService = service;
  }

  setAuditService(service: PropertyValidationDependencies['auditService']): void {
    this.dependencies.auditService = service;
  }

  private async extractImageMetadata(file: File): Promise<PropertyImageMetadata> {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('application/pdf')) {
        // For PDF files, return basic metadata
        resolve({
          fileSize: file.size,
          technicalMetadata: {
            format: 'pdf',
            colorSpace: 'sRGB',
            bitDepth: 24,
            compression: 'PDF',
            orientation: 1,
          },
          createdAt: Date.now(),
          lastModified: file.lastModified,
        });
        return;
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        reject(new Error('Image metadata extraction not supported in this environment'));
        return;
      }

      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          const metadata: PropertyImageMetadata = {
            fileSize: file.size,
            dimensions: {
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
            technicalMetadata: {
              format: getFileExtension(file.name).toLowerCase(),
              colorSpace: 'sRGB',
              bitDepth: 24,
              compression: 'JPEG',
              orientation: 1,
            },
            createdAt: Date.now(),
            lastModified: file.lastModified,
          };

          // Check for transparency (PNG specific)
          if (file.type === 'image/png' && ctx) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let hasTransparency = false;

            for (let i = 3; i < data.length; i += 4) {
              const alphaValue = data[i];
              if (alphaValue !== undefined && alphaValue < 255) {
                hasTransparency = true;
                break;
              }
            }

            metadata.hasTransparency = hasTransparency;
          }

          // Extract EXIF data if available (simplified)
          this.extractExifData().then(exifData => {
            if (exifData.geoLocation) {
              metadata.geoLocation = exifData.geoLocation;
            }
            if (exifData.deviceInfo) {
              metadata.deviceInfo = exifData.deviceInfo;
            }
            if (exifData.captureDate) {
              metadata.captureDate = exifData.captureDate;
            }
            resolve(metadata);
            return metadata;
          }).catch(() => {
            // Continue without EXIF data
            resolve(metadata);
          });

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image - file may be corrupted'));
      };

      // Create object URL for the image
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

      // Clean up object URL after a timeout
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 5000);
    });
  }

  private async extractExifData(): Promise<{
    geoLocation?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    deviceInfo?: {
      make: string;
      model: string;
      software: string;
    };
    captureDate?: number;
  }> {
    // Simplified EXIF extraction - in a real implementation, you'd use a library like exif-js
    return new Promise((resolve) => {
      // Mock EXIF data extraction with deterministic values for testing
      setTimeout(() => {
        const hasGeoLocation = Date.now() % 10 > 3; // Deterministic based on timestamp
        resolve({
          geoLocation: hasGeoLocation ? {
            latitude: -1.2921 + (Date.now() % 100 - 50) * 0.001, // Around Nairobi
            longitude: 36.8219 + (Date.now() % 100 - 50) * 0.001,
            accuracy: 10,
          } : undefined,
          deviceInfo: {
            make: 'Apple',
            model: 'iPhone 12',
            software: 'iOS 15.0',
          },
          captureDate: Date.now() - (Date.now() % (30 * 24 * 60 * 60 * 1000)), // Within last 30 days
        });
      }, 100);
    });
  }

  private validateDimensions(
    metadata: PropertyImageMetadata,
    options: ValidationOptions,
    result: ValidationResult
  ): void {
    if (!metadata.dimensions) return;

    const { width, height } = metadata.dimensions;

    if (options.minWidth && width < options.minWidth) {
      result.isValid = false;
      result.errors.push(
        `Image width (${width}px) is below minimum (${options.minWidth}px)`
      );
    }

    if (options.minHeight && height < options.minHeight) {
      result.isValid = false;
      result.errors.push(
        `Image height (${height}px) is below minimum (${options.minHeight}px)`
      );
    }

    if (options.maxWidth && width > options.maxWidth) {
      result.isValid = false;
      result.errors.push(
        `Image width (${width}px) exceeds maximum (${options.maxWidth}px)`
      );
    }

    if (options.maxHeight && height > options.maxHeight) {
      result.isValid = false;
      result.errors.push(
        `Image height (${height}px) exceeds maximum (${options.maxHeight}px)`
      );
    }
  }

  private validateAspectRatio(
    metadata: PropertyImageMetadata,
    options: ValidationOptions,
    result: ValidationResult
  ): void {
    if (!metadata.dimensions || !options.requireAspectRatio || !options.maxAspectRatioDeviation) {
      return;
    }

    const { width, height } = metadata.dimensions;
    const aspectRatio = width / height;
    const aspectRatioDiff = Math.abs(aspectRatio - options.requireAspectRatio);

    if (aspectRatioDiff > options.maxAspectRatioDeviation) {
      result.isValid = false;
      result.errors.push(
        `Image aspect ratio (${aspectRatio.toFixed(2)}) deviates too much from required ratio (${options.requireAspectRatio})`
      );
    }
  }

  private validateGeoLocation(
    metadata: PropertyImageMetadata,
    result: ValidationResult
  ): void {
    if (!metadata.geoLocation) {
      result.isValid = false;
      result.errors.push('Geo-location data is required for property photos');
      return;
    }

    // Validate geo-location using service if available
    if (this.dependencies.geoLocationService) {
      this.dependencies.geoLocationService.validateLocation(
        metadata.geoLocation.latitude,
        metadata.geoLocation.longitude,
        'Kenya' // Expected region for this project
      ).then((isValidLocation) => {
        if (!isValidLocation) {
          result.warnings.push('Property location appears to be outside expected region');
        }
      }).catch((error) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.warnings.push(`Could not validate geo-location: ${errorMessage}`);
      });
    }

    // Basic coordinate validation
    const { latitude, longitude } = metadata.geoLocation;
    if (latitude < -90 || latitude > 90) {
      result.isValid = false;
      result.errors.push('Invalid latitude value');
    }
    if (longitude < -180 || longitude > 180) {
      result.isValid = false;
      result.errors.push('Invalid longitude value');
    }
  }

  private addPerformanceWarnings(
    file: File,
    metadata: PropertyImageMetadata,
    result: ValidationResult
  ): void {
    // File size warnings
    if (file.size > 10 * 1024 * 1024) { // 10MB
      result.warnings.push('Large file size may impact upload and processing performance');
    }

    // Resolution warnings
    if (metadata.dimensions) {
      const pixelCount = metadata.dimensions.width * metadata.dimensions.height;
      if (pixelCount > 25000000) { // 25MP
        result.warnings.push('Very high resolution may impact processing performance');
      }
    }

    // Format-specific warnings
    const format = metadata.technicalMetadata.format.toLowerCase();
    if (format === 'bmp') {
      result.warnings.push('BMP format is uncompressed and may result in large file sizes');
    }
    if (format === 'tiff') {
      result.warnings.push('TIFF format may not be supported by all browsers');
    }

    // Transparency warning for property photos
    if (metadata.hasTransparency) {
      result.warnings.push('Image contains transparency which may not be suitable for property photos');
    }
  }
}

