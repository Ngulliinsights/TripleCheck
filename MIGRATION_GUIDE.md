# Core Utilities Migration Guide

This guide provides step-by-step instructions for migrating all references throughout the codebase to use the new `@triplecheck/core` utilities.

## Overview

The migration consolidates scattered cross-cutting utilities into a unified core module, providing:

- **Multi-Tier Caching** - L1 (memory) + L2 (Redis) with circuit breaker protection
- **Enhanced Structured Logging** - Pino-based logging with AsyncLocalStorage context preservation
- **Comprehensive Validation** - Zod-based validation with preprocessing and batch processing
- **Advanced Rate Limiting** - Multiple algorithms (sliding window, token bucket, fixed window)
- **Circuit Breaker Integration** - Adaptive thresholds and automatic recovery
- **Health Monitoring** - Comprehensive dependency checking with timeout protection
- **Configuration Management** - Zod schema validation, hot reloading, and feature flags
- **Migration Utilities** - Backward compatibility adapters for smooth transition

## Pre-Migration Checklist

- [ ] Ensure all tests are passing
- [ ] Create a backup of your codebase
- [ ] Review the current implementation status in `tasks.md`
- [ ] Verify the core module is properly built and tested

## Migration Steps

### Step 1: Automated Migration

Run the automated migration script to update most imports:

```bash
# Make the script executable
chmod +x migrate-to-core-utilities.sh

# Run the migration
./migrate-to-core-utilities.sh
```

Or use the TypeScript version for more precise migration:

```bash
# Install dependencies if needed
npm install -g tsx

# Run the TypeScript migration script
tsx migrate-specific-utilities.ts
```

### Step 2: Manual Review and Updates

After the automated migration, manually review and update:

#### Cache Service Updates

**Before:**
```typescript
import { cacheService } from '../infrastructure/cache/CacheService';
import { CacheService } from '../infrastructure/cache';
```

**After:**
```typescript
import { cacheService, CacheService } from '@triplecheck/core/cache';
```

#### Logging Updates

**Before:**
```typescript
import { logger } from '../infrastructure/monitoring/logger';
import { structuredLogger } from '../monitoring/StructuredLogger';
```

**After:**
```typescript
import { logger, structuredLogger } from '@triplecheck/core/logging';
```

#### Validation Updates

**Before:**
```typescript
import { validateRequest } from '../middleware/validation.middleware';
import { validationService } from '../shared/services/ValidationService';
import { useFormValidation } from '../shared/hooks/useFormValidation';
```

**After:**
```typescript
import { 
  validateRequest, 
  validationService, 
  useFormValidation 
} from '@triplecheck/core/validation';
```

#### Rate Limiting Updates

**Before:**
```typescript
import { createRateLimitingMiddleware } from '../middleware/rate-limiting.middleware';
import { ApiRateLimiter } from '../infrastructure/rate-limiting/ApiRateLimiter';
```

**After:**
```typescript
import { 
  createRateLimitingMiddleware, 
  ApiRateLimiter 
} from '@triplecheck/core/rate-limiting';
```

#### Error Handling Updates

**Before:**
```typescript
import { AppError, ValidationError } from '../shared/error-handling';
import { asyncHandler } from '../middleware/error';
```

**After:**
```typescript
import { 
  AppError, 
  ValidationError, 
  asyncHandler 
} from '@triplecheck/core/error-handling';
```

#### Configuration Updates

**Before:**
```typescript
import { getConfig } from '../config/app.config';
import { databaseConfig } from '../config/database.config';
```

**After:**
```typescript
import { getConfig, databaseConfig } from '@triplecheck/core/config';
```

#### Health Monitoring Updates

**Before:**
```typescript
import { healthChecker } from '../monitoring/HealthMonitor';
```

**After:**
```typescript
import { healthChecker } from '@triplecheck/core/health';
```

### Step 3: Update Package Dependencies

Ensure `@triplecheck/core` is added to your `package.json`:

```json
{
  "dependencies": {
    "@triplecheck/core": "^1.0.0"
  }
}
```

### Step 4: Update TypeScript Configuration

Add path mapping to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@triplecheck/core/*": ["./core/src/*"]
    }
  }
}
```

### Step 5: Update Test Files

Update test files to use the new imports and mocks:

**Before:**
```typescript
vi.mock('../infrastructure/cache/CacheService');
vi.mock('../infrastructure/monitoring/logger');
```

**After:**
```typescript
vi.mock('@triplecheck/core/cache');
vi.mock('@triplecheck/core/logging');
```

### Step 6: Validation

Run the validation script to check the migration:

```bash
tsx validate-migration.ts
```

This will check for:
- Remaining old imports
- Proper new imports
- Package.json dependencies
- TypeScript configuration
- Build process
- Test files

### Step 7: Testing

Run comprehensive tests to ensure everything works:

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Build the project
npm run build

# Type check
npx tsc --noEmit
```

## Common Migration Patterns

### Service Initialization

**Before:**
```typescript
// Multiple service initializations
import { cacheService } from '../infrastructure/cache';
import { logger } from '../infrastructure/monitoring/logger';
import { validationService } from '../shared/services/ValidationService';

// Initialize services separately
const cache = cacheService;
const log = logger;
const validator = validationService;
```

**After:**
```typescript
// Unified core utilities
import { createCoreUtilities } from '@triplecheck/core';

// Initialize all utilities at once
const core = await createCoreUtilities();
const { cache, logger, validationService } = core;
```

### Middleware Configuration

**Before:**
```typescript
import { rateLimitMiddleware } from '../middleware/rate-limiting.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { errorHandler } from '../middleware/error.middleware';

app.use(rateLimitMiddleware);
app.use(validateRequest);
app.use(errorHandler);
```

**After:**
```typescript
import { 
  rateLimitMiddleware, 
  validateRequest, 
  errorHandler 
} from '@triplecheck/core/middleware';

app.use(rateLimitMiddleware);
app.use(validateRequest);
app.use(errorHandler);
```

### Configuration Management

**Before:**
```typescript
import { appConfig } from '../config/app.config';
import { databaseConfig } from '../config/database.config';

const config = {
  ...appConfig,
  ...databaseConfig
};
```

**After:**
```typescript
import { getConfig } from '@triplecheck/core/config';

const config = getConfig();
```

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure `@triplecheck/core` is installed: `npm install @triplecheck/core`
   - Check TypeScript path mapping in `tsconfig.json`
   - Verify the core module is built: `cd core && npm run build`

2. **Type errors**
   - Update import statements to use proper destructuring
   - Check for interface changes in the new core utilities
   - Ensure TypeScript configuration is updated

3. **Runtime errors**
   - Check for initialization order dependencies
   - Verify configuration is properly loaded
   - Ensure all required environment variables are set

4. **Test failures**
   - Update test mocks to use new import paths
   - Check for changed API signatures
   - Update test utilities and helpers

### Rollback Procedure

If issues arise, you can rollback using the backup:

```bash
# Find your backup directory
ls -la | grep migration-backup

# Restore from backup
cp -r migration-backup-TIMESTAMP/* .

# Reinstall dependencies
npm install

# Run tests to verify rollback
npm test
```

## Post-Migration Tasks

### Cleanup

After successful migration and testing:

1. **Remove old utility files**
   ```bash
   # Remove old cache services
   rm -rf server/infrastructure/cache/CacheService.ts
   rm -rf src/shared/services/CacheService.ts
   
   # Remove old logging services
   rm -rf server/infrastructure/monitoring/logger.ts
   rm -rf server/monitoring/StructuredLogger.ts
   
   # Remove old validation services
   rm -rf src/shared/services/ValidationService.ts
   rm -rf server/middleware/validation.middleware.ts
   ```

2. **Update documentation**
   - Update README files with new import examples
   - Update API documentation
   - Update development guides

3. **Update CI/CD pipelines**
   - Ensure build processes include core module
   - Update deployment scripts if necessary
   - Update environment variable configurations

### Performance Monitoring

Monitor the application after migration:

1. **Check performance metrics**
   - Cache hit rates should improve with multi-tier caching
   - Response times should be consistent or better
   - Memory usage should be optimized

2. **Monitor error rates**
   - Error handling should be more consistent
   - Circuit breakers should prevent cascade failures
   - Logging should provide better context

3. **Validate functionality**
   - All features should work as before
   - New features from core utilities should be available
   - Configuration management should be more robust

## Support

If you encounter issues during migration:

1. Check the validation report for specific issues
2. Review the migration backup for comparison
3. Consult the core utilities documentation
4. Run the troubleshooting commands in the validation report

## Migration Checklist

- [ ] Run automated migration script
- [ ] Review and update imports manually
- [ ] Update package.json dependencies
- [ ] Update TypeScript configuration
- [ ] Update test files and mocks
- [ ] Run validation script
- [ ] Run comprehensive tests
- [ ] Build project successfully
- [ ] Test application functionality
- [ ] Monitor performance and errors
- [ ] Clean up old utility files
- [ ] Update documentation
- [ ] Update CI/CD pipelines

## Success Criteria

The migration is successful when:

- [ ] All tests pass
- [ ] Project builds without errors
- [ ] No old import statements remain
- [ ] All new core utility imports work correctly
- [ ] Application functionality is preserved
- [ ] Performance is maintained or improved
- [ ] Error handling is consistent
- [ ] Logging provides proper context
- [ ] Configuration management works correctly
- [ ] Health monitoring is functional

---

**Note:** This migration is part of the larger core utilities consolidation effort documented in the `requirements.md` and `tasks.md` files. The migration should be performed incrementally and with thorough testing at each step.