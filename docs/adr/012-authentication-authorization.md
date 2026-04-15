# ADR 012: Authentication and Authorization - Passport.js and CASL

**Status**: Accepted  
**Date**: 2024-01-01  
**Supersedes**: Custom AuthenticationService implementation

## Context

The custom `AuthenticationService.ts` (500+ lines) implemented:
- Manual JWT handling
- Custom session management
- Simple role-based access control
- Manual token refresh logic

This resulted in security concerns and maintenance burden.

## Decision

Replace with industry-standard authentication stack:

### Authentication: Passport.js
- Multiple strategy support (Local, JWT, OAuth)
- Battle-tested security
- Middleware-based architecture
- Extensive ecosystem

### JWT Strategy: passport-jwt
- Secure token validation
- Configurable token extraction
- Automatic token verification

### Authorization: CASL
- Fine-grained permissions
- Ability-based access control
- Type-safe permission checks
- Flexible rule definitions

### Session Management: express-session + connect-redis
- Redis-backed sessions
- Automatic session cleanup
- Horizontal scaling support

**Location**: `server/auth/`

## Implementation

```typescript
import { requireAuth, requireAbility } from './auth/authorization';

// Require authentication
router.get('/protected', requireAuth(), handler);

// Require specific permission
router.post('/properties', 
  requireAuth(),
  requireAbility('create', 'Property'),
  handler
);
```

## Consequences

### Positive
- Battle-tested security implementations
- Fine-grained authorization with CASL
- Multiple authentication strategies
- Reduced code by 500+ lines
- Better security practices
- Easier to add OAuth providers

### Negative
- Users need to re-login (session format changed)
- JWT payload structure updated
- Learning curve for CASL permissions
- Additional dependencies

### Neutral
- Requires Redis for session storage
- Environment variables: JWT_SECRET, SESSION_SECRET
- Authorization rules defined in code

## Breaking Changes

- Session format changed (users must re-login)
- JWT payload structure updated
- Authorization now uses CASL rules instead of simple role checks
- Middleware signature changed

## Security Improvements

- Industry-standard JWT handling
- Secure session management with Redis
- Fine-grained permissions vs simple roles
- Automatic token expiration
- CSRF protection built-in

## Configuration

```env
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here
REDIS_URL=redis://localhost:6379
```

## References

- [Passport.js Documentation](http://www.passportjs.org/)
- [CASL Documentation](https://casl.js.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
