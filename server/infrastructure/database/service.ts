/**
 * Database Service Implementation
 * 
 * Main service class that implements the DatabaseService interface
 * and provides all database operations.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseConfig } from './config';
import { MigrationManager } from './migrations';
import { SchemaManager } from './schemas';
import { DataGenerator } from './seeds';

import {
    DatabaseService,
    DatabaseConfig,
    DatabaseConnection,
    DatabaseInitResult,
    MigrationResult,
    SeedResult,
    ValidationResult,
    DataScenario
} from './index';

export class DatabaseServiceImpl implements DatabaseService {
    private config: DatabaseConfig;
    private sql: postgres.Sql | null = null;
    private db: ReturnType<typeof drizzle> | null = null;
    private schemaManager: SchemaManager;
    private migrationManager: MigrationManager;
    private dataGenerator: DataGenerator;
    private healthCheckTimer: NodeJS.Timeout | null = null;
    private isInitialized = false;

    constructor(config?: DatabaseConfig) {
        this.config = config || getDatabaseConfig();
        this.schemaManager = new SchemaManager();
        this.migrationManager = new MigrationManager();
        this.dataGenerator = new DataGenerator();
    }

    async initialize(): Promise<DatabaseInitResult> {
        try {
            console.log('🔄 Initializing database connection...');
            console.log(`📍 Database URL: ${this.maskDatabaseUrl(this.config.url)}`);
            console.log(`🔒 SSL Mode: ${this.config.ssl}`);
            console.log(`🏊 Pool Size: ${this.config.poolSize}`);

            // Create postgres connection
            this.sql = postgres(this.config.url, {
                max: this.config.poolSize,
                idle_timeout: this.config.idleTimeout / 1000, // postgres.js expects seconds
                connect_timeout: this.config.connectionTimeout / 1000,
                prepare: false,
                ssl: this.config.ssl,
                transform: {
                    undefined: null,
                },
                connection: {
                    application_name: this.config.applicationName,
                },
            });

            // Create drizzle instance
            const schemas = await this.schemaManager.loadSchemas();
            this.db = drizzle(this.sql, { schema: schemas });

            // Test connection with timeout
            console.log('🔍 Testing database connection...');
            await this.testConnection();

            // Start health check monitoring
            this.startHealthCheckMonitoring();

            this.isInitialized = true;
            console.log('✅ Database connection established successfully');

            return {
                success: true,
                connectionInfo: {
                    host: this.extractHostFromUrl(this.config.url),
                    database: this.extractDatabaseFromUrl(this.config.url),
                    ssl: typeof this.config.ssl === 'boolean' ? this.config.ssl : true,
                    poolSize: this.config.poolSize
                }
            };
        } catch (error) {
            console.error('❌ Database initialization failed:', error);

            // Attempt retry with different SSL settings if SSL error in development
            if (this.shouldRetryWithoutSSL(error)) {
                return this.retryWithoutSSL();
            }

            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }

    async getConnection(): Promise<DatabaseConnection> {
        if (!this.sql || !this.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }

        return new DatabaseConnectionImpl(this.sql);
    }

    async runMigrations(): Promise<MigrationResult> {
        if (!this.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }

        return this.migrationManager.runPendingMigrations(this.sql!);
    }

    async seedData(scenario: DataScenario): Promise<SeedResult> {
        if (!this.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }

        return this.dataGenerator.generateData(scenario, this.sql!);
    }

    async validateSchema(): Promise<ValidationResult> {
        if (!this.isInitialized) {
            throw new Error('Database not initialized. Call initialize() first.');
        }

        return this.schemaManager.validateSchemas(this.sql!);
    }

    async healthCheck(): Promise<boolean> {
        if (!this.sql || !this.isInitialized) {
            return false;
        }

        try {
            await this.sql`SELECT 1 as health_check`;
            return true;
        } catch {
            return false;
        }
    }

    async cleanup(): Promise<void> {
        console.log('🧹 Cleaning up database connections...');

        // Stop health check monitoring
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }

        // Close database connection
        if (this.sql) {
            await this.sql.end();
            this.sql = null;
            this.db = null;
        }

        this.isInitialized = false;
        console.log('✅ Database cleanup completed');
    }

    private async testConnection(): Promise<void> {
        if (!this.sql) {
            throw new Error('SQL connection not established');
        }

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), this.config.connectionTimeout);
        });

        await Promise.race([
            this.sql`SELECT 1 as test`,
            timeoutPromise
        ]);
    }

    private shouldRetryWithoutSSL(error: unknown): boolean {
        return (
            error instanceof Error &&
            error.message.includes('insecure') &&
            process.env.NODE_ENV !== 'production' &&
            this.config.ssl !== false
        );
    }

    private async retryWithoutSSL(): Promise<DatabaseInitResult> {
        console.log('🔄 Retrying connection without SSL for development...');

        try {
            // Update config to disable SSL
            this.config = { ...this.config, ssl: false };

            // Retry initialization
            return this.initialize();
        } catch (retryError) {
            console.error('❌ Retry without SSL failed:', retryError);
            return {
                success: false,
                error: retryError instanceof Error ? retryError : new Error(String(retryError))
            };
        }
    }

    private startHealthCheckMonitoring(): void {
        this.healthCheckTimer = setInterval(async () => {
            const isHealthy = await this.healthCheck();
            if (!isHealthy) {
                console.warn('⚠️ Database health check failed');
            }
        }, this.config.healthCheckInterval);
    }

    private maskDatabaseUrl(url: string): string {
        try {
            const parsed = new URL(url);
            if (parsed.password) {
                parsed.password = '***';
            }
            return parsed.toString();
        } catch {
            return url.replace(/\/\/.*@/, '//***:***@');
        }
    }

    private extractHostFromUrl(url: string): string {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }

    private extractDatabaseFromUrl(url: string): string {
        try {
            return new URL(url).pathname.slice(1);
        } catch {
            return 'unknown';
        }
    }
}

/**
 * Database Connection Implementation
 */
class DatabaseConnectionImpl implements DatabaseConnection {
    constructor(private sql: postgres.Sql) { }

    async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
        if (params) {
            return this.sql.unsafe(sql, params) as Promise<T[]>;
        }
        return this.sql.unsafe(sql) as Promise<T[]>;
    }

    async transaction<T>(callback: (trx: DatabaseConnection) => Promise<T>): Promise<T> {
        return this.sql.begin(async (sql) => {
            const trxConnection = new DatabaseConnectionImpl(sql);
            return callback(trxConnection);
        });
    }

    async close(): Promise<void> {
        // Individual connections don't need to be closed in postgres.js
        // The pool manages connections automatically
    }

    async isHealthy(): Promise<boolean> {
        try {
            await this.sql`SELECT 1`;
            return true;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
export const databaseService = new DatabaseServiceImpl();