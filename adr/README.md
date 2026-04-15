# Architectural Decision Records (ADR)

This directory contains all architectural decisions extracted from project documentation to prevent documentation sprawl and maintain a single source of truth.

## Structure

- `001-cache-consolidation.md` - Cache service architecture decisions
- `002-image-gallery-refactoring.md` - Image gallery modular architecture
- `003-service-consolidation.md` - Service consolidation strategy
- `004-test-infrastructure.md` - Test framework decisions
- `005-database-schema-strategy.md` - Database schema consolidation
- `006-navigation-architecture.md` - Navigation component decisions
- `007-property-components.md` - Property component architecture
- `008-business-model.md` - Business model and revenue strategy
- `009-ml-training-strategy.md` - ML training and deployment decisions

## ADR Format

Each ADR follows this structure:
- **Status**: Accepted | Deprecated | Superseded
- **Context**: What is the issue we're trying to solve?
- **Decision**: What did we decide?
- **Consequences**: What are the trade-offs?
- **Date**: When was this decided?

## Usage

When making architectural decisions:
1. Create a new ADR with the next number
2. Follow the template format
3. Link to related ADRs
4. Update this README with the new entry
