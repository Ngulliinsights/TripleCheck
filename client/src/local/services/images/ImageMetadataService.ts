/**
 * Image Metadata & Compliance Service
 *
 * Centralizes operations for extracting, validating, and managing image
 * metadata, as well as performing compliance and security scans.
 *
 * Integrates with the configuration system and shared utilities.
 */

import { ImageServiceCore, ImageServiceRegistry } from './core/ImageServiceCore'
import type {
  PropertyImageMetadata as AssetMetadata,
  AITag,
  ScanResult,
  ComplianceResult,
  ImageServiceConfig,
} from '../../types/images'
import { ImageProcessingError } from '../../types/images'

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface IImageMetadataService {
  extractMetadata(fileReference: string): Promise<AssetMetadata>
  performVirusScan(fileReference: string): Promise<ScanResult>
  checkCompliance(fileReference: string, metadata: AssetMetadata): Promise<ComplianceResult>
  extractAITags(fileReference: string): Promise<AITag[]>
}

export interface AIVisionAPI {
  analyzeImage(imageUrl: string): Promise<{
    tags: Array<{ label: string; confidence: number }>
    objects: string[]
    faces: number
    dominantColors: string[]
  }>
}

export interface VirusScanAPI {
  scanFile(fileUrl: string): Promise<{
    clean: boolean
    threats: string[]
    scanDuration: number
  }>
}

export interface ComplianceEngine {
  checkCompliance(
    metadata: AssetMetadata,
    fileInfo: { name: string; size: number },
  ): Promise<{
    complianceFlags: string[]
    regulatoryFlags: string[]
  }>
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const UNKNOWN_ERROR = 'Unknown error'

/**
 * Returns a cryptographically random float in [0, 1).
 * Falls back to 0.5 in environments without Web Crypto (e.g., pure Node.js).
 */
function getSecureRandom(): number {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const buf = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buf)
    // buf[0] is always defined for a Uint32Array of length 1
    return buf[0]! / (0xffffffff + 1)
  }
  return 0.5
}

/** Development-only logger – no-ops in production. */
const devLog = {
  warn(message: string, ...args: unknown[]): void {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(message, ...args)
    }
  },
}

// ---------------------------------------------------------------------------
// Service implementation
// ---------------------------------------------------------------------------

export class ImageMetadataService extends ImageServiceCore implements IImageMetadataService {
  readonly serviceName = 'ImageMetadataService'
  readonly version = '2.0.0'

  constructor(
    private readonly aiVisionAPI?: AIVisionAPI,
    private readonly virusScanAPI?: VirusScanAPI,
    private readonly complianceEngine?: ComplianceEngine,
    config?: ImageServiceConfig,
  ) {
    super(config, ImageServiceRegistry.getInstance().getAuditService())

    if (!this.config.processing.enableAITagging && aiVisionAPI) {
      devLog.warn(
        'AI Vision API provided but AI tagging is disabled in configuration.',
      )
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  async extractMetadata(fileReference: string): Promise<AssetMetadata> {
    try {
      const basicMetadata = await this.extractBasicMetadataFromReference(fileReference)

      let aiEnhancedMetadata: Partial<AssetMetadata> = {}
      if (this.aiVisionAPI) {
        try {
          const aiData = await this.aiVisionAPI.analyzeImage(fileReference)
          aiEnhancedMetadata = {
            faces: aiData.faces,
            objects: aiData.objects,
            dominantColors: aiData.dominantColors,
          }
        } catch (err) {
          devLog.warn(
            'AI vision analysis failed – continuing without AI metadata:',
            err instanceof Error ? err.message : UNKNOWN_ERROR,
          )
        }
      }

      return { ...basicMetadata, ...aiEnhancedMetadata }
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to extract metadata: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        'METADATA_EXTRACTION_FAILED',
      )
    }
  }

  async performVirusScan(fileReference: string): Promise<ScanResult> {
    const scanStart = Date.now()

    try {
      if (this.virusScanAPI) {
        const scanData = await this.virusScanAPI.scanFile(fileReference)
        return {
          clean: scanData.clean,
          threats: scanData.threats,
          scanDate: new Date(),
          scanDuration: scanData.scanDuration,
          engine: 'EnterpriseAV-2024',
          signatureVersion: '2024.1.0',
        }
      }

      return this.mockVirusScan(scanStart)
    } catch (error) {
      throw new ImageProcessingError(
        `Virus scan failed: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        'VIRUS_SCAN_FAILED',
      )
    }
  }

  async checkCompliance(
    fileReference: string,
    metadata: AssetMetadata,
  ): Promise<ComplianceResult> {
    try {
      if (this.complianceEngine) {
        const fileInfo = this.extractFileInfoFromReference(fileReference)
        return await this.complianceEngine.checkCompliance(metadata, fileInfo)
      }

      return this.mockComplianceCheck(metadata)
    } catch (error) {
      throw new ImageProcessingError(
        `Compliance check failed: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        'COMPLIANCE_CHECK_FAILED',
      )
    }
  }

  async extractAITags(fileReference: string): Promise<AITag[]> {
    try {
      if (this.aiVisionAPI) {
        const aiData = await this.aiVisionAPI.analyzeImage(fileReference)
        return aiData.tags.map(tag => ({
          label: tag.label,
          confidence: tag.confidence,
          source: 'vision' as const,
          timestamp: new Date(),
        }))
      }

      return this.mockAITags()
    } catch (err) {
      // AI tags are optional – degrade gracefully instead of throwing.
      devLog.warn(
        'AI tag extraction failed:',
        err instanceof Error ? err.message : UNKNOWN_ERROR,
      )
      return []
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Simulates EXIF / basic metadata extraction.
   * Replace with real parsing logic (e.g., exifr) in production.
   */
  private extractBasicMetadataFromReference(_fileReference: string): Promise<AssetMetadata> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          fileSize: 1024 * 1024, // 1 MB placeholder
          technicalMetadata: {
            format: 'jpeg',
            colorSpace: 'sRGB',
            bitDepth: 24,
            compression: 'JPEG',
            orientation: 1,
          },
          createdAt: Date.now(),
          lastModified: Date.now(),
        })
      }, 100)
    })
  }

  private mockVirusScan(scanStart: number): ScanResult {
    const scanDuration = Date.now() - scanStart
    const clean = getSecureRandom() > 0.02 // 98 % clean rate

    const threats = clean
      ? []
      : ['suspicious-metadata', 'potential-malware', 'embedded-script', 'steganography-detected'].slice(
          0,
          Math.floor(getSecureRandom() * 2) + 1,
        )

    return {
      clean,
      threats,
      scanDate: new Date(),
      scanDuration,
      engine: 'MockAV-2024',
      signatureVersion: '2024.1.0',
    }
  }

  private mockComplianceCheck(metadata: AssetMetadata): ComplianceResult {
    const complianceFlags: string[] = []
    const regulatoryFlags: string[] = []

    if (metadata.fileSize > 100 * 1024 * 1024) {
      complianceFlags.push('large-file-review')
    }

    if (metadata.fileSize > 1000 * 1024 * 1024) {
      regulatoryFlags.push('regulatory-review-required')
    }

    if (getSecureRandom() > 0.95) {
      complianceFlags.push('manual-review-required')
    }

    if (metadata.technicalMetadata.format === 'heic') {
      regulatoryFlags.push('format-compatibility-check')
    }

    return { complianceFlags, regulatoryFlags }
  }

  private mockAITags(): AITag[] {
    const possibleTags: Omit<AITag, 'timestamp'>[] = [
      { label: 'landscape',    confidence: 0.92, source: 'vision'   },
      { label: 'portrait',     confidence: 0.88, source: 'vision'   },
      { label: 'outdoor',      confidence: 0.85, source: 'vision'   },
      { label: 'indoor',       confidence: 0.79, source: 'vision'   },
      { label: 'nature',       confidence: 0.83, source: 'content'  },
      { label: 'urban',        confidence: 0.76, source: 'content'  },
      { label: 'architecture', confidence: 0.81, source: 'vision'   },
      { label: 'people',       confidence: 0.89, source: 'vision'   },
      { label: 'property',     confidence: 0.94, source: 'metadata' },
      { label: 'real_estate',  confidence: 0.91, source: 'metadata' },
      { label: 'commercial',   confidence: 0.87, source: 'content'  },
      { label: 'residential',  confidence: 0.93, source: 'content'  },
    ]

    // Deterministic-ish shuffle using getSecureRandom
    const shuffled = [...possibleTags].sort(() => getSecureRandom() - 0.5)
    const count = Math.floor(getSecureRandom() * 4) + 3

    return shuffled.slice(0, count).map(tag => ({ ...tag, timestamp: new Date() }))
  }

  /**
   * Derives a file name from a reference string.
   * In production, delegate to the storage service for authoritative info.
   */
  private extractFileInfoFromReference(fileReference: string): { name: string; size: number } {
    return {
      name: fileReference.split('/').pop() ?? 'unknown',
      // Size is unknown without a storage query – callers that need accurate
      // values should inject a real ComplianceEngine.
      size: 0,
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level singleton
// ---------------------------------------------------------------------------

export const imageMetadataService = ImageServiceRegistry.getInstance().register(
  new ImageMetadataService(),
)

export default ImageMetadataService