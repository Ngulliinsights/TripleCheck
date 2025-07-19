# ✅ Legacy Migration Checklist

## 🎯 High Priority Migrations

### Blockchain Services
- [ ] **File**: `blockchain/blockchain-service.ts`
- [ ] **Target**: `src/infrastructure/blockchain/blockchain.service.ts`
- [ ] **Dependencies**: Check for crypto libraries and blockchain APIs
- [ ] **Environment**: Update blockchain network configurations
- [ ] **Testing**: Create integration tests for blockchain operations
- [ ] **Documentation**: Document blockchain integration

### Payment Services
- [ ] **File**: `payments/mpesa-service.ts`
- [ ] **Target**: `src/infrastructure/payments/mpesa.service.ts`
- [ ] **Dependencies**: M-Pesa API credentials and configurations
- [ ] **Environment**: Update payment gateway settings
- [ ] **Testing**: Create payment integration tests
- [ ] **Security**: Ensure secure handling of payment data

### ML/AI Services
- [ ] **File**: `ml-ai/ml-training.ts`
- [ ] **Target**: `src/infrastructure/ai/ml-training.service.ts`
- [ ] **File**: `ml-ai/ml-training.test.ts`
- [ ] **Target**: `test/integration/ml-training.test.ts`
- [ ] **Dependencies**: ML libraries and model files
- [ ] **Performance**: Optimize for production use
- [ ] **Testing**: Comprehensive ML model testing

### CMS Integration
- [ ] **File**: `cms/cms.ts`
- [ ] **Target**: `src/infrastructure/cms/cms.service.ts`
- [ ] **File**: `cms/useCMS.ts`
- [ ] **Target**: `src/shared/hooks/useCMS.ts`
- [ ] **Configuration**: Update CMS API endpoints
- [ ] **Types**: Add TypeScript definitions
- [ ] **Caching**: Implement content caching strategy

### Advanced Hooks
- [ ] **File**: `advanced-hooks/useOperationTracking.ts`
- [ ] **Target**: `src/shared/hooks/useOperationTracking.ts`
- [ ] **File**: `advanced-hooks/useOptimisticMutation.ts`
- [ ] **Target**: `src/shared/hooks/useOptimisticMutation.ts`
- [ ] **File**: `advanced-hooks/use-safe-query.ts`
- [ ] **Target**: `src/shared/hooks/useSafeQuery.ts`
- [ ] **Integration**: Update with new query client
- [ ] **Performance**: Optimize for new architecture

### Integration & Testing
- [ ] **File**: `integration/test-integration.ts`
- [ ] **Target**: `test/integration/api-integration.test.ts`
- [ ] **File**: `integration/integration.ts`
- [ ] **Target**: `src/infrastructure/integration/integration.service.ts`
- [ ] **File**: `integration/reset-database.ts`
- [ ] **Target**: `tools/database/reset-database.ts`
- [ ] **Test Framework**: Update to work with new structure
- [ ] **CI/CD**: Update continuous integration scripts

## 🔄 Medium Priority Migrations

### Internationalization
- [ ] **File**: `i18n/i18n.tsx`
- [ ] **Target**: `src/shared/i18n/i18n.service.ts`
- [ ] **Localization**: Set up translation files
- [ ] **Components**: Update components for i18n support
- [ ] **Routing**: Add locale-based routing if needed

### Legacy Routes
- [ ] **File**: `legacy-routes/routes.ts`
- [ ] **Action**: Integrate into domain controllers
- [ ] **File**: `legacy-routes/ai-routes.ts`
- [ ] **Target**: `server/ai/ai.controller.ts` (enhance existing)
- [ ] **File**: `legacy-routes/community-trust-routes.ts`
- [ ] **Target**: `server/trust/trust.controller.ts` (enhance existing)
- [ ] **File**: `legacy-routes/email-routes.ts`
- [ ] **Target**: `server/infrastructure/email/email.controller.ts`
- [ ] **File**: `legacy-routes/secure-document-routes.ts`
- [ ] **Target**: `server/trust/document.controller.ts`

### Utilities & Examples
- [ ] **File**: `utilities/debug.ts`
- [ ] **Target**: `src/shared/utils/debug.ts`
- [ ] **File**: `examples/TrackedComponentExample.tsx`
- [ ] **Target**: `docs/examples/TrackedComponentExample.tsx`
- [ ] **Documentation**: Create usage examples
- [ ] **Integration**: Update debug utilities for new structure

## 🔧 Low Priority Migrations

### Review and Cleanup
- [ ] **Deprecated Files**: Review `low-priority/deprecated/` for any needed functionality
- [ ] **Old Configurations**: Check `low-priority/old-configs/` for missing configurations
- [ ] **Legacy Middleware**: Verify `low-priority/legacy-middleware/` is fully replaced

## 📋 Migration Process for Each Item

### Step 1: Analysis
- [ ] Read and understand the original file
- [ ] Identify all dependencies and imports
- [ ] Determine the appropriate target location
- [ ] Check for any breaking changes needed

### Step 2: Migration
- [ ] Create the new file in the target location
- [ ] Update all import paths
- [ ] Integrate with new domain business logic
- [ ] Add proper TypeScript types
- [ ] Update any configuration references

### Step 3: Testing
- [ ] Create or update tests for the migrated functionality
- [ ] Run build to ensure no compilation errors
- [ ] Test the functionality manually
- [ ] Run integration tests if applicable

### Step 4: Documentation
- [ ] Update relevant documentation
- [ ] Add JSDoc comments if needed
- [ ] Update API documentation if applicable
- [ ] Create migration notes for future reference

### Step 5: Cleanup
- [ ] Remove the original file from legacy folder
- [ ] Update any references to the old file location
- [ ] Verify no broken imports remain
- [ ] Update the migration checklist

## 🎯 Completion Criteria

### For Each Migration:
- [ ] File successfully moved and integrated
- [ ] All imports updated and working
- [ ] Functionality preserved and tested
- [ ] No build errors or warnings
- [ ] Documentation updated
- [ ] Original file removed from legacy folder

### For Overall Migration:
- [ ] All high-priority items migrated
- [ ] All medium-priority items migrated
- [ ] Application builds successfully
- [ ] All tests pass
- [ ] No broken functionality
- [ ] Documentation is complete
- [ ] Legacy folder can be safely removed

## 📊 Progress Tracking

### High Priority: 0/6 Complete
- [ ] Blockchain Services
- [ ] Payment Services  
- [ ] ML/AI Services
- [ ] CMS Integration
- [ ] Advanced Hooks
- [ ] Integration & Testing

### Medium Priority: 0/3 Complete
- [ ] Internationalization
- [ ] Legacy Routes
- [ ] Utilities & Examples

### Low Priority: 0/1 Complete
- [ ] Review and Cleanup

### Overall Progress: 0/10 Complete (0%)

---

**Note**: Update this checklist as you complete each migration to track your progress.