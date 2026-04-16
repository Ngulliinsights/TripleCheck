/**
 * Legacy Logger - Backward Compatibility Adapter
 * 
 * This file now re-exports the unified logger from telemetry.ts
 * for backward compatibility. All new code should import from telemetry.ts directly.
 * 
 * @deprecated Use server/infrastructure/observability/telemetry.ts instead
 */

import { legacyLogger, logger as unifiedLogger } from '../observability/telemetry';

// Re-export the legacy adapter for backward compatibility
export const logger = legacyLogger;

// Re-export log levels for compatibility
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Re-export the Logger class for type compatibility
export class Logger {
  error(message: string, contextOrData?: string | any, data?: any, error?: Error): void {
    legacyLogger.error(message, contextOrData, data, error);
  }

  warn(message: string, contextOrData?: string | any, data?: any): void {
    legacyLogger.warn(message, contextOrData, data);
  }

  info(message: string, contextOrData?: string | any, data?: any): void {
    legacyLogger.info(message, contextOrData, data);
  }

  debug(message: string, contextOrData?: string | any, data?: any): void {
    legacyLogger.debug(message, contextOrData, data);
  }

  apiRequest(method: string, path: string, statusCode: number, duration: number, userId?: number): void {
    legacyLogger.apiRequest(method, path, statusCode, duration, userId);
  }

  databaseOperation(operation: string, table: string, duration: number, recordCount?: number): void {
    legacyLogger.databaseOperation(operation, table, duration, recordCount);
  }

  aiOperation(operation: string, duration: number, tokens?: number): void {
    legacyLogger.aiOperation(operation, duration, tokens);
  }

  securityEvent(event: string, userId?: number, ip?: string): void {
    legacyLogger.securityEvent(event, userId, ip);
  }

  isLevelEnabled(level: LogLevel): boolean {
    // Map to Pino levels
    const pinoLevels: Record<LogLevel, string> = {
      [LogLevel.ERROR]: 'error',
      [LogLevel.WARN]: 'warn',
      [LogLevel.INFO]: 'info',
      [LogLevel.DEBUG]: 'debug',
    };
    return unifiedLogger.isLevelEnabled(pinoLevels[level]);
  }

  getCurrentLevel(): LogLevel {
    const level = unifiedLogger.level;
    const levelMap: Record<string, LogLevel> = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      debug: LogLevel.DEBUG,
    };
    return levelMap[level] || LogLevel.INFO;
  }

  setLevel(level: LogLevel): void {
    const pinoLevels: Record<LogLevel, string> = {
      [LogLevel.ERROR]: 'error',
      [LogLevel.WARN]: 'warn',
      [LogLevel.INFO]: 'info',
      [LogLevel.DEBUG]: 'debug',
    };
    unifiedLogger.level = pinoLevels[level];
  }

  debugWithCallback(message: string, context: string, dataCallback: () => any): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      this.debug(message, context, dataCallback());
    }
  }
}

// Export convenience function for backward compatibility
export const log = (message: string): void => legacyLogger.info(message, 'APP');