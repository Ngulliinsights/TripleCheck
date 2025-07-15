import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPropertySchema,
  insertReviewSchema,
  insertUserSchema,
} from "@shared/schema";
import { z } from "zod";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import {
  handleDocumentVerification,
  handleFraudDetection,
  handleGenerateReport,
  FileUploadRequest,
  registerAIRoutes,
} from "./ai-routes";

// Import only the types that actually exist in the schema
import type { User, Property, Review } from "@shared/schema";

// Enhanced type definitions with better organization
type DatabaseUser = User;
type DatabaseProperty = Property;
type DatabaseReview = Review;

// Define input types based on the insert schemas
type NewUserInput = z.infer<typeof insertUserSchema>;
type NewPropertyInput = z.infer<typeof insertPropertySchema>;
type NewReviewInput = z.infer<typeof insertReviewSchema>;

// Define a proper Location type that matches what your storage layer expects
interface LocationData {
  id: number;
  name: string;
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
}

// Enhanced session interface with proper typing
interface CustomSession {
  userId?: number;
  destroy: (callback: (err?: any) => void) => void;
}

// Type-safe authenticated request interface
interface AuthenticatedRequest extends Omit<Request, "session"> {
  session?: CustomSession;
}

// Enhanced fraud detection result type that matches actual implementation
interface CompleteFraudDetectionResult {
  isSuspicious: boolean;
  suspiciousScore: number;
  overallScore: number;
  verificationTimestamp: string;
  imageAnalysis?: {
    qualityScore: number;
    authenticityScore: number;
    flaggedIssues: string[];
  };
  descriptionAnalysis?: {
    sentiment: number;
    keywordFlags: string[];
    qualityScore: number;
  };
  aiModel?: string;
}

// Enhanced verification result with flexible property access
interface VerificationResult {
  documentAuthenticity: "verified" | "suspicious" | "pending";
  ownershipVerified: boolean;
  riskScore: number;
  verifiedAt: string;
  error?: string;
  overallScore: number;
  verificationTimestamp: string;
  fraudDetection?: CompleteFraudDetectionResult;
  imageAnalysis?: {
    qualityScore: number;
    authenticityScore: number;
    flaggedIssues: string[];
  };
  descriptionAnalysis?: {
    sentiment: number;
    keywordFlags: string[];
    qualityScore: number;
  };
  aiModel?: string;
}

// Define AIVerificationResults to include all necessary properties
interface AIVerificationResults {
  documentAuthenticity?: "verified" | "suspicious" | "pending";
  ownershipVerified?: boolean;
  riskScore?: number;
  verifiedAt?: string;
  overallScore: number;
  verificationTimestamp: string;
  fraudDetection?: CompleteFraudDetectionResult;
  imageAnalysis?: {
    qualityScore: number;
    authenticityScore: number;
    flaggedIssues: string[];
  };
  descriptionAnalysis?: {
    sentiment: number;
    keywordFlags: string[];
    qualityScore: number;
  };
  aiModel?: string;
}

// Type-safe search filters with validation
interface SearchFilters {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
}

// Generic API response wrapper for consistent structure
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  metadata?: {
    totalCount?: number;
    page?: number;
    limit?: number;
    filters?: SearchFilters;
  };
}

// Enhanced constants with better organization
const CONSTANTS = {
  FILE_SIZE_LIMIT: 10 * 1024 * 1024, // 10MB
  API_VERSION: "1.0.0",
  DEFAULT_RISK_SCORE: 50,
  MAX_QUERY_LENGTH: 100,
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
  VERIFICATION: {
    PENDING: "pending" as const,
    VERIFIED: "verified" as const,
    SUSPICIOUS: "suspicious" as const,
    FAILED: "failed" as const,
  },
} as const;

// Centralized error messages for consistency
const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Invalid data provided",
  USERNAME_EXISTS: "Username already exists",
  INVALID_CREDENTIALS: "Invalid username or password",
  AUTH_REQUIRED: "Authentication required",
  USER_NOT_FOUND: "User not found",
  PROPERTY_NOT_FOUND: "Property not found",
  REGISTRATION_FAILED: "Registration failed",
  LOGIN_FAILED: "Login failed",
  LOGOUT_FAILED: "Logout failed",
  REVIEW_CREATION_FAILED: "Failed to create review",
  INVALID_PROPERTY_ID: "Invalid property ID",
  VERIFICATION_ERROR: "Error retrieving verification status",
  SEARCH_QUERY_REQUIRED: "Search query is required",
  LOCATION_SEARCH_FAILED: "Failed to search locations",
  INVALID_SEARCH_FILTERS: "Invalid search filters",
  PROPERTY_SEARCH_FAILED: "Failed to search properties",
  DATABASE_ERROR: "Database operation failed",
  AI_VERIFICATION_FAILED: "AI verification process failed",
} as const;

// Enhanced upload directory setup
const __dirname = path.resolve();
const UPLOAD_DIR = path.join(__dirname, "uploads");

// Ensure upload directory exists with proper error handling
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Upload directory created: ${UPLOAD_DIR}`);
  }
} catch (error) {
  console.error("Failed to create upload directory:", error);
  process.exit(1);
}

// Type-safe authentication middleware with enhanced error handling
const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.session?.userId;
  if (!userId) {
    const response: ApiResponse = {
      success: false,
      message: ERROR_MESSAGES.AUTH_REQUIRED,
    };
    res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json(response);
    return;
  }
  next();
};

// Enhanced error handling that provides better debugging information
const handleDrizzleError = (
  error: unknown,
  res: Response,
  defaultMessage: string
): void => {
  console.error("Database operation error:", error);

  // Handle Zod validation errors (from schema validation)
  if (error instanceof z.ZodError) {
    const response: ApiResponse = {
      success: false,
      message: `Validation error: ${error.errors[0].message}`,
      errors: error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      })),
    };
    res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
    return;
  }

  // Handle Drizzle database errors with more specific patterns
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Check for common database constraint violations
    if (
      errorMessage.includes("unique constraint") ||
      errorMessage.includes("duplicate")
    ) {
      const response: ApiResponse = {
        success: false,
        message: "A record with this information already exists",
      };
      res.status(CONSTANTS.HTTP_STATUS.CONFLICT).json(response);
      return;
    }

    // Handle foreign key constraint violations
    if (
      errorMessage.includes("foreign key") ||
      errorMessage.includes("constraint")
    ) {
      const response: ApiResponse = {
        success: false,
        message: "Referenced record does not exist",
      };
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
      return;
    }

    // Handle other database errors
    if (
      errorMessage.includes("not null constraint") ||
      errorMessage.includes("required")
    ) {
      const response: ApiResponse = {
        success: false,
        message: "Required fields are missing",
      };
      res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
      return;
    }
  }

  // Generic error response for unknown errors
  const response: ApiResponse = {
    success: false,
    message: defaultMessage,
  };
  res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(response);
};

// ------------------------------------------------------------------
// Minimal shape returned by ./ai-routes
interface AIFraudDetectionResult {
  isSuspicious: boolean;
  suspiciousScore: number;
  overallScore?: number;
  verificationTimestamp?: string;
  imageAnalysis?: {
    qualityScore: number;
    authenticityScore: number;
    flaggedIssues: string[];
  };
  descriptionAnalysis?: {
    sentiment: number;
    keywordFlags: string[];
    qualityScore: number;
  };
  aiModel?: string;
}

// ------------------------------------------------------------------
// Type-safe fraud detection function
async function detectFraudSafely(
  propertyData: NewPropertyInput
): Promise<CompleteFraudDetectionResult> {
  try {
    const { detectFraud } = await import("./ai-routes");
    const raw: AIFraudDetectionResult = await detectFraud(propertyData);

    return {
      isSuspicious: raw.isSuspicious ?? false,
      suspiciousScore: raw.suspiciousScore ?? 0,
      overallScore: raw.overallScore ?? raw.suspiciousScore ?? 0,
      verificationTimestamp:
        raw.verificationTimestamp ?? new Date().toISOString(),
      imageAnalysis: raw.imageAnalysis,
      descriptionAnalysis: raw.descriptionAnalysis,
      aiModel: raw.aiModel ?? "default",
    };
  } catch (error) {
    console.error("Fraud detection error:", error);
    return {
      isSuspicious: false,
      suspiciousScore: 0,
      overallScore: CONSTANTS.DEFAULT_RISK_SCORE,
      verificationTimestamp: new Date().toISOString(),
      aiModel: "fallback",
    };
  }
}

// ------------------------------------------------------------------
// Enhanced AI verification function
async function performAIVerification(
  propertyData: NewPropertyInput
): Promise<VerificationResult> {
  try {
    const fraudDetection = await detectFraudSafely(propertyData);

    return {
      documentAuthenticity: fraudDetection.isSuspicious
        ? CONSTANTS.VERIFICATION.SUSPICIOUS
        : CONSTANTS.VERIFICATION.VERIFIED,
      ownershipVerified: !fraudDetection.isSuspicious,
      riskScore: Math.floor(fraudDetection.suspiciousScore * 100),
      fraudDetection,
      verifiedAt: new Date().toISOString(),
      overallScore: fraudDetection.overallScore,
      verificationTimestamp: fraudDetection.verificationTimestamp,
    };
  } catch (error) {
    console.error("AI verification error:", error);
    return {
      documentAuthenticity: CONSTANTS.VERIFICATION.PENDING,
      ownershipVerified: false,
      riskScore: CONSTANTS.DEFAULT_RISK_SCORE,
      verifiedAt: new Date().toISOString(),
      error:
        error instanceof Error
          ? error.message
          : ERROR_MESSAGES.AI_VERIFICATION_FAILED,
      overallScore: CONSTANTS.DEFAULT_RISK_SCORE,
      verificationTimestamp: new Date().toISOString(),
    };
  }
}

// Enhanced helper functions with better type safety
const getUserIdFromSession = (req: AuthenticatedRequest): number | null => {
  return req.session?.userId ?? null;
};

const createApiResponse = <T>(
  success: boolean,
  data?: T,
  message?: string,
  metadata?: ApiResponse<T>["metadata"]
): ApiResponse<T> => {
  const response: ApiResponse<T> = { success };
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  if (metadata) response.metadata = metadata;
  return response;
};

// Enhanced input validation with better error messages
const validatePropertyId = (
  id: string
): { valid: boolean; propertyId?: number; error?: string } => {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "Property ID is required" };
  }

  const propertyId = parseInt(id.trim());
  if (isNaN(propertyId) || propertyId <= 0) {
    return { valid: false, error: "Property ID must be a positive number" };
  }

  return { valid: true, propertyId };
};

const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== "string") {
    return "";
  }
  return query.trim().substring(0, CONSTANTS.MAX_QUERY_LENGTH);
};

// Enhanced search filters validation
const validateSearchFilters = (
  filters: any
): { valid: boolean; sanitizedFilters?: SearchFilters; error?: string } => {
  if (!filters || typeof filters !== "object") {
    return { valid: false, error: "Invalid search filters format" };
  }

  try {
    const sanitizedFilters: SearchFilters = {};

    // Validate and sanitize each filter
    if (filters.location && typeof filters.location === "string") {
      sanitizedFilters.location = sanitizeSearchQuery(filters.location);
    }

    if (filters.priceMin !== undefined) {
      const priceMin = Number(filters.priceMin);
      if (!isNaN(priceMin) && priceMin >= 0) {
        sanitizedFilters.priceMin = priceMin;
      }
    }

    if (filters.priceMax !== undefined) {
      const priceMax = Number(filters.priceMax);
      if (!isNaN(priceMax) && priceMax >= 0) {
        sanitizedFilters.priceMax = priceMax;
      }
    }

    if (filters.propertyType && typeof filters.propertyType === "string") {
      sanitizedFilters.propertyType = filters.propertyType.trim();
    }

    if (filters.bedrooms !== undefined) {
      const bedrooms = Number(filters.bedrooms);
      if (!isNaN(bedrooms) && bedrooms >= 0) {
        sanitizedFilters.bedrooms = bedrooms;
      }
    }

    if (filters.bathrooms !== undefined) {
      const bathrooms = Number(filters.bathrooms);
      if (!isNaN(bathrooms) && bathrooms >= 0) {
        sanitizedFilters.bathrooms = bathrooms;
      }
    }

    if (filters.verified !== undefined) {
      sanitizedFilters.verified = Boolean(filters.verified);
    }

    return { valid: true, sanitizedFilters };
  } catch (error) {
    return { valid: false, error: "Error processing search filters" };
  }
};

export function registerRoutes(app: Express): void {
  // Enhanced health check endpoint with more detailed information
  app.get("/api/health", (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: CONSTANTS.API_VERSION,
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
    res.status(CONSTANTS.HTTP_STATUS.OK).json(response);
  });

  // Enhanced file upload middleware with security improvements
  app.use(
    fileUpload({
      limits: { fileSize: CONSTANTS.FILE_SIZE_LIMIT },
      abortOnLimit: true,
      createParentPath: true,
      useTempFiles: true,
      tempFileDir: UPLOAD_DIR,
      safeFileNames: true,
      preserveExtension: true,
      defCharset: "utf8",
      defParamCharset: "utf8",
      // Additional security settings
      parseNested: true,
      debug: process.env.NODE_ENV === "development",
    })
  );

  // Enhanced authentication routes with improved error handling
  app.post(
    "/api/auth/register",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // Validate input using the insert schema
        const userData: NewUserInput = insertUserSchema.parse(req.body);

        // Check for existing user using type-safe queries
        const existingUser = await storage.getUserByUsername(userData.username);
        if (existingUser) {
          const response: ApiResponse = {
            success: false,
            message: ERROR_MESSAGES.USERNAME_EXISTS,
          };
          return res.status(CONSTANTS.HTTP_STATUS.CONFLICT).json(response);
        }

        // Create user using Drizzle's insert functionality
        const user = await storage.createUser(userData);

        // Remove password from response for security
        const { password, ...userWithoutPassword } = user;

        const response: ApiResponse<Omit<DatabaseUser, "password">> = {
          success: true,
          data: userWithoutPassword,
          message: "User registered successfully",
        };

        res.status(CONSTANTS.HTTP_STATUS.CREATED).json(response);
      } catch (error) {
        handleDrizzleError(error, res, ERROR_MESSAGES.REGISTRATION_FAILED);
      }
    }
  );

  app.post(
    "/api/auth/login",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { username, password } = req.body;

        // Validate required fields
        if (!username || !password) {
          const response: ApiResponse = {
            success: false,
            message: "Username and password are required",
          };
          return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
        }

        // Authenticate user using type-safe query
        const user = await storage.getUserByUsername(username);
        if (!user || user.password !== password) {
          const response: ApiResponse = {
            success: false,
            message: ERROR_MESSAGES.INVALID_CREDENTIALS,
          };
          return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json(response);
        }

        // Set session with proper type safety
        if (req.session) {
          req.session.userId = user.id;
        }

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;
        const response: ApiResponse<Omit<DatabaseUser, "password">> = {
          success: true,
          data: userWithoutPassword,
          message: "Login successful",
        };

        res.json(response);
      } catch (error) {
        handleDrizzleError(error, res, ERROR_MESSAGES.LOGIN_FAILED);
      }
    }
  );

  app.post(
    "/api/auth/logout",
    async (req: AuthenticatedRequest, res: Response) => {
      if (req.session) {
        req.session.destroy((err: any) => {
          if (err) {
            console.error("Logout error:", err);
            const response: ApiResponse = {
              success: false,
              message: ERROR_MESSAGES.LOGOUT_FAILED,
            };
            return res
              .status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
              .json(response);
          }

          const response: ApiResponse = {
            success: true,
            message: "Logged out successfully",
          };
          res.json(response);
        });
      } else {
        const response: ApiResponse = {
          success: true,
          message: "Logged out successfully",
        };
        res.json(response);
      }
    }
  );

  app.get("/api/auth/me", async (req: AuthenticatedRequest, res: Response) => {
    const userId = getUserIdFromSession(req);
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        message: ERROR_MESSAGES.AUTH_REQUIRED,
      };
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json(response);
    }

    try {
      // Use type-safe query to get user
      const user = await storage.getUser(userId);
      if (!user) {
        const response: ApiResponse = {
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        };
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json(response);
      }

      const { password, ...userWithoutPassword } = user;
      const response: ApiResponse<Omit<DatabaseUser, "password">> = {
        success: true,
        data: userWithoutPassword,
      };

      res.json(response);
    } catch (error) {
      handleDrizzleError(error, res, "Failed to retrieve user information");
    }
  });

  // Enhanced properties routes with better validation
  app.get("/api/properties", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const sanitizedQuery = sanitizeSearchQuery(query || "");

      // Use efficient query methods with proper error handling
      const properties = sanitizedQuery
        ? await storage.searchProperties(sanitizedQuery)
        : await storage.getProperties();

      const response: ApiResponse<{
        properties: DatabaseProperty[];
        totalCount: number;
      }> = {
        success: true,
        data: {
          properties,
          totalCount: properties.length,
        },
        metadata: {
          totalCount: properties.length,
          ...(sanitizedQuery && { filters: { location: sanitizedQuery } }),
        },
      };

      res.json(response);
    } catch (error) {
      handleDrizzleError(error, res, "Failed to retrieve properties");
    }
  });

  app.get("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const validation = validatePropertyId(req.params.id);
      if (!validation.valid) {
        const response: ApiResponse = {
          success: false,
          message: validation.error || ERROR_MESSAGES.INVALID_PROPERTY_ID,
        };
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
      }

      // Use type-safe query
      const property = await storage.getProperty(validation.propertyId!);
      if (!property) {
        const response: ApiResponse = {
          success: false,
          message: ERROR_MESSAGES.PROPERTY_NOT_FOUND,
        };
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json(response);
      }

      const response: ApiResponse<DatabaseProperty> = {
        success: true,
        data: property,
      };

      res.json(response);
    } catch (error) {
      handleDrizzleError(error, res, "Failed to retrieve property");
    }
  });

  app.post(
    "/api/properties",
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // Validate property data using the insert schema
        const propertyData: NewPropertyInput = insertPropertySchema.parse(
          req.body
        );

        // Create property using type-safe insert
        const property = await storage.createProperty(propertyData);

        // Perform AI verification with proper typing
        const verificationResults = await performAIVerification(propertyData);
        const verificationStatus =
          verificationResults.documentAuthenticity ===
            CONSTANTS.VERIFICATION.VERIFIED &&
          verificationResults.ownershipVerified
            ? CONSTANTS.VERIFICATION.VERIFIED
            : CONSTANTS.VERIFICATION.FAILED;

        // Update verification status using type-safe update
        const updatedProperty = await storage.updateVerificationStatus(
          property.id,
          verificationStatus,
          verificationResults
        );

        const response: ApiResponse<DatabaseProperty> = {
          success: true,
          data: updatedProperty,
          message: "Property created successfully",
        };

        res.status(CONSTANTS.HTTP_STATUS.CREATED).json(response);
      } catch (error) {
        handleDrizzleError(error, res, "Failed to create property");
      }
    }
  );

  // Enhanced reviews routes with better validation
  app.get(
    "/api/properties/:id/reviews",
    async (req: Request, res: Response) => {
      try {
        const validation = validatePropertyId(req.params.id);
        if (!validation.valid) {
          const response: ApiResponse = {
            success: false,
            message: validation.error || ERROR_MESSAGES.INVALID_PROPERTY_ID,
          };
          return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
        }

        // Use type-safe query for reviews
        const reviews = await storage.getReviews(validation.propertyId!);

        const response: ApiResponse<{
          reviews: DatabaseReview[];
          totalCount: number;
        }> = {
          success: true,
          data: {
            reviews,
            totalCount: reviews.length,
          },
          metadata: {
            totalCount: reviews.length,
          },
        };

        res.json(response);
      } catch (error) {
        handleDrizzleError(error, res, "Failed to retrieve reviews");
      }
    }
  );

  app.post(
    "/api/properties/:id/reviews",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = getUserIdFromSession(req)!; // Safe because requireAuth ensures it exists
        const validation = validatePropertyId(req.params.id);

        if (!validation.valid) {
          const response: ApiResponse = {
            success: false,
            message: validation.error || ERROR_MESSAGES.INVALID_PROPERTY_ID,
          };
          return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
        }

        // Validate review data using the insert schema
        const reviewData: NewReviewInput = insertReviewSchema.parse({
          ...req.body,
          propertyId: validation.propertyId!,
          userId,
        });

        // Create review using type-safe insert
        const review = await storage.createReview(reviewData);

        const response: ApiResponse<DatabaseReview> = {
          success: true,
          data: review,
          message: "Review created successfully",
        };

        res.status(CONSTANTS.HTTP_STATUS.CREATED).json(response);
      } catch (error) {
        handleDrizzleError(error, res, ERROR_MESSAGES.REVIEW_CREATION_FAILED);
      }
    }
  );

  // Enhanced user creation route with better validation
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const userData: NewUserInput = insertUserSchema.parse(req.body);

      // Check for existing user
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          message: ERROR_MESSAGES.USERNAME_EXISTS,
        };
        return res.status(CONSTANTS.HTTP_STATUS.CONFLICT).json(response);
      }

      // Create user
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;

      const response: ApiResponse<Omit<DatabaseUser, "password">> = {
        success: true,
        data: userWithoutPassword,
        message: "User created successfully",
      };

      res.status(CONSTANTS.HTTP_STATUS.CREATED).json(response);
    } catch (error) {
      handleDrizzleError(error, res, "Failed to create user");
    }
  });

  // Register AI-related routes
  registerAIRoutes(app);

  // Enhanced property verification status with better error handling
  app.get(
    "/api/properties/:id/verification-status",
    async (req: Request, res: Response) => {
      try {
        const validation = validatePropertyId(req.params.id);
        if (!validation.valid) {
          const response: ApiResponse = {
            success: false,
            message: validation.error || ERROR_MESSAGES.INVALID_PROPERTY_ID,
          };
          return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
        }

        // Use type-safe query
        const property = await storage.getProperty(validation.propertyId!);
        if (!property) {
          const response: ApiResponse = {
            success: false,
            message: ERROR_MESSAGES.PROPERTY_NOT_FOUND,
          };
          return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json(response);
        }

      
        const verificationResults = property.aiVerificationResults as AIVerificationResults | undefined;
        const fraudDetection = verificationResults?.fraudDetection;

        const verificationData = {
          status: property.verificationStatus || "unverified",
          results: verificationResults || null,
          lastVerified:
            verificationResults?.verificationTimestamp ??
            fraudDetection?.verificationTimestamp ??
            null,
        };

        const response: ApiResponse<typeof verificationData> = {
          success: true,
          data: verificationData,
        };

        res.json(response);
      } catch (error) {
        handleDrizzleError(error, res, ERROR_MESSAGES.VERIFICATION_ERROR);
      }
    }
  );

  // Enhanced location search with better validation
  app.get("/api/locations/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query || typeof query !== "string" || query.trim().length === 0) {
        const response: ApiResponse = {
          success: false,
          message: ERROR_MESSAGES.SEARCH_QUERY_REQUIRED,
        };
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
      }

      const sanitizedQuery = sanitizeSearchQuery(query);

      // Use type-safe search
      const locations = await storage.searchLocations(sanitizedQuery);

      // Transform to expected format with safe property access
      const suggestions = locations.map((location: any) => ({
        id: location.id || 0,
        name: location.name || "",
        description: location.description || location.name || "",
        coordinates: location.coordinates || null,
      }));

      const response: ApiResponse<{
        suggestions: typeof suggestions;
        totalCount: number;
      }> = {
        success: true,
        data: {
          suggestions,
          totalCount: suggestions.length,
        },
        metadata: {
          totalCount: suggestions.length,
        },
      };

      res.json(response);
    } catch (error) {
      handleDrizzleError(error, res, ERROR_MESSAGES.LOCATION_SEARCH_FAILED);
    }
  });

  // Enhanced advanced property search with better validation
  app.post("/api/properties/search", async (req: Request, res: Response) => {
    try {
      const validation = validateSearchFilters(req.body);
      if (!validation.valid) {
        const response: ApiResponse = {
          success: false,
          message: validation.error || ERROR_MESSAGES.INVALID_SEARCH_FILTERS,
        };
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(response);
      }

      // Use type-safe filtered search
      const properties = await storage.searchPropertiesWithFilters(
        validation.sanitizedFilters!
      );

      const response: ApiResponse<{
        properties: DatabaseProperty[];
        totalCount: number;
      }> = {
        success: true,
        data: {
          properties,
          totalCount: properties.length,
        },
        metadata: {
          filters: validation.sanitizedFilters,
          totalCount: properties.length,
        },
      };

      res.json(response);
    } catch (error) {
      handleDrizzleError(error, res, ERROR_MESSAGES.PROPERTY_SEARCH_FAILED);
    }
  });

  console.log("API routes registered successfully with enhanced type safety");
}
