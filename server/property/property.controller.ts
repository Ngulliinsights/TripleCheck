import { randomBytes } from 'crypto';

import { Router, Request, Response, NextFunction } from 'express';

import { AuthenticatedRequest, requireAuth } from '../middleware/auth.middleware';

import { PropertyService } from './property.service';

const router = Router();
const propertyService = new PropertyService();

// Type definitions for better type safety - aligned with Express middleware patterns
type PropertyType = 'residential' | 'commercial' | 'land';

interface PropertyFilters {
  propertyType?: PropertyType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  [key: string]: unknown;
}

interface StandardResponse<T = unknown> {
  success: boolean;
  items?: T[];
  totalCount?: number;
  hasNextPage?: boolean;
  page?: number;
  limit?: number;
  data?: T;
  error?: string;
  message?: string;
}

interface PropertyQueryParams {
  filters?: PropertyFilters;
  page?: number;
  sort?: string;
  pageSize?: number;
  search?: string;
}

// Corrected route handler types that align with Express middleware architecture
type ExpressHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
type ExpressAuthHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;

// Constants to avoid string duplication
const VALIDATION_ERRORS = {
  PROPERTY_ID_REQUIRED: 'Valid Property ID is required',
  AUTH_REQUIRED: 'Authentication required',
  MISSING_LOCATION_TYPE: 'Missing required parameters: location and propertyType',
  OWNER_ID_REQUIRED: 'Valid Owner ID is required'
} as const;

const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_GET_PAGE_SIZE = 20;
const DEFAULT_SORT = 'createdAt';

// Enhanced logging utility that respects ESLint no-console rules
const logError = (message: string, details?: unknown): void => {
  if (process.env.NODE_ENV === 'development') {
    // Use structured logging approach that can be easily replaced with proper logger
    const errorLog = {
      level: 'error',
      message,
      details,
      timestamp: new Date().toISOString()
    };
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(errorLog, null, 2));
  }
};

// Utility functions for cleaner code with improved type safety
const parseIntParam = (param: string | undefined, defaultValue: number): number => {
  return param ? parseInt(param, 10) || defaultValue : defaultValue;
};

// Enhanced number conversion with proper type checking
const safeParseNumber = (value: string | number | undefined, defaultValue: number): number => {
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

const createStandardResponse = <T>(
  result: { data?: T[]; total?: number; hasNext?: boolean; page?: number; limit?: number },
  pageSize: number = DEFAULT_PAGE_SIZE
): StandardResponse<T> => ({
  success: true,
  items: result.data || [],
  totalCount: result.total || 0,
  hasNextPage: result.hasNext || false,
  page: result.page || 1,
  limit: result.limit || pageSize
});

// Shared async handler implementation to avoid code duplication
const createAsyncHandler = <T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void | Response>
) => {
  return (req: T, res: Response, next: NextFunction): void => {
    // Enhanced error handling that avoids the promise/no-callback-in-promise warning
    const handlePromise = async (): Promise<void> => {
      try {
        await fn(req, res, next);
      } catch (error) {
        // Forward error to Express error handling middleware
        next(error);
      }
    };

    // Execute the async handler without using catch with callback
    void handlePromise();
  };
};

// Improved async handler that properly handles Express middleware patterns without callback warnings
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>): ExpressHandler => {
  return createAsyncHandler(fn);
};

const asyncAuthHandler = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response>): ExpressAuthHandler => {
  return createAsyncHandler(fn) as ExpressAuthHandler;
};

// Validation helpers with enhanced security to prevent object injection
const validatePropertyId = (id: string | undefined): id is string => {
  return Boolean(id && typeof id === 'string' && id.trim().length > 0);
};

// Secure parameter validation that prevents object injection vulnerabilities
// This implementation completely eliminates the security/detect-object-injection warning
// by avoiding any dynamic property access patterns that could be exploited
const validateRequiredParams = (params: Record<string, unknown>, requiredFields: readonly string[]): string | null => {
  // Define a secure whitelist of allowed field names to prevent injection attacks
  // This approach ensures we only validate known, safe parameters
  const allowedFields = new Set(['location', 'propertyType', 'priceMin', 'priceMax', 'bedrooms', 'maxResults']);

  // Validate each required field using a secure, non-dynamic approach
  for (const fieldName of requiredFields) {
    // First, ensure the field name itself is safe and expected
    if (!fieldName || typeof fieldName !== 'string' || !allowedFields.has(fieldName)) {
      return `Invalid or unsafe field specification: ${fieldName}`;
    }

    // Use a switch statement instead of dynamic property access
    // This completely eliminates the object injection vulnerability
    let fieldValue: unknown;
    switch (fieldName) {
      case 'location':
        fieldValue = params.location;
        break;
      case 'propertyType':
        fieldValue = params.propertyType;
        break;
      case 'priceMin':
        fieldValue = params.priceMin;
        break;
      case 'priceMax':
        fieldValue = params.priceMax;
        break;
      case 'bedrooms':
        fieldValue = params.bedrooms;
        break;
      case 'maxResults':
        fieldValue = params.maxResults;
        break;
      default:
        return `Unsupported field: ${fieldName}`;
    }

    // Check if the field value exists and is not empty
    if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
      return `Missing or empty required parameter: ${fieldName}`;
    }
  }

  // All validations passed successfully
  return null;
};

// Property retrieval handler for GET requests - handles URL query parameters
// This function is specifically designed for GET requests where filters come from req.query
// It uses different default page sizes and parameter parsing optimized for URL parameters
const createPropertyRetrievalHandler = (propertyType?: PropertyType) =>
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
    // GET requests receive parameters through URL query string
    // These need to be parsed differently than POST body parameters
    const filters: PropertyFilters = {
      ...req.query,
      ...(propertyType && { propertyType })
    };

    const result = await propertyService.getProperties(filters);
    // GET requests use a different default page size for better URL handling
    const response = createStandardResponse(result, DEFAULT_GET_PAGE_SIZE);
    return res.json(response);
  });

// Property search handler for POST requests - handles structured body parameters
// This function is designed for POST requests with complex filtering requirements
// It supports nested filters, different pagination, and body-based parameter validation
const createPropertySearchHandler = (propertyType?: PropertyType) =>
  asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
    // POST requests receive structured data through req.body
    // This allows for more complex filtering and search parameters
    const {
      filters = {},
      page = 1,
      sort = DEFAULT_SORT,
      pageSize = DEFAULT_PAGE_SIZE,
      search
    }: PropertyQueryParams = req.body;

    // Build search filters with body-specific parameter handling
    // This structure supports more complex queries than URL parameters allow
    const searchFilters: PropertyFilters = {
      ...filters,
      ...(search && { search }),
      ...(propertyType && { propertyType })
    };

    // POST requests support different sorting and pagination options
    const result = await propertyService.getProperties({
      ...searchFilters,
      page,
      limit: pageSize, // Note: POST uses pageSize, GET uses default
      sortBy: sort
    });

    // POST requests use their own page size configuration for optimal performance
    const response = createStandardResponse(result, pageSize);
    return res.json(response);
  });

// Public routes - Property retrieval endpoints

// Get all properties with search and filters
router.get('/', createPropertyRetrievalHandler());

// Property type specific GET routes
router.get('/residential', createPropertyRetrievalHandler('residential'));
router.get('/commercial', createPropertyRetrievalHandler('commercial'));
router.get('/land', createPropertyRetrievalHandler('land'));
router.get('/all', createPropertyRetrievalHandler());

// Property type specific POST routes for complex filtering
router.post('/residential', createPropertySearchHandler('residential'));
router.post('/commercial', createPropertySearchHandler('commercial'));
router.post('/land', createPropertySearchHandler('land'));
router.post('/all', createPropertySearchHandler());

// General search endpoint
router.post('/search', createPropertySearchHandler());

// Get similar properties (must be before /:id route)
router.get('/similar', asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const { location, propertyType, priceMin, priceMax, bedrooms, maxResults } = req.query;

  const validationError = validateRequiredParams(req.query, ['location', 'propertyType'] as const);
  if (validationError) {
    return res.status(400).json({
      success: false,
      error: validationError
    });
  }

  const params = {
    location: location as string,
    propertyType: propertyType as PropertyType,
    ...(priceMin && priceMax && {
      priceRange: {
        min: parseIntParam(priceMin as string, 0),
        max: parseIntParam(priceMax as string, Number.MAX_SAFE_INTEGER)
      }
    }),
    ...(bedrooms && { bedrooms: parseIntParam(bedrooms as string, 0) }),
    ...(maxResults && { maxResults: parseIntParam(maxResults as string, 10) })
  };

  const result = await propertyService.getSimilarProperties(params);
  return res.json(result);
}));

// Get properties by owner (must be before /:id route)
router.get('/owner/:ownerId', asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const { ownerId } = req.params;

  if (!validatePropertyId(ownerId)) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERRORS.OWNER_ID_REQUIRED
    });
  }

  const result = await propertyService.getPropertiesByOwner(ownerId);
  return res.json(result);
}));

// Get single property
router.get('/:id', asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const { id: propertyId } = req.params;

  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  const includeMarketEstimate = req.query.includeMarketEstimate === 'true';
  const result = await propertyService.getProperty(propertyId, { includeMarketEstimate });

  if (!result.data) {
    return res.status(404).json({
      success: false,
      error: 'Property not found',
      message: `Property with ID ${propertyId} was not found`
    });
  }

  return res.json(result);
}));

// Authentication helper for protected routes with improved type safety
const requireValidUser = (req: AuthenticatedRequest, res: Response): req is AuthenticatedRequest & { user: { id: string | number } } => {
  if (!req.user?.id) {
    res.status(401).json({ error: VALIDATION_ERRORS.AUTH_REQUIRED });
    return false;
  }
  return true;
};

// Protected routes - Authentication required

// Create property
router.post('/', requireAuth, asyncAuthHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<Response | void> => {
  if (!requireValidUser(req, res)) return;

  // Convert user ID to number with proper type handling
  const userId = safeParseNumber(req.user.id, 0);
  const result = await propertyService.createProperty(req.body, userId);
  return res.status(201).json(result);
}));

// Update property (owner only)
router.patch('/:id', requireAuth, asyncAuthHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<Response | void> => {
  if (!requireValidUser(req, res)) return;

  const { id: propertyId } = req.params;
  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  // Convert user ID to number with proper type handling
  const userId = safeParseNumber(req.user.id, 0);
  const result = await propertyService.updateProperty(propertyId, req.body, userId);
  return res.json(result);
}));

// Delete property (owner only) - Fixed TypeScript error with proper type handling
router.delete('/:id', requireAuth, asyncAuthHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<Response | void> => {
  if (!requireValidUser(req, res)) return;

  const { id: propertyId } = req.params;
  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  // Fixed TypeScript error: Ensure userId is always a number for consistency
  // The deleteProperty method expects a number, so we convert appropriately
  const userId = safeParseNumber(req.user.id, 0);
  await propertyService.deleteProperty(propertyId, userId);
  return res.json({
    success: true,
    message: 'Property deleted successfully'
  });
}));

// Land verification endpoints

// Initiate land verification
router.post('/:id/land-verification', requireAuth, asyncAuthHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<Response | void> => {
  if (!requireValidUser(req, res)) return;

  const { id: propertyId } = req.params;
  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  const result = await propertyService.initiateLandVerification(
    propertyId,
    req.user.id.toString(),
    req.body.requestedLayers
  );
  return res.status(201).json(result);
}));

// Get land verification status
router.get('/:id/land-verification/status', asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const { id: propertyId } = req.params;
  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  const result = await propertyService.getLandVerificationStatus(propertyId);
  return res.json(result);
}));

// Get land verification report
router.get('/:id/land-verification/report', asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const { id: propertyId } = req.params;
  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  const result = await propertyService.getLandVerificationReport(propertyId);
  return res.json(result);
}));

// Update land verification data
router.patch('/:id/land-verification', requireAuth, asyncAuthHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<Response | void> => {
  if (!requireValidUser(req, res)) return;

  const { id: propertyId } = req.params;
  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  // Use safeParseNumber to handle the type conversion properly
  const userId = safeParseNumber(req.user.id, 0);
  const result = await propertyService.updatePropertyLandVerification(
    propertyId,
    req.body.landVerification,
    userId
  );
  return res.json(result);
}));

// Document and verification endpoints

// Cryptographically secure document ID generation using Node.js crypto
const generateSecureDocumentId = (): string => {
  const timestamp = Date.now();
  const randomSuffix = randomBytes(6).toString('hex');
  return `doc_${timestamp}_${randomSuffix}`;
};

// Document upload for verification
router.post('/:id/documents', requireAuth, asyncAuthHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<Response | void> => {
  if (!requireValidUser(req, res)) return;

  const { id: propertyId } = req.params;
  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      message: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  // Mock document upload response with enhanced structure
  const response: StandardResponse = {
    success: true,
    message: 'Document uploaded successfully',
    data: {
      documentId: generateSecureDocumentId(),
      propertyId,
      uploadedAt: new Date().toISOString(),
      status: 'pending_verification'
    }
  };

  return res.json(response);
}));

// Property verification endpoint with deterministic mock data
router.post('/:id/verify', requireAuth, asyncAuthHandler(async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<Response | void> => {
  if (!requireValidUser(req, res)) return;

  const { id: propertyId } = req.params;
  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      message: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  // Generate deterministic mock data for consistent testing using secure hashing approach
  const propertyIdHash = propertyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const riskScore = (propertyIdHash % 30) + 10; // Score between 10-40
  const overallScore = (propertyIdHash % 20) + 80; // Score between 80-100
  const suspiciousScore = propertyIdHash % 20; // Score between 0-20
  const fraudOverallScore = ((propertyIdHash + 1) % 20) + 80;

  // Clear risk level determination logic
  let riskLevel: string;
  if (riskScore < 20) {
    riskLevel = 'low';
  } else if (riskScore < 30) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  const verificationTimestamp = new Date().toISOString();

  const response: StandardResponse = {
    success: true,
    data: {
      documentAuthenticity: 'verified',
      ownershipVerified: true,
      riskScore,
      overallScore,
      verifiedAt: verificationTimestamp,
      verificationTimestamp,
      fraudDetection: {
        isSuspicious: suspiciousScore < 5, // 25% chance of being suspicious
        suspiciousScore,
        overallScore: fraudOverallScore,
        verificationTimestamp,
        riskLevel
      }
    }
  };

  return res.json(response);
}));

// Get property verification status
router.get('/:id/verification', asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const { id: propertyId } = req.params;
  if (!validatePropertyId(propertyId)) {
    return res.status(400).json({
      success: false,
      error: VALIDATION_ERRORS.PROPERTY_ID_REQUIRED
    });
  }

  // Generate deterministic timestamp for mock data based on property ID
  const propertyIdHash = propertyId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const daysAgo = propertyIdHash % 30; // Deterministic days ago between 0-29
  const lastVerified = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  // Mock verification status with more realistic data structure
  const response: StandardResponse = {
    success: true,
    data: {
      verificationStatus: 'verified',
      lastVerified,
      riskLevel: 'low',
      documentAuthenticity: 'verified',
      completionPercentage: 100,
      verificationSteps: {
        documentUpload: { completed: true, completedAt: new Date().toISOString() },
        ownershipCheck: { completed: true, completedAt: new Date().toISOString() },
        fraudDetection: { completed: true, completedAt: new Date().toISOString() },
        finalReview: { completed: true, completedAt: new Date().toISOString() }
      }
    }
  };

  return res.json(response);
}));

// **NEW ENDPOINTS** - Property Updates and Polling

// Get property updates (for polling)
router.get('/updates', asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
  const { since, limit = '20' } = req.query;
  const limitNum = parseInt(limit as string, 10);
  
  // Mock property updates
  const updates = [];
  for (let i = 0; i < limitNum; i++) {
    updates.push({
      id: `update_${i}_${Date.now()}`,
      propertyId: `prop_${Math.floor(Math.random() * 1000)}`,
      type: ['price_change', 'status_update', 'new_photos', 'description_update'][Math.floor(Math.random() * 4)],
      description: `Property update #${i + 1}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      data: {
        oldValue: 'Previous value',
        newValue: 'New value',
        changeReason: 'Market adjustment'
      }
    });
  }
  
  return res.json({
    success: true,
    data: updates,
    pagination: {
      limit: limitNum,
      hasMore: Math.random() > 0.5
    }
  });
}));

// Development-only performance monitoring with proper exception handling
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/performance', asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<Response> => {
    try {
      // Dynamic import to avoid issues in production
      const { queryMonitor } = await import('../infrastructure/monitoring/QueryPerformanceMonitor');
      const timeWindow = parseIntParam(req.query.timeWindow as string, 60);

      const stats = queryMonitor.getStats(timeWindow);
      const similarPropertiesStats = queryMonitor.getQueryStats('findSimilar', timeWindow);

      const response: StandardResponse = {
        success: true,
        data: {
          overall: stats,
          similarProperties: similarPropertiesStats,
          timeWindowMinutes: timeWindow,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        }
      };

      return res.json(response);
    } catch (error: unknown) {
      // Properly handle and log the exception using our structured logging approach
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Use our structured logging utility instead of direct console usage
      logError('Performance monitoring error', {
        message: errorMessage,
        stack: errorStack
      });

      // Return a meaningful error response to the client
      return res.status(503).json({
        success: false,
        error: 'Performance monitoring unavailable',
        message: 'The performance monitoring module could not be loaded or executed properly',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }));
}

export { router as propertyRouter };