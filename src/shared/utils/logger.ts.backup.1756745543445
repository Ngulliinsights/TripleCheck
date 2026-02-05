/**
 * Centralized logging utility that respects ESLint preferences
 * Only logs in development environment and can be easily disabled
 */

interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

const createLogger = (): Logger => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const canLog = typeof window !== 'undefined' && window.console && isDevelopment;

  return {
    info: (message: string, ...args: unknown[]): void => {
      if (canLog) {
        // eslint-disable-next-line no-console
        window.console.log(`ℹ️ ${message}`, ...args);
      }
    },
    warn: (message: string, ...args: unknown[]): void => {
      if (canLog) {
        // eslint-disable-next-line no-console
        window.console.warn(`⚠️ ${message}`, ...args);
      }
    },
    error: (message: string, ...args: unknown[]): void => {
      if (canLog) {
        // eslint-disable-next-line no-console
        window.console.error(`❌ ${message}`, ...args);
      }
    },
  };
};

export const logger = createLogger();