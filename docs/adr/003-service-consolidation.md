# ADR 003: Image Service Consolidation

**Status**: Accepted  
**Date**: 2026-04-15  
**Deciders**: Development Team

## Context

Multiple image service implementations existed:
- `UnifiedImageServiceFactory` - 600+ lines, complex factory pattern
- `PropertyImageUploadCoordinator` - Redundant coordinator
- `ImageServiceOrchestrator` - Modern composition-based (~200 lines)
- `LegacyServiceAdapter` - Temporary compatibility layer

## Decision

**Strategic Baseline**: `ImageServiceOrchestrator`

**Rationale**:
- Modern composition-based architecture
- Clean, maintainable code (200 vs 600+ lines)
- Single entry point for complex workflows
- Coordinates existing services efficiently
- Best positioned for future growth

**Deprecated**:
- `UnifiedImageServiceFactory` - Marked with @deprecated tags
- `PropertyImageUploadCoordinator` - Use orchestrator instead

**Retained for Transition**:
- `LegacyServiceAdapter` - Temporary compatibility, remove after migration

## Consequences

### Positive
- 66% reduction in service factory code
- Single source of truth for image operations
- Better architecture (composition over factory)
- Clearer migration path with deprecation warnings

### Negative
- Migration effort required for existing consumers
- Temporary maintenance of deprecated code

## Migration Path

```typescript
// Old (Deprecated)
const services = UnifiedImageServiceFactory.createServiceSuite()
const uploadService = services.uploadCoordinator

// New (Recommended)
const orchestrator = getImageServiceOrchestrator()
const uploadService = orchestrator.getUploadService()
```

## Timeline
- Deprecation Period: 4-6 weeks
- Removal Target: Next major version (v2.0.0)

## Related Decisions
- ADR 002: Image Gallery Refactoring
