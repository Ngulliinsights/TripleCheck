/**
 * VerificationRoutes - Handles verification and fraud detection endpoints
 * 
 * This module provides endpoints for:
 * - Property verification status
 * - Document upload and verification
 * - Fraud detection analysis
 * - Verification report generation
 */

import { Router, Response } from 'express';
import fileUpload from 'express-fileupload';
import { z } from 'zod';

import { requireAuth, AuthenticatedRequest, optionalAuth } from '../middleware/auth.middleware';
import validateRequest, { 
  CommonValidationSchemas, 
  ValidatedRequest 
} from '../middleware/validation.middleware';
import { VerificationService, DocumentVerificationRequest } from '../services/VerificationService';
import { HTTP_STATUS } from '../utils/constants';
import { ResponseHelper } from '../utils/response-helpers';


// Validation schemas for verification endpoints
const VerificationValidationSchemas = {
  // Property ID parameter validation
  propertyIdParam: z.object({
    id: z.coerce.number().int().positive('Property ID must be a positive integer'),
  }),

  // Document verification request validation
  documentVerification: z.object({
    documentType: z.enum(['title_deed', 'ownership_certificate', 'survey_plan', 'building_permit', 'other'])
      .describe('Type of document being verified'),
    description: z.string()
      .min(1, 'Document description is required')
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional(),
  }),

  // Verification report request validation
  reportRequest: z.object({
    reportType: z.enum(['verification', 'market_analysis', 'risk_assessment'])
      .describe('Type of report to generate'),
    includeDetails: z.boolean().default(true)
      .describe('Whether to include detailed analysis'),
  }),

  // Fraud detection request validation
  fraudDetectionRequest: z.object({
    propertyData: z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(1).max(2000),
      price: z.number().positive(),
      location: z.string().min(1).max(200),
      imageUrls: z.array(z.string().url()).optional(),
    }).describe('Property data for fraud detection analysis'),
  }),
};

export interface IVerificationRoutes {
  getRouter(): Router;
  initialize(): Promise<void>;
}

export class VerificationRoutes implements IVerificationRoutes {
  private router: Router;
  private verificationService: VerificationService;

  constructor(verificationService: VerificationService) {
    this.router = Router();
    this.verificationService = verificationService;
    this.setupRoutes();
  }

  /**
   * Get the configured router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Initialize the verification routes
   */
  async initialize(): Promise<void> {
    try {
      await this.verificationService.initialize();
      console.log('VerificationRoutes initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VerificationRoutes:', error);
      throw error;
    }
  }

  /**
   * Setup all verification routes
   */
  private setupRoutes(): void {
    // Property verification status endpoint (public, with optional auth for enhanced data)
    this.router.get(
      '/properties/:id/status',
      optionalAuth,
      validateRequest({
        params: VerificationValidationSchemas.propertyIdParam,
        stripUnknown: true,
      }),
      this.getVerificationStatus.bind(this)
    );

    // Document upload and verification endpoint (requires authentication)
    this.router.post(
      '/properties/:id/documents',
      requireAuth,
      validateRequest({
        params: VerificationValidationSchemas.propertyIdParam,
        body: VerificationValidationSchemas.documentVerification,
        stripUnknown: true,
      }),
      this.uploadAndVerifyDocuments.bind(this)
    );

    // Perform property verification endpoint (requires authentication)
    this.router.post(
      '/properties/:id/verify',
      requireAuth,
      validateRequest({
        params: VerificationValidationSchemas.propertyIdParam,
        stripUnknown: true,
      }),
      this.verifyProperty.bind(this)
    );

    // Fraud detection analysis endpoint (requires authentication)
    this.router.post(
      '/fraud-detection/analyze',
      requireAuth,
      validateRequest({
        body: VerificationValidationSchemas.fraudDetectionRequest,
        stripUnknown: true,
      }),
      this.analyzeFraudDetection.bind(this)
    );

    // Generate verification report endpoint (requires authentication)
    this.router.post(
      '/properties/:id/reports',
      requireAuth,
      validateRequest({
        params: VerificationValidationSchemas.propertyIdParam,
        body: VerificationValidationSchemas.reportRequest,
        stripUnknown: true,
      }),
      this.generateVerificationReport.bind(this)
    );

    // Get verification history for a property (requires authentication)
    this.router.get(
      '/properties/:id/history',
      requireAuth,
      validateRequest({
        params: VerificationValidationSchemas.propertyIdParam,
        query: CommonValidationSchemas.pagination,
        stripUnknown: true,
      }),
      this.getVerificationHistory.bind(this)
    );
  }

  /**
   * Get verification status for a property
   */
  private async getVerificationStatus(
    req: ValidatedRequest<any, any, { id: number }>,
    res: Response
  ): Promise<void> {
    try {
      const { id: propertyId } = req.validatedParams!;

      // Get verification status from service
      const verificationStatus = await this.verificationService.getVerificationStatus(propertyId);

      // Enhanced response with additional metadata for authenticated users
      const responseData = {
        ...verificationStatus,
        metadata: {
          timestamp: new Date().toISOString(),
          propertyId,
          // Include enhanced data for authenticated users
          ...(req.user && {
            enhancedData: true,
            canRequestVerification: true,
            canUploadDocuments: true,
          }),
        },
      };

      ResponseHelper.success(res, responseData, 'Verification status retrieved successfully');
    } catch (error) {
      console.error('Error getting verification status:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, 'Property not found');
      } else {
        ResponseHelper.error(res, 'Failed to retrieve verification status');
      }
    }
  }

  /**
   * Upload and verify documents for a property
   */
  private async uploadAndVerifyDocuments(
    req: ValidatedRequest<{ documentType: string; description?: string }, any, { id: number }> & AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id: propertyId } = req.validatedParams!;
      const { documentType, description } = req.validatedBody!;

      // Check if files were uploaded
      if (!req.files || Object.keys(req.files).length === 0) {
        ResponseHelper.validationError(res, 'No documents uploaded', [
          { field: 'documents', message: 'At least one document is required' }
        ]);
        return;
      }

      // Process uploaded files
      const documents: DocumentVerificationRequest[] = [];
      const files = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];

      for (const file of files) {
        if (file && typeof file === 'object' && 'data' in file) {
          // Validate file type and size
          const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
          if (!allowedTypes.includes(file.mimetype)) {
            ResponseHelper.validationError(res, 'Invalid file type', [
              { field: 'documents', message: 'Only JPEG, PNG, WebP, and PDF files are allowed' }
            ]);
            return;
          }

          if (file.size > 10 * 1024 * 1024) { // 10MB limit
            ResponseHelper.validationError(res, 'File too large', [
              { field: 'documents', message: 'File size cannot exceed 10MB' }
            ]);
            return;
          }

          documents.push({
            documentBuffer: file.data,
            documentName: file.name,
            documentType: documentType,
          });
        }
      }

      if (documents.length === 0) {
        ResponseHelper.validationError(res, 'No valid documents found');
        return;
      }

      // Verify documents using the service
      const verificationResults = await this.verificationService.verifyDocuments(propertyId, documents);

      ResponseHelper.success(
        res,
        {
          propertyId,
          documentType,
          description,
          verificationResults,
          totalDocuments: documents.length,
          verifiedDocuments: verificationResults.filter(r => r.isVerified).length,
        },
        'Documents uploaded and verified successfully',
        {
          timestamp: new Date().toISOString(),
          propertyId,
        }
      );
    } catch (error) {
      console.error('Error uploading and verifying documents:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, 'Property not found');
      } else {
        ResponseHelper.error(res, 'Failed to upload and verify documents');
      }
    }
  }

  /**
   * Perform comprehensive property verification
   */
  private async verifyProperty(
    req: ValidatedRequest<any, any, { id: number }> & AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id: propertyId } = req.validatedParams!;

      // Perform comprehensive verification
      const verificationResult = await this.verificationService.verifyProperty(propertyId);

      ResponseHelper.success(
        res,
        {
          propertyId,
          verificationResult,
          summary: {
            status: verificationResult.documentAuthenticity,
            ownershipVerified: verificationResult.ownershipVerified,
            riskScore: verificationResult.riskScore,
            riskLevel: verificationResult.riskScore > 70 ? 'high' : 
                      verificationResult.riskScore > 30 ? 'medium' : 'low',
            requiresManualReview: verificationResult.riskScore > 80,
          },
        },
        'Property verification completed successfully',
        {
          timestamp: new Date().toISOString(),
          propertyId,
          verificationPerformed: true,
        }
      );
    } catch (error) {
      console.error('Error verifying property:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, 'Property not found');
      } else {
        ResponseHelper.error(res, 'Failed to verify property');
      }
    }
  }

  /**
   * Analyze fraud detection for property data
   */
  private async analyzeFraudDetection(
    req: ValidatedRequest<{ propertyData: any }> & AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { propertyData } = req.validatedBody!;

      // Perform fraud detection analysis
      const fraudDetectionResult = await this.verificationService.performFraudDetection(propertyData);

      ResponseHelper.success(
        res,
        {
          propertyData: {
            title: propertyData.title,
            location: propertyData.location,
            price: propertyData.price,
          },
          fraudDetectionResult,
          analysis: {
            isSuspicious: fraudDetectionResult.isSuspicious,
            riskLevel: fraudDetectionResult.isSuspicious ? 'high' : 'low',
            suspiciousScore: fraudDetectionResult.suspiciousScore,
            overallScore: fraudDetectionResult.overallScore,
            recommendations: fraudDetectionResult.isSuspicious ? 
              ['Manual review recommended', 'Additional documentation may be required'] :
              ['Property appears legitimate', 'Standard verification process can proceed'],
          },
        },
        'Fraud detection analysis completed successfully',
        {
          timestamp: new Date().toISOString(),
          fraudDetectionPerformed: true,
        }
      );
    } catch (error) {
      console.error('Error analyzing fraud detection:', error);
      ResponseHelper.error(res, 'Failed to analyze fraud detection');
    }
  }

  /**
   * Generate verification report for a property
   */
  private async generateVerificationReport(
    req: ValidatedRequest<{ reportType: string; includeDetails: boolean }, any, { id: number }> & AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id: propertyId } = req.validatedParams!;
      const { reportType, includeDetails } = req.validatedBody!;

      let reportContent: string;

      // Generate appropriate report based on type
      switch (reportType) {
        case 'verification':
          reportContent = await this.verificationService.generateVerificationReport(propertyId);
          break;
        case 'market_analysis':
          reportContent = await this.verificationService.generateMarketAnalysisReport(propertyId);
          break;
        case 'risk_assessment':
          reportContent = await this.verificationService.generateRiskAssessmentReport(propertyId);
          break;
        default:
          ResponseHelper.validationError(res, 'Invalid report type');
          return;
      }

      ResponseHelper.success(
        res,
        {
          propertyId,
          reportType,
          includeDetails,
          reportContent,
          generatedAt: new Date().toISOString(),
        },
        `${reportType.replace('_', ' ')} report generated successfully`,
        {
          timestamp: new Date().toISOString(),
          propertyId,
          reportGenerated: true,
        }
      );
    } catch (error) {
      console.error('Error generating verification report:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, 'Property not found');
      } else {
        ResponseHelper.error(res, 'Failed to generate verification report');
      }
    }
  }

  /**
   * Get verification history for a property
   */
  private async getVerificationHistory(
    req: ValidatedRequest<any, { page: number; limit: number }, { id: number }> & AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { id: propertyId } = req.validatedParams!;
      const { page, limit } = req.validatedQuery!;

      // For now, return the current verification status as history
      // In a full implementation, this would query a verification history table
      const currentStatus = await this.verificationService.getVerificationStatus(propertyId);

      const historyData = [
        {
          id: 1,
          propertyId,
          action: 'verification_performed',
          status: currentStatus.status,
          timestamp: currentStatus.lastVerified || new Date().toISOString(),
          details: currentStatus.details,
          performedBy: req.user?.id,
        },
      ];

      ResponseHelper.paginated(
        res,
        historyData,
        historyData.length,
        page,
        limit,
        'Verification history retrieved successfully',
        {
          propertyId,
          hasMoreHistory: false,
        }
      );
    } catch (error) {
      console.error('Error getting verification history:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, 'Property not found');
      } else {
        ResponseHelper.error(res, 'Failed to retrieve verification history');
      }
    }
  }
}