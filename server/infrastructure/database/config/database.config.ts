/**
 * Database Configuration Management
 *
 * Centralized database configuration with environment-specific settings
 */

import { z } from "zod";

// Database configuration schema
const DatabaseConfigSchema = z.object({
  host: z.string(),
  port: z.number().int().positive(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean().default(false),
  maxConnections: z.number().int().positive().default(20),
  idleTimeoutMillis: z.number().int().positive().default(30000),
  connectionTimeoutMillis: z.number().int().positive().default(2000),
  acquireTimeoutMillis: z.number().int().positive().default(60000),
  createTimeoutMillis: z.number().int().positive().default(30000),
  destroyTimeoutMillis: z.number().int().positive().default(5000),
  reapIntervalMillis: z.number().int().positive().default(1000),
  createRetryIntervalMillis: z.number().int().positive().default(200),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

// Environment-based configuration
export const databaseConfig: DatabaseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "triplecheck",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  ssl: process.env.NODE_ENV === "production",
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
  connectionTimeoutMillis: parseInt(
    process.env.DB_CONNECTION_TIMEOUT || "2000"
  ),
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || "60000"),
  createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || "30000"),
  destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || "5000"),
  reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || "1000"),
  createRetryIntervalMillis: parseInt(
    process.env.DB_CREATE_RETRY_INTERVAL || "200"
  ),
};

// Validate configuration
export function validateDatabaseConfig(): void {
  try {
    DatabaseConfigSchema.parse(databaseConfig);
  } catch (error) {
    throw new Error(`Invalid database configuration: ${error}`);
  }
}

// Connection string builder
export function buildConnectionString(): string {
  const { host, port, database, username, password } = databaseConfig;
  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
}

// Development vs Production configurations
export const developmentConfig: Partial<DatabaseConfig> = {
  ssl: false,
  maxConnections: 10,
};

export const productionConfig: Partial<DatabaseConfig> = {
  ssl: true,
  maxConnections: 50,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 5000,
};
