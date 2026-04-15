# ADR 007: Property Component Architecture

**Status**: In Progress  
**Date**: 2026-04-15  
**Deciders**: Development Team

## Context

Multiple property card implementations with unclear differences:
- `PropertyCard.tsx` - Original implementation
- `UnifiedPropertyCard.tsx` - Unified version
- `PropertyArchitectureComparison.tsx` - Comparison document
- Refactoring documentation suggests ongoing work
- Separate `LandCard.tsx` for land properties

## Decision

**Pending**: Determine if UnifiedPropertyCard supersedes PropertyCard

**Proposed Strategy**:
1. Consolidate property card implementations
2. Remove comparison/architecture documentation after consolidation
3. Ensure filter components properly integrated
4. Decide on specialized cards (LandCard) vs unified approach

## Consequences

### Positive (Expected)
- Single property card component
- Clearer component hierarchy
- Easier maintenance
- Consistent UI across property types

### Negative (Expected)
- Migration effort for existing usage
- Potential loss of specialized functionality
- Need to handle all property types in one component

## Open Questions
1. Does UnifiedPropertyCard handle all property types?
2. Should we keep specialized cards (LandCard)?
3. What features are unique to each implementation?

## Related Decisions
- ADR 002: Image Gallery Refactoring
- ADR 003: Service Consolidation
