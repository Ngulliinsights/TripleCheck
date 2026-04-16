/**
 * Storage Logger - Backward Compatibility Adapter
 * 
 * This file now re-exports the unified logger from telemetry.ts
 * for backward compatibility. All new code should import from telemetry.ts directly.
 * 
 * @deprecated Use server/infrastructure/observability/telemetry.ts instead
 */

import { simpleLogger } from '../observability/telemetry';

export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// Re-export the simple logger adapter for backward compatibility
export const logger: Logger = simpleLogger;