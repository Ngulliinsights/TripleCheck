// Centralized error messages for consistency across the application

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid username or password",
  USERNAME_EXISTS: "Username already exists",
  REGISTRATION_FAILED: "Registration failed",
  LOGIN_FAILED: "Login failed",
  LOGOUT_FAILED: "Logout failed",
  AUTH_REQUIRED: "Authentication required",
  SESSION_EXPIRED: "Session expired",
  RATE_LIMITED: "Too many attempts, please try again later",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions to access this resource",
  USER_NOT_FOUND: "User not found",
  INVALID_SESSION: "Invalid session",
  SESSION_CREATION_FAILED: "Failed to create session",
  PASSWORD_RESET_REQUIRED: "Password reset required",
  ACCOUNT_LOCKED: "Account temporarily locked due to multiple failed attempts",
  INVALID_TOKEN: "Invalid or expired token",
  TOKEN_REQUIRED: "Authentication token required",
} as const;

export const VALIDATION_ERROR_MESSAGES = {
  VALIDATION_FAILED: "Invalid data provided",
  REQUIRED_FIELD_MISSING: "Required field is missing",
  INVALID_FORMAT: "Invalid format provided",
  INVALID_EMAIL: "Invalid email address",
  INVALID_USERNAME: "Username can only contain letters, numbers, and underscores",
  USERNAME_TOO_SHORT: "Username must be at least 3 characters",
  USERNAME_TOO_LONG: "Username must be less than 30 characters",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORD_TOO_LONG: "Password must be less than 100 characters",
  PASSWORD_WEAK: "Password must contain at least one lowercase letter, one uppercase letter, and one number",
  INVALID_PROPERTY_ID: "Invalid property ID",
  INVALID_USER_ID: "Invalid user ID",
  INVALID_REVIEW_ID: "Invalid review ID",
} as const;

export const DATABASE_ERROR_MESSAGES = {
  DATABASE_ERROR: "Database operation failed",
  CONNECTION_FAILED: "Database connection failed",
  TRANSACTION_FAILED: "Database transaction failed",
  CONSTRAINT_VIOLATION: "Data constraint violation",
  DUPLICATE_ENTRY: "A record with this information already exists",
  FOREIGN_KEY_VIOLATION: "Referenced record does not exist",
  NOT_NULL_VIOLATION: "Required fields are missing",
  RECORD_NOT_FOUND: "Record not found",
  UPDATE_FAILED: "Failed to update record",
  DELETE_FAILED: "Failed to delete record",
  INSERT_FAILED: "Failed to create record",
} as const;

export const PROPERTY_ERROR_MESSAGES = {
  PROPERTY_NOT_FOUND: "Property not found",
  PROPERTY_CREATION_FAILED: "Failed to create property",
  PROPERTY_UPDATE_FAILED: "Failed to update property",
  PROPERTY_DELETE_FAILED: "Failed to delete property",
  PROPERTY_SEARCH_FAILED: "Failed to search properties",
  INVALID_PROPERTY_DATA: "Invalid property data",
  PROPERTY_ALREADY_EXISTS: "Property already exists",
  PROPERTY_NOT_OWNED: "You don't have permission to modify this property",
  VERIFICATION_FAILED: "Property verification failed",
  VERIFICATION_PENDING: "Property verification is pending",
} as const;

export const USER_ERROR_MESSAGES = {
  USER_NOT_FOUND: "User not found",
  USER_CREATION_FAILED: "Failed to create user",
  USER_UPDATE_FAILED: "Failed to update user",
  USER_DELETE_FAILED: "Failed to delete user",
  PROFILE_UPDATE_FAILED: "Failed to update profile",
  TRUST_SCORE_UPDATE_FAILED: "Failed to update trust score",
  AGENT_VERIFICATION_FAILED: "Agent verification failed",
  INSUFFICIENT_TRUST_SCORE: "Insufficient trust score for this action",
} as const;

export const REVIEW_ERROR_MESSAGES = {
  REVIEW_NOT_FOUND: "Review not found",
  REVIEW_CREATION_FAILED: "Failed to create review",
  REVIEW_UPDATE_FAILED: "Failed to update review",
  REVIEW_DELETE_FAILED: "Failed to delete review",
  DUPLICATE_REVIEW: "You have already reviewed this property",
  CANNOT_REVIEW_OWN_PROPERTY: "You cannot review your own property",
  REVIEW_NOT_OWNED: "You don't have permission to modify this review",
} as const;

export const FILE_ERROR_MESSAGES = {
  FILE_UPLOAD_FAILED: "File upload failed",
  FILE_TOO_LARGE: "File size exceeds maximum limit",
  INVALID_FILE_TYPE: "Invalid file type",
  FILE_NOT_FOUND: "File not found",
  FILE_PROCESSING_FAILED: "File processing failed",
  UPLOAD_DIRECTORY_ERROR: "Upload directory error",
} as const;

export const AI_ERROR_MESSAGES = {
  AI_VERIFICATION_FAILED: "AI verification process failed",
  FRAUD_DETECTION_FAILED: "Fraud detection process failed",
  AI_SERVICE_UNAVAILABLE: "AI service is currently unavailable",
  VERIFICATION_TIMEOUT: "Verification process timed out",
  INSUFFICIENT_DATA: "Insufficient data for verification",
  AI_MODEL_ERROR: "AI model processing error",
} as const;

export const SEARCH_ERROR_MESSAGES = {
  SEARCH_QUERY_REQUIRED: "Search query is required",
  SEARCH_FAILED: "Search operation failed",
  INVALID_SEARCH_FILTERS: "Invalid search filters",
  LOCATION_SEARCH_FAILED: "Failed to search locations",
  SEARCH_TIMEOUT: "Search operation timed out",
  TOO_MANY_RESULTS: "Search returned too many results, please refine your query",
} as const;

export const GENERAL_ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: "Internal server error",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  REQUEST_TIMEOUT: "Request timeout",
  INVALID_REQUEST: "Invalid request",
  MALFORMED_DATA: "Malformed data received",
  OPERATION_FAILED: "Operation failed",
  UNKNOWN_ERROR: "An unknown error occurred",
} as const;

// Combined error messages for easy import
export const ERROR_MESSAGES = {
  ...AUTH_ERROR_MESSAGES,
  ...VALIDATION_ERROR_MESSAGES,
  ...DATABASE_ERROR_MESSAGES,
  ...PROPERTY_ERROR_MESSAGES,
  ...USER_ERROR_MESSAGES,
  ...REVIEW_ERROR_MESSAGES,
  ...FILE_ERROR_MESSAGES,
  ...AI_ERROR_MESSAGES,
  ...SEARCH_ERROR_MESSAGES,
  ...GENERAL_ERROR_MESSAGES,
} as const;