/**
 * Database Type Definitions
 * 
 * Centralized database-related type definitions
 */

// Connection types
export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export interface ConnectionPool {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

// Query types
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
  fields: QueryField[];
}

export interface QueryField {
  name: string;
  tableID: number;
  columnID: number;
  dataTypeID: number;
  dataTypeSize: number;
  dataTypeModifier: number;
  format: string;
}

export interface PreparedStatement {
  name: string;
  text: string;
  values: any[];
}

// Transaction types
export interface TransactionClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  release(): void;
}

export type TransactionCallback<T> = (client: TransactionClient) => Promise<T>;

// Migration types
export interface MigrationFile {
  id: string;
  name: string;
  filename: string;
  up: string;
  down: string;
}

export interface AppliedMigration {
  id: string;
  name: string;
  appliedAt: Date;
  checksum: string;
}

// Seeding types
export interface SeedData {
  table: string;
  data: Record<string, any>[];
  truncate?: boolean;
  cascade?: boolean;
}

export interface SeedResult {
  table: string;
  inserted: number;
  updated: number;
  errors: string[];
}

// Performance monitoring types
export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  planningTime: number;
  rowsReturned: number;
  rowsExamined: number;
  indexesUsed: string[];
  timestamp: Date;
}

export interface DatabasePerformanceSnapshot {
  activeConnections: number;
  totalConnections: number;
  slowQueries: QueryPerformanceMetrics[];
  averageResponseTime: number;
  cacheHitRatio: number;
  timestamp: Date;
}

// Error types
export interface DatabaseError extends Error {
  code: string;
  detail?: string;
  hint?: string;
  position?: string;
  internalPosition?: string;
  internalQuery?: string;
  where?: string;
  schema?: string;
  table?: string;
  column?: string;
  dataType?: string;
  constraint?: string;
  file?: string;
  line?: string;
  routine?: string;
}

// Backup and restore types
export interface BackupOptions {
  format: 'sql' | 'tar' | 'directory' | 'custom';
  compress: boolean;
  verbose: boolean;
  excludeTables?: string[];
  includeTables?: string[];
}

export interface BackupResult {
  success: boolean;
  filename: string;
  size: number;
  duration: number;
  error?: string;
}

export interface RestoreOptions {
  clean: boolean;
  create: boolean;
  verbose: boolean;
  singleTransaction: boolean;
}

export interface RestoreResult {
  success: boolean;
  duration: number;
  tablesRestored: number;
  error?: string;
}

// Index management types
export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  partial?: string;
  method?: 'btree' | 'hash' | 'gist' | 'gin' | 'brin';
}

export interface IndexUsageStats {
  schemaName: string;
  tableName: string;
  indexName: string;
  timesUsed: number;
  tuplesFetched: number;
  tuplesRead: number;
  lastUsed?: Date;
}

// Health check types
export interface DatabaseHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  activeConnections: number;
  maxConnections: number;
  diskUsage: number;
  memoryUsage: number;
  lastBackup?: Date;
  replicationLag?: number;
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

// Audit types
export interface AuditLogEntry {
  id: string;
  userId?: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Configuration types
export interface DatabaseFeatureFlags {
  enableQueryLogging: boolean;
  enableSlowQueryLogging: boolean;
  slowQueryThreshold: number;
  enableAuditLogging: boolean;
  enablePerformanceMonitoring: boolean;
  enableConnectionPooling: boolean;
  enableReadReplicas: boolean;
}

// Utility types
export type DatabaseOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER';

export interface DatabaseOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: DatabaseError;
  metrics?: QueryPerformanceMetrics;
}

export type SortOrder = 'ASC' | 'DESC';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}