import { EventEmitter } from 'events';

import { ContentAnalyzer } from '../analyzers/ContentAnalyzer';
import { MetadataAnalyzer } from '../analyzers/MetadataAnalyzer';
import { SignatureAnalyzer } from '../analyzers/SignatureAnalyzer';
import { VisualAnalyzer } from '../analyzers/VisualAnalyzer';
import { ForgeryDetector } from '../ml/ForgeryDetector';
import { MLDocumentClassifier } from '../ml/MLDocumentClassifier';
import { DatabaseService } from '..\..\fraud-detection\services\DatabaseService';
import { Logger } from '..\..\fraud-detection\utils\Logger';

export interface DocumentAnalysisRequest {
  id: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface DocumentAnalysisResult {
  id: string;
  filename: string;
  documentType: string;
  verified: boolean;
  confidence: number;
  status: 'authentic' | 'suspicious' | 'forged' | 'processing';
  checks: {
    metadata: CheckResult;
    visual: CheckResult;
    signature: CheckResult;
    content: CheckResult;
  };
  issues: string[];
  recommendations: string[];
  processingTime: number;
  analysisDetails: AnalysisDetails;
}

export interface CheckResult {
  passed: boolean;
  score: number;
  details: string;
  evidence: Evidence[];
}

export interface Evidence {
  type: 'metadata' | 'visual' | 'signature' | 'content' | 'behavioral';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  data: any;
}

export interface AnalysisDetails {
  fileHash: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  pageCount?: number;
  creationDate?: Date;
  modificationDate?: Date;
  software?: string;
  author?: string;
  digitalSignatures: DigitalSignature[];
  anomalies: Anomaly[];
  similarityMatches: SimilarityMatch[];
}

export interface DigitalSignature {
  valid: boolean;
  issuer: string;
  subject: string;
  validFrom: Date;
  validTo: Date;
  algorithm: string;
  trusted: boolean;
}

export interface Anomaly {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: { x: number; y: number; width: number; height: number };
  confidence: number;
}

export interface SimilarityMatch {
  documentId: string;
  similarity: number;
  matchType: 'exact' | 'near_duplicate' | 'template' | 'partial';
  matchedRegions: Array<{ x: number; y: number; width: number; height: number }>;
}

export class DocumentAuthEngine extends EventEmitter {
  private logger: Logger;
  private metadataAnalyzer: MetadataAnalyzer;
  private visualAnalyzer: VisualAnalyzer;
  private signatureAnalyzer: SignatureAnalyzer;
  private contentAnalyzer: ContentAnalyzer;
  private mlClassifier: MLDocumentClassifier;
  private forgeryDetector: ForgeryDetector;
  private database: DatabaseService;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.logger = new Logger('DocumentAuthEngine');
    this.metadataAnalyzer = new MetadataAnalyzer();
    this.visualAnalyzer = new VisualAnalyzer();
    this.signatureAnalyzer = new SignatureAnalyzer();
    this.contentAnalyzer = new ContentAnalyzer();
    this.mlClassifier = new MLDocumentClassifier();
    this.forgeryDetector = new ForgeryDetector();
    this.database = new DatabaseService();
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Document Authentication Engine...');
      
      await Promise.all([
        this.metadataAnalyzer.initialize(),
        this.visualAnalyzer.initialize(),
        this.signatureAnalyzer.initialize(),
        this.contentAnalyzer.initialize(),
        this.mlClassifier.initialize(),
        this.forgeryDetector.initialize(),
        this.database.initialize()
      ]);

      this.isInitialized = true;
      this.logger.info('Document Authentication Engine initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error({ error: error }, 'Failed to initialize Document Authentication Engine');
      throw error;
    }
  }

  async analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();
    this.logger.info(`Analyzing document: ${request.filename}`);

    try {
      // Emit processing start event
      this.emit('analysis_started', { id: request.id, filename: request.filename });

      // Run parallel analysis
      const [
        metadataResult,
        visualResult,
        signatureResult,
        contentResult,
        classificationResult,
        forgeryResult
      ] = await Promise.all([
        this.metadataAnalyzer.analyze(request),
        this.visualAnalyzer.analyze(request),
        this.signatureAnalyzer.analyze(request),
        this.contentAnalyzer.analyze(request),
        this.mlClassifier.classify(request),
        this.forgeryDetector.detect(request)
      ]);

      // Combine results and calculate overall score
      const combinedResult = await this.combineAnalysisResults({
        request,
        metadata: metadataResult,
        visual: visualResult,
        signature: signatureResult,
        content: contentResult,
        classification: classificationResult,
        forgery: forgeryResult,
        processingTime: Date.now() - startTime
      });

      // Store results in database
      await this.database.storeAnalysisResult(combinedResult);

      // Emit completion event
      this.emit('analysis_completed', combinedResult);

      this.logger.info(`Document analysis completed: ${request.filename} - ${combinedResult.status}`);
      return combinedResult;

    } catch (error) {
      this.logger.error({ error: error }, 'Document analysis failed: ${request.filename}');
      
      const errorResult: DocumentAnalysisResult = {
        id: request.id,
        filename: request.filename,
        documentType: 'unknown',
        verified: false,
        confidence: 0,
        status: 'processing',
        checks: {
          metadata: { passed: false, score: 0, details: 'Analysis failed', evidence: [] },
          visual: { passed: false, score: 0, details: 'Analysis failed', evidence: [] },
          signature: { passed: false, score: 0, details: 'Analysis failed', evidence: [] },
          content: { passed: false, score: 0, details: 'Analysis failed', evidence: [] }
        },
        issues: ['Analysis failed due to technical error'],
        recommendations: ['Please try uploading the document again'],
        processingTime: Date.now() - startTime,
        analysisDetails: {
          fileHash: '',
          fileSize: request.size,
          digitalSignatures: [],
          anomalies: [],
          similarityMatches: []
        }
      };

      this.emit('analysis_failed', { id: request.id, error: error.message });
      return errorResult;
    }
  }

  async analyzeBatch(requests: DocumentAnalysisRequest[]): Promise<DocumentAnalysisResult[]> {
    this.logger.info(`Starting batch analysis of ${requests.length} documents`);
    
    const results: DocumentAnalysisResult[] = [];
    const batchSize = 5; // Process 5 documents concurrently
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(request => this.analyzeDocument(request))
      );
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.error(`Batch analysis failed for document ${batch[index].filename}`, result.reason);
          // Create error result for failed analysis
          results.push({
            id: batch[index].id,
            filename: batch[index].filename,
            documentType: 'unknown',
            verified: false,
            confidence: 0,
            status: 'processing',
            checks: {
              metadata: { passed: false, score: 0, details: 'Batch analysis failed', evidence: [] },
              visual: { passed: false, score: 0, details: 'Batch analysis failed', evidence: [] },
              signature: { passed: false, score: 0, details: 'Batch analysis failed', evidence: [] },
              content: { passed: false, score: 0, details: 'Batch analysis failed', evidence: [] }
            },
            issues: ['Batch analysis failed'],
            recommendations: ['Please try uploading the document individually'],
            processingTime: 0,
            analysisDetails: {
              fileHash: '',
              fileSize: batch[index].size,
              digitalSignatures: [],
              anomalies: [],
              similarityMatches: []
            }
          });
        }
      });
    }
    
    this.logger.info(`Batch analysis completed: ${results.length} documents processed`);
    return results;
  }

  private async combineAnalysisResults(data: {
    request: DocumentAnalysisRequest;
    metadata: any;
    visual: any;
    signature: any;
    content: any;
    classification: any;
    forgery: any;
    processingTime: number;
  }): Promise<DocumentAnalysisResult> {
    
    const { request, metadata, visual, signature, content, classification, forgery, processingTime } = data;

    // Calculate individual check scores
    const metadataCheck: CheckResult = {
      passed: metadata.score >= 70,
      score: metadata.score,
      details: metadata.summary,
      evidence: metadata.evidence || []
    };

    const visualCheck: CheckResult = {
      passed: visual.score >= 70,
      score: visual.score,
      details: visual.summary,
      evidence: visual.evidence || []
    };

    const signatureCheck: CheckResult = {
      passed: signature.score >= 70,
      score: signature.score,
      details: signature.summary,
      evidence: signature.evidence || []
    };

    const contentCheck: CheckResult = {
      passed: content.score >= 70,
      score: content.score,
      details: content.summary,
      evidence: content.evidence || []
    };

    // Calculate weighted overall confidence
    const weights = {
      metadata: 0.2,
      visual: 0.3,
      signature: 0.25,
      content: 0.25
    };

    const overallConfidence = Math.round(
      metadata.score * weights.metadata +
      visual.score * weights.visual +
      signature.score * weights.signature +
      content.score * weights.content
    );

    // Determine verification status
    const verified = overallConfidence >= 70 && forgery.riskScore < 0.3;
    
    let status: DocumentAnalysisResult['status'];
    if (forgery.riskScore > 0.7) {
      status = 'forged';
    } else if (overallConfidence < 50 || forgery.riskScore > 0.4) {
      status = 'suspicious';
    } else if (verified) {
      status = 'authentic';
    } else {
      status = 'suspicious';
    }

    // Collect issues and recommendations
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (metadata.issues) issues.push(...metadata.issues);
    if (visual.issues) issues.push(...visual.issues);
    if (signature.issues) issues.push(...signature.issues);
    if (content.issues) issues.push(...content.issues);
    if (forgery.issues) issues.push(...forgery.issues);

    if (metadata.recommendations) recommendations.push(...metadata.recommendations);
    if (visual.recommendations) recommendations.push(...visual.recommendations);
    if (signature.recommendations) recommendations.push(...signature.recommendations);
    if (content.recommendations) recommendations.push(...content.recommendations);
    if (forgery.recommendations) recommendations.push(...forgery.recommendations);

    // Build analysis details
    const analysisDetails: AnalysisDetails = {
      fileHash: metadata.fileHash || '',
      fileSize: request.size,
      dimensions: visual.dimensions,
      pageCount: content.pageCount,
      creationDate: metadata.creationDate,
      modificationDate: metadata.modificationDate,
      software: metadata.software,
      author: metadata.author,
      digitalSignatures: signature.signatures || [],
      anomalies: [
        ...(visual.anomalies || []),
        ...(content.anomalies || []),
        ...(forgery.anomalies || [])
      ],
      similarityMatches: visual.similarityMatches || []
    };

    return {
      id: request.id,
      filename: request.filename,
      documentType: classification.documentType || 'unknown',
      verified,
      confidence: overallConfidence,
      status,
      checks: {
        metadata: metadataCheck,
        visual: visualCheck,
        signature: signatureCheck,
        content: contentCheck
      },
      issues: [...new Set(issues)], // Remove duplicates
      recommendations: [...new Set(recommendations)], // Remove duplicates
      processingTime,
      analysisDetails
    };
  }

  async getAnalysisHistory(limit: number = 100): Promise<DocumentAnalysisResult[]> {
    return await this.database.getAnalysisHistory(limit);
  }

  async getAnalysisById(id: string): Promise<DocumentAnalysisResult | null> {
    return await this.database.getAnalysisById(id);
  }

  async getSystemStats(): Promise<any> {
    const stats = await this.database.getSystemStats();
    
    return {
      ...stats,
      isInitialized: this.isInitialized,
      uptime: process.uptime(),
      analyzers: {
        metadata: await this.metadataAnalyzer.getStatus(),
        visual: await this.visualAnalyzer.getStatus(),
        signature: await this.signatureAnalyzer.getStatus(),
        content: await this.contentAnalyzer.getStatus(),
        mlClassifier: await this.mlClassifier.getStatus(),
        forgeryDetector: await this.forgeryDetector.getStatus()
      }
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Document Authentication Engine...');
    
    await Promise.all([
      this.metadataAnalyzer.shutdown(),
      this.visualAnalyzer.shutdown(),
      this.signatureAnalyzer.shutdown(),
      this.contentAnalyzer.shutdown(),
      this.mlClassifier.shutdown(),
      this.forgeryDetector.shutdown(),
      this.database.shutdown()
    ]);
    
    this.isInitialized = false;
    this.logger.info('Document Authentication Engine shutdown complete');
  }
}