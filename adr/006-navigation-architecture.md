# ADR 006: Navigation Component Architecture

**Status**: In Progress  
**Date**: 2026-04-15  
**Deciders**: Development Team

## Context

Multiple navigation implementations with ongoing stability issues:
- `Navigation.tsx` - Main component
- `MobileNav.tsx` - Mobile version
- `SafeNavigation.tsx` - Safe wrapper
- `NavigationErrorBoundary.tsx` - Error handling
- `NavigationDebug.tsx` - Debug component
- Multiple crash fix documents suggest instability
- Fallback components indicate reliability concerns

## Decision

**Pending**: Consolidate navigation components

**Proposed Strategy**:
1. Integrate error boundaries properly into main component
2. Remove debug components from production
3. Eliminate need for fallback components
4. Archive fix documentation after issues resolved

## Consequences

### Positive (Expected)
- More stable navigation
- Cleaner component structure
- Better error handling
- Improved user experience

### Negative (Expected)
- Risk of breaking existing navigation
- User-facing changes require careful testing
- Migration effort for consumers

## Open Questions
1. Are navigation crashes still occurring?
2. Can we remove SafeNavigation wrapper?
3. Should debug components be development-only?

## Related Decisions
- ADR 002: Image Gallery Refactoring
- ADR 007: Property Components
