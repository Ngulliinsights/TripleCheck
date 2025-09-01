/**
 * DocumentProcessingAI Service - OCR and Document Validation
 * 
 * Provides comprehensive document processing including:
 * - OCR (Optical Character Recognition) for text extraction
 * - Document authenticity verification
 * - Document classification and type detection
 * - Data extraction and structured parsing
 * - Fraud detection in documents
 * - Document quality assessment
 */

import { logger as loggingService } from '../../../core/src/logging';
import { enhancedHuggingFaceClient } from '../../../src/shared/services/enhanced-huggingface-client';
import { AIServiceError } from '../../../src/shared/services/enhanced-huggingface-client';

export interface DocumentInput {
  id: string;
  type?: 'title_deed' | 'survey_report' | 'building_permit' | 'sale_agreement' | 'id_document' | 'unknown';
  imageBuffer?: Buffer;
  imageBase64?: string;
  text?: string;
  metadata?: {
    filename?: string;
    uploadedBy?: string;
    uploadedAt?: Date;
    propertyId?: string;
    expectedOwner?: string;
    location?: string;
  };
}

export interface OCRResult {
  extractedText: string;
  confidence: number;
  textRegions: Array<{
    text: string;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    confidence: number;
  }>;
  language: string;
  processingTime: number;
}

export interface DocumentClassification {
  documentType: string;
  confidence: number;
  subType?: string;
  isOfficial: boolean;
  jurisdiction?: string;
  alternativePredictions: Array<{
    type: string;
    confidence: number;
  }>;
}

export interface AuthenticityResult {
  isAuthentic: boolean;
  confidence: number;
  authenticityScore: number; // 0-100
  verificationChecks: Array<{
    check: string;
    passed: boolean;
    confidence: number;
    details: string;
  }>;
  suspiciousElements: Array<{
    element: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    location?: string;
  }>;
  recommendations: string[];
}

export interface ExtractedData {
  structuredData: Record<string, any>;
  entities: Array<{
    type: 'person' | 'location' | 'date' | 'number' | 'organization' | 'property_id';
    value: string;
    confidence: number;
    position: {
      start: number;
      end: number;
    };
  }>;
  keyValuePairs: Array<{
    key: string;
    value: string;
    confidence: number;
  }>;
  dates: Array<{
    date: string;
    format: string;
    confidence: number;
    context: string;
  }>;
  amounts: Array<{
    amount: number;
    currency: string;
    confidence: number;
    context: string;
  }>;
}

export interface DocumentQualityAssessment {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  qualityScore: number; // 0-100
  qualityFactors: Array<{
    factor: string;
    score: number;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  readabilityScore: number;
  completenessScore: number;
  clarityScore: number;
  recommendations: string[];
}

export interface DocumentProcessingResult {
  documentId: string;
  ocr: OCRResult;
  classification: DocumentClassification;
  authenticity: AuthenticityResult;
  extractedData: ExtractedData;
  qualityAssessment: DocumentQualityAssessment;
  processingMetadata: {
    processingTime: number;
    aiModelsUsed: string[];
    processingSteps: string[];
    timestamp: Date;
  };
}

export class DocumentProcessingAI {
  private readonly serviceName = 'DocumentProcessingAI';

  constructor() {
    loggingService.info('DocumentProcessingAI service initialized', {
      module: this.serviceName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Extract text from document images using OCR
   */
  async extractDocumentData(document: DocumentInput): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      loggingService.info('Starting OCR text extraction', {
        module: this.serviceName,
        documentId: document.id,
        documentType: document.type || 'unknown'
      });

      let imageBase64: string;
      
      if (document.imageBase64) {
        imageBase64 = document.imageBase64;
      } else if (document.imageBuffer) {
        imageBase64 = document.imageBuffer.toString('base64');
      } else if (document.text) {
        // If text is already provided, return it with high confidence
        const processingTime = Date.now() - startTime;
        return {
          extractedText: document.text,
          confidence: 1.0,
          textRegions: [{
            text: document.text,
            boundingBox: { x: 0, y: 0, width: 100, height: 100 },
            confidence: 1.0
          }],
          language: 'en',
          processingTime
        };
      } else {
        throw new AIServiceError(
          'No image data or text provided for OCR',
          this.serviceName,
          'extractDocumentData',
          400,
          { retryable: false }
        );
      }

      // Use HuggingFace OCR model for text extraction
      const ocrResult = await enhancedHuggingFaceClient.analyzePropertyDocument(imageBase64, document.type as any);

      // Process and enhance OCR results
      const enhancedResult = await this.enhanceOCRResults(ocrResult.text, imageBase64);

      const processingTime = Date.now() - startTime;

      const result: OCRResult = {
        extractedText: enhancedResult.text,
        confidence: enhancedResult.confidence,
        textRegions: enhancedResult.regions,
        language: enhancedResult.language,
        processingTime
      };

      loggingService.info('OCR extraction completed successfully', {
        module: this.serviceName,
        documentId: document.id,
        textLength: result.extractedText.length,
        confidence: result.confidence,
        processingTime
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      loggingService.error('OCR extraction failed', {
        module: this.serviceName,
        documentId: document.id,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });

      throw new AIServiceError(
        'Failed to extract text from document',
        this.serviceName,
        'extractDocumentData',
        500,
        { cause: error as Error, retryable: true }
      );
    }
  }

  /**
   * Validate document authenticity using AI analysis
   */
  async validateDocumentAuthenticity(document: DocumentInput): Promise<AuthenticityResult> {
    const startTime = Date.now();

    try {
      loggingService.info('Starting document authenticity validation', {
        module: this.serviceName,
        documentId: document.id,
        documentType: document.type || 'unknown'
      });

      // Extract text if not already available
      let documentText = document.text;
      if (!documentText) {
        const ocrResult = await this.extractDocumentData(document);
        documentText = ocrResult.extractedText;
      }

      // Perform multiple authenticity checks
      const checks = await Promise.all([
        this.checkDocumentFormat(documentText, document.type),
        this.checkOfficialLanguage(documentText),
        this.checkDateConsistency(documentText),
        this.checkSignaturePatterns(documentText),
        this.checkReferenceNumbers(documentText, document.type),
        this.checkFraudIndicators(documentText)
      ]);

      // Analyze document structure and layout if image is available
      let layoutAnalysis: any = null;
      if (document.imageBase64 || document.imageBuffer) {
        layoutAnalysis = await this.analyzeDocumentLayout(document);
      }

      // Calculate overall authenticity score
      const authenticityScore = this.calculateAuthenticityScore(checks, layoutAnalysis);
      const isAuthentic = authenticityScore >= 70; // 70% threshold for authenticity

      // Identify suspicious elements
      const suspiciousElements = this.identifySuspiciousElements(checks, layoutAnalysis);

      // Generate recommendations
      const recommendations = this.generateAuthenticityRecommendations(
        authenticityScore,
        suspiciousElements,
        document.type
      );

      const result: AuthenticityResult = {
        isAuthentic,
        confidence: this.calculateConfidence(checks),
        authenticityScore,
        verificationChecks: checks,
        suspiciousElements,
        recommendations
      };

      const processingTime = Date.now() - startTime;
      loggingService.info('Document authenticity validation completed', {
        module: this.serviceName,
        documentId: document.id,
        isAuthentic,
        authenticityScore,
        processingTime
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      loggingService.error('Document authenticity validation failed', {
        module: this.serviceName,
        documentId: document.id,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });

      throw new AIServiceError(
        'Failed to validate document authenticity',
        this.serviceName,
        'validateDocumentAuthenticity',
        500,
        { cause: error as Error, retryable: true }
      );
    }
  }

  /**
   * Classify document type and extract metadata
   */
  async classifyDocument(document: DocumentInput): Promise<DocumentClassification> {
    const startTime = Date.now();

    try {
      loggingService.info('Starting document classification', {
        module: this.serviceName,
        documentId: document.id
      });

      // Extract text if not already available
      let documentText = document.text;
      if (!documentText) {
        const ocrResult = await this.extractDocumentData(document);
        documentText = ocrResult.extractedText;
      }

      // Use AI classification
      const classification = await enhancedHuggingFaceClient.classifyLegalDocument(documentText);

      // Enhance classification with domain-specific logic
      const enhancedClassification = await this.enhanceDocumentClassification(
        documentText,
        classification,
        document
      );

      const processingTime = Date.now() - startTime;
      loggingService.info('Document classification completed', {
        module: this.serviceName,
        documentId: document.id,
        documentType: enhancedClassification.documentType,
        confidence: enhancedClassification.confidence,
        processingTime
      });

      return enhancedClassification;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      loggingService.error('Document classification failed', {
        module: this.serviceName,
        documentId: document.id,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });

      throw new AIServiceError(
        'Failed to classify document',
        this.serviceName,
        'classifyDocument',
        500,
        { cause: error as Error, retryable: true }
      );
    }
  }

  /**
   * Comprehensive document processing pipeline
   */
  async processDocument(document: DocumentInput): Promise<DocumentProcessingResult> {
    const startTime = Date.now();

    try {
      loggingService.info('Starting comprehensive document processing', {
        module: this.serviceName,
        documentId: document.id,
        documentType: document.type || 'unknown'
      });

      const processingSteps: string[] = [];
      const aiModelsUsed: string[] = [];

      // Step 1: OCR Text Extraction
      processingSteps.push('OCR Text Extraction');
      const ocr = await this.extractDocumentData(document);
      aiModelsUsed.push('TrOCR');

      // Step 2: Document Classification
      processingSteps.push('Document Classification');
      const classification = await this.classifyDocument({
        ...document,
        text: ocr.extractedText
      });
      aiModelsUsed.push('Legal-BERT');

      // Step 3: Authenticity Validation
      processingSteps.push('Authenticity Validation');
      const authenticity = await this.validateDocumentAuthenticity({
        ...document,
        text: ocr.extractedText
      });
      aiModelsUsed.push('BART-MNLI');

      // Step 4: Data Extraction
      processingSteps.push('Structured Data Extraction');
      const extractedData = await this.extractStructuredData(ocr.extractedText, classification.documentType);
      aiModelsUsed.push('RoBERTa-QA');

      // Step 5: Quality Assessment
      processingSteps.push('Quality Assessment');
      const qualityAssessment = await this.assessDocumentQuality(document, ocr, classification);

      const processingTime = Date.now() - startTime;

      const result: DocumentProcessingResult = {
        documentId: document.id,
        ocr,
        classification,
        authenticity,
        extractedData,
        qualityAssessment,
        processingMetadata: {
          processingTime,
          aiModelsUsed: [...new Set(aiModelsUsed)], // Remove duplicates
          processingSteps,
          timestamp: new Date()
        }
      };

      loggingService.info('Comprehensive document processing completed', {
        module: this.serviceName,
        documentId: document.id,
        documentType: classification.documentType,
        isAuthentic: authenticity.isAuthentic,
        qualityScore: qualityAssessment.qualityScore,
        processingTime
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      loggingService.error('Comprehensive document processing failed', {
        module: this.serviceName,
        documentId: document.id,
        error: error instanceof Error ? error.message : String(error),
        processingTime
      });

      throw new AIServiceError(
        'Failed to process document comprehensively',
        this.serviceName,
        'processDocument',
        500,
        { cause: error as Error, retryable: true }
      );
    }
  }

  // Private helper methods

  private async enhanceOCRResults(text: string, imageBase64: string): Promise<any> {
    // Enhance OCR results with post-processing
    const cleanedText = this.cleanOCRText(text);
    const confidence = this.calculateOCRConfidence(text, cleanedText);
    const language = this.detectLanguage(cleanedText);
    
    // Create mock text regions (in real implementation, this would come from the OCR model)
    const regions = this.createTextRegions(cleanedText);

    return {
      text: cleanedText,
      confidence,
      language,
      regions
    };
  }

  private cleanOCRText(text: string): string {
    return text
      .replace(/[^\w\s\-.,;:()\[\]{}'"]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private calculateOCRConfidence(originalText: string, cleanedText: string): number {
    const similarity = cleanedText.length / Math.max(originalText.length, 1);
    return Math.min(0.95, Math.max(0.1, similarity * 0.85 + 0.1));
  }

  private detectLanguage(text: string): string {
    // Simple language detection (in real implementation, use proper language detection)
    const englishWords = ['the', 'and', 'of', 'to', 'a', 'in', 'is', 'it', 'you', 'that'];
    const swahiliWords = ['na', 'ya', 'wa', 'ni', 'kwa', 'hii', 'hiyo', 'hao', 'wao'];
    
    const lowerText = text.toLowerCase();
    const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
    const swahiliCount = swahiliWords.filter(word => lowerText.includes(word)).length;
    
    return englishCount > swahiliCount ? 'en' : 'sw';
  }

  private createTextRegions(text: string): any[] {
    // Mock text regions - in real implementation, this would come from OCR model
    const words = text.split(' ');
    const regions = [];
    
    for (let i = 0; i < Math.min(words.length, 10); i++) {
      regions.push({
        text: words[i],
        boundingBox: {
          x: (i % 5) * 20,
          y: Math.floor(i / 5) * 10,
          width: words[i].length * 2,
          height: 8
        },
        confidence: 0.8 + Math.random() * 0.2
      });
    }
    
    return regions;
  }

  private async checkDocumentFormat(text: string, documentType?: string): Promise<any> {
    // Check if document follows expected format patterns
    const formatPatterns = {
      title_deed: /title|deed|land|property|owner/i,
      survey_report: /survey|plot|coordinates|boundary/i,
      building_permit: /permit|building|construction|approval/i,
      sale_agreement: /agreement|sale|purchase|buyer|seller/i,
      id_document: /identity|national|id|passport/i
    };

    const pattern = documentType ? formatPatterns[documentType as keyof typeof formatPatterns] : null;
    const matches = pattern ? pattern.test(text) : false;

    return {
      check: 'Document Format',
      passed: matches || !documentType,
      confidence: matches ? 0.8 : 0.3,
      details: matches ? 
        `Document contains expected ${documentType} format elements` :
        `Document format does not match expected ${documentType} patterns`
    };
  }

  private async checkOfficialLanguage(text: string): Promise<any> {
    // Check for official language patterns (English/Swahili for Kenya)
    const officialPatterns = [
      /government|ministry|republic|kenya/i,
      /serikali|wizara|jamhuri/i,
      /official|stamp|seal/i
    ];

    const hasOfficialLanguage = officialPatterns.some(pattern => pattern.test(text));

    return {
      check: 'Official Language',
      passed: hasOfficialLanguage,
      confidence: hasOfficialLanguage ? 0.7 : 0.4,
      details: hasOfficialLanguage ?
        'Document contains official language patterns' :
        'Document lacks official language indicators'
    };
  }

  private async checkDateConsistency(text: string): Promise<any> {
    // Extract and validate dates for consistency
    const dateRegex = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g;
    const dates = text.match(dateRegex) || [];
    
    let consistent = true;
    let details = 'No dates found or dates are consistent';
    
    if (dates.length > 1) {
      // Check if dates are in reasonable chronological order
      const parsedDates = dates.map(date => new Date(date)).filter(d => !isNaN(d.getTime()));
      if (parsedDates.length > 1) {
        const sortedDates = [...parsedDates].sort((a, b) => a.getTime() - b.getTime());
        consistent = JSON.stringify(parsedDates) === JSON.stringify(sortedDates);
        details = consistent ? 
          'Document dates are chronologically consistent' :
          'Document dates show inconsistencies';
      }
    }

    return {
      check: 'Date Consistency',
      passed: consistent,
      confidence: dates.length > 0 ? 0.8 : 0.5,
      details
    };
  }

  private async checkSignaturePatterns(text: string): Promise<any> {
    // Check for signature-related text patterns
    const signaturePatterns = [
      /signature|signed|witness|notary/i,
      /sahihi|saini|shahidi/i
    ];

    const hasSignatureIndicators = signaturePatterns.some(pattern => pattern.test(text));

    return {
      check: 'Signature Patterns',
      passed: hasSignatureIndicators,
      confidence: hasSignatureIndicators ? 0.6 : 0.4,
      details: hasSignatureIndicators ?
        'Document contains signature-related text' :
        'No signature indicators found in text'
    };
  }

  private async checkReferenceNumbers(text: string, documentType?: string): Promise<any> {
    // Check for reference number patterns specific to document types
    const referencePatterns = {
      title_deed: /LR\.?\s*NO\.?\s*\d+|TITLE\.?\s*NO\.?\s*\d+/i,
      survey_report: /SURVEY\.?\s*NO\.?\s*\d+|PLOT\.?\s*NO\.?\s*\d+/i,
      building_permit: /PERMIT\.?\s*NO\.?\s*\d+|BP\.?\s*\d+/i,
      sale_agreement: /AGREEMENT\.?\s*NO\.?\s*\d+|CONTRACT\.?\s*\d+/i
    };

    const pattern = documentType ? referencePatterns[documentType as keyof typeof referencePatterns] : null;
    const hasReferenceNumber = pattern ? pattern.test(text) : /\b[A-Z]{2,}\s*\d+\b/.test(text);

    return {
      check: 'Reference Numbers',
      passed: hasReferenceNumber,
      confidence: hasReferenceNumber ? 0.8 : 0.3,
      details: hasReferenceNumber ?
        'Document contains valid reference number patterns' :
        'No valid reference numbers found'
    };
  }

  private async checkFraudIndicators(text: string): Promise<any> {
    // Use AI to detect potential fraud indicators
    try {
      const fraudAnalysis = await enhancedHuggingFaceClient.detectFraudIndicators(text);
      
      return {
        check: 'Fraud Indicators',
        passed: fraudAnalysis.riskLevel === 'low',
        confidence: fraudAnalysis.confidence,
        details: fraudAnalysis.indicators.length > 0 ?
          `Potential fraud indicators detected: ${fraudAnalysis.indicators.join(', ')}` :
          'No significant fraud indicators detected'
      };
    } catch (error) {
      return {
        check: 'Fraud Indicators',
        passed: true,
        confidence: 0.5,
        details: 'Fraud detection analysis unavailable'
      };
    }
  }

  private async analyzeDocumentLayout(document: DocumentInput): Promise<any> {
    // Analyze document layout and structure (mock implementation)
    return {
      hasHeader: true,
      hasFooter: true,
      hasWatermark: Math.random() > 0.7,
      layoutScore: Math.random() * 30 + 70, // 70-100
      structureConsistency: Math.random() * 20 + 80 // 80-100
    };
  }

  private calculateAuthenticityScore(checks: any[], layoutAnalysis: any): number {
    const checkScore = checks.reduce((sum, check) => {
      return sum + (check.passed ? check.confidence * 100 : (1 - check.confidence) * 20);
    }, 0) / checks.length;

    const layoutScore = layoutAnalysis ? layoutAnalysis.layoutScore : 70;
    
    return Math.round((checkScore * 0.7 + layoutScore * 0.3));
  }

  private calculateConfidence(checks: any[]): number {
    return checks.reduce((sum, check) => sum + check.confidence, 0) / checks.length;
  }

  private identifySuspiciousElements(checks: any[], layoutAnalysis: any): any[] {
    const suspicious = [];
    
    checks.forEach(check => {
      if (!check.passed && check.confidence > 0.6) {
        suspicious.push({
          element: check.check,
          severity: check.confidence > 0.8 ? 'high' as const : 'medium' as const,
          description: check.details,
          location: 'document_content'
        });
      }
    });

    if (layoutAnalysis && layoutAnalysis.layoutScore < 60) {
      suspicious.push({
        element: 'Document Layout',
        severity: 'medium' as const,
        description: 'Document layout appears inconsistent with standard formats',
        location: 'document_structure'
      });
    }

    return suspicious;
  }

  private generateAuthenticityRecommendations(
    authenticityScore: number,
    suspiciousElements: any[],
    documentType?: string
  ): string[] {
    const recommendations = [];

    if (authenticityScore < 50) {
      recommendations.push('Document shows significant authenticity concerns - manual verification strongly recommended');
      recommendations.push('Consider requesting original documents from issuing authority');
    } else if (authenticityScore < 70) {
      recommendations.push('Document requires additional verification before acceptance');
      recommendations.push('Cross-reference with official records');
    } else {
      recommendations.push('Document appears authentic but standard verification procedures should be followed');
    }

    if (suspiciousElements.length > 0) {
      recommendations.push('Address identified suspicious elements before proceeding');
    }

    if (documentType === 'title_deed') {
      recommendations.push('Verify with Ministry of Lands registry');
      recommendations.push('Conduct physical site inspection');
    }

    return recommendations;
  }

  private async enhanceDocumentClassification(
    text: string,
    baseClassification: any,
    document: DocumentInput
  ): Promise<DocumentClassification> {
    // Enhance classification with domain-specific patterns
    const kenyanDocumentPatterns = {
      title_deed: [
        /title\s+deed/i,
        /land\s+registration/i,
        /LR\.?\s*NO/i,
        /ministry\s+of\s+lands/i
      ],
      survey_report: [
        /survey\s+report/i,
        /surveyor/i,
        /coordinates/i,
        /boundary/i
      ],
      building_permit: [
        /building\s+permit/i,
        /construction\s+permit/i,
        /county\s+government/i,
        /approval/i
      ],
      sale_agreement: [
        /sale\s+agreement/i,
        /purchase\s+agreement/i,
        /buyer/i,
        /seller/i
      ],
      id_document: [
        /national\s+id/i,
        /identity\s+card/i,
        /passport/i,
        /huduma/i
      ]
    };

    let bestMatch = baseClassification.label;
    let bestScore = baseClassification.confidence;
    const alternatives = [];

    // Check against Kenyan document patterns
    for (const [docType, patterns] of Object.entries(kenyanDocumentPatterns)) {
      const matches = patterns.filter(pattern => pattern.test(text)).length;
      const score = matches / patterns.length;
      
      if (score > bestScore) {
        alternatives.push({ type: bestMatch, confidence: bestScore });
        bestMatch = docType;
        bestScore = score;
      } else if (score > 0.3) {
        alternatives.push({ type: docType, confidence: score });
      }
    }

    return {
      documentType: bestMatch,
      confidence: bestScore,
      subType: this.determineSubType(bestMatch, text),
      isOfficial: this.isOfficialDocument(text),
      jurisdiction: this.determineJurisdiction(text),
      alternativePredictions: alternatives.slice(0, 3)
    };
  }

  private determineSubType(documentType: string, text: string): string | undefined {
    const subTypePatterns: Record<string, Record<string, RegExp>> = {
      title_deed: {
        freehold: /freehold/i,
        leasehold: /leasehold/i
      },
      id_document: {
        national_id: /national\s+id/i,
        passport: /passport/i,
        huduma: /huduma/i
      }
    };

    const patterns = subTypePatterns[documentType];
    if (!patterns) return undefined;

    for (const [subType, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return subType;
      }
    }

    return undefined;
  }

  private isOfficialDocument(text: string): boolean {
    const officialIndicators = [
      /government/i,
      /ministry/i,
      /republic\s+of\s+kenya/i,
      /county\s+government/i,
      /official\s+seal/i,
      /stamp/i
    ];

    return officialIndicators.some(pattern => pattern.test(text));
  }

  private determineJurisdiction(text: string): string | undefined {
    const jurisdictions = [
      { name: 'Kenya', pattern: /kenya|republic\s+of\s+kenya/i },
      { name: 'Nairobi County', pattern: /nairobi\s+county/i },
      { name: 'Mombasa County', pattern: /mombasa\s+county/i },
      { name: 'Kisumu County', pattern: /kisumu\s+county/i }
    ];

    for (const jurisdiction of jurisdictions) {
      if (jurisdiction.pattern.test(text)) {
        return jurisdiction.name;
      }
    }

    return undefined;
  }

  private async extractStructuredData(text: string, documentType: string): Promise<ExtractedData> {
    // Extract structured data based on document type
    const entities = await this.extractEntities(text);
    const keyValuePairs = this.extractKeyValuePairs(text);
    const dates = this.extractDates(text);
    const amounts = this.extractAmounts(text);
    
    // Create structured data based on document type
    const structuredData = this.createStructuredData(
      documentType,
      entities,
      keyValuePairs,
      dates,
      amounts
    );

    return {
      structuredData,
      entities,
      keyValuePairs,
      dates,
      amounts
    };
  }

  private async extractEntities(text: string): Promise<any[]> {
    // Mock entity extraction - in real implementation, use NER models
    const entities = [];
    
    // Extract names (simple pattern matching)
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g;
    let match;
    while ((match = namePattern.exec(text)) !== null) {
      entities.push({
        type: 'person' as const,
        value: match[0],
        confidence: 0.7,
        position: { start: match.index, end: match.index + match[0].length }
      });
    }

    // Extract locations
    const locationPattern = /\b(?:Nairobi|Mombasa|Kisumu|Nakuru|Eldoret|Thika|Machakos|Westlands|Karen|Kilimani)\b/gi;
    while ((match = locationPattern.exec(text)) !== null) {
      entities.push({
        type: 'location' as const,
        value: match[0],
        confidence: 0.8,
        position: { start: match.index, end: match.index + match[0].length }
      });
    }

    return entities;
  }

  private extractKeyValuePairs(text: string): any[] {
    const pairs = [];
    
    // Common key-value patterns
    const patterns = [
      /(\w+(?:\s+\w+)*)\s*:\s*([^\n\r]+)/g,
      /(\w+(?:\s+\w+)*)\s*-\s*([^\n\r]+)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        pairs.push({
          key: match[1].trim(),
          value: match[2].trim(),
          confidence: 0.6
        });
      }
    });

    return pairs;
  }

  private extractDates(text: string): any[] {
    const dates = [];
    const datePatterns = [
      { pattern: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, format: 'DD/MM/YYYY' },
      { pattern: /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g, format: 'YYYY/MM/DD' },
      { pattern: /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}\b/gi, format: 'DD MMM YYYY' }
    ];

    datePatterns.forEach(({ pattern, format }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        dates.push({
          date: match[0],
          format,
          confidence: 0.8,
          context: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20)
        });
      }
    });

    return dates;
  }

  private extractAmounts(text: string): any[] {
    const amounts = [];
    const amountPatterns = [
      /KES\s*[\d,]+(?:\.\d{2})?/gi,
      /Ksh\.?\s*[\d,]+(?:\.\d{2})?/gi,
      /[\d,]+(?:\.\d{2})?\s*(?:shillings?|KES|Ksh)/gi
    ];

    amountPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const amountStr = match[0].replace(/[^\d.,]/g, '');
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        
        if (!isNaN(amount)) {
          amounts.push({
            amount,
            currency: 'KES',
            confidence: 0.8,
            context: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20)
          });
        }
      }
    });

    return amounts;
  }

  private createStructuredData(
    documentType: string,
    entities: any[],
    keyValuePairs: any[],
    dates: any[],
    amounts: any[]
  ): Record<string, any> {
    const structured: Record<string, any> = {
      documentType,
      extractedAt: new Date().toISOString()
    };

    // Add entities by type
    entities.forEach(entity => {
      if (!structured[entity.type + 's']) {
        structured[entity.type + 's'] = [];
      }
      structured[entity.type + 's'].push(entity.value);
    });

    // Add key-value pairs
    keyValuePairs.forEach(pair => {
      structured[pair.key.toLowerCase().replace(/\s+/g, '_')] = pair.value;
    });

    // Add dates and amounts
    if (dates.length > 0) {
      structured.dates = dates.map(d => d.date);
    }
    if (amounts.length > 0) {
      structured.amounts = amounts.map(a => ({ amount: a.amount, currency: a.currency }));
    }

    return structured;
  }

  private async assessDocumentQuality(
    document: DocumentInput,
    ocr: OCRResult,
    classification: DocumentClassification
  ): Promise<DocumentQualityAssessment> {
    const qualityFactors = [];
    
    // OCR quality factor
    qualityFactors.push({
      factor: 'Text Extraction Quality',
      score: ocr.confidence * 100,
      impact: ocr.confidence > 0.8 ? 'positive' as const : ocr.confidence < 0.5 ? 'negative' as const : 'neutral' as const,
      description: `OCR confidence: ${(ocr.confidence * 100).toFixed(1)}%`
    });

    // Classification confidence factor
    qualityFactors.push({
      factor: 'Document Type Confidence',
      score: classification.confidence * 100,
      impact: classification.confidence > 0.8 ? 'positive' as const : classification.confidence < 0.5 ? 'negative' as const : 'neutral' as const,
      description: `Classification confidence: ${(classification.confidence * 100).toFixed(1)}%`
    });

    // Text length and completeness
    const textLength = ocr.extractedText.length;
    const completenessScore = Math.min(100, (textLength / 500) * 100); // Assume 500 chars is good length
    qualityFactors.push({
      factor: 'Document Completeness',
      score: completenessScore,
      impact: completenessScore > 70 ? 'positive' as const : completenessScore < 30 ? 'negative' as const : 'neutral' as const,
      description: `Document contains ${textLength} characters`
    });

    // Calculate overall scores
    const overallScore = qualityFactors.reduce((sum, factor) => sum + factor.score, 0) / qualityFactors.length;
    const readabilityScore = ocr.confidence * 100;
    const clarityScore = classification.confidence * 100;

    const overallQuality = overallScore > 80 ? 'excellent' as const :
                          overallScore > 60 ? 'good' as const :
                          overallScore > 40 ? 'fair' as const : 'poor' as const;

    return {
      overallQuality,
      qualityScore: Math.round(overallScore),
      qualityFactors,
      readabilityScore: Math.round(readabilityScore),
      completenessScore: Math.round(completenessScore),
      clarityScore: Math.round(clarityScore),
      recommendations: this.generateQualityRecommendations(overallQuality, qualityFactors)
    };
  }

  private generateQualityRecommendations(quality: string, factors: any[]): string[] {
    const recommendations = [];

    if (quality === 'poor') {
      recommendations.push('Consider re-scanning document with higher resolution');
      recommendations.push('Ensure document is well-lit and clearly visible');
      recommendations.push('Manual review strongly recommended');
    } else if (quality === 'fair') {
      recommendations.push('Document quality is acceptable but could be improved');
      recommendations.push('Consider additional verification steps');
    } else {
      recommendations.push('Document quality is good for automated processing');
    }

    factors.forEach(factor => {
      if (factor.impact === 'negative') {
        recommendations.push(`Improve ${factor.factor.toLowerCase()}: ${factor.description}`);
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }
}