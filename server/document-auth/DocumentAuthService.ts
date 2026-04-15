import { EventEmitter } from "events";

import { logger } from "../infrastructure/observability/telemetry";

import { ContentAnalyzer } from "./analyzers/ContentAnalyzer";
import {
  LandDocumentAnalyzer,
  LandDocumentAnalysisResult,
} from "./analyzers/LandDocumentAnalyzer";
import { MetadataAnalyzer } from "./analyzers/MetadataAnalyzer";
import { MLDocumentAnalyzer } from "./analyzers/MLDocumentAnalyzer";
import { SignatureAnalyzer } from "./analyzers/SignatureAnalyzer";
import { VisualAnalyzer } from "./analyzers/VisualAnalyzer";

export interface DocumentVerificationRequest {
  id: string;
  file: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  userId?: string;
  propertyId?: string;
}

export interface DocumentVerificationResult {
  id: string;
  documentId: string;
  overallScore: number;
  status: "authentic" | "suspicious" | "forged";
  confidence: number;
  checks: VerificationCheck[];
  metadata: DocumentMetadata;
  processedAt: Date;
  processingTime: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
  landSpecificData?: import("./analyzers/LandDocumentAnalyzer").LandDocumentData;
}

export interface VerificationCheck {
  type: "metadata" | "visual" | "signature" | "content" | "format";
  name: string;
  status: "pass" | "fail" | "warning";
  score: number;
  description: string;
  details: string[];
  confidence: number;
  processingTime: number;
}

export interface DocumentMetadata {
  creationDate?: Date;
  modificationDate?: Date;
  author?: string;
  software?: string;
  version?: string;
  pageCount?: number;
  fileSize: number;
  hash: string;
  digitalSignature?: boolean;
  compressionRatio?: number;
  colorProfile?: string;
  resolution?: { width: number; height: number; dpi: number };
  fonts?: string[];
  embeddedObjects?: number;
}

export interface RiskFactor {
  category: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  evidence: string[];
}

export class DocumentAuthService extends EventEmitter {
  private mlAnalyzer: MLDocumentAnalyzer;
  private metadataAnalyzer: MetadataAnalyzer;
  private visualAnalyzer: VisualAnalyzer;
  private signatureAnalyzer: SignatureAnalyzer;
  private contentAnalyzer: ContentAnalyzer;
  private landDocumentAnalyzer: LandDocumentAnalyzer;
  private processingQueue: Map<string, DocumentVerificationRequest> = new Map();
  private results: Map<string, DocumentVerificationResult> = new Map();

  constructor() {
    super();
    this.mlAnalyzer = new MLDocumentAnalyzer();
    this.metadataAnalyzer = new MetadataAnalyzer();
    this.visualAnalyzer = new VisualAnalyzer();
    this.signatureAnalyzer = new SignatureAnalyzer();
    this.contentAnalyzer = new ContentAnalyzer();
    this.landDocumentAnalyzer = new LandDocumentAnalyzer();
  }

  async initialize(): Promise<void> {
    logger.info(
      "Initializing Document Authentication Service...",
      "DocumentAuthService"
    );

    await Promise.all([
      this.mlAnalyzer.initialize(),
      this.metadataAnalyzer.initialize(),
      this.visualAnalyzer.initialize(),
      this.signatureAnalyzer.initialize(),
      this.contentAnalyzer.initialize(),
      this.landDocumentAnalyzer.initialize(),
    ]);

    logger.info(
      "Document Authentication Service initialized",
      "DocumentAuthService"
    );
  }

  async verifyDocument(
    request: DocumentVerificationRequest
  ): Promise<DocumentVerificationResult> {
    const startTime = Date.now();
    logger.info(
      `Starting document verification: ${request.id}`,
      "DocumentAuthService"
    );

    try {
      // Add to processing queue
      this.processingQueue.set(request.id, request);
      this.emit("verification_started", { documentId: request.id });

      // Run all analyzers in parallel
      const [
        metadataResult,
        visualResult,
        signatureResult,
        contentResult,
        mlResult,
        landDocumentResult,
      ] = await Promise.all([
        this.metadataAnalyzer.analyze(request),
        this.visualAnalyzer.analyze(request),
        this.signatureAnalyzer.analyze(request),
        this.contentAnalyzer.analyze(request),
        this.mlAnalyzer.analyze(request),
        this.landDocumentAnalyzer.analyze(request),
      ]);

      // Combine all verification checks
      const allChecks: VerificationCheck[] = [
        ...metadataResult.checks,
        ...visualResult.checks,
        ...signatureResult.checks,
        ...contentResult.checks,
        ...mlResult.checks,
        ...landDocumentResult.checks,
      ];

      // Calculate overall score and status
      const overallScore = this.calculateOverallScore(allChecks);
      const status = this.determineStatus(overallScore, allChecks);
      const confidence = this.calculateConfidence(allChecks);

      // Extract metadata
      const metadata = this.combineMetadata([
        metadataResult.metadata,
        visualResult.metadata,
        contentResult.metadata,
      ]);

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(allChecks, metadata);

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        status,
        riskFactors,
        allChecks
      );

      const result: DocumentVerificationResult = {
        id: `verification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        documentId: request.id,
        overallScore,
        status,
        confidence,
        checks: allChecks,
        metadata,
        processedAt: new Date(),
        processingTime: Date.now() - startTime,
        riskFactors,
        recommendations,
        landSpecificData: landDocumentResult.landSpecificData,
      };

      // Store result
      this.results.set(request.id, result);
      this.processingQueue.delete(request.id);

      // Emit events
      this.emit("verification_completed", { documentId: request.id, result });

      if (status === "forged" || status === "suspicious") {
        this.emit("suspicious_document", { documentId: request.id, result });
      }

      logger.info(
        `Document verification completed: ${request.id} - Status: ${status} - Score: ${overallScore}`,
        "DocumentAuthService"
      );
      return result;
    } catch (error) {
      logger.error(
        `Document verification failed: ${request.id}`,
        "DocumentAuthService",
        undefined,
        error as Error
      );
      this.processingQueue.delete(request.id);
      this.emit("verification_failed", {
        documentId: request.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private calculateOverallScore(checks: VerificationCheck[]): number {
    if (checks.length === 0) return 0;

    // Weight different check types
    const weights = {
      metadata: 0.2,
      visual: 0.3,
      signature: 0.25,
      content: 0.15,
      format: 0.1,
    };

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const check of checks) {
      const weight = weights[check.type] || 0.1;
      totalWeightedScore += check.score * weight * check.confidence;
      totalWeight += weight * check.confidence;
    }

    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  }

  private determineStatus(
    overallScore: number,
    checks: VerificationCheck[]
  ): "authentic" | "suspicious" | "forged" {
    // Check for critical failures
    const criticalFailures = checks.filter(
      (check) => check.status === "fail" && check.score < 30
    );

    if (criticalFailures.length > 0) {
      return "forged";
    }

    // Check overall score thresholds
    if (overallScore >= 80) {
      return "authentic";
    } else if (overallScore >= 60) {
      return "suspicious";
    } else {
      return "forged";
    }
  }

  private calculateConfidence(checks: VerificationCheck[]): number {
    if (checks.length === 0) return 0;

    const avgConfidence =
      checks.reduce((sum, check) => sum + check.confidence, 0) / checks.length;

    // Adjust confidence based on number of checks
    const checkCountFactor = Math.min(1, checks.length / 10); // Optimal around 10 checks

    return Math.round(avgConfidence * checkCountFactor * 100) / 100;
  }

  private combineMetadata(
    metadataArray: Partial<DocumentMetadata>[]
  ): DocumentMetadata {
    const combined: DocumentMetadata = {
      fileSize: 0,
      hash: "",
    };

    for (const metadata of metadataArray) {
      Object.assign(combined, metadata);
    }

    return combined;
  }

  private identifyRiskFactors(
    checks: VerificationCheck[],
    metadata: DocumentMetadata
  ): RiskFactor[] {
    const riskFactors: RiskFactor[] = [];

    // Metadata-based risk factors
    if (metadata.creationDate && metadata.modificationDate) {
      const timeDiff =
        metadata.modificationDate.getTime() - metadata.creationDate.getTime();
      if (timeDiff < 60000) {
        // Modified within 1 minute of creation
        riskFactors.push({
          category: "Temporal Anomaly",
          description:
            "Document was modified immediately after creation, suggesting potential tampering",
          severity: "medium",
          confidence: 0.7,
          evidence: ["creation_modification_time_gap"],
        });
      }
    }

    // Check-based risk factors
    const failedChecks = checks.filter((check) => check.status === "fail");
    if (failedChecks.length > 2) {
      riskFactors.push({
        category: "Multiple Verification Failures",
        description: `${failedChecks.length} verification checks failed`,
        severity: "high",
        confidence: 0.9,
        evidence: failedChecks.map((check) => check.name),
      });
    }

    // Visual analysis risk factors
    const visualChecks = checks.filter((check) => check.type === "visual");
    const suspiciousVisual = visualChecks.filter((check) => check.score < 50);
    if (suspiciousVisual.length > 0) {
      riskFactors.push({
        category: "Visual Inconsistencies",
        description: "Visual analysis detected potential image manipulation",
        severity: "high",
        confidence: 0.8,
        evidence: suspiciousVisual.map((check) => check.name),
      });
    }

    // Signature-related risk factors
    const signatureChecks = checks.filter(
      (check) => check.type === "signature"
    );
    const invalidSignatures = signatureChecks.filter(
      (check) => check.status === "fail"
    );
    if (invalidSignatures.length > 0) {
      riskFactors.push({
        category: "Digital Signature Issues",
        description:
          "Digital signature verification failed or signatures are missing",
        severity: "critical",
        confidence: 0.95,
        evidence: invalidSignatures.map((check) => check.name),
      });
    }

    return riskFactors;
  }

  private generateRecommendations(
    status: DocumentVerificationResult["status"],
    riskFactors: RiskFactor[],
    checks: VerificationCheck[]
  ): string[] {
    const recommendations: string[] = [];

    switch (status) {
      case "authentic":
        recommendations.push(
          "Document appears authentic and can be used with confidence"
        );
        if (riskFactors.length > 0) {
          recommendations.push(
            "Monitor for any additional verification requirements"
          );
        }
        break;

      case "suspicious":
        recommendations.push(
          "Document requires additional verification before use"
        );
        recommendations.push(
          "Consider requesting original documents or additional documentation"
        );
        recommendations.push(
          "Consult with legal counsel if document is critical to transaction"
        );
        break;

      case "forged":
        recommendations.push(
          "DO NOT USE - Document appears to be forged or heavily tampered"
        );
        recommendations.push(
          "Report to appropriate authorities if fraud is suspected"
        );
        recommendations.push(
          "Request new, original documentation from authorized sources"
        );
        recommendations.push(
          "Consider legal action if document was provided fraudulently"
        );
        break;
    }

    // Risk factor specific recommendations
    for (const riskFactor of riskFactors) {
      switch (riskFactor.category) {
        case "Digital Signature Issues":
          recommendations.push(
            "Verify digital signatures with issuing authority"
          );
          break;
        case "Visual Inconsistencies":
          recommendations.push(
            "Request high-resolution scans or original documents"
          );
          break;
        case "Multiple Verification Failures":
          recommendations.push(
            "Conduct manual review by document authentication expert"
          );
          break;
      }
    }

    // Check-specific recommendations
    const failedChecks = checks.filter((check) => check.status === "fail");
    if (failedChecks.some((check) => check.type === "metadata")) {
      recommendations.push("Verify document creation and modification history");
    }
    if (failedChecks.some((check) => check.type === "content")) {
      recommendations.push(
        "Cross-reference document content with official records"
      );
    }

    return Array.from(new Set(recommendations)); // Remove duplicates
  }

  async getVerificationResult(
    documentId: string
  ): Promise<DocumentVerificationResult | null> {
    return this.results.get(documentId) || null;
  }

  async getProcessingStatus(
    documentId: string
  ): Promise<"processing" | "completed" | "not_found"> {
    if (this.processingQueue.has(documentId)) {
      return "processing";
    }
    if (this.results.has(documentId)) {
      return "completed";
    }
    return "not_found";
  }

  async getSystemStats(): Promise<unknown> {
    const totalProcessed = this.results.size;
    const currentlyProcessing = this.processingQueue.size;

    const results = Array.from(this.results.values());
    const authentic = results.filter((r) => r.status === "authentic").length;
    const suspicious = results.filter((r) => r.status === "suspicious").length;
    const forged = results.filter((r) => r.status === "forged").length;

    const avgProcessingTime =
      results.length > 0 ?
        results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
      : 0;

    const avgScore =
      results.length > 0 ?
        results.reduce((sum, r) => sum + r.overallScore, 0) / results.length
      : 0;

    return {
      totalProcessed,
      currentlyProcessing,
      statusDistribution: {
        authentic,
        suspicious,
        forged,
      },
      averageProcessingTime: Math.round(avgProcessingTime),
      averageScore: Math.round(avgScore),
      uptime: process.uptime(),
      lastProcessed:
        results.length > 0 ? results[results.length - 1].processedAt : null,
    };
  }

  async clearResults(olderThan?: Date): Promise<number> {
    const cutoff = olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cleared = 0;

    this.results.forEach((result, id) => {
      if (result.processedAt < cutoff) {
        this.results.delete(id);
        cleared++;
      }
    });

    logger.info(
      `Cleared ${cleared} old verification results`,
      "DocumentAuthService"
    );
    return cleared;
  }

  async shutdown(): Promise<void> {
    logger.info(
      "Shutting down Document Authentication Service...",
      "DocumentAuthService"
    );

    // Wait for current processing to complete
    while (this.processingQueue.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await Promise.all([
      this.mlAnalyzer.shutdown(),
      this.metadataAnalyzer.shutdown(),
      this.visualAnalyzer.shutdown(),
      this.signatureAnalyzer.shutdown(),
      this.contentAnalyzer.shutdown(),
      this.landDocumentAnalyzer.shutdown(),
    ]);

    this.results.clear();
    this.processingQueue.clear();

    logger.info(
      "Document Authentication Service shutdown complete",
      "DocumentAuthService"
    );
  }
}
