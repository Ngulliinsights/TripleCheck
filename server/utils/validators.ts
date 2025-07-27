import { APPLICATION_CONSTANTS } from "./constants";

/**
 * Search filters interface for property searches
 */
export interface SearchFilters {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
}

/**
 * Validation result interface
 */
export interface ValidationResult<T = any> {
  valid: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates and parses a property ID from string input
 */
export function validatePropertyId(
  id: string
): ValidationResult<number> {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "Property ID is required" };
  }

  const propertyId = parseInt(id.trim());
  if (isNaN(propertyId) || propertyId <= 0) {
    return { valid: false, error: "Property ID must be a positive number" };
  }

  return { valid: true, data: propertyId };
}

/**
 * Sanitizes search query input by trimming and limiting length
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return "";
  }
  return query.trim().substring(0, APPLICATION_CONSTANTS.MAX_QUERY_LENGTH);
}

/**
 * Validates and sanitizes search filters for property searches
 */
export function validateSearchFilters(
  filters: unknown
): ValidationResult<SearchFilters> {
  if (!filters || typeof filters !== "object") {
    return { valid: false, error: "Invalid search filters format" };
  }

  try {
    const sanitizedFilters: SearchFilters = {};
    const filtersObj = filters as Record<string, unknown>;

    // Validate and sanitize each filter
    if (filtersObj.location && typeof filtersObj.location === "string") {
      sanitizedFilters.location = sanitizeSearchQuery(filtersObj.location);
    }

    if (filtersObj.priceMin !== undefined) {
      const priceMin = Number(filtersObj.priceMin);
      if (!isNaN(priceMin) && priceMin >= 0) {
        sanitizedFilters.priceMin = priceMin;
      }
    }

    if (filtersObj.priceMax !== undefined) {
      const priceMax = Number(filtersObj.priceMax);
      if (!isNaN(priceMax) && priceMax >= 0) {
        sanitizedFilters.priceMax = priceMax;
      }
    }

    if (
      filtersObj.propertyType &&
      typeof filtersObj.propertyType === "string"
    ) {
      sanitizedFilters.propertyType = filtersObj.propertyType.trim();
    }

    if (filtersObj.bedrooms !== undefined) {
      const bedrooms = Number(filtersObj.bedrooms);
      if (!isNaN(bedrooms) && bedrooms >= 0) {
        sanitizedFilters.bedrooms = bedrooms;
      }
    }

    if (filtersObj.bathrooms !== undefined) {
      const bathrooms = Number(filtersObj.bathrooms);
      if (!isNaN(bathrooms) && bathrooms >= 0) {
        sanitizedFilters.bathrooms = bathrooms;
      }
    }

    if (filtersObj.verified !== undefined) {
      sanitizedFilters.verified = Boolean(filtersObj.verified);
    }

    return { valid: true, data: sanitizedFilters };
  } catch (error) {
    return { valid: false, error: "Error processing search filters" };
  }
}

/**
 * Validates user ID from session or request
 */
export function validateUserId(userId: unknown): ValidationResult<number> {
  if (userId === null || userId === undefined) {
    return { valid: false, error: "User ID is required" };
  }

  const id = Number(userId);
  if (isNaN(id) || id <= 0) {
    return { valid: false, error: "User ID must be a positive number" };
  }

  return { valid: true, data: id };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult<string> {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim().toLowerCase();

  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true, data: trimmedEmail };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult<string> {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }

  if (password.length > 128) {
    return { valid: false, error: "Password must be less than 128 characters" };
  }

  // Check for at least one uppercase, one lowercase, and one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      valid: false,
      error: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    };
  }

  return { valid: true, data: password };
}

/**
 * Validates username format
 */
export function validateUsername(username: string): ValidationResult<string> {
  if (!username || typeof username !== "string") {
    return { valid: false, error: "Username is required" };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters long" };
  }

  if (trimmedUsername.length > 50) {
    return { valid: false, error: "Username must be less than 50 characters" };
  }

  // Allow alphanumeric characters, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmedUsername)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, underscores, and hyphens"
    };
  }

  return { valid: true, data: trimmedUsername };
}

/**
 * Validates pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function validatePaginationParams(
  params: unknown
): ValidationResult<PaginationParams> {
  if (!params || typeof params !== "object") {
    return { valid: false, error: "Invalid pagination parameters" };
  }

  const paramsObj = params as Record<string, unknown>;
  const result: PaginationParams = {
    page: 1,
    limit: 10,
  };

  // Validate page
  if (paramsObj.page !== undefined) {
    const page = Number(paramsObj.page);
    if (isNaN(page) || page < 1) {
      return { valid: false, error: "Page must be a positive number" };
    }
    result.page = page;
  }

  // Validate limit
  if (paramsObj.limit !== undefined) {
    const limit = Number(paramsObj.limit);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return { valid: false, error: "Limit must be between 1 and 100" };
    }
    result.limit = limit;
  }

  // Validate sortBy
  if (paramsObj.sortBy && typeof paramsObj.sortBy === "string") {
    result.sortBy = paramsObj.sortBy.trim();
  }

  // Validate sortOrder
  if (paramsObj.sortOrder && typeof paramsObj.sortOrder === "string") {
    const sortOrder = paramsObj.sortOrder.toLowerCase();
    if (sortOrder === "asc" || sortOrder === "desc") {
      result.sortOrder = sortOrder;
    } else {
      return { valid: false, error: "Sort order must be 'asc' or 'desc'" };
    }
  }

  return { valid: true, data: result };
}