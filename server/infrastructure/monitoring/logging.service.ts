/**
 * Structured Logging System for TripleCheck
 * 
 * Provides consistent logging across the application with different log levels
 * and structured output for better debugging and monitoring.
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  data?: any;
  error?: Error;
}

// Helper type to ensure we only pass defined values to optional properties
type LogEntryBuilder = {
  timestamp: string;
  level: string;
  message: string;
} & {
  [K in 'context' | 'data' | 'error']?: LogEntry[K];
};

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Set log level based on environment with better type safety
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    
    // Use a map for cleaner log level resolution
    const logLevelMap: Record<string, LogLevel> = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      debug: LogLevel.DEBUG
    };

    this.logLevel = logLevelMap[envLogLevel ?? ''] ?? 
      (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG);
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, data, error } = entry;
    
    let logString = `[${timestamp}] ${level.toUpperCase()}`;
    
    if (context) {
      logString += ` [${context}]`;
    }
    
    logString += `: ${message}`;
    
    if (data !== undefined) {
      // Handle circular references and improve JSON serialization
      try {
        logString += `\nData: ${JSON.stringify(data, null, 2)}`;
      } catch (err) {
        logString += `\nData: [Circular or non-serializable object]`;
      }
    }
    
    if (error) {
      logString += `\nError: ${error.message}`;
      if (error.stack) {
        logString += `\nStack: ${error.stack}`;
      }
    }
    
    return logString;
  }

  private buildLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): LogEntry {
    // Build the entry object conditionally to satisfy exactOptionalPropertyTypes
    const baseEntry: LogEntryBuilder = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message
    };

    // Only add optional properties if they have defined values
    if (context !== undefined) {
      baseEntry.context = context;
    }
    
    if (data !== undefined) {
      baseEntry.data = data;
    }
    
    if (error !== undefined) {
      baseEntry.error = error;
    }

    return baseEntry as LogEntry;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any,
    error?: Error
  ): void {
    // Early return if log level is too low - improves performance
    if (level > this.logLevel) {
      return;
    }

    const entry = this.buildLogEntry(level, message, context, data, error);
    const formattedLog = this.formatLogEntry(entry);

    // Use a map for console method selection - more maintainable
    const consoleMethods = {
      [LogLevel.ERROR]: console.error,
      [LogLevel.WARN]: console.warn,
      [LogLevel.INFO]: console.info,
      [LogLevel.DEBUG]: console.debug
    } as const;

    const consoleMethod = consoleMethods[level];
    consoleMethod(formattedLog);
  }

  // Public logging methods with improved method signatures
  error(message: string, context?: string, data?: any, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  // Enhanced convenience methods with better type safety
  apiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: number
  ): void {
    this.info(
      `${method} ${path} ${statusCode} in ${duration}ms`,
      'API',
      { userId }
    );
  }

  databaseOperation(
    operation: string,
    table: string,
    duration: number,
    recordCount?: number
  ): void {
    this.debug(
      `${operation} on ${table} completed in ${duration}ms`,
      'DATABASE',
      { recordCount }
    );
  }

  aiOperation(operation: string, duration: number, tokens?: number): void {
    this.info(
      `AI ${operation} completed in ${duration}ms`,
      'AI',
      { tokens }
    );
  }

  securityEvent(event: string, userId?: number, ip?: string): void {
    this.warn(
      `Security event: ${event}`,
      'SECURITY',
      { userId, ip }
    );
  }

  // Additional utility methods for better developer experience
  
  /**
   * Check if a log level is enabled
   * Useful for avoiding expensive operations when logging is disabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  /**
   * Get current log level
   */
  getCurrentLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Set log level at runtime
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Performance-aware logging - only execute expensive operations if logging is enabled
   */
  debugWithCallback(message: string, context: string, dataCallback: () => any): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      this.debug(message, context, dataCallback());
    }
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export convenience function for backward compatibility
export const log = (message: string): void => logger.info(message, 'APP');