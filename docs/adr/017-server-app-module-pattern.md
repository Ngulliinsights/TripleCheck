# ADR 017: Server App Module Pattern

**Status**: Accepted  
**Date**: 2026-04-16  
**Context**: Structuring Express application for testability and reusability

---

## Context

The server had three entry point files creating confusion about the application's structure:
- `server/main.ts` - Server lifecycle entry point
- `server/app.ts` - Express application configuration  
- `server/index.ts` - Unused legacy entry point (duplicate)

### The Problem

Three files for one concern violated separation of concerns and created maintenance burden:
- Unclear which was the canonical entry point
- index.ts was completely unused but added to confusion
- Code that needed to test Express app had to work around the lifecycle management

---

## Decision

**Keep two files with clear responsibilities:**

1. **`app.ts`** - Express application module
   - Configures middleware, routes, error handlers
   - Returns configured Express app without starting server
   - Can be imported and reused in different contexts

2. **`main.ts`** - Server lifecycle entry point
   - Imports app.ts
   - Handles startup/shutdown, database init
   - Manages server lifecycle
   - Never imported elsewhere

3. **Delete `index.ts`** - Remove unused duplicate

---

## Rationale

### 1. Separation of Concerns
- **`app.ts`** = Express configuration (pure function)
- **`main.ts`** = Server lifecycle (only run at startup)
- Clear boundaries, easy to understand

### 2. Testability
Can import and test Express app without starting the server:

```typescript
// test.ts
import app from './app';
import request from 'supertest';

it('should return 200 for health check', () => {
  request(app)
    .get('/health')
    .expect(200);
});
```

### 3. Reusability
Same Express app can work in different runtimes:

```typescript
// Production
import app from './app';
const server = app.listen(3000);

// AWS Lambda
import app from './app';
export const handler = serverlessExpress({ app });

// Next.js API routes
import app from './app';
export default app;
```

### 4. Industry Standard
- Common pattern in Express applications
- Used by frameworks like NestJS
- Matches best practices from Express documentation

---

## Consequences

### Positive
✅ **Clarity**: Clear single entry point (main.ts)  
✅ **Testability**: Can test Express app independently  
✅ **Reusability**: Easy to use in different contexts  
✅ **Maintainability**: One canonical pattern to follow  

### Negative
⚠️ **Learning curve**: New developers need to understand why two files exist  
⚠️ **Boilerplate**: Small amount of additional structure (mitigated by clarity)

---

## Implementation

**File Structure:**
```
server/
├── main.ts           # Entry point (npm start → this)
├── app.ts            # Express configuration (imported by main.ts)
└── ... rest of code
```

**main.ts:**
```typescript
import app from './app';

async function start() {
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  
  process.on('SIGTERM', () => server.close());
}

start().catch(console.error);
```

**app.ts:**
```typescript
import express from 'express';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';

const app = express();

setupMiddleware(app);
setupRoutes(app);

export default app;
```

---

## Alternatives Considered

### Alternative 1: Single file (app.ts only)
**Rejected**: Mixes concerns. Server startup logic clutters configuration.

### Alternative 2: Three separate files (current state)
**Rejected**: Confusing, redundant, violates DRY.

### Alternative 3: Separate app and server with factory pattern
**Rejected**: Over-engineered for the problem.

---

## References

- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [NestJS Architecture](https://docs.nestjs.com/) - Uses similar pattern
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)

---

## Related ADRs

- [ADR 016: Layered Architecture](./016-layered-architecture.md)
