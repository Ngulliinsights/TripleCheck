/**
 * Production-ready logging utility for k6 load testing
 * Provides structured logging with different levels and proper formatting
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get log level from environment or default to INFO
const currentLogLevel = LOG_LEVELS[(__ENV.LOG_LEVEL || 'INFO').toUpperCase()] ?? LOG_LEVELS.INFO;

/**
 * Format log message with timestamp and level
 */
function formatMessage(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
  return `[${timestamp}] ${level}: ${message}${contextStr}`;
}

/**
 * Logger class with different log levels
 */
export class Logger {
  static error(message, context = {}) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, context));
    }
  }

  static warn(message, context = {}) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, context));
    }
  }

  static info(message, context = {}) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', message, context));
    }
  }

  static debug(message, context = {}) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage('DEBUG', message, context));
    }
  }
}

export default Logger;