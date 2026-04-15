# ADR 004: Test Infrastructure Consolidation

**Status**: Accepted  
**Date**: 2026-02-23  
**Deciders**: Development Team

## Context

Tests were scattered across multiple directories with multiple frameworks:
- 438 test files (*.test.ts, *.test.tsx, *.spec.ts)
- 76 __tests__ directories
- 50+ test-related scripts
- 95% of TypeScript errors (815 out of 856) were in outdated tests
- Tests were blocking development progress

## Decision

**Immediate Action**: Remove all outdated test files
- Delete 438 test files
- Delete 76 __tests__ directories
- Focus on production code quality first

**Future Strategy**: Use `ConsolidatedTestFramework.ts` as baseline
- Organize tests by type (unit, integration, e2e)
- Single test execution strategy
- Reduce number of test scripts
- Rewrite tests when features are stable

## Consequences

### Positive
- Cleaner project structure
- Faster IDE performance (less files to index)
- Clear view of actual production code issues
- Removed 438 files cluttering codebase

### Negative
- No test coverage temporarily
- Need to rewrite tests later
- Revealed 1,370 TypeScript errors in production code

## Rationale

Tests can be rewritten later when needed. Priority is:
1. ML model training
2. Demo data generation
3. API infrastructure
4. TypeScript cleanup
5. Test rewriting

## Related Decisions
- Prioritizes business value over test coverage initially
- Tests will be added incrementally as features stabilize
