# Scripts - Utility and Automation Scripts

Collection of utility scripts for development, deployment, testing, and maintenance of the TripleCheck platform.

## Categories

### Database Scripts
- `load-data-*.ts` - Load test/demo data into database
- `migrate-database-structure.ts` - Database migration utilities
- `validate-database-*.ts` - Database validation and health checks
- `setup-database.ts` - Initial database setup

### Deployment Scripts
- `deployment/deploy-production.ts` - Production deployment
- `deployment/deploy-staging.ts` - Staging deployment
- `deployment/validate-deployment.ts` - Post-deployment validation
- `prepare-deployment.ts` - Pre-deployment preparation

### Testing Scripts
- `run-e2e-tests.js` - End-to-end tests
- `run-accessibility-tests.js` - Accessibility testing
- `run-visual-tests.js` - Visual regression tests
- `test-*.ts` - Various test utilities

### Optimization Scripts
- `optimize-for-deployment.js` - Production optimization
- `aggressive-optimization.js` - Advanced optimization
- `OptimizedBuildPipeline.ts` - Build pipeline optimization

### Maintenance Scripts
- `cleanup-redundancies.ts` - Remove redundant code
- `fix-*.ts` - Various fix utilities
- `validate-*.ts` - Validation utilities

## Usage

Most scripts can be run directly with ts-node:

```bash
# Run a TypeScript script
npx ts-node scripts/script-name.ts

# Run a JavaScript script
node scripts/script-name.js
```

## Common Scripts

### Database Setup
```bash
# Initialize database
npm run db:setup

# Run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Validate deployment
npm run deploy:validate
```

### Testing
```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

## Script Organization

Scripts are organized by function:
- **Root level**: General utilities
- `/deployment/`: Deployment-related scripts
- `/migration-helpers/`: Migration utilities
- `/security/`: Security-related scripts
- `/performance/`: Performance testing

## Best Practices

1. **Use TypeScript** for new scripts (better type safety)
2. **Add error handling** for production scripts
3. **Log progress** for long-running scripts
4. **Document usage** in script comments
5. **Test scripts** before using in production

## Related Documentation

- `/adr/004-test-infrastructure.md` - Testing strategy
- `/adr/005-database-schema-strategy.md` - Database decisions
