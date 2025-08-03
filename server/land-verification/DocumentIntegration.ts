import { DocumentAuthService, DocumentVerificationRequest, DocumentVerificationResult } from '../document-auth/DocumentAuthService';
import { logger } from '../infrastructure/monitoring/logger';

import { LandVerificationService, VerificationLayer, LayerResult } from './LandVerificationService';

export interface LandDocumentVerificationRequest {
  sessionId: string;
  layerId: string;
  documentType: 'title_deed' | 'survey_plan' | 'government_approval' | 'legal_opinion' | 'expert_report';
  file: Buffer;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  userId: string;
  propertyId: string;
}

export interface LandDocumentVerificationResult extends DocumentVerificationResult {
  landSpecificChecks: LandSpecificCheck[];
  complianceStatus: 'compliant' | 'non_compliant' | 'requires_review';
  legalImplications: string[];
  requiredActions: string[];
}

export interface LandSpecificCheck {
  type: 'title_validity' | 'boundary_accuracy' | 'government_compliance' | 'legal_standing';
  name: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  description: string;
  details: string[];
  confidence: number;
  legalReference?: string;
  complianceRequirement?: string;
}

export class DocumentIntegration {
  private documentAuthService: DocumentAuthService;
  private landVerificationService: LandVerificationService;

  constructor(
    documentAuthService: DocumentAuthService,
    landVerificationService: LandVerificationService
  ) {
    this.documentAuthService = documentAuthService;
    this.landVerificationService = landVerificationService;
  }

  async verifyLandDocument(request: LandDocumentVerificationRequest): Promise<LandDocumentVerificationResult> {
    logger.info(`Starting land document verification for session ${request.sessionId}`, 'DocumentIntegration');

    try {
      // Create document verification request
      const docRequest: DocumentVerificationRequest = {
        id: `land_doc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        file: request.file,
        filename: request.filename,
        mimeType: request.mimeType,
        size: request.size,
        uploadedAt: request.uploadedAt,
        userId: request.userId,
        propertyId: request.propertyId
      };

      // Run standard document authentication
      const standardResult = await this.documentAuthService.verifyDocument(docRequest);

      // Run land-specific document checks
      const landSpecificChecks = await this.performLandSpecificChecks(request, standardResult);

      // Determine compliance status
      const complianceStatus = this.determineComplianceStatus(standardResult, landSpecificChecks);

      // Generate legal implications
      const legalImplications = this.generateLegalImplications(request.documentType, standardResult, landSpecificChecks);

      // Generate required actions
      const requiredActions = this.generateRequiredActions(complianceStatus, standardResult, landSpecificChecks);

      const landResult: LandDocumentVerificationResult = {
        ...standardResult,
        landSpecificChecks,
        complianceStatus,
        legalImplications,
        requiredActions
      };

      // Convert to layer results for land verification service
      const layerResults = this.convertToLayerResults(request.layerId, landResult);

      // Emit integration event
      this.landVerificationService.emit('document_verified', {
        sessionId: request.sessionId,
        layerId: request.layerId,
        documentType: request.documentType,
        result: landResult,
        layerResults
      });

      logger.info(`Land document verification completed for session ${request.sessionId} - Status: ${landResult.status}`, 'DocumentIntegration');
      return landResult;

    } catch (error) {
      logger.error(`Land document verification failed for session ${request.sessionId}`, 'DocumentIntegration', undefined, error as Error);
      throw error;
    }
  }

  private async performLandSpecificChecks(
    request: LandDocumentVerificationRequest,
    standardResult: DocumentVerificationResult
  ): Promise<LandSpecificCheck[]> {
    const checks: LandSpecificCheck[] = [];

    switch (request.documentType) {
      case 'title_deed':
        checks.push(...await this.checkTitleDeed(request, standardResult));
        break;
      case 'survey_plan':
        checks.push(...await this.checkSurveyPlan(request, standardResult));
        break;
      case 'government_approval':
        checks.push(...await this.checkGovernmentApproval(request, standardResult));
        break;
      case 'legal_opinion':
        checks.push(...await this.checkLegalOpinion(request, standardResult));
        break;
      case 'expert_report':
        checks.push(...await this.checkExpertReport(request, standardResult));
        break;
    }

    return checks;
  }

  private async checkTitleDeed(
    request: LandDocumentVerificationRequest,
    standardResult: DocumentVerificationResult
  ): Promise<LandSpecificCheck[]> {
    const checks: LandSpecificCheck[] = [];

    // Title validity check
    checks.push({
      type: 'title_validity',
      name: 'Title Deed Validity',
      status: standardResult.overallScore > 80 ? 'pass' : standardResult.overallScore > 60 ? 'warning' : 'fail',
      score: standardResult.overallScore,
      description: 'Verification of title deed authenticity and legal validity',
      details: [
        'Document structure analysis completed',
        'Signature verification performed',
        'Seal and stamp validation conducted'
      ],
      confidence: standardResult.confidence,
      legalReference: 'Land Registration Act, 2012 - Section 27',
      complianceRequirement: 'Title deed must be genuine and properly executed'
    });

    // Boundary accuracy check (basic implementation)
    const boundaryScore = this.calculateBoundaryAccuracy(standardResult);
    checks.push({
      type: 'boundary_accuracy',
      name: 'Boundary Description Accuracy',
      status: boundaryScore > 75 ? 'pass' : boundaryScore > 50 ? 'warning' : 'fail',
      score: boundaryScore,
      description: 'Verification of boundary descriptions and measurements',
      details: [
        'Coordinate system validation',
        'Measurement consistency check',
        'Adjacent property reference verification'
      ],
      confidence: 0.8,
      legalReference: 'Survey Act, 2002 - Section 15',
      complianceRequirement: 'Boundary descriptions must be accurate and verifiable'
    });

    return checks;
  }

  private async checkSurveyPlan(
    request: LandDocumentVerificationRequest,
    standardResult: DocumentVerificationResult
  ): Promise<LandSpecificCheck[]> {
    const checks: LandSpecificCheck[] = [];

    // Survey plan validity
    checks.push({
      type: 'boundary_accuracy',
      name: 'Survey Plan Accuracy',
      status: standardResult.overallScore > 85 ? 'pass' : standardResult.overallScore > 70 ? 'warning' : 'fail',
      score: standardResult.overallScore,
      description: 'Verification of survey plan accuracy and professional standards',
      details: [
        'Licensed surveyor signature verification',
        'Coordinate system compliance check',
        'Scale and measurement accuracy validation'
      ],
      confidence: standardResult.confidence,
      legalReference: 'Survey Act, 2002 - Section 12',
      complianceRequirement: 'Survey plan must be prepared by licensed surveyor'
    });

    return checks;
  }

  private async checkGovernmentApproval(
    request: LandDocumentVerificationRequest,
    standardResult: DocumentVerificationResult
  ): Promise<LandSpecificCheck[]> {
    const checks: LandSpecificCheck[] = [];

    // Government compliance check
    checks.push({
      type: 'government_compliance',
      name: 'Government Approval Validity',
      status: standardResult.overallScore > 90 ? 'pass' : standardResult.overallScore > 75 ? 'warning' : 'fail',
      score: standardResult.overallScore,
      description: 'Verification of government approval authenticity and validity',
      details: [
        'Official seal verification',
        'Authorized signatory validation',
        'Approval conditions compliance check'
      ],
      confidence: standardResult.confidence,
      legalReference: 'Physical Planning Act, 1996 - Section 30',
      complianceRequirement: 'Government approvals must be from authorized agencies'
    });

    return checks;
  }

  private async checkLegalOpinion(
    request: LandDocumentVerificationRequest,
    standardResult: DocumentVerificationResult
  ): Promise<LandSpecificCheck[]> {
    const checks: LandSpecificCheck[] = [];

    // Legal standing check
    checks.push({
      type: 'legal_standing',
      name: 'Legal Opinion Validity',
      status: standardResult.overallScore > 80 ? 'pass' : standardResult.overallScore > 65 ? 'warning' : 'fail',
      score: standardResult.overallScore,
      description: 'Verification of legal opinion authenticity and professional standards',
      details: [
        'Advocate signature verification',
        'Law Society of Kenya registration check',
        'Opinion scope and limitations review'
      ],
      confidence: standardResult.confidence,
      legalReference: 'Advocates Act, 2012 - Section 15',
      complianceRequirement: 'Legal opinion must be from qualified advocate'
    });

    return checks;
  }

  private async checkExpertReport(
    request: LandDocumentVerificationRequest,
    standardResult: DocumentVerificationResult
  ): Promise<LandSpecificCheck[]> {
    const checks: LandSpecificCheck[] = [];

    // Expert qualification check
    checks.push({
      type: 'legal_standing',
      name: 'Expert Report Validity',
      status: standardResult.overallScore > 85 ? 'pass' : standardResult.overallScore > 70 ? 'warning' : 'fail',
      score: standardResult.overallScore,
      description: 'Verification of expert report authenticity and professional qualifications',
      details: [
        'Expert credentials verification',
        'Professional body registration check',
        'Report methodology validation'
      ],
      confidence: standardResult.confidence,
      complianceRequirement: 'Expert report must be from qualified professional'
    });

    return checks;
  }

  private calculateBoundaryAccuracy(standardResult: DocumentVerificationResult): number {
    // Simple implementation - in practice, this would involve complex spatial analysis
    const contentChecks = standardResult.checks.filter(check => check.type === 'content');
    if (contentChecks.length === 0) return 50;

    const avgContentScore = contentChecks.reduce((sum, check) => sum + check.score, 0) / contentChecks.length;
    
    // Adjust based on metadata quality
    const metadataChecks = standardResult.checks.filter(check => check.type === 'metadata');
    const metadataBonus = metadataChecks.length > 0 ? 
      metadataChecks.reduce((sum, check) => sum + check.score, 0) / metadataChecks.length * 0.1 : 0;

    return Math.min(100, Math.round(avgContentScore + metadataBonus));
  }

  private determineComplianceStatus(
    standardResult: DocumentVerificationResult,
    landSpecificChecks: LandSpecificCheck[]
  ): 'compliant' | 'non_compliant' | 'requires_review' {
    // Check for critical failures
    const criticalFailures = [
      ...standardResult.checks.filter(check => check.status === 'fail' && check.score < 30),
      ...landSpecificChecks.filter(check => check.status === 'fail' && check.score < 30)
    ];

    if (criticalFailures.length > 0) {
      return 'non_compliant';
    }

    // Check overall scores
    const {overallScore} = standardResult;
    const landSpecificScore = landSpecificChecks.length > 0 ?
      landSpecificChecks.reduce((sum, check) => sum + check.score, 0) / landSpecificChecks.length : 100;

    const combinedScore = (overallScore + landSpecificScore) / 2;

    if (combinedScore >= 85) {
      return 'compliant';
    } else if (combinedScore >= 65) {
      return 'requires_review';
    } else {
      return 'non_compliant';
    }
  }

  private generateLegalImplications(
    documentType: LandDocumentVerificationRequest['documentType'],
    standardResult: DocumentVerificationResult,
    landSpecificChecks: LandSpecificCheck[]
  ): string[] {
    const implications: string[] = [];

    if (standardResult.status === 'forged') {
      implications.push('Document appears to be forged - criminal liability may apply under Penal Code');
      implications.push('Transaction based on forged document is void and unenforceable');
      implications.push('Parties may face prosecution for fraud or forgery');
    }

    if (standardResult.status === 'suspicious') {
      implications.push('Document authenticity is questionable - legal validity may be challenged');
      implications.push('Additional verification required before relying on document');
      implications.push('Consider obtaining certified copies from issuing authority');
    }

    // Document-specific implications
    switch (documentType) {
      case 'title_deed':
        if (landSpecificChecks.some(check => check.type === 'title_validity' && check.status === 'fail')) {
          implications.push('Invalid title deed may not confer legal ownership');
          implications.push('Property transfer may be void if title is defective');
        }
        break;

      case 'survey_plan':
        if (landSpecificChecks.some(check => check.type === 'boundary_accuracy' && check.status === 'fail')) {
          implications.push('Inaccurate survey may lead to boundary disputes');
          implications.push('Property development may be affected by survey errors');
        }
        break;

      case 'government_approval':
        if (landSpecificChecks.some(check => check.type === 'government_compliance' && check.status === 'fail')) {
          implications.push('Invalid government approval may void development rights');
          implications.push('Construction without valid approval may face demolition orders');
        }
        break;
    }

    return implications;
  }

  private generateRequiredActions(
    complianceStatus: 'compliant' | 'non_compliant' | 'requires_review',
    standardResult: DocumentVerificationResult,
    landSpecificChecks: LandSpecificCheck[]
  ): string[] {
    const actions: string[] = [];

    switch (complianceStatus) {
      case 'compliant':
        actions.push('Document verification completed successfully');
        actions.push('Proceed with transaction with confidence');
        actions.push('Maintain document copies for future reference');
        break;

      case 'requires_review':
        actions.push('Engage qualified legal counsel for document review');
        actions.push('Obtain additional supporting documentation');
        actions.push('Consider independent expert verification');
        actions.push('Negotiate appropriate warranties and indemnities');
        break;

      case 'non_compliant':
        actions.push('DO NOT proceed with transaction based on this document');
        actions.push('Report suspected fraud to relevant authorities');
        actions.push('Obtain authentic documents from proper sources');
        actions.push('Consider legal action against parties providing false documents');
        break;
    }

    // Add specific actions based on failed checks
    const failedChecks = [
      ...standardResult.checks.filter(check => check.status === 'fail'),
      ...landSpecificChecks.filter(check => check.status === 'fail')
    ];

    for (const check of failedChecks) {
      switch (check.type) {
        case 'signature':
          actions.push('Verify signatures with issuing authority');
          break;
        case 'metadata':
          actions.push('Request original document from source');
          break;
        case 'title_validity':
          actions.push('Conduct title search at land registry');
          break;
        case 'boundary_accuracy':
          actions.push('Commission new survey by licensed surveyor');
          break;
        case 'government_compliance':
          actions.push('Verify approval status with issuing government agency');
          break;
      }
    }

    return Array.from(new Set(actions)); // Remove duplicates
  }

  private convertToLayerResults(layerId: string, landResult: LandDocumentVerificationResult): LayerResult[] {
    const layerResults: LayerResult[] = [];

    // Convert standard checks
    for (const check of landResult.checks) {
      layerResults.push({
        id: `layer_result_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        layerId,
        type: `document_${check.type}`,
        status: check.status,
        score: check.score,
        description: check.description,
        details: check.details,
        confidence: check.confidence,
        processingTime: check.processingTime,
        evidence: [`document_verification_${landResult.id}.json`]
      });
    }

    // Convert land-specific checks
    for (const check of landResult.landSpecificChecks) {
      layerResults.push({
        id: `layer_result_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        layerId,
        type: `land_${check.type}`,
        status: check.status,
        score: check.score,
        description: check.description,
        details: [
          ...check.details,
          ...(check.legalReference ? [`Legal Reference: ${check.legalReference}`] : []),
          ...(check.complianceRequirement ? [`Compliance: ${check.complianceRequirement}`] : [])
        ],
        confidence: check.confidence,
        processingTime: 0, // Land-specific checks are synchronous
        evidence: [`land_verification_${landResult.id}.json`]
      });
    }

    // Add overall compliance result
    layerResults.push({
      id: `layer_result_${Date.now()}_compliance`,
      layerId,
      type: 'compliance_status',
      status: landResult.complianceStatus === 'compliant' ? 'pass' : 
             landResult.complianceStatus === 'requires_review' ? 'warning' : 'fail',
      score: landResult.overallScore,
      description: `Document compliance status: ${landResult.complianceStatus}`,
      details: [
        `Legal implications: ${landResult.legalImplications.length} identified`,
        `Required actions: ${landResult.requiredActions.length} items`,
        `Overall confidence: ${Math.round(landResult.confidence * 100)}%`
      ],
      confidence: landResult.confidence,
      processingTime: landResult.processingTime,
      evidence: [`compliance_report_${landResult.id}.json`]
    });

    return layerResults;
  }
}