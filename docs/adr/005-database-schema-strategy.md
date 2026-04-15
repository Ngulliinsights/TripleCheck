# ADR 005: Database Schema Consolidation

**Status**: In Progress  
**Date**: 2026-04-15  
**Deciders**: Development Team

## Context

Multiple schema locations with unclear authority:
- `server/infrastructure/database/schemas/` - Split by domain
  - `communication/index.ts`
  - `core/index.ts`
  - `fraud/index.ts`
  - `trust/index.ts`
  - `verification/index.ts`
- `server/infrastructure/database/schemas/consolidated.ts` - Unclear if authoritative
- Migration files in different formats (.sql, .ts)
- Unclear migration execution order

## Decision

**Pending**: Identify authoritative schema source

**Proposed Strategy**:
1. Consolidate all schemas into single location
2. Create clear migration execution order
3. Remove orphaned migration files
4. Update MIGRATION_SUMMARY.md with current state

## Consequences

### Positive (Expected)
- Single source of truth for database schema
- Clear migration path
- Reduced confusion for developers
- Easier to maintain and evolve schema

### Negative (Expected)
- Migration effort required
- Risk of data loss if not careful
- Temporary disruption during consolidation

## Open Questions
1. Which schema file is authoritative?
2. How to handle existing migrations?
3. What is the correct migration execution order?

## Related Decisions
- ADR 001: Cache Consolidation
- Links to infrastructure decisions
