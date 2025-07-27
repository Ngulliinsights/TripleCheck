# Enhanced Authentication Middleware

This document describes the enhanced authentication middleware system that has been extracted and improved from the monolithic routes.ts file.

## Overview

The authentication middleware provides comprehensive authentication and authorization capabilities with improved type safety, role-based access control, session management, and user context handling.

## Features

### 1. Core Authentication
- **Session-based authentication** with automatic session validation
- **User context loading** with password stripping for security
- **Session activity tracking** with automatic updates
- **Graceful error handling** with consistent API responses

### 2. Role-Based Authorization
- **Role hierarchy system** (user < agent < admin)
- **Permission-based access control** with flexible requirements
- **Multiple role support** for endpoints requiring various access levels
- **Custom authorization checks** for complex business logic

### 3. Advanced Session Management
- **Role-based session timeouts** (admin: 8h, agent: 12h, user: 24h)
- **Session validation** with expiration checking
- **Activity tracking** for security auditing
- **Automatic session cleanup** on expiration

### 4. Trust Score Integration
- **Trust score validation** for sensitive operations
- **Configurable thresholds** for different access levels
- **Verified agent status** checking
- **Combined requirements** (role + trust score + verification)

### 5. Rate Limiting
- **Authentication attempt limiting** to prevent brute force attacks
- **IP-based tracking** with configurable windows
- **Automatic cleanup** on successful authentication
- **Customizable limits** per endpoint

## Middleware Functions

### Basic Authentication

#### `requireAuth`
Ensures user is authenticated with a valid session.

```typescript
app.get('/api/protected', requireAuth, handler);
```

#### `optionalAuth`
Loads user context if authenticated, but doesn't block unauthenticated requests.

```typescript
app.get('/api/public-with-context', optionalAuth, handler);
```

### Role-Based Authorization

#### `requireRole(roles)`
Requires user to have one of the specified roles.

```typescript
app.post('/api/admin-only', requireRole('admin'), handler);
app.get('/api/agents-and-admins', requireRole(['agent', 'admin']), handler);
```

#### `requireMinRole(minRole)`
Requires user to have at least the specified role level.

```typescript
app.put('/api/agent-level', requireMinRole('agent'), handler);
```

### Trust Score Authorization

#### `requireMinTrustScore(score)`
Requires user to have a minimum trust score.

```typescript
app.post('/api/high-trust', requireMinTrustScore(80), handler);
```

#### `requireVerifiedAgent`
Requires user to be a verified agent.

```typescript
app.post('/api/verified-agents', requireVerifiedAgent, handler);
```

### Advanced Authorization

#### `requirePermissions(requirements)`
Flexible authorization with multiple requirements.

```typescript
app.post('/api/complex-auth', requirePermissions({
  roles: ['agent', 'admin'],
  minTrustScore: 75,
  requireVerifiedAgent: true,
  customCheck: (context) => context.user.specialPermission === true
}), handler);
```

#### `requireResourceOwnership(getOwnerId)`
Ensures user owns the resource they're trying to access.

```typescript
app.put('/api/properties/:id', requireResourceOwnership(async (req) => {
  const property = await storage.getProperty(req.params.id);
  return property?.ownerId || null;
}), handler);
```

### Rate Limiting

#### `authRateLimit(maxAttempts, windowMs)`
Rate limits authentication attempts.

```typescript
app.post('/api/auth/login', authRateLimit(5, 15 * 60 * 1000), handler);
```

### Session Management

#### `enhancedSessionValidation`
Advanced session validation with role-based timeouts.

```typescript
app.use('/api', enhancedSessionValidation);
```

## Utility Classes

### SessionManager
Handles session operations and validation.

```typescript
// Get user ID from session
const userId = SessionManager.getUserIdFromSession(req);

// Set user session
SessionManager.setUserSession(req, userId);

// Clear session
await SessionManager.clearUserSession(req);

// Check session validity
const isValid = SessionManager.isSessionValid(req, maxAgeMs);
```

### UserContext
Manages user context and role checking.

```typescript
// Load user data into request
await UserContext.loadUserContext(req);

// Check user role
const role = UserContext.getUserRole(req);
const hasRole = UserContext.hasRole(req, 'admin');
const hasAnyRole = UserContext.hasAnyRole(req, ['agent', 'admin']);

// Check verification status
const isVerified = UserContext.isVerifiedAgent(req);
const trustScore = UserContext.getUserTrustScore(req);
```

### AuthorizationManager
Advanced authorization logic and permission checking.

```typescript
// Check role hierarchy
const canAccess = AuthorizationManager.hasPermission('agent', 'user'); // true

// Get authorization context
const context = AuthorizationManager.getAuthorizationContext(req);

// Check complex permissions
const result = AuthorizationManager.checkPermissions(req, {
  roles: ['admin'],
  minTrustScore: 90
});
```

### SessionConfigManager
Role-based session configuration.

```typescript
// Get session config for role
const config = SessionConfigManager.getSessionConfig('admin');

// Validate session for specific role
const isValid = SessionConfigManager.isSessionValidForRole(req, 'admin');
```

## Type Definitions

### AuthenticatedRequest
Extended request interface with user context.

```typescript
interface AuthenticatedRequest extends Request {
  session?: CustomSession;
  user?: Omit<User, 'password'>;
}
```

### AuthorizationContext
Complete user authorization context.

```typescript
interface AuthorizationContext {
  userId: number;
  user: Omit<User, 'password'>;
  role: UserRole;
  isVerifiedAgent: boolean;
  trustScore: number;
}
```

## Usage Examples

### Basic Route Protection

```typescript
// Simple authentication
app.get('/api/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

// Role-based access
app.post('/api/admin/users', requireRole('admin'), handler);

// Trust score requirement
app.post('/api/sensitive', requireMinTrustScore(80), handler);
```

### Complex Authorization

```typescript
// Multiple requirements
app.post('/api/property/verify', requirePermissions({
  roles: ['agent', 'admin'],
  minTrustScore: 70,
  requireVerifiedAgent: true
}), handler);

// Resource ownership
app.put('/api/properties/:id', requireResourceOwnership(async (req) => {
  const property = await storage.getProperty(req.params.id);
  return property?.ownerId || null;
}), handler);
```

### Middleware Chaining

```typescript
// Chain multiple middleware
app.post('/api/properties/:id/reviews',
  authRateLimit(10, 60 * 1000),           // Rate limit
  requireAuth,                             // Authentication
  requireMinTrustScore(50),               // Trust score
  validateRequest(reviewSchema),           // Validation
  handler                                  // Route handler
);
```

## Error Handling

The middleware uses consistent error responses through the ResponseHelper utility:

- **401 Unauthorized**: Authentication required or session expired
- **403 Forbidden**: Insufficient permissions or role requirements not met
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected errors during authentication

## Security Features

1. **Password Stripping**: User passwords are automatically removed from request context
2. **Session Validation**: Sessions are validated on every request with role-based timeouts
3. **Rate Limiting**: Configurable rate limiting for authentication endpoints
4. **Activity Tracking**: Session activity is tracked for security auditing
5. **Role Hierarchy**: Proper role hierarchy prevents privilege escalation
6. **Trust Score Integration**: Additional security layer based on user behavior

## Migration from Old System

The enhanced middleware is backward compatible with the existing routes.ts patterns:

```typescript
// Old pattern (still works)
app.post('/api/reviews', requireAuth, handler);

// Enhanced patterns (new capabilities)
app.post('/api/reviews', requirePermissions({
  roles: ['user'],
  minTrustScore: 30
}), handler);
```

## Testing

Comprehensive test suites are provided:

- **Basic Tests**: `auth.middleware.basic.test.ts` - Core functionality
- **Integration Tests**: `auth.integration.test.ts` - Route integration
- **Full Tests**: `auth.middleware.test.ts` - Complete middleware testing

Run tests with:
```bash
npm test -- server/middleware/__tests__/auth.middleware.basic.test.ts --run
```

## Performance Considerations

1. **Lazy Loading**: Storage is loaded only when needed to avoid circular dependencies
2. **Session Caching**: User context is cached in the request object
3. **Efficient Validation**: Role hierarchy checks use simple numeric comparisons
4. **Memory Management**: Proper cleanup of expired sessions and rate limit data

## Future Enhancements

1. **JWT Support**: Add JWT token authentication alongside sessions
2. **Multi-Factor Authentication**: Support for 2FA/MFA
3. **OAuth Integration**: Support for third-party authentication providers
4. **Audit Logging**: Enhanced security event logging
5. **Permission Caching**: Cache complex permission calculations