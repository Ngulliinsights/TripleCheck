# Database Migration System

This directory contains the reorganized database migration system with proper versioning, dependency tracking, and rollback capabilities.

## 🏗️ Architecture Overview

The new migration system consists of several key components:

```
database/migrations/
├── migration-registry.ts    # Central registry for all migrations
├── migration-loader.ts      # Loads migrations from files
├── migration-executor.ts    # Executes migrations with transactions
├── migration-cli.ts         # Command-line interface
├── index.ts                 # Main exports and legacy compatibility
├── core/                    # Core database migrations
├── verification/            # Land verification system migrations
├── trust/                   # Trust system migrations
├── fraud/                   # Fraud detection migrations
├── communication/           # Communication system migrations
├── analytics/               # Analytics migrations
└── performance/             # Performance optimization migrations
```

## 📋 Migration File Format

Migration files follow a standardized format with metadata and SQL sections:

```sql
-- @name: Migration Name
-- @description: Detailed description of what this migration does
-- @author: system
-- @timestamp: 2024-01-01T00:00:00.000Z
-- @tags: core, tables, initial
-- @dependencies: core_001_initial_schema

-- @up start
-- SQL for applying the migration
CREATE TABLE example (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
-- @up end

-- @down start
-- SQL for rolling back the migration
DROP TABLE IF EXISTS example;
-- @down end

-- @validate start
-- SQL for validating the migration was applied correctly
SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'example';
-- @validate end
```

## 🚀 Usage

### Basic Commands

```bash
# Run all pending migrations
npm run migrate

# Show migration status
npm run migrate:status

# Validate migration integrity
npm run migrate:validate

# List all migrations
npm run migrate:list

# List pending migrations
npm run migrate:list-pending

# List applied migrations
npm run migrate:list-applied

# Rollback a specific migration
npm run migrate:rollback core_001_initial_schema

# Show help
npm run migrate:help
```

### Advanced Commands

```bash
# Dry run (show what would be executed)
npm run migrate:dry-run

# Verbose output
npm run migrate:verbose

# List migrations by domain
npm run migrate:list --domain=core
npm run migrate:list --domain=verification

# Initialize migration tracking table
npm run migrate:init

# Reload migrations from files
npm run migrate:reload
```

## 📝 Creating New Migrations

### 1. File Naming Convention

Migration files must follow the naming pattern: `###_description.sql`

- `###` - Three-digit version number (001, 002, etc.)
- `description` - Snake_case description of the migration

Examples:
- `001_create_initial_tables.sql`
- `002_add_user_indexes.sql`
- `003_create_verification_system.sql`

### 2. Domain Organization

Place migration files in the appropriate domain directory:

- `core/` - Core database tables and structures
- `verification/` - Land verification system
- `trust/` - Trust and reputation system
- `fraud/` - Fraud detection system
- `communication/` - Messaging and notifications
- `analytics/` - Analytics and reporting
- `performance/` - Performance optimizations

### 3. Migration Metadata

Always include proper metadata in your migration files:

```sql
-- @name: Human-readable migration name
-- @description: Detailed description of changes
-- @author: Your name or 'system'
-- @timestamp: ISO timestamp (2024-01-01T00:00:00.000Z)
-- @tags: Comma-separated tags (core, tables, indexes)
-- @dependencies: Comma-separated list of required migrations
```

### 4. SQL Sections

#### @up section (Required)
Contains the SQL to apply the migration:

```sql
-- @up start
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL
);
-- @up end
```

#### @down section (Optional but Recommended)
Contains the SQL to rollback the migration:

```sql
-- @down start
DROP TABLE IF EXISTS users;
-- @down end
```

#### @validate section (Optional)
Contains SQL to validate the migration was applied correctly:

```sql
-- @validate start
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN 'PASS'
        ELSE 'FAIL'
    END as result
FROM information_schema.tables 
WHERE table_name = 'users';
-- @validate end
```

## 🔄 Migration Lifecycle

### 1. Discovery
The migration loader scans domain directories for `.sql` files and parses their metadata.

### 2. Registration
Migrations are registered in the central registry with dependency validation.

### 3. Execution Order
Migrations are executed in dependency order, respecting domain priorities:
1. core
2. verification
3. trust
4. fraud
5. communication
6. analytics
7. performance

### 4. Transaction Safety
Each migration runs in its own transaction with savepoints for rollback safety.

### 5. Tracking
Applied migrations are recorded in the `migration_history` table with:
- Execution time
- Success/failure status
- Checksum validation
- Error messages (if any)

## 🛡️ Safety Features

### Dependency Validation
- Circular dependency detection
- Missing dependency validation
- Execution order enforcement

### Checksum Validation
- Prevents modification of applied migrations
- Detects file corruption or tampering
- Ensures migration integrity

### Transaction Safety
- Each migration runs in a transaction
- Savepoints for granular rollback
- Automatic rollback on failure

### Rollback Support
- Optional rollback SQL for each migration
- Dependency-aware rollback prevention
- Safe rollback validation

## 📊 Migration Status

The migration system provides comprehensive status reporting:

```
📊 MIGRATION STATUS REPORT
================================================================================

📈 SUMMARY:
   Total Migrations: 15
   Applied Successfully: 12
   Pending: 3
   Failed: 0

📁 BY DOMAIN:
   CORE: 5/5 applied (0 pending)
   VERIFICATION: 4/5 applied (1 pending)
   TRUST: 2/3 applied (1 pending)
   FRAUD: 1/2 applied (1 pending)

⏳ PENDING MIGRATIONS:
   📄 verification_005_add_risk_scoring - Add Risk Scoring System
   📄 trust_003_community_endorsements - Community Endorsement System
   📄 fraud_002_pattern_detection - Advanced Pattern Detection
```

## 🔧 Troubleshooting

### Common Issues

1. **Migration fails with dependency error**
   ```bash
   npm run migrate:validate
   npm run migrate:list-pending
   ```

2. **Checksum mismatch error**
   - Migration file was modified after being applied
   - Check git history for changes
   - Consider creating a new migration instead

3. **Rollback not supported**
   - Migration doesn't have `@down` section
   - Add rollback SQL or create compensating migration

4. **Circular dependency detected**
   ```bash
   npm run migrate:validate
   ```
   - Review migration dependencies
   - Remove circular references

### Recovery Procedures

1. **Reset migration state** (Development only)
   ```sql
   TRUNCATE migration_history;
   ```

2. **Mark migration as applied** (Emergency only)
   ```sql
   INSERT INTO migration_history (id, name, domain, version, checksum, execution_time_ms, success)
   VALUES ('migration_id', 'Migration Name', 'domain', '001', 'checksum', 0, true);
   ```

3. **Force reload migrations**
   ```bash
   npm run migrate:reload
   ```

## 🔄 Legacy Compatibility

The new system maintains backward compatibility with the old migration system:

- `MigrationManager` class still works (with deprecation warnings)
- Existing migration scripts continue to function
- Gradual migration path to new system

## 📚 Best Practices

1. **Always include rollback SQL** for production migrations
2. **Test migrations** on a copy of production data
3. **Use descriptive names** and comprehensive descriptions
4. **Keep migrations small** and focused on single changes
5. **Validate dependencies** before creating new migrations
6. **Use transactions** for complex multi-statement migrations
7. **Document breaking changes** in migration descriptions
8. **Test rollbacks** before deploying to production

## 🎯 Migration Strategy

### Development
- Create migrations for each feature branch
- Test migrations locally before merging
- Use dry-run to validate migration plans

### Staging
- Apply migrations in staging environment first
- Validate application functionality after migrations
- Test rollback procedures

### Production
- Schedule migrations during maintenance windows
- Have rollback plan ready
- Monitor application after migration
- Keep database backups before major migrations