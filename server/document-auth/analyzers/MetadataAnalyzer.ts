import * as crypto from 'crypto';

import * as exifParser from 'exif-parser';
import { PDFDocument } from 'pdf-lib';

import { logger } from '../../infrastructure/monitoring/logger';
import { DocumentVerificationRequest, VerificationCheck, DocumentMetadata } from '../DocumentAuthService';

export interface MetadataAnalysisResult {
  checks: VerificationCheck[];
  metadata: Partial<DocumentMetadata>;
  confidence: number;
}

export class MetadataAnalyzer {
  private isInitialized: boolean = false;

  constructor() {
    // Using singleton logger
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Metadata Analyzer...', 'MetadataAnalyzer');
    this.isInitialized = true;
    logger.info('Metadata Analyzer initialized', 'MetadataAnalyzer');
  }

  async analyze(request: DocumentVerificationRequest): Promise<MetadataAnalysisResult> {
    const startTime = Date.now();
    logger.info(`Analyzing metadata for: ${request.filename}`, 'MetadataAnalyzer');

    try {
      // Calculate file hash
      const fileHash = crypto.createHash('sha256').update(request.file).digest('hex');

      let extractedMetadata: Record<string, any> = {};
      let creationDate: Date | undefined;
      let modificationDate: Date | undefined;
      let software: string | undefined;
      let author: string | undefined;

      // Extract metadata based on file type
      if (request.mimeType === 'application/pdf') {
        extractedMetadata = await this.extractPDFMetadata(request.file);
      } else if (request.mimeType.startsWith('image/')) {
        extractedMetadata = await this.extractImageMetadata(request.file);
      }

      // Parse common metadata fields
      if (extractedMetadata.CreationDate) {
        creationDate = new Date(extractedMetadata.CreationDate);
      }
      if (extractedMetadata.ModDate || extractedMetadata.ModificationDate) {
        modificationDate = new Date(extractedMetadata.ModDate || extractedMetadata.ModificationDate);
      }
      if (extractedMetadata.Creator || extractedMetadata.Producer || extractedMetadata.Software) {
        software = extractedMetadata.Creator || extractedMetadata.Producer || extractedMetadata.Software;
      }
      if (extractedMetadata.Author) {
        author = extractedMetadata.Author;
      }

      // Analyze metadata for authenticity indicators
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
          ...analysis.recommendations
        ],
        confidence: 0.85,
        processingTime: Date.now() - startTime
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
          pageCount: extractedMetadata.PageCount
        },
        confidence: 0.85
      };

    } catch (error) {
      logger.error(`Metadata analysis failed for ${request.filename}`, 'MetadataAnalyzer', undefined, error as Error);
      
      const failedCheck: VerificationCheck = {
        type: 'metadata',
        name: 'Metadata Analysis',
        status: 'fail',
        score: 0,
        description: 'Metadata analysis failed due to technical error',
        details: ['Failed to extract metadata', 'Ensure document is not corrupted'],
        confidence: 0.1,
        processingTime: Date.now() - startTime
      };

      return {
        checks: [failedCheck],
        metadata: {
          fileSize: request.size,
          hash: crypto.createHash('sha256').update(request.file).digest('hex')
        },
        confidence: 0.1
      };
    }
  }

  private async extractPDFMetadata(buffer: Buffer): Promise<Record<string, any>> {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const metadata: Record<string, any> = {};

      // Extract basic PDF metadata
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

      // Extract additional PDF-specific metadata
      metadata.PageCount = pdfDoc.getPageCount();
      // Note: pdf-lib doesn't provide getVersion() method

      return metadata;
    } catch (error) {
      logger.warn('Failed to extract PDF metadata', 'MetadataAnalyzer', { error: (error as Error).message });
      return {};
    }
  }

  private async extractImageMetadata(buffer: Buffer): Promise<Record<string, any>> {
    try {
      const parser = exifParser.create(buffer);
      const result = parser.parse();
      
      const metadata: Record<string, any> = {};

      if (result.tags) {
        // Map common EXIF tags
        if (result.tags.DateTime) metadata.CreationDate = new Date(result.tags.DateTime * 1000);
        if (result.tags.DateTimeOriginal) metadata.DateTimeOriginal = new Date(result.tags.DateTimeOriginal * 1000);
        if (result.tags.DateTimeDigitized) metadata.DateTimeDigitized = new Date(result.tags.DateTimeDigitized * 1000);
        if (result.tags.Software) metadata.Software = result.tags.Software;
        if (result.tags.Artist) metadata.Author = result.tags.Artist;
        if (result.tags.Copyright) metadata.Copyright = result.tags.Copyright;
        if (result.tags.Make) metadata.CameraMake = result.tags.Make;
        if (result.tags.Model) metadata.CameraModel = result.tags.Model;
        if (result.tags.ImageWidth) metadata.Width = result.tags.ImageWidth;
        if (result.tags.ImageHeight) metadata.Height = result.tags.ImageHeight;
        if (result.tags.XResolution) metadata.XResolution = result.tags.XResolution;
        if (result.tags.YResolution) metadata.YResolution = result.tags.YResolution;
        if (result.tags.ColorSpace) metadata.ColorSpace = result.tags.ColorSpace;
        if (result.tags.GPS) metadata.GPS = result.tags.GPS;
      }

      return metadata;
    } catch (error) {
      logger.warn('Failed to extract image metadata', 'MetadataAnalyzer', { error: (error as Error).message });
      return {};
    }
  }

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
    if (!metadata.CreationDate && !metadata.DateTimeOriginal) {
      score -= 20;
      issues.push('Missing creation date metadata');
      evidence.push({
        type: 'missing_metadata',
        description: 'Document lacks creation timestamp',
        severity: 'medium',
        confidence: 0.8
      });
    }

    // Check for suspicious software signatures
    if (metadata.Creator || metadata.Producer || metadata.Software) {
      const software = (metadata.Creator || metadata.Producer || metadata.Software).toLowerCase();
      
      // Known forgery tools
      const suspiciousSoftware = [
        'photoshop', 'gimp', 'paint.net', 'canva', 'figma',
        'pdf editor', 'pdf creator', 'fake document', 'document generator'
      ];
      
      const foundSuspicious = suspiciousSoftware.some(sus => software.includes(sus));
      if (foundSuspicious) {
        score -= 30;
        issues.push(`Document created with potentially suspicious software: ${software}`);
        evidence.push({
          type: 'suspicious_software',
          description: `Created with ${software}`,
          severity: 'high',
          confidence: 0.9
        });
      }
    }

    // Check for metadata inconsistencies
    if (metadata.CreationDate && metadata.ModDate) {
      const created = new Date(metadata.CreationDate);
      const modified = new Date(metadata.ModDate);
      
      if (modified < created) {
        score -= 25;
        issues.push('Modification date is before creation date');
        evidence.push({
          type: 'timestamp_inconsistency',
          description: 'Impossible timestamp sequence',
          severity: 'high',
          confidence: 0.95
        });
      }
      
      // Check for very recent modifications (potential tampering)
      const now = new Date();
      const timeSinceModification = now.getTime() - modified.getTime();
      const timeSinceUpload = now.getTime() - request.uploadedAt.getTime();
      
      if (timeSinceModification < timeSinceUpload - 60000) { // Modified more than 1 minute before upload
        score -= 15;
        issues.push('Document was recently modified before upload');
        evidence.push({
          type: 'recent_modification',
          description: 'Document modified shortly before verification',
          severity: 'medium',
          confidence: 0.7
        });
      }
    }

    // Check for missing author information in formal documents
    if (request.mimeType === 'application/pdf' && !metadata.Author && !metadata.Creator) {
      score -= 10;
      issues.push('Missing author information for PDF document');
      evidence.push({
        type: 'missing_author',
        description: 'Formal document lacks author metadata',
        severity: 'low',
        confidence: 0.6
      });
    }

    // Check for suspicious GPS data in images
    if (metadata.GPS && request.mimeType.startsWith('image/')) {
      // Check if GPS coordinates are in suspicious locations (known stock photo locations, etc.)
      const suspiciousLocations = [
        { lat: 40.7128, lng: -74.0060, name: 'New York Stock Photo Location' },
        { lat: 34.0522, lng: -118.2437, name: 'Los Angeles Stock Photo Location' }
      ];
      
      // This would be expanded with a comprehensive database of known stock photo locations
      score -= 5; // Minor deduction for having GPS data (could be stock photo)
      evidence.push({
        type: 'gps_metadata',
        description: 'Image contains GPS location data',
        severity: 'low',
        confidence: 0.5
      });
    }

    // Check for metadata that's too perfect (potential template)
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 20) {
      score -= 10;
      issues.push('Unusually comprehensive metadata (potential template)');
      evidence.push({
        type: 'excessive_metadata',
        description: 'Document has unusually complete metadata',
        severity: 'low',
        confidence: 0.6
      });
    }

    // Generate recommendations based on issues found
    if (issues.length === 0) {
      recommendations.push('Metadata appears authentic and consistent');
    } else {
      if (issues.some(issue => issue.includes('software'))) {
        recommendations.push('Verify document source and creation method');
      }
      if (issues.some(issue => issue.includes('timestamp'))) {
        recommendations.push('Request original document with unmodified timestamps');
      }
      if (issues.some(issue => issue.includes('author'))) {
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
      recommendations
    };
  }

  async getStatus(): Promise<any> {
    return {
      initialized: this.isInitialized,
      name: 'Metadata Analyzer',
      version: '1.0.0',
      supportedFormats: ['PDF', 'JPEG', 'PNG', 'TIFF'],
      capabilities: [
        'File hash calculation',
        'EXIF data extraction',
        'PDF metadata parsing',
        'Timestamp validation',
        'Software signature analysis',
        'Metadata consistency checking'
      ]
    };
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Metadata Analyzer...', 'MetadataAnalyzer');
    this.isInitialized = false;
    logger.info('Metadata Analyzer shutdown complete', 'MetadataAnalyzer');
  }
}