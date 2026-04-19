/**
 * Centralized error messages for the African Property Trust server
 */

export const PROPERTY_ERROR_MESSAGES = {
  PROPERTY_NOT_FOUND: 'Property not found',
  PROPERTY_CREATION_FAILED: 'Failed to create property',
  PROPERTY_UPDATE_FAILED: 'Failed to update property',
  PROPERTY_DELETION_FAILED: 'Failed to delete property',
  UNAUTHORIZED_ACCESS: 'Unauthorized access to property',
  INVALID_PROPERTY_DATA: 'Invalid property data provided',
};

export const AUTH_ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation',
};

export const VERIFICATION_ERROR_MESSAGES = {
  VERIFICATION_FAILED: 'Verification process failed',
  DOCUMENT_VERIFICATION_FAILED: 'Document verification failed',
  GOVERNMENT_API_ERROR: 'Failed to communicate with government registries',
};
