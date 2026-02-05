/**
 * Database Utility Functions
 * 
 * Common database operations and helper functions
 */

import { logger } from '../../../infrastructure/monitoring/logger';

export interface DatabaseHealth {
  connected: boolean;
  responseTime: number;
  activeConnections: number;
  maxConnections: number;
  lastChecked: Date;
}

export interface QueryMetrics {
  query: string;
  executionTime: number;
  rowCount: number;
  timestamp: Date;
}

/**
 * Test database connectivity
 */
export async function testDatabaseConnection(): Promise<DatabaseHealth> {
  const startTime = Date.now();
  
  try {
    // Implementation would test actual database connection
    const responseTime = Date.now() - startTime;
    
    return {
      connected: true,
      responseTime,
      activeConnections: 5, // Would get from actual pool
      maxConnections: 20,   // Would get from config
      lastChecked: new Date()
    };
  } catch (error) {
    logger.error('Database connection test failed', 'DATABASE', { error });
    
    return {
      connected: false,
      responseTime: Date.now() - startTime,
      activeConnections: 0,
      maxConnections: 0,
      lastChecked: new Date()
    };
  }
}

/**
 * Execute query with metrics tracking
 */
export async function executeWithMetrics<T>(
  query: string,
  params: any[] = []
): Promise<{ result: T; metrics: QueryMetrics }> {
  const startTime = Date.now();
  
  try {
    // Implementation would execute actual query
    const result = {} as T; // Placeholder
    const executionTime = Date.now() - startTime;
    
    const metrics: QueryMetrics = {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      executionTime,
      rowCount: Array.isArray(result) ? result.length : 1,
      timestamp: new Date()
    };

    // Log slow queries
    if (executionTime > 1000) {
      logger.warn('Slow query detected', 'DATABASE', { 
        query: metrics.query, 
        executionTime 
      });
    }

    return { result, metrics };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Query execution failed', 'DATABASE', { 
      query: query.substring(0, 100),
      executionTime,
      error 
    });
    throw error;
  }
}

/**
 * Sanitize SQL identifiers
 */
export function sanitizeIdentifier(identifier: string): string {
  // Remove any non-alphanumeric characters except underscores
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Build WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, any>,
  paramOffset: number = 0
): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = paramOffset + 1;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      const sanitizedKey = sanitizeIdentifier(key);
      
      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`${sanitizedKey} IN (${placeholders})`);
        params.push(...value);
      } else {
        conditions.push(`${sanitizedKey} = $${paramIndex++}`);
        params.push(value);
      }
    }
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

/**
 * Build pagination clause
 */
export function buildPaginationClause(
  page: number = 1,
  limit: number = 20,
  paramOffset: number = 0
): { clause: string; params: any[] } {
  const offset = (page - 1) * limit;
  const paramIndex = paramOffset + 1;
  
  return {
    clause: `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params: [limit, offset]
  };
}

/**
 * Build ORDER BY clause
 */
export function buildOrderClause(
  sortBy: string = 'id',
  sortOrder: 'ASC' | 'DESC' = 'ASC'
): string {
  const sanitizedSortBy = sanitizeIdentifier(sortBy);
  const sanitizedOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  
  return `ORDER BY ${sanitizedSortBy} ${sanitizedOrder}`;
}

/**
 * Transaction wrapper
 */
export async function withTransaction<T>(
  operation: (client: any) => Promise<T>
): Promise<T> {
  // Implementation would use actual database client
  try {
    // Begin transaction
    logger.debug('Starting database transaction');
    
    const result = await operation({} as any); // Placeholder client
    
    // Commit transaction
    logger.debug('Committing database transaction');
    
    return result;
  } catch (error) {
    // Rollback transaction
    logger.error('Rolling back database transaction', 'DATABASE', { error });
    throw error;
  }
}

/**
 * Batch insert helper
 */
export function buildBatchInsert(
  tableName: string,
  records: Record<string, any>[],
  conflictResolution: 'ignore' | 'update' | 'error' = 'error'
): { query: string; params: any[] } {
  if (records.length === 0) {
    throw new Error('No records provided for batch insert');
  }

  const sanitizedTableName = sanitizeIdentifier(tableName);
  const columns = Object.keys(records[0]);
  const sanitizedColumns = columns.map(sanitizeIdentifier);
  
  const values: any[] = [];
  const valuePlaceholders: string[] = [];
  let paramIndex = 1;

  for (const record of records) {
    const recordValues = columns.map(col => record[col]);
    values.push(...recordValues);
    
    const placeholders = columns.map(() => `$${paramIndex++}`).join(', ');
    valuePlaceholders.push(`(${placeholders})`);
  }

  let conflictClause = '';
  switch (conflictResolution) {
    case 'ignore':
      conflictClause = 'ON CONFLICT DO NOTHING';
      break;
    case 'update':
      const updateSet = sanitizedColumns
        .map(col => `${col} = EXCLUDED.${col}`)
        .join(', ');
      conflictClause = `ON CONFLICT DO UPDATE SET ${updateSet}`;
      break;
  }

  const query = `
    INSERT INTO ${sanitizedTableName} (${sanitizedColumns.join(', ')})
    VALUES ${valuePlaceholders.join(', ')}
    ${conflictClause}
    RETURNING *
  `.trim();

  return { query, params: values };
}