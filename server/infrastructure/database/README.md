# Database Infrastructure

This directory contains the complete database infrastructure for TripleCheck, organized following clean architecture principles with clear separation of concerns.

## 📁 Directory Structure

```
server/infrastructure/database/
├── 📁 config/                    # Database configuration
│   └── database.config.ts        # Environment-based database configuration
├── 📁 migrations/                # Database schema migrations
│   ├── files/                    # SQL migration files
│   ├── meta/                     # Migration metadata
│   └── migrator.ts               # Migration management system
├── 📁 seeds/                     # Database seeding
│   ├── database-seeder.ts        # Master seeding orchestrator
│   ├── land-verification-seed.ts # Land verification sample data
│   └── sample-ai-data.ts         # AI verification sample data
├── 📁 types/                     # Database type definitions
│   └── database.types.ts         # Comprehensive database types
├── 📁 utils/                     # Database utilities
│   └── database-utils.ts         # Common database operations
├── connection.ts                 # Enhanced database connection management
├── index.ts                      # Central exports
├── init.ts                       # Database initialization system
├── integration.ts                # Full-stack integration layer
├── legacy-database.ts            # Legacy database utilities (backward compatibility)
└── QueryOptimizer.ts            # Database query optimization
```

## 🚀 Quick Start

### Initialize Database
```typescript
import { initializeDatabase } from './server/infrastructure/database';

// Full initialization with migrations and seeding
const result = await initializeDatabase({
  runMigrations: true,
  seedData: true,
  environment: 'development'
});
```

### Check Database Health
```typescript
import { checkDatabaseStatus } from './server/infrastructure/database';

const status = await checkDatabaseStatus();
console.log('Database healthy:', status.healthy);
```

### Use Database Connection
```typescript
import { DatabaseConnection } from './server/infrastructure/database';

const dbConnection = DatabaseConnection.getInstance();
await dbConnection.connect();
const db = dbConnection.getDb();
```

## 🔧 Core Components

### 1. Configuration (`config/`)
- **`database.config.ts`**: Environment-based configuration with validation
- Supports development, staging, and production environments
- Includes connection pooling, SSL, and timeout configurations

### 2. Connection Management (`connection.ts`)
- **Enhanced connection handling** with automatic reconnection
- **Connection pooling** with configurable limits
- **Health monitoring** and diagnostics
- **Graceful shutdown** handling
- **Singleton pattern** for consistent connection management

### 3. Migration System (`migrations/`)
- **`migrator.ts`**: Comprehensive migration management
- **`files/`**: SQL migration files with version control
- **Rollback capabilities** for safe schema changes
- **Migration status tracking** and validation

### 4. Seeding System (`seeds/`)
- **`database-seeder.ts`**: Master orchestrator for all seeders
- **`land-verification-seed.ts`**: Kenya-specific land verification data
- **`sample-ai-data.ts`**: AI verification sample data
- **Environment-aware seeding** (skips production)
- **Incremental seeding** with conflict resolution

### 5. Query Optimization (`QueryOptimizer.ts`)
- **Performance monitoring** for slow queries
- **Query caching** with configurable TTL
- **Connection pool monitoring**
- **Automatic query analysis** and recommendations

### 6. Database Utilities (`utils/`)
- **Common operations**: pagination, filtering, batch operations
- **SQL injection prevention** with parameter sanitization
- **Transaction helpers** with automatic rollback
- **Performance metrics** tracking

## 📊 Database Schema

### Core Tables
- **`users`**: User accounts with trust scoring
- **`properties`**: Property listings with verification status
- **`reviews`**: Property reviews and ratings
- **`land_verification_sessions`**: Land verification workflows
- **`verification_layers`**: Multi-layer verification system
- **`community_references`**: Community-based trust references
- **`trust_scores`**: Comprehensive trust scoring system

### Indexes
- **Performance indexes** on frequently queried columns
- **Composite indexes** for complex queries
- **Partial indexes** for conditional data

## 🔒 Security Features

### Connection Security
- **SSL/TLS encryption** for production environments
- **Connection timeout** protection
- **Parameter sanitization** to prevent SQL injection
- **Role-based access control** integration

### Data Protection
- **Audit logging** for all database operations
- **Sensitive data handling** with proper encryption
- **Backup and recovery** procedures
- **Data retention policies**

## 🚀 Performance Optimizations

### Connection Pooling
```typescript
// Configured in database.config.ts
{
  maxConnections: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  acquireTimeoutMillis: 60000
}
```

### Query Optimization
- **Automatic slow query detection** (>1000ms)
- **Query result caching** with intelligent invalidation
- **Connection pool monitoring** and alerts
- **Database statistics** collection

### Caching Strategy
- **Query result caching** for frequently accessed data
- **Connection pooling** to reduce connection overhead
- **Prepared statement caching** for repeated queries

## 🧪 Testing Support

### Test Database Setup
```typescript
import { resetDatabase } from './server/infrastructure/database';

// Reset database for testing (development only)
await resetDatabase();
```

### Mock Data Generation
- **Realistic sample data** for all entities
- **Relationship consistency** across tables
- **Configurable data volumes** for different test scenarios

## 📈 Monitoring & Diagnostics

### Health Checks
```typescript
import { getDatabaseDiagnostics } from './server/infrastructure/database';

const diagnostics = await getDatabaseDiagnostics();
console.log('Database version:', diagnostics.version);
console.log('Database size:', diagnostics.size);
console.log('Slow queries:', diagnostics.slowQueries);
```

### Performance Metrics
- **Response time monitoring**
- **Active connection tracking**
- **Query execution statistics**
- **Error rate monitoring**

## 🔄 Migration Workflow

### Creating Migrations
1. Create SQL file in `migrations/files/`
2. Use sequential numbering: `001_initial_schema.sql`
3. Include both `UP` and `DOWN` migrations
4. Test thoroughly before deployment

### Running Migrations
```bash
# Via CLI
tsx server/infrastructure/database/init.ts init

# Programmatically
import { DatabaseMigrator } from './server/infrastructure/database';
const migrator = new DatabaseMigrator();
await migrator.migrate();
```

## 🌱 Seeding Workflow

### Development Seeding
```typescript
import { databaseSeeder } from './server/infrastructure/database';

// Seed all data
await databaseSeeder.seedAll({
  environment: 'development',
  truncate: true
});

// Seed specific data
await databaseSeeder.seedSpecific('land-verification');
```

### Production Considerations
- **No automatic seeding** in production
- **Manual data migration** procedures
- **Backup before any data changes**

## 🔧 Configuration

### Environment Variables
```bash
# Database connection
DATABASE_URL=postgresql://user:password@host:port/database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=triplecheck
DB_USER=postgres
DB_PASSWORD=your_password

# Connection pool settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Feature flags
DB_ENABLE_QUERY_LOGGING=true
DB_ENABLE_SLOW_QUERY_LOGGING=true
DB_SLOW_QUERY_THRESHOLD=1000
```

### Development vs Production
- **Development**: Full logging, seeding enabled, relaxed timeouts
- **Production**: Minimal logging, no seeding, strict security

## 🚨 Troubleshooting

### Common Issues

#### Connection Failures
```typescript
// Check database health
const health = await checkDatabaseHealth();
if (!health.connected) {
  console.error('Database connection failed');
}
```

#### Slow Queries
```typescript
// Monitor query performance
import { queryOptimizer } from './server/infrastructure/database';
const stats = queryOptimizer.getStats();
console.log('Slow queries:', stats.slowQueries);
```

#### Migration Issues
```typescript
// Check migration status
import { DatabaseMigrator } from './server/infrastructure/database';
const migrator = new DatabaseMigrator();
const status = await migrator.getStatus();
console.log('Pending migrations:', status.pending);
```

## 📚 API Reference

### Core Classes
- **`DatabaseConnection`**: Singleton connection management
- **`DatabaseMigrator`**: Migration system
- **`DatabaseSeeder`**: Seeding orchestrator
- **`QueryOptimizer`**: Performance optimization

### Utility Functions
- **`initializeDatabase()`**: Complete database setup
- **`checkDatabaseStatus()`**: Health monitoring
- **`withDatabase()`**: Safe operation wrapper
- **`withTransaction()`**: Transaction management

## 🔄 Upgrade Path

### From Legacy System
1. **Gradual migration** from `legacy-database.ts`
2. **Update imports** to use new infrastructure
3. **Test thoroughly** in development
4. **Deploy incrementally** to production

### Future Enhancements
- **Read replicas** for scaling
- **Sharding** for large datasets
- **Advanced caching** with Redis
- **Real-time replication** monitoring

## 📞 Support

For database-related issues:
1. **Check logs** in the monitoring system
2. **Run diagnostics** using provided tools
3. **Review configuration** for environment-specific settings
4. **Test connections** using health check utilities

---

This database infrastructure provides a robust, scalable, and maintainable foundation for the TripleCheck application, specifically designed for the complexities of land verification in Kenya while maintaining flexibility for future growth.