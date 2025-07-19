# 🔄 Legacy Migration Guide

## 📋 Overview

This folder contains all legacy elements that require manual migration to the new domain-driven architecture. The elements are organized by priority and complexity.

## 📁 Folder Structure

```
legacy-migration/
├── high-priority/          # Critical business services
│   ├── blockchain/          # Blockchain integration services
│   ├── payments/           # Payment processing (M-Pesa, etc.)
│   ├── ml-ai/              # Machine learning and AI services
│   ├── cms/                # Content management system
│   ├── advanced-hooks/     # Advanced React hooks
│   └── integration/        # Integration tests and utilities
├── medium-priority/        # Important but non-critical
│   ├── i18n/               # Internationalization
│   ├── legacy-routes/      # Old route handlers
│   ├── utilities/          # Utility functions
│   └── examples/           # Example components
├── low-priority/           # Deprecated or replaceable
│   ├── deprecated/         # Old implementations
│   ├── old-configs/        # Legacy configuration files
│   └── legacy-middleware/  # Old middleware implementations
└── reference/              # Reference materials
    ├── original-structure/ # Original file structure
    └── migration-docs/     # Migration documentation
```

## 🎯 Migration Priority Guide

### HIGH PRIORITY (Migrate First)

#### 1. Blockchain Services
**Location**: `high-priority/blockchain/`
**Target**: `src/infrastructure/blockchain/`
**Files**: `blockchain-service.ts`
**Notes**: Core blockchain integration for property verification

#### 2. Payment Services
**Location**: `high-priority/payments/`
**Target**: `src/infrastructure/payments/`
**Files**: `mpesa-service.ts`
**Notes**: Critical payment processing functionality

#### 3. ML/AI Services
**Location**: `high-priority/ml-ai/`
**Target**: `src/infrastructure/ai/`
**Files**: `ml-training.ts`, `ml-training.test.ts`
**Notes**: Machine learning models for trust scoring and fraud detection

#### 4. CMS Integration
**Location**: `high-priority/cms/`
**Target**: `src/infrastructure/cms/`
**Files**: `cms.ts`, `useCMS.ts`
**Notes**: Content management system integration

#### 5. Advanced Hooks
**Location**: `high-priority/advanced-hooks/`
**Target**: `src/shared/hooks/advanced/`
**Files**: `useOperationTracking.ts`, `useOptimisticMutation.ts`, `use-safe-query.ts`
**Notes**: Advanced React hooks for performance and tracking

#### 6. Integration & Testing
**Location**: `high-priority/integration/`
**Target**: `test/integration/` and `tools/database/`
**Files**: `test-integration.ts`, `integration.ts`, `reset-database.ts`
**Notes**: Integration tests and database utilities

### MEDIUM PRIORITY (Migrate Second)

#### 1. Internationalization
**Location**: `medium-priority/i18n/`
**Target**: `src/shared/i18n/`
**Files**: `i18n.tsx`
**Notes**: Multi-language support system

#### 2. Legacy Routes
**Location**: `medium-priority/legacy-routes/`
**Target**: Integrate into domain controllers
**Files**: Various route handlers
**Notes**: Old route implementations to be integrated into new domain structure

#### 3. Utilities
**Location**: `medium-priority/utilities/`
**Target**: `src/shared/utils/debug/`
**Files**: `debug.ts`
**Notes**: Debug and utility functions

#### 4. Examples
**Location**: `medium-priority/examples/`
**Target**: `docs/examples/`
**Files**: `TrackedComponentExample.tsx`
**Notes**: Example components for documentation

### LOW PRIORITY (Migrate Last)

#### 1. Deprecated Files
**Location**: `low-priority/deprecated/`
**Target**: Review and potentially discard
**Files**: Old service implementations
**Notes**: Files that may no longer be needed

#### 2. Old Configurations
**Location**: `low-priority/old-configs/`
**Target**: Review and integrate if needed
**Files**: Legacy config files
**Notes**: Old configuration files that may have been replaced

#### 3. Legacy Middleware
**Location**: `low-priority/legacy-middleware/`
**Target**: Already replaced in new structure
**Files**: Old middleware implementations
**Notes**: These have been replaced by new middleware in `server/middleware/`

## 🔧 Migration Instructions

### For Each High-Priority Item:

1. **Review the File**: Understand the functionality and dependencies
2. **Identify Target Location**: Determine where it fits in the new domain structure
3. **Update Imports**: Fix import paths to work with new structure
4. **Update Business Logic**: Integrate with new domain business logic
5. **Add Type Definitions**: Ensure TypeScript compatibility
6. **Update Tests**: Migrate or create new tests
7. **Update Documentation**: Document the migrated functionality

### Migration Checklist:

- [ ] **Blockchain Service** → `src/infrastructure/blockchain/`
- [ ] **Payment Service** → `src/infrastructure/payments/`
- [ ] **ML/AI Services** → `src/infrastructure/ai/`
- [ ] **CMS Integration** → `src/infrastructure/cms/`
- [ ] **Advanced Hooks** → `src/shared/hooks/advanced/`
- [ ] **Integration Tests** → `test/integration/`
- [ ] **Database Scripts** → `tools/database/`
- [ ] **Internationalization** → `src/shared/i18n/`
- [ ] **Debug Utilities** → `src/shared/utils/debug/`
- [ ] **Examples** → `docs/examples/`

## 📝 Migration Notes

### Important Considerations:

1. **Dependencies**: Check for dependencies between legacy files
2. **Environment Variables**: Update any environment variable references
3. **Database Schema**: Ensure database compatibility
4. **API Endpoints**: Update API endpoint references
5. **Type Safety**: Maintain TypeScript type safety
6. **Testing**: Ensure all functionality is properly tested
7. **Documentation**: Update documentation for migrated features

### Common Migration Patterns:

1. **Service Migration**:
   ```typescript
   // Old: server/services/service-name.ts
   // New: src/infrastructure/service-category/service-name.ts
   ```

2. **Hook Migration**:
   ```typescript
   // Old: client/src/hooks/useHookName.ts
   // New: src/shared/hooks/useHookName.ts or src/domain/hooks/useHookName.ts
   ```

3. **Component Migration**:
   ```typescript
   // Old: client/src/components/ComponentName.tsx
   // New: src/domain/components/ComponentName.tsx or src/shared/components/ComponentName.tsx
   ```

## ✅ Post-Migration Verification

After migrating each element:

1. **Build Test**: Ensure the application builds successfully
2. **Functionality Test**: Verify the migrated functionality works
3. **Integration Test**: Test integration with other components
4. **Performance Test**: Ensure no performance regression
5. **Type Check**: Verify TypeScript compilation
6. **Documentation Update**: Update relevant documentation

## 🎯 Success Criteria

Migration is complete when:
- [ ] All high-priority elements are successfully migrated
- [ ] Application builds and runs without errors
- [ ] All functionality is preserved
- [ ] Tests pass
- [ ] Documentation is updated
- [ ] Legacy folder can be safely removed

## 📞 Support

If you encounter issues during migration:
1. Check the original implementation in the reference folder
2. Review the new domain structure documentation
3. Ensure all dependencies are properly updated
4. Test incrementally to isolate issues