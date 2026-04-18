# Fraud Detection Test Infrastructure Consolidation Plan

## Current State

Fraud detection has its own isolated test infrastructure:
- `jest.config.js` - Separate Jest configuration
- `tests/global-setup.ts` - Isolated setup
- `tests/global-teardown.ts` - Isolated teardown
- `tests/run-tests.ts` - Custom test runner

This is separate from:
- `server/tests/` - Main server tests
- `tests/` - Root test directory

## Issues

1. **Duplication** - Multiple test configurations across the project
2. **Maintenance** - Changes to test infrastructure need to be made in multiple places
3. **Inconsistency** - Different test patterns and conventions
4. **Complexity** - Harder to run all tests together

## Recommended Consolidation

### Option 1: Move to Root Tests (Recommended)
```
tests/
├── unit/
│   ├── server/
│   │   ├── fraud-detection/  # Move fraud detection tests here
│   │   ├── auth/
│   │   └── ...
│   └── client/
├── integration/
└── e2e/
```

### Option 2: Keep Separate but Standardize
- Use same Jest config as root
- Import shared test utilities
- Follow same naming conventions

## Migration Steps

1. **Audit** - Identify all fraud detection tests
2. **Categorize** - Separate unit, integration, e2e tests
3. **Move** - Relocate to appropriate directories
4. **Update** - Fix import paths
5. **Consolidate** - Merge Jest configs
6. **Test** - Verify all tests still pass
7. **Cleanup** - Remove old infrastructure

## Benefits

- ✅ Single test command runs all tests
- ✅ Consistent test patterns
- ✅ Easier CI/CD integration
- ✅ Reduced maintenance overhead
- ✅ Better test organization

## Status

⚠️ **PENDING** - Requires careful migration to avoid breaking existing tests

## Temporary Solution

Keep isolated infrastructure but document it clearly until consolidation is complete.
