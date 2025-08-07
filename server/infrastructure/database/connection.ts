/**
 * Database Connection Management
 *
 * Centralized database connection handling with connection pooling,
 * health monitoring, and automatic reconnection capabilities
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@server/infrastructure/database/schemas/core";
import * as landVerificationSchema from "@server/infrastructure/database/schemas/land-verification";
import * as communitySchema from "@server/shared/community-trust-schema";
import { cleanupManager } from '../../utils/cleanup-manager';
import { logger } from "../monitoring/logger";

import {
  databaseConfig,
  validateDatabaseConfig,
  buildConnectionString,
} from "./config/database.config";
// Define types locally since database.types may not exist
interface DatabaseHealthCheck {
  status: "healthy" | "unhealthy";
  responseTime: number;
  activeConnections: number;
  maxConnections: number;
  diskUsage: number;
  memoryUsage: number;
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  planningTime: number;
  rowsReturned: number;
  rowsExamined: number;
  indexesUsed: string[];
  timestamp: Date;
}

// Validate configuration on startup
validateDatabaseConfig();

// Build connection string from configuration
const DATABASE_URL = process.env.DATABASE_URL || buildConnectionString();

// Optimized connection configuration for better performance
const connectionConfig = {
  max: process.env.NODE_ENV === 'production' ? 20 : 10, // Increase pool size for production
  idle_timeout: 20,
  connect_timeout: 30, // Increase timeout for Neon connections
  prepare: false,
  onnotice: () => {}, // Disable notice logging to reduce overhead
  ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true' ? 'require' : false,
  // Add connection pooling optimizations
  max_lifetime: 60 * 30, // 30 minutes max connection lifetime
  transform: {
    undefined: null, // Transform undefined to null for better PostgreSQL compatibility
  },
  // Enable connection reuse
  connection: {
    application_name: 'triplecheck_api',
  },
};

// Create connection with retry logic
let sql: postgres.Sql | undefined;
let db: ReturnType<typeof drizzle> | undefined;

export async function initializeDatabase() {
  try {
    logger.info("Initializing database connection...", "DATABASE");

    sql = postgres(DATABASE_URL, connectionConfig);
    db = drizzle(sql, {
      schema: { ...schema, ...landVerificationSchema, ...communitySchema },
      logger:
        process.env.NODE_ENV === "development" ?
          {
            logQuery: (query: string, params: unknown[]) => {
              logger.debug("Database query", "DATABASE", { query, params });
            },
          }
        : false,
    });

    // Test the connection with timeout
    await Promise.race([
      sql`SELECT 1 as connection_test`,
      new Promise((resolve, reject) =>
        setTimeout(() => reject(new Error("Connection test timeout")), 15000)
      ),
    ]);

    logger.info("Database connection established successfully", "DATABASE", {
      host: databaseConfig.host,
      database: databaseConfig.database,
      maxConnections: databaseConfig.maxConnections,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to initialize database", "DATABASE", { error });
    return { success: false, error };
  }
}

// Get database instance with connection check
export function getDatabase() {
  if (!db) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return db;
}

// Get raw SQL instance for advanced operations
export function getSqlInstance() {
  if (!sql) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first."
    );
  }
  return sql;
}

// Database connection singleton
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connectionPool: postgres.Sql | null = null;
  private drizzleInstance: ReturnType<typeof drizzle> | null = null;
  private healthMetrics: DatabaseHealthCheck | null = null;

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  async connect(): Promise<void> {
    if (this.connectionPool) {
      logger.debug("Database already connected", "DATABASE");
      return;
    }

    try {
      this.connectionPool = postgres(DATABASE_URL, connectionConfig);
      this.drizzleInstance = drizzle(this.connectionPool, {
        logger:
          process.env.NODE_ENV === "development" ?
            {
              logQuery: (query: string, params: unknown[]) => {
                logger.debug("Database query", "DATABASE", { query, params });
              },
            }
          : false,
      });

      // Test connection
      await this.connectionPool`SELECT 1`;
      logger.info("Database connection pool established", "DATABASE");
    } catch (error) {
      logger.error("Failed to establish database connection", "DATABASE", {
        error,
      });
      throw error;
    }
  }

  getDb(): ReturnType<typeof drizzle> {
    if (!this.drizzleInstance) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.drizzleInstance;
  }

  getSql(): postgres.Sql {
    if (!this.connectionPool) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.connectionPool;
  }

  async getHealth(): Promise<DatabaseHealthCheck> {
    if (!this.connectionPool) {
      return {
        status: "unhealthy" as const,
        responseTime: 0,
        activeConnections: 0,
        maxConnections: 0,
        diskUsage: 0,
        memoryUsage: 0,
        errors: ["Database not connected"],
        warnings: [],
        timestamp: new Date(),
      };
    }

    const startTime = Date.now();
    try {
      await this.connectionPool`SELECT 1`;
      const responseTime = Date.now() - startTime;

      this.healthMetrics = {
        status: "healthy" as const,
        responseTime,
        activeConnections: 0, // Would need to query pg_stat_activity
        maxConnections: databaseConfig.maxConnections,
        diskUsage: 0,
        memoryUsage: 0,
        errors: [],
        warnings: [],
        timestamp: new Date(),
      };

      return this.healthMetrics;
    } catch (error) {
      logger.error("Database health check failed", "DATABASE", { error });
      return {
        status: "unhealthy" as const,
        responseTime: Date.now() - startTime,
        activeConnections: 0,
        maxConnections: 0,
        diskUsage: 0,
        memoryUsage: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        warnings: [],
        timestamp: new Date(),
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectionPool) {
      try {
        await this.connectionPool.end();
        this.connectionPool = null;
        this.drizzleInstance = null;
        logger.info("Database connection closed", "DATABASE");
      } catch (error) {
        logger.error("Error closing database connection", "DATABASE", {
          error,
        });
      }
    }
  }
}

// Helper function to ensure database is initialized
async function ensureConnection(): Promise<{
  sql: postgres.Sql;
  db: ReturnType<typeof drizzle>;
}> {
  if (!sql || !db) {
    const result = await initializeDatabase();
    if (!result.success || !sql || !db) {
      throw new Error("Failed to initialize database connection");
    }
  }
  return { sql, db };
}

// Register cleanup with global cleanup manager
cleanupManager.register('database-connection', () => {
  if (sql) {
    sql.end();
    sql = undefined;
    db = undefined;
  }
});

// Helper function to categorize database errors
function categorizeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unknown database error";
  }

  const errorMessage = error.message.toLowerCase();

  if (
    errorMessage.includes("connect") ||
    errorMessage.includes("econnrefused")
  ) {
    return "Database connection failed";
  }
  if (errorMessage.includes("timeout") || errorMessage.includes("etimedout")) {
    return "Database operation timed out";
  }
  if (
    errorMessage.includes("duplicate key") ||
    errorMessage.includes("unique constraint")
  ) {
    return "Duplicate entry found";
  }
  if (
    errorMessage.includes("foreign key") ||
    errorMessage.includes("violates foreign key constraint")
  ) {
    return "Referenced record not found";
  }
  if (
    errorMessage.includes("not null") ||
    errorMessage.includes("violates not-null constraint")
  ) {
    return "Required field is missing";
  }
  if (errorMessage.includes("check constraint")) {
    return "Data validation failed";
  }
  if (
    errorMessage.includes("permission denied") ||
    errorMessage.includes("insufficient privilege")
  ) {
    return "Insufficient database permissions";
  }

  return error.message;
}

// Safe database operation wrapper with enhanced error handling
export async function withDatabase<T>(
  operation: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<{
  success: boolean;
  data?: T;
  error?: string;
  metrics?: QueryPerformanceMetrics;
}> {
  const startTime = Date.now();

  try {
    const { db: dbInstance } = await ensureConnection();

    if (!db) {
      throw new Error("Database not initialized");
    }
    const result = await operation(dbInstance);
    const executionTime = Date.now() - startTime;

    const metrics: QueryPerformanceMetrics = {
      query: "database_operation",
      executionTime,
      planningTime: 0,
      rowsReturned: Array.isArray(result) ? result.length : 1,
      rowsExamined: Array.isArray(result) ? result.length : 1,
      indexesUsed: [],
      timestamp: new Date(),
    };

    // Log slow operations
    if (executionTime > 1000) {
      logger.warn("Slow database operation detected", "DATABASE", {
        executionTime,
        operation: operation.name || "anonymous",
      });
    }

    return { success: true, data: result, metrics };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error("Database operation failed", "DATABASE", {
      error,
      executionTime,
      operation: operation.name || "anonymous",
    });

    const errorMessage = categorizeError(error);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Transaction wrapper with enhanced logging
export async function withTransaction<T>(
  operation: (sql: postgres.Sql) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    logger.debug("Starting database transaction", "DATABASE");

    const { sql: sqlInstance } = await ensureConnection();
    const result = await sqlInstance.begin(async (transaction) => {
      return await operation(transaction);
    });

    logger.debug("Database transaction committed successfully", "DATABASE");
    return { success: true, data: result as unknown as T };
  } catch (error) {
    logger.error("Database transaction failed and rolled back", "DATABASE", {
      error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Transaction failed",
    };
  }
}

// Enhanced connection health check
export async function checkDatabaseHealth(): Promise<DatabaseHealthCheck> {
  const startTime = Date.now();

  try {
    const { sql: sqlInstance } = await ensureConnection();

    // Test basic connectivity
    await sqlInstance`SELECT 1 as health_check`;
    const responseTime = Date.now() - startTime;

    // Get connection pool stats (if available)
    let activeConnections = 0;
    try {
      const poolStats = await sqlInstance`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active' AND datname = current_database()
      `;
      activeConnections = Number(poolStats[0]?.active_connections || 0);
    } catch (error) {
      logger.debug("Could not retrieve connection stats", "DATABASE", {
        error,
      });
    }

    const health: DatabaseHealthCheck = {
      status: "healthy" as const,
      responseTime,
      activeConnections,
      maxConnections: databaseConfig.maxConnections,
      diskUsage: 0,
      memoryUsage: 0,
      errors: [],
      warnings: [],
      timestamp: new Date(),
    };

    // Log health status
    if (responseTime > 1000) {
      logger.warn("Database response time is slow", "DATABASE", {
        responseTime,
      });
    }

    if (activeConnections > databaseConfig.maxConnections * 0.8) {
      logger.warn("Database connection pool is near capacity", "DATABASE", {
        activeConnections,
        maxConnections: databaseConfig.maxConnections,
      });
    }

    return health;
  } catch (error) {
    logger.error("Database health check failed", "DATABASE", { error });
    return {
      status: "unhealthy" as const,
      responseTime: Date.now() - startTime,
      activeConnections: 0,
      maxConnections: 0,
      diskUsage: 0,
      memoryUsage: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
      warnings: [],
      timestamp: new Date(),
    };
  }
}

// Comprehensive database diagnostics
export async function getDatabaseDiagnostics(): Promise<{
  health: DatabaseHealthCheck;
  version: string;
  size: string;
  tableCount: number;
  indexCount: number;
  slowQueries: QueryPerformanceMetrics[];
}> {
  try {
    const health = await checkDatabaseHealth();

    if (health.status !== "healthy") {
      return {
        health,
        version: "Unknown",
        size: "Unknown",
        tableCount: 0,
        indexCount: 0,
        slowQueries: [],
      };
    }

    const { sql: sqlInstance } = await ensureConnection();

    // Get database version
    const versionResult = await sqlInstance`SELECT version()`;
    const version = versionResult[0]?.version || "Unknown";

    // Get database size
    const sizeResult = await sqlInstance`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    const size = sizeResult[0]?.size || "Unknown";

    // Get table count
    const tableResult = await sqlInstance`
      SELECT count(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tableCount = Number(tableResult[0]?.table_count || 0);

    // Get index count
    const indexResult = await sqlInstance`
      SELECT count(*) as index_count 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;
    const indexCount = Number(indexResult[0]?.index_count || 0);

    // Get slow queries (if pg_stat_statements is available)
    let slowQueries: QueryPerformanceMetrics[] = [];
    try {
      const slowQueryResults = await sqlInstance`
        SELECT query, mean_time, calls, total_time
        FROM pg_stat_statements 
        WHERE mean_time > 1000 
        ORDER BY mean_time DESC 
        LIMIT 5
      `;
      slowQueries = slowQueryResults.map((row: Record<string, unknown>) => ({
        query: String(row.query || ""),
        executionTime: Number(row.mean_time || 0),
        planningTime: 0,
        rowsReturned: 0,
        rowsExamined: 0,
        indexesUsed: [],
        timestamp: new Date(),
      }));
    } catch (error) {
      logger.debug(
        "pg_stat_statements not available for slow query analysis",
        "DATABASE",
        { error }
      );
    }

    return {
      health,
      version,
      size,
      tableCount,
      indexCount,
      slowQueries,
    };
  } catch (error) {
    logger.error("Failed to get database diagnostics", "DATABASE", { error });
    throw error;
  }
}

// Graceful shutdown with enhanced cleanup
export async function closeDatabaseConnection() {
  try {
    if (sql) {
      logger.info("Closing database connection...", "DATABASE");

      // Wait for any pending operations to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await sql.end();
      sql = undefined;
      db = undefined;

      logger.info("Database connection closed gracefully", "DATABASE");
    }
  } catch (error) {
    logger.error("Error closing database connection", "DATABASE", { error });
    // Handle error appropriately but don't throw
  }
}

// Setup graceful shutdown handlers
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, closing database connection...", "DATABASE");
  await closeDatabaseConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, closing database connection...", "DATABASE");
  await closeDatabaseConnection();
  process.exit(0);
});

// Migration utilities (will be moved to DatabaseMigrator)
export async function runMigrations() {
  try {
    logger.info("Running comprehensive database migrations...", "DATABASE");

    const { sql: sqlInstance } = await ensureConnection();

    // Import and run reset migration
    const { resetAndCreateTables } = await import('./migrations/reset-and-create');
    const migrationResult = await resetAndCreateTables(sqlInstance);

    if (!migrationResult.success) {
      throw new Error(`Migration failed: ${migrationResult.error}`);
    }

    logger.info("Comprehensive database migrations completed successfully", "DATABASE");
    return { success: true };
  } catch (error) {
    logger.error("Migration failed", "DATABASE", { error });
    return { success: false, error };
  }
}

// Comprehensive data seeding for development and testing (will be moved to DatabaseSeeder)
export async function seedDatabase() {
  if (process.env.NODE_ENV === "production") {
    logger.info("Skipping database seeding in production", "DATABASE");
    return;
  }

  try {
    logger.info("Quick database check...", "DATABASE");
    
    const { sql: sqlInstance } = await ensureConnection();

    // Quick check if data already exists
    const existingUsers = await sqlInstance`SELECT COUNT(*) FROM users LIMIT 1`;
    if (Number(existingUsers[0]?.count) > 0) {
      logger.info("Database already has data, skipping seed", "DATABASE");
      return; // Skip seeding entirely if data exists
    }

    // Insert comprehensive sample users with proper password hashing
    logger.info("Creating sample users...", "DATABASE");

    // Create demo users with known passwords for testing
    const bcrypt = await import("bcrypt");
    const demoPassword = await bcrypt.hash("demo123", 10);
    const agentPassword = await bcrypt.hash("agent123", 10);

    await sqlInstance`
      INSERT INTO users (username, password, trust_score, is_verified_agent)
      VALUES 
        ('demo_user', ${demoPassword}, 750, false),
        ('demo_agent', ${agentPassword}, 950, true),
        ('john_tenant', ${demoPassword}, 750, false),
        ('sarah_agent', ${agentPassword}, 950, true),
        ('mike_landlord', ${demoPassword}, 820, false),
        ('jane_broker', ${agentPassword}, 890, true),
        ('david_investor', ${demoPassword}, 680, false),
        ('mary_property_manager', ${agentPassword}, 920, true)
      ON CONFLICT (username) DO NOTHING
    `;

    // Insert comprehensive sample properties with diverse data for testing
    logger.info("Creating sample properties...", "DATABASE");
    await sqlInstance`
      INSERT INTO properties (owner_id, title, description, location, price, image_urls, features, verification_status, ai_verification_results)
      VALUES 
        -- Verified Properties with AI results
        (2, 'Modern 2BR Apartment in Westlands', 'Beautiful modern apartment with stunning city views, fully furnished with contemporary amenities. Perfect for young professionals.', 'Westlands, Nairobi', 85000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 2, "bathrooms": 2, "squareFeet": 1200, "parkingSpaces": 1, "yearBuilt": 2020, "amenities": ["Swimming Pool", "Gym", "Security", "Parking"], "propertyType": "apartment", "petFriendly": false, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 92, "authenticityScore": 95, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 88, "completenessScore": 90, "suggestedImprovements": ["Add more details about parking arrangements"]}, "overallScore": 91, "verificationTimestamp": "2024-01-15T10:30:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (3, 'Spacious Family Home in Karen', 'Large family home with beautiful garden, perfect for families. Features modern kitchen, spacious living areas, and secure compound.', 'Karen, Nairobi', 150000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 4, "bathrooms": 3, "squareFeet": 2500, "parkingSpaces": 2, "yearBuilt": 2018, "amenities": ["Garden", "Security", "Parking", "Balcony"], "propertyType": "house", "petFriendly": true, "furnished": false}', 'verified', '{"imageAnalysis": {"qualityScore": 78, "authenticityScore": 85, "flaggedIssues": ["Low resolution in bathroom photos"]}, "descriptionAnalysis": {"accuracyScore": 82, "completenessScore": 75, "suggestedImprovements": ["Include information about utilities", "Add details about neighborhood amenities"]}, "overallScore": 80, "verificationTimestamp": "2024-01-14T14:20:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (4, 'Luxury Penthouse in Kilimani', 'Exclusive penthouse with panoramic views of Nairobi skyline. Premium finishes, rooftop terrace, and concierge services.', 'Kilimani, Nairobi', 200000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 3, "bathrooms": 3, "squareFeet": 1800, "parkingSpaces": 2, "yearBuilt": 2021, "amenities": ["Rooftop Terrace", "Concierge", "Gym", "Swimming Pool", "Security"], "propertyType": "apartment", "petFriendly": false, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 98, "authenticityScore": 97, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 95, "completenessScore": 92, "suggestedImprovements": []}, "overallScore": 96, "verificationTimestamp": "2024-01-13T16:45:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (2, 'Cozy Studio in CBD', 'Perfect studio apartment in the heart of Nairobi CBD. Ideal for business travelers and young professionals. Walking distance to offices.', 'CBD, Nairobi', 45000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 0, "bathrooms": 1, "squareFeet": 400, "parkingSpaces": 0, "yearBuilt": 2019, "amenities": ["Security", "Elevator", "Internet"], "propertyType": "studio", "petFriendly": false, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 85, "authenticityScore": 88, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 80, "completenessScore": 85, "suggestedImprovements": ["Add more details about building amenities"]}, "overallScore": 84, "verificationTimestamp": "2024-01-12T09:15:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        -- Pending Properties
        (5, 'Affordable 1BR in Kasarani', 'Budget-friendly one bedroom apartment in Kasarani. Good transport links and local amenities nearby.', 'Kasarani, Nairobi', 35000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 1, "bathrooms": 1, "squareFeet": 600, "parkingSpaces": 0, "yearBuilt": 2015, "amenities": ["Security", "Water"], "propertyType": "apartment", "petFriendly": true, "furnished": false}', 'pending', '{"imageAnalysis": {"qualityScore": 55, "authenticityScore": 60, "flaggedIssues": ["Limited number of photos", "Poor image quality"]}, "descriptionAnalysis": {"accuracyScore": 45, "completenessScore": 40, "suggestedImprovements": ["Add comprehensive property description", "Include accurate pricing information"]}, "overallScore": 50, "verificationTimestamp": "2024-01-11T11:30:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (3, 'Townhouse in Runda', 'Elegant townhouse in prestigious Runda estate. Gated community with excellent security and recreational facilities.', 'Runda, Nairobi', 180000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 3, "bathrooms": 2, "squareFeet": 2000, "parkingSpaces": 2, "yearBuilt": 2017, "amenities": ["Gated Community", "Security", "Clubhouse", "Swimming Pool"], "propertyType": "townhouse", "petFriendly": true, "furnished": false}', 'pending', '{"imageAnalysis": {"qualityScore": 70, "authenticityScore": 75, "flaggedIssues": ["Some images appear filtered"]}, "descriptionAnalysis": {"accuracyScore": 68, "completenessScore": 65, "suggestedImprovements": ["Add more details about community amenities"]}, "overallScore": 70, "verificationTimestamp": "2024-01-10T13:20:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        -- Properties in different locations for search testing
        (6, 'Beachfront Villa in Mombasa', 'Stunning beachfront villa with private beach access. Perfect for vacation rentals or permanent residence.', 'Mombasa', 300000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 5, "bathrooms": 4, "squareFeet": 3500, "parkingSpaces": 3, "yearBuilt": 2016, "amenities": ["Beach Access", "Swimming Pool", "Garden", "Security"], "propertyType": "house", "petFriendly": true, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 90, "authenticityScore": 93, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 88, "completenessScore": 90, "suggestedImprovements": []}, "overallScore": 90, "verificationTimestamp": "2024-01-09T15:45:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (2, 'Mountain View Cottage in Nakuru', 'Charming cottage with breathtaking mountain views. Peaceful location perfect for weekend getaways.', 'Nakuru', 75000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 2, "bathrooms": 1, "squareFeet": 900, "parkingSpaces": 1, "yearBuilt": 2014, "amenities": ["Mountain View", "Garden", "Fireplace"], "propertyType": "house", "petFriendly": true, "furnished": false}', 'verified', '{"imageAnalysis": {"qualityScore": 82, "authenticityScore": 85, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 78, "completenessScore": 80, "suggestedImprovements": ["Add more details about local attractions"]}, "overallScore": 81, "verificationTimestamp": "2024-01-08T12:10:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (4, 'Modern Condo in Kiambu', 'Contemporary condominium in rapidly developing Kiambu area. Great investment opportunity with modern amenities.', 'Kiambu', 95000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 2, "bathrooms": 2, "squareFeet": 1100, "parkingSpaces": 1, "yearBuilt": 2022, "amenities": ["Gym", "Security", "Parking", "Elevator"], "propertyType": "condo", "petFriendly": false, "furnished": false}', 'verified', '{"imageAnalysis": {"qualityScore": 88, "authenticityScore": 90, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 85, "completenessScore": 87, "suggestedImprovements": []}, "overallScore": 87, "verificationTimestamp": "2024-01-07T10:25:00Z", "aiModel": "TripleCheck-AI-v2.1"}'),
        
        (3, 'Executive Apartment in Lavington', 'High-end executive apartment in exclusive Lavington area. Premium location with top-tier amenities.', 'Lavington, Nairobi', 120000, ARRAY['/placeholder-property.jpg'], '{"bedrooms": 3, "bathrooms": 2, "squareFeet": 1500, "parkingSpaces": 2, "yearBuilt": 2019, "amenities": ["Swimming Pool", "Gym", "Security", "Parking", "Balcony"], "propertyType": "apartment", "petFriendly": false, "furnished": true}', 'verified', '{"imageAnalysis": {"qualityScore": 94, "authenticityScore": 96, "flaggedIssues": []}, "descriptionAnalysis": {"accuracyScore": 92, "completenessScore": 94, "suggestedImprovements": []}, "overallScore": 94, "verificationTimestamp": "2024-01-06T14:30:00Z", "aiModel": "TripleCheck-AI-v2.1"}')
      ON CONFLICT DO NOTHING
    `;

    // Insert sample reviews for testing review functionality
    logger.info("Creating sample reviews...", "DATABASE");
    await sqlInstance`
      INSERT INTO reviews (property_id, user_id, rating, comment)
      VALUES 
        (1, 1, 5, 'Excellent apartment! The location is perfect and the amenities are top-notch. Highly recommend for anyone looking in Westlands.'),
        (1, 5, 4, 'Great place to live. Only minor issue was parking can be tight during peak hours.'),
        (2, 1, 5, 'Beautiful family home with a lovely garden. Kids love the space and the neighborhood is very safe.'),
        (2, 4, 4, 'Good property but could use some minor updates. Overall satisfied with the rental experience.'),
        (3, 5, 5, 'Absolutely stunning penthouse! The views are incredible and the building management is excellent.'),
        (4, 1, 4, 'Perfect for my business trips. Location is unbeatable and the studio has everything I need.'),
        (7, 3, 5, 'Amazing beachfront property! Perfect for our family vacation. Will definitely book again.'),
        (8, 1, 4, 'Peaceful cottage with beautiful mountain views. Great for a weekend retreat.'),
        (10, 5, 5, 'Luxurious apartment in a prime location. The amenities are world-class.')
      ON CONFLICT DO NOTHING
    `;

    // Create community trust data if tables exist
    try {
      logger.info("Creating community trust sample data...", "DATABASE");

      // Sample community references
      await sqlInstance`
        INSERT INTO community_references (user_id, reference_type, reference_name, reference_phone, relationship, years_known, trust_rating, verification_status)
        VALUES 
          (1, 'neighbor', 'Alice Wanjiku', '+254712345678', 'Neighbor for 3 years', 3, 9, 'verified'),
          (1, 'colleague', 'Peter Makau', '+254723456789', 'Work colleague', 2, 8, 'verified'),
          (3, 'church_member', 'Grace Njeri', '+254734567890', 'Church member', 5, 10, 'verified'),
          (5, 'family', 'John Kamau', '+254745678901', 'Brother', 25, 10, 'verified')
        ON CONFLICT DO NOTHING
      `;

      // Sample trust scores
      await sqlInstance`
        INSERT INTO trust_scores (user_id, overall_score, trust_level, community_score, behavior_score, social_score, location_score, endorsement_score, transaction_score, risk_level, max_transaction_value)
        VALUES 
          (1, 750, 'verified', 80, 85, 70, 75, 60, 90, 'low', 500000),
          (2, 950, 'premium', 95, 98, 90, 85, 95, 100, 'very_low', 2000000),
          (3, 820, 'verified', 85, 80, 75, 90, 70, 85, 'low', 800000),
          (4, 890, 'premium', 90, 88, 85, 80, 85, 95, 'very_low', 1500000),
          (5, 680, 'community', 70, 75, 65, 70, 50, 60, 'medium', 200000),
          (6, 920, 'premium', 92, 90, 88, 85, 90, 98, 'very_low', 2500000)
        ON CONFLICT DO NOTHING
      `;
    } catch (error) {
      logger.info(
        "Community trust tables not yet created, skipping community data seeding",
        "DATABASE",
        { error }
      );
    }

    logger.info("✅ Database seeding completed successfully!", "DATABASE");
    logger.info("📊 Sample data created:", "DATABASE", {
      users: 6,
      properties: 10,
      reviews: 9,
      communityData: "conditional",
    });
    logger.info(
      "🔍 Test search terms available: apartment, house, studio, Nairobi, Mombasa, modern, luxury, family, beach, mountain, garden",
      "DATABASE"
    );
  } catch (error) {
    logger.error("❌ Database seeding failed", "DATABASE", { error });
  }
}

// Legacy compatibility - getDatabase function is already exported above

// Safe database getter function
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Export the database instance for backward compatibility
export { db, sql };

// Database initialization removed from module load to prevent startup crashes
// Database will be initialized lazily when first accessed
