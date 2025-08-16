/**
 * Image Metadata & Compliance Service
 * Centralizes operations related to extracting, validating, and managing image metadata,
 * as well as performing compliance and security scans
 * 
 * Integrates with configuration system and shared utilities
 */

import { ImageServiceCore, ImageServiceRegistry } from './core/ImageServiceCore';
import type {
  PropertyImageMetadata as AssetMetadata,
  AITag,
  ScanResult,
  ComplianceResult,
  ImageServiceConfig,
} from '../../types/images';
import { ImageProcessingError } from '../../types/images';

export interface IImageMetadataService {
  extractMetadata(fileReference: string): Promise<AssetMetadata>;
  performVirusScan(fileReference: string): Promise<ScanResult>;
  checkCompliance(fileReference: string, metadata: AssetMetadata): Promise<ComplianceResult>;
  extractAITags(fileReference: string): Promise<AITag[]>;
}

export interface AIVisionAPI {
  analyzeImage(imageUrl: string): Promise<{
    tags: Array<{ label: string; confidence: number }>;
    objects: string[];
    faces: number;
    dominantColors: string[];
  }>;
}

export interface VirusScanAPI {
  scanFile(fileUrl: string): Promise<{
    clean: boolean;
    threats: string[];
    scanDuration: number;
  }>;
}

export interface ComplianceEngine {
  checkCompliance(metadata: AssetMetadata, fileInfo: { name: string; size: number }): Promise<{
    complianceFlags: string[];
    regulatoryFlags: string[];
  }>;
}

const UNKNOWN_ERROR = 'Unknown error';

// Crypto-based random number generation utility
const getSecureRandom = (): number => {
  if (window?.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const [value] = array;
    return value !== undefined ? value / (0xFFFFFFFF + 1) : 0.5;
  }
  // Fallback for non-browser environments or when crypto is unavailable
  // Using a deterministic fallback for testing environments
  return 0.5;
};

// Development logging utility
const devLog = {
  warn: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(message, ...args);
    }
  }
};

export class ImageMetadataService extends ImageServiceCore implements IImageMetadataService {
  readonly serviceName = 'ImageMetadataService';
  readonly version = '2.0.0';

  constructor(
    private aiVisionAPI?: AIVisionAPI,
    private virusScanAPI?: VirusScanAPI,
    private complianceEngine?: ComplianceEngine,
    config?: ImageServiceConfig
  ) {
    super(config, ImageServiceRegistry.getInstance().getAuditService());
    
    // Validate configuration on initialization
    if (!this.config.processing.enableAITagging && aiVisionAPI) {
      // Log warning about configuration mismatch
      devLog.warn('AI Vision API provided but AI tagging is disabled in configuration');
    }
  }

  async extractMetadata(fileReference: string): Promise<AssetMetadata> {
    try {
      // Extract basic metadata from file
      const basicMetadata = await this.extractBasicMetadata(fileReference);
      
      // Extract AI-powered metadata if service is available
      let aiEnhancedMetadata = {};
      if (this.aiVisionAPI) {
        try {
          const aiData = await this.aiVisionAPI.analyzeImage(fileReference);
          aiEnhancedMetadata = {
            faces: aiData.faces,
            objects: aiData.objects,
            dominantColors: aiData.dominantColors,
          };
        } catch (error) {
          // AI vision analysis failed - continue without AI metadata
          devLog.warn('AI vision analysis failed, continuing without AI metadata:', error instanceof Error ? error.message : UNKNOWN_ERROR);
        }
      }

      return {
        ...basicMetadata,
        ...aiEnhancedMetadata,
      };
    } catch (error) {
      throw new ImageProcessingError(
        `Failed to extract metadata: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        'METADATA_EXTRACTION_FAILED'
      );
    }
  }

  async performVirusScan(fileReference: string): Promise<ScanResult> {
    const scanStart = Date.now();

    try {
      if (this.virusScanAPI) {
        const scanData = await this.virusScanAPI.scanFile(fileReference);
        return {
          clean: scanData.clean,
          threats: scanData.threats,
          scanDate: new Date(),
          scanDuration: scanData.scanDuration,
          engine: 'EnterpriseAV-2024',
          signatureVersion: '2024.1.0',
        };
      } else {
        // Mock implementation for development/testing
        return this.mockVirusScan(scanStart);
      }
    } catch (error) {
      throw new ImageProcessingError(
        `Virus scan failed: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        'VIRUS_SCAN_FAILED'
      );
    }
  }

  async checkCompliance(fileReference: string, metadata: AssetMetadata): Promise<ComplianceResult> {
    try {
      if (this.complianceEngine) {
        // Extract file info from reference (in real implementation, this would come from storage service)
        const fileInfo = this.extractFileInfoFromReference(fileReference);
        return await this.complianceEngine.checkCompliance(metadata, fileInfo);
      } else {
        // Mock implementation for development/testing
        return this.mockComplianceCheck(metadata);
      }
    } catch (error) {
      throw new ImageProcessingError(
        `Compliance check failed: ${error instanceof Error ? error.message : UNKNOWN_ERROR}`,
        'COMPLIANCE_CHECK_FAILED'
      );
    }
  }

  async extractAITags(fileReference: string): Promise<AITag[]> {
    try {
      if (this.aiVisionAPI) {
        const aiData = await this.aiVisionAPI.analyzeImage(fileReference);
        return aiData.tags.map(tag => ({
          label: tag.label,
          confidence: tag.confidence,
          source: 'vision' as const,
          timestamp: new Date(),
        }));
      } else {
        // Mock implementation for development/testing
        return this.mockAITags();
      }
    } catch (error) {
      // AI tag extraction failed - return empty array
      devLog.warn('AI tag extraction failed:', error instanceof Error ? error.message : UNKNOWN_ERROR);
      return []; // Return empty array instead of throwing, as AI tags are optional
    }
  }

  // Set external service dependencies (for dependency injection)
  setAIVisionAPI(api: AIVisionAPI): void {
    this.aiVisionAPI = api;
  }

  setVirusScanAPI(api: VirusScanAPI): void {
    this.virusScanAPI = api;
  }

  setComplianceEngine(engine: ComplianceEngine): void {
    this.complianceEngine = engine;
  }

  private async extractBasicMetadata(_fileReference: string): Promise<AssetMetadata> {
    // In a real implementation, this would extract EXIF data and other metadata
    // For now, we'll simulate basic metadata extraction
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          fileSize: 1024 * 1024, // 1MB default
          technicalMetadata: {
            format: 'jpeg', // Would be extracted from actual file
            colorSpace: 'sRGB',
            bitDepth: 24,
            compression: 'JPEG',
            orientation: 1,
          },
          createdAt: Date.now(),
          lastModified: Date.now(),
        });
      }, 100); // Simulate processing time
    });
  }

  private mockVirusScan(scanStart: number): ScanResult {
    const scanDuration = Date.now() - scanStart;
    const randomValue = getSecureRandom();
    const clean = randomValue > 0.02; // 98% clean rate

    const threatRandomValue = getSecureRandom();
    const threats = clean ? [] : [
      'suspicious-metadata',
      'potential-malware',
      'embedded-script',
      'steganography-detected',
    ].slice(0, Math.floor(threatRandomValue * 2) + 1);

    return {
      clean,
      threats,
      scanDate: new Date(),
      scanDuration,
      engine: 'MockAV-2024',
      signatureVersion: '2024.1.0',
    };
  }

  private mockComplianceCheck(metadata: AssetMetadata): ComplianceResult {
    const complianceFlags: string[] = [];
    const regulatoryFlags: string[] = [];

    // Mock compliance rules
    if (metadata.fileSize > 100 * 1024 * 1024) {
      complianceFlags.push('large-file-review');
    }

    if (metadata.fileSize > 1000 * 1024 * 1024) {
      regulatoryFlags.push('regulatory-review-required');
    }

    const randomValue = getSecureRandom();
    if (randomValue > 0.95) {
      complianceFlags.push('manual-review-required');
    }

    if (metadata.technicalMetadata.format === 'heic') {
      regulatoryFlags.push('format-compatibility-check');
    }

    return {
      complianceFlags,
      regulatoryFlags,
    };
  }

  private mockAITags(): AITag[] {
    const possibleTags = [
      { label: 'landscape', confidence: 0.92, source: 'vision' as const },
      { label: 'portrait', confidence: 0.88, source: 'vision' as const },
      { label: 'outdoor', confidence: 0.85, source: 'vision' as const },
      { label: 'indoor', confidence: 0.79, source: 'vision' as const },
      { label: 'nature', confidence: 0.83, source: 'content' as const },
      { label: 'urban', confidence: 0.76, source: 'content' as const },
      { label: 'architecture', confidence: 0.81, source: 'vision' as const },
      { label: 'people', confidence: 0.89, source: 'vision' as const },
      { label: 'property', confidence: 0.94, source: 'metadata' as const },
      { label: 'real_estate', confidence: 0.91, source: 'metadata' as const },
      { label: 'commercial', confidence: 0.87, source: 'content' as const },
      { label: 'residential', confidence: 0.93, source: 'content' as const },
    ];

    const shuffledTags = [...possibleTags].sort(() => getSecureRandom() - 0.5);
    const selectionRandomValue = getSecureRandom();
    
    const selectedTags = shuffledTags.slice(0, Math.floor(selectionRandomValue * 4) + 3);

    return selectedTags.map(tag => ({
      ...tag,
      timestamp: new Date(),
    }));
  }

  private extractFileInfoFromReference(fileReference: string): { name: string; size: number } {
    // Mock implementation - in reality, this would query the storage service
    return {
      name: fileReference.split('/').pop() || 'unknown',
      size: Math.floor(getSecureRandom() * 10 * 1024 * 1024), // Random size up to 10MB
    };
  }
}


// Register service in the registry
export const imageMetadataService = ImageServiceRegistry.getInstance().register(
  new ImageMetadataService()
);

export default ImageMetadataService;