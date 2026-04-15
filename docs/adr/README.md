# Architectural Decision Records (ADR)

This directory contains all architectural decisions extracted from project documentation to prevent documentation sprawl and maintain a single source of truth.

## Structure

### Frontend Architecture
- `002-image-gallery-refactoring.md` - Image gallery modular architecture
- `006-navigation-architecture.md` - Navigation component decisions
- `007-property-components.md` - Property component architecture

### Backend Architecture
- `001-cache-consolidation.md` - Cache service architecture decisions
- `003-service-consolidation.md` - Service consolidation strategy
- `005-database-schema-strategy.md` - Database schema consolidation
- `016-layered-architecture.md` - Layered architecture pattern

### Infrastructure & Libraries
- `010-observability-stack.md` - Pino and OpenTelemetry for logging/metrics
- `011-http-client-resilience.md` - Axios, Opossum, and Keyv for HTTP
- `012-authentication-authorization.md` - Passport.js and CASL
- `013-realtime-communication.md` - Socket.IO for WebSockets
- `014-schema-validation.md` - Zod for validation
- `015-rate-limiting.md` - express-rate-limit

### Testing & Quality
- `004-test-infrastructure.md` - Test framework decisions

### Business & Strategy
- `008-business-model.md` - Business model and revenue strategy
- `009-ml-training-strategy.md` - ML training and deployment decisions

## Library Migration (ADR 010-015)

The application migrated from custom implementations to industry-standard libraries:

**Results**:
- Reduced code by 3,500 lines (23%)
- Improved logging performance by 5x
- Increased HTTP success rate from 70% to 95%
- Reduced memory usage by 28%

See individual ADRs for details on each library decision.

## ADR Format

Each ADR follows this structure:
- **Status**: Accepted | Deprecated | Superseded
- **Date**: When was this decided?
- **Context**: What is the issue we're trying to solve?
- **Decision**: What did we decide?
- **Consequences**: What are the trade-offs?
- **References**: Links to documentation

## Usage

When making architectural decisions:
1. Create a new ADR with the next number
2. Follow the template format
3. Link to related ADRs
4. Update this README with the new entry
