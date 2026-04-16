# Documentation

Technical documentation for the AfricanPropertyTrust platform.

---

## 📚 Documentation Structure

```
/docs/
├── README.md                          # This file - documentation index
├── LOGGING_GUIDE.md                  # Consolidated logging documentation
├── QUICK_REFERENCE.md                # Quick reference guide
├── COMPLETE_DEMO_READINESS_SUMMARY.md # Current demo status
├── project-structure.md              # Auto-generated project tree
│
├── adr/                              # Architectural Decision Records
│   ├── README.md
│   ├── 001-cache-consolidation.md
│   ├── 002-image-gallery-refactoring.md
│   ├── 003-service-consolidation.md
│   ├── 004-test-infrastructure.md
│   ├── 005-database-schema-strategy.md
│   ├── 006-navigation-architecture.md
│   ├── 007-property-components.md
│   ├── 008-business-model.md
│   ├── 009-ml-training-strategy.md
│   ├── 010-observability-stack.md
│   ├── 011-http-client-resilience.md
│   ├── 012-authentication-architecture.md
│   ├── 013-realtime-communication.md
│   ├── 014-schema-validation.md
│   ├── 015-rate-limiting.md
│   ├── 016-layered-architecture.md
│   ├── 017-server-app-module-pattern.md
│   └── 018-logging-architecture.md
│
├── standards/                        # Coding standards & conventions
│   └── NAMING_CONVENTIONS.md
│
├── dcs/                              # Documentation Consolidation System
│   ├── README.md
│   ├── migration.log.md
│   └── CONSOLIDATION_COMPLETE.md
│
└── archive/                          # Historical documentation
    ├── DEMO_READINESS_FIXES.md
    ├── DEMO_READY_CHECKLIST.md
    ├── project-demo-readiness-analysis.md
    ├── project-demo-readiness-audit-results.md
    └── POST_DEMO_IMPROVEMENTS_COMPLETE.md
```

---

## 🎯 Quick Navigation

### Architectural Decisions
**Core Infrastructure**:
- [ADR 010: Observability Stack](adr/010-observability-stack.md) - Pino + OpenTelemetry + Prometheus
- [ADR 018: Logging Architecture](adr/018-logging-architecture.md) - Unified logging system
- [ADR 012: Authentication](adr/012-authentication-architecture.md) - Passport.js + CASL

**Communication & Real-time**:
- [ADR 013: Real-time Communication](adr/013-realtime-communication.md) - Socket.IO integration

**Data & Validation**:
- [ADR 014: Schema Validation](adr/014-schema-validation.md) - Zod validation framework
- [ADR 005: Database Schema Strategy](adr/005-database-schema-strategy.md)

**Backend Architecture**:
- [ADR 016: Layered Architecture](adr/016-layered-architecture.md)
- [ADR 017: Server App Module Pattern](adr/017-server-app-module-pattern.md)
- [ADR 001: Cache Consolidation](adr/001-cache-consolidation.md)
- [ADR 003: Service Consolidation](adr/003-service-consolidation.md)

**Frontend Architecture**:
- [ADR 002: Image Gallery Refactoring](adr/002-image-gallery-refactoring.md)
- [ADR 006: Navigation Architecture](adr/006-navigation-architecture.md)
- [ADR 007: Property Components](adr/007-property-components.md)

**Testing & Quality**:
- [ADR 004: Test Infrastructure](adr/004-test-infrastructure.md)

**Business & Strategy**:
- [ADR 008: Business Model](adr/008-business-model.md)
- [ADR 009: ML Training Strategy](adr/009-ml-training-strategy.md)

### Reference Documents
- [LOGGING_GUIDE.md](LOGGING_GUIDE.md) - Complete logging documentation (consolidated from 3 sources)
- [NAMINGS_CONVENTIONS.md](standards/NAMING_CONVENTIONS.md) - File naming standards and patterns
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common commands and workflows
- [project-structure.md](project-structure.md) - Auto-generated project directory tree

### Documentation System
- [DCS README](dcs/README.md) - Documentation Consolidation System overview
- [Migration Log](dcs/migration.log.md) - Ongoing migration tracking
- [Consolidation Status](dcs/CONSOLIDATION_COMPLETE.md) - Phase 1 completion summary

### Historical Documentation (Archive)
- [Consolidated Demo Readiness](archive/DEMO_READINESS_FIXES.md) - All demo-related fixes
- [Demo Ready Checklist](archive/DEMO_READY_CHECKLIST.md) - Pre-demo verification steps
- [Demo Readiness Analysis](archive/project-demo-readiness-analysis.md) - Original analysis
- [Demo Audit Results](archive/project-demo-readiness-audit-results.md) - Verification results
- [Post-Demo Improvements](archive/POST_DEMO_IMPROVEMENTS_COMPLETE.md) - Completed improvements

---

## 📖 Documentation Principles

1. **Strategic decisions** → `/adr/` (Architectural Decision Records)
2. **Coding standards** → `/standards/` (conventions, patterns)
3. **Migration tracking** → `/dcs/` (consolidation progress)
4. **Historical docs** → `/archive/` (completed work, analysis)
5. **Functional documentation** → Directory READMEs (module-specific)
6. **Single source of truth** → No duplication across sections
7. **No sprawl** → Consolidate systematically, don't proliferate

---

## 🔍 Finding Information

| Looking for... | Check... |
|--- |---|
| Architectural decisions | `/adr/` directory |
| Logging implementation | [LOGGING_GUIDE.md](LOGGING_GUIDE.md) |
| Naming conventions | [standards/NAMING_CONVENTIONS.md](standards/NAMING_CONVENTIONS.md) |
| Quick reference | [QUICK_REFERENCE.md](QUICK_REFERENCE.md) |
| Library choices | ADR 010-015 (Infrastructure & Libraries) |
| Module functionality | Directory READMEs (`/src/README.md`, `/server/README.md`, etc.) |
| Migration status | [dcs/migration.log.md](dcs/migration.log.md) |
| Demo status | [COMPLETE_DEMO_READINESS_SUMMARY.md](COMPLETE_DEMO_READINESS_SUMMARY.md) |
| Historical analysis | `/archive/` directory |

---

## ✍️ Contributing Documentation

### Adding New ADRs
1. Create `/adr/NNN-title.md` (use next available number)
2. Follow [ADR template](#adr-template-structure) format
3. Update `/adr/README.md` with new entry
4. Link from related directory READMEs

### Updating Directory READMEs
1. Keep focused on directory's function
2. Explain relationship to larger project
3. Link to related ADRs (don't duplicate)
4. Include usage examples where helpful

### Adding Standards
1. Create `/standards/NAME.md`
2. Include examples (correct/incorrect patterns)
3. Link from relevant ADRs
4. Reference in related READMEs

### Migration Tracking
1. Update `/dcs/migration.log.md`
2. Track consolidation progress
3. Archive completed work in `/archive/`

### ADR Template Structure
```markdown
# ADR NNN: Title

**Status**: Accepted | Pending | Deprecated  
**Date**: YYYY-MM-DD  

## Context
Why are we making this decision?

## Decision
What did we decide?

## Rationale
Why did we choose this?

## Consequences
What are the trade-offs and impacts?

## References
Related documents, links, examples
```

---

## 📊 Documentation Statistics

- **ADRs**: 18 (strategic decisions)
- **Standards**: 1 organized directory
- **DCS Files**: 3 (consolidation tracking)
- **Archive Files**: 5 (historical documentation)
- **Root Docs**: 5 (README, guides, summaries)
- **Duplication**: Eliminated
- **Sprawl**: Consolidated

---

## 🚀 Recent Consolidation

**Phase 1 Completed** (2026-04-15):
- ✅ Extracted 18 Architectural Decision Records
- ✅ Consolidated 3 logging files into `LOGGING_GUIDE.md`
- ✅ Created unified `LOGGING_GUIDE.md` with architecture diagram
- ✅ Extracted server architecture to `ADR-017`
- ✅ Created logging architecture `ADR-018`
- ✅ Organized documentation into `/adr/`, `/standards/`, `/dcs/`, `/archive/` directories
- ✅ Eliminated documentation sprawl and duplication

**Key Metrics**:
- 24 root-level docs → 5 organized at root + 4 subdirectories
- 3 scattered logging docs → 1 consolidated guide
- Single source of truth for all documentation

---

## 📞 Questions?

- **How does logging work?** → [LOGGING_GUIDE.md](LOGGING_GUIDE.md)
- **What are the naming conventions?** → [standards/NAMING_CONVENTIONS.md](standards/NAMING_CONVENTIONS.md)
- **Why did we choose this architecture?** → Check `/adr/` files
- **What's the current status?** → [COMPLETE_DEMO_READINESS_SUMMARY.md](COMPLETE_DEMO_READINESS_SUMMARY.md)
- ~~`docs/cache-consolidation-strategy.md`~~ → ADR 001
- ~~`docs/image-gallery-refactoring.md`~~ → ADR 002
- ~~`docs/service-consolidation-plan.md`~~ → ADR 003
