/**
 * Enhanced Metadata Analyzer using exifr
 * Replaces custom metadata extraction
 */

import crypto from 'crypto';
import exifr from 'exifr';
import { PDFDocument } from 'pdf-lib';
import pdfParse from 'pdf-parse';
import { logger } from '../../infrastructure/observability/telemetry';
import { DocumentVerificationRequest, VerificationCheck, DocumentMetadata } from '../DocumentAuthService';

export interface MetadataAnalysisResult {
  checks: VerificationCheck[];
  metadata: Partial<DocumentMetadata>;
  confidence: number;
}

export class MetadataAnalyzerV2 {
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    logger.info('Initializing Enhanced Metadata Analyzer');
    this.isInitialized = true;
    logger.info('Enhanced Metadata Analyzer initialized');
  }

  async analyze(request: DocumentVerificationRequest): Promise<MetadataAnalysisResult> {
    const startTime = Date.now();
    logger.info('Starting metadata analysis', { filename: request.filename });

    try {
      // Calculate file hash
      const fileHash = crypto.createHash('sha256').update(request.file).digest('hex');

      let extractedMetadata: Record<string, any> = {};
      let creationDate: Date | undefined;
      let modificationDate: Date | undefined;
      let software: string | undefined;
      let author: string | undefined;
      let pageCount: number | undefined;

      // Extract metadata based on file type
      if (request.mimeType === 'application/pdf') {
        extractedMetadata = await this.extractPDFMetadata(request.file);
      } else if (request.mimeType.startsWith('image/')) {
        extractedMetadata = await this.extractImageMetadata(request.file);
      }

      // Parse common metadata fields
      if (extractedMetadata.CreationDate || extractedMetadata.CreateDate) {
        creationDate = new Date(extractedMetadata.CreationDate || extractedMetadata.CreateDate);
      }
      
      if (extractedMetadata.ModDate || extractedMetadata.ModifyDate) {
        modificationDate = new Date(extractedMetadata.ModDate || extractedMetadata.ModifyDate);
      }
      
      if (extractedMetadata.Creator || extractedMetadata.Producer || extractedMetadata.Software) {
        software = extractedMetadata.Creator || extractedMetadata.Producer || extractedMetadata.Software;
      }
      
      if (extractedMetadata.Author || extractedMetadata.Artist) {
        author = extractedMetadata.Author || extractedMetadata.Artist;
      }

      if (extractedMetadata.PageCount) {
        pageCount = extractedMetadata.PageCount;
      }

      // Analyze metadata for authenticity
      const analysis = this.analyzeMetadataAuthenticity(extractedMetadata, request);

      // Create verification check
      const metadataCheck: VerificationCheck = {
        type: 'metadata',
        name: 'Metadata Analysis',
        status: analysis.score >= 70 ? 'pass' : analysis.score >= 50 ? 'warning' : 'fail',
        score: analysis.score,
        description: 'Analysis of document metadata for authenticity indicators',
        details: [
          analysis.summary,
          ...analysis.issues,
          ...analysis.recommendations,
        ],
        confidence: 0.85,
        processingTime: Date.now() - startTime,
      };

      return {
        checks: [metadataCheck],
        metadata: {
          creationDate,
          modificationDate,
          author,
          software,
          fileSize: request.size,
          hash: fileHash,
          pageCount,
        },
        confidence: 0.85,
      };
    } catch (error: any) {
      logger.error('Metadata analysis failed', {
        filename: request.filename,
        error: error.message,
      });

      const failedCheck: VerificationCheck = {
        type: 'metadata',
        name: 'Metadata Analysis',
        status: 'fail',
        score: 0,
        description: 'Metadata analysis failed due to technical error',
        details: ['Failed to extract metadata', 'Ensure document is not corrupted'],
        confidence: 0.1,
        processingTime: Date.now() - startTime,
      };

      return {
        checks: [failedCheck],
        metadata: {
          fileSize: request.size,
          hash: crypto.createHash('sha256').update(request.file).digest('hex'),
        },
        confidence: 0.1,
      };
    }
  }

  /**
   * Extract PDF metadata using pdf-parse and pdf-lib
   */
  private async extractPDFMetadata(buffer: Buffer): Promise<Record<string, any>> {
    try {
      const metadata: Record<string, any> = {};

      // Use pdf-parse for comprehensive extraction
      const pdfData = await pdfParse(buffer);
      metadata.PageCount = pdfData.numpages;
      metadata.TextContent = pdfData.text;

      // Use pdf-lib for additional metadata
      const pdfDoc = await PDFDocument.load(buffer);
      
      const title = pdfDoc.getTitle();
      const author = pdfDoc.getAuthor();
      const subject = pdfDoc.getSubject();
      const creator = pdfDoc.getCreator();
      const producer = pdfDoc.getProducer();
      const creationDate = pdfDoc.getCreationDate();
      const modificationDate = pdfDoc.getModificationDate();

      if (title) metadata.Title = title;
      if (author) metadata.Author = author;
      if (subject) metadata.Subject = subject;
      if (creator) metadata.Creator = creator;
      if (producer) metadata.Producer = producer;
      if (creationDate) metadata.CreationDate = creationDate;
      if (modificationDate) metadata.ModDate = modificationDate;

      logger.debug('PDF metadata extracted', {
        pageCount: metadata.PageCount,
        hasAuthor: !!author,
        hasCreator: !!creator,
      });

      return metadata;
    } catch (error: any) {
      logger.warn('Failed to extract PDF metadata', { error: error.message });
      return {};
    }
  }

  /**
   * Extract image metadata using exifr
   */
  private async extractImageMetadata(buffer: Buffer): Promise<Record<string, any>> {
    try {
      // exifr extracts all available metadata
      const metadata = await exifr.parse(buffer, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
        icc: true,
        jfif: true,
        ihdr: true,
      });

      if (!metadata) {
        logger.warn('No EXIF data found in image');
        return {};
      }

      logger.debug('Image metadata extracted', {
        hasGPS: !!metadata.latitude,
        hasMake: !!metadata.Make,
        hasDateTime: !!metadata.DateTime,
      });

      return metadata;
    } catch (error: any) {
      logger.warn('Failed to extract image metadata', { error: error.message });
      return {};
    }
  }

  /**
   * Analyze metadata for authenticity indicators
   */
  private analyzeMetadataAuthenticity(
    metadata: Record<string, any>,
    request: DocumentVerificationRequest
  ): {
    score: number;
    summary: string;
    evidence: any[];
    issues: string[];
    recommendations: string[];
  } {
    let score = 100;
    const evidence: any[] = [];
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for missing critical metadata
    if (!metadata.CreationDate && !metadata.CreateDate && !metadata.DateTime) {
      score -= 20;
      issues.push('Missing creation date metadata');
      evidence.push({
        type: 'missing_metadata',
        description: 'Document lacks creation timestamp',
        severity: 'medium',
        confidence: 0.8,
      });
    }

    // Check for suspicious software signatures
    const softwareField = metadata.Creator || metadata.Producer || metadata.Software || '';
    if (softwareField) {
      const software = softwareField.toLowerCase();
      const suspiciousSoftware = [
        'photoshop',
        'gimp',
        'paint.net',
        'canva',
        'figma',
        'pdf editor',
        'pdf creator',
        'fake document',
        'document generator',
      ];

      const foundSuspicious = suspiciousSoftware.some((sus) => software.includes(sus));
      if (foundSuspicious) {
        score -= 30;
        issues.push(`Document created with potentially suspicious software: ${softwareField}`);
        evidence.push({
          type: 'suspicious_software',
          description: `Created with ${softwareField}`,
          severity: 'high',
          confidence: 0.9,
        });
      }
    }

    // Check for metadata inconsistencies
    const creationDate = metadata.CreationDate || metadata.CreateDate || metadata.DateTime;
    const modDate = metadata.ModDate || metadata.ModifyDate;

    if (creationDate && modDate) {
      const created = new Date(creationDate);
      const modified = new Date(modDate);

      if (modified < created) {
        score -= 25;
        issues.push('Modification date is before creation date');
        evidence.push({
          type: 'timestamp_inconsistency',
          description: 'Impossible timestamp sequence',
          severity: 'high',
          confidence: 0.95,
        });
      }

      // Check for very recent modifications
      const now = new Date();
      const timeSinceModification = now.getTime() - modified.getTime();
      const timeSinceUpload = now.getTime() - request.uploadedAt.getTime();

      if (timeSinceModification < timeSinceUpload - 60000) {
        score -= 15;
        issues.push('Document was recently modified before upload');
        evidence.push({
          type: 'recent_modification',
          description: 'Document modified shortly before verification',
          severity: 'medium',
          confidence: 0.7,
        });
      }
    }

    // Check for GPS data in images (potential stock photo)
    if (metadata.latitude && metadata.longitude) {
      score -= 5;
      evidence.push({
        type: 'gps_metadata',
        description: 'Image contains GPS location data',
        severity: 'low',
        confidence: 0.5,
      });
    }

    // Check for excessive metadata (potential template)
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 30) {
      score -= 10;
      issues.push('Unusually comprehensive metadata (potential template)');
      evidence.push({
        type: 'excessive_metadata',
        description: 'Document has unusually complete metadata',
        severity: 'low',
        confidence: 0.6,
      });
    }

    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push('Metadata appears authentic and consistent');
    } else {
      if (issues.some((issue) => issue.includes('software'))) {
        recommendations.push('Verify document source and creation method');
      }
      if (issues.some((issue) => issue.includes('timestamp'))) {
        recommendations.push('Request original document with unmodified timestamps');
      }
      if (issues.some((issue) => issue.includes('author') || issue.includes('Author'))) {
        recommendations.push('Obtain document with proper author attribution');
      }
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    let summary: string;
    if (score >= 90) {
      summary = 'Metadata appears authentic with no significant concerns';
    } else if (score >= 70) {
      summary = 'Metadata shows minor inconsistencies but appears generally authentic';
    } else if (score >= 50) {
      summary = 'Metadata contains several suspicious elements requiring further investigation';
    } else {
      summary = 'Metadata shows significant signs of tampering or forgery';
    }

    return {
      score,
      summary,
      evidence,
      issues,
      recommendations,
    };
  }

  async getStatus(): Promise<any> {
    return {
      initialized: this.isInitialized,
      name: 'Enhanced Metadata Analyzer',
      version: '2.0.0',
      supportedFormats: ['PDF', 'JPEG', 'PNG', 'TIFF', 'WEBP', 'HEIC'],
      capabilities: [
        'Comprehensive EXIF extraction',
        'PDF metadata parsing',
        'GPS data analysis',
        'Timestamp validation',
        'Software signature analysis',
        'Metadata consistency checking',
      ],
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Enhanced Metadata Analyzer');
    this.isInitialized = false;
    logger.info('Enhanced Metadata Analyzer shutdown complete');
  }
}

export const metadataAnalyzer = new MetadataAnalyzerV2();
export default metadataAnalyzer;
