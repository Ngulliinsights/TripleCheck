# Documentation

Technical documentation for the TripleCheck platform.

## Documentation Structure

### Architectural Decision Records (`/adr/`)
Strategic architectural decisions with context, rationale, and consequences.

**Frontend Architecture**:
- ADR 002: Image Gallery Refactoring
- ADR 006: Navigation Architecture
- ADR 007: Property Components

**Backend Architecture**:
- ADR 001: Cache Consolidation
- ADR 003: Service Consolidation
- ADR 005: Database Schema Strategy
- ADR 016: Layered Architecture

**Infrastructure & Libraries**:
- ADR 010: Observability Stack (Pino + OpenTelemetry)
- ADR 011: HTTP Client Resilience (Axios + Opossum + Keyv)
- ADR 012: Authentication & Authorization (Passport.js + CASL)
- ADR 013: Real-time Communication (Socket.IO)
- ADR 014: Schema Validation (Zod)
- ADR 015: Rate Limiting (express-rate-limit)

**Testing & Quality**:
- ADR 004: Test Infrastructure

**Business & Strategy**:
- ADR 008: Business Model
- ADR 009: ML Training Strategy

### Documentation Consolidation System (`/DCS/`)
Migration tracking and documentation consolidation to prevent sprawl.

### Directory READMEs
Each major directory has a README explaining its function and relationship to the larger project:
- `/src/README.md` - Frontend architecture
- `/src/shared/README.md` - Shared components and services
- `/server/README.md` - Backend architecture
- `/server/infrastructure/README.md` - Infrastructure services
- `/server/ai/README.md` - AI/ML services
- `/scripts/README.md` - Utility scripts

## Quick Reference

### Project Structure (`project-structure.md`)
Complete directory tree of the project (auto-generated).

### Quick Reference Guide (`QUICK_REFERENCE.md`)
Common commands, patterns, and workflows.

## Documentation Principles

1. **Strategic decisions** → ADR
2. **Migration tracking** → DCS
3. **Functional documentation** → Directory READMEs
4. **No duplication** → Single source of truth
5. **No sprawl** → Consolidate, don't proliferate

## Finding Information

**For architectural decisions**: Check `/adr/`  
**For library choices**: Check ADR 010-015  
**For module functionality**: Check directory READMEs  
**For migration status**: Check `/DCS/migration.log.md`  
**For API documentation**: Check `/server/README.md`  
**For component usage**: Check `/src/shared/README.md`  
**For quick commands**: Check `QUICK_REFERENCE.md`

## Contributing Documentation

### Adding New ADRs
1. Create new file: `/adr/NNN-title.md`
2. Follow ADR template format
3. Update `/adr/README.md` index

### Updating Directory READMEs
1. Keep focused on directory function
2. Explain relationship to larger project
3. Link to related ADRs
4. No duplication of ADR content

### Migration Tracking
1. Update `/DCS/migration.log.md`
2. Track consolidation progress
3. Archive completed work

## Deprecated Documentation

The following documentation has been consolidated into ADRs:
- ~~`NEW_ARCHITECTURE_README.md`~~ → ADR 010-016
- ~~`LIBRARY_MIGRATION_GUIDE.md`~~ → ADR 010-015
- ~~`MIGRATION_COMPLETE.md`~~ → ADR 010-015
- ~~`BUSINESS_MODEL_AND_COMPETITIVE_ANALYSIS.md`~~ → ADR 008
- ~~`CLEANUP_SUMMARY.md`~~ → ADR 004
- ~~`ml_training_quickstart.md`~~ → ADR 009
- ~~`docs/cache-consolidation-strategy.md`~~ → ADR 001
- ~~`docs/image-gallery-refactoring.md`~~ → ADR 002
- ~~`docs/service-consolidation-plan.md`~~ → ADR 003
