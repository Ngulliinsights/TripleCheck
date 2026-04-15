# ADR 001: Cache Service Consolidation

**Status**: Accepted  
**Date**: 2026-04-15  
**Deciders**: Development Team

## Context

Three cache implementations existed causing confusion and maintenance overhead:
1. `server/cache/CacheService.ts` - Original Redis-based (500+ lines)
2. `server/infrastructure/cache/UnifiedCacheManager.ts` - L1/L2 Architecture (800+ lines)
3. `server/infrastructure/cache/CacheService.ts` - Simple in-memory (150 lines)

## Decision

**Keep**: `UnifiedCacheManager.ts` as primary cache service
- Most advanced architecture (L1 in-memory + L2 Redis)
- Stampede protection and intelligent pre-fetching
- LRU eviction and production-ready features

**Keep**: Simple `CacheService.ts` (infrastructure) as fallback
- No external dependencies for development/testing
- Lightweight alternative when Redis unavailable

**Deprecate**: Original `server/cache/CacheService.ts`
- Superseded by UnifiedCacheManager
- Has import errors and redundant functionality

## Consequences

### Positive
- Single unified interface for caching
- Optimal performance with L1/L2 architecture
- Graceful fallback when Redis unavailable
- Reduced code duplication

### Negative
- Migration effort required for existing consumers
- Temporary complexity during transition period

## Implementation

1. Fix UnifiedCacheManager imports
2. Create cache facade for unified API
3. Migrate consumers with deprecation warnings
4. Delete original CacheService after migration

## Related Decisions
- Links to service consolidation strategy
