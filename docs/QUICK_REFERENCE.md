# Quick Reference Guide

Quick reference for common commands, patterns, and workflows.

## Development Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load

# Build for production
npm run build
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# JWT & Sessions
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret-here

# OpenTelemetry
PROMETHEUS_PORT=9464

# Client
CLIENT_URL=http://localhost:5173

# HuggingFace
HUGGINGFACE_API_KEY=your-api-key-here

# Logging
LOG_LEVEL=info
```

## Common Patterns

### Logging
```typescript
import { logger } from './infrastructure/observability/telemetry';

logger.info({ userId: 123 }, 'User logged in');
logger.error({ error }, 'Operation failed');
```

### HTTP Client
```typescript
import { ResilientHttpClient } from './infrastructure/http/resilient-client';
import { z } from 'zod';

const client = new ResilientHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  retries: 3,
});

const ResponseSchema = z.object({ data: z.string() });
const result = await client.get('/endpoint', undefined, ResponseSchema);
```

### Authentication
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

### Validation
```typescript
import { z } from 'zod';
import { validateBody } from './middleware/validation';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/users', validateBody(CreateUserSchema), handler);
```

### Real-time Communication
```typescript
import { socketService } from './communication/websocket.service';

// Send to specific user
socketService.sendToUser(userId, 'notification:new', data);

// Broadcast to all
socketService.broadcast('announcement', data);

// Send to room
socketService.sendToThread(threadId, 'message:new', message);
```

### Rate Limiting
```typescript
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rate-limit';

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/ai/', aiLimiter);
```

## Monitoring Endpoints

### Prometheus Metrics
```
http://localhost:9464/metrics
```

### Socket.IO Admin UI (Development)
```
http://localhost:3000/admin
```

### Health Check
```
http://localhost:3000/health
```

## Troubleshooting

### High Memory Usage
```typescript
logger.info({ memory: process.memoryUsage() }, 'Memory usage');
```

### Circuit Breaker Open
```typescript
const health = await client.healthCheck();
logger.info({ health }, 'Service health');
```

### Rate Limit Issues
Adjust limits in `server/middleware/rate-limit.ts`:
```typescript
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200, // Increase limit
});
```

## Architecture Layers

1. **Client Layer**: React, Socket.IO client, Web Vitals
2. **API Gateway Layer**: Rate limiting, CORS, Validation
3. **Authentication Layer**: Passport.js, JWT, CASL
4. **Business Logic Layer**: Domain services
5. **External Services Layer**: HuggingFace, Database, Email
6. **Infrastructure Layer**: Pino, OpenTelemetry, Redis

## Key Libraries

- **Logging**: Pino (250k ops/sec)
- **Metrics**: OpenTelemetry + Prometheus
- **HTTP**: Axios + Opossum (circuit breaker) + Keyv (cache)
- **Auth**: Passport.js + CASL
- **WebSocket**: Socket.IO
- **Validation**: Zod
- **Rate Limiting**: express-rate-limit

## Performance Benchmarks

- **Logging**: 5x faster than custom (250k vs 50k ops/sec)
- **HTTP Success Rate**: 95% under load (vs 70% before)
- **Memory**: 28% reduction (180MB vs 250MB baseline)
- **Code**: 23% reduction (11.5k vs 15k lines)

## References

See `/docs/adr/` for detailed architectural decisions:
- ADR 010: Observability Stack
- ADR 011: HTTP Client Resilience
- ADR 012: Authentication & Authorization
- ADR 013: Real-time Communication
- ADR 014: Schema Validation
- ADR 015: Rate Limiting
- ADR 016: Layered Architecture
