/**
 * Error Handling Service
 * Centralized error handling, logging, and recovery
 */

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorReports: ErrorReport[] = [];
  private errorCallbacks: Map<string, (error: ErrorReport) => void> = new Map();

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Log an error with context
   */
  logError(error: Error, context: ErrorContext = {}, severity: ErrorReport['severity'] = 'medium'): string {
    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date(),
      severity,
      resolved: false
    };

    this.errorReports.push(errorReport);

    // Keep only last 100 errors in memory
    if (this.errorReports.length > 100) {
      this.errorReports = this.errorReports.slice(-100);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorReport);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorReport);
    }

    // Notify error callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorReport);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    return errorReport.id;
  }

  /**
   * Register error callback
   */
  onError(id: string, callback: (error: ErrorReport) => void): void {
    this.errorCallbacks.set(id, callback);
  }

  /**
   * Unregister error callback
   */
  offError(id: string): void {
    this.errorCallbacks.delete(id);
  }

  /**
   * Get error reports
   */
  getErrorReports(filter?: { severity?: ErrorReport['severity']; resolved?: boolean }): ErrorReport[] {
    let reports = [...this.errorReports];

    if (filter?.severity) {
      reports = reports.filter(r => r.severity === filter.severity);
    }

    if (filter?.resolved !== undefined) {
      reports = reports.filter(r => r.resolved === filter.resolved);
    }

    return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): void {
    const error = this.errorReports.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
    }
  }

  /**
   * Clear all error reports
   */
  clearErrors(): void {
    this.errorReports = [];
  }

  /**
   * Send error to monitoring service
   */
  private sendToMonitoringService(errorReport: ErrorReport): void {
    // In a real application, send to services like Sentry, LogRocket, etc.
    try {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      }).catch(err => {
        console.error('Failed to send error to monitoring service:', err);
      });
    } catch (err) {
      console.error('Failed to send error to monitoring service:', err);
    }
  }

  /**
   * Handle unhandled promise rejections
   */
  setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { component: 'global', action: 'unhandledrejection' },
        'high'
      );
    });

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError(
        new Error(event.message),
        {
          component: 'global',
          action: 'javascript_error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        },
        'high'
      );
    });
  }

  /**
   * Create error handler for specific component
   */
  createComponentErrorHandler(componentName: string) {
    return (error: Error, action?: string, metadata?: Record<string, any>) => {
      return this.logError(
        error,
        {
          component: componentName,
          action,
          metadata
        },
        'medium'
      );
    };
  }

  /**
   * Create API error handler
   */
  createApiErrorHandler(endpoint: string) {
    return (error: any, method: string = 'GET') => {
      const apiError = new Error(
        error.response?.data?.message || 
        error.message || 
        'API request failed'
      );

      return this.logError(
        apiError,
        {
          component: 'api',
          action: `${method} ${endpoint}`,
          metadata: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
          }
        },
        error.response?.status >= 500 ? 'high' : 'medium'
      );
    };
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();

// Setup global error handlers
errorHandlingService.setupGlobalErrorHandlers();

export default errorHandlingService;