import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { CacheService } from "../infrastructure/cache"
import { asyncHandler } from "../middleware/error";
import { ProfessionalService } from '../services/ProfessionalService';
import { ResponseHelper } from '../utils/response-helpers';

// Validation schemas
const createProfessionalSchema = z.object({
  userId: z.number().optional(),
  businessName: z.string().min(1, 'Business name is required').max(255),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email format').max(255),
  phone: z.string().min(1, 'Phone number is required').max(20),
  alternatePhone: z.string().max(20).optional(),
  businessAddress: z.string().min(1, 'Business address is required'),
  serviceAreas: z.array(z.string()).min(1, 'At least one service area is required'),
  primarySpecialization: z.enum([
    'land_surveying',
    'property_law',
    'real_estate_appraisal',
    'construction_inspection',
    'environmental_assessment',
    'title_verification',
    'boundary_disputes',
    'zoning_compliance',
    'mortgage_processing',
    'property_management',
  ]),
  secondarySpecializations: z.array(z.string()).optional(),
  yearsOfExperience: z.number().min(0, 'Years of experience cannot be negative'),
  licenseNumber: z.string().max(100).optional(),
  licenseExpiryDate: z.string().datetime().optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuingBody: z.string(),
    issueDate: z.string(),
    expiryDate: z.string().optional(),
    certificateNumber: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string(),
    graduationYear: z.number(),
  })).optional(),
  profileImageUrl: z.string().url().max(500).optional(),
  bio: z.string().optional(),
  website: z.string().url().max(255).optional(),
  socialMedia: z.object({
    linkedin: z.string().url().optional(),
    twitter: z.string().url().optional(),
    facebook: z.string().url().optional(),
  }).optional(),
  hourlyRate: z.number().min(0).optional(),
  projectMinimum: z.number().min(0).optional(),
  currency: z.string().length(3).default('KES'),
  paymentTerms: z.string().optional(),
  workingHours: z.record(z.object({
    start: z.string(),
    end: z.string(),
  })).optional(),
  emergencyAvailable: z.boolean().default(false),
});

const updateProfessionalSchema = createProfessionalSchema.partial().extend({
  isAvailable: z.boolean().optional(),
  nextAvailableDate: z.string().datetime().optional(),
  verificationDocuments: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
    uploadedAt: z.string(),
    verified: z.boolean(),
  })).optional(),
});

const searchProfessionalsSchema = z.object({
  specialization: z.string().optional(),
  location: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxHourlyRate: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'suspended', 'rejected']).optional(),
  yearsOfExperience: z.number().min(0).optional(),
  serviceAreas: z.array(z.string()).optional(),
  emergencyAvailable: z.boolean().optional(),
  sortBy: z.enum(['rating', 'experience', 'price', 'reviews', 'recent']).default('rating'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const createReviewSchema = z.object({
  professionalId: z.number().min(1),
  projectId: z.number().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().max(255).optional(),
  comment: z.string().min(1, 'Comment is required'),
  serviceType: z.string().max(100).optional(),
  projectValue: z.number().min(0).optional(),
  timelinessRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  wouldRecommend: z.boolean().default(true),
});

const updateAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
  nextAvailableDate: z.string().datetime().optional(),
});

/**
 * Professional Controller
 * Handles all professional directory related API endpoints
 */
export class ProfessionalsController {
  private professionalService: ProfessionalService;

  constructor() {
    this.professionalService = new ProfessionalService(new CacheService());
  }

  /**
   * Create a new professional profile
   * POST /api/professionals
   */
  createProfessional = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createProfessionalSchema.parse(req.body);
    const idempotencyKey = req.headers['idempotency-key'] as string;

    // Add user ID from session if not provided
    if (!validatedData.userId && req.session?.userId) {
      validatedData.userId = req.session.userId;
    }

    const professional = await this.professionalService.createProfessionalProfile(
      validatedData,
      idempotencyKey
    );

    ResponseHelper.created(res, professional, 'Professional profile created successfully', {
      verificationStatus: professional.verificationStatus,
      requiresManualReview: professional.verificationStatus === 'pending',
    });
  });

  /**
   * Update professional profile
   * PUT /api/professionals/:id
   */
  updateProfessional = asyncHandler(async (req: Request, res: Response) => {
    const professionalId = parseInt(req.params.id);
    const validatedData = updateProfessionalSchema.parse(req.body);
    const lastUpdated = req.headers['if-unmodified-since'] 
      ? new Date(req.headers['if-unmodified-since'] as string)
      : undefined;

    const professional = await this.professionalService.updateProfessionalProfile(
      professionalId,
      validatedData,
      lastUpdated
    );

    ResponseHelper.success(res, professional, 'Professional profile updated successfully');
  });

  /**
   * Get professional by ID
   * GET /api/professionals/:id
   */
  getProfessional = asyncHandler(async (req: Request, res: Response) => {
    const professionalId = parseInt(req.params.id);

    const professional = await this.professionalService.getProfessionalById(professionalId);

    if (!professional) {
      return ResponseHelper.notFound(res, 'Professional not found');
    }

    ResponseHelper.success(res, professional, 'Professional retrieved successfully');
  });

  /**
   * Search professionals with filters
   * GET /api/professionals/search
   */
  searchProfessionals = asyncHandler(async (req: Request, res: Response) => {
    const filters = searchProfessionalsSchema.parse(req.query);

    const result = await this.professionalService.searchProfessionals(filters);

    ResponseHelper.paginated(
      res,
      result.professionals,
      result.totalCount,
      result.page,
      result.limit,
      'Professionals retrieved successfully',
      {
        filters: filters,
        hasMore: result.hasMore,
      }
    );
  });

  /**
   * Get professionals by category
   * GET /api/professionals/category/:category
   */
  getProfessionalsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const {category} = req.params;
    const location = req.query.location as string;
    const limit = parseInt(req.query.limit as string) || 10;

    const professionals = await this.professionalService.getProfessionalsByCategory(
      category,
      location,
      limit
    );

    ResponseHelper.success(res, professionals, 'Professionals retrieved successfully', {
      category,
      location: location || 'all',
      totalCount: professionals.length,
    });
  });

  /**
   * Get available professionals
   * GET /api/professionals/available
   */
  getAvailableProfessionals = asyncHandler(async (req: Request, res: Response) => {
    const specialization = req.query.specialization as string;
    const location = req.query.location as string;
    const emergencyOnly = req.query.emergencyOnly === 'true';

    const professionals = await this.professionalService.getAvailableProfessionals(
      specialization,
      location,
      emergencyOnly
    );

    ResponseHelper.success(res, professionals, 'Available professionals retrieved successfully', {
      specialization: specialization || 'all',
      location: location || 'all',
      emergencyOnly,
      totalCount: professionals.length,
    });
  });

  /**
   * Add professional review
   * POST /api/professionals/:id/reviews
   */
  addReview = asyncHandler(async (req: Request, res: Response) => {
    const professionalId = parseInt(req.params.id);
    const validatedData = createReviewSchema.parse(req.body);
    const reviewerId = req.session?.userId;

    if (!reviewerId) {
      return ResponseHelper.authError(res, 'Authentication required to add review');
    }

    // Ensure professional ID matches
    validatedData.professionalId = professionalId;

    const review = await this.professionalService.addProfessionalReview({
      ...validatedData,
      reviewerId,
    });

    ResponseHelper.created(res, review, 'Review added successfully');
  });

  /**
   * Get professional reviews
   * GET /api/professionals/:id/reviews
   */
  getReviews = asyncHandler(async (req: Request, res: Response) => {
    const professionalId = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await this.professionalService.getProfessionalReviews(
      professionalId,
      page,
      limit
    );

    ResponseHelper.success(res, result.reviews, 'Reviews retrieved successfully', {
      totalCount: result.totalCount,
      page,
      limit,
      averageRating: result.averageRating,
      ratingDistribution: result.ratingDistribution,
    });
  });

  /**
   * Update professional availability
   * PATCH /api/professionals/:id/availability
   */
  updateAvailability = asyncHandler(async (req: Request, res: Response) => {
    const professionalId = parseInt(req.params.id);
    const validatedData = updateAvailabilitySchema.parse(req.body);

    // Check if user owns this professional profile
    const professional = await this.professionalService.getProfessionalById(professionalId);
    if (!professional) {
      return ResponseHelper.notFound(res, 'Professional not found');
    }

    if (professional.userId !== req.session?.userId) {
      return ResponseHelper.authorizationError(res, 'You can only update your own availability');
    }

    await this.professionalService.updateAvailability(
      professionalId,
      validatedData.isAvailable,
      validatedData.nextAvailableDate ? new Date(validatedData.nextAvailableDate) : undefined
    );

    ResponseHelper.successMessage(res, 'Availability updated successfully');
  });

  /**
   * Get professional statistics
   * GET /api/professionals/:id/stats
   */
  getProfessionalStats = asyncHandler(async (req: Request, res: Response) => {
    const professionalId = parseInt(req.params.id);

    const professional = await this.professionalService.getProfessionalById(professionalId);
    if (!professional) {
      return ResponseHelper.notFound(res, 'Professional not found');
    }

    const stats = {
      totalReviews: professional.totalReviews,
      averageRating: professional.averageRating,
      completedProjects: professional.completedProjects,
      trustScore: professional.trustScore,
      responseTime: professional.responseTime,
      completionRate: professional.completionRate,
      yearsOfExperience: professional.yearsOfExperience,
      verificationStatus: professional.verificationStatus,
      isAvailable: professional.isAvailable,
      emergencyAvailable: professional.emergencyAvailable,
    };

    ResponseHelper.success(res, stats, 'Professional statistics retrieved successfully');
  });

  /**
   * Get professional specializations
   * GET /api/professionals/specializations
   */
  getSpecializations = asyncHandler(async (req: Request, res: Response) => {
    const specializations = [
      { value: 'land_surveying', label: 'Land Surveying', description: 'Professional land measurement and boundary determination' },
      { value: 'property_law', label: 'Property Law', description: 'Legal expertise in property transactions and disputes' },
      { value: 'real_estate_appraisal', label: 'Real Estate Appraisal', description: 'Property valuation and market analysis' },
      { value: 'construction_inspection', label: 'Construction Inspection', description: 'Building quality and safety assessment' },
      { value: 'environmental_assessment', label: 'Environmental Assessment', description: 'Environmental impact and compliance evaluation' },
      { value: 'title_verification', label: 'Title Verification', description: 'Property ownership and title document verification' },
      { value: 'boundary_disputes', label: 'Boundary Disputes', description: 'Resolution of property boundary conflicts' },
      { value: 'zoning_compliance', label: 'Zoning Compliance', description: 'Land use and zoning regulation compliance' },
      { value: 'mortgage_processing', label: 'Mortgage Processing', description: 'Loan processing and financial documentation' },
      { value: 'property_management', label: 'Property Management', description: 'Ongoing property maintenance and administration' },
    ];

    ResponseHelper.success(res, specializations, 'Specializations retrieved successfully');
  });

  /**
   * Health check endpoint
   * GET /api/professionals/health
   */
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    ResponseHelper.success(res, { status: 'healthy', timestamp: new Date().toISOString() }, 'Professional service is healthy');
  });
}

// Export controller instance
export const professionalsController = new ProfessionalsController();