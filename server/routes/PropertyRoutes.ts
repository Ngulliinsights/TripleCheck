import fs from 'fs';
import path from 'path';

import { Router, Response } from 'express';

import type { PaginationParams } from '../infrastructure/storage/storage';
import { requireAuth, optionalAuth, requireResourceOwnership, type AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest, PropertyValidationSchemas, CommonValidationSchemas, type ValidatedRequest } from '../middleware/validation.middleware';
import { PropertyService } from '../services/PropertyService';
import type { PropertyCreateRequest, PropertyUpdateRequest, PropertySearchFilters } from '../services/PropertyService';
import { VerificationService } from '../services/VerificationService';
import { HTTP_STATUS } from '../utils/constants';
import { PROPERTY_ERROR_MESSAGES } from '../utils/error-messages';
import { ResponseHelper } from '../utils/response-helpers';

/**
 * PropertyRoutes class handles all property-related endpoints
 * Provides property CRUD operations, search, file upload, and verification functionality
 */
export class PropertyRoutes {
  private router: Router;
  private propertyService: PropertyService;
  private verificationService: VerificationService;
  private uploadDir: string;

  constructor(propertyService: PropertyService, verificationService: VerificationService) {
    this.router = Router();
    this.propertyService = propertyService;
    this.verificationService = verificationService;
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirectory();
    this.initializeRoutes();
  }

  /**
   * Get the configured router with all property routes
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Initialize all property routes with proper middleware
   */
  private initializeRoutes(): void {
    // Get all properties with optional search and pagination
    this.router.get(
      '/',
      optionalAuth,
      validateRequest({
        query: PropertyValidationSchemas.searchFilters.merge(CommonValidationSchemas.pagination),
        sanitize: true,
        stripUnknown: true,
      }),
      this.getProperties.bind(this)
    );

    // Get single property by ID
    this.router.get(
      '/:id',
      optionalAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.getProperty.bind(this)
    );

    // Create new property
    this.router.post(
      '/',
      requireAuth,
      validateRequest({
        body: PropertyValidationSchemas.createProperty,
        sanitize: true,
        stripUnknown: true,
      }),
      this.createProperty.bind(this)
    );

    // Update property
    this.router.put(
      '/:id',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
        body: PropertyValidationSchemas.updateProperty,
        sanitize: true,
        stripUnknown: true,
      }),
      requireResourceOwnership(this.getPropertyOwnerId.bind(this)),
      this.updateProperty.bind(this)
    );

    // Delete property
    this.router.delete(
      '/:id',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      requireResourceOwnership(this.getPropertyOwnerId.bind(this)),
      this.deleteProperty.bind(this)
    );

    // Upload property images
    this.router.post(
      '/:id/images',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      requireResourceOwnership(this.getPropertyOwnerId.bind(this)),
      this.uploadImages.bind(this)
    );

    // Delete property image
    this.router.delete(
      '/:id/images/:imageIndex',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam.extend({
          imageIndex: CommonValidationSchemas.idParam.shape.id,
        }),
      }),
      requireResourceOwnership(this.getPropertyOwnerId.bind(this)),
      this.deleteImage.bind(this)
    );

    // Get property verification status
    this.router.get(
      '/:id/verification',
      optionalAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.getVerificationStatus.bind(this)
    );

    // Trigger property verification
    this.router.post(
      '/:id/verify',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      requireResourceOwnership(this.getPropertyOwnerId.bind(this)),
      this.verifyProperty.bind(this)
    );

    // Upload and verify documents
    this.router.post(
      '/:id/documents/verify',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      requireResourceOwnership(this.getPropertyOwnerId.bind(this)),
      this.verifyDocuments.bind(this)
    );

    // Generate verification report
    this.router.get(
      '/:id/reports/verification',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.generateVerificationReport.bind(this)
    );

    // Generate market analysis report
    this.router.get(
      '/:id/reports/market-analysis',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.generateMarketAnalysisReport.bind(this)
    );

    // Generate risk assessment report
    this.router.get(
      '/:id/reports/risk-assessment',
      requireAuth,
      validateRequest({
        params: CommonValidationSchemas.idParam,
      }),
      this.generateRiskAssessmentReport.bind(this)
    );

    // Search properties with advanced filters
    this.router.post(
      '/search',
      optionalAuth,
      validateRequest({
        body: PropertyValidationSchemas.searchFilters.merge(CommonValidationSchemas.pagination),
        sanitize: true,
        stripUnknown: true,
      }),
      this.searchProperties.bind(this)
    );

    // Get properties by current user
    this.router.get(
      '/user/my-properties',
      requireAuth,
      validateRequest({
        query: CommonValidationSchemas.pagination,
        sanitize: true,
        stripUnknown: true,
      }),
      this.getMyProperties.bind(this)
    );
  }

  /**
   * Get all properties with optional search and pagination
   */
  private async getProperties(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = req.validatedQuery || {};
      
      // Prepare pagination parameters
      const pagination: PaginationParams = {
        page: page || 1,
        limit: limit || 20,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      };

      // Prepare search filters
      const searchFilters: PropertySearchFilters = {
        location: filters.location,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        propertyType: filters.propertyType,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        verified: filters.verified,
      };

      // Get properties with search and pagination
      const result = await this.propertyService.searchPropertiesWithPagination(searchFilters, pagination);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve properties', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }

      ResponseHelper.success(
        res,
        result.data,
        'Properties retrieved successfully',
        {
          totalCount: result.data?.totalCount,
          page: pagination.page,
          limit: pagination.limit,
          filters: searchFilters,
        }
      );
    } catch (error) {
      console.error('Get properties error:', error);
      ResponseHelper.error(res, 'Failed to retrieve properties', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get single property by ID
   */
  private async getProperty(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;
      
      const result = await this.propertyService.getProperty(id);

      if (!result.success) {
        if (result.error?.includes('not found')) {
          ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
          return;
        }
        ResponseHelper.error(res, result.error || 'Failed to retrieve property', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }

      ResponseHelper.success(res, result.data, 'Property retrieved successfully');
    } catch (error) {
      console.error('Get property error:', error);
      ResponseHelper.error(res, 'Failed to retrieve property', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create new property
   */
  private async createProperty(req: ValidatedRequest<PropertyCreateRequest>, res: Response): Promise<void> {
    try {
      const propertyData = req.validatedBody!;
      const userId = this.getUserIdFromRequest(req as AuthenticatedRequest);

      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const result = await this.propertyService.createProperty(propertyData, userId);

      if (!result.success) {
        if (result.error?.includes('validation')) {
          ResponseHelper.error(res, result.error, HTTP_STATUS.BAD_REQUEST);
          return;
        }
        ResponseHelper.error(res, result.error || 'Failed to create property', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }

      // Trigger automatic verification for new properties
      if (result.data) {
        try {
          await this.verificationService.verifyProperty(result.data.id);
        } catch (verificationError) {
          console.warn('Automatic verification failed for new property:', verificationError);
          // Don't fail the property creation if verification fails
        }
      }

      ResponseHelper.created(res, result.data, result.message || 'Property created successfully');
    } catch (error) {
      console.error('Create property error:', error);
      ResponseHelper.error(res, 'Failed to create property', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update property
   */
  private async updateProperty(req: ValidatedRequest<PropertyUpdateRequest>, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;
      const updates = req.validatedBody!;
      const userId = this.getUserIdFromRequest(req as AuthenticatedRequest);

      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const result = await this.propertyService.updateProperty(id, updates, userId);

      if (!result.success) {
        if (result.error?.includes('not found')) {
          ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
          return;
        }
        if (result.error?.includes('Unauthorized')) {
          ResponseHelper.authorizationError(res, result.error);
          return;
        }
        ResponseHelper.error(res, result.error || 'Failed to update property', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }

      ResponseHelper.success(res, result.data, result.message || 'Property updated successfully');
    } catch (error) {
      console.error('Update property error:', error);
      ResponseHelper.error(res, 'Failed to update property', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete property
   */
  private async deleteProperty(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;
      const userId = this.getUserIdFromRequest(req as AuthenticatedRequest);

      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      // Get property to check ownership (already handled by middleware, but we need the data)
      const propertyResult = await this.propertyService.getProperty(id);
      if (!propertyResult.success || !propertyResult.data) {
        ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
        return;
      }

      // For now, we'll mark the property as inactive instead of deleting
      // This preserves data integrity and allows for recovery
      const result = await this.propertyService.updateProperty(id, { isActive: false } as any, userId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to delete property', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }

      ResponseHelper.successMessage(res, 'Property deleted successfully');
    } catch (error) {
      console.error('Delete property error:', error);
      ResponseHelper.error(res, 'Failed to delete property', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Upload property images
   */
  private async uploadImages(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;
      const userId = this.getUserIdFromRequest(req as AuthenticatedRequest);

      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      // Check if files were uploaded
      if (!req.files || Object.keys(req.files).length === 0) {
        ResponseHelper.error(res, 'No files uploaded', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      // Get property to update
      const propertyResult = await this.propertyService.getProperty(id);
      if (!propertyResult.success || !propertyResult.data) {
        ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
        return;
      }

      // Process uploaded files
      const uploadedImageUrls: string[] = [];
      const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

      for (const file of files) {
        if (!file) continue;

        // Validate file type and size
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          ResponseHelper.error(res, `Invalid file type: ${file.mimetype}`, HTTP_STATUS.BAD_REQUEST);
          return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          ResponseHelper.error(res, 'File size cannot exceed 10MB', HTTP_STATUS.BAD_REQUEST);
          return;
        }

        // Generate unique filename
        const fileExtension = path.extname(file.name);
        const fileName = `property_${id}_${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;
        const filePath = path.join(this.uploadDir, fileName);

        // Save file
        await file.mv(filePath);
        uploadedImageUrls.push(`/uploads/${fileName}`);
      }

      // Update property with new image URLs
      const currentImageUrls = propertyResult.data.imageUrls || [];
      const updatedImageUrls = [...currentImageUrls, ...uploadedImageUrls];

      const updateResult = await this.propertyService.updateProperty(
        id,
        { imageUrls: updatedImageUrls },
        userId
      );

      if (!updateResult.success) {
        // Clean up uploaded files if update fails
        for (const url of uploadedImageUrls) {
          const filePath = path.join(this.uploadDir, path.basename(url));
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            console.warn('Failed to cleanup uploaded file:', cleanupError);
          }
        }

        ResponseHelper.error(res, updateResult.error || 'Failed to update property with images', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }

      ResponseHelper.success(
        res,
        {
          uploadedImages: uploadedImageUrls,
          totalImages: updatedImageUrls.length,
        },
        'Images uploaded successfully'
      );
    } catch (error) {
      console.error('Upload images error:', error);
      ResponseHelper.error(res, 'Failed to upload images', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete property image
   */
  private async deleteImage(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id, imageIndex } = req.validatedParams!;
      const userId = this.getUserIdFromRequest(req as AuthenticatedRequest);

      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      // Get property
      const propertyResult = await this.propertyService.getProperty(id);
      if (!propertyResult.success || !propertyResult.data) {
        ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
        return;
      }

      const currentImageUrls = propertyResult.data.imageUrls || [];
      
      if (imageIndex < 0 || imageIndex >= currentImageUrls.length) {
        ResponseHelper.error(res, 'Invalid image index', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      // Remove image URL from array
      const imageToDelete = currentImageUrls[imageIndex];
      const updatedImageUrls = currentImageUrls.filter((_, index) => index !== imageIndex);

      // Update property
      const updateResult = await this.propertyService.updateProperty(
        id,
        { imageUrls: updatedImageUrls },
        userId
      );

      if (!updateResult.success) {
        ResponseHelper.error(res, updateResult.error || 'Failed to update property', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }

      // Delete physical file
      try {
        const filePath = path.join(this.uploadDir, path.basename(imageToDelete));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn('Failed to delete physical file:', fileError);
        // Don't fail the request if file deletion fails
      }

      ResponseHelper.successMessage(res, 'Image deleted successfully');
    } catch (error) {
      console.error('Delete image error:', error);
      ResponseHelper.error(res, 'Failed to delete image', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get property verification status
   */
  private async getVerificationStatus(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;

      const result = await this.verificationService.getVerificationStatus(id);
      ResponseHelper.success(res, result, 'Verification status retrieved successfully');
    } catch (error) {
      console.error('Get verification status error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
        return;
      }
      ResponseHelper.error(res, 'Failed to retrieve verification status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Trigger property verification
   */
  private async verifyProperty(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;

      const result = await this.verificationService.verifyProperty(id);
      ResponseHelper.success(res, result, 'Property verification completed');
    } catch (error) {
      console.error('Verify property error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
        return;
      }
      ResponseHelper.error(res, 'Property verification failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verify documents
   */
  private async verifyDocuments(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;

      // Check if files were uploaded
      if (!req.files || Object.keys(req.files).length === 0) {
        ResponseHelper.error(res, 'No documents uploaded', HTTP_STATUS.BAD_REQUEST);
        return;
      }

      // Process uploaded documents
      const documents = [];
      const files = Array.isArray(req.files.documents) ? req.files.documents : [req.files.documents];

      for (const file of files) {
        if (!file) continue;

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
          ResponseHelper.error(res, `Invalid document type: ${file.mimetype}`, HTTP_STATUS.BAD_REQUEST);
          return;
        }

        documents.push({
          documentBuffer: file.data,
          documentName: file.name,
          documentType: file.mimetype,
        });
      }

      const results = await this.verificationService.verifyDocuments(id, documents);
      ResponseHelper.success(res, results, 'Documents verified successfully');
    } catch (error) {
      console.error('Verify documents error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
        return;
      }
      ResponseHelper.error(res, 'Document verification failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate verification report
   */
  private async generateVerificationReport(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;

      const report = await this.verificationService.generateVerificationReport(id);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="verification-report-${id}.txt"`);
      res.send(report);
    } catch (error) {
      console.error('Generate verification report error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
        return;
      }
      ResponseHelper.error(res, 'Failed to generate verification report', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate market analysis report
   */
  private async generateMarketAnalysisReport(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;

      const report = await this.verificationService.generateMarketAnalysisReport(id);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="market-analysis-${id}.txt"`);
      res.send(report);
    } catch (error) {
      console.error('Generate market analysis report error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
        return;
      }
      ResponseHelper.error(res, 'Failed to generate market analysis report', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate risk assessment report
   */
  private async generateRiskAssessmentReport(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.validatedParams!;

      const report = await this.verificationService.generateRiskAssessmentReport(id);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="risk-assessment-${id}.txt"`);
      res.send(report);
    } catch (error) {
      console.error('Generate risk assessment report error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        ResponseHelper.notFound(res, PROPERTY_ERROR_MESSAGES.PROPERTY_NOT_FOUND);
        return;
      }
      ResponseHelper.error(res, 'Failed to generate risk assessment report', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get properties by current user
   */
  private async getMyProperties(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const userId = this.getUserIdFromRequest(req as AuthenticatedRequest);

      if (!userId) {
        ResponseHelper.authError(res, 'Authentication required');
        return;
      }

      const { page, limit, sortBy, sortOrder } = req.validatedQuery || {};
      
      const result = await this.propertyService.getPropertiesByOwner(userId);

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Failed to retrieve properties', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }

      // Apply pagination to results
      const properties = result.data || [];
      const startIndex = ((page || 1) - 1) * (limit || 20);
      const endIndex = startIndex + (limit || 20);
      const paginatedProperties = properties.slice(startIndex, endIndex);

      ResponseHelper.success(
        res,
        {
          properties: paginatedProperties,
          totalCount: properties.length,
          page: page || 1,
          limit: limit || 20,
        },
        'User properties retrieved successfully'
      );
    } catch (error) {
      console.error('Get my properties error:', error);
      ResponseHelper.error(res, 'Failed to retrieve properties', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Search properties with advanced filters
   */
  private async searchProperties(req: ValidatedRequest, res: Response): Promise<void> {
    try {
      const { page, limit, sortBy, sortOrder, query, ...filters } = req.validatedBody || {};
      
      // Prepare pagination parameters
      const pagination: PaginationParams = {
        page: page || 1,
        limit: limit || 20,
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      };

      // Prepare search filters
      const searchFilters: PropertySearchFilters = {
        location: filters.location,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        propertyType: filters.propertyType,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        verified: filters.verified,
      };

      // Perform search
      let result;
      if (query) {
        // Text-based search with filters
        const searchResult = await this.propertyService.searchProperties(query, searchFilters);
        if (!searchResult.success) {
          ResponseHelper.error(res, searchResult.error || 'Search failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
          return;
        }

        // Apply pagination to search results
        const properties = searchResult.data || [];
        const startIndex = (pagination.page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedProperties = properties.slice(startIndex, endIndex);

        result = {
          success: true,
          data: {
            properties: paginatedProperties,
            totalCount: properties.length,
            page: pagination.page,
            limit: pagination.limit,
          },
        };
      } else {
        // Filter-based search with pagination
        result = await this.propertyService.searchPropertiesWithPagination(searchFilters, pagination);
      }

      if (!result.success) {
        ResponseHelper.error(res, result.error || 'Search failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
        return;
      }

      ResponseHelper.success(
        res,
        result.data,
        'Properties search completed',
        {
          totalCount: result.data?.totalCount,
          page: pagination.page,
          limit: pagination.limit,
          filters: searchFilters,
          query: query || undefined,
        }
      );
    } catch (error) {
      console.error('Search properties error:', error);
      ResponseHelper.error(res, 'Property search failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Helper method to get property owner ID for resource ownership middleware
   */
  private async getPropertyOwnerId(req: AuthenticatedRequest): Promise<number | null> {
    try {
      const propertyId = parseInt(req.params.id);
      if (isNaN(propertyId)) {
        return null;
      }

      const result = await this.propertyService.getProperty(propertyId);
      return result.success && result.data ? result.data.ownerId : null;
    } catch (error) {
      console.error('Error getting property owner ID:', error);
      return null;
    }
  }

  /**
   * Helper method to get user ID from authenticated request
   */
  private getUserIdFromRequest(req: AuthenticatedRequest): number | null {
    return req.session?.userId ?? null;
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
        console.log(`Upload directory created: ${this.uploadDir}`);
      }
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      throw error;
    }
  }

  /**
   * Initialize any required resources (called during application startup)
   */
  async initialize(): Promise<void> {
    try {
      // Initialize verification service
      await this.verificationService.initialize();
      console.log('PropertyRoutes initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PropertyRoutes:', error);
      throw error;
    }
  }
}