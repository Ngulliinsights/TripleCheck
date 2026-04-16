# Server Architecture

**Entry Point:** `server/main.ts`  
**Express Config:** `server/app.ts`

## Quick Start

```bash
# Development
npm run dev:server

# Production
npm run start:server
```

## Architecture Overview

### Two-File Pattern

```
server/
├── main.ts          # 🚀 Entry Point (server lifecycle)
│   ├── Imports app.ts
│   ├── Initializes database
│   ├── Starts HTTP server
│   ├── Handles graceful shutdown
│   └── Process lifecycle management
│
└── app.ts           # ⚙️ Express Config (middleware & routes)
    ├── Middleware setup
    ├── Route registration
    ├── Error handling
    ├── CORS configuration
    └── Exports Express app
```

### Why Two Files?

**Separation of Concerns:**
- `main.ts` = "How to run the server" (lifecycle)
- `app.ts` = "What the server does" (configuration)

**Benefits:**
1. **Testability** - Test Express app without starting server
2. **Reusability** - Use app in different contexts (serverless, testing)
3. **Clarity** - Clear responsibility boundaries
4. **Maintainability** - Easy to find and modify specific concerns

## File Descriptions

### `main.ts` - Server Entry Point

**Purpose:** Server lifecycle management

**Responsibilities:**
- Parse environment variables
- Initialize database connection
- Create HTTP server
- Handle graceful shutdown
- Process signal handling (SIGTERM, SIGINT)
- Error recovery

**Usage:**
```bash
tsx server/main.ts        # Development
node dist/server/main.js  # Production
```

### `app.ts` - Express Application

**Purpose:** Express configuration module

**Responsibilities:**
- Configure middleware (body parser, CORS, sessions)
- Register routes
- Setup error handling
- Configure security (rate limiting, helmet)
- Export configured Express app

**Usage:**
```typescript
// In main.ts
import app from './app';
const server = app.listen(3000);

// In tests
import app from './app';
import request from 'supertest';
await request(app).get('/health').expect(200);
```

## Naming Convention

### Entry Points: Use Descriptive Names ✅
- `main.ts` - Primary entry point (our choice)
- `server.ts` - Alternative for server entry
- `start.ts` - Alternative for startup script

### Modules: Use Descriptive Names ✅
- `app.ts` - Express application
- `config.ts` - Configuration
- `database.ts` - Database connection

### Barrel Exports: Use `index.ts` ✅
- `routes/index.ts` - Aggregate route exports
- `middleware/index.ts` - Aggregate middleware exports
- `utils/index.ts` - Aggregate utility exports

### ❌ Avoid "index.ts" for Entry Points
**Why?**
- Ambiguous (every directory could have one)
- Non-descriptive (doesn't indicate purpose)
- Confusing (looks like a barrel export)
- Hidden (easy to overlook)

## Testing the Application

### Test Express App (Without Server)
```typescript
import app from './app';
import request from 'supertest';

describe('API', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });
});
```

### Test Full Server (With Lifecycle)
```typescript
import { startServer } from './main';

describe('Server', () => {
  let server;
  
  beforeAll(async () => {
    server = await startServer(3001);
  });
  
  afterAll(() => {
    server.close();
  });
  
  it('should start successfully', () => {
    expect(server.listening).toBe(true);
  });
});
```

## Deployment

### Development
```bash
npm run dev:server
# Runs: tsx watch server/main.ts
# Hot reload enabled
```

### Production
```bash
# Build
npm run build:server
# Compiles TypeScript to dist/server/

# Start
npm run start:server
# Runs: node dist/server/main.js
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
CMD ["node", "dist/server/main.js"]
```

## Environment Variables

See `.env.example` for required variables:
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - Database connection string
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Environment (development/production)

## Troubleshooting

### Server Won't Start
```bash
# Check if port is in use
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Check environment variables
cat .env

# Check logs
npm run dev:server
```

### Database Connection Issues
```bash
# Test database connection
npm run test:db

# Check DATABASE_URL format
# PostgreSQL: postgresql://user:pass@host:5432/db
# MySQL: mysql://user:pass@host:3306/db
```

## Related Documentation

- `docs/SERVER_ARCHITECTURE_DECISION.md` - Architecture rationale
- `docs/NAMING_CONVENTIONS.md` - Project-wide naming standards
- `docs/DEMO_READY_CHECKLIST.md` - Pre-deployment checklist

