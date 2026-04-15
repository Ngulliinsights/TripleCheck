# ADR 014: Schema Validation - Zod

**Status**: Accepted  
**Date**: 2024-01-01  
**Supersedes**: Multiple custom validator implementations

## Context

The application had multiple custom validation implementations:
- `validators.ts` - Manual validation functions
- `data-validation.ts` - Middleware validation
- `validation.middleware.ts` - Another validation approach
- Duplicate type definitions and validation logic

This resulted in:
- Inconsistent validation across endpoints
- Type definitions separate from validation
- ~1,000 lines of validation code
- No runtime type safety

## Decision

Replace all custom validation with Zod:

### Schema Validation: Zod
- Type-safe schema validation
- Automatic TypeScript type inference
- Composable schemas
- Detailed error messages
- Runtime type checking

**Location**: `server/schemas/`, `server/middleware/validation.ts`

## Implementation

```typescript
import { z } from 'zod';
import { validateBody } from './middleware/validation';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Type automatically inferred
type CreateUserInput = z.infer<typeof CreateUserSchema>;

router.post('/users', validateBody(CreateUserSchema), handler);
```

## Consequences

### Positive
- Type-safe validation with inference
- Single source of truth for types and validation
- Composable schemas (DRY principle)
- Detailed, user-friendly error messages
- Reduced code by ~1,000 lines
- Runtime type safety

### Negative
- Validation error format changed (breaking change)
- Learning curve for Zod syntax
- Additional dependency

### Neutral
- Schemas defined in `server/schemas/`
- Middleware in `server/middleware/validation.ts`
- Error format standardized

## Breaking Changes

Validation errors now have consistent format:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

## Code Reduction

- **Before**: ~1,000 lines of validation code
- **After**: ~300 lines of Zod schemas
- **Reduction**: 70% less validation code

## Schema Organization

```
server/schemas/
├── property.schema.ts  # Property-related schemas
├── user.schema.ts      # User-related schemas
└── index.ts            # Central exports
```

## Validation Middleware

```typescript
// Body validation
validateBody(schema)

// Query validation
validateQuery(schema)

// Params validation
validateParams(schema)
```

## References

- [Zod Documentation](https://zod.dev/)
- [TypeScript Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
