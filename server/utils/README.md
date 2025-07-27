# Server Utilities

This directory contains centralized utility modules for consistent behavior across the server application.

## Modules

### `constants.ts`
Contains application-wide constants including:
- HTTP status codes
- Verification statuses
- Application constants (file size limits, API version, etc.)
- User roles and risk levels
- Type exports for better type safety

### `error-messages.ts`
Centralized error messages organized by category:
- Validation errors
- Authentication errors
- Property errors
- Review errors
- Verification errors
- Search errors
- Operation errors
- Database constraint errors
- File upload errors
- Security errors

### `response-helpers.ts`
Helper functions for consistent API responses:
- `ApiResponse<T>` interface for standardized response format
- `createSuccessResponse()` and `createErrorResponse()` for creating responses
- `sendSuccessResponse()` and `sendErrorResponse()` for sending responses
- `handleDatabaseError()` for consistent database error handling
- Specialized error handlers for auth, validation, not found, and conflict errors

### `validators.ts`
Input validation and sanitization utilities:
- `validatePropertyId()` - validates and parses property IDs
- `sanitizeSearchQuery()` - sanitizes search query input
- `validateSearchFilters()` - validates and sanitizes search filters
- `validateUserId()` - validates user IDs
- `validateEmail()` - validates email format
- `validatePassword()` - validates password strength
- `validateUsername()` - validates username format
- `validatePaginationParams()` - validates pagination parameters

### `index.ts`
Centralized exports for all utility modules for easier importing.

## Usage

```typescript
import { 
  HTTP_STATUS, 
  VERIFICATION_STATUS, 
  ERROR_MESSAGES,
  sendSuccessResponse,
  handleDatabaseError,
  validatePropertyId 
} from "../utils";

// Use constants
res.status(HTTP_STATUS.OK);

// Use error messages
throw new Error(ERROR_MESSAGES.AUTH_REQUIRED);

// Use response helpers
sendSuccessResponse(res, data, "Success message");

// Use validators
const result = validatePropertyId(req.params.id);
if (!result.valid) {
  return sendErrorResponse(res, result.error, HTTP_STATUS.BAD_REQUEST);
}
```

## Benefits

1. **Consistency**: All modules use the same constants and error messages
2. **Maintainability**: Changes to constants or messages only need to be made in one place
3. **Type Safety**: TypeScript types ensure correct usage
4. **Reusability**: Utilities can be used across different route modules
5. **Testing**: Utilities can be unit tested independently