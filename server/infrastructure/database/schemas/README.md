# Database Schema Consolidation

This directory contains the consolidated database schemas for the TripleCheck application. The schemas have been reorganized from a fragmented structure into a unified, domain-driven architecture.

## 🏗️ Architecture Overview

### Before Consolidation (Fragmented)
```
server/infrastructure/database/schemas/ndex.ts                    # Mixed schemas
server/infrastructure/database/schemas/ # Duplicate schemas
database/schemas/                       # Incomplete schemas
```

### After Consolidation (Unified)
```
database/schemas/
├── consolidated.ts          # Single import point for all schemas
├── core/                   # Core business entities
├── verification/           # Land verification system
├── trust/                  # Trust and reputation system
├── fraud/                  # Fraud detection system
├── communication/          # Messaging and notifications
├── analytics/              # Analytics and reporting
└── validation.ts           # Schema validation utilities
```

## 📋 Schema Domains

### Core Domain (`/core/`)
- **users** - User accounts and profiles
- **properties** - Property listings and details
- **reviews** - Property reviews and ratings
- **favorites** - User favorites and bookmarks
- **propertyViews** - Property view tracking
- **transactions** - Property transactions
- **statistics** - System metrics and analytics
- **professionals** - Professional service providers

### Verification Domain (`/verification/`)
- **landVerificationSessions** - Land verification workflows
- **verificationLayers** - Multi-layer verification process
- **riskFactors** - Risk assessment data
- **governmentDesignations** - Government land designations
- **communityFeedback** - Community intelligence
- **expertAssignments** - Expert coordination

### Trust Domain (`/trust/`)
- Trust scoring and reputation management
- Community-based verification
- Fraud detection integration

### Fraud Domain (`/fraud/`)
- Fraud detection algorithms
- Suspicious activity monitoring
- Case management

### Communication Domain (`/communication/`)
- Real-time messaging
- Notifications and alerts
- Multi-channel communication

### Analytics Domain (`/analytics/`)
- Performance metrics
- Business intelligence
- Reporting and dashboards

## 🚀 Getting Started

### 1. Import Schemas

**New Way (Recommended):**
```typescript
import { users, properties, reviews } from 'database/schemas/consolidated';
```

**Old Way (Deprecated):**
```typescript
import { users, properties, reviews } from 'src/shared/schema';
```

### 2. Run Schema Consolidation

```bash
# Consolidate fragmented schemas into unified structure
npm run db:consolidate

# Set up database with consolidated schemas
npm run db:setup

# Generate and run migrations
npm run db:generate
npm run db:migrate
```

### 3. Validate Schema Integrity

```bash
# Validate all schemas
npm run db:validate

# Check database status
npm run db:status

# Test database connection
npm run db:test-connection
```

## 🔧 Migration Process

The consolidation process includes:

1. **Schema Unification** - Merge fragmented schemas into domain-specific modules
2. **Table Creation** - Create missing critical tables (professionals, transactions, etc.)
3. **Index Optimization** - Add performance-optimized indexes
4. **Constraint Addition** - Ensure referential integrity
5. **Validation** - Comprehensive schema validation

### Critical Tables Added

- **professionals** - Professional service provider directory
- **transactions** - Property transaction tracking
- **statistics** - System metrics and KPIs
- **land_verification_sessions** - Land verification workflows
- **verification_layers** - Multi-layer verification process
- **risk_factors** - Risk assessment and scoring
- **government_designations** - Official land designations
- **community_feedback** - Community intelligence gathering
- **expert_assignments** - Expert coordination and management

## 📊 Performance Optimizations

### Indexes Added
- **Composite Indexes** - Multi-column indexes for common query patterns
- **Partial Indexes** - Filtered indexes for specific conditions
- **JSONB GIN Indexes** - Full-text search on JSON fields
- **Expression Indexes** - Computed value indexes

### Query Optimizations
- **Prepared Statements** - Cached query plans
- **Connection Pooling** - Optimized connection management
- **Query Limits** - Automatic LIMIT injection for runaway queries

## 🔒 Security Features

### Data Protection
- **Column-level Encryption** - Sensitive data encryption
- **Access Control** - Role-based permissions
- **Audit Logging** - Comprehensive activity tracking

### Compliance
- **GDPR Compliance** - Data privacy and right-to-be-forgotten
- **Regulatory Reporting** - Automated compliance reports

## 🧪 Testing

### Schema Validation
```bash
# Run comprehensive schema tests
npm run test:integration

# Test specific schema domains
npm run test:land-verification
npm run test:fraud-detection
```

### Data Generation
```bash
# Generate test data for all schemas
npm run data:generate

# Generate Kenya-specific test data
npm run data:properties
npm run data:users
```

## 📈 Monitoring

### Health Checks
- **Connection Health** - Real-time connection monitoring
- **Query Performance** - Slow query detection
- **Schema Integrity** - Continuous validation

### Metrics
- **Query Latency** - Sub-50ms average response time
- **Connection Pool** - Optimal utilization tracking
- **Error Rates** - Comprehensive error monitoring

## 🔄 Migration Guide

### For Developers

1. **Update Imports**
   ```typescript
   // Old
   import { users } from 'src/shared/schema';
   
   // New
   import { users } from 'database/schemas/consolidated';
   ```

2. **Use New Tables**
   ```typescript
   // Access new professional directory
   import { professionals } from 'database/schemas/consolidated';
   
   // Use land verification system
   import { landVerificationSessions } from 'database/schemas/consolidated';
   ```

3. **Leverage New Features**
   ```typescript
   // Use enhanced query validation
   import { insertPropertySchema } from 'database/schemas/consolidated';
   
   // Access comprehensive relationships
   import { propertiesRelations } from 'database/schemas/consolidated';
   ```

### For Operations

1. **Run Consolidation**
   ```bash
   npm run db:consolidate
   ```

2. **Validate Results**
   ```bash
   npm run db:validate
   ```

3. **Monitor Performance**
   ```bash
   npm run monitor:start
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Import Errors**
   - Ensure you're importing from `database/schemas/consolidated`
   - Check for circular dependencies

2. **Missing Tables**
   - Run `npm run db:consolidate` to create missing tables
   - Verify database connection

3. **Performance Issues**
   - Check index usage with `EXPLAIN ANALYZE`
   - Monitor connection pool utilization

### Support

For issues with schema consolidation:
1. Check the consolidation logs
2. Validate schema integrity
3. Review the migration results
4. Contact the development team

## 📚 Additional Resources

- [Database Architecture Guide](../docs/database-architecture.md)
- [Performance Optimization Guide](../docs/performance-optimization.md)
- [Security Best Practices](../docs/security-guide.md)
- [Migration Procedures](../docs/migration-procedures.md)

---

**Status**: ✅ Production Ready  
**Last Updated**: Current  
**Maintainer**: Database Team