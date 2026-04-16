# Hook Migration Tools and Documentation

This directory contains comprehensive tools and documentation for migrating from deprecated hooks to their consolidated counterparts.

## Quick Start

### 1. Detect Deprecated Hook Usage
```bash
npm run migrate:detect
```

### 2. Apply Automated Fixes
```bash
npm run migrate:fix
```

### 3. Follow Migration Guide
See [COMPREHENSIVE_MIGRATION_GUIDE.md](./COMPREHENSIVE_MIGRATION_GUIDE.md) for detailed instructions.

## Documentation Files

### 📖 [COMPREHENSIVE_MIGRATION_GUIDE.md](./COMPREHENSIVE_MIGRATION_GUIDE.md)
Complete migration guide with:
- Before/after code examples for all hook types
- Step-by-step migration instructions
- Configuration-based patterns
- Testing strategies
- Performance considerations

### 🔧 [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md)
Solutions for common migration issues:
- Import and module errors
- Type errors and runtime issues
- Performance problems
- Testing failures
- Build and deployment issues
- Rollback procedures

### ✅ [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)
Systematic checklist for migration:
- Pre-migration setup
- Phase-by-phase execution plan
- Testing and validation steps
- Documentation and cleanup
- Success criteria and sign-off

### 📋 [property-hooks-migration.md](./property-hooks-migration.md)
Specific guide for property hook migrations:
- Property data fetching patterns
- Search functionality migration
- Property actions refactoring
- Performance optimizations

## Migration Tools

### Automated Detection Script
**Location:** `scripts/migrate-hooks.js`

**Features:**
- Scans entire codebase for deprecated hooks
- Generates detailed migration report
- Provides complexity assessment
- Estimates migration effort
- Identifies auto-fixable vs manual cases

**Usage:**
```bash
# Detect all deprecated hook usage
npm run migrate:detect

# Apply automated fixes
npm run migrate:fix

# Fix specific hook only
npm run migrate:fix --hook=useForm

# Show help
npm run migrate:help
```

### Migration Report
The detection script generates `migration-report.json` with:
- File locations and line numbers
- Hook complexity ratings
- Auto-fix availability
- Migration examples
- Effort estimates

## Hook Migration Status

### ✅ Completed Migrations
- **Form Hooks**: `useForm` → `useFormValidation`
- **Data Fetching**: Property hooks → `useSafeQuery` variants
- **Performance**: `usePerformanceMonitor` → `useComponentPerformance`
- **Pagination**: `usePaginatedQuery` + `useInfiniteScroll` → `usePagination`
- **Accessibility**: `useAccessibility.ts` → `useAccessibility.tsx`
- **Configuration**: Multiple similar hooks → `useConfigurableHook`

### 📊 Migration Statistics
- **Starting hooks**: 32+
- **Target hooks**: ~20
- **Current progress**: 8/12 major consolidations complete
- **Estimated completion**: 85% complete

## Migration Workflow

### 1. Preparation Phase
```bash
# Create backup
git checkout -b backup-before-migration

# Analyze current state
npm run migrate:detect
```

### 2. Execution Phase
```bash
# Apply automated fixes
npm run migrate:fix

# Manual migrations (follow guide)
# Test each migration
npm test
```

### 3. Validation Phase
```bash
# Final detection scan
npm run migrate:detect

# Build verification
npm run build:client:safe

# Full test suite
npm test
```

## Common Migration Patterns

### Simple Hook Replacement
```typescript
// Before
import { useProperties } from '../property/hooks/useProperty';
const { data, isLoading } = useProperties(params);

// After
import { useSafePropertiesQuery } from '../shared/hooks/useSafeQuery';
const { data, isLoading } = useSafePropertiesQuery(params);
```

### Configuration-Based Migration
```typescript
// Before
import { usePropertyFormValidation } from '../hooks/usePropertyFormValidation';
const form = usePropertyFormValidation(initialData);

// After
import { useFormValidation, createPropertyFormConfig } from '../shared/hooks/useFormValidation';
const form = useFormValidation(createPropertyFormConfig(initialData));
```

### Complex Refactoring
```typescript
// Before
import { usePropertyActions } from '../hooks/usePropertyActions';
const { addToFavorites, isLoading } = usePropertyActions();

// After
import { useSafePropertyActionsQuery } from '../shared/hooks/useSafeQuery';
const { data, isLoading } = useSafePropertyActionsQuery('favorites', propertyId);
```

## Best Practices

### 🎯 Migration Order
1. Start with low-complexity, auto-fixable hooks
2. Migrate core functionality first
3. Handle edge cases and complex patterns last
4. Test thoroughly at each step

### 🔍 Testing Strategy
- Update test mocks for new hooks
- Test both happy path and error scenarios
- Verify performance hasn't regressed
- Test accessibility features

### 📝 Documentation
- Update component documentation
- Add migration notes to README
- Document any breaking changes
- Share learnings with team

## Getting Help

### 🆘 If You Encounter Issues
1. Check the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
2. Run `npm run migrate:detect` for current status
3. Review the migration report for specific guidance
4. Test changes in isolation
5. Use the rollback procedures if needed

### 📞 Support Resources
- Migration documentation in this directory
- Automated migration tools and scripts
- Team knowledge sharing sessions
- Code review and pair programming

### 🔄 Rollback Options
- Emergency rollback: `git checkout backup-before-migration`
- Selective rollback: Revert specific files
- Feature flags: Temporarily disable new hooks
- Gradual rollback: Component-by-component

## Contributing to Migration Tools

### Improving Documentation
- Add examples for complex migration cases
- Update troubleshooting solutions
- Enhance migration checklist
- Share migration experiences

### Enhancing Tools
- Improve automated detection accuracy
- Add more auto-fix patterns
- Enhance reporting capabilities
- Add performance benchmarking

### Feedback and Improvements
- Report issues with migration tools
- Suggest improvements to documentation
- Share successful migration patterns
- Contribute to troubleshooting guide

---

## Quick Reference

### Essential Commands
```bash
npm run migrate:detect    # Scan for deprecated hooks
npm run migrate:fix       # Apply automated fixes
npm run migrate:help      # Show help information
npm test                  # Run test suite
npm run build:client:safe # Safe build check
```

### Key Files
- `COMPREHENSIVE_MIGRATION_GUIDE.md` - Complete migration instructions
- `TROUBLESHOOTING_GUIDE.md` - Problem-solving guide
- `MIGRATION_CHECKLIST.md` - Systematic migration checklist
- `migration-report.json` - Generated migration report

### Migration Status
Check current progress: `npm run hooks:consolidation-status`

---

**Last Updated**: Current  
**Migration Tools Version**: 1.0  
**Compatibility**: All consolidated hooks