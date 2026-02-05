# Kenya Land Verification System - Data Migration & Seeding

This directory contains comprehensive data migration and seeding scripts for the Kenya Land Verification System. These scripts handle migrating existing properties, seeding realistic test data, validating data integrity, and providing rollback capabilities.

## 📁 Files Overview

### Core Migration Scripts

- **`run-migration.ts`** - Main orchestrator script that runs the complete migration process
- **`migrate-existing-properties.ts`** - Migrates existing properties to support land verification
- **`seed-kenya-properties.ts`** - Seeds realistic Kenya property scenarios for testing
- **`validate-migration.ts`** - Validates data integrity and migration accuracy
- **`rollback-migration.ts`** - Provides rollback procedures for failed migrations
- **`test-migration.ts`** - Comprehensive testing suite for migration integrity

## 🚀 Quick Start

### Complete Migration (Recommended)

Run the full migration process with all steps:

```bash
tsx scripts/data-migration/run-migration.ts
```

This will:
1. Migrate existing properties for land verification
2. Seed realistic Kenya property test data
3. Validate all migrated data
4. Run comprehensive tests
5. Create backups for safety

### Custom Migration

Skip specific steps as needed:

```bash
# Skip test data seeding
tsx scripts/data-migration/run-migration.ts --no-seed

# Skip comprehensive tests (faster)
tsx scripts/data-migration/run-migration.ts --no-tests

# Only migrate existing properties
tsx scripts/data-migration/run-migration.ts --no-seed --no-tests --no-validate
```

## 📋 Individual Scripts

### 1. Migrate Existing Properties

Converts existing properties to support land verification:

```bash
tsx scripts/data-migration/migrate-existing-properties.ts
```

**What it does:**
- Identifies land-related properties (houses, land plots, high-value properties)
- Creates initial land verification sessions
- Updates property features with verification flags
- Handles properties with coordinates, land keywords, or significant value

### 2. Seed Kenya Properties

Creates realistic Kenya property scenarios for testing:

```bash
tsx scripts/data-migration/seed-kenya-properties.ts
```

**What it creates:**
- 5 Kenya-specific test users (Nairobi, Karen, Mombasa, Kisumu, Nakuru)
- 6 realistic properties (agricultural land, residential plots, beachfront, commercial)
- Complete verification sessions with different statuses
- Risk factors, government designations, community feedback
- Expert assignments and monitoring configurations

### 3. Validate Migration

Ensures data integrity and accuracy:

```bash
tsx scripts/data-migration/validate-migration.ts
```

**Validation checks:**
- Required field validation
- Data type and range validation
- Referential integrity checks
- Business rule validation
- Orphaned record detection

### 4. Test Migration

Comprehensive testing suite:

```bash
tsx scripts/data-migration/test-migration.ts
```

**Test suites:**
- Database connectivity
- Schema validation
- Migration functionality
- Data seeding
- Performance testing
- Rollback functionality

### 5. Rollback Migration

Provides rollback capabilities for failed migrations:

```bash
# Full rollback (removes all land verification data)
tsx scripts/data-migration/rollback-migration.ts full

# Partial rollback (removes data from last 24 hours)
tsx scripts/data-migration/rollback-migration.ts partial

# Only revert property changes
tsx scripts/data-migration/rollback-migration.ts properties

# Only remove verification sessions
tsx scripts/data-migration/rollback-migration.ts sessions

# List available backups
tsx scripts/data-migration/rollback-migration.ts list-backups
```

## 🏗️ Migration Process Details

### Property Migration Logic

The migration identifies land-related properties using these criteria:

1. **Property Type**: `land` or `house` types
2. **Keywords**: Title/description contains "acres", "hectares", "plot", "land", "farm", "ranch"
3. **Coordinates**: Properties with GPS coordinates (suggests surveyed land)
4. **Value**: Properties over 20M KES (likely include significant land)

### Test Data Scenarios

The seeding creates realistic scenarios including:

- **Kiambu Agricultural Land**: 5 acres with coffee farming potential
- **Karen Residential Plot**: Premium 1-acre plot with mature trees
- **Kilifi Beachfront**: 2 acres with 200m beach frontage
- **Kisumu Commercial**: 0.5 acres in CBD for development
- **Nakuru Agricultural**: 10 acres for large-scale farming
- **Runda Family Home**: 4-bedroom house on 0.75 acres

Each property includes:
- Realistic verification sessions at different stages
- Appropriate risk factors (boundary disputes, government designations)
- Community feedback from local sources
- Expert assignments (surveyors, lawyers, appraisers)
- Monitoring configurations

## 🔍 Data Validation

The validation system checks:

### Property Validation
- Required fields (title, description, location, price)
- Land verification eligibility flags
- Coordinate format validation
- Price reasonableness

### Session Validation
- Valid property and user references
- Risk score ranges (0-100)
- Confidence ranges (0.00-1.00)
- Status consistency

### Referential Integrity
- Foreign key relationships
- Orphaned record detection
- Cascade deletion compliance

## 🛡️ Safety Features

### Backup System
- Automatic backup creation before major operations
- Timestamped backup tables
- Rollback capability to any backup point

### Error Handling
- Comprehensive error logging
- Graceful failure handling
- Detailed error reporting
- Recovery procedures

### Validation Gates
- Pre-migration validation
- Post-migration verification
- Continuous integrity checks

## 📊 Monitoring & Reporting

### Migration Statistics
- Properties processed and migrated
- Sessions and layers created
- Risk factors and designations added
- Error counts and success rates

### Performance Metrics
- Query execution times
- Database operation performance
- Memory usage tracking
- Bottleneck identification

### Validation Reports
- Data integrity status
- Referential integrity checks
- Business rule compliance
- Issue categorization and prioritization

## 🚨 Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
tsx scripts/data-migration/test-migration.ts
```

**Migration Failures**
```bash
# Check validation first
tsx scripts/data-migration/validate-migration.ts

# Run with detailed logging
DEBUG=true tsx scripts/data-migration/run-migration.ts
```

**Performance Issues**
```bash
# Run performance tests
tsx scripts/data-migration/test-migration.ts

# Check database indexes
tsx scripts/inspect-schema.ts
```

### Recovery Procedures

**Failed Migration Recovery**
1. Check error logs for specific issues
2. Run validation to identify problems
3. Fix data issues manually if needed
4. Re-run migration with `--no-seed` if data exists
5. Use rollback if complete reset needed

**Data Corruption Recovery**
1. Stop all operations immediately
2. List available backups
3. Choose appropriate backup point
4. Execute rollback to backup
5. Investigate corruption cause
6. Re-run migration with fixes

## 🔧 Configuration

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional
NODE_ENV=development|production
FORCE_ROLLBACK=true  # Allow production rollbacks
DEBUG=true           # Enable detailed logging
```

### Migration Options

The migration system supports various configuration options:

```typescript
interface MigrationPlan {
  migrateExisting: boolean;    // Migrate existing properties
  seedTestData: boolean;       // Create test data
  validateData: boolean;       // Run validation
  runTests: boolean;          // Execute test suite
  createBackup: boolean;      // Create safety backups
}
```

## 📈 Best Practices

### Before Migration
1. **Backup Database**: Always create a full database backup
2. **Test Environment**: Run migration in staging first
3. **Check Dependencies**: Ensure all required tables exist
4. **Validate Environment**: Confirm DATABASE_URL and permissions

### During Migration
1. **Monitor Progress**: Watch logs for errors or warnings
2. **Check Performance**: Monitor database performance
3. **Validate Incrementally**: Run validation at each step
4. **Handle Errors Gracefully**: Don't ignore warnings

### After Migration
1. **Run Full Validation**: Ensure data integrity
2. **Test Functionality**: Verify land verification features work
3. **Monitor Performance**: Check query performance
4. **Document Changes**: Record migration details and issues

### Production Deployment
1. **Schedule Downtime**: Plan for maintenance window
2. **Notify Users**: Inform users of potential disruption
3. **Monitor Closely**: Watch for issues post-migration
4. **Have Rollback Ready**: Prepare rollback procedures
5. **Test Thoroughly**: Verify all functionality works

## 📞 Support

For issues or questions:

1. **Check Logs**: Review migration logs for specific errors
2. **Run Diagnostics**: Use test and validation scripts
3. **Review Documentation**: Check this README and code comments
4. **Check Database**: Verify database state and connectivity

## 🔄 Version History

- **v1.0.0**: Initial migration system with full functionality
- Comprehensive property migration
- Realistic Kenya property seeding
- Full validation and testing suite
- Rollback and recovery capabilities
- Production-ready safety features