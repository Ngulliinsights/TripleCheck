# Server Entry Point

**Main Entry Point:** `server/main.ts`

This is the primary server entry point that should be used for all deployments.

## Quick Start

```bash
# Development
npm run dev:server

# Production
npm run start:server
```

## Entry Point Files

- ✅ **`main.ts`** - Primary entry point (USE THIS)
  - Full production-ready setup
  - Database initialization
  - Graceful shutdown
  - Comprehensive error handling
  - OpenTelemetry integration

- ⚠️ **`index.ts`** - Legacy entry point (DEPRECATED)
  - Older implementation
  - Will be removed in future version

- ⚠️ **`app.ts`** - Express app configuration only
  - Not a standalone entry point
  - Imported by main.ts
  - Contains middleware and route setup

## Architecture

```
main.ts (entry point)
  ├── app.ts (Express configuration)
  ├── routes/* (API routes)
  ├── infrastructure/* (database, logging, etc.)
  └── middleware/* (auth, rate limiting, etc.)
```
