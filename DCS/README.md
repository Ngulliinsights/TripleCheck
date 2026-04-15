# Documentation Consolidation System (DCS)

This directory contains consolidated documentation and migration tracking to prevent documentation sprawl across the codebase.

## Purpose

The DCS serves as:
1. **Single source of truth** for project documentation
2. **Migration tracking** for ongoing consolidation efforts
3. **Archive** for completed work and decisions

## Structure

- `migration.log.md` - Ongoing migration and consolidation tracking
- `archive/` - Completed documentation for reference
- `decisions/` - Links to ADR (Architectural Decision Records)

## Documentation Philosophy

**One README per major directory** explaining:
- Directory's function
- Relationship to larger project
- Key components and their purpose
- How to use/extend the code

**No documentation sprawl**:
- No multiple README files in subdirectories
- No standalone documentation files scattered across codebase
- All strategic decisions go in ADR
- All migration tracking goes in DCS

## Related Systems

- `/adr/` - Architectural Decision Records
- `/docs/` - Technical documentation (consolidated)
- Individual directory READMEs - Functional documentation only
