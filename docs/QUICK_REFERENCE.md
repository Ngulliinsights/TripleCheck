# Quick Reference Guide - New Library-Based Architecture

## Common Tasks

### 1. Logging

```typescript
import { logger } from './infrastructure';

// Simple logging
logger.info('User logged in');
logger.info({ userId: 123, email: 'user@example.com' }, 'User logged in');

// Different levels
logger.debug({ data }, 'Debug info');
logger.warn({ issue }, 'Warning message');
logger.error({ error: err.message }, 'Error occurred');

// With trace context (automatic in requests)
import { logWithSpan } from './infrastructure';
logWithSpan('info', 'Processing request', { data });
```

### 2. Making HTTP Requests

```typescript
import { ResilientHttpClient } from './infrastructure/http/resilient-client';
import { z } from 'zod';

// Create client
const client = new ResilientHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  retries: 3,
  cacheOptions: { enabled: true, ttl: 3600000 },
});

// Define response schema
const ResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// Make request with validation
const data = await client.get('/users/1', undefined, ResponseSchema);

// POST request
const created = await client.post('/users', { name: 'John' }, undefined, ResponseSchema);

// Check health
const health = await client.healthCheck();
console.log(health.circuitState); // CLOSED, OPEN, or HALF_OPEN
```

### 3. Authentication & Authorization

```typescript
import { requireAuth, requireAbility } from './auth';
import { Router } from 'express';

const router = Router();

// Require authentication
router.get('/protected', requireAuth(), (req, res) => {
  const user = (req as any).user;
  res.json({ user });
});

// Require specific permission
router.post('/properties', 
  requireAuth(),
  requireAbility('create', 'Property'),
  (req, res) => {
    // User has permission to create properties
  }
);

// Check permission in code
import { can } from './auth';
if (can(user, 'update', 'Property')) {
  // User can update properties
}
```

### 4. Validation

```typescript
import { validateBody, validateQuery, validateParams } from './middleware';
import { z } from 'zod';

// Define schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().positive().optional(),
});

// Use in route
router.post('/users', validateBody(CreateUserSchema), (req, res) => {
  const userData = req.body; // Fully typed and validated!
  // userData is CreateUserInput type
});

// Validate query params
const SearchSchema = z.object({
  q: z.string().optional(),
  page: z.number().int().positive().default(1),
});

router.get('/search', validateQuery(SearchSchema), (req, res) => {
  const { q, page } = req.query; // Typed!
});

// Validate params
const IdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

router.get('/users/:id', validateParams(IdSchema), (req, res) => {
  const { id } = req.params; // id is a number!
});
```

### 5. Rate Limiting

```typescript
import { apiLimiter, authLimiter, aiLimiter, createRateLimiter } from './middleware';

// Apply to routes
app.use('/api/', apiLimiter); // 100 requests per 15 minutes
app.use('/api/auth/', authLimiter); // 5 requests per 15 minutes
app.use('/api/ai/', aiLimiter); // 20 requests per hour

// Custom rate limiter
const customLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests',
});

router.use('/expensive-operation', customLimiter);
```

### 6. WebSocket/Real-time

```typescript
import { socketService } from './communication';

// Send to specific user
socketService.sendToUser('user123', 'notification:new', {
  title: 'New message',
  body: 'You have a new message',
});

// Send to room/thread
socketService.sendToThread('thread456', 'message:new', {
  id: 1,
  text: 'Hello',
  sender: 'user123',
});

// Broadcast to all
socketService.broadcast('announcement', {
  message: 'System maintenance in 10 minutes',
});

// Check if user is online
const isOnline = await socketService.isUserOnline('user123');

// Get statistics
const stats = await socketService.getStats();
console.log(stats.onlineUsers);
```

### 7. Performance Monitoring

```typescript
import { performanceMonitoring } from './services/PerformanceService';

// Mark performance point
performanceMonitoring.mark('operation-start');

// Do some work...

performanceMonitoring.mark('operation-end');

// Measure timing
performanceMonitoring.measureTiming(
  'operation-duration',
  'operation-start',
  'operation-end'
);

// Get metrics
const metrics = performanceMonitoring.getMetrics();
const summary = performanceMonitoring.getSummary();
```

### 8. Tracing

```typescript
import { traced, tracer } from './infrastructure';

// Wrap function with tracing
const processData = traced('processData', async (data) => {
  // Function is automatically traced
  return result;
});

// Manual span creation
async function complexOperation() {
  return tracer.startActiveSpan('complexOperation', async (span) => {
    try {
      span.setAttributes({ userId: 123 });
      
      // Do work...
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

// Decorator for class methods
import { Traced } from './infrastructure';

class MyService {
  @Traced('MyService.processData')
  async processData(data: any) {
    // Method is automatically traced
  }
}
```

### 9. Using Schemas

```typescript
import { PropertySchema, CreatePropertySchema } from './schemas';
import type { Property, CreatePropertyInput } from './schemas';

// Validate data
const result = PropertySchema.safeParse(data);
if (result.success) {
  const property: Property = result.data;
} else {
  console.error(result.error.errors);
}

// Parse and throw on error
const property = PropertySchema.parse(data);

// Partial validation
const updates = PropertySchema.partial().parse(partialData);

// Transform data
const CreateWithDefaults = CreatePropertySchema.extend({
  status: z.string().default('pending'),
});
```

### 10. AI Services

```typescript
import { huggingFaceClient, landVerificationAI } from './ai/services';

// Analyze document
const result = await landVerificationAI.analyzePropertyDocument(
  imageBase64,
  'deed'
);

// Analyze image
const imageAnalysis = await landVerificationAI.analyzeLandImage(imageBase64);

// Detect fraud
const fraudCheck = await landVerificationAI.checkDocumentAuthenticity(text);

// Check service health
const health = await landVerificationAI.getHealthStatus();
console.log(health.status); // 'healthy', 'degraded', or 'unhealthy'
```

## Common Patterns

### Error Handling

```typescript
import { logger } from './infrastructure';

router.post('/endpoint', async (req, res) => {
  try {
    const result = await someOperation();
    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'Operation failed');
    
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
    });
  }
});
```

### Middleware Chain

```typescript
import { requireAuth, requireAbility } from './auth';
import { validateBody, validateParams } from './middleware';
import { apiLimiter } from './middleware';

router.put('/properties/:id',
  apiLimiter,                              // Rate limiting
  requireAuth(),                           // Authentication
  requireAbility('update', 'Property'),    // Authorization
  validateParams(PropertyIdSchema),        // Validate params
  validateBody(UpdatePropertySchema),      // Validate body
  async (req, res) => {
    // All checks passed, handle request
  }
);
```

### Type-Safe Request Handlers

```typescript
import { Request, Response } from 'express';
import type { CreatePropertyInput } from './schemas';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

router.post('/properties',
  requireAuth(),
  validateBody(CreatePropertySchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const propertyData: CreatePropertyInput = req.body;
    const user = req.user;
    
    // Fully typed!
  }
);
```

## Environment Variables

```env
# Required
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# Optional but recommended
REDIS_URL=redis://localhost:6379
PROMETHEUS_PORT=9464
CLIENT_URL=http://localhost:5173
LOG_LEVEL=info

# Service-specific
HUGGINGFACE_API_KEY=your-api-key
```

## Monitoring Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Prometheus metrics
curl http://localhost:9464/metrics

# Socket.IO admin (dev only)
open http://localhost:3000/admin
```

## Debugging

### View Logs with Trace IDs

```bash
# Development (pretty printed)
npm run dev

# Production (JSON)
NODE_ENV=production npm start | pino-pretty
```

### Check Circuit Breaker State

```typescript
import { huggingFaceClient } from './ai/services';

const stats = huggingFaceClient.getStats();
console.log(stats.circuitState); // CLOSED, OPEN, HALF_OPEN
console.log(stats.stats);
```

### Monitor WebSocket Connections

```typescript
import { socketService } from './communication';

const stats = await socketService.getStats();
console.log(`Online users: ${stats.onlineUsers}`);
console.log(`Total connections: ${stats.totalConnections}`);
```

## Testing

### Unit Test Example

```typescript
import { PropertySchema } from './schemas';

describe('PropertySchema', () => {
  it('should validate valid property', () => {
    const valid = {
      id: 1,
      title: 'Test Property',
      // ... other fields
    };
    
    const result = PropertySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
  
  it('should reject invalid property', () => {
    const invalid = { id: 'not-a-number' };
    
    const result = PropertySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import app from './app';

describe('POST /api/properties', () => {
  it('should create property with valid data', async () => {
    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Property',
        description: 'A test property description',
        price: '100000',
        location: 'Test Location',
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

## Tips & Best Practices

1. **Always use schemas for validation** - Don't manually validate
2. **Use trace IDs for debugging** - They're automatically added to logs
3. **Check circuit breaker state** - Before assuming service is down
4. **Use typed requests** - Extend Request interface for type safety
5. **Monitor metrics** - Set up Grafana dashboards for Prometheus
6. **Use central exports** - Import from index files for cleaner code
7. **Log with context** - Include relevant data in log objects
8. **Handle errors gracefully** - Always catch and log errors
9. **Use rate limiting** - Protect your endpoints
10. **Test with schemas** - Schemas are your source of truth

## Getting Help

1. Check this quick reference
2. Review [Migration Guide](./LIBRARY_MIGRATION_GUIDE.md)
3. Check [Architecture Overview](./NEW_ARCHITECTURE_README.md)
4. Review library documentation (links in migration guide)
5. Check logs with trace IDs
6. Review Prometheus metrics
