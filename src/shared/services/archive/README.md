# Archived API Clients

This directory contains the legacy API client implementations that have been replaced by the unified API client.

## Files

### `api-client.ts` (Original)
- **Features**: Basic HTTP client with caching and retry logic
- **Strengths**: Simple, lightweight, race condition protection
- **Replaced by**: `unified-api-client.ts`
- **Date Archived**: December 2024

### `enhanced-api-client.ts` (Enterprise)
- **Features**: Circuit breaker, rate limiting, security integration
- **Strengths**: Enterprise-grade fault tolerance and monitoring
- **Replaced by**: `unified-api-client.ts` 
- **Date Archived**: December 2024

## Why Archived?

These files are preserved for:
1. **Reference** - Understanding implementation patterns
2. **Emergency Rollback** - If critical issues arise with unified client
3. **Documentation** - Historical context for future developers
4. **Learning** - Examples of different API client approaches

## Migration

All functionality from these clients has been consolidated into:
- `../unified-api-client.ts` - Single, comprehensive API client
- See `../../../docs/api-client-migration.md` for migration guide

## Rollback Instructions

If you need to temporarily rollback:

1. Copy the desired client back to `../`
2. Update imports in affected files
3. Update `../index.ts` exports
4. Run tests to verify functionality

**Note**: Only use for emergency situations. The unified client is the recommended solution.

## Cleanup Schedule

These files can be safely deleted after:
- [ ] 3 months of stable unified client operation
- [ ] All team members familiar with new client
- [ ] No rollback incidents reported
- [ ] Full test coverage verified

**Estimated Cleanup Date**: March 2025