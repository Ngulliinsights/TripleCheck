/**
 * Property Image Validation Service
 *
 * Focused service that handles only validation operations.
 * Uses the shared core to eliminate duplication while maintaining clear boundaries.
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

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface IPropertyImageValidationService {
  validateFile(
    file: File,
    options?: ValidationOptions,
    documentType?: DocumentType,
  ): Promise<ValidationResult>
  validateUrl(url: string, options?: ValidationOptions): Promise<ValidationResult>
  validateBatch(
    files: File[],
    options?: ValidationOptions,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<Record<string, ValidationResult>>
  getValidationProfile(documentType: DocumentType): ValidationOptions
}

export interface ValidationDependencies {
  documentAuthService?: {
    authenticateDocument(file: File, documentType: DocumentType): Promise<DocumentAuthResult>
  }
  fraudDetectionService?: {
    analyzeFraudRisk(file: File, metadata: PropertyImageMetadata): Promise<number>
  }
  geoLocationService?: {
    validateLocation(
      latitude: number,
      longitude: number,
      expectedRegion?: string,
    ): Promise<boolean>
  }
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export class PropertyImageValidationService
  extends ImageServiceCore
  implements IPropertyImageValidationService
{
  readonly serviceName = 'PropertyImageValidationService'
  readonly version = '2.0.0'

  constructor(
    private readonly dependencies: ValidationDependencies = {},
    config?: ImageServiceConfig,
  ) {
    super(config, ImageServiceRegistry.getInstance().getAuditService())
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async validateFile(
    file: File,
    options?: ValidationOptions,
    documentType?: DocumentType,
  ): Promise<ValidationResult> {
    const validationOptions = options ?? this.getValidationProfile(documentType ?? 'other_document')

    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    try {
      await this.logEvent('validation_started', {
        fileName: file.name,
        fileSize: file.size,
        documentType: documentType ?? 'unknown',
      })

      // --- Basic checks ---

      if (!this.validateFileSize(file.size)) {
        result.isValid = false
        result.errors.push(
          `File size (${ImageUtils.formatFileSize(file.size)}) exceeds the maximum allowed ` +
            `(${ImageUtils.formatFileSize(this.config.validation.maxFileSize)})`,
        )
      }

      if (!this.validateFileFormat(file.name)) {
        result.isValid = false
        result.errors.push(
          `File format '${ImageUtils.getFileExtension(file.name)}' is not allowed. ` +
            `Allowed formats: ${this.config.validation.allowedFormats.join(', ')}`,
        )
      }

      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'
      if (!isImage && !isPdf) {
        result.isValid = false
        result.errors.push('File must be a valid image or PDF document.')
        // Bail early – metadata extraction would fail on an unsupported type.
        return result
      }

      // --- Metadata extraction ---
      const metadata = await this.extractImageMetadata(file)
      result.metadata = metadata

      // --- Advanced checks ---
      await this.performAdvancedValidations(file, metadata, result, documentType)

      await this.logEvent('validation_completed', {
        fileName: file.name,
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        documentType: documentType ?? 'unknown',
      })

      return result
    } catch (error) {
      result.isValid = false
      result.errors.push(
        `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )

      await this.logEvent('validation_error', {
        fileName: file.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        documentType: documentType ?? 'unknown',
      })

      return result
    }
  }

  async validateUrl(url: string, _options?: ValidationOptions): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] }

    if (!url) {
      result.isValid = false
      result.errors.push('No URL provided.')
      return result
    }

    try {
      new URL(url)
    } catch {
      result.isValid = false
      result.errors.push('Invalid URL format.')
      return result
    }

    // TODO: Add HEAD-request reachability check and MIME-type validation.
    return result
  }

  async validateBatch(
    files: File[],
    options?: ValidationOptions,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {}
    let completed = 0
    const CONCURRENCY = 3

    // Process in fixed-size batches to avoid overwhelming the browser / server.
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, i + CONCURRENCY)

      await Promise.all(
        batch.map(async file => {
          try {
            results[file.name] = await this.validateFile(file, options)
          } catch (error) {
            results[file.name] = {
              isValid: false,
              errors: [error instanceof Error ? error.message : 'Validation failed'],
              warnings: [],
            }
          }

          completed++
          onProgress?.(completed, files.length)
        }),
      )
    }

    return results
  }

  getValidationProfile(documentType: DocumentType): ValidationOptions {
    return (
      DOCUMENT_VALIDATION_PROFILES[documentType as keyof typeof DOCUMENT_VALIDATION_PROFILES] ??
      DOCUMENT_VALIDATION_PROFILES.other_document
    )
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private extractImageMetadata(file: File): Promise<PropertyImageMetadata> {
    return new Promise((resolve, reject) => {
      const basicMetadata = this.extractBasicMetadata(file)

      // PDFs cannot be loaded as <img> elements.
      if (file.type === 'application/pdf') {
        void basicMetadata.then(base =>
          resolve({
            ...base,
            technicalMetadata: {
              format: 'pdf',
              colorSpace: 'sRGB',
              bitDepth: 24,
              compression: 'PDF',
              orientation: 1,
            },
          } as PropertyImageMetadata),
        )
        return
      }

      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        reject(new Error('Image metadata extraction is not supported in this environment.'))
        return
      }

      const objectUrl = URL.createObjectURL(file)
      const img = new Image()

      const cleanup = () => URL.revokeObjectURL(objectUrl)

      img.onload = () => {
        cleanup()
        void basicMetadata.then(base =>
          resolve({
            ...base,
            dimensions: { width: img.naturalWidth, height: img.naturalHeight },
            technicalMetadata: {
              format: ImageUtils.getFileExtension(file.name).toLowerCase(),
              colorSpace: 'sRGB',
              bitDepth: 24,
              compression: 'JPEG',
              orientation: 1,
            },
          } as PropertyImageMetadata),
        )
      }

      img.onerror = () => {
        cleanup()
        reject(new Error('Failed to load image – file may be corrupted.'))
      }

      img.src = objectUrl
    })
  }

  private async performAdvancedValidations(
    file: File,
    metadata: PropertyImageMetadata,
    result: ValidationResult,
    documentType?: DocumentType,
  ): Promise<void> {
    // Document authentication (skipped for raw property photos).
    if (
      this.config.validation.documentAuthEnabled &&
      this.dependencies.documentAuthService &&
      documentType &&
      documentType !== 'property_photo'
    ) {
      try {
        const authResult = await this.dependencies.documentAuthService.authenticateDocument(
          file,
          documentType,
        )
        result.documentAuthResult = authResult

        if (!authResult.isAuthentic) {
          result.isValid = false
          result.errors.push(
            `Document authentication failed: ${authResult.anomalies.join(', ')}`,
          )
        } else if (authResult.confidence < 0.8) {
          result.warnings.push(
            `Document authentication confidence is low (${Math.round(authResult.confidence * 100)} %)`,
          )
        }
      } catch (error) {
        result.warnings.push(
          `Document authentication service unavailable: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    }

    // Fraud detection.
    if (
      this.config.validation.fraudDetectionEnabled &&
      this.dependencies.fraudDetectionService
    ) {
      try {
        const fraudScore = await this.dependencies.fraudDetectionService.analyzeFraudRisk(
          file,
          metadata,
        )
        result.fraudRiskScore = fraudScore

        if (fraudScore > 0.8) {
          result.isValid = false
          result.errors.push(
            `High fraud risk detected (score: ${Math.round(fraudScore * 100)} %)`,
          )
        } else if (fraudScore > 0.5) {
          result.warnings.push(
            `Moderate fraud risk detected (score: ${Math.round(fraudScore * 100)} %)`,
          )
        }
      } catch (error) {
        result.warnings.push(
          `Fraud detection service unavailable: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        )
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

export const propertyImageValidationService = ImageServiceRegistry.getInstance().register(
  new PropertyImageValidationService(),
)

export default PropertyImageValidationService