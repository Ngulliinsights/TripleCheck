# Centralized Error Handling Middleware

This document describes the centralized error handling middleware that provides consistent error responses across all routes and implements database error handling with specific error type detection.

## Overview

The centralized error handling middleware addresses the requirements for:
- Consistent error responses across all routes
- Database error handling with specific error type detection  
- Validation error formatting and response standardization

## Features

### 1. Consistent Error Responses
- All API errors follow the same response format
- Standardized error codes and categories
- Correlation IDs for request tracking
- Proper HTTP status codes

### 2. Database Error Handling
- Specific detection of database constraint violations
- Proper handling of unique constraint errors
- Foreign key constraint error handling
- Not null constraint error handling
- Connection error handling

### 3. Validation Error Formatting
- Zod validation error support
- Field-specific error messages
- Standardized validation error responses
- Backward compatibility with existing validation

## Components

### Core Middleware

#### `correlationIdMiddleware`
Adds unique correlation IDs to each request for tracking and debugging.

```typescript
app.use(correlationIdMiddleware);
```

#### `centralizedErrorHandler`
Main error handling middleware that processes all errors and provides consistent responses.

```typescript
app.use(centralizedErrorHandler); // Must be last middleware
```

#### `notFoundHandler`
Handles 404 errors for unmatched routes.

```typescript
app.use(notFoundHandler);
```

#### `asyncHandler`
Wrapper for async route handlers that automatically catches and forwards errors.

```typescript
app.get('/api/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json(createSuccessResponse(users));
}));
```

### Legacy Compatibility Functions

#### `handleDrizzleError`
Backward-compatible function for existing database error handling.

```typescript
try {
  await databaseOperation();
} catch (error) {
  handleDrizzleError(error, res, 'Operation failed');
}
```

#### `handleValidationError`
Backward-compatible function for existing validation error handling.

```typescript
try {
  schema.parse(data);
} catch (error) {
  handleValidationError(error, res);
}
```

### Response Helpers

#### `createSuccessResponse`
Creates consistent success responses.

```typescript
const response = createSuccessResponse(
  data,
  'Operation successful',
  { totalCount: 10 }
);
```

#### `createErrorResponse`
Creates consistent error responses.

```typescript
const response = createErrorResponse(
  'Validation failed',
  [{ field: 'email', message: 'Invalid format', code: 'INVALID_FORMAT' }]
);
```

## Error Response Format

### Success Response
```typescript
{
  success: true,
  data: any,
  message?: string,
  metadata?: {
    totalCount?: number,
    page?: number,
    limit?: number,
    // ... other metadata
  }
}
```

### Error Response
```typescript
{
  success: false,
  message: string,
  error?: {
    code: string,
    category: string,
    details?: Record<string, unknown>,
    timestamp: string,
    correlationId?: string
  },
  errors?: Array<{
    field: string,
    message: string,
    code?: string
  }>
}
```

## Error Types Handled

### 1. Validation Errors
- Zod validation errors
- Field-specific validation errors
- Input format errors

### 2. Database Errors
- Unique constraint violations
- Foreign key constraint violations
- Not null constraint violations
- Connection failures
- Query failures

### 3. Authentication Errors
- Invalid credentials
- Token expired
- Token invalid
- Authentication required

### 4. Authorization Errors
- Insufficient permissions
- Access denied
- Resource forbidden

### 5. Business Logic Errors
- Business rule violations
- Operation not allowed
- Resource conflicts

### 6. System Errors
- Internal server errors
- Service unavailable
- Timeout errors
- Rate limit exceeded

## Integration Guide

### Step 1: Add Middleware
Add the middleware to your Express application:

```typescript
import {
  correlationIdMiddleware,
  centralizedErrorHandler,
  notFoundHandler,
} from './middleware/centralized-error-handler';

// Add correlation ID middleware first
app.use(correlationIdMiddleware);

// ... your routes here ...

// Add 404 handler
app.use(notFoundHandler);

// Add centralized error handler last
app.use(centralizedErrorHandler);
```

### Step 2: Update Route Handlers
Wrap async route handlers with `asyncHandler`:

```typescript
import { asyncHandler, createSuccessResponse } from './middleware/centralized-error-handler';

// Before
app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    handleDrizzleError(error, res, 'Failed to get users');
  }
});

// After
app.get('/api/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  const response = createSuccessResponse(users, 'Users retrieved successfully');
  res.json(response);
}));
```

### Step 3: Use Response Helpers
Replace manual response creation with helper functions:

```typescript
// Success response
const response = createSuccessResponse(data, 'Operation successful');
res.json(response);

// Error response (if needed manually)
const errorResponse = createErrorResponse('Validation failed', errors);
res.status(400).json(errorResponse);
```

### Step 4: Legacy Compatibility
Existing error handling can remain unchanged for backward compatibility:

```typescript
// This still works
try {
  await databaseOperation();
} catch (error) {
  handleDrizzleError(error, res, 'Database operation failed');
}
```

## Constants

The middleware exports constants for consistent usage:

```typescript
import { ERROR_CONSTANTS } from './middleware/centralized-error-handler';

// HTTP status codes
ERROR_CONSTANTS.HTTP_STATUS.OK // 200
ERROR_CONSTANTS.HTTP_STATUS.BAD_REQUEST // 400
ERROR_CONSTANTS.HTTP_STATUS.UNAUTHORIZED // 401

// Error messages
ERROR_CONSTANTS.MESSAGES.VALIDATION_FAILED // "Invalid data provided"
ERROR_CONSTANTS.MESSAGES.AUTH_REQUIRED // "Authentication required"
ERROR_CONSTANTS.MESSAGES.DATABASE_ERROR // "Database operation failed"
```

## Testing

The middleware includes comprehensive tests covering:
- Correlation ID generation and propagation
- Different error type handling
- Response format consistency
- Legacy compatibility functions
- Response helpers

Run tests with:
```bash
npm test -- server/middleware/__tests__/centralized-error-handler.test.ts
```

## Benefits

### 1. Consistency
- All API responses follow the same format
- Standardized error codes and messages
- Consistent HTTP status codes

### 2. Maintainability
- Centralized error handling logic
- Easy to update error formats
- Reduced code duplication

### 3. Debugging
- Correlation IDs for request tracking
- Structured error logging
- Development-specific debug headers

### 4. Backward Compatibility
- Existing error handling continues to work
- Gradual migration path
- No breaking changes

### 5. Type Safety
- Full TypeScript support
- Proper error type definitions
- IDE autocomplete support

## Requirements Satisfied

This implementation satisfies the following requirements:

- **8.1**: Consistent error responses across all routes ✅
- **8.2**: Database error handling with specific error type detection ✅
- **8.3**: Validation error formatting and response standardization ✅
- **8.4**: Centralized error handling middleware ✅
- **8.5**: Integration with existing error infrastructure ✅

The middleware provides a comprehensive solution for centralized error handling while maintaining backward compatibility with existing code.